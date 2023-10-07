import { Box, Button, Divider, IconButton, Menu, MenuItem, Typography } from '@mui/material';
import { Link, useLocation } from 'react-router-dom';
import { AuthDto } from '../@types/api';
import { useTranslation } from 'react-i18next';
import FenixAvatar from './fenix/FenixAvatar';
import { CheckRounded, TranslateRounded } from '@mui/icons-material';
import { useState } from 'react';

interface Props {
  auth: AuthDto;
}

function Navbar({ auth }: Props) {
  const { t } = useTranslation();
  const location = useLocation();

  const isAdminRoute = /^\/admin($|\/)/.test(location.pathname);

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'flex-end',
        alignItems: 'center',
        my: 4,
        flexWrap: 'wrap',
      }}
    >
      <LanguageSwitcher />
      {auth.isAdmin && (
        <>
          <Divider orientation='vertical' variant='middle' flexItem sx={{ mx: 1 }} />
          {isAdminRoute ? (
            <Button component={Link} to='/'>
              {t('admin.back-home')}
            </Button>
          ) : (
            <Button component={Link} to='/admin'>
              {t('admin.page.title')}
            </Button>
          )}
        </>
      )}
      <Box sx={{ flexGrow: 1 }} />
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
        <Typography sx={{ mr: 2 }} variant='h6' component='span' textAlign='right'>
          {auth.user.displayName}
        </Typography>
        <AccountAvatar username={auth.user.username} />
      </Box>
    </Box>
  );
}

function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  const changeLanguage = (language: string) => () => {
    i18n.changeLanguage(language);
    handleClose();
  };

  return (
    <>
      <IconButton onClick={handleClick}>
        <TranslateRounded />
      </IconButton>

      <Menu anchorEl={anchorEl} open={open} onClose={handleClose}>
        <LanguageItem changeLanguage={changeLanguage} name='🇵🇹 Português' lang='pt-PT' />
        <LanguageItem changeLanguage={changeLanguage} name='🇬🇧 English' lang='en-GB' />
      </Menu>
    </>
  );
}

interface LanguageItemProps {
  lang: string;
  name: string;
  changeLanguage: (language: string) => () => void;
}

function LanguageItem({ lang, name, changeLanguage }: LanguageItemProps) {
  const { i18n } = useTranslation();
  return (
    <MenuItem onClick={changeLanguage(lang)}>
      {name}
      {i18n.language === lang && <CheckRounded sx={{ ml: 1 }} />}
    </MenuItem>
  );
}

function AccountAvatar({ username }: { username: string }) {
  const { t } = useTranslation();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <>
      <IconButton onClick={handleClick}>
        <FenixAvatar username={username} size={40} />
      </IconButton>

      <Menu anchorEl={anchorEl} open={open} onClose={handleClose}>
        <MenuItem component={Link} to='/logout'>
          {t('navbar.logout-button')}
        </MenuItem>
      </Menu>
    </>
  );
}

export default Navbar;
