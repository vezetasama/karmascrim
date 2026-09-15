'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import {
  Wallet,
  ArrowLeft,
  Loader2,
  AlertCircle,
  CheckCircle,
  Landmark,
  ShieldCheck,
  Clock,
  Sparkles,
  ArrowUpRight,
  Building2,
  Phone,
  User as UserIcon,
} from 'lucide-react';

export default function WithdrawEarningsPage() {
  const [winningsBalance, setWinningsBalance] = useState<number>(0);
  const [totalBalance, setTotalBalance] = useState<number>(0);
  const [amount, setAmount] = useState<string>('');
  const [method, setMethod] = useState<'ESEWA' | 'KHALTI' | 'BANK_TRANSFER'>('ESEWA');

  // Account Details State
  const [accountName, setAccountName] = useState<string>('');
  const [accountNumber, setAccountNumber] = useState<string>('');
  const [bankName, setBankName] = useState<string>('');

  const [loading, setLoading] = useState<boolean>(true);
  const [isUnauthorized, setIsUnauthorized] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [createdWithdrawal, setCreatedWithdrawal] = useState<any | null>(null);

  useEffect(() => {
    fetchWalletInfo();
  }, []);

  const fetchWalletInfo = async () => {
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

      setWinningsBalance(data.winningsBalance || 0);
      setTotalBalance(data.balance || 0);
    } catch (err: any) {
      setError(err.message || 'Error loading wallet details.');
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
                Please log in or create an account to request withdrawals from your Karma Scrims wallet.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <Link
                href="/login?redirect=/wallet/withdraw"
                className="py-3 rounded-xl bg-[#1A2234] border border-[#262F45] hover:border-[#FF2E4C] text-xs font-bold text-white uppercase tracking-wider text-center"
              >
                Log In
              </Link>
              <Link
                href="/register?redirect=/wallet/withdraw"
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

  const handleSubmitWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const numAmount = Number(amount);
    if (!numAmount || isNaN(numAmount) || numAmount < 50) {
      setError('Minimum withdrawal amount is NPR 50.');
      return;
    }

    if (numAmount > winningsBalance) {
      setError(`Insufficient withdrawable earnings balance. Maximum available is NPR ${winningsBalance.toLocaleString()}.`);
      return;
    }

    if (!accountName.trim()) {
      setError('Please enter the account holder name.');
      return;
    }

    if (!accountNumber.trim()) {
      setError('Please enter your account / phone number.');
      return;
    }

    if (method === 'BANK_TRANSFER' && !bankName.trim()) {
      setError('Please enter your bank name.');
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch('/api/wallet/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: numAmount,
          method,
          accountName: accountName.trim(),
          accountNumber: accountNumber.trim(),
          bankName: bankName.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit withdrawal request.');

      setCreatedWithdrawal(data.withdrawalRequest);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('balanceUpdated'));
      }
    } catch (err: any) {
      setError(err.message || 'Withdrawal submission failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0B0E14] text-white">
      <Navbar />

      <main className="flex-1 py-8 max-w-2xl mx-auto px-4 sm:px-6 w-full space-y-6">
        
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2">
          <Link
            href="/wallet"
            className="text-xs text-gray-400 hover:text-white flex items-center gap-1 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Wallet</span>
          </Link>
          <span className="text-gray-600">/</span>
          <span className="text-xs text-[#FF9F1C] font-bold uppercase">Withdraw Tournament Earnings</span>
        </div>

        {/* Page Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-gradient-to-r from-[#FF9F1C]/20 to-[#FF2E4C]/20 border border-[#FF9F1C]/40 text-[#FF9F1C] text-xs font-black uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-[#FF9F1C]" />
            <span>Direct eSewa, Khalti & Bank Payouts</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black uppercase tracking-wide text-white flex items-center justify-center gap-2">
            <Landmark className="w-7 h-7 text-[#FF9F1C]" />
            Withdraw Earnings
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 max-w-lg mx-auto">
            Withdraw your verified tournament winnings directly to your mobile wallet or bank account.
          </p>
        </div>

        {/* Global Error Banner */}
        {error && (
          <div className="p-4 rounded-2xl bg-red-950/60 border border-red-500/50 text-red-300 text-xs font-semibold flex items-center gap-2 shadow-lg">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* CONFIRMATION SCREEN AFTER SUBMISSION */}
        {createdWithdrawal ? (
          <div className="p-8 sm:p-10 rounded-3xl bg-[#121722] border border-amber-500/40 text-center space-y-6 shadow-2xl">
            <div className="w-16 h-16 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto shadow-lg shadow-amber-500/20">
              <CheckCircle className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-black uppercase text-white">Withdrawal Request Submitted!</h2>
              <p className="text-xs sm:text-sm text-gray-300 max-w-md mx-auto">
                Your request to withdraw earnings has been received. Admin will process and transfer funds shortly.
              </p>
            </div>

            {/* Request Summary Card */}
            <div className="p-5 rounded-2xl bg-[#0B0E14] border border-[#262F45] max-w-md mx-auto text-xs space-y-2.5 text-left">
              <div className="flex justify-between items-center pb-2 border-b border-[#262F45]">
                <span className="text-gray-400">Request ID:</span>
                <span className="font-mono font-black text-[#FF9F1C] text-sm">{createdWithdrawal.requestId}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Withdrawal Amount:</span>
                <span className="font-black text-white text-base">NPR {createdWithdrawal.amount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-gray-400 text-[11px]">
                <span>Payout Method:</span>
                <span className="font-bold text-[#FF9F1C]">{createdWithdrawal.method}</span>
              </div>
              <div className="flex justify-between items-center text-gray-400 text-[11px]">
                <span>Account Holder:</span>
                <span className="text-gray-200">{createdWithdrawal.accountName}</span>
              </div>
              <div className="flex justify-between items-center text-gray-400 text-[11px]">
                <span>Account / Phone:</span>
                <span className="font-mono text-gray-200">{createdWithdrawal.accountNumber}</span>
              </div>
              {createdWithdrawal.bankName && (
                <div className="flex justify-between items-center text-gray-400 text-[11px]">
                  <span>Bank Name:</span>
                  <span className="text-gray-200">{createdWithdrawal.bankName}</span>
                </div>
              )}
              <div className="flex justify-between items-center pt-2 border-t border-[#262F45]">
                <span className="text-gray-400">Status:</span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> PENDING ADMIN APPROVAL
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
              <Link
                href="/wallet"
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#FF2E4C] text-white text-xs font-extrabold uppercase tracking-wider hover:bg-[#D61F3B] transition-colors shadow-lg shadow-[#FF2E4C]/30"
              >
                Go to Wallet Dashboard
              </Link>
              <Link
                href="/tournaments"
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#0B0E14] border border-[#262F45] text-xs font-bold text-gray-300 hover:text-white"
              >
                Browse Scrims
              </Link>
            </div>
          </div>
        ) : (
          /* WITHDRAWAL FORM */
          <form onSubmit={handleSubmitWithdrawal} className="space-y-6">
            
            {/* WITHDRAWABLE BALANCE CARD */}
            <div className="p-6 rounded-3xl bg-gradient-to-br from-[#121722] via-[#1A2234] to-[#0B0E14] border border-[#FF9F1C]/40 space-y-3 shadow-2xl relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Withdrawable Tournament Earnings
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-[#FF9F1C]/20 text-[#FF9F1C] text-[10px] font-black uppercase">
                  Winnings Only
                </span>
              </div>

              <div className="text-3xl sm:text-4xl font-black text-white flex items-baseline gap-2">
                <span className="text-[#FF9F1C]">NPR</span>
                <span>{winningsBalance.toLocaleString()}</span>
              </div>

              <p className="text-[11px] text-gray-400">
                Deposited funds cannot be withdrawn. Minimum withdrawal is <strong>NPR 50</strong>. Withdrawal fee: <strong>NPR 0</strong>.
              </p>
            </div>

            {/* WITHDRAWAL FORM FIELDS */}
            <div className="p-6 sm:p-8 rounded-3xl bg-[#121722] border border-[#262F45] space-y-6 shadow-2xl">
              
              {/* Amount Input */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-300 uppercase tracking-wider block">
                  Withdrawal Amount (NPR)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-extrabold text-[#FF9F1C]">
                    NPR
                  </span>
                  <input
                    type="number"
                    min="50"
                    max={winningsBalance}
                    value={amount}
                    onChange={(e) => {
                      setAmount(e.target.value);
                      setError('');
                    }}
                    placeholder="Enter amount (min. 50)"
                    className="w-full pl-14 pr-4 py-3.5 rounded-2xl bg-[#0B0E14] border border-[#262F45] text-lg font-black text-white focus:outline-none focus:border-[#FF9F1C]"
                    required
                  />
                </div>

                {/* Quick Amount Pills */}
                {winningsBalance > 0 && (
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {[100, 500, 1000, 2500].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setAmount(Math.min(val, winningsBalance).toString())}
                        className="px-3 py-1 rounded-xl bg-[#0B0E14] border border-[#262F45] hover:border-[#FF9F1C] text-xs font-bold text-gray-300 transition-colors"
                      >
                        NPR {val}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setAmount(winningsBalance.toString())}
                      className="px-3 py-1 rounded-xl bg-[#FF9F1C]/20 border border-[#FF9F1C]/40 text-[#FF9F1C] text-xs font-extrabold uppercase hover:bg-[#FF9F1C]/30 transition-colors"
                    >
                      Max (NPR {winningsBalance.toLocaleString()})
                    </button>
                  </div>
                )}
              </div>

              {/* Method Selector */}
              <div className="space-y-2 pt-2 border-t border-[#262F45]">
                <label className="text-xs font-bold text-gray-300 uppercase tracking-wider block">
                  Select Payout Method
                </label>

                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setMethod('ESEWA')}
                    className={`p-3.5 rounded-2xl border text-xs font-extrabold text-center transition-all ${
                      method === 'ESEWA'
                        ? 'bg-emerald-950/40 border-emerald-500 text-emerald-400 shadow-lg shadow-emerald-950/50'
                        : 'bg-[#0B0E14] border-[#262F45] text-gray-400 hover:border-gray-600'
                    }`}
                  >
                    eSewa
                  </button>

                  <button
                    type="button"
                    onClick={() => setMethod('KHALTI')}
                    className={`p-3.5 rounded-2xl border text-xs font-extrabold text-center transition-all ${
                      method === 'KHALTI'
                        ? 'bg-purple-950/40 border-purple-500 text-purple-400 shadow-lg shadow-purple-950/50'
                        : 'bg-[#0B0E14] border-[#262F45] text-gray-400 hover:border-gray-600'
                    }`}
                  >
                    Khalti
                  </button>

                  <button
                    type="button"
                    onClick={() => setMethod('BANK_TRANSFER')}
                    className={`p-3.5 rounded-2xl border text-xs font-extrabold text-center transition-all ${
                      method === 'BANK_TRANSFER'
                        ? 'bg-amber-950/40 border-[#FF9F1C] text-[#FF9F1C] shadow-lg shadow-amber-950/50'
                        : 'bg-[#0B0E14] border-[#262F45] text-gray-400 hover:border-gray-600'
                    }`}
                  >
                    Bank Transfer
                  </button>
                </div>
              </div>

              {/* Account Details Form */}
              <div className="space-y-4 pt-2 border-t border-[#262F45]">
                
                {method === 'BANK_TRANSFER' && (
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-300 uppercase tracking-wider block">
                      Bank Name *
                    </label>
                    <div className="relative">
                      <Building2 className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="e.g. Nabil Bank / NIC Asia / Global IME"
                        value={bankName}
                        onChange={(e) => setBankName(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#0B0E14] border border-[#262F45] text-xs font-bold text-white focus:outline-none focus:border-[#FF9F1C]"
                        required
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-300 uppercase tracking-wider block">
                    Account Holder Name *
                  </label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Full Name registered on account"
                      value={accountName}
                      onChange={(e) => setAccountName(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#0B0E14] border border-[#262F45] text-xs font-bold text-white focus:outline-none focus:border-[#FF9F1C]"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-300 uppercase tracking-wider block">
                    {method === 'BANK_TRANSFER' ? 'Bank Account Number *' : `${method === 'ESEWA' ? 'eSewa' : 'Khalti'} ID / Mobile Number *`}
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder={method === 'BANK_TRANSFER' ? 'e.g. 01928371290382' : 'e.g. 9812345678'}
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#0B0E14] border border-[#262F45] text-xs font-mono font-bold text-white focus:outline-none focus:border-[#FF9F1C]"
                      required
                    />
                  </div>
                </div>

              </div>

              {/* Fee & Payout Summary */}
              <div className="p-4 rounded-2xl bg-[#0B0E14] border border-[#262F45] space-y-2 text-xs">
                <div className="flex justify-between items-center text-gray-400">
                  <span>Requested Amount:</span>
                  <span className="font-bold text-white">NPR {Number(amount || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-gray-400">
                  <span>Withdrawal Fee:</span>
                  <span className="font-bold text-emerald-400">NPR 0 (FREE)</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-[#262F45] text-sm">
                  <span className="font-bold text-gray-200">Net Amount to Receive:</span>
                  <span className="font-black text-[#FF9F1C]">NPR {Number(amount || 0).toLocaleString()}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <Link
                  href="/wallet"
                  className="px-5 py-3 rounded-xl bg-[#0B0E14] border border-[#262F45] text-xs font-bold text-gray-400 hover:text-white"
                >
                  Cancel
                </Link>

                <button
                  type="submit"
                  disabled={submitting || winningsBalance < 50}
                  className="px-7 py-3 rounded-xl bg-gradient-to-r from-[#FF2E4C] to-[#FF9F1C] text-white text-xs font-black uppercase tracking-wider hover:opacity-90 disabled:opacity-50 transition-all flex items-center gap-2 shadow-lg shadow-[#FF2E4C]/25"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Submit Withdrawal Request</span>
                  <ArrowUpRight className="w-4 h-4" />
                </button>
              </div>

            </div>
          </form>
        )}

      </main>

      <Footer />
    </div>
  );
}
