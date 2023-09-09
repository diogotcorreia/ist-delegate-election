import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLoaderData } from 'react-router-dom';
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
  const { t } = useTranslation();

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
    <div>
      {t('hello-world')} inside router {JSON.stringify(appConfig)} {JSON.stringify(user)}
    </div>
  );
}

export default Root;
