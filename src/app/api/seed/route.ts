import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function GET() {
  try {
    const adminPassword = await bcrypt.hash('admin123', 10);
    const playerPassword = await bcrypt.hash('player123', 10);

    // 1. Admin User
    const admin = await db.user.upsert({
      where: { email: 'admin@karmascrims.com' },
      update: {},
      create: {
        name: 'Admin Karma Scrims',
        username: 'admin',
        email: 'admin@karmascrims.com',
        passwordHash: adminPassword,
        phone: '9800000000',
        freeFireUid: '1000000001',
        freeFireName: 'KARMA_ADMIN',
        role: 'ADMIN',
        status: 'ACTIVE',
      },
    });

    // 2. Demo Player
    const player = await db.user.upsert({
      where: { email: 'player@karmascrims.com' },
      update: {},
      create: {
        name: 'Rohan Sharma',
        username: 'pro_player1',
        email: 'player@karmascrims.com',
        passwordHash: playerPassword,
        phone: '9841234567',
        freeFireUid: '2847102941',
        freeFireName: 'KRM_STRIKER',
        role: 'USER',
        status: 'ACTIVE',
      },
    });

    // Admin Wallet
    await db.wallet.upsert({
      where: { userId: admin.id },
      update: {},
      create: {
        userId: admin.id,
        balance: 10000,
      },
    });

    // Player Wallet
    await db.wallet.upsert({
      where: { userId: player.id },
      update: {},
      create: {
        userId: player.id,
        balance: 500,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Database seeded successfully! You can now log in.',
      adminCredentials: {
        email: 'admin@karmascrims.com',
        username: 'admin',
        password: 'admin123',
      },
      playerCredentials: {
        email: 'player@karmascrims.com',
        username: 'pro_player1',
        password: 'player123',
      },
    });
  } catch (error: any) {
    console.error('API Seed Error:', error);
    return NextResponse.json(
      { error: 'Failed to seed database', details: error?.message },
      { status: 500 }
    );
  }
}
