use axum_sessions::SessionHandle;
use entity::admin;
use sea_orm::{DatabaseConnection, EntityTrait};

use entity::election::Model as Election;

use crate::{dtos::AuthDto, errors::AppError, services::fenix::OAuthResponse};

pub async fn get_user(session_handle: &SessionHandle) -> Result<AuthDto, AppError> {
    let session = session_handle.read().await;

    let user: AuthDto = session.get("user").ok_or(AppError::Unauthorized)?;
    Ok(user)
}

pub async fn get_user_tokens(session_handle: &SessionHandle) -> Result<OAuthResponse, AppError> {
    let session = session_handle.read().await;

    let tokens: OAuthResponse = session.get("oauth_tokens").ok_or(AppError::Unauthorized)?;
    Ok(tokens)
}

pub async fn get_admin(
    session_handle: &SessionHandle,
    conn: &DatabaseConnection,
) -> Result<AuthDto, AppError> {
    let user = get_user(session_handle).await?;

    if is_admin(&user.username, conn).await? {
        Ok(user)
    } else {
        Err(AppError::Unauthorized)
    }
}

pub async fn is_admin(username: &str, conn: &DatabaseConnection) -> Result<bool, AppError> {
    Ok(admin::Entity::find_by_id(username)
        .one(conn)
        .await?
        .is_some())
}

pub fn can_vote_on_election(user: &AuthDto, election: &Election) -> bool {
    user.degree_entries.iter().any(|entry| {
        entry.degree_id == election.degree_id
            && election
                .curricular_year
                .map(|year| year == entry.curricular_year as i32)
                .unwrap_or(true)
    })
}
