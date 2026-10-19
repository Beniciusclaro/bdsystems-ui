import { afterEach, describe, expect, it, vi } from 'vitest';
import { apiFetch, publicApiFetch } from './client';

afterEach(() => { vi.unstubAllGlobals(); });

describe('API client', () => {
  it('adds the current session only to authenticated requests', async () => {
    sessionStorage.setItem('builder-ui:token', 'sample-token');
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
  });
});
