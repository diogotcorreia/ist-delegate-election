/*
 Generated by typeshare 1.6.0
*/

export type LocalizedStringDto = Record<string, string>;

export interface AppErrorDto {
  key: string;
}

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

export interface UserDto {
  username: string;
  displayName: string;
  degreeEntries: DegreeEntryDto[];
}

export interface AuthDto {
  user: UserDto;
  isAdmin: boolean;
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

export interface DateRangeDto {
  start: DateTimeUtc;
  end: DateTimeUtc;
}

export enum ElectionStatusDto {
  NotStarted = 'NOT_STARTED',
  Candidacy = 'CANDIDACY',
  Processing = 'PROCESSING',
  Voting = 'VOTING',
  Ended = 'ENDED',
}

export interface ElectionDto {
  id: number;
  academicYear: string;
  degree?: DegreeDto;
  curricularYear?: number;
  candidacyPeriod?: DateRangeDto;
  votingPeriod: DateRangeDto;
  round: number;
  status: ElectionStatusDto;
  hasNominated?: boolean;
  hasVoted?: boolean;
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

export interface BulkCreateElectionsDegreesDto {
  degreeId: string;
  curricularYear?: number;
}

export interface BulkCreateElectionsDto {
  candidacyPeriod?: DateRangeDto;
  votingPeriod: DateRangeDto;
  round: number;
  degrees: BulkCreateElectionsDegreesDto[];
}

export interface VoteOptionDto {
  username: string;
  displayName: string;
}

export interface CastVoteDto {
  username?: string;
}
