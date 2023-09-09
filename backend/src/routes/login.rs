use crate::{
    auth_utils::get_user,
    dtos::{AuthDto, LoginDto},
    errors::AppError,
    services::fenix::FenixService,
};
use axum::{extract::State, Extension, Json};
use axum_sessions::SessionHandle;

pub async fn login(
    State(ref fenix_service): State<FenixService>,
    Extension(ref session_handle): Extension<SessionHandle>,
    Json(login_dto): Json<LoginDto>,
) -> Result<Json<AuthDto>, AppError> {
    let (auth_details, oauth_tokens) = fenix_service
        .authenticate_from_code(&login_dto.code)
        .await
        .map_err(|_| AppError::Unauthorized)?;

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
