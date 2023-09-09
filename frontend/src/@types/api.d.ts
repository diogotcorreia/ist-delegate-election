/*
 Generated by typeshare 1.6.0
*/

export interface FenixConfigDto {
  baseUrl: string;
  clientId: string;
  redirectUrl: string;
}

export interface AppConfigDto {
  fenix: FenixConfigDto;
  isSetup: boolean;
}

export interface LoginDto {
  code: string;
}

export interface DegreeEntryDto {
  degreeId: string;
  curricularYear: number;
}

export interface AuthDto {
  username: string;
  displayName: string;
  degreeEntries: DegreeEntryDto[];
}

export interface AdminDto {
  username: string;
  dateAdded: DateTimeUtc;
}

export interface AddAdminDto {
  username: string;
}

export interface DegreeDto {
  id: string;
  acronym: string;
  name: LocalizedStringDto;
  degreeType: LocalizedStringDto;
}

export interface ElectionDto {
  id: number;
  academicYear: string;
  curricularYear?: number;
  candidacyPeriodStart?: DateTimeUtc;
  candidacyPeriodEnd?: DateTimeUtc;
  votingPeriodStart: DateTimeUtc;
  votingPeriodEnd: DateTimeUtc;
  round: number;
}

export interface DegreeElectionsDto {
  degree: DegreeDto;
  elections: ElectionDto[];
}

export interface SearchPersonDto {
  election: number;
  query: string;
}

export interface SignedPersonSearchResultDto {
  username: string;
  displayName: string;
  signature: string;
}
