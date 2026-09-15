import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword, createSessionToken } from '@/lib/auth';
import { notifyAccountRegistered } from '@/lib/notifications';
import {
  validateEmail,
  validatePassword,
  validateConfirmPassword,
  validateName,
} from '@/lib/validation';

function generateUsernameFromEmail(email: string, name: string) {
  const base = (email.split('@')[0] || name || 'player')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '') || 'player';

  return base.length >= 3 ? base : `${base || 'player'}_${Math.floor(Math.random() * 900 + 100)}`;
}

export async function POST(request: Request) {
  try {
    const { name, email, password, confirmPassword } = await request.json();

    // ─── Validation ───────────────────────────────────────────────────
    const nameCheck = validateName(name);
    if (!nameCheck.valid) {
      return NextResponse.json({ error: nameCheck.message }, { status: 400 });
    }

    const emailCheck = validateEmail(email);
    if (!emailCheck.valid) {
      return NextResponse.json({ error: emailCheck.message }, { status: 400 });
    }

    const passwordCheck = validatePassword(password);
    if (!passwordCheck.valid) {
      return NextResponse.json({ error: passwordCheck.message }, { status: 400 });
    }

    if (confirmPassword !== undefined) {
      const confirmCheck = validateConfirmPassword(password, confirmPassword);
      if (!confirmCheck.valid) {
        return NextResponse.json({ error: confirmCheck.message }, { status: 400 });
      }
    }

    const cleanEmail = email.toLowerCase().trim();

    let cleanUsername = generateUsernameFromEmail(cleanEmail, name);
    let usernameTaken = await db.user.findUnique({ where: { username: cleanUsername } });
    let suffix = 1;

    while (usernameTaken) {
      cleanUsername = `${generateUsernameFromEmail(cleanEmail, name)}${suffix}`;
      usernameTaken = await db.user.findUnique({ where: { username: cleanUsername } });
      suffix += 1;
    }

    // ─── Check Existing ───────────────────────────────────────────────
    const existingUser = await db.user.findFirst({
      where: {
        OR: [{ email: cleanEmail }, { username: cleanUsername }],
      },
    });

    if (existingUser) {
      return NextResponse.json(
        {
          error:
            existingUser.email === cleanEmail
              ? 'This email is already registered. Please login instead.'
              : 'This username is already taken. Please choose another.',
        },
        { status: 400 }
      );
    }

    // ─── Create User (always role USER — no privilege escalation) ────
    const passwordHash = await hashPassword(password);

    const user = await db.user.create({
      data: {
        name: name.trim(),
        username: cleanUsername,
        email: cleanEmail,
        passwordHash,
        role: 'USER', // Always USER — admin creation only via seed/CLI
        status: 'ACTIVE',
      },
    });

    // Send welcome notification
    await notifyAccountRegistered(user.id, user.username);

    const token = await createSessionToken({
      id: user.id,
      name: user.name,
      username: user.username,
      email: user.email,
      role: user.role,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role,
        freeFireUid: user.freeFireUid,
        freeFireName: user.freeFireName,
      },
    });

    response.cookies.set({
      name: 'karma_session',
      value: token,
      httpOnly: true,
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7,
      sameSite: 'lax',
    });

    return response;
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Failed to create user account' }, { status: 500 });
  }
}
