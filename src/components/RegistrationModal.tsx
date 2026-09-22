'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { X, CheckCircle2, AlertCircle, Plus, Users, Wallet, PlusCircle, Loader2, User, Shield } from 'lucide-react';

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
      setError(null);
      setRegistrationSuccess(false);
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

  const handleConfirmAndPay = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // 1. Mandatory Validation: IGN & UID required
    if (!userIgn.trim()) {
      setError('In-Game Name (IGN) is required to register.');
      return;
    }
    if (!userUid.trim()) {
      setError('Free Fire UID is required to register.');
      return;
    }

    // 2. Wallet Balance Check
    const currentBalance = walletBalance ?? 0;
    if (currentBalance < tournament.entryFee) {
      setError(`Insufficient wallet balance. You need ${tournament.entryFee - currentBalance} COIN more.`);
      return;
    }

    setLoading(true);

    try {
      // Save/update IGN and UID in user profile
      await fetch('/api/auth/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          freeFireName: userIgn.trim(),
          freeFireUid: userUid.trim(),
        }),
      });

      // Execute registration & wallet deduction directly
      const regRes = await fetch('/api/registrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tournamentId: tournament.id,
          teamId: null,
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
        window.dispatchEvent(new Event('karma_refresh'));
      }
      onSuccess();
    } catch (e) {
      setError('Failed to complete registration and wallet deduction.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const hasSufficientBalance = (walletBalance ?? 0) >= tournament.entryFee;
  const isSubmitDisabled =
    loading ||
    fetchingWallet ||
    !userIgn.trim() ||
    !userUid.trim() ||
    !hasSufficientBalance;

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
              Your registration ID is <span className="font-mono text-[#FF9F1C] font-bold">{createdRegId}</span>. Entry fee of 🪙 {tournament.entryFee} COIN was debited from your wallet.
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
              Close &amp; Go to Dashboard
            </button>
          </div>
        ) : (
          /* SINGLE-STEP REGISTRATION & CONFIRM & PAY FORM */
          <form onSubmit={handleConfirmAndPay} className="space-y-4">
            
            <div className="flex items-center justify-between border-b border-[#262F45] pb-3">
              <div className="text-left">
                <span className="text-[10px] text-gray-400 uppercase font-bold block">Entry Fee</span>
                <span className="text-sm font-black text-[#FF9F1C]">
                  {tournament.entryFee === 0 ? 'FREE' : `🪙 ${tournament.entryFee} COIN`}
                </span>
              </div>
              <div className="flex-1" aria-hidden="true" />
            </div>

            {error && (
              <div className="p-3.5 rounded-2xl bg-red-950/60 border border-red-500/50 text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{error}</span>
              </div>
            )}

            {/* PLAYER IN-GAME DETAILS (REQUIRED FOR SOLO & SQUAD) */}
            <div className="p-4 rounded-2xl bg-[#0B0E14] border border-[#262F45] space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-gray-200 uppercase tracking-wider border-b border-[#262F45] pb-2">
                <User className="w-4 h-4 text-[#FF2E4C]" />
                <span>Player In-Game Info</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-gray-400 mb-1">
                    Free Fire UID <span className="text-red-400">*</span>
                  </label>
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
                  <label className="block text-[11px] text-gray-400 mb-1">
                    In-Game Name (IGN) <span className="text-red-400">*</span>
                  </label>
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

            {/* INSUFFICIENT BALANCE WARNING & ADD MONEY LINK */}
            {!hasSufficientBalance && !fetchingWallet && (
              <div className="p-3.5 rounded-2xl bg-amber-950/40 border border-amber-500/50 space-y-2.5">
                <div className="flex items-start gap-2.5 text-xs text-amber-300">
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold uppercase text-[11px]">Insufficient Wallet Balance</div>
                    <p className="mt-0.5">
                      You need <strong>{tournament.entryFee - (walletBalance ?? 0)} COIN</strong> more to register.
                    </p>
                  </div>
                </div>

                <Link
                  href="/wallet/add-money"
                  onClick={onClose}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#FF9F1C] to-[#e08912] text-slate-950 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>ADD MONEY</span>
                </Link>
              </div>
            )}

            {/* CONFIRM AND PAY BUTTON */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitDisabled}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#FF2E4C] to-[#D61F3B] hover:from-[#D61F3B] hover:to-[#B5172F] disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-[#FF2E4C]/30 transition-all"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processing Payment...</span>
                  </>
                ) : (
                  <span>CONFIRM 🪙 {tournament.entryFee} COIN</span>
                )}
              </button>
            </div>

          </form>
        )}

      </div>
    </div>
  );
}
