'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Link from 'next/link';
import {
  Trophy,
  Plus,
  Edit,
  Trash2,
  Lock,
  Unlock,
  CheckCircle2,
  AlertTriangle,
  X,
  Eye,
  Shield,
  Clock,
  ArrowLeft
} from 'lucide-react';

const PREDEFINED_MAPS = ['Bermuda', 'Purgatory', 'Kalahari', 'Alpine', 'Nexterra'];

const parseMaps = (mapsField: any): string[] => {
  if (!mapsField) return [];
  if (Array.isArray(mapsField)) return mapsField;
  try {
    const parsed = JSON.parse(mapsField);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    if (typeof mapsField === 'string') {
      return mapsField.split(',').map((m) => m.trim()).filter(Boolean);
    }
    return [];
  }
};

export default function AdminTournamentsPage() {
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [roomModalOpen, setRoomModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const [selectedTournament, setSelectedTournament] = useState<any>(null);

  // Tournament Form State
  const [name, setName] = useState('');
  const [category, setCategory] = useState('FULL_MAP');
  const [format, setFormat] = useState('Squad');
  const [description, setDescription] = useState('');
  const [rules, setRules] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('07:00 PM');
  const [registrationDeadline, setRegistrationDeadline] = useState('06:30 PM');
  const [entryFee, setEntryFee] = useState(100);
  const [prizePool, setPrizePool] = useState(2000);
  const [totalSlots, setTotalSlots] = useState(48);
  const [bannerUrl, setBannerUrl] = useState('');
  const [status, setStatus] = useState('REGISTRATION_OPEN');

  // Maps Management State
  const [selectedMaps, setSelectedMaps] = useState<string[]>(['Bermuda', 'Purgatory', 'Kalahari']);
  const [customMapInput, setCustomMapInput] = useState('');

  // Room Form State
  const [roomId, setRoomId] = useState('');
  const [roomPassword, setRoomPassword] = useState('');
  const [roomReleased, setRoomReleased] = useState(false);

  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchTournaments();
  }, []);

  const fetchTournaments = async () => {
    try {
      const res = await fetch('/api/tournaments');
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

  const toggleMap = (mapName: string) => {
    if (selectedMaps.includes(mapName)) {
      setSelectedMaps(selectedMaps.filter((m) => m !== mapName));
    } else {
      setSelectedMaps([...selectedMaps, mapName]);
    }
  };

  const handleAddCustomMap = () => {
    const trimmed = customMapInput.trim();
    if (trimmed && !selectedMaps.includes(trimmed)) {
      setSelectedMaps([...selectedMaps, trimmed]);
      setCustomMapInput('');
    }
  };

  const resetForm = () => {
    setSelectedTournament(null);
    setName('');
    setCategory('FULL_MAP');
    setFormat('Squad');
    setDescription('');
    setRules('');
    setDate(new Date().toISOString().split('T')[0]);
    setStartTime('07:00 PM');
    setRegistrationDeadline('06:30 PM');
    setEntryFee(100);
    setPrizePool(2000);
    setTotalSlots(48);
    setBannerUrl('');
    setStatus('REGISTRATION_OPEN');
    setSelectedMaps(['Bermuda', 'Purgatory', 'Kalahari']);
    setCustomMapInput('');
    setError(null);
  };

  const handleEditClick = (t: any) => {
    setSelectedTournament(t);
    setName(t.name);
    setCategory(t.category);
    setFormat(t.format);
    setDescription(t.description || '');
    setRules(t.rules || '');
    setDate(t.date);
    setStartTime(t.startTime);
    setRegistrationDeadline(t.registrationDeadline);
    setEntryFee(t.entryFee);
    setPrizePool(t.prizePool);
    setTotalSlots(t.totalSlots);
    setBannerUrl(t.bannerUrl || '');
    setStatus(t.status);
    setSelectedMaps(parseMaps(t.maps));
    setCustomMapInput('');
    setModalOpen(true);
  };

  const handleRoomClick = (t: any) => {
    setSelectedTournament(t);
    setRoomId(t.roomId || '');
    setRoomPassword(t.roomPassword || '');
    setRoomReleased(Boolean(t.roomReleased || (t.roomId && t.roomPassword)));
    setRoomModalOpen(true);
  };

  const handleDeleteClick = (t: any) => {
    setSelectedTournament(t);
    setDeleteModalOpen(true);
  };

  const handleSaveTournament = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setError(null);

    const body = {
      name,
      category,
      format,
      description,
      rules,
      date,
      startTime,
      registrationDeadline,
      entryFee,
      prizePool,
      totalSlots,
      bannerUrl,
      status,
      maps: selectedMaps,
    };

    try {
      const url = selectedTournament ? `/api/tournaments/${selectedTournament.id}` : '/api/tournaments';
      const method = selectedTournament ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to save tournament');
        setActionLoading(false);
        return;
      }

      setSuccessMsg(selectedTournament ? 'Tournament updated!' : 'Tournament created!');
      setModalOpen(false);
      resetForm();
      fetchTournaments();
    } catch (e) {
      setError('Something went wrong');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveRoomDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/tournaments/${selectedTournament.id}/room`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId, roomPassword, roomReleased }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to update room details');
        setActionLoading(false);
        return;
      }

      setSuccessMsg(`Room details updated! ${roomReleased ? 'Room released to confirmed participants.' : ''}`);
      setRoomModalOpen(false);
      fetchTournaments();
    } catch (e) {
      setError('Failed to save room codes');
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedTournament) return;
    setActionLoading(true);

    try {
      const res = await fetch(`/api/tournaments/${selectedTournament.id}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to delete tournament');
        setActionLoading(false);
        return;
      }

      setSuccessMsg('Tournament deleted safely.');
      setDeleteModalOpen(false);
      fetchTournaments();
    } catch (e) {
      setError('Failed to delete tournament');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0B0E14] text-white">
      <Navbar />

      <main className="flex-1 py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
          <div>
            <Link href="/admin" className="text-xs text-gray-400 hover:text-white flex items-center gap-1 mb-1">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Admin Overview
            </Link>
            <h1 className="text-2xl font-black uppercase text-white">Tournament Management</h1>
            <p className="text-xs text-gray-400">Create, edit, manage slots, and release Room IDs & Passwords</p>
          </div>

          <button
            onClick={() => {
              resetForm();
              setModalOpen(true);
            }}
            className="px-5 py-2.5 rounded-xl glow-btn-red text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Create Tournament</span>
          </button>
        </div>

        {successMsg && (
          <div className="mb-6 p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-400 text-xs flex items-center justify-between">
            <span>{successMsg}</span>
            <button onClick={() => setSuccessMsg(null)}>
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Tournament Data Table */}
        <div className="p-6 rounded-3xl bg-[#121722] border border-[#262F45]">
          {loading ? (
            <div className="h-64 flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-[#FF2E4C] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : tournaments.length === 0 ? (
            <div className="text-center py-12">
              <Trophy className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-sm font-bold text-gray-300">No tournaments created yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-gray-300">
                <thead className="bg-[#0B0E14] text-[#FF9F1C] uppercase text-[10px] font-bold border-b border-[#262F45]">
                  <tr>
                    <th className="p-3.5">Tournament Name</th>
                    <th className="p-3.5">Category & Format</th>
                    <th className="p-3.5">Maps</th>
                    <th className="p-3.5">Date & Time</th>
                    <th className="p-3.5">Entry / Prize</th>
                    <th className="p-3.5">Slots</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5">Room Status</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#262F45]">
                  {tournaments.map((t) => {
                    const roomVisible = Boolean(t.roomReleased || (t.roomId && t.roomPassword));

                    return (
                    <tr key={t.id} className="hover:bg-[#1A2234]">
                      <td className="p-3.5 font-bold text-white max-w-xs truncate">{t.name}</td>
                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          t.category === 'FULL_MAP' ? 'badge-full-map' : 'badge-clash-squad'
                        }`}>
                          {t.category} ({t.format})
                        </span>
                      </td>
                      <td className="p-3.5 max-w-[180px]">
                        {(() => {
                          const mapsList = parseMaps(t.maps);
                          if (mapsList.length === 0) {
                            return <span className="text-[10px] text-gray-500 italic">No maps set</span>;
                          }
                          return (
                            <div className="flex flex-wrap gap-1">
                              {mapsList.map((m: string) => (
                                <span key={m} className="px-1.5 py-0.5 rounded text-[10px] bg-[#0B0E14] border border-[#262F45] text-gray-300 font-semibold">
                                  {m}
                                </span>
                              ))}
                            </div>
                          );
                        })()}
                      </td>
                      <td className="p-3.5">
                        <div>{t.date}</div>
                        <div className="text-[10px] text-[#FF9F1C] font-semibold">{t.startTime}</div>
                      </td>
                      <td className="p-3.5 font-mono">
                        <div className="text-white font-bold">NPR {t.prizePool}</div>
                        <div className="text-[10px] text-gray-400">Entry: NPR {t.entryFee}</div>
                      </td>
                      <td className="p-3.5 font-bold text-white">
                        {t.registeredSlots} / {t.totalSlots}
                      </td>
                      <td className="p-3.5">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#0B0E14] border border-[#262F45] text-gray-300">
                          {t.status}
                        </span>
                      </td>
                      <td className="p-3.5">
                        {roomVisible ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 w-max">
                            <Unlock className="w-3 h-3" /> Released
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-950/40 text-rose-400 border border-rose-500/30 flex items-center gap-1 w-max">
                            <Lock className="w-3 h-3" /> Hidden
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 text-right space-x-1.5 whitespace-nowrap">
                        {/* Manage Room Codes */}
                        <button
                          onClick={() => handleRoomClick(t)}
                          className="p-1.5 rounded-lg bg-[#0B0E14] border border-amber-500/40 text-[#FF9F1C] hover:bg-amber-950/30"
                          title="Manage Room ID & Password"
                        >
                          <Lock className="w-3.5 h-3.5" />
                        </button>
                        {/* Edit */}
                        <button
                          onClick={() => handleEditClick(t)}
                          className="p-1.5 rounded-lg bg-[#0B0E14] border border-[#262F45] text-gray-300 hover:text-white"
                          title="Edit Tournament"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        {/* Delete */}
                        <button
                          onClick={() => handleDeleteClick(t)}
                          className="p-1.5 rounded-lg bg-[#0B0E14] border border-red-500/40 text-red-400 hover:bg-red-950/30"
                          title="Delete Tournament"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* CREATE / EDIT TOURNAMENT MODAL */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
            <div className="bg-[#121722] border border-[#262F45] w-full max-w-2xl rounded-3xl p-6 shadow-2xl relative my-8">
              <button
                onClick={() => setModalOpen(false)}
                className="absolute top-4 right-4 p-2 rounded-xl bg-[#0B0E14] text-gray-400 hover:text-white border border-[#262F45]"
              >
                <X className="w-5 h-5" />
              </button>

              <h2 className="text-lg font-bold text-white uppercase tracking-wider mb-4">
                {selectedTournament ? 'Edit Tournament' : 'Create New Tournament'}
              </h2>

              {error && (
                <div className="mb-4 p-3 rounded-xl bg-red-950/40 border border-red-500/50 text-red-400 text-xs">
                  {error}
                </div>
              )}

              <form onSubmit={handleSaveTournament} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1">Tournament Name *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Full Map — 7:00 PM Evening Grand Championship"
                    className="w-full px-3 py-2.5 rounded-xl bg-[#0B0E14] border border-[#262F45] text-xs text-white"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 mb-1">Category *</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-[#0B0E14] border border-[#262F45] text-xs text-white"
                    >
                      <option value="FULL_MAP">Full Map</option>
                      <option value="CLASH_SQUAD">Clash Squad</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-400 mb-1">Format *</label>
                    <input
                      type="text"
                      value={format}
                      onChange={(e) => setFormat(e.target.value)}
                      placeholder="Squad, 1v1, 2v2, 4v4"
                      className="w-full px-3 py-2.5 rounded-xl bg-[#0B0E14] border border-[#262F45] text-xs text-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-400 mb-1">Status *</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-[#0B0E14] border border-[#262F45] text-xs text-white"
                    >
                      <option value="REGISTRATION_OPEN">Registration Open</option>
                      <option value="REGISTRATION_CLOSED">Registration Closed</option>
                      <option value="LIVE">Live Now</option>
                      <option value="COMPLETED">Completed</option>
                      <option value="CANCELLED">Cancelled</option>
                      <option value="DRAFT">Draft</option>
                    </select>
                  </div>
                </div>

                {/* Map Multi-Select Section */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-gray-400">
                    Free Fire Maps Included (Multi-select) *
                  </label>
                  <div className="p-3 rounded-xl bg-[#0B0E14] border border-[#262F45] space-y-3">
                    <div className="flex flex-wrap gap-2">
                      {PREDEFINED_MAPS.map((m) => {
                        const isSelected = selectedMaps.includes(m);
                        return (
                          <button
                            type="button"
                            key={m}
                            onClick={() => toggleMap(m)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border flex items-center gap-1.5 ${
                              isSelected
                                ? 'bg-[#FF2E4C]/20 text-[#FF2E4C] border-[#FF2E4C] shadow-sm'
                                : 'bg-[#121722] text-gray-400 border-[#262F45] hover:text-white hover:border-gray-500'
                            }`}
                          >
                            <span className="text-[10px]">{isSelected ? '✓' : '+'}</span>
                            <span>{m}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Custom Map Input */}
                    <div className="flex items-center gap-2 pt-2 border-t border-[#262F45]/60">
                      <input
                        type="text"
                        placeholder="Add another map (e.g. NeXT, Kalahari)..."
                        value={customMapInput}
                        onChange={(e) => setCustomMapInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddCustomMap();
                          }
                        }}
                        className="flex-1 px-3 py-1.5 rounded-lg bg-[#121722] border border-[#262F45] text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#FF2E4C]"
                      />
                      <button
                        type="button"
                        onClick={handleAddCustomMap}
                        className="px-3 py-1.5 rounded-lg bg-[#262F45] hover:bg-[#FF2E4C] text-white text-xs font-bold transition-colors"
                      >
                        Add Map
                      </button>
                    </div>

                    {/* Selected Maps List / Badge preview */}
                    {selectedMaps.length > 0 ? (
                      <div className="text-[11px] text-gray-300 font-semibold flex items-center gap-1.5 flex-wrap pt-1">
                        <span className="text-gray-500">Active Maps ({selectedMaps.length}):</span>
                        {selectedMaps.map((mapName) => (
                          <span
                            key={mapName}
                            className="inline-flex items-center gap-1 bg-[#1A2234] border border-[#FF2E4C]/40 px-2 py-0.5 rounded-md text-white font-bold"
                          >
                            🗺️ {mapName}
                            <button
                              type="button"
                              onClick={() => toggleMap(mapName)}
                              className="text-gray-400 hover:text-red-400 ml-1 text-xs"
                              title="Remove Map"
                            >
                              ✕
                            </button>
                          </span>
                        ))}
                      </div>
                    ) : (
                      <div className="text-[11px] text-amber-400 italic">
                        ⚠️ No maps selected. Card will display fallback: "Map details coming soon".
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 mb-1">Date *</label>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-[#0B0E14] border border-[#262F45] text-xs text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 mb-1">Start Time *</label>
                    <input
                      type="text"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      placeholder="07:00 PM"
                      className="w-full px-3 py-2.5 rounded-xl bg-[#0B0E14] border border-[#262F45] text-xs text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 mb-1">Reg Deadline</label>
                    <input
                      type="text"
                      value={registrationDeadline}
                      onChange={(e) => setRegistrationDeadline(e.target.value)}
                      placeholder="06:30 PM"
                      className="w-full px-3 py-2.5 rounded-xl bg-[#0B0E14] border border-[#262F45] text-xs text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 mb-1">Entry Fee (NPR) *</label>
                    <input
                      type="number"
                      value={entryFee}
                      onChange={(e) => setEntryFee(Number(e.target.value))}
                      className="w-full px-3 py-2.5 rounded-xl bg-[#0B0E14] border border-[#262F45] text-xs text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 mb-1">Prize Pool (NPR) *</label>
                    <input
                      type="number"
                      value={prizePool}
                      onChange={(e) => setPrizePool(Number(e.target.value))}
                      className="w-full px-3 py-2.5 rounded-xl bg-[#0B0E14] border border-[#262F45] text-xs text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 mb-1">Total Capacity Slots *</label>
                    <input
                      type="number"
                      value={totalSlots}
                      onChange={(e) => setTotalSlots(Number(e.target.value))}
                      className="w-full px-3 py-2.5 rounded-xl bg-[#0B0E14] border border-[#262F45] text-xs text-white"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1">Banner Image URL (Optional)</label>
                  <input
                    type="text"
                    value={bannerUrl}
                    onChange={(e) => setBannerUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full px-3 py-2.5 rounded-xl bg-[#0B0E14] border border-[#262F45] text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1">Description</label>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#0B0E14] border border-[#262F45] text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1">Match Rules</label>
                  <textarea
                    rows={3}
                    value={rules}
                    onChange={(e) => setRules(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#0B0E14] border border-[#262F45] text-xs text-white"
                  />
                </div>

                <div className="pt-4 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl bg-[#0B0E14] text-gray-400 hover:text-white border border-[#262F45] text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="px-6 py-2.5 rounded-xl glow-btn-red text-white text-xs font-bold uppercase tracking-wider"
                  >
                    {actionLoading ? 'Saving...' : 'Save Tournament'}
                  </button>
                </div>

              </form>
            </div>
          </div>
        )}

        {/* ROOM ID & PASS RELEASE MODAL */}
        {roomModalOpen && selectedTournament && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <div className="bg-[#121722] border border-[#262F45] w-full max-w-md rounded-3xl p-6 shadow-2xl relative">
              <button
                onClick={() => setRoomModalOpen(false)}
                className="absolute top-4 right-4 p-2 rounded-xl bg-[#0B0E14] text-gray-400 hover:text-white border border-[#262F45]"
              >
                <X className="w-5 h-5" />
              </button>

              <h2 className="text-base font-bold text-white uppercase tracking-wider mb-1 flex items-center gap-2">
                <Lock className="w-4 h-4 text-[#FF9F1C]" />
                Room Code Manager
              </h2>
              <p className="text-xs text-gray-400 mb-4">{selectedTournament.name}</p>

              <form onSubmit={handleSaveRoomDetails} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1">Room ID</label>
                  <input
                    type="text"
                    value={roomId}
                    onChange={(e) => setRoomId(e.target.value)}
                    placeholder="e.g. 9847102"
                    className="w-full px-3 py-2.5 rounded-xl bg-[#0B0E14] border border-[#262F45] text-xs text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1">Room Password</label>
                  <input
                    type="text"
                    value={roomPassword}
                    onChange={(e) => setRoomPassword(e.target.value)}
                    placeholder="e.g. 777"
                    className="w-full px-3 py-2.5 rounded-xl bg-[#0B0E14] border border-[#262F45] text-xs text-white font-mono"
                  />
                </div>

                {/* Release Switch */}
                <label className="flex items-center justify-between p-3.5 rounded-xl bg-[#0B0E14] border border-[#262F45] cursor-pointer">
                  <div>
                    <div className="font-bold text-xs text-white">Release Room Details</div>
                    <div className="text-[11px] text-gray-400">Unlock codes for confirmed participants & notify them.</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={roomReleased}
                    onChange={(e) => setRoomReleased(e.target.checked)}
                    className="w-5 h-5 accent-emerald-500"
                  />
                </label>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setRoomModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-[#0B0E14] text-gray-400 text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="px-5 py-2 rounded-xl bg-[#FF9F1C] text-slate-950 text-xs font-bold uppercase tracking-wider"
                  >
                    {actionLoading ? 'Saving...' : 'Update & Notify'}
                  </button>
                </div>

              </form>
            </div>
          </div>
        )}

        {/* DELETE CONFIRMATION MODAL */}
        {deleteModalOpen && selectedTournament && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <div className="bg-[#121722] border border-red-500/40 w-full max-w-md rounded-3xl p-6 shadow-2xl relative text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white uppercase">Confirm Tournament Deletion</h3>
              <p className="text-xs text-gray-300">
                Are you sure you want to delete <strong className="text-white">{selectedTournament.name}</strong>?
              </p>
              {selectedTournament.registeredSlots > 0 && (
                <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/40 text-xs text-red-300 text-left">
                  ⚠️ Warning: This tournament has {selectedTournament.registeredSlots} registered slots! Related registration records will be safely cleaned up.
                </div>
              )}
              <div className="flex justify-center gap-3 pt-2">
                <button
                  onClick={() => setDeleteModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[#0B0E14] text-gray-400 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDelete}
                  disabled={actionLoading}
                  className="px-6 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold uppercase"
                >
                  {actionLoading ? 'Deleting...' : 'Yes, Delete'}
                </button>
              </div>
            </div>
          </div>
        )}

      </main>

      <Footer />
    </div>
  );
}
