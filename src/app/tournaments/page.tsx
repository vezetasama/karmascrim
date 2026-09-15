'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import TournamentCard from '@/components/TournamentCard';
import { Search, Filter, Trophy, Flame } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

function TournamentsContent() {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get('category') || 'ALL';
  const initialStatus = searchParams.get('status') || 'ALL';

  const [category, setCategory] = useState<string>(initialCategory);
  const [status, setStatus] = useState<string>(initialStatus);
  const [search, setSearch] = useState<string>('');
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTournaments();
  }, [category, status, search]);

  const fetchTournaments = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (category !== 'ALL') params.append('category', category);
      if (status !== 'ALL') params.append('status', status);
      if (search) params.append('search', search);

      const res = await fetch(`/api/tournaments?${params.toString()}`);
      const data = await res.json();
      if (data.tournaments) {
        setTournaments(data.tournaments);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex-1 py-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
      
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-xs font-bold text-[#FF2E4C] uppercase tracking-widest mb-1">
          <Trophy className="w-4 h-4 text-[#FF9F1C]" />
          <span>Competitive Arena</span>
        </div>
        <h1 className="text-3xl font-extrabold uppercase tracking-wide">Tournaments & Scrims</h1>
        <p className="text-xs text-gray-400 mt-1">Browse upcoming, live, and completed Free Fire scrims in Nepal.</p>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="p-4 rounded-2xl bg-[#121722] border border-[#262F45] mb-8 space-y-4 md:space-y-0 md:flex md:items-center md:justify-between gap-4">
        
        {/* Category Tabs */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-2 md:pb-0">
          <button
            onClick={() => setCategory('ALL')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              category === 'ALL'
                ? 'bg-[#FF2E4C] text-white shadow-lg shadow-[#FF2E4C]/25'
                : 'bg-[#0B0E14] text-gray-400 hover:text-white border border-[#262F45]'
            }`}
          >
            All Categories
          </button>
          <button
            onClick={() => setCategory('FULL_MAP')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              category === 'FULL_MAP'
                ? 'bg-[#FF2E4C] text-white shadow-lg shadow-[#FF2E4C]/25'
                : 'bg-[#0B0E14] text-gray-400 hover:text-white border border-[#262F45]'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-[#FF2E4C]" />
            Full Map Squad
          </button>
          <button
            onClick={() => setCategory('CLASH_SQUAD')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              category === 'CLASH_SQUAD'
                ? 'bg-[#FF9F1C] text-slate-950 shadow-lg shadow-[#FF9F1C]/25'
                : 'bg-[#0B0E14] text-gray-400 hover:text-white border border-[#262F45]'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-[#FF9F1C]" />
            Clash Squad
          </button>
        </div>

        {/* Right Filters: Status & Search */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          
          {/* Status Select */}
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full sm:w-auto px-3 py-2 rounded-xl bg-[#0B0E14] border border-[#262F45] text-xs text-gray-300 font-semibold focus:outline-none focus:border-[#FF2E4C]"
          >
            <option value="ALL">All Statuses</option>
            <option value="REGISTRATION_OPEN">Registration Open</option>
            <option value="LIVE">Live Now</option>
            <option value="UPCOMING">Upcoming</option>
            <option value="COMPLETED">Completed</option>
          </select>

          {/* Search Input */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Search tournament name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#0B0E14] border border-[#262F45] text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#FF2E4C]"
            />
          </div>

        </div>

      </div>

      {/* Tournaments Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-80 bg-[#121722] animate-pulse rounded-2xl border border-[#262F45]" />
          ))}
        </div>
      ) : tournaments.length === 0 ? (
        <div className="p-16 text-center bg-[#121722] rounded-3xl border border-[#262F45] my-8">
          <Trophy className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-gray-300">No tournaments match your filter.</h3>
          <p className="text-xs text-gray-500 mt-1">Try resetting search or category filters.</p>
          <button
            onClick={() => {
              setCategory('ALL');
              setStatus('ALL');
              setSearch('');
            }}
            className="mt-4 px-4 py-2 rounded-xl bg-[#FF2E4C] text-white text-xs font-bold"
          >
            Reset All Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tournaments.map((t) => (
            <TournamentCard key={t.id} tournament={t} />
          ))}
        </div>
      )}

    </main>
  );
}

export default function TournamentsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#0B0E14] text-white">
      <Navbar />
      <Suspense fallback={<div className="p-10 text-center text-xs text-gray-400">Loading tournaments arena...</div>}>
        <TournamentsContent />
      </Suspense>
      <Footer />
    </div>
  );
}
