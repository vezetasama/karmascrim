'use client';

import React, { useState, useEffect, use } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import RegistrationModal from '@/components/RegistrationModal';
import { Calendar, Clock, Trophy, Users, Shield, Lock, Unlock, Copy, Check, AlertCircle, ArrowLeft, Compass, MessageCircle, ExternalLink } from 'lucide-react';
import Link from 'next/link';

export default function TournamentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const tournamentId = resolvedParams.id;

  const [tournament, setTournament] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [copiedRoom, setCopiedRoom] = useState(false);
  const [copiedPass, setCopiedPass] = useState(false);

  useEffect(() => {
    fetchUser();
    fetchTournament();

    const interval = window.setInterval(() => {
      fetchUser();
      fetchTournament();
    }, 15000);

    return () => {
      window.clearInterval(interval);
    };
  }, [tournamentId]);

  const fetchUser = async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      setCurrentUser(data.user);
    } catch (e) {}
  };

  const fetchTournament = async () => {
    try {
      const res = await fetch(`/api/tournaments/${tournamentId}`);
      const data = await res.json();
      if (data.tournament) {
        setTournament(data.tournament);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, type: 'room' | 'pass') => {
    navigator.clipboard.writeText(text);
    if (type === 'room') {
      setCopiedRoom(true);
      setTimeout(() => setCopiedRoom(false), 2000);
    } else {
      setCopiedPass(true);
      setTimeout(() => setCopiedPass(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0E14] text-white flex flex-col justify-between">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-20 w-full text-center">
          <div className="w-12 h-12 border-4 border-[#FF2E4C] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-gray-400 mt-4">Loading tournament details...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="min-h-screen bg-[#0B0E14] text-white flex flex-col justify-between">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-20 w-full text-center">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-white">Tournament Not Found</h2>
          <Link href="/tournaments" className="mt-4 inline-block px-4 py-2 rounded-xl bg-[#FF2E4C] text-xs font-bold">
            Back to Tournaments
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const isFullMap = tournament.category === 'FULL_MAP';
  const hasBanner = Boolean(tournament.bannerUrl);
  const percentageFull = Math.min(100, Math.round((tournament.registeredSlots / tournament.totalSlots) * 100));

  // Check if current user has a confirmed registration
  const userRegistration = tournament.registrations?.find(
    (reg: any) => reg.userId === currentUser?.id
  );
  const isConfirmedParticipant = userRegistration?.status === 'CONFIRMED';

  return (
    <div className="min-h-screen flex flex-col bg-[#0B0E14] text-white relative">
      <Navbar />

      <main className="flex-1 py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        
        {/* Back Link */}
        <Link href="/tournaments" className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-white mb-6">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Tournaments</span>
        </Link>

        {/* HERO BANNER & MAIN DETAILS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Banner & Rules */}
          <div className="lg:col-span-2 space-y-6">
            
            <div className="space-y-4">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${isFullMap ? 'badge-full-map' : 'badge-clash-squad'}`}>
                  {isFullMap ? 'Full Map Squad' : `Clash Squad (${tournament.format})`}
                </span>
                <span className="px-3 py-1 rounded-lg text-xs font-bold bg-[#121722]/80 text-emerald-400 border border-emerald-500/40">
                  {tournament.status}
                </span>
              </div>

              <h1 className="text-2xl sm:text-4xl font-extrabold text-white">{tournament.name}</h1>
            </div>

            {isConfirmedParticipant ? (
              <>
                {/* WHATSAPP GROUP CHAT LINK — SQUAD TOURNAMENTS ONLY */}
                {tournament.type === 'SQUAD' && (
                  <div className="p-5 rounded-2xl bg-[#25D366]/10 border border-[#25D366]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg shadow-[#25D366]/5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#25D366] text-white flex items-center justify-center font-bold shadow-lg shadow-[#25D366]/30 flex-shrink-0">
                        <MessageCircle className="w-6 h-6 fill-current" />
                      </div>
                      <div>
                        <h4 className="text-xs sm:text-sm font-extrabold text-white uppercase tracking-wider">
                          Official Match WhatsApp Group
                        </h4>
                        <p className="text-[11px] text-gray-300 mt-0.5">
                          Join to connect with match host &amp; receive instant room code alerts.
                        </p>
                      </div>
                    </div>
                    <a
                      href={tournament.whatsappLink || 'https://chat.whatsapp.com'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#20ba5a] text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md shadow-[#25D366]/30 flex-shrink-0"
                    >
                      <span>Join Group</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                )}

                {/* ROOM CODE DETAILS */}
                <div className="p-6 rounded-2xl bg-[#121722] border border-[#262F45] space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                      {tournament.roomAccessGranted ? (
                        <Unlock className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Lock className="w-4 h-4 text-[#FF2E4C]" />
                      )}
                      Match Lobby Room Code
                    </h3>
                    {tournament.roomReleased && (
                      <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                        Released
                      </span>
                    )}
                  </div>

                  {tournament.roomAccessGranted && tournament.roomId ? (
                    <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/40 space-y-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-300">Room ID:</span>
                        <div className="flex items-center gap-2 font-mono text-base font-extrabold text-emerald-400">
                          <span>{tournament.roomId}</span>
                          <button
                            onClick={() => copyToClipboard(tournament.roomId, 'room')}
                            className="p-1 rounded bg-[#0B0E14] text-gray-300 hover:text-white"
                          >
                            {copiedRoom ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs pt-2 border-t border-emerald-500/20">
                        <span className="text-gray-300">Room Password:</span>
                        <div className="flex items-center gap-2 font-mono text-base font-extrabold text-emerald-400">
                          <span>{tournament.roomPassword}</span>
                          <button
                            onClick={() => copyToClipboard(tournament.roomPassword, 'pass')}
                            className="p-1 rounded bg-[#0B0E14] text-gray-300 hover:text-white"
                          >
                            {copiedPass ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl bg-[#0B0E14] border border-[#262F45] text-center space-y-2">
                      <Lock className="w-8 h-8 text-gray-600 mx-auto" />
                      <div className="text-xs font-bold text-gray-300">
                        {!tournament.roomReleased
                          ? 'Room details have not been released by Admin yet.'
                          : 'Room code releasing shortly.'}
                      </div>
                      <p className="text-[11px] text-gray-500">
                        Room details are automatically unlocked here 15 minutes before start time once released by Admin.
                      </p>
                    </div>
                  )}
                </div>

                {/* TOURNAMENT RULES — ONLY SHOWN AFTER PAYMENT CONFIRMATION */}
                <div className="p-6 rounded-2xl bg-[#121722] border border-emerald-500/30 space-y-4 shadow-lg shadow-emerald-500/5">
                  <div className="flex items-center justify-between pb-3 border-b border-[#262F45]">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <Shield className="w-4 h-4 text-emerald-400" />
                      Official Tournament Rules & Guidelines
                    </h3>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 uppercase tracking-wider flex items-center gap-1">
                      <Check className="w-3 h-3 stroke-[3]" /> Paid & Unlocked
                    </span>
                  </div>

                  {tournament.rules ? (
                    <div className="text-xs text-gray-300 leading-relaxed whitespace-pre-line bg-[#0B0E14] p-4 rounded-xl border border-[#262F45]">
                      {tournament.rules}
                    </div>
                  ) : (
                    <div className="space-y-3 text-xs text-gray-300">
                      <div className="p-3.5 rounded-xl bg-[#0B0E14] border border-[#262F45] space-y-1">
                        <div className="font-bold text-white flex items-center gap-1.5">
                          <span className="text-[#FF2E4C] font-mono">1.</span> Punctuality & Lobby Entry
                        </div>
                        <p className="text-gray-400 leading-snug">
                          Room ID and Password are disclosed 15 minutes before match start. Players must join their assigned slot immediately. Delaying match start is prohibited.
                        </p>
                      </div>

                      <div className="p-3.5 rounded-xl bg-[#0B0E14] border border-[#262F45] space-y-1">
                        <div className="font-bold text-white flex items-center gap-1.5">
                          <span className="text-[#FF2E4C] font-mono">2.</span> Anti-Cheat & Fair Play Policy
                        </div>
                        <p className="text-gray-400 leading-snug">
                          Use of any hacks, scripts, modified APKs, or third-party tools will result in permanent account ban and immediate forfeiture of entry fee & prize pool.
                        </p>
                      </div>

                      <div className="p-3.5 rounded-xl bg-[#0B0E14] border border-[#262F45] space-y-1">
                        <div className="font-bold text-white flex items-center gap-1.5">
                          <span className="text-[#FF2E4C] font-mono">3.</span> Confidential Credentials
                        </div>
                        <p className="text-gray-400 leading-snug">
                          Sharing Room ID or Password with non-registered players will lead to immediate squad disqualification without refund.
                        </p>
                      </div>

                      <div className="p-3.5 rounded-xl bg-[#0B0E14] border border-[#262F45] space-y-1">
                        <div className="font-bold text-white flex items-center gap-1.5">
                          <span className="text-[#FF2E4C] font-mono">4.</span> Match Proof & Winnings Payout
                        </div>
                        <p className="text-gray-400 leading-snug">
                          Team captains must capture a clear end-game screenshot of the leaderboard. Winnings will be auto-credited to your Karma Scrims wallet within 30 minutes.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : null}

            {/* ================================================== */}
            {/* 🏆 POINT TABLE SECTION (SQUAD VS SOLO BEHAVIOR)    */}
            {/* ================================================== */}
            {tournament.type === 'SQUAD' ? (
              /* 1. SQUAD POINT TABLE — SHOWS ALL REGISTERED TEAMS */
              <div className="p-6 rounded-3xl bg-[#121722] border border-[#FF2E4C]/40 space-y-4 shadow-xl shadow-[#FF2E4C]/5">
                <div className="flex items-center justify-between pb-3 border-b border-[#262F45]">
                  <h3 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-[#FF9F1C]" />
                    <span>🏆 POINT TABLE</span>
                  </h3>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-[#0B0E14] px-2.5 py-1 rounded-lg border border-[#262F45]">
                    Official Squad Standings
                  </span>
                </div>

                {(() => {
                  const squadRegs = (tournament.registrations || [])
                    .filter((r: any) => r.team || r.status === 'CONFIRMED')
                    .sort((a: any, b: any) => {
                      if (a.rank && b.rank) return a.rank - b.rank;
                      return (b.points || 0) - (a.points || 0);
                    });

                  if (squadRegs.length === 0) {
                    return (
                      <p className="text-xs text-gray-500 py-6 text-center italic">
                        Point table standings will appear once match scores are processed.
                      </p>
                    );
                  }

                  return (
                    <div className="overflow-x-auto rounded-xl border border-[#262F45]">
                      <table className="w-full text-left text-xs text-gray-300">
                        <thead className="bg-[#0B0E14] text-[#FF9F1C] uppercase text-[10px] font-bold border-b border-[#262F45]">
                          <tr>
                            <th className="p-3 w-16">#</th>
                            <th className="p-3">TEAM</th>
                            <th className="p-3 text-right">POINTS</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#262F45]">
                          {squadRegs.map((reg: any, idx: number) => {
                            const rankNum = reg.rank || idx + 1;
                            const teamName = reg.team?.name || reg.user?.name || 'Squad';
                            const pointsVal = reg.points || 0;

                            const isTop1 = rankNum === 1;
                            const isTop2 = rankNum === 2;
                            const isTop3 = rankNum === 3;

                            return (
                              <tr
                                key={reg.id}
                                className={`transition-colors ${
                                  isTop1
                                    ? 'bg-[#FF2E4C]/10 hover:bg-[#FF2E4C]/20 border-l-4 border-l-[#FF2E4C]'
                                    : isTop2
                                    ? 'bg-slate-800/40 hover:bg-slate-800/60 border-l-4 border-l-slate-400'
                                    : isTop3
                                    ? 'bg-amber-950/20 hover:bg-amber-950/40 border-l-4 border-l-amber-500'
                                    : 'hover:bg-[#1A2234]'
                                }`}
                              >
                                <td className="p-3 font-mono font-black text-sm">
                                  <span
                                    className={`inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-black ${
                                      isTop1
                                        ? 'bg-[#FF2E4C] text-white shadow-md shadow-[#FF2E4C]/30'
                                        : isTop2
                                        ? 'bg-slate-400 text-slate-950 shadow-md'
                                        : isTop3
                                        ? 'bg-amber-500 text-slate-950 shadow-md'
                                        : 'bg-[#0B0E14] text-gray-400 border border-[#262F45]'
                                    }`}
                                  >
                                    #{rankNum}
                                  </span>
                                </td>

                                <td className="p-3 font-bold text-white text-xs sm:text-sm">
                                  <div className="flex items-center gap-2">
                                    <span>{teamName}</span>
                                    {isTop1 && <span className="text-xs">👑</span>}
                                  </div>
                                </td>

                                <td className="p-3 text-right font-mono font-black text-sm text-[#FF9F1C]">
                                  <span className="px-3 py-1 rounded-lg bg-[#0B0E14] border border-[#262F45]">
                                    {pointsVal} PTS
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  );
                })()}
              </div>
            ) : isConfirmedParticipant ? (
              /* 2. SOLO POINT TABLE — SHOWS ONLY LOGGED-IN PLAYER'S OWN POINTS & POSITION */
              <div className="p-6 rounded-3xl bg-[#121722] border border-amber-500/40 space-y-4 shadow-xl shadow-amber-500/5">
                <div className="flex items-center justify-between pb-3 border-b border-[#262F45]">
                  <h3 className="text-sm font-extrabold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-amber-400" />
                    <span>🏆 MY POINTS</span>
                  </h3>
                  <span className="text-[10px] font-black uppercase tracking-widest bg-amber-500/10 text-amber-400 px-2.5 py-1 rounded-lg border border-amber-500/30">
                    Private Player Standings
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* POSITION */}
                  <div className="p-4 rounded-2xl bg-[#0B0E14] border border-amber-500/30 text-center space-y-1">
                    <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      YOUR POSITION / RANK
                    </span>
                    <span className="text-3xl font-black font-mono text-amber-400 block">
                      #{userRegistration?.rank || '—'}
                    </span>
                  </div>

                  {/* PLAYER */}
                  <div className="p-4 rounded-2xl bg-[#0B0E14] border border-[#262F45] text-center space-y-1">
                    <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      PLAYER NAME
                    </span>
                    <span className="text-base font-extrabold text-white block truncate">
                      {userRegistration?.user?.name || currentUser?.name || 'Solo Participant'}
                    </span>
                    <span className="text-[10px] font-mono text-gray-400 block">
                      UID: {userRegistration?.user?.freeFireUid || currentUser?.freeFireUid || 'N/A'}
                    </span>
                  </div>

                  {/* POINTS */}
                  <div className="p-4 rounded-2xl bg-[#0B0E14] border border-emerald-500/30 text-center space-y-1">
                    <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      YOUR TOTAL POINTS
                    </span>
                    <span className="text-3xl font-black font-mono text-emerald-400 block">
                      {userRegistration?.points || 0}
                    </span>
                  </div>
                </div>
              </div>
            ) : null}

            {/* OFFICIAL MATCH RESULTS & LEADERBOARD DASHBOARD */}
            {tournament.matches && tournament.matches.some((m: any) => m.results?.length > 0) && (
              <div className="p-6 rounded-3xl bg-[#121722] border border-[#FF9F1C]/40 space-y-5 shadow-xl shadow-[#FF9F1C]/5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#262F45] gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl bg-[#FF9F1C]/10 text-[#FF9F1C] flex items-center justify-center font-bold border border-[#FF9F1C]/30">
                      <Trophy className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-black uppercase text-white tracking-wider flex items-center gap-2">
                        Official Match Leaderboard & Standings
                      </h3>
                      <p className="text-[11px] text-gray-400">
                        {isFullMap ? 'Verified Full Map Standings' : 'Verified Clash Squad Results'}
                      </p>
                    </div>
                  </div>

                  <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 w-max">
                    Official Results Published
                  </span>
                </div>

                {tournament.matches.map((matchItem: any) => {
                  if (!matchItem.results || matchItem.results.length === 0) return null;

                  const isSquad = tournament.type !== 'SOLO';

                  return (
                    <div key={matchItem.id} className="space-y-3">
                      <div className="text-xs font-extrabold text-[#FF9F1C] uppercase tracking-wider flex items-center justify-between bg-[#0B0E14] px-3.5 py-2 rounded-xl border border-[#262F45]">
                        <span>Match #{matchItem.matchNumber} Standings</span>
                        <span className="text-[10px] text-gray-400 font-normal">
                          {isSquad ? 'Points Table Breakdown' : 'Individual Cash Reward Breakdown'}
                        </span>
                      </div>

                      <div className="overflow-x-auto rounded-xl border border-[#262F45]">
                        <table className="w-full text-left text-xs text-gray-300">
                          <thead className="bg-[#0B0E14] text-[#FF9F1C] uppercase text-[10px] font-bold border-b border-[#262F45]">
                            <tr>
                              <th className="p-3">Rank</th>
                              <th className="p-3">{isSquad ? 'Team Name' : 'Player Name'}</th>
                              <th className="p-3">Kills</th>
                              {isSquad ? (
                                <>
                                  <th className="p-3">Placement Points</th>
                                  <th className="p-3">Other Applicable Points</th>
                                  <th className="p-3">Total Points</th>
                                  <th className="p-3">Winning Amount</th>
                                </>
                              ) : (
                                <>
                                  <th className="p-3">Scoring Type</th>
                                  <th className="p-3">Winning Amount</th>
                                </>
                              )}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#262F45]">
                            {matchItem.results.map((res: any) => {
                              const rankDisplay = `#${res.placement}`;
                              const entityName = isSquad 
                                ? (res.team?.name || 'Squad') 
                                : (res.user?.name || res.user?.username || 'Solo Player');
                              const subText = isSquad
                                ? `Captain: ${res.team?.captain?.name || 'N/A'}`
                                : `UID: ${res.user?.freeFireUid || 'N/A'}`;

                              return (
                                <tr key={res.id} className="hover:bg-[#1A2234] transition-colors">
                                  <td className="p-3 font-mono font-black text-white text-sm">
                                    <span className={`inline-block px-2.5 py-0.5 rounded ${
                                      res.placement === 1 ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 font-extrabold' :
                                      res.placement === 2 ? 'bg-slate-400/20 text-slate-300 border border-slate-400/40' :
                                      res.placement === 3 ? 'bg-amber-700/20 text-amber-500 border border-amber-700/40' : 'text-gray-400'
                                    }`}>
                                      {rankDisplay}
                                    </span>
                                  </td>

                                  <td className="p-3 font-bold text-white">
                                    <div>{entityName}</div>
                                    <div className="text-[10px] text-gray-400 font-normal">{subText}</div>
                                  </td>

                                  <td className="p-3 font-mono font-bold text-gray-200">
                                    {res.kills}
                                  </td>

                                  {isSquad ? (
                                    <>
                                      <td className="p-3 font-mono text-gray-300 font-bold">
                                        {res.placementPoints}
                                      </td>

                                      <td className="p-3 font-mono text-gray-400 font-medium">
                                        {res.otherPoints || 0}
                                      </td>

                                      <td className="p-3 font-mono text-[#FF9F1C] font-extrabold text-sm">
                                        {res.totalPoints} pts
                                      </td>

                                      <td className="p-3 font-mono text-emerald-400 font-black text-sm">
                                        {res.winningAmount > 0 ? `Rs. ${res.winningAmount.toLocaleString()}` : '—'}
                                      </td>
                                    </>
                                  ) : (
                                    <>
                                      <td className="p-3 text-[11px] text-gray-300 font-semibold">
                                        {tournament.soloScoringType || 'PER_KILL'}
                                      </td>

                                      <td className="p-3 font-mono text-emerald-400 font-black text-sm">
                                        {res.winningAmount > 0 ? `Rs. ${res.winningAmount.toLocaleString()}` : '—'}
                                      </td>
                                    </>
                                  )}
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* REGISTERED TEAMS ROSTER */}
            <div className="p-6 rounded-2xl bg-[#121722] border border-[#262F45] space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Users className="w-4 h-4 text-emerald-400" />
                  Registered Participants ({tournament.registrations?.length || 0})
                </h3>
              </div>

              {tournament.registrations?.length === 0 ? (
                <p className="text-xs text-gray-500 py-4 text-center">No squads registered yet. Be the first to register!</p>
              ) : (
                <div className="divide-y divide-[#262F45]">
                  {tournament.registrations.map((reg: any, idx: number) => (
                    <div key={reg.id} className="py-3 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-[#0B0E14] text-gray-400 font-bold flex items-center justify-center text-[10px]">
                          {idx + 1}
                        </span>
                        <div className="font-bold text-white">
                          {reg.team?.name || reg.user?.name || 'Solo Participant'}
                        </div>
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        reg.status === 'CONFIRMED' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                      }`}>
                        {reg.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Right Column: Registration Card & ROOM DETAILS */}
          <div className="space-y-6">
            
            {/* Registration Action Card */}
            <div className="p-6 rounded-2xl bg-[#121722] border border-[#262F45] space-y-6">
              
              <div className="grid grid-cols-2 gap-3 p-4 rounded-xl bg-[#0B0E14] border border-[#262F45]">
                <div>
                  <span className="block text-[10px] text-gray-400 uppercase font-semibold">Prize Pool</span>
                  <span className="text-lg font-extrabold text-[#FF9F1C] flex items-center gap-1">
                    <Trophy className="w-4 h-4 shrink-0" />
                    <span>
                      🪙 {(() => {
                        const isSolo = tournament.type === 'SOLO' || tournament.format === 'SOLO' || tournament.name?.toUpperCase().includes('SOLO');
                        if (isSolo) {
                          if (tournament.soloScoringType === 'PER_KILL') {
                            return `${tournament.soloKillReward || 0} / KILL`;
                          }
                          if (tournament.soloScoringType === 'SURVIVAL') {
                            return `${((tournament.entryFee || 0) * 2).toLocaleString()}`;
                          }
                          if (tournament.soloScoringType === 'KILL_AND_SURVIVAL') {
                            return `${tournament.soloKillReward || 0}/KILL + 🪙 ${((tournament.entryFee || 0) * 2).toLocaleString()}`;
                          }
                          if (tournament.soloKillReward && tournament.soloKillReward > 0) {
                            return `${tournament.soloKillReward} / KILL`;
                          }
                          const doubleFee = (tournament.entryFee || 0) * 2;
                          return doubleFee > 0 ? doubleFee.toLocaleString() : tournament.prizePool.toLocaleString();
                        }
                        return tournament.prizePool ? tournament.prizePool.toLocaleString() : '0';
                      })()}
                    </span>
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] text-gray-400 uppercase font-semibold">Entry Fee</span>
                  <span className="text-lg font-extrabold text-white flex items-center gap-1">
                    {tournament.entryFee === 0 ? 'FREE' : `🪙 ${tournament.entryFee}`}
                  </span>
                </div>
              </div>

              {/* Timing */}
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between text-gray-300">
                  <span className="text-gray-400 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-[#FF2E4C]" /> Date:
                  </span>
                  <span className="font-bold text-white">{tournament.date}</span>
                </div>
                <div className="flex items-center justify-between text-gray-300">
                  <span className="text-gray-400 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-[#FF9F1C]" /> Start Time:
                  </span>
                  <span className="font-bold text-white">{tournament.startTime}</span>
                </div>
              </div>

              {/* Tournament Maps */}
              <div className="p-3 rounded-xl bg-[#0B0E14] border border-[#262F45] space-y-1.5">
                <div className="text-[10px] font-black uppercase text-gray-400 tracking-wider flex items-center gap-1">
                  <Compass className="w-3.5 h-3.5 text-[#FF9F1C]" />
                  Tournament Maps
                </div>
                {(() => {
                  let mapsList: string[] = [];
                  if (Array.isArray(tournament.maps)) mapsList = tournament.maps;
                  else if (typeof tournament.maps === 'string') {
                    try {
                      const p = JSON.parse(tournament.maps);
                      if (Array.isArray(p)) mapsList = p;
                      else mapsList = tournament.maps.split(',').map((m: string) => m.trim());
                    } catch (e) {
                      mapsList = tournament.maps.split(',').map((m: string) => m.trim());
                    }
                  }
                  if (mapsList.length === 0) {
                    return <div className="text-xs text-gray-500 italic">Map details coming soon</div>;
                  }
                  return (
                    <div className="flex flex-wrap gap-1.5">
                      {mapsList.map((mapName: string) => (
                        <span key={mapName} className="px-2 py-0.5 rounded-lg bg-[#121722] border border-[#262F45] text-xs font-bold text-white">
                          🗺️ {mapName}
                        </span>
                      ))}
                    </div>
                  );
                })()}
              </div>

              {/* Slot Bar */}
              <div>
                <div className="flex justify-between items-center text-xs mb-1.5">
                  <span className="text-gray-400">Slot Fill Progress</span>
                  <span className="font-bold text-white">{tournament.registeredSlots} / {tournament.totalSlots}</span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-[#0B0E14] overflow-hidden border border-[#262F45]">
                  <div
                    className="h-full bg-gradient-to-r from-[#FF2E4C] to-[#FF9F1C]"
                    style={{ width: `${percentageFull}%` }}
                  />
                </div>
              </div>

              {/* User Status / Register Button */}
              {userRegistration ? (
                <div className="p-3.5 rounded-xl bg-[#0B0E14] border border-[#262F45] text-xs text-center space-y-1">
                  <div className="font-bold text-white">Your Registration Status:</div>
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                    userRegistration.status === 'CONFIRMED'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                  }`}>
                    {userRegistration.status}
                  </span>
                </div>
              ) : (
                <button
                  onClick={() => setIsModalOpen(true)}
                  disabled={tournament.status !== 'REGISTRATION_OPEN' || tournament.registeredSlots >= tournament.totalSlots}
                  className="w-full py-3.5 rounded-xl glow-btn-red text-white text-xs font-bold uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {tournament.registeredSlots >= tournament.totalSlots
                    ? 'Slots Full'
                    : tournament.status !== 'REGISTRATION_OPEN'
                    ? `Registration ${tournament.status}`
                    : 'Register Now & Submit Fonepay'}
                </button>
              )}

            </div>


          </div>

        </div>

      </main>

      {/* FLOATING CIRCULAR WHATSAPP BUTTON FOR CONFIRMED PAID PLAYERS */}
      {isConfirmedParticipant && (
        <a
          href={tournament.whatsappLink || 'https://chat.whatsapp.com'}
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-20 md:bottom-8 right-5 sm:right-8 z-50 w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#25D366] hover:bg-[#20ba5a] text-white flex items-center justify-center shadow-2xl shadow-[#25D366]/50 hover:scale-110 transition-all duration-300"
          title="Join Official Tournament WhatsApp Group Chat"
        >
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white text-[#25D366] flex items-center justify-center shadow-inner">
            <MessageCircle className="w-5 h-5 sm:w-5 sm:h-5 fill-current" />
          </div>
        </a>
      )}

      {/* REGISTRATION & FONEPAY MODAL */}
      <RegistrationModal
        tournament={tournament}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          setIsModalOpen(false);
          fetchTournament();
        }}
      />

      <Footer />
    </div>
  );
}
