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
  ElectionsBulkAddSuccess,
  loader as adminElectionsLoader,
} from './routes/admin/elections';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import UserElections, { ElectionsError, loader as userElectionsLoader } from './routes/elections';
import UserSingleElectionRoot, {
  ElectionCardPage,
  loader as userSingleElectionLoader,
} from './routes/election/root';
import ElectionNominate, {
  action as electionNominateAction,
  ElectionNominateSuccess,
} from './routes/election/nominate';
import ElectionVote, {
  action as electionVoteAction,
  ElectionVoteSuccess,
  loader as electionVoteLoader,
} from './routes/election/vote';
import BulkValidateNominations, {
  action as bulkValidateNominationsAction,
  loader as bulkValidateNominationsLoader,
} from './routes/admin/bulk-validate-nominations';
import RootErrorPage from './routes/error';
import Logout, { loader as logoutLoader } from './routes/logout';
import AdminSingleElection, {
  action as adminSingleElectionAction,
  addNominationAction,
  AddNominationPage,
  loader as adminSingleElectionLoader,
} from './routes/admin/election';
import UserDegreeOverridesRoot, {
  action as userDegreeOverridesAction,
  loader as userDegreeOverridesLoader,
} from './routes/admin/user-degree-override/root';
import BulkAddUserDegreeOverrides, {
  action as bulkAddUserDegreeOverridesAction,
  loader as bulkAddUserDegreeOverridesLoader,
} from './routes/admin/user-degree-override/bulk-add';

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
    errorElement: <RootErrorPage />,
    children: [
      {
        index: true,
        loader: userElectionsLoader,
        element: <UserElections />,
        errorElement: <ElectionsError />,
      },
      {
        id: 'user-single-election',
        path: 'election/:electionId',
        loader: userSingleElectionLoader,
        element: <UserSingleElectionRoot />,
        children: [
          { index: true, element: <ElectionCardPage /> },
          { path: 'nominate', element: <ElectionNominate />, action: electionNominateAction },
          { path: 'nominate/success', element: <ElectionNominateSuccess /> },
          {
            path: 'vote',
            element: <ElectionVote />,
            loader: electionVoteLoader,
            action: electionVoteAction,
          },
          { path: 'vote/success', element: <ElectionVoteSuccess /> },
        ],
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
          { path: 'bulk-add/success', element: <ElectionsBulkAddSuccess /> },
        ],
      },
      {
        path: 'admin/election/:electionId',
        loader: adminSingleElectionLoader,
        action: adminSingleElectionAction,
        element: <AdminSingleElection />,
        children: [
          { path: 'add-nomination', element: <AddNominationPage />, action: addNominationAction },
        ],
      },
      {
        path: 'admin/bulk-validate-nominations',
        loader: bulkValidateNominationsLoader,
        action: bulkValidateNominationsAction,
        element: <BulkValidateNominations />,
      },
      {
        path: 'admin/user-degree-overrides',
        loader: userDegreeOverridesLoader,
        action: userDegreeOverridesAction,
        element: <UserDegreeOverridesRoot />,
      },
      {
        path: 'admin/user-degree-overrides/bulk-add',
        loader: bulkAddUserDegreeOverridesLoader,
        action: bulkAddUserDegreeOverridesAction,
        element: <BulkAddUserDegreeOverrides />,
      },
    ],
  },
  {
    path: '/login-callback',
    loader: loginCallbackLoader,
    element: <LoginCallback />,
    errorElement: <RootErrorPage />,
  },
  {
    path: '/logout',
    loader: logoutLoader,
    element: <Logout />,
    errorElement: <RootErrorPage />,
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
