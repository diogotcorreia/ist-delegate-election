use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .create_table(
                Table::create()
                    .table(NominationLog::Table)
                    .if_not_exists()
                    .col(ColumnDef::new(NominationLog::Election).integer().not_null())
                    .col(ColumnDef::new(NominationLog::Nominator).string().not_null())
                    .primary_key(
                        Index::create()
                            .col(NominationLog::Election)
                            .col(NominationLog::Nominator),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk-nomination_log-election")
                            .from(NominationLog::Table, NominationLog::Election)
                            .to(Election::Table, Election::Id)
                            .on_delete(ForeignKeyAction::Restrict)
                            .on_update(ForeignKeyAction::Cascade),
                    )
                    .to_owned(),
            )
            .await
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_table(Table::drop().table(NominationLog::Table).to_owned())
            .await
    }
}

#[derive(Iden)]
enum NominationLog {
    Table,
    Election,
    Nominator,
}

#[derive(Iden)]
enum Election {
    Table,
    Id,
}
