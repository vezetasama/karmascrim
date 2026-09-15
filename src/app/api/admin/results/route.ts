import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// Standard Free Fire Esports placement points table
const PLACEMENT_POINTS: Record<number, number> = {
  1: 12,
  2: 9,
  3: 8,
  4: 7,
  5: 6,
  6: 5,
  7: 4,
  8: 3,
  9: 2,
  10: 1,
  11: 0,
  12: 0,
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tournamentId = searchParams.get('tournamentId');

    const where: any = {};
    if (tournamentId) where.tournamentId = tournamentId;

    const matches = await db.match.findMany({
      where,
      include: {
        tournament: true,
        results: {
          include: {
            team: true,
          },
          orderBy: { placement: 'asc' },
        },
      },
      orderBy: { matchNumber: 'asc' },
    });

    return NextResponse.json({ matches });
  } catch (error) {
    console.error('Fetch match results error:', error);
    return NextResponse.json({ error: 'Failed to fetch match results' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const userSession = await getCurrentUser();
    if (!userSession || userSession.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized admin access required' }, { status: 403 });
    }

    const { tournamentId, matchNumber, scheduledTime, results } = await request.json();

    if (!tournamentId || !matchNumber || !Array.isArray(results)) {
      return NextResponse.json({ error: 'Tournament ID, Match Number, and results array are required' }, { status: 400 });
    }

    // Upsert Match
    let match = await db.match.findFirst({
      where: { tournamentId, matchNumber: Number(matchNumber) },
    });

    if (!match) {
      match = await db.match.create({
        data: {
          tournamentId,
          matchNumber: Number(matchNumber),
          scheduledTime: scheduledTime || null,
          status: 'COMPLETED',
        },
      });
    }

    // Delete existing results for this match before inserting updated ones
    await db.matchResult.deleteMany({
      where: { matchId: match.id },
    });

    // Create match results with points calculation
    const matchResultsData = results.map((r: any) => {
      const placement = Number(r.placement || 12);
      const kills = Number(r.kills || 0);
      const placementPoints = PLACEMENT_POINTS[placement] !== undefined ? PLACEMENT_POINTS[placement] : 0;
      const totalPoints = placementPoints + kills;

      return {
        matchId: match.id,
        teamId: r.teamId,
        placement,
        kills,
        placementPoints,
        totalPoints,
        notes: r.notes || null,
      };
    });

    await db.matchResult.createMany({
      data: matchResultsData,
    });

    // Update match status to completed
    await db.match.update({
      where: { id: match.id },
      data: { status: 'COMPLETED' },
    });

    // Notify registered participants that results are published
    const confirmedRegs = await db.registration.findMany({
      where: { tournamentId, status: 'CONFIRMED' },
      select: { userId: true },
    });

    if (confirmedRegs.length > 0) {
      const notifications = confirmedRegs.map((reg) => ({
        userId: reg.userId,
        title: `Match #${matchNumber} Results Published`,
        message: `Results and points table for Match #${matchNumber} are now live! Check the tournament leaderboard.`,
        linkUrl: `/tournaments/${tournamentId}`,
      }));
      await db.notification.createMany({ data: notifications });
    }

    return NextResponse.json({ success: true, matchId: match.id });
  } catch (error) {
    console.error('Save match results error:', error);
    return NextResponse.json({ error: 'Failed to record match results' }, { status: 500 });
  }
}
