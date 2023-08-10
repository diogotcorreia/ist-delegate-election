use entity::admin;
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
