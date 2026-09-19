'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Trophy,
  Save,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Users,
  Shield,
  Search,
  Award,
  Check,
  CreditCard,
  Edit3
} from 'lucide-react';

const DEFAULT_SQUAD_PLACEMENT_TABLE: Record<number, number> = {
  1: 12,
  2: 9,
  3: 8,
  4: 7,
  5: 6,
  6: 5,
  7: 4,
  8: 3,
  9: 2,
  10: 1,
};

function AdminResultsContent() {
  const searchParams = useSearchParams();
  const urlTournamentId = searchParams.get('tournamentId');
  const urlTab = searchParams.get('tab');

  const [activeTab, setActiveTab] = useState<'POINT_TABLE' | 'MATCH_RESULTS'>('POINT_TABLE');
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [selectedTournamentId, setSelectedTournamentId] = useState('');
  const [selectedTournament, setSelectedTournament] = useState<any>(null);
  
  // Confirmed registered entities with points & ranks from Registration
  const [participants, setParticipants] = useState<any[]>([]);

  // Search filter for Point Table editor
  const [searchTerm, setSearchTerm] = useState('');

  // Points Map for Point Table editor: entityId -> points
  const [pointsInputMap, setPointsInputMap] = useState<Record<string, number>>({});
  const [savingPoints, setSavingPoints] = useState(false);

  // Match results states
  const [matchNumber, setMatchNumber] = useState(1);
  const [scheduledTime, setScheduledTime] = useState('');
  const [existingMatch, setExistingMatch] = useState<any>(null);
  const [payoutLoadingId, setPayoutLoadingId] = useState<string | null>(null);

  // Results inputs map for match results: entityId -> { placement, kills, otherPoints, winningAmount, notes }
  const [resultsInput, setResultsInput] = useState<Record<string, {
    placement: number;
    kills: number;
    otherPoints: number;
    winningAmount: number;
    notes: string;
  }>>({});

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (urlTab === 'payouts' || urlTab === 'MATCH_RESULTS' || urlTab === 'rewards') {
      setActiveTab('MATCH_RESULTS');
    } else if (urlTab === 'points' || urlTab === 'POINT_TABLE') {
      setActiveTab('POINT_TABLE');
    }
  }, [urlTab]);

  useEffect(() => {
    fetchTournaments();
  }, []);

  useEffect(() => {
    if (selectedTournamentId) {
      fetchTournamentDetails(selectedTournamentId);
    }
  }, [selectedTournamentId, matchNumber]);

  const fetchTournaments = async () => {
    try {
      const res = await fetch('/api/tournaments');
      const data = await res.json();
      if (data.tournaments && data.tournaments.length > 0) {
        setTournaments(data.tournaments);
        if (urlTournamentId && data.tournaments.some((t: any) => t.id === urlTournamentId)) {
          setSelectedTournamentId(urlTournamentId);
        } else {
          setSelectedTournamentId(data.tournaments[0].id);
        }
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
        const tour = data.tournament;
        setSelectedTournament(tour);
        
        const isSolo = tour.type === 'SOLO';

        // Extract confirmed entities (Users for Solo, Teams for Squad)
        let list: any[] = [];
        const ptsMap: Record<string, number> = {};

        if (isSolo) {
          list = tour.registrations
            ?.filter((r: any) => r.status === 'CONFIRMED' && r.user)
            .map((r: any) => {
              const entityId = r.userId;
              ptsMap[entityId] = r.points || 0;
              return {
                id: entityId,
                registrationId: r.id,
                name: r.user.name || r.user.username,
                freeFireUid: r.user.freeFireUid || 'N/A',
                freeFireName: r.user.freeFireName || 'N/A',
                currentPoints: r.points || 0,
                currentRank: r.rank || null,
                user: r.user,
              };
            }) || [];
        } else {
          list = tour.registrations
            ?.filter((r: any) => r.status === 'CONFIRMED' && r.team)
            .map((r: any) => {
              const entityId = r.team.id;
              ptsMap[entityId] = r.points || 0;
              return {
                id: entityId,
                registrationId: r.id,
                name: r.team.name,
                captain: r.user,
                currentPoints: r.points || 0,
                currentRank: r.rank || null,
                team: r.team,
              };
            }) || [];
        }

        setParticipants(list);
        setPointsInputMap(ptsMap);

        // Fetch existing match results if available
        const matchRes = await fetch(`/api/admin/results?tournamentId=${id}`);
        const matchData = await matchRes.json();
        
        const currentMatch = matchData.matches?.find((m: any) => m.matchNumber === matchNumber);
        setExistingMatch(currentMatch || null);

        // Parse Solo Placement Rewards if applicable
        let parsedSoloRewards: Record<string, number> = {};
        if (isSolo && tour.soloPlacementRewards) {
          try {
            parsedSoloRewards = typeof tour.soloPlacementRewards === 'string'
              ? JSON.parse(tour.soloPlacementRewards)
              : tour.soloPlacementRewards;
          } catch (e) {}
        }

        // Build default or existing inputs map for match results
        const initialResultsMap: Record<string, { placement: number; kills: number; otherPoints: number; winningAmount: number; notes: string }> = {};
        
        list.forEach((item: any, index: number) => {
          const placement = index + 1;
          const existingResult = currentMatch?.results?.find((r: any) => isSolo ? r.userId === item.id : r.teamId === item.id);

          let initialWinning = 0;
          if (existingResult) {
            initialWinning = existingResult.winningAmount || 0;
          } else if (isSolo) {
            const kills = 0;
            const killReward = tour.soloKillReward || 0;
            const placeReward = parsedSoloRewards[placement] || parsedSoloRewards[String(placement)] || 0;
            if (tour.soloScoringType === 'PER_KILL') initialWinning = kills * killReward;
            else if (tour.soloScoringType === 'SURVIVAL') initialWinning = placeReward;
            else if (tour.soloScoringType === 'KILL_AND_SURVIVAL') initialWinning = (kills * killReward) + placeReward;
          }

          initialResultsMap[item.id] = {
            placement: existingResult ? existingResult.placement : placement,
            kills: existingResult ? existingResult.kills : 0,
            otherPoints: existingResult ? existingResult.otherPoints : 0,
            winningAmount: existingResult ? existingResult.winningAmount : initialWinning,
            notes: existingResult ? existingResult.notes || '' : '',
          };
        });

        setResultsInput(initialResultsMap);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handlePointChange = (entityId: string, val: string) => {
    const pts = Math.max(0, parseInt(val, 10) || 0);
    setPointsInputMap((prev) => ({
      ...prev,
      [entityId]: pts,
    }));
  };

  const handleSavePoints = async () => {
    if (!selectedTournamentId) return;

    setSavingPoints(true);
    setMsg(null);
    setError(null);

    try {
      const res = await fetch('/api/admin/points', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tournamentId: selectedTournamentId,
          pointsMap: pointsInputMap,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to save points');
        setSavingPoints(false);
        return;
      }

      setMsg(data.message || 'Point Table updated & ranks auto-calculated successfully!');
      fetchTournamentDetails(selectedTournamentId);
    } catch (e) {
      setError('Failed to update Point Table');
    } finally {
      setSavingPoints(false);
    }
  };

  const handleInputChange = (id: string, field: 'placement' | 'kills' | 'otherPoints' | 'winningAmount' | 'notes', value: any) => {
    setResultsInput((prev) => {
      const current = prev[id] || { placement: 1, kills: 0, otherPoints: 0, winningAmount: 0, notes: '' };
      const updated = { ...current, [field]: value };

      if (selectedTournament?.type === 'SOLO' && (field === 'placement' || field === 'kills')) {
        let soloRewards: Record<string, number> = {};
        if (selectedTournament.soloPlacementRewards) {
          try {
            soloRewards = typeof selectedTournament.soloPlacementRewards === 'string'
              ? JSON.parse(selectedTournament.soloPlacementRewards)
              : selectedTournament.soloPlacementRewards;
          } catch (e) {}
        }
        const kills = Number(field === 'kills' ? value : updated.kills);
        const placement = Number(field === 'placement' ? value : updated.placement);
        const killReward = Number(selectedTournament.soloKillReward || 0);
        const placeReward = Number(soloRewards[placement] || soloRewards[String(placement)] || 0);

        let calcWinning = 0;
        if (selectedTournament.soloScoringType === 'PER_KILL') calcWinning = kills * killReward;
        else if (selectedTournament.soloScoringType === 'SURVIVAL') calcWinning = placeReward;
        else if (selectedTournament.soloScoringType === 'KILL_AND_SURVIVAL') calcWinning = (kills * killReward) + placeReward;

        updated.winningAmount = calcWinning;
      }

      return {
        ...prev,
        [id]: updated,
      };
    });
  };

  const handleSaveResults = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTournamentId) return;

    setSaving(true);
    setMsg(null);
    setError(null);

    const isSolo = selectedTournament?.type === 'SOLO';

    const resultsArray = Object.entries(resultsInput).map(([entityId, data]) => ({
      userId: isSolo ? entityId : undefined,
      teamId: !isSolo ? entityId : undefined,
      placement: Number(data.placement),
      kills: Number(data.kills),
      otherPoints: Number(data.otherPoints || 0),
      winningAmount: Number(data.winningAmount || 0),
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

      setMsg(isSolo 
        ? `Match #${matchNumber} Solo results recorded & cash payouts calculated!`
        : `Match #${matchNumber} Squad results recorded & point table standings published!`
      );
      fetchTournamentDetails(selectedTournamentId);
    } catch (e) {
      setError('Failed to record results');
    } finally {
      setSaving(false);
    }
  };

  const handleApprovePayout = async (resultId: string) => {
    setPayoutLoadingId(resultId);
    setError(null);
    setMsg(null);

    try {
      const res = await fetch('/api/admin/results/payout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resultId }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to approve payout');
        setPayoutLoadingId(null);
        return;
      }

      setMsg(data.message || 'Winnings credited to wallet successfully!');
      fetchTournamentDetails(selectedTournamentId);
    } catch (e) {
      setError('Failed to approve wallet payout');
    } finally {
      setPayoutLoadingId(null);
    }
  };

  const isSolo = selectedTournament?.type === 'SOLO';

  // Calculate live ranks for Point Table editor preview
  const previewList = [...participants]
    .map((item) => ({
      ...item,
      points: pointsInputMap[item.id] !== undefined ? pointsInputMap[item.id] : item.currentPoints,
    }))
    .sort((a, b) => b.points - a.points);

  // Assign calculated preview rank
  const calculatedRanksMap: Record<string, number> = {};
  previewList.forEach((item, idx) => {
    calculatedRanksMap[item.id] = idx + 1;
  });

  // Filter participants by search term
  const filteredParticipants = participants.filter((item) => {
    const q = searchTerm.toLowerCase().trim();
    if (!q) return true;
    return (
      item.name.toLowerCase().includes(q) ||
      (item.freeFireUid && item.freeFireUid.toLowerCase().includes(q)) ||
      (item.captain?.name && item.captain.name.toLowerCase().includes(q))
    );
  });

  // Parse Squad Point Table for live match calculation UI
  let parsedSquadPointsTable = DEFAULT_SQUAD_PLACEMENT_TABLE;
  if (!isSolo && selectedTournament?.squadPointTable) {
    try {
      parsedSquadPointsTable = typeof selectedTournament.squadPointTable === 'string'
        ? JSON.parse(selectedTournament.squadPointTable)
        : selectedTournament.squadPointTable;
    } catch (e) {}
  }

  // Parse Solo Placement Rewards for live UI preview
  let parsedSoloPlacementRewards: Record<string, number> = {};
  if (isSolo && selectedTournament?.soloPlacementRewards) {
    try {
      parsedSoloPlacementRewards = typeof selectedTournament.soloPlacementRewards === 'string'
        ? JSON.parse(selectedTournament.soloPlacementRewards)
        : selectedTournament.soloPlacementRewards;
    } catch (e) {}
  }

  return (
    <main className="py-4 sm:py-8 max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 w-full">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
          <div>
            <Link href="/admin" className="text-xs text-gray-400 hover:text-white flex items-center gap-1 mb-1">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Admin Overview
            </Link>
            <h1 className="text-2xl font-black uppercase text-white">Point Table & Match Results Engine</h1>
            <p className="text-xs text-gray-400">
              Manage tournament point table standings with auto-rank calculation, or record match scores and approve wallet payouts.
            </p>
          </div>

          {/* TAB SWITCHER */}
          <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-[#121722] border border-[#262F45]">
            <button
              onClick={() => setActiveTab('POINT_TABLE')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'POINT_TABLE'
                  ? 'bg-[#FF2E4C] text-white shadow-lg'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Trophy className="w-4 h-4" />
              <span>1. POINT TABLE EDITOR</span>
            </button>

            <button
              onClick={() => setActiveTab('MATCH_RESULTS')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'MATCH_RESULTS'
                  ? 'bg-[#FF2E4C] text-white shadow-lg'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Award className="w-4 h-4" />
              <span>2. MATCH SCORES & PAYOUTS</span>
            </button>
          </div>
        </div>

        {msg && (
          <div className="mb-6 p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-400 text-xs flex items-center justify-between">
            <span className="font-semibold">{msg}</span>
            <button onClick={() => setMsg(null)}>✕</button>
          </div>
        )}

        {error && (
          <div className="mb-6 p-3.5 rounded-xl bg-red-950/40 border border-red-500/40 text-red-400 text-xs flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError(null)}>✕</button>
          </div>
        )}

        {/* TOURNAMENT SELECTOR & TYPE DISPLAY */}
        <div className="p-5 rounded-2xl bg-[#121722] border border-[#262F45] mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="w-full md:w-auto flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-center gap-2">
              {isSolo ? <Trophy className="w-5 h-5 text-amber-400" /> : <Shield className="w-5 h-5 text-[#FF2E4C]" />}
              <label className="text-xs font-bold text-gray-300">Select Tournament:</label>
            </div>
            
            <select
              value={selectedTournamentId}
              onChange={(e) => setSelectedTournamentId(e.target.value)}
              className="px-3.5 py-2 rounded-xl bg-[#0B0E14] border border-[#262F45] text-xs text-white focus:outline-none focus:border-[#FF2E4C] font-semibold"
            >
              {tournaments.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} [{t.type || 'SQUAD'}] ({t.category})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
            {isSolo ? (
              <div className="px-3 py-1 rounded-xl bg-amber-500/10 border border-amber-500/40 text-amber-400 text-xs font-bold flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5" />
                <span>SOLO TOURNAMENT</span>
              </div>
            ) : (
              <div className="px-3 py-1 rounded-xl bg-[#FF2E4C]/10 border border-[#FF2E4C]/40 text-[#FF2E4C] text-xs font-bold flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5" />
                <span>SQUAD TOURNAMENT</span>
              </div>
            )}
          </div>
        </div>

        {/* TAB 1: POINT TABLE EDITOR */}
        {activeTab === 'POINT_TABLE' && (
          <div className="p-6 rounded-3xl bg-[#121722] border border-[#262F45] space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#262F45] gap-4">
              <div>
                <h3 className="text-base font-bold text-white uppercase flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-[#FF9F1C]" />
                  {isSolo ? 'Edit Individual Solo Player Points' : 'Edit Squad Point Table Standings'}
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Enter or update points. Ranks are automatically calculated on the server based on points descending.
                </p>
              </div>

              {/* SEARCH BOX */}
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder={isSolo ? "Search player name or UID..." : "Search squad name..."}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#0B0E14] border border-[#262F45] text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#FF2E4C]"
                />
              </div>
            </div>

            {filteredParticipants.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <Users className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-sm font-bold">No registered {isSolo ? 'players' : 'teams'} found.</p>
                <p className="text-xs text-gray-500 mt-1">First approve registrations in the Registrations tab.</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="overflow-x-auto rounded-2xl border border-[#262F45]">
                  <table className="w-full text-left text-xs text-gray-300">
                    <thead className="bg-[#0B0E14] text-[#FF9F1C] uppercase text-[10px] font-bold border-b border-[#262F45]">
                      <tr>
                        <th className="p-3">Auto Rank</th>
                        <th className="p-3">{isSolo ? 'Player Name / FF UID' : 'Squad Name / Captain'}</th>
                        <th className="p-3">Current Points</th>
                        <th className="p-3">Enter / Edit Points</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#262F45]">
                      {filteredParticipants.map((item) => {
                        const calculatedRank = calculatedRanksMap[item.id] || item.currentRank || '—';
                        const currentVal = pointsInputMap[item.id] !== undefined ? pointsInputMap[item.id] : 0;

                        return (
                          <tr key={item.id} className="hover:bg-[#1A2234] transition-colors">
                            <td className="p-3 font-mono font-extrabold text-white text-sm">
                              <span className={`inline-block px-3 py-1 rounded-lg ${
                                calculatedRank === 1 ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 font-black' :
                                calculatedRank === 2 ? 'bg-slate-400/20 text-slate-300 border border-slate-400/40' :
                                calculatedRank === 3 ? 'bg-amber-700/20 text-amber-500 border border-amber-700/40' : 'text-gray-400'
                              }`}>
                                #{calculatedRank}
                              </span>
                            </td>

                            <td className="p-3 font-bold text-white">
                              <div>{item.name}</div>
                              <div className="text-[10px] text-gray-400 font-normal">
                                {isSolo ? `FF UID: ${item.freeFireUid}` : `Captain: ${item.captain?.name || 'N/A'}`}
                              </div>
                            </td>

                            <td className="p-3 font-mono text-gray-300 font-bold text-sm">
                              {item.currentPoints} pts
                            </td>

                            <td className="p-3">
                              <div className="flex items-center gap-2">
                                <input
                                  type="number"
                                  min={0}
                                  value={currentVal}
                                  onChange={(e) => handlePointChange(item.id, e.target.value)}
                                  className="w-24 px-3 py-1.5 rounded-lg bg-[#0B0E14] border border-[#262F45] text-xs text-white font-bold font-mono focus:border-[#FF2E4C]"
                                />
                                <span className="text-xs text-gray-400 font-semibold">PTS</span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-between items-center pt-4">
                  <span className="text-xs text-gray-400">
                    * Ranks are automatically assigned in descending order of points when saved.
                  </span>

                  <button
                    type="button"
                    onClick={handleSavePoints}
                    disabled={savingPoints}
                    className="px-8 py-3 rounded-xl glow-btn-red text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-lg"
                  >
                    <Save className="w-4 h-4" />
                    <span>{savingPoints ? 'Saving & Ranking...' : 'SAVE POINTS & UPDATE RANKINGS'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: MATCH RESULTS & PAYOUTS */}
        {activeTab === 'MATCH_RESULTS' && (
          <div className="p-6 rounded-3xl bg-[#121722] border border-[#262F45] space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#262F45] gap-4">
              <div>
                <h3 className="text-base font-bold text-white uppercase flex items-center gap-2">
                  {isSolo ? <Trophy className="w-4 h-4 text-amber-400" /> : <Shield className="w-4 h-4 text-[#FF2E4C]" />}
                  {isSolo ? `Solo Match #${matchNumber} Individual Player Results` : `Squad Match #${matchNumber} Point Standings`}
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  {isSolo
                    ? `Scoring Type: ${selectedTournament?.soloScoringType} (Per Kill: 🪙 ${selectedTournament?.soloKillReward || 0} COIN)`
                    : `Squad Point Table: Placement Points + ${selectedTournament?.squadKillPoints || 1} Pts per Kill + Other Points`}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400 font-semibold">Match Number:</span>
                <input
                  type="number"
                  min={1}
                  value={matchNumber}
                  onChange={(e) => setMatchNumber(Number(e.target.value))}
                  className="w-16 px-2.5 py-1.5 rounded-lg bg-[#0B0E14] border border-[#262F45] text-xs text-white font-bold"
                />
              </div>
            </div>

            {participants.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <Users className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-sm font-bold">No confirmed registrations found for this tournament.</p>
                <p className="text-xs text-gray-500 mt-1">Approve player or team registrations in the Registrations tab first.</p>
              </div>
            ) : (
              <form onSubmit={handleSaveResults} className="space-y-6">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-gray-300">
                    <thead className="bg-[#0B0E14] text-[#FF9F1C] uppercase text-[10px] font-bold border-b border-[#262F45]">
                      <tr>
                        <th className="p-3">{isSolo ? 'Player Name / FF UID' : 'Squad Name'}</th>
                        <th className="p-3">Rank (1st, 2nd...)</th>
                        <th className="p-3">Kills</th>
                        {!isSolo ? (
                          <>
                            <th className="p-3">Placement Pts</th>
                            <th className="p-3">Kill Pts</th>
                            <th className="p-3">Other Pts</th>
                            <th className="p-3">Total Squad Pts</th>
                            <th className="p-3">Winning Amount (COINS)</th>
                          </>
                        ) : (
                          <>
                            <th className="p-3">Scoring Breakdown</th>
                            <th className="p-3">Calculated Winnings (COINS)</th>
                          </>
                        )}
                        <th className="p-3">Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#262F45]">
                      {participants.map((item) => {
                        const input = resultsInput[item.id] || { placement: 1, kills: 0, otherPoints: 0, winningAmount: 0, notes: '' };
                        
                        if (!isSolo) {
                          const tableRecord = parsedSquadPointsTable as Record<string | number, number>;
                          const placementPts = tableRecord[input.placement] !== undefined 
                            ? Number(tableRecord[input.placement]) 
                            : tableRecord[String(input.placement)] !== undefined
                            ? Number(tableRecord[String(input.placement)])
                            : DEFAULT_SQUAD_PLACEMENT_TABLE[input.placement] || 0;

                          const killPts = (input.kills || 0) * (selectedTournament?.squadKillPoints || 1);
                          const totalPts = placementPts + killPts + Number(input.otherPoints || 0);

                          return (
                            <tr key={item.id} className="hover:bg-[#1A2234]">
                              <td className="p-3 font-bold text-white">
                                <div>{item.name}</div>
                                <div className="text-[10px] text-gray-400 font-normal">Captain: {item.captain?.name || 'N/A'}</div>
                              </td>
                              <td className="p-3">
                                <input
                                  type="number"
                                  min={1}
                                  max={48}
                                  value={input.placement}
                                  onChange={(e) => handleInputChange(item.id, 'placement', Number(e.target.value))}
                                  className="w-16 px-2.5 py-1.5 rounded-lg bg-[#0B0E14] border border-[#262F45] text-xs text-white font-bold"
                                />
                              </td>
                              <td className="p-3">
                                <input
                                  type="number"
                                  min={0}
                                  value={input.kills}
                                  onChange={(e) => handleInputChange(item.id, 'kills', Number(e.target.value))}
                                  className="w-16 px-2.5 py-1.5 rounded-lg bg-[#0B0E14] border border-[#262F45] text-xs text-white font-bold"
                                />
                              </td>
                              <td className="p-3 font-mono text-gray-300 font-bold">{placementPts} pts</td>
                              <td className="p-3 font-mono text-gray-300 font-bold">{killPts} pts</td>
                              <td className="p-3">
                                <input
                                  type="number"
                                  value={input.otherPoints}
                                  onChange={(e) => handleInputChange(item.id, 'otherPoints', Number(e.target.value))}
                                  className="w-16 px-2.5 py-1.5 rounded-lg bg-[#0B0E14] border border-[#262F45] text-xs text-white font-bold"
                                />
                              </td>
                              <td className="p-3 font-mono text-[#FF9F1C] font-extrabold text-sm">{totalPts} pts</td>
                              <td className="p-3">
                                <div className="flex items-center gap-1">
                                  <span className="text-gray-400 text-xs">🪙</span>
                                  <input
                                    type="number"
                                    min={0}
                                    value={input.winningAmount}
                                    onChange={(e) => handleInputChange(item.id, 'winningAmount', Number(e.target.value))}
                                    placeholder="0"
                                    className="w-24 px-2.5 py-1.5 rounded-lg bg-[#0B0E14] border border-emerald-500/40 text-xs text-emerald-400 font-bold"
                                  />
                                </div>
                              </td>
                              <td className="p-3">
                                <input
                                  type="text"
                                  placeholder="Notes..."
                                  value={input.notes}
                                  onChange={(e) => handleInputChange(item.id, 'notes', e.target.value)}
                                  className="w-full px-2.5 py-1.5 rounded-lg bg-[#0B0E14] border border-[#262F45] text-xs text-white"
                                />
                              </td>
                            </tr>
                          );
                        } else {
                          const killReward = selectedTournament?.soloKillReward || 0;
                          const placeReward = parsedSoloPlacementRewards[input.placement] || parsedSoloPlacementRewards[String(input.placement)] || 0;

                          let breakdownText = '';
                          if (selectedTournament?.soloScoringType === 'PER_KILL') {
                            breakdownText = `${input.kills} kills × 🪙 ${killReward} COIN`;
                          } else if (selectedTournament?.soloScoringType === 'SURVIVAL') {
                            breakdownText = `Rank #${input.placement} Survival Reward`;
                          } else {
                            breakdownText = `(${input.kills} × 🪙 ${killReward} COIN) + Rank #${input.placement} (🪙 ${placeReward} COIN)`;
                          }

                          return (
                            <tr key={item.id} className="hover:bg-[#1A2234]">
                              <td className="p-3 font-bold text-white">
                                <div>{item.name}</div>
                                <div className="text-[10px] text-gray-400 font-mono">UID: {item.freeFireUid}</div>
                              </td>
                              <td className="p-3">
                                <input
                                  type="number"
                                  min={1}
                                  max={48}
                                  value={input.placement}
                                  onChange={(e) => handleInputChange(item.id, 'placement', Number(e.target.value))}
                                  className="w-16 px-2.5 py-1.5 rounded-lg bg-[#0B0E14] border border-[#262F45] text-xs text-white font-bold"
                                />
                              </td>
                              <td className="p-3">
                                <input
                                  type="number"
                                  min={0}
                                  value={input.kills}
                                  onChange={(e) => handleInputChange(item.id, 'kills', Number(e.target.value))}
                                  className="w-16 px-2.5 py-1.5 rounded-lg bg-[#0B0E14] border border-[#262F45] text-xs text-white font-bold"
                                />
                              </td>
                              <td className="p-3 text-[11px] text-gray-400 font-medium">
                                {breakdownText}
                              </td>
                              <td className="p-3 font-mono text-emerald-400 font-extrabold text-sm">
                                🪙 {input.winningAmount} COIN
                              </td>
                              <td className="p-3">
                                <input
                                  type="text"
                                  placeholder="Notes..."
                                  value={input.notes}
                                  onChange={(e) => handleInputChange(item.id, 'notes', e.target.value)}
                                  className="w-full px-2.5 py-1.5 rounded-lg bg-[#0B0E14] border border-[#262F45] text-xs text-white"
                                />
                              </td>
                            </tr>
                          );
                        }
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
                    <span>{saving ? 'Publishing Standings...' : isSolo ? 'Publish Solo Standings & Calculate Cash Winnings' : 'Publish Squad Points Table Standings'}</span>
                  </button>
                </div>
              </form>
            )}

            {/* EXISTING RECORDED MATCH STANDINGS & PAYOUT CONTROLS */}
            {existingMatch && existingMatch.results?.length > 0 && (
              <div className="mt-8 p-6 rounded-3xl bg-[#121722] border border-emerald-500/30 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#262F45]">
                  <div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <Award className="w-4 h-4 text-emerald-400" />
                      Published Standings & Wallet Prize Payout Controls
                    </h3>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Verify final calculated standings and approve wallet credit for prize winners.
                    </p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 uppercase tracking-widest">
                    Published & Live
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-gray-300">
                    <thead className="bg-[#0B0E14] text-gray-400 uppercase text-[10px] font-bold border-b border-[#262F45]">
                      <tr>
                        <th className="p-3">Rank</th>
                        <th className="p-3">{isSolo ? 'Player Name' : 'Squad Name'}</th>
                        <th className="p-3">Kills</th>
                        {!isSolo && <th className="p-3">Placement Pts</th>}
                        {!isSolo && <th className="p-3">Total Pts</th>}
                        <th className="p-3">Awarded Winnings</th>
                        <th className="p-3">Payout Status</th>
                        <th className="p-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#262F45]">
                      {existingMatch.results.map((resItem: any) => {
                        const isPaid = resItem.payoutStatus === 'PAID';
                        const hasWinnings = (resItem.winningAmount || 0) > 0;
                        const entityName = isSolo ? (resItem.user?.name || resItem.user?.username || 'Player') : (resItem.team?.name || 'Squad');

                        return (
                          <tr key={resItem.id} className="hover:bg-[#1A2234]">
                            <td className="p-3 font-mono font-extrabold text-white">#{resItem.placement}</td>
                            <td className="p-3 font-bold text-white">{entityName}</td>
                            <td className="p-3 font-mono text-gray-300">{resItem.kills}</td>
                            {!isSolo && <td className="p-3 font-mono text-gray-300">{resItem.placementPoints} pts</td>}
                            {!isSolo && <td className="p-3 font-mono text-[#FF9F1C] font-extrabold">{resItem.totalPoints} pts</td>}
                            <td className="p-3 font-mono text-emerald-400 font-extrabold text-sm">
                              🪙 {resItem.winningAmount?.toLocaleString() || 0} COIN
                            </td>
                            <td className="p-3">
                              {isPaid ? (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 w-max">
                                  <Check className="w-3 h-3" /> Paid to Wallet
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 w-max">
                                  Pending Approval
                                </span>
                              )}
                            </td>
                            <td className="p-3 text-right">
                              {hasWinnings && !isPaid ? (
                                <button
                                  onClick={() => handleApprovePayout(resItem.id)}
                                  disabled={payoutLoadingId === resItem.id}
                                  className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs flex items-center gap-1.5 ml-auto"
                                >
                                  <CreditCard className="w-3.5 h-3.5" />
                                  <span>{payoutLoadingId === resItem.id ? 'Crediting...' : 'Approve & Credit Wallet'}</span>
                                </button>
                              ) : isPaid ? (
                                <span className="text-[10px] text-gray-500 italic">Credited</span>
                              ) : (
                                <span className="text-[10px] text-gray-500 italic">No prize</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

      </main>
  );
}

export default function AdminResultsPage() {
  return (
    <Suspense fallback={
      <div className="py-20 text-center text-gray-400 font-bold">
        <div className="w-10 h-10 border-4 border-[#FF2E4C] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p>Loading Point Table & Results Engine...</p>
      </div>
    }>
      <AdminResultsContent />
    </Suspense>
  );
}

