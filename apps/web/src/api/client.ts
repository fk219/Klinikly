import type { ApiResponse } from '@app/shared';

export type ApiClient = {
  get: <T>(path: string) => Promise<ApiResponse<T>>;
  post: <T>(path: string, body?: unknown) => Promise<ApiResponse<T>>;
};

const toHeaders = (headers?: HeadersInit) => {
  if (!headers) return new Headers();
  return new Headers(headers);
};

export const createApiClient = (params: {
  baseUrl: string;
  fetchImpl: typeof fetch;
  getAccessToken: () => string | null;
  setAccessToken: (token: string) => void;
  clearAccessToken: () => void;
}): ApiClient => {
  const request = async <T,>(method: 'GET' | 'POST', path: string, body?: unknown): Promise<ApiResponse<T>> => {
    const url = `${params.baseUrl}${path}`;

    const attempt = async (): Promise<Response> => {
      const headers = toHeaders({ 'content-type': 'application/json' });
      const token = params.getAccessToken();
      if (token) headers.set('authorization', `Bearer ${token}`);

      return params.fetchImpl(url, {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
        credentials: 'include'
      });
    };

    const res1 = await attempt();
    if (res1.status !== 401) {
      return (await res1.json()) as ApiResponse<T>;
    }

    const refreshed = await params.fetchImpl(`${params.baseUrl}/auth/refresh`, {
      method: 'POST',
      headers: toHeaders({ 'content-type': 'application/json' }),
      credentials: 'include'
    });

    if (!refreshed.ok) {
      params.clearAccessToken();
      return (await res1.json()) as ApiResponse<T>;
    }

    const refreshBody = (await refreshed.json()) as ApiResponse<{ accessToken: string }>;
    if ('data' in refreshBody && refreshBody.data.accessToken) {
      params.setAccessToken(refreshBody.data.accessToken);
      const res2 = await attempt();
      return (await res2.json()) as ApiResponse<T>;
    }

    params.clearAccessToken();
    return (await res1.json()) as ApiResponse<T>;
  };

  return {
    get: (path) => request('GET', path),
    post: (path, body) => request('POST', path, body)
  };
};

const defaultBaseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

const tokenKey = 'accessToken';

const getAccessToken = () => {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(tokenKey);
};

const setAccessToken = (token: string) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(tokenKey, token);
};

const clearAccessToken = () => {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(tokenKey);
};

export const apiClient = createApiClient({
  baseUrl: defaultBaseUrl,
  fetchImpl: fetch,
  getAccessToken,
  setAccessToken,
  clearAccessToken
});
