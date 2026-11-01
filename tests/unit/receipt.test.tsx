import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ReceiptScreen } from '../../src/features/receipt/ReceiptScreen';
import { I18nProvider } from '../../src/i18n/I18nProvider';
import type { Locale } from '../../src/i18n/I18nProvider';
import { loadTerms } from '../../src/lib/terms';
import { TERM_IDS } from '../../src/lib/termsSchema';
import { termText } from '../../src/lib/termsSchema';
import type { Session } from '../../src/services/types';

const TERMS = loadTerms();
const session: Session = {
  sessionId: 's-1',
  student: { passportNumber: 'N1234567', phoneNumber: '+966551234567', fullName: 'Mai Nguyễn' },
  issuedAt: '2026-11-01T10:00:00.000Z',
};
const receipt = { referenceNumber: 'PACF-2026-K7M2QX', receivedAt: '2026-11-01T10:06:30.000Z' };
const signature = { method: 'draw' as const, dataUrl: 'data:image/png;base64,SIGNED' };

function setup(locale: Locale = 'en') {
  const onFinish = vi.fn();
  render(
    <I18nProvider initialLocale={locale}>
      <ReceiptScreen session={session} acceptedTermIds={[...TERM_IDS]} signature={signature} receipt={receipt} onFinish={onFinish} />
    </I18nProvider>,
  );
  return { onFinish, user: userEvent.setup() };
}

afterEach(() => vi.restoreAllMocks());

describe('ReceiptScreen (on screen)', () => {
  it('confirms receipt and shows the reference number and time', () => {
    setup();
    expect(screen.getByRole('heading', { level: 2, name: 'Declaration submitted' })).toBeInTheDocument();
    const screenPart = document.querySelector('.receipt') as HTMLElement;
    expect(within(screenPart).getByText('PACF-2026-K7M2QX')).toBeInTheDocument();
    expect(within(screenPart).getByText(/1 November 2026/)).toBeInTheDocument();
  });

  it('prints', async () => {
    const print = vi.spyOn(window, 'print').mockImplementation(() => {});
    const { user } = setup();
    await user.click(screen.getByRole('button', { name: 'Print or save as PDF' }));
    expect(print).toHaveBeenCalledTimes(1);
  });

  it('asks before clearing (it destroys the only copy of the declaration), then clears', async () => {
    const { user, onFinish } = setup();
    await user.click(screen.getByRole('button', { name: 'Finish and clear my details' }));
    expect(onFinish).not.toHaveBeenCalled(); // one click is not enough
    expect(screen.getByRole('alert')).toHaveTextContent(/print or save it first/i);
    const confirm = screen.getByRole('button', { name: 'Yes, clear my details' });
    expect(confirm).toHaveFocus(); // keyboard users land on the decision
    await user.click(confirm);
    expect(onFinish).toHaveBeenCalledTimes(1);
  });

  it('lets the student change their mind', async () => {
    const { user, onFinish } = setup();
    await user.click(screen.getByRole('button', { name: 'Finish and clear my details' }));
    await user.click(screen.getByRole('button', { name: 'Keep my declaration' }));
    expect(onFinish).not.toHaveBeenCalled();
    expect(screen.queryByRole('alert')).toBeNull();
    expect(screen.getByRole('button', { name: 'Finish and clear my details' })).toHaveFocus();
  });

  it('marks names and reference numbers as never-to-translate', () => {
    setup();
    expect(document.querySelector('.receipt__ref')).toHaveAttribute('translate', 'no');
    expect(document.querySelector('.print-sheet [dir="auto"]')).toHaveAttribute('translate', 'no');
  });

  it('renders in Arabic', () => {
    setup('ar');
    expect(screen.getByRole('heading', { level: 2, name: 'تم إرسال الإقرار' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'طباعة أو حفظ بصيغة PDF' })).toBeInTheDocument();
  });
});

describe('printable signed declaration', () => {
  const sheet = () => document.querySelector('.print-sheet') as HTMLElement;

  it('is on the page for print, with the brand letterhead and the interim seal', () => {
    setup();
    expect(sheet()).not.toBeNull();
    expect(within(sheet()).getByRole('img', { name: 'KFUPM Student Affairs' })).toHaveAttribute('src', '/brand/full-stacked.png');
    expect(within(sheet()).getByRole('img', { name: /seal|ختم/i })).toHaveAttribute('src', '/brand/seal/seal-legacy.webp');
  });

  it.each(['en', 'ar'] as const)('contains the full title, every term in full, the closing statement (%s)', (locale) => {
    setup(locale);
    const text = sheet().textContent!.replace(/\s+/g, ' ');
    expect(text).toContain(TERMS.document.title[locale]);
    expect(text).toContain(TERMS.document.closing[locale]);
    TERMS.terms.forEach((t, i) => {
      expect(text).toContain(`${i + 1}. ${t.title[locale]}`);
      expect(text).toContain(termText(t, locale, TERMS.links).replace(/\s+/g, ' '));
    });
  });

  it('shows who signed, a masked passport, the dates, the reference and the signature image', () => {
    setup();
    const text = sheet().textContent!;
    expect(text).toContain('Mai Nguyễn');
    expect(text).toContain('••••4567');
    expect(text).not.toContain('N1234567'); // the full passport number is never printed
    expect(text).not.toContain('+966551234567'); // nor the phone number
    expect(text).toContain('PACF-2026-K7M2QX');
    expect(within(sheet()).getByRole('img', { name: /signature|التوقيع/i })).toHaveAttribute('src', signature.dataUrl);
  });
});
