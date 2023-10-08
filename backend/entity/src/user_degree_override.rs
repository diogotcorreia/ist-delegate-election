//! `SeaORM` Entity. Generated by sea-orm-codegen 0.12.2

use sea_orm::entity::prelude::*;

#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Eq)]
#[sea_orm(table_name = "user_degree_override")]
pub struct Model {
    #[sea_orm(primary_key, auto_increment = false)]
    pub username: String,
    #[sea_orm(primary_key, auto_increment = false)]
    pub degree_id: String,
    pub curricular_year: i32,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {}

impl ActiveModelBehavior for ActiveModel {}
