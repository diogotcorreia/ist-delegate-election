import { ChecklistRounded } from '@mui/icons-material';
import { Alert, Card, CardContent, Typography } from '@mui/material';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useLoaderData, useRouteError } from 'react-router-dom';
import { ElectionDto } from '../@types/api';
import { ApiError, getUserElections } from '../api';
import ElectionCard from '../components/election/ElectionCard';

export interface ElectionsData {
  elections: ElectionDto[];
}

export async function loader(): Promise<ElectionsData> {
  const elections = await getUserElections();

  return { elections };
}

function Elections() {
  const { elections } = useLoaderData() as ElectionsData;
  const { t } = useTranslation();

  return (
    <>
      <Typography variant='h3'>{t('dashboard.elections.title')}</Typography>
      {elections.map((election) => (
        <ElectionCard key={election.id} election={election} />
      ))}
      {elections.length === 0 && (
        <Card sx={{ my: 2 }} variant='outlined'>
          <CardContent
            sx={{
              p: 4,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              gap: 1,
            }}
          >
            <Typography variant='h1' component='p'>
              <ChecklistRounded fontSize='inherit' />
            </Typography>
            <Typography variant='h5'>{t('dashboard.elections.empty')}</Typography>
          </CardContent>
        </Card>
      )}
    </>
  );
}

export function ElectionsError() {
  const { t } = useTranslation();
  const error = useRouteError();

  const errorKey = useMemo(() => {
    if (error instanceof ApiError) {
      return error.getError().key;
    }
    return 'error.unknown';
  }, [error]);

  return <Alert severity='error'>{t(errorKey)}</Alert>;
}

export default Elections;
