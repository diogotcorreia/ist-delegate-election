use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .create_table(
                Table::create()
                    .table(Election::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(Election::Id)
                            .integer()
                            .not_null()
                            .auto_increment()
                            .primary_key(),
                    )
                    .col(ColumnDef::new(Election::AcademicYear).string().not_null())
                    .col(ColumnDef::new(Election::DegreeId).string().not_null())
                    .col(ColumnDef::new(Election::CurricularYear).integer().null())
                    .col(
                        ColumnDef::new(Election::CandidacyPeriodStart)
                            .timestamp()
                            .null(),
                    )
                    .col(
                        ColumnDef::new(Election::CandidacyPeriodEnd)
                            .timestamp()
                            .null(),
                    )
                    .col(
                        ColumnDef::new(Election::VotingPeriodStart)
                            .timestamp()
                            .not_null(),
                    )
                    .col(
                        ColumnDef::new(Election::VotingPeriodEnd)
                            .timestamp()
                            .not_null(),
                    )
                    .col(ColumnDef::new(Election::Round).integer().not_null())
                    .index(
                        Index::create()
                            .unique()
                            .name("unique_academicyear_degree_curricularyear_round")
                            .col(Election::AcademicYear)
                            .col(Election::DegreeId)
                            .col(Election::CurricularYear)
                            .col(Election::Round),
                    )
                    .to_owned(),
            )
            .await?;

        manager
            .create_table(
                Table::create()
                    .table(Nomination::Table)
                    .if_not_exists()
                    .col(ColumnDef::new(Nomination::Election).integer().not_null())
                    .col(ColumnDef::new(Nomination::Username).string().not_null())
                    .col(ColumnDef::new(Nomination::DisplayName).string().not_null())
                    .col(ColumnDef::new(Nomination::Valid).boolean().not_null())
                    .primary_key(
                        Index::create()
                            .col(Nomination::Election)
                            .col(Nomination::Username),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk-nomination-election")
                            .from(Nomination::Table, Nomination::Election)
                            .to(Election::Table, Election::Id)
                            .on_delete(ForeignKeyAction::Restrict)
                            .on_update(ForeignKeyAction::Cascade),
                    )
                    .to_owned(),
            )
            .await?;

        manager
            .create_table(
                Table::create()
                    .table(ElectionVote::Table)
                    .if_not_exists()
                    // nomination primary key
                    .col(ColumnDef::new(ElectionVote::Election).integer().not_null())
                    .col(
                        ColumnDef::new(ElectionVote::NominationUsername)
                            .string()
                            .not_null(),
                    )
                    // end nomination primary key
                    .col(ColumnDef::new(ElectionVote::Count).integer().not_null())
                    .primary_key(
                        Index::create()
                            .col(ElectionVote::Election)
                            .col(ElectionVote::NominationUsername),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk-election_vote-nomination")
                            .from(ElectionVote::Table, ElectionVote::Election)
                            .from(ElectionVote::Table, ElectionVote::NominationUsername)
                            .to(Nomination::Table, Nomination::Election)
                            .to(Nomination::Table, Nomination::Username)
                            .on_delete(ForeignKeyAction::Restrict)
                            .on_update(ForeignKeyAction::Cascade),
                    )
                    .to_owned(),
            )
            .await?;

        manager
            .create_table(
                Table::create()
                    .table(VoteLog::Table)
                    .if_not_exists()
                    .col(ColumnDef::new(VoteLog::Election).integer().not_null())
                    .col(ColumnDef::new(VoteLog::Voter).string().not_null())
                    .primary_key(Index::create().col(VoteLog::Election).col(VoteLog::Voter))
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk-vote_log-election")
                            .from(VoteLog::Table, VoteLog::Election)
                            .to(Election::Table, Election::Id)
                            .on_delete(ForeignKeyAction::Restrict)
                            .on_update(ForeignKeyAction::Cascade),
                    )
                    .to_owned(),
            )
            .await?;

        manager
            .create_table(
                Table::create()
                    .table(Admin::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(Admin::Username)
                            .string()
                            .not_null()
                            .primary_key(),
                    )
                    .col(ColumnDef::new(Admin::DateAdded).timestamp().not_null())
                    .to_owned(),
            )
            .await?;

        Ok(())
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_table(Table::drop().table(Admin::Table).to_owned())
            .await?;
        manager
            .drop_table(Table::drop().table(VoteLog::Table).to_owned())
            .await?;
        manager
            .drop_table(Table::drop().table(ElectionVote::Table).to_owned())
            .await?;
        manager
            .drop_table(Table::drop().table(Nomination::Table).to_owned())
            .await?;
        manager
            .drop_table(Table::drop().table(Election::Table).to_owned())
            .await?;

        Ok(())
    }
}

#[derive(Iden)]
enum Election {
    Table,
    Id,
    AcademicYear,
    DegreeId,
    CurricularYear,
    CandidacyPeriodStart,
    CandidacyPeriodEnd,
    VotingPeriodStart,
    VotingPeriodEnd,
    Round,
}

#[derive(Iden)]
enum Nomination {
    Table,
    Election,
    Username,
    DisplayName,
    Valid,
}

#[derive(Iden)]
enum ElectionVote {
    Table,
    Election,
    NominationUsername,
    Count,
}

#[derive(Iden)]
enum VoteLog {
    Table,
    Election,
    Voter,
}

#[derive(Iden)]
enum Admin {
    Table,
    Username,
    DateAdded,
}
