import { AddRounded } from '@mui/icons-material';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from '@mui/material';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Link,
  Outlet,
  redirect,
  useLoaderData,
  useNavigate,
  useOutletContext,
} from 'react-router-dom';
import { DegreeElectionsDto } from '../../@types/api';
import { getDegrees } from '../../api';
import DegreeTypeElections from '../../components/admin/DegreeTypeElections';
import useSortAndGroupDegrees, { DegreeTypeAggregator } from '../../hooks/useSortAndGroupDegrees';

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
      <Box my={4} display='flex' flexDirection='row-reverse'>
        <Button component={Link} to='bulk-add' variant='contained' startIcon={<AddRounded />}>
          Create elections
        </Button>
      </Box>
      {sortedDegrees.map((aggregator) => (
        <DegreeTypeElections key={aggregator.degreeTypeHash} aggregator={aggregator} />
      ))}
      <Outlet context={{ sortedDegrees }} />
    </>
  );
}

export function bulkAddAction() {
  // TODO
  return redirect('..');
}

export function ElectionsBulkAdd() {
  const navigate = useNavigate();
  const { sortedDegrees } = useOutletContext<{ sortedDegrees: DegreeTypeAggregator[] }>();

  const closeDialog = useCallback(() => navigate('..'), [navigate]);

  return (
    <Dialog open onClose={closeDialog} fullWidth>
      <DialogTitle>Create bulk elections</DialogTitle>
      <DialogContent></DialogContent>
    </Dialog>
  );
}

export default Elections;
