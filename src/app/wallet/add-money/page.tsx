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
  Coins,
  ImagePlus,
  Download,
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
                Please log in or create an account to add coins to your Karma Scrims wallet.
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

      const res = await fetch('/api/wallet/upload', {
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
        setError(`Minimum deposit amount for ${selectedMethod.name} is ${selectedMethod.minAmount} COINS (Rs. ${selectedMethod.minAmount}).`);
        return;
      }
      if (num > selectedMethod.maxAmount) {
        setError(`Maximum deposit amount for ${selectedMethod.name} is ${selectedMethod.maxAmount} COINS (Rs. ${selectedMethod.maxAmount}).`);
        return;
      }
    }
    setError('');
    setCurrentStep(2);
  };

  // Download QR Code to Gallery
  const handleDownloadQR = async () => {
    const qrUrl =
      selectedMethod?.qrImageUrl && !selectedMethod.qrImageUrl.includes('unsplash')
        ? selectedMethod.qrImageUrl
        : '/images/fonepay-qr.png';

    try {
      const response = await fetch(qrUrl);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = 'Mandip_Regmi_Fonepay_QR.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      const link = document.createElement('a');
      link.href = qrUrl;
      link.download = 'Mandip_Regmi_Fonepay_QR.png';
      link.target = '_blank';
      link.click();
    }
  };

  // Final Submission from Step 2 directly to Success Confirmation (Step 3)
  const handleSubmitDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!screenshotUrl) {
      setError('Please select and upload your payment screenshot image before submitting.');
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
          <h1 className="text-2xl sm:text-4xl font-black uppercase tracking-wide text-white flex items-center justify-center gap-2">
            <span>Add Money to Wallet</span>
            <Coins className="w-7 h-7 sm:w-9 sm:h-9 text-[#FF9F1C]" />
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 max-w-lg mx-auto">
            Scan QR and submit for instant verification.
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
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-bold text-white uppercase flex items-center gap-2">
                <Wallet className="w-5 h-5 text-[#FF2E4C]" />
                Select Amount
              </h2>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-[#FF9F1C]/20 border border-[#FF9F1C]/40 text-[#FF9F1C] text-[11px] font-black uppercase">
                1 RS = 1 COIN
              </span>
            </div>

            {/* Custom Amount Input */}
            <div className="space-y-2 pt-2">
              <label className="text-xs font-bold text-gray-300 uppercase tracking-wider block">
                Enter Amount to Deposit
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-extrabold text-[#FF9F1C] flex items-center gap-1">
                  🪙 COIN
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
                  className="w-full pl-28 pr-4 py-3.5 rounded-2xl bg-[#0B0E14] border border-[#262F45] text-lg font-black text-white focus:outline-none focus:border-[#FF2E4C]"
                  placeholder="e.g. 100"
                />
              </div>
              <div className="flex justify-between items-center text-[11px] text-gray-400 pt-1">
                <span>
                  Minimum: <strong>10 COIN</strong>
                </span>
              </div>
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
              <span>CONTINUE</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* STEP 2: PAYMENT QR CODE & PAYMENT SUBMISSION FORM (MATCHING IMAGE 2 DESIGN) */}
        {currentStep === 2 && (
          <form onSubmit={handleSubmitDeposit} className="p-6 sm:p-8 rounded-[28px] bg-[#121722] border border-[#262F45] space-y-6 shadow-2xl max-w-md mx-auto">
            
            {/* Payment Method Logo & Title Header */}
            <div className="text-center space-y-2">
              <h3 className="text-lg font-black text-white uppercase tracking-wider">
                {!selectedMethod || selectedMethod.name.includes('Fonepay') ? 'eSewa' : selectedMethod.name}
              </h3>
              <h2 className="text-base sm:text-lg font-black uppercase text-white tracking-wide">
                PLEASE FOLLOW THE INSTRUCTION
              </h2>
              <p className="text-xs sm:text-sm text-gray-300 leading-relaxed max-w-xs mx-auto">
                You have requested to deposit <strong className="text-white font-black">Rs. {Number(amount).toLocaleString()}</strong>. Please pay exact amount for successful payment.
              </p>
            </div>

            {/* QR Code Box & Save QR Option */}
            <div className="flex flex-col items-center justify-center pt-2 gap-3">
              <div className="w-56 h-56 rounded-3xl overflow-hidden bg-white p-3 border border-gray-700 shadow-2xl flex items-center justify-center">
                <img
                  src={
                    selectedMethod?.qrImageUrl && !selectedMethod.qrImageUrl.includes('unsplash')
                      ? selectedMethod.qrImageUrl
                      : '/images/fonepay-qr.png'
                  }
                  alt="Payment QR Code"
                  className="w-full h-full object-contain"
                />
              </div>

              {/* Name & Save QR Button */}
              <div className="flex items-center justify-between w-full max-w-[260px] gap-2 px-1">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-[11px] text-gray-400 font-medium whitespace-nowrap">Name</span>
                  <span className="text-xs font-bold text-white whitespace-nowrap">Mandip Regmi</span>
                </div>

                <button
                  type="button"
                  onClick={handleDownloadQR}
                  className="px-3 py-1.5 rounded-lg bg-[#0B0E14] border border-[#262F45] hover:border-[#FF2E4C] text-[11px] font-bold text-gray-200 hover:text-white flex items-center gap-1.5 transition-all shadow shrink-0"
                  title="Save QR image directly to gallery"
                >
                  <Download className="w-3.5 h-3.5 text-[#FF2E4C]" />
                  <span>Save QR</span>
                </button>
              </div>
            </div>

            {/* Select Payment Screenshot Image Button */}
            <div className="space-y-2 pt-2">
              <label className="flex items-center justify-center gap-2.5 w-full py-3.5 px-4 rounded-xl bg-[#0B0E14] border border-[#262F45] hover:border-[#FF2E4C] cursor-pointer text-xs font-bold text-gray-200 hover:text-white transition-all group shadow-inner">
                {uploading ? (
                  <Loader2 className="w-4 h-4 text-[#FF2E4C] animate-spin" />
                ) : screenshotUrl ? (
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                ) : (
                  <ImagePlus className="w-4 h-4 text-[#FF2E4C] group-hover:scale-110 transition-transform" />
                )}
                <span>
                  {uploading
                    ? 'Uploading Screenshot...'
                    : screenshotUrl
                    ? 'Payment Screenshot Image Attached'
                    : 'Select Payment Screenshot Image'}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              {/* Preview image thumbnail when uploaded */}
              {screenshotUrl && (
                <div className="relative w-full h-32 rounded-xl overflow-hidden bg-black border border-[#262F45] flex items-center justify-center group">
                  <img src={screenshotUrl} alt="Payment Proof" className="h-full w-auto object-contain" />
                  <button
                    type="button"
                    onClick={() => setScreenshotUrl('')}
                    className="absolute top-2 right-2 p-1.5 rounded-lg bg-red-600/90 hover:bg-red-600 text-white text-[10px] font-bold uppercase transition-all shadow"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="space-y-4 pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-[#FF2E4C] via-[#FF5069] to-[#FF9F1C] hover:opacity-95 disabled:opacity-50 text-white text-sm font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#FF2E4C]/25"
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>Submit</span>
              </button>

              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="w-fit py-2 px-3 rounded-xl bg-[#0B0E14] border border-[#262F45] hover:border-[#FF2E4C] text-xs font-bold text-gray-200 hover:text-white transition-all flex items-center gap-1.5 shadow"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-[#FF2E4C]" />
                <span>Back</span>
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
                Your deposit request has been submitted successfully. Your wallet coins will be updated after admin verification.
              </p>
            </div>

            {/* Request Summary Card */}
            <div className="p-5 rounded-2xl bg-[#0B0E14] border border-[#262F45] max-w-md mx-auto text-xs space-y-2 text-left">
              <div className="flex justify-between items-center pb-2 border-b border-[#262F45]">
                <span className="text-gray-400">Deposit Request ID:</span>
                <span className="font-mono font-black text-[#FF9F1C] text-sm">{createdDeposit.requestId}</span>
              </div>
              <div className="flex justify-between items-center pt-1">
                <span className="text-gray-400">Deposit Amount:</span>
                <span className="font-black text-white text-base flex items-center gap-1">
                  🪙 {createdDeposit.amount.toLocaleString()} COINS
                  <span className="text-xs text-gray-400 font-normal">(Rs. {createdDeposit.amount.toLocaleString()})</span>
                </span>
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

