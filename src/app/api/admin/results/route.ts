import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

const DEFAULT_SQUAD_PLACEMENT_PTS: Record<number, number> = {
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
            user: {
              select: { id: true, name: true, username: true, freeFireUid: true, freeFireName: true },
            },
          },
          orderBy: [
            { totalPoints: 'desc' },
            { winningAmount: 'desc' },
            { kills: 'desc' },
            { placement: 'asc' },
          ],
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

    const tournament = await db.tournament.findUnique({
      where: { id: tournamentId },
    });

    if (!tournament) {
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
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

    // ==================================================
    // STRICT BACKEND SCORING BRANCHING: SOLO VS SQUAD
    // ==================================================
    let matchResultsData: any[] = [];

    if (tournament.type === 'SOLO') {
      // --------------------------------------------------
      // A. SOLO TOURNAMENT SCORING FORMULA
      // --------------------------------------------------
      // Solo scoring options: PER_KILL, SURVIVAL, KILL_AND_SURVIVAL
      const soloScoringType = tournament.soloScoringType || 'PER_KILL';
      const killReward = Number(tournament.soloKillReward || 0);

      let placementRewards: Record<string, number> = {};
      if (tournament.soloPlacementRewards) {
        try {
          placementRewards = typeof tournament.soloPlacementRewards === 'string' 
            ? JSON.parse(tournament.soloPlacementRewards) 
            : tournament.soloPlacementRewards;
        } catch (e) {
          placementRewards = {};
        }
      }

      matchResultsData = results.map((r: any) => {
        const placement = Number(r.placement || 12);
        const kills = Number(r.kills || 0);
        const placementReward = Number(placementRewards[placement] || placementRewards[String(placement)] || 0);

        let calculatedWinnings = 0;
        if (soloScoringType === 'PER_KILL') {
          calculatedWinnings = kills * killReward;
        } else if (soloScoringType === 'SURVIVAL') {
          calculatedWinnings = placementReward;
        } else if (soloScoringType === 'KILL_AND_SURVIVAL') {
          calculatedWinnings = (kills * killReward) + placementReward;
        }

        return {
          matchId: match.id,
          userId: r.userId || null,
          teamId: r.teamId || null,
          placement,
          kills,
          placementPoints: 0,
          killPoints: 0,
          otherPoints: 0,
          totalPoints: 0,
          winningAmount: Number(r.winningAmount !== undefined ? r.winningAmount : calculatedWinnings),
          payoutStatus: r.payoutStatus || 'PENDING',
          notes: r.notes || null,
        };
      });

    } else {
      // --------------------------------------------------
      // B. SQUAD TOURNAMENT SCORING FORMULA
      // --------------------------------------------------
      // Squad tournaments use existing Squad Point Table (Position Pts + Kill Pts + Other Pts = Total Pts)
      let squadPointTable: Record<string, number> = {};
      if (tournament.squadPointTable) {
        try {
          squadPointTable = typeof tournament.squadPointTable === 'string'
            ? JSON.parse(tournament.squadPointTable)
            : tournament.squadPointTable;
        } catch (e) {
          squadPointTable = {};
        }
      }

      const squadKillPointsMultiplier = Number(tournament.squadKillPoints !== null && tournament.squadKillPoints !== undefined ? tournament.squadKillPoints : 1);

      matchResultsData = results.map((r: any) => {
        const placement = Number(r.placement || 12);
        const kills = Number(r.kills || 0);

        const placementPoints = squadPointTable[placement] !== undefined 
          ? Number(squadPointTable[placement]) 
          : squadPointTable[String(placement)] !== undefined 
          ? Number(squadPointTable[String(placement)])
          : DEFAULT_SQUAD_PLACEMENT_PTS[placement] || 0;

        const killPoints = kills * squadKillPointsMultiplier;
        const otherPoints = Number(r.otherPoints || 0);
        const totalPoints = placementPoints + killPoints + otherPoints;

        // Squad winning amount is separate from points calculation and set by Admin
        const winningAmount = Number(r.winningAmount || 0);

        return {
          matchId: match.id,
          teamId: r.teamId || null,
          userId: r.userId || null,
          placement,
          kills,
          placementPoints,
          killPoints,
          otherPoints,
          totalPoints,
          winningAmount,
          payoutStatus: r.payoutStatus || 'PENDING',
          notes: r.notes || null,
        };
      });
    }

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
        title: `Match #${matchNumber} Standings Published`,
        message: tournament.type === 'SOLO'
          ? `Match #${matchNumber} results & prize calculation are live!`
          : `Match #${matchNumber} official Squad point standings & leaderboard are live!`,
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
