import { NextResponse } from 'next/server';
import { getCurrentAdmin, getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { notifyWithdrawalApproved } from '@/lib/notifications';

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

        // 1. Mark status as APPROVED
        const updatedWithdrawal = await tx.withdrawalRequest.update({
          where: { id },
          data: {
            status: 'APPROVED',
            processedBy: admin.id,
            processedAt: new Date(),
          },
        });

        // 2. Fetch user wallet
        let wallet = await tx.wallet.findUnique({
          where: { userId: withdrawalRequest.userId },
        });

        if (!wallet) {
          wallet = await tx.wallet.create({
            data: { userId: withdrawalRequest.userId, balance: 0 },
          });
        }

        const balanceBefore = wallet.balance + withdrawalRequest.amount;
        const balanceAfter = wallet.balance;

        // 3. Log WalletTransaction
        await tx.walletTransaction.create({
          data: {
            walletId: wallet.id,
            userId: withdrawalRequest.userId,
            type: 'WITHDRAWAL',
            amount: -withdrawalRequest.amount,
            balanceBefore,
            balanceAfter,
            description: `Withdrawal Approved via ${withdrawalRequest.method} (${withdrawalRequest.requestId})`,
            referenceId: withdrawalRequest.requestId,
          },
        });

        return { updatedWithdrawal, withdrawalRequest };
      },
      {
        timeout: 20000,
        maxWait: 10000,
      }
    );

    // 4. Send notification to user outside transaction
    try {
      await notifyWithdrawalApproved(
        result.withdrawalRequest.userId,
        result.withdrawalRequest.amount,
        result.withdrawalRequest.requestId
      );
    } catch (nErr) {
      console.error('Failed to dispatch withdrawal approval notification:', nErr);
    }

    return NextResponse.json({
      success: true,
      message: 'Withdrawal request approved successfully.',
      withdrawal: result.updatedWithdrawal,
    });
  } catch (error: any) {
    console.error('Approve withdrawal error:', error);
    return NextResponse.json({ error: error.message || 'Failed to approve withdrawal' }, { status: 400 });
  }
}
