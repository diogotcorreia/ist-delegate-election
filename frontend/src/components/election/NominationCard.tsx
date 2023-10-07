import { Box, Paper, PaperOwnProps, styled, Typography } from '@mui/material';
import FenixAvatar from '../../components/fenix/FenixAvatar';

const NominationContainer = styled(Paper)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  padding: theme.spacing(2),
  marginTop: theme.spacing(1),
  marginBottom: theme.spacing(1),
  gap: theme.spacing(2),
  flexWrap: 'wrap',
}));

export interface NominationCardProps extends PaperOwnProps {
  username?: string;
  displayName: string;
  avatar?: React.ReactNode;
  children?: React.ReactNode;
}

function NominationCard({
  username,
  displayName,
  avatar,
  children,
  ...props
}: NominationCardProps) {
  return (
    <NominationContainer variant='outlined' {...props}>
      <Box display='flex' gap={2} flexGrow={1}>
        {avatar || (username && <FenixAvatar username={username} size={48} />)}
        <Box display='flex' flexDirection='column' justifyContent='center'>
          {username && (
            <Typography color='textSecondary' variant='body2'>
              {username}
            </Typography>
          )}
          <Typography variant='subtitle2'>{displayName}</Typography>
        </Box>
      </Box>
      <Box display='flex' gap={2} justifyContent='center' alignItems='center'>
        {children}
      </Box>
    </NominationContainer>
  );
}

export default NominationCard;