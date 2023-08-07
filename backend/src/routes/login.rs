use crate::services::fenix::{AuthDto, FenixService};
use axum::{
    extract::Query,
    http::StatusCode,
    response::{IntoResponse, Response},
    Extension, Json,
};
use axum_sessions::SessionHandle;
use serde::Deserialize;

#[derive(Deserialize)]
pub struct FenixLoginQuery {
    code: String,
}

pub async fn login(
    Query(code): Query<FenixLoginQuery>,
    Extension(ref fenix_service): Extension<FenixService>,
    Extension(ref session_handle): Extension<SessionHandle>,
) -> Result<Json<AuthDto>, Response> {
    let (auth_details, oauth_tokens) = fenix_service
        .authenticate_from_code(&code.code)
        .await
        .expect("failed authenticate from code");

    let mut session = session_handle.write().await;
    session.insert("user", auth_details.clone()).unwrap();
    session.insert("oauth_tokens", oauth_tokens).unwrap();

    Ok(Json(auth_details))
}

pub async fn whoami(
    Extension(ref session_handle): Extension<SessionHandle>,
) -> Result<Json<AuthDto>, Response> {
    let session = session_handle.read().await;
    let user = session
        .get::<AuthDto>("user")
        // TODO improve errors
        .ok_or_else(|| (StatusCode::UNAUTHORIZED, "not logged in").into_response())?;

    Ok(Json(user))
}
