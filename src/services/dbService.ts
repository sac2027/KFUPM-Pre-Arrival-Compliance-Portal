/**
 * IT HAND-OFF: replace the exported `dbService` with a real POST to the KFUPM backend.
 * This file is a MOCK: it validates the payload, simulates latency and returns a receipt. Nothing is stored.
 * Contract notes for the real implementation:
 *  - Re-validate everything here on the server (especially the five-term rule and the signature type).
 *  - Encrypt passport/phone/name/signature at rest; never log the payload.
 *  - Return only `{ referenceNumber, receivedAt }`; do not echo PII back to the browser.
 */
import { TERM_IDS } from '../lib/termsSchema';
import { DEFAULT_LATENCY_MS, randomCode, simulate } from './mockUtils';
import type { MockOptions } from './mockUtils';
import { ServiceError } from './types';
import type { DbService, SubmissionPayload, SubmissionReceipt } from './types';

const SIGNATURE_DATA_URL = /^data:image\/(png|jpeg);base64,[A-Za-z0-9+/]+=*$/;

function assertValid(p: SubmissionPayload): void {
  const ids = p.acceptedTermIds;
  if (ids.length !== TERM_IDS.length || !TERM_IDS.every((id, i) => ids[i] === id)) {
    throw new ServiceError('invalid_submission', 'All five terms must be accepted, in order.');
  }
  if (!SIGNATURE_DATA_URL.test(p.signature.dataUrl)) {
    throw new ServiceError('invalid_submission', 'Signature must be a PNG or JPEG image.');
  }
}

export function createMockDbService(opts: MockOptions = {}): DbService {
  return {
    submitCompliance(payload: SubmissionPayload): Promise<SubmissionReceipt> {
      return simulate(opts, () => {
        assertValid(payload);
        const receivedAt = new Date().toISOString();
        return {
          referenceNumber: `PACF-${receivedAt.slice(0, 4)}-${randomCode(6)}`,
          receivedAt,
        };
      });
    },
  };
}

export const dbService: DbService = createMockDbService({ latencyMs: DEFAULT_LATENCY_MS });
