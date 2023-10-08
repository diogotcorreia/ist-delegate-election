pub use sea_orm_migration::prelude::*;

mod m20220101_000001_create_table;
mod m20230917_143144_nomination_log;
mod m20231001_091623_nomination_valid_null;
mod m20231008_162240_user_degree_override;

pub struct Migrator;

#[async_trait::async_trait]
impl MigratorTrait for Migrator {
    fn migrations() -> Vec<Box<dyn MigrationTrait>> {
        vec![
            Box::new(m20220101_000001_create_table::Migration),
            Box::new(m20230917_143144_nomination_log::Migration),
            Box::new(m20231001_091623_nomination_valid_null::Migration),
            Box::new(m20231008_162240_user_degree_override::Migration),
        ]
    }
}
