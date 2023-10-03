import { Box, Button, Container, Fade, LinearProgress, Typography } from '@mui/material';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Link,
  Outlet,
  redirect,
  useLoaderData,
  useLocation,
  useNavigate,
  useNavigation,
} from 'react-router-dom';
import { AppConfigDto, AuthDto } from '../@types/api';
import { ApiError, getAppConfig, getWhoAmI, setupFirstAdmin } from '../api';
import FenixAvatar from '../components/fenix/FenixAvatar';

export interface RootData {
  appConfig: AppConfigDto;
  auth: AuthDto;
}

export async function loader() {
  const appConfig = await getAppConfig();
  try {
    const auth = await getWhoAmI();

    return { appConfig, auth };
  } catch (e) {
    if (e instanceof ApiError && e.getError().key === 'error.unauthorized') {
      const { baseUrl, clientId, redirectUrl } = appConfig.fenix;
      return redirect(
        `${baseUrl}/oauth/userdialog?client_id=${encodeURIComponent(
          clientId
        )}&redirect_uri=${encodeURIComponent(redirectUrl)}`
      );
    }
    throw e;
  }
}

function Root() {
  const navigate = useNavigate();
  const navigation = useNavigation();
  const { appConfig, auth } = useLoaderData() as RootData;
  const { t } = useTranslation();
  const location = useLocation();

  const isAdminRoute = /^\/admin($|\/)/.test(location.pathname);

  // create first admin user
  useEffect(() => {
    if (!appConfig.isSetup) {
      setupFirstAdmin()
        .then(() => navigate('/'))
        .catch(console.error); // ignore errors
    }
  }, [appConfig.isSetup, navigate]);

  const loading = navigation.state === 'loading';

  return (
    <Container>
      <Fade
        in={loading}
        style={{
          transitionDelay: loading ? '800ms' : '0ms',
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
        }}
        unmountOnExit
      >
        <LinearProgress />
      </Fade>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          my: 4,
          flexWrap: 'wrap',
        }}
      >
        {auth.isAdmin && (
          <>
            {isAdminRoute ? (
              <Button component={Link} to='/'>
                {t('admin.back-home')}
              </Button>
            ) : (
              <Button component={Link} to='/admin'>
                {t('admin.page.title')}
              </Button>
            )}
            <Box sx={{ flexGrow: 1 }} />
          </>
        )}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
          <Typography sx={{ mr: 2 }} variant='h6' component='span' textAlign='right'>
            {auth.user.displayName}
          </Typography>
          <FenixAvatar username={auth.user.username || ''} size={40} />
        </Box>
      </Box>
      <Outlet />
    </Container>
  );
}

export default Root;
