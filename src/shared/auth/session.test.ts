import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  establishSession,
  getAccessToken,
  getSessionSnapshot,
  refreshSession,
  resetSessionForTests,
} from './session';

beforeEach(() => {
  resetSessionForTests();
  vi.unstubAllGlobals();
});

describe('in-memory session', () => {
  it('never persists access tokens in browser storage', () => {
    establishSession({ token: 'memory-only', expiresInSeconds: 900 });

    expect(getAccessToken()).toBe('memory-only');
    expect(sessionStorage).toHaveLength(0);
    expect(localStorage).toHaveLength(0);
  });

  it('shares one in-flight refresh between concurrent callers', async () => {
    let resolveRequest: ((response: Response) => void) | undefined;

    const request = vi.fn().mockReturnValue(
      new Promise<Response>((resolve) => {
        resolveRequest = resolve;
      }),
    );
    vi.stubGlobal('fetch', request);

    const first = refreshSession();

    const second = refreshSession();

    expect(request).toHaveBeenCalledTimes(1);
    resolveRequest?.(
      new Response(JSON.stringify({ token: 'shared-token', expiresInSeconds: 900 }), {
        status: 200,
      }),
    );

    await expect(Promise.all([first, second])).resolves.toEqual([
      { token: 'shared-token', expiresInSeconds: 900 },
      { token: 'shared-token', expiresInSeconds: 900 },
    ]);
  });

  it('marks an established session as expired when refresh fails', async () => {
    establishSession({ token: 'old-token', expiresInSeconds: 900 });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 401 })));

    await expect(refreshSession()).rejects.toThrow();

    expect(getSessionSnapshot()).toEqual({ token: null, expiresAt: null, endReason: 'expired' });
  });
});
