import { Box, Button, Typography } from '@mui/material';
import { Link } from 'react-router-dom';
import { logout } from '../api';

export async function loader() {
  await logout();

  return {};
}

function Logout() {
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
      <Typography variant='h4'>logged out</Typography>

      <Button component={Link} to='/'>
        login again
      </Button>
    </Box>
  );
}

export default Logout;
