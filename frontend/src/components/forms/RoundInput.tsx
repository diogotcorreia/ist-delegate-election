import { AddRounded, RemoveRounded } from '@mui/icons-material';
import { Box, IconButton, TextField } from '@mui/material';
import { Dispatch, SetStateAction, useCallback } from 'react';

interface RoundInputProps {
  round: number;
  setRound: Dispatch<SetStateAction<number>>;
}

function RoundInput({ round, setRound }: RoundInputProps) {
  const decrease = useCallback(() => setRound((r) => Math.max(0, r - 1)), [setRound]);
  const increase = useCallback(() => setRound((r) => r + 1), [setRound]);

  return (
    <Box display='flex' alignItems='center'>
      <IconButton disabled={round <= 1} onClick={decrease}>
        <RemoveRounded />
      </IconButton>
      <TextField name='round' value={round} size='small' sx={{ width: '5ch', mx: 1 }} />
      <IconButton onClick={increase}>
        <AddRounded />
      </IconButton>
    </Box>
  );
}

export default RoundInput;
