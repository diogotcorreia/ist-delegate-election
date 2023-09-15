use axum::{extract::State, http::StatusCode, Extension, Json};
use axum_sessions::SessionHandle;

use entity::election::{self, Entity as Election};
use sea_orm::{prelude::*, DatabaseConnection, Set, TransactionTrait};

use crate::{
    auth_utils, dtos::BulkCreateElectionsDto, errors::AppError, services::fenix::FenixService,
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
