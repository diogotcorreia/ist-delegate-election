use axum::{
    extract::{Path, State},
    http::StatusCode,
    Extension, Json,
};
use axum_sessions::SessionHandle;

use entity::admin::{self, Entity as Admin};
use sea_orm::{prelude::*, DatabaseConnection, QueryOrder, Set, TransactionTrait};

use crate::{
    auth_utils,
    dtos::{AddAdminDto, AdminDto},
    errors::AppError,
};

pub async fn list_admins(
    Extension(ref session_handle): Extension<SessionHandle>,
    State(ref conn): State<DatabaseConnection>,
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
    State(ref conn): State<DatabaseConnection>,
    Json(admin_dto): Json<AddAdminDto>,
) -> Result<StatusCode, AppError> {
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

    Ok(StatusCode::NO_CONTENT)
}

pub async fn remove_admin(
    Path(username): Path<String>,
    Extension(ref session_handle): Extension<SessionHandle>,
    State(ref conn): State<DatabaseConnection>,
) -> Result<StatusCode, AppError> {
    // assert admin only
    auth_utils::get_admin(session_handle, conn).await?;

    // validate username
    if username.is_empty() {
        return Err(AppError::BadInput("error.username.empty"));
    }

    let txn = conn.begin().await?;

    let count = Admin::find().count(&txn).await?;
    if count <= 1 {
        return Err(AppError::NotEnoughAdmins);
    }

    let res = Admin::delete_by_id(username).exec(&txn).await?;
    txn.commit().await?;
    match res.rows_affected {
        0 => Err(AppError::UnknownAdmin),
        _ => Ok(StatusCode::NO_CONTENT),
    }
}

pub async fn setup_first_admin(
    Extension(ref session_handle): Extension<SessionHandle>,
    State(ref conn): State<DatabaseConnection>,
) -> Result<StatusCode, AppError> {
    // assert logged in
    let user = auth_utils::get_user(session_handle).await?;

    let txn = conn.begin().await?;

    let count = Admin::find().count(&txn).await?;
    if count != 0 {
        return Err(AppError::Forbidden);
    }

    let now = chrono::offset::Utc::now().naive_utc();

    let admin = admin::ActiveModel {
        username: Set(user.username.to_string()),
        date_added: Set(now),
    };
    admin.insert(&txn).await?;

    txn.commit().await?;
    Ok(StatusCode::NO_CONTENT)
}
