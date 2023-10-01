import {
  Typography,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import {
  useLoaderData,
} from 'react-router-dom';
import { ElectionWithUnverifedNominationsDto } from '../../@types/api';
import { getUnverifiedNominations } from '../../api';
import ElectionCard from '../../components/election/ElectionCard';

interface BulkValidateNominationsData {
  elections: ElectionWithUnverifedNominationsDto[];
}

export async function loader(): Promise<BulkValidateNominationsData> {
  const elections = await getUnverifiedNominations();

  return {elections};
}

function BulkValidateNominations() {
  const {elections} = useLoaderData() as BulkValidateNominationsData;
  const { t } = useTranslation();

  return (
    <>
      <Typography variant='h2' gutterBottom>
        {t('admin.subpages.election-management.title')}
      </Typography>
      {elections.map(election => (
      <ElectionCard key={election.id} election={election}>
        {election.nominations.length}
      </ElectionCard>
      ))}
    </>
  );
}

export default BulkValidateNominations;
