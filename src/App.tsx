import { useReducer } from 'react';
import { Masthead } from './components/Masthead';
import { Stepper } from './components/Stepper';
import { I18nProvider, useI18n } from './i18n/I18nProvider';
import { loadTerms } from './lib/terms';
import { flowReducer, initialFlowState } from './state/flow';

const TERMS = loadTerms();

function Shell() {
  const { t, locale } = useI18n();
  const [flow] = useReducer(flowReducer, initialFlowState);
  const doc = TERMS.document;
  return (
    <>
      <a className="skip-link" href="#main">
        {t('a11y.skip')}
      </a>
      <Masthead />
      <main id="main" className="page">
        <article className="doc">
          <Stepper current={flow.step} />
          <header className="doc__head">
            <h1 className="doc__title">{doc.title[locale]}</h1>
            <dl className="doc__meta">
              <dt>{t('doc.ref')}</dt>
              <dd>{doc.ref}</dd>
              <dt>{t('doc.stage')}</dt>
              <dd>{doc.stage[locale]}</dd>
              <dt>{t('doc.requirement')}</dt>
              <dd>{t('doc.mandatory')}</dd>
            </dl>
          </header>
          <p className="doc__intro">{doc.intro[locale]}</p>
        </article>
      </main>
      <footer className="page__footer">
        <p>{t('app.org')}</p>
      </footer>
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
