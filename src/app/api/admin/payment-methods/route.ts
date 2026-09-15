import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('active') === 'true';

    const where = activeOnly ? { enabled: true } : {};

    const paymentMethods = await db.paymentMethod.findMany({
      where,
      orderBy: { sortOrder: 'asc' },
    });

    return NextResponse.json({ paymentMethods });
  } catch (error) {
    console.error('Fetch payment methods error:', error);
    return NextResponse.json({ error: 'Failed to fetch payment methods' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const userSession = await getCurrentUser();
    if (!userSession || userSession.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized admin access required' }, { status: 403 });
    }

    const { name, type, accountName, accountNumber, merchantDetails, instructions, qrImageUrl, enabled, sortOrder } =
      await request.json();

    if (!name || !accountName || !accountNumber) {
      return NextResponse.json({ error: 'Name, Account Name, and Account Number are required' }, { status: 400 });
    }

    const paymentMethod = await db.paymentMethod.create({
      data: {
        name,
        type: type || 'FONEPAY',
        accountName,
        accountNumber,
        merchantDetails: merchantDetails || null,
        instructions: instructions || null,
        qrImageUrl: qrImageUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&q=80',
        enabled: enabled !== undefined ? enabled : true,
        sortOrder: sortOrder ? Number(sortOrder) : 0,
      },
    });

    return NextResponse.json({ success: true, paymentMethod });
  } catch (error) {
    console.error('Create payment method error:', error);
    return NextResponse.json({ error: 'Failed to create payment method' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const userSession = await getCurrentUser();
    if (!userSession || userSession.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized admin access required' }, { status: 403 });
    }

    const { id, name, type, accountName, accountNumber, merchantDetails, instructions, qrImageUrl, enabled, sortOrder } =
      await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Payment method ID required' }, { status: 400 });
    }

    const paymentMethod = await db.paymentMethod.update({
      where: { id },
      data: {
        name: name !== undefined ? name : undefined,
        type: type !== undefined ? type : undefined,
        accountName: accountName !== undefined ? accountName : undefined,
        accountNumber: accountNumber !== undefined ? accountNumber : undefined,
        merchantDetails: merchantDetails !== undefined ? merchantDetails : undefined,
        instructions: instructions !== undefined ? instructions : undefined,
        qrImageUrl: qrImageUrl !== undefined ? qrImageUrl : undefined,
        enabled: enabled !== undefined ? enabled : undefined,
        sortOrder: sortOrder !== undefined ? Number(sortOrder) : undefined,
      },
    });

    return NextResponse.json({ success: true, paymentMethod });
  } catch (error) {
    console.error('Update payment method error:', error);
    return NextResponse.json({ error: 'Failed to update payment method' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const userSession = await getCurrentUser();
    if (!userSession || userSession.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Payment method ID required' }, { status: 400 });
    }

    await db.paymentMethod.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Payment method deleted successfully' });
  } catch (error) {
    console.error('Delete payment method error:', error);
    return NextResponse.json({ error: 'Failed to delete payment method' }, { status: 500 });
  }
}
