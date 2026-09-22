import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const SQUAD_NAMES = [
  'KARMA ESPORTS',
  'TITAN ESPORTS',
  'NEPAL APEX',
  'DEADLY SQUAD',
  'NIGHT HAWKS',
  'PHOENIX ESPORTS',
  'GHOST RIDERS',
  'VIKING KINGS',
  'THUNDER BOLTS',
  'CYBER WARRIORS',
  'SHADOW HUNTERS',
  'ULTIMATE SQUAD',
];

const SOLO_PLAYER_NAMES = [
  'Mandip Tamang', 'Aayush Shrestha', 'Rohan Sharma', 'Bishal Gurung', 'Kiran Thapa',
  'Sujan Magar', 'Dipesh Rai', 'Aashish Subedi', 'Manish Khatri', 'Prajwal Karki',
  'Nabin Adhikari', 'Samir Basnet', 'Saurav Joshi', 'Bikash Pokhrel', 'Prashant Maharjan',
  'Anish Regmi', 'Sandesh Giri', 'Roshan Ghimire', 'Bibek Acharya', 'Kushal Pandey',
  'Rabin Dahal', 'Puskar Rijal', 'Sabin Silwal', 'Dinesh Kunwar', 'Deepak Khadka',
  'Subash Tamang', 'Suraj Bhandari', 'Milan Lama', 'Kabin Neupane', 'Rajesh Hamal',
  'Kamal Bhattarai', 'Surya Gautam', 'Sunil Rawat', 'Mahesh Oli', 'Santosh Devkota',
  'Arun Chaudhary', 'Ganesh Baniya', 'Lalit Poudel', 'Rakesh Shah', 'Hemant Shrestha',
  'Kalyan Mahato', 'Bharat Tharu', 'Chetan Yadav', 'Damodar Bohora', 'Eakraj Thapa',
  'Firoz Khan', 'Govinda Bhatta', 'Hari KC'
];

async function main() {
  console.log('Filling test solo and squad players to full...');

  const passwordHash = await bcrypt.hash('player123', 10);

  const tournaments = await prisma.tournament.findMany();

  if (tournaments.length === 0) {
    console.log('No tournaments found. Please seed basic tournaments first.');
    return;
  }

  for (const tour of tournaments) {
    const isSolo = tour.type === 'SOLO';

    if (isSolo) {
      console.log(`Filling SOLO tournament: ${tour.name}...`);
      
      const totalSoloSlots = tour.totalSlots || 48;

      for (let i = 1; i <= totalSoloSlots; i++) {
        const playerName = SOLO_PLAYER_NAMES[(i - 1) % SOLO_PLAYER_NAMES.length];
        const email = `solo_test_player_${i}_${tour.id.slice(0, 4)}@karmascrims.com`;
        const username = `solo_player_${i}_${tour.id.slice(0, 4)}`;
        const ffUid = `9900${tour.id.slice(-2)}${String(i).padStart(3, '0')}`;
        const ffName = `${playerName.split(' ')[0].toUpperCase()}x_${i}`;

        const user = await prisma.user.upsert({
          where: { email },
          update: {
            name: playerName,
            freeFireUid: ffUid,
            freeFireName: ffName,
          },
          create: {
            name: playerName,
            username,
            email,
            passwordHash,
            phone: `984${String(1000000 + i).slice(-7)}`,
            freeFireUid: ffUid,
            freeFireName: ffName,
            role: 'USER',
            status: 'ACTIVE',
          },
        });

        // Ensure wallet exists
        await prisma.wallet.upsert({
          where: { userId: user.id },
          update: {},
          create: { userId: user.id, balance: 1000 },
        });

        const regId = `KS-REG-SOLO-${tour.id.slice(-4)}-${String(i).padStart(2, '0')}`;

        await prisma.registration.upsert({
          where: { registrationId: regId },
          update: {
            status: 'CONFIRMED',
            paymentStatus: 'VERIFIED',
            slotNumber: i,
          },
          create: {
            registrationId: regId,
            tournamentId: tour.id,
            userId: user.id,
            status: 'CONFIRMED',
            paymentStatus: 'VERIFIED',
            slotNumber: i,
          },
        });
      }

      await prisma.tournament.update({
        where: { id: tour.id },
        data: { registeredSlots: totalSoloSlots },
      });

    } else {
      console.log(`Filling SQUAD tournament: ${tour.name}...`);
      
      const totalSquads = tour.totalSlots || 12;

      for (let teamIdx = 1; teamIdx <= totalSquads; teamIdx++) {
        const teamName = SQUAD_NAMES[(teamIdx - 1) % SQUAD_NAMES.length] + (teamIdx > 12 ? ` #${teamIdx}` : '');
        const captainEmail = `squad_cap_${teamIdx}_${tour.id.slice(0, 4)}@karmascrims.com`;
        const captainUsername = `cap_${teamIdx}_${tour.id.slice(0, 4)}`;
        const captainName = `${teamName.split(' ')[0]} Captain`;
        const capFfUid = `8800${tour.id.slice(-2)}${String(teamIdx).padStart(3, '0')}1`;
        const capFfName = `${teamName.split(' ')[0]}_CAPTAIN`;

        const captainUser = await prisma.user.upsert({
          where: { email: captainEmail },
          update: {
            name: captainName,
            freeFireUid: capFfUid,
            freeFireName: capFfName,
          },
          create: {
            name: captainName,
            username: captainUsername,
            email: captainEmail,
            passwordHash,
            phone: `981${String(2000000 + teamIdx).slice(-7)}`,
            freeFireUid: capFfUid,
            freeFireName: capFfName,
            role: 'USER',
            status: 'ACTIVE',
          },
        });

        // Ensure wallet exists
        await prisma.wallet.upsert({
          where: { userId: captainUser.id },
          update: {},
          create: { userId: captainUser.id, balance: 2000 },
        });

        // Create or find Team
        let team = await prisma.team.findFirst({
          where: { name: teamName, category: tour.category },
        });

        if (!team) {
          const membersData = [
            {
              userId: captainUser.id,
              freeFireUid: capFfUid,
              freeFireName: capFfName,
              role: 'CAPTAIN',
            },
            {
              freeFireUid: `8800${tour.id.slice(-2)}${String(teamIdx).padStart(3, '0')}2`,
              freeFireName: `${teamName.split(' ')[0]}_RUSHER`,
              role: 'MEMBER',
            },
            {
              freeFireUid: `8800${tour.id.slice(-2)}${String(teamIdx).padStart(3, '0')}3`,
              freeFireName: `${teamName.split(' ')[0]}_SNIPER`,
              role: 'MEMBER',
            },
            {
              freeFireUid: `8800${tour.id.slice(-2)}${String(teamIdx).padStart(3, '0')}4`,
              freeFireName: `${teamName.split(' ')[0]}_SUPPORT`,
              role: 'MEMBER',
            },
          ];

          team = await prisma.team.create({
            data: {
              name: teamName,
              category: tour.category,
              captainId: captainUser.id,
              members: {
                create: membersData,
              },
            },
          });
        }

        const regId = `KS-REG-SQD-${tour.id.slice(-4)}-${String(teamIdx).padStart(2, '0')}`;

        await prisma.registration.upsert({
          where: { registrationId: regId },
          update: {
            status: 'CONFIRMED',
            paymentStatus: 'VERIFIED',
            slotNumber: teamIdx,
          },
          create: {
            registrationId: regId,
            tournamentId: tour.id,
            teamId: team.id,
            userId: captainUser.id,
            status: 'CONFIRMED',
            paymentStatus: 'VERIFIED',
            slotNumber: teamIdx,
          },
        });
      }

      await prisma.tournament.update({
        where: { id: tour.id },
        data: { registeredSlots: totalSquads },
      });
    }
  }

  console.log('Successfully filled all tournaments with test registered solo and squad players!');
}

main()
  .catch((e) => {
    console.error('Error filling test registrations:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
