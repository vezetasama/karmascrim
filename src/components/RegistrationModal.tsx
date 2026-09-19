'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { X, ShieldCheck, QrCode, CheckCircle2, AlertCircle, Plus, Users, ArrowRight, ArrowLeft, Wallet, PlusCircle, Sparkles, Loader2, User, Hash, Shield } from 'lucide-react';

interface RegistrationModalProps {
  tournament: {
    id: string;
    name: string;
    category: string;
    format: string;
    type?: string;
    entryFee: number;
  };
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function RegistrationModal({ tournament, isOpen, onClose, onSuccess }: RegistrationModalProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [myTeams, setMyTeams] = useState<any[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Player Details State (Required for both Solo & Squad)
  const [userIgn, setUserIgn] = useState('');
  const [userUid, setUserUid] = useState('');

  // Wallet State
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [fetchingWallet, setFetchingWallet] = useState<boolean>(true);

  // New Team Form State
  const [newTeamName, setNewTeamName] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [createdRegId, setCreatedRegId] = useState('');

  const isSolo =
    tournament.type === 'SOLO' ||
    tournament.format?.toLowerCase() === 'solo' ||
    tournament.name?.toUpperCase().includes('SOLO');

  useEffect(() => {
    if (isOpen) {
      fetchCurrentUser();
      if (!isSolo) {
        fetchMyTeams();
      }
      fetchWallet();
    }
  }, [isOpen]);

  const fetchCurrentUser = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          setCurrentUser(data.user);
          setUserIgn(data.user.freeFireName || '');
          setUserUid(data.user.freeFireUid || '');
        }
      }
    } catch (e) {
      setCurrentUser(null);
    }
  };

  const fetchWallet = async () => {
    setFetchingWallet(true);
    try {
      const res = await fetch('/api/wallet');
      if (res.ok) {
        const data = await res.json();
        setWalletBalance(data.balance ?? 0);
      }
    } catch (e) {
      setWalletBalance(0);
    } finally {
      setFetchingWallet(false);
    }
  };

  const fetchMyTeams = async () => {
    try {
      const res = await fetch('/api/teams');
      const data = await res.json();
      if (data.teams) {
        setMyTeams(data.teams);
        if (data.teams.length > 0) {
          setSelectedTeamId(data.teams[0].id);
        } else {
          setShowCreateTeam(true);
        }
      }
    } catch (e) {}
  };

  const handleProceedToPayment = async () => {
    setError(null);

    // 1. Mandatory Validation: IGN & UID are required for ALL tournaments
    if (!userIgn.trim()) {
      setError('In-Game Name (IGN) is required to register.');
      return;
    }
    if (!userUid.trim()) {
      setError('Free Fire UID is required to register.');
      return;
    }

    // 2. Mandatory Validation for Squad Tournaments: Team Name required
    if (!isSolo) {
      if (showCreateTeam) {
        if (!newTeamName.trim()) {
          setError('Team Name is required for squad tournaments.');
          return;
        }
      } else if (!selectedTeamId && myTeams.length > 0) {
        setError('Please select or create a squad for this tournament.');
        return;
      }
    }

    setLoading(true);

    try {
      // Save/update IGN and UID in user profile first
      await fetch('/api/auth/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          freeFireName: userIgn.trim(),
          freeFireUid: userUid.trim(),
        }),
      });

      // If Squad tournament and user entered a new team name, create squad now
      let finalTeamId = selectedTeamId;
      if (!isSolo && showCreateTeam) {
        const teamRes = await fetch('/api/teams', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: newTeamName.trim(),
            category: tournament.category,
            members: [
              {
                freeFireUid: userUid.trim(),
                freeFireName: userIgn.trim(),
                role: 'CAPTAIN',
              },
            ],
          }),
        });

        const teamData = await teamRes.json();
        if (!teamRes.ok) {
          setError(teamData.error || 'Failed to create squad');
          setLoading(false);
          return;
        }
        finalTeamId = teamData.team.id;
        setSelectedTeamId(finalTeamId);
      }

      setStep(2);
    } catch (e) {
      setError('Failed to update registration details');
    } finally {
      setLoading(false);
    }
  };

  // Instant Registration via Wallet Balance
  const handleRegisterViaWallet = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);
    setError(null);

    try {
      const regRes = await fetch('/api/registrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tournamentId: tournament.id,
          teamId: isSolo ? null : (selectedTeamId || null),
        }),
      });

      const regData = await regRes.json();
      if (!regRes.ok) {
        setError(regData.error || 'Registration failed');
        setLoading(false);
        return;
      }

      setCreatedRegId(regData.registration.registrationId);
      setRegistrationSuccess(true);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('balanceUpdated'));
      }
      onSuccess();
    } catch (e) {
      setError('Failed to submit tournament registration');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const hasSufficientBalance = (walletBalance ?? 0) >= tournament.entryFee;
  const isProceedDisabled = loading || !userIgn.trim() || !userUid.trim() || (!isSolo && showCreateTeam && !newTeamName.trim());

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-[#121722] border border-[#262F45] w-full max-w-xl rounded-3xl p-6 shadow-2xl relative my-8">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl bg-[#0B0E14] text-gray-400 hover:text-white border border-[#262F45]"
        >
          <X className="w-5 h-5" />
        </button>

        {registrationSuccess ? (
          /* SUCCESS SCREEN */
          <div className="text-center py-8 space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-black text-white uppercase tracking-wider">
              Tournament Slot Confirmed!
            </h3>
            <p className="text-xs text-gray-300 max-w-md mx-auto">
              Your registration ID is <span className="font-mono text-[#FF9F1C] font-bold">{createdRegId}</span>. Entry fee was debited from your wallet.
            </p>
            <div className="p-4 rounded-2xl bg-[#0B0E14] border border-[#262F45] text-xs text-gray-400 space-y-1.5 text-left">
              <div className="font-bold text-white uppercase text-[11px]">Match Lobby Details:</div>
              <div>• Status: <span className="text-emerald-400 font-bold">Confirmed</span></div>
              <div>• Room ID & Password will be released in your <span className="text-[#FF2E4C] font-bold">User Dashboard</span> 15 mins before match start.</div>
            </div>
            <button
              onClick={onClose}
              className="w-full py-3 rounded-2xl bg-[#FF2E4C] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#D61F3B]"
            >
              Go to User Dashboard
            </button>
          </div>
        ) : (
          /* REGISTRATION FORM STEPS */
          <div>
            <div className="mb-6">
              <div className="flex items-center gap-3 text-xs text-gray-400 mt-1">
                <span>Entry Fee: <strong className="text-[#FF9F1C]">🪙 {tournament.entryFee} COIN</strong></span>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3.5 rounded-2xl bg-red-950/60 border border-red-500/50 text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{error}</span>
              </div>
            )}

            {/* STEP 1: PLAYER & SQUAD DETAILS */}
            {step === 1 && (
              <div className="space-y-4">
                
                {/* PLAYER IN-GAME DETAILS (REQUIRED FOR SOLO & SQUAD) */}
                <div className="p-4 rounded-2xl bg-[#0B0E14] border border-[#262F45] space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-gray-200 uppercase tracking-wider border-b border-[#262F45] pb-2">
                    <User className="w-4 h-4 text-[#FF2E4C]" />
                    <span>Player In-Game Info</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] text-gray-400 mb-1">Free Fire UID</label>
                      <input
                        type="text"
                        placeholder="Your Game UID (e.g. 2847102941)"
                        value={userUid}
                        onChange={(e) => setUserUid(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-[#121722] border border-[#262F45] text-xs text-white focus:outline-none focus:border-[#FF2E4C]"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] text-gray-400 mb-1">In-Game Name</label>
                      <input
                        type="text"
                        placeholder="Your Free Fire Name"
                        value={userIgn}
                        onChange={(e) => setUserIgn(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-[#121722] border border-[#262F45] text-xs text-white focus:outline-none focus:border-[#FF2E4C]"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* SQUAD SELECTION / TEAM NAME (REQUIRED ONLY FOR SQUAD TOURNAMENTS) */}
                {!isSolo && (
                  <div className="space-y-3 p-4 rounded-2xl bg-[#0B0E14] border border-[#262F45]">
                    <div className="flex items-center justify-between border-b border-[#262F45] pb-2">
                      <div className="flex items-center gap-2 text-xs font-bold text-gray-200 uppercase tracking-wider">
                        <Shield className="w-4 h-4 text-[#FF9F1C]" />
                        <span>Squad Team Name</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowCreateTeam(!showCreateTeam)}
                        className="text-xs text-[#FF2E4C] hover:underline flex items-center gap-1 font-semibold"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        {showCreateTeam ? 'Select Existing Squad' : 'Create New Squad'}
                      </button>
                    </div>

                    {!showCreateTeam ? (
                      myTeams.length === 0 ? (
                        <div className="p-3 text-center border border-dashed border-[#262F45] rounded-xl">
                          <p className="text-xs text-gray-400 mb-2">No existing squads found.</p>
                          <button
                            type="button"
                            onClick={() => setShowCreateTeam(true)}
                            className="px-3 py-1.5 rounded-lg bg-[#FF2E4C] text-white text-xs font-bold"
                          >
                            Enter Squad Team Name
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {myTeams.map((team) => (
                            <label
                              key={team.id}
                              className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                                selectedTeamId === team.id
                                  ? 'bg-[#1A2234] border-[#FF2E4C] text-white'
                                  : 'bg-[#121722] border-[#262F45] text-gray-300 hover:border-gray-600'
                              }`}
                            >
                              <div className="flex items-center space-x-3">
                                <input
                                  type="radio"
                                  name="squadSelect"
                                  checked={selectedTeamId === team.id}
                                  onChange={() => setSelectedTeamId(team.id)}
                                  className="accent-[#FF2E4C]"
                                />
                                <div>
                                  <div className="font-bold text-xs sm:text-sm">{team.name}</div>
                                </div>
                              </div>
                              <Users className="w-4 h-4 text-gray-400" />
                            </label>
                          ))}
                        </div>
                      )
                    ) : (
                      /* NEW TEAM NAME INPUT */
                      <div>
                        <label className="block text-[11px] text-gray-400 mb-1">Squad Team Name</label>
                        <input
                          type="text"
                          placeholder="e.g. KARMA TITANS"
                          value={newTeamName}
                          onChange={(e) => setNewTeamName(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-[#121722] border border-[#262F45] text-xs text-white focus:outline-none focus:border-[#FF2E4C]"
                          required
                        />
                      </div>
                    )}
                  </div>
                )}

                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={handleProceedToPayment}
                    disabled={isProceedDisabled}
                    className="px-6 py-3 rounded-2xl bg-[#FF2E4C] hover:bg-[#D61F3B] disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-[#FF2E4C]/30"
                  >
                    {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                    <span>Proceed to Wallet Payment</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: WALLET BALANCE PAYMENT */}
            {step === 2 && (
              <form onSubmit={handleRegisterViaWallet} className="space-y-5">
                
                {/* User Wallet Info Box */}
                <div className="p-5 rounded-2xl bg-[#0B0E14] border border-[#262F45] space-y-3">
                  <div className="flex items-center justify-between border-b border-[#262F45] pb-3">
                    <div className="flex items-center gap-2">
                      <Wallet className="w-5 h-5 text-[#FF9F1C]" />
                      <span className="text-sm font-extrabold text-white uppercase">Your Karma Wallet</span>
                    </div>
                    {fetchingWallet ? (
                      <Loader2 className="w-4 h-4 text-[#FF2E4C] animate-spin" />
                    ) : (
                      <span className="text-xs font-black text-[#FF9F1C]">
                        🪙 {(walletBalance ?? 0).toLocaleString()} COIN
                      </span>
                    )}
                  </div>

                  <div className="flex items-baseline justify-between text-xs pt-1">
                    <span className="text-gray-400">Tournament Entry Fee:</span>
                    <span className="font-extrabold text-white text-base">🪙 {tournament.entryFee} COIN</span>
                  </div>

                  <div className="flex items-baseline justify-between text-xs pt-1 border-t border-[#262F45]">
                    <span className="text-gray-400">Wallet Balance After Payment:</span>
                    <span className={`font-mono font-bold text-sm ${hasSufficientBalance ? 'text-emerald-400' : 'text-red-400'}`}>
                      🪙 {((walletBalance ?? 0) - tournament.entryFee).toLocaleString()} COIN
                    </span>
                  </div>
                </div>

                {/* Summary of Registered Player / Squad */}
                <div className="p-3.5 rounded-xl bg-[#0B0E14] border border-[#262F45] text-xs space-y-1">
                  <div className="text-gray-400 font-bold uppercase text-[10px]">Registration Summary:</div>
                  <div className="text-white font-medium">• Player IGN: <strong className="text-[#FF9F1C]">{userIgn}</strong> (UID: {userUid})</div>
                  {!isSolo && (
                    <div className="text-white font-medium">• Squad Name: <strong className="text-[#FF2E4C]">{showCreateTeam ? newTeamName : (myTeams.find(t => t.id === selectedTeamId)?.name || newTeamName || 'Squad')}</strong></div>
                  )}
                </div>

                {/* Insufficient Balance Notice & Add Money Link */}
                {!hasSufficientBalance && (
                  <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/50 space-y-3">
                    <div className="flex items-start gap-2.5 text-xs text-amber-300">
                      <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-bold uppercase text-[11px]">Insufficient Wallet Balance</div>
                        <p className="mt-0.5">
                          You need <strong>{tournament.entryFee - (walletBalance ?? 0)} COIN</strong> more to register for this tournament. Please top up your wallet via Fonepay (1 RS = 1 COIN).
                        </p>
                      </div>
                    </div>

                    <Link
                      href="/wallet/add-money"
                      onClick={onClose}
                      className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#FF9F1C] to-[#e08912] text-slate-950 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md"
                    >
                      <PlusCircle className="w-4 h-4" />
                      <span>Add Money via Fonepay (1 RS = 1 COIN)</span>
                    </Link>
                  </div>
                )}

                <div className="flex items-center justify-between pt-4 border-t border-[#262F45]">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="px-4 py-2.5 rounded-xl bg-[#0B0E14] text-gray-400 hover:text-white border border-[#262F45] text-xs font-semibold flex items-center gap-1.5"
                  >
                    <ArrowLeft className="w-4 h-4" /> Back
                  </button>

                  <button
                    type="submit"
                    disabled={loading || !hasSufficientBalance}
                    className="px-6 py-3 rounded-2xl bg-[#FF2E4C] hover:bg-[#D61F3B] disabled:opacity-50 text-white text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-[#FF2E4C]/30"
                  >
                    {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                    <span>Confirm & Pay 🪙 {tournament.entryFee} COIN</span>
                  </button>
                </div>

              </form>
            )}

          </div>
        )}

      </div>
    </div>
  );
}
