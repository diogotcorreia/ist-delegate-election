import { PersonRounded, PersonSearchRounded } from '@mui/icons-material';
import { Alert, Button, CardActions, Collapse } from '@mui/material';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouteLoaderData } from 'react-router-dom';
import { SignedPersonSearchResultDto } from '../../@types/api';
import ElectionCard from '../../components/election/ElectionCard';
import RadioCard, { RadioCardGroup } from '../../components/forms/RadioCard';
import SearchPersonInput from '../../components/forms/SearchPersonInput';
import { RootData } from './root';

function ElectionNominate() {
  const { election } = useRouteLoaderData('user-single-election') as RootData;
  const { t } = useTranslation();

  const [nominateAction, setNominateAction] = useState<string | null>(null);
  const [selectedPerson, setSelectedPerson] = useState<SignedPersonSearchResultDto | null>(null);

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
        >
          {t('election.nominate.submit')}
        </Button>
      </CardActions>
    </ElectionCard>
  );
}

export default ElectionNominate;
