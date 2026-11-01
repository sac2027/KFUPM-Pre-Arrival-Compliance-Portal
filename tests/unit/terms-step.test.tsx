import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { TermsStep } from '../../src/features/terms/TermsStep';
import { I18nProvider } from '../../src/i18n/I18nProvider';
import type { Locale } from '../../src/i18n/I18nProvider';
import { loadTerms } from '../../src/lib/terms';
import { TERM_IDS } from '../../src/lib/termsSchema';
import type { TermId } from '../../src/lib/termsSchema';
import type { Session } from '../../src/services/types';

const TERMS = loadTerms();
const session: Session = {
  sessionId: 's-1',
  student: { passportNumber: 'A1234567', phoneNumber: '+966551234567', fullName: 'Mai Nguyễn' },
  issuedAt: '2026-11-01T10:00:00.000Z',
};

function setup(locale: Locale = 'en', initialAccepted: TermId[] = [], who: Session = session) {
  const onContinue = vi.fn();
  render(
    <I18nProvider initialLocale={locale}>
      <TermsStep session={who} initialAccepted={initialAccepted} onContinue={onContinue} />
    </I18nProvider>,
  );
  const user = userEvent.setup();
  const boxes = () => screen.getAllByRole('checkbox') as HTMLInputElement[];
  const cont = () => screen.getByRole('button', { name: /continue to signature|المتابعة إلى التوقيع/i });
  return { user, boxes, cont, onContinue };
}

describe('TermsStep', () => {
  it.each(['en', 'ar'] as const)('renders the five terms from the JSON in order (%s)', (locale) => {
    const { boxes } = setup(locale);
    expect(boxes()).toHaveLength(5);
    TERMS.terms.forEach((t, i) => {
      expect(boxes()[i]).toHaveAccessibleName(`${i + 1}. ${t.title[locale]}`);
      expect(boxes()[i]).not.toBeChecked();
    });
  });

  it('describes each checkbox by its full term text, and has no select-all', () => {
    const { boxes } = setup();
    expect(boxes()[3]).toHaveAccessibleDescription(/^As a student affiliated with the University/);
    expect(screen.queryByText(/select all|اختر الكل|تحديد الكل/i)).toBeNull();
    expect(screen.getAllByRole('checkbox')).toHaveLength(5);
  });

  it('shows the declarant name and the sign-in date (Gregorian, Latin digits) in both languages', () => {
    const en = render(
      <I18nProvider initialLocale="en">
        <TermsStep session={session} initialAccepted={[]} onContinue={() => {}} />
      </I18nProvider>,
    );
    expect(screen.getByText('Mai Nguyễn')).toBeInTheDocument();
    expect(screen.getByText('1 November 2026')).toBeInTheDocument();
    en.unmount();
    render(
      <I18nProvider initialLocale="ar">
        <TermsStep session={session} initialAccepted={[]} onContinue={() => {}} />
      </I18nProvider>,
    );
    expect(screen.getByText('1 نوفمبر 2026')).toBeInTheDocument();
  });

  it('keeps Continue inactive until all five are confirmed, announcing progress', async () => {
    const { user, boxes, cont, onContinue } = setup();
    expect(cont()).toHaveAttribute('aria-disabled', 'true');
    expect(screen.getByText('0 of 5 confirmed')).toBeInTheDocument();
    for (const b of boxes().slice(0, 3)) await user.click(b);
    expect(screen.getByText('3 of 5 confirmed')).toBeInTheDocument();
    expect(screen.getByText('3 of 5 confirmed')).toHaveAttribute('aria-live', 'polite');
    await user.click(cont()); // incomplete: nothing happens, focus goes to the first unconfirmed term
    expect(onContinue).not.toHaveBeenCalled();
    expect(boxes()[3]).toHaveFocus();
  });

  it('continues with all five ids, in order, once every term is confirmed', async () => {
    const { user, boxes, cont, onContinue } = setup();
    for (const b of boxes()) await user.click(b);
    expect(cont()).not.toHaveAttribute('aria-disabled', 'true');
    await user.click(cont());
    expect(onContinue).toHaveBeenCalledWith([...TERM_IDS]);
  });

  it('toggles from the label text and from the keyboard, and un-confirms', async () => {
    const { user, boxes } = setup();
    await user.click(screen.getByText(/Respect for Saudi Cultural Norms/));
    expect(boxes()[1]).toBeChecked();
    boxes()[0]!.focus();
    await user.keyboard(' ');
    expect(boxes()[0]).toBeChecked();
    await user.keyboard(' ');
    expect(boxes()[0]).not.toBeChecked();
  });

  it('pre-checks terms the student already confirmed (coming back from the signature step)', () => {
    const { boxes, cont } = setup('en', [...TERM_IDS]);
    expect(boxes().every((b) => b.checked)).toBe(true);
    expect(cont()).not.toHaveAttribute('aria-disabled', 'true');
  });

  it('renders the JSON links as safe new-tab links, and bold segments as <strong>', () => {
    setup();
    const list = screen.getAllByRole('listitem');
    const links = within(list[0]!).getAllByRole('link');
    expect(links.map((l) => l.textContent?.replace(/\s*\(.*\)$/, ''))).toEqual(['Official Public Decency Regulations PDF', 'Overview']);
    for (const l of screen.getAllByRole('link')) {
      expect(l).toHaveAttribute('target', '_blank');
      expect(l).toHaveAttribute('rel', 'noopener noreferrer');
      expect(l.getAttribute('href')).toMatch(/^https:\/\//);
    }
    expect(screen.getAllByRole('link')).toHaveLength(3);
    expect(within(list[0]!).getAllByText('Public Decency Regulations', { selector: 'strong' })).toHaveLength(1);
  });

  it('lays out a very long unbroken name without relying on word breaks', () => {
    const long = { ...session, student: { ...session.student, fullName: 'م'.repeat(100) } };
    setup('ar', [], long);
    const name = screen.getByText('م'.repeat(100));
    expect(name.closest('[dir]')?.getAttribute('dir')).toBe('auto');
  });
});
