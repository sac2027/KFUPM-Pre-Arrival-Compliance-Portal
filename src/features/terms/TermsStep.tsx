import { useI18n } from '../../i18n/I18nProvider';

/** Step 2. The five term cards arrive in Task 9; this step already owns its heading so focus and motion work. */
export function TermsStep() {
  const { t } = useI18n();
  return (
    <section className="terms" aria-labelledby="terms-heading">
      <h2 id="terms-heading" data-step-heading tabIndex={-1}>
        {t('terms.heading')}
      </h2>
    </section>
  );
}
