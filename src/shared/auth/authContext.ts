import { createContext } from 'react';
import type { AccessTokenEnvelope, SessionEndReason } from './session';

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

export interface AuthContextValue {
  status: AuthStatus;
  sessionEndReason: SessionEndReason;
  startSession: (envelope: AccessTokenEnvelope) => void;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
