//! `SeaORM` Entity. Generated by sea-orm-codegen 0.11.3

use sea_orm::entity::prelude::*;

#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Eq)]
#[sea_orm(table_name = "election")]
pub struct Model {
    #[sea_orm(primary_key)]
    pub id: i32,
    pub academic_year: String,
    pub degree_id: String,
    pub curricular_year: i32,
    pub candidacy_period_start: Option<DateTime>,
    pub candidacy_period_end: Option<DateTime>,
    pub voting_period_start: DateTime,
    pub voting_period_end: DateTime,
    pub round: i32,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    #[sea_orm(has_many = "super::nomination::Entity")]
    Nomination,
    #[sea_orm(has_many = "super::vote_log::Entity")]
    VoteLog,
}

impl Related<super::nomination::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Nomination.def()
    }
}

impl Related<super::vote_log::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::VoteLog.def()
    }
}

impl ActiveModelBehavior for ActiveModel {}
