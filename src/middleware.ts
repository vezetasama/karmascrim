import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'karma-scrims-esports-super-secret-jwt-key-2026'
);

const ADMIN_SESSION_SECRET = new TextEncoder().encode(
  process.env.ADMIN_SESSION_SECRET || 'karma-scrims-admin-panel-secret-key-2026-secure'
);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ─── Admin Routes (except /admin/login which is public) ───────────
  if (
    (pathname.startsWith('/admin') && pathname !== '/admin/login') ||
    (pathname.startsWith('/api/admin') && !pathname.startsWith('/api/admin/auth'))
  ) {
    const adminToken = request.cookies.get('karma_admin_session')?.value;

    if (!adminToken) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Unauthorized. Admin login required.' }, { status: 401 });
      }
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }

    try {
      const verified = await jwtVerify(adminToken, ADMIN_SESSION_SECRET);
      const payload = verified.payload as { role?: string; type?: string };

      // Must have admin role AND admin type claim
      if (payload.role !== 'ADMIN' || payload.type !== 'admin') {
        if (pathname.startsWith('/api/')) {
          return NextResponse.json({ error: 'Forbidden. Admin access required.' }, { status: 403 });
        }
        return NextResponse.redirect(new URL('/admin/login', request.url));
      }
    } catch (err) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Invalid or expired admin session' }, { status: 401 });
      }
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }

    // Add cache-control headers to prevent back-button access after logout
    const response = NextResponse.next();
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    return response;
  }

  // ─── User Dashboard Routes ────────────────────────────────────────
  if (pathname.startsWith('/dashboard')) {
    const token = request.cookies.get('karma_session')?.value;

    if (!token) {
      return NextResponse.redirect(new URL('/login?redirect=' + pathname, request.url));
    }
    try {
      await jwtVerify(token, JWT_SECRET);
    } catch (err) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/dashboard/:path*',
    '/api/admin/:path*',
  ],
};
