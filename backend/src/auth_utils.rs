use axum_sessions::SessionHandle;
use entity::admin;
use sea_orm::{DatabaseConnection, EntityTrait};

use entity::election::Model as Election;

use crate::{dtos::UserDto, errors::AppError, services::fenix::OAuthResponse};

pub async fn get_user(session_handle: &SessionHandle) -> Result<UserDto, AppError> {
    let session = session_handle.read().await;

    let user: UserDto = session.get("user").ok_or(AppError::Unauthorized)?;
    Ok(user)
}

pub async fn get_user_tokens(session_handle: &SessionHandle) -> Result<OAuthResponse, AppError> {
    let session = session_handle.read().await;

    let tokens: OAuthResponse = session.get("oauth_tokens").ok_or(AppError::Unauthorized)?;
    Ok(tokens)
}

pub async fn get_admin(
    session_handle: &SessionHandle,
    conn: &DatabaseConnection,
) -> Result<UserDto, AppError> {
    let user = get_user(session_handle).await?;

    if is_admin(&user.username, conn).await? {
        Ok(user)
    } else {
        Err(AppError::Forbidden)
    }
}

pub async fn is_admin(username: &str, conn: &DatabaseConnection) -> Result<bool, AppError> {
    Ok(admin::Entity::find_by_id(username)
        .one(conn)
        .await?
        .is_some())
}

/// A user can vote on the election if they are attending the corresponding degree,
/// and, if the election has a curricular year, they are attending that year as well.
pub fn can_vote_on_election(user: &UserDto, election: &Election) -> Result<(), AppError> {
    user.degree_entries
        .iter()
        .any(|entry| {
            entry.degree_id == election.degree_id
                && election
                    .curricular_year
                    .map(|year| year == entry.curricular_year as i32)
                    .unwrap_or(true)
        })
        .then_some(())
        .ok_or(AppError::ElectionUnauthorized)
}

#[cfg(test)]
mod tests {
    use chrono::NaiveDateTime;

    use crate::dtos::DegreeEntryDto;

    use super::*;

    fn get_user_with_degrees(degrees: &[(&str, u8)]) -> UserDto {
        UserDto {
            username: "demo".to_string(),
            name: "Demo".to_string(),
            display_name: "Demo".to_string(),
            degree_entries: degrees
                .iter()
                .map(|(id, year)| DegreeEntryDto {
                    degree_id: id.to_string(),
                    curricular_year: *year,
                })
                .collect(),
        }
    }

    fn get_election(degree_id: &str, curricular_year: Option<i32>) -> Election {
        Election {
            degree_id: degree_id.to_string(),
            curricular_year,
            id: 1,
            round: 1,
            academic_year: "2022/2023".to_string(),
            voting_period_start: NaiveDateTime::from_timestamp_opt(0, 0).unwrap(),
            voting_period_end: NaiveDateTime::from_timestamp_opt(0, 0).unwrap(),
            candidacy_period_start: None,
            candidacy_period_end: None,
        }
    }

    #[test]
    fn test_can_vote_on_election() {
        let user = get_user_with_degrees(&[("123456", 1), ("654321", 3)]);
        let election1 = get_election("111111", None);
        let election2 = get_election("111111", Some(2));
        let election3 = get_election("123456", None);
        let election4 = get_election("123456", Some(1));
        let election5 = get_election("123456", Some(3));

        assert!(can_vote_on_election(&user, &election1).is_err());
        assert!(can_vote_on_election(&user, &election2).is_err());
        assert!(can_vote_on_election(&user, &election3).is_ok());
        assert!(can_vote_on_election(&user, &election4).is_ok());
        assert!(can_vote_on_election(&user, &election5).is_err());
    }
}
