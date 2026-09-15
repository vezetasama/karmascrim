import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const userSession = await getCurrentUser();
    if (!userSession) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { registrationId, paymentMethodId, amount, transactionId, screenshotUrl, note } = await request.json();

    if (!registrationId || !paymentMethodId || !transactionId) {
      return NextResponse.json(
        { error: 'Registration ID, Payment Method, and Transaction ID are required.' },
        { status: 400 }
      );
    }

    const registration = await db.registration.findUnique({
      where: { id: registrationId },
      include: { tournament: true },
    });

    if (!registration) {
      return NextResponse.json({ error: 'Registration not found' }, { status: 404 });
    }

    if (registration.userId !== userSession.id && userSession.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const paymentAmount = amount ? Number(amount) : registration.tournament.entryFee;

    // Create or update payment details
    const payment = await db.payment.upsert({
      where: { registrationId },
      create: {
        registrationId,
        paymentMethodId,
        amount: paymentAmount,
        transactionId: transactionId.trim(),
        screenshotUrl: screenshotUrl || 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=500&q=80',
        note: note ? note.trim() : null,
        status: 'PENDING',
      },
      update: {
        paymentMethodId,
        amount: paymentAmount,
        transactionId: transactionId.trim(),
        screenshotUrl: screenshotUrl || undefined,
        note: note ? note.trim() : undefined,
        status: 'PENDING',
        rejectionReason: null,
      },
    });

    // Update registration status
    await db.registration.update({
      where: { id: registrationId },
      data: {
        status: 'PAYMENT_SUBMITTED',
        paymentStatus: 'SUBMITTED',
      },
    });

    // Notification
    await db.notification.create({
      data: {
        userId: userSession.id,
        title: 'Payment Submitted',
        message: `Your payment of NPR ${paymentAmount} (Tx: ${transactionId}) for ${registration.tournament.name} has been received and is pending admin verification.`,
        linkUrl: '/dashboard',
      },
    });

    return NextResponse.json({ success: true, payment });
  } catch (error) {
    console.error('Payment submission error:', error);
    return NextResponse.json({ error: 'Failed to submit payment details' }, { status: 500 });
  }
}
