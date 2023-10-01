use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .alter_table(
                Table::alter()
                    .table(Nomination::Table)
                    .modify_column(ColumnDef::new(Nomination::Valid).boolean().null())
                    .to_owned(),
            )
            .await
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .alter_table(
                Table::alter()
                    .table(Nomination::Table)
                    .modify_column(ColumnDef::new(Nomination::Valid).boolean().not_null())
                    .to_owned(),
            )
            .await
    }
}

#[derive(Iden)]
enum Nomination {
    Table,
    Valid,
}
