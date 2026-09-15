import { NextResponse } from 'next/server';
import { getCurrentAdmin, getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { notifyDepositApproved } from '@/lib/notifications';

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

    // Execute atomic transaction for approval
    const result = await db.$transaction(async (tx) => {
      const depositRequest = await tx.depositRequest.findUnique({
        where: { id },
        include: { user: true, paymentMethod: true },
      });

      if (!depositRequest) {
        throw new Error('Deposit request not found.');
      }

      if (depositRequest.status !== 'PENDING') {
        throw new Error(`Deposit request is already ${depositRequest.status}.`);
      }

      // 1. Mark deposit as APPROVED
      const updatedDeposit = await tx.depositRequest.update({
        where: { id },
        data: {
          status: 'APPROVED',
          verifiedBy: admin.id,
          verifiedAt: new Date(),
        },
      });

      // 2. Fetch or create user's wallet
      let wallet = await tx.wallet.findUnique({
        where: { userId: depositRequest.userId },
      });

      if (!wallet) {
        wallet = await tx.wallet.create({
          data: {
            userId: depositRequest.userId,
            balance: 0,
          },
        });
      }

      const newDepositBalance = (wallet.depositBalance ?? 0) + depositRequest.amount;
      const balanceBefore = wallet.balance;
      const balanceAfter = newDepositBalance + (wallet.winningsBalance ?? 0);

      // 3. Update wallet balance
      await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          depositBalance: newDepositBalance,
          balance: balanceAfter,
        },
      });

      // 4. Create WalletTransaction record
      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          userId: depositRequest.userId,
          type: 'DEPOSIT',
          amount: depositRequest.amount,
          balanceBefore,
          balanceAfter,
          description: `Fonepay Deposit Approved (${depositRequest.requestId})`,
          referenceId: depositRequest.requestId,
        },
      });

      // 5. Send notification to user
      await notifyDepositApproved(
        depositRequest.userId,
        depositRequest.amount,
        depositRequest.requestId,
        balanceAfter
      );

      return { updatedDeposit, balanceAfter };
    });

    return NextResponse.json({
      success: true,
      message: 'Deposit request approved and wallet balance updated successfully.',
      deposit: result.updatedDeposit,
      newBalance: result.balanceAfter,
    });
  } catch (error: any) {
    console.error('Deposit approval error:', error);
    return NextResponse.json({ error: error.message || 'Failed to approve deposit' }, { status: 400 });
  }
}
