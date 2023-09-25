import { Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useLoaderData } from 'react-router-dom';
import { ElectionDto } from '../@types/api';
import { getUserElections } from '../api';
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
      <Typography>elections</Typography>
      {elections.map((election) => (
        <ElectionCard key={election.id} election={election} />
      ))}
    </>
  );
}

export function ElectionsError() {
  return <>TODO error</>;
}

export default Elections;
