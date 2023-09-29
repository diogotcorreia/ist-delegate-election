import { PersonRounded, PersonSearchRounded, VerifiedRounded } from '@mui/icons-material';
import { Alert, Box, Button, CardActions, Collapse, Typography } from '@mui/material';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActionFunctionArgs,
  Navigate,
  redirect,
  useNavigate,
  useRouteLoaderData,
  useSubmit,
} from 'react-router-dom';
import { SubmitTarget } from 'react-router-dom/dist/dom';
import { ElectionStatusDto, SignedPersonSearchResultDto } from '../../@types/api';
import { electionNominate, electionSelfNominate } from '../../api';
import ElectionCard from '../../components/election/ElectionCard';
import RadioCard, { RadioCardGroup } from '../../components/forms/RadioCard';
import SearchPersonInput from '../../components/forms/SearchPersonInput';
import { RootData } from './root';

export async function action({ params, request }: ActionFunctionArgs) {
  const payload = await request.json();

  if (payload.person) {
    await electionNominate(parseInt(params.electionId || '', 10), payload.person);
  } else {
    await electionSelfNominate(parseInt(params.electionId || '', 10));
  }

  return redirect('success');
}

function ElectionNominate() {
  const { election } = useRouteLoaderData('user-single-election') as RootData;
  const { t } = useTranslation();
  const submit = useSubmit();

  const [nominateAction, setNominateAction] = useState<string | null>(null);
  const [selectedPerson, setSelectedPerson] = useState<SignedPersonSearchResultDto | null>(null);

  const handleSubmit = useCallback(() => {
    const payload = {
      person: nominateAction === 'others' ? selectedPerson : null,
    };
    // bah
    submit(payload as unknown as SubmitTarget, {
      method: 'post',
      encType: 'application/json',
    });
  }, [submit, nominateAction, selectedPerson]);

  if (election.status !== ElectionStatusDto.Candidacy || election.hasNominated) {
    return <Navigate to='..' replace={true} />;
  }

  return (
    <ElectionCard election={election}>
      <RadioCardGroup
        exclusive
        value={nominateAction}
        onChange={(_event, value) => setNominateAction(value)}
        sx={{ my: 3 }}
      >
        <RadioCard
          value='self'
          icon={<PersonRounded fontSize='inherit' />}
          text={t('election.nominate.self')}
        />
        <RadioCard
          value='others'
          icon={<PersonSearchRounded fontSize='inherit' />}
          text={t('election.nominate.others')}
        />
      </RadioCardGroup>

      <Collapse in={nominateAction === 'others'} sx={{ px: 1, my: 4 }}>
        <Alert severity='info' sx={{ mb: 2 }}>
          {t('election.nominate.others-info')}
        </Alert>
        <SearchPersonInput
          electionId={election.id}
          value={selectedPerson}
          setValue={setSelectedPerson}
        />
      </Collapse>

      <CardActions sx={{ flexDirection: 'row-reverse' }}>
        <Button
          disabled={
            !(nominateAction === 'self' || (nominateAction === 'others' && selectedPerson !== null))
          }
          variant='contained'
          onClick={handleSubmit}
        >
          {t('election.nominate.submit')}
        </Button>
      </CardActions>
    </ElectionCard>
  );
}

export function ElectionNominateSuccess() {
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
        {t('election.nominate.success')}
      </Typography>
    </Box>
  );
}

export default ElectionNominate;
