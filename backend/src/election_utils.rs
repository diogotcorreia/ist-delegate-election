use entity::{
    election::{self, Model as Election},
    nomination::{self, Entity as Nomination},
};
use migration::{OnConflict, Query};
use sea_orm::{prelude::*, Condition, DatabaseConnection, EntityTrait};

use crate::{
    dtos::{DegreeEntryDto, UserDto},
    errors::AppError,
};

pub fn is_in_candidacy_period(election: &Election) -> Result<(), AppError> {
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

pub fn is_in_voting_period(election: &Election) -> Result<(), AppError> {
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
                        .from(election::Entity)
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
