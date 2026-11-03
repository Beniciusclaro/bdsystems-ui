import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { establishSession, resetSessionForTests } from '../auth/session';
import { apiFetch, publicApiFetch } from './client';

beforeEach(() => resetSessionForTests());

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('API client', () => {
  it('adds the current session only to authenticated requests', async () => {
    establishSession({ token: 'sample-token', expiresInSeconds: 900 });
    const request = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal('fetch', request);

    await apiFetch('/api/tools');
    await publicApiFetch('/api/auth/login', { method: 'POST', body: '{}' });

    const [privateUrl, privateOptions] = request.mock.calls[0] as [string, RequestInit];

    const [publicUrl, publicOptions] = request.mock.calls[1] as [string, RequestInit];
    expect(privateUrl).toMatch(/\/api\/tools$/);
    expect(publicUrl).toMatch(/\/api\/auth\/login$/);
    expect(new Headers(privateOptions.headers).get('Authorization')).toBe('Bearer sample-token');
    expect(new Headers(publicOptions.headers).has('Authorization')).toBe(false);
    expect(new Headers(publicOptions.headers).get('Content-Type')).toBe('application/json');
    expect(privateOptions.credentials).toBe('include');
    expect(publicOptions.credentials).toBe('include');
    expect(sessionStorage).toHaveLength(0);
    expect(localStorage).toHaveLength(0);
  });

  it('refreshes a 401 response and retries the original request exactly once', async () => {
    establishSession({ token: 'expired-token', expiresInSeconds: 900 });
    const request = vi
      .fn()
      .mockResolvedValueOnce(new Response(null, { status: 401 }))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ token: 'fresh-token', expiresInSeconds: 900 }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      )
      .mockResolvedValueOnce(new Response(null, { status: 204 }));
    vi.stubGlobal('fetch', request);

    await expect(
      apiFetch('/api/tools', { method: 'POST', body: '{"name":"Martelo"}' }),
    ).resolves.toMatchObject({
      status: 204,
    });

    expect(request).toHaveBeenCalledTimes(3);
    expect(request.mock.calls[1][0]).toMatch(/\/api\/auth\/refresh$/);
    expect(request.mock.calls[2][1]).toMatchObject({
      method: 'POST',
      body: '{"name":"Martelo"}',
    });
    expect(new Headers(request.mock.calls[2][1]?.headers).get('Authorization')).toBe(
      'Bearer fresh-token',
    );
  });

  it('does not retry again when the repeated request is still unauthorized', async () => {
    establishSession({ token: 'expired-token', expiresInSeconds: 900 });
    const request = vi
      .fn()
      .mockResolvedValueOnce(new Response(null, { status: 401 }))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ token: 'fresh-token', expiresInSeconds: 900 }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      )
      .mockResolvedValueOnce(new Response(null, { status: 401 }));
    vi.stubGlobal('fetch', request);

    const response = await apiFetch('/api/tools');

    expect(response.status).toBe(401);
    expect(request).toHaveBeenCalledTimes(3);
  });
});
