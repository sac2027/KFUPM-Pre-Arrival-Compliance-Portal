import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { fillLogin, L, overflow } from './helpers';
import { STUDENTS } from './students';

const open = async (page: Page, locale: 'en' | 'ar' = 'en') => {
  await page.addInitScript((l) => localStorage.setItem('pacf.locale', l), locale);
  await page.goto('/');
  await page.evaluate(() => document.fonts.ready);
};

test('empty submit shows four errors, focuses the first field, and never scrolls sideways', async ({ page }) => {
  await open(page);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.getByText('This field is required.')).toHaveCount(4);
  await expect(page.getByLabel('Passport number')).toBeFocused();
  expect(await overflow(page)).toEqual({ overflow: 0, escapes: [] });
});

test('a roster student signs in and sees the terms; the declaration carries the roster name', async ({ page }) => {
  await open(page);
  await fillLogin(page, 'en', STUDENTS.eyad);
  await expect(page.locator('.stepper [aria-current="step"]').first()).toContainText('Review terms', { timeout: 10_000 });
  await expect(page.locator('.declarant')).toContainText('Eyad Salem');
});

test('Arabic-Indic digits and spacing in the typed details still verify', async ({ page }) => {
  await open(page, 'ar');
  await fillLogin(page, 'ar', { passport: 'e2e٠٠٠٠٢', phone: '+٩٦٦ ٥٥ ١٢٣ ٤٥٦٧', email: ' EyadSalem139@Gmail.com ', name: 'mohammed alghamdi' });
  await expect(page.locator('#terms-heading')).toBeFocused({ timeout: 10_000 });
  await expect(page.locator('.declarant')).toContainText('Mohammed Abdullah Alghamdi');
});

test('a phone without a country code is explained before anything is sent', async ({ page }) => {
  await open(page);
  let requests = 0;
  page.on('request', (r) => r.url().includes('/api/verify') && requests++);
  await fillLogin(page, 'en', { ...STUDENTS.eyad, phone: '0500000001' });
  await expect(page.locator('#phone-error')).toContainText('Start with your country code');
  expect(requests).toBe(0);
});

test('one wrong detail gets the generic message, keeps the form filled, and a corrected retry succeeds', async ({ page }) => {
  await open(page);
  await fillLogin(page, 'en', { ...STUDENTS.eyad, email: 'wrong@example.com' });
  const alert = page.getByRole('alert');
  await expect(alert).toContainText('do not match our records');
  const forEmail = await alert.textContent();
  await page.getByLabel('Email address').fill(STUDENTS.eyad.email);
  await page.getByLabel('Phone number').fill('+966500000009');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(alert).toBeVisible();
  expect(await alert.textContent()).toBe(forEmail); // identical for a wrong phone: never says which one
  await page.getByLabel('Phone number').fill(STUDENTS.eyad.phone);
  await expect(page.getByLabel('Full name')).toHaveValue('Eyad Salem');
  await page.getByLabel('Email address').fill(STUDENTS.eyad.email);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.locator('#terms-heading')).toBeFocused({ timeout: 10_000 });
});

for (const locale of ['en', 'ar'] as const) {
  test(`worst case input at this width stays inside the viewport (${locale})`, async ({ page }) => {
    await open(page, locale);
    const s = L(locale);
    await page.getByLabel(s.passport).fill('A'.repeat(20));
    await page.getByLabel(s.phone).fill('1'.repeat(18)); // no country code: a visible error
    await page.getByLabel(s.email).fill(`${'a'.repeat(64)}@${'b'.repeat(63)}.${'c'.repeat(63)}.com`);
    await page.getByLabel(s.name).fill('م'.repeat(100));
    await page.getByRole('button', { name: s.signin }).click();
    await expect(page.locator('.field__error')).toHaveCount(1); // only the phone is invalid
    expect(await overflow(page)).toEqual({ overflow: 0, escapes: [] });
  });
}

test('RTL: passport, phone and email stay LTR but sit flush with the Arabic labels; name follows its text', async ({ page }) => {
  await open(page, 'ar');
  for (const label of ['رقم جواز السفر', 'رقم الهاتف', 'البريد الإلكتروني']) {
    const field = page.getByLabel(label);
    expect(await field.evaluate((e) => getComputedStyle(e).direction), label).toBe('ltr');
    expect(await field.evaluate((e) => getComputedStyle(e).textAlign), label).toMatch(/^(end|right)$/);
  }
  await expect(page.getByLabel('الاسم الكامل')).toHaveAttribute('dir', 'auto');
  const label = await page.locator('label[for="passport"]').boundingBox();
  const input = await page.getByLabel('رقم جواز السفر').boundingBox();
  expect(Math.abs(label!.x + label!.width - (input!.x + input!.width))).toBeLessThan(2);
});

test('typed text is never set in the KFUPM display font (it has no glyphs for most names)', async ({ page }) => {
  await open(page);
  for (const label of ['Passport number', 'Phone number', 'Email address', 'Full name']) {
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
