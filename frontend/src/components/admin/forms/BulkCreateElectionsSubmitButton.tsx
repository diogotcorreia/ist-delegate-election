import { Button } from '@mui/material';
import { Dayjs } from 'dayjs';
import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useSubmit } from 'react-router-dom';
import { SubmitTarget } from 'react-router-dom/dist/dom';
import { BulkCreateElectionsDto } from '../../../@types/api';

interface BulkCreateElectionsSubmitButtonProps {
  candidacyStart: Dayjs | null;
  candidacyEnd: Dayjs | null;
  votingStart: Dayjs | null;
  votingEnd: Dayjs | null;
  round: number;

  selectedYears: Set<string>[];
}

function BulkCreateElectionsSubmitButton({
  candidacyStart,
  candidacyEnd,
  votingStart,
  votingEnd,
  round,
  selectedYears,
}: BulkCreateElectionsSubmitButtonProps) {
  const { t } = useTranslation();
  const submit = useSubmit();
  const payload: BulkCreateElectionsDto = useMemo(
    () => ({
      candidacyPeriod:
        candidacyStart !== null && candidacyEnd !== null
          ? { start: candidacyStart, end: candidacyEnd }
          : undefined,
      votingPeriod: { start: votingStart, end: votingEnd },
      round,

      degrees: selectedYears.flatMap((degrees, year) =>
        [...(degrees || [])].map((degree) => ({
          degreeId: degree,
          curricularYear: year === 0 ? undefined : year,
        }))
      ),
    }),
    [candidacyStart, candidacyEnd, votingStart, votingEnd, round, selectedYears]
  );

  const handleClick = useCallback(() => {
    // bah
    submit(payload as unknown as SubmitTarget, {
      method: 'post',
      encType: 'application/json',
    });
  }, [submit, payload]);

  return (
    <Button onClick={handleClick} variant='contained'>
      {t('admin.forms.bulk-create-elections-submit-button.label', {
        count: payload.degrees.length,
      })}
    </Button>
  );
}

export default BulkCreateElectionsSubmitButton;
