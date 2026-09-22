import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    const where: any = {};

    if (category && category !== 'ALL') {
      where.category = category;
    }

    if (status && status !== 'ALL') {
      if (status === 'UPCOMING') {
        where.status = { in: ['REGISTRATION_OPEN', 'REGISTRATION_CLOSED', 'DRAFT'] };
      } else if (status === 'LIVE') {
        where.status = 'LIVE';
      } else if (status === 'COMPLETED') {
        where.status = 'COMPLETED';
      } else {
        where.status = status;
      }
    }

    if (search) {
      where.name = { contains: search };
    }

    const tournaments = await db.tournament.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        registrations: {
          select: { id: true, status: true, userId: true },
        },
      },
    });

    return NextResponse.json({ tournaments });
  } catch (error) {
    console.error('Fetch tournaments error:', error);
    return NextResponse.json({ error: 'Failed to fetch tournaments' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const userSession = await getCurrentUser();
    if (!userSession || userSession.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const {
      name,
      category,
      format,
      type,
      description,
      rules,
      whatsappLink,
      date,
      startTime,
      registrationDeadline,
      entryFee,
      prizePool,
      totalSlots,
      bannerUrl,
      status,
      maps,
      roomId,
      roomPassword,
      // Solo Scoring Fields
      soloScoringType,
      soloKillReward,
      soloPlacementRewards,
      // Squad Scoring Fields
      squadKillPoints,
      squadPointTable,
    } = body;

    if (!name || !category || !format || !date || !startTime || entryFee === undefined || prizePool === undefined) {
      return NextResponse.json({ error: 'Missing required tournament fields' }, { status: 400 });
    }

    const tournamentType = 'SOLO';
    const tournamentCategory = 'FULL_MAP';
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') + '-' + Date.now().toString().slice(-4);

    let mapsData = Array.isArray(maps)
      ? JSON.stringify(maps)
      : typeof maps === 'string'
      ? maps
      : null;

    if (!maps || (Array.isArray(maps) && maps.length === 0)) {
      mapsData = JSON.stringify(['Bermuda']);
    }

    let tournamentData: any = {
      name,
      slug,
      category: tournamentCategory,
      format: format || 'Solo',
      type: tournamentType,
      description: description || null,
      rules: rules || null,
      whatsappLink: whatsappLink || null,
      date,
      startTime,
      registrationDeadline: registrationDeadline || `${date} ${startTime}`,
      entryFee: Number(entryFee),
      prizePool: Number(prizePool),
      totalSlots: Number(totalSlots ?? 48),
      registeredSlots: 0,
      maps: mapsData,
      bannerUrl: bannerUrl || null,
      status: status || 'REGISTRATION_OPEN',
      roomId: roomId || null,
      roomPassword: roomPassword || null,
      roomReleased: false,
      soloScoringType: soloScoringType || 'PER_KILL',
      soloKillReward: Number(soloKillReward || 0),
      soloPlacementRewards: typeof soloPlacementRewards === 'object' 
        ? JSON.stringify(soloPlacementRewards) 
        : soloPlacementRewards || null,
      squadKillPoints: null,
      squadPointTable: null,
    };

    const tournament = await db.tournament.create({
      data: tournamentData,
    });

    return NextResponse.json({ success: true, tournament });
  } catch (error) {
    console.error('Create tournament error:', error);
    return NextResponse.json({ error: 'Failed to create tournament' }, { status: 500 });
  }
}
