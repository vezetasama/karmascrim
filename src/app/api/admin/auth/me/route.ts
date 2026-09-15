import { NextResponse } from 'next/server';
import { getCurrentAdmin } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const adminSession = await getCurrentAdmin();
    if (!adminSession) {
      return NextResponse.json({ admin: null }, { status: 200 });
    }

    const admin = await db.user.findUnique({
      where: { id: adminSession.id },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
      },
    });

    if (!admin || admin.role !== 'ADMIN') {
      return NextResponse.json({ admin: null }, { status: 200 });
    }

    return NextResponse.json({ admin });
  } catch (error) {
    console.error('Admin me endpoint error:', error);
    return NextResponse.json({ error: 'Failed to fetch admin profile' }, { status: 500 });
  }
}
