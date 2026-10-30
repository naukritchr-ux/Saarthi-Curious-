import React, { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import { API_BASE } from "../../config/api";

const API_BASE_URL =
  import.meta.env?.VITE_API_URL ||
  API_BASE ||
  (import.meta.env?.DEV ? "http://127.0.0.1:8000" : "https://saarthi-curious-00e8.onrender.com");

function getRoleBadgeStyle(role) {
  const r = String(role || "").toLowerCase();
  if (r.includes("master")) {
    return "bg-rose-500/15 text-rose-300 border-rose-500/35";
  }
  if (r.includes("partner")) {
    return "bg-cyan-500/15 text-cyan-300 border-cyan-500/35";
  }
  if (r.includes("leader")) {
    return "bg-emerald-500/15 text-emerald-300 border-emerald-500/35";
  }
  if (r.includes("developer")) {
    return "bg-amber-500/15 text-amber-300 border-amber-500/35";
  }
  if (r.includes("employee")) {
    return "bg-sky-500/15 text-sky-300 border-sky-500/35";
  }
  return "bg-indigo-500/15 text-indigo-300 border-indigo-500/35";
}

// ============================================================================
// 1. PERSISTENT ADMIN STREAK & CRYO-FREEZE CONTROL MODAL
// ============================================================================
function AdminManageStreakModal({ user, onClose, onSaveUser, saving }) {
  const [currentStreak, setCurrentStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const [learningDays, setLearningDays] = useState(0);
  const [freezes, setFreezes] = useState(0);

  useEffect(() => {
    if (!user) return;
    setCurrentStreak(Number(user.current_streak || 0));
    setLongestStreak(Number(user.longest_streak || 0));
    setLearningDays(Number(user.learning_days || 0));
    setFreezes(Number(user.freezes || 0));
  }, [user]);

  if (!user) return null;

  const handleAdjustCurrent = (delta) => {
    const next = Math.max(0, currentStreak + delta);
    setCurrentStreak(next);
    if (next > longestStreak) setLongestStreak(next);
    if (delta > 0 && next > learningDays) setLearningDays(next);
  };

  const handleSave = () => {
    onSaveUser({
      ...user,
      current_streak: currentStreak,
      longest_streak: Math.max(longestStreak, currentStreak),
      learning_days: Math.max(learningDays, currentStreak),
      freezes,
      last_active:
        currentStreak > 0 && (!user.last_active || user.last_active === "Never")
          ? new Date().toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })
          : user.last_active,
    });
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-[#0A1020] border border-cyan-500/35 rounded-3xl shadow-[0_0_80px_rgba(6,182,212,0.28)] overflow-hidden text-slate-100"
      >
        <div className="px-6 py-5 bg-gradient-to-r from-[#0C1D36] to-[#081224] border-b border-cyan-500/20 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 text-slate-950 font-black text-sm flex items-center justify-center">
              {(user.name || "U").slice(0, 1).toUpperCase()}
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white">
                Manage Streak & Cryo-Shields
              </h3>
              <p className="text-xs text-cyan-200/80">
                {user.name} • {user.role}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded-xl bg-white/10 hover:bg-rose-500/20 hover:text-rose-300 text-xs font-bold transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Current Streak */}
          <div className="p-4 rounded-2xl bg-[#050914] border border-white/10 flex items-center justify-between">
            <div>
              <span className="text-xs font-extrabold text-white flex items-center gap-1.5">
                🔥 Current Streak
              </span>
              <span className="text-[11px] text-slate-400">
                Active consecutive learning days
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleAdjustCurrent(-1)}
                className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 font-extrabold text-white cursor-pointer"
              >
                -
              </button>
              <span className="w-16 text-center text-base font-black text-orange-400">
                {currentStreak}d
              </span>
              <button
                onClick={() => handleAdjustCurrent(1)}
                className="w-8 h-8 rounded-xl bg-orange-500/20 hover:bg-orange-500/35 border border-orange-400/40 font-extrabold text-orange-300 cursor-pointer"
              >
                +
              </button>
            </div>
          </div>

          {/* Streak Freezes */}
          <div className="p-4 rounded-2xl bg-[#050914] border border-white/10 flex items-center justify-between">
            <div>
              <span className="text-xs font-extrabold text-white flex items-center gap-1.5">
                ❄️ Streak Freezes
              </span>
              <span className="text-[11px] text-slate-400">
                Cryo-protection shields equipped
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setFreezes(Math.max(0, freezes - 1))}
                className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 font-extrabold text-white cursor-pointer"
              >
                -
              </button>
              <span className="w-16 text-center text-base font-black text-cyan-300">
                {freezes}
              </span>
              <button
                onClick={() => setFreezes(freezes + 1)}
                className="w-8 h-8 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/35 border border-cyan-400/40 font-extrabold text-cyan-300 cursor-pointer"
              >
                +
              </button>
            </div>
          </div>

          {/* Longest Streak & Total Learning Days */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 rounded-2xl bg-[#050914] border border-white/10">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">
                🏆 Longest Streak
              </span>
              <span className="text-lg font-extrabold text-amber-300 mt-1 block">
                {longestStreak} Days
              </span>
            </div>
            <div className="p-3.5 rounded-2xl bg-[#050914] border border-white/10">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">
                📅 Learning Days
              </span>
              <span className="text-lg font-extrabold text-emerald-400 mt-1 block">
                {learningDays} Days
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-white/10">
            <button
              onClick={() => setCurrentStreak(0)}
              className="px-3.5 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-xs font-extrabold text-rose-300 transition cursor-pointer"
            >
              Reset Current Streak
            </button>

            <div className="flex items-center gap-2.5">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-slate-300 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-400 via-sky-500 to-blue-600 hover:opacity-95 text-xs font-extrabold text-slate-950 shadow-[0_0_20px_rgba(56,189,248,0.45)] transition cursor-pointer disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save to Supabase"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 2. MAIN COMPONENT: StreakManagement.jsx
//    Distinct Midnight Cyber-Sapphire & Cryo-Flame Bento Architecture
// ============================================================================
export default function StreakManagement({ backendData = null }) {
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(!backendData);
  const [syncing, setSyncing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lastSynced, setLastSynced] = useState(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all"); // 'all' | 'active' | 'freezes' | 'dormant'
  const [managedUser, setManagedUser] = useState(null);

  const fetchRealtimeStreaks = useCallback(async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    setSyncing(true);

    const endpoints = [
      `${API_BASE_URL}/analytics/streaks`,
      `${API_BASE_URL}/admin/streak-management`,
      `${API_BASE_URL}/streaks`,
      `${API_BASE_URL}/api/streaks`,
      `${API_BASE_URL}/analytics/candidate-attrition`,
    ];

    for (const url of endpoints) {
      try {
        const res = await axios.get(url, { params: { _t: Date.now() } });
        const list =
          res.data?.users ||
          res.data?.streaks ||
          res.data?.candidates ||
          (Array.isArray(res.data) ? res.data : null);

        if (Array.isArray(list)) {
          const normalized = list.map((u, idx) => {
            const comp = Number(u.completion_pct ?? u.completed_percentage ?? 0);
            const curr = Number(
              u.current_streak ?? u.streak_days ?? (comp >= 100 ? 1 : 0)
            );
            const longest = Number(
              u.longest_streak ?? Math.max(curr, comp >= 100 ? 1 : 0)
            );
            const lDays = Number(
              u.learning_days ?? u.total_learning_days ?? (curr > 0 ? curr : 0)
            );
            const frz = Number(u.freezes ?? u.streak_freezes ?? 0);
            const lastAct =
              u.last_active ||
              u.last_activity_date ||
              (curr > 0 ? "21 Oct 2026" : "Never");

            return {
              id: u.id ?? idx,
              name: u.name || u.full_name || `User #${u.id ?? idx + 1}`,
              email: u.email || "",
              role: u.role || u.role_type || "Franchise Partner",
              current_streak: curr,
              longest_streak: longest,
              learning_days: lDays,
              freezes: frz,
              last_active: lastAct,
            };
          });

          setUsersList(normalized);
          setLastSynced(new Date().toLocaleTimeString());
          setLoading(false);
          setSyncing(false);
          return;
        }
      } catch {
        // Try next endpoint
      }
    }
    setLoading(false);
    setSyncing(false);
  }, []);

  useEffect(() => {
    if (backendData?.users) {
      setUsersList(backendData.users);
      setLoading(false);
      return;
    }
    fetchRealtimeStreaks(false);

    const onFocus = () => fetchRealtimeStreaks(true);
    const onVisibility = () => {
      if (document.visibilityState === "visible") fetchRealtimeStreaks(true);
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);
    const timer = setInterval(() => fetchRealtimeStreaks(true), 15000);

    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
      clearInterval(timer);
    };
  }, [backendData, fetchRealtimeStreaks]);

  const distinctRoles = useMemo(() => {
    const s = new Set(usersList.map((u) => u.role).filter(Boolean));
    return Array.from(s);
  }, [usersList]);

  const kpis = useMemo(() => {
    const total = usersList.length;
    const active = usersList.filter((u) => Number(u.current_streak || 0) > 0)
      .length;
    const longest = usersList.reduce(
      (max, u) => Math.max(max, Number(u.longest_streak || 0)),
      0
    );
    const freezes = usersList.reduce(
      (sum, u) => sum + Number(u.freezes || 0),
      0
    );
    const activeNamedUser =
      usersList.find((u) => Number(u.current_streak || 0) > 0)?.name ||
      "Pacesetter";

    return {
      total_users: total,
      active_streaks: active,
      longest_streak: longest,
      total_freezes: freezes,
      active_rate: Math.round((active / Math.max(1, total)) * 100),
      pacesetter: activeNamedUser,
    };
  }, [usersList]);

  // Role Breakdown Distribution for the Right-Side Telemetry Pod
  const roleDistribution = useMemo(() => {
    const counts = {};
    usersList.forEach((u) => {
      const r = u.role || "Member";
      counts[r] = (counts[r] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([role, count]) => ({
        role,
        count,
        pct: Math.round((count / Math.max(1, usersList.length)) * 100),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 4);
  }, [usersList]);

  const filteredUsers = useMemo(() => {
    return usersList.filter((u) => {
      if (roleFilter !== "all" && u.role !== roleFilter) return false;
      if (statusFilter === "active" && Number(u.current_streak || 0) === 0)
        return false;
      if (statusFilter === "freezes" && Number(u.freezes || 0) === 0)
        return false;
      if (statusFilter === "dormant" && u.last_active !== "Never") return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = String(u.name || "").toLowerCase().includes(q);
        const matchEmail = String(u.email || "").toLowerCase().includes(q);
        if (!matchName && !matchEmail) return false;
      }
      return true;
    });
  }, [usersList, roleFilter, statusFilter, searchQuery]);

  const handleSaveManagedUser = async (updated) => {
    setSaving(true);
    try {
      await axios.put(`${API_BASE_URL}/analytics/streaks/${updated.id}`, {
        current_streak: updated.current_streak,
        longest_streak: updated.longest_streak,
        learning_days: updated.learning_days,
        freezes: updated.freezes,
      });
      await fetchRealtimeStreaks(true);
    } catch {
      // Fallback: try admin endpoint or update locally
      try {
        await axios.put(`${API_BASE_URL}/admin/streak-management/${updated.id}`, {
          current_streak: updated.current_streak,
          longest_streak: updated.longest_streak,
          learning_days: updated.learning_days,
          freezes: updated.freezes,
        });
        await fetchRealtimeStreaks(true);
      } catch {
        setUsersList((prev) =>
          prev.map((u) =>
            (u.id ?? u.name) === (updated.id ?? updated.name) ? updated : u
          )
        );
      }
    } finally {
      setSaving(false);
      setManagedUser(null);
    }
  };

  return (
    <div className="h-screen w-full bg-[#040711] text-slate-100 font-sans selection:bg-cyan-400 selection:text-slate-950 overflow-y-auto overflow-x-hidden scroll-smooth streak-mgmt-scroll-container">
      <style>{`
        .streak-mgmt-scroll-container {
          scrollbar-width: thin;
          scrollbar-color: rgba(6, 182, 212, 0.45) #040711;
        }
        .streak-mgmt-scroll-container::-webkit-scrollbar {
          width: 8px;
        }
        .streak-mgmt-scroll-container::-webkit-scrollbar-track {
          background: #040711;
        }
        .streak-mgmt-scroll-container::-webkit-scrollbar-thumb {
          background: rgba(6, 182, 212, 0.35);
          border-radius: 9999px;
        }
        .streak-mgmt-scroll-container::-webkit-scrollbar-thumb:hover {
          background: rgba(6, 182, 212, 0.7);
        }
      `}</style>
      <div className="w-full p-5 md:p-6 pb-28 space-y-6">
      {/* ===================================================================
          1. CYBER-SAPPHIRE & CRYO-FLAME COMMAND HEADER
      =================================================================== */}
      <header className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#071329] via-[#0B1D3A] to-[#111633] p-6 md:p-8 border border-cyan-400/25 shadow-[0_0_50px_-10px_rgba(6,182,212,0.25)] flex flex-wrap items-center justify-between gap-4">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/80 to-transparent" />
        <div className="pointer-events-none absolute -right-12 -top-12 w-72 h-72 bg-cyan-400/15 rounded-full blur-3xl" />
        <div className="pointer-events-none absolute left-1/4 -bottom-16 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl" />

        <div className="relative z-10">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="text-[10px] font-extrabold uppercase tracking-[0.25em] text-cyan-300">
              ADMIN PANEL • HABIT & CRYO TELEMETRY
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/15 text-emerald-300 border border-emerald-400/30 flex items-center gap-1.5">
              <span
                className={`w-1.5 h-1.5 rounded-full bg-emerald-400 ${
                  syncing ? "animate-ping" : ""
                }`}
              />
              {lastSynced ? `Live Synced ${lastSynced}` : "Realtime Connected"}
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white mt-1.5 tracking-tight">
            Streak Management
          </h1>
          <p className="text-xs md:text-sm text-cyan-100/75 mt-1">
            Monitor and manage learning streaks, active habit loops, and Cryo-Freeze shields across all users.
          </p>
        </div>

        <button
          onClick={() => fetchRealtimeStreaks(false)}
          className="relative z-10 px-4 py-2.5 rounded-xl bg-[#050B16]/80 hover:bg-cyan-500/20 backdrop-blur-md border border-cyan-400/35 text-xs font-extrabold text-cyan-200 transition flex items-center gap-2 shadow-[0_0_20px_-5px_rgba(6,182,212,0.3)] cursor-pointer"
        >
          <span className={syncing ? "animate-spin" : ""}>↻</span>
          <span>{syncing ? "Syncing..." : "Refresh"}</span>
        </button>
      </header>

      {/* ===================================================================
          2. ASYMMETRIC BENTO DECK (Distinct from Leaderboards!)
             Left 8 Cols: 2x2 Interactive KPI Matrix
             Right 4 Cols: Cohort Role & Habit Pulse Breakdown Pod
      =================================================================== */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* LEFT 8 COLS: 2x2 KPI MATRIX */}
        <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            {
              id: "all",
              label: "Total Users",
              value: kpis.total_users,
              sub: "Synced Organization Roster",
              icon: "👥",
              accent: "text-white",
              barColor: "bg-indigo-400",
              barPct: 100,
              borderCls: "border-indigo-500/25 hover:border-indigo-400/60",
            },
            {
              id: "active",
              label: "Active Streaks",
              value: kpis.active_streaks,
              sub: `Pacesetter: ${kpis.pacesetter}`,
              icon: "🔥",
              accent: "text-orange-400",
              barColor: "bg-gradient-to-r from-orange-500 to-amber-300",
              barPct: Math.max(8, kpis.active_rate),
              borderCls: "border-orange-500/30 hover:border-orange-400/70",
            },
            {
              id: "longest",
              label: "Longest Streak",
              value: `${kpis.longest_streak} Days`,
              sub: "All-Time Cohort Record",
              icon: "🏆",
              accent: "text-amber-300",
              barColor: "bg-amber-400",
              barPct: Math.min(100, Math.max(12, kpis.longest_streak * 20)),
              borderCls: "border-amber-500/25 hover:border-amber-400/60",
            },
            {
              id: "freezes",
              label: "Total Freezes",
              value: kpis.total_freezes,
              sub: "Cryo-Protection Shields",
              icon: "❄️",
              accent: "text-cyan-300",
              barColor: "bg-cyan-400",
              barPct: Math.min(100, Math.max(8, kpis.total_freezes * 15)),
              borderCls: "border-cyan-500/30 hover:border-cyan-400/70",
            },
          ].map((card) => {
            const isSelected = statusFilter === card.id && card.id !== "all";
            return (
              <div
                key={card.id}
                onClick={() => {
                  if (card.id !== "longest") {
                    setStatusFilter(statusFilter === card.id ? "all" : card.id);
                  }
                }}
                className={`cursor-pointer bg-[#0A1020] rounded-2xl p-5 border ${
                  card.borderCls
                } ${
                  isSelected ? "ring-2 ring-cyan-400 bg-cyan-950/20" : ""
                } shadow-[0_10px_30px_rgba(0,0,0,0.5)] transition-all flex flex-col justify-between`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                      {card.label}
                    </span>
                    <span
                      className={`text-3xl font-black mt-1.5 block ${card.accent}`}
                    >
                      {card.value}
                    </span>
                  </div>
                  <div className="w-11 h-11 rounded-2xl bg-[#050914] border border-white/10 flex items-center justify-center text-xl">
                    {card.icon}
                  </div>
                </div>

                <div className="mt-4 space-y-1.5">
                  <div className="w-full h-1.5 rounded-full bg-[#050914] overflow-hidden">
                    <div
                      className={`h-full rounded-full ${card.barColor}`}
                      style={{ width: `${card.barPct}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>{card.sub}</span>
                    {card.id !== "longest" && (
                      <span className="text-cyan-300 font-bold">
                        {isSelected ? "✓ Filtered" : "Filter ➔"}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* RIGHT 4 COLS: COHORT ROLE & HABIT PULSE BREAKDOWN POD */}
        <div className="lg:col-span-4 bg-gradient-to-b from-[#0D162C] to-[#080D1A] rounded-2xl p-5 border border-cyan-500/25 shadow-[0_10px_30px_rgba(0,0,0,0.5)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-cyan-300 bg-cyan-500/15 border border-cyan-400/30 px-2.5 py-0.5 rounded-full">
                ⚡ Cohort Role Distribution
              </span>
              <span className="text-xs font-bold text-slate-400">
                {usersList.length} Users
              </span>
            </div>
            <h3 className="text-sm font-extrabold text-white mt-2">
              Streak Participation by Role
            </h3>
          </div>

          <div className="space-y-3 my-3">
            {roleDistribution.map((r, i) => (
              <div key={i} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-200">{r.role}</span>
                  <span className="font-extrabold text-cyan-300">
                    {r.count} ({r.pct}%)
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-[#050914] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500"
                    style={{ width: `${Math.max(8, r.pct)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2.5 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
            <span>Active Habit Rate:</span>
            <span className="font-extrabold text-orange-400">
              🔥 {kpis.active_streaks} of {kpis.total_users} Active ({kpis.active_rate}%)
            </span>
          </div>
        </div>
      </section>

      {/* ===================================================================
          3. INTEGRATED COMMAND FILTER RIBBON
      =================================================================== */}
      <section className="bg-[#0A1020] rounded-2xl p-4 border border-white/10 grid grid-cols-1 md:grid-cols-12 gap-3.5 items-center">
        <div className="md:col-span-6 relative">
          <span className="absolute left-4 top-2.5 text-xs text-slate-400">
            🔍
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full bg-[#050914] border border-white/10 focus:border-cyan-400 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 outline-none transition"
          />
        </div>

        <div className="md:col-span-3">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full bg-[#050914] border border-white/10 focus:border-cyan-400 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-200 outline-none"
          >
            <option value="all">All Roles ({usersList.length})</option>
            {distinctRoles.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-3 flex items-center justify-end gap-1.5">
          {[
            { id: "all", label: "All" },
            { id: "active", label: "🔥 Active" },
            { id: "freezes", label: "❄️ Shielded" },
            { id: "dormant", label: "💤 Never" },
          ].map((pill) => (
            <button
              key={pill.id}
              onClick={() => setStatusFilter(pill.id)}
              className={`px-2.5 py-1.5 rounded-xl text-[11px] font-extrabold transition cursor-pointer ${
                statusFilter === pill.id
                  ? "bg-gradient-to-r from-cyan-400 to-blue-600 text-slate-950 shadow-[0_0_14px_rgba(56,189,248,0.4)]"
                  : "bg-[#050914] text-slate-400 hover:text-white border border-white/10"
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>
      </section>

      {/* ===================================================================
          4. 8-COLUMN USER STREAKS TABLE WITH 7-DAY PULSE DOTS
      =================================================================== */}
      <section className="bg-[#0A1020] rounded-3xl p-6 border border-white/10 shadow-[0_10px_35px_rgba(0,0,0,0.55)] space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-base">
              🎖️
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white">
                User Streaks
              </h2>
              <p className="text-xs text-slate-400">
                Showing {filteredUsers.length} of {usersList.length} users
              </p>
            </div>
          </div>

          <span className="text-xs font-bold text-cyan-300">
            Click "Manage" on any user row to adjust streaks or grant Cryo-Freezes
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                <th className="py-3.5 px-4">USER</th>
                <th className="py-3.5 px-4">ROLE</th>
                <th className="py-3.5 px-4">CURRENT STREAK</th>
                <th className="py-3.5 px-4">LONGEST STREAK</th>
                <th className="py-3.5 px-4">LEARNING DAYS</th>
                <th className="py-3.5 px-4">FREEZES</th>
                <th className="py-3.5 px-4">LAST ACTIVE</th>
                <th className="py-3.5 px-4 text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-xs">
              {filteredUsers.map((u) => {
                const curr = Number(u.current_streak || 0);
                const isActive = curr > 0;

                return (
                  <tr
                    key={u.id ?? u.name}
                    className={`transition ${
                      isActive
                        ? "bg-gradient-to-r from-orange-500/10 via-cyan-500/5 to-transparent hover:bg-orange-500/15"
                        : "hover:bg-white/[0.03]"
                    }`}
                  >
                    {/* 1. USER */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-xl font-extrabold text-xs flex items-center justify-center shrink-0 ${
                            isActive
                              ? "bg-gradient-to-br from-orange-400 to-rose-500 text-slate-950 shadow-[0_0_12px_rgba(249,115,22,0.45)]"
                              : "bg-[#050914] text-cyan-300 border border-cyan-500/25"
                          }`}
                        >
                          {(u.name || "U").slice(0, 1).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <span className="font-extrabold text-white block truncate">
                            {u.name}
                          </span>
                          <span className="text-[11px] text-slate-500 block truncate">
                            {u.email}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* 2. ROLE */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold border whitespace-nowrap ${getRoleBadgeStyle(
                          u.role
                        )}`}
                      >
                        {u.role}
                      </span>
                    </td>

                    {/* 3. CURRENT STREAK + 7-DAY MINI RHYTHM DOTS */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`font-extrabold ${
                            isActive ? "text-orange-400" : "text-slate-400"
                          }`}
                        >
                          🔥 {curr} days
                        </span>
                        <div className="hidden xl:flex items-center gap-1">
                          {[0, 1, 2, 3, 4, 5, 6].map((d) => (
                            <span
                              key={d}
                              className={`w-1.5 h-1.5 rounded-full ${
                                d < curr
                                  ? "bg-orange-400 shadow-[0_0_6px_#FB923C]"
                                  : "bg-white/10"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    </td>

                    {/* 4. LONGEST STREAK */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`font-extrabold ${
                          Number(u.longest_streak || 0) > 0
                            ? "text-amber-300"
                            : "text-slate-400"
                        }`}
                      >
                        🏆 {u.longest_streak || 0} days
                      </span>
                    </td>

                    {/* 5. LEARNING DAYS */}
                    <td className="py-3.5 px-4 font-extrabold text-slate-200">
                      {u.learning_days || 0}
                    </td>

                    {/* 6. FREEZES */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`font-extrabold ${
                          Number(u.freezes || 0) > 0
                            ? "text-cyan-300"
                            : "text-slate-400"
                        }`}
                      >
                        ❄️ {u.freezes || 0}
                      </span>
                    </td>

                    {/* 7. LAST ACTIVE */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold ${
                          u.last_active && u.last_active !== "Never"
                            ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                            : "text-slate-500"
                        }`}
                      >
                        {u.last_active || "Never"}
                      </span>
                    </td>

                    {/* 8. ACTION */}
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setManagedUser(u)}
                        className="px-3.5 py-1.5 rounded-xl bg-[#050914] hover:bg-gradient-to-r hover:from-cyan-400 hover:to-blue-600 text-slate-200 hover:text-slate-950 border border-cyan-500/30 text-xs font-extrabold transition shadow-sm cursor-pointer"
                      >
                        Manage
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
      </div>

      <AdminManageStreakModal
        user={managedUser}
        onClose={() => setManagedUser(null)}
        onSaveUser={handleSaveManagedUser}
        saving={saving}
      />
    </div>
  );
}
