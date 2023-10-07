import { ExpandMoreRounded, HelpRounded } from '@mui/icons-material';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  alpha,
  Box,
  Card,
  CardContent,
  Chip,
  Divider,
  IconButton,
  PaletteMode,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
import Grid from '@mui/material/Unstable_Grid2';
import { Fragment, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ElectionDto, ElectionStatusDto } from '../../@types/api';
import useLocalizedString from '../../hooks/useLocalizedString';
import { DegreeTypeAggregator } from '../../hooks/useSortAndGroupDegrees';

const DATE_FORMAT = {
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
};

interface Props {
  aggregator: DegreeTypeAggregator;
  unverifiedNominationsCountByElection: Record<number, number>;
}

function DegreeTypeElections({ aggregator, unverifiedNominationsCountByElection }: Props) {
  const { degreeType, degreeElections } = aggregator;
  const { t } = useTranslation();
  const translateLs = useLocalizedString();

  const degreesWithElections = useMemo(
    () => degreeElections.filter((dElections) => dElections.elections.length > 0),
    [degreeElections]
  );
  const degreesWithoutElections = useMemo(
    () => degreeElections.filter((dElections) => dElections.elections.length === 0),
    [degreeElections]
  );

  const electionCount = useMemo(
    () => degreesWithElections.reduce((acc, dElections) => acc + dElections.elections.length, 0),
    [degreesWithElections]
  );
  const unverifiedNominationsCount = useMemo(
    () =>
      degreesWithElections
        .flatMap((dElections) => dElections.elections.map((election) => election.id))
        .reduce(
          (acc, electionId) => acc + (unverifiedNominationsCountByElection[electionId] ?? 0),
          0
        ),
    [degreesWithElections, unverifiedNominationsCountByElection]
  );

  return (
    <Accordion>
      <AccordionSummary
        expandIcon={<ExpandMoreRounded />}
        sx={{ display: 'flex', alignItems: 'center' }}
      >
        <span>{translateLs(degreeType)}</span>
        <Chip
          label={t('degree.count', { count: degreeElections.length })}
          size='small'
          sx={{ ml: 1 }}
        />
        {electionCount > 0 && (
          <Chip
            label={t('election.count', { count: electionCount })}
            size='small'
            sx={{ ml: 1 }}
            color='primary'
          />
        )}
        {unverifiedNominationsCount > 0 && (
          <Chip
            label={t('election.unverified-nominations-count', {
              count: unverifiedNominationsCount,
            })}
            size='small'
            sx={{ ml: 1 }}
            color='warning'
          />
        )}
      </AccordionSummary>
      <AccordionDetails>
        {degreesWithElections.map((dElections, i) => (
          <Fragment key={dElections.degree.acronym}>
            {i !== 0 && <Divider sx={{ mb: 1 }} />}
            <Typography variant='subtitle1' color='textSecondary' component='p'>
              {dElections.degree.acronym}
            </Typography>
            <Typography variant='h6' component='p' gutterBottom>
              {translateLs(dElections.degree.name)}
            </Typography>
            <Grid container sx={{ my: 2 }} spacing={2}>
              {dElections.elections.map((election) => (
                <ElectionCard
                  key={election.id}
                  election={election}
                  unverifiedNominations={unverifiedNominationsCountByElection[election.id] ?? 0}
                />
              ))}
            </Grid>
          </Fragment>
        ))}
        {degreesWithoutElections.length > 0 && (
          <Box display='flex' alignItems='center' justifyContent='center' sx={{ mt: 1 }}>
            <Typography color='textSecondary' sx={{ mr: 1 }}>
              {t('admin.degree-type-elections.empty', { count: degreesWithoutElections.length })}
            </Typography>
            <Tooltip
              title={
                <>
                  {degreesWithoutElections.map((dElections) => (
                    <Box key={dElections.degree.acronym}>
                      - {dElections.degree.acronym} - {translateLs(dElections.degree.name)}
                    </Box>
                  ))}
                </>
              }
            >
              <IconButton>
                <HelpRounded />
              </IconButton>
            </Tooltip>
          </Box>
        )}
      </AccordionDetails>
    </Accordion>
  );
}

const electionStatusChipColor: Record<
  PaletteMode,
  Record<ElectionStatusDto, string>
> = Object.freeze({
  light: {
    [ElectionStatusDto.Candidacy]: '#3A7676',
    [ElectionStatusDto.Ended]: '#612957',
    [ElectionStatusDto.NotStarted]: '#5C5747',
    [ElectionStatusDto.Processing]: '#AE4102',
    [ElectionStatusDto.Voting]: '#548119',
  },
  dark: {
    [ElectionStatusDto.Candidacy]: '#84C2C2',
    [ElectionStatusDto.Ended]: '#B34BA0',
    [ElectionStatusDto.NotStarted]: '#C1BDAE',
    [ElectionStatusDto.Processing]: '#FD8B49',
    [ElectionStatusDto.Voting]: '#99DA44',
  },
});

interface ElectionCardProps {
  election: ElectionDto;
  unverifiedNominations: number;
}

function ElectionCard({ election, unverifiedNominations }: ElectionCardProps) {
  const { t } = useTranslation();
  const theme = useTheme();

  const chipColor = electionStatusChipColor[theme.palette.mode][election.status];

  return (
    <Grid xs={12} sm={6} md={4}>
      <Card variant='outlined'>
        <CardContent>
          <Box display='flex' justifyContent='space-between' alignItems='flex-start' gap={1}>
            <Box>
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
            <Box display='flex' flexDirection='column' alignItems='flex-end' gap={1}>
              <Chip
                size='small'
                variant='outlined'
                sx={{
                  color: chipColor,
                  borderColor: alpha(chipColor, 0.7),
                  backgroundColor: alpha(chipColor, 0.05),
                }}
                label={t(`election.status.${election.status}`)}
              />
              {unverifiedNominations > 0 && (
                <Chip
                  size='small'
                  color='warning'
                  label={t('election.unverified-nominations-count', {
                    count: unverifiedNominations,
                  })}
                />
              )}
            </Box>
          </Box>
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
          <Typography variant='subtitle1'>{t('election.voting-period.title')}</Typography>
          <Typography variant='body2' gutterBottom>
            {t('election.voting-period.subtitle-short', {
              start: new Date(election.votingPeriod.start),
              end: new Date(election.votingPeriod.end),
              formatParams: { start: DATE_FORMAT, end: DATE_FORMAT },
            })}
          </Typography>
        </CardContent>
      </Card>
    </Grid>
  );
}

export default DegreeTypeElections;
