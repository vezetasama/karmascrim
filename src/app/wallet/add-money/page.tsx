'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import {
  Wallet,
  QrCode,
  Upload,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Loader2,
  AlertCircle,
  Clock,
  Sparkles,
} from 'lucide-react';

export default function AddMoneyPage() {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [amount, setAmount] = useState<string>('');
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<any | null>(null);
  const [transactionId, setTransactionId] = useState<string>('');
  const [screenshotUrl, setScreenshotUrl] = useState<string>('');
  const [note, setNote] = useState<string>('');

  const [loading, setLoading] = useState<boolean>(true);
  const [isUnauthorized, setIsUnauthorized] = useState<boolean>(false);
  const [uploading, setUploading] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [createdDeposit, setCreatedDeposit] = useState<any | null>(null);

  useEffect(() => {
    fetchPaymentMethods();
  }, []);

  const fetchPaymentMethods = async () => {
    setLoading(true);
    setError('');
    setIsUnauthorized(false);
    try {
      const authRes = await fetch('/api/auth/me');
      const authData = await authRes.json();
      if (!authData.user) {
        setIsUnauthorized(true);
        setLoading(false);
        return;
      }

      const res = await fetch('/api/admin/payment-methods');
      const data = await res.json();
      const enabled = (data.paymentMethods || []).filter((m: any) => m.enabled);
      setPaymentMethods(enabled);
      if (enabled.length > 0) {
        setSelectedMethod(enabled[0]);
      }
    } catch (err) {
      console.error(err);
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
                Please log in or create an account to add money to your Karma Scrims wallet.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <Link
                href="/login?redirect=/wallet/add-money"
                className="py-3 rounded-xl bg-[#1A2234] border border-[#262F45] hover:border-[#FF2E4C] text-xs font-bold text-white uppercase tracking-wider text-center"
              >
                Log In
              </Link>
              <Link
                href="/register?redirect=/wallet/add-money"
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

  // Image Upload Handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError('Screenshot file size must be less than 5MB.');
      return;
    }

    setUploading(true);
    setError('');

    try {
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);

      const res = await fetch('/api/admin/banners/upload', {
        method: 'POST',
        body: uploadFormData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to upload screenshot.');

      setScreenshotUrl(data.imageUrl);
    } catch (err: any) {
      setError(err.message || 'Image upload failed.');
    } finally {
      setUploading(false);
    }
  };

  // Step 1 -> Step 2 Validation
  const handleStep1Next = () => {
    const num = Number(amount);
    if (!num || isNaN(num) || num <= 0) {
      setError('Please enter a valid deposit amount.');
      return;
    }
    if (selectedMethod) {
      if (num < selectedMethod.minAmount) {
        setError(`Minimum deposit amount for ${selectedMethod.name} is NPR ${selectedMethod.minAmount}.`);
        return;
      }
      if (num > selectedMethod.maxAmount) {
        setError(`Maximum deposit amount for ${selectedMethod.name} is NPR ${selectedMethod.maxAmount}.`);
        return;
      }
    }
    setError('');
    setCurrentStep(2);
  };

  // Final Submission from Step 2 directly to Success Confirmation (Step 3)
  const handleSubmitDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transactionId.trim()) {
      setError('Please enter your Fonepay Transaction ID / Reference Number.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/wallet/deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: Number(amount),
          paymentMethodId: selectedMethod?.id || (paymentMethods.length > 0 ? paymentMethods[0].id : undefined),
          transactionId: transactionId.trim(),
          screenshotUrl,
          note: note.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit deposit request.');

      setCreatedDeposit(data.depositRequest);
      setCurrentStep(3); // Confirmation step
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('balanceUpdated'));
      }
    } catch (err: any) {
      setError(err.message || 'Deposit submission failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0B0E14] text-white">
      <Navbar />

      <main className="flex-1 py-8 max-w-3xl mx-auto px-4 sm:px-6 w-full space-y-6">
        
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
          <span className="text-xs text-[#FF2E4C] font-bold uppercase">Add Money Deposit</span>
        </div>

        {/* Page Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-gradient-to-r from-[#FF2E4C]/20 to-[#FF9F1C]/20 border border-[#FF2E4C]/40 text-[#FF9F1C] text-xs font-black uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-[#FF2E4C]" />
            <span>Instant Fonepay Wallet Top-Up</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black uppercase tracking-wide text-white">
            Add Money to Wallet
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 max-w-lg mx-auto">
            Scan Fonepay QR or transfer to official account. Submit reference number for instant verification.
          </p>
        </div>

        {/* Global Error Banner */}
        {error && (
          <div className="p-4 rounded-2xl bg-red-950/60 border border-red-500/50 text-red-300 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* STEP 1: SELECT AMOUNT */}
        {currentStep === 1 && (
          <div className="p-6 sm:p-8 rounded-3xl bg-[#121722] border border-[#262F45] space-y-6 shadow-2xl">
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-white uppercase flex items-center gap-2">
                <Wallet className="w-5 h-5 text-[#FF2E4C]" />
                Select Amount
              </h2>
            </div>

            {/* Custom Amount Input */}
            <div className="space-y-2 pt-2">
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-extrabold text-[#FF9F1C]">
                  NPR
                </span>
                <input
                  type="number"
                  min="10"
                  max="25000"
                  value={amount}
                  onChange={(e) => {
                    setAmount(e.target.value);
                    setError('');
                  }}
                  className="w-full pl-14 pr-4 py-3.5 rounded-2xl bg-[#0B0E14] border border-[#262F45] text-lg font-black text-white focus:outline-none focus:border-[#FF2E4C]"
                  placeholder="Enter amount"
                />
              </div>
              <p className="text-[11px] text-gray-500">
                Minimum: NPR {selectedMethod?.minAmount || 10} | Maximum: NPR {selectedMethod?.maxAmount || 25000}
              </p>
            </div>

            {/* Payment Method Selector */}
            {paymentMethods.length > 1 && (
              <div className="space-y-2 pt-2 border-t border-[#262F45]">
                <label className="text-xs font-bold text-gray-300 uppercase tracking-wider block">
                  Select Payment Method
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {paymentMethods.map((method) => (
                    <button
                      key={method.id}
                      type="button"
                      onClick={() => setSelectedMethod(method)}
                      className={`p-3 rounded-xl border text-xs font-bold text-left transition-all ${
                        selectedMethod?.id === method.id
                          ? 'bg-[#FF9F1C]/20 border-[#FF9F1C] text-white'
                          : 'bg-[#0B0E14] border-[#262F45] text-gray-400'
                      }`}
                    >
                      {method.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={handleStep1Next}
              className="w-full py-4 rounded-2xl bg-[#FF2E4C] text-white text-xs font-black uppercase tracking-wider hover:bg-[#D61F3B] transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#FF2E4C]/30"
            >
              <span>Continue to Fonepay Payment</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* STEP 2: FONEPAY QR CODE & PAYMENT SUBMISSION FORM (COMBINED) */}
        {currentStep === 2 && (
          <form onSubmit={handleSubmitDeposit} className="p-6 sm:p-8 rounded-3xl bg-[#121722] border border-[#262F45] space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#262F45] pb-4">
              <div>
                <h2 className="text-lg font-bold text-white uppercase flex items-center gap-2">
                  <QrCode className="w-5 h-5 text-[#FF9F1C]" />
                  Pay NPR {Number(amount).toLocaleString()} via Fonepay
                </h2>
                <p className="text-xs text-gray-400">Scan QR code or use account details below, then enter your transaction ID.</p>
              </div>
              <span className="px-3 py-1 rounded-xl bg-[#FF9F1C]/20 border border-[#FF9F1C]/40 text-[#FF9F1C] font-black text-sm">
                NPR {Number(amount).toLocaleString()}
              </span>
            </div>

            {/* QR Code Container */}
            <div className="p-4 rounded-2xl bg-[#0B0E14] border border-[#262F45] text-center space-y-3 max-w-sm mx-auto">
              <div className="w-48 h-48 mx-auto rounded-xl overflow-hidden bg-white p-2 border border-gray-700 shadow-xl">
                {selectedMethod?.qrImageUrl ? (
                  <img
                    src={selectedMethod.qrImageUrl}
                    alt="Fonepay QR Code"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs">
                    QR Code Placeholder
                  </div>
                )}
              </div>
              <span className="text-[11px] text-gray-400 font-bold block">
                Scan with eSewa / Khalti / Any Mobile Banking
              </span>
            </div>

            {/* Fonepay Transaction ID Input */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-300 uppercase tracking-wider block">
                Fonepay Transaction ID / Reference No. (Required)
              </label>
              <input
                type="text"
                required
                placeholder="e.g. FP-9823019482 or 1092837492"
                value={transactionId}
                onChange={(e) => {
                  setTransactionId(e.target.value);
                  setError('');
                }}
                className="w-full p-3.5 rounded-2xl bg-[#0B0E14] border border-[#262F45] text-sm font-mono font-bold text-white placeholder-gray-600 focus:outline-none focus:border-[#FF2E4C]"
              />
              <p className="text-[11px] text-gray-500">Found in your banking app receipt after successful transfer.</p>
            </div>

            {/* Optional Screenshot Upload */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-300 uppercase tracking-wider block">
                Payment Screenshot (Optional but recommended)
              </label>

              {screenshotUrl ? (
                <div className="relative w-full h-40 rounded-2xl overflow-hidden bg-black border border-[#262F45] group">
                  <img src={screenshotUrl} alt="Payment Screenshot" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setScreenshotUrl('')}
                    className="absolute top-2 right-2 p-1.5 rounded-lg bg-red-600 text-white text-xs font-bold"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center p-6 rounded-2xl bg-[#0B0E14] border border-dashed border-[#262F45] hover:border-[#FF2E4C] cursor-pointer text-xs font-bold text-gray-400 transition-colors">
                  {uploading ? (
                    <Loader2 className="w-6 h-6 text-[#FF2E4C] animate-spin mb-2" />
                  ) : (
                    <Upload className="w-6 h-6 text-[#FF2E4C] mb-2" />
                  )}
                  <span>{uploading ? 'Uploading Screenshot...' : 'Click to Upload Payment Screenshot'}</span>
                  <span className="text-[10px] text-gray-500 font-normal mt-1">PNG, JPG, WEBP max 5MB</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* Optional Note */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-300 uppercase tracking-wider block">
                Optional Note / Remarks
              </label>
              <input
                type="text"
                placeholder="e.g. Paid via eSewa Fonepay QR"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full p-3 rounded-xl bg-[#0B0E14] border border-[#262F45] text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#FF2E4C]"
              />
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-[#262F45]">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="px-5 py-3 rounded-xl bg-[#0B0E14] border border-[#262F45] text-xs font-bold text-gray-400 hover:text-white"
              >
                ← Back
              </button>

              <button
                type="submit"
                disabled={submitting}
                className="px-7 py-3 rounded-xl bg-[#FF2E4C] text-white text-xs font-black uppercase tracking-wider hover:bg-[#D61F3B] disabled:opacity-50 transition-all flex items-center gap-2 shadow-lg shadow-[#FF2E4C]/30"
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>Submit Deposit Request</span>
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: SUCCESS CONFIRMATION */}
        {currentStep === 3 && createdDeposit && (
          <div className="p-8 sm:p-10 rounded-3xl bg-[#121722] border border-emerald-500/40 text-center space-y-6 shadow-2xl">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
              <CheckCircle className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-black uppercase text-white">Deposit Request Submitted!</h2>
              <p className="text-xs sm:text-sm text-gray-300 max-w-md mx-auto">
                Your deposit request has been submitted successfully. Your balance will be updated after admin verification.
              </p>
            </div>

            {/* Request Summary Card */}
            <div className="p-5 rounded-2xl bg-[#0B0E14] border border-[#262F45] max-w-md mx-auto text-xs space-y-2 text-left">
              <div className="flex justify-between items-center pb-2 border-b border-[#262F45]">
                <span className="text-gray-400">Deposit Request ID:</span>
                <span className="font-mono font-black text-[#FF9F1C] text-sm">{createdDeposit.requestId}</span>
              </div>
              <div className="flex justify-between items-center pt-1">
                <span className="text-gray-400">Amount:</span>
                <span className="font-black text-white text-base">NPR {createdDeposit.amount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center font-mono text-[11px] text-gray-400">
                <span>Transaction ID:</span>
                <span className="text-gray-200">{createdDeposit.transactionId}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-[#262F45]">
                <span className="text-gray-400">Current Status:</span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> PENDING VERIFICATION
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
              <Link
                href="/wallet"
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#FF2E4C] text-white text-xs font-extrabold uppercase tracking-wider hover:bg-[#D61F3B] transition-colors"
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
        )}

      </main>

      <Footer />
    </div>
  );
}
