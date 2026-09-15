import React from 'react';
import Link from 'next/link';
import { Calendar, Clock, Trophy, Users, ArrowRight, Check, Compass } from 'lucide-react';

interface TournamentCardProps {
  tournament: {
    id: string;
    slug: string;
    name: string;
    category: string; // FULL_MAP, CLASH_SQUAD
    format: string;
    date: string;
    startTime: string;
    entryFee: number;
    prizePool: number;
    totalSlots: number;
    registeredSlots: number;
    status: string;
    maps?: string | string[] | null;
    bannerUrl?: string | null;
    registrations?: { id: string; status: string }[];
  };
}

export default function TournamentCard({ tournament }: TournamentCardProps) {
  const isFullMap = tournament.category === 'FULL_MAP';
  const percentageFull = Math.min(
    100,
    Math.round(((tournament.registeredSlots || 0) / (tournament.totalSlots || 48)) * 100)
  );
  const hasPaidRegistration = tournament.registrations?.some((r) => r.status === 'CONFIRMED');

  // Format YYYY-MM-DD into readable 13 Sep 2026
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const year = Number(parts[0]);
        const month = Number(parts[1]);
        const day = Number(parts[2]);
        if (year && month && day) {
          const d = new Date(year, month - 1, day);
          const dayNum = d.getDate();
          const monthName = d.toLocaleString('en-US', { month: 'short' });
          const yearNum = d.getFullYear();
          return `${dayNum < 10 ? '0' + dayNum : dayNum} ${monthName} ${yearNum}`;
        }
      }
    } catch (e) {}
    return dateStr;
  };

  // Safely parse maps array from string/JSON/array
  const getMapsArray = (): string[] => {
    if (!tournament.maps) return [];
    if (Array.isArray(tournament.maps)) return tournament.maps;
    try {
      const parsed = JSON.parse(tournament.maps);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      if (typeof tournament.maps === 'string') {
        return tournament.maps.split(',').map((m) => m.trim()).filter(Boolean);
      }
      return [];
    }
  };

  const mapsList = getMapsArray();

  const getStatusBadge = (status: string) => {
    if (hasPaidRegistration) {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-extrabold bg-emerald-500/10 text-emerald-400 border border-emerald-500/40 shadow-sm">
          <Check className="w-3.5 h-3.5" />
          PAID
        </span>
      );
    }

    switch (status) {
      case 'REGISTRATION_OPEN':
        return (
          <span className="px-3 py-1 rounded-full text-[11px] font-extrabold bg-emerald-500/15 text-emerald-400 border border-emerald-500/40 shadow-sm">
            Registration Open
          </span>
        );
      case 'REGISTRATION_CLOSED':
        return (
          <span className="px-3 py-1 rounded-full text-[11px] font-extrabold bg-amber-500/15 text-amber-400 border border-amber-500/40 shadow-sm">
            Slots Full
          </span>
        );
      case 'LIVE':
        return (
          <span className="px-3 py-1 rounded-full text-[11px] font-extrabold bg-red-500/20 text-red-400 border border-red-500/50 animate-pulse shadow-sm">
            ● LIVE NOW
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="px-3 py-1 rounded-full text-[11px] font-extrabold bg-gray-500/15 text-gray-400 border border-gray-500/30">
            Completed
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="px-3 py-1 rounded-full text-[11px] font-extrabold bg-rose-950 text-rose-400 border border-rose-500/40">
            Cancelled
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 rounded-full text-[11px] font-extrabold bg-gray-800 text-gray-300">
            Draft
          </span>
        );
    }
  };

  return (
    <div className="bg-[#121722] border border-[#262F45] rounded-3xl p-5 flex flex-col justify-between space-y-4 transition-all duration-300 hover:-translate-y-1 hover:border-[#FF2E4C]/50 hover:shadow-2xl hover:shadow-[#FF2E4C]/10 group relative overflow-hidden">
      
      {/* Background Subtle Accent Glow */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-[#FF2E4C]/5 rounded-full blur-3xl pointer-events-none group-hover:bg-[#FF2E4C]/10 transition-colors" />

      {/* TOP SECTION: Mode Badge & Registration Status */}
      <div className="flex items-center justify-between gap-3 relative z-10">
        <span
          className={`px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider shadow-sm border ${
            isFullMap
              ? 'bg-[#FF2E4C]/15 border-[#FF2E4C]/40 text-[#FF2E4C]'
              : 'bg-[#FF9F1C]/15 border-[#FF9F1C]/40 text-[#FF9F1C]'
          }`}
        >
          {isFullMap ? 'FULL MAP SQUAD' : `CLASH SQUAD (${tournament.format})`}
        </span>
        {getStatusBadge(tournament.status)}
      </div>

      {/* TIME AND DATE SECTION */}
      <div className="flex items-center gap-2.5 text-xs font-semibold relative z-10">
        <div className="flex items-center gap-1.5 bg-[#0B0E14] px-3 py-1.5 rounded-xl border border-[#262F45] text-white font-mono font-bold">
          <Clock className="w-3.5 h-3.5 text-[#FF2E4C]" />
          <span>{tournament.startTime}</span>
        </div>
        <div className="flex items-center gap-1.5 text-gray-400 bg-[#0B0E14]/60 px-3 py-1.5 rounded-xl border border-[#262F45]/60">
          <Calendar className="w-3.5 h-3.5 text-gray-400" />
          <span>{formatDate(tournament.date)}</span>
        </div>
      </div>

      {/* TOURNAMENT TITLE */}
      <div className="relative z-10 space-y-1">
        <h3 className="text-base sm:text-lg font-black text-white group-hover:text-[#FF2E4C] transition-colors line-clamp-2 uppercase tracking-wide">
          {tournament.name || 'FREE FIRE TOURNAMENT'}
        </h3>
      </div>

      {/* DEDICATED MAPS SECTION */}
      <div className="relative z-10 space-y-1.5">
        <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-gray-400">
          <Compass className="w-3.5 h-3.5 text-[#FF9F1C]" />
          <span>{mapsList.length > 0 ? `${mapsList.length} MAPS` : 'MAPS'}</span>
        </div>

        {mapsList.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {mapsList.map((mapName) => (
              <span
                key={mapName}
                className="px-2.5 py-1 rounded-lg bg-[#0B0E14] border border-[#262F45] text-xs font-bold text-gray-200 flex items-center gap-1 shadow-inner"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#FF2E4C]" />
                {mapName}
              </span>
            ))}
          </div>
        ) : (
          <div className="px-2.5 py-1 rounded-lg bg-[#0B0E14]/60 border border-[#262F45]/60 text-xs font-medium text-gray-500 italic w-fit">
            Map details coming soon
          </div>
        )}
      </div>

      {/* PRIZE POOL & ENTRY FEE SECTION */}
      <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-[#0B0E14]/80 border border-[#262F45] relative z-10">
        <div>
          <span className="block text-[10px] text-gray-400 uppercase font-extrabold tracking-wider">
            Prize Pool
          </span>
          <span className="text-base sm:text-lg font-black text-[#FF9F1C] flex items-center gap-1 mt-0.5">
            <Trophy className="w-4 h-4 text-[#FF9F1C]" />
            NPR {tournament.prizePool ? tournament.prizePool.toLocaleString() : '0'}
          </span>
        </div>
        <div>
          <span className="block text-[10px] text-gray-400 uppercase font-extrabold tracking-wider">
            Entry Fee
          </span>
          <span className="text-base sm:text-lg font-black text-white mt-0.5 block">
            {tournament.entryFee === 0 ? 'FREE' : `NPR ${tournament.entryFee}`}
          </span>
        </div>
      </div>

      {/* SLOTS REGISTERED & PROGRESS BAR */}
      <div className="relative z-10 space-y-1.5">
        <div className="flex justify-between items-center text-xs font-semibold">
          <span className="text-gray-400 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-gray-400" />
            Slots Registered
          </span>
          <span className="font-extrabold text-white">
            {tournament.registeredSlots || 0} / {tournament.totalSlots || 48}
          </span>
        </div>
        <div className="w-full h-2 rounded-full bg-[#0B0E14] overflow-hidden border border-[#262F45]">
          <div
            className="h-full bg-gradient-to-r from-[#FF2E4C] to-[#FF9F1C] transition-all duration-500 rounded-full"
            style={{ width: `${percentageFull}%` }}
          />
        </div>
      </div>

      {/* BOTTOM ACTION BUTTON */}
      <div className="pt-1 relative z-10">
        <Link
          href={`/tournaments/${tournament.id}`}
          className="w-full py-3 rounded-xl bg-[#161E2E] hover:bg-[#FF2E4C] text-white text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 border border-[#28354E] hover:border-[#FF2E4C] transition-all duration-300 shadow-md group-hover:shadow-[#FF2E4C]/20"
        >
          <span>View Details</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

    </div>
  );
}
