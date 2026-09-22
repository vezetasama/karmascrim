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
  const [activeScoringType, setActiveScoringType] = useState<'PER_KILL' | 'SURVIVAL'>('PER_KILL');

  // Filter tournaments dynamically by active solo scoring type ('PER_KILL' vs 'SURVIVAL') and sort
  const filteredTournaments = sortHomeTournaments(
    initialTournaments.filter((t) => {
      const scoringType = t.soloScoringType || 'PER_KILL';
      return scoringType === activeScoringType;
    }),
    currentUser
  );

  return (
    <div suppressHydrationWarning className="w-full bg-[#0B0E14] text-white pt-1 sm:pt-2 pb-8 sm:pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4 sm:space-y-5">

        {/* CATEGORY SHOWCASE CARDS (PER KILL SOLO & SURVIVAL SOLO) */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          
          {/* CATEGORY A — PER KILL SOLO */}
          <div
            onClick={() => setActiveScoringType('PER_KILL')}
            className={`py-3 px-5 sm:py-3.5 sm:px-7 rounded-full bg-[#121722] border transition-all duration-300 relative overflow-hidden cursor-pointer shadow-xl group flex items-center ${
              activeScoringType === 'PER_KILL'
                ? 'border-[#FF2E4C] ring-2 ring-[#FF2E4C]/30 shadow-[#FF2E4C]/20'
                : 'border-[#262F45] hover:border-[#FF2E4C]/60 hover:bg-[#1A2234]'
            }`}
          >
            {/* Background Watermark Icon */}
            <Crosshair className="absolute -top-6 -right-4 w-32 h-32 sm:w-36 sm:h-36 text-[#FF2E4C]/10 pointer-events-none stroke-[1] group-hover:scale-110 transition-transform duration-500" />

            <div className="relative z-10">
              <h3 className="text-base sm:text-lg font-black text-white tracking-wider">
                PER KILL
              </h3>
            </div>
          </div>

          {/* CATEGORY B — SURVIVAL SOLO */}
          <div
            onClick={() => setActiveScoringType('SURVIVAL')}
            className={`py-3 px-5 sm:py-3.5 sm:px-7 rounded-full bg-[#121722] border transition-all duration-300 relative overflow-hidden cursor-pointer shadow-xl group flex items-center ${
              activeScoringType === 'SURVIVAL'
                ? 'border-[#FF9F1C] ring-2 ring-[#FF9F1C]/30 shadow-[#FF9F1C]/20'
                : 'border-[#262F45] hover:border-[#FF9F1C]/60 hover:bg-[#1A2234]'
            }`}
          >
            {/* Background Watermark Icon */}
            <Flame className="absolute -top-6 -right-4 w-32 h-32 sm:w-36 sm:h-36 text-[#FF9F1C]/10 pointer-events-none stroke-[1] group-hover:scale-110 transition-transform duration-500" />

            <div className="relative z-10">
              <h3 className="text-base sm:text-lg font-black text-white tracking-wider">
                SURVIVAL
              </h3>
            </div>
          </div>

        </div>

        {/* TOURNAMENT GAMES SECTION HEADER & CARDS GRID */}
        <section className="space-y-6 pt-3 sm:pt-4 border-t border-[#262F45]/60">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-[#FF2E4C]">
              <Gamepad2 className="w-5 h-5" />
              <span className="text-xl sm:text-2xl font-extrabold uppercase tracking-wide text-white">
                G<span className="lowercase">ames</span> — {activeScoringType === 'PER_KILL' ? 'Per Kill Solo Scrims' : 'Survival Solo Scrims'}
              </span>
            </div>
          </div>

          {/* TOURNAMENT GRID */}
          {filteredTournaments.length === 0 ? (
            <div className="p-12 text-center bg-[#121722] rounded-3xl border border-[#262F45] space-y-3">
              <Trophy className="w-12 h-12 text-gray-600 mx-auto" />
              <h3 className="text-base font-bold text-gray-300">
                No {activeScoringType === 'PER_KILL' ? 'Per Kill Solo' : 'Survival Solo'} scrims available right now.
              </h3>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">
                Check back soon or switch mode category above.
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
