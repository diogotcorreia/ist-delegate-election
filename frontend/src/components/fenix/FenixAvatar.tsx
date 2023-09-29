import { Avatar, AvatarOwnProps } from '@mui/material';
import { useRouteLoaderData } from 'react-router-dom';
import { RootData } from '../../routes/root';

interface Props extends AvatarOwnProps {
  username: string;
  size: number;
}

function FenixAvatar({ username, size, ...props }: Props) {
  const { appConfig } = useRouteLoaderData('root') as RootData;

  return (
    <Avatar
      alt={username}
      src={`${appConfig.fenix.baseUrl}/user/photo/${encodeURIComponent(username)}?s=${size}`}
      sx={{ width: size, height: size }}
      {...props}
    />
  );
}

export default FenixAvatar;
