import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const userSession = await getCurrentUser();

    const tournament = await db.tournament.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
      },
      include: {
        registrations: {
          include: {
            team: {
              include: {
                members: true,
              },
            },
            user: {
              select: { id: true, name: true, username: true, freeFireUid: true, freeFireName: true },
            },
          },
        },
        matches: {
          include: {
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
        },
      },
    });

    if (!tournament) {
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
    }

    const isAdmin = userSession?.role === 'ADMIN';
    const isSolo = tournament.type === 'SOLO';

    // Sort registrations by rank (or points descending)
    let sortedRegistrations = [...tournament.registrations].sort((a, b) => {
      if (a.rank !== null && b.rank !== null && a.rank !== undefined && b.rank !== undefined) {
        return a.rank - b.rank;
      }
      return (b.points || 0) - (a.points || 0);
    });

    // ==================================================
    // STRICT BACKEND PRIVACY FILTERING — SOLO TOURNAMENTS
    // ==================================================
    let finalRegistrations: any[] = sortedRegistrations;

    if (isSolo && !isAdmin) {
      if (userSession) {
        // Logged-in non-admin player: return ONLY their own points and position record!
        finalRegistrations = sortedRegistrations
          .filter((reg) => reg.userId === userSession.id)
          .map((reg) => {
            const defaultSlot = sortedRegistrations.findIndex((r) => r.id === reg.id) + 1;
            return {
              id: reg.id,
              registrationId: reg.registrationId,
              tournamentId: reg.tournamentId,
              userId: reg.userId,
              teamId: reg.teamId || null,
              status: reg.status,
              points: reg.points || 0,
              rank: reg.rank || null,
              slotNumber: reg.slotNumber || defaultSlot,
              user: reg.user,
              team: reg.team || null,
            };
          });
      } else {
        // Anonymous visitor: strip all points and ranks entirely from response
        finalRegistrations = sortedRegistrations.map((reg) => {
          const defaultSlot = sortedRegistrations.findIndex((r) => r.id === reg.id) + 1;
          return {
            id: reg.id,
            registrationId: reg.registrationId,
            tournamentId: reg.tournamentId,
            status: reg.status,
            slotNumber: reg.slotNumber || defaultSlot,
            user: reg.user,
            team: reg.team || null,
          };
        });
      }
    }

    // Security check for Room ID & Password release
    let canViewRoomDetails = false;

    if (userSession) {
      if (userSession.role === 'ADMIN') {
        canViewRoomDetails = true;
      } else {
        const userRegistration = tournament.registrations.find(
          (reg) => reg.userId === userSession.id && reg.status === 'CONFIRMED'
        );
        if (userRegistration && tournament.roomReleased) {
          canViewRoomDetails = true;
        }
      }
    }

    const responseData = {
      ...tournament,
      registrations: finalRegistrations,
      roomId: canViewRoomDetails ? tournament.roomId : null,
      roomPassword: canViewRoomDetails ? tournament.roomPassword : null,
      roomAccessGranted: canViewRoomDetails,
    };

    return NextResponse.json({ tournament: responseData });
  } catch (error) {
    console.error('Fetch tournament details error:', error);
    return NextResponse.json({ error: 'Failed to fetch tournament' }, { status: 500 });
  }
}

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const userSession = await getCurrentUser();
    if (!userSession || userSession.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized admin access required' }, { status: 403 });
    }

    const body = await request.json();

    const updateData: any = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.category !== undefined) updateData.category = body.category;
    if (body.format !== undefined) updateData.format = body.format;
    if (body.type !== undefined) updateData.type = body.type === 'SOLO' ? 'SOLO' : 'SQUAD';
    if (body.description !== undefined) updateData.description = body.description;
    if (body.rules !== undefined) updateData.rules = body.rules;
    if (body.whatsappLink !== undefined) updateData.whatsappLink = body.whatsappLink;
    if (body.date !== undefined) updateData.date = body.date;
    if (body.startTime !== undefined) updateData.startTime = body.startTime;
    if (body.registrationDeadline !== undefined) updateData.registrationDeadline = body.registrationDeadline;
    if (body.entryFee !== undefined) updateData.entryFee = Number(body.entryFee);
    if (body.prizePool !== undefined) updateData.prizePool = Number(body.prizePool);
    if (body.totalSlots !== undefined) updateData.totalSlots = Number(body.totalSlots);
    if (body.status !== undefined) updateData.status = body.status;
    if (body.bannerUrl !== undefined) updateData.bannerUrl = body.bannerUrl;
    if (body.maps !== undefined) {
      updateData.maps = Array.isArray(body.maps)
        ? JSON.stringify(body.maps)
        : typeof body.maps === 'string'
        ? body.maps
        : null;
    }

    if ((updateData.type === 'SOLO' || body.type === 'SOLO') && (!updateData.maps || updateData.maps === '[]')) {
      updateData.maps = JSON.stringify(['Bermuda']);
    }

    if (body.roomId !== undefined) updateData.roomId = body.roomId;
    if (body.roomPassword !== undefined) updateData.roomPassword = body.roomPassword;
    if (body.roomReleased !== undefined) updateData.roomReleased = Boolean(body.roomReleased);

    // Scoring configurations
    if (updateData.type === 'SOLO' || body.soloScoringType !== undefined || body.soloKillReward !== undefined || body.soloPlacementRewards !== undefined) {
      if (body.type === 'SOLO' || (body.type === undefined && updateData.type === 'SOLO')) {
        updateData.soloScoringType = body.soloScoringType || 'PER_KILL';
        updateData.soloKillReward = Number(body.soloKillReward || 0);
        updateData.soloPlacementRewards = typeof body.soloPlacementRewards === 'object'
          ? JSON.stringify(body.soloPlacementRewards)
          : body.soloPlacementRewards || null;
        updateData.squadKillPoints = null;
        updateData.squadPointTable = null;
      }
    }

    if (updateData.type === 'SQUAD' || body.squadKillPoints !== undefined || body.squadPointTable !== undefined) {
      if (body.type === 'SQUAD' || (body.type === undefined && updateData.type === 'SQUAD')) {
        updateData.squadKillPoints = Number(body.squadKillPoints !== undefined ? body.squadKillPoints : 1);
        updateData.squadPointTable = typeof body.squadPointTable === 'object'
          ? JSON.stringify(body.squadPointTable)
          : body.squadPointTable || null;
        updateData.soloScoringType = null;
        updateData.soloKillReward = null;
        updateData.soloPlacementRewards = null;
      }
    }

    const updatedTournament = await db.tournament.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, tournament: updatedTournament });
  } catch (error) {
    console.error('Update tournament error:', error);
    return NextResponse.json({ error: 'Failed to update tournament' }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const userSession = await getCurrentUser();
    if (!userSession || userSession.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized admin access required' }, { status: 403 });
    }

    const registrationCount = await db.registration.count({
      where: { tournamentId: id },
    });

    // Safely delete tournament and related registrations
    await db.tournament.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: `Tournament deleted successfully. (${registrationCount} related registrations removed safely)`,
    });
  } catch (error) {
    console.error('Delete tournament error:', error);
    return NextResponse.json({ error: 'Failed to delete tournament' }, { status: 500 });
  }
}
