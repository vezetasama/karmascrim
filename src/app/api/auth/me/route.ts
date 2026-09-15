import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const userSession = await getCurrentUser();
    if (!userSession) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    const user = await db.user.findUnique({
      where: { id: userSession.id },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        phone: true,
        freeFireUid: true,
        freeFireName: true,
        role: true,
        status: true,
        createdAt: true,
        wallet: {
          select: {
            balance: true,
            depositBalance: true,
            winningsBalance: true,
          },
        },
        teamsCaptained: {
          include: {
            members: true,
          },
        },
        registrations: {
          include: {
            tournament: true,
            team: true,
            payment: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Me endpoint error:', error);
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const userSession = await getCurrentUser();
    if (!userSession) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, freeFireUid, freeFireName } = await request.json();

    const updatedUser = await db.user.update({
      where: { id: userSession.id },
      data: {
        name: name ? name.trim() : undefined,
        freeFireUid: freeFireUid ? freeFireUid.trim() : undefined,
        freeFireName: freeFireName ? freeFireName.trim() : undefined,
      },
    });

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error('Update profile error:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}
