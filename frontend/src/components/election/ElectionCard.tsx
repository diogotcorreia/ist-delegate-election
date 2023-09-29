import {
  Box,
  Button,
  Card,
  CardContent,
  Step,
  StepContent,
  StepLabel,
  Stepper,
  Typography,
} from '@mui/material';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ElectionDto, ElectionStatusDto } from '../../@types/api';
import useLocalizedString from '../../hooks/useLocalizedString';

const DATE_FORMAT = {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  hour: 'numeric',
  minute: 'numeric',
  second: 'numeric',
};

interface Props {
  election: ElectionDto;
  children?: React.ReactNode;
}

function ElectionCard({ election, children }: Props) {
  const { t } = useTranslation();
  const translateLs = useLocalizedString();

  return (
    <Card sx={{ my: 2 }}>
      <CardContent>
        <Box display='flex' justifyContent='space-between' gap={2} flexWrap='wrap'>
          <Box>
            <Typography variant='subtitle2' color='textSecondary'>
              {translateLs(election.degree?.degreeType || {})}
            </Typography>
            <Typography variant='h5'>{translateLs(election.degree?.name || {})}</Typography>
          </Box>
          <Box textAlign='right' flexGrow='1'>
            <Typography variant='subtitle2' color='textSecondary' component='p'>
              {t('election.round', {
                count: election.round,
                ordinal: true,
              })}
            </Typography>
            <Typography variant='subtitle1' component='p' gutterBottom>
              {election.curricularYear
                ? t('election.curricular-year', {
                    count: election.curricularYear,
                    ordinal: true,
                  })
                : t('election.curricular-year-none')}
            </Typography>
          </Box>
        </Box>

        {children}
      </CardContent>
    </Card>
  );
}

interface SummaryProps {
  election: ElectionDto;
}

export function ElectionSummary({ election }: SummaryProps) {
  const { t } = useTranslation();

  const activeStep = useMemo(() => {
    switch (String(election.status)) {
      case 'NOT_STARTED':
      default:
        return -1;
      case ElectionStatusDto.Candidacy:
        return 0;
      case ElectionStatusDto.Processing:
        return 1;
      case ElectionStatusDto.Voting:
        return election.candidacyPeriod ? 1 : 0;
      case ElectionStatusDto.Ended:
        return 3;
    }
  }, [election.status, election.candidacyPeriod]);

  return (
    <Box p={2}>
      <Stepper activeStep={activeStep} orientation='vertical'>
        {election.candidacyPeriod && (
          <Step completed={election.hasNominated}>
            <StepLabel
              optional={
                <Typography variant='caption'>
                  {t('election.candidacy-period.subtitle', {
                    start: new Date(election.candidacyPeriod.start),
                    end: new Date(election.candidacyPeriod.end),
                    formatParams: { start: DATE_FORMAT, end: DATE_FORMAT },
                  })}
                </Typography>
              }
            >
              {t('election.candidacy-period.title')}
            </StepLabel>
            <StepContent>
              {election.hasNominated ? (
                <Typography>{t('election.candidacy-period.has-nominated')}</Typography>
              ) : (
                <Button
                  component={Link}
                  to={`/elections/${election.id}/nominate`}
                  variant='contained'
                >
                  {t('election.candidacy-period.nominate-button')}
                </Button>
              )}
            </StepContent>
          </Step>
        )}
        {election.status === ElectionStatusDto.Processing && (
          <Step>
            <StepLabel>{t('election.validating-nominations')}</StepLabel>
          </Step>
        )}
        <Step completed={election.hasVoted}>
          <StepLabel
            optional={
              <Typography variant='caption'>
                {t('election.voting-period.subtitle', {
                  start: new Date(election.votingPeriod.start),
                  end: new Date(election.votingPeriod.end),
                  formatParams: { start: DATE_FORMAT, end: DATE_FORMAT },
                })}
              </Typography>
            }
          >
            {t('election.voting-period.title')}
          </StepLabel>
          <StepContent>
            {election.hasVoted ? (
              <Typography>{t('election.voting-period.has-voted')}</Typography>
            ) : (
              <Button component={Link} to={`/elections/${election.id}/vote`} variant='contained'>
                {t('election.voting-period.nominate-button')}
              </Button>
            )}
          </StepContent>
        </Step>
        <Step>
          <StepLabel>{t('election.completed')}</StepLabel>
        </Step>
      </Stepper>
    </Box>
  );
}

export default ElectionCard;
