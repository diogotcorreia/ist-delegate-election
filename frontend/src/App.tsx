import React from 'react';
import {
  createTheme,
  CssBaseline,
  responsiveFontSizes,
  ThemeOptions,
  ThemeProvider,
  useMediaQuery,
} from '@mui/material';

import './i18n';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import Root, { loader as rootLoader } from './routes/root';
import LoginCallback, { loader as loginCallbackLoader } from './routes/login';

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

const router = createBrowserRouter([
  {
    path: '/',
    loader: rootLoader,
    element: <Root />,
  },
  {
    path: '/login-callback',
    loader: loginCallbackLoader,
    element: <LoginCallback />,
  },
]);

function App() {
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');

  const theme = React.useMemo(
    () => responsiveFontSizes(createTheme(getThemeOptions(prefersDarkMode))),
    [prefersDarkMode]
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <RouterProvider router={router} />
    </ThemeProvider>
  );
}

export default App;
