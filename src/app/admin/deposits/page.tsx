'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import {
  Wallet,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  Filter,
  Eye,
  Loader2,
  ArrowLeft,
  DollarSign,
  ExternalLink,
  Sparkles,
} from 'lucide-react';

export default function AdminDepositsPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Selected Deposit for Details / Rejection Modal
  const [selectedReq, setSelectedReq] = useState<any | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [rejectModalOpen, setRejectModalOpen] = useState<boolean>(false);
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [actioningId, setActioningId] = useState<string | null>(null);

  useEffect(() => {
    fetchDeposits();
  }, [filterStatus]);

  const fetchDeposits = async () => {
    setLoading(true);
    setError('');
    try {
      let url = '/api/admin/deposits';
      const queryParams = new URLSearchParams();
      if (filterStatus !== 'ALL') queryParams.append('status', filterStatus);
      if (searchQuery.trim()) queryParams.append('search', searchQuery.trim());
      if (queryParams.toString()) url += `?${queryParams.toString()}`;

      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch deposit requests.');
      const data = await res.json();
      setRequests(data.depositRequests || []);
    } catch (err: any) {
      setError(err.message || 'Error loading deposit requests');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchDeposits();
  };

  // Approve Deposit
  const handleApprove = async (id: string) => {
    if (!confirm('Approve this deposit and credit the user\'s wallet balance now?')) return;

    setActioningId(id);
    setError('');

    try {
      const res = await fetch(`/api/admin/deposits/${id}/approve`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to approve deposit.');

      setSuccessMsg(`Deposit approved! 🪙 ${data.deposit.amount} COINS credited to user wallet.`);
      setTimeout(() => setSuccessMsg(''), 4000);
      fetchDeposits();
    } catch (err: any) {
      setError(err.message || 'Approval failed');
    } finally {
      setActioningId(null);
    }
  };

  // Reject Deposit
  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReq) return;

    setActioningId(selectedReq.id);
    setError('');

    try {
      const res = await fetch(`/api/admin/deposits/${selectedReq.id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rejectionReason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to reject deposit.');

      setSuccessMsg('Deposit request rejected.');
      setTimeout(() => setSuccessMsg(''), 4000);
      setRejectModalOpen(false);
      setSelectedReq(null);
      fetchDeposits();
    } catch (err: any) {
      setError(err.message || 'Rejection failed');
    } finally {
      setActioningId(null);
    }
  };

  const pendingCount = requests.filter((r) => r.status === 'PENDING').length;
  const approvedCount = requests.filter((r) => r.status === 'APPROVED').length;
  const approvedSum = requests
    .filter((r) => r.status === 'APPROVED')
    .reduce((sum, r) => sum + r.amount, 0);

  return (
    <main className="py-4 sm:py-8 max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 w-full space-y-6 sm:space-y-8">
        
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Link
                href="/admin"
                className="text-xs text-gray-400 hover:text-white flex items-center gap-1 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Admin Command Center</span>
              </Link>
              <span className="text-gray-600">/</span>
              <span className="text-xs text-[#FF2E4C] font-bold uppercase">Wallet Deposit Verification</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-wide flex items-center gap-2">
              <Wallet className="w-7 h-7 text-[#FF9F1C]" />
              Add Money & Deposit Requests
            </h1>
            <p className="text-xs text-gray-400 mt-1">
              Verify Fonepay transactions, preview payment screenshots, and approve wallet balance top-ups.
            </p>
          </div>
        </div>

        {/* Global Notifications */}
        {successMsg && (
          <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-500/50 text-emerald-300 text-xs font-semibold flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-2xl bg-red-950/60 border border-red-500/50 text-red-300 text-xs font-semibold flex items-center gap-2">
            <XCircle className="w-4 h-4 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {/* STATS OVERVIEW CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-[#121722] border border-amber-500/40">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Pending Approvals</span>
            <div className="text-2xl font-black text-amber-400 mt-1">{pendingCount} Requests</div>
            <span className="text-[11px] text-gray-400 mt-1 block">Requires admin review</span>
          </div>

          <div className="p-5 rounded-2xl bg-[#121722] border border-emerald-500/40">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Total Approved Funds</span>
            <div className="text-2xl font-black text-emerald-400 mt-1">🪙 {approvedSum.toLocaleString()} COINS</div>
            <span className="text-[11px] text-gray-400 mt-1 block">{approvedCount} approved deposits</span>
          </div>

          <div className="p-5 rounded-2xl bg-[#121722] border border-[#262F45]">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Total Requests Processed</span>
            <div className="text-2xl font-black text-white mt-1">{requests.length} Total</div>
            <span className="text-[11px] text-gray-400 mt-1 block">Across all statuses</span>
          </div>
        </div>

        {/* SEARCH & FILTERS BAR */}
        <div className="p-4 rounded-2xl bg-[#121722] border border-[#262F45] flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Status Tabs */}
          <div className="flex items-center gap-1 bg-[#0B0E14] p-1 rounded-xl border border-[#262F45] w-full md:w-auto">
            {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase transition-all ${
                  filterStatus === st
                    ? 'bg-[#FF2E4C] text-white shadow-md'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full md:w-72">
            <div className="relative w-full">
              <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search username, TxID, RegID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#0B0E14] border border-[#262F45] text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#FF2E4C]"
              />
            </div>
            <button
              type="submit"
              className="px-3 py-2 rounded-xl bg-[#1A2234] border border-[#262F45] text-xs font-bold text-gray-300 hover:text-white"
            >
              Filter
            </button>
          </form>
        </div>

        {/* DEPOSIT REQUESTS TABLE */}
        {loading ? (
          <div className="p-16 text-center bg-[#121722] rounded-3xl border border-[#262F45]">
            <Loader2 className="w-8 h-8 text-[#FF2E4C] animate-spin mx-auto mb-3" />
            <p className="text-xs text-gray-400">Fetching deposit requests...</p>
          </div>
        ) : requests.length === 0 ? (
          <div className="p-12 text-center bg-[#121722] rounded-3xl border border-[#262F45] space-y-2">
            <Wallet className="w-10 h-10 text-gray-600 mx-auto" />
            <h3 className="text-base font-bold text-gray-300">No Deposit Requests Found</h3>
            <p className="text-xs text-gray-500">There are no deposit requests matching your filter.</p>
          </div>
        ) : (
          <div className="bg-[#121722] rounded-3xl border border-[#262F45] overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-gray-300">
                <thead className="bg-[#0B0E14] text-[#FF9F1C] uppercase text-[10px] font-bold border-b border-[#262F45]">
                  <tr>
                    <th className="p-4">Req ID</th>
                    <th className="p-4">User Account</th>
                    <th className="p-4">Amount</th>
                    <th className="p-4">Method & TxID</th>
                    <th className="p-4">Screenshot</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#262F45]">
                  {requests.map((req) => (
                    <tr key={req.id} className="hover:bg-[#1A2234] transition-colors">
                      
                      {/* Req ID & Date */}
                      <td className="p-4">
                        <div className="font-mono font-black text-white">{req.requestId}</div>
                        <div className="text-[10px] text-gray-500 mt-0.5">
                          {new Date(req.createdAt).toLocaleDateString()} {new Date(req.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>

                      {/* User Account */}
                      <td className="p-4">
                        <div className="font-bold text-white">{req.user?.name}</div>
                        <div className="text-[10px] text-[#FF9F1C]">@{req.user?.username}</div>
                        <div className="text-[10px] text-gray-400">{req.user?.email}</div>
                      </td>

                      {/* Amount */}
                      <td className="p-4 font-black text-base text-emerald-400">
                        🪙 {req.amount.toLocaleString()} COIN
                      </td>

                      {/* Gateway & TxID */}
                      <td className="p-4">
                        <div className="font-bold text-white">{req.paymentMethod?.name || 'Fonepay'}</div>
                        <div className="font-mono text-xs text-[#FF9F1C] mt-0.5">{req.transactionId}</div>
                        {req.note && <div className="text-[10px] text-gray-400 italic mt-0.5">"{req.note}"</div>}
                      </td>

                      {/* Screenshot Preview */}
                      <td className="p-4">
                        {req.screenshotUrl ? (
                          <button
                            type="button"
                            onClick={() => setPreviewImage(req.screenshotUrl)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#0B0E14] border border-[#262F45] text-[11px] font-bold text-gray-300 hover:text-white hover:border-[#FF2E4C]"
                          >
                            <Eye className="w-3.5 h-3.5 text-[#FF2E4C]" />
                            <span>View Proof</span>
                          </button>
                        ) : (
                          <span className="text-gray-600 text-[11px]">No Image</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="p-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase border inline-flex items-center gap-1 ${
                            req.status === 'APPROVED'
                              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                              : req.status === 'REJECTED'
                              ? 'bg-red-500/20 text-red-400 border-red-500/40'
                              : 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                          }`}
                        >
                          {req.status === 'APPROVED' && <CheckCircle className="w-3 h-3 text-emerald-400" />}
                          {req.status === 'REJECTED' && <XCircle className="w-3 h-3 text-red-400" />}
                          {req.status === 'PENDING' && <Clock className="w-3 h-3 text-amber-400" />}
                          <span>{req.status}</span>
                        </span>
                        {req.rejectionReason && (
                          <div className="text-[10px] text-red-400 mt-1">Reason: {req.rejectionReason}</div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="p-4 text-right">
                        {req.status === 'PENDING' ? (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              disabled={actioningId === req.id}
                              onClick={() => handleApprove(req.id)}
                              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold uppercase tracking-wider disabled:opacity-50 flex items-center gap-1"
                            >
                              {actioningId === req.id ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <CheckCircle className="w-3 h-3" />
                              )}
                              <span>Approve</span>
                            </button>

                            <button
                              disabled={actioningId === req.id}
                              onClick={() => {
                                setSelectedReq(req);
                                setRejectionReason('');
                                setRejectModalOpen(true);
                              }}
                              className="px-3 py-1.5 rounded-xl bg-red-950/60 border border-red-500/40 text-red-300 hover:bg-red-900/60 text-[11px] font-bold uppercase tracking-wider"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-gray-500 italic">Processed</span>
                        )}
                      </td>

                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* MODAL: IMAGE PREVIEW */}
        {previewImage && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <div className="bg-[#121722] border border-[#262F45] max-w-xl w-full rounded-3xl p-5 space-y-4 relative shadow-2xl">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase text-white">Payment Screenshot Verification</h3>
                <button
                  onClick={() => setPreviewImage(null)}
                  className="text-gray-400 hover:text-white p-1"
                >
                  ✕
                </button>
              </div>
              <div className="max-h-[70vh] overflow-auto rounded-2xl border border-[#262F45]">
                <img src={previewImage} alt="Payment Proof" className="w-full h-auto object-contain" />
              </div>
            </div>
          </div>
        )}

        {/* MODAL: REJECT DEPOSIT REASON */}
        {rejectModalOpen && selectedReq && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <div className="bg-[#121722] border border-red-500/40 max-w-md w-full rounded-3xl p-6 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between border-b border-[#262F45] pb-3">
                <h3 className="text-base font-bold uppercase text-red-400">Reject Deposit Request</h3>
                <button
                  onClick={() => setRejectModalOpen(false)}
                  className="text-gray-400 hover:text-white p-1"
                >
                  ✕
                </button>
              </div>

              <div className="text-xs text-gray-300 space-y-1">
                <div>Req ID: <span className="font-mono text-white font-bold">{selectedReq.requestId}</span></div>
                <div>User: <span className="text-[#FF9F1C] font-bold">@{selectedReq.user?.username}</span></div>
                <div>Amount: <span className="text-white font-bold">🪙 {selectedReq.amount} COIN</span></div>
              </div>

              <form onSubmit={handleRejectSubmit} className="space-y-4 pt-2">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-300 uppercase tracking-wider block">
                    Rejection Reason
                  </label>
                  <textarea
                    required
                    rows={3}
                    placeholder="e.g. Transaction ID not found or screenshot unreadable."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className="w-full p-3 rounded-xl bg-[#0B0E14] border border-[#262F45] text-xs text-white placeholder-gray-600 focus:outline-none focus:border-red-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setRejectModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-[#0B0E14] border border-[#262F45] text-xs font-bold text-gray-400 hover:text-white"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={actioningId === selectedReq.id}
                    className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold uppercase tracking-wider disabled:opacity-50 flex items-center gap-1"
                  >
                    {actioningId === selectedReq.id && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>Confirm Rejection</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </main>
  );
}
