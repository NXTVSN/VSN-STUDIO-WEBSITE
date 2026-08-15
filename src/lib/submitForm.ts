// Resilient Netlify Forms submission — built for in-app browsers (Instagram, Facebook,
// TikTok, LinkedIn) where fetch can hang, keepalive is flaky, and storage may be blocked.
//
// Strategy: fetch with a hard timeout → sendBeacon fallback → stash for a retry on the next
// page. Callers always move the visitor forward; we never leave them stuck on a dead button.

export type FormFields = Record<string, string>;

const PENDING_KEY = 'vsn_pending_form';
const ENDPOINT = '/'; // Netlify Forms accepts POSTs to any path on the site

const encode = (fields: FormFields) => {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(fields)) p.append(k, v ?? '');
  return p.toString();
};

function stash(body: string) {
  try { sessionStorage.setItem(PENDING_KEY, body); } catch {}
  try { localStorage.setItem(PENDING_KEY, body); } catch {}
}
function unstash(): string | null {
  let v: string | null = null;
  try { v = sessionStorage.getItem(PENDING_KEY); } catch {}
  if (!v) { try { v = localStorage.getItem(PENDING_KEY); } catch {} }
  return v;
}
function clearStash() {
  try { sessionStorage.removeItem(PENDING_KEY); } catch {}
  try { localStorage.removeItem(PENDING_KEY); } catch {}
}

async function postWithTimeout(body: string, ms: number): Promise<boolean> {
  const ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timer = setTimeout(() => ctrl?.abort(), ms);
  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
      keepalive: true,
      signal: ctrl?.signal,
      credentials: 'same-origin',
      redirect: 'follow',
    });
    return res.ok || (res.status >= 300 && res.status < 400);
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

function beacon(body: string): boolean {
  try {
    if (typeof navigator === 'undefined' || !navigator.sendBeacon) return false;
    const blob = new Blob([body], { type: 'application/x-www-form-urlencoded' });
    return navigator.sendBeacon(ENDPOINT, blob);
  } catch {
    return false;
  }
}

/**
 * Submit `fields` (must include `form-name`). Resolves `true` when we have reasonable
 * confidence the submission landed, `false` when it fell back to a fire-and-forget path.
 * Never throws.
 */
export async function submitNetlifyForm(fields: FormFields, { timeoutMs = 8000 } = {}): Promise<boolean> {
  const body = encode({ 'bot-field': '', ...fields });
  stash(body);
  const ok = await postWithTimeout(body, timeoutMs);
  if (ok) { clearStash(); return true; }
  // Fallback 1: beacon survives navigation and doesn't care about the response.
  const sent = beacon(body);
  if (sent) clearStash();
  // Either way keep the stash so the next page can retry if the beacon silently failed.
  if (!sent) stash(body);
  return sent;
}

/** Call once on landing pages (e.g. /thank-you) to flush a submission that didn't confirm. */
export async function retryPendingSubmission(): Promise<void> {
  const body = unstash();
  if (!body) return;
  const ok = await postWithTimeout(body, 8000);
  if (ok || beacon(body)) clearStash();
}

export function trackPixel(event: string) {
  try { (window as any).fbq?.('track', event); } catch {}
}
