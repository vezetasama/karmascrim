import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { notifyWithdrawalRequested } from '@/lib/notifications';

export async function GET() {
  try {
    const userSession = await getCurrentUser();
    if (!userSession) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const withdrawalRequests = await db.withdrawalRequest.findMany({
      where: { userId: userSession.id },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ withdrawalRequests });
  } catch (error) {
    console.error('Fetch user withdrawals error:', error);
    return NextResponse.json({ error: 'Failed to fetch withdrawal requests' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const userSession = await getCurrentUser();
    if (!userSession) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { amount, method, accountName, accountNumber, bankName } = await request.json();

    const withdrawAmount = Number(amount);
    if (!withdrawAmount || isNaN(withdrawAmount) || withdrawAmount < 50) {
      return NextResponse.json(
        { error: 'Minimum withdrawal amount is NPR 50.' },
        { status: 400 }
      );
    }

    const validMethods = ['ESEWA', 'KHALTI', 'BANK_TRANSFER'];
    if (!method || !validMethods.includes(method)) {
      return NextResponse.json(
        { error: 'Invalid withdrawal method selected. Choose eSewa, Khalti, or Bank Transfer.' },
        { status: 400 }
      );
    }

    if (!accountName || !accountName.trim()) {
      return NextResponse.json({ error: 'Account holder name is required.' }, { status: 400 });
    }

    if (!accountNumber || !accountNumber.trim()) {
      return NextResponse.json({ error: 'Account / Phone number is required.' }, { status: 400 });
    }

    if (method === 'BANK_TRANSFER' && (!bankName || !bankName.trim())) {
      return NextResponse.json({ error: 'Bank name is required for bank transfers.' }, { status: 400 });
    }

    // Check duplicate pending request
    const existingPending = await db.withdrawalRequest.findFirst({
      where: {
        userId: userSession.id,
        status: 'PENDING',
      },
    });

    if (existingPending) {
      return NextResponse.json(
        { error: 'You already have a pending withdrawal request. Please wait for admin processing before submitting another request.' },
        { status: 400 }
      );
    }

    // Fetch user wallet
    const wallet = await db.wallet.findUnique({
      where: { userId: userSession.id },
    });

    if (!wallet) {
      return NextResponse.json({ error: 'Wallet not found.' }, { status: 404 });
    }

    const currentWinnings = wallet.winningsBalance ?? 0;
    if (withdrawAmount > currentWinnings) {
      return NextResponse.json(
        {
          error: `Insufficient withdrawable tournament earnings. Your withdrawable balance is NPR ${currentWinnings.toLocaleString()}, but you requested NPR ${withdrawAmount.toLocaleString()}.`,
        },
        { status: 400 }
      );
    }

    // Generate Request ID e.g. KS-WTH-84912
    const randomNum = Math.floor(10000 + Math.random() * 90000);
    const requestId = `KS-WTH-${randomNum}`;
    const fee = 0; // Configurable fee (NPR 0 default)
    const netAmount = withdrawAmount - fee;

    // Execute atomic transaction: Reserve earnings and create WithdrawalRequest
    const result = await db.$transaction(
      async (tx) => {
        const newWinningsBal = currentWinnings - withdrawAmount;
        const newTotalBal = (wallet.depositBalance ?? 0) + newWinningsBal;

        // 1. Reserve/Deduct from wallet winnings balance
        await tx.wallet.update({
          where: { id: wallet.id },
          data: {
            winningsBalance: newWinningsBal,
            balance: newTotalBal,
          },
        });

        // 2. Create WithdrawalRequest record
        const withdrawalRequest = await tx.withdrawalRequest.create({
          data: {
            requestId,
            userId: userSession.id,
            amount: withdrawAmount,
            method,
            accountName: accountName.trim(),
            accountNumber: accountNumber.trim(),
            bankName: bankName ? bankName.trim() : null,
            fee,
            netAmount,
            status: 'PENDING',
          },
        });

        return withdrawalRequest;
      },
      {
        timeout: 20000,
        maxWait: 10000,
      }
    );

    // 3. Create Notification
    try {
      await notifyWithdrawalRequested(userSession.id, withdrawAmount, requestId);
    } catch (e) {
      console.error('Notification error:', e);
    }

    return NextResponse.json({
      success: true,
      message: 'Withdrawal request submitted successfully.',
      withdrawalRequest: result,
    });
  } catch (error: any) {
    console.error('Withdrawal error:', error);
    return NextResponse.json({ error: error.message || 'Failed to submit withdrawal request' }, { status: 500 });
  }
}
