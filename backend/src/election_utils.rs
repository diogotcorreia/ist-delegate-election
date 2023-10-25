use entity::{
    election::{self, Entity as Election},
    election_vote::{self, Entity as ElectionVote},
    nomination::{self, Entity as Nomination},
    vote_log::{self, Entity as VoteLog},
};
use migration::{Alias, OnConflict, Query, SimpleExpr};
use sea_orm::{
    prelude::*, Condition, DatabaseConnection, EntityTrait, FromQueryResult, JoinType, QueryOrder,
    QuerySelect, TransactionTrait,
};
use serde::Serialize;

use crate::{
    dtos::{DegreeEntryDto, UserDto},
    errors::AppError,
    services::fenix::FenixService,
};

pub fn is_in_candidacy_period(election: &election::Model) -> Result<(), AppError> {
    let now = chrono::Utc::now();
    match (
        election.candidacy_period_start,
        election.candidacy_period_end,
    ) {
        (Some(start), Some(end)) => now >= start.and_utc() && now <= end.and_utc(),
        _ => false,
    }
    .then_some(())
    .ok_or(AppError::OutsideCandidacyPeriod)
}

pub fn is_in_voting_period(election: &election::Model) -> Result<(), AppError> {
    let now = chrono::Utc::now();

    let start = election.voting_period_start;
    let end = election.voting_period_end;
    (now >= start.and_utc() && now <= end.and_utc())
        .then_some(())
        .ok_or(AppError::OutsideVotingPeriod)
}

/// Get a condition to use in SeaSQL queries that restricts the query
/// to only the elections a user should have access to.
pub fn get_user_in_election_condition<'a, I>(degree_entries: I) -> Condition
where
    I: Iterator<Item = &'a DegreeEntryDto>,
{
    degree_entries.fold(Condition::any(), |acc, entry| {
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
    })
}

pub async fn validate_nominations_of_user(
    user: &UserDto,
    conn: &DatabaseConnection,
    active_year: &String,
) -> Result<(), AppError> {
    if user.degree_entries.is_empty() {
        return Ok(());
    }

    Nomination::update_many()
        .col_expr(nomination::Column::Valid, Expr::value(Some(true)))
        .filter(
            Condition::all()
                .add(nomination::Column::Valid.is_null())
                .add(nomination::Column::Username.eq(&user.username))
                .add(Expr::exists(
                    Query::select()
                        .column(election::Column::Id)
                        .from(Election)
                        .cond_where(
                            Condition::all()
                                .add(
                                    nomination::Column::Election
                                        .into_expr()
                                        .eq(election::Column::Id.into_expr()),
                                )
                                .add(election::Column::AcademicYear.eq(active_year))
                                .add(get_user_in_election_condition(
                                    user.degree_entries
                                        .iter()
                                        .filter(|entry| entry.nomination_elegible),
                                )),
                        )
                        .take(),
                )),
        )
        .exec(conn)
        .await?;

    Ok(())
}

/// Get an OnConflict resolution rules when upserting a nomination.
/// This updates the "valid" column if it is pending validation, but
/// leaves it untouched otherwise.
pub fn get_nomination_upsert_on_conflict() -> OnConflict {
    OnConflict::columns([nomination::Column::Election, nomination::Column::Username])
        .update_column(nomination::Column::Valid)
        .action_and_where(Expr::col((Nomination, nomination::Column::Valid)).is_null())
        .to_owned()
}

#[derive(FromQueryResult, Serialize)]
struct ElectionAllResults {
    #[serde(rename = "election_id")]
    id: i32,
    round: i32,
    #[serde(rename = "degree")]
    degree_id: String,
    curricular_year: Option<i32>,
    username: String,
    display_name: String,
    vote_count: i32,
}

#[derive(FromQueryResult)]
struct ElectionBlankVotes {
    id: i32,
    round: i32,
    degree_id: String,
    curricular_year: Option<i32>,
    total_votes: i64,
    non_blank_votes: Option<i32>,
}

pub async fn get_all_results_as_csv(
    conn: &DatabaseConnection,
    fenix_service: &FenixService,
) -> Result<String, AppError> {
    let active_year = fenix_service.get_active_year().await?;

    let now = chrono::Utc::now().naive_utc();

    let txn = conn
        .begin_with_config(None, Some(sea_orm::AccessMode::ReadOnly))
        .await?;

    let mut all_results: Vec<ElectionAllResults> = Election::find()
        .select_only()
        .columns([
            election::Column::Id,
            election::Column::Round,
            election::Column::DegreeId,
            election::Column::CurricularYear,
        ])
        .columns([
            nomination::Column::Username,
            nomination::Column::DisplayName,
        ])
        .column_as(election_vote::Column::Count, "vote_count")
        .join(JoinType::InnerJoin, election::Relation::Nomination.def())
        .join(
            JoinType::InnerJoin,
            nomination::Relation::ElectionVote.def(),
        )
        .filter(
            Condition::all()
                .add(election::Column::AcademicYear.eq(active_year.clone()))
                .add(election::Column::VotingPeriodEnd.lt(now))
                .add(nomination::Column::Valid.eq(Some(true))),
        )
        .order_by_asc(election::Column::Round)
        .order_by_asc(election::Column::DegreeId)
        .order_by_asc(election_vote::Column::Count)
        .into_model::<ElectionAllResults>()
        .all(&txn)
        .await?;

    // get blank votes
    let blank_votes = Election::find()
        .select_only()
        .columns([
            election::Column::Id,
            election::Column::Round,
            election::Column::DegreeId,
            election::Column::CurricularYear,
        ])
        .expr_as(
            SimpleExpr::SubQuery(
                None,
                Box::new(
                    Query::select()
                        .from(VoteLog)
                        .expr_as(vote_log::Column::Voter.count(), Alias::new("total_votes"))
                        .cond_where(
                            vote_log::Column::Election
                                .into_expr()
                                .eq(election::Column::Id.into_expr()),
                        )
                        .to_owned()
                        .into_sub_query_statement(),
                ),
            ),
            "total_votes",
        )
        .expr_as(
            SimpleExpr::SubQuery(
                None,
                Box::new(
                    Query::select()
                        .from(ElectionVote)
                        .expr_as(
                            election_vote::Column::Count
                                .sum()
                                .cast_as(Alias::new("integer")),
                            Alias::new("votes_count"),
                        )
                        .cond_where(
                            election_vote::Column::Election
                                .into_expr()
                                .eq(election::Column::Id.into_expr()),
                        )
                        .to_owned()
                        .into_sub_query_statement(),
                ),
            ),
            "non_blank_votes",
        )
        .to_owned()
        .filter(
            Condition::all()
                .add(election::Column::AcademicYear.eq(active_year))
                .add(election::Column::VotingPeriodEnd.lt(now)),
        )
        .order_by_asc(election::Column::Round)
        .order_by_asc(election::Column::DegreeId)
        .into_model::<ElectionBlankVotes>()
        .all(&txn)
        .await?;

    txn.commit().await?;

    // insert blank vote counts at the end (stable sort will put them in the correct place
    // afterwards)
    for election in blank_votes {
        let blank_vote_count = election.total_votes as i32 - election.non_blank_votes.unwrap_or(0);
        all_results.push(ElectionAllResults {
            id: election.id,
            round: election.round,
            degree_id: election.degree_id,
            curricular_year: election.curricular_year,
            username: "blank".to_owned(),
            display_name: "".to_owned(),
            vote_count: blank_vote_count,
        })
    }

    // replace degree id with acronym
    for result in &mut all_results {
        result.degree_id = fenix_service
            .get_degree(&result.degree_id)
            .await?
            .map(|degree| degree.acronym)
            .unwrap_or("unknown".to_owned());
    }

    // sort by round, degree, curricular year
    all_results.sort_by_key(|row| {
        (
            row.round,
            row.degree_id.clone(),
            row.curricular_year.unwrap_or(0),
        )
    });

    let mut wtr = csv::Writer::from_writer(vec![]);
    for result in all_results {
        wtr.serialize(result)?;
    }

    wtr.flush()?;

    String::from_utf8(wtr.into_inner().map_err(|_| AppError::CsvError(None))?)
        .map_err(|_| AppError::CsvError(None))
}
