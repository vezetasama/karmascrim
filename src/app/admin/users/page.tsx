'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users,
  Search,
  Shield,
  ShieldAlert,
  UserCheck,
  UserX,
  ArrowLeft,
  X,
  Coins,
  PlusCircle,
  MinusCircle,
  TrendingUp,
  Wallet,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [msg, setMsg] = useState<string | null>(null);

  // Coin Management Modal State
  const [coinModalOpen, setCoinModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [coinAction, setCoinAction] = useState<'ADD' | 'REDUCE'>('ADD');
  const [targetWallet, setTargetWallet] = useState<'deposit' | 'winnings'>('deposit');
  const [coinAmount, setCoinAmount] = useState<number | ''>('');
  const [coinReason, setCoinReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, [search]);

  const fetchUsers = async () => {
    try {
      const res = await fetch(`/api/admin/users?search=${encodeURIComponent(search)}`);
      const data = await res.json();
      if (data.users) {
        setUsers(data.users);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUserRoleOrStatus = async (userId: string, role?: string, status?: string) => {
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role, status }),
      });
      const data = await res.json();
      if (data.success) {
        setMsg('User account updated successfully.');
        fetchUsers();
      }
    } catch (e) {
      setMsg('Failed to update user.');
    }
  };

  const openCoinModal = (user: any) => {
    setSelectedUser(user);
    setCoinAction('ADD');
    setTargetWallet('deposit');
    setCoinAmount('');
    setCoinReason('');
    setModalError(null);
    setCoinModalOpen(true);
  };

  const handleAdjustCoins = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    const numCoins = Number(coinAmount);
    if (isNaN(numCoins) || numCoins <= 0) {
      setModalError('Please enter a valid coin amount greater than 0.');
      return;
    }

    if (!coinReason.trim()) {
      setModalError('Please provide a reason/note for this coin adjustment.');
      return;
    }

    setActionLoading(true);
    setModalError(null);

    const signedAmount = coinAction === 'ADD' ? numCoins : -numCoins;

    try {
      const res = await fetch('/api/admin/wallets/adjust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUser.id,
          amount: signedAmount,
          reason: coinReason.trim(),
          targetType: targetWallet,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setModalError(data.error || 'Failed to adjust coins.');
        setActionLoading(false);
        return;
      }

      setMsg(
        `Success! ${coinAction === 'ADD' ? 'Added' : 'Deducted'} 🪙 ${numCoins.toLocaleString()} COINS ${
          coinAction === 'ADD' ? 'to' : 'from'
        } ${selectedUser.name} (${targetWallet === 'winnings' ? 'Winnings' : 'Deposit'} Wallet).`
      );

      setCoinModalOpen(false);
      fetchUsers();
    } catch (err: any) {
      setModalError('Server error while adjusting user coins.');
    } finally {
      setActionLoading(false);
    }
  };

  // Calculate System Total Wallet Balances
  const totalSystemBalance = users.reduce((acc, u) => acc + (u.wallet?.balance || 0), 0);
  const totalDepositBalance = users.reduce((acc, u) => acc + (u.wallet?.depositBalance || 0), 0);
  const totalWinningsBalance = users.reduce((acc, u) => acc + (u.wallet?.winningsBalance || 0), 0);

  return (
    <main className="py-4 sm:py-8 max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 w-full">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div>
          <Link href="/admin" className="text-xs text-gray-400 hover:text-white flex items-center gap-1 mb-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Admin Overview
          </Link>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black uppercase text-white">User Accounts & Coin Management</h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-400 border border-amber-500/40">
              Wallet Control
            </span>
          </div>
          <p className="text-xs text-gray-400">View player credentials, add/deduct user coin balances, and manage account roles.</p>
        </div>
      </div>

      {msg && (
        <div className="mb-6 p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-400 text-xs flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-semibold">{msg}</span>
          </div>
          <button onClick={() => setMsg(null)} className="p-1 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* METRIC STAT CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="p-4 rounded-2xl bg-[#121722] border border-[#262F45]">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Registered Players</span>
          <div className="text-2xl font-extrabold text-white mt-1">
            {users.length} <span className="text-xs text-gray-400 font-normal">Users</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#121722] border border-amber-500/40 bg-gradient-to-b from-amber-500/5 to-transparent">
          <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">Total System Coin Holdings</span>
          <div className="text-2xl font-extrabold text-amber-400 mt-1">
            🪙 {totalSystemBalance.toLocaleString()}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#121722] border border-[#262F45]">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Deposit Balances</span>
          <div className="text-xl font-extrabold text-white mt-1">
            🪙 {totalDepositBalance.toLocaleString()}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#121722] border border-[#262F45]">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Winnings Balances</span>
          <div className="text-xl font-extrabold text-emerald-400 mt-1">
            🪙 {totalWinningsBalance.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="p-4 rounded-2xl bg-[#121722] border border-[#262F45] mb-6 flex justify-between items-center">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Search Player Web Name, Username, IGN Game Name, UID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#0B0E14] border border-[#262F45] text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 font-medium"
          />
        </div>
      </div>

      {/* Users & Coin Table */}
      <div className="p-6 rounded-3xl bg-[#121722] border border-[#262F45] shadow-xl">
        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-[#FF2E4C] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Users className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-sm font-bold">No users match your search query.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-300">
              <thead className="bg-[#0B0E14] text-[#FF9F1C] uppercase text-[10px] font-bold border-b border-[#262F45]">
                <tr>
                  <th className="p-3.5">Player Web Name</th>
                  <th className="p-3.5">Free Fire Game Name (IGN & UID)</th>
                  <th className="p-3.5">Coin Wallet Balance</th>
                  <th className="p-3.5">Contact / Email</th>
                  <th className="p-3.5">Activity</th>
                  <th className="p-3.5">Role</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#262F45]">
                {users.map((u) => {
                  const depositBal = u.wallet?.depositBalance || 0;
                  const winningsBal = u.wallet?.winningsBalance || 0;
                  const totalBal = u.wallet?.balance || (depositBal + winningsBal);

                  return (
                    <tr key={u.id} className="hover:bg-[#1A2234] transition-colors">
                      {/* Web Name */}
                      <td className="p-3.5">
                        <div className="font-extrabold text-white text-sm">{u.name}</div>
                        <div className="text-[11px] text-amber-400/90 font-semibold">@{u.username}</div>
                      </td>

                      {/* Game Name (IGN & UID) */}
                      <td className="p-3.5 font-mono">
                        <div className="text-white font-bold flex items-center gap-1.5">
                          <span className="text-[10px] text-gray-400 uppercase font-bold">IGN:</span>
                          <span className="text-amber-300">{u.freeFireName || 'Not Set'}</span>
                        </div>
                        <div className="text-[11px] text-gray-400 mt-0.5">
                          <span className="text-[10px] text-gray-500 uppercase font-bold">UID:</span> {u.freeFireUid || 'Not Set'}
                        </div>
                      </td>

                      {/* Coin Balance */}
                      <td className="p-3.5">
                        <div className="text-base font-black text-amber-400 font-mono">
                          🪙 {totalBal.toLocaleString()}
                        </div>
                        <div className="text-[10px] text-gray-400 flex items-center gap-2 mt-0.5 font-medium">
                          <span>Deposit: 🪙 {depositBal.toLocaleString()}</span>
                          <span>•</span>
                          <span className="text-emerald-400">Winnings: 🪙 {winningsBal.toLocaleString()}</span>
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="p-3.5">
                        <div className="text-gray-200">{u.email}</div>
                        <div className="text-[10px] text-gray-400">{u.phone || 'No phone'}</div>
                      </td>

                      {/* Activity */}
                      <td className="p-3.5">
                        <div>{u._count?.registrations || 0} Scrims</div>
                        <div className="text-[10px] text-gray-400">{u._count?.teamsCaptained || 0} Squads</div>
                      </td>

                      {/* Role */}
                      <td className="p-3.5">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          u.role === 'ADMIN' ? 'bg-red-500/20 text-red-400 border border-red-500/40' : 'bg-gray-800 text-gray-300'
                        }`}>
                          {u.role}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="p-3.5">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          u.status === 'ACTIVE' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-rose-950 text-rose-400 border border-rose-500/40'
                        }`}>
                          {u.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="p-3.5 text-right space-x-1.5 whitespace-nowrap">
                        {/* MANAGE COINS BUTTON */}
                        <button
                          onClick={() => openCoinModal(u)}
                          className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/50 text-[11px] font-bold transition-all shadow-sm flex items-center gap-1.5 inline-flex"
                        >
                          <Coins className="w-3.5 h-3.5 text-amber-400" />
                          <span>Add / Reduce Coins</span>
                        </button>

                        {/* Toggle Role */}
                        <button
                          onClick={() => handleUpdateUserRoleOrStatus(u.id, u.role === 'ADMIN' ? 'USER' : 'ADMIN')}
                          className="px-2.5 py-1.5 rounded-xl bg-[#0B0E14] border border-[#262F45] text-[11px] text-gray-300 hover:text-white transition-colors"
                        >
                          {u.role === 'ADMIN' ? 'Make User' : 'Make Admin'}
                        </button>

                        {/* Toggle Status */}
                        <button
                          onClick={() => handleUpdateUserRoleOrStatus(u.id, undefined, u.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE')}
                          className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition-colors ${
                            u.status === 'ACTIVE'
                              ? 'bg-rose-950/60 text-rose-400 border border-rose-500/40 hover:bg-rose-900/40'
                              : 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-900/40'
                          }`}
                        >
                          {u.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* COIN MANAGEMENT MODAL */}
      {coinModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#121722] border border-[#262F45] w-full max-w-lg rounded-3xl p-6 shadow-2xl relative space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#262F45]">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center">
                  <Coins className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white uppercase tracking-wide">Coin Wallet Management</h3>
                  <p className="text-[11px] text-gray-400">Add or reduce player coin balances with live audit logging</p>
                </div>
              </div>

              <button
                onClick={() => setCoinModalOpen(false)}
                className="p-2 rounded-xl bg-[#0B0E14] text-gray-400 hover:text-white border border-[#262F45]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Selected User Details Banner */}
            <div className="p-4 rounded-2xl bg-[#0B0E14] border border-[#262F45] space-y-2">
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Player Web Name</div>
                  <div className="text-sm font-extrabold text-white">{selectedUser.name} <span className="text-amber-400 font-mono text-xs">(@{selectedUser.username})</span></div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Game Credentials</div>
                  <div className="text-xs font-bold text-gray-200">
                    IGN: <span className="text-amber-300">{selectedUser.freeFireName || 'Not set'}</span>
                  </div>
                  <div className="text-[11px] text-gray-400 font-mono">UID: {selectedUser.freeFireUid || 'Not set'}</div>
                </div>
              </div>

              <div className="pt-2 border-t border-[#262F45]/60 grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2 rounded-xl bg-[#121722] border border-[#262F45]">
                  <span className="block text-[9px] text-gray-400 uppercase font-bold">Total Balance</span>
                  <span className="font-black text-amber-400 font-mono">🪙 {(selectedUser.wallet?.balance || 0).toLocaleString()}</span>
                </div>
                <div className="p-2 rounded-xl bg-[#121722] border border-[#262F45]">
                  <span className="block text-[9px] text-gray-400 uppercase font-bold">Deposit Wallet</span>
                  <span className="font-extrabold text-white font-mono">🪙 {(selectedUser.wallet?.depositBalance || 0).toLocaleString()}</span>
                </div>
                <div className="p-2 rounded-xl bg-[#121722] border border-[#262F45]">
                  <span className="block text-[9px] text-gray-400 uppercase font-bold">Winnings Wallet</span>
                  <span className="font-extrabold text-emerald-400 font-mono">🪙 {(selectedUser.wallet?.winningsBalance || 0).toLocaleString()}</span>
                </div>
              </div>
            </div>

            {modalError && (
              <div className="p-3 rounded-xl bg-red-950/50 border border-red-500/50 text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleAdjustCoins} className="space-y-4">
              {/* ACTION TYPE: ADD vs REDUCE */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider">
                  Action Type *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setCoinAction('ADD')}
                    className={`p-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                      coinAction === 'ADD'
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-md'
                        : 'bg-[#0B0E14] border-[#262F45] text-gray-400 hover:text-white'
                    }`}
                  >
                    <PlusCircle className="w-4 h-4 text-emerald-400" />
                    <span>+ Add Coins (Credit)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCoinAction('REDUCE')}
                    className={`p-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                      coinAction === 'REDUCE'
                        ? 'bg-rose-950/60 border-rose-500 text-rose-400 shadow-md'
                        : 'bg-[#0B0E14] border-[#262F45] text-gray-400 hover:text-white'
                    }`}
                  >
                    <MinusCircle className="w-4 h-4 text-rose-400" />
                    <span>- Reduce Coins (Deduct)</span>
                  </button>
                </div>
              </div>

              {/* TARGET WALLET: DEPOSIT vs WINNINGS */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider">
                  Target Wallet *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setTargetWallet('deposit')}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                      targetWallet === 'deposit'
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-md'
                        : 'bg-[#0B0E14] border-[#262F45] text-gray-400 hover:text-white'
                    }`}
                  >
                    <Wallet className="w-4 h-4 text-amber-400" />
                    <span>Deposit Balance</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTargetWallet('winnings')}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                      targetWallet === 'winnings'
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-md'
                        : 'bg-[#0B0E14] border-[#262F45] text-gray-400 hover:text-white'
                    }`}
                  >
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                    <span>Winnings Balance</span>
                  </button>
                </div>
              </div>

              {/* COIN AMOUNT INPUT */}
              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1 uppercase tracking-wider">
                  Coin Amount *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-base">🪙</span>
                  <input
                    type="number"
                    min={1}
                    value={coinAmount}
                    onChange={(e) => setCoinAmount(e.target.value === '' ? '' : Math.abs(Number(e.target.value)))}
                    placeholder="Enter coin amount (e.g. 500)..."
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#0B0E14] border border-[#262F45] text-sm text-white font-mono font-bold placeholder-gray-500 focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>
              </div>

              {/* REASON / AUDIT NOTE */}
              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1 uppercase tracking-wider">
                  Reason / Audit Note *
                </label>
                <input
                  type="text"
                  value={coinReason}
                  onChange={(e) => setCoinReason(e.target.value)}
                  placeholder="e.g. Scrim win bonus reward / Tournament entry fee refund..."
                  className="w-full px-3 py-2.5 rounded-xl bg-[#0B0E14] border border-[#262F45] text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              {/* LIVE BALANCE CALCULATION PREVIEW */}
              {typeof coinAmount === 'number' && coinAmount > 0 && (
                <div className="p-3.5 rounded-2xl bg-[#0B0E14] border border-amber-500/30 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-gray-400 block text-[10px] uppercase font-bold">Calculation Preview:</span>
                    <span className="text-gray-300 font-medium">
                      {targetWallet === 'winnings' ? 'Winnings' : 'Deposit'} Wallet:
                    </span>
                  </div>
                  <div className="font-mono text-right">
                    <span className="text-gray-400 line-through mr-2">
                      🪙 {(targetWallet === 'winnings' ? selectedUser.wallet?.winningsBalance || 0 : selectedUser.wallet?.depositBalance || 0).toLocaleString()}
                    </span>
                    <span className={`font-black text-sm ${coinAction === 'ADD' ? 'text-emerald-400' : 'text-rose-400'}`}>
                      🪙 {(() => {
                        const current = targetWallet === 'winnings' ? (selectedUser.wallet?.winningsBalance || 0) : (selectedUser.wallet?.depositBalance || 0);
                        const change = coinAction === 'ADD' ? coinAmount : -coinAmount;
                        return Math.max(0, current + change).toLocaleString();
                      })()}
                    </span>
                  </div>
                </div>
              )}

              {/* BUTTONS */}
              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setCoinModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-[#0B0E14] text-gray-400 text-xs font-semibold hover:text-white border border-[#262F45]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-lg ${
                    coinAction === 'ADD'
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                      : 'bg-rose-600 hover:bg-rose-500 text-white'
                  }`}
                >
                  {actionLoading ? (
                    'Processing...'
                  ) : (
                    <>
                      <Coins className="w-4 h-4" />
                      <span>{coinAction === 'ADD' ? 'Add Coins Now' : 'Deduct Coins Now'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </main>
  );
}

