import { CheckRounded } from '@mui/icons-material';
import {
  Badge,
  Box,
  styled,
  ToggleButton,
  ToggleButtonGroup,
  ToggleButtonOwnProps,
} from '@mui/material';

interface Props extends ToggleButtonOwnProps {
  icon: React.ReactNode;
  text: React.ReactNode;
}

export const RadioCardGroup = styled(ToggleButtonGroup)(({ theme }) => ({
  display: 'flex',
  gap: theme.spacing(3),
  justifyContent: 'center',
  flexWrap: 'wrap',
}));

const StyledToggleButton = styled(ToggleButton)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  textTransform: 'none',
  margin: 1,
  boxSizing: 'content-box',
  '&.Mui-selected': {
    borderColor: theme.palette.primary.main,
    borderWidth: 2,
    backgroundColor: 'inherit',
    margin: 0,
  },
}));

function RadioCard({ icon, text, selected, ...props }: Props) {
  return (
    <Badge badgeContent={selected ? <CheckRounded fontSize='small' /> : null} color='primary'>
      <StyledToggleButton {...props} selected={selected} className=''>
        <Box component='span' fontSize='5rem' lineHeight='100%'>
          {icon}
        </Box>
        {text}
      </StyledToggleButton>
    </Badge>
  );
}

export default RadioCard;
