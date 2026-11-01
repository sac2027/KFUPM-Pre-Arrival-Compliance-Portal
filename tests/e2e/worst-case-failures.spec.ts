/** DEV server only: `?fail=login` / `?fail=submit` make the mock backend fail once, so retry can be seen in a browser. */
import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { confirmAllTerms, drawSignature, fillLogin, L } from './helpers';
import type { Locale } from './helpers';

const NETWORK: Record<Locale, RegExp> = { en: /Can’t reach the server/, ar: /تعذّر الاتصال بالخادم/ };
const GOOD = (l: Locale) => ({ passport: 'N1234567', phone: '+966551234567', name: l === 'en' ? 'Mai Nguyễn' : 'محمد عبدالله' });
const inkPixels = (page: Page) =>
  page.evaluate(() => {
    const c = document.querySelector('canvas')!;
    const d = c.getContext('2d')!.getImageData(0, 0, c.width, c.height).data;
    let n = 0;
    for (let i = 3; i < d.length; i += 4) if (d[i]! > 0) n++;
    return n;
  });

for (const locale of ['en', 'ar'] as const) {
  const s = L(locale);

  test(`a failed sign-in explains itself, keeps the form filled, and a retry succeeds (${locale})`, async ({ page }) => {
    await page.addInitScript((l) => localStorage.setItem('pacf.locale', l), locale);
    await page.goto('/?fail=login');
    await fillLogin(page, locale, GOOD(locale));
    await expect(page.getByRole('alert')).toContainText(NETWORK[locale]);
    await expect(page.getByLabel(s.name)).toHaveValue(GOOD(locale).name);
    await expect(page.getByLabel(s.passport)).toHaveValue(GOOD(locale).passport);
    await expect(page.locator('#login-heading')).toBeVisible(); // still on the login step

    await page.getByRole('button', { name: s.signin }).click(); // retry
    await expect(page.locator('#terms-heading')).toBeFocused();
    await expect(page.getByRole('alert')).toHaveCount(0);
  });

  test(`a failed submission keeps the signature, shows a retry message, and the retry succeeds once (${locale})`, async ({ page }) => {
    await page.addInitScript((l) => localStorage.setItem('pacf.locale', l), locale);
    await page.goto('/?fail=submit');
    await fillLogin(page, locale, GOOD(locale));
    await confirmAllTerms(page, locale);
    await drawSignature(page);
    const inkBefore = await inkPixels(page);
    await page.getByRole('button', { name: s.submit }).click();

    await expect(page.getByRole('alert')).toContainText(NETWORK[locale]);
    await expect(page.locator('#sign-heading')).toBeVisible(); // not lost: still on the signature step
    expect(await inkPixels(page)).toBe(inkBefore); // the drawing is untouched
    await expect(page.getByRole('button', { name: s.submit })).not.toHaveAttribute('aria-disabled', 'true');

    await page.getByRole('button', { name: s.submit }).click(); // retry
    await expect(page.getByRole('heading', { level: 2, name: s.heading })).toBeFocused({ timeout: 8000 });
    await expect(page.locator('.receipt__ref')).toHaveText(/^PACF-\d{4}-[A-HJ-NP-Z2-9]{6}$/);
  });
}
