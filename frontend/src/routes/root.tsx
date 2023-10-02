import { Box, Button, Container, Typography } from '@mui/material';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Outlet, redirect, useLoaderData, useNavigate } from 'react-router-dom';
import { AppConfigDto, AuthDto } from '../@types/api';
import { getAppConfig, getWhoAmI, setupFirstAdmin } from '../api';
import FenixAvatar from '../components/fenix/FenixAvatar';

export interface RootData {
  appConfig: AppConfigDto;
  auth: AuthDto;
}

export async function loader() {
  const appConfig = await getAppConfig();
  const auth = await getWhoAmI().catch(() => undefined);

  if (!auth) {
    const { baseUrl, clientId, redirectUrl } = appConfig.fenix;
    return redirect(`${baseUrl}/oauth/userdialog?client_id=${encodeURIComponent(
      clientId
    )}&redirect_uri=${encodeURIComponent(redirectUrl)}`);
  }

  return { appConfig, auth };
}

function Root() {
  const navigate = useNavigate();
  const { appConfig, auth } = useLoaderData() as RootData;
  const { t } = useTranslation();

  // create first admin user
  useEffect(() => {
    if (!appConfig.isSetup) {
      setupFirstAdmin()
        .then(() => navigate('/'))
        .catch(console.error); // ignore errors
    }
  }, [appConfig.isSetup, navigate]);

  return (
    <Container>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', my: 4 }}>
        {auth.isAdmin && (
          <>
            <Button>{t('admin.page.title')}</Button>
            <Box sx={{ flexGrow: 1 }} />
          </>
        )}
        <Typography sx={{ mr: 2 }} variant='h6' component='span'>
          {auth.user.displayName}
        </Typography>
        <FenixAvatar username={auth.user.username || ''} size={40} />
      </Box>
      <Outlet />
    </Container>
  );
}

export default Root;
