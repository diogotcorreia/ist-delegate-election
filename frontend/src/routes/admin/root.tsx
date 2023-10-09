import {
  AdminPanelSettingsRounded,
  BallotRounded,
  ChevronRight,
  GroupRounded,
} from '@mui/icons-material';
import { Card, CardContent, Typography } from '@mui/material';
import Grid from '@mui/material/Unstable_Grid2';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

const subpages = [
  {
    title: 'admin.subpages.election-management.title',
    subtitle: 'admin.subpages.election-management.subtitle',
    icon: <BallotRounded fontSize='inherit' />,
    path: '/admin/elections',
  },
  {
    title: 'admin.subpages.admin-management.title',
    subtitle: 'admin.subpages.admin-management.subtitle',
    icon: <AdminPanelSettingsRounded fontSize='inherit' />,
    path: '/admin/admins',
  },
  {
    title: 'admin.subpages.user-degree-override-management.title',
    subtitle: 'admin.subpages.user-degree-override-management.subtitle',
    icon: <GroupRounded fontSize='inherit' />,
    path: '/admin/user-degree-overrides',
  },
];

function AdminRoot() {
  const { t } = useTranslation();

  return (
    <>
      <Typography variant='h2' gutterBottom>
        {t('admin.page.title')}
      </Typography>
      <Grid container spacing={2}>
        {subpages.map((subpage) => (
          <Grid xs={12} md={6} key={subpage.path}>
            <Card
              variant='outlined'
              component={Link}
              to={subpage.path}
              sx={{ display: 'block', textDecoration: 'none', height: '100%' }}
            >
              <CardContent sx={{ pl: 0, height: '100%' }}>
                <Grid container spacing={1} sx={{ height: '100%' }}>
                  <Grid
                    xs={3}
                    display='flex'
                    justifyContent='center'
                    alignItems='flex-start'
                    sx={{
                      fontSize: '4em',
                    }}
                  >
                    {subpage.icon}
                  </Grid>
                  <Grid xs={8}>
                    <Typography variant='h4'>{t(subpage.title)}</Typography>
                    <Typography variant='subtitle1'>{t(subpage.subtitle)}</Typography>
                  </Grid>
                  <Grid xs={1} display='flex' justifyContent='center' alignItems='center'>
                    <ChevronRight fontSize='large' />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </>
  );
}

export default AdminRoot;
