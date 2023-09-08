import React from 'react';
import {
  createTheme,
  CssBaseline,
  responsiveFontSizes,
  ThemeOptions,
  ThemeProvider,
  useMediaQuery,
} from '@mui/material';
import { useTranslation } from 'react-i18next';

import './i18n';

function getThemeOptions(dark: boolean): ThemeOptions {
  return {
    palette: {
      mode: dark ? 'dark' : 'light',
      primary: {
        main: '#009de0',
      },
      secondary: {
        main: '#45555f',
      },
    },
  };
}

function App() {
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');

  const theme = React.useMemo(
    () => responsiveFontSizes(createTheme(getThemeOptions(prefersDarkMode))),
    [prefersDarkMode]
  );

  // TODO remove; just for testing
  const { t } = useTranslation();

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <h1>{t('hello-world')}</h1>
    </ThemeProvider>
  );
}

export default App;
