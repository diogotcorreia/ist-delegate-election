import { Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { Outlet, useLoaderData } from 'react-router-dom';
import { DegreeElectionsDto } from '../../@types/api';
import { getDegrees } from '../../api';
import DegreeTypeElections from '../../components/admin/DegreeTypeElections';
import useSortAndGroupDegrees from '../../hooks/useSortAndGroupDegrees';

interface ElectionsData {
  degrees: DegreeElectionsDto[];
}

export async function loader(): Promise<ElectionsData> {
  const degrees = await getDegrees();

  return { degrees };
}

function Elections() {
  const { degrees } = useLoaderData() as ElectionsData;
  const { t } = useTranslation();
  const sortedDegrees = useSortAndGroupDegrees(degrees);

  return (
    <>
      <Typography variant='h2' gutterBottom>
        {t('admin.subpages.election-management.title')}
      </Typography>
      {sortedDegrees.map((aggregator) => (
        <DegreeTypeElections key={aggregator.degreeTypeHash} aggregator={aggregator} />
      ))}
      <Outlet />
    </>
  );
}

export default Elections;
