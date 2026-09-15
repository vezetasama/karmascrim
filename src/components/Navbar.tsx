'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Flame, LogOut, Bell, LayoutDashboard, Shield, Wallet, CheckCheck, Trash2, ExternalLink } from 'lucide-react';
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
    default:
      return { icon: '📢', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30', label: 'Notice' };
  }
}

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user: currentUser, balance, loading, refreshUser } = useUser();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pushPermission, setPushPermission] = useState<NotificationPermission | 'unsupported'>('unsupported');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const prevUnreadRef = useRef<number>(0);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPushPermission(Notification.permission);
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (currentUser) {
      fetchNotifications();
      const interval = window.setInterval(() => {
        fetchNotifications();
      }, 10000); // 10s reliable polling

      return () => window.clearInterval(interval);
    }

    setNotifications([]);
    setUnreadCount(0);
    return undefined;
  }, [currentUser, pathname]);

  const requestPushPermission = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const permission = await Notification.requestPermission();
        setPushPermission(permission);
        if (permission === 'granted') {
          new Notification('Karma Scrims Notifications Enabled! 🎮', {
            body: 'You will now receive instant push alerts for deposits, tournament room details, and payouts.',
            icon: '/favicon.ico',
          });
        }
      } catch (e) {
        console.error('Error requesting notification permission:', e);
      }
    }
  };

  const triggerDesktopPushIfNew = (newItems: any[], newUnreadCount: number) => {
    if (
      typeof window !== 'undefined' &&
      'Notification' in window &&
      Notification.permission === 'granted' &&
      newUnreadCount > prevUnreadRef.current &&
      prevUnreadRef.current !== 0
    ) {
      const newest = newItems.find((n) => !n.read);
      if (newest) {
        new Notification(newest.title || 'Karma Scrims Alert', {
          body: newest.message,
          icon: '/favicon.ico',
        });
      }
    }
    prevUnreadRef.current = newUnreadCount;
  };

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications?limit=15');
      const data = await res.json();
      if (data.notifications) {
        setNotifications(data.notifications);
        const newUnread = data.unreadCount || 0;
        triggerDesktopPushIfNew(data.notifications, newUnread);
        setUnreadCount(newUnread);
      }
    } catch (e) {}
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      await refreshUser();
      router.push('/');
      router.refresh();
    } catch (e) {}
  };

  const markAllRead = async () => {
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

  const deleteNotification = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    e.preventDefault();
    try {
      await fetch(`/api/notifications?id=${id}`, { method: 'DELETE' });
      const updated = notifications.filter((n) => n.id !== id);
      setNotifications(updated);
      setUnreadCount(updated.filter((n) => !n.read).length);
    } catch (e) {}
  };

  const formattedBalance = (balance ?? 0).toLocaleString();

  return (
    <nav className="sticky top-0 z-50 bg-[#0B0E14]/90 backdrop-blur-md border-b border-[#262F45]">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-2">

          {/* Left Side: Brand Logo */}
          <div className="flex items-center space-x-3 sm:space-x-4">
            <Link href="/" className="flex items-center space-x-2.5 sm:space-x-3 group">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-[#FF2E4C] to-[#FF9F1C] flex items-center justify-center shadow-lg shadow-[#FF2E4C]/25 group-hover:scale-105 transition-transform flex-shrink-0">
                <Flame className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-lg sm:text-2xl font-extrabold tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-white via-gray-200 to-gray-400 uppercase leading-none sm:leading-normal">
                  KARMA <span className="text-[#FF2E4C]">SCRIMS</span>
                </span>
                <span className="hidden xs:block text-[9px] sm:text-[10px] text-gray-400 font-semibold tracking-widest uppercase mt-0.5">
                  Free Fire Esports Nepal
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden lg:flex items-center space-x-6">
            <Link
              href="/tournaments"
              className={`text-sm font-semibold transition-colors ${
                pathname === '/tournaments' ? 'text-[#FF2E4C]' : 'text-gray-300 hover:text-white'
              }`}
            >
              All Tournaments
            </Link>
            <Link
              href="/notifications"
              className={`text-sm font-semibold transition-colors ${
                pathname === '/notifications' ? 'text-[#FF2E4C]' : 'text-gray-300 hover:text-white'
              }`}
            >
              Notifications
            </Link>
          </div>

          {/* Right Side: User Auth / Balance & Profile Actions */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {loading ? (
              <div className="w-24 h-8 bg-[#121722] animate-pulse rounded-xl border border-[#262F45]" />
            ) : currentUser ? (
              <div className="flex items-center space-x-2 sm:space-x-3">

                {/* Balance Pill — Dynamic for Logged-In User */}
                <Link
                  href="/wallet"
                  title="Available Balance — Click to Deposit / View History"
                  className="flex items-center space-x-1.5 sm:space-x-2 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl bg-[#121722] border border-[#262F45] hover:border-[#FF2E4C] transition-all group shadow-inner"
                >
                  <span className="text-xs sm:text-sm">💰</span>
                  <div className="flex items-center space-x-1">
                    <span className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider">NPR</span>
                    <span className="text-xs sm:text-sm font-extrabold text-white group-hover:text-[#FF9F1C] transition-colors">
                      {formattedBalance}
                    </span>
                  </div>
                </Link>

                {/* Notifications Bell Dropdown */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setNotificationsOpen(!notificationsOpen)}
                    className="p-2 rounded-xl bg-[#121722] border border-[#262F45] text-gray-300 hover:text-white relative hover:border-[#FF2E4C] transition-colors"
                    aria-label="Notifications"
                  >
                    <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-[#FF2E4C] text-white text-[10px] sm:text-[11px] font-bold flex items-center justify-center animate-bounce shadow-md shadow-[#FF2E4C]/50">
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Notifications Dropdown Panel */}
                  {notificationsOpen && (
                    <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-[#121722] border border-[#262F45] rounded-2xl shadow-2xl p-4 z-50">
                      <div className="flex items-center justify-between pb-3 border-b border-[#262F45]">
                        <div className="flex items-center space-x-2">
                          <h4 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider">Notifications</h4>
                          {unreadCount > 0 && (
                            <span className="px-2 py-0.5 rounded-full bg-[#FF2E4C]/20 text-[#FF2E4C] text-[10px] font-bold border border-[#FF2E4C]/30">
                              {unreadCount} new
                            </span>
                          )}
                        </div>
                        {unreadCount > 0 && (
                          <button
                            onClick={markAllRead}
                            className="flex items-center gap-1 text-[11px] text-[#FF9F1C] hover:underline font-semibold"
                          >
                            <CheckCheck className="w-3.5 h-3.5" />
                            <span>Mark all read</span>
                          </button>
                        )}
                      </div>

                      {/* Push Notification Toggle Banner */}
                      {pushPermission === 'default' && (
                        <div className="my-2 p-2.5 rounded-xl bg-[#FF9F1C]/10 border border-[#FF9F1C]/30 flex items-center justify-between text-xs">
                          <span className="text-gray-300">Enable Desktop Push Alerts?</span>
                          <button
                            onClick={requestPushPermission}
                            className="px-2.5 py-1 rounded-lg bg-[#FF9F1C] text-black font-bold hover:bg-[#FF9F1C]/90 text-[10px] uppercase"
                          >
                            Allow
                          </button>
                        </div>
                      )}

                      <div className="max-h-72 overflow-y-auto my-2 space-y-2 pr-1 custom-scrollbar">
                        {notifications.length === 0 ? (
                          <div className="text-center py-6">
                            <Bell className="w-8 h-8 text-gray-600 mx-auto mb-2 opacity-50" />
                            <p className="text-xs text-gray-400">No notifications yet.</p>
                          </div>
                        ) : (
                          notifications.map((n) => {
                            const badge = getTypeBadge(n.type);
                            return (
                              <div
                                key={n.id}
                                className={`group relative p-3 rounded-xl border transition-all ${
                                  n.read
                                    ? 'bg-[#0B0E14]/40 border-[#262F45]/60 text-gray-400'
                                    : 'bg-[#1A2234] border-[#FF2E4C]/40 text-white shadow-sm'
                                }`}
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex items-center gap-1.5 mb-1">
                                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border flex items-center gap-1 ${badge.color}`}>
                                      <span>{badge.icon}</span>
                                      <span>{badge.label}</span>
                                    </span>
                                    <span className="text-[10px] text-gray-500">
                                      {getRelativeTime(n.createdAt)}
                                    </span>
                                  </div>
                                  <button
                                    onClick={(e) => deleteNotification(e, n.id)}
                                    className="opacity-0 group-hover:opacity-100 p-1 text-gray-500 hover:text-red-400 transition-opacity"
                                    title="Delete notification"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>

                                <Link
                                  href={n.actionUrl || n.linkUrl || '/notifications'}
                                  onClick={() => setNotificationsOpen(false)}
                                  className="block"
                                >
                                  <div className="font-bold text-xs sm:text-sm text-gray-100 hover:text-[#FF9F1C] transition-colors flex items-center justify-between">
                                    <span>{n.title}</span>
                                    {(n.actionUrl || n.linkUrl) && (
                                      <ExternalLink className="w-3 h-3 text-gray-400 inline ml-1 opacity-60" />
                                    )}
                                  </div>
                                  <div className="mt-1 text-xs text-gray-300 leading-snug">{n.message}</div>
                                </Link>

                                {n.actionText && (
                                  <div className="mt-2 text-right">
                                    <Link
                                      href={n.actionUrl || n.linkUrl || '/notifications'}
                                      onClick={() => setNotificationsOpen(false)}
                                      className="inline-flex items-center gap-1 text-[11px] font-bold text-[#FF2E4C] hover:text-[#FF9F1C] transition-colors"
                                    >
                                      <span>{n.actionText}</span>
                                      <span>→</span>
                                    </Link>
                                  </div>
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>

                      <div className="pt-2 border-t border-[#262F45] text-center">
                        <Link
                          href="/notifications"
                          onClick={() => setNotificationsOpen(false)}
                          className="text-xs font-bold text-[#FF2E4C] hover:text-[#FF9F1C] uppercase tracking-wider block py-1"
                        >
                          View All Notifications Page →
                        </Link>
                      </div>
                    </div>
                  )}
                </div>

                {/* Admin Panel Link (Admin Only) */}
                {currentUser?.role === 'ADMIN' && (
                  <Link
                    href="/admin"
                    className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-red-950/40 border border-red-500/40 text-red-400 text-xs font-bold hover:bg-red-900/50 transition-all flex-shrink-0"
                  >
                    <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-400" />
                    <span className="text-[11px] sm:text-xs">Admin</span>
                  </Link>
                )}

                {/* Dashboard Link */}
                <Link
                  href="/dashboard"
                  className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#121722] border border-[#262F45] text-white text-xs font-semibold hover:border-[#FF2E4C] transition-all"
                >
                  <LayoutDashboard className="w-4 h-4 text-[#FF2E4C]" />
                  <span>Dashboard</span>
                </Link>

                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  className="hidden sm:block p-2 rounded-xl bg-[#121722] border border-[#262F45] text-gray-400 hover:text-red-400 hover:border-red-500/40 transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              /* Logged Out State: Sign Up */
              <div className="flex items-center">
                <Link
                  href="/register"
                  className="px-3 sm:px-4 py-1.5 sm:py-2.5 rounded-xl glow-btn-red text-white text-xs font-bold uppercase tracking-wider"
                >
                  Login
                </Link>
              </div>
            )}
          </div>

        </div>
      </div>
    </nav>
  );
}
