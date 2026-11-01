import { useRef, useState } from 'react';
import { Button } from '../../components/Button';
import { useI18n } from '../../i18n/I18nProvider';
import { loadTerms } from '../../lib/terms';
import { TERM_IDS } from '../../lib/termsSchema';
import type { TermId } from '../../lib/termsSchema';
import type { Session } from '../../services/types';
import { TermCard } from './TermCard';

const TERMS = loadTerms();

/** Gregorian with Latin digits in both languages, so the printed declaration reads the same everywhere. */
function formatDate(iso: string, locale: 'en' | 'ar'): string {
  const tag = locale === 'ar' ? 'ar-u-nu-latn-ca-gregory' : 'en-GB-u-ca-gregory';
  return new Intl.DateTimeFormat(tag, { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(iso));
}

export function TermsStep({
  session,
  initialAccepted,
  onContinue,
}: {
  session: Session;
  initialAccepted: TermId[];
  onContinue: (ids: TermId[]) => void;
}) {
  const { t, locale } = useI18n();
  const [accepted, setAccepted] = useState<ReadonlySet<TermId>>(() => new Set(initialAccepted));
  const listRef = useRef<HTMLOListElement>(null);
  const count = accepted.size;
  const complete = count === TERM_IDS.length;

  const toggle = (id: TermId, on: boolean) =>
    setAccepted((prev) => {
      const next = new Set(prev);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });

  const onContinueClick = () => {
    if (!complete) {
      // Inactive, not disabled: keep it focusable and send the student to what is missing.
      listRef.current?.querySelector<HTMLInputElement>('input:not(:checked)')?.focus();
      return;
    }
    onContinue(TERM_IDS.filter((id) => accepted.has(id)));
  };

  return (
    <section className="terms" aria-labelledby="terms-heading">
      <h2 id="terms-heading" data-step-heading tabIndex={-1}>
        {t('terms.heading')}
      </h2>

      <dl className="declarant">
        <dt>{t('terms.declarant')}</dt>
        <dd dir="auto">{session.student.fullName}</dd>
        <dt>{t('terms.date')}</dt>
        <dd>{formatDate(session.issuedAt, locale)}</dd>
      </dl>

      <p className="terms__lead">{t('terms.lead')}</p>

      <div className="terms__progress">
        <div className="meter" aria-hidden="true">
          {TERM_IDS.map((id, i) => (
            <span key={id} className="meter__seg" data-on={i < count ? 'true' : 'false'} />
          ))}
        </div>
        <p className="terms__count" aria-live="polite">
          {t('terms.progress', { n: count, total: TERM_IDS.length })}
        </p>
      </div>

      <ol className="terms__list" ref={listRef}>
        {TERMS.terms.map((term, i) => (
          <TermCard
            key={term.id}
            term={term}
            index={i}
            links={TERMS.links}
            checked={accepted.has(term.id)}
            onChange={(on) => toggle(term.id, on)}
          />
        ))}
      </ol>

      <div className="terms__actions">
        <Button
          type="button"
          onClick={onContinueClick}
          aria-disabled={complete ? undefined : 'true'}
          aria-describedby={complete ? undefined : 'terms-incomplete'}
        >
          {t('terms.continue')}
        </Button>
        {!complete && (
          <p id="terms-incomplete" className="terms__hint">
            {t('terms.incomplete')}
          </p>
        )}
      </div>
    </section>
  );
}
