import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const userSession = await getCurrentUser();
    if (!userSession || userSession.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized admin access required' }, { status: 403 });
    }

    const { resultId } = await request.json();

    if (!resultId) {
      return NextResponse.json({ error: 'Result ID is required' }, { status: 400 });
    }

    const result = await db.matchResult.findUnique({
      where: { id: resultId },
      include: {
        match: {
          include: {
            tournament: true,
          },
        },
        team: {
          include: {
            captain: true,
          },
        },
        user: true,
      },
    });

    if (!result) {
      return NextResponse.json({ error: 'Match result not found' }, { status: 404 });
    }

    if (result.payoutStatus === 'PAID') {
      return NextResponse.json({ error: 'Winnings for this result have already been paid out' }, { status: 400 });
    }

    const winningAmount = Number(result.winningAmount || 0);
    if (winningAmount <= 0) {
      return NextResponse.json({ error: 'Winning amount is 0 COINS. No payout required.' }, { status: 400 });
    }

    // Determine target user to receive wallet prize
    // For Solo: target user is result.userId (or result.user.id)
    // For Squad: target user is team captain (result.team.captainId)
    let recipientUserId = result.userId;
    let recipientName = result.user?.name || result.user?.username || 'Player';

    if (result.match.tournament.type === 'SQUAD') {
      if (!result.team || !result.team.captainId) {
        return NextResponse.json({ error: 'Squad captain not found for payout' }, { status: 400 });
      }
      recipientUserId = result.team.captainId;
      recipientName = `Captain of ${result.team.name}`;
    }

    if (!recipientUserId) {
      return NextResponse.json({ error: 'No valid recipient found for prize credit' }, { status: 400 });
    }

    // Execute atomic transaction for wallet credit
    await db.$transaction(async (tx) => {
      let wallet = await tx.wallet.findUnique({ where: { userId: recipientUserId } });
      if (!wallet) {
        wallet = await tx.wallet.create({
          data: { userId: recipientUserId, balance: 0, winningsBalance: 0 },
        });
      }

      const balanceBefore = wallet.balance;
      const balanceAfter = balanceBefore + winningAmount;

      // Update wallet balance & winningsBalance
      await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          balance: balanceAfter,
          winningsBalance: (wallet.winningsBalance || 0) + winningAmount,
        },
      });

      // Create Wallet Transaction
      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          userId: recipientUserId,
          type: 'PRIZE',
          amount: winningAmount,
          balanceBefore,
          balanceAfter,
          description: result.match.tournament.type === 'SOLO'
            ? `Tournament Prize: Rank #${result.placement} in ${result.match.tournament.name}`
            : `Squad Tournament Prize: Rank #${result.placement} for ${result.team?.name || 'Squad'} in ${result.match.tournament.name}`,
          referenceId: result.match.tournament.id,
        },
      });

      // Update MatchResult payoutStatus to PAID
      await tx.matchResult.update({
        where: { id: resultId },
        data: {
          payoutStatus: 'PAID',
        },
      });

      // Send notification to recipient
      await tx.notification.create({
        data: {
          userId: recipientUserId,
          title: `🏆 Prize Winnings Credited: 🪙 ${winningAmount.toLocaleString()} COINS`,
          message: `Congratulations! Your prize of ${winningAmount.toLocaleString()} COINS for ${result.match.tournament.name} has been credited to your Karma Scrims wallet.`,
          linkUrl: '/wallet',
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: `🪙 ${winningAmount.toLocaleString()} COINS successfully credited to ${recipientName}'s wallet!`,
    });
  } catch (error) {
    console.error('Approve prize payout error:', error);
    return NextResponse.json({ error: 'Failed to approve prize payout' }, { status: 500 });
  }
}
