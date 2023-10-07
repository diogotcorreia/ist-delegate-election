import {
  ArrowBackRounded,
  CheckRounded,
  ClearRounded,
  EditOffRounded,
  MoreVertRounded,
} from '@mui/icons-material';
import { Avatar, Box, Button, IconButton, Menu, MenuItem, Typography } from '@mui/material';
import Grid from '@mui/material/Unstable_Grid2';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Form, Link, LoaderFunctionArgs, Outlet, useLoaderData } from 'react-router-dom';
import { ElectionDto, ElectionStatusDto, NominationDto } from '../../@types/api';
import { getElectionDetails } from '../../api';
import ElectionCard from '../../components/election/ElectionCard';
import NominationCard from '../../components/election/NominationCard';

const DATE_FORMAT = {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  hour: 'numeric',
  minute: 'numeric',
  second: 'numeric',
};

export interface RootData {
  election: ElectionDto;
}

export async function loader({ params }: LoaderFunctionArgs): Promise<RootData> {
  const election = await getElectionDetails(parseInt(params.electionId || '', 10));

  return { election };
}

function AdminSingleElection() {
  const { election } = useLoaderData() as RootData;
  const { t } = useTranslation();

  const validNominations = useMemo(
    () => election.nominations?.filter((n) => n.valid !== false) || [],
    [election.nominations]
  );
  const invalidNominations = useMemo(
    () => election.nominations?.filter((n) => n.valid === false) || [],
    [election.nominations]
  );

  const hasEnded = election.status === ElectionStatusDto.Ended;
  const blankVotes = useMemo(() => {
    if (!hasEnded) {
      return null;
    }
    return (
      (election.totalVotes ?? 0) -
      (election.nominations?.reduce((acc, n) => acc + (n.votes ?? 0), 0) ?? 0)
    );
  }, [election.totalVotes, election.nominations, hasEnded]);

  return (
    <>
      <Box>
        <Button
          component={Link}
          to='/admin/elections'
          startIcon={<ArrowBackRounded />}
          color='inherit'
        >
          {t('admin.subpages.single-election.back')}
        </Button>
      </Box>
      <ElectionCard election={election}>
        <Grid container spacing={2} sx={{ mt: 2 }}>
          <Grid xs={12} md={6}>
            <Typography variant='subtitle1'>{t('election.candidacy-period.title')}</Typography>
            <Typography variant='body2' gutterBottom>
              {election.candidacyPeriod
                ? t('election.candidacy-period.subtitle-short', {
                    start: new Date(election.candidacyPeriod?.start),
                    end: new Date(election.candidacyPeriod?.end),
                    formatParams: { start: DATE_FORMAT, end: DATE_FORMAT },
                  })
                : t('election.candidacy-period.none')}
            </Typography>
          </Grid>
          <Grid xs={12} md={6}>
            <Typography variant='subtitle1'>{t('election.voting-period.title')}</Typography>
            <Typography variant='body2' gutterBottom>
              {t('election.voting-period.subtitle-short', {
                start: new Date(election.votingPeriod.start),
                end: new Date(election.votingPeriod.end),
                formatParams: { start: DATE_FORMAT, end: DATE_FORMAT },
              })}
            </Typography>
          </Grid>
        </Grid>
        <Box mt={6}>
          <Typography variant='h6'>nominations (?)</Typography>
          {validNominations.map((nomination) => (
            <NominationCard
              key={nomination.username}
              username={nomination.username}
              displayName={nomination.displayName}
            >
              <NominationCardAction electionId={election.id} nomination={nomination} />
            </NominationCard>
          ))}
          {hasEnded && (
            <NominationCard
              displayName={'blank vote'}
              avatar={
                <Avatar sx={{ width: 48, height: 48 }}>
                  <EditOffRounded />
                </Avatar>
              }
            >
              <span>{`${blankVotes} votes`}</span>
              <Box width={40} />
            </NominationCard>
          )}
          {invalidNominations.map((nomination) => (
            <NominationCard
              key={nomination.username}
              username={nomination.username}
              displayName={nomination.displayName}
              sx={{ opacity: 0.6 }}
            >
              <NominationCardAction electionId={election.id} nomination={nomination} />
            </NominationCard>
          ))}
        </Box>
      </ElectionCard>
      <Outlet />
    </>
  );
}

interface NominationCardActionProps {
  electionId: number;
  nomination: NominationDto;
}

function NominationCardAction({ electionId, nomination }: NominationCardActionProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  if (nomination.valid === undefined || nomination.valid === null) {
    return (
      <Form method='post'>
        <input type='hidden' name='electionId' value={electionId} />
        <input type='hidden' name='username' value={nomination.username} />
        <IconButton color='success' type='submit' name='valid' value='true'>
          <CheckRounded />
        </IconButton>
        <IconButton color='error' type='submit' name='valid' value='false'>
          <ClearRounded />
        </IconButton>
      </Form>
    );
  }

  return (
    <>
      {nomination.votes !== null && `${nomination.votes} votes`}
      <IconButton onClick={handleClick}>
        <MoreVertRounded />
      </IconButton>
      <Menu anchorEl={anchorEl} open={open} onClose={handleClose}>
        <MenuItem>toggle valid</MenuItem>
      </Menu>
    </>
  );
}

export default AdminSingleElection;
