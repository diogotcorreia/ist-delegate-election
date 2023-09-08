use crate::{dtos::AppConfigDto, errors::AppError, services::fenix::FenixService};
use axum::{extract::State, Json};

use entity::admin::Entity as Admin;
use sea_orm::{prelude::*, DatabaseConnection};

pub async fn get_config(
    State(ref fenix_service): State<FenixService>,
    State(ref conn): State<DatabaseConnection>,
) -> Result<Json<AppConfigDto>, AppError> {
    let fenix_config = fenix_service.to_dto();

    let is_setup = Admin::find().count(conn).await? > 0;

    Ok(Json(AppConfigDto {
        fenix: fenix_config,
        is_setup,
    }))
}
