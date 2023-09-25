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
import AdminRoot from './routes/admin/root';
import Admins, {
  addAction as addAdminAction,
  AdminsAdd,
  AdminsRemove,
  loader as adminsLoader,
  removeAction as removeAdminAction,
} from './routes/admin/admins';
import AdminElections, {
  bulkAddAction as bulkAddElectionAction,
  ElectionsBulkAdd,
  loader as adminElectionsLoader,
} from './routes/admin/elections';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import UserElections, { ElectionsError, loader as userElectionsLoader } from './routes/elections';

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
    id: 'root',
    path: '/',
    loader: rootLoader,
    element: <Root />,
    children: [
      {
        index: true,
        loader: userElectionsLoader,
        element: <UserElections />,
        errorElement: <ElectionsError />,
      },
      { path: 'admin', element: <AdminRoot /> },
      {
        path: 'admin/admins',
        loader: adminsLoader,
        element: <Admins />,
        children: [
          { path: 'add', element: <AdminsAdd />, action: addAdminAction },
          { path: 'remove/:username', element: <AdminsRemove />, action: removeAdminAction },
        ],
      },
      {
        path: 'admin/elections',
        loader: adminElectionsLoader,
        element: <AdminElections />,
        children: [
          { path: 'bulk-add', element: <ElectionsBulkAdd />, action: bulkAddElectionAction },
        ],
      },
    ],
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
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <CssBaseline />
        <RouterProvider router={router} />
      </LocalizationProvider>
    </ThemeProvider>
  );
}

export default App;
