use entity::election::{Model as Election};

pub fn is_in_candidacy_period(election: &Election) -> bool {
    let now = chrono::Utc::now();
    match (election.candidacy_period_start, election.candidacy_period_end) {
        (Some(start), Some(end)) => now >= start.and_utc() && now <= end.and_utc(),
        _ => false
    }
}
