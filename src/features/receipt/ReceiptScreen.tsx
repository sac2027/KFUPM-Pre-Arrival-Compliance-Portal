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
  return (
    <>
      <section className="receipt" aria-labelledby="receipt-heading">
        <h2 id="receipt-heading" data-step-heading tabIndex={-1}>
          {t('receipt.heading')}
        </h2>
        <p className="receipt__lead">{t('receipt.lead')}</p>
        <dl className="receipt__facts">
          <dt>{t('receipt.reference')}</dt>
          <dd className="receipt__ref">{receipt.referenceNumber}</dd>
          <dt>{t('receipt.received')}</dt>
          <dd>{formatDateTime(receipt.receivedAt, locale)}</dd>
        </dl>
        <div className="receipt__actions">
          <Button type="button" onClick={() => window.print()}>
            {t('receipt.print')}
          </Button>
          <Button type="button" variant="quiet" onClick={onFinish}>
            {t('receipt.finish')}
          </Button>
        </div>
        <p className="receipt__privacy">{t('receipt.privacy')}</p>
      </section>
      <PrintSheet session={session} acceptedTermIds={acceptedTermIds} signature={signature} receipt={receipt} />
    </>
  );
}
