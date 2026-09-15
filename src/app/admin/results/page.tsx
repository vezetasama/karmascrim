'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Link from 'next/link';
import {
  Trophy,
  Plus,
  Save,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Users,
  ShieldAlert
} from 'lucide-react';

export default function AdminResultsPage() {
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [selectedTournamentId, setSelectedTournamentId] = useState('');
  const [selectedTournament, setSelectedTournament] = useState<any>(null);
  const [registeredTeams, setRegisteredTeams] = useState<any[]>([]);

  const [matchNumber, setMatchNumber] = useState(1);
  const [scheduledTime, setScheduledTime] = useState('');
  
  // Results inputs map: teamId -> { placement, kills, notes }
  const [resultsInput, setResultsInput] = useState<Record<string, { placement: number; kills: number; notes: string }>>({});

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTournaments();
  }, []);

  useEffect(() => {
    if (selectedTournamentId) {
      fetchTournamentDetails(selectedTournamentId);
    }
  }, [selectedTournamentId]);

  const fetchTournaments = async () => {
    try {
      const res = await fetch('/api/tournaments');
      const data = await res.json();
      if (data.tournaments && data.tournaments.length > 0) {
        setTournaments(data.tournaments);
        setSelectedTournamentId(data.tournaments[0].id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchTournamentDetails = async (id: string) => {
    try {
      const res = await fetch(`/api/tournaments/${id}`);
      const data = await res.json();
      if (data.tournament) {
        setSelectedTournament(data.tournament);
        
        // Extract teams registered
        const teams = data.tournament.registrations
          ?.filter((r: any) => r.status === 'CONFIRMED' && r.team)
          .map((r: any) => r.team) || [];

        setRegisteredTeams(teams);

        // Initialize default input map for teams
        const initialMap: Record<string, { placement: number; kills: number; notes: string }> = {};
        teams.forEach((t: any, index: number) => {
          initialMap[t.id] = { placement: index + 1, kills: 0, notes: '' };
        });
        setResultsInput(initialMap);
      }
    } catch (e) {}
  };

  const handleInputChange = (teamId: string, field: 'placement' | 'kills' | 'notes', value: any) => {
    setResultsInput((prev) => ({
      ...prev,
      [teamId]: {
        ...prev[teamId],
        [field]: value,
      },
    }));
  };

  const handleSaveResults = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTournamentId) return;

    setSaving(true);
    setMsg(null);
    setError(null);

    const resultsArray = Object.entries(resultsInput).map(([teamId, data]) => ({
      teamId,
      placement: Number(data.placement),
      kills: Number(data.kills),
      notes: data.notes,
    }));

    try {
      const res = await fetch('/api/admin/results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tournamentId: selectedTournamentId,
          matchNumber,
          scheduledTime,
          results: resultsArray,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to save results');
        setSaving(false);
        return;
      }

      setMsg(`Match #${matchNumber} results recorded & points calculated! Participants notified.`);
      fetchTournamentDetails(selectedTournamentId);
    } catch (e) {
      setError('Failed to record results');
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="py-4 sm:py-8 max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 w-full">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
          <div>
            <Link href="/admin" className="text-xs text-gray-400 hover:text-white flex items-center gap-1 mb-1">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Admin Overview
            </Link>
            <h1 className="text-2xl font-black uppercase text-white">Match Results & Leaderboard Engine</h1>
            <p className="text-xs text-gray-400">Record team placements & kills to auto-calculate total points and publish official standings</p>
          </div>
        </div>

        {msg && (
          <div className="mb-6 p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-400 text-xs flex items-center justify-between">
            <span>{msg}</span>
            <button onClick={() => setMsg(null)}>✕</button>
          </div>
        )}

        {error && (
          <div className="mb-6 p-3.5 rounded-xl bg-red-950/40 border border-red-500/40 text-red-400 text-xs">
            {error}
          </div>
        )}

        {/* TOURNAMENT SELECTOR */}
        <div className="p-4 rounded-2xl bg-[#121722] border border-[#262F45] mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="w-full sm:w-auto flex items-center gap-3">
            <Trophy className="w-5 h-5 text-[#FF9F1C]" />
            <label className="text-xs font-bold text-gray-300">Select Tournament:</label>
            <select
              value={selectedTournamentId}
              onChange={(e) => setSelectedTournamentId(e.target.value)}
              className="px-3 py-2 rounded-xl bg-[#0B0E14] border border-[#262F45] text-xs text-white focus:outline-none focus:border-[#FF2E4C]"
            >
              {tournaments.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.category})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <span className="text-xs text-gray-400">Match Number:</span>
            <input
              type="number"
              min={1}
              value={matchNumber}
              onChange={(e) => setMatchNumber(Number(e.target.value))}
              className="w-16 px-2.5 py-1.5 rounded-lg bg-[#0B0E14] border border-[#262F45] text-xs text-white font-bold"
            />
          </div>
        </div>

        {/* RESULTS INPUT SHEET */}
        <div className="p-6 rounded-3xl bg-[#121722] border border-[#262F45]">
          <h3 className="text-base font-bold text-white uppercase mb-4 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-[#FF2E4C]" />
            Input Match #{matchNumber} Placement & Kills
          </h3>

          {registeredTeams.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Users className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-sm font-bold">No confirmed squads found for this tournament.</p>
              <p className="text-xs text-gray-500 mt-1">First approve team registrations in the Registrations tab.</p>
            </div>
          ) : (
            <form onSubmit={handleSaveResults} className="space-y-6">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-gray-300">
                  <thead className="bg-[#0B0E14] text-[#FF9F1C] uppercase text-[10px] font-bold border-b border-[#262F45]">
                    <tr>
                      <th className="p-3">Squad Name</th>
                      <th className="p-3">Placement Rank (1st, 2nd...)</th>
                      <th className="p-3">Kills</th>
                      <th className="p-3">Placement Pts</th>
                      <th className="p-3">Total Pts</th>
                      <th className="p-3">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#262F45]">
                    {registeredTeams.map((team) => {
                      const input = resultsInput[team.id] || { placement: 12, kills: 0, notes: '' };
                      const placementPts = [0, 12, 9, 8, 7, 6, 5, 4, 3, 2, 1][input.placement] || 0;
                      const totalPts = placementPts + Number(input.kills || 0);

                      return (
                        <tr key={team.id} className="hover:bg-[#1A2234]">
                          <td className="p-3 font-bold text-white">{team.name}</td>
                          <td className="p-3">
                            <input
                              type="number"
                              min={1}
                              max={12}
                              value={input.placement}
                              onChange={(e) => handleInputChange(team.id, 'placement', Number(e.target.value))}
                              className="w-20 px-2.5 py-1.5 rounded-lg bg-[#0B0E14] border border-[#262F45] text-xs text-white font-bold"
                            />
                          </td>
                          <td className="p-3">
                            <input
                              type="number"
                              min={0}
                              value={input.kills}
                              onChange={(e) => handleInputChange(team.id, 'kills', Number(e.target.value))}
                              className="w-20 px-2.5 py-1.5 rounded-lg bg-[#0B0E14] border border-[#262F45] text-xs text-white font-bold"
                            />
                          </td>
                          <td className="p-3 font-mono text-gray-300 font-bold">{placementPts} pts</td>
                          <td className="p-3 font-mono text-[#FF9F1C] font-extrabold text-sm">{totalPts} pts</td>
                          <td className="p-3">
                            <input
                              type="text"
                              placeholder="Optional notes..."
                              value={input.notes}
                              onChange={(e) => handleInputChange(team.id, 'notes', e.target.value)}
                              className="w-full px-2.5 py-1.5 rounded-lg bg-[#0B0E14] border border-[#262F45] text-xs text-white"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-8 py-3 rounded-xl glow-btn-red text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? 'Publishing Standings...' : 'Publish Match Results & Standings'}</span>
                </button>
              </div>
            </form>
          )}

        </div>

      </main>
  );
}
