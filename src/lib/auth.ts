import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import crypto from 'crypto';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'karma-scrims-esports-super-secret-jwt-key-2026'
);

const ADMIN_SESSION_SECRET = new TextEncoder().encode(
  process.env.ADMIN_SESSION_SECRET || 'karma-scrims-admin-panel-secret-key-2026-secure'
);

export interface UserPayload {
  id: string;
  name: string;
  username: string;
  email: string;
  role: string;
}

export interface AdminPayload extends UserPayload {
  type: 'admin';
}

// ─── Password Hashing ───────────────────────────────────────────────

export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

// ─── User Session (karma_session cookie) ────────────────────────────

export async function createSessionToken(payload: UserPayload, rememberMe = false): Promise<string> {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(rememberMe ? '30d' : '7d')
    .sign(JWT_SECRET);
}

export async function verifySessionToken(token: string): Promise<UserPayload | null> {
  try {
    const verified = await jwtVerify(token, JWT_SECRET);
    return verified.payload as unknown as UserPayload;
  } catch (err) {
    return null;
  }
}

export async function getCurrentUser(): Promise<UserPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('karma_session')?.value;
    if (token) {
      const user = await verifySessionToken(token);
      if (user) return user;
    }
    // Fallback to admin session token
    const adminToken = cookieStore.get('karma_admin_session')?.value;
    if (adminToken) {
      const admin = await verifyAdminSessionToken(adminToken);
      if (admin) return admin;
    }
    return null;
  } catch (error) {
    return null;
  }
}

// ─── Admin Session (karma_admin_session cookie) ─────────────────────

export async function createAdminSessionToken(payload: UserPayload): Promise<string> {
  const adminPayload: AdminPayload = { ...payload, type: 'admin' };
  return await new SignJWT({ ...adminPayload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('4h') // Admin sessions expire after 4 hours
    .sign(ADMIN_SESSION_SECRET);
}

export async function verifyAdminSessionToken(token: string): Promise<AdminPayload | null> {
  try {
    const verified = await jwtVerify(token, ADMIN_SESSION_SECRET);
    const payload = verified.payload as unknown as AdminPayload;
    if (payload.type !== 'admin' || payload.role !== 'ADMIN') {
      return null;
    }
    return payload;
  } catch (err) {
    return null;
  }
}

export async function getCurrentAdmin(): Promise<AdminPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('karma_admin_session')?.value;
    if (token) {
      const admin = await verifyAdminSessionToken(token);
      if (admin) return admin;
    }
    // Fallback: check karma_session for ADMIN role
    const userToken = cookieStore.get('karma_session')?.value;
    if (userToken) {
      const user = await verifySessionToken(userToken);
      if (user && user.role === 'ADMIN') {
        return { ...user, type: 'admin' };
      }
    }
    return null;
  } catch (error) {
    return null;
  }
}

// ─── Password Reset Token Utilities ─────────────────────────────────

/**
 * Generate a cryptographically secure random token for password resets.
 * Returns the raw token (sent to user) — store the hashed version in DB.
 */
export function generatePasswordResetToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Hash a reset token with SHA-256 before storing in the database.
 * This way, even if the DB is compromised, raw tokens are not exposed.
 */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}
