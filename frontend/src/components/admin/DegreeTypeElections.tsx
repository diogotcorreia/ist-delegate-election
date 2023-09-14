import { ExpandMoreRounded, HelpRounded } from '@mui/icons-material';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Card,
  CardContent,
  Chip,
  Divider,
  IconButton,
  Tooltip,
  Typography,
} from '@mui/material';
import Grid from '@mui/material/Unstable_Grid2';
import { Fragment, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ElectionDto } from '../../@types/api';
import useLocalizedString from '../../hooks/useLocalizedString';
import { DegreeTypeAggregator } from '../../hooks/useSortAndGroupDegrees';

interface Props {
  aggregator: DegreeTypeAggregator;
}

function DegreeTypeElections({ aggregator }: Props) {
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

  return (
    <Accordion defaultExpanded={degreesWithElections.length > 0}>
      <AccordionSummary expandIcon={<ExpandMoreRounded />}>
        {translateLs(degreeType)}
        <Chip label={degreeElections.length} />
      </AccordionSummary>
      <AccordionDetails>
        {degreesWithElections.map((dElections) => (
          <Fragment key={dElections.degree.acronym}>
            <Typography variant='subtitle1' color='textSecondary' component='p'>
              {dElections.degree.acronym}
            </Typography>
            <Typography variant='h6' component='p' gutterBottom>
              {translateLs(dElections.degree.name)}
            </Typography>
            <Grid container sx={{ my: 2 }} spacing={2}>
              {dElections.elections.map((election) => (
                <ElectionCard key={election.id} election={election} />
              ))}
            </Grid>
            <Divider />
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

function ElectionCard({ election }: { election: ElectionDto }) {
  const { t } = useTranslation();

  return (
    <Grid xs={12} sm={6} md={4}>
      <Card variant='outlined'>
        <CardContent>
          <Typography variant='subtitle2' color='textSecondary' component='p'>
            {t('admin.degree-type-elections.election-round', {
              count: election.round,
              ordinal: true,
            })}
          </Typography>
          <Typography variant='subtitle1' component='p' gutterBottom>
            {election.curricularYear === undefined
              ? t('admin.degree-type-elections.election-curricular-year-none')
              : t('admin.degree-type-elections.election-curricular-year', {
                  count: election.curricularYear,
                  ordinal: true,
                })}
          </Typography>
        </CardContent>
      </Card>
    </Grid>
  );
}

export default DegreeTypeElections;
