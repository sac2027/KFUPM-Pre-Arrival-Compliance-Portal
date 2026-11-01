import { expect } from '@playwright/test';
import type { Page } from '@playwright/test';

export type Locale = 'en' | 'ar';
export const L = (l: Locale) => ({
  passport: l === 'en' ? 'Passport number' : 'رقم جواز السفر',
  phone: l === 'en' ? 'Phone number' : 'رقم الهاتف',
  name: l === 'en' ? 'Full name' : 'الاسم الكامل',
  signin: l === 'en' ? 'Sign in' : 'تسجيل الدخول',
  cont: l === 'en' ? 'Continue to signature' : 'المتابعة إلى التوقيع',
  submit: l === 'en' ? 'Sign and submit' : 'وقّع وأرسل',
  heading: l === 'en' ? 'Declaration submitted' : 'تم إرسال الإقرار',
  upload: l === 'en' ? 'Upload' : 'رفع صورة',
});

/** Horizontal overflow, and any element that pokes outside the viewport. */
export const overflow = (page: Page) =>
  page.evaluate(() => {
    const w = document.documentElement.clientWidth;
    const escapes = [...document.querySelectorAll('body *')]
      .filter((el) => {
        if (el.closest('[data-dev-chrome]')) return false;
        const r = el.getBoundingClientRect();
        return r.width > 0 && getComputedStyle(el).position !== 'absolute' && (r.left < -0.5 || r.right > w + 0.5);
      })
      .map((el) => `${el.tagName}.${(el as HTMLElement).className}`);
    return { overflow: document.documentElement.scrollWidth - innerWidth, escapes };
  });

/** Content cut off by a box that hides its overflow (the "clipped diacritics / fixed height" family). */
export const clipped = (page: Page) =>
  page.evaluate(() =>
    [...document.querySelectorAll('body *')]
      .filter((el) => {
        if (el.closest('[data-dev-chrome]') || el.closest('.sr-only')) return false;
        const cs = getComputedStyle(el);
        if (!/(hidden|clip)/.test(cs.overflowY) || cs.clipPath !== 'none') return false;
        return el.scrollHeight > el.clientHeight + 1 && el.clientHeight > 2;
      })
      .map((el) => `${el.tagName}.${(el as HTMLElement).className}`),
  );

export async function fillLogin(page: Page, locale: Locale, p: { passport: string; phone: string; name: string }) {
  const s = L(locale);
  await page.getByLabel(s.passport).fill(p.passport);
  await page.getByLabel(s.phone).fill(p.phone);
  await page.getByLabel(s.name).fill(p.name);
  await page.getByRole('button', { name: s.signin }).click();
}

export async function confirmAllTerms(page: Page, locale: Locale) {
  await page.waitForSelector('.term');
  for (let i = 0; i < 5; i++) await page.locator('.term').nth(i).locator('.term__title label').click();
  await page.getByRole('button', { name: L(locale).cont }).click();
  await expect(page.locator('#sign-heading')).toBeFocused();
}

export async function drawSignature(page: Page) {
  const canvas = page.locator('canvas');
  await canvas.scrollIntoViewIfNeeded();
  const b = (await canvas.boundingBox())!;
  await page.mouse.move(b.x + b.width * 0.1, b.y + b.height * 0.6);
  await page.mouse.down();
  await page.mouse.move(b.x + b.width * 0.35, b.y + b.height * 0.2, { steps: 10 });
  await page.mouse.move(b.x + b.width * 0.6, b.y + b.height * 0.7, { steps: 10 });
  await page.mouse.move(b.x + b.width * 0.9, b.y + b.height * 0.3, { steps: 10 });
  await page.mouse.up();
}

/** A PNG made in the page: `ink` draws dark strokes, otherwise it is a blank ground of the given colour. */
export const makePng = (page: Page, o: { w: number; h: number; ink: boolean; ground?: string; transparent?: boolean; strokeColor?: string }) =>
  page.evaluate((o) => {
    const c = document.createElement('canvas');
    c.width = o.w;
    c.height = o.h;
    const x = c.getContext('2d')!;
    if (!o.transparent) {
      x.fillStyle = o.ground ?? '#ffffff';
      x.fillRect(0, 0, o.w, o.h);
    }
    if (o.ink) {
      x.strokeStyle = o.strokeColor ?? '#000000';
      x.lineWidth = Math.max(2, Math.round(Math.min(o.w, o.h) / 25));
      x.beginPath();
      x.moveTo(o.w * 0.05, o.h * 0.8);
      x.bezierCurveTo(o.w * 0.2, o.h * 0.05, o.w * 0.4, o.h * 0.95, o.w * 0.95, o.h * 0.2);
      x.stroke();
    }
    return c.toDataURL('image/png').split(',')[1]!;
  }, o);
