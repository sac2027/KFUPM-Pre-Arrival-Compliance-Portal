import raw from '../data/compliance-terms.json';
import { parseTerms } from './termsSchema';
import type { ComplianceTerms } from './termsSchema';

/** The validated, typed policy content. The only place the app reads compliance-terms.json. */
export function loadTerms(): ComplianceTerms {
  return parseTerms(raw);
}
