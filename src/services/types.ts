/**
 * Contracts between the UI and the outside world. KFUPM IT replaces the *implementations*
 * (authService.ts, dbService.ts); nothing in src/features or src/components may change.
 */
import type { Locale, TermId } from '../lib/termsSchema';

export type { Locale, TermId };

export interface Credentials {
  passportNumber: string;
  phoneNumber: string;
  fullName: string;
}

export interface Session {
  sessionId: string;
  student: Credentials;
  /** ISO-8601 time the session was issued; the declaration displays this date after sign-in. */
  issuedAt: string;
}

export interface AuthService {
  login(credentials: Credentials): Promise<Session>;
  logout(): Promise<void>;
}

export type SignatureMethod = 'draw' | 'upload';

export interface Signature {
  method: SignatureMethod;
  /** PNG or JPEG data URL. */
  dataUrl: string;
}

export interface SubmissionPayload {
  session: Session;
  locale: Locale;
  documentRef: 'KFUPM-INTL-PACF';
  /** Must be exactly the five mandated ids, in order. The real backend MUST enforce this too. */
  acceptedTermIds: TermId[];
  /** PNG or JPEG data URL. */
  signature: Signature;
  /** ISO-8601 signing time. */
  submittedAt: string;
}

export interface SubmissionReceipt {
  /** e.g. PACF-2026-K7M2QX */
  referenceNumber: string;
  receivedAt: string;
}

export interface DbService {
  submitCompliance(payload: SubmissionPayload): Promise<SubmissionReceipt>;
}

export type ServiceErrorCode = 'invalid_credentials' | 'invalid_submission' | 'network';

export class ServiceError extends Error {
  readonly code: ServiceErrorCode;
  constructor(code: ServiceErrorCode, message: string) {
    super(message);
    this.name = 'ServiceError';
    this.code = code;
  }
}
