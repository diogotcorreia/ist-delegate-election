import {
  AddAdminDto,
  AdminDto,
  AppConfigDto,
  AppErrorDto,
  AuthDto,
  BulkCreateElectionsDto,
  CastVoteDto,
  DegreeElectionsDto,
  ElectionDto,
  ElectionWithUnverifedNominationsDto,
  LoginDto,
  SearchPersonDto,
  SignedPersonSearchResultDto,
  VoteOptionDto,
} from './@types/api';

const BASE_URL = process.env.REACT_APP_API_BASE_URL ?? '/api';

export class ApiError extends Error {
  private json: AppErrorDto;
  constructor(json: AppErrorDto) {
    super(`API request failed: ${json.key}`);
    this.name = 'ApiError';

    this.json = json;
  }

  public getError(): AppErrorDto {
    return this.json;
  }
}

async function wrapFetch<T>(responsePromise: Promise<Response>): Promise<T> {
  try {
    const response = await responsePromise;

    if (response.status === 204) {
      // no content
      return undefined as T;
    }

    const json = await response.json();

    if (response.ok) {
      return json;
    }
    throw new ApiError(json);
  } catch (e) {
    console.error(e);
    if (e instanceof ApiError) {
      throw e;
    }
    throw new ApiError({ key: 'error.unknown' });
  }
}

function buildJsonBody<T>(method: string, body?: T): RequestInit {
  return { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) };
}

export function getAppConfig(): Promise<AppConfigDto> {
  return wrapFetch(fetch(`${BASE_URL}/config`));
}

export function getWhoAmI(): Promise<AuthDto> {
  return wrapFetch(fetch(`${BASE_URL}/whoami`));
}

export function login(payload: LoginDto): Promise<AuthDto> {
  return wrapFetch(fetch(`${BASE_URL}/login`, buildJsonBody('POST', payload)));
}

export function getAdmins(): Promise<AdminDto[]> {
  return wrapFetch(fetch(`${BASE_URL}/admins`));
}

export function addAdmin(payload: AddAdminDto): Promise<void> {
  return wrapFetch(fetch(`${BASE_URL}/admin`, buildJsonBody('POST', payload)));
}

export function removeAdmin(username: string): Promise<void> {
  return wrapFetch(fetch(`${BASE_URL}/admin/${username}`, buildJsonBody('DELETE')));
}

export function setupFirstAdmin(): Promise<void> {
  return wrapFetch(fetch(`${BASE_URL}/setup/admin`, buildJsonBody('POST')));
}

export function getDegrees(): Promise<DegreeElectionsDto[]> {
  return wrapFetch(fetch(`${BASE_URL}/degrees`));
}

export function bulkCreateElections(payload: BulkCreateElectionsDto): Promise<void> {
  return wrapFetch(fetch(`${BASE_URL}/elections/bulk`, buildJsonBody('POST', payload)));
}

export function getUserElections(): Promise<ElectionDto[]> {
  return wrapFetch(fetch(`${BASE_URL}/elections/user`));
}

export function getElection(electionId: number): Promise<ElectionDto> {
  return wrapFetch(fetch(`${BASE_URL}/election/${electionId}`));
}

export function searchUser(payload: SearchPersonDto): Promise<SignedPersonSearchResultDto[]> {
  return wrapFetch(fetch(`${BASE_URL}/search-user`, buildJsonBody('POST', payload)));
}

export function electionSelfNominate(electionId: number): Promise<void> {
  return wrapFetch(
    fetch(`${BASE_URL}/election/${electionId}/self-nominate`, buildJsonBody('POST'))
  );
}

export function electionNominate(
  electionId: number,
  payload: SignedPersonSearchResultDto
): Promise<void> {
  return wrapFetch(
    fetch(`${BASE_URL}/election/${electionId}/nominate`, buildJsonBody('POST', payload))
  );
}

export function getElectionVoteOptions(electionId: number): Promise<VoteOptionDto[]> {
  return wrapFetch(fetch(`${BASE_URL}/election/${electionId}/vote-options`));
}

export function electionVote(electionId: number, payload: CastVoteDto): Promise<void> {
  return wrapFetch(
    fetch(`${BASE_URL}/election/${electionId}/vote`, buildJsonBody('POST', payload))
  );
}

export function countUnverifiedNominations(): Promise<Record<number, number>> {
  return wrapFetch(fetch(`${BASE_URL}/elections/nominations/unverified-count`));
}

export function getUnverifiedNominations(): Promise<ElectionWithUnverifedNominationsDto[]> {
  return wrapFetch(fetch(`${BASE_URL}/elections/nominations/unverified`));
}
