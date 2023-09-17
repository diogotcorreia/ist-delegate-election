//! `SeaORM` Entity. Generated by sea-orm-codegen 0.11.3

use sea_orm::entity::prelude::*;

#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Eq)]
#[sea_orm(table_name = "nomination_log")]
pub struct Model {
    #[sea_orm(primary_key, auto_increment = false)]
    pub election: i32,
    #[sea_orm(primary_key, auto_increment = false)]
    pub nominator: String,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    #[sea_orm(
        belongs_to = "super::election::Entity",
        from = "Column::Election",
        to = "super::election::Column::Id",
        on_update = "Cascade",
        on_delete = "Restrict"
    )]
    Election,
}

impl Related<super::election::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Election.def()
    }
}

impl ActiveModelBehavior for ActiveModel {}