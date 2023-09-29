import {
  Autocomplete,
  CircularProgress,
  debounce,
  Grid,
  TextField,
  Typography,
} from '@mui/material';
import { Dispatch, SetStateAction, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SignedPersonSearchResultDto } from '../../@types/api';
import { searchUser } from '../../api';
import FenixAvatar from '../fenix/FenixAvatar';

interface Props {
  electionId: number;
  value: SignedPersonSearchResultDto | null;
  setValue: Dispatch<SetStateAction<SignedPersonSearchResultDto | null>>;
}

function SearchPersonInput({ electionId, value, setValue }: Props) {
  const { t } = useTranslation();

  const [inputValue, setInputValue] = useState('');
  const [options, setOptions] = useState<readonly SignedPersonSearchResultDto[]>([]);
  const [loading, setLoading] = useState(false);

  const fetch = useMemo(
    () =>
      debounce(
        (
          request: { input: string },
          callback: (results?: readonly SignedPersonSearchResultDto[]) => void
        ) => {
          searchUser({ query: request.input, election: electionId }).then(callback);
        },
        400
      ),
    [electionId]
  );

  useEffect(() => {
    let active = true;

    if (inputValue === '') {
      setOptions(value ? [value] : []);
      return undefined;
    }

    setLoading(true);
    fetch({ input: inputValue }, (results?: readonly SignedPersonSearchResultDto[]) => {
      if (active) {
        let newOptions: readonly SignedPersonSearchResultDto[] = [];

        if (value) {
          newOptions = [value];
        }

        if (results) {
          newOptions = [...newOptions, ...results];
        }

        setOptions(newOptions);
        setLoading(false);
      }
    });

    return () => {
      active = false;
    };
  }, [value, inputValue, fetch]);

  return (
    <Autocomplete
      getOptionLabel={(option) => (typeof option === 'string' ? option : option.displayName)}
      filterOptions={(x) => x}
      options={options}
      autoComplete
      includeInputInList
      filterSelectedOptions
      value={value}
      noOptionsText={t('search-person-input.no-results')}
      loading={loading}
      onChange={(_event: any, newValue: SignedPersonSearchResultDto | null) => {
        setOptions(newValue ? [newValue, ...options] : options);
        setValue(newValue);
      }}
      onInputChange={(_event, newInputValue) => {
        setInputValue(newInputValue);
      }}
      // FIXME for some reason typescript is mad at this parameter list
      renderInput={(params: any) => (
        <TextField
          {...params}
          label={t('search-person-input.label')}
          placeholder={t('search-person-input.placeholder')}
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <>
                {loading ? <CircularProgress color='inherit' size={20} /> : null}
                {params.InputProps.endAdornment}
              </>
            ),
          }}
          fullWidth
        />
      )}
      renderOption={(props, option) => {
        return (
          <li {...props}>
            <Grid container alignItems='center'>
              <Grid item sx={{ display: 'flex', width: 44 }}>
                <FenixAvatar username={option.username} size={44} />
              </Grid>
              <Grid item sx={{ width: 'calc(100% - 44px)', wordWrap: 'break-word', pl: 1 }}>
                {option.displayName}
                <Typography variant='body2' color='text.secondary'>
                  {option.username}
                </Typography>
              </Grid>
            </Grid>
          </li>
        );
      }}
    />
  );
}

export default SearchPersonInput;
