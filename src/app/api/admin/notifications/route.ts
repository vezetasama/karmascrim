import { NextResponse } from 'next/server';
import { getCurrentAdmin, getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { createBroadcastNotification } from '@/lib/notifications';

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
    const search = searchParams.get('search') || '';
    const type = searchParams.get('type') || '';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '15', 10);
    const skip = (page - 1) * limit;

    const where: any = {};
    if (type && type !== 'ALL') {
      where.type = type;
    }
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { message: { contains: search } },
      ];
    }

    const [logs, total] = await Promise.all([
      db.adminNotificationLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.adminNotificationLog.count({ where }),
    ]);

    // Enhance logs with read count calculation from Notification table
    const logsWithReadStats = await Promise.all(
      logs.map(async (log) => {
        let readCount = 0;
        try {
          readCount = await db.notification.count({
            where: {
              title: log.title,
              sentBy: log.sentBy,
              read: true,
            },
          });
        } catch (e) {}

        return {
          ...log,
          readCount,
        };
      })
    );

    return NextResponse.json({
      logs: logsWithReadStats,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (error) {
    console.error('Admin fetch notifications history error:', error);
    return NextResponse.json({ error: 'Failed to fetch notification history' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const admin = await checkAdminAuth();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      title,
      message,
      recipientType,
      targetUserIds,
      type = 'ANNOUNCEMENT',
      actionUrl,
      actionText,
    } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ error: 'Notification title is required.' }, { status: 400 });
    }

    if (!message || !message.trim()) {
      return NextResponse.json({ error: 'Notification message is required.' }, { status: 400 });
    }

    if (!recipientType || !['ALL', 'SPECIFIC'].includes(recipientType)) {
      return NextResponse.json({ error: 'Invalid recipient type specified.' }, { status: 400 });
    }

    if (recipientType === 'SPECIFIC' && (!targetUserIds || !Array.isArray(targetUserIds) || targetUserIds.length === 0)) {
      return NextResponse.json({ error: 'Please select at least one recipient user.' }, { status: 400 });
    }

    const result = await createBroadcastNotification({
      recipientType,
      targetUserIds: recipientType === 'SPECIFIC' ? targetUserIds : [],
      title,
      message,
      type,
      actionUrl,
      actionText,
      sentBy: admin.id,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Failed to send notifications' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: `Notification sent successfully to ${result.recipientCount} user(s).`,
      recipientCount: result.recipientCount,
    });
  } catch (error) {
    console.error('Admin send notification error:', error);
    return NextResponse.json({ error: 'Failed to send notification' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const admin = await checkAdminAuth();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Log ID is required' }, { status: 400 });
    }

    await db.adminNotificationLog.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Notification log deleted successfully.' });
  } catch (error) {
    console.error('Admin delete notification log error:', error);
    return NextResponse.json({ error: 'Failed to delete notification log' }, { status: 500 });
  }
}
