import { NextResponse } from 'next/server';
import { getCurrentAdmin, getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';

async function checkAdminAuth() {
  const adminSession = await getCurrentAdmin();
  if (adminSession) return adminSession;

  const userSession = await getCurrentUser();
  if (userSession && userSession.role === 'ADMIN') return userSession;

  return null;
}

export async function GET(request: Request) {
  try {
    const admin = await checkAdminAuth();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    const where: any = {};

    if (status && ['PENDING', 'APPROVED', 'REJECTED'].includes(status)) {
      where.status = status;
    }

    if (search) {
      const q = search.trim();
      where.OR = [
        { requestId: { contains: q } },
        { transactionId: { contains: q } },
        { user: { name: { contains: q } } },
        { user: { username: { contains: q } } },
        { user: { email: { contains: q } } },
      ];
    }

    const depositRequests = await db.depositRequest.findMany({
      where,
      include: {
        user: {
          select: { id: true, name: true, username: true, email: true, phone: true },
        },
        paymentMethod: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ depositRequests });
  } catch (error) {
    console.error('Error fetching deposit requests:', error);
    return NextResponse.json({ error: 'Failed to fetch deposit requests' }, { status: 500 });
  }
}
