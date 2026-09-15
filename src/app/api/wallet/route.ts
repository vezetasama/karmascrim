import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const userSession = await getCurrentUser();
    if (!userSession) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Upsert or fetch user wallet
    let wallet = await db.wallet.findUnique({
      where: { userId: userSession.id },
      include: {
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!wallet) {
      wallet = await db.wallet.create({
        data: {
          userId: userSession.id,
          balance: 0,
        },
        include: {
          transactions: true,
        },
      });
    }

    // Fetch user deposit requests
    const depositRequests = await db.depositRequest.findMany({
      where: { userId: userSession.id },
      include: { paymentMethod: true },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    // Fetch user withdrawal requests
    const withdrawalRequests = await db.withdrawalRequest.findMany({
      where: { userId: userSession.id },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return NextResponse.json({
      wallet,
      balance: wallet.balance,
      depositBalance: wallet.depositBalance,
      winningsBalance: wallet.winningsBalance,
      transactions: wallet.transactions,
      depositRequests,
      withdrawalRequests,
    });
  } catch (error) {
    console.error('Error fetching user wallet:', error);
    return NextResponse.json({ error: 'Failed to fetch wallet information' }, { status: 500 });
  }
}
