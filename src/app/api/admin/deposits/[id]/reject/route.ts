import { NextResponse } from 'next/server';
import { getCurrentAdmin, getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { notifyDepositRejected } from '@/lib/notifications';

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

    const depositRequest = await db.depositRequest.findUnique({
      where: { id },
    });

    if (!depositRequest) {
      return NextResponse.json({ error: 'Deposit request not found.' }, { status: 404 });
    }

    if (depositRequest.status !== 'PENDING') {
      return NextResponse.json({ error: `Deposit request is already ${depositRequest.status}.` }, { status: 400 });
    }

    const updatedDeposit = await db.depositRequest.update({
      where: { id },
      data: {
        status: 'REJECTED',
        rejectionReason: rejectionReason ? rejectionReason.trim() : 'Payment verification failed.',
        verifiedBy: admin.id,
        verifiedAt: new Date(),
      },
    });

    // Notify user
    await notifyDepositRejected(
      depositRequest.userId,
      depositRequest.amount,
      depositRequest.requestId,
      updatedDeposit.rejectionReason || undefined
    );

    return NextResponse.json({
      success: true,
      message: 'Deposit request rejected successfully.',
      deposit: updatedDeposit,
    });
  } catch (error) {
    console.error('Deposit rejection error:', error);
    return NextResponse.json({ error: 'Failed to reject deposit request' }, { status: 500 });
  }
}
