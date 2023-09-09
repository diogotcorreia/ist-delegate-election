import { ErrorOutline } from '@mui/icons-material';
import { Box, Button, CircularProgress, Typography } from '@mui/material';
import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Await,
  defer,
  Link,
  LoaderFunctionArgs,
  Navigate,
  redirect,
  useLoaderData,
} from 'react-router-dom';
import { AuthDto } from '../@types/api';
import { login } from '../api';

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');

  if (!code) {
    return redirect('/');
  }

  return defer({ user: login({ code }) });
}

function LoginCallback() {
  const { user } = useLoaderData() as { user: AuthDto };

  return (
    <Box
      sx={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <React.Suspense fallback={<Loading />}>
        <Await resolve={user} errorElement={<Error />}>
          <Navigate to='/' replace={true} />
        </Await>
      </React.Suspense>
    </Box>
  );
}

function Loading() {
  const { t } = useTranslation();
  return (
    <>
      <CircularProgress size={100} />
      <Typography sx={{ mt: 4 }}>{t('login.loading')}</Typography>
    </>
  );
}

function Error() {
  const { t } = useTranslation();
  return (
    <>
      <ErrorOutline fontSize='large' />
      <Typography sx={{ mt: 4 }}>{t('login.error.description')}</Typography>
      <Button component={Link} to='/' sx={{ mt: 4 }}>
        {t('login.error.button')}
      </Button>
    </>
  );
}

export default LoginCallback;
