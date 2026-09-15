'use client';

import React, { useState, useEffect, use } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import RegistrationModal from '@/components/RegistrationModal';
import { Calendar, Clock, Trophy, Users, Shield, Lock, Unlock, Copy, Check, AlertCircle, ArrowLeft, Compass } from 'lucide-react';
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
    <div className="min-h-screen flex flex-col bg-[#0B0E14] text-white">
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

            {isConfirmedParticipant && (
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
                        <div>
                          <div className="font-bold text-white">
                            {reg.team?.name || reg.user?.name || 'Solo Participant'}
                          </div>
                          <div className="text-[10px] text-gray-400">
                            Captain: {reg.user?.name} (UID: {reg.user?.freeFireUid || 'N/A'})
                          </div>
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
                    <Trophy className="w-4 h-4" />
                    NPR {tournament.prizePool.toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] text-gray-400 uppercase font-semibold">Entry Fee</span>
                  <span className="text-lg font-extrabold text-white">
                    {tournament.entryFee === 0 ? 'FREE' : `NPR ${tournament.entryFee}`}
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
                <div className="flex items-center justify-between text-gray-300">
                  <span className="text-gray-400">Reg Deadline:</span>
                  <span className="font-semibold text-gray-300">{tournament.registrationDeadline}</span>
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
