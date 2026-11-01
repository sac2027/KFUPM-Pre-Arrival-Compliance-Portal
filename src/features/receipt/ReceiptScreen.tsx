import { useEffect, useRef, useState } from 'react';
import { Button } from '../../components/Button';
import { useI18n } from '../../i18n/I18nProvider';
import { formatDateTime } from '../../lib/format';
import type { TermId } from '../../lib/termsSchema';
import type { Session, Signature, SubmissionReceipt } from '../../services/types';
import { PrintSheet } from './PrintSheet';

export function ReceiptScreen({
  session,
  acceptedTermIds,
  signature,
  receipt,
  onFinish,
}: {
  session: Session;
  acceptedTermIds: TermId[];
  signature: Signature;
  receipt: SubmissionReceipt;
  onFinish: () => void;
}) {
  const { t, locale } = useI18n();
  const [confirming, setConfirming] = useState(false);
  const finishRef = useRef<HTMLButtonElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);
  const asked = useRef(false);

  // Move focus to the decision when it appears, and back to where the student was if they decline.
  useEffect(() => {
    if (confirming) {
      asked.current = true;
      confirmRef.current?.focus();
    } else if (asked.current) {
      finishRef.current?.focus();
    }
  }, [confirming]);

  return (
    <>
      <section className="receipt" aria-labelledby="receipt-heading">
        <h2 id="receipt-heading" data-step-heading tabIndex={-1}>
          {t('receipt.heading')}
        </h2>
        <p className="receipt__lead">{t('receipt.lead')}</p>
        <dl className="receipt__facts">
          <dt>{t('receipt.reference')}</dt>
          <dd className="receipt__ref" translate="no">
            {receipt.referenceNumber}
          </dd>
          <dt>{t('receipt.received')}</dt>
          <dd>{formatDateTime(receipt.receivedAt, locale)}</dd>
        </dl>
        <div className="receipt__actions">
          <Button type="button" onClick={() => window.print()}>
            {t('receipt.print')}
          </Button>
          {!confirming && (
            <button ref={finishRef} type="button" className="btn btn--quiet" onClick={() => setConfirming(true)}>
              {t('receipt.finish')}
            </button>
          )}
        </div>
        {confirming && (
          <div className="receipt__confirm">
            <p role="alert">{t('receipt.finishWarn')}</p>
            <div className="receipt__actions">
              <button ref={confirmRef} type="button" className="btn" onClick={onFinish}>
                {t('receipt.finishConfirm')}
              </button>
              <Button type="button" variant="quiet" onClick={() => setConfirming(false)}>
                {t('receipt.finishCancel')}
              </Button>
            </div>
          </div>
        )}
        <p className="receipt__privacy">{t('receipt.privacy')}</p>
      </section>
      <PrintSheet session={session} acceptedTermIds={acceptedTermIds} signature={signature} receipt={receipt} />
    </>
  );
}
