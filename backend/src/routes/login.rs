use crate::services::fenix::{authenticate_from_code, AuthDto};
use axum::{extract::Query, response::Response, Json};
use serde::Deserialize;

#[derive(Deserialize)]
pub struct FenixLoginQuery {
    code: String,
}

pub async fn login(Query(code): Query<FenixLoginQuery>) -> Result<Json<AuthDto>, Response> {
    let auth_details = authenticate_from_code(&code.code)
        .await
        .expect("failed authenticate from code");

    Ok(Json(auth_details))
}
