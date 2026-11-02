import type { Env } from './env';
import { sha256Hex } from './records';

export interface DeclarationEmail {
  to: string;
  locale: 'en' | 'ar';
  fullName: string;
  referenceNumber: string;
  submittedAt: string;
  pdf: Uint8Array;
  submissionId: string;
}

export type SendResult = { status: 'sent'; messageId: string } | { status: 'logged' } | { status: 'failed'; error: string };

export const attachmentName = (reference: string) => `KFUPM-PACF-${reference}.pdf`;

const COPY = {
  en: {
    subject: (ref: string) => `Your signed Pre-Arrival Compliance Form (${ref})`,
    body: (name: string, ref: string, when: string) =>
      [
        `Dear ${name},`,
        '',
        'Thank you. KFUPM has received your signed Pre-Arrival Compliance Form for International Students.',
        `Your reference number is ${ref}. It was received on ${when}.`,
        '',
        'A copy of the signed declaration is attached as a PDF. Please keep it for your records and bring it with you when you arrive.',
        '',
        'If you did not submit this form, reply to this email.',
        '',
        'Deanship of Student Affairs',
        'International Students Office',
        'King Fahd University of Petroleum & Minerals',
      ].join('\n'),
  },
  ar: {
    subject: (ref: string) => `نموذج الالتزام قبل الوصول الموقّع (${ref})`,
    body: (name: string, ref: string, when: string) =>
      [
        `عزيزي/عزيزتي ${name}،`,
        '',
        'شكرًا لك. استلمت جامعة الملك فهد للبترول والمعادن نموذج الالتزام قبل الوصول للطلاب الدوليين موقّعًا منك.',
        `رقم المرجع الخاص بك هو ${ref}. تم الاستلام في ${when}.`,
        '',
        'نسخة من الإقرار الموقّع مرفقة بصيغة PDF. يرجى الاحتفاظ بها وإحضارها معك عند الوصول.',
        '',
        'إذا لم تكن أنت من أرسل هذا النموذج، فيرجى الرد على هذه الرسالة.',
        '',
        'عمادة شؤون الطلاب',
        'مكتب الطلاب الدوليين',
        'جامعة الملك فهد للبترول والمعادن',
      ].join('\n'),
  },
};

function when(iso: string, locale: 'en' | 'ar'): string {
  const tag = locale === 'ar' ? 'ar-u-nu-latn-ca-gregory' : 'en-GB-u-ca-gregory';
  return new Intl.DateTimeFormat(tag, { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZoneName: 'short', timeZone: 'Asia/Riyadh' }).format(new Date(iso));
}

/** What gets sent, independent of the driver. */
export function buildMessage(env: Pick<Env, 'EMAIL_FROM' | 'EMAIL_REPLY_TO' | 'EMAIL_BCC'>, m: DeclarationEmail) {
  const copy = COPY[m.locale];
  return {
    from: env.EMAIL_FROM,
    to: [m.to],
    reply_to: env.EMAIL_REPLY_TO || undefined,
    bcc: env.EMAIL_BCC ? [env.EMAIL_BCC] : undefined,
    subject: copy.subject(m.referenceNumber),
    text: copy.body(m.fullName, m.referenceNumber, when(m.submittedAt, m.locale)),
    attachments: [{ filename: attachmentName(m.referenceNumber), content: m.pdf }],
  };
}

function toBase64(bytes: Uint8Array): string {
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
}

/** Sends through Resend (EMAIL_MODE=resend) or writes to the outbox table (EMAIL_MODE=log). Never throws. */
export async function sendDeclarationEmail(env: Env, m: DeclarationEmail, fetchImpl: typeof fetch = fetch): Promise<SendResult> {
  const msg = buildMessage(env, m);
  if (env.EMAIL_MODE !== 'resend') {
    await env.RECORDS.prepare(
      'INSERT INTO outbox (submission_id, to_address, from_address, reply_to, bcc, subject, text_body, attachment_name, attachment_sha256, attachment_bytes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    )
      .bind(m.submissionId, m.to, msg.from, msg.reply_to ?? null, msg.bcc?.[0] ?? null, msg.subject, msg.text, attachmentName(m.referenceNumber), await sha256Hex(m.pdf), m.pdf.length)
      .run();
    return { status: 'logged' };
  }
  if (!env.RESEND_API_KEY) return { status: 'failed', error: 'RESEND_API_KEY is not set' };
  try {
    const res = await fetchImpl('https://api.resend.com/emails', {
      method: 'POST',
      headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, 'content-type': 'application/json' },
      body: JSON.stringify({ ...msg, attachments: [{ filename: msg.attachments[0]!.filename, content: toBase64(m.pdf) }] }),
    });
    if (!res.ok) {
      const text = (await res.text()).slice(0, 300);
      return { status: 'failed', error: `resend ${res.status}: ${text}` };
    }
    const data = (await res.json()) as { id?: string };
    return { status: 'sent', messageId: data.id ?? '' };
  } catch (err) {
    return { status: 'failed', error: err instanceof Error ? err.message : 'network error' };
  }
}
