use axum::{extract::Path, Extension, Json};
use axum_sessions::SessionHandle;

use entity::admin::{self, Entity as Admin};
use sea_orm::{prelude::*, DatabaseConnection, QueryOrder, Set};

use crate::{
    auth_utils,
    dtos::{AddAdminDto, AdminDto},
    errors::AppError,
};

pub async fn list_admins(
    Extension(ref session_handle): Extension<SessionHandle>,
    Extension(ref conn): Extension<DatabaseConnection>,
) -> Result<Json<Vec<AdminDto>>, AppError> {
    // assert admin only
    auth_utils::get_admin(session_handle, conn).await?;

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
    // assert admin only
    auth_utils::get_admin(session_handle, conn).await?;

    // validate username
    let username = admin_dto.username.trim();
    if username.is_empty() {
        return Err(AppError::BadInput("error.username.empty"));
    }

    let admin = Admin::find_by_id(username).one(conn).await?;
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
    Path(username): Path<String>,
    Extension(ref session_handle): Extension<SessionHandle>,
    Extension(ref conn): Extension<DatabaseConnection>,
) -> Result<(), AppError> {
    // assert admin only
    auth_utils::get_admin(session_handle, conn).await?;

    // validate username
    if username.is_empty() {
        return Err(AppError::BadInput("error.username.empty"));
    }

    let res = Admin::delete_by_id(username).exec(conn).await?;
    match res.rows_affected {
        0 => Err(AppError::UnknownAdmin),
        _ => Ok(()),
    }
}

pub async fn setup_first_admin(
    Extension(ref session_handle): Extension<SessionHandle>,
    Extension(ref conn): Extension<DatabaseConnection>,
) -> Result<(), AppError> {
    todo!()
}
