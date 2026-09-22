import React from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import {
  ShieldAlert,
  Trophy,
  Users,
  CreditCard,
  QrCode,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingUp,
  FileText,
  Image as ImageIcon,
  Wallet,
  Landmark,
  Bell,
  Award,
} from 'lucide-react';

export const revalidate = 0;

async function getAdminMetrics() {
  try {
    const totalUsers = await db.user.count();
    const totalTournaments = await db.tournament.count();
    const activeTournaments = await db.tournament.count({ where: { status: 'REGISTRATION_OPEN' } });
    const liveTournaments = await db.tournament.count({ where: { status: 'LIVE' } });
    const pendingPayments = await db.registration.count({ where: { status: 'PAYMENT_SUBMITTED' } });
    const confirmedRegistrations = await db.registration.count({ where: { status: 'CONFIRMED' } });
    const totalBanners = await db.banner.count();
    const pendingDeposits = await db.depositRequest.count({ where: { status: 'PENDING' } });
    const pendingWithdrawals = await db.withdrawalRequest.count({ where: { status: 'PENDING' } });
    
    // Sum of verified payments
    const verifiedPaymentsAgg = await db.payment.aggregate({
      where: { status: 'APPROVED' },
      _sum: { amount: true },
    });

    const recentRegistrations = await db.registration.findMany({
      include: {
        tournament: true,
        user: { select: { name: true, username: true, freeFireUid: true } },
        team: true,
        payment: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 8,
    });

    const pointTournaments = await db.tournament.findMany({
      orderBy: { createdAt: 'desc' },
      take: 6,
      include: {
        _count: {
          select: {
            registrations: {
              where: { status: 'CONFIRMED' }
            }
          }
        }
      }
    });

    return {
      metrics: {
        totalUsers,
        totalTournaments,
        activeTournaments,
        liveTournaments,
        pendingPayments,
        confirmedRegistrations,
        totalBanners,
        pendingDeposits,
        pendingWithdrawals,
        collectedFees: verifiedPaymentsAgg._sum.amount || 0,
      },
      recentRegistrations,
      pointTournaments,
    };
  } catch (error) {
    return {
      metrics: {
        totalUsers: 0,
        totalTournaments: 0,
        activeTournaments: 0,
        liveTournaments: 0,
        pendingPayments: 0,
        confirmedRegistrations: 0,
        totalBanners: 0,
        pendingDeposits: 0,
        pendingWithdrawals: 0,
        collectedFees: 0,
      },
      recentRegistrations: [],
      pointTournaments: [],
    };
  }
}

export default async function AdminOverviewPage() {
  const userSession = await getCurrentUser();
  if (!userSession || userSession.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  const { metrics, recentRegistrations, pointTournaments } = await getAdminMetrics();

  return (
    <main className="py-4 sm:py-8 max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 w-full">
        
        {/* Admin Header */}
        <div className="p-6 rounded-3xl bg-gradient-to-r from-red-950/40 via-[#121722] to-orange-950/20 border border-red-500/40 mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-red-600 to-orange-500 flex items-center justify-center text-white shadow-lg shadow-red-500/30">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black uppercase text-white">Admin Command Center</h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/40">
                  Full Authorization
                </span>
              </div>
              <p className="text-xs text-gray-400">Manage scrims, verify wallet deposits & payments, release room details, give points & publish leaderboards.</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin/results"
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-red-600 text-white text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-opacity flex items-center gap-1.5 shadow-md"
            >
              <Award className="w-4 h-4" /> Point Table & Rewards
            </Link>
            <Link
              href="/admin/deposits"
              className="px-4 py-2.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold uppercase tracking-wider hover:bg-amber-500/30 transition-colors"
            >
              Deposits ({metrics.pendingDeposits})
            </Link>
            <Link
              href="/admin/tournaments"
              className="px-4 py-2.5 rounded-xl bg-[#FF2E4C] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#D61F3B] transition-colors"
            >
              + Create Tournament
            </Link>
          </div>
        </div>

        {/* ADMIN NAV MODULES */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 mb-8">
          <Link
            href="/admin/results"
            className="p-3.5 rounded-2xl bg-[#121722] border border-amber-500/40 hover:border-amber-400 transition-all group relative bg-gradient-to-b from-amber-500/10 to-transparent"
          >
            <Award className="w-6 h-6 text-amber-400 mb-2 group-hover:scale-110 transition-transform" />
            <h4 className="text-xs font-bold text-white uppercase truncate">Points & Rewards</h4>
            <span className="text-[10px] text-amber-300 font-semibold">Give Points & Pay</span>
          </Link>

          <Link
            href="/admin/deposits"
            className="p-3.5 rounded-2xl bg-[#121722] border border-[#262F45] hover:border-[#FF9F1C] transition-all group relative"
          >
            {metrics.pendingDeposits > 0 && (
              <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded-full bg-[#FF9F1C] text-slate-950 font-extrabold text-[9px] animate-pulse">
                {metrics.pendingDeposits}
              </span>
            )}
            <Wallet className="w-6 h-6 text-[#FF9F1C] mb-2 group-hover:scale-110 transition-transform" />
            <h4 className="text-xs font-bold text-white uppercase truncate">Wallet Deposits</h4>
            <span className="text-[10px] text-gray-400">{metrics.pendingDeposits} Pending</span>
          </Link>

          <Link
            href="/admin/withdrawals"
            className="p-3.5 rounded-2xl bg-[#121722] border border-[#262F45] hover:border-amber-400 transition-all group relative"
          >
            {metrics.pendingWithdrawals > 0 && (
              <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded-full bg-amber-400 text-slate-950 font-extrabold text-[9px] animate-pulse">
                {metrics.pendingWithdrawals}
              </span>
            )}
            <Landmark className="w-6 h-6 text-amber-400 mb-2 group-hover:scale-110 transition-transform" />
            <h4 className="text-xs font-bold text-white uppercase truncate">Withdrawals</h4>
            <span className="text-[10px] text-gray-400">{metrics.pendingWithdrawals} Pending</span>
          </Link>

          <Link
            href="/admin/tournaments"
            className="p-3.5 rounded-2xl bg-[#121722] border border-[#262F45] hover:border-[#FF2E4C] transition-all group"
          >
            <Trophy className="w-6 h-6 text-[#FF2E4C] mb-2 group-hover:scale-110 transition-transform" />
            <h4 className="text-xs font-bold text-white uppercase truncate">Tournaments</h4>
            <span className="text-[10px] text-gray-400">{metrics.totalTournaments} Scrims</span>
          </Link>

          <Link
            href="/admin/registered-players"
            className="p-3.5 rounded-2xl bg-[#121722] border border-[#262F45] hover:border-[#FF2E4C] transition-all group"
          >
            <Users className="w-6 h-6 text-[#FF2E4C] mb-2 group-hover:scale-110 transition-transform" />
            <h4 className="text-xs font-bold text-white uppercase truncate">Registered Players</h4>
            <span className="text-[10px] text-gray-400">{metrics.confirmedRegistrations} Participants</span>
          </Link>

          <Link
            href="/admin/registrations"
            className="p-3.5 rounded-2xl bg-[#121722] border border-[#262F45] hover:border-[#FF9F1C] transition-all group relative"
          >
            {metrics.pendingPayments > 0 && (
              <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded-full bg-[#FF9F1C] text-slate-950 font-extrabold text-[9px] animate-pulse">
                {metrics.pendingPayments}
              </span>
            )}
            <CreditCard className="w-6 h-6 text-[#FF9F1C] mb-2 group-hover:scale-110 transition-transform" />
            <h4 className="text-xs font-bold text-white uppercase truncate">Registrations</h4>
            <span className="text-[10px] text-gray-400">{metrics.confirmedRegistrations} Confirmed</span>
          </Link>

          <Link
            href="/admin/notifications"
            className="p-3.5 rounded-2xl bg-[#121722] border border-[#262F45] hover:border-cyan-400 transition-all group"
          >
            <Bell className="w-6 h-6 text-cyan-400 mb-2 group-hover:scale-110 transition-transform" />
            <h4 className="text-xs font-bold text-white uppercase truncate">Notifications</h4>
            <span className="text-[10px] text-gray-400">Broadcast</span>
          </Link>

          <Link
            href="/admin/payment-methods"
            className="p-3.5 rounded-2xl bg-[#121722] border border-[#262F45] hover:border-emerald-400 transition-all group"
          >
            <QrCode className="w-6 h-6 text-emerald-400 mb-2 group-hover:scale-110 transition-transform" />
            <h4 className="text-xs font-bold text-white uppercase truncate">Payment Methods</h4>
            <span className="text-[10px] text-gray-400">QR & Accounts</span>
          </Link>

          <Link
            href="/admin/users"
            className="p-3.5 rounded-2xl bg-[#121722] border border-[#262F45] hover:border-amber-400 transition-all group"
          >
            <Users className="w-6 h-6 text-amber-400 mb-2 group-hover:scale-110 transition-transform" />
            <h4 className="text-xs font-bold text-white uppercase truncate">Users & Coins</h4>
            <span className="text-[10px] text-amber-300/90 font-semibold">{metrics.totalUsers} Players / Coins</span>
          </Link>
        </div>

        {/* METRICS STATS CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="p-5 rounded-2xl bg-[#121722] border border-[#262F45]">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Fees Collected</span>
            <div className="text-2xl font-extrabold text-[#FF9F1C] mt-1">
              🪙 {metrics.collectedFees.toLocaleString()}
            </div>
            <div className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1 font-semibold">
              <TrendingUp className="w-3.5 h-3.5" /> Verified Wallet Payments
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-[#121722] border border-[#262F45]">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Pending Payment Approvals</span>
            <div className="text-2xl font-extrabold text-white mt-1">
              {metrics.pendingPayments}
            </div>
            <div className="text-[11px] text-[#FF9F1C] mt-1 font-semibold">
              Requires Admin Review
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-[#121722] border border-[#262F45]">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Active Open Tournaments</span>
            <div className="text-2xl font-extrabold text-[#FF2E4C] mt-1">
              {metrics.activeTournaments}
            </div>
            <div className="text-[11px] text-gray-400 mt-1">
              {metrics.liveTournaments} currently Live
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-[#121722] border border-[#262F45]">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Confirmed Player Slots</span>
            <div className="text-2xl font-extrabold text-emerald-400 mt-1">
              {metrics.confirmedRegistrations}
            </div>
            <div className="text-[11px] text-gray-400 mt-1">
              Across all scrims
            </div>
          </div>
        </div>

        {/* POINT TABLE & WINNING REWARDS ENGINE CONTROL SECTION */}
        <div className="p-6 rounded-3xl bg-gradient-to-b from-[#121722] to-[#0D121F] border border-[#262F45] space-y-6 mb-8 shadow-xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#262F45] pb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-red-500 flex items-center justify-center text-white shadow-md shadow-amber-500/20">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-white uppercase tracking-wider">Point Table & Winning Rewards</h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-400 border border-amber-500/40 uppercase">
                    Admin Scoring Control
                  </span>
                </div>
                <p className="text-xs text-gray-400">Give points to teams/players, generate automatic leaderboard standings, and credit winning prize rewards to wallets.</p>
              </div>
            </div>

            <Link
              href="/admin/results"
              className="px-4 py-2 rounded-xl bg-[#FF2E4C] hover:bg-[#D61F3B] text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors shadow-lg"
            >
              <span>Manage All Points & Rewards</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {pointTournaments.length === 0 ? (
            <p className="text-xs text-gray-500 py-6 text-center">No active tournaments available for point scoring.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pointTournaments.map((t) => {
                const isSolo = t.type === 'SOLO';
                const confirmedCount = t._count?.registrations || 0;

                return (
                  <div key={t.id} className="p-4 rounded-2xl bg-[#0B0E14] border border-[#262F45] hover:border-amber-500/50 transition-all space-y-3 flex flex-col justify-between group">
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-black tracking-wider uppercase border ${
                          isSolo
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                            : 'bg-[#FF2E4C]/10 text-[#FF2E4C] border-[#FF2E4C]/30'
                        }`}>
                          {isSolo ? 'SOLO TOURNAMENT' : 'SQUAD TOURNAMENT'}
                        </span>

                        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
                          {confirmedCount} Registered
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-white group-hover:text-amber-400 transition-colors truncate" title={t.name}>{t.name}</h4>
                      <p className="text-[11px] text-gray-400 font-semibold mt-0.5">Category: {t.category}</p>

                      <div className="mt-2.5 p-2.5 rounded-xl bg-[#121722] border border-[#262F45]/60 text-[10px] text-gray-300 space-y-1">
                        {isSolo ? (
                          <div className="flex justify-between items-center">
                            <span className="text-gray-400 font-medium">Solo Rule:</span>
                            <span className="font-bold text-amber-300">
                              {t.soloScoringType === 'PER_KILL'
                                ? `Per Kill (🪙 ${t.soloKillReward || 0})`
                                : t.soloScoringType === 'SURVIVAL'
                                ? `Survival (Prize: 🪙 ${(t.entryFee || 0) * 2})`
                                : `Kill (🪙 ${t.soloKillReward || 0}) + Survival`}
                            </span>
                          </div>
                        ) : (
                          <div className="flex justify-between items-center">
                            <span className="text-gray-400 font-medium">Squad Rule:</span>
                            <span className="font-bold text-[#FF9F1C]">Placement Pts + {t.squadKillPoints || 1} Pts/Kill</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="pt-2 grid grid-cols-2 gap-2">
                      <Link
                        href={`/admin/results?tournamentId=${t.id}&tab=points`}
                        className="px-3 py-2 rounded-xl bg-[#121722] border border-[#262F45] hover:border-amber-400 text-amber-300 hover:text-white text-[11px] font-bold text-center flex items-center justify-center gap-1.5 transition-all"
                      >
                        <Trophy className="w-3.5 h-3.5 text-amber-400" />
                        <span>Give Points</span>
                      </Link>

                      <Link
                        href={`/admin/results?tournamentId=${t.id}&tab=payouts`}
                        className="px-3 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/40 hover:bg-emerald-500/25 text-emerald-400 text-[11px] font-bold text-center flex items-center justify-center gap-1.5 transition-all"
                      >
                        <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Pay Reward</span>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* RECENT REGISTRATION QUEUE */}
        <div className="p-6 rounded-3xl bg-[#121722] border border-[#262F45] space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white uppercase tracking-wider">Recent Registrations & Submissions</h3>
              <p className="text-xs text-gray-400">Review transaction references and verify player slots</p>
            </div>
            <Link
              href="/admin/registrations"
              className="text-xs text-[#FF2E4C] hover:underline font-bold uppercase tracking-wider flex items-center gap-1"
            >
              <span>Manage All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {recentRegistrations.length === 0 ? (
            <p className="text-xs text-gray-500 py-6 text-center">No registration records found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-gray-300">
                <thead className="bg-[#0B0E14] text-[#FF9F1C] uppercase text-[10px] font-bold border-b border-[#262F45]">
                  <tr>
                    <th className="p-3">Reg ID</th>
                    <th className="p-3">Tournament</th>
                    <th className="p-3">Squad / Captain</th>
                    <th className="p-3">Payment TxID</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#262F45]">
                  {recentRegistrations.map((reg) => (
                    <tr key={reg.id} className="hover:bg-[#1A2234]">
                      <td className="p-3 font-mono font-bold text-white">{reg.registrationId}</td>
                      <td className="p-3 font-semibold text-gray-200">{reg.tournament?.name}</td>
                      <td className="p-3">
                        <div className="font-bold text-white">{reg.team?.name || reg.user?.name}</div>
                        <div className="text-[10px] text-gray-400">Cap: @{reg.user?.username}</div>
                      </td>
                      <td className="p-3 font-mono text-[#FF9F1C]">
                        {reg.payment?.transactionId || 'Unsubmitted'}
                      </td>
                      <td className="p-3">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          reg.status === 'CONFIRMED'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                            : reg.status === 'PAYMENT_SUBMITTED'
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                            : 'bg-gray-800 text-gray-400'
                        }`}>
                          {reg.status}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <Link
                          href="/admin/registrations"
                          className="px-3 py-1 rounded-lg bg-[#0B0E14] border border-[#262F45] text-[11px] font-bold text-white hover:border-[#FF2E4C]"
                        >
                          Review
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </main>
  );
}

