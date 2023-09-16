import { Box } from '@mui/material';
import { DateOrTimeView, DateTimePicker } from '@mui/x-date-pickers';
import { Dayjs } from 'dayjs';
import { Dispatch, SetStateAction, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

interface DateRangeInputProps {
  start: Dayjs | null;
  end: Dayjs | null;
  setStart: Dispatch<SetStateAction<Dayjs | null>>;
  setEnd: Dispatch<SetStateAction<Dayjs | null>>;
  minDate?: Dayjs | null;
}

const timeSteps = { hours: 1, minutes: 1, seconds: 1 };
const views: DateOrTimeView[] = ['year', 'month', 'day', 'hours', 'minutes', 'seconds'];

function DateRangeInput({ start, end, setStart, setEnd, minDate }: DateRangeInputProps) {
  const { t } = useTranslation();
  const changeStart = useCallback((date: Dayjs | null) => setStart(date), [setStart]);
  const changeEnd = useCallback((date: Dayjs | null) => setEnd(date), [setEnd]);

  return (
    <Box display='flex' alignItems='center' flexWrap='wrap' gap={2} mt={2}>
      <DateTimePicker
        label={t('admin.forms.date-range-input.start')}
        ampm={false}
        timeSteps={timeSteps}
        views={views}
        value={start}
        onChange={changeStart}
        minDateTime={minDate?.add(1, 's') ?? undefined}
      />
      <DateTimePicker
        label={t('admin.forms.date-range-input.end')}
        ampm={false}
        timeSteps={timeSteps}
        views={views}
        value={end}
        onChange={changeEnd}
        minDateTime={start?.add(1, 's') ?? undefined}
        referenceDate={start?.set('h', 23).set('m', 59).set('s', 59)}
      />
    </Box>
  );
}

export default DateRangeInput;
