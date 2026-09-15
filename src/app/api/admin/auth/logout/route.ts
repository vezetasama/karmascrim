import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ success: true, message: 'Admin logged out successfully' });

  response.cookies.set({
    name: 'karma_admin_session',
    value: '',
    httpOnly: true,
    path: '/',
    maxAge: 0, // Immediately expire the cookie
    sameSite: 'strict',
  });

  return response;
}
