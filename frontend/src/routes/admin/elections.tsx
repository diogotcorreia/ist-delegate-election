import { AddRounded, CloseRounded, VerifiedRounded } from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Container,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Step,
  StepContent,
  StepLabel,
  Stepper,
  Toolbar,
  Typography,
} from '@mui/material';
import { Dayjs } from 'dayjs';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActionFunctionArgs,
  Link,
  Outlet,
  redirect,
  useLoaderData,
  useNavigate,
  useOutletContext,
} from 'react-router-dom';
import { DegreeElectionsDto } from '../../@types/api';
import { bulkCreateElections, countUnverifiedNominations, getDegreeElections } from '../../api';
import DegreeTypeElections from '../../components/admin/DegreeTypeElections';
import BulkCreateElectionsSubmitButton from '../../components/admin/forms/BulkCreateElectionsSubmitButton';
import DateRangeInput from '../../components/admin/forms/DateRangeInput';
import DegreeSelectionInput from '../../components/admin/forms/DegreeSelectionInput';
import ElectionRoundInput from '../../components/admin/forms/ElectionRoundInput';
import YearSelectionInput from '../../components/admin/forms/YearSelectionInput';
import useSortAndGroupDegrees, { DegreeTypeAggregator } from '../../hooks/useSortAndGroupDegrees';

const DATE_FORMAT = {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  hour: 'numeric',
  minute: 'numeric',
  second: 'numeric',
};

interface ElectionsData {
  degrees: DegreeElectionsDto[];
  unverifiedNominationsCountByElection: Record<number, number>;
  unverifiedNominationsCount: number;
}

export async function loader(): Promise<ElectionsData> {
  const degrees = await getDegreeElections();
  const unverifiedNominationsCountByElection = await countUnverifiedNominations();

  const unverifiedNominationsCount = Object.values(unverifiedNominationsCountByElection).reduce(
    (acc, v) => acc + v,
    0
  );

  return { degrees, unverifiedNominationsCountByElection, unverifiedNominationsCount };
}

function Elections() {
  const { degrees, unverifiedNominationsCountByElection, unverifiedNominationsCount } =
    useLoaderData() as ElectionsData;
  const { t } = useTranslation();
  const sortedDegrees = useSortAndGroupDegrees(degrees);

  return (
    <>
      <Typography variant='h2' gutterBottom>
        {t('admin.subpages.election-management.title')}
      </Typography>
      <Box my={4} display='flex' flexDirection='row-reverse'>
        <Button component={Link} to='bulk-add' variant='contained' startIcon={<AddRounded />}>
          {t('admin.subpages.election-management.create-elections')}
        </Button>
      </Box>
      <Box mb={2}>
        {unverifiedNominationsCount > 0 && (
          <Alert
            severity='warning'
            variant='filled'
            action={
              <Button
                component={Link}
                to='/admin/bulk-validate-nominations'
                color='inherit'
                size='small'
                sx={{ textAlign: 'center' }}
              >
                {t('admin.subpages.election-management.unverified-nominations-alert.fix-button', {
                  count: unverifiedNominationsCount,
                })}
              </Button>
            }
          >
            {t('admin.subpages.election-management.unverified-nominations-alert.text', {
              count: unverifiedNominationsCount,
            })}
          </Alert>
        )}
      </Box>
      {sortedDegrees.map((aggregator) => (
        <DegreeTypeElections
          key={aggregator.degreeTypeHash}
          aggregator={aggregator}
          unverifiedNominationsCountByElection={unverifiedNominationsCountByElection}
        />
      ))}
      <Outlet context={{ sortedDegrees }} />
    </>
  );
}

export async function bulkAddAction({ request }: ActionFunctionArgs) {
  const payload = await request.json();

  await bulkCreateElections(payload);

  return redirect('../bulk-add/success');
}

export function ElectionsBulkAdd() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { sortedDegrees } = useOutletContext<{ sortedDegrees: DegreeTypeAggregator[] }>();
  const [activeStep, setActiveStep] = useState(0);

  const [round, setRound] = useState(1);
  const [candidacyStart, setCandidacyStart] = useState<Dayjs | null>(null);
  const [candidacyEnd, setCandidacyEnd] = useState<Dayjs | null>(null);
  const [votingStart, setVotingStart] = useState<Dayjs | null>(null);
  const [votingEnd, setVotingEnd] = useState<Dayjs | null>(null);
  const [selectedDegrees, setSelectedDegrees] = useState<Set<string>>(() => new Set());
  const [selectedYears, setSelectedYears] = useState<Set<string>[]>([]);

  const closeDialog = useCallback(() => navigate('..'), [navigate]);

  const handleNext = useCallback(() => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  }, []);
  const handleBack = useCallback(() => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  }, []);

  const validCandidacyDate = useMemo(
    () => Boolean(candidacyStart && candidacyEnd && candidacyStart.isBefore(candidacyEnd)),
    [candidacyStart, candidacyEnd]
  );
  const handleSkipCandidacy = useCallback(() => {
    setCandidacyStart(null);
    setCandidacyEnd(null);
    handleNext();
  }, [handleNext]);
  const validVotingDate = useMemo(
    () =>
      Boolean(
        votingStart &&
          votingEnd &&
          votingStart.isBefore(votingEnd) &&
          (!candidacyEnd || candidacyEnd.isBefore(votingStart))
      ),
    [votingStart, votingEnd, candidacyEnd]
  );

  const existingElectionsPerYear = useMemo(() => {
    const existingElections: Record<string, number[][]> = {};

    for (const degreeType of sortedDegrees) {
      for (const degreeElection of degreeType.degreeElections) {
        const yearRoundMatrix: number[][] = [];
        for (const election of degreeElection.elections) {
          const year = election.curricularYear ?? 0;
          const rounds = yearRoundMatrix[year] || (yearRoundMatrix[year] = []);
          rounds.push(election.round);
        }
        existingElections[degreeElection.degree.id] = yearRoundMatrix;
      }
    }

    return existingElections;
  }, [sortedDegrees]);
  const electionExists = useCallback(
    (degreeId: string, curricularYear: number | undefined, round: number) => {
      return existingElectionsPerYear[degreeId]?.[curricularYear ?? 0]?.includes(round);
    },
    [existingElectionsPerYear]
  );

  return (
    <Dialog open onClose={closeDialog} fullScreen disableEscapeKeyDown>
      <DialogTitle>
        <Toolbar sx={{ gap: 1 }}>
          <IconButton onClick={closeDialog}>
            <CloseRounded />
          </IconButton>
          {t('admin.subpages.election-management.bulk-dialog.title')}
        </Toolbar>
      </DialogTitle>
      <DialogContent>
        <Container>
          <Stepper activeStep={activeStep} orientation='vertical'>
            <Step>
              <StepLabel
                optional={
                  activeStep > 0 && (
                    <Typography variant='caption'>
                      {t('election.round', {
                        ordinal: true,
                        count: round,
                      })}
                    </Typography>
                  )
                }
              >
                {t('admin.subpages.election-management.bulk-dialog.steps.round')}
              </StepLabel>
              <StepContent>
                <ElectionRoundInput round={round} setRound={setRound} />
                <Box mt={3} display='flex' gap={1}>
                  <Button onClick={closeDialog} color='inherit'>
                    {t('common.back')}
                  </Button>
                  <Button onClick={handleNext} variant='contained'>
                    {t('common.next')}
                  </Button>
                </Box>
              </StepContent>
            </Step>
            <Step completed={activeStep > 1 ? validCandidacyDate : undefined}>
              <StepLabel
                optional={
                  <Typography variant='caption'>
                    {activeStep > 1
                      ? validCandidacyDate
                        ? t('admin.subpages.election-management.bulk-dialog.candidacy-period', {
                            start: candidacyStart,
                            end: candidacyEnd,
                            formatParams: { start: DATE_FORMAT, end: DATE_FORMAT },
                          })
                        : t('admin.subpages.election-management.bulk-dialog.candidacy-period-empty')
                      : t('common.optional')}
                  </Typography>
                }
              >
                {t('admin.subpages.election-management.bulk-dialog.steps.candidacy')}
              </StepLabel>
              <StepContent>
                <DateRangeInput
                  start={candidacyStart}
                  end={candidacyEnd}
                  setStart={setCandidacyStart}
                  setEnd={setCandidacyEnd}
                />
                <Box mt={3} display='flex' gap={1}>
                  <Button onClick={handleBack} color='inherit'>
                    {t('common.back')}
                  </Button>
                  <Button onClick={handleSkipCandidacy}>{t('common.skip')}</Button>
                  <Button onClick={handleNext} variant='contained' disabled={!validCandidacyDate}>
                    {t('common.next')}
                  </Button>
                </Box>
              </StepContent>
            </Step>
            <Step>
              <StepLabel
                optional={
                  <Typography variant='caption'>
                    {activeStep > 2 &&
                      t('admin.subpages.election-management.bulk-dialog.voting-period', {
                        start: votingStart,
                        end: votingEnd,
                        formatParams: { start: DATE_FORMAT, end: DATE_FORMAT },
                      })}
                  </Typography>
                }
              >
                {t('admin.subpages.election-management.bulk-dialog.steps.voting')}
              </StepLabel>
              <StepContent>
                <DateRangeInput
                  start={votingStart}
                  end={votingEnd}
                  setStart={setVotingStart}
                  setEnd={setVotingEnd}
                  minDate={candidacyEnd}
                />
                <Box mt={3} display='flex' gap={1}>
                  <Button onClick={handleBack} color='inherit'>
                    {t('common.back')}
                  </Button>
                  <Button onClick={handleNext} variant='contained' disabled={!validVotingDate}>
                    {t('common.next')}
                  </Button>
                </Box>
              </StepContent>
            </Step>
            <Step>
              <StepLabel
                optional={
                  <Typography variant='caption'>
                    {activeStep > 3 &&
                      t('admin.subpages.election-management.bulk-dialog.degrees-selected', {
                        count: selectedDegrees.size,
                      })}
                  </Typography>
                }
              >
                {t('admin.subpages.election-management.bulk-dialog.steps.degrees')}
              </StepLabel>
              <StepContent>
                <DegreeSelectionInput
                  degrees={sortedDegrees}
                  selected={selectedDegrees}
                  setSelected={setSelectedDegrees}
                />
                <Box mt={3} display='flex' gap={1}>
                  <Button onClick={handleBack} color='inherit'>
                    {t('common.back')}
                  </Button>
                  <Button
                    onClick={handleNext}
                    variant='contained'
                    disabled={selectedDegrees.size === 0}
                  >
                    {t('common.next')}
                  </Button>
                </Box>
              </StepContent>
            </Step>
            <Step>
              <StepLabel>
                {t('admin.subpages.election-management.bulk-dialog.steps.years')}
              </StepLabel>
              <StepContent>
                <Alert severity='info' variant='outlined' sx={{ my: 2 }}>
                  {t('admin.subpages.election-management.bulk-dialog.help.years')}
                </Alert>
                <YearSelectionInput
                  degrees={sortedDegrees}
                  selectedDegrees={selectedDegrees}
                  selectedYears={selectedYears}
                  setSelectedYears={setSelectedYears}
                  electionExists={electionExists}
                  round={round}
                />
                <Box mt={3} display='flex' gap={1}>
                  <Button onClick={handleBack} color='inherit'>
                    {t('common.back')}
                  </Button>
                  <Button
                    onClick={handleNext}
                    variant='contained'
                    disabled={!selectedYears.some((years) => years?.size > 0)}
                  >
                    {t('common.next')}
                  </Button>
                </Box>
              </StepContent>
            </Step>
            <Step>
              <StepLabel>
                {t('admin.subpages.election-management.bulk-dialog.steps.finish')}
              </StepLabel>
              <StepContent>
                {t('admin.subpages.election-management.bulk-dialog.finish')}
                <Box mt={3} display='flex' gap={1}>
                  <Button onClick={handleBack} color='inherit'>
                    {t('common.back')}
                  </Button>
                  <BulkCreateElectionsSubmitButton
                    candidacyStart={candidacyStart}
                    candidacyEnd={candidacyEnd}
                    votingStart={votingStart}
                    votingEnd={votingEnd}
                    round={round}
                    selectedYears={selectedYears}
                  />
                </Box>
              </StepContent>
            </Step>
          </Stepper>
        </Container>
      </DialogContent>
    </Dialog>
  );
}

export function ElectionsBulkAddSuccess() {
  const [open, setOpen] = useState(true);
  const navigate = useNavigate();
  const { t } = useTranslation();

  // Go back to home page after 5 seconds
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setOpen(false);
    }, 5000);

    return () => {
      clearTimeout(timeoutId);
    };
  }, []);

  return (
    <Dialog
      open={open}
      onClose={() => setOpen(false)}
      onTransitionExited={() => navigate('..')}
      fullScreen
    >
      <DialogTitle>
        <Toolbar sx={{ gap: 1 }}>
          <IconButton onClick={() => setOpen(false)}>
            <CloseRounded />
          </IconButton>
          {t('admin.subpages.election-management.bulk-dialog.title')}
        </Toolbar>
      </DialogTitle>
      <DialogContent>
        <Container>
          <Box display='flex' flexDirection='column' justifyContent='center' alignItems='center'>
            <Typography component='span' fontSize='10rem'>
              <VerifiedRounded fontSize='inherit' color='success' />
            </Typography>
            <Typography variant='h5' component='p'>
              {t('admin.subpages.election-management.bulk-dialog.success')}
            </Typography>
          </Box>
        </Container>
      </DialogContent>
    </Dialog>
  );
}

export default Elections;
