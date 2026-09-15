import React from 'react';
import Link from 'next/link';
import { Flame, ShieldCheck, Mail, Phone, Trophy } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-[#0B0E14] border-t border-[#262F45] text-gray-400 text-sm">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-12">
        <div className="overflow-x-auto">
          <div className="grid grid-cols-3 gap-2 sm:gap-4 md:gap-8 min-w-[760px] md:min-w-0">
          
          {/* Brand Col */}
          <div className="space-y-2 sm:space-y-3 md:col-span-1">
            <Link href="/" className="flex items-center space-x-2 sm:space-x-3">
              <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-[#FF2E4C] to-[#FF9F1C] flex items-center justify-center shadow-md">
                <Flame className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <span className="text-base sm:text-xl font-extrabold text-white uppercase tracking-wider">
                KARMA <span className="text-[#FF2E4C]">SCRIMS</span>
              </span>
            </Link>
            <p className="text-[10px] sm:text-xs text-gray-400 leading-relaxed">
              The premier Free Fire daily scrims and competitive tournament platform in Nepal. Built for serious players, squads, and esports aspirants.
            </p>
            <div className="flex items-center space-x-2 text-[10px] sm:text-xs text-gray-400">
              <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#FF9F1C]" />
              <span>Verified Fonepay Payments</span>
            </div>
          </div>

          {/* Tournaments Col */}
          <div>
            <h4 className="text-[10px] sm:text-xs font-bold text-white uppercase tracking-widest mb-2 sm:mb-4">Tournaments</h4>
            <ul className="space-y-1.5 sm:space-y-2 text-[10px] sm:text-xs">
              <li>
                <Link href="/tournaments?category=FULL_MAP" className="hover:text-[#FF2E4C] transition-colors">
                  Full Map Squad Scrims
                </Link>
              </li>
              <li>
                <Link href="/tournaments?category=CLASH_SQUAD" className="hover:text-[#FF9F1C] transition-colors">
                  Clash Squad 1v1 & 4v4
                </Link>
              </li>
              <li>
                <Link href="/tournaments?status=LIVE" className="hover:text-white transition-colors">
                  Live Match Lobbie
                </Link>
              </li>
              <li>
                <Link href="/tournaments?status=UPCOMING" className="hover:text-white transition-colors">
                  Upcoming Tournaments
                </Link>
              </li>
            </ul>
          </div>

          {/* Support & Contact */}
          <div>
            <h4 className="text-[10px] sm:text-xs font-bold text-white uppercase tracking-widest mb-2 sm:mb-4">Support & Contact</h4>
            <div className="space-y-1.5 sm:space-y-2.5 text-[10px] sm:text-xs">
              <div className="flex items-center gap-2 text-gray-300">
                <Phone className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#FF2E4C]" />
                <span>+977 9800000000 (Admin Helpline)</span>
              </div>
              <div className="flex items-center gap-2 text-gray-300">
                <Mail className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#FF9F1C]" />
                <span>support@karmascrims.com</span>
              </div>
            </div>
          </div>

        </div>

        </div>
        <div className="mt-6 sm:mt-12 pt-4 sm:pt-6 border-t border-[#262F45] flex flex-col sm:flex-row items-center justify-between text-[10px] sm:text-xs text-gray-500 gap-2 sm:gap-4">
          <p>© {new Date().getFullYear()} Karma Scrims Nepal. All rights reserved.</p>
          <p className="text-[11px]">
           
          </p>
        </div>
      </div>
    </footer>
  );
}
