use axum::{
    http::StatusCode,
    response::{IntoResponse, Response},
    Json,
};
use serde::Serialize;

pub enum AppError {
    Unauthorized,
    SessionSerializationError(async_session::serde_json::Error),
}

#[derive(Serialize)]
struct JsonError {
    key: String,
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        let (status, key) = match self {
            AppError::Unauthorized => (StatusCode::UNAUTHORIZED, "error.unauthorized"),
            AppError::SessionSerializationError(_) => {
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
        AppError::SessionSerializationError(inner)
    }
}
