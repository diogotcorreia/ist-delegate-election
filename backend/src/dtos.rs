use std::collections::HashMap;

use entity::{admin, election};
use sea_orm::prelude::*;
use serde::{Deserialize, Serialize};

use crate::errors::AppError;

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

#[derive(Deserialize)]
pub struct AddAdminDto {
    pub username: String,
}

type LocalizedStringDto = HashMap<String, String>;

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DegreeDto {
    pub id: String,
    pub acronym: String,
    pub name: LocalizedStringDto,
    pub degree_type: LocalizedStringDto,
}

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

#[derive(Serialize)]
pub struct DegreeElectionsDto {
    pub degree: DegreeDto,
    pub elections: Vec<ElectionDto>,
}
