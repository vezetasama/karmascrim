'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import {
  Wallet,
  PlusCircle,
  ArrowUpRight,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  Trophy,
  Landmark,
} from 'lucide-react';

export default function UserWalletPage() {
  const [balance, setBalance] = useState<number>(0);
  const [depositBalance, setDepositBalance] = useState<number>(0);
  const [winningsBalance, setWinningsBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [depositRequests, setDepositRequests] = useState<any[]>([]);
  const [withdrawalRequests, setWithdrawalRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isUnauthorized, setIsUnauthorized] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    fetchWalletData();

    const interval = window.setInterval(() => {
      fetchWalletData();
    }, 15000);

    return () => {
      window.clearInterval(interval);
    };
  }, []);

  const fetchWalletData = async () => {
    setLoading(true);
    setError('');
    setIsUnauthorized(false);
    try {
      const res = await fetch('/api/wallet');
      if (res.status === 401) {
        setIsUnauthorized(true);
        setLoading(false);
        return;
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch wallet info');

      setBalance(data.balance || 0);
      setDepositBalance(data.depositBalance || 0);
      setWinningsBalance(data.winningsBalance || 0);
      setTransactions(data.transactions || []);
      setDepositRequests(data.depositRequests || []);
      setWithdrawalRequests(data.withdrawalRequests || []);
    } catch (err: any) {
      setError(err.message || 'Error loading wallet data');
    } finally {
      setLoading(false);
    }
  };

  if (isUnauthorized) {
    return (
      <div className="min-h-screen flex flex-col bg-[#0B0E14] text-white">
        <Navbar />
        <main className="flex-1 flex items-center justify-center p-4 py-16">
          <div className="p-8 sm:p-10 rounded-3xl bg-[#121722] border border-[#262F45] max-w-md w-full text-center space-y-5 shadow-2xl">
            <div className="w-16 h-16 rounded-2xl bg-[#FF2E4C]/20 border border-[#FF2E4C]/40 text-[#FF2E4C] flex items-center justify-center mx-auto shadow-lg shadow-[#FF2E4C]/20">
              <Wallet className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-black uppercase text-white tracking-wide">Login Required</h2>
              <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
                Please log in or create an account to view your balance, add funds, and manage your Karma Scrims wallet.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <Link
                href="/login?redirect=/wallet"
                className="py-3 rounded-xl bg-[#1A2234] border border-[#262F45] hover:border-[#FF2E4C] text-xs font-bold text-white uppercase tracking-wider text-center"
              >
                Log In
              </Link>
              <Link
                href="/register?redirect=/wallet"
                className="py-3 rounded-xl bg-[#FF2E4C] hover:bg-[#D61F3B] text-xs font-black text-white uppercase tracking-wider text-center shadow-lg shadow-[#FF2E4C]/30"
              >
                Sign Up
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#0B0E14] text-white">
      <Navbar />

      <main className="flex-1 py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full space-y-8">
        
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FF2E4C]/10 border border-[#FF2E4C]/30 text-[#FF2E4C] text-[10px] font-black uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Karma Scrims Wallet</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-wide flex items-center gap-2">
              <Wallet className="w-7 h-7 text-[#FF9F1C]" />
              My Esports Wallet
            </h1>
            <p className="text-xs text-gray-400 mt-1">
              Manage your balance, add funds via Fonepay, and withdraw tournament winnings.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchWalletData}
              className="p-2.5 rounded-xl bg-[#121722] border border-[#262F45] text-gray-400 hover:text-white transition-colors"
              title="Refresh Balance"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* BALANCE HERO CARD */}
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-[#121722] via-[#1A2234] to-[#0B0E14] border border-[#FF2E4C]/40 relative overflow-hidden shadow-2xl">
          
          <div className="absolute top-0 right-0 p-8 text-[#FF2E4C]/5 pointer-events-none">
            <Wallet className="w-64 h-64 -mr-16 -mt-16" />
          </div>

          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            
            <div className="space-y-3">
              <span className="text-xs font-extrabold uppercase tracking-widest text-gray-400 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Available Wallet Balance
              </span>

              <div className="text-3xl sm:text-5xl font-black text-white tracking-tight flex items-baseline gap-2">
                <span className="text-[#FF9F1C]">NPR</span>
                <span>{balance.toLocaleString()}</span>
              </div>

              {/* Sub-balance Breakdown */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <div className="px-3 py-1.5 rounded-xl bg-[#0B0E14]/80 border border-[#262F45] text-xs">
                  <span className="text-gray-400">Deposited Funds: </span>
                  <span className="font-extrabold text-gray-200">NPR {depositBalance.toLocaleString()}</span>
                </div>
                <div className="px-3 py-1.5 rounded-xl bg-[#FF9F1C]/10 border border-[#FF9F1C]/30 text-xs">
                  <span className="text-amber-400/90 font-bold">Withdrawable Earnings: </span>
                  <span className="font-extrabold text-[#FF9F1C]">NPR {winningsBalance.toLocaleString()}</span>
                </div>
              </div>

              <p className="text-xs text-gray-400 max-w-md pt-1">
                Both deposited funds & tournament prize winnings can be used to join scrims. Only tournament winnings can be withdrawn.
              </p>
            </div>

            {/* Quick Actions Grid: ADD FUNDS and WITHDRAW */}
            <div className="grid grid-cols-2 gap-3 w-full md:w-auto">
              <Link
                href="/wallet/add-money"
                className="p-4 rounded-2xl bg-[#0B0E14]/80 border border-[#FF2E4C]/40 hover:border-[#FF2E4C] transition-all text-center group min-w-[130px]"
              >
                <PlusCircle className="w-6 h-6 text-[#FF2E4C] mx-auto mb-1 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold uppercase text-white block">Add Funds</span>
                <span className="text-[10px] text-gray-400">Fonepay Deposit</span>
              </Link>

              <Link
                href="/wallet/withdraw"
                className="p-4 rounded-2xl bg-[#0B0E14]/80 border border-[#FF9F1C]/40 hover:border-[#FF9F1C] transition-all text-center group min-w-[130px]"
              >
                <ArrowUpRight className="w-6 h-6 text-[#FF9F1C] mx-auto mb-1 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold uppercase text-white block">Withdraw</span>
                <span className="text-[10px] text-gray-400">Withdraw Earnings</span>
              </Link>
            </div>

          </div>
        </div>

        {/* WITHDRAWAL REQUESTS QUEUE (If any exist) */}
        {withdrawalRequests.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Landmark className="w-4 h-4 text-[#FF9F1C]" />
                Recent Withdrawal Requests
              </h3>
              <span className="text-xs text-gray-400">{withdrawalRequests.length} Requests</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {withdrawalRequests.map((req) => (
                <div
                  key={req.id}
                  className="p-4 rounded-2xl bg-[#121722] border border-[#262F45] space-y-3 relative overflow-hidden"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-white">{req.requestId}</span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border flex items-center gap-1 ${
                        req.status === 'APPROVED'
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                          : req.status === 'REJECTED'
                          ? 'bg-red-500/20 text-red-400 border-red-500/40'
                          : 'bg-amber-500/20 text-amber-400 border-amber-500/40 animate-pulse'
                      }`}
                    >
                      {req.status === 'APPROVED' && <CheckCircle className="w-3 h-3 text-emerald-400" />}
                      {req.status === 'REJECTED' && <XCircle className="w-3 h-3 text-red-400" />}
                      {req.status === 'PENDING' && <Clock className="w-3 h-3 text-amber-400" />}
                      <span>{req.status}</span>
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between border-t border-[#262F45] pt-2">
                    <div>
                      <span className="text-[10px] text-gray-400 block uppercase font-bold">Method</span>
                      <span className="text-xs font-bold text-[#FF9F1C]">{req.method}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-gray-400 block uppercase font-bold">Amount</span>
                      <span className="text-sm font-black text-white">NPR {req.amount.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="text-[11px] text-gray-400 font-mono bg-[#0B0E14] p-2 rounded-xl border border-[#262F45]">
                    <div>Account: <span className="text-white font-bold">{req.accountName}</span></div>
                    <div>Details: <span className="text-gray-300">{req.accountNumber}</span></div>
                    {req.bankName && <div>Bank: <span className="text-gray-300">{req.bankName}</span></div>}
                  </div>

                  {req.rejectionReason && (
                    <div className="p-2.5 rounded-xl bg-red-950/40 border border-red-500/30 text-red-300 text-[11px]">
                      <span className="font-bold block uppercase text-[10px]">Rejection Reason:</span>
                      <span>{req.rejectionReason}</span>
                    </div>
                  )}

                  <div className="text-[10px] text-gray-500 text-right">
                    {new Date(req.createdAt).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* DEPOSIT REQUESTS QUEUE (If any exist) */}
        {depositRequests.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#FF9F1C]" />
                Recent Deposit Requests
              </h3>
              <span className="text-xs text-gray-400">{depositRequests.length} Total Requests</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {depositRequests.map((req) => (
                <div
                  key={req.id}
                  className="p-4 rounded-2xl bg-[#121722] border border-[#262F45] space-y-3 relative overflow-hidden"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-white">{req.requestId}</span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border flex items-center gap-1 ${
                        req.status === 'APPROVED'
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                          : req.status === 'REJECTED'
                          ? 'bg-red-500/20 text-red-400 border-red-500/40'
                          : 'bg-amber-500/20 text-amber-400 border-amber-500/40 animate-pulse'
                      }`}
                    >
                      {req.status === 'APPROVED' && <CheckCircle className="w-3 h-3 text-emerald-400" />}
                      {req.status === 'REJECTED' && <XCircle className="w-3 h-3 text-red-400" />}
                      {req.status === 'PENDING' && <Clock className="w-3 h-3 text-amber-400" />}
                      <span>{req.status}</span>
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between border-t border-[#262F45] pt-2">
                    <div>
                      <span className="text-[10px] text-gray-400 block uppercase font-bold">Gateway</span>
                      <span className="text-xs font-bold text-[#FF9F1C]">{req.paymentMethod?.name || 'Fonepay'}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-gray-400 block uppercase font-bold">Amount</span>
                      <span className="text-sm font-black text-white">NPR {req.amount.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="text-[11px] text-gray-400 font-mono bg-[#0B0E14] p-2 rounded-xl border border-[#262F45] truncate">
                    Tx ID: <span className="text-gray-200">{req.transactionId}</span>
                  </div>

                  {req.rejectionReason && (
                    <div className="p-2.5 rounded-xl bg-red-950/40 border border-red-500/30 text-red-300 text-[11px]">
                      <span className="font-bold block uppercase text-[10px]">Rejection Reason:</span>
                      <span>{req.rejectionReason}</span>
                    </div>
                  )}

                  <div className="text-[10px] text-gray-500 text-right">
                    {new Date(req.createdAt).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TRANSACTIONS HISTORY TABLE */}
        <div className="p-6 rounded-3xl bg-[#121722] border border-[#262F45] space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-[#262F45] pb-4">
            <h3 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Trophy className="w-4.5 h-4.5 text-[#FF2E4C]" />
              Transaction History
            </h3>
            <span className="text-xs text-gray-400">{transactions.length} recent transactions</span>
          </div>

          {transactions.length === 0 ? (
            <div className="py-12 text-center text-gray-400 text-xs">
              No transactions recorded yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#262F45] text-gray-400 font-bold uppercase tracking-wider text-[10px]">
                    <th className="pb-3 px-3">Date</th>
                    <th className="pb-3 px-3">Type</th>
                    <th className="pb-3 px-3">Description</th>
                    <th className="pb-3 px-3 text-right">Amount</th>
                    <th className="pb-3 px-3 text-right">Balance After</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#262F45]/50 font-medium">
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-[#1A2234]/50 transition-colors">
                      <td className="py-3 px-3 text-gray-400 whitespace-nowrap">
                        {new Date(tx.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold uppercase ${
                            tx.amount > 0
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-red-500/20 text-red-400 border border-red-500/30'
                          }`}
                        >
                          {tx.type}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-gray-200">{tx.description}</td>
                      <td
                        className={`py-3 px-3 text-right font-bold whitespace-nowrap ${
                          tx.amount > 0 ? 'text-emerald-400' : 'text-red-400'
                        }`}
                      >
                        {tx.amount > 0 ? '+' : ''}NPR {Math.abs(tx.amount).toLocaleString()}
                      </td>
                      <td className="py-3 px-3 text-right text-gray-300 font-mono whitespace-nowrap">
                        NPR {tx.balanceAfter.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </main>

      <Footer />
    </div>
  );
}
