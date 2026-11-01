import { describe, expect, it } from 'vitest';
import { flowReducer, initialFlowState } from '../../src/state/flow';
import type { FlowState } from '../../src/state/flow';
import { TERM_IDS } from '../../src/lib/termsSchema';
import type { Session } from '../../src/services/types';

const session: Session = {
  sessionId: 's-1',
  student: { passportNumber: 'A1234567', phoneNumber: '+966551234567', fullName: 'Mai Nguyễn' },
  issuedAt: '2026-11-01T10:00:00.000Z',
};
const all = [...TERM_IDS];
const at = (over: Partial<FlowState>): FlowState => ({ ...initialFlowState, ...over });

describe('flowReducer', () => {
  it('starts at login with nothing set', () => {
    expect(initialFlowState).toEqual({ step: 'login', session: null, acceptedTermIds: [], receipt: null, signature: null });
  });

  it('moves to terms after login and keeps the session', () => {
    const s = flowReducer(initialFlowState, { type: 'loggedIn', session });
    expect(s.step).toBe('terms');
    expect(s.session).toBe(session);
  });

  it('cannot reach sign without a session', () => {
    const s = flowReducer(initialFlowState, { type: 'termsAccepted', ids: all });
    expect(s).toBe(initialFlowState);
  });

  it('cannot reach sign unless all five terms are accepted, in order', () => {
    const terms = at({ step: 'terms', session });
    expect(flowReducer(terms, { type: 'termsAccepted', ids: all.slice(0, 4) })).toBe(terms);
    expect(flowReducer(terms, { type: 'termsAccepted', ids: [...all].reverse() })).toBe(terms);
    expect(flowReducer(terms, { type: 'termsAccepted', ids: [...all.slice(0, 4), 'saudi-laws'] })).toBe(terms);
    const ok = flowReducer(terms, { type: 'termsAccepted', ids: all });
    expect(ok.step).toBe('sign');
    expect(ok.acceptedTermIds).toEqual(all);
  });

  it('goes back from sign to terms and keeps the accepted terms', () => {
    const sign = at({ step: 'sign', session, acceptedTermIds: all });
    const s = flowReducer(sign, { type: 'back' });
    expect(s.step).toBe('terms');
    expect(s.acceptedTermIds).toEqual(all);
  });

  it('does not go back to login, and cannot go back from done', () => {
    const terms = at({ step: 'terms', session });
    expect(flowReducer(terms, { type: 'back' })).toBe(terms);
    const done = at({ step: 'done', session, acceptedTermIds: all, receipt: { referenceNumber: 'PACF-2026-AAAAAA', receivedAt: 'x' }, signature: { method: 'draw', dataUrl: 'd' } });
    expect(flowReducer(done, { type: 'back' })).toBe(done);
  });

  it('completes only from sign with a session and all terms', () => {
    const receipt = { referenceNumber: 'PACF-2026-AAAAAA', receivedAt: '2026-11-01T10:06:00.000Z' };
    const signature = { method: 'draw' as const, dataUrl: 'data:image/png;base64,AAAA' };
    const early = at({ step: 'terms', session, acceptedTermIds: all });
    expect(flowReducer(early, { type: 'submitted', receipt, signature })).toBe(early);
    const sign = at({ step: 'sign', session, acceptedTermIds: all });
    const s = flowReducer(sign, { type: 'submitted', receipt, signature });
    expect(s.step).toBe('done');
    expect(s.receipt).toEqual(receipt);
    expect(s.signature).toEqual(signature); // kept for the printable declaration
  });

  it('reset wipes everything (the session and PII are dropped)', () => {
    const done = at({ step: 'done', session, acceptedTermIds: all, receipt: { referenceNumber: 'P', receivedAt: 'x' }, signature: { method: 'draw', dataUrl: 'd' } });
    expect(flowReducer(done, { type: 'reset' })).toEqual(initialFlowState);
  });
});
