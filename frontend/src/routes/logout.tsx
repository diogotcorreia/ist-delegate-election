import { Box, Button, Container, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { logout } from '../api';

export async function loader() {
  await logout();

  return {};
}

function Logout() {
  const { t } = useTranslation();

  return (
    <Container>
      <Box
        sx={{
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Typography variant='h4' sx={{ mb: 4 }}>
          {t('logout.success')}
        </Typography>

        <Button component={Link} to='/'>
          {t('logout.login-button')}
        </Button>
      </Box>
    </Container>
  );
}

export default Logout;
