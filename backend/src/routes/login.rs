use crate::{
    auth_utils::get_user,
    errors::AppError,
    services::fenix::{AuthDto, FenixService},
};
use axum::{
    extract::{Query, State},
    Extension, Json,
};
use axum_sessions::SessionHandle;
use serde::Deserialize;

#[derive(Deserialize)]
pub struct FenixLoginQuery {
    code: String,
}

pub async fn login(
    Query(code): Query<FenixLoginQuery>,
    State(ref fenix_service): State<FenixService>,
    Extension(ref session_handle): Extension<SessionHandle>,
) -> Result<Json<AuthDto>, AppError> {
    let (auth_details, oauth_tokens) = fenix_service
        .authenticate_from_code(&code.code)
        .await
        .expect("failed authenticate from code");

    let mut session = session_handle.write().await;
    session.insert("user", auth_details.clone())?;
    session.insert("oauth_tokens", oauth_tokens)?;

    Ok(Json(auth_details))
}

pub async fn whoami(
    Extension(ref session_handle): Extension<SessionHandle>,
) -> Result<Json<AuthDto>, AppError> {
    Ok(Json(get_user(session_handle).await?))
}
