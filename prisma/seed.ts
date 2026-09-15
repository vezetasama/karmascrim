import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Karma Scrims database...');

  // 1. Password hash
  const adminPassword = await bcrypt.hash('admin123', 10);
  const playerPassword = await bcrypt.hash('player123', 10);

  // 2. Admin User
  const admin = await prisma.user.upsert({
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

  // 3. Demo Players
  const player1 = await prisma.user.upsert({
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

  const player2 = await prisma.user.upsert({
    where: { email: 'falcon@karmascrims.com' },
    update: {},
    create: {
      name: 'Aayush Shrestha',
      username: 'falcon_99',
      email: 'falcon@karmascrims.com',
      passwordHash: playerPassword,
      phone: '9812345678',
      freeFireUid: '2847102942',
      freeFireName: 'KRM_FALCON',
      role: 'USER',
      status: 'ACTIVE',
    },
  });

  const player3 = await prisma.user.upsert({
    where: { email: 'shadow@karmascrims.com' },
    update: {},
    create: {
      name: 'Bishal Gurung',
      username: 'shadow_sniper',
      email: 'shadow@karmascrims.com',
      passwordHash: playerPassword,
      phone: '9823456789',
      freeFireUid: '2847102943',
      freeFireName: 'KRM_SHADOW',
      role: 'USER',
      status: 'ACTIVE',
    },
  });

  const player4 = await prisma.user.upsert({
    where: { email: 'blaze@karmascrims.com' },
    update: {},
    create: {
      name: 'Kiran Thapa',
      username: 'blaze_rusher',
      email: 'blaze@karmascrims.com',
      passwordHash: playerPassword,
      phone: '9834567890',
      freeFireUid: '2847102944',
      freeFireName: 'KRM_BLAZE',
      role: 'USER',
      status: 'ACTIVE',
    },
  });

  // 4. Payment Method: Fonepay
  const fonepay = await prisma.paymentMethod.upsert({
    where: { id: 'fonepay-default-id' },
    update: {},
    create: {
      id: 'fonepay-default-id',
      name: 'Fonepay QR / Direct Merchant',
      type: 'FONEPAY',
      accountName: 'KARMA SCRIMS ESPORTS',
      accountNumber: '9841234567',
      merchantDetails: 'Fonepay Merchant Code: FONEPAY-KARMA-99',
      instructions: '1. Open Mobile Banking or eSewa/Khalti app.\n2. Scan Fonepay QR or transfer to 9841234567.\n3. Enter exact entry fee amount.\n4. Take screenshot & note Transaction ID.\n5. Submit details below.',
      qrImageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&q=80',
      enabled: true,
      sortOrder: 1,
    },
  });

  // 5. Tournaments
  const today = new Date().toISOString().split('T')[0];

  const t1 = await prisma.tournament.upsert({
    where: { slug: 'full-map-10am-daily' },
    update: { maps: JSON.stringify(['Bermuda', 'Purgatory', 'Kalahari']) },
    create: {
      name: 'Full Map — 10:00 AM Morning Scrim',
      slug: 'full-map-10am-daily',
      category: 'FULL_MAP',
      format: 'Squad',
      description: 'Daily competitive Free Fire Full Map Squad Scrim. Battle against the top teams in Nepal.',
      rules: '1. All players must join room 10 mins before start time.\n2. Emote flex or hacking results in permanent ban.\n3. Squad must consist of 4 registered players.',
      date: today,
      startTime: '10:00 AM',
      registrationDeadline: '09:45 AM',
      entryFee: 100,
      prizePool: 2000,
      totalSlots: 48,
      registeredSlots: 12,
      status: 'REGISTRATION_OPEN',
      maps: JSON.stringify(['Bermuda', 'Purgatory', 'Kalahari']),
      bannerUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&q=80',
      roomId: '948201',
      roomPassword: '777',
      roomReleased: true,
    },
  });

  const t2 = await prisma.tournament.upsert({
    where: { slug: 'full-map-1pm-afternoon' },
    update: { maps: JSON.stringify(['Bermuda', 'Purgatory']) },
    create: {
      name: 'Full Map — 1:00 PM Afternoon Battle',
      slug: 'full-map-1pm-afternoon',
      category: 'FULL_MAP',
      format: 'Squad',
      description: 'Midday high-intensity squad scrim with NPR 3,000 guaranteed prize pool.',
      rules: '1. No double Vector or gun hacks allowed.\n2. Screenshots required for kill points proof.',
      date: today,
      startTime: '1:00 PM',
      registrationDeadline: '12:45 PM',
      entryFee: 150,
      prizePool: 3000,
      totalSlots: 48,
      registeredSlots: 48,
      status: 'REGISTRATION_CLOSED',
      maps: JSON.stringify(['Bermuda', 'Purgatory']),
      bannerUrl: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=800&q=80',
      roomId: '839210',
      roomPassword: '999',
      roomReleased: false,
    },
  });

  const t3 = await prisma.tournament.upsert({
    where: { slug: 'full-map-7pm-prime' },
    update: { maps: JSON.stringify(['Bermuda', 'Purgatory', 'Kalahari']) },
    create: {
      name: 'Full Map — 7:00 PM Evening Grand Championship',
      slug: 'full-map-7pm-prime',
      category: 'FULL_MAP',
      format: 'Squad',
      description: 'The main prime-time event of the day. High stakes, NPR 5,000 prize pool!',
      rules: '1. Official match lobby rules apply.\n2. Room details released 15 minutes before 7:00 PM.',
      date: today,
      startTime: '7:00 PM',
      registrationDeadline: '06:30 PM',
      entryFee: 200,
      prizePool: 5000,
      totalSlots: 48,
      registeredSlots: 24,
      status: 'REGISTRATION_OPEN',
      maps: JSON.stringify(['Bermuda', 'Purgatory', 'Kalahari']),
      bannerUrl: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&q=80',
    },
  });

  const t4 = await prisma.tournament.upsert({
    where: { slug: 'clash-squad-1v1-duels' },
    update: { maps: JSON.stringify(['Bermuda']) },
    create: {
      name: 'Clash Squad — 1v1 Solo Kings',
      slug: 'clash-squad-1v1-duels',
      category: 'CLASH_SQUAD',
      format: '1v1',
      description: 'Single elimination 1v1 Clash Squad duel. Headshot supremacy!',
      rules: '1. Desert Eagle & M1887 round only.\n2. Limited ammo: ON.',
      date: today,
      startTime: '5:00 PM',
      registrationDeadline: '04:30 PM',
      entryFee: 50,
      prizePool: 800,
      totalSlots: 16,
      registeredSlots: 8,
      status: 'REGISTRATION_OPEN',
      maps: JSON.stringify(['Bermuda']),
      bannerUrl: 'https://images.unsplash.com/photo-1560253023-3ec5d502959f?w=800&q=80',
    },
  });

  const t5 = await prisma.tournament.upsert({
    where: { slug: 'clash-squad-4v4-elite' },
    update: { maps: JSON.stringify(['Bermuda', 'Kalahari']) },
    create: {
      name: 'Clash Squad — 4v4 Elite Showdown',
      slug: 'clash-squad-4v4-elite',
      category: 'CLASH_SQUAD',
      format: '4v4',
      description: 'Fast-paced 4v4 Clash Squad series. Best of 7 rounds per match.',
      rules: '1. Standard 7-round competitive setting.\n2. Character skills enabled.',
      date: today,
      startTime: '8:30 PM',
      registrationDeadline: '08:00 PM',
      entryFee: 200,
      prizePool: 3500,
      totalSlots: 8,
      registeredSlots: 4,
      status: 'REGISTRATION_OPEN',
      maps: JSON.stringify(['Bermuda', 'Kalahari']),
      bannerUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&q=80',
    },
  });

  // 6. Demo Teams (upsert check)
  let squadKarma = await prisma.team.findFirst({ where: { name: 'KARMA LEGENDS' } });
  if (!squadKarma) {
    squadKarma = await prisma.team.create({
      data: {
        name: 'KARMA LEGENDS',
        category: 'FULL_MAP',
        captainId: player1.id,
        members: {
          create: [
            { userId: player1.id, freeFireUid: player1.freeFireUid!, freeFireName: player1.freeFireName!, role: 'CAPTAIN' },
            { userId: player2.id, freeFireUid: player2.freeFireUid!, freeFireName: player2.freeFireName!, role: 'MEMBER' },
            { userId: player3.id, freeFireUid: player3.freeFireUid!, freeFireName: player3.freeFireName!, role: 'MEMBER' },
            { userId: player4.id, freeFireUid: player4.freeFireUid!, freeFireName: player4.freeFireName!, role: 'MEMBER' },
          ],
        },
      },
    });
  }

  let squadApex = await prisma.team.findFirst({ where: { name: 'NEPAL APEX' } });
  if (!squadApex) {
    squadApex = await prisma.team.create({
      data: {
        name: 'NEPAL APEX',
        category: 'FULL_MAP',
        captainId: player2.id,
        members: {
          create: [
            { userId: player2.id, freeFireUid: player2.freeFireUid!, freeFireName: player2.freeFireName!, role: 'CAPTAIN' },
            { freeFireUid: '994820194', freeFireName: 'APEX_ROX', role: 'MEMBER' },
            { freeFireUid: '994820195', freeFireName: 'APEX_VIPER', role: 'MEMBER' },
            { freeFireUid: '994820196', freeFireName: 'APEX_TITAN', role: 'MEMBER' },
          ],
        },
      },
    });
  }

  // 7. Registrations & Payments
  await prisma.registration.upsert({
    where: { registrationId: 'KS-REG-1001' },
    update: {},
    create: {
      registrationId: 'KS-REG-1001',
      tournamentId: t1.id,
      teamId: squadKarma.id,
      userId: player1.id,
      status: 'CONFIRMED',
      paymentStatus: 'VERIFIED',
      payment: {
        create: {
          paymentMethodId: fonepay.id,
          amount: 100,
          transactionId: 'FP-9823019482',
          screenshotUrl: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=500&q=80',
          note: 'Paid via eSewa Fonepay QR',
          status: 'APPROVED',
          verifiedBy: admin.id,
          verifiedAt: new Date(),
        },
      },
    },
  });

  await prisma.registration.upsert({
    where: { registrationId: 'KS-REG-1002' },
    update: {},
    create: {
      registrationId: 'KS-REG-1002',
      tournamentId: t3.id,
      teamId: squadApex.id,
      userId: player2.id,
      status: 'PAYMENT_SUBMITTED',
      paymentStatus: 'SUBMITTED',
      payment: {
        create: {
          paymentMethodId: fonepay.id,
          amount: 200,
          transactionId: 'FP-1092837492',
          screenshotUrl: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=500&q=80',
          note: 'Submitted via Mobile Banking Fonepay',
          status: 'PENDING',
        },
      },
    },
  });


  // 8. Notifications
  await prisma.notification.createMany({
    data: [
      {
        userId: player1.id,
        title: 'Registration Confirmed & Room Released!',
        message: 'Your squad KARMA LEGENDS has been confirmed for Full Map 10:00 AM. Room ID: 948201, Pass: 777.',
        read: false,
        linkUrl: '/dashboard',
      },
      {
        userId: player2.id,
        title: 'Payment Submitted',
        message: 'Your payment of NPR 200 for 7:00 PM Evening Grand Championship is under review by admin.',
        read: true,
        linkUrl: '/dashboard',
      },
    ],
  });

  // 9. Banners
  await prisma.banner.deleteMany({});
  await prisma.banner.create({
    data: {
      title: 'NEPAL\'S ULTIMATE FREE FIRE SCRIMS',
      subtitle: 'Compete in Daily Full Map & Clash Squad Battles. Win Cash Prizes via Fonepay!',
      buttonText: 'JOIN SCRIMS NOW',
      buttonLink: '/tournaments',
      imageUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1600&q=80',
      isActive: true,
      sortOrder: 1,
    },
  });

  // 10. User Wallets
  const allUsers = [admin, player1, player2, player3, player4];
  for (const u of allUsers) {
    await prisma.wallet.upsert({
      where: { userId: u.id },
      update: {},
      create: {
        userId: u.id,
        balance: u.role === 'ADMIN' ? 10000 : 500, // Demo starting balance
      },
    });
  }

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

