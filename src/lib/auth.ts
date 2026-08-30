/**
 * A single-password gate.
 *
 * Deploying to Vercel puts this dashboard on the public internet, so it needs
 * *some* door. This is deliberately the smallest thing that is actually sound:
 * one shared password, and a session cookie signed with HMAC-SHA256 so it
 * cannot be forged. It uses Web Crypto only, so the same code runs in
 * middleware (edge runtime) and in server actions (node runtime).
 *
 * It is not multi-user auth. If more than one person ever needs an account,
 * swap this for a real provider — see the README.
 */
export const COOKIE_NAME = 'pd_session';

/** How long a session lasts before the password is asked for again. */
export const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 30;

const encoder = new TextEncoder();

function requireSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error('AUTH_SECRET is not set.');
  return secret;
}

async function sign(message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(requireSecret()),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(message));
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/** Compare in constant time so a mismatch reveals nothing through timing. */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** True when `candidate` matches DASHBOARD_PASSWORD. */
export async function isValidPassword(candidate: string): Promise<boolean> {
  const expected = process.env.DASHBOARD_PASSWORD;
  if (!expected) throw new Error('DASHBOARD_PASSWORD is not set.');

  // Comparing HMACs rather than the raw strings keeps the comparison a fixed
  // width, so password length does not leak either.
  const [a, b] = await Promise.all([sign(candidate), sign(expected)]);
  return timingSafeEqual(a, b);
}

/** Mint a signed session token that expires `SESSION_DURATION_SECONDS` from now. */
export async function createSessionToken(): Promise<string> {
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_DURATION_SECONDS;
  return `${expiresAt}.${await sign(String(expiresAt))}`;
}

/** True when the token is well formed, correctly signed, and not expired. */
export async function verifySessionToken(token: string | undefined): Promise<boolean> {
  if (!token) return false;

  const separator = token.indexOf('.');
  if (separator === -1) return false;

  const expiresAt = token.slice(0, separator);
  const signature = token.slice(separator + 1);

  if (!/^\d+$/.test(expiresAt)) return false;
  if (Number(expiresAt) * 1000 < Date.now()) return false;

  return timingSafeEqual(signature, await sign(expiresAt));
}
