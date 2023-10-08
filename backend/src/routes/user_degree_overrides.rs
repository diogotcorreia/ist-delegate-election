use std::collections::HashMap;

use crate::{
    auth_utils::{self},
    dtos::{
        BulkAddUserDegreeOverrideDto, BulkDeleteUserDegreeOverrideDto, DegreeWithUserOverridesDto,
    },
    errors::AppError,
    services::fenix::FenixService,
};
use axum::{extract::State, http::StatusCode, Extension, Json};
use axum_sessions::SessionHandle;
use entity::user_degree_override::{self, Entity as UserDegreeOverride};
use migration::OnConflict;
use sea_orm::{prelude::*, ActiveValue, Condition, QueryOrder};

pub async fn bulk_add_user_degree_override(
    State(ref fenix_service): State<FenixService>,
    State(ref conn): State<DatabaseConnection>,
    Extension(ref session_handle): Extension<SessionHandle>,
    Json(override_dto): Json<BulkAddUserDegreeOverrideDto>,
) -> Result<StatusCode, AppError> {
    // assert admin only
    auth_utils::get_admin(session_handle, conn).await?;

    fenix_service
        .get_degree(&override_dto.degree_id)
        .await?
        .ok_or(AppError::InvalidDegree)?;
    let active_year = fenix_service.get_active_year().await?;

    let override_models: Vec<_> = override_dto
        .usernames
        .into_iter()
        .map(|username| user_degree_override::ActiveModel {
            username: ActiveValue::set(username),
            academic_year: ActiveValue::set(active_year.clone()),
            degree_id: ActiveValue::set(override_dto.degree_id.clone()),
            curricular_year: ActiveValue::set(override_dto.curricular_year.into()),
        })
        .collect();

    UserDegreeOverride::insert_many(override_models)
        .on_conflict(
            OnConflict::columns([
                user_degree_override::Column::Username,
                user_degree_override::Column::AcademicYear,
                user_degree_override::Column::DegreeId,
            ])
            .update_column(user_degree_override::Column::CurricularYear)
            .to_owned(),
        )
        .do_nothing()
        .exec(conn)
        .await?;

    Ok(StatusCode::NO_CONTENT)
}

pub async fn get_user_degree_overrides(
    State(ref fenix_service): State<FenixService>,
    State(ref conn): State<DatabaseConnection>,
    Extension(ref session_handle): Extension<SessionHandle>,
) -> Result<Json<Vec<DegreeWithUserOverridesDto>>, AppError> {
    // assert admin only
    auth_utils::get_admin(session_handle, conn).await?;

    let active_year = fenix_service.get_active_year().await?;

    let overrides = UserDegreeOverride::find()
        .filter(user_degree_override::Column::AcademicYear.eq(active_year))
        .order_by_asc(user_degree_override::Column::Username)
        .all(conn)
        .await?;

    let mut degree_overrides = HashMap::new();

    for override_model in overrides {
        degree_overrides
            .entry(override_model.degree_id.clone())
            .or_insert(DegreeWithUserOverridesDto {
                degree: fenix_service.get_degree(&override_model.degree_id).await?,
                users: Vec::new(),
            })
            .users
            .push(crate::dtos::UserDegreeOverrideDto {
                username: override_model.username,
                curricular_year: override_model
                    .curricular_year
                    .try_into()
                    .expect("curricular year to be a u8"),
            });
    }

    Ok(Json(degree_overrides.into_values().collect()))
}

pub async fn bulk_delete_user_degree_override(
    State(ref fenix_service): State<FenixService>,
    State(ref conn): State<DatabaseConnection>,
    Extension(ref session_handle): Extension<SessionHandle>,
    Json(override_dto): Json<BulkDeleteUserDegreeOverrideDto>,
) -> Result<StatusCode, AppError> {
    // assert admin only
    auth_utils::get_admin(session_handle, conn).await?;

    let active_year = fenix_service.get_active_year().await?;

    UserDegreeOverride::delete_many()
        .filter(
            Condition::all()
                .add(user_degree_override::Column::AcademicYear.eq(active_year))
                .add(user_degree_override::Column::DegreeId.eq(override_dto.degree_id))
                .add(user_degree_override::Column::Username.is_in(override_dto.usernames)),
        )
        .exec(conn)
        .await?;

    Ok(StatusCode::NO_CONTENT)
}
