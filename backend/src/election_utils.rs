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
