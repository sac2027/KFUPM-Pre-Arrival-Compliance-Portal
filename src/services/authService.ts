/**
 * IT HAND-OFF: replace the exported `authService` with a real SSO/backend implementation of `AuthService`.
 * This file is a MOCK: it accepts any non-blank credentials and issues a client-side session.
 * Contract notes for the real implementation:
 *  - Reject with `new ServiceError('invalid_credentials', …)` when the student cannot be verified.
 *  - Never log, persist (localStorage/sessionStorage) or put credentials in a URL.
 */
import { isWorstCase, shouldFailOnce, WORST_FULL_NAME } from '../dev/worstCase';
import { DEFAULT_LATENCY_MS, simulate } from './mockUtils';
import type { MockOptions } from './mockUtils';
import { ServiceError } from './types';
import type { AuthService, Credentials, Session } from './types';

export function createMockAuthService(opts: MockOptions = {}): AuthService {
  return {
    login(credentials: Credentials): Promise<Session> {
      return simulate(opts, () => {
        if (import.meta.env.DEV && shouldFailOnce('login')) throw new ServiceError('network', 'dev: simulated outage');
        const blank = Object.values(credentials).some((v) => v.trim() === '');
        if (blank) throw new ServiceError('invalid_credentials', 'All three fields are required.');
        return {
          sessionId: crypto.randomUUID(),
          // dev only: a real SSO may return a longer name than the form allows (stress data)
          student: import.meta.env.DEV && isWorstCase() ? { ...credentials, fullName: WORST_FULL_NAME } : { ...credentials },
          issuedAt: new Date().toISOString(),
        };
      });
    },
    logout(): Promise<void> {
      return simulate({ ...opts, failWith: undefined }, () => undefined);
    },
  };
}

export const authService: AuthService = createMockAuthService({ latencyMs: DEFAULT_LATENCY_MS });
