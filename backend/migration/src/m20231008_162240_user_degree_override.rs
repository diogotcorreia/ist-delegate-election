use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .create_table(
                Table::create()
                    .table(UserDegreeOverride::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(UserDegreeOverride::Username)
                            .string()
                            .not_null(),
                    )
                    .col(
                        ColumnDef::new(UserDegreeOverride::DegreeId)
                            .string()
                            .not_null(),
                    )
                    .col(
                        ColumnDef::new(UserDegreeOverride::CurricularYear)
                            .integer()
                            .not_null(),
                    )
                    .primary_key(
                        Index::create()
                            .col(UserDegreeOverride::Username)
                            .col(UserDegreeOverride::DegreeId),
                    )
                    .to_owned(),
            )
            .await
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_table(Table::drop().table(UserDegreeOverride::Table).to_owned())
            .await
    }
}

#[derive(Iden)]
enum UserDegreeOverride {
    Table,
    Username,
    DegreeId,
    CurricularYear,
}
