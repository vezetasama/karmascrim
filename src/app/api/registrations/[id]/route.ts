import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userSession = await getCurrentUser();
    if (!userSession) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const registrationId = id;
    const body = await request.json();
    const { freeFireName, freeFireUid, teamName } = body;

    const registration = await db.registration.findUnique({
      where: { id: registrationId },
      include: {
        tournament: true,
        team: true,
      },
    });

    if (!registration) {
      return NextResponse.json({ error: 'Registration not found' }, { status: 404 });
    }

    // Check ownership or admin
    if (registration.userId !== userSession.id && userSession.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check if room code is released
    if (registration.tournament.roomReleased) {
      return NextResponse.json(
        { error: 'Registration details cannot be updated after Room Code has been released by Admin.' },
        { status: 400 }
      );
    }

    const isSolo =
      registration.tournament.type === 'SOLO' ||
      registration.tournament.format?.toLowerCase() === 'solo' ||
      registration.tournament.name?.toUpperCase().includes('SOLO');

    // Validations
    if (!freeFireName || !freeFireName.trim() || !freeFireUid || !freeFireUid.trim()) {
      return NextResponse.json({ error: 'IGN (In-Game Name) and Free Fire UID are required.' }, { status: 400 });
    }

    if (!isSolo && (!teamName || !teamName.trim())) {
      return NextResponse.json({ error: 'Team Name is required for Squad tournaments.' }, { status: 400 });
    }

    // 1. Update user profile IGN and UID
    await db.user.update({
      where: { id: registration.userId },
      data: {
        freeFireName: freeFireName.trim(),
        freeFireUid: freeFireUid.trim(),
      },
    });

    // 2. If Squad tournament, update Team Name
    if (!isSolo && registration.teamId) {
      await db.team.update({
        where: { id: registration.teamId },
        data: {
          name: teamName.trim(),
        },
      });

      // Update captain/member records if present
      await db.teamMember.updateMany({
        where: {
          teamId: registration.teamId,
          userId: registration.userId,
        },
        data: {
          freeFireName: freeFireName.trim(),
          freeFireUid: freeFireUid.trim(),
        },
      });
    }

    const updatedRegistration = await db.registration.findUnique({
      where: { id: registrationId },
      include: {
        tournament: true,
        team: {
          include: { members: true },
        },
        user: {
          select: { id: true, name: true, username: true, freeFireUid: true, freeFireName: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Registration details updated successfully!',
      registration: updatedRegistration,
    });
  } catch (error) {
    console.error('Update registration error:', error);
    return NextResponse.json({ error: 'Failed to update registration details' }, { status: 500 });
  }
}
