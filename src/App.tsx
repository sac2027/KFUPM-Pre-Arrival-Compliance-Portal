import { LanguageToggle } from './components/LanguageToggle';
import { I18nProvider, useI18n } from './i18n/I18nProvider';

function Shell() {
  const { t } = useI18n();
  return (
    <>
      <a className="skip-link" href="#main">
        {t('a11y.skip')}
      </a>
      <main id="main">
        <h1>{t('app.title')}</h1>
        <p>{t('app.org')}</p>
        <LanguageToggle />
      </main>
    </>
  );
}

export function App() {
  return (
    <I18nProvider>
      <Shell />
    </I18nProvider>
  );
}
