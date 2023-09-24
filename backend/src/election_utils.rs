use entity::election::Model as Election;

use crate::errors::AppError;

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
