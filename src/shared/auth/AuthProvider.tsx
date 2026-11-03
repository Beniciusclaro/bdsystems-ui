import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { publicApiFetch } from '../api/client';
import { AuthContext, type AuthContextValue, type AuthStatus } from './authContext';
import {
  clearSession,
  establishSession,
  refreshSession,
  subscribeToSession,
  type SessionEndReason,
} from './session';

interface AuthProviderProps {
  children: ReactNode;
}

const REFRESH_EARLY_MS = 60_000;

export function AuthProvider({ children }: AuthProviderProps) {
  const [status, setStatus] = useState<AuthStatus>('loading');

  const [sessionEndReason, setSessionEndReason] = useState<SessionEndReason>(null);

  const [expiresAt, setExpiresAt] = useState<number | null>(null);

  useEffect(() => {
    let active = true;

    const unsubscribe = subscribeToSession((nextSnapshot) => {
      if (!active) return;
      setStatus(nextSnapshot.token ? 'authenticated' : 'unauthenticated');
      setSessionEndReason(nextSnapshot.endReason);
      setExpiresAt(nextSnapshot.expiresAt);
    });

    void refreshSession(false)
      .then(() => {
        if (active) setStatus('authenticated');
      })
      .catch(() => {
        if (active) setStatus('unauthenticated');
      });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (status !== 'authenticated' || !expiresAt) return;

    const refresh = () => void refreshSession().catch(() => undefined);

    const timeout = window.setTimeout(
      refresh,
      Math.max(0, expiresAt - Date.now() - REFRESH_EARLY_MS),
    );

    const handleFocus = () => refresh();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') refresh();
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.clearTimeout(timeout);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [expiresAt, status]);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      sessionEndReason,
      startSession: establishSession,
      logout: async () => {
        try {
          await publicApiFetch('/api/auth/logout', { method: 'POST' });
        } finally {
          clearSession();
        }
      },
    }),
    [sessionEndReason, status],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
