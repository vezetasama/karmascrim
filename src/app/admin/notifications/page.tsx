'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Bell,
  Send,
  Users,
  UserCheck,
  Search,
  Trash2,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Filter,
  Check,
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

function getTypeBadge(type?: string) {
  switch (type) {
    case 'DEPOSIT':
      return { icon: '💰', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', label: 'Deposit' };
    case 'WITHDRAWAL':
      return { icon: '💸', color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30', label: 'Withdrawal' };
    case 'TOURNAMENT':
      return { icon: '🎮', color: 'bg-[#FF2E4C]/20 text-[#FF2E4C] border-[#FF2E4C]/30', label: 'Tournament' };
    case 'ACCOUNT':
      return { icon: '👤', color: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30', label: 'Account' };
    case 'TOPUP':
      return { icon: '⚡', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30', label: 'Top-up' };
    default:
      return { icon: '📢', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30', label: 'Announcement' };
  }
}

export default function AdminNotificationsPage() {
  const router = useRouter();

  // Form State
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState('ANNOUNCEMENT');
  const [recipientType, setRecipientType] = useState<'ALL' | 'SPECIFIC'>('ALL');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [actionText, setActionText] = useState('');
  const [actionUrl, setActionUrl] = useState('');
  const [sending, setSending] = useState(false);
  const [formFeedback, setFormFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // User list for specific selection
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [userPickerOpen, setUserPickerOpen] = useState(false);

  // History State
  const [logs, setLogs] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historySearch, setHistorySearch] = useState('');
  const [historyTypeFilter, setHistoryTypeFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });

  useEffect(() => {
    fetchUsers();
    fetchHistory();
  }, [page, historyTypeFilter]);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      if (data.users) {
        setAllUsers(data.users);
      }
    } catch (e) {
      console.error('Fetch users error:', e);
    }
  };

  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      const query = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        search: historySearch,
        type: historyTypeFilter,
      });
      const res = await fetch(`/api/admin/notifications?${query.toString()}`);
      const data = await res.json();
      if (data.logs) {
        setLogs(data.logs);
        setPagination(data.pagination || { total: 0, totalPages: 1 });
      }
    } catch (e) {
      console.error('Fetch history error:', e);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleSearchHistorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchHistory();
  };

  const handleToggleUserSelection = (userId: string) => {
    if (selectedUserIds.includes(userId)) {
      setSelectedUserIds(selectedUserIds.filter((id) => id !== userId));
    } else {
      setSelectedUserIds([...selectedUserIds, userId]);
    }
  };

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormFeedback(null);

    if (!title.trim()) {
      setFormFeedback({ type: 'error', message: 'Notification title is required.' });
      return;
    }
    if (!message.trim()) {
      setFormFeedback({ type: 'error', message: 'Notification message is required.' });
      return;
    }
    if (recipientType === 'SPECIFIC' && selectedUserIds.length === 0) {
      setFormFeedback({ type: 'error', message: 'Please select at least one recipient user.' });
      return;
    }

    setSending(true);

    try {
      const res = await fetch('/api/admin/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          message,
          type,
          recipientType,
          targetUserIds: recipientType === 'SPECIFIC' ? selectedUserIds : [],
          actionText: actionText.trim() || undefined,
          actionUrl: actionUrl.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to send notification');
      }

      setFormFeedback({
        type: 'success',
        message: `Notification successfully sent to ${data.recipientCount} user(s)!`,
      });

      // Reset form
      setTitle('');
      setMessage('');
      setActionText('');
      setActionUrl('');
      setSelectedUserIds([]);
      setRecipientType('ALL');

      // Refresh history
      setPage(1);
      fetchHistory();
    } catch (err: any) {
      setFormFeedback({ type: 'error', message: err.message || 'Failed to send notification' });
    } finally {
      setSending(false);
    }
  };

  const handleDeleteLog = async (id: string) => {
    if (!window.confirm('Delete this notification log entry?')) return;
    try {
      await fetch(`/api/admin/notifications?id=${id}`, { method: 'DELETE' });
      fetchHistory();
    } catch (e) {
      console.error('Delete log error:', e);
    }
  };

  const filteredUsersForPicker = allUsers.filter((u) => {
    if (!userSearch.trim()) return true;
    const q = userSearch.toLowerCase();
    return (
      u.name.toLowerCase().includes(q) ||
      u.username.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-[#0B0E14] text-white flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#262F45]">
          <div className="flex items-center space-x-3">
            <Link
              href="/admin"
              className="p-2.5 rounded-xl bg-[#121722] border border-[#262F45] text-gray-400 hover:text-white hover:border-[#FF2E4C] transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-wide uppercase">
                Notification <span className="text-cyan-400">Management</span>
              </h1>
              <p className="text-xs sm:text-sm text-gray-400 mt-0.5">
                Dispatch manual notifications, tournament alerts, and broadcast announcements to players.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-8">
          {/* LEFT: Send Notification Form */}
          <div className="lg:col-span-5 bg-[#121722] border border-[#262F45] rounded-3xl p-6 shadow-xl h-fit">
            <div className="flex items-center space-x-2.5 pb-4 border-b border-[#262F45]">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <Send className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-white uppercase tracking-wider">Send Notification</h2>
                <p className="text-[11px] text-gray-400">Broadcast or direct target message</p>
              </div>
            </div>

            {formFeedback && (
              <div
                className={`mt-4 p-3 rounded-xl border text-xs flex items-center gap-2 ${
                  formFeedback.type === 'success'
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                    : 'bg-red-500/10 border-red-500/30 text-red-400'
                }`}
              >
                {formFeedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
                <span>{formFeedback.message}</span>
              </div>
            )}

            <form onSubmit={handleSendNotification} className="mt-4 space-y-4">
              {/* Recipient Selection */}
              <div>
                <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-2">
                  Recipient Audience
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRecipientType('ALL')}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                      recipientType === 'ALL'
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                        : 'bg-[#0B0E14] border-[#262F45] text-gray-400 hover:text-white'
                    }`}
                  >
                    <Users className="w-4 h-4" />
                    <span>All Users</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRecipientType('SPECIFIC')}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                      recipientType === 'SPECIFIC'
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                        : 'bg-[#0B0E14] border-[#262F45] text-gray-400 hover:text-white'
                    }`}
                  >
                    <UserCheck className="w-4 h-4" />
                    <span>Selected ({selectedUserIds.length})</span>
                  </button>
                </div>
              </div>

              {/* Specific User Picker Modal Trigger */}
              {recipientType === 'SPECIFIC' && (
                <div className="p-3 rounded-xl bg-[#0B0E14] border border-[#262F45] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-300 font-semibold">
                      {selectedUserIds.length === 0 ? 'No user selected' : `${selectedUserIds.length} recipient(s) selected`}
                    </span>
                    <button
                      type="button"
                      onClick={() => setUserPickerOpen(!userPickerOpen)}
                      className="text-xs font-bold text-cyan-400 hover:underline"
                    >
                      {userPickerOpen ? 'Done Selecting' : 'Choose Users'}
                    </button>
                  </div>

                  {userPickerOpen && (
                    <div className="mt-2 pt-2 border-t border-[#262F45] space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                      <input
                        type="text"
                        placeholder="Search player name or username..."
                        value={userSearch}
                        onChange={(e) => setUserSearch(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg bg-[#121722] border border-[#262F45] text-white text-xs placeholder-gray-500 focus:outline-none focus:border-cyan-400"
                      />
                      <div className="space-y-1">
                        {filteredUsersForPicker.map((u) => {
                          const isSelected = selectedUserIds.includes(u.id);
                          return (
                            <div
                              key={u.id}
                              onClick={() => handleToggleUserSelection(u.id)}
                              className={`p-2 rounded-lg text-xs cursor-pointer flex items-center justify-between transition-colors ${
                                isSelected ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'hover:bg-[#121722] text-gray-300'
                              }`}
                            >
                              <div>
                                <span className="font-bold">{u.name}</span>
                                <span className="text-gray-500 text-[10px] ml-1">(@{u.username})</span>
                              </div>
                              {isSelected && <Check className="w-4 h-4 text-cyan-400" />}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Notification Type */}
              <div>
                <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1">
                  Notification Type
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0B0E14] border border-[#262F45] text-white text-xs font-semibold focus:outline-none focus:border-cyan-400"
                >
                  <option value="ANNOUNCEMENT">📢 Announcement</option>
                  <option value="TOURNAMENT">🎮 Tournament</option>
                  <option value="DEPOSIT">💰 Deposit</option>
                  <option value="WITHDRAWAL">💸 Withdrawal</option>
                  <option value="TOPUP">⚡ Top-up</option>
                  <option value="ACCOUNT">👤 Account</option>
                </select>
              </div>

              {/* Title Input */}
              <div>
                <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1">
                  Notification Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g. 🎮 New Full Map Squad Tournament Live!"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0B0E14] border border-[#262F45] text-white text-xs placeholder-gray-500 focus:outline-none focus:border-cyan-400"
                  required
                />
              </div>

              {/* Message Input */}
              <div>
                <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1">
                  Notification Message *
                </label>
                <textarea
                  rows={3}
                  placeholder="Enter details of the notification to be delivered to players..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0B0E14] border border-[#262F45] text-white text-xs placeholder-gray-500 focus:outline-none focus:border-cyan-400 resize-none"
                  required
                />
              </div>

              {/* Optional Action Button Text */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                    Button Text (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. View Tournament"
                    value={actionText}
                    onChange={(e) => setActionText(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#0B0E14] border border-[#262F45] text-white text-xs placeholder-gray-500 focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                    Action URL / Page (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. /tournaments"
                    value={actionUrl}
                    onChange={(e) => setActionUrl(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#0B0E14] border border-[#262F45] text-white text-xs placeholder-gray-500 focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={sending}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-black font-extrabold text-xs uppercase tracking-wider hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 disabled:opacity-50"
              >
                {sending ? (
                  <span>Sending Notifications...</span>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Send Notification Now</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* RIGHT: Notification History Table */}
          <div className="lg:col-span-7 bg-[#121722] border border-[#262F45] rounded-3xl p-6 shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#262F45]">
                <div>
                  <h2 className="text-base font-extrabold text-white uppercase tracking-wider">Broadcast History</h2>
                  <p className="text-[11px] text-gray-400">Log of admin-sent manual and broadcast notifications</p>
                </div>

                {/* Filters */}
                <form onSubmit={handleSearchHistorySubmit} className="flex items-center gap-2">
                  <select
                    value={historyTypeFilter}
                    onChange={(e) => {
                      setHistoryTypeFilter(e.target.value);
                      setPage(1);
                    }}
                    className="px-2.5 py-1.5 rounded-xl bg-[#0B0E14] border border-[#262F45] text-white text-xs font-semibold focus:outline-none"
                  >
                    <option value="ALL">All Types</option>
                    <option value="ANNOUNCEMENT">Announcement</option>
                    <option value="TOURNAMENT">Tournament</option>
                    <option value="DEPOSIT">Deposit</option>
                    <option value="WITHDRAWAL">Withdrawal</option>
                    <option value="TOPUP">Top-up</option>
                    <option value="ACCOUNT">Account</option>
                  </select>

                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search history..."
                      value={historySearch}
                      onChange={(e) => setHistorySearch(e.target.value)}
                      className="pl-8 pr-3 py-1.5 rounded-xl bg-[#0B0E14] border border-[#262F45] text-white text-xs placeholder-gray-500 focus:outline-none focus:border-cyan-400 w-36 sm:w-44"
                    />
                    <Search className="w-3.5 h-3.5 text-gray-500 absolute left-2.5 top-2.5" />
                  </div>
                </form>
              </div>

              {/* History Table */}
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-[#262F45] text-gray-400 uppercase text-[10px] tracking-wider">
                      <th className="py-3 px-2">Type</th>
                      <th className="py-3 px-2">Notification</th>
                      <th className="py-3 px-2">Recipients</th>
                      <th className="py-3 px-2">Read Count</th>
                      <th className="py-3 px-2">Date / Time</th>
                      <th className="py-3 px-2 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#262F45]/50">
                    {historyLoading ? (
                      [1, 2, 3, 4].map((i) => (
                        <tr key={i} className="animate-pulse">
                          <td colSpan={6} className="py-4 text-center text-gray-500">Loading history...</td>
                        </tr>
                      ))
                    ) : logs.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-gray-400">
                          <Bell className="w-8 h-8 mx-auto mb-2 text-gray-600 opacity-50" />
                          <p>No broadcast history logs found.</p>
                        </td>
                      </tr>
                    ) : (
                      logs.map((log) => {
                        const badge = getTypeBadge(log.type);
                        return (
                          <tr key={log.id} className="hover:bg-[#0B0E14]/40 transition-colors">
                            <td className="py-3 px-2">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold border flex items-center gap-1 w-fit ${badge.color}`}>
                                <span>{badge.icon}</span>
                                <span>{badge.label}</span>
                              </span>
                            </td>

                            <td className="py-3 px-2 max-w-xs">
                              <div className="font-bold text-white truncate">{log.title}</div>
                              <div className="text-[11px] text-gray-400 truncate mt-0.5">{log.message}</div>
                              {log.actionText && (
                                <span className="text-[10px] text-cyan-400 block mt-0.5">Button: {log.actionText}</span>
                              )}
                            </td>

                            <td className="py-3 px-2">
                              <span className="px-2 py-0.5 rounded bg-[#0B0E14] border border-[#262F45] text-gray-300 font-bold text-[10px]">
                                {log.recipientType === 'ALL' ? 'All Users' : 'Selected Users'} ({log.recipientCount})
                              </span>
                            </td>

                            <td className="py-3 px-2">
                              <span className="text-emerald-400 font-bold">
                                {log.readCount || 0} / {log.recipientCount}
                              </span>
                            </td>

                            <td className="py-3 px-2 text-[11px] text-gray-400 whitespace-nowrap">
                              {new Date(log.createdAt).toLocaleDateString()} {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </td>

                            <td className="py-3 px-2 text-right">
                              <button
                                onClick={() => handleDeleteLog(log.id)}
                                className="p-1.5 rounded-lg bg-[#0B0E14] border border-[#262F45] text-gray-400 hover:text-red-400 hover:border-red-500/40 transition-colors"
                                title="Delete Log Entry"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination Controls */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between pt-4 mt-4 border-t border-[#262F45]">
                <span className="text-xs text-gray-400">
                  Page {page} of {pagination.totalPages} ({pagination.total} total logs)
                </span>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="p-1.5 rounded-lg bg-[#0B0E14] border border-[#262F45] text-gray-300 hover:text-white disabled:opacity-40"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setPage(Math.min(pagination.totalPages, page + 1))}
                    disabled={page === pagination.totalPages}
                    className="p-1.5 rounded-lg bg-[#0B0E14] border border-[#262F45] text-gray-300 hover:text-white disabled:opacity-40"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
