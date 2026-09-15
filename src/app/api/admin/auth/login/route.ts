import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyPassword, createAdminSessionToken, createSessionToken } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ error: 'Admin ID and password are required' }, { status: 400 });
    }

    // Look up by username or email — must be an ADMIN user
    const admin = await db.user.findFirst({
      where: {
        AND: [
          { role: 'ADMIN' },
          {
            OR: [
              { username: username.toLowerCase().trim() },
              { email: username.toLowerCase().trim() },
            ],
          },
        ],
      },
    });

    if (!admin) {
      // Generic error to not reveal whether the admin account exists
      return NextResponse.json({ error: 'Invalid admin credentials' }, { status: 401 });
    }

    if (admin.status === 'SUSPENDED') {
      return NextResponse.json({ error: 'This admin account has been suspended' }, { status: 403 });
    }

    const isValid = await verifyPassword(password, admin.passwordHash);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid admin credentials' }, { status: 401 });
    }

    const token = await createAdminSessionToken({
      id: admin.id,
      name: admin.name,
      username: admin.username,
      email: admin.email,
      role: admin.role,
    });

    const userToken = await createSessionToken({
      id: admin.id,
      name: admin.name,
      username: admin.username,
      email: admin.email,
      role: admin.role,
    });

    const response = NextResponse.json({
      success: true,
      admin: {
        id: admin.id,
        name: admin.name,
        username: admin.username,
        email: admin.email,
        role: admin.role,
      },
    });

    response.cookies.set({
      name: 'karma_admin_session',
      value: token,
      httpOnly: true,
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 4, // 4 hours
      sameSite: 'lax',
    });

    response.cookies.set({
      name: 'karma_session',
      value: userToken,
      httpOnly: true,
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24, // 1 day
      sameSite: 'lax',
    });

    return response;
  } catch (error) {
    console.error('Admin login error:', error);
    return NextResponse.json({ error: 'Failed to process admin login' }, { status: 500 });
  }
}
