use crate::{
    auth_utils::{self, get_user},
    dtos::{AuthDto, DegreeEntryDto, LoginDto},
    election_utils::validate_nominations_of_user,
    errors::AppError,
    services::fenix::FenixService,
};
use axum::{extract::State, http::StatusCode, Extension, Json};
use axum_sessions::SessionHandle;
use entity::user_degree_override::{self, Entity as UserDegreeOverride};
use sea_orm::{prelude::*, Condition};

pub async fn login(
    State(ref fenix_service): State<FenixService>,
    State(ref conn): State<DatabaseConnection>,
    Extension(ref session_handle): Extension<SessionHandle>,
    Json(login_dto): Json<LoginDto>,
) -> Result<Json<AuthDto>, AppError> {
    let (mut user_details, oauth_tokens) = fenix_service
        .authenticate_from_code(&login_dto.code)
        .await?;

    let active_year = fenix_service.get_active_year().await?;

    // override degrees of user
    let degree_overrides = UserDegreeOverride::find()
        .filter(
            Condition::all()
                .add(user_degree_override::Column::Username.eq(user_details.username.clone()))
                .add(user_degree_override::Column::AcademicYear.eq(active_year.clone())),
        )
        .all(conn)
        .await?;

    // If user is already in degree, just change the curricular year.
    // Otherwise, add the new degree entry
    for degree_override in degree_overrides {
        let curricular_year = degree_override
            .curricular_year
            .try_into()
            .expect("curricular year to be a u8");
        let degree_entry = user_details
            .degree_entries
            .iter_mut()
            .find(|degree| degree.degree_id == degree_override.degree_id);
        match degree_entry {
            Some(degree_entry) => {
                degree_entry.curricular_year = curricular_year;
                degree_entry.nomination_elegible = true;
            }
            None => user_details.degree_entries.push(DegreeEntryDto {
                degree_id: degree_override.degree_id,
                curricular_year,
                nomination_elegible: true,
            }),
        }
    }

    validate_nominations_of_user(&user_details, conn, &active_year).await?;

    let mut session = session_handle.write().await;
    session.insert("user", &user_details)?;
    session.insert("oauth_tokens", &oauth_tokens)?;

    let auth_details = AuthDto {
        is_admin: auth_utils::is_admin(&user_details.username, conn).await?,
        user: user_details,
    };

    Ok(Json(auth_details))
}

pub async fn whoami(
    State(ref conn): State<DatabaseConnection>,
    Extension(ref session_handle): Extension<SessionHandle>,
) -> Result<Json<AuthDto>, AppError> {
    let user = get_user(session_handle).await?;

    let auth_details = AuthDto {
        is_admin: auth_utils::is_admin(&user.username, conn).await?,
        user,
    };
    Ok(Json(auth_details))
}

pub async fn logout(
    Extension(ref session_handle): Extension<SessionHandle>,
) -> Result<StatusCode, AppError> {
    let mut session = session_handle.write().await;
    session.destroy();

    Ok(StatusCode::NO_CONTENT)
}
