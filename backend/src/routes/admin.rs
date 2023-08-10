use axum::{Extension, Json};
use axum_sessions::SessionHandle;

use entity::admin::{self, Entity as Admin};
use sea_orm::{prelude::*, DatabaseConnection, QueryOrder};

use crate::{dtos::AdminDto, errors::AppError};

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
) -> Result<(), AppError> {
    todo!()
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
