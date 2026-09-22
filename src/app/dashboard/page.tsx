'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Link from 'next/link';
import EditRegistrationModal from '@/components/EditRegistrationModal';
import {
  User,
  Users,
  Trophy,
  CreditCard,
  Bell,
  Unlock,
  Lock,
  Copy,
  Check,
  Plus,
  Shield,
  Clock,
  Edit2,
  Edit3,
  Save,
  CheckCircle2,
  AlertCircle,
  LogOut
} from 'lucide-react';

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [myTeams, setMyTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'tournaments' | 'teams' | 'profile' | 'notifications'>('tournaments');

  // Edit Registration Modal State
  const [selectedRegToEdit, setSelectedRegToEdit] = useState<any>(null);

  // Profile Edit State
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [profileUid, setProfileUid] = useState('');
  const [profileIgn, setProfileIgn] = useState('');
  const [profileMsg, setProfileMsg] = useState<string | null>(null);

  // Copy States
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    fetchUserData();

    const handleRefresh = () => {
      fetchUserData();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('karma_refresh', handleRefresh);
    }

    const interval = window.setInterval(() => {
      fetchUserData();
    }, 4000);

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('karma_refresh', handleRefresh);
      }
      window.clearInterval(interval);
    };
  }, []);

  const fetchUserData = async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (data.user) {
        setUser(data.user);
        setProfileName(data.user.name || '');
        setProfileUid(data.user.freeFireUid || '');
        setProfileIgn(data.user.freeFireName || '');
      }
      fetchTeams();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeams = async () => {
    try {
      const res = await fetch('/api/teams');
      const data = await res.json();
      if (data.teams) {
        setMyTeams(data.teams);
      }
    } catch (e) {}
  };

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/auth/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: profileName,
          freeFireUid: profileUid,
          freeFireName: profileIgn,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setProfileMsg('Profile updated successfully!');
        setEditingProfile(false);
        fetchUserData();
      }
    } catch (e) {
      setProfileMsg('Failed to update profile.');
    }
  };

  const copyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      window.location.href = '/';
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0E14] text-white flex flex-col justify-between">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-20 w-full text-center">
          <div className="w-10 h-10 border-4 border-[#FF2E4C] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-gray-400 mt-4">Loading player dashboard...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0B0E14] text-white flex flex-col justify-between">
        <Navbar />
        <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-[#FF2E4C] mx-auto" />
          <h2 className="text-xl font-bold text-white">Please Login</h2>
          <p className="text-xs text-gray-400">You must be logged in to access your dashboard.</p>
          <Link href="/login" className="inline-block px-6 py-2.5 rounded-xl glow-btn-red text-xs font-bold uppercase">
            Login Now
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#0B0E14] text-white">
      <Navbar />

      <main className="flex-1 py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        
        {/* DASHBOARD HEADER */}
        <div className="p-6 rounded-3xl bg-gradient-to-r from-[#121722] via-[#1A2234] to-[#121722] border border-[#262F45] mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#FF2E4C] to-[#FF9F1C] flex items-center justify-center text-white font-extrabold text-2xl shadow-lg shadow-[#FF2E4C]/20 uppercase">
              {user.name ? user.name[0] : 'P'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-white">{user.name}</h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FF2E4C]/20 text-[#FF2E4C] border border-[#FF2E4C]/40">
                  {user.role}
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">{user.email}</p>
              <div className="flex items-center gap-3 text-[11px] text-gray-300 mt-1 font-mono">
                <span>FF UID: <strong className="text-[#FF9F1C]">{user.freeFireUid || 'Not Set'}</strong></span>
                <span>•</span>
                <span>IGN: <strong className="text-white">{user.freeFireName || 'Not Set'}</strong></span>
              </div>
            </div>
          </div>

          {/* Profile Actions: Profile Settings & Logout */}
          <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
            <button
              type="button"
              onClick={() => setActiveTab(activeTab === 'profile' ? 'tournaments' : 'profile')}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all ${
                activeTab === 'profile' ? 'bg-[#FF2E4C] text-white shadow-lg shadow-[#FF2E4C]/25' : 'glow-btn-red text-white'
              }`}
            >
              <User className="w-4 h-4" />
              <span>{activeTab === 'profile' ? 'Close Settings' : 'Profile Settings'}</span>
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="px-4 py-2.5 rounded-xl bg-red-950/40 hover:bg-red-900/60 text-red-400 border border-red-500/40 text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4 text-red-400" />
              <span>Logout</span>
            </button>
          </div>
        </div>

        {/* TAB NAVIGATION */}
        <div className="flex items-center space-x-2 border-b border-[#262F45] mb-8 overflow-x-auto pb-2">
          <button
            onClick={() => setActiveTab('tournaments')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors ${
              activeTab === 'tournaments' ? 'bg-[#FF2E4C] text-white' : 'text-gray-400 hover:text-white bg-[#121722]'
            }`}
          >
            <Trophy className="w-4 h-4" />
            <span>My Tournaments ({user.registrations?.length || 0})</span>
          </button>
        </div>

        {/* TAB 1: MY TOURNAMENTS & RELEASED ROOM CODES */}
        {activeTab === 'tournaments' && (
          <div className="space-y-6">
            
            {user.registrations?.length === 0 ? (
              <div className="p-12 text-center bg-[#121722] rounded-3xl border border-[#262F45]">
                <Trophy className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <h3 className="text-base font-bold text-gray-300">You haven't registered for any tournaments yet.</h3>
                <p className="text-xs text-gray-500 mt-1 mb-4">Choose a Per Kill or Survival Solo tournament to enter!</p>
                <Link href="/" className="px-6 py-2.5 rounded-xl glow-btn-red text-white text-xs font-bold uppercase">
                  Explore Tournaments
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {user.registrations.map((reg: any) => {
                  const t = reg.tournament;
                  const isConfirmed = reg.status === 'CONFIRMED';
                  const roomUnlocked = isConfirmed && t.roomReleased && t.roomId;

                  return (
                    <div key={reg.id} className="p-6 rounded-2xl bg-[#121722] border border-[#262F45] space-y-4">
                      
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#262F45] pb-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono text-gray-400">ID: {reg.registrationId}</span>
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              isConfirmed ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                            }`}>
                              {reg.status}
                            </span>
                          </div>
                          <h3 className="text-lg font-bold text-white mt-1">{t.name}</h3>
                          <div className="text-xs text-gray-400 mt-0.5">
                            Date: <strong>{t.date}</strong> • Start: <strong>{t.startTime}</strong> • Mode: <strong>SOLO</strong>
                          </div>
                          <div className="text-xs text-gray-300 mt-1 flex items-center gap-3">
                            <span>IGN: <strong className="text-white">{reg.freeFireName || user.freeFireName || 'Not Set'}</strong></span>
                            <span>•</span>
                            <span>UID: <strong className="text-[#FF9F1C] font-mono">{reg.freeFireUid || user.freeFireUid || 'Not Set'}</strong></span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {!t.roomReleased && (
                            <button
                              onClick={() => setSelectedRegToEdit({
                                id: reg.id,
                                registrationId: reg.registrationId,
                                freeFireName: reg.freeFireName || user.freeFireName,
                                freeFireUid: reg.freeFireUid || user.freeFireUid,
                                teamName: reg.team?.name,
                                isSolo: t.type === 'SOLO' || t.format === 'SOLO' || t.name?.toUpperCase().includes('SOLO'),
                                roomReleased: t.roomReleased,
                              })}
                              className="px-3.5 py-2 rounded-xl bg-[#0B0E14] border border-[#262F45] text-xs text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1.5"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>Edit Details</span>
                            </button>
                          )}

                          <Link
                            href={`/tournaments/${t.id}`}
                            className="px-4 py-2 rounded-xl bg-[#0B0E14] border border-[#262F45] text-xs text-gray-300 hover:text-white font-bold text-center"
                          >
                            View Tournament Page
                          </Link>
                        </div>
                      </div>

                      {/* Payment Status Bar */}
                      <div className="p-3 rounded-xl bg-[#0B0E14] border border-[#262F45] flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 text-gray-300">
                          <CreditCard className="w-4 h-4 text-[#FF9F1C]" />
                          <span>Payment Status: <strong className="text-white">{reg.paymentStatus}</strong></span>
                        </div>
                        {reg.payment && (
                          <div className="text-[11px] text-gray-400 font-mono">
                            TxRef: <strong className="text-[#FF9F1C]">{reg.payment.transactionId}</strong>
                          </div>
                        )}
                      </div>

                      {/* ROOM ID & PASSWORD BOX */}
                      {roomUnlocked ? (
                        <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/40 space-y-3">
                          <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
                            <Unlock className="w-4 h-4" />
                            <span>Match Room Details Unlocked</span>
                          </div>

                          <div className={`grid grid-cols-1 ${t.type === 'SOLO' ? 'sm:grid-cols-3' : 'sm:grid-cols-2'} gap-3`}>
                            <div className="p-3 rounded-lg bg-[#0B0E14] border border-[#262F45] flex items-center justify-between">
                              <div>
                                <span className="text-[10px] text-gray-400 uppercase block">Room ID</span>
                                <span className="font-mono text-base font-extrabold text-white">{t.roomId}</span>
                              </div>
                              <button
                                onClick={() => copyText(t.roomId, `room-${reg.id}`)}
                                className="p-2 rounded bg-[#121722] text-gray-300 hover:text-white"
                              >
                                {copiedId === `room-${reg.id}` ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                              </button>
                            </div>

                            <div className="p-3 rounded-lg bg-[#0B0E14] border border-[#262F45] flex items-center justify-between">
                              <div>
                                <span className="text-[10px] text-gray-400 uppercase block">Room Password</span>
                                <span className="font-mono text-base font-extrabold text-white">{t.roomPassword}</span>
                              </div>
                              <button
                                onClick={() => copyText(t.roomPassword, `pass-${reg.id}`)}
                                className="p-2 rounded bg-[#121722] text-gray-300 hover:text-white"
                              >
                                {copiedId === `pass-${reg.id}` ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                              </button>
                            </div>

                            {t.type === 'SOLO' && (
                              <div className="p-3 rounded-lg bg-[#0B0E14] border border-[#FF9F1C]/40 flex items-center justify-between shadow-[0_0_10px_rgba(255,159,28,0.1)]">
                                <div>
                                  <span className="text-[10px] text-[#FF9F1C] font-extrabold uppercase block">Slot Number</span>
                                  <span className="font-mono text-base font-black text-[#FF9F1C]">{reg.slotNumber || 1}</span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="p-3.5 rounded-xl bg-[#0B0E14] border border-[#262F45] flex items-center gap-3 text-xs text-gray-400">
                          <Lock className="w-4 h-4 text-[#FF2E4C] shrink-0" />
                          <span>
                            {isConfirmed
                              ? 'Room details will unlock here 15 minutes before start time once released by Admin.'
                              : 'Room details unlock exclusively for confirmed participants after payment verification.'}
                          </span>
                        </div>
                      )}

                    </div>
                  );
                })}
              </div>
            )}

          </div>
        )}

        {/* TAB 3: PROFILE SETTINGS */}
        {activeTab === 'profile' && (
          <div className="max-w-2xl bg-[#121722] border border-[#262F45] rounded-3xl p-8 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white">Player Profile & In-Game Credentials</h3>
                <p className="text-xs text-gray-400">Keep your Free Fire UID and In-Game Name updated for prize payouts.</p>
              </div>
              <button
                onClick={() => setEditingProfile(!editingProfile)}
                className="px-3.5 py-2 rounded-xl bg-[#0B0E14] border border-[#262F45] text-xs font-bold text-white flex items-center gap-1.5"
              >
                <Edit2 className="w-3.5 h-3.5 text-[#FF2E4C]" />
                <span>{editingProfile ? 'Cancel' : 'Edit Profile'}</span>
              </button>
            </div>

            {profileMsg && (
              <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-400 text-xs">
                {profileMsg}
              </div>
            )}

            <form onSubmit={handleProfileSave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1">Full Name</label>
                <input
                  type="text"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  disabled={!editingProfile}
                  className="w-full px-3 py-2.5 rounded-xl bg-[#0B0E14] border border-[#262F45] text-xs text-white disabled:opacity-60"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1">Free Fire UID</label>
                  <input
                    type="text"
                    value={profileUid}
                    onChange={(e) => setProfileUid(e.target.value)}
                    disabled={!editingProfile}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#0B0E14] border border-[#262F45] text-xs text-white font-mono disabled:opacity-60"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1">Free Fire In-Game Name (IGN)</label>
                  <input
                    type="text"
                    value={profileIgn}
                    onChange={(e) => setProfileIgn(e.target.value)}
                    disabled={!editingProfile}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#0B0E14] border border-[#262F45] text-xs text-white disabled:opacity-60"
                  />
                </div>
              </div>

              {editingProfile && (
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl glow-btn-red text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Changes</span>
                </button>
              )}
            </form>
          </div>
        )}

      </main>

      <EditRegistrationModal
        isOpen={Boolean(selectedRegToEdit)}
        onClose={() => setSelectedRegToEdit(null)}
        onSuccess={() => {
          setSelectedRegToEdit(null);
          fetchUserData();
        }}
        registration={selectedRegToEdit}
      />

      <Footer />
    </div>
  );
}
