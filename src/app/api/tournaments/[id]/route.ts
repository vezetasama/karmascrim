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
              },
            },
          },
        },
      },
    });

    if (!tournament) {
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
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
    if (body.description !== undefined) updateData.description = body.description;
    if (body.rules !== undefined) updateData.rules = body.rules;
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

    if (body.roomId !== undefined) updateData.roomId = body.roomId;
    if (body.roomPassword !== undefined) updateData.roomPassword = body.roomPassword;
    if (body.roomReleased !== undefined) updateData.roomReleased = Boolean(body.roomReleased);

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
