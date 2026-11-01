/** Fixed-window counters in D1 (verify_attempts). Pure decision in `nextWindow`, storage in `checkAndCount`. */
export interface WindowRow {
  window_start: number;
  count: number;
}

export function nextWindow(row: WindowRow | null, now: number, limit: number, windowSeconds: number): { allowed: boolean; retryAfter?: number; row: WindowRow } {
  if (!row || now - row.window_start >= windowSeconds) return { allowed: true, row: { window_start: now, count: 1 } };
  const next = { window_start: row.window_start, count: row.count + 1 };
  if (next.count > limit) return { allowed: false, retryAfter: row.window_start + windowSeconds - now, row: next };
  return { allowed: true, row: next };
}

export async function checkAndCount(db: D1Database, key: string, limit: number, windowSeconds: number, now = Math.floor(Date.now() / 1000)): Promise<{ allowed: boolean; retryAfter?: number }> {
  const row = await db.prepare('SELECT window_start, count FROM verify_attempts WHERE key = ?').bind(key).first<WindowRow>();
  const r = nextWindow(row ?? null, now, limit, windowSeconds);
  await db
    .prepare('INSERT INTO verify_attempts (key, window_start, count) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET window_start = excluded.window_start, count = excluded.count')
    .bind(key, r.row.window_start, r.row.count)
    .run();
  return r.allowed ? { allowed: true } : { allowed: false, retryAfter: r.retryAfter };
}

/** Clears a key after a success, so a student who finally gets it right is not punished on the next step. */
export async function clear(db: D1Database, key: string): Promise<void> {
  await db.prepare('DELETE FROM verify_attempts WHERE key = ?').bind(key).run();
}

export async function hashIp(ip: string, secret: string): Promise<string> {
  const data = new TextEncoder().encode(`${secret}:${ip}`);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(digest)].slice(0, 16).map((b) => b.toString(16).padStart(2, '0')).join('');
}
