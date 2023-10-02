import { ArrowBackRounded, CheckRounded, ClearRounded, VerifiedRounded } from '@mui/icons-material';
import { Box, Button, IconButton, Paper, styled, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { ActionFunctionArgs, Form, Link, useLoaderData } from 'react-router-dom';
import { ElectionWithUnverifedNominationsDto } from '../../@types/api';
import { editNomination, getUnverifiedNominations } from '../../api';
import ElectionCard from '../../components/election/ElectionCard';
import FenixAvatar from '../../components/fenix/FenixAvatar';

interface BulkValidateNominationsData {
  elections: ElectionWithUnverifedNominationsDto[];
}

export async function loader(): Promise<BulkValidateNominationsData> {
  const elections = await getUnverifiedNominations();

  return { elections };
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
      <Box mb={2}>
        <Button
          component={Link}
          to='/admin/elections'
          startIcon={<ArrowBackRounded />}
          color='inherit'
        >
          {t('admin.subpages.bulk-validate-nominations.back')}
        </Button>
      </Box>
      <Typography variant='h2' gutterBottom>
        {t('admin.subpages.bulk-validate-nominations.title')}
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
                <Form method='post'>
                  <input type='hidden' name='electionId' value={election.id} />
                  <input type='hidden' name='username' value={nomination.username} />
                  <IconButton color='success' type='submit' name='valid' value='true'>
                    <CheckRounded />
                  </IconButton>
                  <IconButton color='error' type='submit' name='valid' value='false'>
                    <ClearRounded />
                  </IconButton>
                </Form>
              </Box>
            </NominationContainer>
          ))}
        </ElectionCard>
      ))}
      {elections.length === 0 && (
        <Box display='flex' flexDirection='column' justifyContent='center' alignItems='center'>
          <Typography component='span' fontSize='10rem'>
            <VerifiedRounded fontSize='inherit' color='success' />
          </Typography>
          <Typography variant='h5' component='p' gutterBottom>
            {t('admin.subpages.bulk-validate-nominations.empty')}
          </Typography>
          <Button component={Link} to='/admin/elections' variant='contained'>
            {t('admin.subpages.bulk-validate-nominations.back')}
          </Button>
        </Box>
      )}
    </>
  );
}

export default BulkValidateNominations;
