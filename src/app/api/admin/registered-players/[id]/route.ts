import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const userSession = await getCurrentUser();
    if (!userSession || userSession.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { slotNumber, freeFireName, freeFireUid, teamName, status } = body;

    const registration = await db.registration.findUnique({
      where: { id },
      include: {
        tournament: true,
        user: true,
        team: {
          include: {
            members: true,
          },
        },
      },
    });

    if (!registration) {
      return NextResponse.json({ error: 'Registration not found' }, { status: 404 });
    }

    // 1. Update Registration slotNumber or status if provided
    const regUpdateData: any = {};
    if (slotNumber !== undefined) regUpdateData.slotNumber = slotNumber ? Number(slotNumber) : null;
    if (status !== undefined) regUpdateData.status = status;

    if (Object.keys(regUpdateData).length > 0) {
      await db.registration.update({
        where: { id },
        data: regUpdateData,
      });
    }

    // 2. Update Free Fire UID & IGN on User (for Solo / Captain)
    if (registration.userId && (freeFireName !== undefined || freeFireUid !== undefined)) {
      const userUpdateData: any = {};
      if (freeFireName !== undefined) userUpdateData.freeFireName = freeFireName.trim();
      if (freeFireUid !== undefined) userUpdateData.freeFireUid = freeFireUid.trim();

      if (Object.keys(userUpdateData).length > 0) {
        await db.user.update({
          where: { id: registration.userId },
          data: userUpdateData,
        });
      }
    }

    // 3. Update Team Name (for Squad)
    if (registration.teamId && teamName !== undefined && teamName.trim()) {
      await db.team.update({
        where: { id: registration.teamId },
        data: { name: teamName.trim() },
      });
    }

    return NextResponse.json({ success: true, message: 'Registration updated successfully' });
  } catch (error: any) {
    console.error('Update registered player error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update registration' }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const userSession = await getCurrentUser();
    if (!userSession || userSession.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized admin access required' }, { status: 403 });
    }

    const registration = await db.registration.findUnique({
      where: { id },
      include: {
        tournament: true,
      },
    });

    if (!registration) {
      return NextResponse.json({ error: 'Registration not found' }, { status: 404 });
    }

    // Soft delete / Cancel registration to preserve audit logs
    await db.registration.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });

    // Decrement registered slots on tournament safely
    if (registration.tournamentId) {
      await db.tournament.update({
        where: { id: registration.tournamentId },
        data: {
          registeredSlots: {
            decrement: Math.max(0, 1),
          },
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Registration removed successfully from tournament',
    });
  } catch (error: any) {
    console.error('Delete registration error:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete registration' }, { status: 500 });
  }
}
