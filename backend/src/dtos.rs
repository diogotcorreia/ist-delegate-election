use std::collections::HashMap;

use entity::{admin, election, nomination};
use sea_orm::prelude::*;
use serde::{Deserialize, Serialize};
use typeshare::typeshare;

use crate::{errors::AppError, services::fenix::FenixService};

#[typeshare]
#[derive(Serialize)]
pub struct AppErrorDto {
    pub key: String,
}

#[typeshare]
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AppConfigDto {
    pub fenix: FenixConfigDto,
    pub is_setup: bool,
}

#[typeshare]
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct FenixConfigDto {
    pub base_url: String,
    pub client_id: String,
    pub redirect_url: String,
}

#[typeshare]
#[derive(Deserialize)]
pub struct LoginDto {
    pub code: String,
}

#[typeshare]
#[derive(Deserialize, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct DegreeEntryDto {
    pub degree_id: String,
    pub curricular_year: u8,
}

#[typeshare]
#[derive(Deserialize, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct AuthDto {
    pub user: UserDto,
    pub is_admin: bool,
}

#[typeshare]
#[derive(Deserialize, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct UserDto {
    pub username: String,
    pub name: String,
    pub display_name: String,
    pub degree_entries: Vec<DegreeEntryDto>,
}

#[typeshare]
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AdminDto {
    username: String,
    date_added: DateTimeUtc,
}

impl AdminDto {
    pub fn from_entity(entity: admin::Model) -> Result<Self, AppError> {
        Ok(Self {
            username: entity.username,
            date_added: entity.date_added.and_utc(),
        })
    }
}

#[typeshare]
#[derive(Deserialize)]
pub struct AddAdminDto {
    pub username: String,
}

#[typeshare]
type LocalizedStringDto = HashMap<String, String>;

#[typeshare]
#[derive(Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct DegreeDto {
    pub id: String,
    pub acronym: String,
    pub name: LocalizedStringDto,
    pub degree_type: LocalizedStringDto,
}

#[typeshare]
#[derive(Serialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct ElectionDto {
    pub id: i32,
    pub academic_year: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub degree: Option<DegreeDto>,
    pub curricular_year: Option<i32>,
    pub candidacy_period: Option<DateRangeDto>,
    pub voting_period: DateRangeDto,
    pub round: i32,
    pub status: ElectionStatusDto,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub has_nominated: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub has_voted: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub nominations: Option<Vec<NominationDto>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub total_votes: Option<i32>,
}

impl ElectionDto {
    pub fn from_entity(entity: election::Model) -> Result<Self, AppError> {
        Ok(Self {
            status: ElectionStatusDto::from_election(&entity),
            id: entity.id,
            academic_year: entity.academic_year,
            curricular_year: entity.curricular_year,
            candidacy_period: match (entity.candidacy_period_start, entity.candidacy_period_end) {
                (Some(start), Some(end)) => Some(DateRangeDto {
                    start: start.and_utc(),
                    end: end.and_utc(),
                }),
                _ => None,
            },
            voting_period: DateRangeDto {
                start: entity.voting_period_start.and_utc(),
                end: entity.voting_period_end.and_utc(),
            },
            round: entity.round,

            ..Default::default()
        })
    }
    pub async fn from_entity_for_user(
        entity: election::Model,
        fenix_service: &FenixService,
        has_nominated: bool,
        has_voted: bool,
    ) -> Result<Self, AppError> {
        let degree_id = entity.degree_id.clone();
        let mut dto = Self::from_entity(entity)?;

        dto.degree = fenix_service.get_degree(&degree_id).await?;
        dto.has_nominated = Some(has_nominated);
        dto.has_voted = Some(has_voted);

        Ok(dto)
    }
    pub async fn from_entity_for_admin(
        entity: election::Model,
        fenix_service: &FenixService,
        nominations: Vec<NominationDto>,
        total_votes: Option<i32>,
    ) -> Result<Self, AppError> {
        let degree_id = entity.degree_id.clone();
        let mut dto = Self::from_entity(entity)?;

        dto.degree = fenix_service.get_degree(&degree_id).await?;
        dto.total_votes = total_votes;
        dto.nominations = Some(nominations);

        Ok(dto)
    }
}

#[typeshare]
#[derive(Serialize, Default)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum ElectionStatusDto {
    #[default]
    NotStarted,
    Candidacy,
    Processing,
    Voting,
    Ended,
}

impl ElectionStatusDto {
    fn from_election(entity: &election::Model) -> Self {
        let now = chrono::Utc::now();
        if now > entity.voting_period_end.and_utc() {
            return Self::Ended;
        }
        if now >= entity.voting_period_start.and_utc() {
            return Self::Voting;
        }
        if let Some(end) = entity.candidacy_period_end {
            if now > end.and_utc() {
                return Self::Processing;
            }
        }
        if let Some(start) = entity.candidacy_period_start {
            if now >= start.and_utc() {
                return Self::Candidacy;
            }
        }

        Self::NotStarted
    }
}

#[typeshare]
#[derive(Serialize)]
pub struct DegreeElectionsDto {
    pub degree: DegreeDto,
    pub elections: Vec<ElectionDto>,
}

#[typeshare]
#[derive(Deserialize)]
pub struct SearchPersonDto {
    pub election: i32,
    pub query: String,
}

#[typeshare]
#[derive(Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SignedPersonSearchResultDto {
    pub username: String,
    pub display_name: String,
    pub signature: String, // in ascii
}

#[typeshare]
#[derive(Deserialize, Serialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct DateRangeDto {
    pub start: DateTimeUtc,
    pub end: DateTimeUtc,
}

#[typeshare]
#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BulkCreateElectionsDegreesDto {
    pub degree_id: String,
    pub curricular_year: Option<i32>,
}

#[typeshare]
#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BulkCreateElectionsDto {
    pub candidacy_period: Option<DateRangeDto>,
    pub voting_period: DateRangeDto,
    pub round: i32,
    pub degrees: Vec<BulkCreateElectionsDegreesDto>,
}

#[typeshare]
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct VoteOptionDto {
    pub username: String,
    pub display_name: String,
}

#[typeshare]
#[derive(Deserialize)]
pub struct CastVoteDto {
    pub username: Option<String>,
}

#[typeshare]
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ElectionWithUnverifiedNominationsDto {
    pub id: i32,
    pub degree: Option<DegreeDto>,
    pub curricular_year: Option<i32>,
    pub round: i32,
    pub nominations: Vec<NominationDto>,
}

#[typeshare]
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct NominationDto {
    pub username: String,
    pub display_name: String,
    pub valid: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub votes: Option<i32>,
}

impl NominationDto {
    pub fn from_entity(entity: &nomination::Model) -> Self {
        Self::from_entity_with_votes(entity, None)
    }
    pub fn from_entity_with_votes(entity: &nomination::Model, votes: Option<i32>) -> Self {
        NominationDto {
            username: entity.username.clone(),
            display_name: entity.display_name.clone(),
            valid: entity.valid,
            votes,
        }
    }
}

#[typeshare]
#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct EditNominationDto {
    pub username: String,
    pub display_name: Option<String>,
    pub valid: Option<bool>,
}

#[typeshare]
#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BulkAddUserDegreeOverrideDto {
    pub degree_id: String,
    pub curricular_year: u8,
    pub usernames: Vec<String>,
}

#[typeshare]
#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BulkDeleteUserDegreeOverrideDto {
    pub degree_id: String,
    pub usernames: Vec<String>,
}

#[typeshare]
#[derive(Serialize)]
pub struct DegreeWithUserOverridesDto {
    pub degree: Option<DegreeDto>,
    pub users: Vec<UserDegreeOverrideDto>,
}

#[typeshare]
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct UserDegreeOverrideDto {
    pub username: String,
    pub curricular_year: u8,
}
