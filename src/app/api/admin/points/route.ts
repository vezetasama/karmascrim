import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const userSession = await getCurrentUser();
    if (!userSession || userSession.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized admin access required' }, { status: 403 });
    }

    const { tournamentId, pointsMap } = await request.json();

    if (!tournamentId || !pointsMap || typeof pointsMap !== 'object') {
      return NextResponse.json({ error: 'Tournament ID and pointsMap object are required' }, { status: 400 });
    }

    const tournament = await db.tournament.findUnique({
      where: { id: tournamentId },
      include: {
        registrations: {
          where: { status: 'CONFIRMED' },
        },
      },
    });

    if (!tournament) {
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
    }

    // 1. Update points for each provided registration ID / entity ID
    for (const [entityId, pointsValue] of Object.entries(pointsMap)) {
      const pts = Math.max(0, Number(pointsValue) || 0);

      // Find registration by registration id or teamId or userId
      const matchingReg = tournament.registrations.find(
        (r) => r.id === entityId || r.teamId === entityId || r.userId === entityId
      );

      if (matchingReg) {
        await db.registration.update({
          where: { id: matchingReg.id },
          data: { points: pts },
        });
      }
    }

    // 2. Auto-calculate positions/ranks based on points descending
    const allRegistrations = await db.registration.findMany({
      where: { tournamentId, status: 'CONFIRMED' },
      orderBy: [
        { points: 'desc' },
        { createdAt: 'asc' },
      ],
    });

    // Assign 1-indexed ranks (1, 2, 3...)
    for (let i = 0; i < allRegistrations.length; i++) {
      const reg = allRegistrations[i];
      const rank = i + 1;
      await db.registration.update({
        where: { id: reg.id },
        data: { rank },
      });
    }

    // Notify registered participants that Point Table has been updated
    const notifications = allRegistrations.map((reg) => ({
      userId: reg.userId,
      title: `🏆 Point Table Standings Updated`,
      message: tournament.type === 'SOLO'
        ? `Your points & position for ${tournament.name} have been updated!`
        : `Point Table standings for ${tournament.name} have been updated!`,
      linkUrl: `/tournaments/${tournamentId}`,
    }));

    if (notifications.length > 0) {
      await db.notification.createMany({ data: notifications });
    }

    return NextResponse.json({
      success: true,
      message: 'Point Table updated & ranks auto-calculated successfully!',
    });
  } catch (error) {
    console.error('Save points error:', error);
    return NextResponse.json({ error: 'Failed to update points' }, { status: 500 });
  }
}
