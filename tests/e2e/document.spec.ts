import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { confirmAllTerms, drawSignature, fillLogin, L } from './helpers';
import type { Locale } from './helpers';
import { byLocale, STUDENTS } from './students';

/** Reads the local records database the way an administrator would. */
function sql<T>(query: string): T[] {
  const out = execFileSync('npx', ['wrangler', 'd1', 'execute', 'pacf-records', '--local', '--json', '--command', query], { encoding: 'utf8', env: { ...process.env, WRANGLER_SEND_METRICS: 'false' } });
  return JSON.parse(out.slice(out.indexOf('[')))[0].results as T[];
}

async function toDone(page: Page, locale: Locale, creds = byLocale(locale), query = '') {
  const s = L(locale);
  await page.addInitScript((l) => localStorage.setItem('pacf.locale', l), locale);
  await page.goto(`/${query}`);
  await fillLogin(page, locale, creds);
  await confirmAllTerms(page, locale);
  await drawSignature(page);
  await page.getByRole('button', { name: s.submit }).click();
  await expect(page.getByRole('heading', { level: 2, name: s.heading })).toBeFocused({ timeout: 15_000 });
  return (await page.locator('.receipt__ref').textContent())!;
}

for (const locale of ['en', 'ar'] as const) {
  test(`the PDF is stored, emailed to the roster address, and the download is the identical file (${locale})`, async ({ page }, info) => {
    test.skip(info.project.name !== 'desktop-1280', 'not viewport dependent');
    const creds = byLocale(locale);
    const ref = await toDone(page, locale, creds);
    const masked = `${creds.email[0]}•••${creds.email.slice(creds.email.indexOf('@'))}`;
    await expect(page.locator('.receipt__email--sent')).toContainText(masked, { timeout: 20_000 });

    const [row] = sql<{ id: string; pdf_key: string; pdf_sha256: string; pdf_bytes: number; email_status: string; email: string }>(`SELECT id, pdf_key, pdf_sha256, pdf_bytes, email_status, email FROM submissions WHERE reference_number = '${ref}'`);
    expect(row!.pdf_key).toBe(`submissions/${row!.id}/declaration.pdf`);
    expect(row!.email_status).toBe('logged'); // EMAIL_MODE=log in tests
    expect(row!.email).toBe(creds.email);
    expect(row!.pdf_bytes).toBeGreaterThan(10_000);
    expect(row!.pdf_bytes).toBeLessThan(8 * 1024 * 1024);

    const [mail] = sql<{ to_address: string; subject: string; attachment_name: string; attachment_sha256: string; text_body: string }>(`SELECT to_address, subject, attachment_name, attachment_sha256, text_body FROM outbox WHERE submission_id = '${row!.id}'`);
    expect(mail!.to_address).toBe(creds.email);
    expect(mail!.subject).toContain(ref);
    expect(mail!.attachment_name).toBe(`KFUPM-PACF-${ref}.pdf`);
    expect(mail!.attachment_sha256).toBe(row!.pdf_sha256);
    expect(mail!.text_body).toContain(locale === 'en' ? 'Dear ' : 'عزيزي');

    const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: locale === 'en' ? 'Download PDF' : 'تنزيل PDF' }).click()]);
    expect(download.suggestedFilename()).toBe(`KFUPM-PACF-${ref}.pdf`);
    const path = await download.path();
    const bytes = execFileSync('cat', [path!]);
    expect(createHash('sha256').update(bytes).digest('hex')).toBe(row!.pdf_sha256);
    expect(bytes.subarray(0, 4).toString()).toBe('%PDF');
    const pages = execFileSync('pdfinfo', [path!], { encoding: 'utf8' });
    expect(Number(/Pages:\s+(\d+)/.exec(pages)![1])).toBeLessThanOrEqual(2);
  });
}

test('the stored PDF can only be fetched with the session that made it', async ({ page, request }, info) => {
  test.skip(info.project.name !== 'desktop-1280', 'not viewport dependent');
  const ref = await toDone(page, 'en', STUDENTS.anas);
  await expect(page.locator('.receipt__email--sent')).toBeVisible({ timeout: 20_000 });
  const [row] = sql<{ id: string }>(`SELECT id FROM submissions WHERE reference_number = '${ref}'`);
  expect((await request.get(`/api/submissions/${row!.id}/document.pdf`)).status()).toBe(401);
  const other = await request.post('/api/verify', { data: { passportNumber: STUDENTS.eyad.passport, phoneNumber: STUDENTS.eyad.phone, fullName: STUDENTS.eyad.name, email: STUDENTS.eyad.email } });
  const { token } = await other.json();
  expect((await request.get(`/api/submissions/${row!.id}/document.pdf`, { headers: { authorization: `Bearer ${token}` } })).status()).toBe(404);
});
