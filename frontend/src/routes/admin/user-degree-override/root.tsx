import { AddRounded, DeleteRounded } from '@mui/icons-material';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  IconButton,
  LinearProgress,
  Paper,
  Typography,
} from '@mui/material';
import Grid from '@mui/material/Unstable_Grid2';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActionFunctionArgs,
  Await,
  defer,
  Form,
  Link,
  useAsyncValue,
  useLoaderData,
} from 'react-router-dom';
import { DegreeWithUserOverridesDto } from '../../../@types/api';
import { deleteUserDegreeOverrides, getUserDegreeOverrides } from '../../../api';
import useLocalizedString from '../../../hooks/useLocalizedString';

interface RootData {
  overrides: DegreeWithUserOverridesDto[];
}

export async function loader() {
  const overrides = getUserDegreeOverrides();

  return defer({ overrides });
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();

  const degreeId = formData.get('degreeId')?.toString() || '';
  const users = formData.getAll('usernames');

  const payload = {
    degreeId,
    usernames: users.map((user) => user.toString()),
  };
  await deleteUserDegreeOverrides(payload);

  return null;
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

      <React.Suspense fallback={<LinearProgress />}>
        <Await resolve={overrides} errorElement={<p>error</p>}>
          <OverridesList />
        </Await>
      </React.Suspense>
    </>
  );
}

function OverridesList() {
  const overrides = useAsyncValue() as DegreeWithUserOverridesDto[];
  const translateLs = useLocalizedString();
  const { t } = useTranslation();

  const sortedOverrides = useMemo(
    () =>
      [...overrides].sort((a, b) => {
        const cmpType = translateLs(a.degree?.degreeType || {}).localeCompare(
          translateLs(b.degree?.degreeType || {})
        );
        if (cmpType !== 0) {
          return cmpType;
        }
        return translateLs(a.degree?.name || {}).localeCompare(translateLs(b.degree?.name || {}));
      }),
    [overrides, translateLs]
  );

  return (
    <>
      {sortedOverrides.map((degreeOverride) => (
        <Accordion key={degreeOverride.degree?.id}>
          <AccordionSummary>
            {`${translateLs(degreeOverride.degree?.degreeType || {})} - ${translateLs(
              degreeOverride.degree?.name || {}
            )} [${degreeOverride.degree?.acronym}]`}
          </AccordionSummary>
          <AccordionDetails>
            <Box display='flex' justifyContent='flex-end' mb={2}>
              <Form method='DELETE'>
                <input type='hidden' name='degreeId' value={degreeOverride.degree?.id} />
                {degreeOverride.users.map((user) => (
                  <input key={user.username} type='hidden' name='usernames' value={user.username} />
                ))}
                <Button
                  type='submit'
                  startIcon={<DeleteRounded />}
                  variant='outlined'
                  color='error'
                >
                  {t('admin.subpages.user-degree-override-management.delete-all')}
                </Button>
              </Form>
            </Box>
            <Form method='DELETE'>
              <input type='hidden' name='degreeId' value={degreeOverride.degree?.id} />
              <Grid container spacing={2}>
                {degreeOverride.users.map((user) => (
                  <Grid key={user.username} xs={12} sm={6} md={4} lg={2}>
                    <Paper
                      sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}
                      variant='outlined'
                    >
                      <Box flexGrow={1}>
                        <Typography>{user.username}</Typography>
                        <Typography color='textSecondary'>
                          {t('election.curricular-year', {
                            count: user.curricularYear,
                            ordinal: true,
                          })}
                        </Typography>
                      </Box>
                      <IconButton type='submit' name='usernames' value={user.username}>
                        <DeleteRounded />
                      </IconButton>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </Form>
          </AccordionDetails>
        </Accordion>
      ))}
    </>
  );
}

export default UserDegreeOverridesRoot;
