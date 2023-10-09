import { AddRounded } from '@mui/icons-material';
import { Box, Button, CircularProgress, Typography } from '@mui/material';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Await, defer, Link, useLoaderData } from 'react-router-dom';
import { DegreeWithUserOverridesDto } from '../../../@types/api';
import { getUserDegreeOverrides } from '../../../api';

interface RootData {
  overrides: DegreeWithUserOverridesDto[];
}

export async function loader() {
  const overrides = getUserDegreeOverrides();

  return defer({ overrides });
}

function UserDegreeOverridesRoot() {
  const { overrides } = useLoaderData() as RootData;
  const { t } = useTranslation();

  return (
    <>
      <Typography variant='h2' gutterBottom>
        {t('admin.subpages.user-degree-override-management.title')}
      </Typography>
      <Box my={4} display='flex' flexDirection='row-reverse'>
        <Button component={Link} to='bulk-add' variant='contained' startIcon={<AddRounded />}>
          {t('admin.subpages.user-degree-override-management.assign-users-to-degree-button')}
        </Button>
      </Box>

      <React.Suspense fallback={<CircularProgress />}>
        <Await resolve={overrides} errorElement={<p>error</p>}>
          <p>TODO {JSON.stringify(overrides)}</p>
        </Await>
      </React.Suspense>
    </>
  );
}

export default UserDegreeOverridesRoot;
