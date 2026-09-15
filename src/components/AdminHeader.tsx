'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ShieldAlert,
  LayoutDashboard,
  Wallet,
  Landmark,
  Trophy,
  CreditCard,
  Bell,
  QrCode,
  Users,
  Image as ImageIcon,
  Award,
  ArrowLeft,
  ChevronRight,
} from 'lucide-react';

export default function AdminHeader() {
  const pathname = usePathname();
  const [counts, setCounts] = useState({
    pendingDeposits: 0,
    pendingWithdrawals: 0,
    pendingPayments: 0,
  });

  useEffect(() => {
    // Skip fetching on admin login page
    if (pathname === '/admin/login') return;

    fetchCounts();
    const interval = setInterval(fetchCounts, 15000);
    return () => clearInterval(interval);
  }, [pathname]);

  const fetchCounts = async () => {
    try {
      const [depRes, withRes, regRes] = await Promise.all([
        fetch('/api/admin/deposits?status=PENDING'),
        fetch('/api/admin/withdrawals?status=PENDING'),
        fetch('/api/admin/registrations?status=PAYMENT_SUBMITTED'),
      ]);

      const depData = depRes.ok ? await depRes.json() : {};
      const withData = withRes.ok ? await withRes.json() : {};
      const regData = regRes.ok ? await regRes.json() : {};

      setCounts({
        pendingDeposits: depData.depositRequests?.length || 0,
        pendingWithdrawals: withData.withdrawals?.length || 0,
        pendingPayments: regData.registrations?.length || 0,
      });
    } catch (e) {
      // Ignore count errors silently
    }
  };

  // Hide admin subheader on login page
  if (pathname === '/admin/login') return null;

  const navTabs = [
    { label: 'Overview', href: '/admin', icon: LayoutDashboard, exact: true },
    {
      label: 'Deposits',
      href: '/admin/deposits',
      icon: Wallet,
      badge: counts.pendingDeposits,
      badgeColor: 'bg-amber-400 text-black',
    },
    {
      label: 'Withdrawals',
      href: '/admin/withdrawals',
      icon: Landmark,
      badge: counts.pendingWithdrawals,
      badgeColor: 'bg-amber-400 text-black',
    },
    { label: 'Tournaments', href: '/admin/tournaments', icon: Trophy },
    {
      label: 'Registrations',
      href: '/admin/registrations',
      icon: CreditCard,
      badge: counts.pendingPayments,
      badgeColor: 'bg-red-500 text-white',
    },
    { label: 'Notifications', href: '/admin/notifications', icon: Bell },
    { label: 'Banners', href: '/admin/banners', icon: ImageIcon },
    { label: 'Payment QR', href: '/admin/payment-methods', icon: QrCode },
    { label: 'Users', href: '/admin/users', icon: Users },
    { label: 'Results', href: '/admin/results', icon: Award },
  ];

  return (
    <div className="w-full bg-[#0D121F] border-b border-[#262F45] sticky top-[64px] sm:top-[80px] z-30 shadow-lg">
      <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
        
        {/* Top Mini Header Bar */}
        <div className="flex items-center justify-between py-2 border-b border-[#262F45]/50">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
            <span className="text-[11px] sm:text-xs font-black uppercase text-red-400 tracking-wider flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Admin Panel</span>
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <Link
              href="/dashboard"
              className="text-[10px] sm:text-xs font-bold text-gray-400 hover:text-white flex items-center gap-1 px-2 py-1 rounded-lg bg-[#121722] border border-[#262F45] transition-colors"
            >
              <ArrowLeft className="w-3 h-3" />
              <span>User Site</span>
            </Link>
          </div>
        </div>

        {/* Scrollable Mobile Nav Tabs */}
        <div className="flex items-center gap-1.5 py-2 overflow-x-auto no-scrollbar scroll-smooth">
          {navTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = tab.exact
              ? pathname === tab.href
              : pathname.startsWith(tab.href);

            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex items-center gap-1.5 px-3 py-1.5 sm:py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex-shrink-0 relative ${
                  isActive
                    ? 'bg-gradient-to-r from-[#FF2E4C] to-[#FF9F1C] text-white shadow-md shadow-[#FF2E4C]/20 scale-[1.02]'
                    : 'bg-[#121722] text-gray-300 hover:text-white border border-[#262F45] hover:border-[#FF2E4C]/50'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                <span>{tab.label}</span>
                {!!tab.badge && tab.badge > 0 && (
                  <span
                    className={`ml-1 px-1.5 py-0.2 text-[9px] font-extrabold rounded-full ${
                      isActive ? 'bg-white text-black' : tab.badgeColor
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

      </div>
    </div>
  );
}
