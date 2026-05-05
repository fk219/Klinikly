import { describe, expect, it } from 'vitest';
import { createApiClient } from './client';

describe('api client', () => {
  it('retries once after 401 by calling refresh', async () => {
    let accessToken: string | null = 'expired';

    const calls: Array<{ url: string; auth?: string | null }> = [];

    const fetchImpl: typeof fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const auth = init?.headers ? new Headers(init.headers).get('authorization') : null;
      calls.push({ url, auth });

      if (url.endsWith('/auth/refresh')) {
        return new Response(JSON.stringify({ data: { accessToken: 'new-token', user: { id: 'u1', role: 'patient' } } }), {
          status: 200,
          headers: { 'content-type': 'application/json' }
        });
      }

      if (auth === 'Bearer expired') {
        return new Response(JSON.stringify({ error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }), {
          status: 401,
          headers: { 'content-type': 'application/json' }
        });
      }

      return new Response(JSON.stringify({ data: { ok: true } }), {
        status: 200,
        headers: { 'content-type': 'application/json' }
      });
    }) as unknown as typeof fetch;

    const api = createApiClient({
      baseUrl: 'http://localhost:3001',
      fetchImpl,
      getAccessToken: () => accessToken,
      setAccessToken: (t) => {
        accessToken = t;
      },
      clearAccessToken: () => {
        accessToken = null;
      }
    });

    const res = await api.get<{ ok: boolean }>('/health');
    expect('data' in res && res.data.ok).toBe(true);
    expect(calls.map((c) => c.url)).toEqual([
      'http://localhost:3001/health',
      'http://localhost:3001/auth/refresh',
      'http://localhost:3001/health'
    ]);
  });
});
