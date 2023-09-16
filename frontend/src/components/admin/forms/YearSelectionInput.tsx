import { AddRounded, ExpandLessRounded, ExpandMoreRounded } from '@mui/icons-material';
import {
  Box,
  Checkbox,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  Dispatch,
  Fragment,
  SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import { DegreeElectionsDto } from '../../../@types/api';
import useLocalizedString from '../../../hooks/useLocalizedString';
import { DegreeTypeAggregator } from '../../../hooks/useSortAndGroupDegrees';

interface YearSelectionInputProps {
  degrees: DegreeTypeAggregator[];
  selectedDegrees: Set<string>;
  selectedYears: Set<string>[]; // index 0 corresponds do degree-wide, other indexes == curricular years
  setSelectedYears: Dispatch<SetStateAction<Set<string>[]>>;
}

function YearSelectionInput({
  degrees,
  selectedDegrees,
  selectedYears,
  setSelectedYears,
}: YearSelectionInputProps) {
  const { t } = useTranslation();
  const translateLs = useLocalizedString();
  const [maxYears, setMaxYears] = useState(5);
  const [open, setOpen] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Ensure all selected years are shown
    if (maxYears + 1 < selectedYears.length) {
      setMaxYears(selectedYears.length - 1);
    }
  }, [maxYears, selectedYears]);

  useEffect(() => {
    // Remove selection of years of degrees that are not selected
    // i.e. when user goes back and changes degree selection
    setSelectedYears((selYears) =>
      selYears.map(
        (selected) => new Set([...(selected || [])].filter((degree) => selectedDegrees.has(degree)))
      )
    );
  }, [setSelectedYears, selectedDegrees]);

  const select = useCallback(
    (year: number, id: string) =>
      setSelectedYears((selected) => {
        const newArray = [...selected];
        newArray[year] = new Set(newArray[year]).add(id);
        return newArray;
      }),
    [setSelectedYears]
  );
  const unselect = useCallback(
    (year: number, id: string) =>
      setSelectedYears((selected) => {
        const newArray = [...selected];
        newArray[year] = new Set(newArray[year]);
        newArray[year].delete(id);
        return newArray;
      }),
    [setSelectedYears]
  );

  const availableByType: Record<string, number> = useMemo(
    () =>
      degrees.reduce(
        (acc, { degreeTypeHash, degreeElections }) => {
          acc[degreeTypeHash] = degreeElections.reduce(
            (count, { degree }) => count + (selectedDegrees.has(degree.id) ? 1 : 0),
            0
          );
          return acc;
        },
        {} as Record<string, number>
      ),
    [degrees, selectedDegrees]
  );

  const selectedByType: Record<string, number>[] = useMemo(
    () =>
      selectedYears.map((selected) =>
        degrees.reduce(
          (acc, { degreeTypeHash, degreeElections }) => {
            acc[degreeTypeHash] = degreeElections.reduce(
              (count, { degree }) => count + (selected?.has(degree.id) ? 1 : 0),
              0
            );
            return acc;
          },
          {} as Record<string, number>
        )
      ),
    [degrees, selectedYears]
  );

  const onDegreeTypeChange =
    (year: number, degrees: DegreeElectionsDto[]) =>
    (_: React.SyntheticEvent, checked: boolean) => {
      setSelectedYears((selected) => {
        const newArray = [...selected];
        const newSelected = new Set(newArray[year]);
        if (checked) {
          degrees
            .filter(({ degree }) => selectedDegrees.has(degree.id))
            .forEach(({ degree }) => newSelected.add(degree.id));
        } else {
          degrees
            .filter(({ degree }) => selectedDegrees.has(degree.id))
            .forEach(({ degree }) => newSelected.delete(degree.id));
        }
        newArray[year] = newSelected;
        return newArray;
      });
    };

  const handleCollapseToggle = useCallback(
    (typeHash: string) => () => {
      setOpen((oldOpen) => {
        const newOpen = new Set(oldOpen);
        // toggle
        if (!newOpen.delete(typeHash)) {
          newOpen.add(typeHash);
        }
        return newOpen;
      });
    },
    [setOpen]
  );

  const handleIncreaseMaxYears = useCallback(
    () => setMaxYears((years) => years + 1),
    [setMaxYears]
  );

  return (
    <Box>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell />
            <TableCell>{t('admin.forms.year-selection-input.degree')}</TableCell>
            <TableCell>{t('election.curricular-year-none')}</TableCell>
            {Array.from({ length: maxYears }, (_, year) => (
              <TableCell key={year}>
                {t('election.curricular-year', { count: year + 1, ordinal: true })}
              </TableCell>
            ))}
            <TableCell>
              <Tooltip title={t('admin.forms.year-selection-input.increase-max-years')}>
                <IconButton onClick={handleIncreaseMaxYears}>
                  <AddRounded />
                </IconButton>
              </Tooltip>
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {degrees
            .filter(({ degreeTypeHash }) => availableByType[degreeTypeHash] > 0)
            .map(({ degreeType, degreeTypeHash, degreeElections }) => (
              <Fragment key={degreeTypeHash}>
                <TableRow>
                  <TableCell>
                    <IconButton onClick={handleCollapseToggle(degreeTypeHash)}>
                      {open.has(degreeTypeHash) ? <ExpandLessRounded /> : <ExpandMoreRounded />}
                    </IconButton>
                  </TableCell>
                  <TableCell>{translateLs(degreeType)}</TableCell>
                  {Array.from({ length: maxYears + 1 }, (_, year) => (
                    <TableCell key={year}>
                      <Checkbox
                        checked={
                          availableByType[degreeTypeHash] === selectedByType[year]?.[degreeTypeHash]
                        }
                        indeterminate={
                          selectedByType[year]?.[degreeTypeHash] > 0 &&
                          selectedByType[year]?.[degreeTypeHash] < availableByType[degreeTypeHash]
                        }
                        onChange={onDegreeTypeChange(year, degreeElections)}
                      />
                    </TableCell>
                  ))}
                  <TableCell />
                </TableRow>
                {open.has(degreeTypeHash) &&
                  degreeElections
                    .filter(({ degree }) => selectedDegrees.has(degree.id))
                    .map(({ degree }) => (
                      <TableRow
                        key={degree.id}
                        sx={{
                          bgcolor: (theme) => theme.palette.action.hover,
                        }}
                      >
                        <TableCell />
                        <TableCell>
                          <Typography variant='caption'>{degree.acronym}</Typography>
                          <Typography variant='body2'>{translateLs(degree.name)}</Typography>
                        </TableCell>
                        {Array.from({ length: maxYears + 1 }, (_, year) => (
                          <TableCell key={year}>
                            <Checkbox
                              checked={selectedYears[year]?.has(degree.id) || false}
                              onChange={(_, checked) =>
                                checked ? select(year, degree.id) : unselect(year, degree.id)
                              }
                            />
                          </TableCell>
                        ))}
                        <TableCell />
                      </TableRow>
                    ))}
              </Fragment>
            ))}
        </TableBody>
      </Table>
    </Box>
  );
}

export default YearSelectionInput;
