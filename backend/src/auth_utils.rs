use axum_sessions::SessionHandle;
use entity::admin;
use sea_orm::{DatabaseConnection, EntityTrait};

use crate::{errors::AppError, services::fenix::AuthDto};

pub async fn get_user(session_handle: &SessionHandle) -> Result<String, AppError> {
    let session = session_handle.read().await;

    let user: AuthDto = session.get("user").ok_or(AppError::Unauthorized)?;

    Ok(user.username)
}

pub async fn get_admin(
    session_handle: &SessionHandle,
    conn: &DatabaseConnection,
) -> Result<String, AppError> {
    let username = get_user(session_handle).await?;

    admin::Entity::find_by_id(&username)
        .one(conn)
        .await?
        .ok_or(AppError::Unauthorized)?;

    Ok(username)
}
