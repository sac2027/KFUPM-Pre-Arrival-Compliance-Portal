import { Button } from '../../components/Button';
import { useI18n } from '../../i18n/I18nProvider';
import type { DocumentStatus } from '../../services/types';

/** One line under the reference: where the copy went, or what to do if it did not. */
export function EmailStatus({ status, onRetry, retrying }: { status: DocumentStatus; onRetry: () => void; retrying: boolean }) {
  const { t } = useI18n();
  const email = status.emailTo ?? '';
  if (status.state === 'pending') {
    return (
      <p className="receipt__email receipt__email--pending" role="status" aria-busy="true">
        {t('receipt.email.pending', { email })}
      </p>
    );
  }
  if (status.state === 'sent' || status.state === 'logged') {
    return (
      <p className="receipt__email receipt__email--sent" role="status">
        {t('receipt.email.sent', { email })}
      </p>
    );
  }
  return (
    <div className="receipt__email receipt__email--failed">
      <p role="alert">{t('receipt.email.failed', { email })}</p>
      <Button type="button" variant="quiet" busy={retrying} onClick={onRetry}>
        {t('receipt.email.retry')}
      </Button>
    </div>
  );
}
