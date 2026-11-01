import { useI18n } from '../i18n/I18nProvider';

/** Shows the *other* language in its own script; `lang` makes screen readers pronounce it correctly. */
export function LanguageToggle() {
  const { locale, setLocale, t } = useI18n();
  const other = locale === 'en' ? 'ar' : 'en';
  return (
    <button type="button" className="lang-toggle" lang={other} onClick={() => setLocale(other)}>
      {t('lang.other')}
    </button>
  );
}
