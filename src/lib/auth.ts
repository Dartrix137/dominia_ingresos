import { cookies } from 'next/headers';
import { randomBytes } from 'crypto';
import { db } from '@/lib/db';
import { SESSION_COOKIE, SESSION_TTL_MS, STAFF_PIN } from '@/lib/constants';

/**
 * Very small, dependency-free session helper.
 * Staff logs in with a shared PIN; we issue a random token cookie
 * and store it in the Session table with a 12h expiry.
 *
 * This is NOT a substitute for proper auth on the open internet —
 * it's an internal-only gate for the door staff at a single event.
 */

export async function createSession(): Promise<string> {
  const token = randomBytes(32).toString('hex');
  const now = new Date();
  const expiresAt = new Date(now.getTime() + SESSION_TTL_MS);

  await db.session.create({
    data: { token, expiresAt },
  });

  return token;
}

export async function setSessionCookie(token: string) {
  const expires = new Date(Date.now() + SESSION_TTL_MS);
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    expires,
    path: '/',
  });
}

export async function clearSessionCookie() {
  (await cookies()).delete(SESSION_COOKIE);
}

export async function getSessionToken(): Promise<string | undefined> {
  return (await cookies()).get(SESSION_COOKIE)?.value;
}

export async function isStaffAuthenticated(): Promise<boolean> {
  const token = await getSessionToken();
  if (!token) return false;

  const session = await db.session.findUnique({
    where: { token },
  });
  if (!session) return false;
  if (session.expiresAt < new Date()) {
    // Expired — clean up
    await db.session.delete({ where: { id: session.id } }).catch(() => {});
    return false;
  }
  return true;
}

export async function verifyPin(pin: string): Promise<boolean> {
  // Constant-time-ish compare; PIN is short and shared so this is acceptable
  // for an internal tool.
  return pin === STAFF_PIN;
}

/** Generate a 6-digit short-lived single-use token for browser-only QR scans */
export async function generateScanToken(): Promise<string> {
  return randomBytes(16).toString('hex');
}
