use axum::{extract, Extension, Json};
use axum_sessions::SessionHandle;

use entity::admin::{self, Entity as Admin};
use sea_orm::{prelude::*, DatabaseConnection, QueryOrder, Set};

use crate::{
    dtos::{AddAdminDto, AdminDto},
    errors::AppError,
};

pub async fn list_admins(
    Extension(ref session_handle): Extension<SessionHandle>,
    Extension(ref conn): Extension<DatabaseConnection>,
) -> Result<Json<Vec<AdminDto>>, AppError> {
    // TODO check permissions

    let admins = Admin::find()
        .order_by_asc(admin::Column::DateAdded)
        .all(conn)
        .await?
        .into_iter()
        .map(AdminDto::from_entity)
        .collect::<Result<_, _>>()?;

    Ok(Json(admins))
}

pub async fn add_admin(
    Extension(ref session_handle): Extension<SessionHandle>,
    Extension(ref conn): Extension<DatabaseConnection>,
    Json(admin_dto): Json<AddAdminDto>,
) -> Result<(), AppError> {
    // TODO check permissions

    // validate username
    let username = admin_dto.username.trim();
    if username.is_empty() {
        return Err(AppError::BadInput("error.username.empty"));
    }

    let admin = Admin::find_by_id(username)
        .one(conn)
        .await?;
    if admin.is_some() {
        return Err(AppError::DuplicateAdmin);
    }

    let now = chrono::offset::Utc::now().naive_utc();

    let admin = admin::ActiveModel {
        username: Set(username.to_string()),
        date_added: Set(now),
    };
    admin.insert(conn).await?;

    Ok(())
}

pub async fn remove_admin(
    Extension(ref session_handle): Extension<SessionHandle>,
    Extension(ref conn): Extension<DatabaseConnection>,
) -> Result<(), AppError> {
    todo!()
}

pub async fn setup_first_admin(
    Extension(ref session_handle): Extension<SessionHandle>,
    Extension(ref conn): Extension<DatabaseConnection>,
) -> Result<(), AppError> {
    todo!()
}
