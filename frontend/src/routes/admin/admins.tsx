import { AddRounded } from '@mui/icons-material';
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import Grid from '@mui/material/Unstable_Grid2';
import { useCallback } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import {
  ActionFunctionArgs,
  Form,
  Link,
  Outlet,
  redirect,
  useLoaderData,
  useNavigate,
  useParams,
  useRouteLoaderData,
} from 'react-router-dom';
import { AdminDto } from '../../@types/api';
import { addAdmin, getAdmins, removeAdmin } from '../../api';
import FenixAvatar from '../../components/fenix/FenixAvatar';
import { RootData } from '../root';

interface AdminsData {
  admins: AdminDto[];
}

export async function loader(): Promise<AdminsData> {
  const admins = await getAdmins();

  return { admins };
}

function Admins() {
  const { auth } = useRouteLoaderData('root') as RootData;
  const { admins } = useLoaderData() as AdminsData;
  const { t } = useTranslation();

  return (
    <>
      <Typography variant='h2' gutterBottom>
        {t('admin.subpages.admin-management.title')}
      </Typography>
      <Grid container spacing={2}>
        {admins.map((admin) => (
          <Grid key={admin.username} xs={12} md={4}>
            <Card sx={{ height: '100%' }}>
              <CardContent
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'flex-start',
                  alignItems: 'center',
                }}
              >
                <FenixAvatar username={admin.username} size={128} />
                <Typography variant='h6' component='span' sx={{ my: 2 }}>
                  {admin.username}
                  {admin.username === auth.user.username && (
                    <Chip
                      sx={{ ml: 1 }}
                      color='primary'
                      label={t('admin.subpages.admin-management.you')}
                    />
                  )}
                </Typography>
                <Typography variant='subtitle1' component='span'>
                  <Trans
                    i18nKey='admin.subpages.admin-management.since'
                    values={{ dateAdded: new Date(admin.dateAdded) }}
                    components={{
                      tooltip: (
                        <Tooltip title={admin.dateAdded}>
                          <span />
                        </Tooltip>
                      ),
                      time: <time dateTime={admin.dateAdded} />,
                    }}
                  />
                </Typography>
              </CardContent>
              <CardActions>
                <Button
                  component={Link}
                  to={`remove/${encodeURIComponent(admin.username)}`}
                  color='error'
                  disabled={admins.length < 2 || admin.username === auth.user.username}
                >
                  {t('admin.subpages.admin-management.remove-button')}
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
        <Grid xs={12} md={4}>
          <Card
            component={Link}
            to='add'
            variant='outlined'
            sx={{ display: 'block', textDecoration: 'none', height: '100%' }}
          >
            <CardContent
              sx={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100%',
              }}
            >
              <Box sx={{ fontSize: '5em' }}>
                <AddRounded fontSize='inherit' />
              </Box>
              <Typography variant='h6' component='span'>
                {t('admin.subpages.admin-management.add-button')}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      <Outlet />
    </>
  );
}

export async function addAction({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const username = formData.get('username')?.toString() ?? '';

  await addAdmin({ username });

  return redirect('..');
}

export function AdminsAdd() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const closeDialog = useCallback(() => navigate('..'), [navigate]);

  return (
    <Dialog open onClose={closeDialog} fullWidth>
      <Form method='post'>
        <DialogTitle>{t('admin.subpages.admin-management.add-dialog.title')}</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 3 }}>
            {t('admin.subpages.admin-management.add-dialog.description')}
          </DialogContentText>
          <TextField
            autoFocus
            variant='outlined'
            id='username'
            name='username'
            label={t('admin.subpages.admin-management.add-dialog.username-label')}
            type='text'
            fullWidth
            placeholder={t('admin.subpages.admin-management.add-dialog.username-placeholder')}
          />
        </DialogContent>
        <DialogActions>
          <Button component={Link} to='..'>
            {t('admin.subpages.admin-management.add-dialog.cancel-button')}
          </Button>
          <Button type='submit'>
            {t('admin.subpages.admin-management.add-dialog.add-button')}
          </Button>
        </DialogActions>
      </Form>
    </Dialog>
  );
}

export async function removeAction({ params }: ActionFunctionArgs) {
  const username = params.username ?? '';

  await removeAdmin(username);

  return redirect('..');
}

export function AdminsRemove() {
  const { username } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const closeDialog = useCallback(() => navigate('..'), [navigate]);

  return (
    <Dialog open onClose={closeDialog} fullWidth>
      <Form method='delete'>
        <DialogTitle>
          {t('admin.subpages.admin-management.remove-dialog.title', { username })}
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 3 }}>
            {t('admin.subpages.admin-management.remove-dialog.description')}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button component={Link} to='..'>
            {t('admin.subpages.admin-management.remove-dialog.cancel-button')}
          </Button>
          <Button type='submit' color='error'>
            {t('admin.subpages.admin-management.remove-dialog.remove-button')}
          </Button>
        </DialogActions>
      </Form>
    </Dialog>
  );
}

export default Admins;
