import { NextResponse } from 'next/server';
import { getCurrentAdmin, getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { notifyWalletAdjusted } from '@/lib/notifications';

async function checkAdminAuth() {
  const adminSession = await getCurrentAdmin();
  if (adminSession) return adminSession;

  const userSession = await getCurrentUser();
  if (userSession && userSession.role === 'ADMIN') return userSession;

  return null;
}

export async function POST(request: Request) {
  try {
    const admin = await checkAdminAuth();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId, amount, reason } = await request.json();

    const adjustAmount = Number(amount);
    if (!userId || isNaN(adjustAmount) || adjustAmount === 0) {
      return NextResponse.json({ error: 'Valid User ID and non-zero adjustment amount are required.' }, { status: 400 });
    }

    if (!reason || typeof reason !== 'string' || !reason.trim()) {
      return NextResponse.json({ error: 'A mandatory audit reason is required for manual balance adjustments.' }, { status: 400 });
    }

    const targetUser = await db.user.findUnique({ where: { id: userId } });
    if (!targetUser) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    const result = await db.$transaction(
      async (tx) => {
        let wallet = await tx.wallet.findUnique({ where: { userId } });
        if (!wallet) {
          wallet = await tx.wallet.create({
            data: { userId, balance: 0 },
          });
        }

        const balanceBefore = wallet.balance;
        const balanceAfter = balanceBefore + adjustAmount;

        if (balanceAfter < 0) {
          throw new Error(`Adjustment would result in negative wallet balance (Current: NPR ${balanceBefore}).`);
        }

        await tx.wallet.update({
          where: { id: wallet.id },
          data: { balance: balanceAfter },
        });

        const txRecord = await tx.walletTransaction.create({
          data: {
            walletId: wallet.id,
            userId,
            type: 'MANUAL_ADJUSTMENT',
            amount: adjustAmount,
            balanceBefore,
            balanceAfter,
            description: `Admin Manual Adjustment: ${reason.trim()} (By: ${admin.name || admin.username})`,
            referenceId: `ADMIN-${admin.id}`,
          },
        });

        return { wallet, balanceAfter, txRecord };
      },
      {
        timeout: 20000,
        maxWait: 10000,
      }
    );

    try {
      await notifyWalletAdjusted(userId, adjustAmount, result.balanceAfter, reason.trim());
    } catch (nErr) {
      console.error('Failed to dispatch wallet adjustment notification:', nErr);
    }

    return NextResponse.json({
      success: true,
      message: 'Wallet balance adjusted successfully.',
      newBalance: result.balanceAfter,
      transaction: result.txRecord,
    });
  } catch (error: any) {
    console.error('Manual wallet adjustment error:', error);
    return NextResponse.json({ error: error.message || 'Failed to adjust wallet balance' }, { status: 400 });
  }
}
