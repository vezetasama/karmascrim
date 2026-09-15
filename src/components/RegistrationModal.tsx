'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { X, ShieldCheck, QrCode, CheckCircle2, AlertCircle, Plus, Users, ArrowRight, ArrowLeft, Wallet, PlusCircle, Sparkles, Loader2 } from 'lucide-react';

interface RegistrationModalProps {
  tournament: {
    id: string;
    name: string;
    category: string;
    format: string;
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

  // Wallet State
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [fetchingWallet, setFetchingWallet] = useState<boolean>(true);

  // New Team Form State
  const [newTeamName, setNewTeamName] = useState('');
  const [player1Uid, setPlayer1Uid] = useState('');
  const [player1Name, setPlayer1Name] = useState('');
  const [player2Uid, setPlayer2Uid] = useState('');
  const [player2Name, setPlayer2Name] = useState('');
  const [player3Uid, setPlayer3Uid] = useState('');
  const [player3Name, setPlayer3Name] = useState('');
  const [player4Uid, setPlayer4Uid] = useState('');
  const [player4Name, setPlayer4Name] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [createdRegId, setCreatedRegId] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchCurrentUser();
      fetchMyTeams();
      fetchWallet();
    }
  }, [isOpen]);

  const fetchCurrentUser = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data.user || null);
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

  const handleCreateTeamSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newTeamName) {
      setError('Squad name is required.');
      return;
    }

    if (!currentUser?.freeFireUid || !currentUser?.freeFireName) {
      setError('Please update your Free Fire UID and IGN in your profile before creating a squad.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const members = [
        {
          freeFireUid: currentUser.freeFireUid,
          freeFireName: currentUser.freeFireName,
          role: 'CAPTAIN',
        },
      ];

      const res = await fetch('/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newTeamName,
          category: tournament.category,
          members,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to create squad');
        setLoading(false);
        return;
      }

      setMyTeams([data.team, ...myTeams]);
      setSelectedTeamId(data.team.id);
      setShowCreateTeam(false);
    } catch (e) {
      setError('Something went wrong creating squad');
    } finally {
      setLoading(false);
    }
  };

  const handleProceedToPayment = async () => {
    if (tournament.category === 'FULL_MAP' && !selectedTeamId && !showCreateTeam) {
      setError('Please select or create a squad for Full Map tournament.');
      return;
    }
    setError(null);
    setStep(2);
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
          teamId: selectedTeamId || null,
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
              <span className="text-[11px] font-bold text-[#FF2E4C] uppercase tracking-widest">
                Step {step} of 2 — Tournament Registration
              </span>
              <h2 className="text-lg sm:text-xl font-extrabold text-white mt-1">{tournament.name}</h2>
              <div className="flex items-center gap-3 text-xs text-gray-400 mt-1">
                <span>Entry Fee: <strong className="text-[#FF9F1C]">NPR {tournament.entryFee}</strong></span>
                <span>•</span>
                <span>Format: <strong>{tournament.format}</strong></span>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3.5 rounded-2xl bg-red-950/60 border border-red-500/50 text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{error}</span>
              </div>
            )}

            {/* STEP 1: SQUAD SELECTION / CREATION */}
            {step === 1 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-gray-200 uppercase tracking-wider">Select Squad Roster</h4>
                  <button
                    onClick={() => setShowCreateTeam(!showCreateTeam)}
                    className="text-xs text-[#FF2E4C] hover:underline flex items-center gap-1 font-semibold"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    {showCreateTeam ? 'Select Existing Squad' : 'Create New Squad'}
                  </button>
                </div>

                {!showCreateTeam ? (
                  myTeams.length === 0 ? (
                    <div className="p-4 text-center border border-dashed border-[#262F45] rounded-2xl">
                      <p className="text-xs text-gray-400 mb-3">You don't have any squads created yet.</p>
                      <button
                        onClick={() => setShowCreateTeam(true)}
                        className="px-4 py-2 rounded-xl bg-[#FF2E4C] text-white text-xs font-bold"
                      >
                        Create Your First Squad
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {myTeams.map((team) => (
                        <label
                          key={team.id}
                          className={`flex items-center justify-between p-3.5 rounded-2xl border cursor-pointer transition-all ${
                            selectedTeamId === team.id
                              ? 'bg-[#1A2234] border-[#FF2E4C] text-white'
                              : 'bg-[#0B0E14] border-[#262F45] text-gray-300 hover:border-gray-600'
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
                              <div className="font-bold text-sm">{team.name}</div>
                              <div className="text-[11px] text-gray-400">{team.members?.length || 0} Members Registered</div>
                            </div>
                          </div>
                          <Users className="w-4 h-4 text-gray-400" />
                        </label>
                      ))}
                    </div>
                  )
                ) : (
                  /* CREATE NEW SQUAD FORM */
                  <form onSubmit={handleCreateTeamSubmit} className="space-y-3 p-4 bg-[#0B0E14] border border-[#262F45] rounded-2xl">
                    <div>
                      <label className="block text-[11px] text-gray-400 mb-1">Squad Name *</label>
                      <input
                        type="text"
                        placeholder="e.g. KARMA TITANS"
                        value={newTeamName}
                        onChange={(e) => setNewTeamName(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-[#121722] border border-[#262F45] text-xs text-white focus:outline-none focus:border-[#FF2E4C]"
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-2.5 rounded-xl bg-[#FF2E4C] text-white text-xs font-bold uppercase tracking-wider"
                    >
                      {loading ? 'Saving Squad...' : 'Save & Select Squad'}
                    </button>
                  </form>
                )}

                <div className="pt-4 flex justify-end">
                  <button
                    onClick={handleProceedToPayment}
                    className="px-6 py-3 rounded-2xl bg-[#FF2E4C] text-white text-xs font-black uppercase tracking-wider hover:bg-[#D61F3B] flex items-center gap-2 shadow-lg shadow-[#FF2E4C]/30"
                  >
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
                        NPR {(walletBalance ?? 0).toLocaleString()}
                      </span>
                    )}
                  </div>

                  <div className="flex items-baseline justify-between text-xs pt-1">
                    <span className="text-gray-400">Tournament Entry Fee:</span>
                    <span className="font-extrabold text-white text-base">NPR {tournament.entryFee}</span>
                  </div>

                  <div className="flex items-baseline justify-between text-xs pt-1 border-t border-[#262F45]">
                    <span className="text-gray-400">Wallet Balance After Payment:</span>
                    <span className={`font-mono font-bold text-sm ${hasSufficientBalance ? 'text-emerald-400' : 'text-red-400'}`}>
                      NPR {((walletBalance ?? 0) - tournament.entryFee).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Insufficient Balance Notice & Add Money Link */}
                {!hasSufficientBalance && (
                  <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/50 space-y-3">
                    <div className="flex items-start gap-2.5 text-xs text-amber-300">
                      <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-bold uppercase text-[11px]">Insufficient Wallet Balance</div>
                        <p className="mt-0.5">
                          You need <strong>NPR {tournament.entryFee - (walletBalance ?? 0)}</strong> more to register for this tournament. Please top up your wallet via Fonepay.
                        </p>
                      </div>
                    </div>

                    <Link
                      href="/wallet/add-money"
                      onClick={onClose}
                      className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#FF9F1C] to-[#e08912] text-slate-950 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md"
                    >
                      <PlusCircle className="w-4 h-4" />
                      <span>Add Money via Fonepay Now</span>
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
                    <span>Confirm & Pay NPR {tournament.entryFee}</span>
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
