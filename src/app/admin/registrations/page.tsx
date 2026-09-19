'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Link from 'next/link';
import {
  CreditCard,
  CheckCircle2,
  XCircle,
  Search,
  Eye,
  X,
  AlertCircle,
  ArrowLeft,
  Users,
  ShieldCheck
} from 'lucide-react';

export default function AdminRegistrationsPage() {
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  // Screenshot Preview Modal State
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Reject Modal State
  const [rejectingReg, setRejectingReg] = useState<any>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const [actionLoading, setActionLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchRegistrations();
  }, []);

  const fetchRegistrations = async () => {
    try {
      const res = await fetch('/api/registrations');
      const data = await res.json();
      if (data.registrations) {
        setRegistrations(data.registrations);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (regId: string) => {
    setActionLoading(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/admin/registrations/${regId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'APPROVE' }),
      });
      const data = await res.json();
      if (data.success) {
        setMsg('Registration approved & slot confirmed!');
        fetchRegistrations();
      }
    } catch (e) {
      setMsg('Failed to approve registration');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingReg) return;
    setActionLoading(true);

    try {
      const res = await fetch(`/api/admin/registrations/${rejectingReg.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'REJECT',
          rejectionReason,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setMsg('Registration rejected.');
        setRejectingReg(null);
        setRejectionReason('');
        fetchRegistrations();
      }
    } catch (e) {
      setMsg('Failed to reject registration');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredRegistrations = registrations.filter((reg) => {
    const matchesStatus = statusFilter === 'ALL' || reg.status === statusFilter;
    const searchLower = search.toLowerCase();
    const matchesSearch =
      !search ||
      reg.registrationId?.toLowerCase().includes(searchLower) ||
      reg.tournament?.name?.toLowerCase().includes(searchLower) ||
      reg.team?.name?.toLowerCase().includes(searchLower) ||
      reg.user?.name?.toLowerCase().includes(searchLower) ||
      reg.user?.username?.toLowerCase().includes(searchLower) ||
      reg.payment?.transactionId?.toLowerCase().includes(searchLower);
    return matchesStatus && matchesSearch;
  });

  return (
    <main className="py-4 sm:py-8 max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 w-full">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
          <div>
            <Link href="/admin" className="text-xs text-gray-400 hover:text-white flex items-center gap-1 mb-1">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Admin Overview
            </Link>
            <h1 className="text-2xl font-black uppercase text-white">Registration & Fonepay Approvals</h1>
            <p className="text-xs text-gray-400">Verify user transaction IDs, inspect payment receipts, and confirm tournament slots</p>
          </div>
        </div>

        {msg && (
          <div className="mb-6 p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-400 text-xs flex items-center justify-between">
            <span>{msg}</span>
            <button onClick={() => setMsg(null)}>
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Toolbar */}
        <div className="p-4 rounded-2xl bg-[#121722] border border-[#262F45] mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2 overflow-x-auto w-full sm:w-auto">
            {['ALL', 'PAYMENT_SUBMITTED', 'CONFIRMED', 'PENDING_PAYMENT', 'REJECTED'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
                  statusFilter === st ? 'bg-[#FF2E4C] text-white' : 'bg-[#0B0E14] text-gray-400 border border-[#262F45]'
                }`}
              >
                {st === 'PAYMENT_SUBMITTED' ? 'Pending Approval' : st}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Search Reg ID, User, TxID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#0B0E14] border border-[#262F45] text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#FF2E4C]"
            />
          </div>
        </div>

        {/* Registrations Table */}
        <div className="p-6 rounded-3xl bg-[#121722] border border-[#262F45]">
          {loading ? (
            <div className="h-64 flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-[#FF2E4C] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredRegistrations.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <CreditCard className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-sm font-bold">No registrations match your query.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-gray-300">
                <thead className="bg-[#0B0E14] text-[#FF9F1C] uppercase text-[10px] font-bold border-b border-[#262F45]">
                  <tr>
                    <th className="p-3.5">Reg ID</th>
                    <th className="p-3.5">Tournament</th>
                    <th className="p-3.5">Squad / Captain</th>
                    <th className="p-3.5">Payment Details</th>
                    <th className="p-3.5">Screenshot</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#262F45]">
                  {filteredRegistrations.map((reg) => (
                    <tr key={reg.id} className="hover:bg-[#1A2234]">
                      <td className="p-3.5 font-mono font-bold text-white">{reg.registrationId}</td>
                      <td className="p-3.5 font-semibold text-white max-w-xs truncate">
                        {reg.tournament?.name}
                      </td>
                      <td className="p-3.5">
                        <div className="font-bold text-white">{reg.team?.name || reg.user?.name}</div>
                        <div className="text-[10px] text-gray-400">
                          @{reg.user?.username} • UID: {reg.user?.freeFireUid || 'N/A'}
                        </div>
                      </td>
                      <td className="p-3.5">
                        {reg.payment ? (
                          <div>
                            <div className="font-mono text-[#FF9F1C] font-bold">{reg.payment.transactionId}</div>
                            <div className="text-[10px] text-white">🪙 {reg.payment.amount} COIN</div>
                          </div>
                        ) : (
                          <span className="text-gray-500 italic">No payment submitted</span>
                        )}
                      </td>
                      <td className="p-3.5">
                        {reg.payment?.screenshotUrl ? (
                          <button
                            onClick={() => setPreviewImage(reg.payment.screenshotUrl)}
                            className="px-2.5 py-1 rounded-lg bg-[#0B0E14] border border-[#262F45] text-xs font-semibold text-gray-300 hover:text-white flex items-center gap-1"
                          >
                            <Eye className="w-3.5 h-3.5 text-[#FF9F1C]" /> View Image
                          </button>
                        ) : (
                          <span className="text-gray-600 text-[10px]">No image</span>
                        )}
                      </td>
                      <td className="p-3.5">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          reg.status === 'CONFIRMED'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                            : reg.status === 'PAYMENT_SUBMITTED'
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                            : reg.status === 'REJECTED'
                            ? 'bg-red-950/40 text-red-400 border border-red-500/40'
                            : 'bg-gray-800 text-gray-400'
                        }`}>
                          {reg.status}
                        </span>
                      </td>
                      <td className="p-3.5 text-right space-x-1.5 whitespace-nowrap">
                        {reg.status !== 'CONFIRMED' && (
                          <button
                            onClick={() => handleApprove(reg.id)}
                            disabled={actionLoading}
                            className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px]"
                          >
                            Approve
                          </button>
                        )}
                        {reg.status !== 'REJECTED' && (
                          <button
                            onClick={() => {
                              setRejectingReg(reg);
                              setRejectionReason('');
                            }}
                            disabled={actionLoading}
                            className="px-3 py-1 rounded-lg bg-red-950 border border-red-500/40 text-red-400 font-bold text-[11px] hover:bg-red-900/40"
                          >
                            Reject
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* SCREENSHOT PREVIEW MODAL */}
        {previewImage && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
            <div className="bg-[#121722] border border-[#262F45] max-w-xl w-full rounded-3xl p-6 relative">
              <button
                onClick={() => setPreviewImage(null)}
                className="absolute top-4 right-4 p-2 rounded-xl bg-[#0B0E14] text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
              <h3 className="text-sm font-bold text-white uppercase mb-4">Payment Receipt Screenshot</h3>
              <img
                src={previewImage}
                alt="Payment Receipt"
                className="w-full max-h-[70vh] object-contain rounded-xl border border-[#262F45]"
              />
            </div>
          </div>
        )}

        {/* REJECTION REASON MODAL */}
        {rejectingReg && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <div className="bg-[#121722] border border-[#262F45] w-full max-w-md rounded-3xl p-6 relative">
              <button
                onClick={() => setRejectingReg(null)}
                className="absolute top-4 right-4 p-2 rounded-xl bg-[#0B0E14] text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="text-base font-bold text-white uppercase mb-1">Reject Registration</h3>
              <p className="text-xs text-gray-400 mb-4">{rejectingReg.registrationId} ({rejectingReg.user?.name})</p>

              <form onSubmit={handleRejectSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1">Rejection Reason</label>
                  <textarea
                    rows={3}
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="e.g. Invalid transaction ID or incomplete Fonepay amount."
                    className="w-full p-3 rounded-xl bg-[#0B0E14] border border-[#262F45] text-xs text-white"
                    required
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setRejectingReg(null)}
                    className="px-4 py-2 rounded-xl bg-[#0B0E14] text-gray-400 text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="px-5 py-2 rounded-xl bg-red-600 text-white text-xs font-bold uppercase"
                  >
                    Confirm Rejection
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </main>
  );
}
