export interface AccessTokenEnvelope {
  token: string;
  expiresInSeconds: number;
}

export type SessionEndReason = 'expired' | null;

interface SessionSnapshot {
  token: string | null;
  expiresAt: number | null;
  endReason: SessionEndReason;
}

type SessionListener = (snapshot: SessionSnapshot) => void;

const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL;

const API_BASE_URL = configuredBaseUrl ? configuredBaseUrl.replace(/\/$/, '') : '';

let snapshot: SessionSnapshot = { token: null, expiresAt: null, endReason: null };

let refreshPromise: Promise<AccessTokenEnvelope> | null = null;

let sessionVersion = 0;

const listeners = new Set<SessionListener>();

function publish(nextSnapshot: SessionSnapshot): void {
  sessionVersion += 1;
  snapshot = nextSnapshot;
  listeners.forEach((listener) => listener(snapshot));
}

export function subscribeToSession(listener: SessionListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getSessionSnapshot(): SessionSnapshot {
  return snapshot;
}

export function getAccessToken(): string | null {
  return snapshot.token;
}

export function establishSession(envelope: AccessTokenEnvelope): void {
  publish({
    token: envelope.token,
    expiresAt: Date.now() + envelope.expiresInSeconds * 1_000,
    endReason: null,
  });
}

export function clearSession(reason: SessionEndReason = null): void {
  publish({ token: null, expiresAt: null, endReason: reason });
}

export async function refreshSession(notifyOnFailure = true): Promise<AccessTokenEnvelope> {
  if (refreshPromise) return refreshPromise;

  const hadAuthenticatedSession = snapshot.token !== null;

  const versionAtStart = sessionVersion;

  refreshPromise = (async () => {
    const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) throw new Error('Unable to refresh session');

    const envelope = (await response.json()) as AccessTokenEnvelope;
    establishSession(envelope);
    return envelope;
  })()
    .catch((error: unknown) => {
      if (sessionVersion === versionAtStart) {
        clearSession(notifyOnFailure && hadAuthenticatedSession ? 'expired' : null);
      }

      throw error;
    })
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
}

export function resetSessionForTests(): void {
  snapshot = { token: null, expiresAt: null, endReason: null };
  refreshPromise = null;
  sessionVersion = 0;
  listeners.clear();
}
