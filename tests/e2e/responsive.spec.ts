/** The responsive matrix: every step at every supported width, in both languages. Viewport-independent, so one project runs it. */
import { expect, test } from '@playwright/test';
import { clipped, confirmAllTerms, drawSignature, fillLogin, L, overflow } from './helpers';
import type { Locale } from './helpers';

const WIDTHS = [320, 360, 375, 768, 1024, 1280, 1920] as const;

for (const locale of ['en', 'ar'] as const satisfies readonly Locale[]) {
  for (const width of WIDTHS) {
    test(`every step fits at ${width}px (${locale})`, async ({ page }, info) => {
      test.skip(info.project.name !== 'desktop-1280', 'this test sets its own viewport');
      const s = L(locale);
      await page.setViewportSize({ width, height: width >= 1024 ? 900 : 740 });
      await page.addInitScript((l) => localStorage.setItem('pacf.locale', l), locale);
      await page.goto('/');
      await page.evaluate(() => document.fonts.ready);

      const fits = async (where: string) => {
        expect(await overflow(page), `${width}px ${where}: overflow`).toEqual({ overflow: 0, escapes: [] });
        expect(await clipped(page), `${width}px ${where}: clipped`).toEqual([]);
      };

      await fits('login');
      if (width >= 1024) {
        // Wide screens: the sheet stays a readable column, centred, not stranded on one side.
        const doc = (await page.locator('.doc').boundingBox())!;
        expect(doc.width).toBeLessThanOrEqual(900);
        expect(Math.abs(doc.x + doc.width / 2 - width / 2)).toBeLessThan(2);
      }
      const logo = (await page.locator('.masthead__logo').boundingBox())!;
      expect(Math.abs(logo.width / logo.height - 2657 / 1083)).toBeLessThan(0.03); // lockup never distorted

      await fillLogin(page, locale, { passport: 'N1234567', phone: '+966551234567', name: locale === 'en' ? 'Mai Nguyễn' : 'محمد عبدالله' });
      await expect(page.locator('#terms-heading')).toBeFocused();
      await fits('terms');
      await confirmAllTerms(page, locale);
      await fits('sign');
      await drawSignature(page);
      await page.getByRole('button', { name: s.submit }).click();
      await expect(page.getByRole('heading', { level: 2, name: s.heading })).toBeFocused({ timeout: 8000 });
      await fits('receipt');
    });
  }
}
