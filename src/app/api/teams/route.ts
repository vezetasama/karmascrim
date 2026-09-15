import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const userSession = await getCurrentUser();
    if (!userSession) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const teams = await db.team.findMany({
      where: { captainId: userSession.id },
      include: {
        members: true,
        registrations: {
          include: {
            tournament: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ teams });
  } catch (error) {
    console.error('Fetch teams error:', error);
    return NextResponse.json({ error: 'Failed to fetch teams' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const userSession = await getCurrentUser();
    if (!userSession) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, category, members } = await request.json();

    if (!name || !category) {
      return NextResponse.json({ error: 'Squad name and category are required.' }, { status: 400 });
    }

    const captainUser = await db.user.findUnique({
      where: { id: userSession.id },
      select: { freeFireUid: true, freeFireName: true },
    });

    const normalizedMembers = Array.isArray(members) && members.length > 0
      ? members
      : [
          {
            freeFireUid: captainUser?.freeFireUid || '',
            freeFireName: captainUser?.freeFireName || '',
            role: 'CAPTAIN',
          },
        ];

    const memberEntries = normalizedMembers
      .filter((m: any) => m && (m.freeFireUid || m.freeFireName))
      .map((m: any, index: number) => ({
        userId: index === 0 ? userSession.id : null,
        freeFireUid: (m.freeFireUid || captainUser?.freeFireUid || '').trim(),
        freeFireName: (m.freeFireName || captainUser?.freeFireName || '').trim(),
        role: index === 0 ? 'CAPTAIN' : m.role || 'MEMBER',
      }));

    if (memberEntries.length === 0 || !memberEntries[0].freeFireUid || !memberEntries[0].freeFireName) {
      return NextResponse.json(
        { error: 'Please update your Free Fire UID and IGN in your profile before creating a squad.' },
        { status: 400 }
      );
    }

    const team = await db.team.create({
      data: {
        name: name.trim(),
        category,
        captainId: userSession.id,
        members: {
          create: memberEntries,
        },
      },
      include: {
        members: true,
      },
    });

    return NextResponse.json({ success: true, team });
  } catch (error) {
    console.error('Create team error:', error);
    return NextResponse.json({ error: 'Failed to create team' }, { status: 500 });
  }
}
