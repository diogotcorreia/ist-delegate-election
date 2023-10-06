import { Container, Fade, LinearProgress } from '@mui/material';
import { useEffect } from 'react';
import { Outlet, redirect, useLoaderData, useNavigate, useNavigation } from 'react-router-dom';
import { AppConfigDto, AuthDto } from '../@types/api';
import { ApiError, getAppConfig, getWhoAmI, setupFirstAdmin } from '../api';
import Navbar from '../components/Navbar';

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
      <Navbar auth={auth} />
      <Outlet />
    </Container>
  );
}

export default Root;
