'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users,
  Trophy,
  Shield,
  Search,
  Download,
  Eye,
  Edit3,
  Trash2,
  X,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  UserCheck,
  Calendar,
  Clock,
  RefreshCw,
} from 'lucide-react';

export default function AdminRegisteredPlayersPage() {
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Summary Metrics State
  const [metrics, setMetrics] = useState({
    totalTournaments: 0,
    totalRegisteredPlayers: 0,
    totalSoloPlayers: 0,
    totalSquadTeams: 0,
    totalSquadPlayers: 0,
  });

  // Data & Tournaments State
  const [tournamentsList, setTournamentsList] = useState<any[]>([]);
  const [tournaments, setTournaments] = useState<any[]>([]);

  // Filter States
  const [selectedTournamentId, setSelectedTournamentId] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  // Modals State
  const [selectedPlayer, setSelectedPlayer] = useState<any>(null); // Details modal
  const [editingRegistration, setEditingRegistration] = useState<any>(null); // Edit modal
  const [removingRegistration, setRemovingRegistration] = useState<any>(null); // Confirm delete modal

  // Edit Form Fields
  const [editSlotNumber, setEditSlotNumber] = useState<number | ''>('');
  const [editIgn, setEditIgn] = useState('');
  const [editUid, setEditUid] = useState('');
  const [editTeamName, setEditTeamName] = useState('');

  useEffect(() => {
    fetchRegisteredPlayers();

    const handleRefresh = () => {
      fetchRegisteredPlayersSilently();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('karma_refresh', handleRefresh);
    }

    const interval = window.setInterval(() => {
      fetchRegisteredPlayersSilently();
    }, 4000);

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('karma_refresh', handleRefresh);
      }
      window.clearInterval(interval);
    };
  }, [selectedTournamentId, typeFilter, statusFilter]);

  const fetchRegisteredPlayersSilently = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedTournamentId !== 'ALL') params.append('tournamentId', selectedTournamentId);
      if (typeFilter !== 'ALL') params.append('type', typeFilter);
      if (statusFilter !== 'ALL') params.append('status', statusFilter);
      if (search) params.append('search', search);

      const res = await fetch(`/api/admin/registered-players?${params.toString()}`);
      const data = await res.json();

      if (data.success) {
        setMetrics(data.metrics);
        setTournamentsList(data.tournamentsList || []);
        setTournaments(data.tournaments || []);
      }
    } catch (e: any) {}
  };

  const fetchRegisteredPlayers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedTournamentId !== 'ALL') params.append('tournamentId', selectedTournamentId);
      if (typeFilter !== 'ALL') params.append('type', typeFilter);
      if (statusFilter !== 'ALL') params.append('status', statusFilter);
      if (search) params.append('search', search);

      const res = await fetch(`/api/admin/registered-players?${params.toString()}`);
      const data = await res.json();

      if (data.success) {
        setMetrics(data.metrics);
        setTournamentsList(data.tournamentsList || []);
        setTournaments(data.tournaments || []);
      } else {
        setErrorMsg(data.error || 'Failed to fetch registered players');
      }
    } catch (e: any) {
      setErrorMsg('Error loading registered players data');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchRegisteredPlayers();
  };

  // Open Edit Modal
  const handleOpenEdit = (item: any, isSolo: boolean) => {
    setEditingRegistration({ ...item, isSolo });
    setEditSlotNumber(isSolo ? item.slotNumber || '' : '');
    setEditIgn(isSolo ? item.freeFireName || '' : item.captainIgn || '');
    setEditUid(isSolo ? item.freeFireUid || '' : item.captainUid || '');
    setEditTeamName(item.teamName || '');
  };

  // Save Edit Registration
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRegistration) return;
    setActionLoading(true);
    setErrorMsg(null);
    setMsg(null);

    try {
      const res = await fetch(`/api/admin/registered-players/${editingRegistration.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slotNumber: editingRegistration.isSolo && editSlotNumber !== '' ? Number(editSlotNumber) : null,
          freeFireName: editIgn,
          freeFireUid: editUid,
          teamName: editTeamName,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setMsg('Registration updated successfully!');
        setEditingRegistration(null);
        fetchRegisteredPlayers();
      } else {
        setErrorMsg(data.error || 'Failed to update registration');
      }
    } catch (e: any) {
      setErrorMsg('Failed to update registration');
    } finally {
      setActionLoading(false);
    }
  };

  // Confirm Remove Registration
  const handleConfirmRemove = async () => {
    if (!removingRegistration) return;
    setActionLoading(true);
    setErrorMsg(null);
    setMsg(null);

    try {
      const res = await fetch(`/api/admin/registered-players/${removingRegistration.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setMsg('Registration removed from tournament.');
        setRemovingRegistration(null);
        fetchRegisteredPlayers();
      } else {
        setErrorMsg(data.error || 'Failed to remove registration');
      }
    } catch (e: any) {
      setErrorMsg('Failed to remove registration');
    } finally {
      setActionLoading(false);
    }
  };

  // Export Filtered Players to CSV
  const handleExportCSV = () => {
    if (tournaments.length === 0) {
      alert('No registered player data available to export.');
      return;
    }

    const csvRows: string[] = [];

    tournaments.forEach((tour) => {
      const isSolo = tour.type === 'SOLO';

      if (isSolo) {
        csvRows.push(`"TOURNAMENT: ${tour.name} (${tour.type}) - ${tour.date} ${tour.startTime}"`);
        csvRows.push('"Slot Number","In-Game Name (IGN)","Free Fire UID","Player Name","Username","Registration ID","Status","Entry Fee"');

        tour.items.forEach((item: any) => {
          csvRows.push(
            `"${item.slotNumber}","${item.freeFireName}","${item.freeFireUid}","${item.playerName}","@${item.username}","${item.registrationId}","${item.status}","${item.entryFee}"`
          );
        });
        csvRows.push('');
      } else {
        csvRows.push(`"TOURNAMENT: ${tour.name} (${tour.type}) - ${tour.date} ${tour.startTime}"`);
        csvRows.push('"Team Name","Captain In-Game Name (IGN)","Captain Free Fire UID","Captain Profile Name","Username","Registration ID","Status","Entry Fee"');

        tour.items.forEach((teamItem: any) => {
          csvRows.push(
            `"${teamItem.teamName}","${teamItem.captainIgn}","${teamItem.captainUid}","${teamItem.captainName}","@${teamItem.captainUsername}","${teamItem.registrationId}","${teamItem.status}","${teamItem.entryFee}"`
          );
        });
        csvRows.push('');
      }
    });

    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `karma_scrims_registered_players_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <main className="py-4 sm:py-8 max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 w-full space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#262F45] pb-6">
        <div>
          <Link href="/admin" className="text-xs text-gray-400 hover:text-white flex items-center gap-1 mb-1 font-bold">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Admin Overview
          </Link>
          <h1 className="text-2xl sm:text-3xl font-black uppercase text-white flex items-center gap-2 tracking-wide">
            <Users className="w-7 h-7 text-[#FF2E4C]" />
            Registered Players Management
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Real-time participant directory and team management across all scrims
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchRegisteredPlayers}
            className="px-3.5 py-2 rounded-xl bg-[#121722] border border-[#262F45] text-xs font-bold text-gray-300 hover:text-white flex items-center gap-1.5 transition-colors"
            title="Refresh Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#FF9F1C]' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-emerald-600/20 hover:scale-105 transition-transform"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Notifications / Alerts */}
      {msg && (
        <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-400 text-xs flex items-center justify-between">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{msg}</span>
          </span>
          <button onClick={() => setMsg(null)}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-500/40 text-red-400 text-xs flex items-center justify-between">
          <span className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400" />
            <span>{errorMsg}</span>
          </span>
          <button onClick={() => setErrorMsg(null)}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 1. DASHBOARD SUMMARY CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        
        <div className="p-4 rounded-2xl bg-[#121722] border border-[#262F45] space-y-1">
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Tournaments</span>
          <div className="text-xl sm:text-2xl font-black text-white flex items-center justify-between">
            <span>{metrics.totalTournaments}</span>
            <Trophy className="w-5 h-5 text-amber-400 opacity-60" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#121722] border border-[#262F45] space-y-1">
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Total Reg Players</span>
          <div className="text-xl sm:text-2xl font-black text-white flex items-center justify-between">
            <span>{metrics.totalRegisteredPlayers}</span>
            <Users className="w-5 h-5 text-emerald-400 opacity-60" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#121722] border border-[#262F45] space-y-1">
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Solo Players</span>
          <div className="text-xl sm:text-2xl font-black text-amber-400 flex items-center justify-between">
            <span>{metrics.totalSoloPlayers}</span>
            <UserCheck className="w-5 h-5 text-amber-400 opacity-60" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#121722] border border-[#262F45] space-y-1">
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Squad Teams</span>
          <div className="text-xl sm:text-2xl font-black text-[#FF2E4C] flex items-center justify-between">
            <span>{metrics.totalSquadTeams}</span>
            <Shield className="w-5 h-5 text-[#FF2E4C] opacity-60" />
          </div>
        </div>

      </div>

      {/* 2. TOURNAMENT & SEARCH FILTERS TOOLBAR */}
      <div className="p-4 rounded-2xl bg-[#121722] border border-[#262F45] space-y-4">
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          
          {/* Tournament Dropdown Filter */}
          <div>
            <label className="block text-[11px] font-bold text-gray-400 mb-1 uppercase tracking-wider">
              Filter By Tournament
            </label>
            <select
              value={selectedTournamentId}
              onChange={(e) => setSelectedTournamentId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#0B0E14] border border-[#262F45] text-xs text-white focus:outline-none focus:border-[#FF2E4C]"
            >
              <option value="ALL">All Tournaments ({tournamentsList.length})</option>
              {tournamentsList.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.type}) - {t.date}
                </option>
              ))}
            </select>
          </div>

          {/* Tournament Type Filter */}
          <div>
            <label className="block text-[11px] font-bold text-gray-400 mb-1 uppercase tracking-wider">
              Tournament Type
            </label>
            <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-[#0B0E14] border border-[#262F45]">
              {['ALL', 'SOLO', 'SQUAD'].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTypeFilter(t)}
                  className={`py-1 rounded-lg text-xs font-bold uppercase transition-colors ${
                    typeFilter === t ? 'bg-[#FF2E4C] text-white shadow-sm' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Tournament Status Filter */}
          <div>
            <label className="block text-[11px] font-bold text-gray-400 mb-1 uppercase tracking-wider">
              Tournament Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#0B0E14] border border-[#262F45] text-xs text-white focus:outline-none focus:border-[#FF2E4C]"
            >
              <option value="ALL">All Statuses</option>
              <option value="REGISTRATION_OPEN">Registration Open</option>
              <option value="REGISTRATION_CLOSED">Registration Closed</option>
              <option value="LIVE">Live Now</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          {/* Search Box */}
          <div>
            <label className="block text-[11px] font-bold text-gray-400 mb-1 uppercase tracking-wider">
              Search Player / IGN / Team / UID
            </label>
            <form onSubmit={handleSearchSubmit} className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                placeholder="Search IGN, Name, UID, Team..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-8 py-2 rounded-xl bg-[#0B0E14] border border-[#262F45] text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#FF2E4C]"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch('');
                    fetchRegisteredPlayers();
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </form>
          </div>

        </div>

      </div>

      {/* 3. REGISTERED PLAYERS DIRECTORY LIST (GROUPED BY TOURNAMENT) */}
      <div className="space-y-6">
        {loading ? (
          <div className="p-12 text-center rounded-3xl bg-[#121722] border border-[#262F45]">
            <div className="w-8 h-8 border-4 border-[#FF2E4C] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Loading registered players data...</p>
          </div>
        ) : tournaments.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-[#121722] border border-[#262F45] space-y-3">
            <Users className="w-12 h-12 text-gray-600 mx-auto opacity-50" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">No Registrations Found</h3>
            <p className="text-xs text-gray-400 max-w-md mx-auto">
              No registered players match your current filter parameters. Try changing your search query or tournament filters.
            </p>
          </div>
        ) : (
          tournaments.map((tour) => {
            const isSolo = tour.type === 'SOLO';

            return (
              <div key={tour.id} className="rounded-3xl bg-[#121722] border border-[#262F45] overflow-hidden shadow-xl">
                
                {/* TOURNAMENT HEADER BANNER */}
                <div className="p-4 sm:p-5 bg-gradient-to-r from-[#0B0E14] via-[#121722] to-[#1A2234] border-b border-[#262F45] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                        isSolo
                          ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                          : 'bg-[#FF2E4C]/20 text-[#FF2E4C] border-[#FF2E4C]/40'
                      }`}>
                        {tour.type} TOURNAMENT
                      </span>
                      
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        tour.status === 'REGISTRATION_OPEN'
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                          : tour.status === 'LIVE'
                          ? 'bg-red-500/20 text-red-400 border-red-500/40 animate-pulse'
                          : 'bg-gray-800 text-gray-400 border-gray-700'
                      }`}>
                        {tour.status}
                      </span>
                    </div>

                    <h2 className="text-lg sm:text-xl font-extrabold text-white">{tour.name}</h2>

                    <div className="flex items-center gap-4 text-xs text-gray-400 mt-1 flex-wrap">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-[#FF9F1C]" />
                        <span>{tour.date}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-[#FF9F1C]" />
                        <span>{tour.startTime}</span>
                      </span>
                      <span>Category: <strong className="text-gray-300">{tour.category}</strong></span>
                      <span>Entry: <strong className="text-[#FF9F1C]">🪙 {tour.entryFee} COIN</strong></span>
                    </div>
                  </div>

                  {/* Summary badge on right */}
                  <div className="bg-[#0B0E14] px-4 py-2.5 rounded-2xl border border-[#262F45] text-right flex sm:flex-col justify-between sm:justify-center w-full sm:w-auto items-center sm:items-end">
                    <span className="text-[10px] text-gray-400 uppercase font-bold block">Registered Summary</span>
                    <span className="text-sm sm:text-base font-black text-white">
                      {isSolo ? (
                        <span className="text-amber-400">{tour.totalItems} Solo Players</span>
                      ) : (
                        <span className="text-[#FF2E4C]">
                          {tour.totalItems} Teams Registered
                        </span>
                      )}
                    </span>
                  </div>
                </div>

                {/* TOURNAMENT ITEMS BODY (SOLO VS SQUAD) */}
                <div className="p-4 sm:p-6 space-y-4">
                  {tour.items.length === 0 ? (
                    <div className="text-center py-8 text-xs text-gray-400 font-semibold">
                      No registrations recorded for this tournament matching your search query.
                    </div>
                  ) : isSolo ? (

                    /* ========================================== */
                    /* SOLO TOURNAMENT VIEW                       */
                    /* ========================================== */
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs text-gray-300">
                        <thead className="bg-[#0B0E14] text-[#FF9F1C] uppercase text-[10px] font-bold border-b border-[#262F45]">
                          <tr>
                            <th className="p-3">Slot #</th>
                            <th className="p-3">In-Game Name (IGN)</th>
                            <th className="p-3">Free Fire UID</th>
                            <th className="p-3">Player Name</th>
                            <th className="p-3">Reg ID / Status</th>
                            <th className="p-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#262F45]">
                          {tour.items.map((player: any) => (
                            <tr key={player.id} className="hover:bg-[#1A2234] transition-colors">
                              <td className="p-3">
                                <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-black bg-[#FF9F1C]/20 text-[#FF9F1C] border border-[#FF9F1C]/40">
                                  SLOT #{player.slotNumber}
                                </span>
                              </td>
                              <td className="p-3 font-extrabold text-white text-sm">
                                {player.freeFireName}
                              </td>
                              <td className="p-3 font-mono text-emerald-400 font-bold text-sm">
                                {player.freeFireUid}
                              </td>
                              <td className="p-3 font-semibold text-gray-200">
                                <div>{player.playerName}</div>
                                <div className="text-[10px] text-gray-400">@{player.username}</div>
                              </td>
                              <td className="p-3">
                                <div className="font-mono text-[11px] text-gray-300">{player.registrationId}</div>
                                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 inline-block mt-0.5">
                                  {player.status}
                                </span>
                              </td>
                              <td className="p-3 text-right whitespace-nowrap space-x-1.5">
                                <button
                                  onClick={() => setSelectedPlayer({ ...player, isSolo: true })}
                                  className="px-2.5 py-1 rounded-lg bg-[#0B0E14] border border-[#262F45] text-xs text-gray-300 hover:text-white font-bold inline-flex items-center gap-1"
                                >
                                  <Eye className="w-3.5 h-3.5 text-[#FF9F1C]" />
                                  <span>Details</span>
                                </button>
                                <button
                                  onClick={() => handleOpenEdit(player, true)}
                                  className="px-2.5 py-1 rounded-lg bg-[#0B0E14] border border-[#262F45] text-xs text-gray-300 hover:text-white font-bold inline-flex items-center gap-1"
                                >
                                  <Edit3 className="w-3.5 h-3.5 text-cyan-400" />
                                  <span>Edit</span>
                                </button>
                                <button
                                  onClick={() => setRemovingRegistration({ ...player, name: player.freeFireName })}
                                  className="px-2.5 py-1 rounded-lg bg-red-950/40 border border-red-500/40 text-red-400 hover:bg-red-900/50 font-bold inline-flex items-center gap-1"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                  ) : (

                    /* ========================================== */
                    /* SQUAD TOURNAMENT VIEW (CAPTAIN INFO ONLY)  */
                    /* ========================================== */
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs text-gray-300">
                        <thead className="bg-[#0B0E14] text-[#FF2E4C] uppercase text-[10px] font-bold border-b border-[#262F45]">
                          <tr>
                            <th className="p-3">Team Name</th>
                            <th className="p-3">Captain In-Game Name (IGN)</th>
                            <th className="p-3">Captain Free Fire UID</th>
                            <th className="p-3">Captain Profile Name</th>
                            <th className="p-3">Reg ID / Status</th>
                            <th className="p-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#262F45]">
                          {tour.items.map((team: any) => (
                            <tr key={team.id} className="hover:bg-[#1A2234] transition-colors">
                              <td className="p-3">
                                <div className="font-extrabold text-white text-sm flex items-center gap-1.5">
                                  <Shield className="w-4 h-4 text-[#FF2E4C]" />
                                  <span>{team.teamName}</span>
                                </div>
                              </td>
                              <td className="p-3 font-extrabold text-white text-sm">
                                {team.captainIgn}
                              </td>
                              <td className="p-3 font-mono text-emerald-400 font-bold text-sm">
                                {team.captainUid}
                              </td>
                              <td className="p-3 font-semibold text-gray-200">
                                <div>{team.captainName}</div>
                                <div className="text-[10px] text-gray-400">@{team.captainUsername}</div>
                              </td>
                              <td className="p-3">
                                <div className="font-mono text-[11px] text-gray-300">{team.registrationId}</div>
                                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 inline-block mt-0.5">
                                  {team.status}
                                </span>
                              </td>
                              <td className="p-3 text-right whitespace-nowrap space-x-1.5">
                                <button
                                  onClick={() => setSelectedPlayer({ ...team, isSolo: false })}
                                  className="px-2.5 py-1 rounded-lg bg-[#0B0E14] border border-[#262F45] text-xs text-gray-300 hover:text-white font-bold inline-flex items-center gap-1"
                                >
                                  <Eye className="w-3.5 h-3.5 text-[#FF9F1C]" />
                                  <span>Details</span>
                                </button>
                                <button
                                  onClick={() => handleOpenEdit(team, false)}
                                  className="px-2.5 py-1 rounded-lg bg-[#0B0E14] border border-[#262F45] text-xs text-gray-300 hover:text-white font-bold inline-flex items-center gap-1"
                                >
                                  <Edit3 className="w-3.5 h-3.5 text-cyan-400" />
                                  <span>Edit</span>
                                </button>
                                <button
                                  onClick={() => setRemovingRegistration({ ...team, name: team.teamName })}
                                  className="px-2.5 py-1 rounded-lg bg-red-950/40 border border-red-500/40 text-red-400 hover:bg-red-900/50 font-bold inline-flex items-center gap-1"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                  )}
                </div>

              </div>
            );
          })
        )}
      </div>

      {/* ========================================================= */}
      {/* 4. PLAYER & TEAM DETAILS MODAL                            */}
      {/* ========================================================= */}
      {selectedPlayer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#121722] border border-[#262F45] w-full max-w-lg rounded-3xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto custom-scrollbar">
            
            <button
              onClick={() => setSelectedPlayer(null)}
              className="absolute top-4 right-4 p-2 rounded-xl bg-[#0B0E14] text-gray-400 hover:text-white border border-[#262F45]"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-lg font-black uppercase text-white tracking-wider mb-1 flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-[#FF9F1C]" />
              {selectedPlayer.isSolo ? 'Solo Player Full Details' : 'Squad Captain & Team Details'}
            </h2>
            <p className="text-xs text-gray-400 mb-4 font-mono">Reg ID: {selectedPlayer.registrationId}</p>

            <div className="space-y-4 text-xs">
              
              {/* TOURNAMENT CONTEXT */}
              <div className="p-3.5 rounded-xl bg-[#0B0E14] border border-[#262F45] space-y-1">
                <span className="text-[10px] text-gray-400 uppercase font-bold block">Tournament Information</span>
                <div className="font-bold text-white text-sm">{selectedPlayer.tournamentName}</div>
                <div className="text-[11px] text-gray-400 flex items-center gap-3">
                  <span>Type: <strong className="text-amber-400">{selectedPlayer.tournamentType}</strong></span>
                  <span>Entry Fee: <strong className="text-[#FF9F1C]">🪙 {selectedPlayer.entryFee} COIN</strong></span>
                </div>
              </div>

              {/* SOLO PLAYER OR SQUAD DETAILS */}
              {selectedPlayer.isSolo ? (
                <div className="p-4 rounded-xl bg-[#0B0E14] border border-amber-500/30 space-y-3">
                  <div className="flex items-center justify-between border-b border-amber-500/20 pb-2">
                    <span className="font-bold text-amber-400 uppercase">Solo Participant Info</span>
                    <span className="px-2.5 py-0.5 rounded text-xs font-mono font-black bg-amber-500/20 text-amber-300 border border-amber-500/40">
                      SLOT #{selectedPlayer.slotNumber}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-[10px] text-gray-400 uppercase block">In-Game Name (IGN)</span>
                      <span className="font-bold text-white text-sm">{selectedPlayer.freeFireName}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-400 uppercase block">Free Fire UID</span>
                      <span className="font-mono text-emerald-400 font-extrabold text-sm">{selectedPlayer.freeFireUid}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-400 uppercase block">Player Profile Name</span>
                      <span className="font-bold text-white text-sm">{selectedPlayer.playerName}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-400 uppercase block">Account Username</span>
                      <span className="font-bold text-gray-200">@{selectedPlayer.username}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-400 uppercase block">User Email</span>
                      <span className="text-gray-300 font-mono text-[11px]">{selectedPlayer.userEmail || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-400 uppercase block">User Phone</span>
                      <span className="text-gray-300 font-mono text-[11px]">{selectedPlayer.userPhone || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-[#0B0E14] border border-[#FF2E4C]/30 space-y-3">
                  <div className="border-b border-[#FF2E4C]/20 pb-2">
                    <span className="text-[10px] text-gray-400 uppercase block font-bold">Registered Squad Team</span>
                    <span className="font-black text-white text-lg">{selectedPlayer.teamName}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <span className="text-[10px] text-gray-400 uppercase block">Captain In-Game Name (IGN)</span>
                      <span className="font-bold text-white text-sm">{selectedPlayer.captainIgn}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-400 uppercase block">Captain Free Fire UID</span>
                      <span className="font-mono text-emerald-400 font-extrabold text-sm">{selectedPlayer.captainUid}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-400 uppercase block">Captain Profile Name</span>
                      <span className="font-bold text-white text-sm">{selectedPlayer.captainName}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-400 uppercase block">Account Username</span>
                      <span className="font-bold text-gray-200">@{selectedPlayer.captainUsername}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-400 uppercase block">Captain Email</span>
                      <span className="text-gray-300 font-mono text-[11px]">{selectedPlayer.captainEmail || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-400 uppercase block">Captain Phone</span>
                      <span className="text-gray-300 font-mono text-[11px]">{selectedPlayer.captainPhone || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* REGISTRATION METADATA */}
              <div className="p-3.5 rounded-xl bg-[#0B0E14] border border-[#262F45] grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span className="text-gray-400 block">Registration Status:</span>
                  <strong className="text-emerald-400">{selectedPlayer.status}</strong>
                </div>
                <div>
                  <span className="text-gray-400 block">Registered At:</span>
                  <strong className="text-gray-200">{new Date(selectedPlayer.createdAt).toLocaleString()}</strong>
                </div>
              </div>

            </div>

            <div className="pt-4 mt-2 border-t border-[#262F45] flex justify-end">
              <button
                onClick={() => setSelectedPlayer(null)}
                className="px-5 py-2 rounded-xl bg-[#0B0E14] border border-[#262F45] text-xs font-bold text-gray-300 hover:text-white"
              >
                Close Details
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 5. EDIT REGISTRATION MODAL                                */}
      {/* ========================================================= */}
      {editingRegistration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#121722] border border-[#262F45] w-full max-w-md rounded-3xl p-6 shadow-2xl relative">
            
            <button
              onClick={() => setEditingRegistration(null)}
              className="absolute top-4 right-4 p-2 rounded-xl bg-[#0B0E14] text-gray-400 hover:text-white border border-[#262F45]"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-base font-bold text-white uppercase tracking-wider mb-1 flex items-center gap-2">
              <Edit3 className="w-4 h-4 text-cyan-400" />
              Edit Registration
            </h2>
            <p className="text-xs text-gray-400 mb-4 font-mono">ID: {editingRegistration.registrationId}</p>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              
              {editingRegistration.isSolo ? (
                <>
                  <div>
                    <label className="block text-gray-400 font-bold mb-1">Player Slot Number</label>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={editSlotNumber}
                      onChange={(e) => setEditSlotNumber(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="e.g. 5"
                      className="w-full px-3 py-2.5 rounded-xl bg-[#0B0E14] border border-[#262F45] text-white font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-400 font-bold mb-1">Free Fire In-Game Name (IGN)</label>
                    <input
                      type="text"
                      value={editIgn}
                      onChange={(e) => setEditIgn(e.target.value)}
                      placeholder="e.g. MANDIPx"
                      className="w-full px-3 py-2.5 rounded-xl bg-[#0B0E14] border border-[#262F45] text-white font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-400 font-bold mb-1">Free Fire UID</label>
                    <input
                      type="text"
                      value={editUid}
                      onChange={(e) => setEditUid(e.target.value)}
                      placeholder="e.g. 123456789"
                      className="w-full px-3 py-2.5 rounded-xl bg-[#0B0E14] border border-[#262F45] text-white font-mono"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-gray-400 font-bold mb-1">Squad Team Name</label>
                    <input
                      type="text"
                      value={editTeamName}
                      onChange={(e) => setEditTeamName(e.target.value)}
                      placeholder="e.g. KARMA ESPORTS"
                      className="w-full px-3 py-2.5 rounded-xl bg-[#0B0E14] border border-[#262F45] text-white font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-400 font-bold mb-1">Captain In-Game Name (IGN)</label>
                    <input
                      type="text"
                      value={editIgn}
                      onChange={(e) => setEditIgn(e.target.value)}
                      placeholder="e.g. CAPTAINx"
                      className="w-full px-3 py-2.5 rounded-xl bg-[#0B0E14] border border-[#262F45] text-white font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-400 font-bold mb-1">Captain Free Fire UID</label>
                    <input
                      type="text"
                      value={editUid}
                      onChange={(e) => setEditUid(e.target.value)}
                      placeholder="e.g. 987654321"
                      className="w-full px-3 py-2.5 rounded-xl bg-[#0B0E14] border border-[#262F45] text-white font-mono"
                    />
                  </div>
                </>
              )}

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingRegistration(null)}
                  className="px-4 py-2 rounded-xl bg-[#0B0E14] text-gray-400 hover:text-white border border-[#262F45] font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold uppercase tracking-wider"
                >
                  {actionLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 6. REMOVE REGISTRATION CONFIRMATION MODAL                  */}
      {/* ========================================================= */}
      {removingRegistration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#121722] border border-[#262F45] w-full max-w-md rounded-3xl p-6 shadow-2xl relative space-y-4">
            
            <div className="flex items-center gap-3 text-red-400 border-b border-red-500/20 pb-3">
              <AlertCircle className="w-6 h-6 shrink-0" />
              <div>
                <h3 className="text-base font-bold uppercase text-white">Remove Registration?</h3>
                <p className="text-xs text-gray-400">Tournament participant removal request</p>
              </div>
            </div>

            <p className="text-xs text-gray-300 leading-relaxed">
              Are you sure you want to remove <strong className="text-white font-bold">{removingRegistration.name}</strong> from this tournament?
              This will cancel their slot reservation and decrement the registered slot count.
            </p>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRemovingRegistration(null)}
                className="px-4 py-2 rounded-xl bg-[#0B0E14] text-gray-400 hover:text-white border border-[#262F45] text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRemove}
                disabled={actionLoading}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold uppercase tracking-wider"
              >
                {actionLoading ? 'Removing...' : 'Confirm Remove'}
              </button>
            </div>

          </div>
        </div>
      )}

    </main>
  );
}
