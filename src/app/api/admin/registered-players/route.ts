import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const userSession = await getCurrentUser();
    if (!userSession || userSession.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const tournamentIdFilter = searchParams.get('tournamentId') || 'ALL';
    const typeFilter = searchParams.get('type') || 'ALL';
    const statusFilter = searchParams.get('status') || 'ALL';
    const searchFilter = (searchParams.get('search') || '').trim().toLowerCase();

    // 1. Fetch Summary Metrics
    const allRegistrations = await db.registration.findMany({
      where: {
        status: { not: 'CANCELLED' },
      },
      include: {
        tournament: true,
        team: {
          include: {
            members: true,
          },
        },
      },
    });

    const distinctTournamentIds = new Set(allRegistrations.map((r) => r.tournamentId));
    const totalTournamentsCount = distinctTournamentIds.size;

    const soloRegs = allRegistrations.filter((r) => r.tournament?.type === 'SOLO');
    const squadRegs = allRegistrations.filter((r) => r.tournament?.type === 'SQUAD');

    const totalSoloPlayersCount = soloRegs.length;
    
    // Count unique squad teams and total squad players
    const uniqueSquadTeamIds = new Set(squadRegs.map((r) => r.teamId).filter(Boolean));
    const totalSquadTeamsCount = uniqueSquadTeamIds.size;

    let totalSquadPlayersCount = 0;
    squadRegs.forEach((r) => {
      if (r.team?.members) {
        totalSquadPlayersCount += r.team.members.length;
      } else {
        totalSquadPlayersCount += 1; // Fallback captain
      }
    });

    const totalRegisteredPlayersCount = totalSoloPlayersCount + totalSquadPlayersCount;

    const metrics = {
      totalTournaments: totalTournamentsCount,
      totalRegisteredPlayers: totalRegisteredPlayersCount,
      totalSoloPlayers: totalSoloPlayersCount,
      totalSquadTeams: totalSquadTeamsCount,
      totalSquadPlayers: totalSquadPlayersCount,
    };

    // 2. Fetch All Tournaments for Dropdown Filter
    const tournamentsList = await db.tournament.findMany({
      select: {
        id: true,
        name: true,
        type: true,
        status: true,
        date: true,
        startTime: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // 3. Build Where Query for Registrations
    const whereClause: any = {};

    if (tournamentIdFilter !== 'ALL') {
      whereClause.tournamentId = tournamentIdFilter;
    }

    if (typeFilter !== 'ALL') {
      whereClause.tournament = {
        type: typeFilter,
      };
    }

    if (statusFilter !== 'ALL') {
      whereClause.tournament = {
        ...(whereClause.tournament || {}),
        status: statusFilter,
      };
    }

    // Fetch Registrations matching whereClause
    const rawRegistrations = await db.registration.findMany({
      where: whereClause,
      include: {
        tournament: true,
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            email: true,
            phone: true,
            freeFireUid: true,
            freeFireName: true,
          },
        },
        team: {
          include: {
            captain: {
              select: {
                id: true,
                name: true,
                username: true,
                email: true,
                phone: true,
                freeFireUid: true,
                freeFireName: true,
              },
            },
            members: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    username: true,
                    email: true,
                    phone: true,
                    freeFireUid: true,
                    freeFireName: true,
                  },
                },
              },
            },
          },
        },
        payment: {
          include: {
            paymentMethod: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    // 4. Group Registrations by Tournament & Apply Search Filter
    const tournamentMap: Map<string, any> = new Map();

    rawRegistrations.forEach((reg) => {
      const tour = reg.tournament;
      if (!tour) return;

      if (!tournamentMap.has(tour.id)) {
        tournamentMap.set(tour.id, {
          id: tour.id,
          name: tour.name,
          type: tour.type || 'SQUAD',
          date: tour.date,
          startTime: tour.startTime,
          status: tour.status,
          category: tour.category,
          totalSlots: tour.totalSlots,
          registeredSlots: tour.registeredSlots,
          entryFee: tour.entryFee,
          prizePool: tour.prizePool,
          registrations: [],
        });
      }

      tournamentMap.get(tour.id).registrations.push(reg);
    });

    const groupedTournaments: any[] = [];

    tournamentMap.forEach((tourGroup) => {
      const isSolo = tourGroup.type === 'SOLO';

      // Sort registrations by slotNumber ascending (or fallback to index + 1)
      const sortedRegs = tourGroup.registrations.sort((a: any, b: any) => {
        const slotA = a.slotNumber ?? 99999;
        const slotB = b.slotNumber ?? 99999;
        if (slotA !== slotB) return slotA - slotB;
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      });

      let filteredItems: any[] = [];

      if (isSolo) {
        // Individual Players for Solo Tournaments
        sortedRegs.forEach((reg: any, idx: number) => {
          const slotNum = reg.slotNumber || idx + 1;
          const playerName = reg.user?.name || 'Unknown Player';
          const username = reg.user?.username || '';
          const ffUid = reg.user?.freeFireUid || 'N/A';
          const ffName = reg.user?.freeFireName || 'N/A';
          const regId = reg.registrationId;

          // Search Filter matching
          if (searchFilter) {
            const matches =
              playerName.toLowerCase().includes(searchFilter) ||
              username.toLowerCase().includes(searchFilter) ||
              ffUid.toLowerCase().includes(searchFilter) ||
              ffName.toLowerCase().includes(searchFilter) ||
              regId.toLowerCase().includes(searchFilter) ||
              String(slotNum).includes(searchFilter);

            if (!matches) return;
          }

          filteredItems.push({
            id: reg.id,
            registrationId: reg.registrationId,
            slotNumber: slotNum,
            userId: reg.userId,
            playerName,
            username,
            userEmail: reg.user?.email,
            userPhone: reg.user?.phone,
            freeFireUid: ffUid,
            freeFireName: ffName,
            status: reg.status,
            paymentStatus: reg.paymentStatus,
            payment: reg.payment,
            createdAt: reg.createdAt,
            tournamentName: tourGroup.name,
            tournamentType: tourGroup.type,
            entryFee: tourGroup.entryFee,
          });
        });
      } else {
        // Team-based Grouping for Squad Tournaments (Captain Only)
        sortedRegs.forEach((reg: any) => {
          const teamName = reg.team?.name || 'Squad Team';
          const regId = reg.registrationId;

          const captainUser = reg.user || reg.team?.captain;
          const captainMember = reg.team?.members?.find((m: any) => m.role === 'CAPTAIN') || reg.team?.members?.[0];

          const captainName = captainUser?.name || captainMember?.freeFireName || 'Captain';
          const captainUsername = captainUser?.username || '';
          const captainUid = captainUser?.freeFireUid || captainMember?.freeFireUid || 'N/A';
          const captainIgn = captainUser?.freeFireName || captainMember?.freeFireName || 'N/A';

          // Search Filter matching for Squad
          if (searchFilter) {
            const matchesTeam =
              teamName.toLowerCase().includes(searchFilter) ||
              regId.toLowerCase().includes(searchFilter) ||
              captainName.toLowerCase().includes(searchFilter) ||
              captainUsername.toLowerCase().includes(searchFilter) ||
              captainUid.toLowerCase().includes(searchFilter) ||
              captainIgn.toLowerCase().includes(searchFilter);

            if (!matchesTeam) return;
          }

          filteredItems.push({
            id: reg.id,
            registrationId: reg.registrationId,
            teamId: reg.teamId,
            teamName,
            captainName,
            captainUsername,
            captainUid,
            captainIgn,
            captainEmail: captainUser?.email,
            captainPhone: captainUser?.phone,
            status: reg.status,
            paymentStatus: reg.paymentStatus,
            payment: reg.payment,
            createdAt: reg.createdAt,
            tournamentName: tourGroup.name,
            tournamentType: tourGroup.type,
            entryFee: tourGroup.entryFee,
          });
        });
      }

      if (filteredItems.length > 0 || !searchFilter) {
        groupedTournaments.push({
          ...tourGroup,
          items: filteredItems,
          totalItems: filteredItems.length,
          totalPlayers: filteredItems.length,
        });
      }
    });

    return NextResponse.json({
      success: true,
      metrics,
      tournamentsList,
      tournaments: groupedTournaments,
    });
  } catch (error: any) {
    console.error('Fetch registered players error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch registered players' }, { status: 500 });
  }
}
