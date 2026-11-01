import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

const open = async (page: Page, locale: 'en' | 'ar' = 'en') => {
  await page.addInitScript((l) => localStorage.setItem('pacf.locale', l), locale);
  await page.goto('/');
  await page.evaluate(() => document.fonts.ready);
};
const noOverflow = (page: Page) =>
  page.evaluate(() => {
    const w = document.documentElement.clientWidth;
    const escapes = [...document.querySelectorAll('body *')]
      .filter((el) => {
        const r = el.getBoundingClientRect();
        return r.width > 0 && getComputedStyle(el).position !== 'absolute' && (r.left < -0.5 || r.right > w + 0.5);
      })
      .map((el) => `${el.tagName}.${el.className}`);
    return { overflow: document.documentElement.scrollWidth - innerWidth, escapes };
  });
const fill = async (page: Page, passport: string, phone: string, name: string) => {
  await page.getByLabel(/passport number|رقم جواز السفر/i).fill(passport);
  await page.getByLabel(/phone number|رقم الهاتف/i).fill(phone);
  await page.getByLabel(/full name|الاسم الكامل/i).fill(name);
};

test('empty submit shows three errors, focuses the first field, and never scrolls sideways', async ({ page }) => {
  await open(page);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.getByText('This field is required.')).toHaveCount(3);
  await expect(page.getByLabel('Passport number')).toBeFocused();
  expect(await noOverflow(page)).toEqual({ overflow: 0, escapes: [] });
});

for (const [name, passport, phone, full] of [
  ['an Arabic name with Arabic-Indic digits', 'N١٢٣٤٥٦٧', '+٩٦٦ ٥٥ ١٢٣ ٤٥٦٧', 'محمد عبدالله الغامدي'],
  ['a Vietnamese name', 'B1234567', '+84 912 345 678', 'Nguyễn Thị Mai'],
] as const) {
  test(`signs in with ${name} and moves to the next step`, async ({ page }) => {
    await open(page);
    await fill(page, passport, phone, full);
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page.locator('.stepper [aria-current="step"]')).toContainText('Review terms', { timeout: 5000 });
    await expect(page.getByRole('heading', { level: 2, name: 'Sign in' })).toHaveCount(0);
  });
}

for (const locale of ['en', 'ar'] as const) {
  test(`worst case input at this width stays inside the viewport (${locale})`, async ({ page }) => {
    await open(page, locale);
    // 100 unbroken Arabic letters, a 20-char passport, an invalid 18-digit phone: validation errors are visible too.
    await fill(page, 'A'.repeat(20), '1'.repeat(18), 'م'.repeat(100));
    await page.getByLabel(/full name|الاسم الكامل/i).blur();
    await page.getByRole('button', { name: /Sign in|تسجيل الدخول/ }).click();
    await expect(page.locator('.field__error')).toHaveCount(1); // only the phone is invalid
    expect(await noOverflow(page)).toEqual({ overflow: 0, escapes: [] });
  });
}

test('100 unbroken Latin letters in the name do not overflow', async ({ page }) => {
  await open(page);
  await fill(page, 'AB1234567', '+966551234567', 'W'.repeat(100));
  expect(await noOverflow(page)).toEqual({ overflow: 0, escapes: [] });
});

test('RTL: passport and phone stay LTR but sit flush with the Arabic labels; name follows its text', async ({ page }) => {
  await open(page, 'ar');
  const passport = page.getByLabel('رقم جواز السفر');
  expect(await passport.evaluate((e) => getComputedStyle(e).direction)).toBe('ltr');
  expect(await passport.evaluate((e) => getComputedStyle(e).textAlign)).toMatch(/^(end|right)$/);
  await expect(page.getByLabel('الاسم الكامل')).toHaveAttribute('dir', 'auto');
  const label = await page.locator('label[for="passport"]').boundingBox();
  const input = await passport.boundingBox();
  expect(Math.abs(label!.x + label!.width - (input!.x + input!.width))).toBeLessThan(2); // labels hug the inline-end edge
});

test('typed text is never set in the KFUPM display font (it has no glyphs for most names)', async ({ page }) => {
  await open(page);
  for (const label of ['Passport number', 'Phone number', 'Full name']) {
    const family = await page.getByLabel(label).evaluate((e) => getComputedStyle(e).fontFamily);
    expect(family, label).not.toMatch(/KFUPM/);
    expect(family, label).toMatch(/^"?IBM Plex Sans Arabic/);
  }
});

test('errors are announced with the field description and the form survives a language switch', async ({ page }) => {
  await open(page);
  await page.getByLabel('Full name').fill('Mai Nguyễn');
  await page.getByLabel('Passport number').fill('P<');
  await page.getByLabel('Passport number').blur();
  await expect(page.locator('#passport-error')).toBeVisible();
  expect(await page.getByLabel('Passport number').getAttribute('aria-describedby')).toContain('passport-error');
  await page.getByRole('button', { name: 'العربية' }).click();
  await expect(page.getByLabel('الاسم الكامل')).toHaveValue('Mai Nguyễn');
  await expect(page.getByLabel('رقم جواز السفر')).toHaveValue('P<');
  await expect(page.locator('#passport-error')).toContainText('أدخل من 5 إلى 20');
});
