import { useReducer } from 'react';
import { Masthead } from './components/Masthead';
import { WorstCaseToggle } from './dev/WorstCaseToggle';
import { StepPanel } from './components/StepPanel';
import { Stepper } from './components/Stepper';
import { LoginScreen } from './features/login/LoginScreen';
import { ReceiptScreen } from './features/receipt/ReceiptScreen';
import { SignatureStep } from './features/signature/SignatureStep';
import { TermsStep } from './features/terms/TermsStep';
import { I18nProvider, useI18n } from './i18n/I18nProvider';
import { loadTerms } from './lib/terms';
import { authService } from './services/authService';
import { dbService } from './services/dbService';
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
            {flow.step === 'sign' && flow.session && (
              <SignatureStep
                onBack={() => dispatch({ type: 'back' })}
                onSubmit={async (signature) => {
                  const receipt = await dbService.submitCompliance({
                    session: flow.session!,
                    locale,
                    documentRef: 'KFUPM-INTL-PACF',
                    acceptedTermIds: flow.acceptedTermIds,
                    signature,
                    submittedAt: new Date().toISOString(),
                  });
                  dispatch({ type: 'submitted', receipt, signature });
                }}
              />
            )}
            {flow.step === 'done' && flow.session && flow.receipt && flow.signature && (
              <ReceiptScreen
                session={flow.session}
                acceptedTermIds={flow.acceptedTermIds}
                signature={flow.signature}
                receipt={flow.receipt}
                onFinish={() => {
                  void authService.logout();
                  dispatch({ type: 'reset' });
                }}
              />
            )}
          </StepPanel>
        </article>
      </main>
      {import.meta.env.DEV && <WorstCaseToggle />}
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
