use axum::{extract::State, Extension, Json};
use axum_sessions::SessionHandle;

use entity::election::Entity as Election;
use sea_orm::{prelude::*, DatabaseConnection};

use crate::{
    auth_utils,
    crypto_utils::sign_person_search_result,
    dtos::{SearchPersonDto, SignedPersonSearchResultDto},
    errors::AppError,
    services::fenix::FenixService,
};

pub async fn search_user(
    Extension(ref session_handle): Extension<SessionHandle>,
    State(ref fenix_service): State<FenixService>,
    State(ref conn): State<DatabaseConnection>,
    State(ref signing_key): State<[u8; 64]>,
    Json(search_dto): Json<SearchPersonDto>,
) -> Result<Json<Vec<SignedPersonSearchResultDto>>, AppError> {
    let user = auth_utils::get_user(session_handle).await?;
    let tokens = auth_utils::get_user_tokens(session_handle).await?;

    let election = Election::find_by_id(search_dto.election)
        .one(conn)
        .await?
        .ok_or(AppError::UnknownElection)?;

    if !auth_utils::can_vote_on_election(&user, &election)
        && !auth_utils::is_admin(&user.username, conn).await?
    {
        return Err(AppError::Unauthorized);
    }

    let results = fenix_service
        .search_user_in_degree(&tokens.access_token, &search_dto.query, &election.degree_id)
        .await
        .map_err(|_| AppError::FenixError)?;

    Ok(Json(
        results
            .items
            .into_iter()
            .map(|result| sign_person_search_result(election.id, result, signing_key))
            .collect(),
    ))
}
