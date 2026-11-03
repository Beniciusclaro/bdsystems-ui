import { act, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthProvider } from './AuthProvider';
import { useAuth } from './useAuth';
import { resetSessionForTests } from './session';

function AuthProbe() {
  const { status, logout } = useAuth();

  return (
    <div>
      <span>{status}</span>
      <button type="button" onClick={() => void logout().catch(() => undefined)}>
        Logout
      </button>
    </div>
  );
}

beforeEach(() => {
  resetSessionForTests();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('AuthProvider', () => {
  it('restores an authenticated session during bootstrap without persisting the token', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ token: 'restored-token', expiresInSeconds: 900 }), {
          status: 200,
        }),
      ),
    );

    render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>,
    );

    expect(screen.getByText('loading')).toBeInTheDocument();
    expect(await screen.findByText('authenticated')).toBeInTheDocument();
    expect(sessionStorage).toHaveLength(0);
    expect(localStorage).toHaveLength(0);
  });

  it('finishes bootstrap silently when there is no session', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 401 })));

    render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>,
    );

    expect(await screen.findByText('unauthenticated')).toBeInTheDocument();
  });

  it('schedules refresh before expiry', async () => {
    vi.useFakeTimers();
    const request = vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify({ token: 'token', expiresInSeconds: 900 }), { status: 200 }),
      );
    vi.stubGlobal('fetch', request);

    render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>,
    );

    await act(async () => Promise.resolve());
    expect(request).toHaveBeenCalledTimes(1);

    await act(async () => vi.advanceTimersByTimeAsync(840_000));
    expect(request).toHaveBeenCalledTimes(2);
  });

  it('refreshes again when window focus returns', async () => {
    const request = vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify({ token: 'token', expiresInSeconds: 900 }), { status: 200 }),
      );
    vi.stubGlobal('fetch', request);

    render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>,
    );

    expect(await screen.findByText('authenticated')).toBeInTheDocument();

    await act(async () => {
      window.dispatchEvent(new Event('focus'));
      await Promise.resolve();
    });

    expect(request).toHaveBeenCalledTimes(2);
  });

  it('always clears local state when the logout request fails', async () => {
    const request = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ token: 'token', expiresInSeconds: 900 }), { status: 200 }),
      )
      .mockRejectedValueOnce(new Error('offline'));
    vi.stubGlobal('fetch', request);

    render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>,
    );

    expect(await screen.findByText('authenticated')).toBeInTheDocument();
    screen.getByRole('button', { name: 'Logout' }).click();

    await waitFor(() => expect(screen.getByText('unauthenticated')).toBeInTheDocument());
  });
});
