import React, { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import MainLayout from "../../layout/mainLayout";
import { API_BASE } from "../../config/api";

const API_BASE_URL =
  import.meta.env?.VITE_API_URL ||
  API_BASE ||
  (import.meta.env?.DEV
    ? "http://127.0.0.1:8000"
    : "https://saarthi-curious-00e8.onrender.com");

// ============================================================================
// 1. 15 OFFICIAL BADGE DEFINITIONS & UNLOCK RULES (5x3 MATRIX)
//    Medals unlock strictly when the user's live telemetry meets `target`
// ============================================================================
const REWARDS_BADGES = [
  // ------------------------- ROW 1: BRONZE TIER -------------------------
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
    borderCls:
      "border-orange-500/45 hover:border-orange-400 shadow-[0_0_24px_rgba(234,88,12,0.2)]",
    category: "Application",
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
    borderCls:
      "border-amber-600/45 hover:border-amber-400 shadow-[0_0_24px_rgba(217,119,6,0.2)]",
    category: "Completion",
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
    borderCls:
      "border-orange-500/45 hover:border-orange-400 shadow-[0_0_24px_rgba(234,88,12,0.2)]",
    category: "Curos",
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
    borderCls:
      "border-amber-600/45 hover:border-amber-400 shadow-[0_0_24px_rgba(217,119,6,0.2)]",
    category: "Retention",
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
    borderCls:
      "border-orange-500/45 hover:border-orange-400 shadow-[0_0_24px_rgba(194,65,12,0.22)]",
    category: "Streak",
    ruleText: "Maintain an active learning streak for 3 consecutive days.",
  },

  // ------------------------- ROW 2: GOLD TIER ---------------------------
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
    borderCls:
      "border-amber-400/70 hover:border-yellow-300 shadow-[0_0_30px_rgba(250,204,21,0.3)]",
    category: "Completion",
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
    borderCls:
      "border-yellow-400/75 hover:border-amber-200 shadow-[0_0_32px_rgba(234,179,8,0.34)]",
    category: "Application",
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
    borderCls:
      "border-amber-300/80 hover:border-white shadow-[0_0_34px_rgba(245,158,11,0.38)]",
    category: "Curos",
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
    borderCls:
      "border-amber-400/70 hover:border-yellow-300 shadow-[0_0_30px_rgba(245,158,11,0.3)]",
    category: "Retention",
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
    borderCls:
      "border-amber-500/70 hover:border-yellow-300 shadow-[0_0_30px_rgba(249,115,22,0.32)]",
    category: "Streak",
    ruleText: "Complete a 30-day consecutive learning inferno streak.",
  },

  // ------------------------- ROW 3: SILVER TIER -------------------------
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
    borderCls:
      "border-slate-300/55 hover:border-white shadow-[0_0_25px_rgba(203,213,225,0.24)]",
    category: "Application",
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
    borderCls:
      "border-purple-400/55 hover:border-purple-200 shadow-[0_0_25px_rgba(168,85,247,0.25)]",
    category: "Completion",
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
    borderCls:
      "border-cyan-400/50 hover:border-cyan-200 shadow-[0_0_25px_rgba(56,189,248,0.24)]",
    category: "Curos",
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
    borderCls:
      "border-cyan-400/55 hover:border-white shadow-[0_0_25px_rgba(6,182,212,0.26)]",
    category: "Retention",
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
    borderCls:
      "border-slate-300/55 hover:border-cyan-200 shadow-[0_0_25px_rgba(148,163,184,0.26)]",
    category: "Streak",
    ruleText: "Complete a 10-day consecutive learning streak.",
  },
];

// ============================================================================
// 2. LIVE-SHINING PHOTOREALISTIC 3D METALLIC MEDAL ENGINE (medal_3.jpg REPLICA)
//    - Woven Red-White-Blue Tricolor V-Ribbon & Cast-Metal Rectangular Bail
//    - Mirror-Polished Stepped Bezel (24K Gold, Chrome Silver, Copper Bronze)
//    - 3D Embossed Laurel Wreath with Crossed Stems + 3D Lathe Relief Emblem
//    - Continuous Live Specular Light Sweep Animation
// ============================================================================
function LiveShiningMetallicMedalSVG({ badge, size = 86, isEarned = false }) {
  const {
    tier = "gold",
    bezelType = "classic_mirror",
    emblem = "trophy_cup",
    number,
    hasWings = false,
  } = badge;

  const uid = useMemo(
    () => `${badge.id}-${Math.random().toString(36).slice(2, 7)}`,
    [badge.id]
  );

  // High-contrast mirror-metal shader stops modeled directly on medal_3.jpg
  const palettes = {
    gold: {
      bezel: [
        "#FFFBEB",
        "#FDE047",
        "#CA8A04",
        "#3B1703",
        "#FACC15",
        "#FEF9C3",
        "#78350F",
      ],
      dish: ["#FFFBEB", "#FDE047", "#D97706", "#78350F", "#3B1703"],
      lathe: [
        "#713F12",
        "#CA8A04",
        "#FEF9C3",
        "#FFFFFF",
        "#FACC15",
        "#854D0E",
        "#FDE047",
      ],
      leafLight: "#FFFBEB",
      leafMid: "#FACC15",
      leafDark: "#713F12",
      deepShadow: "#271001",
      halo: "rgba(250, 204, 21, 0.52)",
    },
    silver: {
      bezel: [
        "#FFFFFF",
        "#F1F5F9",
        "#94A3B8",
        "#0F172A",
        "#CBD5E1",
        "#FFFFFF",
        "#334155",
      ],
      dish: ["#FFFFFF", "#E2E8F0", "#94A3B8", "#475569", "#0F172A"],
      lathe: [
        "#1E293B",
        "#94A3B8",
        "#FFFFFF",
        "#FFFFFF",
        "#CBD5E1",
        "#334155",
        "#F1F5F9",
      ],
      leafLight: "#FFFFFF",
      leafMid: "#CBD5E1",
      leafDark: "#1E293B",
      deepShadow: "#090D16",
      halo: "rgba(226, 232, 240, 0.48)",
    },
    bronze: {
      bezel: [
        "#FFF7ED",
        "#FDBA74",
        "#EA580C",
        "#360902",
        "#FB923C",
        "#FFEDD5",
        "#7C2D12",
      ],
      dish: ["#FFF7ED", "#FDBA74", "#C2410C", "#7C2D12", "#270802"],
      lathe: [
        "#431407",
        "#C2410C",
        "#FFEDD5",
        "#FFFFFF",
        "#FB923C",
        "#7C2D12",
        "#FDBA74",
      ],
      leafLight: "#FFF7ED",
      leafMid: "#FB923C",
      leafDark: "#431407",
      deepShadow: "#210601",
      halo: "rgba(251, 146, 60, 0.46)",
    },
  };

  const p = palettes[tier] || palettes.gold;

  // Scalloped starburst teeth for seal-style medals
  const scallopedStarPoints = useMemo(() => {
    const pts = [];
    const spikes = 28;
    for (let i = 0; i < spikes * 2; i++) {
      const r = i % 2 === 0 ? 52 : 47.5;
      const a = (i * Math.PI) / spikes;
      pts.push(
        `${(80 + r * Math.cos(a)).toFixed(1)},${(102 + r * Math.sin(a)).toFixed(1)}`
      );
    }
    return pts.join(" ");
  }, []);

  // 3D Sculpted Laurel Wreath Pairs (matching medal_3.jpg)
  const laurelLeaves = [
    { cx: -15, cy: 21, ang: -46, s: 0.9 },
    { cx: -22, cy: 13, ang: -26, s: 0.98 },
    { cx: -26, cy: 3, ang: -8, s: 1.02 },
    { cx: -27, cy: -7, ang: 12, s: 1.02 },
    { cx: -24, cy: -17, ang: 30, s: 0.96 },
    { cx: -18, cy: -25, ang: 48, s: 0.88 },
    { cx: -17, cy: 9, ang: -50, s: 0.82 },
    { cx: -20, cy: -1, ang: -30, s: 0.86 },
    { cx: -19, cy: -11, ang: -10, s: 0.86 },
  ];

  return (
    <div
      className="relative inline-flex items-center justify-center select-none shrink-0"
      style={{ width: size, height: size }}
    >
      {/* Ambient Metallic Halo */}
      <div
        className={`pointer-events-none absolute inset-1.5 rounded-full blur-xl transition-opacity duration-500 ${
          isEarned
            ? "opacity-95 group-hover:opacity-100"
            : "opacity-60 group-hover:opacity-95"
        }`}
        style={{ background: p.halo }}
      />

      <svg
        viewBox="0 0 160 168"
        className="w-full h-full relative z-10 overflow-visible drop-shadow-[0_12px_20px_rgba(0,0,0,0.92)]"
      >
        <defs>
          <linearGradient id={`bzl-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={p.bezel[0]} />
            <stop offset="18%" stopColor={p.bezel[1]} />
            <stop offset="38%" stopColor={p.bezel[2]} />
            <stop offset="54%" stopColor={p.bezel[3]} />
            <stop offset="72%" stopColor={p.bezel[4]} />
            <stop offset="88%" stopColor={p.bezel[5]} />
            <stop offset="100%" stopColor={p.bezel[6]} />
          </linearGradient>

          <radialGradient id={`dsh-${uid}`} cx="30%" cy="25%" r="78%">
            <stop offset="0%" stopColor={p.dish[0]} />
            <stop offset="32%" stopColor={p.dish[1]} />
            <stop offset="68%" stopColor={p.dish[2]} />
            <stop offset="90%" stopColor={p.dish[3]} />
            <stop offset="100%" stopColor={p.dish[4]} />
          </radialGradient>

          <linearGradient id={`lth-${uid}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={p.lathe[0]} />
            <stop offset="18%" stopColor={p.lathe[1]} />
            <stop offset="36%" stopColor={p.lathe[2]} />
            <stop offset="46%" stopColor={p.lathe[3]} />
            <stop offset="60%" stopColor={p.lathe[4]} />
            <stop offset="84%" stopColor={p.lathe[5]} />
            <stop offset="100%" stopColor={p.lathe[6]} />
          </linearGradient>

          <linearGradient id={`lf-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={p.leafLight} />
            <stop offset="48%" stopColor={p.leafMid} />
            <stop offset="100%" stopColor={p.leafDark} />
          </linearGradient>

          <linearGradient id={`sweep-${uid}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0" />
            <stop offset="45%" stopColor="#FFFFFF" stopOpacity="0.15" />
            <stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.85" />
            <stop offset="55%" stopColor="#FFFFFF" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </linearGradient>

          <clipPath id={`coinClip-${uid}`}>
            <circle cx="80" cy="102" r="51" />
          </clipPath>

          <filter id={`relShadow-${uid}`} x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow
              dx="1.3"
              dy="2.1"
              stdDeviation="1.05"
              floodColor={p.deepShadow}
              floodOpacity="0.9"
            />
          </filter>
        </defs>

        {/* ===============================================================
            1. WOVEN RED-WHITE-BLUE TRICOLOR V-RIBBON & METAL BAIL (medal_3.jpg)
        =============================================================== */}
        <g>
          {/* Left Ribbon Strap */}
          <polygon points="38,2 66,42 56,46 26,2" fill="#1E40AF" />
          <polygon points="45,2 71,42 63,44 36,2" fill="#F8FAFC" />
          <polygon points="53,2 77,42 70,43 45,2" fill="#DC2626" />

          {/* Right Ribbon Strap */}
          <polygon points="107,2 83,42 90,43 115,2" fill="#DC2626" />
          <polygon points="115,2 89,42 97,44 124,2" fill="#F8FAFC" />
          <polygon points="122,2 94,42 104,46 134,2" fill="#1E40AF" />

          {/* Cast-Metal Rectangular Top Loop / Bail (From medal_3.jpg) */}
          <rect
            x="62"
            y="33"
            width="36"
            height="14"
            rx="4"
            fill="none"
            stroke={`url(#bzl-${uid})`}
            strokeWidth="5"
          />
          <rect
            x="62"
            y="33"
            width="36"
            height="14"
            rx="4"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="0.9"
            opacity="0.8"
          />
        </g>

        {/* ===============================================================
            2. OPTIONAL SWEEPING 3D VICTORY WINGS (FOR GOLD/WINGED MEDALS)
        =============================================================== */}
        {hasWings && (
          <g
            fill={`url(#bzl-${uid})`}
            stroke={p.leafLight}
            strokeWidth="0.7"
            filter={`url(#relShadow-${uid})`}
          >
            <path d="M32,88 C10,76 2,54 1,34 C15,44 28,58 38,70 Z" />
            <path d="M30,98 C8,90 1,72 0,54 C14,62 27,74 37,84 Z" />
            <path d="M33,108 C14,102 6,90 5,74 C18,80 28,90 38,98 Z" />

            <path d="M128,88 C150,76 158,54 159,34 C145,44 132,58 122,70 Z" />
            <path d="M130,98 C152,90 159,72 160,54 C146,62 133,74 123,84 Z" />
            <path d="M127,108 C146,102 154,90 155,74 C142,80 132,90 122,98 Z" />
          </g>
        )}

        {/* ===============================================================
            3. STEPPED HIGH-GLOSS METALLIC COIN BODY & BEZEL RIMS
        =============================================================== */}
        {/* 3D Bottom Coin Edge Extrusion */}
        <circle cx="81.5" cy="104.5" r="51.5" fill={p.deepShadow} />

        {bezelType === "scalloped_seal" ? (
          <polygon
            points={scallopedStarPoints}
            fill={`url(#bzl-${uid})`}
            stroke="#FFFFFF"
            strokeWidth="1.2"
          />
        ) : (
          <circle
            cx="80"
            cy="102"
            r="51.5"
            fill={`url(#bzl-${uid})`}
            stroke="#FFFFFF"
            strokeWidth="1.3"
          />
        )}

        {/* Deep Dark Specular Step Groove */}
        <circle cx="80" cy="102" r="45" fill={p.deepShadow} />

        {/* Recessed Mirror Dish Face */}
        <circle
          cx="80"
          cy="102"
          r="43.2"
          fill={`url(#dsh-${uid})`}
          stroke={`url(#bzl-${uid})`}
          strokeWidth="2"
        />

        {/* Crisp Inner Specular Bevel Ring */}
        <circle
          cx="80"
          cy="102"
          r="41.4"
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
            stroke={`url(#lth-${uid})`}
            strokeWidth="1.4"
            strokeDasharray="4 2.5"
            opacity="0.85"
          />
        )}

        {/* ===============================================================
            4. EMBOSSED 3D LAUREL WREATH + 3D CENTER SCULPTURE (medal_3.jpg)
        =============================================================== */}
        <g transform="translate(80, 103)" filter={`url(#relShadow-${uid})`}>
          {/* Left & Right Curved Laurel Branches */}
          <path
            d="M-4,25 C-22,20 -29,4 -25,-16 C-23,-23 -19,-28 -14,-31"
            fill="none"
            stroke={`url(#lf-${uid})`}
            strokeWidth="2.4"
            strokeLinecap="round"
          />
          <path
            d="M4,25 C22,20 29,4 25,-16 C23,-23 19,-28 14,-31"
            fill="none"
            stroke={`url(#lf-${uid})`}
            strokeWidth="2.4"
            strokeLinecap="round"
          />

          {/* Sculpted 3D Laurel Leaves Along Both Branches */}
          {laurelLeaves.map((lf, i) => (
            <React.Fragment key={i}>
              <g
                transform={`translate(${lf.cx}, ${lf.cy}) rotate(${lf.ang}) scale(${lf.s})`}
              >
                <path
                  d="M0,0 C-4.5,-3.2 -9.5,-2.2 -11,0 C-9.5,2.2 -4.5,3.2 0,0 Z"
                  fill={`url(#lf-${uid})`}
                  stroke={p.leafDark}
                  strokeWidth="0.5"
                />
              </g>
              <g
                transform={`translate(${-lf.cx}, ${lf.cy}) rotate(${-lf.ang}) scale(${lf.s})`}
              >
                <path
                  d="M0,0 C4.5,-3.2 9.5,-2.2 11,0 C9.5,2.2 4.5,3.2 0,0 Z"
                  fill={`url(#lf-${uid})`}
                  stroke={p.leafDark}
                  strokeWidth="0.5"
                />
              </g>
            </React.Fragment>
          ))}

          {/* Crossed Laurel Stems at Bottom (6 o'clock in medal_3.jpg) */}
          <path
            d="M-10,23 L8,30 M10,23 L-8,30"
            stroke={`url(#lth-${uid})`}
            strokeWidth="2.8"
            strokeLinecap="round"
          />
          <ellipse
            cx="0"
            cy="26.5"
            rx="4"
            ry="2.3"
            fill={`url(#lth-${uid})`}
            stroke={p.leafDark}
            strokeWidth="0.6"
          />

          {/* CENTER 3D SCULPTURE PER CATEGORY */}
          {emblem === "trophy_cup" && (
            <>
              {/* S-Curved Trophy Handles (Exact medal_3.jpg Centerpiece) */}
              <path
                d="M-11,-19 C-20,-19 -20,-5 -12,-3.5 C-9,-3 -8,-1 -10,1"
                fill="none"
                stroke={`url(#lth-${uid})`}
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <path
                d="M11,-19 C20,-19 20,-5 12,-3.5 C9,-3 8,-1 10,1"
                fill="none"
                stroke={`url(#lth-${uid})`}
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              {/* 3D Lathe-Shaded Trophy Cup Bowl */}
              <path
                d="M-13,-22 L13,-22 C13,-3 6.5,4.5 0,4.5 C-6.5,4.5 -13,-3 -13,-22 Z"
                fill={`url(#lth-${uid})`}
                stroke={p.leafDark}
                strokeWidth="0.8"
              />
              <rect
                x="-14"
                y="-24"
                width="28"
                height="3"
                rx="1.4"
                fill={`url(#lth-${uid})`}
                stroke="#FFFFFF"
                strokeWidth="0.55"
              />
              {/* Specular Vertical Highlight on Cup */}
              <path
                d="M-7.5,-20 L-2.5,-20 C-2.5,-6 -4,1 -5.5,2 C-7,1 -7.5,-6 -7.5,-20 Z"
                fill="#FFFFFF"
                opacity="0.65"
              />
              {/* Stem & Base */}
              <path
                d="M-2.8,4.5 L2.8,4.5 L4.2,13.5 L-4.2,13.5 Z"
                fill={`url(#lth-${uid})`}
              />
              <rect
                x="-8.5"
                y="13"
                width="17"
                height="3.2"
                rx="1"
                fill={`url(#lth-${uid})`}
              />
              <path
                d="M-12,16.2 L12,16.2 L14,20 L-14,20 Z"
                fill={`url(#lth-${uid})`}
                stroke={p.leafDark}
                strokeWidth="0.7"
              />
            </>
          )}

          {emblem === "pillars_11" && (
            <>
              <rect
                x="-8.5"
                y="-15"
                width="6"
                height="24"
                rx="1.5"
                fill={`url(#lth-${uid})`}
                stroke="#FFFFFF"
                strokeWidth="0.7"
              />
              <rect
                x="2.5"
                y="-15"
                width="6"
                height="24"
                rx="1.5"
                fill={`url(#lth-${uid})`}
                stroke="#FFFFFF"
                strokeWidth="0.7"
              />
              <rect
                x="-11.5"
                y="-18"
                width="23"
                height="3.2"
                rx="1"
                fill={`url(#lth-${uid})`}
              />
              <rect
                x="-11.5"
                y="9"
                width="23"
                height="3.2"
                rx="1"
                fill={`url(#lth-${uid})`}
              />
            </>
          )}

          {emblem === "open_book" && (
            <>
              <path
                d="M-14,-10 C-7,-13 0,-10 0,-10 C0,-10 7,-13 14,-10 L14,8 C7,5 0,8 0,8 C0,8 -7,5 -14,8 Z"
                fill={`url(#lth-${uid})`}
                stroke="#FFFFFF"
                strokeWidth="1.1"
              />
              <line
                x1="0"
                y1="-10"
                x2="0"
                y2="8"
                stroke={p.deepShadow}
                strokeWidth="1.5"
              />
              <polygon
                points="0,-21 2.5,-15 9,-15 4,-11 6,-5 0,-9 -6,-5 -4,-11 -9,-15 -2.5,-15"
                fill="#FFFFFF"
              />
            </>
          )}

          {emblem === "number_10" && (
            <text
              x="0"
              y="6"
              textAnchor="middle"
              fill={`url(#lth-${uid})`}
              stroke="#FFFFFF"
              strokeWidth="0.6"
              fontSize="24"
              fontWeight="900"
            >
              {number || "10"}
            </text>
          )}

          {emblem === "curo_crest" && (
            <>
              <polygon
                points="0,-20 5,-6 20,-6 8,3 12.5,17 0,8.5 -12.5,17 -8,3 -20,-6 -5,-6"
                fill={`url(#lth-${uid})`}
                stroke="#FFFFFF"
                strokeWidth="0.9"
              />
              <circle
                cx="0"
                cy="0"
                r="7.5"
                fill={`url(#dsh-${uid})`}
                stroke="#FFFFFF"
                strokeWidth="1"
              />
              <text
                x="0"
                y="3.8"
                textAnchor="middle"
                fill="#FFFFFF"
                fontSize="11"
                fontWeight="900"
              >
                C
              </text>
            </>
          )}

          {emblem === "shield_check" && (
            <>
              <path
                d="M0,-19 L14,-12 L14,1 C14,11 0,18 0,18 C0,18 -14,11 -14,1 L-14,-12 Z"
                fill={`url(#lth-${uid})`}
                stroke="#FFFFFF"
                strokeWidth="1.1"
              />
              <polyline
                points="-6,0 -1.5,5 7.5,-5.5"
                fill="none"
                stroke={p.deepShadow}
                strokeWidth="3.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </>
          )}

          {emblem === "flame_relief" && (
            <>
              <path
                d="M0,-21 C7,-11 14,-3 12,7 C10,14 5,18 0,18 C-6,18 -12,13 -12,5 C-12,-2 -6,-6 -4,-13 C-2,-9 1,-7 0,-21 Z"
                fill={`url(#lth-${uid})`}
                stroke="#FFFFFF"
                strokeWidth="1"
              />
              <path
                d="M0,-7 C3.5,-1 6.5,3 5,9 C4,13 2,15 0,15 C-3,15 -5,12 -5,8 C-5,4 -2,1 0,-7 Z"
                fill="#FFFFFF"
                opacity="0.88"
              />
            </>
          )}
        </g>

        {/* ===============================================================
            5. LIVE ANIMATED SPECULAR LIGHT SWEEP ACROSS COIN FACE
        =============================================================== */}
        <g clipPath={`url(#coinClip-${uid})`}>
          <rect
            x="-90"
            y="40"
            width="75"
            height="140"
            fill={`url(#sweep-${uid})`}
            transform="rotate(28 80 102)"
            className="animate-medal-sheen"
          />
        </g>

        {/* Crisp Starburst Specular Glints on Rim */}
        <g transform="translate(44, 68)" fill="#FFFFFF" className="animate-pulse">
          <polygon points="0,-8 1.8,-1.8 8,0 1.8,1.8 0,8 -1.8,1.8 -8,0 -1.8,-1.8" />
        </g>
        <g transform="translate(116, 134)" fill="#FFFFFF">
          <polygon points="0,-6 1.3,-1.3 6,0 1.3,1.3 0,6 -1.3,1.3 -6,0 -1.3,-1.3" />
        </g>
      </svg>
    </div>
  );
}

// ============================================================================
// 3. MAIN REWARDS COMPONENT
//    - Strict Rule-Based Unlocking (No manual equip button!)
//    - No Full-Screen Button (Badge Gallery is 100% visible inline)
//    - Live Shining Realistic Metallic Medals
// ============================================================================
export default function Rewards() {
  const [checking, setChecking] = useState(false);
  const [selectedBadge, setSelectedBadge] = useState(null);
  const [tierFilter, setTierFilter] = useState("all"); // 'all' | 'gold' | 'silver' | 'bronze'
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [lastSynced, setLastSynced] = useState(null);

  // Current User's Real Backend Telemetry
  const [userMetrics, setUserMetrics] = useState({
    curos: 0,
    completion: 0,
    application: 0,
    retention: 0,
    streak: 0,
  });

  // Backend-verified earned badge IDs (if returned by /badges or /rewards endpoint)
  const [apiEarnedIds, setApiEarnedIds] = useState([]);

  const getCurrentUserProfile = useCallback(() => {
    try {
      const rawUser =
        localStorage.getItem("user") ||
        localStorage.getItem("currentUser") ||
        localStorage.getItem("saarthi_user") ||
        localStorage.getItem("user_details");

      if (!rawUser) {
        return { userId: null, name: "", email: "" };
      }

      const parsed = JSON.parse(rawUser);
      const userId = Number(
        parsed?.user_id ??
          parsed?.id ??
          parsed?.userId ??
          parsed?.userID ??
          localStorage.getItem("user_id") ??
          0
      );

      return {
        userId: Number.isFinite(userId) && userId > 0 ? userId : null,
        name: String(parsed?.name || parsed?.full_name || "").toLowerCase(),
        email: String(parsed?.email || "").toLowerCase(),
      };
    } catch {
      return { userId: null, name: "", email: "" };
    }
  }, []);

  // Fetch Current User's Real Telemetry & Earned Badges
  const checkLiveUserBadges = useCallback(async () => {
    setChecking(true);

    const profile = getCurrentUserProfile();
    const userId = profile.userId;
    const storedUserName = profile.name;
    const storedUserEmail = profile.email;

    try {
      if (userId) {
        try {
          await axios.post(`${API_BASE_URL}/badges/check/${userId}`);
        } catch {
          // Ignore: badge check may fail when no criteria match or backend is unavailable
        }

        try {
          const userBadgesRes = await axios.get(
            `${API_BASE_URL}/badges/user/${userId}`,
            { params: { _t: Date.now() } }
          );

          const apiEarnedIds = Array.isArray(userBadgesRes.data)
            ? userBadgesRes.data
                .map((badge) => Number(badge.badge_id ?? badge.id ?? badge.badgeId))
                .filter((id) => Number.isFinite(id))
            : [];

          if (apiEarnedIds.length > 0) {
            setApiEarnedIds(apiEarnedIds);
          }
        } catch {
          // Ignore and continue with fallback metrics lookup below
        }
      }

      // 2. Check live leaderboard telemetry for current user
      const res = await axios.get(`${API_BASE_URL}/analytics/leaderboards`, {
        params: { _t: Date.now() },
      });
      const list = res.data?.competitors || [];
      const matchedUser =
        list.find(
          (u) =>
            (storedUserEmail &&
              String(u.email || "").toLowerCase() === storedUserEmail) ||
            (storedUserName &&
              String(u.name || "").toLowerCase() === storedUserName)
        ) || null;

      if (matchedUser) {
        setUserMetrics({
          curos: Number(matchedUser.curos || 0),
          completion: Number(matchedUser.programs_completed || 0),
          application:
            Number(matchedUser.application_pct || 0) >= 80
              ? 2
              : Number(matchedUser.application_pct || 0) > 0
              ? 1
              : 0,
          retention:
            Number(matchedUser.retention_pct || 0) >= 80
              ? 3
              : Number(matchedUser.retention_pct || 0) > 0
              ? 1
              : 0,
          streak: Number(matchedUser.streak_days || 0),
        });
      }
      setLastSynced(new Date().toLocaleTimeString());
    } catch {
      // Keep current telemetry on offline
    } finally {
      setTimeout(() => setChecking(false), 450);
    }
  }, [getCurrentUserProfile]);

  useEffect(() => {
    checkLiveUserBadges();
  }, [checkLiveUserBadges]);

  // Compute enrichments for all 15 badges (unlocked status + live progress)
  const enrichedBadges = useMemo(() => {
    return REWARDS_BADGES.map((b) => {
      const rawProg = Number(userMetrics[b.metricKey] || 0);
      const isUnlockedByMetric = rawProg >= b.target;
      const isManuallyEquipped = apiEarnedIds.includes(b.id);
      const isEarned = isUnlockedByMetric || isManuallyEquipped;
      const currentProgress = isEarned
        ? b.target
        : Math.min(b.target, rawProg);
      const progressPct = Math.min(
        100,
        Math.round((currentProgress / Math.max(1, b.target)) * 100)
      );

      return {
        ...b,
        isEarned,
        currentProgress,
        progressPct,
      };
    });
  }, [userMetrics, apiEarnedIds]);

  // Current User's Earned Medals (Displayed in Earned Badges & Badge Gallery!)
  const earnedMedals = useMemo(
    () => enrichedBadges.filter((b) => b.isEarned),
    [enrichedBadges]
  );

  // Next 3 closest medals to unlocking (shown in Gallery when 0 earned yet)
  const closestNextMedals = useMemo(() => {
    return [...enrichedBadges]
      .filter((b) => !b.isEarned)
      .sort((a, b) => b.progressPct - a.progressPct || a.curos - b.curos)
      .slice(0, 3);
  }, [enrichedBadges]);

  // Top 4 KPI Counts (Reflecting the Current User's Strictly Earned Medals)
  const kpiStats = useMemo(() => {
    return {
      total: earnedMedals.length,
      gold: earnedMedals.filter((b) => b.tier === "gold").length,
      silver: earnedMedals.filter((b) => b.tier === "silver").length,
      bronze: earnedMedals.filter((b) => b.tier === "bronze").length,
      earnedCurosBonus: earnedMedals.reduce((s, b) => s + b.curos, 0),
    };
  }, [earnedMedals]);

  const filteredBadges = useMemo(() => {
    return enrichedBadges.filter((b) => {
      if (tierFilter !== "all" && b.tier !== tierFilter) return false;
      if (categoryFilter !== "All" && b.category !== categoryFilter)
        return false;
      return true;
    });
  }, [enrichedBadges, tierFilter, categoryFilter]);

  const featuredBadge = earnedMedals[0] || null;
  const mostPopularBadge =
    enrichedBadges.find((b) => b.id === "curos_bronze") || enrichedBadges[2];

  return (
    <MainLayout>
      <div className="-m-4 sm:-m-6 p-4 sm:p-6 min-h-screen bg-[#05050B] text-slate-100 font-sans space-y-6 overflow-x-hidden selection:bg-amber-400 selection:text-black">
        {/* Live Metallic Sheen Keyframes */}
        <style>{`
          @keyframes medalSheenSweep {
            0% { transform: translateX(-140px) rotate(25deg); opacity: 0; }
            20% { opacity: 0.9; }
            45% { transform: translateX(260px) rotate(25deg); opacity: 0; }
            100% { transform: translateX(260px) rotate(25deg); opacity: 0; }
          }
          .animate-medal-sheen {
            animation: medalSheenSweep 4.2s cubic-bezier(0.4, 0, 0.2, 1) infinite;
          }
        `}</style>

        {/* ===================================================================
            1. COMMAND HERO BANNER WITH LIVE TELEMETRY VAULT STATUS
        =================================================================== */}
        <header className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#160A2C] via-[#241148] to-[#110824] p-6 sm:p-8 border border-purple-500/30 shadow-[0_0_55px_-12px_rgba(139,92,246,0.4)] flex flex-wrap items-center justify-between gap-6">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-400/75 to-transparent" />
          <div className="pointer-events-none absolute -right-12 -top-16 w-80 h-80 bg-amber-400/10 rounded-full blur-3xl" />

          <div className="relative z-10">
            <div className="flex items-center gap-2.5">
              <span className="text-[10px] font-black uppercase tracking-[0.26em] text-amber-300">
                GAMIFICATION • OFFICIAL MEDAL VAULT
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-white/5 text-slate-300 border border-white/10 flex items-center gap-1.5">
                <span
                  className={`w-1.5 h-1.5 rounded-full bg-emerald-400 ${
                    checking ? "animate-ping" : ""
                  }`}
                />
                {lastSynced ? `Verified ${lastSynced}` : "Rule Engine Active"}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-1.5 tracking-tight">
              Your Badge Collection
            </h1>
            <p className="text-xs sm:text-sm text-purple-100/80 mt-1">
              Showcase your achievements and unlock new metallic medals automatically by completing Curos & learning milestones.
            </p>
          </div>

          {/* Right Live Curo & Vault Mastery Readout */}
          <div className="relative z-10 bg-[#0A0816]/90 backdrop-blur-xl border border-amber-400/30 rounded-2xl px-5 py-3.5 min-w-[270px] shadow-[0_0_30px_rgba(0,0,0,0.6)]">
            <div className="flex items-center justify-between text-xs font-extrabold mb-1.5">
              <span className="text-slate-300">Your Curo Balance:</span>
              <span className="text-amber-300 font-black">
                🪙 {userMetrics.curos} Curos
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-black/70 overflow-hidden p-[1px] border border-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-500 via-yellow-400 to-emerald-400 transition-all duration-500"
                style={{
                  width: `${Math.max(
                    4,
                    Math.round((kpiStats.total / REWARDS_BADGES.length) * 100)
                  )}%`,
                }}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 mt-1.5">
              <span>
                Unlocked: {kpiStats.total} / {REWARDS_BADGES.length} Medals
              </span>
              <span className="text-amber-300">
                +{kpiStats.earnedCurosBonus} Curos Bonus
              </span>
            </div>
          </div>
        </header>

        {/* ===================================================================
            2. 4 METALLIC TIER KPI CARDS (Total, Gold, Silver, Bronze)
        =================================================================== */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              id: "all",
              label: "Total",
              value: kpiStats.total,
              sub: `${kpiStats.total} of 15 Medals Unlocked`,
              border:
                "border-purple-500/50 hover:border-purple-400 shadow-[0_0_25px_rgba(168,85,247,0.22)]",
              textCol: "text-white",
              labelCol: "text-purple-300",
              sampleBadge: REWARDS_BADGES[6],
            },
            {
              id: "gold",
              label: "Gold",
              value: kpiStats.gold,
              sub: `${kpiStats.gold} of 5 Sovereign Gold`,
              border:
                "border-amber-400/65 hover:border-yellow-300 shadow-[0_0_25px_rgba(245,158,11,0.28)]",
              textCol: "text-amber-300",
              labelCol: "text-amber-300",
              sampleBadge: REWARDS_BADGES[7],
            },
            {
              id: "silver",
              label: "Silver",
              value: kpiStats.silver,
              sub: `${kpiStats.silver} of 5 Sterling Silver`,
              border:
                "border-slate-300/55 hover:border-white shadow-[0_0_25px_rgba(203,213,225,0.22)]",
              textCol: "text-slate-100",
              labelCol: "text-slate-300",
              sampleBadge: REWARDS_BADGES[11],
            },
            {
              id: "bronze",
              label: "Bronze",
              value: kpiStats.bronze,
              sub: `${kpiStats.bronze} of 5 Burnished Bronze`,
              border:
                "border-orange-500/55 hover:border-orange-300 shadow-[0_0_25px_rgba(234,88,12,0.24)]",
              textCol: "text-orange-300",
              labelCol: "text-orange-300",
              sampleBadge: REWARDS_BADGES[0],
            },
          ].map((card) => {
            const isSelected = tierFilter === card.id && card.id !== "all";
            return (
              <div
                key={card.id}
                onClick={() =>
                  setTierFilter(tierFilter === card.id ? "all" : card.id)
                }
                className={`cursor-pointer group bg-[#0C0B16] rounded-2xl p-4 sm:p-5 border ${
                  card.border
                } ${
                  isSelected ? "ring-2 ring-amber-400 bg-[#141126]" : ""
                } flex items-center justify-between transition-all duration-300 hover:-translate-y-0.5`}
              >
                <div>
                  <span
                    className={`text-xs font-extrabold block ${card.labelCol}`}
                  >
                    {card.label}
                  </span>
                  <span
                    className={`text-3xl font-black mt-1 block ${card.textCol}`}
                  >
                    {card.value}
                  </span>
                  <span className="text-[11px] font-semibold text-slate-500 mt-0.5 block">
                    {card.sub}
                  </span>
                </div>
                <div className="transition-transform duration-300 group-hover:scale-110">
                  <LiveShiningMetallicMedalSVG
                    badge={card.sampleBadge}
                    size={54}
                    isEarned={true}
                  />
                </div>
              </div>
            );
          })}
        </section>

        {/* ===================================================================
            3. EARNED BADGES BAR + CHECK FOR NEW BUTTON
        =================================================================== */}
        <section className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <h2 className="text-base font-extrabold text-white">
                Earned Badges
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-amber-500/15 text-amber-300 border border-amber-400/35">
                {earnedMedals.length} Unlocked
              </span>
            </div>

            <button
              onClick={checkLiveUserBadges}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:opacity-95 text-white text-xs font-extrabold shadow-[0_0_22px_rgba(147,51,234,0.45)] flex items-center gap-2 transition cursor-pointer"
            >
              <span className={checking ? "animate-spin" : ""}>↻</span>
              <span>{checking ? "Verifying Curos..." : "Check for New"}</span>
            </button>
          </div>

          {earnedMedals.length > 0 && (
            <div className="flex items-center gap-3.5 overflow-x-auto pb-2 pt-1">
              {earnedMedals.map((b) => (
                <div
                  key={b.id}
                  onClick={() => setSelectedBadge(b)}
                  className="group cursor-pointer shrink-0 flex items-center gap-3.5 bg-gradient-to-r from-[#17132B] to-[#0D0B18] px-4 py-3 rounded-2xl border border-amber-400/50 shadow-[0_0_25px_-5px_rgba(245,158,11,0.35)] hover:border-amber-300 transition"
                >
                  <LiveShiningMetallicMedalSVG
                    badge={b}
                    size={52}
                    isEarned={true}
                  />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-extrabold text-white">
                        {b.name}
                      </span>
                      <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#10B981]" />
                    </div>
                    <span className="text-[11px] font-black text-amber-300 block mt-0.5">
                      +{b.curos} Curos • Verified
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ===================================================================
            4. AVAILABLE TO EARN — 5x3 LIVE-SHINING METALLIC MEDAL MATRIX
        =================================================================== */}
        <section className="space-y-3.5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-base font-extrabold text-white">
              Available to Earn
            </h2>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                "All",
                "Application",
                "Completion",
                "Curos",
                "Retention",
                "Streak",
              ].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-3 py-1 rounded-xl text-[11px] font-extrabold transition cursor-pointer ${
                    categoryFilter === cat
                      ? "bg-amber-400 text-slate-950 shadow-[0_0_15px_rgba(245,158,11,0.4)]"
                      : "bg-[#0C0B16] text-slate-400 hover:text-white border border-white/10"
                  }`}
                >
                  {cat}
                </button>
              ))}
              {tierFilter !== "all" && (
                <button
                  onClick={() => setTierFilter("all")}
                  className="px-2.5 py-1 rounded-xl text-[11px] font-extrabold bg-rose-500/20 text-rose-300 border border-rose-400/30 cursor-pointer"
                >
                  Reset Tier ✕
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {filteredBadges.map((badge) => {
              const cardSurface =
                badge.tier === "gold"
                  ? "bg-gradient-to-b from-[#1E170A]/95 via-[#0E0C1A]/98 to-[#080710]"
                  : badge.tier === "silver"
                  ? "bg-gradient-to-b from-[#141A29]/95 via-[#0E0C1A]/98 to-[#080710]"
                  : "bg-gradient-to-b from-[#1E120A]/95 via-[#0E0C1A]/98 to-[#080710]";

              const curosPillCls =
                badge.tier === "gold"
                  ? "bg-amber-400/20 text-amber-300 border-amber-400/50"
                  : badge.tier === "silver"
                  ? "bg-slate-300/15 text-slate-200 border-slate-300/40"
                  : "bg-orange-500/20 text-orange-300 border-orange-400/45";

              return (
                <div
                  key={badge.id}
                  onClick={() => setSelectedBadge(badge)}
                  className={`group cursor-pointer rounded-2xl p-4 flex flex-col items-center justify-between text-center min-h-[205px] ${cardSurface} border-2 ${
                    badge.isEarned
                      ? "border-emerald-400/80 shadow-[0_0_30px_rgba(16,185,129,0.28)]"
                      : badge.borderCls
                  } backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02] select-none relative overflow-hidden`}
                >
                  {/* Top Category & Status Tag */}
                  <div className="w-full flex items-center justify-between text-[9.5px] font-black uppercase tracking-wider">
                    <span className="text-slate-400">{badge.category}</span>
                    {badge.isEarned ? (
                      <span className="px-2 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/40">
                        ✓ Unlocked
                      </span>
                    ) : (
                      <span
                        className={
                          badge.tier === "gold"
                            ? "text-amber-300"
                            : badge.tier === "silver"
                            ? "text-slate-300"
                            : "text-orange-300"
                        }
                      >
                        🔒 {badge.tier}
                      </span>
                    )}
                  </div>

                  {/* Live-Shining 3D Metallic Medal */}
                  <div className="my-auto py-1.5 transition-transform duration-300 group-hover:scale-110">
                    <LiveShiningMetallicMedalSVG
                      badge={badge}
                      size={88}
                      isEarned={badge.isEarned}
                    />
                  </div>

                  {/* Badge Name, Progress Bar, Curos Reward & Milestone Target */}
                  <div className="w-full mt-1.5 space-y-2">
                    <h3 className="text-xs font-extrabold text-white group-hover:text-amber-200 transition truncate">
                      {badge.name}
                    </h3>

                    <div className="w-full h-1.5 rounded-full bg-black/70 overflow-hidden border border-white/5">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          badge.isEarned
                            ? "bg-gradient-to-r from-emerald-400 to-teal-300"
                            : badge.tier === "gold"
                            ? "bg-gradient-to-r from-amber-500 to-yellow-300"
                            : badge.tier === "silver"
                            ? "bg-gradient-to-r from-slate-400 to-white"
                            : "bg-gradient-to-r from-orange-600 to-amber-400"
                        }`}
                        style={{
                          width: `${Math.max(8, badge.progressPct)}%`,
                        }}
                      />
                    </div>

                    <div className="flex items-center justify-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-black border ${curosPillCls}`}
                      >
                        +{badge.curos} Curos
                      </span>
                      <span className="text-[10px] font-bold text-slate-400">
                        {badge.currentProgress} / {badge.target}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ===================================================================
            5. BOTTOM BENTO:
               - LEFT 8 COLS: PERSONAL BADGE GALLERY (Fully Visible Inline — No Full Screen Button!)
               - RIGHT 4 COLS: FEATURED BADGE + MOST POPULAR BADGE
        =================================================================== */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          {/* LEFT 8 COLS: ALWAYS-VISIBLE PERSONAL MEDAL GALLERY */}
          <div className="lg:col-span-8 bg-[#0C0B16] rounded-3xl p-6 border border-purple-500/25 shadow-[0_12px_40px_rgba(0,0,0,0.65)] flex flex-col justify-between relative overflow-hidden min-h-[295px]">
            <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-48 bg-amber-500/10 rounded-full blur-3xl" />

            {/* Header (No Full-Screen Button — Gallery is Already 100% Visible!) */}
            <div className="flex flex-wrap items-center justify-between gap-2 relative z-10 border-b border-white/10 pb-3.5">
              <div className="flex items-center gap-2.5">
                <span className="text-base">🎖️</span>
                <div>
                  <h3 className="text-base font-extrabold text-white tracking-wide">
                    Badge Gallery
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Your personal unlocked metallic medals ({earnedMedals.length}{" "}
                    of {REWARDS_BADGES.length} earned)
                  </p>
                </div>
              </div>

              <span className="px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-purple-500/15 text-purple-200 border border-purple-400/30">
                {earnedMedals.length > 0
                  ? `✓ ${earnedMedals.length} Active in Showcase`
                  : "🔒 Milestone-Locked Vault"}
              </span>
            </div>

            {/* Displays ONLY Current User's Earned Medals (or Next Closest Milestones if 0 earned) */}
            {earnedMedals.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 my-auto py-5 relative z-10">
                {earnedMedals.map((medal) => (
                  <div
                    key={medal.id}
                    onClick={() => setSelectedBadge(medal)}
                    className="group cursor-pointer rounded-2xl p-4 bg-gradient-to-b from-[#161329] to-[#080710] border border-amber-400/45 shadow-[0_0_25px_rgba(245,158,11,0.2)] flex flex-col items-center text-center transition hover:-translate-y-1"
                  >
                    <LiveShiningMetallicMedalSVG
                      badge={medal}
                      size={78}
                      isEarned={true}
                    />
                    <h4 className="text-xs font-extrabold text-white mt-2.5 truncate w-full">
                      {medal.name}
                    </h4>
                    <span className="text-[10px] font-black text-emerald-400 mt-0.5">
                      ✓ Unlocked (+{medal.curos} Curos)
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="my-auto py-5 space-y-4 relative z-10">
                <div className="text-center space-y-1">
                  <p className="text-sm font-extrabold text-white">
                    No badges unlocked yet — Your 3 Nearest Milestones:
                  </p>
                  <p className="text-xs text-slate-400">
                    Complete any of the learning or Curo targets below to automatically unlock your first medal in this gallery.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  {closestNextMedals.map((m) => (
                    <div
                      key={m.id}
                      onClick={() => setSelectedBadge(m)}
                      className="group cursor-pointer rounded-2xl p-3.5 bg-[#07060E] border border-white/10 hover:border-amber-400/50 flex items-center gap-3 transition"
                    >
                      <LiveShiningMetallicMedalSVG
                        badge={m}
                        size={56}
                        isEarned={false}
                      />
                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs font-extrabold text-white truncate">
                          {m.name}
                        </h4>
                        <span className="text-[10px] font-black text-amber-300 block">
                          +{m.curos} Curos Reward
                        </span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          Need {m.remaining} more {m.unit}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400 relative z-10">
              <span>
                Medals unlock automatically as soon as your Curos or course completions meet the target.
              </span>
              <span className="text-amber-300 font-bold">
                Earned Bonus: +{kpiStats.earnedCurosBonus} Curos
              </span>
            </div>
          </div>

          {/* RIGHT 4 COLS: FEATURED BADGE + MOST POPULAR BADGE */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            {/* Card 1: Featured Badge */}
            <div
              onClick={() =>
                setSelectedBadge(featuredBadge || enrichedBadges[6])
              }
              className="cursor-pointer flex-1 bg-[#0C0B16] rounded-3xl p-5 border-2 border-amber-400/55 shadow-[0_0_30px_rgba(245,158,11,0.2)] flex items-center justify-between relative overflow-hidden group"
            >
              <div className="z-10 pr-2">
                <span className="text-xs font-extrabold uppercase tracking-wider text-amber-300 block">
                  Featured Badge
                </span>
                {featuredBadge ? (
                  <>
                    <h4 className="text-base font-extrabold text-white mt-2">
                      {featuredBadge.name}
                    </h4>
                    <p className="text-xs text-emerald-400 font-bold mt-0.5">
                      ✓ Unlocked in Your Gallery
                    </p>
                    <span className="inline-block mt-2.5 px-3 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-400/40">
                      +{featuredBadge.curos} Curos
                    </span>
                  </>
                ) : (
                  <>
                    <h4 className="text-sm font-extrabold text-white mt-2">
                      No badges earned yet
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Unlock your first medal to showcase it here
                    </p>
                    <span className="inline-block mt-2.5 px-3 py-0.5 rounded-full text-[10px] font-black bg-amber-500/15 text-amber-300 border border-amber-400/35">
                      +0 Curos
                    </span>
                  </>
                )}
              </div>

              <div className="relative shrink-0 select-none transition-transform duration-300 group-hover:scale-110">
                <LiveShiningMetallicMedalSVG
                  badge={featuredBadge || enrichedBadges[6]}
                  size={84}
                  isEarned={Boolean(featuredBadge)}
                />
              </div>
            </div>

            {/* Card 2: Most Popular Badge */}
            <div
              onClick={() => setSelectedBadge(mostPopularBadge)}
              className="cursor-pointer flex-1 bg-gradient-to-br from-[#3B1578] via-[#25104E] to-[#110B24] rounded-3xl p-5 border-2 border-purple-400/55 shadow-[0_0_30px_rgba(168,85,247,0.3)] flex items-center justify-between relative overflow-hidden group"
            >
              <div className="z-10 pr-2">
                <span className="text-xs font-extrabold uppercase tracking-wider text-amber-200 flex items-center gap-1.5">
                  <span>⭐</span> Most Popular
                </span>
                <h4 className="text-base font-extrabold text-white mt-2">
                  {mostPopularBadge.name}
                </h4>
                <p className="text-[11px] text-purple-200/80 mt-0.5">
                  Target: {mostPopularBadge.target} {mostPopularBadge.unit}
                </p>
                <span className="inline-block mt-2.5 px-3 py-0.5 rounded-full text-[10px] font-black bg-black/40 text-amber-300 border border-amber-400/40">
                  +{mostPopularBadge.curos} Curos
                </span>
              </div>

              <div className="relative shrink-0 select-none transition-transform duration-300 group-hover:scale-110">
                <LiveShiningMetallicMedalSVG
                  badge={mostPopularBadge}
                  size={84}
                  isEarned={mostPopularBadge.isEarned}
                />
              </div>
            </div>
          </div>
        </section>

        {/* ===================================================================
            6. UP-CLOSE 3D MEDAL INSPECTION MODAL (NO MANUAL EQUIP BUTTON!)
               Strictly displays milestone verification rules & live progress
        =================================================================== */}
        {selectedBadge && (
          <div
            onClick={() => setSelectedBadge(null)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-md bg-[#0C0B16] border-2 border-amber-400/60 rounded-3xl p-6 text-center shadow-[0_0_90px_rgba(245,158,11,0.35)] overflow-hidden"
            >
              <button
                onClick={() => setSelectedBadge(null)}
                className="absolute top-4 right-4 w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs cursor-pointer"
              >
                ✕
              </button>

              <div className="my-5 flex justify-center">
                <LiveShiningMetallicMedalSVG
                  badge={selectedBadge}
                  size={155}
                  isEarned={selectedBadge.isEarned}
                />
              </div>

              <h2 className="text-xl font-black text-white tracking-tight">
                {selectedBadge.name}
              </h2>
              <span className="inline-block mt-1.5 px-3 py-0.5 rounded-full text-xs font-black bg-amber-500/20 text-amber-300 border border-amber-400/40">
                +{selectedBadge.curos} Curos Reward
              </span>

              <p className="text-xs text-slate-300 mt-3 leading-relaxed">
                {selectedBadge.ruleText}
              </p>

              {/* 3 Telemetry Pills */}
              <div className="grid grid-cols-3 gap-2 my-4 text-xs">
                <div className="p-2.5 rounded-xl bg-[#07060E] border border-white/10">
                  <span className="text-[10px] text-slate-500 block">
                    Category
                  </span>
                  <span className="font-extrabold text-white">
                    {selectedBadge.category}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-[#07060E] border border-white/10">
                  <span className="text-[10px] text-slate-500 block">
                    Progress
                  </span>
                  <span className="font-extrabold text-white">
                    {Math.min(
                      100,
                      Math.round(
                        (selectedBadge.currentProgress /
                          Math.max(1, selectedBadge.target)) *
                          100
                      )
                    )}
                    %
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-[#07060E] border border-white/10">
                  <span className="text-[10px] text-slate-500 block">
                    Tier
                  </span>
                  <span className="font-extrabold capitalize text-white">
                    {selectedBadge.tier}
                  </span>
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-[#07060E] px-3 py-3 text-left text-[11px] leading-relaxed text-slate-300">
                {selectedBadge.isEarned ? (
                  <span>
                    ✓ Milestone Completed! This medal is unlocked in your Badge Gallery.
                  </span>
                ) : (
                  <span>
                    🔒 Locked — Complete {selectedBadge.remaining} more {selectedBadge.unit} to unlock automatically.
                  </span>
                )}
              </div>

              <button
                onClick={() => setSelectedBadge(null)}
                className="mt-4 w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg hover:opacity-95 transition cursor-pointer"
              >
                Close View
              </button>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}