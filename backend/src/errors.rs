use async_session::log::error;
use axum::{
    http::StatusCode,
    response::{IntoResponse, Response},
    Json,
};
use sea_orm::error::DbErr;
use serde::Serialize;

pub enum AppError {
    BadInput(&'static str),
    DuplicateAdmin,
    UnknownAdmin,
    Unauthorized,
    SessionSerializationError(async_session::serde_json::Error),
    DbError(DbErr),
}

#[derive(Serialize)]
struct JsonError {
    key: String,
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        let (status, key) = match self {
            AppError::BadInput(error) => (StatusCode::BAD_REQUEST, error),
            AppError::DuplicateAdmin => (StatusCode::CONFLICT, "error.duplicate.admin"),
            AppError::UnknownAdmin => (StatusCode::NOT_FOUND, "error.unknown.admin"),
            AppError::Unauthorized => (StatusCode::UNAUTHORIZED, "error.unauthorized"),
            AppError::SessionSerializationError(_) | AppError::DbError(_) => {
                (StatusCode::INTERNAL_SERVER_ERROR, "error.internal")
            }
        };

        let error = JsonError {
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
