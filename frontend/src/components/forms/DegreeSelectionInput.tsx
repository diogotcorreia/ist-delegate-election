import { ExpandMoreRounded } from '@mui/icons-material';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Checkbox,
  Chip,
  FormControlLabel,
  FormGroup,
} from '@mui/material';
import { Dispatch, SetStateAction, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { DegreeElectionsDto } from '../../@types/api';
import useLocalizedString from '../../hooks/useLocalizedString';
import { DegreeTypeAggregator } from '../../hooks/useSortAndGroupDegrees';

interface DegreeSelectionInputProps {
  degrees: DegreeTypeAggregator[];
  selected: Set<string>;
  setSelected: Dispatch<SetStateAction<Set<string>>>;
}

function DegreeSelectionInput({ degrees, selected, setSelected }: DegreeSelectionInputProps) {
  const { t } = useTranslation();
  const translateLs = useLocalizedString();

  const select = useCallback(
    (id: string) => setSelected((selected) => new Set(selected).add(id)),
    [setSelected]
  );
  const unselect = useCallback(
    (id: string) =>
      setSelected((selected) => {
        // we have to clone, since react state must be immutable
        const selectedClone = new Set(selected);
        selectedClone.delete(id);
        return selectedClone;
      }),
    [setSelected]
  );

  const selectedByType: Record<string, number> = useMemo(
    () =>
      degrees.reduce(
        (acc, { degreeTypeHash, degreeElections }) => {
          acc[degreeTypeHash] = degreeElections.reduce(
            (count, { degree }) => count + (selected.has(degree.id) ? 1 : 0),
            0
          );
          return acc;
        },
        {} as Record<string, number>
      ),
    [degrees, selected]
  );

  const onDegreeTypeChange =
    (degrees: DegreeElectionsDto[]) => (_: React.SyntheticEvent, checked: boolean) => {
      setSelected((selected) => {
        const newSelected = new Set(selected);
        if (checked) {
          degrees.forEach(({ degree }) => newSelected.add(degree.id));
        } else {
          degrees.forEach(({ degree }) => newSelected.delete(degree.id));
        }
        return newSelected;
      });
    };

  return (
    <Box>
      {degrees.map(({ degreeType, degreeTypeHash, degreeElections }) => (
        <Accordion key={degreeTypeHash}>
          <AccordionSummary expandIcon={<ExpandMoreRounded />}>
            <Box display='flex' alignItems='center' gap={1}>
              <Checkbox
                checked={degreeElections.length === selectedByType[degreeTypeHash]}
                indeterminate={
                  selectedByType[degreeTypeHash] > 0 &&
                  selectedByType[degreeTypeHash] < degreeElections.length
                }
                onChange={onDegreeTypeChange(degreeElections)}
                onClick={(e) => e.stopPropagation()}
              />
              <span>{translateLs(degreeType)}</span>
              <Chip
                label={t('admin.degree-type-elections.degree-count', {
                  count: degreeElections.length,
                })}
                size='small'
              />
              {selectedByType[degreeTypeHash] > 0 && (
                <Chip
                  label={t('admin.degree-type-elections.election-count', {
                    count: selectedByType[degreeTypeHash],
                  })}
                  size='small'
                  color='primary'
                />
              )}
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <FormGroup>
              {degreeElections.map(({ degree }) => (
                <FormControlLabel
                  key={degree.id}
                  checked={selected.has(degree.id)}
                  onChange={(_, checked) =>
                    checked ? select(degree.id) : unselect(degree.id)
                  }
                  control={<Checkbox />}
                  label={`${degree.acronym} - ${translateLs(degree.name)}`}
                />
              ))}
            </FormGroup>
          </AccordionDetails>
        </Accordion>
      ))}
    </Box>
  );
}

export default DegreeSelectionInput;
