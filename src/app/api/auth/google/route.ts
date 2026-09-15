import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createSessionToken, hashPassword } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const email = body.email || 'google.player@karmascrims.com';
    const name = body.name || 'Google Gamer';

    let user = await db.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user) {
      // Auto-create account for Google SSO
      const baseUsername = email.split('@')[0].replace(/[^a-z0-9_]/gi, '').toLowerCase();
      const username = `${baseUsername || 'player'}_${Date.now().toString().slice(-4)}`;
      const randomPassword = await hashPassword(`google-auth-${Date.now()}-${Math.random()}`);

      user = await db.user.create({
        data: {
          name,
          username,
          email: email.toLowerCase().trim(),
          passwordHash: randomPassword,
          role: 'USER',
          status: 'ACTIVE',
        },
      });

      // Create default wallet
      await db.wallet.create({
        data: {
          userId: user.id,
          balance: 0,
        },
      });
    }

    if (user.status === 'SUSPENDED') {
      return NextResponse.json(
        { error: 'Your account has been suspended. Please contact support.' },
        { status: 403 }
      );
    }

    const token = await createSessionToken(
      {
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role,
      },
      true
    );

    const response = NextResponse.json({
      success: true,
      message: 'Google login successful',
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });

    response.cookies.set({
      name: 'karma_session',
      value: token,
      httpOnly: true,
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      sameSite: 'lax',
    });

    return response;
  } catch (error) {
    console.error('Google Auth Error:', error);
    return NextResponse.json({ error: 'Google sign-in failed' }, { status: 500 });
  }
}
