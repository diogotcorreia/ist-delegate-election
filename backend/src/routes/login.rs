use crate::services::fenix::{AuthDto, FenixService};
use axum::{extract::Query, response::Response, Extension, Json};
use serde::Deserialize;

#[derive(Deserialize)]
pub struct FenixLoginQuery {
    code: String,
}

pub async fn login(
    Query(code): Query<FenixLoginQuery>,
    Extension(ref fenix_service): Extension<FenixService>,
) -> Result<Json<AuthDto>, Response> {
    let auth_details = fenix_service
        .authenticate_from_code(&code.code)
        .await
        .expect("failed authenticate from code");

    // TODO set session cookie with axum_session

    Ok(Json(auth_details))
}
