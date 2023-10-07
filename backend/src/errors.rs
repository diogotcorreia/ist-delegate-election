use async_session::log::error;
use axum::{
    http::StatusCode,
    response::{IntoResponse, Response},
    Json,
};
use sea_orm::error::DbErr;

use crate::dtos::AppErrorDto;

pub enum AppError {
    BadInput(&'static str),
    DuplicateAdmin,
    UnknownAdmin,
    NotEnoughAdmins,
    UnknownElection,
    InvalidDateRange,
    ElectionCandidacyAfterVoting,
    ElectionWithUnverifiedNomination,
    UnknownVoteOption,
    DuplicateVote,
    DuplicateNomination,
    DuplicateElection,
    InvalidRound,
    InvalidDegree,
    OutsideCandidacyPeriod,
    OutsideVotingPeriod,
    ElectionUnauthorized,
    InvalidPersonSignature,
    UnknownNomination,
    Unauthorized,
    FenixError,
    SessionSerializationError(async_session::serde_json::Error),
    DbError(DbErr),
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        let (status, key) = match self {
            AppError::BadInput(error) => (StatusCode::BAD_REQUEST, error),
            AppError::DuplicateAdmin => (StatusCode::CONFLICT, "error.duplicate.admin"),
            AppError::UnknownAdmin => (StatusCode::NOT_FOUND, "error.unknown.admin"),
            AppError::NotEnoughAdmins => (StatusCode::NOT_FOUND, "error.not.enough.admins"),
            AppError::UnknownElection => (StatusCode::NOT_FOUND, "error.unknown.election"),
            AppError::InvalidDateRange => (StatusCode::BAD_REQUEST, "error.daterange.invalid"),
            AppError::ElectionCandidacyAfterVoting => (
                StatusCode::BAD_REQUEST,
                "error.election.candidacy-after-voting",
            ),
            AppError::ElectionWithUnverifiedNomination => {
                (StatusCode::CONFLICT, "error.election.unverified-nomination")
            }
            AppError::UnknownVoteOption => (
                StatusCode::BAD_REQUEST,
                "error.election.unknown-vote-option",
            ),
            AppError::DuplicateVote => (StatusCode::FORBIDDEN, "error.election.duplicate-vote"),
            AppError::DuplicateNomination => {
                (StatusCode::FORBIDDEN, "error.election.duplicate-nomination")
            }
            AppError::DuplicateElection => (StatusCode::CONFLICT, "error.duplicate.election"),
            AppError::InvalidRound => (StatusCode::CONFLICT, "error.round.invalid"),
            AppError::InvalidDegree => (StatusCode::CONFLICT, "error.degree.invalid"),
            AppError::OutsideCandidacyPeriod => (
                StatusCode::FORBIDDEN,
                "error.election.candidacy.outside-period",
            ),
            AppError::OutsideVotingPeriod => (
                StatusCode::FORBIDDEN,
                "error.election.voting.outside-period",
            ),
            AppError::ElectionUnauthorized => {
                (StatusCode::FORBIDDEN, "error.election.unauthorized")
            }
            AppError::InvalidPersonSignature => {
                (StatusCode::UNAUTHORIZED, "error.person-signature.invalid")
            }
            AppError::UnknownNomination => (StatusCode::NOT_FOUND, "error.unknown.nomination"),
            AppError::Unauthorized => (StatusCode::UNAUTHORIZED, "error.unauthorized"),
            AppError::FenixError => (StatusCode::BAD_GATEWAY, "error.fenix"),
            AppError::SessionSerializationError(_) | AppError::DbError(_) => {
                (StatusCode::INTERNAL_SERVER_ERROR, "error.internal")
            }
        };

        let error = AppErrorDto {
            key: key.to_string(),
        };

        (status, Json(error)).into_response()
    }
}

impl From<async_session::serde_json::Error> for AppError {
    fn from(inner: async_session::serde_json::Error) -> Self {
        Self::SessionSerializationError(inner)
    }
}

impl From<DbErr> for AppError {
    fn from(inner: DbErr) -> Self {
        error!("{}", inner);
        Self::DbError(inner)
    }
}
