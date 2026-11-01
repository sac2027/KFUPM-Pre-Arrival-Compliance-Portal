import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

const open = async (page: Page, locale: 'en' | 'ar') => {
  await page.addInitScript((l) => localStorage.setItem('pacf.locale', l), locale);
  await page.goto('/');
  await page.evaluate(() => document.fonts.ready);
};

for (const locale of ['en', 'ar'] as const) {
  test.describe(locale, () => {
    test('no horizontal scroll and every element fits inside the viewport', async ({ page }) => {
      await open(page, locale);
      const { overflow, escapes } = await page.evaluate(() => {
        const w = document.documentElement.clientWidth;
        const escapes = [...document.querySelectorAll('body *')]
          .filter((el) => {
            const r = el.getBoundingClientRect();
            const cs = getComputedStyle(el);
            return r.width > 0 && cs.position !== 'absolute' && (r.left < -0.5 || r.right > w + 0.5);
          })
          .map((el) => el.className || el.tagName);
        return { overflow: document.documentElement.scrollWidth - innerWidth, escapes };
      });
      expect(overflow).toBeLessThanOrEqual(0);
      expect(escapes).toEqual([]);
    });

    test('lockup keeps its native aspect ratio (never stretched) and the Matrix is never mirrored', async ({ page }) => {
      await open(page, locale);
      const box = await page.locator('.masthead__logo').boundingBox();
      expect(Math.abs(box!.width / box!.height - 2657 / 1083)).toBeLessThan(0.03);
      const transform = await page.locator('.masthead__matrix').evaluate((e) => getComputedStyle(e).transform);
      expect(transform).toBe('none');
    });

    test('masthead sits on the correct side and headings use KFUPM Display', async ({ page }) => {
      await open(page, locale);
      const logo = await page.locator('.masthead__logo').boundingBox();
      const vw = page.viewportSize()!.width;
      const centre = logo!.x + logo!.width / 2; // edge-based checks break when the logo is over half the width
      if (locale === 'en') expect(centre).toBeLessThan(vw / 2);
      else expect(centre).toBeGreaterThan(vw / 2);
      expect(await page.locator('h1').evaluate((e) => getComputedStyle(e).fontFamily)).toMatch(/^KFUPM/);
    });

    test('the current step is named and visible at this width', async ({ page }) => {
      await open(page, locale);
      const visible = page.locator('.stepper [aria-current="step"] .stepper__label, .stepper__current');
      const texts = await visible.evaluateAll((els) =>
        els.filter((e) => e.getBoundingClientRect().width > 4).map((e) => e.textContent?.trim()),
      );
      expect(texts.length).toBeGreaterThan(0);
      expect(texts[0]).toContain(locale === 'en' ? 'Sign in' : 'تسجيل الدخول');
    });
  });
}
