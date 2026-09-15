'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import {
  Landmark,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  Filter,
  Loader2,
  ArrowLeft,
  DollarSign,
  AlertCircle,
  Building2,
  Phone,
  User,
  Sparkles,
} from 'lucide-react';

export default function AdminWithdrawalsPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Selected Withdrawal for Rejection Modal
  const [selectedReq, setSelectedReq] = useState<any | null>(null);
  const [rejectModalOpen, setRejectModalOpen] = useState<boolean>(false);
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [actioningId, setActioningId] = useState<string | null>(null);

  useEffect(() => {
    fetchWithdrawals();
  }, [filterStatus]);

  const fetchWithdrawals = async () => {
    setLoading(true);
    setError('');
    try {
      let url = '/api/admin/withdrawals';
      const queryParams = new URLSearchParams();
      if (filterStatus !== 'ALL') queryParams.append('status', filterStatus);
      if (searchQuery.trim()) queryParams.append('search', searchQuery.trim());
      if (queryParams.toString()) url += `?${queryParams.toString()}`;

      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch withdrawal requests.');
      const data = await res.json();
      setRequests(data.withdrawalRequests || []);
    } catch (err: any) {
      setError(err.message || 'Error loading withdrawal requests');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchWithdrawals();
  };

  // Approve Withdrawal
  const handleApprove = async (id: string) => {
    if (!confirm('Approve this withdrawal request and mark payout as completed?')) return;

    setActioningId(id);
    setError('');

    try {
      const res = await fetch(`/api/admin/withdrawals/${id}/approve`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to approve withdrawal.');

      setSuccessMsg(`Withdrawal ${data.withdrawal.requestId} approved successfully.`);
      setTimeout(() => setSuccessMsg(''), 4000);
      fetchWithdrawals();
    } catch (err: any) {
      setError(err.message || 'Approval failed');
    } finally {
      setActioningId(null);
    }
  };

  // Reject Withdrawal
  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReq) return;

    setActioningId(selectedReq.id);
    setError('');

    try {
      const res = await fetch(`/api/admin/withdrawals/${selectedReq.id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rejectionReason }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to reject withdrawal.');

      setSuccessMsg(`Withdrawal ${selectedReq.requestId} rejected and funds restored to user wallet.`);
      setTimeout(() => setSuccessMsg(''), 4000);
      setRejectModalOpen(false);
      setSelectedReq(null);
      setRejectionReason('');
      fetchWithdrawals();
    } catch (err: any) {
      setError(err.message || 'Rejection failed');
    } finally {
      setActioningId(null);
    }
  };

  const pendingCount = requests.filter((r) => r.status === 'PENDING').length;
  const approvedCount = requests.filter((r) => r.status === 'APPROVED').length;
  const rejectedCount = requests.filter((r) => r.status === 'REJECTED').length;
  const totalApprovedAmount = requests
    .filter((r) => r.status === 'APPROVED')
    .reduce((sum, r) => sum + r.amount, 0);

  return (
    <main className="py-4 sm:py-8 max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 w-full space-y-6">
        
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Link href="/admin" className="text-xs text-gray-400 hover:text-white flex items-center gap-1">
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Admin Panel</span>
              </Link>
              <span className="text-gray-600">/</span>
              <span className="text-xs text-[#FF9F1C] font-bold uppercase">Withdrawal Requests</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-wide text-white flex items-center gap-2">
              <Landmark className="w-7 h-7 text-[#FF9F1C]" />
              Withdrawal Management
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">
              Review, approve, or reject user earnings withdrawal requests.
            </p>
          </div>

          <button
            onClick={fetchWithdrawals}
            className="px-4 py-2.5 rounded-xl bg-[#121722] border border-[#262F45] text-xs font-bold text-gray-300 hover:text-white transition-colors"
          >
            Refresh Queue
          </button>
        </div>

        {/* Global Notifications */}
        {error && (
          <div className="p-4 rounded-2xl bg-red-950/60 border border-red-500/50 text-red-300 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {successMsg && (
          <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-500/50 text-emerald-300 text-xs font-bold flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-[#121722] border border-[#262F45]">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Pending Approval</span>
            <span className="text-2xl font-black text-amber-400 mt-1 block">{pendingCount} Requests</span>
          </div>
          <div className="p-5 rounded-2xl bg-[#121722] border border-[#262F45]">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Approved Requests</span>
            <span className="text-2xl font-black text-emerald-400 mt-1 block">{approvedCount}</span>
          </div>
          <div className="p-5 rounded-2xl bg-[#121722] border border-[#262F45]">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Total Payout Volume</span>
            <span className="text-2xl font-black text-white mt-1 block">NPR {totalApprovedAmount.toLocaleString()}</span>
          </div>
          <div className="p-5 rounded-2xl bg-[#121722] border border-[#262F45]">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Rejected Requests</span>
            <span className="text-2xl font-black text-red-400 mt-1 block">{rejectedCount}</span>
          </div>
        </div>

        {/* Search & Status Filters */}
        <div className="p-4 rounded-2xl bg-[#121722] border border-[#262F45] flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Status Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
            {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold uppercase transition-all whitespace-nowrap ${
                  filterStatus === st
                    ? 'bg-[#FF9F1C] text-black shadow-lg shadow-[#FF9F1C]/25'
                    : 'bg-[#0B0E14] text-gray-400 hover:text-white border border-[#262F45]'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <form onSubmit={handleSearchSubmit} className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search ID, name, or account..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#0B0E14] border border-[#262F45] text-xs font-semibold text-white focus:outline-none focus:border-[#FF9F1C]"
            />
          </form>
        </div>

        {/* REQUESTS TABLE */}
        <div className="p-6 rounded-3xl bg-[#121722] border border-[#262F45] space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-[#262F45] pb-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Withdrawal Queue ({requests.length})
            </h3>
          </div>

          {loading ? (
            <div className="py-12 text-center text-gray-400">
              <Loader2 className="w-8 h-8 text-[#FF9F1C] animate-spin mx-auto mb-2" />
              <p className="text-xs font-semibold">Loading withdrawal requests...</p>
            </div>
          ) : requests.length === 0 ? (
            <div className="py-12 text-center text-gray-400 text-xs">
              No withdrawal requests found for the selected filter.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#262F45] text-gray-400 font-bold uppercase tracking-wider text-[10px]">
                    <th className="pb-3 px-3">Request ID & Date</th>
                    <th className="pb-3 px-3">User Details</th>
                    <th className="pb-3 px-3">Method</th>
                    <th className="pb-3 px-3">Account Details</th>
                    <th className="pb-3 px-3 text-right">Amount</th>
                    <th className="pb-3 px-3 text-center">Status</th>
                    <th className="pb-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#262F45]/50 font-medium">
                  {requests.map((req) => (
                    <tr key={req.id} className="hover:bg-[#1A2234]/50 transition-colors">
                      
                      {/* Request ID & Date */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="font-mono font-bold text-[#FF9F1C] block">{req.requestId}</span>
                        <span className="text-[10px] text-gray-500">{new Date(req.createdAt).toLocaleString()}</span>
                      </td>

                      {/* User Info */}
                      <td className="py-3 px-3">
                        <span className="font-bold text-white block">{req.user?.name || 'Unknown User'}</span>
                        <span className="text-[10px] text-gray-400 block font-mono">@{req.user?.username}</span>
                        <span className="text-[10px] text-gray-500 block">{req.user?.phone || req.user?.email}</span>
                      </td>

                      {/* Method */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="px-2.5 py-1 rounded-lg bg-[#0B0E14] border border-[#262F45] font-black text-white text-[11px]">
                          {req.method}
                        </span>
                      </td>

                      {/* Account Details */}
                      <td className="py-3 px-3">
                        <div className="bg-[#0B0E14] p-2 rounded-xl border border-[#262F45] text-[11px] font-mono space-y-0.5">
                          <div className="font-bold text-gray-200">{req.accountName}</div>
                          <div className="text-gray-300">{req.accountNumber}</div>
                          {req.bankName && <div className="text-amber-400 text-[10px] font-bold">{req.bankName}</div>}
                        </div>
                      </td>

                      {/* Amount */}
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <span className="font-black text-white text-sm block">NPR {req.amount.toLocaleString()}</span>
                        <span className="text-[10px] text-emerald-400">Net: NPR {req.netAmount.toLocaleString()}</span>
                      </td>

                      {/* Status Badge */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase border inline-flex items-center gap-1 ${
                            req.status === 'APPROVED'
                              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                              : req.status === 'REJECTED'
                              ? 'bg-red-500/20 text-red-400 border-red-500/40'
                              : 'bg-amber-500/20 text-amber-400 border-amber-500/40 animate-pulse'
                          }`}
                        >
                          {req.status === 'APPROVED' && <CheckCircle className="w-3 h-3" />}
                          {req.status === 'REJECTED' && <XCircle className="w-3 h-3" />}
                          {req.status === 'PENDING' && <Clock className="w-3 h-3" />}
                          <span>{req.status}</span>
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        {req.status === 'PENDING' ? (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleApprove(req.id)}
                              disabled={actioningId === req.id}
                              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md flex items-center gap-1"
                            >
                              {actioningId === req.id && <Loader2 className="w-3 h-3 animate-spin" />}
                              <span>Approve</span>
                            </button>

                            <button
                              onClick={() => {
                                setSelectedReq(req);
                                setRejectModalOpen(true);
                              }}
                              disabled={actioningId === req.id}
                              className="px-3 py-1.5 rounded-xl bg-red-600/80 hover:bg-red-600 text-white text-xs font-bold transition-all"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-[10px] text-gray-500 italic">
                            Processed {req.processedAt ? new Date(req.processedAt).toLocaleDateString() : ''}
                          </span>
                        )}
                      </td>

                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* REJECTION REASON MODAL */}
        {rejectModalOpen && selectedReq && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <div className="bg-[#121722] border border-[#262F45] w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4">
              
              <div className="flex items-center justify-between border-b border-[#262F45] pb-3">
                <h3 className="text-base font-bold text-white uppercase flex items-center gap-2">
                  <XCircle className="w-5 h-5 text-red-500" />
                  Reject Withdrawal Request
                </h3>
                <button
                  onClick={() => {
                    setRejectModalOpen(false);
                    setSelectedReq(null);
                  }}
                  className="text-gray-400 hover:text-white text-xs"
                >
                  ✕
                </button>
              </div>

              <div className="text-xs space-y-1 bg-[#0B0E14] p-3 rounded-2xl border border-[#262F45]">
                <div>Request ID: <span className="font-mono font-bold text-[#FF9F1C]">{selectedReq.requestId}</span></div>
                <div>User: <span className="font-bold text-white">{selectedReq.user?.name}</span></div>
                <div>Amount: <span className="font-bold text-white">NPR {selectedReq.amount.toLocaleString()}</span></div>
                <div>Method: <span className="font-bold text-gray-300">{selectedReq.method} ({selectedReq.accountNumber})</span></div>
              </div>

              <p className="text-xs text-gray-300">
                Rejecting this request will immediately refund <strong>NPR {selectedReq.amount.toLocaleString()}</strong> back to the user's withdrawable earnings balance.
              </p>

              <form onSubmit={handleRejectSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-300 uppercase tracking-wider block">
                    Rejection Reason (Required)
                  </label>
                  <textarea
                    rows={3}
                    required
                    placeholder="e.g. Invalid eSewa ID / Name mismatch on bank account."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className="w-full p-3 rounded-xl bg-[#0B0E14] border border-[#262F45] text-xs text-white placeholder-gray-600 focus:outline-none focus:border-red-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setRejectModalOpen(false);
                      setSelectedReq(null);
                    }}
                    className="px-4 py-2 rounded-xl bg-[#0B0E14] border border-[#262F45] text-xs text-gray-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actioningId === selectedReq.id || !rejectionReason.trim()}
                    className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-1.5"
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
