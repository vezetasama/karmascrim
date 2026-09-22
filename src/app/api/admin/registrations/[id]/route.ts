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

    const { action, rejectionReason } = await request.json();

    const registration = await db.registration.findUnique({
      where: { id },
      include: {
        tournament: true,
        payment: true,
      },
    });

    if (!registration) {
      return NextResponse.json({ error: 'Registration not found' }, { status: 404 });
    }

    if (action === 'APPROVE') {
      // Approve Payment if exists
      if (registration.payment) {
        await db.payment.update({
          where: { registrationId: id },
          data: {
            status: 'APPROVED',
            verifiedBy: userSession.id,
            verifiedAt: new Date(),
          },
        });
      }

      // Update Registration
      let slotNumberToAssign = registration.slotNumber;
      if (!slotNumberToAssign && registration.tournament.type === 'SOLO') {
        const count = await db.registration.count({
          where: { tournamentId: registration.tournamentId, id: { not: id } },
        });
        slotNumberToAssign = count + 1;
      }

      await db.registration.update({
        where: { id },
        data: {
          status: 'CONFIRMED',
          paymentStatus: 'VERIFIED',
          ...(slotNumberToAssign ? { slotNumber: slotNumberToAssign } : {}),
        },
      });

      // Increment registered slots on tournament
      await db.tournament.update({
        where: { id: registration.tournamentId },
        data: {
          registeredSlots: { increment: 1 },
        },
      });

      // Send Notification to User
      await db.notification.create({
        data: {
          userId: registration.userId,
          title: '🎉 Registration Confirmed!',
          message: `Your registration (${registration.registrationId}) for ${registration.tournament.name} has been verified and confirmed! Room details will be released in your dashboard before match start.`,
          linkUrl: '/dashboard',
        },
      });

      return NextResponse.json({ success: true, message: 'Registration confirmed successfully' });
    } else if (action === 'REJECT') {
      if (registration.payment) {
        await db.payment.update({
          where: { registrationId: id },
          data: {
            status: 'REJECTED',
            rejectionReason: rejectionReason || 'Invalid transaction reference or unverified payment.',
            verifiedBy: userSession.id,
            verifiedAt: new Date(),
          },
        });
      }

      await db.registration.update({
        where: { id },
        data: {
          status: 'REJECTED',
          paymentStatus: 'REJECTED',
        },
      });

      await db.notification.create({
        data: {
          userId: registration.userId,
          title: '❌ Payment Rejected',
          message: `Your payment for ${registration.tournament.name} was rejected. Reason: ${rejectionReason || 'Invalid transaction ID/screenshot.'}`,
          linkUrl: '/dashboard',
        },
      });

      return NextResponse.json({ success: true, message: 'Registration rejected' });
    } else if (action === 'CANCEL') {
      await db.registration.update({
        where: { id },
        data: { status: 'CANCELLED' },
      });

      return NextResponse.json({ success: true, message: 'Registration cancelled' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Admin registration update error:', error);
    return NextResponse.json({ error: 'Failed to update registration' }, { status: 500 });
  }
}
