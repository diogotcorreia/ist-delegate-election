import { AddRounded } from '@mui/icons-material';
import {
  Box,
  Button,
  Container,
  Dialog,
  DialogContent,
  DialogTitle,
  Step,
  StepContent,
  StepLabel,
  Stepper,
  Typography,
} from '@mui/material';
import { Dayjs } from 'dayjs';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActionFunctionArgs,
  Form,
  Link,
  Outlet,
  redirect,
  useLoaderData,
  useNavigate,
  useOutletContext,
} from 'react-router-dom';
import { DegreeElectionsDto } from '../../@types/api';
import { bulkCreateElections, getDegrees } from '../../api';
import DegreeTypeElections from '../../components/admin/DegreeTypeElections';
import BulkCreateElectionsSubmitButton from '../../components/forms/BulkCreateElectionsSubmitButton';
import DegreeSelectionInput from '../../components/forms/DegreeSelectionInput';
import RangeInput from '../../components/forms/RangeInput';
import RoundInput from '../../components/forms/RoundInput';
import YearSelectionInput from '../../components/forms/YearSelectionInput';
import useSortAndGroupDegrees, { DegreeTypeAggregator } from '../../hooks/useSortAndGroupDegrees';

interface ElectionsData {
  degrees: DegreeElectionsDto[];
}

export async function loader(): Promise<ElectionsData> {
  const degrees = await getDegrees();

  return { degrees };
}

function Elections() {
  const { degrees } = useLoaderData() as ElectionsData;
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
      {sortedDegrees.map((aggregator) => (
        <DegreeTypeElections key={aggregator.degreeTypeHash} aggregator={aggregator} />
      ))}
      <Outlet context={{ sortedDegrees }} />
    </>
  );
}

export async function bulkAddAction({ request }: ActionFunctionArgs) {
  const payload = await request.json();

  await bulkCreateElections(payload);

  return redirect('..');
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

  return (
    <Dialog open onClose={closeDialog} fullScreen>
      <DialogTitle>{t('admin.subpages.election-management.bulk-dialog.title')}</DialogTitle>
      <DialogContent>
        <Form method='post'>
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
                  <RoundInput round={round} setRound={setRound} />

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
                          ? `dates ${candidacyStart} to ${candidacyEnd}`
                          : `no candidacy period`
                        : 'Optional'}
                    </Typography>
                  }
                >
                  {t('admin.subpages.election-management.bulk-dialog.steps.candidacy')}
                </StepLabel>
                <StepContent>
                  <RangeInput
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
                        (validVotingDate
                          ? `dates ${votingStart} to ${votingEnd}`
                          : `no voting period`)}
                    </Typography>
                  }
                >
                  {t('admin.subpages.election-management.bulk-dialog.steps.voting')}
                </StepLabel>
                <StepContent>
                  <RangeInput
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
                <StepLabel>
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
                  <YearSelectionInput
                    degrees={sortedDegrees}
                    selectedDegrees={selectedDegrees}
                    selectedYears={selectedYears}
                    setSelectedYears={setSelectedYears}
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
                  Finish :)
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
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default Elections;
