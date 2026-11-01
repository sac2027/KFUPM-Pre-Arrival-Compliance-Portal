import { useReducer } from 'react';
import { Masthead } from './components/Masthead';
import { StepPanel } from './components/StepPanel';
import { Stepper } from './components/Stepper';
import { LoginScreen } from './features/login/LoginScreen';
import { TermsStep } from './features/terms/TermsStep';
import { I18nProvider, useI18n } from './i18n/I18nProvider';
import { loadTerms } from './lib/terms';
import { flowReducer, initialFlowState } from './state/flow';

const TERMS = loadTerms();

function Shell() {
  const { t, locale } = useI18n();
  const [flow, dispatch] = useReducer(flowReducer, initialFlowState);
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
          <StepPanel step={flow.step}>
            {flow.step === 'login' && <LoginScreen onLoggedIn={(session) => dispatch({ type: 'loggedIn', session })} />}
            {flow.step === 'terms' && flow.session && (
              <TermsStep
                session={flow.session}
                initialAccepted={flow.acceptedTermIds}
                onContinue={(ids) => dispatch({ type: 'termsAccepted', ids })}
              />
            )}
          </StepPanel>
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
