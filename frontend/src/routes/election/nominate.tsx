import { Avatar, Box, Button, Container, Typography } from '@mui/material';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Outlet, useLoaderData, useNavigate } from 'react-router-dom';
import { AppConfigDto, AuthDto } from '../../@types/api';
import { getAppConfig, getWhoAmI, setupFirstAdmin } from '../../api';

export interface RootData {
  appConfig: AppConfigDto;
  auth?: AuthDto;
}

export async function loader(): Promise<RootData> {
  const appConfig = await getAppConfig();
  const auth = await getWhoAmI().catch(() => undefined);

  return { appConfig, auth };
}

function Root() {
  const navigate = useNavigate();
  const { appConfig, auth } = useLoaderData() as RootData;
  const { t } = useTranslation();

  // redirect logged-out users to SSO
  useEffect(() => {
    if (!auth) {
      const { baseUrl, clientId, redirectUrl } = appConfig.fenix;
      window.location.href = `${baseUrl}/oauth/userdialog?client_id=${encodeURIComponent(
        clientId
      )}&redirect_uri=${encodeURIComponent(redirectUrl)}`;
    }
  }, [auth, appConfig.fenix]);

  // create first admin user
  useEffect(() => {
    if (auth && !appConfig.isSetup) {
      setupFirstAdmin()
        .then(() => navigate('/'))
        .catch(console.error); // ignore errors
    }
  }, [auth, appConfig.isSetup, navigate]);

  return (
    <Container>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', my: 4 }}>
        {auth?.isAdmin && (
          <>
            <Button>{t('admin.page.title')}</Button>
            <Box sx={{ flexGrow: 1 }} />
          </>
        )}
        <Typography sx={{ mr: 2 }} variant='h6' component='span'>
          {auth?.user.displayName}
        </Typography>
        <Avatar
          alt={auth?.user.username}
          src={`${appConfig.fenix.baseUrl}/user/photo/${encodeURIComponent(
            auth?.user.username ?? ''
          )}?s=64`}
        />
      </Box>
      <Outlet />
    </Container>
  );
}

export default Root;
