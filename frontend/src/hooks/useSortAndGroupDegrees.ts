import { useMemo } from 'react';
import { DegreeElectionsDto, LocalizedStringDto } from '../@types/api';
import useLocalizedString from './useLocalizedString';

export interface DegreeTypeAggregator {
  degreeType: LocalizedStringDto;
  degreeTypeHash: string;
  degreeElections: DegreeElectionsDto[];
}

// We can't use objects as keys, so perform a hash
function hashLocalizedString(localizedString: LocalizedStringDto): string {
  return Object.keys(localizedString)
    .sort()
    .map((lang) => `${encodeURIComponent(lang)}=${encodeURIComponent(localizedString[lang])}`)
    .join('&');
}

function useSortAndGroupDegrees(degrees: DegreeElectionsDto[]): DegreeTypeAggregator[] {
  const translateLs = useLocalizedString();

  return useMemo(() => {
    const aggregatedDegrees = degrees.reduce(
      (degreeTypes: Record<string, DegreeTypeAggregator>, degreeElections) => {
        const typeHash = hashLocalizedString(degreeElections.degree.degreeType);

        if (!degreeTypes[typeHash]) {
          degreeTypes[typeHash] = {
            degreeType: degreeElections.degree.degreeType,
            degreeTypeHash: typeHash,
            degreeElections: [],
          };
        }

        degreeTypes[typeHash].degreeElections.push(degreeElections);

        return degreeTypes;
      },
      {}
    );

    const degreeTypeAggregators = Object.values(aggregatedDegrees);
    degreeTypeAggregators.forEach((degreeTypeAggregator) =>
      degreeTypeAggregator.degreeElections.sort((a, b) =>
        a.degree.acronym.localeCompare(b.degree.acronym)
      )
    );

    degreeTypeAggregators.sort((a, b) =>
      translateLs(a.degreeType).localeCompare(translateLs(b.degreeType))
    );

    return degreeTypeAggregators;
  }, [degrees, translateLs]);
}

export default useSortAndGroupDegrees;
