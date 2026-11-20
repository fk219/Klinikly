import type { ApiResponse } from '@app/shared';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';
const TOKEN_KEY = 'adminAccessToken';

export const getAccessToken = () => localStorage.getItem(TOKEN_KEY);
export const setAccessToken = (t: string) => localStorage.setItem(TOKEN_KEY, t);
export const clearAccessToken = () => localStorage.removeItem(TOKEN_KEY);

const request = async <T>(
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  path: string,
  body?: unknown
): Promise<ApiResponse<T>> => {
  const url = `${BASE_URL}${path}`;

  const attempt = async (): Promise<Response> => {
    const headers = new Headers({ 'content-type': 'application/json' });
    const token = getAccessToken();
    if (token) headers.set('authorization', `Bearer ${token}`);
    return fetch(url, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      credentials: 'include',
    });
  };

  const res1 = await attempt();
  if (res1.status !== 401) return (await res1.json()) as ApiResponse<T>;

  // Try refresh
  const refreshed = await fetch(`${BASE_URL}/auth/refresh`, {
    method: 'POST',
    headers: new Headers({ 'content-type': 'application/json' }),
    credentials: 'include',
  });

  if (!refreshed.ok) {
    clearAccessToken();
    return (await res1.json()) as ApiResponse<T>;
  }

  const refreshBody = (await refreshed.json()) as ApiResponse<{ accessToken: string }>;
  if ('data' in refreshBody && refreshBody.data.accessToken) {
    setAccessToken(refreshBody.data.accessToken);
    const res2 = await attempt();
    return (await res2.json()) as ApiResponse<T>;
  }

  clearAccessToken();
  return (await res1.json()) as ApiResponse<T>;
};

export const apiClient = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, body),
  put: <T>(path: string, body?: unknown) => request<T>('PUT', path, body),
  patch: <T>(path: string, body?: unknown) => request<T>('PATCH', path, body),
  delete: <T>(path: string) => request<T>('DELETE', path),
};
