'use client';

import React, { useState } from 'react';
import TournamentCard from '@/components/TournamentCard';
import { Crosshair, Zap, ArrowRight, Trophy, Flame } from 'lucide-react';

interface CategoryShowcaseSectionProps {
  initialTournaments: any[];
}

export default function CategoryShowcaseSection({ initialTournaments = [] }: CategoryShowcaseSectionProps) {
  const [activeCategory, setActiveCategory] = useState<'FULL_MAP' | 'CLASH_SQUAD'>('FULL_MAP');

  // Filter tournaments dynamically by active category
  const filteredTournaments = initialTournaments.filter(
    (t) => t.category === activeCategory
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
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-widest text-[#FF2E4C] flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-[#FF2E4C]" />
                Live &amp; Upcoming Tournaments
              </span>
              <h2 className="text-xl sm:text-2xl font-extrabold uppercase tracking-wide text-white mt-0.5">
                {activeCategory === 'FULL_MAP' ? 'Full Map Squad Scrims' : 'Clash Squad Duels'}
              </h2>
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
