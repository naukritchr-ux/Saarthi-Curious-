import React, { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";

const API_BASE_URL = import.meta.env?.VITE_API_URL || "http://localhost:8000";

// ============================================================================
// 1. DEFAULT 15-BADGE CATALOG (MATCHING SCREENSHOT 17 EXACTLY)
// ============================================================================
const DEFAULT_BADGE_CATALOG = [
  // Row 1: Bronze Tier
  { id: "app_bronze", name: "Application Bronze", category: "application", tier: "bronze", xp: 100, target: 1, unit: "Quiz Passed", desc: "Pass your first practical application assessment with precision." },
  { id: "comp_bronze", name: "Completion Bronze", category: "completion", tier: "bronze", xp: 100, target: 1, unit: "Program Done", desc: "Complete your first foundational learning track from start to finish." },
  { id: "curos_bronze", name: "Curos Bronze", category: "curos", tier: "bronze", xp: 100, target: 100, unit: "Curos Earned", desc: "Accumulate your first 100 Curos in the learning treasury." },
  { id: "ret_bronze", name: "Retention Bronze", category: "retention", tier: "bronze", xp: 100, target: 70, unit: "% Stability", desc: "Maintain a 70%+ knowledge retention stability index." },
  { id: "strk_bronze", name: "Streak Bronze", category: "streak", tier: "bronze", xp: 100, target: 3, unit: "Day Streak", desc: "Maintain an active learning habit for 3 consecutive days." },

  // Row 2: Gold Tier (Centerpiece Row)
  { id: "comp_gold", name: "Completion Gold", category: "completion", tier: "gold", xp: 500, target: 5, unit: "Programs Done", desc: "Master and graduate from 5 full enterprise curriculum tracks." },
  { id: "app_gold", name: "Application Gold", category: "application", tier: "gold", xp: 500, target: 90, unit: "% Quiz Mastery", desc: "Achieve 90%+ mastery across advanced practical application checks." },
  { id: "curos_gold", name: "Curos Gold", category: "curos", tier: "gold", xp: 500, target: 1000, unit: "Curos Earned", desc: "Reach Sovereign status by accumulating 1,000+ Curos." },
  { id: "ret_gold", name: "Retention Gold", category: "retention", tier: "gold", xp: 500, target: 90, unit: "% Stability", desc: "Sustain elite 90%+ long-term memory retention across modules." },
  { id: "strk_gold", name: "Streak Gold", category: "streak", tier: "gold", xp: 500, target: 30, unit: "Day Streak", desc: "Unstoppable 30-day consecutive learning inferno streak." },

  // Row 3: Silver Tier
  { id: "app_silver", name: "Application Silver", category: "application", tier: "silver", xp: 250, target: 5, unit: "Quizzes Passed", desc: "Demonstrate consistent applied skill across 5 assessments." },
  { id: "comp_silver", name: "Completion Silver", category: "completion", tier: "silver", xp: 250, target: 3, unit: "Programs Done", desc: "Complete 3 core learning programs with verified certification." },
  { id: "curos_silver", name: "Curos Silver", category: "curos", tier: "silver", xp: 250, target: 500, unit: "Curos Earned", desc: "Build a treasury of 500 Curos through active milestones." },
  { id: "ret_silver", name: "Retention Silver", category: "retention", tier: "silver", xp: 250, target: 80, unit: "% Stability", desc: "Hold an 80%+ retention benchmark across completed tracks." },
  { id: "strk_silver", name: "Streak Silver", category: "streak", tier: "silver", xp: 250, target: 7, unit: "Day Streak", desc: "Complete a full 7-day weekly learning streak cycle." },
];

// ============================================================================
// 2. HYPER-REALISTIC 3D METALLIC MEDAL SVG ENGINE
//    Renders 24K Gold, Brushed Sterling Silver & Burnished Copper-Bronze
// ============================================================================
function MetallicMedalSVG({ tier = "gold", category = "curos", unlocked = false, size = 86 }) {
  const uid = `${tier}-${category}-${Math.random().toString(36).slice(2, 7)}`;

  const palettes = {
    gold: {
      rimStops: ["#FEF9C3", "#F59E0B", "#78350F", "#FDE047", "#B45309"],
      faceStops: ["#FFFBEB", "#FBBF24", "#D97706", "#451A03"],
      innerBevel: "#FEF08A",
      glowHex: "#F59E0B",
      ribbonLeft: "#991B1B",
      ribbonRight: "#DC2626",
      ribbonStripe: "#FDE047",
    },
    silver: {
      rimStops: ["#FFFFFF", "#CBD5E1", "#334155", "#F8FAFC", "#64748B"],
      faceStops: ["#F8FAFC", "#94A3B8", "#475569", "#0F172A"],
      innerBevel: "#F1F5F9",
      glowHex: "#94A3B8",
      ribbonLeft: "#1E3A8A",
      ribbonRight: "#2563EB",
      ribbonStripe: "#E2E8F0",
    },
    bronze: {
      rimStops: ["#FFEDD5", "#EA580C", "#431407", "#FDBA74", "#9A3412"],
      faceStops: ["#FFF7ED", "#FB923C", "#C2410C", "#2A0E05"],
      innerBevel: "#FED7AA",
      glowHex: "#EA580C",
      ribbonLeft: "#064E3B",
      ribbonRight: "#059669",
      ribbonStripe: "#FDBA74",
    },
  };

  const p = palettes[tier] || palettes.gold;

  // Generate 24 scalloped coin teeth around the outer metallic bezel
  const scallopedPoints = useMemo(() => {
    const pts = [];
    const totalTeeth = 28;
    for (let i = 0; i < totalTeeth * 2; i++) {
      const r = i % 2 === 0 ? 43 : 39.5;
      const angle = (i * Math.PI) / totalTeeth;
      pts.push(`${(60 + r * Math.cos(angle)).toFixed(1)},${(62 + r * Math.sin(angle)).toFixed(1)}`);
    }
    return pts.join(" ");
  }, []);

  return (
    <div
      className="relative inline-flex items-center justify-center select-none transition-transform duration-500 group-hover:scale-110"
      style={{ width: size, height: size }}
    >
      {/* Ambient Metallic Halo Glow */}
      <div
        className={`absolute inset-1 rounded-full blur-xl transition-opacity duration-500 ${
          unlocked ? "opacity-65 group-hover:opacity-95" : "opacity-25 group-hover:opacity-60"
        }`}
        style={{ backgroundColor: p.glowHex }}
      />

      <svg
        viewBox="0 0 120 120"
        className="w-full h-full relative z-10 overflow-visible drop-shadow-[0_10px_18px_rgba(0,0,0,0.75)]"
      >
        <defs>
          <linearGradient id={`rim-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={p.rimStops[0]} />
            <stop offset="28%" stopColor={p.rimStops[1]} />
            <stop offset="52%" stopColor={p.rimStops[2]} />
            <stop offset="76%" stopColor={p.rimStops[3]} />
            <stop offset="100%" stopColor={p.rimStops[4]} />
          </linearGradient>

          <radialGradient id={`face-${uid}`} cx="32%" cy="28%" r="75%">
            <stop offset="0%" stopColor={p.faceStops[0]} />
            <stop offset="40%" stopColor={p.faceStops[1]} />
            <stop offset="82%" stopColor={p.faceStops[2]} />
            <stop offset="100%" stopColor={p.faceStops[3]} />
          </radialGradient>

          <linearGradient id={`sheen-${uid}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.0" />
            <stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.65" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Top Neck Ribbon & Gold Clasp */}
        <polygon points="42,6 60,26 50,32 34,10" fill={p.ribbonLeft} />
        <polygon points="78,6 60,26 70,32 86,10" fill={p.ribbonRight} />
        <line x1="40" y1="8" x2="54" y2="27" stroke={p.ribbonStripe} strokeWidth="2" strokeOpacity="0.8" />
        <line x1="80" y1="8" x2="66" y2="27" stroke={p.ribbonStripe} strokeWidth="2" strokeOpacity="0.8" />
        <rect x="49" y="18" width="22" height="5" rx="2.5" fill={`url(#rim-${uid})`} stroke="#000" strokeOpacity="0.4" />

        {/* Optional Champion Wings for Application & Gold Medals */}
        {(category === "application" || tier === "gold") && (
          <g fill={`url(#rim-${uid})`} opacity="0.95">
            <path d="M18,56 C6,48 4,36 16,38 C10,44 16,49 24,52 Z" />
            <path d="M16,64 C4,60 5,49 17,50 C12,55 18,60 25,62 Z" />
            <path d="M102,56 C114,48 116,36 104,38 C110,44 104,49 96,52 Z" />
            <path d="M104,64 C116,60 115,49 103,50 C108,55 102,60 95,62 Z" />
          </g>
        )}

        {/* Scalloped Metallic Outer Bezel */}
        <polygon
          points={scallopedPoints}
          fill={`url(#rim-${uid})`}
          stroke={p.innerBevel}
          strokeWidth="0.9"
        />

        {/* Deep Recessed Metallic Groove Ring */}
        <circle
          cx="60"
          cy="62"
          r="35"
          fill={`url(#face-${uid})`}
          stroke="#09090B"
          strokeWidth="1.5"
          strokeOpacity="0.55"
        />

        {/* Specular Inner Filigree Ring */}
        <circle
          cx="60"
          cy="62"
          r="30.5"
          fill="none"
          stroke={p.innerBevel}
          strokeWidth="1.2"
          strokeDasharray="3 2.5"
          opacity="0.85"
        />

        {/* Embossed Category Emblem in Center */}
        <g transform="translate(60, 62)" fill={p.innerBevel} stroke="#271705" strokeWidth="0.8">
          {category === "application" && (
            <>
              <circle cx="0" cy="0" r="14" fill="none" stroke={p.innerBevel} strokeWidth="2.2" />
              <circle cx="0" cy="0" r="7" fill="none" stroke={p.innerBevel} strokeWidth="1.8" />
              <circle cx="0" cy="0" r="2.8" fill="#FFFFFF" />
              <path d="M6,-15 L15,-6 L4,-2 L9,-9 Z" fill="#FFFFFF" />
            </>
          )}
          {category === "completion" && (
            <>
              {/* Open Book / Trophy Crest */}
              <path
                d="M-13,-8 C-6,-11 0,-8 0,-8 C0,-8 6,-11 13,-8 L13,9 C6,6 0,9 0,9 C0,9 -6,6 -13,9 Z"
                fill={`url(#rim-${uid})`}
                stroke={p.innerBevel}
                strokeWidth="1.5"
              />
              <line x1="0" y1="-8" x2="0" y2="9" stroke="#FFFFFF" strokeWidth="1.5" />
              <polygon points="0,-16 2.5,-11 8,-11 3.5,-7.5 5,-2 0,-5.5 -5,-2 -3.5,-7.5 -8,-11 -2.5,-11" fill="#FFFFFF" />
            </>
          )}
          {category === "curos" && (
            <>
              {/* Sovereign Coin / Star Crest */}
              <polygon
                points="0,-16 4.5,-5 16,-5 7,2.5 10.5,14 0,7 -10.5,14 -7,2.5 -16,-5 -4.5,-5"
                fill="#FFFFFF"
                opacity="0.92"
              />
              <circle cx="0" cy="0" r="5.5" fill={`url(#rim-${uid})`} />
            </>
          )}
          {category === "retention" && (
            <>
              {/* Shield & Infinity Retention Lock */}
              <path
                d="M0,-16 L13,-10 L13,1 C13,10 0,16 0,16 C0,16 -13,10 -13,1 L-13,-10 Z"
                fill={`url(#rim-${uid})`}
                stroke="#FFFFFF"
                strokeWidth="1.5"
              />
              <polyline
                points="-5,0 -1,4 6,-4"
                fill="none"
                stroke="#FFFFFF"
                strokeWidth="2.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </>
          )}
          {category === "streak" && (
            <>
              {/* Layered 3D Flame Crest */}
              <path
                d="M0,-17 C5,-9 13,-4 11,6 C9,13 4,16 0,16 C-5,16 -11,12 -11,4 C-11,-3 -5,-6 -3,-11 C-2,-8 1,-6 0,-17 Z"
                fill="#FFFFFF"
              />
              <path
                d="M0,-6 C3,-1 6,2 5,8 C4,12 2,14 0,14 C-3,14 -5,11 -5,7 C-5,3 -2,1 0,-6 Z"
                fill={`url(#face-${uid})`}
              />
            </>
          )}
        </g>

        {/* Diagonal Specular Glass Reflection Overlay */}
        <path
          d="M34,40 L54,28 L86,82 L66,94 Z"
          fill={`url(#sheen-${uid})`}
          opacity="0.55"
        />

        {/* Sparkle Starbursts on Gold/Unlocked Medals */}
        {(unlocked || tier === "gold") && (
          <g fill="#FFFFFF">
            <polygon points="28,36 30,41 35,43 30,45 28,50 26,45 21,43 26,41" />
            <polygon points="90,74 91.5,78 95.5,79.5 91.5,81 90,85 88.5,81 84.5,79.5 88.5,78" />
          </g>
        )}
      </svg>
    </div>
  );
}

// ============================================================================
// 3. 3D MEDAL INSPECTION & UNLOCK MODAL
// ============================================================================
function MedalInspectionModal({ badge, onClose, onToggleUnlock }) {
  if (!badge) return null;

  const tierColors = {
    gold: "from-amber-400 via-yellow-500 to-amber-600 text-black border-amber-400/60",
    silver: "from-slate-200 via-slate-300 to-slate-400 text-slate-950 border-slate-300/60",
    bronze: "from-orange-300 via-amber-600 to-orange-700 text-white border-orange-400/60",
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md bg-gradient-to-b from-[#151226] via-[#0D0B18] to-[#07060E] border border-amber-400/35 rounded-3xl p-6 text-center shadow-[0_0_80px_rgba(245,158,11,0.28)] overflow-hidden"
      >
        <div className="pointer-events-none absolute -top-20 left-1/2 -translate-x-1/2 w-72 h-72 bg-amber-400/15 rounded-full blur-3xl" />

        <div className="flex justify-between items-center relative z-10 mb-2">
          <span
            className={`px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-gradient-to-r ${
              tierColors[badge.tier]
            }`}
          >
            {badge.tier} Tier Medal
          </span>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white/5 hover:bg-rose-500/20 text-slate-300 hover:text-rose-300 font-bold text-xs"
          >
            ✕
          </button>
        </div>

        <div className="my-6 flex justify-center relative z-10 group">
          <MetallicMedalSVG
            tier={badge.tier}
            category={badge.category}
            unlocked={badge.unlocked}
            size={150}
          />
        </div>

        <h2 className="text-xl font-extrabold text-white relative z-10">
          {badge.name}
        </h2>
        <p className="text-xs text-slate-400 mt-1.5 leading-relaxed relative z-10">
          {badge.desc}
        </p>

        <div className="grid grid-cols-3 gap-2.5 my-5 relative z-10">
          <div className="p-3 rounded-2xl bg-[#080711] border border-white/10">
            <span className="text-[10px] text-slate-500 uppercase font-bold block">
              Reward
            </span>
            <span className="text-sm font-black text-amber-400 mt-0.5 block">
              +{badge.xp} XP
            </span>
          </div>
          <div className="p-3 rounded-2xl bg-[#080711] border border-white/10">
            <span className="text-[10px] text-slate-500 uppercase font-bold block">
              Milestone
            </span>
            <span className="text-sm font-black text-cyan-300 mt-0.5 block">
              {badge.progress}/{badge.target}
            </span>
          </div>
          <div className="p-3 rounded-2xl bg-[#080711] border border-white/10">
            <span className="text-[10px] text-slate-500 uppercase font-bold block">
              Status
            </span>
            <span
              className={`text-sm font-black mt-0.5 block ${
                badge.unlocked ? "text-emerald-400" : "text-amber-300"
              }`}
            >
              {badge.unlocked ? "Unlocked" : "In Vault"}
            </span>
          </div>
        </div>

        <button
          onClick={() => {
            onToggleUnlock(badge.id);
            onClose();
          }}
          className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600 hover:opacity-95 text-slate-950 font-black text-xs uppercase tracking-wider shadow-[0_0_25px_rgba(245,158,11,0.4)] transition relative z-10"
        >
          {badge.unlocked
            ? "✓ Equipped in Trophy Gallery"
            : "⚡ Unlock & Equip Medal to Gallery"}
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// 4. MAIN COMPONENT: Rewards.jsx (YOUR BADGE COLLECTION)
// ============================================================================
export default function Rewards() {
  const [badges, setBadges] = useState(
    DEFAULT_BADGE_CATALOG.map((b) => ({ ...b, unlocked: false, progress: 0 }))
  );
  const [checking, setChecking] = useState(false);
  const [tierFilter, setTierFilter] = useState("all"); // 'all' | 'gold' | 'silver' | 'bronze'
  const [inspectedBadge, setInspectedBadge] = useState(null);
  const [isGalleryFullScreen, setIsGalleryFullScreen] = useState(false);

  // Sync with Live Supabase Leaderboard/Attrition Telemetry so real achievements unlock!
  const checkAndSyncBadges = useCallback(async () => {
    setChecking(true);
    let maxCuros = 0;
    let maxComp = 0;
    let maxQuiz = 0;
    let maxStreak = 0;
    let completedCount = 0;

    try {
      const res = await axios.get(`${API_BASE_URL}/analytics/leaderboards`, {
        params: { _t: Date.now() },
      });
      const list = res.data?.competitors || [];
      list.forEach((u) => {
        maxCuros = Math.max(maxCuros, Number(u.curos || 0));
        maxComp = Math.max(maxComp, Number(u.completion_pct || 0));
        maxQuiz = Math.max(maxQuiz, Number(u.application_pct || 0));
        maxStreak = Math.max(maxStreak, Number(u.streak_days || 0));
        if (Number(u.completion_pct || 0) >= 100) completedCount += 1;
      });
    } catch {
      // Fallback if offline
    }

    setBadges((prev) =>
      prev.map((b) => {
        let liveProg = b.progress;
        if (b.category === "curos") liveProg = maxCuros;
        else if (b.category === "completion") liveProg = completedCount;
        else if (b.category === "application")
          liveProg = b.tier === "gold" ? maxQuiz : maxQuiz > 0 ? 1 : 0;
        else if (b.category === "retention")
          liveProg = Math.round(maxComp * 0.6 + maxQuiz * 0.4);
        else if (b.category === "streak") liveProg = maxStreak;

        const isEarned = b.unlocked || liveProg >= b.target;
        return {
          ...b,
          progress: Math.min(b.target, liveProg),
          unlocked: isEarned,
        };
      })
    );
    setTimeout(() => setChecking(false), 450);
  }, []);

  useEffect(() => {
    checkAndSyncBadges();
  }, [checkAndSyncBadges]);

  const handleToggleUnlock = (badgeId) => {
    setBadges((prev) =>
      prev.map((b) =>
        b.id === badgeId
          ? {
              ...b,
              unlocked: !b.unlocked,
              progress: !b.unlocked ? b.target : b.progress,
            }
          : b
      )
    );
  };

  const earnedBadges = useMemo(
    () => badges.filter((b) => b.unlocked),
    [badges]
  );

  const kpis = useMemo(() => {
    return {
      total: earnedBadges.length,
      gold: earnedBadges.filter((b) => b.tier === "gold").length,
      silver: earnedBadges.filter((b) => b.tier === "silver").length,
      bronze: earnedBadges.filter((b) => b.tier === "bronze").length,
    };
  }, [earnedBadges]);

  const filteredBadges = useMemo(() => {
    if (tierFilter === "all") return badges;
    return badges.filter((b) => b.tier === tierFilter);
  }, [badges, tierFilter]);

  const featuredBadge = earnedBadges[0] || badges.find((b) => b.id === "curos_gold") || badges[0];
  const popularBadge = badges.find((b) => b.id === "curos_bronze") || badges[2];

  return (
    <div className="h-screen w-full overflow-y-auto scroll-smooth bg-[#06050C] text-slate-100 font-sans p-5 md:p-6 space-y-6 selection:bg-amber-400 selection:text-black overflow-x-hidden pb-28">
      {/* ===================================================================
          1. HERO BANNER HEADER (Matches Screenshot 17)
      =================================================================== */}
      <header className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#26114B] via-[#3F1A74] to-[#591F8E] p-6 md:p-8 border border-purple-400/30 shadow-[0_0_50px_-10px_rgba(139,92,246,0.4)] flex flex-wrap items-center justify-between gap-4">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-300/70 to-transparent" />
        <div className="pointer-events-none absolute -right-12 -top-16 w-80 h-80 bg-amber-400/15 rounded-full blur-3xl" />

        <div className="relative z-10">
          <span className="text-[10px] font-extrabold uppercase tracking-[0.24em] text-amber-300 block">
            GAMIFICATION
          </span>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white mt-1 tracking-tight">
            Your Badge Collection
          </h1>
          <p className="text-xs md:text-sm text-purple-100/80 mt-1">
            Showcase your achievements and unlock new badges through learning.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-2.5">
          <button
            onClick={checkAndSyncBadges}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600 hover:opacity-95 text-slate-950 text-xs font-black shadow-[0_0_25px_rgba(245,158,11,0.45)] transition flex items-center gap-2 cursor-pointer"
          >
            <span className={checking ? "animate-spin" : ""}>↻</span>
            <span>{checking ? "Checking Vault..." : "Check for New"}</span>
          </button>
        </div>
      </header>

      {/* ===================================================================
          2. 4 METALLIC KPI CARDS (Total, Gold, Silver, Bronze — Click to Filter)
      =================================================================== */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            id: "all",
            label: "Total",
            value: kpis.total,
            sub: `${badges.length} In Vault Catalog`,
            icon: "🎖️",
            accent: "text-white",
            borderCls: "border-purple-500/25 hover:border-purple-400/60",
            iconBg: "bg-purple-500/15 border-purple-400/35 text-purple-300",
          },
          {
            id: "gold",
            label: "Gold",
            value: kpis.gold,
            sub: "24K Sovereign Tier (+500 XP)",
            icon: "🥇",
            accent: "text-amber-300",
            borderCls: "border-amber-400/35 hover:border-amber-400/80",
            iconBg: "bg-amber-500/15 border-amber-400/40 text-amber-300",
          },
          {
            id: "silver",
            label: "Silver",
            value: kpis.silver,
            sub: "Sterling Mirror Tier (+250 XP)",
            icon: "🥈",
            accent: "text-slate-200",
            borderCls: "border-slate-400/30 hover:border-slate-300/70",
            iconBg: "bg-slate-400/15 border-slate-300/40 text-slate-200",
          },
          {
            id: "bronze",
            label: "Bronze",
            value: kpis.bronze,
            sub: "Burnished Copper Tier (+100 XP)",
            icon: "🥉",
            accent: "text-orange-400",
            borderCls: "border-orange-500/30 hover:border-orange-400/70",
            iconBg: "bg-orange-500/15 border-orange-400/40 text-orange-300",
          },
        ].map((c) => {
          const isSelected = tierFilter === c.id && c.id !== "all";
          return (
            <div
              key={c.id}
              onClick={() =>
                setTierFilter(tierFilter === c.id ? "all" : c.id)
              }
              className={`cursor-pointer bg-[#110E1E] rounded-2xl p-5 border ${
                c.borderCls
              } ${
                isSelected ? "ring-2 ring-amber-400 bg-[#18132B]" : ""
              } shadow-[0_8px_30px_rgba(0,0,0,0.5)] transition-all hover:-translate-y-0.5 flex items-center justify-between`}
            >
              <div>
                <span className="text-xs font-bold text-slate-400 block">
                  {c.label}
                </span>
                <span className={`text-3xl font-black my-1 block ${c.accent}`}>
                  {c.value}
                </span>
                <span className="text-[11px] text-slate-500 font-semibold">
                  {c.sub}
                </span>
              </div>
              <div
                className={`w-12 h-12 rounded-2xl border flex items-center justify-center text-xl shadow-inner ${c.iconBg}`}
              >
                {c.icon}
              </div>
            </div>
          );
        })}
      </section>

      {/* ===================================================================
          3. EARNED BADGES RIBBON (When Unlocked > 0)
      =================================================================== */}
      <section className="space-y-2.5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-extrabold text-white flex items-center gap-2">
              <span>Earned Badges</span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-amber-500/20 text-amber-300 border border-amber-400/40">
                {earnedBadges.length} Unlocked
              </span>
            </h2>
          </div>
          {tierFilter !== "all" && (
            <button
              onClick={() => setTierFilter("all")}
              className="text-xs font-extrabold text-amber-300 hover:underline cursor-pointer"
            >
              Show All 15 Medals ✕
            </button>
          )}
        </div>

        {earnedBadges.length > 0 && (
          <div className="flex items-center gap-3 overflow-x-auto py-2 px-1">
            {earnedBadges.map((b) => (
              <div
                key={b.id}
                onClick={() => setInspectedBadge(b)}
                className="group cursor-pointer shrink-0 flex items-center gap-3 bg-gradient-to-r from-[#1A142D] to-[#110E1E] px-4 py-2.5 rounded-2xl border border-amber-400/40 shadow-[0_0_25px_-5px_rgba(245,158,11,0.3)]"
              >
                <MetallicMedalSVG
                  tier={b.tier}
                  category={b.category}
                  unlocked={true}
                  size={44}
                />
                <div>
                  <span className="text-xs font-extrabold text-white block">
                    {b.name}
                  </span>
                  <span className="text-[10px] font-black text-amber-300">
                    +{b.xp} XP • Equipped
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ===================================================================
          4. AVAILABLE TO EARN — 5x3 REALISTIC 3D METALLIC MEDAL MATRIX
      =================================================================== */}
      <section className="space-y-3.5">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-extrabold text-white">
            Available to Earn
          </h2>
          <span className="text-xs text-slate-400">
            Click any metallic medal to inspect in 3D or equip to your gallery
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {filteredBadges.map((badge) => {
            const tierBorder =
              badge.tier === "gold"
                ? "border-amber-400/35 hover:border-amber-300 bg-gradient-to-b from-[#1A150E] via-[#110E1B] to-[#0B0914]"
                : badge.tier === "silver"
                ? "border-slate-400/30 hover:border-slate-200 bg-gradient-to-b from-[#141824] via-[#100E1B] to-[#0B0914]"
                : "border-orange-500/30 hover:border-orange-400 bg-gradient-to-b from-[#1B120E] via-[#100E1B] to-[#0B0914]";

            const xpBadgeStyle =
              badge.tier === "gold"
                ? "bg-amber-400/20 text-amber-300 border-amber-400/50"
                : badge.tier === "silver"
                ? "bg-slate-300/15 text-slate-200 border-slate-300/40"
                : "bg-orange-500/20 text-orange-300 border-orange-400/40";

            const pct = Math.min(
              100,
              Math.round((badge.progress / Math.max(1, badge.target)) * 100)
            );

            return (
              <div
                key={badge.id}
                onClick={() => setInspectedBadge(badge)}
                className={`group cursor-pointer relative overflow-hidden rounded-2xl p-5 border ${tierBorder} shadow-[0_10px_30px_rgba(0,0,0,0.55)] hover:shadow-[0_0_35px_rgba(245,158,11,0.22)] hover:-translate-y-1 transition-all duration-300 flex flex-col items-center text-center justify-between min-h-[210px]`}
              >
                {/* Top Status Pill */}
                <div className="w-full flex items-center justify-between text-[10px] font-extrabold">
                  <span className="uppercase tracking-wider text-slate-400">
                    {badge.category}
                  </span>
                  {badge.unlocked ? (
                    <span className="text-emerald-400">✓ Unlocked</span>
                  ) : (
                    <span className="text-slate-500">
                      {badge.progress}/{badge.target}
                    </span>
                  )}
                </div>

                {/* 3D Metallic Medal */}
                <div className="my-2">
                  <MetallicMedalSVG
                    tier={badge.tier}
                    category={badge.category}
                    unlocked={badge.unlocked}
                    size={88}
                  />
                </div>

                {/* Title & XP Footer */}
                <div className="w-full space-y-2">
                  <h3 className="text-xs font-extrabold text-white group-hover:text-amber-200 transition truncate">
                    {badge.name}
                  </h3>

                  <div className="w-full h-1.5 rounded-full bg-black/60 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        badge.tier === "gold"
                          ? "bg-gradient-to-r from-amber-500 to-yellow-300"
                          : badge.tier === "silver"
                          ? "bg-gradient-to-r from-slate-400 to-white"
                          : "bg-gradient-to-r from-orange-600 to-amber-400"
                      }`}
                      style={{ width: `${Math.max(12, pct)}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-center gap-2 pt-0.5">
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-black border ${xpBadgeStyle}`}
                    >
                      +{badge.xp} XP
                    </span>
                    <span className="text-[10px] font-bold text-slate-400">
                      {badge.progress}/{badge.target}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ===================================================================
          5. BOTTOM BENTO: BADGE GALLERY (LEFT 8 COLS) + FEATURED & POPULAR (RIGHT 4 COLS)
      =================================================================== */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* LEFT 8 COLS: INTERACTIVE 3D TROPHY GALLERY PEDESTAL */}
        <div
          className={`${
            isGalleryFullScreen
              ? "fixed inset-4 z-50 bg-[#080711] p-8 overflow-y-auto"
              : "lg:col-span-8 bg-[#110E1E] p-6"
          } rounded-3xl border border-purple-500/25 shadow-[0_10px_40px_rgba(0,0,0,0.6)] flex flex-col justify-between relative overflow-hidden`}
        >
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-amber-500/10 to-transparent" />

          <div className="flex items-center justify-between relative z-10 mb-4">
            <div className="flex items-center gap-2">
              <span className="text-base">🎖️</span>
              <h3 className="text-base font-extrabold text-white">
                Badge Gallery
              </h3>
            </div>
            <button
              onClick={() => setIsGalleryFullScreen(!isGalleryFullScreen)}
              className="px-3 py-1.5 rounded-xl bg-purple-500/15 hover:bg-purple-500/30 border border-purple-400/35 text-xs font-extrabold text-purple-200 transition cursor-pointer"
            >
              {isGalleryFullScreen ? "✕ Exit Full Screen" : "⛶ Full Screen"}
            </button>
          </div>

          {/* 3D Illuminated Pedestal Showcase */}
          <div className="my-auto py-6 relative z-10">
            <div className="text-center mb-5">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-300 bg-amber-500/10 border border-amber-400/30 px-3 py-1 rounded-full">
                {earnedBadges.length > 0
                  ? `${earnedBadges.length} Unlocked Medals on Pedestal`
                  : "Interactive 24K Sovereign Gold Preview Pedestal"}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 items-center justify-items-center">
              {(earnedBadges.length > 0
                ? earnedBadges
                : badges.filter((b) => b.tier === "gold")
              ).map((b) => (
                <div
                  key={b.id}
                  onClick={() => setInspectedBadge(b)}
                  className="group cursor-pointer flex flex-col items-center p-3 rounded-2xl bg-[#080711]/80 hover:bg-[#19142B] border border-white/5 hover:border-amber-400/50 transition"
                >
                  <MetallicMedalSVG
                    tier={b.tier}
                    category={b.category}
                    unlocked={true}
                    size={74}
                  />
                  <span className="text-[11px] font-extrabold text-white mt-2 text-center">
                    {b.name}
                  </span>
                  <span className="text-[10px] font-black text-amber-400">
                    +{b.xp} XP
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs text-slate-400 relative z-10">
            <span>
              {earnedBadges.length === 0
                ? "Click any medal above to unlock & equip it to your personal showcase."
                : `Total Showcase Value: ${earnedBadges.reduce(
                    (s, b) => s + b.xp,
                    0
                  )} XP`}
            </span>
            <span className="text-amber-300 font-bold">3D Metallic Shaders Active</span>
          </div>
        </div>

        {/* RIGHT 4 COLS: FEATURED BADGE + MOST POPULAR BADGE */}
        <div className="lg:col-span-4 flex flex-col gap-5">
          {/* Card 1: Featured Badge */}
          <div
            onClick={() => setInspectedBadge(featuredBadge)}
            className="group cursor-pointer flex-1 bg-gradient-to-b from-[#17132A] to-[#0E0B1A] rounded-3xl p-5 border border-amber-400/35 shadow-[0_10px_30px_rgba(0,0,0,0.5)] flex flex-col items-center justify-between text-center relative overflow-hidden"
          >
            <span className="text-xs font-extrabold uppercase tracking-wider text-amber-300">
              Featured Badge
            </span>
            <div className="my-2">
              <MetallicMedalSVG
                tier={featuredBadge.tier}
                category={featuredBadge.category}
                unlocked={true}
                size={84}
              />
            </div>
            <div>
              <h4 className="text-sm font-extrabold text-white">
                {earnedBadges.length > 0
                  ? featuredBadge.name
                  : `Spotlight: ${featuredBadge.name}`}
              </h4>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {featuredBadge.desc}
              </p>
              <span className="inline-block mt-2 px-3 py-0.5 rounded-full text-[11px] font-black bg-amber-500/20 text-amber-300 border border-amber-400/40">
                +{featuredBadge.xp} XP
              </span>
            </div>
          </div>

          {/* Card 2: Most Popular Badge */}
          <div
            onClick={() => setInspectedBadge(popularBadge)}
            className="group cursor-pointer flex-1 bg-gradient-to-br from-[#4C1D95] via-[#6D28D9] to-[#4338CA] rounded-3xl p-5 border border-purple-300/40 shadow-[0_0_35px_rgba(139,92,246,0.35)] flex flex-col items-center justify-between text-center relative overflow-hidden"
          >
            <span className="text-xs font-extrabold uppercase tracking-wider text-amber-200 flex items-center gap-1.5">
              <span>⭐</span> Most Popular Badge
            </span>
            <div className="my-1">
              <MetallicMedalSVG
                tier={popularBadge.tier}
                category={popularBadge.category}
                unlocked={true}
                size={76}
              />
            </div>
            <div>
              <h4 className="text-sm font-extrabold text-white">
                {popularBadge.name}
              </h4>
              <span className="inline-block mt-1.5 px-3 py-0.5 rounded-full text-[10px] font-black bg-black/35 text-amber-300 border border-white/20">
                +{popularBadge.xp} XP • Fast-Track Unlock
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 3D MEDAL INSPECTION MODAL */}
      <MedalInspectionModal
        badge={inspectedBadge}
        onClose={() => setInspectedBadge(null)}
        onToggleUnlock={handleToggleUnlock}
      />
    </div>
  );
}
