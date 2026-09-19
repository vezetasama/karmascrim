import React from 'react';
import { ShieldCheck, Mail, Phone } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-[#0B0E14] border-t border-[#262F45] text-gray-400 text-xs w-full overflow-hidden py-3">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 sm:gap-4">
          
          {/* Payment badge */}
          <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/30">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-semibold">Verified Fonepay Payments</span>
          </div>

          {/* Support & Helpline */}
          <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-[11px] text-gray-300">
            <div className="flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-[#FF2E4C]" />
              <span className="font-medium">+977 9800000000</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-[#FF9F1C]" />
              <span className="font-medium">support@karmascrims.com</span>
            </div>
          </div>

        </div>

        {/* Bottom copyright line */}
        <div className="mt-3 pt-3 border-t border-[#262F45]/60 flex items-center justify-between text-[11px] text-gray-500">
          <p>© {new Date().getFullYear()} Karma Scrims Nepal. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
