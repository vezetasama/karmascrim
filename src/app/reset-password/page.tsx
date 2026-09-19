'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import {
  Lock, AlertCircle, ArrowRight, ArrowLeft,
  CheckCircle2, Eye, EyeOff
} from 'lucide-react';
import { validatePassword, validateConfirmPassword } from '@/lib/validation';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!token) {
    return (
      <div className="w-full max-w-md bg-[#121722] border border-[#262F45] rounded-3xl p-8 shadow-2xl space-y-6 text-center">
        <div className="w-12 h-12 rounded-2xl bg-red-950/50 flex items-center justify-center mx-auto">
          <AlertCircle className="w-7 h-7 text-red-400" />
        </div>
        <h1 className="text-xl font-black uppercase tracking-wider text-white">Invalid Reset Link</h1>
        <p className="text-xs text-gray-400">
          This password reset link is invalid or has expired. Please request a new one.
        </p>
        <Link
          href="/forgot-password"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl glow-btn-red text-white text-xs font-bold uppercase tracking-wider"
        >
          Request New Link
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const passwordCheck = validatePassword(newPassword);
    if (!passwordCheck.valid) {
      setError(passwordCheck.message);
      return;
    }

    const confirmCheck = validateConfirmPassword(newPassword, confirmPassword);
    if (!confirmCheck.valid) {
      setError(confirmCheck.message);
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword, confirmPassword }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to reset password');
        setLoading(false);
        return;
      }

      setSuccess(true);
    } catch (e) {
      setError('Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-[#121722] border border-[#262F45] rounded-3xl p-8 shadow-2xl space-y-6">
      
      <div className="text-center space-y-2">
        <div className="flex justify-center pb-1">
          <Image
            src="/images/logo.png"
            alt="KARMA SCRIMS"
            width={200}
            height={117}
            className="h-14 sm:h-16 w-auto object-contain drop-shadow-[0_2px_12px_rgba(255,46,76,0.4)]"
            priority
          />
        </div>
        <h1 className="text-2xl font-black uppercase tracking-wider text-white">Reset Password</h1>
        <p className="text-xs text-gray-400">
          {success ? 'Your password has been reset!' : 'Enter your new password below'}
        </p>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/50 text-red-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success ? (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-emerald-400 text-xs flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Password reset successful!</p>
              <p className="mt-1 text-emerald-400/70">
                You can now login with your new password.
              </p>
            </div>
          </div>
          <Link
            href="/login"
            className="w-full py-3 rounded-xl glow-btn-red text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2"
          >
            <span>Go to Login</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-300 mb-1">New Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-[#0B0E14] border border-[#262F45] text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#FF2E4C] transition-colors"
                required
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-300 mb-1">Confirm New Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-[#0B0E14] border border-[#262F45] text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#FF2E4C] transition-colors"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                tabIndex={-1}
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Password Requirements */}
          {newPassword && (
            <div className="p-3 rounded-xl bg-[#0B0E14] border border-[#262F45] text-[10px] space-y-1">
              <p className="text-gray-400 font-bold uppercase tracking-wider mb-1">Password Requirements</p>
              <p className={newPassword.length >= 8 ? 'text-emerald-400' : 'text-gray-500'}>
                {newPassword.length >= 8 ? '✓' : '○'} At least 8 characters
              </p>
              <p className={/[A-Z]/.test(newPassword) ? 'text-emerald-400' : 'text-gray-500'}>
                {/[A-Z]/.test(newPassword) ? '✓' : '○'} One uppercase letter
              </p>
              <p className={/[a-z]/.test(newPassword) ? 'text-emerald-400' : 'text-gray-500'}>
                {/[a-z]/.test(newPassword) ? '✓' : '○'} One lowercase letter
              </p>
              <p className={/[0-9]/.test(newPassword) ? 'text-emerald-400' : 'text-gray-500'}>
                {/[0-9]/.test(newPassword) ? '✓' : '○'} One number
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl glow-btn-red text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span>{loading ? 'Resetting...' : 'Reset Password'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <Link
            href="/login"
            className="flex items-center justify-center gap-2 text-xs text-gray-400 hover:text-white transition-colors pt-2 border-t border-[#262F45]"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Login</span>
          </Link>
        </form>
      )}

    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#0B0E14] text-white">
      <Navbar />
      <main className="flex-1 flex items-center justify-center py-12 px-4">
        <Suspense fallback={<div className="text-xs text-gray-400">Loading...</div>}>
          <ResetPasswordForm />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
