import { Box, Paper, PaperOwnProps, styled, Typography } from '@mui/material';
import { Form } from 'react-router-dom';
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
  chip?: React.ReactNode;
  children?: React.ReactNode;
}

function NominationCard({
  username,
  displayName,
  avatar,
  chip,
  children,
  ...props
}: NominationCardProps) {
  return (
    <NominationContainer variant='outlined' {...props}>
      <Box display='flex' gap={2} flexGrow={1}>
        {avatar || (username && <FenixAvatar username={username} size={48} />)}
        <Box display='flex' flexDirection='column' justifyContent='center'>
          <Box display='flex' justifyContent='flex-start' alignItems='center' gap={1}>
            {username && (
              <Typography color='textSecondary' variant='body2'>
                {username}
              </Typography>
            )}
            {chip}
          </Box>
          <Typography variant='subtitle2'>{displayName}</Typography>
        </Box>
      </Box>
      <Box display='flex' gap={2} justifyContent='center' alignItems='center'>
        {children}
      </Box>
    </NominationContainer>
  );
}

interface EditNominationFormProps {
  electionId: number;
  username: string;
  children?: React.ReactNode;
}

export function EditNominationForm({ children, electionId, username }: EditNominationFormProps) {
  return (
    <Form method='post'>
      <input type='hidden' name='electionId' value={electionId} />
      <input type='hidden' name='username' value={username} />
      {children}
    </Form>
  );
}

export default NominationCard;
