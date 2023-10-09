import { Autocomplete, TextField, Typography } from '@mui/material';
import Grid from '@mui/material/Unstable_Grid2';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLoaderData } from 'react-router-dom';
import { DegreeDto } from '../../../@types/api';
import { getDegrees } from '../../../api';
import useLocalizedString from '../../../hooks/useLocalizedString';

interface BulkAddData {
  degrees: DegreeDto[];
}

export async function loader() {
  const degrees = await getDegrees();

  return { degrees };
}

interface DegreeDtoWithType extends DegreeDto {
  type: string;
}

function BulkAddUserDegreeOverrides() {
  const { degrees } = useLoaderData() as BulkAddData;
  const { t } = useTranslation();
  const translateLs = useLocalizedString();

  const [selectedDegree, setSelectedDegree] = useState<DegreeDtoWithType | null>(null);
  const [curricularYear, setCurricularYear] = useState<string | null>(null);

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

  return (
    <>
      <Typography variant='h2' gutterBottom>
        {t('admin.subpages.user-degree-override-management.title')}
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
            value={curricularYear}
            onChange={(event) => setCurricularYear(event.target.value)}
            fullWidth
          />
        </Grid>
      </Grid>
    </>
  );
}

export default BulkAddUserDegreeOverrides;
