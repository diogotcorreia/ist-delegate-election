import { EditOffRounded, VerifiedRounded } from '@mui/icons-material';
import { Box, Button, CardActions, Typography } from '@mui/material';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  Navigate,
  redirect,
  useLoaderData,
  useNavigate,
  useRouteLoaderData,
  useSubmit,
} from 'react-router-dom';
import { SubmitTarget } from 'react-router-dom/dist/dom';
import { ElectionStatusDto, VoteOptionDto } from '../../@types/api';
import { electionVote, getElectionVoteOptions } from '../../api';
import ElectionCard from '../../components/election/ElectionCard';
import FenixAvatar from '../../components/fenix/FenixAvatar';
import RadioCard, { RadioCardGroup } from '../../components/forms/RadioCard';
import { RootData } from './root';

interface ElectionVoteData {
  voteOptions: VoteOptionDto[];
}

export async function loader({ params }: LoaderFunctionArgs) {
  const voteOptions = await getElectionVoteOptions(parseInt(params.electionId || '', 10));
  return { voteOptions };
}

export async function action({ params, request }: ActionFunctionArgs) {
  const payload = await request.json();

  await electionVote(parseInt(params.electionId || '', 10), payload);

  return redirect('success');
}

function ElectionVote() {
  const { election } = useRouteLoaderData('user-single-election') as RootData;
  const { voteOptions } = useLoaderData() as ElectionVoteData;
  const { t } = useTranslation();
  const submit = useSubmit();

  const [selectedVote, setSelectedVote] = useState<string | boolean | null>(null);

  const handleSubmit = useCallback(() => {
    const payload = {
      username: selectedVote === false ? null : selectedVote,
    };
    // bah
    submit(payload as unknown as SubmitTarget, {
      method: 'post',
      encType: 'application/json',
    });
  }, [submit, selectedVote]);

  if (election.status !== ElectionStatusDto.Voting || election.hasVoted) {
    return <Navigate to='..' replace={true} />;
  }

  return (
    <ElectionCard election={election}>
      <RadioCardGroup
        exclusive
        value={selectedVote}
        onChange={(_event, value) => setSelectedVote(value)}
        sx={{ my: 3 }}
      >
        {voteOptions.map((option) => (
          <RadioCard
            value={option.username}
            icon={<FenixAvatar username={option.username} size={64} />}
            sx={{ width: 200, justifyContent: 'flex-start' }}
            text={
              <Box my={2}>
                <Typography color='textSecondary' variant='body2' gutterBottom>
                  {option.username}
                </Typography>
                <Typography variant='subtitle2'>{option.displayName}</Typography>
              </Box>
            }
          />
        ))}
        <RadioCard
          value={false}
          icon={<EditOffRounded fontSize='inherit' />}
          text={t('election.vote.blank')}
          sx={{ width: 200 }}
        />
      </RadioCardGroup>

      <CardActions sx={{ flexDirection: 'row-reverse' }}>
        <Button disabled={selectedVote === null} variant='contained' onClick={handleSubmit}>
          {t('election.vote.submit')}
        </Button>
      </CardActions>
    </ElectionCard>
  );
}

export function ElectionVoteSuccess() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Go back to home page after 5 seconds
  useEffect(() => {
    let active = true;

    setTimeout(() => {
      if (active) {
        navigate('/');
      }
    }, 5000);

    return () => {
      active = false;
    };
  }, [navigate]);

  return (
    <Box display='flex' flexDirection='column' justifyContent='center' alignItems='center'>
      <Typography component='span' fontSize='10rem'>
        <VerifiedRounded fontSize='inherit' color='success' />
      </Typography>
      <Typography variant='h5' component='p'>
        {t('election.vote.success')}
      </Typography>
    </Box>
  );
}

export default ElectionVote;
