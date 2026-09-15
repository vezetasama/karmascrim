import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyPassword, createSessionToken, createAdminSessionToken } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { emailOrUsername, password, rememberMe } = await request.json();

    if (!emailOrUsername || !password) {
      return NextResponse.json({ error: 'Please enter email/username and password' }, { status: 400 });
    }

    const user = await db.user.findFirst({
      where: {
        OR: [
          { email: emailOrUsername.toLowerCase().trim() },
          { username: emailOrUsername.toLowerCase().trim() },
        ],
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'Invalid email/username or password' }, { status: 401 });
    }

    if (user.status === 'SUSPENDED') {
      return NextResponse.json(
        { error: 'Your account has been suspended. Please contact support.' },
        { status: 403 }
      );
    }

    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid email/username or password' }, { status: 401 });
    }

    const token = await createSessionToken(
      {
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role,
      },
      !!rememberMe
    );

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
      maxAge: rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 24 * 7, // 30 days vs 7 days
      sameSite: 'lax',
    });

    if (user.role === 'ADMIN') {
      const adminToken = await createAdminSessionToken({
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role,
      });

      response.cookies.set({
        name: 'karma_admin_session',
        value: adminToken,
        httpOnly: true,
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 4,
        sameSite: 'lax',
      });
    }

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Failed to process login' }, { status: 500 });
  }
}
