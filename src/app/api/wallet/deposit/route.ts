import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { notifyDepositSubmitted } from '@/lib/notifications';

export async function POST(request: Request) {
  try {
    const userSession = await getCurrentUser();
    if (!userSession) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { amount, paymentMethodId, transactionId, screenshotUrl, note } = await request.json();

    const depositAmount = Number(amount);
    if (!depositAmount || isNaN(depositAmount) || depositAmount <= 0) {
      return NextResponse.json({ error: 'Please enter a valid deposit amount.' }, { status: 400 });
    }

    const trimmedTxId = (transactionId && typeof transactionId === 'string') ? transactionId.trim() : '';

    if (!trimmedTxId && !screenshotUrl) {
      return NextResponse.json({ error: 'Please enter a Transaction Code or upload a Payment Screenshot.' }, { status: 400 });
    }

    const finalTxId = trimmedTxId || `TXN-${Math.floor(100000 + Math.random() * 900000)}`;


    // Resolve or fallback payment method
    let paymentMethod = null;
    if (paymentMethodId && typeof paymentMethodId === 'string') {
      paymentMethod = await db.paymentMethod.findUnique({
        where: { id: paymentMethodId },
      });
    }

    if (!paymentMethod || !paymentMethod.enabled) {
      paymentMethod = await db.paymentMethod.findFirst({
        where: { enabled: true },
        orderBy: { sortOrder: 'asc' },
      });
    }

    if (!paymentMethod) {
      paymentMethod = await db.paymentMethod.create({
        data: {
          name: 'Fonepay',
          type: 'FONEPAY',
          accountName: 'KARMA SCRIMS',
          accountNumber: '9800000000',
          enabled: true,
          minAmount: 10,
          maxAmount: 25000,
        },
      });
    }

    // Validate min and max deposit limits
    if (depositAmount < paymentMethod.minAmount) {
      return NextResponse.json(
        { error: `Minimum deposit amount for ${paymentMethod.name} is ${paymentMethod.minAmount} COINS (Rs. ${paymentMethod.minAmount}).` },
        { status: 400 }
      );
    }

    if (depositAmount > paymentMethod.maxAmount) {
      return NextResponse.json(
        { error: `Maximum deposit amount for ${paymentMethod.name} is ${paymentMethod.maxAmount} COINS (Rs. ${paymentMethod.maxAmount}).` },
        { status: 400 }
      );
    }

    // Check if duplicate transaction ID exists in PENDING or APPROVED status
    const existingTx = await db.depositRequest.findFirst({
      where: {
        transactionId: finalTxId,
        status: { in: ['PENDING', 'APPROVED'] },
      },
    });

    if (existingTx) {
      return NextResponse.json(
        { error: 'A deposit request with this Transaction ID has already been submitted.' },
        { status: 400 }
      );
    }

    // Generate unique deposit request ID (e.g. KS-DEP-94821)
    const randomNum = Math.floor(10000 + Math.random() * 90000);
    const requestId = `KS-DEP-${randomNum}`;

    // Create Deposit Request record (Status: PENDING)
    const depositRequest = await db.depositRequest.create({
      data: {
        requestId,
        userId: userSession.id,
        paymentMethodId: paymentMethod.id,
        amount: depositAmount,
        transactionId: finalTxId,
        screenshotUrl: screenshotUrl || null,
        note: note ? note.trim() : null,
        status: 'PENDING',
      },
      include: {
        paymentMethod: true,
      },
    });

    // Notify user automatically
    await notifyDepositSubmitted(userSession.id, depositAmount, requestId, finalTxId);

    return NextResponse.json({
      success: true,
      message: 'Deposit request submitted successfully.',
      depositRequest,
    });
  } catch (error) {
    console.error('Error creating deposit request:', error);
    return NextResponse.json({ error: 'Failed to submit deposit request' }, { status: 500 });
  }
}
