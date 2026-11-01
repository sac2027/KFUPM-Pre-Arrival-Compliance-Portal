import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { LoginScreen } from '../../src/features/login/LoginScreen';
import { I18nProvider } from '../../src/i18n/I18nProvider';
import type { Locale } from '../../src/i18n/I18nProvider';
import { ServiceError } from '../../src/services/types';
import type { AuthService, Session } from '../../src/services/types';

const session: Session = {
  sessionId: 's-1',
  student: { passportNumber: 'A1234567', phoneNumber: '+966551234567', fullName: 'Mai Nguyễn' },
  issuedAt: '2026-11-01T10:00:00.000Z',
};
const makeAuth = (login: AuthService['login']): AuthService => ({ login: vi.fn(login), logout: vi.fn() });

function setup(auth: AuthService, locale: Locale = 'en') {
  const onLoggedIn = vi.fn();
  render(
    <I18nProvider initialLocale={locale}>
      <LoginScreen auth={auth} onLoggedIn={onLoggedIn} />
    </I18nProvider>,
  );
  const user = userEvent.setup();
  const f = {
    passport: () => screen.getByLabelText(/passport number|رقم جواز السفر/i),
    phone: () => screen.getByLabelText(/phone number|رقم الهاتف/i),
    name: () => screen.getByLabelText(/full name|الاسم الكامل/i),
    submit: () => screen.getByRole('button', { name: /sign in|signing in|تسجيل الدخول|جارٍ/i }),
  };
  const fill = async (p = 'a1234567', ph = '+966 55 123 4567', n = 'Mai Nguyễn') => {
    await user.type(f.passport(), p);
    await user.type(f.phone(), ph);
    await user.type(f.name(), n);
  };
  return { user, f, fill, onLoggedIn };
}

describe('LoginScreen', () => {
  it('shows three required errors on an empty submit, focuses the first, and does not call auth', async () => {
    const auth = makeAuth(async () => session);
    const { user, f } = setup(auth);
    await user.click(f.submit());
    expect(await screen.findAllByText('This field is required.')).toHaveLength(3);
    for (const el of [f.passport(), f.phone(), f.name()]) expect(el).toHaveAttribute('aria-invalid', 'true');
    expect(f.passport()).toHaveFocus();
    expect(auth.login).not.toHaveBeenCalled();
  });

  it('signs in with normalised values and reports the session', async () => {
    const auth = makeAuth(async () => session);
    const { user, f, fill, onLoggedIn } = setup(auth);
    await fill();
    await user.click(f.submit());
    await waitFor(() => expect(onLoggedIn).toHaveBeenCalledWith(session));
    expect(auth.login).toHaveBeenCalledTimes(1);
    expect(auth.login).toHaveBeenCalledWith({ passportNumber: 'A1234567', phoneNumber: '+966551234567', fullName: 'Mai Nguyễn' });
  });

  it('accepts Arabic-Indic digits and an Arabic name', async () => {
    const auth = makeAuth(async () => session);
    const { user, f, fill } = setup(auth);
    await fill('N١٢٣٤٥٦٧', '+٩٦٦ ٥٥ ١٢٣ ٤٥٦٧', 'محمد عبدالله الغامدي');
    await user.click(f.submit());
    await waitFor(() => expect(auth.login).toHaveBeenCalledTimes(1));
    expect(auth.login).toHaveBeenCalledWith({ passportNumber: 'N1234567', phoneNumber: '+966551234567', fullName: 'محمد عبدالله الغامدي' });
  });

  it('validates a field when it loses focus, linking the error with aria-describedby', async () => {
    const { user, f } = setup(makeAuth(async () => session));
    await user.type(f.passport(), 'P<');
    await user.tab();
    const err = await screen.findByText(/5–20 letters and numbers/);
    expect(f.passport().getAttribute('aria-describedby')).toContain(err.id);
  });

  it('allows only one request in flight and shows a stable pending state', async () => {
    let resolve!: (s: Session) => void;
    const auth = makeAuth(() => new Promise<Session>((r) => (resolve = r)));
    const { user, f, fill } = setup(auth);
    await fill();
    await user.dblClick(f.submit());
    expect(auth.login).toHaveBeenCalledTimes(1);
    expect(f.submit()).toHaveAttribute('aria-busy', 'true');
    expect(f.submit()).toHaveTextContent('Signing in…');
    resolve(session);
    await waitFor(() => expect(f.submit()).toHaveAttribute('aria-busy', 'false'));
  });

  it.each([
    ['invalid_credentials', /couldn’t sign you in/i],
    ['network', /can’t reach the server/i],
  ] as const)('keeps the form filled and announces a %s failure', async (code, text) => {
    const auth = makeAuth(async () => {
      throw new ServiceError(code, 'x');
    });
    const { user, f, fill, onLoggedIn } = setup(auth);
    await fill();
    await user.click(f.submit());
    expect(await screen.findByRole('alert')).toHaveTextContent(text);
    expect(f.name()).toHaveValue('Mai Nguyễn');
    expect(f.submit()).toBeEnabled();
    expect(onLoggedIn).not.toHaveBeenCalled();
  });

  it('sets direction per field: passport and phone LTR, name auto; and PII-safe autocomplete', () => {
    setup(makeAuth(async () => session));
    const p = screen.getByLabelText(/passport number/i);
    expect(p).toHaveAttribute('dir', 'ltr');
    expect(p).toHaveAttribute('autocomplete', 'off');
    expect(screen.getByLabelText(/phone number/i)).toHaveAttribute('dir', 'ltr');
    expect(screen.getByLabelText(/phone number/i)).toHaveAttribute('autocomplete', 'tel');
    expect(screen.getByLabelText(/full name/i)).toHaveAttribute('dir', 'auto');
  });

  it('renders in Arabic', () => {
    setup(makeAuth(async () => session), 'ar');
    expect(screen.getByLabelText('رقم جواز السفر')).toBeInTheDocument();
    expect(screen.getByLabelText('الاسم الكامل')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'تسجيل الدخول' })).toBeInTheDocument();
  });
});
