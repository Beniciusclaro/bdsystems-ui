import { getAccessToken, refreshSession } from '../auth/session';

const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL;
export const API_BASE_URL = configuredBaseUrl ? configuredBaseUrl.replace(/\/$/, '') : '';

function request(path: string, init: RequestInit, authenticated: boolean): Promise<Response> {
  const headers = new Headers(init.headers);
  if (!headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  const token = authenticated ? getAccessToken() : null;
  if (token) headers.set('Authorization', `Bearer ${token}`);
  return fetch(`${API_BASE_URL}${path}`, { ...init, headers, credentials: 'include' });
}

export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const response = await request(path, init, true);

  if (response.status !== 401 || path.startsWith('/api/auth/')) return response;

  await refreshSession();
  return request(path, init, true);
}

export function publicApiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  return request(path, init, false);
}
