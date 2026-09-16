import { NextResponse } from 'next/server';
import { getCurrentAdmin, getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { notifyWithdrawalRejected } from '@/lib/notifications';

async function checkAdminAuth() {
  const adminSession = await getCurrentAdmin();
  if (adminSession) return adminSession;

  const userSession = await getCurrentUser();
  if (userSession && userSession.role === 'ADMIN') return userSession;

  return null;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await checkAdminAuth();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { rejectionReason } = await request.json();

    const result = await db.$transaction(
      async (tx) => {
        const withdrawalRequest = await tx.withdrawalRequest.findUnique({
          where: { id },
          include: { user: true },
        });

        if (!withdrawalRequest) {
          throw new Error('Withdrawal request not found.');
        }

        if (withdrawalRequest.status !== 'PENDING') {
          throw new Error(`Withdrawal request is already ${withdrawalRequest.status}.`);
        }

        // 1. Mark status as REJECTED
        const updatedWithdrawal = await tx.withdrawalRequest.update({
          where: { id },
          data: {
            status: 'REJECTED',
            rejectionReason: rejectionReason ? rejectionReason.trim() : 'Request rejected by admin.',
            processedBy: admin.id,
            processedAt: new Date(),
          },
        });

        // 2. Fetch user wallet and restore winningsBalance & total balance
        let wallet = await tx.wallet.findUnique({
          where: { userId: withdrawalRequest.userId },
        });

        if (!wallet) {
          wallet = await tx.wallet.create({
            data: { userId: withdrawalRequest.userId, balance: 0 },
          });
        }

        const restoredWinnings = (wallet.winningsBalance ?? 0) + withdrawalRequest.amount;
        const restoredTotal = (wallet.depositBalance ?? 0) + restoredWinnings;

        await tx.wallet.update({
          where: { id: wallet.id },
          data: {
            winningsBalance: restoredWinnings,
            balance: restoredTotal,
          },
        });

        return { updatedWithdrawal, withdrawalRequest };
      },
      {
        timeout: 20000,
        maxWait: 10000,
      }
    );

    // 3. Send notification to user outside transaction
    try {
      await notifyWithdrawalRejected(
        result.withdrawalRequest.userId,
        result.withdrawalRequest.amount,
        result.withdrawalRequest.requestId,
        rejectionReason ? rejectionReason.trim() : undefined
      );
    } catch (nErr) {
      console.error('Failed to dispatch withdrawal rejection notification:', nErr);
    }

    return NextResponse.json({
      success: true,
      message: 'Withdrawal request rejected and funds returned to user wallet.',
      withdrawal: result.updatedWithdrawal,
    });
  } catch (error: any) {
    console.error('Reject withdrawal error:', error);
    return NextResponse.json({ error: error.message || 'Failed to reject withdrawal' }, { status: 400 });
  }
}
