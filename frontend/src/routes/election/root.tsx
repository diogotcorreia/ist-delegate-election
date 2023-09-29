import { ArrowBackRounded } from '@mui/icons-material';
import { Box, Button } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { Link, LoaderFunctionArgs, Outlet, useRouteLoaderData } from 'react-router-dom';
import { ElectionDto } from '../../@types/api';
import { getElection } from '../../api';
import ElectionCard from '../../components/election/ElectionCard';

export interface RootData {
  election: ElectionDto;
}

export async function loader({ params }: LoaderFunctionArgs): Promise<RootData> {
  const election = await getElection(parseInt(params.electionId || '', 10));

  return { election };
}

function UserSingleElectionRoot() {
  const { t } = useTranslation();

  return (
    <>
      <Box>
        <Button component={Link} to='..' startIcon={<ArrowBackRounded />} color='inherit'>
          {t('navigation.back-home')}
        </Button>
      </Box>
      <Outlet />
    </>
  );
}

export function ElectionCardPage() {
  const { election } = useRouteLoaderData('user-single-election') as RootData;

  return <ElectionCard election={election} />;
}

export default UserSingleElectionRoot;
