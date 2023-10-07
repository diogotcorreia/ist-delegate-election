use crate::{
    auth_utils::{self, get_user},
    dtos::{AuthDto, LoginDto},
    election_utils::validate_nominations_of_user,
    errors::AppError,
    services::fenix::FenixService,
};
use axum::{extract::State, http::StatusCode, Extension, Json};
use axum_sessions::SessionHandle;
use sea_orm::DatabaseConnection;

pub async fn login(
    State(ref fenix_service): State<FenixService>,
    State(ref conn): State<DatabaseConnection>,
    Extension(ref session_handle): Extension<SessionHandle>,
    Json(login_dto): Json<LoginDto>,
) -> Result<Json<AuthDto>, AppError> {
    let (user_details, oauth_tokens) = fenix_service
        .authenticate_from_code(&login_dto.code)
        .await?;

    let active_year = fenix_service.get_active_year().await?;
    validate_nominations_of_user(&user_details, conn, &active_year).await?;

    let mut session = session_handle.write().await;
    session.insert("user", &user_details)?;
    session.insert("oauth_tokens", &oauth_tokens)?;

    let auth_details = AuthDto {
        is_admin: auth_utils::is_admin(&user_details.username, conn).await?,
        user: user_details,
    };

    Ok(Json(auth_details))
}

pub async fn whoami(
    State(ref conn): State<DatabaseConnection>,
    Extension(ref session_handle): Extension<SessionHandle>,
) -> Result<Json<AuthDto>, AppError> {
    let user = get_user(session_handle).await?;

    let auth_details = AuthDto {
        is_admin: auth_utils::is_admin(&user.username, conn).await?,
        user,
    };
    Ok(Json(auth_details))
}

pub async fn logout(
    Extension(ref session_handle): Extension<SessionHandle>,
) -> Result<StatusCode, AppError> {
    let mut session = session_handle.write().await;
    session.destroy();

    Ok(StatusCode::NO_CONTENT)
}
