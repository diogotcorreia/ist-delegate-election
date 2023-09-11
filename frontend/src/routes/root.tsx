import { Avatar, Box, Container, Typography } from '@mui/material';
import { useEffect } from 'react';
import { Outlet, useLoaderData } from 'react-router-dom';
import { AppConfigDto, AuthDto } from '../@types/api';
import { getAppConfig, getWhoAmI } from '../api';

interface RootData {
  appConfig: AppConfigDto;
  user?: AuthDto;
}

export async function loader(): Promise<RootData> {
  const appConfig = await getAppConfig();
  const user = await getWhoAmI().catch(() => undefined);

  return { appConfig, user };
}

function Root() {
  const { appConfig, user } = useLoaderData() as RootData;

  // redirect logged-out users to SSO
  useEffect(() => {
    if (!user) {
      const { baseUrl, clientId, redirectUrl } = appConfig.fenix;
      window.location.href = `${baseUrl}/oauth/userdialog?client_id=${encodeURIComponent(
        clientId
      )}&redirect_uri=${encodeURIComponent(redirectUrl)}`;
    }
  }, [user, appConfig.fenix]);

  // create first admin user
  useEffect(() => {
    if (user && !appConfig.isSetup) {
      // TODO
    }
  }, [user, appConfig.isSetup]);

  return (
    <Container>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', my: 4 }}>
        <Typography sx={{ mr: 2 }} variant='h6' component='span'>
          {user?.displayName}
        </Typography>
        <Avatar
          alt={user?.username}
          src={`${appConfig.fenix.baseUrl}/user/photo/${user?.username}?s=64`}
        />
      </Box>
      <Outlet />
    </Container>
  );
}

export default Root;
