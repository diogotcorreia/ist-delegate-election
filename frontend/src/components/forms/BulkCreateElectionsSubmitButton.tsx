import { Box, Button } from '@mui/material';
import { DateOrTimeView, DateTimePicker } from '@mui/x-date-pickers';
import { Dayjs } from 'dayjs';
import { Dispatch, SetStateAction, useCallback, useMemo } from 'react';
import { useSubmit } from 'react-router-dom';
import { SubmitTarget } from 'react-router-dom/dist/dom';
import { BulkCreateElectionsDto } from '../../@types/api';

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
        [...degrees].map((degree) => ({
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

  return <Button onClick={handleClick}>Create {payload.degrees.length} elections</Button>;
}

export default BulkCreateElectionsSubmitButton;
