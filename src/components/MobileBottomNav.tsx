'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Gamepad2, Wallet, PlusCircle, User } from 'lucide-react';

export default function MobileBottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    fetchUser();
  }, [pathname]);

  const fetchUser = async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      setCurrentUser(data.user || null);
    } catch (e) {
      setCurrentUser(null);
    }
  };

  // Hide bottom nav on admin routes
  if (pathname.startsWith('/admin')) {
    return null;
  }

  const navItems = [
    {
      label: 'Games',
      href: '/',
      icon: Gamepad2,
      exact: true,
      requiresAuth: false,
    },
    {
      label: 'Balance',
      href: '/wallet',
      icon: Wallet,
      exact: true,
      requiresAuth: true,
    },
    {
      label: 'Profile',
      href: '/dashboard',
      icon: User,
      exact: false,
      requiresAuth: true,
    },
  ];

  const handleNavClick = (e: React.MouseEvent, item: any) => {
    if (item.requiresAuth && !currentUser) {
      e.preventDefault();
      router.push(`/login?redirect=${encodeURIComponent(item.href)}`);
    }
  };

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0B0E14]/95 backdrop-blur-xl border-t border-[#262F45]/80 shadow-[0_-4px_20px_rgba(0,0,0,0.5)]">
      <div className="grid grid-cols-3 h-16 max-w-md mx-auto items-center px-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={(e) => handleNavClick(e, item)}
              className={`flex flex-col items-center justify-center h-full space-y-1 transition-all duration-200 relative group ${
                isActive ? 'text-[#FF2E4C]' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              {/* Active Indicator Bar / Glow */}
              {isActive && (
                <div className="absolute top-0 w-8 h-1 rounded-b-full bg-gradient-to-r from-[#FF2E4C] to-[#FF9F1C] shadow-[0_0_8px_#FF2E4C]" />
              )}

              <div
                className={`p-1.5 rounded-xl transition-all ${
                  isActive
                    ? 'bg-[#FF2E4C]/10 scale-110'
                    : 'group-hover:scale-105'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
              </div>

              <span
                className={`text-[10px] font-bold tracking-wider uppercase ${
                  isActive ? 'text-white' : 'text-gray-400'
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

