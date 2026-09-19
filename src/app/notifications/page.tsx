'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Bell,
  CheckCheck,
  Trash2,
  Search,
  Filter,
  ArrowLeft,
  ExternalLink,
  ShieldAlert,
  Sparkles,
  Smartphone,
  RefreshCw,
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import MobileBottomNav from '@/components/MobileBottomNav';
import { useUser } from '@/context/UserContext';

function getRelativeTime(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

function getTypeStyle(type?: string) {
  switch (type) {
    case 'DEPOSIT':
      return { icon: '💰', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', label: 'Deposit' };
    case 'WITHDRAWAL':
      return { icon: '💸', color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30', label: 'Withdrawal' };
    case 'TOURNAMENT':
      return { icon: '🎮', color: 'bg-[#FF2E4C]/20 text-[#FF2E4C] border-[#FF2E4C]/30', label: 'Tournament' };
    case 'ACCOUNT':
      return { icon: '👤', color: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30', label: 'Account' };
    default:
      return { icon: '📢', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30', label: 'Announcement' };
  }
}

function getStatusBadge(status?: string | null) {
  if (!status) return null;
  switch (status.toUpperCase()) {
    case 'SUCCESS':
      return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">Success</span>;
    case 'FAILED':
      return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30">Failed</span>;
    case 'PENDING':
      return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse">Pending</span>;
    default:
      return null;
  }
}

export default function NotificationsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useUser();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [pushPermission, setPushPermission] = useState<NotificationPermission | 'unsupported'>('unsupported');

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPushPermission(Notification.permission);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login?redirect=/notifications');
      return;
    }
    if (user) {
      fetchNotifications();
    }
  }, [user, authLoading, activeTab]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const url = activeTab === 'ALL' ? '/api/notifications?limit=100' : `/api/notifications?type=${activeTab}&limit=100`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.notifications) {
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (e) {
      console.error('Fetch notifications error:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestPush = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const permission = await Notification.requestPermission();
        setPushPermission(permission);
        if (permission === 'granted') {
          new Notification('Push Notifications Enabled! 🎮', {
            body: 'You will receive instant alerts for room details, deposits, and withdrawal updates.',
            icon: '/favicon.ico',
          });
        }
      } catch (e) {
        console.error('Push permission error:', e);
      }
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAll: true }),
      });
      setUnreadCount(0);
      setNotifications(notifications.map((n) => ({ ...n, read: true })));
    } catch (e) {}
  };

  const handleMarkSingleRead = async (id: string, currentRead: boolean) => {
    if (currentRead) return;
    try {
      await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId: id }),
      });
      const updated = notifications.map((n) => (n.id === id ? { ...n, read: true } : n));
      setNotifications(updated);
      setUnreadCount(updated.filter((n) => !n.read).length);
    } catch (e) {}
  };

  const handleDeleteSingle = async (id: string) => {
    try {
      await fetch(`/api/notifications?id=${id}`, { method: 'DELETE' });
      const updated = notifications.filter((n) => n.id !== id);
      setNotifications(updated);
      setUnreadCount(updated.filter((n) => !n.read).length);
    } catch (e) {}
  };

  const handleClearAll = async () => {
    if (!window.confirm('Are you sure you want to clear all notifications?')) return;
    try {
      await fetch('/api/notifications?all=true', { method: 'DELETE' });
      setNotifications([]);
      setUnreadCount(0);
    } catch (e) {}
  };

  const filteredNotifications = notifications.filter((n) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return n.title.toLowerCase().includes(q) || n.message.toLowerCase().includes(q);
  });

  const filterTabs = [
    { key: 'ALL', label: 'All Alerts', icon: Bell },
    { key: 'DEPOSIT', label: 'Deposits', icon: Sparkles },
    { key: 'WITHDRAWAL', label: 'Withdrawals', icon: Sparkles },
    { key: 'TOURNAMENT', label: 'Tournaments', icon: Sparkles },
    { key: 'ACCOUNT', label: 'Account', icon: Sparkles },
    { key: 'ANNOUNCEMENT', label: 'Announcements', icon: Sparkles },
  ];

  return (
    <div className="min-h-screen bg-[#0B0E14] text-white flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#262F45]">
          <div className="flex items-center space-x-3">
            <Link
              href="/dashboard"
              className="p-2.5 rounded-xl bg-[#121722] border border-[#262F45] text-gray-400 hover:text-white hover:border-[#FF2E4C] transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-wide uppercase">
                  Notifications <span className="text-[#FF2E4C]">Center</span>
                </h1>
                {unreadCount > 0 && (
                  <span className="px-2.5 py-0.5 rounded-full bg-[#FF2E4C] text-white text-xs font-extrabold shadow-md shadow-[#FF2E4C]/40">
                    {unreadCount} Unread
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-gray-400 mt-0.5">
                Stay updated on deposit approvals, room IDs, prize rewards, and account activity.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={fetchNotifications}
              className="p-2.5 rounded-xl bg-[#121722] border border-[#262F45] text-gray-300 hover:text-white hover:border-[#FF2E4C] transition-colors"
              title="Refresh Notifications"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>

            {pushPermission !== 'granted' && pushPermission !== 'unsupported' && (
              <button
                onClick={handleRequestPush}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold hover:bg-amber-500/20 transition-all"
              >
                <Smartphone className="w-4 h-4" />
                <span>Enable Push Alerts</span>
              </button>
            )}

            {notifications.length > 0 && (
              <button
                onClick={handleClearAll}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-950/30 border border-red-500/30 text-red-400 text-xs font-bold hover:bg-red-900/40 transition-all"
              >
                <Trash2 className="w-4 h-4" />
                <span>Clear All</span>
              </button>
            )}
          </div>
        </div>

        {/* Search & Filter bar */}
        <div className="mt-6 flex flex-col md:flex-row gap-4 items-center justify-between">
          {/* Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 custom-scrollbar">
            {filterTabs.map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex-shrink-0 flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-[#FF2E4C] text-white shadow-lg shadow-[#FF2E4C]/25'
                      : 'bg-[#121722] text-gray-400 hover:text-white border border-[#262F45]'
                  }`}
                >
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Search box */}
          <div className="relative w-full md:w-64">
            <Search className="w-4 h-4 text-gray-500 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search notifications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#121722] border border-[#262F45] text-white text-xs placeholder-gray-500 focus:outline-none focus:border-[#FF2E4C]"
            />
          </div>
        </div>

        {/* Notifications List */}
        <div className="mt-6 space-y-3">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-24 bg-[#121722] border border-[#262F45] animate-pulse rounded-2xl" />
              ))}
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="text-center py-16 bg-[#121722]/50 border border-[#262F45] rounded-3xl p-8">
              <div className="w-16 h-16 rounded-2xl bg-[#FF2E4C]/10 border border-[#FF2E4C]/20 flex items-center justify-center mx-auto mb-4">
                <Bell className="w-8 h-8 text-[#FF2E4C]" />
              </div>
              <h3 className="text-lg font-bold text-white uppercase">No notifications found</h3>
              <p className="text-xs text-gray-400 max-w-sm mx-auto mt-1">
                {searchQuery
                  ? 'No notifications matched your search term.'
                  : 'You do not have any notifications in this category yet. Important tournament and wallet updates will appear here.'}
              </p>
            </div>
          ) : (
            filteredNotifications.map((n) => {
              const badge = getTypeStyle(n.type);
              return (
                <div
                  key={n.id}
                  onClick={() => handleMarkSingleRead(n.id, n.read)}
                  className={`group relative p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer ${
                    n.read
                      ? 'bg-[#121722]/40 border-[#262F45]/60 hover:border-[#262F45]'
                      : 'bg-[#1A2234] border-[#FF2E4C]/40 hover:border-[#FF2E4C] shadow-lg shadow-black/20'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="flex items-start space-x-3.5 flex-1">
                      {/* Badge Icon */}
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 border ${badge.color}`}>
                        {badge.icon}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${badge.color}`}>
                            {badge.label}
                          </span>
                          {getStatusBadge(n.status)}
                          <span className="text-xs text-gray-400 font-medium">
                            • {getRelativeTime(n.createdAt)}
                          </span>
                          {!n.read && (
                            <span className="w-2 h-2 rounded-full bg-[#FF2E4C] animate-pulse inline-block" />
                          )}
                        </div>

                        <h3 className="text-sm sm:text-base font-bold text-white group-hover:text-[#FF9F1C] transition-colors">
                          {n.title}
                        </h3>
                        <p className="text-xs sm:text-sm text-gray-300 mt-1 leading-relaxed">
                          {n.message}
                        </p>

                        {(n.actionUrl || n.linkUrl) && (
                          <div className="mt-3">
                            <Link
                              href={n.actionUrl || n.linkUrl}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0B0E14] border border-[#262F45] text-xs font-bold text-[#FF2E4C] hover:border-[#FF2E4C] hover:text-[#FF9F1C] transition-all"
                            >
                              <span>{n.actionText || 'View Details'}</span>
                              <ExternalLink className="w-3.5 h-3.5" />
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end space-x-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#262F45]">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteSingle(n.id);
                        }}
                        className="p-2 rounded-xl bg-[#0B0E14] border border-[#262F45] text-gray-400 hover:text-red-400 hover:border-red-500/40 transition-colors"
                        title="Delete notification"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>

      <Footer />
      <MobileBottomNav />
    </div>
  );
}
