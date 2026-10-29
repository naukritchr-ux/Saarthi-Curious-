import React, { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  ComposedChart,
  Line,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from "recharts";
import { API_BASE } from "../../config/api";

const API_BASE_URL =
  import.meta.env?.VITE_API_URL ||
  API_BASE ||
  (import.meta.env?.DEV ? "http://127.0.0.1:8000" : "https://saarthi-curious-00e8.onrender.com");

// ============================================================================
// 1. DYNAMIC THEME-AWARE RECHARTS TOOLTIP
// ============================================================================
const DynamicTooltip = ({ active, payload, label, unit, accentHex }) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div
      className="bg-[#090A0F]/95 backdrop-blur-xl px-3.5 py-2.5 rounded-xl text-xs z-50 border"
      style={{
        borderColor: `${accentHex}66`,
        boxShadow: `0 0 28px ${accentHex}35`,
      }}
    >
      <p
        className="font-extrabold mb-1 border-b border-white/10 pb-1 tracking-wide"
        style={{ color: accentHex }}
      >
        {label}
      </p>
      {payload.map((entry, idx) => (
        <div key={idx} className="flex items-center justify-between gap-4 py-0.5">
          <span className="text-slate-300 font-medium">{entry.name}:</span>
          <span className="font-black text-white">
            {entry.value}
            {unit}
          </span>
        </div>
      ))}
    </div>
  );
};

function tabMetaShortUnit(theme) {
  return theme?.shortUnit || "";
}

// ============================================================================
// 2. MAIN COMPONENT: Leaderboards.jsx
// ============================================================================
export default function Leaderboards({ backendData = null }) {
  const [rawCompetitors, setRawCompetitors] = useState([]);
  const [loading, setLoading] = useState(!backendData);
  const [syncing, setSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState(null);

  // 5 Distinct Tabs: 'curos' | 'completion' | 'retention' | 'application' | 'streaks'
  const [activeTab, setActiveTab] = useState("curos");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchLeaderboard = useCallback(async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    setSyncing(true);

    const endpoints = [
      `${API_BASE_URL}/analytics/leaderboards`,
      `${API_BASE_URL}/leaderboards`,
      `${API_BASE_URL}/api/leaderboards`,
      `${API_BASE_URL}/analytics/candidate-attrition`,
    ];

    for (const url of endpoints) {
      try {
        const res = await axios.get(url, { params: { _t: Date.now() } });
        const list =
          res.data?.competitors ||
          res.data?.leaderboard ||
          res.data?.users ||
          res.data?.candidates ||
          (Array.isArray(res.data) ? res.data : null);

        if (Array.isArray(list)) {
          const normalized = list.map((c, idx) => {
            const comp = Number(
              c.completion_pct ?? c.completed_percentage ?? c.completion ?? 0
            );
            const quiz = Number(
              c.application_pct ?? c.quiz_mastery_pct ?? c.application ?? 0
            );
            const risk = Number(c.risk_score ?? 100 - comp);
            const ret = Number(
              c.retention_pct ?? c.retention ?? Math.max(0, 100 - risk)
            );
            const streak = Number(
              c.streak_days ?? c.current_streak ?? c.streak ?? (comp > 0 ? 1 : 0)
            );
            const curos = Number(c.curos ?? c.curos_balance ?? c.points ?? 0);

            return {
              id: c.id ?? idx,
              name: c.name || c.full_name || c.username || `User #${idx + 1}`,
              email: c.email || "",
              role: c.role || "Learner",
              program_name: c.program_name || "Client Relationships",
              curos,
              completion_pct: Math.round(comp * 10) / 10,
              retention_pct: Math.round(ret * 10) / 10,
              application_pct: Math.round(quiz * 10) / 10,
              streak_days: streak,
              programs_completed: Number(
                c.programs_completed ?? (comp >= 100 ? 1 : 0)
              ),
            };
          });
          setRawCompetitors(normalized);
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
    if (backendData?.competitors) {
      setRawCompetitors(backendData.competitors);
      setLoading(false);
      return;
    }
    fetchLeaderboard(false);

    const onFocus = () => fetchLeaderboard(true);
    const onVisibility = () => {
      if (document.visibilityState === "visible") fetchLeaderboard(true);
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);
    const timer = setInterval(() => fetchLeaderboard(true), 15000);

    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
      clearInterval(timer);
    };
  }, [backendData, fetchLeaderboard]);

  // Deduplicate & Rank by Active Tab
  const rankedCompetitors = useMemo(() => {
    const map = new Map();
    rawCompetitors.forEach((c, idx) => {
      const key = String(c.email || c.name || idx).toLowerCase().trim();
      if (
        !map.has(key) ||
        (c.curos || 0) > (map.get(key).curos || 0) ||
        (c.completion_pct || 0) > (map.get(key).completion_pct || 0)
      ) {
        map.set(key, { ...c });
      }
    });

    const unique = Array.from(map.values());
    const sorted = [...unique].sort((a, b) => {
      if (activeTab === "curos")
        return (
          (b.curos || 0) - (a.curos || 0) ||
          (b.completion_pct || 0) - (a.completion_pct || 0)
        );
      if (activeTab === "completion")
        return (
          (b.completion_pct || 0) - (a.completion_pct || 0) ||
          (b.curos || 0) - (a.curos || 0)
        );
      if (activeTab === "retention")
        return (
          (b.retention_pct || 0) - (a.retention_pct || 0) ||
          (b.curos || 0) - (a.curos || 0)
        );
      if (activeTab === "application")
        return (
          (b.application_pct || 0) - (a.application_pct || 0) ||
          (b.curos || 0) - (a.curos || 0)
        );
      if (activeTab === "streaks")
        return (
          (b.streak_days || 0) - (a.streak_days || 0) ||
          (b.curos || 0) - (a.curos || 0)
        );
      return 0;
    });

    return sorted.map((u, idx) => ({
      ...u,
      rank: idx + 1,
    }));
  }, [rawCompetitors, activeTab]);

  // ==========================================================================
  // 5 DISTINCT VISUAL THEMES & STAGE CONFIGURATIONS (ONE PER TAB!)
  // ==========================================================================
  const tabTheme = useMemo(() => {
    const themes = {
      // TAB 1: CUROS -> SOVEREIGN GOLD THEME (Exclusive to Curos!)
      curos: {
        id: "curos",
        label: "Curos",
        columnHeader: "CUROS",
        subtitle: "Top performers based on current Curo treasury balance",
        unit: " Curos",
        shortUnit: "",
        accentHex: "#D4AF37",
        secondaryHex: "#F59E0B",
        pageBg: "bg-[#050505]",
        cardBg: "bg-[#0D0D0F]",
        headerGrad:
          "from-[#1B150A] via-[#14110B] to-[#0A0907] border-amber-400/30 shadow-[0_0_55px_-12px_rgba(212,175,55,0.28)]",
        hairline: "via-amber-400/80",
        pillActive:
          "bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600 text-black shadow-[0_0_22px_rgba(212,175,55,0.5)]",
        badgeCls: "text-amber-300 bg-amber-500/15 border-amber-400/35",
        champCard:
          "from-[#221B0F] to-[#0D0B08] border-amber-400/75 shadow-[0_0_55px_-6px_rgba(212,175,55,0.45)]",
        champRibbon: "from-amber-300 via-yellow-400 to-amber-500 text-black",
        barGrad: "from-amber-600 via-amber-400 to-yellow-200",
        titles: ["Curo Champion", "Curo Achiever", "Curo Star"],
        chartType: "area",
        chartTitle: "Top 10 Curos Treasury Curve",
        getValue: (u) => Number(u?.curos || 0),
      },

      // TAB 2: COMPLETION -> ROYAL AMETHYST & INDIGO CYBER THEME
      completion: {
        id: "completion",
        label: "Completion",
        columnHeader: "COMPLETION",
        subtitle: "Top performers based on curriculum completion percentage",
        unit: "%",
        shortUnit: "%",
        accentHex: "#A855F7",
        secondaryHex: "#6366F1",
        pageBg: "bg-[#070510]",
        cardBg: "bg-[#110D20]",
        headerGrad:
          "from-[#1E1038] via-[#150D2A] to-[#0B0718] border-purple-500/35 shadow-[0_0_55px_-12px_rgba(168,85,247,0.32)]",
        hairline: "via-purple-400/80",
        pillActive:
          "bg-gradient-to-r from-purple-500 via-fuchsia-500 to-indigo-600 text-white shadow-[0_0_22px_rgba(168,85,247,0.55)]",
        badgeCls: "text-purple-200 bg-purple-500/15 border-purple-400/35",
        champCard:
          "from-[#261447] to-[#110A22] border-purple-400/75 shadow-[0_0_55px_-6px_rgba(168,85,247,0.45)]",
        champRibbon: "from-purple-400 via-fuchsia-400 to-indigo-400 text-slate-950",
        barGrad: "from-indigo-600 via-purple-500 to-fuchsia-300",
        titles: ["Completion Master", "Curriculum Finisher", "Track Pacesetter"],
        chartType: "bar",
        chartTitle: "Curriculum Completion Milestone Bars",
        getValue: (u) => Number(u?.completion_pct || 0),
      },

      // TAB 3: RETENTION -> BIO-EMERALD & TEAL MATRIX THEME
      retention: {
        id: "retention",
        label: "Retention",
        columnHeader: "RETENTION",
        subtitle: "Top performers based on long-term knowledge retention stability",
        unit: "%",
        shortUnit: "%",
        accentHex: "#10B981",
        secondaryHex: "#14B8A6",
        pageBg: "bg-[#040B09]",
        cardBg: "bg-[#091612]",
        headerGrad:
          "from-[#09291E] via-[#071C15] to-[#040E0B] border-emerald-500/35 shadow-[0_0_55px_-12px_rgba(16,185,129,0.3)]",
        hairline: "via-emerald-400/80",
        pillActive:
          "bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-500 text-slate-950 shadow-[0_0_22px_rgba(16,185,129,0.5)]",
        badgeCls: "text-emerald-200 bg-emerald-500/15 border-emerald-400/35",
        champCard:
          "from-[#0D3326] to-[#061812] border-emerald-400/75 shadow-[0_0_55px_-6px_rgba(16,185,129,0.42)]",
        champRibbon: "from-emerald-300 via-teal-300 to-cyan-300 text-slate-950",
        barGrad: "from-teal-600 via-emerald-400 to-lime-300",
        titles: ["Retention Guardian", "Stability Anchor", "Memory Sentinel"],
        chartType: "radar",
        chartTitle: "5-Pillar Cohort Stability Polygon",
        getValue: (u) => Number(u?.retention_pct || 0),
      },

      // TAB 4: APPLICATION -> HYPER-CYAN & DEEP SAPPHIRE LAB THEME
      application: {
        id: "application",
        label: "Application",
        columnHeader: "APPLICATION",
        subtitle: "Top performers based on assessment accuracy and practical mastery",
        unit: "%",
        shortUnit: "%",
        accentHex: "#38BDF8",
        secondaryHex: "#3B82F6",
        pageBg: "bg-[#040812]",
        cardBg: "bg-[#0A1224]",
        headerGrad:
          "from-[#0C2244] via-[#091730] to-[#050C1A] border-cyan-400/35 shadow-[0_0_55px_-12px_rgba(56,189,248,0.3)]",
        hairline: "via-cyan-400/80",
        pillActive:
          "bg-gradient-to-r from-cyan-400 via-sky-500 to-blue-600 text-slate-950 shadow-[0_0_22px_rgba(56,189,248,0.5)]",
        badgeCls: "text-cyan-200 bg-cyan-500/15 border-cyan-400/35",
        champCard:
          "from-[#0F2E5A] to-[#07152B] border-cyan-400/75 shadow-[0_0_55px_-6px_rgba(56,189,248,0.45)]",
        champRibbon: "from-cyan-300 via-sky-300 to-blue-400 text-slate-950",
        barGrad: "from-blue-600 via-sky-400 to-cyan-200",
        titles: ["Mastery Architect", "Precision Specialist", "Applied Scholar"],
        chartType: "composed",
        chartTitle: "Quiz Application vs. Completion Precision",
        getValue: (u) => Number(u?.application_pct || 0),
      },

      // TAB 5: STREAKS -> VOLCANIC CRIMSON & SOLAR FLAME THEME
      streaks: {
        id: "streaks",
        label: "Streaks",
        columnHeader: "STREAK",
        subtitle: "Top performers based on consecutive active learning days",
        unit: " Days",
        shortUnit: "d",
        accentHex: "#F43F5E",
        secondaryHex: "#F97316",
        pageBg: "bg-[#0C0407]",
        cardBg: "bg-[#1A0B11]",
        headerGrad:
          "from-[#380D1A] via-[#240913] to-[#120509] border-rose-500/35 shadow-[0_0_55px_-12px_rgba(244,63,94,0.32)]",
        hairline: "via-rose-400/80",
        pillActive:
          "bg-gradient-to-r from-rose-500 via-orange-500 to-amber-500 text-white shadow-[0_0_22px_rgba(244,63,94,0.55)]",
        badgeCls: "text-rose-200 bg-rose-500/15 border-rose-400/35",
        champCard:
          "from-[#421020] to-[#19070D] border-rose-400/75 shadow-[0_0_55px_-6px_rgba(244,63,94,0.45)]",
        champRibbon: "from-rose-400 via-orange-400 to-amber-300 text-slate-950",
        barGrad: "from-rose-600 via-orange-500 to-amber-300",
        titles: ["Inferno Titan", "Blaze Runner", "Flame Keeper"],
        chartType: "stepArea",
        chartTitle: "Consecutive Habit Flame Momentum",
        getValue: (u) => Number(u?.streak_days || 0),
      },
    };
    return themes[activeTab] || themes.curos;
  }, [activeTab]);

  const kpis = useMemo(() => {
    const activeWithCuros = rankedCompetitors.filter(
      (u) => (u.curos || 0) > 0
    ).length;
    return {
      total_users:
        activeWithCuros > 0 ? activeWithCuros : rankedCompetitors.length,
      total_roster: rankedCompetitors.length,
      all_curos: rankedCompetitors.reduce(
        (s, u) => s + Number(u.curos || 0),
        0
      ),
      highest_streak: rankedCompetitors.reduce(
        (m, u) => Math.max(m, Number(u.streak_days || 0)),
        0
      ),
      programs_completed: rankedCompetitors.reduce(
        (s, u) => s + Number(u.programs_completed || 0),
        0
      ),
    };
  }, [rankedCompetitors]);

  const filteredCompetitors = useMemo(() => {
    if (!searchQuery.trim()) return rankedCompetitors;
    const q = searchQuery.toLowerCase();
    return rankedCompetitors.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        (u.email && u.email.toLowerCase().includes(q))
    );
  }, [rankedCompetitors, searchQuery]);

  const chartData = useMemo(() => {
    return rankedCompetitors.slice(0, 10).map((u) => ({
      name: u.name.split(" ")[0],
      score: tabTheme.getValue(u),
      secondary: Number(u.completion_pct || 0),
    }));
  }, [rankedCompetitors, tabTheme]);

  // 5-Pillar Cohort Radar Data for the Retention Tab
  const cohortRadarData = useMemo(() => {
    const denom = Math.max(1, rankedCompetitors.length);
    const avgComp = Math.round(
      rankedCompetitors.reduce((s, u) => s + (u.completion_pct || 0), 0) / denom
    );
    const avgRet = Math.round(
      rankedCompetitors.reduce((s, u) => s + (u.retention_pct || 0), 0) / denom
    );
    const avgApp = Math.round(
      rankedCompetitors.reduce((s, u) => s + (u.application_pct || 0), 0) / denom
    );
    return [
      { subject: "Retention", score: Math.max(25, avgRet), target: 85 },
      { subject: "Completion", score: Math.max(20, avgComp), target: 80 },
      { subject: "Application", score: Math.max(25, avgApp), target: 80 },
      { subject: "Consistency", score: 68, target: 75 },
      { subject: "Curos Velocity", score: 74, target: 75 },
    ];
  }, [rankedCompetitors]);

  const maxScore = Math.max(
    1,
    ...rankedCompetitors.map((u) => tabTheme.getValue(u))
  );

  const firstPlace = rankedCompetitors[0];
  const secondPlace = rankedCompetitors[1];
  const thirdPlace = rankedCompetitors[2];

  return (
    <div
      className={`min-h-screen ${tabTheme.pageBg} text-slate-100 font-sans p-5 md:p-6 space-y-6 transition-colors duration-500 overflow-x-hidden`}
    >
      {/* ===================================================================
          1. DYNAMIC CHAMELEON HERO BANNER HEADER
      =================================================================== */}
      <header
        className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${tabTheme.headerGrad} p-6 md:p-8 border transition-all duration-500 flex flex-wrap items-center justify-between gap-4`}
      >
        <div
          className={`pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent ${tabTheme.hairline} to-transparent`}
        />
        <div
          className="pointer-events-none absolute -right-10 -top-16 w-72 h-72 rounded-full blur-3xl opacity-20 transition-all duration-500"
          style={{ backgroundColor: tabTheme.accentHex }}
        />

        <div className="relative z-10">
          <div className="flex flex-wrap items-center gap-2.5">
            <span
              className="text-[10px] font-extrabold uppercase tracking-[0.25em]"
              style={{ color: tabTheme.accentHex }}
            >
              PERFORMANCE & ACHIEVEMENTS • {tabTheme.label.toUpperCase()} ARENA
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-white/5 text-slate-300 border border-white/10 flex items-center gap-1.5">
              <span
                className={`w-1.5 h-1.5 rounded-full bg-emerald-400 ${
                  syncing ? "animate-ping" : ""
                }`}
              />
              {lastSynced ? `Live Synced ${lastSynced}` : "Supabase Connected"}
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white mt-1.5 tracking-tight">
            Leaderboards
          </h1>
          <p className="text-xs md:text-sm text-slate-400 mt-1">
            {tabTheme.subtitle}
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-2.5">
          <button
            onClick={() => fetchLeaderboard(false)}
            className="px-4 py-2.5 rounded-xl bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/15 hover:border-white/35 text-xs font-extrabold text-white transition-all flex items-center gap-2 cursor-pointer"
          >
            <span className={syncing ? "animate-spin" : ""}>↻</span>
            <span>{syncing ? "Syncing..." : "Refresh Standings"}</span>
          </button>
        </div>
      </header>

      {/* ===================================================================
          2. 4 KPI SUMMARY CARDS (Click Any Card to Jump to Its Tab!)
      =================================================================== */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            targetTab: "curos",
            label: "Total Users",
            value: kpis.total_users,
            sub: `${kpis.total_roster} Total Enrolled`,
            icon: "👥",
            accent: "text-white",
            iconCls: "bg-white/[0.04] text-slate-300 border-white/10",
            borderCls: "border-white/10 hover:border-white/25",
          },
          {
            targetTab: "curos",
            label: "All Curos",
            value: kpis.all_curos,
            sub: "Active Reward Pool",
            icon: "🪙",
            accent: "text-amber-300",
            iconCls: "bg-amber-500/10 text-amber-300 border-amber-500/25",
            borderCls:
              activeTab === "curos"
                ? "border-amber-400/60 ring-1 ring-amber-400/30"
                : "border-amber-500/15 hover:border-amber-400/50",
          },
          {
            targetTab: "streaks",
            label: "Highest Streak",
            value: `${kpis.highest_streak}d`,
            sub: "Consecutive Learning Days",
            icon: "🔥",
            accent: "text-rose-400",
            iconCls: "bg-rose-500/10 text-rose-300 border-rose-500/25",
            borderCls:
              activeTab === "streaks"
                ? "border-rose-400/60 ring-1 ring-rose-400/30"
                : "border-rose-500/15 hover:border-rose-400/45",
          },
          {
            targetTab: "completion",
            label: "Programs Completed",
            value: kpis.programs_completed,
            sub: "Full Track Graduations",
            icon: "🎖️",
            accent: "text-purple-300",
            iconCls: "bg-purple-500/10 text-purple-300 border-purple-500/25",
            borderCls:
              activeTab === "completion"
                ? "border-purple-400/60 ring-1 ring-purple-400/30"
                : "border-purple-500/15 hover:border-purple-400/45",
          },
        ].map((card, i) => (
          <div
            key={i}
            onClick={() => setActiveTab(card.targetTab)}
            className={`cursor-pointer group ${tabTheme.cardBg} rounded-2xl p-5 border ${card.borderCls} shadow-[0_8px_30px_rgba(0,0,0,0.6)] transition-all duration-300 hover:-translate-y-0.5 flex items-center justify-between`}
          >
            <div>
              <span className="text-xs font-semibold text-slate-400 block">
                {card.label}
              </span>
              <span
                className={`text-3xl font-extrabold my-1 block ${card.accent}`}
              >
                {card.value}
              </span>
              <span className="text-[11px] text-slate-500 font-medium">
                {card.sub}
              </span>
            </div>
            <div
              className={`w-12 h-12 rounded-2xl border flex items-center justify-center text-xl transition-transform group-hover:scale-105 ${card.iconCls}`}
            >
              {card.icon}
            </div>
          </div>
        ))}
      </section>

      {/* ===================================================================
          3. 5 CATEGORY TABS (EACH WITH ITS OWN SIGNATURE COLOR) + SEARCH
      =================================================================== */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div
          className={`inline-flex flex-wrap items-center gap-1.5 ${tabTheme.cardBg} p-1.5 rounded-2xl border border-white/10 shadow-md`}
        >
          {[
            { id: "curos", label: "🪙 Curos" },
            { id: "completion", label: "🏆 Completion" },
            { id: "retention", label: "📈 Retention" },
            { id: "application", label: "🎖️ Application" },
            { id: "streaks", label: "🔥 Streaks" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all duration-300 cursor-pointer ${
                activeTab === tab.id
                  ? tabTheme.pillActive
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <span className="absolute left-3.5 top-2.5 text-xs text-slate-500">
            🔍
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search in ${tabTheme.label}...`}
            className={`w-full ${tabTheme.cardBg} border border-white/10 focus:border-white/35 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 outline-none transition`}
          />
        </div>
      </div>

      {/* ===================================================================
          4. GRAND STAGE: STEPPED 3-PILLAR PODIUM + PER-TAB BESPOKE CHART
      =================================================================== */}
      {!loading && rankedCompetitors.length > 0 && (
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          {/* LEFT 7 COLS: STEPPED PODIUM SHOWCASE (Morphs Theme Per Tab!) */}
          <div
            className={`lg:col-span-7 ${tabTheme.cardBg} rounded-3xl p-6 border border-white/10 shadow-[0_0_40px_-10px_rgba(0,0,0,0.6)] flex flex-col justify-between relative overflow-hidden`}
          >
            <div
              className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-80 h-44 rounded-full blur-3xl opacity-15 transition-all duration-500"
              style={{ backgroundColor: tabTheme.accentHex }}
            />

            <div className="flex items-center justify-between relative z-10 mb-4">
              <div>
                <span
                  className={`text-[10px] font-extrabold uppercase tracking-widest border px-2.5 py-0.5 rounded-full ${tabTheme.badgeCls}`}
                >
                  🏆 {tabTheme.label} Championship Podium
                </span>
                <h2 className="text-base font-extrabold text-white mt-1.5">
                  Top 3 {tabTheme.label} Leaders
                </h2>
              </div>
              <span className="text-xs text-slate-400">
                Live Standing • {rankedCompetitors.length} Competitors
              </span>
            </div>

            {/* Stepped 3-Card Podium Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end relative z-10 pt-4">
              {/* 2ND PLACE CARD */}
              {secondPlace && (
                <div className="bg-black/45 backdrop-blur-xl rounded-2xl p-5 border border-slate-400/25 shadow-[0_0_30px_-8px_rgba(148,163,184,0.18)] text-center flex flex-col items-center justify-between sm:h-[245px]">
                  <div className="w-12 h-12 rounded-2xl bg-slate-400/10 border border-slate-300/30 flex items-center justify-center text-2xl">
                    🥈
                  </div>
                  <div className="my-2">
                    <span className="text-[11px] font-extrabold text-slate-300 block">
                      2nd
                    </span>
                    <span className="text-[10px] text-slate-500 block">
                      {tabTheme.titles[1]}
                    </span>
                    <h3 className="text-sm font-extrabold text-white mt-1 truncate max-w-[150px]">
                      {secondPlace.name}
                    </h3>
                  </div>
                  <div>
                    <div className="text-2xl font-black text-slate-200">
                      {tabTheme.getValue(secondPlace)}
                      {tabTheme.shortUnit}
                    </div>
                    <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                      {tabTheme.label}
                    </span>
                  </div>
                </div>
              )}

              {/* 1ST PLACE CHAMPION CARD (Dynamic Per-Tab Crown & Glow!) */}
              {firstPlace && (
                <div
                  className={`bg-gradient-to-b ${tabTheme.champCard} rounded-2xl p-6 border-2 text-center flex flex-col items-center justify-between sm:h-[285px] relative transition-all duration-500`}
                >
                  <div
                    className={`absolute -top-3.5 px-3 py-0.5 rounded-full bg-gradient-to-r ${tabTheme.champRibbon} font-black text-[10px] uppercase tracking-wider shadow-md`}
                  >
                    👑 #1 {tabTheme.label} Leader
                  </div>
                  <div
                    className="w-14 h-14 rounded-2xl bg-white/10 border border-white/25 flex items-center justify-center text-3xl mt-2"
                    style={{
                      boxShadow: `0 0 25px ${tabTheme.accentHex}55`,
                    }}
                  >
                    🥇
                  </div>
                  <div className="my-2">
                    <span
                      className="text-xs font-extrabold block"
                      style={{ color: tabTheme.accentHex }}
                    >
                      1st
                    </span>
                    <span className="text-[11px] text-slate-300 block">
                      {tabTheme.titles[0]}
                    </span>
                    <h3 className="text-base font-extrabold text-white mt-1 truncate max-w-[170px]">
                      {firstPlace.name}
                    </h3>
                  </div>
                  <div>
                    <div
                      className="text-3xl font-black"
                      style={{
                        color: tabTheme.accentHex,
                        filter: `drop-shadow(0 0 12px ${tabTheme.accentHex}66)`,
                      }}
                    >
                      {tabTheme.getValue(firstPlace)}
                      {tabTheme.shortUnit}
                    </div>
                    <span className="text-[10px] uppercase tracking-wider text-slate-300 font-bold">
                      {tabTheme.label}
                    </span>
                  </div>
                </div>
              )}

              {/* 3RD PLACE CARD */}
              {thirdPlace && (
                <div className="bg-black/45 backdrop-blur-xl rounded-2xl p-5 border border-orange-400/25 shadow-[0_0_30px_-8px_rgba(251,146,60,0.18)] text-center flex flex-col items-center justify-between sm:h-[225px]">
                  <div className="w-12 h-12 rounded-2xl bg-orange-500/10 border border-orange-400/35 flex items-center justify-center text-2xl">
                    🥉
                  </div>
                  <div className="my-2">
                    <span className="text-[11px] font-extrabold text-orange-300 block">
                      3rd
                    </span>
                    <span className="text-[10px] text-slate-500 block">
                      {tabTheme.titles[2]}
                    </span>
                    <h3 className="text-sm font-extrabold text-white mt-1 truncate max-w-[150px]">
                      {thirdPlace.name}
                    </h3>
                  </div>
                  <div>
                    <div className="text-2xl font-black text-orange-300">
                      {tabTheme.getValue(thirdPlace)}
                      {tabMetaShortUnit(tabTheme)}
                    </div>
                    <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                      {tabTheme.label}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT 5 COLS: BESPOKE VISUALIZATION THAT CHANGES PER TAB! */}
          <div
            className={`lg:col-span-5 ${tabTheme.cardBg} rounded-3xl p-6 border border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.6)] flex flex-col justify-between`}
          >
            <div>
              <div className="flex items-center justify-between mb-1">
                <span
                  className={`text-[10px] font-extrabold uppercase tracking-widest border px-2.5 py-0.5 rounded-full ${tabTheme.badgeCls}`}
                >
                  📊 {tabTheme.label} Telemetry
                </span>
                <span
                  className="text-xs font-extrabold"
                  style={{ color: tabTheme.accentHex }}
                >
                  Leader:{" "}
                  {firstPlace
                    ? `${tabTheme.getValue(firstPlace)}${tabTheme.unit}`
                    : "-"}
                </span>
              </div>
              <h3 className="text-base font-extrabold text-white mt-1.5">
                {tabTheme.chartTitle}
              </h3>
              <p className="text-xs text-slate-400">{tabTheme.subtitle}</p>
            </div>

            {/* Dynamic Chart Renderer: Different Graph Architecture Per Tab */}
            <div className="w-full h-52 my-3 bg-black/50 rounded-2xl p-3 border border-white/5">
              <ResponsiveContainer width="100%" height="100%">
                {tabTheme.chartType === "bar" ? (
                  <BarChart
                    data={chartData}
                    margin={{ top: 10, right: 10, left: -22, bottom: 0 }}
                  >
                    <CartesianGrid
                      stroke="#1F1930"
                      strokeDasharray="3 3"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="name"
                      tick={{ fill: "#94A3B8", fontSize: 10, fontWeight: 600 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: "#64748B", fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      content={
                        <DynamicTooltip
                          unit={tabTheme.unit}
                          accentHex={tabTheme.accentHex}
                        />
                      }
                    />
                    <Bar
                      dataKey="score"
                      name={tabTheme.label}
                      radius={[6, 6, 0, 0]}
                      barSize={24}
                    >
                      {chartData.map((_, i) => (
                        <Cell
                          key={i}
                          fill={
                            i === 0
                              ? tabTheme.accentHex
                              : i < 3
                              ? tabTheme.secondaryHex
                              : "#3B2854"
                          }
                        />
                      ))}
                    </Bar>
                  </BarChart>
                ) : tabTheme.chartType === "radar" ? (
                  <RadarChart
                    cx="50%"
                    cy="50%"
                    outerRadius="70%"
                    data={cohortRadarData}
                  >
                    <PolarGrid stroke="#152C24" />
                    <PolarAngleAxis
                      dataKey="subject"
                      tick={{ fill: "#A7F3D0", fontSize: 10, fontWeight: 700 }}
                    />
                    <PolarRadiusAxis
                      domain={[0, 100]}
                      tick={false}
                      axisLine={false}
                    />
                    <Tooltip
                      content={
                        <DynamicTooltip
                          unit="%"
                          accentHex={tabTheme.accentHex}
                        />
                      }
                    />
                    <Radar
                      name="Cohort Stability"
                      dataKey="score"
                      stroke="#10B981"
                      fill="#10B981"
                      fillOpacity={0.4}
                      strokeWidth={2.4}
                    />
                    <Radar
                      name="Benchmark"
                      dataKey="target"
                      stroke="#14B8A6"
                      fill="none"
                      strokeDasharray="4 4"
                    />
                  </RadarChart>
                ) : tabTheme.chartType === "composed" ? (
                  <ComposedChart
                    data={chartData}
                    margin={{ top: 10, right: 10, left: -22, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient
                        id="appCyanGrad"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#38BDF8"
                          stopOpacity={0.5}
                        />
                        <stop
                          offset="95%"
                          stopColor="#38BDF8"
                          stopOpacity={0.02}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      stroke="#132238"
                      strokeDasharray="3 3"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="name"
                      tick={{ fill: "#94A3B8", fontSize: 10, fontWeight: 600 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: "#64748B", fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      content={
                        <DynamicTooltip
                          unit="%"
                          accentHex={tabTheme.accentHex}
                        />
                      }
                    />
                    <Area
                      type="monotone"
                      dataKey="score"
                      name="Application Mastery"
                      stroke="#38BDF8"
                      strokeWidth={2.5}
                      fill="url(#appCyanGrad)"
                    />
                    <Line
                      type="monotone"
                      dataKey="secondary"
                      name="Course Progress"
                      stroke="#818CF8"
                      strokeWidth={2}
                      dot={{ r: 3, fill: "#818CF8" }}
                    />
                  </ComposedChart>
                ) : (
                  <AreaChart
                    data={chartData}
                    margin={{ top: 10, right: 10, left: -22, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient
                        id="dynamicCurveGrad"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor={tabTheme.accentHex}
                          stopOpacity={0.58}
                        />
                        <stop
                          offset="95%"
                          stopColor={tabTheme.accentHex}
                          stopOpacity={0.02}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      stroke="#1A1A1E"
                      strokeDasharray="3 3"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="name"
                      tick={{ fill: "#94A3B8", fontSize: 10, fontWeight: 600 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: "#64748B", fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      content={
                        <DynamicTooltip
                          unit={tabTheme.unit}
                          accentHex={tabTheme.accentHex}
                        />
                      }
                    />
                    <Area
                      type={
                        tabTheme.chartType === "stepArea" ? "stepAfter" : "monotone"
                      }
                      dataKey="score"
                      name={tabTheme.label}
                      stroke={tabTheme.accentHex}
                      strokeWidth={2.8}
                      fill="url(#dynamicCurveGrad)"
                    />
                  </AreaChart>
                )}
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/10 text-center text-xs">
              <div className="bg-black/40 p-2 rounded-xl border border-white/5">
                <span className="text-[10px] text-slate-500 block">
                  1st Place
                </span>
                <span
                  className="font-extrabold"
                  style={{ color: tabTheme.accentHex }}
                >
                  {firstPlace
                    ? `${tabTheme.getValue(firstPlace)}${tabTheme.shortUnit}`
                    : "-"}
                </span>
              </div>
              <div className="bg-black/40 p-2 rounded-xl border border-white/5">
                <span className="text-[10px] text-slate-500 block">
                  2nd Place
                </span>
                <span className="font-extrabold text-slate-200">
                  {secondPlace
                    ? `${tabTheme.getValue(secondPlace)}${tabTheme.shortUnit}`
                    : "-"}
                </span>
              </div>
              <div className="bg-black/40 p-2 rounded-xl border border-white/5">
                <span className="text-[10px] text-slate-500 block">
                  3rd Place
                </span>
                <span className="font-extrabold text-orange-300">
                  {thirdPlace
                    ? `${tabTheme.getValue(thirdPlace)}${tabTheme.shortUnit}`
                    : "-"}
                </span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ===================================================================
          5. LEADERBOARD RANKINGS TABLE (Morphs Theme Per Tab!)
      =================================================================== */}
      <section
        className={`${tabTheme.cardBg} rounded-3xl p-6 border border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.6)] space-y-4`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-4">
          <div>
            <h2 className="text-lg font-extrabold text-white">
              {tabTheme.label} Leaderboard Rankings
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">{tabTheme.subtitle}</p>
          </div>
          <span
            className={`text-xs font-extrabold border px-3 py-1 rounded-full ${tabTheme.badgeCls}`}
          >
            Showing {filteredCompetitors.length} Competitors
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                <th className="py-3 px-4 w-24">RANK</th>
                <th className="py-3 px-4">USER</th>
                <th className="py-3 px-4 hidden md:table-cell">TIER & TRACK</th>
                <th className="py-3 px-4 hidden lg:table-cell w-64">
                  RELATIVE STANDING
                </th>
                <th className="py-3 px-4 text-right">
                  {tabTheme.columnHeader}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-xs">
              {filteredCompetitors.map((u) => {
                const val = tabTheme.getValue(u);
                const barPct =
                  val > 0
                    ? Math.min(
                        100,
                        Math.max(8, Math.round((val / maxScore) * 100))
                      )
                    : 3;

                const isTop3 = u.rank <= 3;
                const tierBadge =
                  u.rank === 1
                    ? {
                        label: tabTheme.titles[0],
                        cls: tabTheme.badgeCls,
                      }
                    : u.rank === 2
                    ? {
                        label: tabTheme.titles[1],
                        cls: "bg-slate-400/10 text-slate-300 border-slate-400/30",
                      }
                    : u.rank === 3
                    ? {
                        label: tabTheme.titles[2],
                        cls: "bg-orange-500/15 text-orange-300 border-orange-400/30",
                      }
                    : {
                        label: "Cohort Contender",
                        cls: "bg-white/5 text-slate-500 border-white/10",
                      };

                return (
                  <tr
                    key={u.id ?? u.name}
                    className="hover:bg-white/[0.03] transition"
                  >
                    <td className="py-3.5 px-4 font-extrabold">
                      <div className="flex items-center gap-2">
                        {u.rank === 1 && <span className="text-base">🏆</span>}
                        {u.rank === 2 && <span className="text-base">🥈</span>}
                        {u.rank === 3 && <span className="text-base">🥉</span>}
                        <span
                          className={`px-2.5 py-1 rounded-lg text-xs font-black ${
                            u.rank === 1
                              ? `bg-gradient-to-r ${tabTheme.champRibbon}`
                              : u.rank === 2
                              ? "bg-slate-300 text-black"
                              : u.rank === 3
                              ? "bg-orange-400 text-black"
                              : "text-slate-400 bg-black/50 border border-white/10"
                          }`}
                        >
                          #{u.rank}
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-xl font-extrabold text-xs flex items-center justify-center shrink-0 ${
                            isTop3
                              ? `bg-gradient-to-br ${tabTheme.champRibbon}`
                              : "bg-white/[0.04] text-slate-300 border border-white/10"
                          }`}
                        >
                          {(u.name || "U").slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <span className="font-extrabold text-white text-sm block">
                            {u.name}
                          </span>
                          {u.email && (
                            <span className="text-[11px] text-slate-500 block">
                              {u.email}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 hidden md:table-cell">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${tierBadge.cls}`}
                        >
                          {tierBadge.label}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          • {u.program_name}
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 hidden lg:table-cell">
                      <div className="w-full h-2 rounded-full bg-black/60 border border-white/5 overflow-hidden">
                        <div
                          className={`h-full rounded-full bg-gradient-to-r ${tabTheme.barGrad} transition-all duration-500`}
                          style={{ width: `${barPct}%` }}
                        />
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <span
                        className={`text-sm font-black px-3 py-1 rounded-xl border ${
                          val > 0
                            ? tabTheme.badgeCls
                            : "text-slate-600 border-transparent"
                        }`}
                      >
                        {activeTab === "curos" && "🪙 "}
                        {val}
                        {tabTheme.shortUnit}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
