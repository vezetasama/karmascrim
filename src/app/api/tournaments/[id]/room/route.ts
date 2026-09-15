import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { notifyRoomDetails } from '@/lib/notifications';

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const userSession = await getCurrentUser();
    if (!userSession || userSession.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized admin access required' }, { status: 403 });
    }

    const { roomId, roomPassword, roomReleased } = await request.json();

    const existing = await db.tournament.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
    }

    const updateData: any = {};
    if (roomId !== undefined) updateData.roomId = roomId;
    if (roomPassword !== undefined) updateData.roomPassword = roomPassword;
    if (roomReleased !== undefined) updateData.roomReleased = Boolean(roomReleased);

    const tournament = await db.tournament.update({
      where: { id },
      data: updateData,
    });

    // Notify eligible registered users if room details were released or updated
    const isNowReleased = roomReleased !== undefined ? Boolean(roomReleased) : tournament.roomReleased;
    const isRoomUpdated = (roomId && roomId !== existing.roomId) || (roomPassword && roomPassword !== existing.roomPassword);

    if (isNowReleased || isRoomUpdated) {
      const confirmedRegs = await db.registration.findMany({
        where: { tournamentId: id, status: 'CONFIRMED' },
        select: { userId: true },
      });

      const participantUserIds = confirmedRegs.map((r) => r.userId);
      if (participantUserIds.length > 0) {
        const isUpdate = Boolean(existing.roomReleased && isRoomUpdated);
        await notifyRoomDetails(participantUserIds, tournament.name, tournament.id, isUpdate);
      }
    }

    return NextResponse.json({ success: true, tournament });
  } catch (error) {
    console.error('Room details update error:', error);
    return NextResponse.json({ error: 'Failed to update room details' }, { status: 500 });
  }
}
