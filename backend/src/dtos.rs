use std::collections::HashMap;

use entity::{admin, election};
use sea_orm::prelude::*;
use serde::{Deserialize, Serialize};
use typeshare::typeshare;

use crate::errors::AppError;

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
    pub username: String,
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
#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ElectionDto {
    pub id: i32,
    pub academic_year: String,
    // TODO pub degree: Degree,
    pub curricular_year: Option<i32>,
    pub candidacy_period_start: Option<DateTimeUtc>,
    pub candidacy_period_end: Option<DateTimeUtc>,
    pub voting_period_start: DateTimeUtc,
    pub voting_period_end: DateTimeUtc,
    pub round: i32,
}

impl ElectionDto {
    pub fn from_entity(entity: election::Model) -> Result<Self, AppError> {
        Ok(Self {
            id: entity.id,
            academic_year: entity.academic_year,
            curricular_year: entity.curricular_year,
            candidacy_period_start: entity.candidacy_period_start.map(|date| date.and_utc()),
            candidacy_period_end: entity.candidacy_period_end.map(|date| date.and_utc()),
            voting_period_start: entity.voting_period_start.and_utc(),
            voting_period_end: entity.voting_period_end.and_utc(),
            round: entity.round,
        })
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
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SignedPersonSearchResultDto {
    pub username: String,
    pub display_name: String,
    pub signature: String, // in ascii
}
