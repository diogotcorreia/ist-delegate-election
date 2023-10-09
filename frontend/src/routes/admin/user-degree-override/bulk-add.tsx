import { ArrowBackRounded, DeleteRounded } from '@mui/icons-material';
import { Autocomplete, Box, Button, IconButton, Paper, TextField, Typography } from '@mui/material';
import Grid from '@mui/material/Unstable_Grid2';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActionFunctionArgs, Link, redirect, useLoaderData, useSubmit } from 'react-router-dom';
import { SubmitTarget } from 'react-router-dom/dist/dom';
import { DegreeDto } from '../../../@types/api';
import { addUserDegreeOverrides, getDegrees } from '../../../api';
import CsvFileInput from '../../../components/forms/CsvFileInput';
import useLocalizedString from '../../../hooks/useLocalizedString';

interface BulkAddData {
  degrees: DegreeDto[];
}

export async function loader() {
  const degrees = await getDegrees();

  return { degrees };
}

export async function action({ request }: ActionFunctionArgs) {
  const payload = await request.json();

  await addUserDegreeOverrides(payload);

  return redirect('/admin/user-degree-overrides');
}

interface DegreeDtoWithType extends DegreeDto {
  type: string;
}

function BulkAddUserDegreeOverrides() {
  const { degrees } = useLoaderData() as BulkAddData;
  const { t } = useTranslation();
  const translateLs = useLocalizedString();
  const submit = useSubmit();

  const [selectedDegree, setSelectedDegree] = useState<DegreeDtoWithType | null>(null);
  const [curricularYear, setCurricularYear] = useState<string | null>(null);
  const [users, setUsers] = useState<Set<string>>(new Set());

  const autocompleteOptions = useMemo(() => {
    const degreesWithType = degrees.map((degree) => ({
      type: translateLs(degree.degreeType),
      ...degree,
    }));
    return degreesWithType.sort((a, b) => -b.type.localeCompare(a.type));
  }, [degrees, translateLs]);

  const isCurricularYearValid = useMemo(() => {
    if (!/^[0-9]*$/.test(curricularYear || '')) {
      return false;
    }
    const parsed = parseInt(curricularYear || '', 10);
    return !isNaN(parsed) && parsed > 0 && parsed <= 255;
  }, [curricularYear]);

  const importValues = useCallback(
    (values: string[]) => {
      setUsers((users) => {
        const newUsers = new Set(users);
        values.forEach((v) => newUsers.add(v));
        return newUsers;
      });
    },
    [setUsers]
  );

  const handleRemoveUser = (username: string) => () => {
    setUsers((users) => {
      const newUsers = new Set(users);
      newUsers.delete(username);
      return newUsers;
    });
  };

  const handleSubmit = useCallback(() => {
    const payload = {
      degreeId: selectedDegree?.id,
      curricularYear: parseInt(curricularYear ?? '', 10),
      usernames: [...users],
    };
    // bah
    submit(payload as unknown as SubmitTarget, {
      method: 'post',
      encType: 'application/json',
    });
  }, [submit, selectedDegree, curricularYear, users]);

  return (
    <>
      <Box mb={2}>
        <Button
          component={Link}
          to='/admin/user-degree-overrides'
          startIcon={<ArrowBackRounded />}
          color='inherit'
        >
          {t('admin.subpages.user-degree-override-management.bulk-add.back')}
        </Button>
      </Box>
      <Typography variant='h2' gutterBottom>
        {t('admin.subpages.user-degree-override-management.bulk-add.title')}
      </Typography>

      <Grid container spacing={2}>
        <Grid xs={12} sm={8}>
          <Autocomplete
            options={autocompleteOptions}
            groupBy={(option) => option.type}
            getOptionLabel={(option) => `${translateLs(option.name)} [${option.acronym}]`}
            autoSelect
            onChange={(_, value) => setSelectedDegree(value)}
            value={selectedDegree}
            renderInput={(params: any) => (
              <TextField
                {...params}
                label={t('admin.subpages.user-degree-override-management.bulk-add.select-degree')}
              />
            )}
            fullWidth
          />
        </Grid>
        <Grid xs={12} sm={4}>
          <TextField
            error={curricularYear !== null && !isCurricularYearValid}
            helperText={
              curricularYear !== null &&
              !isCurricularYearValid &&
              t(
                'admin.subpages.user-degree-override-management.bulk-add.curricular-year-helper-text'
              )
            }
            label={t('admin.subpages.user-degree-override-management.bulk-add.curricular-year')}
            type='text'
            inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
            value={curricularYear || ''}
            onChange={(event) => setCurricularYear(event.target.value)}
            fullWidth
          />
        </Grid>
      </Grid>

      <Box display='flex' alignItems='center' flexWrap='wrap' gap={2} my={2}>
        <CsvFileInput
          helpText={t('admin.subpages.user-degree-override-management.bulk-add.upload-help-text')}
          importValues={importValues}
        />

        {users.size > 0 && (
          <Button
            onClick={() => setUsers(new Set())}
            startIcon={<DeleteRounded />}
            variant='outlined'
            color='error'
          >
            {t('admin.subpages.user-degree-override-management.bulk-add.remove-all')}
          </Button>
        )}

        <Box flexGrow={1} />

        <Button
          onClick={handleSubmit}
          variant='contained'
          disabled={
            selectedDegree === null ||
            curricularYear === null ||
            !isCurricularYearValid ||
            users.size === 0
          }
        >
          {t('admin.subpages.user-degree-override-management.bulk-add.submit')}
        </Button>
      </Box>

      <Grid container spacing={2}>
        {[...users].map((user) => (
          <Grid key={user} xs={12} sm={6} md={4} lg={2}>
            <Paper sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography flexGrow={1}>{user}</Typography>
              <IconButton onClick={handleRemoveUser(user)}>
                <DeleteRounded />
              </IconButton>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </>
  );
}

export default BulkAddUserDegreeOverrides;
