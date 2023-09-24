use axum::{
    extract::{Path, State},
    http::StatusCode,
    Extension, Json,
};
use axum_sessions::SessionHandle;
use entity::{
    election::{self, Entity as Election},
    election_vote::{self, Entity as ElectionVote},
    nomination::{self, Entity as Nomination},
    nomination_log::{self, Entity as NominationLog},
    vote_log::{self, Entity as VoteLog},
};
use futures::stream::{self, StreamExt};
use migration::OnConflict;
use sea_orm::{
    prelude::*, ActiveValue, Condition, DatabaseConnection, QueryOrder, Set, TransactionTrait,
};

use crate::{
    auth_utils, crypto_utils,
    dtos::{
        BulkCreateElectionsDto, CastVoteDto, ElectionDto, SignedPersonSearchResultDto,
        VoteOptionDto,
    },
    election_utils::{is_in_candidacy_period, is_in_voting_period},
    errors::AppError,
    services::fenix::FenixService,
};

pub async fn bulk_create_elections(
    Extension(ref session_handle): Extension<SessionHandle>,
    State(ref conn): State<DatabaseConnection>,
    State(ref fenix_service): State<FenixService>,
    Json(elections_dto): Json<BulkCreateElectionsDto>,
) -> Result<StatusCode, AppError> {
    // assert admin only
    auth_utils::get_admin(session_handle, conn).await?;

    if elections_dto.round <= 0 {
        return Err(AppError::InvalidRound);
    }
    if elections_dto.voting_period.start >= elections_dto.voting_period.end {
        return Err(AppError::InvalidDateRange);
    }
    if let Some(candidacy_period) = &elections_dto.candidacy_period {
        if candidacy_period.start >= candidacy_period.end {
            return Err(AppError::InvalidDateRange);
        }
        if candidacy_period.end >= elections_dto.voting_period.start {
            return Err(AppError::ElectionCandidacyAfterVoting);
        }
    }

    for degree in &elections_dto.degrees {
        fenix_service
            .get_degree(&degree.degree_id)
            .await?
            .ok_or(AppError::InvalidDegree)?;
    }

    let academic_year = fenix_service.get_active_year().await?;

    let txn = conn.begin().await?;

    let election_models: Vec<_> = elections_dto
        .degrees
        .into_iter()
        .map(|degree| election::ActiveModel {
            degree_id: Set(degree.degree_id),
            curricular_year: Set(degree.curricular_year),
            candidacy_period_start: Set(elections_dto
                .candidacy_period
                .as_ref()
                .map(|range| range.start.naive_utc())),
            candidacy_period_end: Set(elections_dto
                .candidacy_period
                .as_ref()
                .map(|range| range.end.naive_utc())),
            voting_period_start: Set(elections_dto.voting_period.start.naive_utc()),
            voting_period_end: Set(elections_dto.voting_period.end.naive_utc()),
            round: Set(elections_dto.round),
            academic_year: Set(academic_year.clone()),
            ..Default::default()
        })
        .collect();

    Election::insert_many(election_models)
        .exec(&txn)
        .await
        .map_err(|_| AppError::DuplicateElection)?;

    txn.commit().await?;

    Ok(StatusCode::NO_CONTENT)
}

pub async fn get_user_elections(
    Extension(ref session_handle): Extension<SessionHandle>,
    State(ref conn): State<DatabaseConnection>,
    State(ref fenix_service): State<FenixService>,
) -> Result<Json<Vec<ElectionDto>>, AppError> {
    let user = auth_utils::get_user(session_handle).await?;

    let txn = conn.begin().await?;

    let elections = Election::find()
        .filter(
            user.degree_entries
                .iter()
                .fold(Condition::any(), |acc, entry| {
                    acc.add(
                        Condition::all()
                            .add(election::Column::DegreeId.eq(&entry.degree_id))
                            .add(election::Column::CurricularYear.eq(entry.curricular_year)),
                    )
                    .add(
                        Condition::all()
                            .add(election::Column::DegreeId.eq(&entry.degree_id))
                            .add(election::Column::CurricularYear.is_null()),
                    )
                }),
        )
        .all(&txn)
        .await?;

    let nominations: Vec<i32> = NominationLog::find()
        .filter(nomination_log::Column::Nominator.eq(&user.username))
        .order_by_asc(nomination_log::Column::Election)
        .all(&txn)
        .await?
        .iter()
        .map(|model| model.election)
        .collect();
    let votes: Vec<i32> = VoteLog::find()
        .filter(vote_log::Column::Voter.eq(&user.username))
        .order_by_asc(vote_log::Column::Election)
        .all(&txn)
        .await?
        .iter()
        .map(|model| model.election)
        .collect();

    let dtos = stream::iter(elections)
        .then(|election| async {
            let election_id = election.id;
            ElectionDto::from_entity_for_user(
                election,
                fenix_service,
                nominations.binary_search(&election_id).is_ok(),
                votes.binary_search(&election_id).is_ok(),
            )
            .await
        })
        .collect::<Vec<_>>()
        .await
        .into_iter()
        .collect::<Result<_, _>>()?;

    Ok(Json(dtos))
}

pub async fn self_nominate(
    Path(election_id): Path<i32>,
    Extension(ref session_handle): Extension<SessionHandle>,
    State(ref conn): State<DatabaseConnection>,
) -> Result<StatusCode, AppError> {
    let user = auth_utils::get_user(session_handle).await?;

    let txn = conn.begin().await?;

    let election = Election::find_by_id(election_id)
        .one(&txn)
        .await?
        .ok_or(AppError::UnknownElection)?;
    auth_utils::can_vote_on_election(&user, &election)?;
    is_in_candidacy_period(&election)?;

    let nomination_log = nomination_log::ActiveModel {
        election: ActiveValue::set(election_id),
        nominator: ActiveValue::set(user.username.clone()),
    };
    nomination_log
        .insert(&txn)
        .await
        .map_err(|_| AppError::DuplicateNomination)?;

    let nomination = nomination::ActiveModel {
        election: ActiveValue::set(election_id),
        username: ActiveValue::set(user.username),
        display_name: ActiveValue::set(user.display_name),
        valid: ActiveValue::set(true),
    };

    Nomination::insert(nomination)
        .on_conflict(
            OnConflict::columns([nomination::Column::Election, nomination::Column::Username])
                .update_column(nomination::Column::Valid)
                .to_owned(),
        )
        .exec(&txn)
        .await?;

    txn.commit().await?;

    Ok(StatusCode::NO_CONTENT)
}

pub async fn nominate_others(
    Path(election_id): Path<i32>,
    Extension(ref session_handle): Extension<SessionHandle>,
    State(ref conn): State<DatabaseConnection>,
    State(ref signing_key): State<[u8; 64]>,
    Json(nomination_dto): Json<SignedPersonSearchResultDto>,
) -> Result<StatusCode, AppError> {
    let user = auth_utils::get_user(session_handle).await?;

    let txn = conn.begin().await?;

    let election = Election::find_by_id(election_id)
        .one(&txn)
        .await?
        .ok_or(AppError::UnknownElection)?;
    auth_utils::can_vote_on_election(&user, &election)?;
    is_in_candidacy_period(&election)?;

    crypto_utils::validate_person_search_result(election_id, &nomination_dto, signing_key)?;

    let nomination_log = nomination_log::ActiveModel {
        election: ActiveValue::set(election_id),
        nominator: ActiveValue::set(user.username.clone()),
    };
    nomination_log
        .insert(&txn)
        .await
        .map_err(|_| AppError::DuplicateNomination)?;

    let nomination = nomination::ActiveModel {
        election: ActiveValue::set(election_id),
        valid: ActiveValue::set(nomination_dto.username == user.username),
        username: ActiveValue::set(nomination_dto.username),
        display_name: ActiveValue::set(nomination_dto.display_name),
    };

    Nomination::insert(nomination)
        .on_conflict(
            OnConflict::columns([nomination::Column::Election, nomination::Column::Username])
                .update_column(nomination::Column::Valid)
                .action_and_where(Expr::col((Nomination, nomination::Column::Valid)).eq(false))
                .to_owned(),
        )
        .do_nothing()
        .exec(&txn)
        .await?;

    txn.commit().await?;

    Ok(StatusCode::NO_CONTENT)
}

pub async fn get_vote_options(
    Path(election_id): Path<i32>,
    Extension(ref session_handle): Extension<SessionHandle>,
    State(ref conn): State<DatabaseConnection>,
) -> Result<Json<Vec<VoteOptionDto>>, AppError> {
    let user = auth_utils::get_user(session_handle).await?;

    let txn = conn
        .begin_with_config(None, Some(sea_orm::AccessMode::ReadOnly))
        .await?;

    let election = Election::find_by_id(election_id)
        .one(&txn)
        .await?
        .ok_or(AppError::UnknownElection)?;
    auth_utils::can_vote_on_election(&user, &election)?;
    is_in_voting_period(&election)?;

    let nominations = Nomination::find()
        .filter(nomination::Column::Election.eq(election_id))
        .all(&txn)
        .await?;

    let vote_options = nominations
        .into_iter()
        .map(|nomination| {
            // don't show options if not all nominations have been verified
            nomination
                .valid
                .then_some(VoteOptionDto {
                    username: nomination.username,
                    display_name: nomination.display_name,
                })
                .ok_or(AppError::ElectionWithUnverifedNomination)
        })
        .collect::<Result<Vec<_>, _>>()?;

    Ok(Json(vote_options))
}

pub async fn cast_vote(
    Path(election_id): Path<i32>,
    Extension(ref session_handle): Extension<SessionHandle>,
    State(ref conn): State<DatabaseConnection>,
    Json(vote_dto): Json<CastVoteDto>,
) -> Result<StatusCode, AppError> {
    let user = auth_utils::get_user(session_handle).await?;

    let txn = conn.begin().await?;

    let election = Election::find_by_id(election_id)
        .one(&txn)
        .await?
        .ok_or(AppError::UnknownElection)?;
    auth_utils::can_vote_on_election(&user, &election)?;
    is_in_voting_period(&election)?;

    // don't allow voting if not all nominations have been verified
    if Nomination::find()
        .filter(
            Condition::all()
                .add(nomination::Column::Election.eq(election_id))
                .add(nomination::Column::Valid.eq(false)),
        )
        .count(&txn)
        .await?
        > 0
    {
        return Err(AppError::ElectionWithUnverifedNomination);
    }

    let vote_log = vote_log::ActiveModel {
        election: ActiveValue::set(election_id),
        voter: ActiveValue::set(user.username),
    };
    vote_log
        .insert(&txn)
        .await
        .map_err(|_| AppError::DuplicateVote)?;

    if let Some(vote_username) = vote_dto.username {
        if Nomination::find()
            .filter(
                Condition::all()
                    .add(nomination::Column::Election.eq(election_id))
                    .add(nomination::Column::Username.eq(&vote_username)),
            )
            .count(&txn)
            .await?
            == 0
        {
            return Err(AppError::UnknownVoteOption);
        }

        let vote_count = ElectionVote::find_by_id((election_id, vote_username.clone()))
            .one(&txn)
            .await?
            .map(|v| v.count)
            .unwrap_or(0);

        let vote = election_vote::ActiveModel {
            election: ActiveValue::set(election_id),
            nomination_username: ActiveValue::set(vote_username),
            count: ActiveValue::set(vote_count + 1),
        };

        ElectionVote::insert(vote)
            .on_conflict(
                OnConflict::columns([
                    election_vote::Column::Election,
                    election_vote::Column::NominationUsername,
                ])
                .update_column(election_vote::Column::Count)
                .to_owned(),
            )
            .exec(&txn)
            .await?;
    }

    txn.commit().await?;

    Ok(StatusCode::NO_CONTENT)
}
