import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { notifyTournamentJoined } from '@/lib/notifications';

export async function GET(request: Request) {
  try {
    const userSession = await getCurrentUser();
    if (!userSession) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const tournamentId = searchParams.get('tournamentId');

    const where: any = {};
    if (userSession.role !== 'ADMIN') {
      where.userId = userSession.id;
    }
    if (tournamentId) {
      where.tournamentId = tournamentId;
    }

    const registrations = await db.registration.findMany({
      where,
      include: {
        tournament: true,
        team: {
          include: {
            members: true,
          },
        },
        user: {
          select: { id: true, name: true, username: true, email: true, phone: true },
        },
        payment: {
          include: {
            paymentMethod: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ registrations });
  } catch (error) {
    console.error('Fetch registrations error:', error);
    return NextResponse.json({ error: 'Failed to fetch registrations' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const userSession = await getCurrentUser();
    if (!userSession) {
      return NextResponse.json({ error: 'Please login to register for tournaments.' }, { status: 401 });
    }

    const { tournamentId, teamId } = await request.json();

    if (!tournamentId) {
      return NextResponse.json({ error: 'Tournament ID is required' }, { status: 400 });
    }

    const tournament = await db.tournament.findUnique({
      where: { id: tournamentId },
      include: {
        registrations: true,
      },
    });

    if (!tournament) {
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
    }

    if (tournament.status !== 'REGISTRATION_OPEN') {
      return NextResponse.json({ error: `Registration is currently closed for this tournament (${tournament.status}).` }, { status: 400 });
    }

    if (tournament.registeredSlots >= tournament.totalSlots) {
      return NextResponse.json({ error: 'This tournament is full! No slots remaining.' }, { status: 400 });
    }

    // Check duplicate registration
    const existingRegistration = await db.registration.findFirst({
      where: {
        tournamentId,
        OR: [
          { userId: userSession.id },
          ...(teamId ? [{ teamId }] : []),
        ],
      },
    });

    if (existingRegistration) {
      return NextResponse.json(
        { error: 'You or your squad are already registered for this tournament.' },
        { status: 400 }
      );
    }

    const registrationId = 'KS-REG-' + Math.floor(1000 + Math.random() * 9000).toString() + '-' + Date.now().toString().slice(-4);
    const entryFee = tournament.entryFee;

    // Check user wallet balance if entry fee applies
    if (entryFee > 0) {
      let wallet = await db.wallet.findUnique({ where: { userId: userSession.id } });
      if (!wallet) {
        wallet = await db.wallet.create({
          data: { userId: userSession.id, balance: 0 },
        });
      }

      if (wallet.balance < entryFee) {
        return NextResponse.json(
          {
            error: `Insufficient wallet balance. Entry fee is 🪙 ${entryFee} COIN, but your wallet balance is 🪙 ${wallet.balance} COIN.`,
            code: 'INSUFFICIENT_BALANCE',
            balance: wallet.balance,
            entryFee,
            addMoneyUrl: '/wallet/add-money',
          },
          { status: 400 }
        );
      }
    }

    // Execute registration and atomic wallet deduction in a database transaction
    const result = await db.$transaction(
      async (tx) => {
        const isFree = entryFee === 0;

        // Calculate slot number for SOLO tournaments
        let slotNumber: number | null = null;
        if (tournament.type === 'SOLO') {
          const existingCount = await tx.registration.count({
            where: { tournamentId },
          });
          slotNumber = existingCount + 1;
        }

        // 1. Create registration record
        const registration = await tx.registration.create({
          data: {
            registrationId,
            tournamentId,
            teamId: teamId || null,
            userId: userSession.id,
            status: 'CONFIRMED',
            paymentStatus: 'VERIFIED',
            slotNumber,
          },
          include: {
            tournament: true,
            team: true,
          },
        });

        // 2. Increment registered slots
        await tx.tournament.update({
          where: { id: tournamentId },
          data: { registeredSlots: { increment: 1 } },
        });

        // 3. Deduct entry fee from wallet if entry fee > 0
        if (entryFee > 0) {
          const wallet = await tx.wallet.findUnique({ where: { userId: userSession.id } });
          if (!wallet || wallet.balance < entryFee) {
            throw new Error('Insufficient wallet balance to register.');
          }

          const balanceBefore = wallet.balance;
          let remFee = entryFee;
          let newDepositBal = wallet.depositBalance ?? 0;
          let newWinningsBal = wallet.winningsBalance ?? 0;

          if (newDepositBal >= remFee) {
            newDepositBal -= remFee;
            remFee = 0;
          } else {
            remFee -= newDepositBal;
            newDepositBal = 0;
            newWinningsBal = Math.max(0, newWinningsBal - remFee);
          }

          const balanceAfter = newDepositBal + newWinningsBal;

          await tx.wallet.update({
            where: { id: wallet.id },
            data: {
              depositBalance: newDepositBal,
              winningsBalance: newWinningsBal,
              balance: balanceAfter,
            },
          });

          await tx.walletTransaction.create({
            data: {
              walletId: wallet.id,
              userId: userSession.id,
              type: 'ENTRY_FEE',
              amount: -entryFee,
              balanceBefore,
              balanceAfter,
              description: `Tournament Entry Fee: ${tournament.name}`,
              referenceId: registrationId,
            },
          });
        }

        return registration;
      },
      {
        timeout: 20000,
        maxWait: 10000,
      }
    );

    // 4. Send notification outside the transaction block
    try {
      await notifyTournamentJoined(userSession.id, tournament.name, tournament.id);
    } catch (e) {
      console.error('Notification dispatch error:', e);
    }

    return NextResponse.json({ success: true, registration: result });
  } catch (error: any) {
    console.error('Registration creation error:', error);
    return NextResponse.json({ error: error.message || 'Failed to process registration' }, { status: 500 });
  }
}

