/**
 * Contracts between the UI and the API (functions/api). The browser clients live in authService.ts and
 * dbService.ts; the mocks (*.mock.ts) exist for component tests.
 */
import type { Locale, TermId } from '../lib/termsSchema';

export type { Locale, TermId };

export interface Credentials {
  passportNumber: string;
  phoneNumber: string;
  email: string;
  fullName: string;
}

/** What the server tells the browser about the verified student: the roster's name, a masked email, the last four of the passport. */
export interface VerifiedStudent {
  fullName: string;
  email: string;
  passportLast4: string;
}

export interface Session {
  sessionId: string;
  student: VerifiedStudent;
  /** ISO-8601 time the session was issued; the declaration displays this date after sign-in. */
  issuedAt: string;
  expiresAt: string;
  /** Bearer token for the submission calls. Memory only. */
  token: string;
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
  /** Record id (UUID), used for the document upload and download. */
  id: string;
  /** e.g. PACF-2026-K7M2QX */
  referenceNumber: string;
  receivedAt: string;
}

export type EmailState = 'pending' | 'sent' | 'logged' | 'failed';

/** Where the student's copy went. `emailTo` is masked (e•••@example.com). */
export interface DocumentStatus {
  state: EmailState;
  emailTo?: string;
}

export interface DbService {
  /** Step 1: record the declaration. The server assigns the reference number. */
  submitCompliance(payload: SubmissionPayload): Promise<SubmissionReceipt>;
  /** Step 2: store the rendered PDF; the server emails it. */
  uploadDocument(session: Session, submissionId: string, pdf: Blob): Promise<DocumentStatus>;
  /** Try the email again from the stored PDF. */
  resendEmail(session: Session, submissionId: string): Promise<DocumentStatus>;
  /** Fetch the stored PDF (the same file that was emailed). */
  downloadDocument(session: Session, submissionId: string): Promise<Blob>;
}

export type ServiceErrorCode = 'invalid_credentials' | 'too_many_attempts' | 'session_expired' | 'invalid_submission' | 'network';

export class ServiceError extends Error {
  readonly code: ServiceErrorCode;
  constructor(code: ServiceErrorCode, message: string) {
    super(message);
    this.name = 'ServiceError';
    this.code = code;
  }
}
