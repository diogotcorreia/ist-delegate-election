import { SentimentVeryDissatisfiedRounded } from '@mui/icons-material';
import { Box, Button, Typography } from '@mui/material';
import { Container } from '@mui/system';
import { useTranslation } from 'react-i18next';
import { isRouteErrorResponse, Link, useRouteError } from 'react-router-dom';
import { ApiError } from '../api';

function getErrorCode(error: unknown): string {
  if (error instanceof ApiError) {
    return error.getError().key;
  }
  if (isRouteErrorResponse(error)) {
    if (error.status === 404) {
      return 'error.not-found';
    }
  }
  return 'error.generic';
}

function RootErrorPage() {
  const error = useRouteError();
  const errorCode = getErrorCode(error);
  const { t } = useTranslation();

  return (
    <Container>
      <Box
        display='flex'
        flexDirection='column'
        justifyContent='center'
        alignItems='center'
        height='90vh'
      >
        <Typography component='span' fontSize='10rem' lineHeight='100%'>
          <SentimentVeryDissatisfiedRounded fontSize='inherit' color='error' />
        </Typography>
        <Typography variant='h4' component='p' gutterBottom>
          {t('error.page.title')}
        </Typography>
        <Typography variant='h5' component='p'>
          {t(errorCode)}
        </Typography>
        <Button component={Link} to='/' sx={{ mt: 4 }}>
          {t('error.page.home-button')}
        </Button>
      </Box>
    </Container>
  );
}

export default RootErrorPage;
