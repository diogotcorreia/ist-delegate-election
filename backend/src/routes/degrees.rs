use axum::{extract::State, Extension, Json};
use axum_sessions::SessionHandle;

use entity::election::{self, Entity as Election};
use sea_orm::{prelude::*, DatabaseConnection};

use futures::stream::{self, StreamExt};

use crate::{
    auth_utils,
    dtos::{DegreeDto, DegreeElectionsDto, ElectionDto},
    errors::AppError,
    services::fenix::FenixService,
};

pub async fn list_degrees(
    Extension(ref session_handle): Extension<SessionHandle>,
    State(ref conn): State<DatabaseConnection>,
    State(ref fenix_service): State<FenixService>,
) -> Result<Json<Vec<DegreeDto>>, AppError> {
    // assert admin only
    auth_utils::get_admin(session_handle, conn).await?;

    let degrees = fenix_service.get_degrees().await?.collect();

    Ok(Json(degrees))
}

pub async fn list_degrees_with_elections(
    Extension(ref session_handle): Extension<SessionHandle>,
    State(ref conn): State<DatabaseConnection>,
    State(ref fenix_service): State<FenixService>,
) -> Result<Json<Vec<DegreeElectionsDto>>, AppError> {
    // assert admin only
    auth_utils::get_admin(session_handle, conn).await?;

    let degrees = fenix_service.get_degrees().await?;
    let active_year = fenix_service.get_active_year().await?;

    let degrees_with_elections = stream::iter(degrees.into_iter())
        .then(|degree| async {
            Ok(DegreeElectionsDto {
                elections: Election::find()
                    .filter(election::Column::DegreeId.eq(degree.id.clone()))
                    .filter(election::Column::AcademicYear.eq(active_year.clone()))
                    .all(conn)
                    .await?
                    .into_iter()
                    .map(ElectionDto::from_entity)
                    .collect::<Result<_, _>>()?,
                degree,
            })
        })
        .collect::<Vec<_>>()
        .await
        .into_iter()
        .collect::<Result<_, AppError>>()?;

    Ok(Json(degrees_with_elections))
}
