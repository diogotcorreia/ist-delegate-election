import {
  Box,
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
}

function ElectionCard({ election }: Props) {
  const { t } = useTranslation();
  const translateLs = useLocalizedString();

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
  }, [election.status]);

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

        <Box p={2}>
          <Stepper activeStep={activeStep} orientation='vertical'>
            {election.candidacyPeriod && (
              <Step>
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
                <StepContent>nominate someone</StepContent>
              </Step>
            )}
            {election.status === ElectionStatusDto.Processing && (
              <Step>
                <StepLabel>{t('election.validating-nominations')}</StepLabel>
              </Step>
            )}
            <Step>
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
              <StepContent>vote for someone</StepContent>
            </Step>
            <Step>
              <StepLabel>{t('election.completed')}</StepLabel>
            </Step>
          </Stepper>
        </Box>
      </CardContent>
    </Card>
  );
}

export default ElectionCard;
