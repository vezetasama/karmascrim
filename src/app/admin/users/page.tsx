'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Link from 'next/link';
import {
  Users,
  Search,
  Shield,
  ShieldAlert,
  UserCheck,
  UserX,
  ArrowLeft,
  X
} from 'lucide-react';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, [search]);

  const fetchUsers = async () => {
    try {
      const res = await fetch(`/api/admin/users?search=${encodeURIComponent(search)}`);
      const data = await res.json();
      if (data.users) {
        setUsers(data.users);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUser = async (userId: string, role?: string, status?: string) => {
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role, status }),
      });
      const data = await res.json();
      if (data.success) {
        setMsg('User account updated successfully.');
        fetchUsers();
      }
    } catch (e) {
      setMsg('Failed to update user.');
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
            <h1 className="text-2xl font-black uppercase text-white">User Accounts & Roles</h1>
            <p className="text-xs text-gray-400">View player credentials, suspend accounts, and assign admin privileges</p>
          </div>
        </div>

        {msg && (
          <div className="mb-6 p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-400 text-xs flex items-center justify-between">
            <span>{msg}</span>
            <button onClick={() => setMsg(null)}>
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Toolbar */}
        <div className="p-4 rounded-2xl bg-[#121722] border border-[#262F45] mb-6 flex justify-between items-center">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Search Name, Username, Email, FF UID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#0B0E14] border border-[#262F45] text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#FF2E4C]"
            />
          </div>
        </div>

        {/* Users Table */}
        <div className="p-6 rounded-3xl bg-[#121722] border border-[#262F45]">
          {loading ? (
            <div className="h-64 flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-[#FF2E4C] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Users className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-sm font-bold">No users match your query.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-gray-300">
                <thead className="bg-[#0B0E14] text-[#FF9F1C] uppercase text-[10px] font-bold border-b border-[#262F45]">
                  <tr>
                    <th className="p-3.5">User</th>
                    <th className="p-3.5">Free Fire Credentials</th>
                    <th className="p-3.5">Contact</th>
                    <th className="p-3.5">Activity</th>
                    <th className="p-3.5">Role</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#262F45]">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-[#1A2234]">
                      <td className="p-3.5">
                        <div className="font-bold text-white">{u.name}</div>
                        <div className="text-[10px] text-gray-400">@{u.username}</div>
                      </td>
                      <td className="p-3.5 font-mono">
                        <div className="text-[#FF9F1C] font-bold">UID: {u.freeFireUid || 'Not set'}</div>
                        <div className="text-[10px] text-gray-300">IGN: {u.freeFireName || 'Not set'}</div>
                      </td>
                      <td className="p-3.5">
                        <div>{u.email}</div>
                        <div className="text-[10px] text-gray-400">{u.phone || 'No phone'}</div>
                      </td>
                      <td className="p-3.5">
                        <div>{u._count?.registrations || 0} Registrations</div>
                        <div className="text-[10px] text-gray-400">{u._count?.teamsCaptained || 0} Squads</div>
                      </td>
                      <td className="p-3.5">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          u.role === 'ADMIN' ? 'bg-red-500/20 text-red-400 border border-red-500/40' : 'bg-gray-800 text-gray-300'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          u.status === 'ACTIVE' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-rose-950 text-rose-400 border border-rose-500/40'
                        }`}>
                          {u.status}
                        </span>
                      </td>
                      <td className="p-3.5 text-right space-x-1.5 whitespace-nowrap">
                        {/* Toggle Role */}
                        <button
                          onClick={() => handleUpdateUser(u.id, u.role === 'ADMIN' ? 'USER' : 'ADMIN')}
                          className="px-2.5 py-1 rounded-lg bg-[#0B0E14] border border-[#262F45] text-[11px] text-gray-300 hover:text-white"
                        >
                          {u.role === 'ADMIN' ? 'Make User' : 'Make Admin'}
                        </button>
                        {/* Toggle Status */}
                        <button
                          onClick={() => handleUpdateUser(u.id, undefined, u.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE')}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold ${
                            u.status === 'ACTIVE'
                              ? 'bg-rose-950 text-rose-400 border border-rose-500/40 hover:bg-rose-900/40'
                              : 'bg-emerald-950 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-900/40'
                          }`}
                        >
                          {u.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </main>

      <Footer />
    </div>
  );
}
