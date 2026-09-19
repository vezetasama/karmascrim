'use client';

import React from 'react';
import Link from 'next/link';
import { Calendar, Clock, Trophy, Users, ArrowRight, Check, Compass } from 'lucide-react';
import { useUser } from '@/context/UserContext';

interface TournamentCardProps {
  tournament: {
    id: string;
    slug: string;
    name: string;
    type?: string;
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
    soloScoringType?: string | null;
    soloKillReward?: number | null;
    registrations?: { id: string; status: string; userId?: string }[];
  };
}

export default function TournamentCard({ tournament }: TournamentCardProps) {
  const { user: currentUser } = useUser();

  const isFullMap = tournament.category === 'FULL_MAP';
  const isSolo = tournament.type === 'SOLO' || tournament.format === 'SOLO' || tournament.name?.toUpperCase().includes('SOLO');

  const percentageFull = Math.min(
    100,
    Math.round(((tournament.registeredSlots || 0) / (tournament.totalSlots || 48)) * 100)
  );

  // Prize Pool display formatting for Solo & Squad
  const getPrizePoolText = () => {
    if (isSolo) {
      const scoringType = tournament.soloScoringType;
      const killCoins = tournament.soloKillReward ?? 0;
      const doubleEntryFee = (tournament.entryFee || 0) * 2;

      if (scoringType === 'PER_KILL') {
        return `${killCoins} / KILL`;
      }

      if (scoringType === 'SURVIVAL') {
        return doubleEntryFee > 0 ? doubleEntryFee.toLocaleString() : '0';
      }

      if (scoringType === 'KILL_AND_SURVIVAL') {
        return `${killCoins}/KILL + 🪙 ${doubleEntryFee.toLocaleString()}`;
      }

      if (killCoins > 0) {
        return `${killCoins} / KILL`;
      }

      return doubleEntryFee > 0 ? doubleEntryFee.toLocaleString() : (tournament.prizePool ? tournament.prizePool.toLocaleString() : '0');
    }
    return tournament.prizePool ? tournament.prizePool.toLocaleString() : '0';
  };

  // Check if current logged in user has a confirmed registration for this tournament
  const userRegistration = currentUser?.registrations?.find(
    (r: any) => (r.tournamentId === tournament.id || r.tournament?.id === tournament.id)
  ) || tournament.registrations?.find(
    (r: any) => r.userId === currentUser?.id
  );

  const isUserPaid = userRegistration?.status === 'CONFIRMED';
  const isUserPending = userRegistration?.status === 'PENDING';

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
    if (isUserPaid) {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-extrabold bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 shadow-sm shadow-emerald-500/20">
          <Check className="w-3.5 h-3.5 stroke-[3]" />
          PAID
        </span>
      );
    }

    if (isUserPending) {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-extrabold bg-amber-500/20 text-amber-400 border border-amber-500/50 shadow-sm">
          PENDING
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
    <div className={`bg-[#121722] border rounded-3xl p-5 flex flex-col justify-between space-y-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl group relative overflow-hidden ${
      isUserPaid ? 'border-emerald-500/40 hover:border-emerald-500/80 hover:shadow-emerald-500/10' : 'border-[#262F45] hover:border-[#FF2E4C]/50 hover:shadow-[#FF2E4C]/10'
    }`}>
      
      {/* Background Subtle Accent Glow */}
      <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl pointer-events-none transition-colors ${
        isUserPaid ? 'bg-emerald-500/10 group-hover:bg-emerald-500/15' : 'bg-[#FF2E4C]/5 group-hover:bg-[#FF2E4C]/10'
      }`} />

      {/* TOP SECTION: Mode Badge & Registration Status */}
      <div className="flex items-center justify-between gap-3 relative z-10">
        <span
          className={`px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider shadow-sm border ${
            isFullMap
              ? 'bg-[#FF2E4C]/15 border-[#FF2E4C]/40 text-[#FF2E4C]'
              : 'bg-[#FF9F1C]/15 border-[#FF9F1C]/40 text-[#FF9F1C]'
          }`}
        >
          {isSolo ? 'SOLO' : 'SQUAD'}
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
        <h3 className="text-base sm:text-lg font-semibold text-white group-hover:text-[#FF2E4C] transition-colors line-clamp-2 uppercase tracking-wide">
          {tournament.name || 'FREE FIRE TOURNAMENT'}
        </h3>
      </div>

      {/* PRIZE POOL & ENTRY FEE SECTION */}
      <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-[#0B0E14]/80 border border-[#262F45] relative z-10">
        <div>
          <span className="block text-[10px] text-gray-400 uppercase font-semibold tracking-wider">
            Prize Pool
          </span>
          <span className="text-base sm:text-lg font-bold text-[#FF9F1C] flex items-center gap-1 mt-0.5">
            <Trophy className="w-4 h-4 text-[#FF9F1C] shrink-0" />
            <span>🪙 {getPrizePoolText()}</span>
          </span>
        </div>
        <div>
          <span className="block text-[10px] text-gray-400 uppercase font-semibold tracking-wider">
            Entry Fee
          </span>
          <span className="text-base sm:text-lg font-bold text-white mt-0.5 block flex items-center gap-1">
            {tournament.entryFee === 0 ? 'FREE' : `🪙 ${tournament.entryFee}`}
          </span>
        </div>
      </div>

      {!isSolo && (
        <div className="relative z-10 space-y-1.5">
          <div className="flex justify-between items-center text-xs font-semibold">
            <span className="text-gray-400 flex items-center gap-1.5 font-medium">
              <Users className="w-3.5 h-3.5 text-gray-400" />
              Slots Registered
            </span>
            <span className="font-semibold text-white">
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
      )}

      {/* BOTTOM ACTION BUTTON */}
      <div className="pt-1 relative z-10">
        <Link
          href={`/tournaments/${tournament.id}`}
          className={`w-full py-3 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 border transition-all duration-300 shadow-md ${
            isUserPaid
              ? 'bg-emerald-950/40 hover:bg-emerald-600 text-emerald-400 hover:text-white border-emerald-500/40 hover:border-emerald-500 shadow-emerald-500/10'
              : 'bg-[#161E2E] hover:bg-[#FF2E4C] text-white border-[#28354E] hover:border-[#FF2E4C] group-hover:shadow-[#FF2E4C]/20'
          }`}
        >
          {isUserPaid ? (
            <>
              <Check className="w-4 h-4 text-emerald-400 group-hover:text-white" />
              <span>PAID — Register Now</span>
            </>
          ) : (
            <span>Register Now</span>
          )}
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

    </div>
  );
}
