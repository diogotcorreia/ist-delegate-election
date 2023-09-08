import { useTranslation } from 'react-i18next';

function Root() {
  const { t } = useTranslation();
  return <div>{t('hello-world')} inside router</div>;
}

export default Root;
