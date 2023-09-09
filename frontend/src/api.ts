import { AppConfigDto, AuthDto, LoginDto } from './@types/api';

const BASE_URL = process.env.REACT_APP_API_BASE_URL ?? '/api';

async function wrapFetch<T>(responsePromise: Promise<Response>): Promise<T> {
  try {
    const response = await responsePromise;

    const json = await response.json();

    if (response.ok) {
      return json;
    }
    throw json;
  } catch (e) {
    console.error(e);
    throw { key: 'error.unknown' };
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
