'use client';

import React, { useState } from 'react';
import TournamentCard from '@/components/TournamentCard';
import { Crosshair, Zap, ArrowRight, Trophy, Flame, Gamepad2 } from 'lucide-react';

import { useUser } from '@/context/UserContext';

interface CategoryShowcaseSectionProps {
  initialTournaments: any[];
}

function getTournamentTimestamp(t: any): number {
  try {
    if (t.date && t.startTime) {
      const dateStr = String(t.date).trim();
      const timeStr = String(t.startTime).trim();
      
      let hour = 0;
      let minute = 0;
      const ampmMatch = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
      if (ampmMatch) {
        hour = parseInt(ampmMatch[1], 10);
        minute = parseInt(ampmMatch[2], 10);
        const period = ampmMatch[3]?.toUpperCase();
        if (period === 'PM' && hour < 12) hour += 12;
        if (period === 'AM' && hour === 12) hour = 0;
      } else {
        const match24 = timeStr.match(/^(\d{1,2}):(\d{2})$/);
        if (match24) {
          hour = parseInt(match24[1], 10);
          minute = parseInt(match24[2], 10);
        }
      }
      
      const dateParts = dateStr.split('-');
      if (dateParts.length === 3) {
        const y = parseInt(dateParts[0], 10);
        const m = parseInt(dateParts[1], 10) - 1;
        const d = parseInt(dateParts[2], 10);
        const dObj = new Date(y, m, d, hour, minute, 0);
        if (!isNaN(dObj.getTime())) {
          return dObj.getTime();
        }
      }
    }
  } catch (e) {
    // fallback
  }
  
  return t.createdAt ? new Date(t.createdAt).getTime() : 0;
}

function isUserPaidTournament(t: any, currentUser: any): boolean {
  if (!currentUser) return false;

  // Check user's registrations from context
  const userRegFromUser = currentUser.registrations?.find(
    (r: any) => (r.tournamentId === t.id || r.tournament?.id === t.id) && (r.status === 'CONFIRMED' || r.status === 'PAID')
  );
  if (userRegFromUser) return true;

  // Check tournament's registrations array
  const userRegFromTournament = t.registrations?.find(
    (r: any) => r.userId === currentUser.id && (r.status === 'CONFIRMED' || r.status === 'PAID')
  );
  if (userRegFromTournament) return true;

  return false;
}

function getTournamentPriority(t: any, currentUser: any): number {
  if (isUserPaidTournament(t, currentUser)) {
    return 3; // Top priority: Current user registered & paid/confirmed
  }
  if ((t.entryFee || 0) > 0) {
    return 2; // General paid tournaments
  }
  return 1; // Free entry tournaments
}

function sortHomeTournaments(tournaments: any[], currentUser: any) {
  return [...tournaments].sort((a, b) => {
    const priorityA = getTournamentPriority(a, currentUser);
    const priorityB = getTournamentPriority(b, currentUser);

    // 1. User registered/paid first (3 > 2 > 1)
    if (priorityA !== priorityB) {
      return priorityB - priorityA;
    }

    // 2. Time wise series (chronological: earliest scheduled start date & time first)
    const timeA = getTournamentTimestamp(a);
    const timeB = getTournamentTimestamp(b);

    if (timeA !== timeB) {
      return timeA - timeB;
    }

    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

export default function CategoryShowcaseSection({ initialTournaments = [] }: CategoryShowcaseSectionProps) {
  const { user: currentUser } = useUser();
  const [activeCategory, setActiveCategory] = useState<'FULL_MAP' | 'CLASH_SQUAD'>('FULL_MAP');

  // Filter tournaments dynamically by active category and sort (User paid first, then paid, then free, time wise series)
  const filteredTournaments = sortHomeTournaments(
    initialTournaments.filter((t) => t.category === activeCategory),
    currentUser
  );

  return (
    <div suppressHydrationWarning className="w-full bg-[#0B0E14] text-white py-8 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10 sm:space-y-12">

        {/* CATEGORY SHOWCASE CARDS (FULL MAP & CLASH SQUAD) */}
        <div className="grid grid-cols-2 gap-3 sm:gap-6">
          
          {/* CATEGORY A — FULL MAP */}
          <div
            onClick={() => setActiveCategory('FULL_MAP')}
            className={`p-6 sm:p-8 rounded-3xl bg-[#121722] border transition-all duration-300 relative overflow-hidden cursor-pointer shadow-xl group ${
              activeCategory === 'FULL_MAP'
                ? 'border-[#FF2E4C] ring-2 ring-[#FF2E4C]/30 shadow-[#FF2E4C]/20'
                : 'border-[#262F45] hover:border-[#FF2E4C]/60 hover:bg-[#1A2234]'
            }`}
          >
            {/* Background Watermark Icon */}
            <Crosshair className="absolute -top-4 -right-4 w-44 h-44 text-[#FF2E4C]/10 pointer-events-none stroke-[1] group-hover:scale-110 transition-transform duration-500" />

            <div className="relative z-10 space-y-3">
              <h3 className="text-xl sm:text-2xl font-black text-white tracking-wide">
                FULL MAP
              </h3>
            </div>
          </div>

          {/* CATEGORY B — CLASH SQUAD */}
          <div
            onClick={() => setActiveCategory('CLASH_SQUAD')}
            className={`p-6 sm:p-8 rounded-3xl bg-[#121722] border transition-all duration-300 relative overflow-hidden cursor-pointer shadow-xl group ${
              activeCategory === 'CLASH_SQUAD'
                ? 'border-[#FF9F1C] ring-2 ring-[#FF9F1C]/30 shadow-[#FF9F1C]/20'
                : 'border-[#262F45] hover:border-[#FF9F1C]/60 hover:bg-[#1A2234]'
            }`}
          >
            {/* Background Watermark Icon */}
            <Zap className="absolute -top-4 -right-4 w-44 h-44 text-[#FF9F1C]/10 pointer-events-none stroke-[1] group-hover:scale-110 transition-transform duration-500" />

            <div className="relative z-10 space-y-3">
              <h3 className="text-xl sm:text-2xl font-black text-white tracking-wide">
                CLASH SQUAD
              </h3>
            </div>
          </div>

        </div>

        {/* TOURNAMENT GAMES SECTION HEADER & CARDS GRID */}
        <section className="space-y-6 pt-4 border-t border-[#262F45]/60">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-[#FF2E4C]">
              <Gamepad2 className="w-5 h-5" />
              <span className="text-xl sm:text-2xl font-extrabold uppercase tracking-wide text-white">
                G<span className="lowercase">ames</span>
              </span>
            </div>
          </div>

          {/* TOURNAMENT GRID */}
          {filteredTournaments.length === 0 ? (
            <div className="p-12 text-center bg-[#121722] rounded-3xl border border-[#262F45] space-y-3">
              <Trophy className="w-12 h-12 text-gray-600 mx-auto" />
              <h3 className="text-base font-bold text-gray-300">
                No {activeCategory === 'FULL_MAP' ? 'Full Map' : 'Clash Squad'} scrims available right now.
              </h3>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">
                Check back soon or switch category above.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTournaments.map((t) => (
                <TournamentCard key={t.id} tournament={t} />
              ))}
            </div>
          )}
        </section>

      </div>
    </div>
  );
}
