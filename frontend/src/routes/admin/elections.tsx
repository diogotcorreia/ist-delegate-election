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
  Form,
  Link,
  Outlet,
  redirect,
  useLoaderData,
  useNavigate,
  useOutletContext,
} from 'react-router-dom';
import { DegreeElectionsDto } from '../../@types/api';
import { getDegrees } from '../../api';
import DegreeTypeElections from '../../components/admin/DegreeTypeElections';
import DegreeSelectionInput from '../../components/forms/DegreeSelectionInput';
import RangeInput from '../../components/forms/RangeInput';
import RoundInput from '../../components/forms/RoundInput';
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
          Create elections
        </Button>
      </Box>
      {sortedDegrees.map((aggregator) => (
        <DegreeTypeElections key={aggregator.degreeTypeHash} aggregator={aggregator} />
      ))}
      <Outlet context={{ sortedDegrees }} />
    </>
  );
}

export function bulkAddAction() {
  // TODO
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
      <DialogTitle>Create bulk elections</DialogTitle>
      <DialogContent>
        <Form method='post'>
          <Container>
            <Stepper activeStep={activeStep} orientation='vertical'>
              <Step>
                <StepLabel
                  optional={
                    activeStep > 0 && (
                      <Typography variant='caption'>
                        {t('admin.degree-type-elections.election-round', {
                          ordinal: true,
                          count: round,
                        })}
                      </Typography>
                    )
                  }
                >
                  Choose Round
                </StepLabel>
                <StepContent>
                  <RoundInput round={round} setRound={setRound} />

                  <Box mt={3}>
                    <Button onClick={handleNext} variant='contained'>
                      Next
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
                  Choose Dates Candidacy
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
                      Back
                    </Button>
                    <Button onClick={handleSkipCandidacy}>Skip</Button>
                    <Button onClick={handleNext} variant='contained' disabled={!validCandidacyDate}>
                      Next
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
                  Choose Dates Voting
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
                      Back
                    </Button>
                    <Button onClick={handleNext} variant='contained' disabled={!validVotingDate}>
                      Next
                    </Button>
                  </Box>
                </StepContent>
              </Step>
              <Step>
                <StepLabel>Choose Degrees</StepLabel>
                <StepContent>
                  <DegreeSelectionInput
                    degrees={sortedDegrees}
                    selected={selectedDegrees}
                    setSelected={setSelectedDegrees}
                  />
                </StepContent>
              </Step>
              <Step>
                <StepLabel>Choose Years</StepLabel>
                <StepContent>Lorem ipsum</StepContent>
              </Step>
            </Stepper>
          </Container>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default Elections;
