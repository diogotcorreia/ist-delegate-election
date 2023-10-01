import { CheckRounded, ClearRounded } from '@mui/icons-material';
import { Box, IconButton, Paper, styled, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useLoaderData } from 'react-router-dom';
import { ElectionWithUnverifedNominationsDto } from '../../@types/api';
import { getUnverifiedNominations } from '../../api';
import ElectionCard from '../../components/election/ElectionCard';
import FenixAvatar from '../../components/fenix/FenixAvatar';

interface BulkValidateNominationsData {
  elections: ElectionWithUnverifedNominationsDto[];
}

export async function loader(): Promise<BulkValidateNominationsData> {
  const elections = await getUnverifiedNominations();

  return { elections };
}

const NominationContainer = styled(Paper)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  padding: theme.spacing(2),
  marginTop: theme.spacing(1),
  marginBottom: theme.spacing(1),
  gap: theme.spacing(2),
  flexWrap: 'wrap',
}));

function BulkValidateNominations() {
  const { elections } = useLoaderData() as BulkValidateNominationsData;
  const { t } = useTranslation();

  return (
    <>
      <Typography variant='h2' gutterBottom>
        {t('admin.subpages.election-management.title')}
      </Typography>
      {elections.map((election) => (
        <ElectionCard key={election.id} election={election}>
          {election.nominations.map((nomination) => (
            <NominationContainer variant='outlined'>
              <Box display='flex' gap={2} flexGrow={1}>
                <FenixAvatar username={nomination.username} size={48} />
                <Box display='flex' flexDirection='column' justifyContent='center'>
                  <Typography color='textSecondary' variant='body2'>
                    {nomination.username}
                  </Typography>
                  <Typography variant='subtitle2'>{nomination.displayName}</Typography>
                </Box>
              </Box>
              <Box display='flex' gap={2} justifyContent='center'>
                <IconButton color='success'>
                  <CheckRounded />
                </IconButton>
                <IconButton color='error'>
                  <ClearRounded />
                </IconButton>
              </Box>
            </NominationContainer>
          ))}
        </ElectionCard>
      ))}
    </>
  );
}

export default BulkValidateNominations;
