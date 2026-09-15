import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const userSession = await getCurrentUser();
    if (!userSession) {
      return NextResponse.json({ notifications: [], unreadCount: 0 }, { status: 200 });
    }

    const { searchParams } = new URL(request.url);
    const typeFilter = searchParams.get('type');
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam, 10) : 50;

    const whereCondition: any = { userId: userSession.id };
    if (typeFilter && typeFilter !== 'ALL') {
      whereCondition.type = typeFilter;
    }

    const notifications = await db.notification.findMany({
      where: whereCondition,
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    const unreadCount = await db.notification.count({
      where: {
        userId: userSession.id,
        read: false,
      },
    });

    return NextResponse.json({ notifications, unreadCount });
  } catch (error) {
    console.error('Fetch notifications error:', error);
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const userSession = await getCurrentUser();
    if (!userSession) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { notificationId, markAll } = await request.json();

    if (markAll) {
      await db.notification.updateMany({
        where: { userId: userSession.id, read: false },
        data: { read: true },
      });
    } else if (notificationId) {
      await db.notification.updateMany({
        where: { id: notificationId, userId: userSession.id },
        data: { read: true },
      });
    }

    const unreadCount = await db.notification.count({
      where: { userId: userSession.id, read: false },
    });

    return NextResponse.json({ success: true, unreadCount });
  } catch (error) {
    console.error('Mark notification read error:', error);
    return NextResponse.json({ error: 'Failed to update notification' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const userSession = await getCurrentUser();
    if (!userSession) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const notificationId = searchParams.get('id');
    const deleteAll = searchParams.get('all') === 'true';

    if (deleteAll) {
      await db.notification.deleteMany({
        where: { userId: userSession.id },
      });
    } else if (notificationId) {
      await db.notification.deleteMany({
        where: { id: notificationId, userId: userSession.id },
      });
    } else {
      return NextResponse.json({ error: 'Missing notification ID or all parameter' }, { status: 400 });
    }

    const unreadCount = await db.notification.count({
      where: { userId: userSession.id, read: false },
    });

    return NextResponse.json({ success: true, unreadCount });
  } catch (error) {
    console.error('Delete notification error:', error);
    return NextResponse.json({ error: 'Failed to delete notification' }, { status: 500 });
  }
}
