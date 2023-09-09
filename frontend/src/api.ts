import { AppConfigDto, AppErrorDto, AuthDto, LoginDto } from './@types/api';

const BASE_URL = process.env.REACT_APP_API_BASE_URL ?? '/api';

export class ApiError extends Error {
  private json: AppErrorDto;
  constructor(json: AppErrorDto) {
    super(`API request failed: ${ json.key }`)
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

    const json = await response.json();

    if (response.ok) {
      return json;
    }
    throw new ApiError(json);
  } catch (e) {
    console.error(e);
    throw new ApiError({ key: 'error.unknown' });
  }
}

function buildJsonBody<T>(method: string, body: T): RequestInit {
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
