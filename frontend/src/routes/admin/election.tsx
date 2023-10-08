import {
  AddRounded,
  ArrowBackRounded,
  CheckRounded,
  ClearRounded,
  EditOffRounded,
  MoreVertRounded,
} from '@mui/icons-material';
import {
  Avatar,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Menu,
  MenuItem,
  Typography,
} from '@mui/material';
import Grid from '@mui/material/Unstable_Grid2';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActionFunctionArgs,
  Form,
  Link,
  LoaderFunctionArgs,
  Outlet,
  redirect,
  useLoaderData,
  useLocation,
  useNavigate,
  useOutletContext,
  useSubmit,
} from 'react-router-dom';
import { SubmitTarget } from 'react-router-dom/dist/dom';
import {
  ElectionDto,
  ElectionStatusDto,
  NominationDto,
  SignedPersonSearchResultDto,
} from '../../@types/api';
import { addNomination, editNomination, getElectionDetails } from '../../api';
import ElectionCard from '../../components/election/ElectionCard';
import NominationCard, { EditNominationForm } from '../../components/election/NominationCard';
import SearchPersonInput from '../../components/forms/SearchPersonInput';

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

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const electionId = formData.get('electionId')?.valueOf() as number;
  const username = formData.get('username')?.toString() || '';
  const valid = formData.get('valid')?.toString() === 'true';
  const nomination = {
    username,
    valid,
  };
  await editNomination(electionId, nomination);

  return null;
}

function AdminSingleElection() {
  const { election } = useLoaderData() as RootData;
  const { t } = useTranslation();

  const validNominations = useMemo(
    () =>
      election.nominations
        ?.filter((n) => n.valid !== false)
        .sort((a, b) => (b.votes ?? 0) - (a.votes ?? 0)) || [],
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
  const [maxVotes, isTie] = useMemo(() => {
    if (!hasEnded) {
      return [null, null];
    }

    let maxVotes = -1; // start at -1 so tie calculation works correctly
    let isTie = false;

    for (const nomination of election.nominations ?? []) {
      const votes = nomination.votes ?? 0;
      if (votes > maxVotes) {
        maxVotes = votes;
        isTie = false;
      } else if (votes === maxVotes) {
        isTie = true;
      }
    }

    return [maxVotes, isTie];
  }, [election.nominations, hasEnded]);

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
          <Typography variant='h6'>
            {t('admin.subpages.single-election.nominations-title')}
          </Typography>
          {validNominations.map((nomination) => (
            <NominationCard
              key={nomination.username}
              username={nomination.username}
              displayName={nomination.displayName}
              chip={
                hasEnded &&
                maxVotes === nomination.votes && (
                  <Chip
                    size='small'
                    label={t(`admin.subpages.single-election.winner${isTie ? '-tie' : ''}`)}
                    color={isTie ? 'warning' : 'success'}
                  />
                )
              }
            >
              <NominationCardAction electionId={election.id} nomination={nomination} />
            </NominationCard>
          ))}
          {hasEnded && (
            <NominationCard
              displayName={t('election.vote.blank')}
              avatar={
                <Avatar sx={{ width: 48, height: 48 }}>
                  <EditOffRounded />
                </Avatar>
              }
            >
              <span>{t('admin.subpages.single-election.votes', { count: blankVotes ?? 0 })}</span>
              {(election.nominations?.length ?? 0) > 0 && <Box width={40} />}
            </NominationCard>
          )}
          {invalidNominations.map((nomination) => (
            <NominationCard
              key={nomination.username}
              username={nomination.username}
              displayName={nomination.displayName}
              sx={{ opacity: 0.6 }}
              chip={
                hasEnded &&
                maxVotes === nomination.votes && (
                  <Chip
                    size='small'
                    label={`winner${isTie ? ' (tie)' : ''}`}
                    color={isTie ? 'warning' : 'success'}
                  />
                )
              }
            >
              <NominationCardAction electionId={election.id} nomination={nomination} />
            </NominationCard>
          ))}
          {!hasEnded && (election.nominations?.length ?? 0) === 0 && (
            <Typography>{t('admin.subpages.single-election.nominations-empty')}</Typography>
          )}
          {!hasEnded && (
            <Box display='flex' justifyContent='center' mt={2}>
              <Button
                component={Link}
                to='./add-nomination'
                variant='outlined'
                startIcon={<AddRounded />}
              >
                {t('admin.subpages.single-election.add-nomination-button')}
              </Button>
            </Box>
          )}
        </Box>
      </ElectionCard>
      <Outlet context={{ electionId: election.id }} />
    </>
  );
}

interface NominationCardActionProps {
  electionId: number;
  nomination: NominationDto;
}

function NominationCardAction({ electionId, nomination }: NominationCardActionProps) {
  const { t } = useTranslation();
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
      <EditNominationForm electionId={electionId} username={nomination.username}>
        <>
          <IconButton color='success' type='submit' name='valid' value='true'>
            <CheckRounded />
          </IconButton>
          <IconButton color='error' type='submit' name='valid' value='false'>
            <ClearRounded />
          </IconButton>
        </>
      </EditNominationForm>
    );
  }

  return (
    <>
      <Box component='span' sx={{ whiteSpace: 'pre-wrap' }}>
        {nomination.votes !== undefined &&
          t('admin.subpages.single-election.votes', { count: nomination.votes })}
      </Box>
      <IconButton onClick={handleClick}>
        <MoreVertRounded />
      </IconButton>
      <Menu anchorEl={anchorEl} open={open} onClose={handleClose}>
        <EditNominationForm electionId={electionId} username={nomination.username}>
          <MenuItem
            component='button'
            type='submit'
            name='valid'
            value={(!nomination.valid).toString()}
          >
            {t(`admin.subpages.single-election.${nomination.valid ? 'in' : ''}validate-nomination`)}
          </MenuItem>
        </EditNominationForm>
      </Menu>
    </>
  );
}

export async function addNominationAction({ params, request }: ActionFunctionArgs) {
  const payload = await request.json();

  await addNomination(parseInt(params.electionId || '', 10), payload.person);

  return null;
}

export function AddNominationPage() {
  const { state } = useLocation();
  const { electionId } = useOutletContext<{ electionId: number }>();
  const navigate = useNavigate();
  const [open, setOpen] = useState(true);
  const [selectedPerson, setSelectedPerson] = useState<SignedPersonSearchResultDto | null>(null);
  const { t } = useTranslation();
  const submit = useSubmit();
  const handleSubmit = useCallback(() => {
    const payload = {
      person: selectedPerson,
    };
    // bah
    submit(payload as unknown as SubmitTarget, {
      method: 'post',
      encType: 'application/json',
      state: { close: true },
    });
  }, [submit, selectedPerson]);

  const handleClose = () => {
    setOpen(false);
  };

  useEffect(() => {
    if (state?.close) {
      handleClose();
    }
  }, [state?.close]);

  return (
    <Dialog open={open} onClose={handleClose} onTransitionExited={() => navigate('..')} fullWidth>
      <DialogTitle>{t('admin.subpages.single-election.add-nomination-title')}</DialogTitle>
      <DialogContent>
        <Box mt={1}>
          <SearchPersonInput
            electionId={electionId}
            value={selectedPerson}
            setValue={setSelectedPerson}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button color='error' onClick={handleClose}>
          {t('common.cancel')}
        </Button>
        <Button onClick={handleSubmit}>
          {t('admin.subpages.single-election.add-nomination-button')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default AdminSingleElection;
