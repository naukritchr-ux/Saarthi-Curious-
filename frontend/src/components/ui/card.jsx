This ** `CuroManagement.jsx` ** implements your wireframe layout in a ** Digital + Celestial ** theme and directly integrates the 15 - medal 5×3 rule engine and photorealistic 3D live - shining metallic medal renderer from your Rewards tab:

* Row 1 — Celestial Command Banner: Deep astral obsidian shell framed by a luminous sapphire - gold orbital rim, twinkling starfield coordinates, live economy telemetry status, and a 1 - click sync control.


* Row 2 — 4 Digital Live - Glow KPI Cards: Built with the same live - moving base gradients, breathing neon borders, and glowing digital readouts as Streak Management for ** Total Curos in Circulation **, ** Active Curo Holders **, ** Shining Medals Unlocked **, and ** Avg Curos / Holder **.


* Row 3 — 3 Interactive Command Tabs(1, 2, 3):


* ** Tab 1(`Curo Management`):** Previews active program payouts(`Client Relationships`, etc.) and earning rules; clicking opens a full ** Curo Rules & Program Config Editor ** (edit payouts, add programs, toggle automated rules, or view Team Leader subordinate totals).
* ** Tab 2(`Rewards Management`):** Displays ** mini live - shining 3D Gold, Silver, and Bronze medals directly inside the tab **; clicking opens the ** 15 - Medal Rules Engine Editor ** covering all Bronze, Silver, and Gold badges across Application, Completion, Curos, Retention, and Streak—edits recalculate unlocked medals across every user live.


* ** Tab 3(`AI Assistance Live Model`):** Elevated slightly as in your sketch, auto - locating your uploaded PNG model in `src/` or`public/`(with click - to - swap PNG support and holographic fallback) floating inside dual orbital rings, plus a live insight ticker; clicking opens an interactive ** Celestial AI Economy Co - Pilot ** with real roster diagnostics and 1 - click bonus execution.




* Outside - Table`Curos` & `Medals` Switcher + Premium Vault Table: Two prominent toggle pills(`Curos` and`Medals`) sit outside the top of the table to sort and spotlight either Curo balances or shining medals while displaying ** both Curos and mini live - shining 3D medals ** inside every separate opaque user tab.



```jsx
/* eslint-disable react-hooks/set-state-in-effect */
import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import axios from "axios";
import {
  Coins,
  Users,
  Award,
  TrendingUp,
  Search,
  RefreshCw,
  Sliders,
  Sparkles,
  X,
  Plus,
  Minus,
  Edit3,
  Send,
  Orbit,
  Crown,
  ChevronRight,
  RotateCcw,
  Upload,
  Zap,
  ShieldCheck,
} from "lucide-react";
import MainLayout from "../../layout/mainLayout";
import { API_BASE } from "../../config/api";

const API_BASE_URL =
  import.meta.env?.VITE_API_URL ||
  API_BASE ||
  (import.meta.env?.DEV
    ? "http://127.0.0.1:8000"
    : "https://saarthi-curious-00e8.onrender.com");

const STORAGE_KEY_AI_PNG = "saarthi_celestial_ai_model_png_v2";
const STORAGE_KEY_CURO_CFG = "saarthi_celestial_curo_cfg_v2";
const STORAGE_KEY_MEDAL_RULES = "saarthi_celestial_medal_rules_v2";
const STORAGE_KEY_CURO_LEDGER = "saarthi_celestial_curo_ledger_v2";

// Auto-discover uploaded AI model PNG placed in src/ or public/
const DISCOVERED_PNGS = import.meta.glob("/src/**/*.{png,webp}", {
  eager: true,
  import: "default",
});

function resolveUploadedModelSrc() {
  const found = Object.entries(DISCOVERED_PNGS).find(([path]) =>
    /ca_avatar|ai_model|assistant|bot|model|avatar/i.test(path)
  );
  return found ? found[1] : "/ca_avatar.png";
}

const DEFAULT_AI_PNG = resolveUploadedModelSrc();

// ============================================================================
// 1. 15 OFFICIAL BADGE DEFINITIONS & UNLOCK RULES (5x3 MATRIX FROM REWARDS TAB)
// ============================================================================
const DEFAULT_BADGE_RULES = [
  // ROW 1: BRONZE TIER
  {
    id: "app_bronze",
    name: "Application Bronze",
    curos: 30,
    target: 1,
    metricKey: "application",
    unit: "Application Check",
    tier: "bronze",
    bezelType: "classic_mirror",
    emblem: "trophy_cup",
    hasWings: false,
    category: "Application",
    enabled: true,
    ruleText: "Pass at least 1 practical application check assessment.",
  },
  {
    id: "comp_bronze",
    name: "Completion Bronze",
    curos: 50,
    target: 1,
    metricKey: "completion",
    unit: "Completed Program",
    tier: "bronze",
    bezelType: "scalloped_seal",
    emblem: "pillars_11",
    number: "11",
    hasWings: false,
    category: "Completion",
    enabled: true,
    ruleText: "Complete 1 full learning program track from start to finish.",
  },
  {
    id: "curos_bronze",
    name: "Curos Bronze",
    curos: 10,
    target: 100,
    metricKey: "curos",
    unit: "Curos",
    tier: "bronze",
    bezelType: "classic_mirror",
    emblem: "curo_crest",
    hasWings: false,
    category: "Curos",
    enabled: true,
    ruleText: "Accumulate 100 Curos in your personal learning treasury.",
  },
  {
    id: "ret_bronze",
    name: "Retention Bronze",
    curos: 30,
    target: 3,
    metricKey: "retention",
    unit: "Retention Checks",
    tier: "bronze",
    bezelType: "concentric_ring",
    emblem: "shield_check",
    hasWings: false,
    category: "Retention",
    enabled: true,
    ruleText: "Maintain verified retention across 3 module assessments.",
  },
  {
    id: "strk_bronze",
    name: "Streak Bronze",
    curos: 10,
    target: 3,
    metricKey: "streak",
    unit: "Streak Days",
    tier: "bronze",
    bezelType: "classic_mirror",
    emblem: "flame_relief",
    hasWings: false,
    category: "Streak",
    enabled: true,
    ruleText: "Maintain an active learning streak for 3 consecutive days.",
  },
  // ROW 2: GOLD TIER
  {
    id: "comp_gold",
    name: "Completion Gold",
    curos: 200,
    target: 10,
    metricKey: "completion",
    unit: "Completed Programs",
    tier: "gold",
    bezelType: "scalloped_seal",
    emblem: "open_book",
    hasWings: true,
    category: "Completion",
    enabled: true,
    ruleText: "Graduate from 10 complete enterprise learning programs.",
  },
  {
    id: "app_gold",
    name: "Application Gold",
    curos: 150,
    target: 10,
    metricKey: "application",
    unit: "Application Checks",
    tier: "gold",
    bezelType: "classic_mirror",
    emblem: "trophy_cup",
    hasWings: true,
    category: "Application",
    enabled: true,
    ruleText: "Achieve mastery across 10 practical application evaluations.",
  },
  {
    id: "curos_gold",
    name: "Curos Gold",
    curos: 100,
    target: 1000,
    metricKey: "curos",
    unit: "Curos",
    tier: "gold",
    bezelType: "classic_mirror",
    emblem: "curo_crest",
    hasWings: true,
    category: "Curos",
    enabled: true,
    ruleText: "Accumulate 1,000+ Curos in your learning treasury.",
  },
  {
    id: "ret_gold",
    name: "Retention Gold",
    curos: 150,
    target: 15,
    metricKey: "retention",
    unit: "Retention Checks",
    tier: "gold",
    bezelType: "concentric_ring",
    emblem: "shield_check",
    hasWings: false,
    category: "Retention",
    enabled: true,
    ruleText: "Demonstrate 90%+ long-term retention across 15 evaluations.",
  },
  {
    id: "strk_gold",
    name: "Streak Gold",
    curos: 150,
    target: 30,
    metricKey: "streak",
    unit: "Streak Days",
    tier: "gold",
    bezelType: "scalloped_seal",
    emblem: "flame_relief",
    hasWings: true,
    category: "Streak",
    enabled: true,
    ruleText: "Complete a 30-day consecutive learning inferno streak.",
  },
  // ROW 3: SILVER TIER
  {
    id: "app_silver",
    name: "Application Silver",
    curos: 75,
    target: 5,
    metricKey: "application",
    unit: "Application Checks",
    tier: "silver",
    bezelType: "scalloped_seal",
    emblem: "trophy_cup",
    hasWings: false,
    category: "Application",
    enabled: true,
    ruleText: "Pass 5 practical application checks with verified accuracy.",
  },
  {
    id: "comp_silver",
    name: "Completion Silver",
    curos: 100,
    target: 5,
    metricKey: "completion",
    unit: "Completed Programs",
    tier: "silver",
    bezelType: "scalloped_seal",
    emblem: "number_10",
    number: "10",
    hasWings: false,
    category: "Completion",
    enabled: true,
    ruleText: "Complete 5 core curriculum programs with certification.",
  },
  {
    id: "curos_silver",
    name: "Curos Silver",
    curos: 50,
    target: 500,
    metricKey: "curos",
    unit: "Curos",
    tier: "silver",
    bezelType: "classic_mirror",
    emblem: "curo_crest",
    hasWings: false,
    category: "Curos",
    enabled: true,
    ruleText: "Accumulate 500 Curos through active learning milestones.",
  },
  {
    id: "ret_silver",
    name: "Retention Silver",
    curos: 75,
    target: 7,
    metricKey: "retention",
    unit: "Retention Checks",
    tier: "silver",
    bezelType: "concentric_ring",
    emblem: "shield_check",
    hasWings: false,
    category: "Retention",
    enabled: true,
    ruleText: "Maintain an 80%+ retention score across 7 evaluations.",
  },
  {
    id: "strk_silver",
    name: "Streak Silver",
    curos: 50,
    target: 10,
    metricKey: "streak",
    unit: "Streak Days",
    tier: "silver",
    bezelType: "classic_mirror",
    emblem: "flame_relief",
    hasWings: true,
    category: "Streak",
    enabled: true,
    ruleText: "Complete a 10-day consecutive learning streak.",
  },
];

// ============================================================================
// 2. DEFAULT CURO MANAGEMENT CONFIGURATION (PROGRAMS & AUTOMATED RULES)
// ============================================================================
const DEFAULT_CURO_CONFIG = {
  programs: [
    {
      id: "prog_client_rel",
      name: "Client Relationships",
      rewardAmount: 85,
      active: true,
      description: "Granted upon full program completion and verified quiz pass.",
    },
    {
      id: "prog_leadership",
      name: "Leadership Foundations",
      rewardAmount: 120,
      active: true,
      description: "Awarded on completing leadership track milestones.",
    },
  ],
  rules: [
    {
      id: "rule_app_check",
      title: "Application Check Approval",
      reward: 35,
      trigger: "Per approved practical check",
      enabled: true,
    },
    {
      id: "rule_streak_3d",
      title: "3-Day Streak Ignition Bonus",
      reward: 15,
      trigger: "When streak reaches 3 consecutive days",
      enabled: true,
    },
    {
      id: "rule_retention_80",
      title: "Retention Mastery Checkpoint (≥80%)",
      reward: 30,
      trigger: "Per verified retention evaluation",
      enabled: true,
    },
    {
      id: "rule_subordinate_share",
      title: "Team Leader Subordinate Dividend",
      reward: 10,
      trigger: "10% bonus mirror on team completions",
      enabled: true,
    },
  ],
};

// ============================================================================
// 3. FALLBACK ROSTER (SYNCED WITH PLATFORM SNAPSHOT)
// ============================================================================
const INITIAL_USERS = [
  {
    id: 1,
    name: "Sasuke Uchiha",
    role: "Team Leader",
    franchise_partner: "-",
    curos: 520,
    completion: 10,
    application: 10,
    retention: 8,
    streak: 12,
  },
  {
    id: 2,
    name: "Atharva Lohar",
    role: "Franchise Employee",
    franchise_partner: "Sasuke Uchiha",
    curos: 365,
    completion: 5,
    application: 5,
    retention: 4,
    streak: 10,
  },
  {
    id: 3,
    name: "Anuj Jadhav",
    role: "Master Admin",
    franchise_partner: "-",
    curos: 145,
    completion: 2,
    application: 2,
    retention: 3,
    streak: 4,
  },
  {
    id: 4,
    name: "Lav Chokhani",
    role: "Franchise Partner",
    franchise_partner: "Vedika Tolani",
    curos: 110,
    completion: 1,
    application: 2,
    retention: 3,
    streak: 3,
  },
  {
    id: 5,
    name: "MOUSUME BARICK",
    role: "Team Leader",
    franchise_partner: "-",
    curos: 85,
    completion: 1,
    application: 1,
    retention: 2,
    streak: 5,
  },
  {
    id: 6,
    name: "Vedika Tolani",
    role: "Team Leader",
    franchise_partner: "-",
    curos: 60,
    completion: 1,
    application: 1,
    retention: 1,
    streak: 2,
  },
  {
    id: 7,
    name: "Mama Singh",
    role: "Franchise Employee",
    franchise_partner: "-",
    curos: 10,
    completion: 0,
    application: 1,
    retention: 0,
    streak: 1,
  },
  {
    id: 8,
    name: "Shreya Jain",
    role: "Franchise Partner",
    franchise_partner: "-",
    curos: 0,
    completion: 0,
    application: 0,
    retention: 0,
    streak: 0,
  },
  {
    id: 9,
    name: "Priyanka Panjwani",
    role: "Franchise Developer",
    franchise_partner: "-",
    curos: 0,
    completion: 0,
    application: 0,
    retention: 0,
    streak: 0,
  },
  {
    id: 10,
    name: "Sneha Jaiswal",
    role: "Head Office Staff",
    franchise_partner: "-",
    curos: 0,
    completion: 0,
    application: 0,
    retention: 0,
    streak: 0,
  },
  {
    id: 11,
    name: "Amy Kaul",
    role: "Franchise Partner",
    franchise_partner: "-",
    curos: 0,
    completion: 0,
    application: 0,
    retention: 0,
    streak: 0,
  },
  {
    id: 12,
    name: "Surbhi Jain",
    role: "Team Leader",
    franchise_partner: "-",
    curos: 0,
    completion: 0,
    application: 0,
    retention: 0,
    streak: 0,
  },
];

// ============================================================================
// 4. LIVE-SHINING PHOTOREALISTIC 3D METALLIC MEDAL ENGINE (FULL + MINI)
// ============================================================================
function LiveShiningMetallicMedalSVG({
  badge,
  size = 44,
  showRibbon = true,
  isEarned = true,
}) {
  const {
    tier = "gold",
    bezelType = "classic_mirror",
    emblem = "trophy_cup",
    number,
    hasWings = false,
  } = badge;

  const uid = useMemo(
    () => `${ badge.id } -${ Math.random().toString(36).slice(2, 7) } `,
    [badge.id]
  );

  const palettes = {
    gold: {
      bezel: ["#FFFBEB", "#FDE047", "#CA8A04", "#3B1703", "#FACC15", "#FEF9C3", "#78350F"],
      dish: ["#FFFBEB", "#FDE047", "#D97706", "#78350F", "#3B1703"],
      lathe: ["#713F12", "#CA8A04", "#FEF9C3", "#FFFFFF", "#FACC15", "#854D0E", "#FDE047"],
      leafLight: "#FFFBEB",
      leafMid: "#FACC15",
      leafDark: "#713F12",
      deepShadow: "#271001",
      halo: "rgba(250, 204, 21, 0.54)",
    },
    silver: {
      bezel: ["#FFFFFF", "#F1F5F9", "#94A3B8", "#0F172A", "#CBD5E1", "#FFFFFF", "#334155"],
      dish: ["#FFFFFF", "#E2E8F0", "#94A3B8", "#475569", "#0F172A"],
      lathe: ["#1E293B", "#94A3B8", "#FFFFFF", "#FFFFFF", "#CBD5E1", "#334155", "#F1F5F9"],
      leafLight: "#FFFFFF",
      leafMid: "#CBD5E1",
      leafDark: "#1E293B",
      deepShadow: "#090D16",
      halo: "rgba(226, 232, 240, 0.5)",
    },
    bronze: {
      bezel: ["#FFF7ED", "#FDBA74", "#EA580C", "#360902", "#FB923C", "#FFEDD5", "#7C2D12"],
      dish: ["#FFF7ED", "#FDBA74", "#C2410C", "#7C2D12", "#270802"],
      lathe: ["#431407", "#C2410C", "#FFEDD5", "#FFFFFF", "#FB923C", "#7C2D12", "#FDBA74"],
      leafLight: "#FFF7ED",
      leafMid: "#FB923C",
      leafDark: "#431407",
      deepShadow: "#210601",
      halo: "rgba(251, 146, 60, 0.48)",
    },
  };

  const p = palettes[tier] || palettes.gold;

  const scallopedStarPoints = useMemo(() => {
    const pts = [];
    const spikes = 26;
    for (let i = 0; i < spikes * 2; i++) {
      const r = i % 2 === 0 ? 52 : 47.5;
      const a = (i * Math.PI) / spikes;
      pts.push(
        `${ (80 + r * Math.cos(a)).toFixed(1) },${ (102 + r * Math.sin(a)).toFixed(1) } `
      );
    }
    return pts.join(" ");
  }, []);

  const laurelLeaves = [
    { cx: -15, cy: 21, ang: -46, s: 0.88 },
    { cx: -22, cy: 13, ang: -26, s: 0.96 },
    { cx: -26, cy: 3, ang: -8, s: 1.0 },
    { cx: -27, cy: -7, ang: 12, s: 1.0 },
    { cx: -24, cy: -17, ang: 30, s: 0.94 },
    { cx: -18, cy: -25, ang: 48, s: 0.86 },
  ];

  const viewBox = showRibbon ? "0 0 160 168" : "24 46 112 112";

  return (
    <div
      className="relative inline-flex items-center justify-center select-none shrink-0"
      style={{ width: size, height: size }}
      title={`${ badge.name } (+${ badge.curos } Curos)`}
    >
      <div
        className={`pointer - events - none absolute inset - 0.5 rounded - full blur - md transition - opacity ${
  isEarned ? "opacity-90" : "opacity-25"
} `}
        style={{ background: p.halo }}
      />

      <svg
        viewBox={viewBox}
        className={`w - full h - full relative z - 10 overflow - visible drop - shadow - [0_6px_12px_rgba(0, 0, 0, 0.88)] ${
  !isEarned ? "opacity-45 grayscale" : ""
} `}
      >
        <defs>
          <linearGradient id={`bzl - ${ uid } `} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={p.bezel[0]} />
            <stop offset="18%" stopColor={p.bezel[1]} />
            <stop offset="38%" stopColor={p.bezel[2]} />
            <stop offset="54%" stopColor={p.bezel[3]} />
            <stop offset="72%" stopColor={p.bezel[4]} />
            <stop offset="88%" stopColor={p.bezel[5]} />
            <stop offset="100%" stopColor={p.bezel[6]} />
          </linearGradient>
          <radialGradient id={`dsh - ${ uid } `} cx="30%" cy="25%" r="78%">
            <stop offset="0%" stopColor={p.dish[0]} />
            <stop offset="32%" stopColor={p.dish[1]} />
            <stop offset="68%" stopColor={p.dish[2]} />
            <stop offset="90%" stopColor={p.dish[3]} />
            <stop offset="100%" stopColor={p.dish[4]} />
          </radialGradient>
          <linearGradient id={`lth - ${ uid } `} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={p.lathe[0]} />
            <stop offset="22%" stopColor={p.lathe[1]} />
            <stop offset="46%" stopColor={p.lathe[3]} />
            <stop offset="68%" stopColor={p.lathe[4]} />
            <stop offset="100%" stopColor={p.lathe[6]} />
          </linearGradient>
          <linearGradient id={`lf - ${ uid } `} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={p.leafLight} />
            <stop offset="48%" stopColor={p.leafMid} />
            <stop offset="100%" stopColor={p.leafDark} />
          </linearGradient>
          <linearGradient id={`sweep - ${ uid } `} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0" />
            <stop offset="44%" stopColor="#FFFFFF" stopOpacity="0.18" />
            <stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.92" />
            <stop offset="56%" stopColor="#FFFFFF" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </linearGradient>
          <clipPath id={`coinClip - ${ uid } `}>
            <circle cx="80" cy="102" r="51" />
          </clipPath>
        </defs>

        {/* Woven Red-White-Blue V-Ribbon & Metal Bail */}
        {showRibbon && (
          <g>
            <polygon points="38,2 66,42 56,46 26,2" fill="#1E40AF" />
            <polygon points="45,2 71,42 63,44 36,2" fill="#F8FAFC" />
            <polygon points="53,2 77,42 70,43 45,2" fill="#DC2626" />
            <polygon points="107,2 83,42 90,43 115,2" fill="#DC2626" />
            <polygon points="115,2 89,42 97,44 124,2" fill="#F8FAFC" />
            <polygon points="122,2 94,42 104,46 134,2" fill="#1E40AF" />
            <rect
              x="62"
              y="33"
              width="36"
              height="14"
              rx="4"
              fill="none"
              stroke={`url(#bzl - ${ uid })`}
              strokeWidth="5"
            />
          </g>
        )}

        {/* Optional Victory Wings */}
        {hasWings && showRibbon && (
          <g fill={`url(#bzl - ${ uid })`} stroke={p.leafLight} strokeWidth="0.7">
            <path d="M32,88 C10,76 2,54 1,34 C15,44 28,58 38,70 Z" />
            <path d="M30,98 C8,90 1,72 0,54 C14,62 27,74 37,84 Z" />
            <path d="M128,88 C150,76 158,54 159,34 C145,44 132,58 122,70 Z" />
            <path d="M130,98 C152,90 159,72 160,54 C146,62 133,74 123,84 Z" />
          </g>
        )}

        {/* Stepped Metallic Coin Body */}
        <circle cx="81.5" cy="104.5" r="51.5" fill={p.deepShadow} />
        {bezelType === "scalloped_seal" ? (
          <polygon
            points={scallopedStarPoints}
            fill={`url(#bzl - ${ uid })`}
            stroke="#FFFFFF"
            strokeWidth="1.2"
          />
        ) : (
          <circle
            cx="80"
            cy="102"
            r="51.5"
            fill={`url(#bzl - ${ uid })`}
            stroke="#FFFFFF"
            strokeWidth="1.3"
          />
        )}

        <circle cx="80" cy="102" r="45" fill={p.deepShadow} />
        <circle
          cx="80"
          cy="102"
          r="43"
          fill={`url(#dsh - ${ uid })`}
          stroke={`url(#bzl - ${ uid })`}
          strokeWidth="2"
        />
        <circle
          cx="80"
          cy="102"
          r="40.8"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="0.9"
          opacity="0.8"
        />

        {bezelType === "concentric_ring" && (
          <circle
            cx="80"
            cy="102"
            r="35"
            fill="none"
            stroke={`url(#lth - ${ uid })`}
            strokeWidth="1.4"
            strokeDasharray="4 2.5"
            opacity="0.85"
          />
        )}

        {/* Embossed Laurel Wreath (Full Size) + Center 3D Sculpture */}
        <g transform="translate(80, 103)">
          {size >= 52 && (
            <>
              <path
                d="M-4,25 C-22,20 -29,4 -25,-16 C-23,-23 -19,-28 -14,-31"
                fill="none"
                stroke={`url(#lf - ${ uid })`}
                strokeWidth="2.2"
                strokeLinecap="round"
              />
              <path
                d="M4,25 C22,20 29,4 25,-16 C23,-23 19,-28 14,-31"
                fill="none"
                stroke={`url(#lf - ${ uid })`}
                strokeWidth="2.2"
                strokeLinecap="round"
              />
              {laurelLeaves.map((lf, i) => (
                <React.Fragment key={i}>
                  <g transform={`translate(${ lf.cx }, ${ lf.cy }) rotate(${ lf.ang }) scale(${ lf.s })`}>
                    <path
                      d="M0,0 C-4.5,-3 -9.2,-2 -10.5,0 C-9.2,2 -4.5,3 0,0 Z"
                      fill={`url(#lf - ${ uid })`}
                      stroke={p.leafDark}
                      strokeWidth="0.5"
                    />
                  </g>
                  <g transform={`translate(${- lf.cx}, ${ lf.cy }) rotate(${- lf.ang}) scale(${ lf.s })`}>
                    <path
                      d="M0,0 C4.5,-3 9.2,-2 10.5,0 C9.2,2 4.5,3 0,0 Z"
                      fill={`url(#lf - ${ uid })`}
                      stroke={p.leafDark}
                      strokeWidth="0.5"
                    />
                  </g>
                </React.Fragment>
              ))}
            </>
          )}

          {emblem === "trophy_cup" && (
            <>
              <path
                d="M-12,-18 C-20,-18 -20,-4 -11,-3 M12,-18 C20,-18 20,-4 11,-3"
                fill="none"
                stroke={`url(#lth - ${ uid })`}
                strokeWidth="2.6"
                strokeLinecap="round"
              />
              <path
                d="M-13,-21 L13,-21 C13,-3 6.5,5 0,5 C-6.5,5 -13,-3 -13,-21 Z"
                fill={`url(#lth - ${ uid })`}
                stroke={p.leafDark}
                strokeWidth="0.9"
              />
              <path d="M-3,5 L3,5 L4.5,14 L-4.5,14 Z" fill={`url(#lth - ${ uid })`} />
              <rect x="-11" y="14" width="22" height="4.5" rx="1.5" fill={`url(#lth - ${ uid })`} />
            </>
          )}

          {emblem === "curo_crest" && (
            <>
              <polygon
                points="0,-22 5.5,-7 21,-7 8.5,3 13,18 0,9 -13,18 -8.5,3 -21,-7 -5.5,-7"
                fill={`url(#lth - ${ uid })`}
                stroke="#FFFFFF"
                strokeWidth="1"
              />
              <circle cx="0" cy="0" r="8" fill={`url(#dsh - ${ uid })`} stroke="#FFFFFF" strokeWidth="1" />
              <text x="0" y="4.2" textAnchor="middle" fill="#FFFFFF" fontSize="12" fontWeight="900">
                C
              </text>
            </>
          )}

          {emblem === "shield_check" && (
            <>
              <path
                d="M0,-20 L15,-12 L15,2 C15,12 0,19 0,19 C0,19 -15,12 -15,2 L-15,-12 Z"
                fill={`url(#lth - ${ uid })`}
                stroke="#FFFFFF"
                strokeWidth="1.2"
              />
              <polyline
                points="-6.5,0 -1.5,5.5 8,-5.5"
                fill="none"
                stroke={p.deepShadow}
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </>
          )}

          {emblem === "flame_relief" && (
            <>
              <path
                d="M0,-22 C8,-11 15,-3 13,8 C11,15 5.5,19 0,19 C-6.5,19 -13,13.5 -13,5.5 C-13,-2 -6.5,-6 -4,-13 C-2,-9 1,-7 0,-22 Z"
                fill={`url(#lth - ${ uid })`}
                stroke="#FFFFFF"
                strokeWidth="1.1"
              />
              <path
                d="M0,-6 C3.8,-1 7,3.5 5.2,9.5 C4.2,13.5 2,15.5 0,15.5 C-3.2,15.5 -5.5,12.5 -5.5,8.2 C-5.5,4 -2,1 0,-6 Z"
                fill="#FFFFFF"
                opacity="0.9"
              />
            </>
          )}

          {emblem === "pillars_11" && (
            <>
              <rect x="-8.5" y="-14" width="6" height="24" rx="1.5" fill={`url(#lth - ${ uid })`} stroke="#FFFFFF" strokeWidth="0.7" />
              <rect x="2.5" y="-14" width="6" height="24" rx="1.5" fill={`url(#lth - ${ uid })`} stroke="#FFFFFF" strokeWidth="0.7" />
              <rect x="-12" y="-17.5" width="24" height="3.5" rx="1" fill={`url(#lth - ${ uid })`} />
              <rect x="-12" y="10" width="24" height="3.5" rx="1" fill={`url(#lth - ${ uid })`} />
            </>
          )}

          {emblem === "open_book" && (
            <>
              <path
                d="M-15,-9 C-7,-13 0,-9 0,-9 C0,-9 7,-13 15,-9 L15,9 C7,5 0,9 0,9 C0,9 -7,5 -15,9 Z"
                fill={`url(#lth - ${ uid })`}
                stroke="#FFFFFF"
                strokeWidth="1.1"
              />
              <line x1="0" y1="-9" x2="0" y2="9" stroke={p.deepShadow} strokeWidth="1.6" />
              <polygon points="0,-22 2.5,-15.5 9,-15.5 4,-11.5 6,-5.5 0,-9.5 -6,-5.5 -4,-11.5 -9,-15.5 -2.5,-15.5" fill="#FFFFFF" />
            </>
          )}

          {emblem === "number_10" && (
            <text
              x="0"
              y="7"
              textAnchor="middle"
              fill={`url(#lth - ${ uid })`}
              stroke="#FFFFFF"
              strokeWidth="0.7"
              fontSize="24"
              fontWeight="900"
            >
              {number || "10"}
            </text>
          )}
        </g>

        {/* Live Specular Sheen Sweep */}
        {isEarned && (
          <g clipPath={`url(#coinClip - ${ uid })`}>
            <rect
              x="-90"
              y="40"
              width="75"
              height="140"
              fill={`url(#sweep - ${ uid })`}
              transform="rotate(28 80 102)"
              className="celestial-medal-sheen"
            />
          </g>
        )}

        {/* Twinkling Rim Sparkle */}
        {isEarned && (
          <g transform="translate(45, 68)" fill="#FFFFFF" className="animate-pulse">
            <polygon points="0,-7.5 1.7,-1.7 7.5,0 1.7,1.7 0,7.5 -1.7,1.7 -7.5,0 -1.7,-1.7" />
          </g>
        )}
      </svg>
    </div>
  );
}

// ============================================================================
// 5. LIVE CELESTIAL AI MODEL DISPLAY (USES UPLOADED PNG IN ANTIGRAVITY)
// ============================================================================
function CelestialAiModelStage({ size = 104, allowUpload = false }) {
  const [src, setSrc] = useState(
    () => localStorage.getItem(STORAGE_KEY_AI_PNG) || DEFAULT_AI_PNG
  );
  const [imgErr, setImgErr] = useState(false);
  const inputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (typeof ev.target?.result === "string") {
        setSrc(ev.target.result);
        setImgErr(false);
        try {
          localStorage.setItem(STORAGE_KEY_AI_PNG, ev.target.result);
        } catch {
          // Ignore quota
        }
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div
      onClick={(e) => {
        if (allowUpload) {
          e.stopPropagation();
          inputRef.current?.click();
        }
      }}
      style={{ width: size, height: size }}
      title={allowUpload ? "Click to swap AI assistant PNG" : "Live Celestial AI Model"}
      className={`relative flex items - center justify - center shrink - 0 select - none ${
  allowUpload ? "cursor-pointer" : ""
} `}
    >
      {allowUpload && (
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
      )}

      {/* Dual Celestial Orbital Rings */}
      <div className="pointer-events-none absolute -inset-2 rounded-full border border-dashed border-cyan-300/45 animate-spin [animation-duration:18s]" />
      <div className="pointer-events-none absolute -inset-0.5 rounded-full border border-amber-300/35 animate-spin [animation-duration:12s] [animation-direction:reverse]" />
      <div className="pointer-events-none absolute inset-1 rounded-full bg-gradient-to-tr from-cyan-400/35 via-indigo-500/30 to-amber-300/30 blur-lg animate-pulse" />

      {/* Floating PNG Avatar */}
      <div className="relative z-10 w-full h-full flex items-center justify-center celestial-ai-float">
        {src && !imgErr ? (
          <img
            src={src}
            alt="Celestial AI Assistant Model"
            onError={() => setImgErr(true)}
            className="w-full h-full object-contain drop-shadow-[0_12px_24px_rgba(56,189,248,0.65)]"
          />
        ) : (
          <svg
            viewBox="0 0 120 120"
            className="w-full h-full drop-shadow-[0_10px_22px_rgba(56,189,248,0.65)]"
          >
            <defs>
              <linearGradient id="celBotShell" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#FFFFFF" />
                <stop offset="50%" stopColor="#BAE6FD" />
                <stop offset="100%" stopColor="#3B82F6" />
              </linearGradient>
              <linearGradient id="celBotCore" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#FEF08A" />
                <stop offset="100%" stopColor="#F59E0B" />
              </linearGradient>
            </defs>
            <ellipse cx="60" cy="14" rx="22" ry="5" fill="none" stroke="#38BDF8" strokeWidth="2.6" />
            <rect x="28" y="26" width="64" height="46" rx="20" fill="url(#celBotShell)" stroke="#FFFFFF" strokeWidth="1.6" />
            <rect x="36" y="36" width="48" height="24" rx="10" fill="#060A1A" stroke="#38BDF8" strokeWidth="1.6" />
            <circle cx="50" cy="48" r="5" fill="#38BDF8" />
            <circle cx="70" cy="48" r="5" fill="#38BDF8" />
            <circle cx="51.5" cy="46" r="1.8" fill="#FFFFFF" />
            <circle cx="71.5" cy="46" r="1.8" fill="#FFFFFF" />
            <path d="M40 76 L80 76 L73 102 C71 107 49 107 47 102 Z" fill="url(#celBotShell)" stroke="#FFFFFF" strokeWidth="1.4" />
            <circle cx="60" cy="90" r="7" fill="url(#celBotCore)" />
          </svg>
        )}
      </div>

      {allowUpload && (
        <span className="absolute -bottom-1 -right-1 z-20 w-6 h-6 rounded-full bg-cyan-400 text-slate-950 flex items-center justify-center shadow-lg border border-white">
          <Upload className="w-3 h-3" />
        </span>
      )}
    </div>
  );
}

// ============================================================================
// 6. MODAL FOR TAB 1: CURO MANAGEMENT RULES, PROGRAM RATES & TEAM LEADERS
// ============================================================================
function CuroRulesModal({
  isOpen,
  onClose,
  config,
  users,
  onUpdateProgram,
  onUpdateRule,
  onAddProgram,
  onReset,
}) {
  const [subTab, setSubTab] = useState("rules"); // 'rules' | 'leaders'
  const [newName, setNewName] = useState("");
  const [newAmt, setNewAmt] = useState("100");

  const leaderSummary = useMemo(() => {
    const map = {};
    users.forEach((u) => {
      if (u.franchise_partner && u.franchise_partner !== "-") {
        if (!map[u.franchise_partner]) {
          map[u.franchise_partner] = { name: u.franchise_partner, total: 0, count: 0 };
        }
        map[u.franchise_partner].total += u.curos;
        map[u.franchise_partner].count += 1;
      }
    });
    return Object.values(map).sort((a, b) => b.total - a.total);
  }, [users]);

  if (!isOpen) return null;

  const handleAdd = (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    onAddProgram({
      id: `prog_${ Date.now() } `,
      name: newName.trim(),
      rewardAmount: Math.max(5, Number(newAmt) || 50),
      active: true,
      description: "Custom program completion Curo treasury allocation.",
    });
    setNewName("");
    setNewAmt("100");
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/82 backdrop-blur-md p-4 overflow-y-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-3xl rounded-3xl p-6 bg-[#070B1E] border-2 border-[#FDE047] shadow-[0_0_60px_rgba(250,204,21,0.32),0_28px_70px_rgba(0,0,0,0.95)] space-y-5 my-auto"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/15 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl celestial-btn-gold flex items-center justify-center">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-[0.24em] text-[#FDE047] block">
                TAB 1 • CURO ECONOMY CONTROLLER
              </span>
              <h2 className="text-xl font-black text-white">
                Curo Management &amp; Earning Rules
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onReset}
              className="celestial-btn-slate px-3 py-2 rounded-xl text-[11px] font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="celestial-btn-slate w-9 h-9 rounded-xl flex items-center justify-center cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Sub-navigation */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSubTab("rules")}
            className={`px - 4 py - 2 rounded - xl text - xs font - black cursor - pointer ${
  subTab === "rules" ? "celestial-btn-gold" : "celestial-btn-slate"
} `}
          >
            Programs &amp; Earning Rules
          </button>
          <button
            type="button"
            onClick={() => setSubTab("leaders")}
            className={`px - 4 py - 2 rounded - xl text - xs font - black cursor - pointer ${
  subTab === "leaders" ? "celestial-btn-cyan" : "celestial-btn-slate"
} `}
          >
            Team Leader Subordinate Curos
          </button>
        </div>

        {subTab === "rules" ? (
          <div className="space-y-5 max-h-[500px] overflow-y-auto pr-1">
            {/* Program Curo Payouts */}
            <div className="space-y-3">
              <span className="text-xs font-black uppercase tracking-wider text-cyan-300 block">
                Program Curo Configuration
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {config.programs.map((prog) => (
                  <div
                    key={prog.id}
                    className="rounded-2xl p-4 bg-[#0B122C] border border-amber-400/55 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="text-sm font-black text-white">{prog.name}</h4>
                        <p className="text-[11px] text-slate-300 mt-0.5">
                          {prog.description}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateProgram(prog.id, { active: !prog.active })
                        }
                        className={`px - 2.5 py - 0.5 rounded - full text - [10px] font - black cursor - pointer ${
  prog.active
    ? "bg-emerald-400 text-slate-950"
    : "bg-slate-700 text-slate-300"
} `}
                      >
                        {prog.active ? "Active" : "Paused"}
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="5"
                        step="5"
                        value={prog.rewardAmount}
                        onChange={(e) =>
                          onUpdateProgram(prog.id, {
                            rewardAmount: Math.max(0, Number(e.target.value) || 0),
                          })
                        }
                        className="w-24 rounded-xl bg-[#050816] border border-amber-300/65 px-3 py-1.5 text-sm font-black text-amber-200 font-mono outline-none"
                      />
                      <span className="text-xs font-bold text-slate-300">Curos</span>
                      <div className="ml-auto flex gap-1">
                        {[50, 85, 120].map((v) => (
                          <button
                            key={v}
                            type="button"
                            onClick={() =>
                              onUpdateProgram(prog.id, { rewardAmount: v })
                            }
                            className={`px - 2 py - 1 rounded - lg text - [10px] font - black cursor - pointer ${
  prog.rewardAmount === v
    ? "bg-amber-400 text-slate-950"
    : "bg-white/10 text-slate-200 hover:bg-white/20"
} `}
                          >
                            {v}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <form onSubmit={handleAdd} className="flex flex-wrap items-center gap-2.5">
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Add new program track..."
                  className="flex-1 min-w-[180px] rounded-xl bg-[#050816] border border-white/20 focus:border-cyan-400 px-3.5 py-2 text-xs font-bold text-white outline-none"
                />
                <input
                  type="number"
                  min="5"
                  value={newAmt}
                  onChange={(e) => setNewAmt(e.target.value)}
                  className="w-24 rounded-xl bg-[#050816] border border-white/20 focus:border-amber-300 px-3 py-2 text-xs font-black text-amber-200 font-mono outline-none"
                />
                <button
                  type="submit"
                  className="celestial-btn-cyan px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Program</span>
                </button>
              </form>
            </div>

            {/* Automated Curo Rules */}
            <div className="space-y-2.5 pt-3 border-t border-white/15">
              <span className="text-xs font-black uppercase tracking-wider text-purple-300 block">
                Automated Curo Earning Rules
              </span>
              {config.rules.map((rule) => (
                <div
                  key={rule.id}
                  className="rounded-2xl p-3.5 bg-[#0A1128] border border-white/15 flex flex-wrap items-center justify-between gap-3"
                >
                  <div>
                    <h4 className="text-sm font-black text-white">{rule.title}</h4>
                    <p className="text-[11px] text-slate-400 font-semibold">
                      {rule.trigger}
                    </p>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <div className="flex items-center gap-1.5 bg-[#050816] border border-amber-300/50 rounded-xl px-2.5 py-1">
                      <span className="text-xs font-black text-amber-300">+</span>
                      <input
                        type="number"
                        min="0"
                        value={rule.reward}
                        onChange={(e) =>
                          onUpdateRule(rule.id, {
                            reward: Math.max(0, Number(e.target.value) || 0),
                          })
                        }
                        className="w-14 bg-transparent text-xs font-black text-white font-mono outline-none text-center"
                      />
                      <span className="text-[10px] font-bold text-slate-400">
                        Curos
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        onUpdateRule(rule.id, { enabled: !rule.enabled })
                      }
                      className={`px - 3 py - 1.5 rounded - xl text - [11px] font - black cursor - pointer ${
  rule.enabled
    ? "bg-emerald-400/20 text-emerald-300 border border-emerald-400/60"
    : "bg-slate-800 text-slate-400 border border-slate-600"
} `}
                    >
                      {rule.enabled ? "Enabled" : "Disabled"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-slate-300 font-semibold">
              Aggregated subordinate Curo earnings rolled up by Franchise Partner / Team Leader:
            </p>
            {leaderSummary.length === 0 ? (
              <div className="p-6 rounded-2xl bg-[#050816] border border-white/10 text-center text-xs text-slate-400">
                No subordinate partner mappings recorded yet.
              </div>
            ) : (
              leaderSummary.map((tl, idx) => (
                <div
                  key={tl.name}
                  className="rounded-2xl p-4 bg-[#0B122C] border border-cyan-400/45 flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-xl bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center">
                      #{idx + 1}
                    </span>
                    <div>
                      <h4 className="text-sm font-black text-white">{tl.name}</h4>
                      <span className="text-[11px] text-slate-400 font-semibold">
                        {tl.count} Subordinate(s)
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-base font-black text-emerald-300 font-mono block">
                      {tl.total} Curos
                    </span>
                    <span className="text-[10.5px] font-bold text-amber-200">
                      Avg {Math.round(tl.total / Math.max(1, tl.count))} / sub
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// 7. MODAL FOR TAB 2: REWARDS MANAGEMENT & 15-MEDAL RULES EDITOR
// ============================================================================
function RewardsRulesModal({
  isOpen,
  onClose,
  badgeRules,
  onUpdateBadge,
  onResetBadges,
}) {
  const [tierTab, setTierTab] = useState("all");
  const [editingId, setEditingId] = useState(null);

  if (!isOpen) return null;

  const visible = badgeRules.filter((b) =>
    tierTab === "all" ? true : b.tier === tierTab
  );

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/82 backdrop-blur-md p-4 overflow-y-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-4xl rounded-3xl p-6 bg-[#070B1E] border-2 border-[#C084FC] shadow-[0_0_60px_rgba(192,132,252,0.36),0_28px_70px_rgba(0,0,0,0.95)] space-y-5 my-auto"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/15 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl celestial-btn-purple flex items-center justify-center">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-[0.24em] text-purple-300 block">
                TAB 2 • 15 OFFICIAL MEDALS &amp; UNLOCK ENGINE
              </span>
              <h2 className="text-xl font-black text-white">
                Rewards &amp; Shining Medal Rules
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onResetBadges}
              className="celestial-btn-slate px-3 py-2 rounded-xl text-[11px] font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Rules</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="celestial-btn-slate w-9 h-9 rounded-xl flex items-center justify-center cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tier Filters */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: "all", label: `All(${ badgeRules.length })` },
              { id: "gold", label: "Sovereign Gold (5)" },
              { id: "silver", label: "Sterling Silver (5)" },
              { id: "bronze", label: "Burnished Bronze (5)" },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTierTab(t.id)}
                className={`px - 3.5 py - 1.5 rounded - xl text - xs font - black cursor - pointer ${
  tierTab === t.id ? "celestial-btn-gold" : "celestial-btn-slate"
} `}
              >
                {t.label}
              </button>
            ))}
          </div>
          <span className="text-[11px] font-bold text-cyan-300">
            Changes update user shining medals live
          </span>
        </div>

        {/* Editable Medal Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 max-h-[470px] overflow-y-auto pr-1">
          {visible.map((b) => {
            const isEditing = editingId === b.id;
            return (
              <div
                key={b.id}
                className={`rounded - 2xl p - 4 bg - [#0B1128] border transition space - y - 3 ${
  b.enabled
    ? b.tier === "gold"
      ? "border-amber-400/65"
      : b.tier === "silver"
        ? "border-slate-300/55"
        : "border-orange-400/55"
    : "border-white/10 opacity-55"
} `}
              >
                <div className="flex items-start gap-3">
                  <LiveShiningMetallicMedalSVG
                    badge={b}
                    size={62}
                    showRibbon={true}
                    isEarned={b.enabled}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-sm font-black text-white truncate">
                        {b.name}
                      </h4>
                      <button
                        type="button"
                        onClick={() => setEditingId(isEditing ? null : b.id)}
                        className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-[10.5px] font-black text-cyan-200 inline-flex items-center gap-1 cursor-pointer shrink-0"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>{isEditing ? "Done" : "Edit"}</span>
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 mt-1">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-amber-400/20 text-amber-200 border border-amber-400/40">
                        +{b.curos} Curos
                      </span>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-cyan-500/15 text-cyan-200 border border-cyan-400/35">
                        Target: {b.target} {b.unit}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-300 mt-1.5 leading-snug">
                      {b.ruleText}
                    </p>
                  </div>
                </div>

                {isEditing && (
                  <div className="pt-3 border-t border-white/15 space-y-2.5">
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-[9.5px] font-black uppercase text-slate-400 block mb-1">
                          Target ({b.metricKey})
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={b.target}
                          onChange={(e) =>
                            onUpdateBadge(b.id, {
                              target: Math.max(1, Number(e.target.value) || 1),
                            })
                          }
                          className="w-full rounded-lg bg-[#050816] border border-cyan-400/60 px-2.5 py-1.5 text-xs font-black text-white font-mono outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[9.5px] font-black uppercase text-slate-400 block mb-1">
                          Bonus Curos
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={b.curos}
                          onChange={(e) =>
                            onUpdateBadge(b.id, {
                              curos: Math.max(0, Number(e.target.value) || 0),
                            })
                          }
                          className="w-full rounded-lg bg-[#050816] border border-amber-400/60 px-2.5 py-1.5 text-xs font-black text-amber-200 font-mono outline-none"
                        />
                      </div>
                      <div className="flex flex-col justify-end">
                        <button
                          type="button"
                          onClick={() =>
                            onUpdateBadge(b.id, { enabled: !b.enabled })
                          }
                          className={`w - full py - 1.5 rounded - lg text - [11px] font - black cursor - pointer ${
  b.enabled
    ? "bg-emerald-400 text-slate-950"
    : "bg-rose-500/25 text-rose-200 border border-rose-400/50"
} `}
                        >
                          {b.enabled ? "Active ✓" : "Disabled"}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="text-[9.5px] font-black uppercase text-slate-400 block mb-1">
                        Rule Description
                      </label>
                      <input
                        type="text"
                        value={b.ruleText}
                        onChange={(e) =>
                          onUpdateBadge(b.id, { ruleText: e.target.value })
                        }
                        className="w-full rounded-lg bg-[#050816] border border-white/25 px-2.5 py-1.5 text-xs font-semibold text-white outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 8. MODAL FOR TAB 3: CELESTIAL AI CO-PILOT (DIAGNOSTICS + 1-CLICK EXECUTION)
// ============================================================================
function CelestialAiModal({
  isOpen,
  onClose,
  kpis,
  users,
  badgeRules,
  onBoostZeroBalance,
}) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    if (!isOpen) return;
    setMessages([
      {
        role: "ai",
        text: `Celestial Core online.Tracking ${ kpis.totalCuros.toLocaleString() } Curos across ${ kpis.activeHolders }/${kpis.totalUsers} active wallets and ${kpis.totalMedalsUnlocked} unlocked shining medals.`,
      },
    ]);
  }, [isOpen, kpis]);

if (!isOpen) return null;

const zeroUsersCount = users.filter((u) => u.curos === 0).length;

const quickPrompts = [
  "Who leads the shining medals leaderboard right now?",
  "Which learners are closest to unlocking Curos Bronze (100)?",
  "Analyze economy balance & zero-Curo risk.",
];

const handleAsk = (customPrompt) => {
  const q = (customPrompt || input).trim();
  if (!q) return;
  setInput("");

  const lower = q.toLowerCase();
  let reply = "";

  if (lower.includes("medal") || lower.includes("lead")) {
    const leaders = [...users]
      .sort((a, b) => b.earnedMedals.length - a.earnedMedals.length)
      .slice(0, 3)
      .map(
        (u) =>
          `${u.name} (${u.earnedMedals.length} medals • ${u.goldCount}G/${u.silverCount}S/${u.bronzeCount}B)`
      )
      .join(" | ");
    reply = `Top Medal Holders: ${leaders}. You can tune target difficulty anytime inside Tab 2 (Rewards Management).`;
  } else if (lower.includes("closest") || lower.includes("bronze")) {
    const bronzeRule = badgeRules.find((b) => b.id === "curos_bronze");
    const target = bronzeRule?.target || 100;
    const near = users
      .filter((u) => u.curos > 0 && u.curos < target)
      .map((u) => `${u.name} (${u.curos}/${target} Curos)`)
      .join(", ");
    reply = near
      ? `Learners closest to Curos Bronze (${target}): ${near}. Granting a small completion bonus will unlock their bronze crest immediately.`
      : `All funded learners have already reached ${target}+ Curos! Focus incentives on the ${zeroUsersCount} zero-balance accounts.`;
  } else {
    reply = `Participation stands at ${kpis.participationPct}% (${zeroUsersCount} accounts at 0 Curos). Use the 1-click starter grant below to ignite activity across inactive wallets.`;
  }

  setMessages((prev) => [
    ...prev,
    { role: "user", text: q },
    { role: "ai", text: reply },
  ]);
};

return (
  <div
    onClick={onClose}
    className="fixed inset-0 z-50 flex items-center justify-center bg-black/82 backdrop-blur-md p-4"
  >
    <div
      onClick={(e) => e.stopPropagation()}
      className="w-full max-w-2xl rounded-3xl p-6 bg-[#070B1E] border-2 border-[#38BDF8] shadow-[0_0_60px_rgba(56,189,248,0.36),0_28px_70px_rgba(0,0,0,0.95)] space-y-5"
    >
      <div className="flex items-center justify-between gap-4 border-b border-white/15 pb-4">
        <div className="flex items-center gap-4">
          <CelestialAiModelStage size={74} allowUpload={true} />
          <div>
            <span className="text-[10px] font-black uppercase tracking-[0.24em] text-[#38BDF8] block">
              TAB 3 • LIVE CELESTIAL AI ASSISTANT
            </span>
            <h2 className="text-xl font-black text-white">
              Economy &amp; Rewards Co-Pilot
            </h2>
            <p className="text-[11px] text-slate-300 font-semibold">
              Click the floating model to swap PNG • Ask live questions or run economy actions
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="celestial-btn-slate w-9 h-9 rounded-xl flex items-center justify-center cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Executable AI Action Strip */}
      {zeroUsersCount > 0 && (
        <div className="p-3.5 rounded-2xl bg-cyan-500/10 border border-cyan-400/50 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-bold text-cyan-100">
            <Zap className="w-4 h-4 text-[#FDE047] shrink-0" />
            <span>
              AI Recommendation: Grant +25 starter Curos to {zeroUsersCount}{" "}
              inactive account(s)
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              onBoostZeroBalance(25);
              onClose();
            }}
            className="celestial-btn-gold px-3.5 py-1.5 rounded-xl text-[11px] font-black cursor-pointer"
          >
            Execute +25 Boost
          </button>
        </div>
      )}

      {/* Quick Prompts */}
      <div className="space-y-2">
        {quickPrompts.map((p, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleAsk(p)}
            className="w-full text-left px-4 py-2.5 rounded-xl bg-[#0D1634] border border-cyan-400/45 hover:border-amber-300 text-xs font-bold text-slate-100 flex items-center justify-between cursor-pointer transition"
          >
            <span>{p}</span>
            <ChevronRight className="w-4 h-4 text-amber-300 shrink-0" />
          </button>
        ))}
      </div>

      {/* Chat Log */}
      <div className="space-y-2.5 max-h-52 overflow-y-auto pr-1">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`p-3.5 rounded-2xl text-xs leading-relaxed font-semibold ${m.role === "user"
                ? "ml-10 bg-purple-600/35 border border-purple-400/60 text-white"
                : "mr-6 bg-[#0B132B] border border-cyan-400/45 text-slate-100"
              }`}
          >
            {m.text}
          </div>
        ))}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleAsk();
        }}
        className="flex items-center gap-2 pt-2 border-t border-white/15"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask Celestial AI about Curos, medal thresholds, or user standings..."
          className="flex-1 rounded-xl bg-[#050816] border border-cyan-400/55 focus:border-amber-300 px-4 py-2.5 text-xs font-bold text-white outline-none"
        />
        <button
          type="submit"
          className="celestial-btn-gold px-4 py-2.5 rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Ask AI</span>
        </button>
      </form>
    </div>
  </div>
);
}

// ============================================================================
// 9. USER TREASURY & MEDAL VAULT MODAL (CLICK ANY USER TAB)
// ============================================================================
function UserTreasuryModal({ user, onClose, onAdjustCuros }) {
  const [deltaAmt, setDeltaAmt] = useState("25");
  if (!user) return null;

  const amt = Math.max(1, Number(deltaAmt) || 0);

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/82 backdrop-blur-md p-4 overflow-y-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl rounded-3xl p-6 bg-[#070B1E] border-2 border-[#FDE047] shadow-[0_0_55px_rgba(250,204,21,0.32),0_28px_70px_rgba(0,0,0,0.95)] space-y-5 my-auto"
      >
        <div className="flex items-start justify-between gap-3 border-b border-white/15 pb-4">
          <div>
            <span className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-300 block">
              LEARNER CURO &amp; SHINING MEDAL VAULT
            </span>
            <h3 className="text-xl font-black text-white mt-0.5">{user.name}</h3>
            <p className="text-xs text-slate-300 font-semibold mt-0.5">
              {user.role} • Partner: {user.franchise_partner || "-"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="celestial-btn-slate w-9 h-9 rounded-xl flex items-center justify-center cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="p-4 rounded-2xl bg-[#0B122C] border border-amber-400/55">
            <span className="text-[10px] font-black uppercase text-amber-300 block">
              Curos Balance
            </span>
            <span className="text-3xl font-black text-white font-mono mt-1 block">
              {user.curos}
            </span>
          </div>
          <div className="p-4 rounded-2xl bg-[#0B122C] border border-purple-400/55">
            <span className="text-[10px] font-black uppercase text-purple-300 block">
              Unlocked Medals
            </span>
            <span className="text-3xl font-black text-white font-mono mt-1 block">
              {user.earnedMedals.length}{" "}
              <span className="text-sm text-slate-400">/ 15</span>
            </span>
          </div>
        </div>

        {/* Earned Shining Medals Showcase */}
        <div className="space-y-2">
          <span className="text-[11px] font-black uppercase tracking-wider text-amber-200 block">
            Earned Shining Medals ({user.earnedMedals.length})
          </span>
          {user.earnedMedals.length === 0 ? (
            <div className="p-4 rounded-2xl bg-[#050816] border border-white/10 text-xs text-slate-400 font-semibold text-center">
              No medals unlocked yet — grant Curos below to unlock Curos Bronze automatically.
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-3 p-3.5 rounded-2xl bg-[#050816] border border-white/15">
              {user.earnedMedals.map((m) => (
                <div
                  key={m.id}
                  className="flex flex-col items-center text-center w-20"
                >
                  <LiveShiningMetallicMedalSVG
                    badge={m}
                    size={58}
                    showRibbon={true}
                    isEarned={true}
                  />
                  <span className="text-[9.5px] font-extrabold text-slate-200 mt-1 leading-tight">
                    {m.name}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Adjust Curos */}
        <div className="space-y-2.5 pt-2 border-t border-white/15">
          <span className="text-[11px] font-black uppercase tracking-wider text-cyan-300 block">
            Manual Curos Adjustment
          </span>
          <div className="flex flex-wrap items-center gap-2">
            {[25, 50, 100].map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => onAdjustCuros(user, val)}
                className="celestial-btn-gold px-3.5 py-2 rounded-xl text-xs font-black cursor-pointer"
              >
                +{val} Curos
              </button>
            ))}
            <input
              type="number"
              min="1"
              value={deltaAmt}
              onChange={(e) => setDeltaAmt(e.target.value)}
              className="w-20 rounded-xl bg-[#050816] border border-white/25 px-3 py-2 text-xs font-black text-white font-mono outline-none ml-auto"
            />
            <button
              type="button"
              onClick={() => onAdjustCuros(user, amt)}
              className="celestial-btn-cyan px-3.5 py-2 rounded-xl text-xs font-black cursor-pointer"
            >
              Grant
            </button>
            <button
              type="button"
              disabled={user.curos <= 0}
              onClick={() => onAdjustCuros(user, -amt)}
              className="celestial-btn-slate px-3.5 py-2 rounded-xl text-xs font-black cursor-pointer disabled:opacity-40"
            >
              Deduct
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 10. MAIN COMPONENT: CuroManagement (DIGITAL + CELESTIAL COMMAND CONSOLE)
// ============================================================================
export default function CuroManagement() {
  const [rawUsers, setRawUsers] = useState(INITIAL_USERS);
  const [syncing, setSyncing] = useState(false);

  const [curoConfig, setCuroConfig] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CURO_CFG);
      return saved ? JSON.parse(saved) : DEFAULT_CURO_CONFIG;
    } catch {
      return DEFAULT_CURO_CONFIG;
    }
  });

  const [badgeRules, setBadgeRules] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_MEDAL_RULES);
      return saved ? JSON.parse(saved) : DEFAULT_BADGE_RULES;
    } catch {
      return DEFAULT_BADGE_RULES;
    }
  });

  const [curoLedgerOverrides, setCuroLedgerOverrides] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CURO_LEDGER);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_CURO_CFG, JSON.stringify(curoConfig));
    } catch {
      // Ignore quota
    }
  }, [curoConfig]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_MEDAL_RULES, JSON.stringify(badgeRules));
    } catch {
      // Ignore quota
    }
  }, [badgeRules]);

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY_CURO_LEDGER,
        JSON.stringify(curoLedgerOverrides)
      );
    } catch {
      // Ignore quota
    }
  }, [curoLedgerOverrides]);

  // Modals & Outside-Table Filter State
  const [curoModalOpen, setCuroModalOpen] = useState(false);
  const [rewardsModalOpen, setRewardsModalOpen] = useState(false);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);

  // Two Primary Options Outside Top of Table: 'curos' | 'medals'
  const [tableFilterMode, setTableFilterMode] = useState("curos");
  const [searchQuery, setSearchQuery] = useState("");
  const [toast, setToast] = useState(null);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3200);
  };

  // Sync live backend telemetry if available
  const fetchLiveEconomy = useCallback(async (isRefresh = false) => {
    if (isRefresh) setSyncing(true);
    const routes = [
      `${API_BASE_URL}/analytics/leaderboards`,
      `${API_BASE_URL}/admin/curo-management`,
    ];

    for (const url of routes) {
      try {
        const res = await axios.get(url, { params: { _t: Date.now() } });
        const list = res.data?.competitors || res.data?.users;
        if (Array.isArray(list) && list.length > 0) {
          setRawUsers(
            list.map((u, idx) => ({
              id: u.id ?? u.user_id ?? idx + 1,
              name: u.name || u.full_name || `Learner #${idx + 1}`,
              role: u.role || "Learner",
              franchise_partner: u.franchise_partner || u.manager_name || "-",
              curos: Number(u.curos ?? u.curos_balance ?? 0),
              completion: Number(u.programs_completed ?? u.completion ?? 0),
              application:
                Number(u.application_pct || 0) >= 80
                  ? 5
                  : Number(u.application_pct || 0) > 0
                    ? 1
                    : 0,
              retention:
                Number(u.retention_pct || 0) >= 80
                  ? 3
                  : Number(u.retention_pct || 0) > 0
                    ? 1
                    : 0,
              streak: Number(u.streak_days ?? u.current_streak ?? 0),
            }))
          );
          setSyncing(false);
          return;
        }
      } catch {
        // Try next route
      }
    }
    setSyncing(false);
  }, []);

  useEffect(() => {
    fetchLiveEconomy(false);
  }, [fetchLiveEconomy]);

  // Dynamically Compute Each User's Shining Medals from Active Badge Rules
  const enrichedUsers = useMemo(() => {
    const activeRules = badgeRules.filter((b) => b.enabled);
    const tierWeight = { gold: 3, silver: 2, bronze: 1 };

    return rawUsers.map((u) => {
      const liveCuros =
        curoLedgerOverrides[u.id] !== undefined
          ? curoLedgerOverrides[u.id]
          : u.curos;

      const metrics = {
        curos: liveCuros,
        completion: Number(u.completion || 0),
        application: Number(u.application || 0),
        retention: Number(u.retention || 0),
        streak: Number(u.streak || 0),
      };

      const earnedMedals = activeRules
        .filter((r) => Number(metrics[r.metricKey] || 0) >= r.target)
        .sort((a, b) => (tierWeight[b.tier] || 0) - (tierWeight[a.tier] || 0));

      return {
        ...u,
        curos: liveCuros,
        earnedMedals,
        goldCount: earnedMedals.filter((m) => m.tier === "gold").length,
        silverCount: earnedMedals.filter((m) => m.tier === "silver").length,
        bronzeCount: earnedMedals.filter((m) => m.tier === "bronze").length,
      };
    });
  }, [rawUsers, curoLedgerOverrides, badgeRules]);

  // Sorted & Filtered Roster based on Outside 'Curos' / 'Medals' Toggle
  const displayedUsers = useMemo(() => {
    const filtered = enrichedUsers.filter((u) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          u.name.toLowerCase().includes(q) ||
          u.role.toLowerCase().includes(q) ||
          u.earnedMedals.some((m) => m.name.toLowerCase().includes(q))
        );
      }
      return true;
    });

    return [...filtered].sort((a, b) => {
      if (tableFilterMode === "medals") {
        return (
          b.earnedMedals.length - a.earnedMedals.length ||
          b.goldCount - a.goldCount ||
          b.silverCount - a.silverCount ||
          b.curos - a.curos
        );
      }
      return (
        b.curos - a.curos ||
        b.earnedMedals.length - a.earnedMedals.length ||
        a.name.localeCompare(b.name)
      );
    });
  }, [enrichedUsers, searchQuery, tableFilterMode]);

  // Live KPI Aggregates
  const kpis = useMemo(() => {
    const totalCuros = enrichedUsers.reduce((s, u) => s + u.curos, 0);
    const activeHolders = enrichedUsers.filter((u) => u.curos > 0).length;
    const totalMedalsUnlocked = enrichedUsers.reduce(
      (s, u) => s + u.earnedMedals.length,
      0
    );
    const avgCuros =
      activeHolders > 0 ? Math.round(totalCuros / activeHolders) : 0;
    const participationPct =
      enrichedUsers.length > 0
        ? Math.round((activeHolders / enrichedUsers.length) * 100)
        : 0;
    const topMedalHolder = [...enrichedUsers].sort(
      (a, b) => b.earnedMedals.length - a.earnedMedals.length
    )[0];

    return {
      totalCuros,
      activeHolders,
      totalMedalsUnlocked,
      avgCuros,
      totalUsers: enrichedUsers.length,
      participationPct,
      topMedalHolder,
    };
  }, [enrichedUsers]);

  const activeUserModal = useMemo(
    () => enrichedUsers.find((u) => u.id === selectedUserId) || null,
    [enrichedUsers, selectedUserId]
  );

  // Handlers
  const handleUpdateProgram = (id, patch) => {
    setCuroConfig((prev) => ({
      ...prev,
      programs: prev.programs.map((p) => (p.id === id ? { ...p, ...patch } : p)),
    }));
    showToast("Updated program Curo rate");
  };

  const handleAddProgram = (prog) => {
    setCuroConfig((prev) => ({
      ...prev,
      programs: [...prev.programs, prog],
    }));
    showToast(`Added "${prog.name}" (${prog.rewardAmount} Curos)`);
  };

  const handleUpdateRule = (id, patch) => {
    setCuroConfig((prev) => ({
      ...prev,
      rules: prev.rules.map((r) => (r.id === id ? { ...r, ...patch } : r)),
    }));
    showToast("Updated Curo earning rule");
  };

  const handleUpdateBadgeRule = (id, patch) => {
    setBadgeRules((prev) =>
      prev.map((b) => (b.id === id ? { ...b, ...patch } : b))
    );
  };

  const handleAdjustUserCuros = (user, delta) => {
    const nextVal = Math.max(0, user.curos + delta);
    setCuroLedgerOverrides((prev) => ({ ...prev, [user.id]: nextVal }));
    showToast(
      delta > 0
        ? `Granted +${delta} Curos to ${user.name} (Total: ${nextVal})`
        : `Deducted ${Math.abs(delta)} Curos from ${user.name} (Total: ${nextVal})`
    );
  };

  const handleBoostZeroBalance = (amt) => {
    const targets = enrichedUsers.filter((u) => u.curos === 0);
    if (targets.length === 0) return;
    setCuroLedgerOverrides((prev) => {
      const next = { ...prev };
      targets.forEach((u) => {
        next[u.id] = amt;
      });
      return next;
    });
    showToast(`AI Boost: Granted +${amt} Curos to ${targets.length} inactive accounts!`);
  };

  // Sample 3 Shining Mini Medals for Tab 2
  const miniGold = badgeRules.find((b) => b.tier === "gold") || badgeRules[5];
  const miniSilver = badgeRules.find((b) => b.tier === "silver") || badgeRules[10];
  const miniBronze = badgeRules.find((b) => b.tier === "bronze") || badgeRules[0];

  return (
    <MainLayout>
      <div className="-m-4 sm:-m-6 p-5 sm:p-7 min-h-screen celestial-digital-stage text-slate-100 font-sans space-y-6 overflow-x-hidden relative selection:bg-cyan-400 selection:text-slate-950">
        {/* ===================================================================
            DIGITAL + CELESTIAL CSS ARCHITECTURE
            - Starfield + Faint Digital Coordinate Grid
            - 4 Streak-Style Digital Live-Glow KPI Cards
            - 3 Command Hub Tabs (Curos / Rewards with Mini Medals / AI Model)
            - Premium Celestial Bordered Table Vault + Separate Opaque User Tabs
        =================================================================== */}
        <style>{`
          /* 1. DEEP CELESTIAL STARFIELD + DIGITAL GRID BACKDROP */
          .celestial-digital-stage {
            background-color: #030512;
            background-image:
              radial-gradient(1.5px 1.5px at 12% 16%, rgba(255, 255, 255, 0.6) 50%, transparent 100%),
              radial-gradient(1px 1px at 38% 10%, rgba(186, 230, 253, 0.55) 50%, transparent 100%),
              radial-gradient(1.6px 1.6px at 74% 20%, rgba(254, 240, 138, 0.65) 50%, transparent 100%),
              radial-gradient(1.2px 1.2px at 89% 56%, rgba(216, 180, 254, 0.55) 50%, transparent 100%),
              radial-gradient(1.2px 1.2px at 22% 76%, rgba(255, 255, 255, 0.45) 50%, transparent 100%),
              radial-gradient(ellipse 52% 38% at 86% 6%, rgba(56, 189, 248, 0.16) 0%, transparent 68%),
              radial-gradient(ellipse 46% 36% at 12% 24%, rgba(139, 92, 246, 0.18) 0%, transparent 68%),
              linear-gradient(rgba(56, 189, 248, 0.032) 1px, transparent 1px),
              linear-gradient(90deg, rgba(168, 85, 247, 0.032) 1px, transparent 1px);
            background-size:
              100% 100%, 100% 100%, 100% 100%, 100% 100%, 100% 100%,
              100% 100%, 100% 100%, 48px 48px, 48px 48px;
          }

          /* Live Shining Medal Sweep */
          @keyframes celestialMedalSweep {
            0%   { transform: translateX(-140px) rotate(25deg); opacity: 0; }
            22%  { opacity: 0.92; }
            48%  { transform: translateX(260px) rotate(25deg); opacity: 0; }
            100% { transform: translateX(260px) rotate(25deg); opacity: 0; }
          }
          .celestial-medal-sheen {
            animation: celestialMedalSweep 4.2s cubic-bezier(0.4, 0, 0.2, 1) infinite;
          }

          /* Floating Celestial AI Avatar */
          @keyframes celestialAiFloat {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            50%      { transform: translateY(-7px) rotate(1.4deg); }
          }
          .celestial-ai-float {
            animation: celestialAiFloat 3.4s ease-in-out infinite;
          }

          /* 2. CELESTIAL HERO BANNER */
          .celestial-hero-shell {
            position: relative;
            overflow: hidden;
            background:
              radial-gradient(ellipse 46% 65% at 86% 12%, rgba(56, 189, 248, 0.24) 0%, transparent 68%),
              radial-gradient(ellipse 45% 65% at 16% 92%, rgba(168, 85, 247, 0.22) 0%, transparent 68%),
              linear-gradient(135deg, #0A102C 0%, #070B1E 54%, #0E0A24 100%);
            border: 1.8px solid rgba(125, 211, 252, 0.58);
            box-shadow:
              0 20px 52px rgba(0, 0, 0, 0.86),
              0 0 36px -8px rgba(56, 189, 248, 0.36),
              inset 0 1px 0 rgba(255, 255, 255, 0.26);
          }

          /* 3. DIGITAL LIVE-GLOW KPI CARDS (STREAK-MANAGEMENT STYLE) */
          @keyframes digiBaseFlow {
            0%   { background-position: 0% 50%, 0% 0%; }
            50%  { background-position: 100% 50%, 100% 100%; }
            100% { background-position: 0% 50%, 0% 0%; }
          }
          @keyframes digiGlowGold {
            0%, 100% { box-shadow: 0 0 14px rgba(250,204,21,0.46), inset 0 0 20px rgba(250,204,21,0.18); }
            50%      { box-shadow: 0 0 26px rgba(253,224,71,0.82), inset 0 0 28px rgba(250,204,21,0.32); }
          }
          @keyframes digiGlowCyan {
            0%, 100% { box-shadow: 0 0 14px rgba(0,245,255,0.48), inset 0 0 20px rgba(0,245,255,0.18); }
            50%      { box-shadow: 0 0 26px rgba(56,189,248,0.84), inset 0 0 28px rgba(0,245,255,0.32); }
          }
          @keyframes digiGlowViolet {
            0%, 100% { box-shadow: 0 0 14px rgba(176,38,255,0.48), inset 0 0 20px rgba(176,38,255,0.2); }
            50%      { box-shadow: 0 0 26px rgba(192,132,252,0.86), inset 0 0 28px rgba(176,38,255,0.32); }
          }
          @keyframes digiGlowEmerald {
            0%, 100% { box-shadow: 0 0 14px rgba(16,245,160,0.46), inset 0 0 20px rgba(16,245,160,0.18); }
            50%      { box-shadow: 0 0 26px rgba(52,211,153,0.82), inset 0 0 28px rgba(16,245,160,0.3); }
          }

          .digi-kpi-card {
            position: relative;
            isolation: isolate;
            overflow: hidden;
            background-size: 260% 260%, 200% 200% !important;
            transition: transform 0.24s cubic-bezier(0.22, 1, 0.36, 1);
          }
          .digi-kpi-card:hover {
            transform: translateY(-4px) scale(1.015);
          }

          .digi-kpi-gold {
            background-image:
              radial-gradient(circle at 22% 20%, rgba(253, 224, 71, 0.44) 0%, rgba(217, 119, 6, 0.22) 45%, transparent 72%),
              linear-gradient(135deg, #171003 0%, #3A2606 40%, #0A0703 74%, #312006 100%) !important;
            border: 2px solid #FDE047 !important;
            animation: digiBaseFlow 5.8s ease-in-out infinite, digiGlowGold 3.6s ease-in-out infinite !important;
          }

          .digi-kpi-cyan {
            background-image:
              radial-gradient(circle at 80% 22%, rgba(0, 245, 255, 0.44) 0%, rgba(2, 132, 199, 0.22) 45%, transparent 72%),
              linear-gradient(135deg, #031224 0%, #072E4E 40%, #020914 74%, #082947 100%) !important;
            border: 2px solid #38BDF8 !important;
            animation: digiBaseFlow 5.8s ease-in-out infinite, digiGlowCyan 3.6s ease-in-out infinite !important;
          }

          .digi-kpi-violet {
            background-image:
              radial-gradient(circle at 20% 78%, rgba(192, 132, 252, 0.46) 0%, rgba(124, 58, 237, 0.22) 45%, transparent 72%),
              linear-gradient(135deg, #0D0520 0%, #240D4F 40%, #060312 74%, #2B105C 100%) !important;
            border: 2px solid #C084FC !important;
            animation: digiBaseFlow 5.8s ease-in-out infinite, digiGlowViolet 3.6s ease-in-out infinite !important;
          }

          .digi-kpi-emerald {
            background-image:
              radial-gradient(circle at 80% 78%, rgba(16, 245, 160, 0.42) 0%, rgba(5, 150, 105, 0.2) 45%, transparent 72%),
              linear-gradient(135deg, #031814 0%, #07382E 40%, #020C0A 74%, #063128 100%) !important;
            border: 2px solid #34D399 !important;
            animation: digiBaseFlow 5.8s ease-in-out infinite, digiGlowEmerald 3.6s ease-in-out infinite !important;
          }

          /* 4. 3 INTERACTIVE CELESTIAL COMMAND TABS (SKETCH 1, 2, 3) */
          .celestial-hub-card {
            position: relative;
            overflow: hidden;
            background: linear-gradient(155deg, #0D1431 0%, #070B1D 58%, #050814 100%);
            transition: transform 0.24s cubic-bezier(0.22, 1, 0.36, 1),
              box-shadow 0.24s ease, border-color 0.24s ease;
          }
          .celestial-hub-card:hover {
            transform: translateY(-4px);
          }

          .hub-curo {
            border: 2px solid rgba(250, 204, 21, 0.8);
            box-shadow: 0 16px 38px rgba(0, 0, 0, 0.82), 0 0 26px -6px rgba(250, 204, 21, 0.36);
          }
          .hub-curo:hover {
            border-color: #FEF08A;
            box-shadow: 0 20px 44px rgba(0, 0, 0, 0.9), 0 0 36px -4px rgba(250, 204, 21, 0.56);
          }

          .hub-rewards {
            border: 2px solid rgba(192, 132, 252, 0.82);
            box-shadow: 0 16px 38px rgba(0, 0, 0, 0.82), 0 0 26px -6px rgba(192, 132, 252, 0.38);
          }
          .hub-rewards:hover {
            border-color: #E9D5FF;
            box-shadow: 0 20px 44px rgba(0, 0, 0, 0.9), 0 0 36px -4px rgba(192, 132, 252, 0.58);
          }

          .hub-ai {
            border: 2px solid rgba(56, 189, 248, 0.86);
            box-shadow: 0 18px 42px rgba(0, 0, 0, 0.86), 0 0 30px -6px rgba(56, 189, 248, 0.44);
          }
          .hub-ai:hover {
            border-color: #BAE6FD;
            box-shadow: 0 22px 48px rgba(0, 0, 0, 0.92), 0 0 40px -4px rgba(56, 189, 248, 0.62);
          }

          /* 5. PREMIUM CELESTIAL TABLE VAULT + SEPARATE OPAQUE USER TABS */
          @keyframes celestialMistDrift {
            0%, 100% { transform: translate3d(-12%, -10%, 0) scale(0.96); opacity: 0.44; }
            50%      { transform: translate3d(38%, 26%, 0) scale(1.12);   opacity: 0.72; }
          }

          .celestial-table-vault {
            position: relative;
            isolation: isolate;
            overflow: hidden;
            border: 2.2px solid transparent;
            background-clip: padding-box, border-box;
            background-origin: padding-box, border-box;
            background-image:
              linear-gradient(160deg, #090F25 0%, #050816 55%, #070A1B 100%),
              linear-gradient(135deg, #FEF08A 0%, #38BDF8 34%, #C084FC 68%, #FDE047 100%);
            box-shadow:
              0 24px 56px rgba(0, 0, 0, 0.92),
              0 0 38px -10px rgba(56, 189, 248, 0.34),
              0 0 32px -10px rgba(250, 204, 21, 0.3);
          }

          .vault-astral-mist-a {
            position: absolute;
            width: 58%;
            height: 75%;
            top: -12%;
            left: -8%;
            border-radius: 9999px;
            pointer-events: none;
            z-index: 0;
            background: radial-gradient(circle, rgba(56, 189, 248, 0.3) 0%, transparent 70%);
            filter: blur(58px);
            animation: celestialMistDrift 16s ease-in-out infinite;
          }
          .vault-astral-mist-b {
            position: absolute;
            width: 54%;
            height: 75%;
            bottom: -14%;
            right: -8%;
            border-radius: 9999px;
            pointer-events: none;
            z-index: 0;
            background: radial-gradient(circle, rgba(250, 204, 21, 0.24) 0%, rgba(168, 85, 247, 0.18) 45%, transparent 72%);
            filter: blur(60px);
            animation: celestialMistDrift 21s ease-in-out infinite reverse;
          }

          /* Separate 100% Opaque User Tabs Inside the Premium Table */
          .celestial-user-tab {
            position: relative;
            z-index: 10;
            background: #070B1A !important;
            transition: transform 0.2s cubic-bezier(0.22, 1, 0.36, 1),
              border-color 0.2s ease, box-shadow 0.2s ease;
          }
          .celestial-user-tab:hover {
            transform: translateY(-2px);
          }

          .utab-gold    { border: 2px solid #FACC15 !important; box-shadow: 0 8px 22px rgba(0,0,0,0.82), 0 0 14px -4px rgba(250,204,21,0.44); }
          .utab-cyan    { border: 2px solid #38BDF8 !important; box-shadow: 0 8px 22px rgba(0,0,0,0.82), 0 0 14px -4px rgba(56,189,248,0.44); }
          .utab-purple  { border: 2px solid #C084FC !important; box-shadow: 0 8px 22px rgba(0,0,0,0.82), 0 0 14px -4px rgba(192,132,252,0.44); }
          .utab-emerald { border: 2px solid #34D399 !important; box-shadow: 0 8px 22px rgba(0,0,0,0.82), 0 0 14px -4px rgba(52,211,153,0.44); }
          .utab-rose    { border: 2px solid #FB7185 !important; box-shadow: 0 8px 22px rgba(0,0,0,0.82), 0 0 14px -4px rgba(251,113,133,0.44); }

          /* 6. CRISP CELESTIAL BUTTONS */
          .celestial-btn-gold {
            background: linear-gradient(180deg, #FDE047 0%, #EAB308 100%);
            border: 1.5px solid #FEF9C3;
            color: #090704;
            box-shadow: 0 4px 14px rgba(234, 179, 8, 0.38);
            transition: transform 0.16s ease, filter 0.16s ease;
          }
          .celestial-btn-gold:hover { filter: brightness(1.06); transform: translateY(-1px); }

          .celestial-btn-cyan {
            background: linear-gradient(180deg, #38BDF8 0%, #0284C7 100%);
            border: 1.5px solid #BAE6FD;
            color: #04101D;
            box-shadow: 0 4px 14px rgba(56, 189, 248, 0.38);
            transition: transform 0.16s ease, filter 0.16s ease;
          }
          .celestial-btn-cyan:hover { filter: brightness(1.08); transform: translateY(-1px); }

          .celestial-btn-purple {
            background: linear-gradient(180deg, #8B5CF6 0%, #5B21B6 100%);
            border: 1.5px solid #DDD6FE;
            color: #FFFFFF;
            box-shadow: 0 4px 14px rgba(139, 92, 246, 0.4);
            transition: transform 0.16s ease, filter 0.16s ease;
          }
          .celestial-btn-purple:hover { filter: brightness(1.08); transform: translateY(-1px); }

          .celestial-btn-slate {
            background: #0D142B;
            border: 1.5px solid rgba(148, 163, 184, 0.45);
            color: #E2E8F0;
            transition: border-color 0.16s ease, color 0.16s ease, transform 0.16s ease;
          }
          .celestial-btn-slate:hover { border-color: #38BDF8; color: #BAE6FD; transform: translateY(-1px); }
        `}</style>

        {/* Toast Notification */}
        {toast && (
          <div className="fixed bottom-6 right-6 z-50 px-5 py-3.5 rounded-2xl bg-[#070C1F] border-2 border-[#38BDF8] shadow-[0_0_28px_rgba(56,189,248,0.48)] text-white flex items-center gap-3 text-xs font-extrabold">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span>{toast}</span>
          </div>
        )}

        {/* ===================================================================
            ROW 1 (SKETCH TOP): DIGITAL + CELESTIAL HERO BANNER
        =================================================================== */}
        <header className="celestial-hero-shell rounded-3xl px-6 sm:px-8 py-6 flex flex-wrap items-center justify-between gap-4">
          <svg
            viewBox="0 0 400 140"
            className="pointer-events-none absolute right-6 top-0 h-full w-80 opacity-25"
            aria-hidden="true"
          >
            <ellipse
              cx="230"
              cy="70"
              rx="155"
              ry="48"
              fill="none"
              stroke="#38BDF8"
              strokeWidth="1.2"
              strokeDasharray="6 6"
              transform="rotate(-14 230 70)"
            />
            <ellipse
              cx="230"
              cy="70"
              rx="108"
              ry="32"
              fill="none"
              stroke="#FDE047"
              strokeWidth="1"
              transform="rotate(10 230 70)"
            />
          </svg>

          <div className="flex items-center gap-4 relative z-10">
            <div className="w-14 h-14 rounded-2xl bg-[#0A1330] border-2 border-[#38BDF8] shadow-[0_0_22px_rgba(56,189,248,0.48)] flex items-center justify-center shrink-0">
              <Orbit className="w-7 h-7 text-[#FDE047]" />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10.5px] font-black uppercase tracking-[0.26em] text-[#38BDF8]">
                  DIGITAL • CELESTIAL ECONOMY COMMAND
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-400/20 text-emerald-300 border border-emerald-400/50">
                  ● Rule Engine Live
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white mt-0.5">
                Curo &amp; Rewards Management
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 font-semibold mt-0.5">
                Configure Curo treasury rules, edit 15 shining medal milestones,
                and govern learner rewards with Celestial AI.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 ml-auto relative z-10">
            <button
              type="button"
              onClick={() => {
                fetchLiveEconomy(true);
                showToast("Synced live Curo & medal telemetry");
              }}
              className="celestial-btn-cyan px-4 py-2.5 rounded-2xl text-xs font-black flex items-center gap-2 cursor-pointer"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${syncing ? "animate-spin" : ""}`}
              />
              <span>{syncing ? "Syncing..." : "Sync Telemetry"}</span>
            </button>
          </div>
        </header>

        {/* ===================================================================
            ROW 2 (SKETCH 4 BOXES): 4 DIGITAL LIVE-GLOW KPI CARDS
        =================================================================== */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              title: "CUROS IN CIRCULATION",
              value: kpis.totalCuros.toLocaleString(),
              sub: `${kpis.participationPct}% Wallet Participation`,
              cls: "digi-kpi-gold",
              valCls: "text-[#FEF08A]",
              iconBox: "bg-[#FDE047] text-slate-950",
              barCls: "from-[#F59E0B] via-[#FEF08A] to-[#FFFFFF]",
              delay: "0s",
              icon: <Coins className="w-5 h-5" />,
              onClick: () => setTableFilterMode("curos"),
            },
            {
              title: "ACTIVE CURO HOLDERS",
              value: kpis.activeHolders,
              sub: `of ${kpis.totalUsers} Synced Learners`,
              cls: "digi-kpi-cyan",
              valCls: "text-[#BAE6FD]",
              iconBox: "bg-[#38BDF8] text-slate-950",
              barCls: "from-[#0284C7] via-[#38BDF8] to-[#A5F3FC]",
              delay: "-1.4s",
              icon: <Users className="w-5 h-5" />,
              onClick: () => setTableFilterMode("curos"),
            },
            {
              title: "SHINING MEDALS UNLOCKED",
              value: kpis.totalMedalsUnlocked,
              sub: `${badgeRules.filter((b) => b.enabled).length} Active Medal Rules`,
              cls: "digi-kpi-violet",
              valCls: "text-[#F0C7FF]",
              iconBox: "bg-[#C084FC] text-slate-950",
              barCls: "from-[#9333EA] via-[#E879F9] to-[#38BDF8]",
              delay: "-2.8s",
              icon: <Award className="w-5 h-5" />,
              onClick: () => setTableFilterMode("medals"),
            },
            {
              title: "AVG CUROS / HOLDER",
              value: kpis.avgCuros,
              sub: "Mean Active Treasury",
              cls: "digi-kpi-emerald",
              valCls: "text-[#A7F3D0]",
              iconBox: "bg-[#34D399] text-slate-950",
              barCls: "from-[#059669] via-[#34D399] to-[#67E8F9]",
              delay: "-4.2s",
              icon: <TrendingUp className="w-5 h-5" />,
              onClick: () => setCuroModalOpen(true),
            },
          ].map((card) => (
            <div
              key={card.title}
              onClick={card.onClick}
              style={{ animationDelay: card.delay }}
              className={`cursor-pointer rounded-3xl p-5 flex flex-col justify-between space-y-3.5 select-none digi-kpi-card ${card.cls}`}
            >
              <div className="flex items-start justify-between gap-3 relative z-10">
                <div>
                  <span className="text-[10.5px] font-black uppercase tracking-[0.14em] text-white/85 block">
                    {card.title}
                  </span>
                  <span
                    className={`text-3xl sm:text-4xl font-black leading-none mt-2 block font-mono ${card.valCls}`}
                  >
                    {card.value}
                  </span>
                </div>
                <div
                  className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-lg ${card.iconBox}`}
                >
                  {card.icon}
                </div>
              </div>

              <div className="space-y-2 relative z-10">
                <div className="w-full h-1.5 rounded-full bg-black/65 overflow-hidden">
                  <div
                    className={`h-full w-full rounded-full bg-gradient-to-r ${card.barCls}`}
                  />
                </div>
                <span className="text-xs font-bold text-slate-200 block">
                  {card.sub}
                </span>
              </div>
            </div>
          ))}
        </section>

        {/* ===================================================================
            ROW 3 (SKETCH TABS 1, 2, 3):
            - TAB 1: CURO MANAGEMENT (Click to view & edit rules/rates)
            - TAB 2: REWARDS MANAGEMENT (Displays mini shining medals + click to edit)
            - TAB 3: AI ASSISTANCE LIVE MODEL (Elevated card + uploaded PNG)
        =================================================================== */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-end">
          {/* TAB 1 (4 COLS): CURO MANAGEMENT */}
          <div
            onClick={() => setCuroModalOpen(true)}
            className="lg:col-span-4 cursor-pointer group celestial-hub-card hub-curo rounded-3xl p-5 flex flex-col justify-between space-y-4 min-h-[210px] select-none"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-amber-400/15 border border-amber-300/70 flex items-center justify-center shrink-0">
                  <Sliders className="w-5 h-5 text-[#FDE047]" />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-300 block">
                    01 • CURO ENGINE
                  </span>
                  <h2 className="text-lg font-black text-white group-hover:text-amber-200 transition">
                    Curo Management
                  </h2>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-400/20 text-amber-200 border border-amber-300/50">
                Edit Rules
              </span>
            </div>

            <div className="space-y-2">
              {curoConfig.programs.slice(0, 2).map((p) => (
                <div
                  key={p.id}
                  className="px-3.5 py-2 rounded-xl bg-[#050816] border border-white/10 flex items-center justify-between text-xs"
                >
                  <span className="font-bold text-slate-200 truncate pr-2">
                    {p.name}
                  </span>
                  <span className="font-black font-mono text-[#FDE047] shrink-0">
                    +{p.rewardAmount} Curos
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs font-extrabold">
              <span className="text-slate-400">
                {curoConfig.rules.filter((r) => r.enabled).length} earning rules
                active
              </span>
              <span className="text-[#FDE047] inline-flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                <span>Open Details</span>
                <ChevronRight className="w-4 h-4" />
              </span>
            </div>
          </div>

          {/* TAB 2 (4 COLS): REWARDS MANAGEMENT (MINI SHINING MEDALS INSIDE TAB) */}
          <div
            onClick={() => setRewardsModalOpen(true)}
            className="lg:col-span-4 cursor-pointer group celestial-hub-card hub-rewards rounded-3xl p-5 flex flex-col justify-between space-y-4 min-h-[210px] select-none"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-purple-500/20 border border-purple-300/70 flex items-center justify-center shrink-0">
                  <Award className="w-5 h-5 text-purple-200" />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-purple-300 block">
                    02 • REWARDS ENGINE
                  </span>
                  <h2 className="text-lg font-black text-white group-hover:text-purple-200 transition">
                    Rewards Management
                  </h2>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-purple-500/25 text-purple-200 border border-purple-300/50">
                15 Medals
              </span>
            </div>

            {/* Mini Live-Shining Metallic Medals Inside the Tab Itself */}
            <div className="px-3.5 py-2.5 rounded-2xl bg-[#050816] border border-purple-400/40 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <LiveShiningMetallicMedalSVG
                  badge={miniGold}
                  size={44}
                  showRibbon={false}
                  isEarned={true}
                />
                <LiveShiningMetallicMedalSVG
                  badge={miniSilver}
                  size={44}
                  showRibbon={false}
                  isEarned={true}
                />
                <LiveShiningMetallicMedalSVG
                  badge={miniBronze}
                  size={44}
                  showRibbon={false}
                  isEarned={true}
                />
              </div>
              <div className="text-right">
                <span className="text-[10px] font-black uppercase text-purple-300 block">
                  5 × 3 Matrix
                </span>
                <span className="text-xs font-extrabold text-white">
                  Gold • Silver • Bronze
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs font-extrabold">
              <span className="text-slate-400">
                Edit targets, bonuses &amp; rules
              </span>
              <span className="text-purple-300 inline-flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                <span>Edit Medals</span>
                <ChevronRight className="w-4 h-4" />
              </span>
            </div>
          </div>

          {/* TAB 3 (4 COLS): AI ASSISTANCE LIVE MODEL (PROMINENT SHOWCASE LIKE SKETCH BOX 3) */}
          <div
            onClick={() => setAiModalOpen(true)}
            className="lg:col-span-4 cursor-pointer group celestial-hub-card hub-ai rounded-3xl p-5 flex items-center justify-between gap-4 min-h-[224px] select-none"
          >
            <div className="flex flex-col justify-between h-full space-y-3 min-w-0">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-400/15 border border-cyan-300/60 text-[9.5px] font-black uppercase tracking-widest text-cyan-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  <span>03 • LIVE AI MODEL</span>
                </div>
                <h2 className="text-lg font-black text-white mt-2 group-hover:text-cyan-200 transition">
                  Celestial AI Co-Pilot
                </h2>
                <p className="text-[11.5px] text-slate-300 font-medium mt-1 leading-relaxed">
                  {kpis.topMedalHolder
                    ? `Leader: ${kpis.topMedalHolder.name} (${kpis.topMedalHolder.earnedMedals.length} medals). Click for live economy audits.`
                    : "Audit Curo flow, forecast unlocks & trigger instant bonuses."}
                </p>
              </div>

              <div className="pt-1">
                <span className="celestial-btn-cyan px-3.5 py-1.5 rounded-xl text-[11px] font-black inline-flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Launch AI Console</span>
                </span>
              </div>
            </div>

            <CelestialAiModelStage size={106} allowUpload={false} />
          </div>
        </section>

        {/* ===================================================================
            OUTSIDE TOP OF MAIN TABLE: TWO PRIMARY OPTIONS ("CUROS" & "MEDALS")
            + LIVE SEARCH INPUT
        =================================================================== */}
        <section className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-[#070C20] border-2 border-cyan-400/50 shadow-[0_10px_28px_rgba(0,0,0,0.78)]">
            <button
              type="button"
              onClick={() => setTableFilterMode("curos")}
              className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 cursor-pointer transition ${tableFilterMode === "curos"
                  ? "celestial-btn-gold"
                  : "text-slate-300 hover:text-white"
                }`}
            >
              <Coins className="w-4 h-4" />
              <span>Curos</span>
            </button>

            <button
              type="button"
              onClick={() => setTableFilterMode("medals")}
              className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 cursor-pointer transition ${tableFilterMode === "medals"
                  ? "celestial-btn-purple"
                  : "text-slate-300 hover:text-white"
                }`}
            >
              <Award className="w-4 h-4" />
              <span>Medals</span>
            </button>
          </div>

          <div className="relative flex-1 min-w-[240px] max-w-md">
            <Search className="w-4 h-4 text-cyan-300 absolute left-4 top-3.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search learner, role, or earned medal..."
              className="w-full rounded-2xl bg-[#070C20] border-2 border-white/15 focus:border-cyan-400 pl-11 pr-4 py-2.5 text-xs font-bold text-white placeholder-slate-400 outline-none transition"
            />
          </div>
        </section>

        {/* ===================================================================
            ROW 4 (SKETCH BOTTOM): PREMIUM CELESTIAL TABLE WITH SEPARATE
            OPAQUE USER TABS DISPLAYING CUROS + MINI SHINING 3D MEDALS
        =================================================================== */}
        <section className="celestial-table-vault rounded-3xl p-5 sm:p-6 space-y-4">
          <div className="vault-astral-mist-a" />
          <div className="vault-astral-mist-b" />

          {/* Table Header */}
          <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 border-b border-white/15 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#070B1A] border-2 border-[#FDE047] flex items-center justify-center shrink-0">
                {tableFilterMode === "medals" ? (
                  <Crown className="w-5 h-5 text-[#FDE047]" />
                ) : (
                  <Coins className="w-5 h-5 text-[#FDE047]" />
                )}
              </div>
              <div>
                <h2 className="text-xl font-black text-white tracking-tight">
                  {tableFilterMode === "medals"
                    ? "Shining Medals & Curos Registry"
                    : "Curos & Shining Medals Leaderboard"}
                </h2>
                <p className="text-xs text-cyan-200/85 font-bold">
                  Ranked by{" "}
                  {tableFilterMode === "medals"
                    ? "Shining Medals Earned (Gold → Silver → Bronze)"
                    : "Current Curo Balance"}{" "}
                  • Showing {displayedUsers.length} learners
                </p>
              </div>
            </div>

            <span className="px-3.5 py-1.5 rounded-full bg-[#070B1A] border border-cyan-300/50 text-[11px] font-extrabold text-cyan-200 inline-flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Click any learner tab to inspect medals or grant Curos</span>
            </span>
          </div>

          {/* Aligned Columns + Separate User Tabs */}
          <div className="relative z-10 overflow-x-auto">
            <div className="min-w-[920px] space-y-3">
              <div className="grid grid-cols-12 items-center gap-3 px-5 py-3 rounded-2xl bg-[#050814]/85 border border-white/15 text-[10.5px] font-black uppercase tracking-[0.16em] text-cyan-200">
                <div className="col-span-1">RANK</div>
                <div className="col-span-2">LEARNER</div>
                <div className="col-span-2">ROLE</div>
                <div className="col-span-2 text-center">CUROS</div>
                <div className="col-span-4">SHINING MEDALS</div>
                <div className="col-span-1 text-right">ACTION</div>
              </div>

              {displayedUsers.map((u, idx) => {
                const borderCycle = [
                  "utab-gold",
                  "utab-cyan",
                  "utab-purple",
                  "utab-emerald",
                  "utab-rose",
                ];
                const tabBorder = borderCycle[idx % borderCycle.length];
                const maxShown = tableFilterMode === "medals" ? 6 : 4;
                const shownMedals = u.earnedMedals.slice(0, maxShown);
                const extraCount = Math.max(
                  0,
                  u.earnedMedals.length - shownMedals.length
                );

                return (
                  <div
                    key={u.id}
                    onClick={() => setSelectedUserId(u.id)}
                    className={`cursor-pointer group rounded-2xl px-5 py-3.5 grid grid-cols-12 items-center gap-3 select-none celestial-user-tab ${tabBorder}`}
                  >
                    {/* RANK */}
                    <div className="col-span-1">
                      <span
                        className={`inline-flex items-center justify-center px-2.5 py-1 rounded-xl text-xs font-black font-mono ${idx === 0
                            ? "bg-[#FDE047] text-slate-950"
                            : idx === 1
                              ? "bg-slate-200 text-slate-950"
                              : idx === 2
                                ? "bg-orange-400 text-slate-950"
                                : "bg-[#111936] text-slate-200 border border-white/15"
                          }`}
                      >
                        #{idx + 1}
                      </span>
                    </div>

                    {/* LEARNER NAME */}
                    <div className="col-span-2 min-w-0">
                      <span className="text-[15px] font-black text-white group-hover:text-amber-200 transition truncate block">
                        {u.name}
                      </span>
                    </div>

                    {/* ROLE */}
                    <div className="col-span-2 min-w-0">
                      <span className="inline-block px-3 py-1 rounded-full text-[11px] font-extrabold bg-[#131B3B] text-cyan-100 border border-cyan-400/40 truncate max-w-full">
                        {u.role}
                      </span>
                    </div>

                    {/* CUROS (DISPLAYED IN BOTH MODES, HIGHLIGHTED IN CUROS MODE) */}
                    <div className="col-span-2 flex justify-center">
                      <span
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-black font-mono inline-flex items-center gap-1.5 border ${tableFilterMode === "curos" && u.curos > 0
                            ? "bg-amber-400/20 text-[#FEF08A] border-[#FDE047] shadow-[0_0_14px_rgba(250,204,21,0.32)]"
                            : u.curos > 0
                              ? "bg-amber-400/12 text-amber-200 border-amber-400/45"
                              : "bg-black/45 text-slate-400 border-white/15"
                          }`}
                      >
                        <Coins className="w-3.5 h-3.5 text-[#FDE047]" />
                        <span>{u.curos}</span>
                      </span>
                    </div>

                    {/* MINI SHINING 3D MEDALS (DISPLAYED IN BOTH, ENLARGED IN MEDALS MODE) */}
                    <div className="col-span-4 flex items-center gap-2 min-w-0">
                      {u.earnedMedals.length === 0 ? (
                        <span className="text-xs font-bold text-slate-500 italic">
                          No medals unlocked yet
                        </span>
                      ) : (
                        <>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {shownMedals.map((medal) => (
                              <LiveShiningMetallicMedalSVG
                                key={medal.id}
                                badge={medal}
                                size={tableFilterMode === "medals" ? 42 : 34}
                                showRibbon={false}
                                isEarned={true}
                              />
                            ))}
                          </div>
                          {extraCount > 0 && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-500/25 text-purple-200 border border-purple-400/50 shrink-0">
                              +{extraCount}
                            </span>
                          )}
                          <span className="ml-auto text-[11px] font-black text-amber-200 shrink-0 hidden xl:inline">
                            {u.earnedMedals.length} Medals
                          </span>
                        </>
                      )}
                    </div>

                    {/* ACTION */}
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="col-span-1 flex justify-end"
                    >
                      <button
                        type="button"
                        onClick={() => setSelectedUserId(u.id)}
                        className="celestial-btn-gold px-3.5 py-1.5 rounded-xl text-[11px] font-black cursor-pointer"
                      >
                        Manage
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ===================================================================
            MODALS FOR TAB 1, TAB 2, TAB 3 & INDIVIDUAL LEARNER TABS
        =================================================================== */}
        <CuroRulesModal
          isOpen={curoModalOpen}
          onClose={() => setCuroModalOpen(false)}
          config={curoConfig}
          users={enrichedUsers}
          onUpdateProgram={handleUpdateProgram}
          onUpdateRule={handleUpdateRule}
          onAddProgram={handleAddProgram}
          onReset={() => {
            setCuroConfig(DEFAULT_CURO_CONFIG);
            showToast("Restored default Curo economy rules");
          }}
        />

        <RewardsRulesModal
          isOpen={rewardsModalOpen}
          onClose={() => setRewardsModalOpen(false)}
          badgeRules={badgeRules}
          onUpdateBadge={handleUpdateBadgeRule}
          onResetBadges={() => {
            setBadgeRules(DEFAULT_BADGE_RULES);
            showToast("Restored default 15-medal rules");
          }}
        />

        <CelestialAiModal
          isOpen={aiModalOpen}
          onClose={() => setAiModalOpen(false)}
          kpis={kpis}
          users={enrichedUsers}
          badgeRules={badgeRules}
          onBoostZeroBalance={handleBoostZeroBalance}
        />

        <UserTreasuryModal
          user={activeUserModal}
          onClose={() => setSelectedUserId(null)}
          onAdjustCuros={handleAdjustUserCuros}
        />
      </div>
    </MainLayout>
  );
}

```

Would you like to connect the `CuroRulesModal` and `RewardsRulesModal` edits to specific backend `POST`/`PATCH` endpoints, or adjust the path/filename of your uploaded AI model PNG?