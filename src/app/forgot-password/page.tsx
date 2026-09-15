'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Flame, Mail, AlertCircle, ArrowRight, ArrowLeft, CheckCircle2, Copy, Check } from 'lucide-react';
import { validateEmail } from '@/lib/validation';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [resetLink, setResetLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const emailCheck = validateEmail(email);
    if (!emailCheck.valid) {
      setError(emailCheck.message);
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to process request');
        setLoading(false);
        return;
      }

      setSuccess(true);
      // In dev mode, the API returns the reset link
      if (data.devOnly?.resetLink) {
        setResetLink(data.devOnly.resetLink);
      }
    } catch (e) {
      setError('Failed to process password reset request');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (resetLink) {
      await navigator.clipboard.writeText(resetLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0B0E14] text-white">
      <Navbar />

      <main className="flex-1 flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-md bg-[#121722] border border-[#262F45] rounded-3xl p-8 shadow-2xl space-y-6">
          
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#FF2E4C] to-[#FF9F1C] flex items-center justify-center mx-auto shadow-lg shadow-[#FF2E4C]/25">
              <Flame className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-black uppercase tracking-wider text-white">Forgot Password</h1>
            <p className="text-xs text-gray-400">
              {success
                ? 'Check your email for the reset link'
                : 'Enter your email to receive a password reset link'}
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
                  <p className="font-bold">Password reset link generated!</p>
                  <p className="mt-1 text-emerald-400/70">
                    If an account with that email exists, you will receive a reset link.
                  </p>
                </div>
              </div>

              {/* Dev mode: Show the reset link directly */}
              {resetLink && (
                <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/30 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                      ⚠️ Dev Mode — Reset Link
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={resetLink}
                      readOnly
                      className="flex-1 px-3 py-2 rounded-lg bg-[#0B0E14] border border-[#262F45] text-[10px] text-gray-300 font-mono"
                    />
                    <button
                      onClick={handleCopy}
                      className="p-2 rounded-lg bg-[#0B0E14] border border-[#262F45] text-gray-400 hover:text-white transition-colors"
                    >
                      {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                  <Link
                    href={resetLink.replace(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000', '')}
                    className="block text-center py-2 rounded-xl glow-btn-red text-white text-xs font-bold uppercase tracking-wider"
                  >
                    Open Reset Page →
                  </Link>
                </div>
              )}

              <Link
                href="/login"
                className="flex items-center justify-center gap-2 text-xs text-gray-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Login</span>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#0B0E14] border border-[#262F45] text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#FF2E4C] transition-colors"
                    required
                    autoFocus
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl glow-btn-red text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>{loading ? 'Sending...' : 'Send Reset Link'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="flex items-center justify-center gap-4 text-xs text-gray-400 pt-2 border-t border-[#262F45]">
                <Link href="/login" className="hover:text-white transition-colors flex items-center gap-1">
                  <ArrowLeft className="w-3 h-3" />
                  Back to Login
                </Link>
                <span className="text-[#262F45]">|</span>
                <Link href="/register" className="text-[#FF2E4C] font-bold hover:underline">
                  Create Account
                </Link>
              </div>
            </form>
          )}

        </div>
      </main>

      <Footer />
    </div>
  );
}
