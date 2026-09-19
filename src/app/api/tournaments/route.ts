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

    const tournamentType = type === 'SOLO' ? 'SOLO' : 'SQUAD';
    const defaultTotalSlots = category === 'FULL_MAP' && tournamentType === 'SQUAD' ? 12 : 48;
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') + '-' + Date.now().toString().slice(-4);

    const mapsData = Array.isArray(maps)
      ? JSON.stringify(maps)
      : typeof maps === 'string'
      ? maps
      : null;

    let tournamentData: any = {
      name,
      slug,
      category,
      format,
      type: tournamentType,
      description: description || null,
      rules: rules || null,
      whatsappLink: whatsappLink || null,
      date,
      startTime,
      registrationDeadline: registrationDeadline || `${date} ${startTime}`,
      entryFee: Number(entryFee),
      prizePool: Number(prizePool),
      totalSlots: Number(totalSlots ?? defaultTotalSlots),
      registeredSlots: 0,
      maps: mapsData,
      bannerUrl: bannerUrl || null,
      status: status || 'REGISTRATION_OPEN',
      roomId: roomId || null,
      roomPassword: roomPassword || null,
      roomReleased: false,
    };

    if (tournamentType === 'SOLO') {
      tournamentData.soloScoringType = soloScoringType || 'PER_KILL';
      tournamentData.soloKillReward = Number(soloKillReward || 0);
      tournamentData.soloPlacementRewards = typeof soloPlacementRewards === 'object' 
        ? JSON.stringify(soloPlacementRewards) 
        : soloPlacementRewards || null;
      
      // Wipe out any squad configuration
      tournamentData.squadKillPoints = null;
      tournamentData.squadPointTable = null;
    } else {
      tournamentData.squadKillPoints = Number(squadKillPoints !== undefined ? squadKillPoints : 1);
      tournamentData.squadPointTable = typeof squadPointTable === 'object'
        ? JSON.stringify(squadPointTable)
        : squadPointTable || JSON.stringify({ "1": 12, "2": 9, "3": 8, "4": 7, "5": 6, "6": 5, "7": 4, "8": 3, "9": 2, "10": 1 });
      
      // Wipe out any solo configuration
      tournamentData.soloScoringType = null;
      tournamentData.soloKillReward = null;
      tournamentData.soloPlacementRewards = null;
    }

    const tournament = await db.tournament.create({
      data: tournamentData,
    });

    return NextResponse.json({ success: true, tournament });
  } catch (error) {
    console.error('Create tournament error:', error);
    return NextResponse.json({ error: 'Failed to create tournament' }, { status: 500 });
  }
}
