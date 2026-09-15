import React from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import HeroSlider from '@/components/HeroSlider';
import CategoryShowcaseSection from '@/components/CategoryShowcaseSection';
import { db } from '@/lib/db';

export const revalidate = 0; // Fresh dynamic data

async function getHomePageData() {
  try {
    const banners = await db.banner.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });

    const upcomingTournaments = await db.tournament.findMany({
      where: {
        status: { in: ['REGISTRATION_OPEN', 'REGISTRATION_CLOSED', 'LIVE'] },
      },
      orderBy: { createdAt: 'desc' },
      take: 12,
    });

    const totalTournamentsCount = await db.tournament.count();
    const totalUsersCount = await db.user.count();
    const totalRegistrationsCount = await db.registration.count({ where: { status: 'CONFIRMED' } });
    
    // Calculate total prize pool of active tournaments
    const totalPrizePoolAgg = await db.tournament.aggregate({
      _sum: { prizePool: true },
    });

    return {
      banners,
      upcomingTournaments,
      stats: {
        totalTournaments: totalTournamentsCount,
        totalUsers: totalUsersCount,
        totalConfirmed: totalRegistrationsCount,
        totalPrizePool: totalPrizePoolAgg._sum.prizePool || 15000,
      },
    };
  } catch (error) {
    return {
      banners: [],
      upcomingTournaments: [],
      stats: { totalTournaments: 0, totalUsers: 0, totalConfirmed: 0, totalPrizePool: 0 },
    };
  }
}

export default async function HomePage() {
  const { banners, upcomingTournaments, stats } = await getHomePageData();

  return (
    <div className="min-h-screen flex flex-col bg-[#0B0E14] text-white">
      <Navbar />

      {/* SINGLE IMAGE HERO SLIDER BANNER */}
      <HeroSlider banners={banners} />

      {/* INTERACTIVE CATEGORY BOXES & DYNAMIC FEATURED TOURNAMENTS */}
      <CategoryShowcaseSection initialTournaments={upcomingTournaments} />

      <Footer />
    </div>
  );
}

