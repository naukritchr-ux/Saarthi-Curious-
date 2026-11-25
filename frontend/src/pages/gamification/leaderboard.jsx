/* eslint-disable react-hooks/set-state-in-effect */
import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
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
  (import.meta.env?.DEV
    ? "http://127.0.0.1:8000"
    : "https://saarthi-curious-00e8.onrender.com");

// ============================================================================
// AUTOMATIC IMAGE LOCATOR FOR `trophy_cabinet` IN VS CODE (src/ OR public/)
// ============================================================================
const VSCODE_ASSET_IMAGES = import.meta.glob(
  "/src/**/*.{png,jpg,jpeg,webp,avif,JPG,PNG}",
  { eager: true, import: "default" }
);

function resolveTrophyCabinetSources() {
  const matchedFromSrc = Object.entries(VSCODE_ASSET_IMAGES).find(([path]) =>
    /trophy[_-\s]?cabinet|glass\s*trophy\s*display/i.test(path)
  );
  const candidates = [
    ...(matchedFromSrc ? [matchedFromSrc[1]] : []),
    "/trophy_cabinet.png",
    "/trophy_cabinet.jpg",
    "/trophy_cabinet.jpeg",
    "/trophy_cabinet.webp",
    "/trophy-cabinet.png",
    "/trophy-cabinet.jpg",
    "/Glass Trophy Display with Gold Cup and Medals.png",
    "/assets/trophy_cabinet.png",
    "/assets/trophy_cabinet.jpg",
  ];
  return Array.from(new Set(candidates.filter(Boolean)));
}

const CABINET_CANDIDATE_URLS = resolveTrophyCabinetSources();
const STORAGE_KEY_CABINET_IMG = "saarthi_trophy_cabinet_override_v5";

// ============================================================================
// 1. DYNAMIC GOLDEN / THEME-AWARE RECHARTS TOOLTIP
// ============================================================================
const DynamicTooltip = ({ active, payload, label, unit, accentHex }) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div
      className="bg-[#090806]/95 backdrop-blur-xl px-4 py-3 rounded-2xl text-xs z-50 border min-w-[165px]"
      style={{
        borderColor: `${accentHex}88`,
        boxShadow: `0 12px 30px rgba(0,0,0,0.85), 0 0 24px ${accentHex}38`,
      }}
    >
      <p
        className="font-black mb-1.5 border-b border-amber-200/15 pb-1.5 tracking-wide flex items-center justify-between gap-3"
        style={{ color: accentHex }}
      >
        <span>{label}</span>
        <span className="text-[9px] uppercase tracking-widest text-amber-100/60">
          Live
        </span>
      </p>
      {payload.map((entry, idx) => (
        <div
          key={idx}
          className="flex items-center justify-between gap-4 py-0.5"
        >
          <span className="text-slate-300 font-semibold">{entry.name}:</span>
          <span className="font-black text-white">
            {entry.value}
            {unit}
          </span>
        </div>
      ))}
    </div>
  );
};

// ============================================================================
// 2. PHOTOREALISTIC 3D METALLIC MEDAL SVG (Gold #1, Silver #2, Bronze #3)
// ============================================================================
function RealisticMetallicMedalSVG({
  tier = "gold",
  size = 140,
  showRibbon = true,
}) {
  const uid = useMemo(
    () => `${tier}-${Math.random().toString(36).slice(2, 8)}`,
    [tier]
  );

  const palettes = {
    gold: {
      bezelOuter: [
        "#FFFBEB",
        "#FDE047",
        "#CA8A04",
        "#422006",
        "#EAB308",
        "#FEF9C3",
        "#854D0E",
      ],
      dishFace: ["#FEF9C3", "#FACC15", "#CA8A04", "#713F12", "#422006"],
      cupLathe: [
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
      rimHighlight: "#FFFFFF",
      deepShadow: "#2E1503",
      glowColor: "rgba(250, 204, 21, 0.5)",
    },
    silver: {
      bezelOuter: [
        "#FFFFFF",
        "#F1F5F9",
        "#94A3B8",
        "#0F172A",
        "#CBD5E1",
        "#FFFFFF",
        "#334155",
      ],
      dishFace: ["#FFFFFF", "#E2E8F0", "#94A3B8", "#475569", "#0F172A"],
      cupLathe: [
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
      rimHighlight: "#FFFFFF",
      deepShadow: "#090D16",
      glowColor: "rgba(226, 232, 240, 0.45)",
    },
    bronze: {
      bezelOuter: [
        "#FFF7ED",
        "#FDBA74",
        "#EA580C",
        "#3B0A02",
        "#FB923C",
        "#FFEDD5",
        "#7C2D12",
      ],
      dishFace: ["#FFEDD5", "#FDBA74", "#C2410C", "#7C2D12", "#2A0A04"],
      cupLathe: [
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
      rimHighlight: "#FFF7ED",
      deepShadow: "#230702",
      glowColor: "rgba(251, 146, 60, 0.48)",
    },
  };

  const p = palettes[tier] || palettes.gold;

  const laurelPairs = [
    { cx: -16, cy: 23, ang: -48, s: 0.92 },
    { cx: -24, cy: 15, ang: -28, s: 1.0 },
    { cx: -29, cy: 5, ang: -10, s: 1.05 },
    { cx: -30, cy: -6, ang: 10, s: 1.05 },
    { cx: -27, cy: -17, ang: 28, s: 1.0 },
    { cx: -21, cy: -26, ang: 45, s: 0.92 },
    { cx: -14, cy: -32, ang: 62, s: 0.82 },
    { cx: -18, cy: 11, ang: -52, s: 0.85 },
    { cx: -22, cy: 0, ang: -32, s: 0.9 },
    { cx: -22, cy: -11, ang: -12, s: 0.9 },
    { cx: -18, cy: -20, ang: 15, s: 0.85 },
  ];

  return (
    <div
      className="relative inline-flex items-center justify-center select-none shrink-0"
      style={{ width: size, height: size }}
    >
      <div
        className="pointer-events-none absolute inset-2 rounded-full blur-2xl opacity-80"
        style={{ background: p.glowColor }}
      />
      <svg
        viewBox={showRibbon ? "0 0 160 175" : "12 36 136 136"}
        className="w-full h-full relative z-10 overflow-visible drop-shadow-[0_14px_22px_rgba(0,0,0,0.9)]"
      >
        <defs>
          <linearGradient
            id={`bezel-${uid}`}
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop offset="0%" stopColor={p.bezelOuter[0]} />
            <stop offset="18%" stopColor={p.bezelOuter[1]} />
            <stop offset="38%" stopColor={p.bezelOuter[2]} />
            <stop offset="54%" stopColor={p.bezelOuter[3]} />
            <stop offset="72%" stopColor={p.bezelOuter[4]} />
            <stop offset="88%" stopColor={p.bezelOuter[5]} />
            <stop offset="100%" stopColor={p.bezelOuter[6]} />
          </linearGradient>
          <radialGradient id={`dish-${uid}`} cx="32%" cy="26%" r="78%">
            <stop offset="0%" stopColor={p.dishFace[0]} />
            <stop offset="32%" stopColor={p.dishFace[1]} />
            <stop offset="68%" stopColor={p.dishFace[2]} />
            <stop offset="90%" stopColor={p.dishFace[3]} />
            <stop offset="100%" stopColor={p.dishFace[4]} />
          </radialGradient>
          <linearGradient id={`cup-${uid}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={p.cupLathe[0]} />
            <stop offset="18%" stopColor={p.cupLathe[1]} />
            <stop offset="36%" stopColor={p.cupLathe[2]} />
            <stop offset="46%" stopColor={p.cupLathe[3]} />
            <stop offset="60%" stopColor={p.cupLathe[4]} />
            <stop offset="84%" stopColor={p.cupLathe[5]} />
            <stop offset="100%" stopColor={p.cupLathe[6]} />
          </linearGradient>
          <linearGradient
            id={`leaf-${uid}`}
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop offset="0%" stopColor={p.leafLight} />
            <stop offset="48%" stopColor={p.leafMid} />
            <stop offset="100%" stopColor={p.leafDark} />
          </linearGradient>
          <linearGradient id={`sheen-${uid}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0" />
            <stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.58" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </linearGradient>
          <filter
            id={`emboss-${uid}`}
            x="-20%"
            y="-20%"
            width="140%"
            height="140%"
          >
            <feDropShadow
              dx="1.4"
              dy="2.2"
              stdDeviation="1.1"
              floodColor={p.deepShadow}
              floodOpacity="0.88"
            />
          </filter>
        </defs>

        {showRibbon && (
          <g>
            <polygon points="36,2 65,44 55,48 24,2" fill="#1E40AF" />
            <polygon points="44,2 71,44 63,46 35,2" fill="#F1F5F9" />
            <polygon points="52,2 77,44 70,45 44,2" fill="#DC2626" />
            <polygon points="108,2 83,44 90,45 116,2" fill="#DC2626" />
            <polygon points="116,2 89,44 97,46 125,2" fill="#F1F5F9" />
            <polygon points="124,2 95,44 105,48 136,2" fill="#1E40AF" />
            <ellipse cx="80" cy="43" rx="18" ry="4" fill="rgba(0,0,0,0.55)" />
            <rect
              x="61"
              y="34"
              width="38"
              height="15"
              rx="4.5"
              fill="none"
              stroke={`url(#bezel-${uid})`}
              strokeWidth="5.5"
            />
            <rect
              x="61"
              y="34"
              width="38"
              height="15"
              rx="4.5"
              fill="none"
              stroke={p.rimHighlight}
              strokeWidth="1"
              opacity="0.8"
            />
          </g>
        )}

        <circle cx="81" cy="107.5" r="56" fill={p.deepShadow} />
        <circle
          cx="80"
          cy="105"
          r="56"
          fill={`url(#bezel-${uid})`}
          stroke={p.rimHighlight}
          strokeWidth="1.4"
        />
        <circle cx="80" cy="105" r="49.5" fill={p.deepShadow} />
        <circle
          cx="80"
          cy="105"
          r="47.5"
          fill={`url(#dish-${uid})`}
          stroke={`url(#bezel-${uid})`}
          strokeWidth="2.2"
        />
        <circle
          cx="80"
          cy="105"
          r="45.8"
          fill="none"
          stroke={p.rimHighlight}
          strokeWidth="0.9"
          opacity="0.75"
        />

        <g transform="translate(80, 106)" filter={`url(#emboss-${uid})`}>
          <path
            d="M-4,28 C-24,22 -32,4 -28,-18 C-26,-26 -21,-31 -15,-35"
            fill="none"
            stroke={`url(#leaf-${uid})`}
            strokeWidth="2.6"
            strokeLinecap="round"
          />
          <path
            d="M4,28 C24,22 32,4 28,-18 C26,-26 21,-31 15,-35"
            fill="none"
            stroke={`url(#leaf-${uid})`}
            strokeWidth="2.6"
            strokeLinecap="round"
          />
          {laurelPairs.map((lf, i) => (
            <React.Fragment key={i}>
              <g
                transform={`translate(${lf.cx}, ${lf.cy}) rotate(${lf.ang}) scale(${lf.s})`}
              >
                <path
                  d="M0,0 C-5,-3.5 -10,-2.5 -12,0 C-10,2.5 -5,3.5 0,0 Z"
                  fill={`url(#leaf-${uid})`}
                  stroke={p.leafDark}
                  strokeWidth="0.55"
                />
                <line
                  x1="-1.5"
                  y1="0"
                  x2="-9.5"
                  y2="0"
                  stroke={p.leafLight}
                  strokeWidth="0.6"
                  opacity="0.8"
                />
              </g>
              <g
                transform={`translate(${-lf.cx}, ${lf.cy}) rotate(${-lf.ang}) scale(${lf.s})`}
              >
                <path
                  d="M0,0 C5,-3.5 10,-2.5 12,0 C10,2.5 5,3.5 0,0 Z"
                  fill={`url(#leaf-${uid})`}
                  stroke={p.leafDark}
                  strokeWidth="0.55"
                />
                <line
                  x1="1.5"
                  y1="0"
                  x2="9.5"
                  y2="0"
                  stroke={p.leafLight}
                  strokeWidth="0.6"
                  opacity="0.8"
                />
              </g>
            </React.Fragment>
          ))}

          <path
            d="M-11,26 L9,34 M11,26 L-9,34"
            stroke={`url(#cup-${uid})`}
            strokeWidth="3.2"
            strokeLinecap="round"
          />
          <ellipse
            cx="0"
            cy="29.5"
            rx="4.5"
            ry="2.6"
            fill={`url(#cup-${uid})`}
            stroke={p.leafDark}
            strokeWidth="0.7"
          />
          <path
            d="M-12,-21 C-22,-21 -22,-6 -13,-4 C-10,-3.5 -9,-1 -11,1"
            fill="none"
            stroke={`url(#cup-${uid})`}
            strokeWidth="2.8"
            strokeLinecap="round"
          />
          <path
            d="M12,-21 C22,-21 22,-6 13,-4 C10,-3.5 9,-1 11,1"
            fill="none"
            stroke={`url(#cup-${uid})`}
            strokeWidth="2.8"
            strokeLinecap="round"
          />
          <path
            d="M-14,-24 L14,-24 C14,-4 7,5 0,5 C-7,5 -14,-4 -14,-24 Z"
            fill={`url(#cup-${uid})`}
            stroke={p.leafDark}
            strokeWidth="0.85"
          />
          <rect
            x="-15"
            y="-26"
            width="30"
            height="3.2"
            rx="1.5"
            fill={`url(#cup-${uid})`}
            stroke={p.leafLight}
            strokeWidth="0.6"
          />
          <path
            d="M-8,-22 L-3,-22 C-3,-7 -4.5,1 -6,2 C-7.5,1 -8,-7 -8,-22 Z"
            fill="#FFFFFF"
            opacity="0.65"
          />
          <path
            d="M-3,5 L3,5 L4.5,15 L-4.5,15 Z"
            fill={`url(#cup-${uid})`}
            stroke={p.leafDark}
            strokeWidth="0.7"
          />
          <rect
            x="-9.5"
            y="14.5"
            width="19"
            height="3.5"
            rx="1.2"
            fill={`url(#cup-${uid})`}
            stroke={p.leafDark}
            strokeWidth="0.7"
          />
          <path
            d="M-13,18 L13,18 L15,22 L-15,22 Z"
            fill={`url(#cup-${uid})`}
            stroke={p.leafDark}
            strokeWidth="0.8"
          />
        </g>

        <path
          d="M42,72 L68,52 L116,134 L90,154 Z"
          fill={`url(#sheen-${uid})`}
          opacity="0.45"
        />
        <g transform="translate(42, 66)" fill="#FFFFFF">
          <polygon points="0,-8 1.8,-1.8 8,0 1.8,1.8 0,8 -1.8,1.8 -8,0 -1.8,-1.8" />
        </g>
        <g transform="translate(118, 138)" fill="#FFFFFF" opacity="0.85">
          <polygon points="0,-6 1.3,-1.3 6,0 1.3,1.3 0,6 -1.3,1.3 -6,0 -1.3,-1.3" />
        </g>
      </svg>
    </div>
  );
}

// ============================================================================
// 3. TROPHY CABINET SHOWCASE (CLEAN STAGE — NO SHINE WAVE, HOVER SPOTLIGHTS)
// ============================================================================
function TrophyCabinetPodiumStage({
  firstPlace,
  secondPlace,
  thirdPlace,
  totalCompetitors,
  tabTheme,
  activeTab = "curos",
  onSelectCompetitor,
}) {
  const [urlIndex, setUrlIndex] = useState(0);
  const [customSrc, setCustomSrc] = useState(() =>
    localStorage.getItem(STORAGE_KEY_CABINET_IMG)
  );
  const [hoveredSlot, setHoveredSlot] = useState(null);
  const fileInputRef = useRef(null);

  const activeImgSrc =
    customSrc || CABINET_CANDIDATE_URLS[urlIndex] || "/trophy_cabinet.png";

  const handleImageError = () => {
    if (customSrc) {
      localStorage.removeItem(STORAGE_KEY_CABINET_IMG);
      setCustomSrc(null);
      return;
    }
    if (urlIndex < CABINET_CANDIDATE_URLS.length - 1) {
      setUrlIndex((prev) => prev + 1);
    }
  };

  const saveCustomImageFile = useCallback((file) => {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result;
      if (typeof dataUrl === "string") {
        setCustomSrc(dataUrl);
        try {
          localStorage.setItem(STORAGE_KEY_CABINET_IMG, dataUrl);
        } catch {
          // Ignore storage quota
        }
      }
    };
    reader.readAsDataURL(file);
  }, []);

  useEffect(() => {
    const onPaste = (e) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of items) {
        if (item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (file) saveCustomImageFile(file);
          break;
        }
      }
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [saveCustomImageFile]);

  const podiumSlots = [
    {
      id: "second",
      rankTag: "🥈 2ND PLACE",
      title: tabTheme.titles[1],
      user: secondPlace,
      isChampion: false,
      tetherGrad: "from-slate-100 via-slate-300 to-transparent",
      dotCls: "bg-slate-100 shadow-[0_0_16px_#FFFFFF]",
      cardBg: "podium-plaque-silver",
      borderCls:
        hoveredSlot === "second"
          ? "border-white ring-2 ring-slate-200/50 shadow-[0_0_38px_rgba(226,232,240,0.45)] -translate-y-1.5"
          : "border-slate-300/65 hover:border-white shadow-[0_12px_28px_rgba(0,0,0,0.88)]",
      topHighlight: "from-transparent via-white to-transparent",
      badgePill:
        "bg-gradient-to-r from-slate-200 via-white to-slate-300 text-slate-950 border-white shadow-[0_0_12px_rgba(255,255,255,0.35)]",
      nameCls: "text-white",
      scoreBox: "bg-black/50 border-slate-300/40",
      scoreText: "text-slate-100",
    },
    {
      id: "first",
      rankTag: "👑 #1 CHAMPION",
      title: tabTheme.titles[0],
      user: firstPlace,
      isChampion: true,
      tetherGrad: "from-yellow-100 via-amber-400 to-transparent",
      dotCls: "bg-amber-200 shadow-[0_0_20px_#FDE047]",
      cardBg: "podium-plaque-gold",
      borderCls:
        hoveredSlot === "first"
          ? "border-yellow-200 ring-2 ring-amber-300/70 shadow-[0_0_60px_rgba(245,158,11,0.65)] -translate-y-2.5"
          : "border-amber-300/90 shadow-[0_0_45px_-5px_rgba(245,158,11,0.48)] -translate-y-1.5",
      topHighlight: "from-amber-400/20 via-yellow-200 to-amber-400/20",
      badgePill:
        "bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-500 text-black border-yellow-100 shadow-[0_0_20px_rgba(250,204,21,0.58)]",
      nameCls:
        "bg-gradient-to-r from-amber-100 via-yellow-200 to-amber-100 bg-clip-text text-transparent",
      scoreBox:
        "bg-amber-500/20 border-amber-300/75 shadow-[inset_0_0_16px_rgba(250,204,21,0.28)]",
      scoreText: "text-amber-200",
    },
    {
      id: "third",
      rankTag: "🥉 3RD PLACE",
      title: tabTheme.titles[2],
      user: thirdPlace,
      isChampion: false,
      tetherGrad: "from-orange-200 via-amber-500 to-transparent",
      dotCls: "bg-orange-300 shadow-[0_0_16px_#FB923C]",
      cardBg: "podium-plaque-bronze",
      borderCls:
        hoveredSlot === "third"
          ? "border-orange-300 ring-2 ring-orange-400/50 shadow-[0_0_38px_rgba(251,146,60,0.5)] -translate-y-1.5"
          : "border-orange-400/65 hover:border-orange-200 shadow-[0_12px_28px_rgba(0,0,0,0.88)]",
      topHighlight: "from-transparent via-orange-300 to-transparent",
      badgePill:
        "bg-gradient-to-r from-orange-200 via-amber-400 to-orange-500 text-slate-950 border-orange-200 shadow-[0_0_12px_rgba(251,146,60,0.4)]",
      nameCls: "text-white",
      scoreBox: "bg-black/50 border-orange-400/45",
      scoreText: "text-orange-200",
    },
  ];

  return (
    <div className="lg:col-span-7 gold-vault-frame rounded-3xl flex flex-col justify-between relative overflow-hidden select-none">
      <div className="gold-brushed-grain" />

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) saveCustomImageFile(file);
        }}
        className="hidden"
      />

      {/* Top Podium Stage Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-6 pt-5 pb-3 relative z-30 bg-gradient-to-b from-black/85 via-black/45 to-transparent">
        <div>
          <span
            className={`text-[10px] font-black uppercase tracking-[0.2em] border px-3 py-0.5 rounded-full inline-flex items-center gap-1.5 ${tabTheme.badgeCls}`}
          >
            <span>🏆</span>
            <span>{tabTheme.label} Championship Podium</span>
          </span>
          <h2 className="text-lg font-black text-white mt-1.5 tracking-tight">
            Top 3 {tabTheme.label} Leaders
          </h2>
        </div>

        <div className="flex items-center gap-2.5">
          <span className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-300/35 text-[11px] text-amber-200 font-bold flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-300 animate-ping" />
            <span>Live Standing • {totalCompetitors} Competitors</span>
          </span>
        </div>
      </div>

      {/* CLEAN TROPHY CABINET STAGE (NO SHINE WAVE) */}
      <div className="relative w-full overflow-hidden bg-[#060609] -mt-2">
        <img
          src={activeImgSrc}
          alt="Glass Trophy Display with Gold Cup and Medals"
          onError={handleImageError}
          className="w-full h-[255px] sm:h-[305px] object-cover object-center block select-none pointer-events-none"
        />

        {/* Subtle Interactive Hover Spotlights Only */}
        <div className="pointer-events-none absolute inset-0 z-10 grid grid-cols-12">
          <div className="col-span-1" />
          <div
            className={`col-span-3 transition-opacity duration-300 bg-gradient-to-b from-white/20 via-slate-200/10 to-transparent blur-md ${
              hoveredSlot === "second" ? "opacity-100" : "opacity-0"
            }`}
          />
          <div
            className={`col-span-4 transition-opacity duration-300 bg-gradient-to-b from-amber-200/25 via-white/10 to-transparent blur-md ${
              hoveredSlot === "first" ? "opacity-100" : "opacity-0"
            }`}
          />
          <div
            className={`col-span-3 transition-opacity duration-300 bg-gradient-to-b from-orange-300/20 via-white/10 to-transparent blur-md ${
              hoveredSlot === "third" ? "opacity-100" : "opacity-0"
            }`}
          />
          <div className="col-span-1" />
        </div>

        {/* Seamless Top & Bottom Edge Vignettes */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-[#080706] to-transparent z-10" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#080705] via-[#080705]/85 to-transparent z-10" />

        {/* Clickable Trophy Hit Zones */}
        <div className="absolute inset-0 z-20 grid grid-cols-12">
          <div className="col-span-1" />
          <div
            onMouseEnter={() => setHoveredSlot("second")}
            onMouseLeave={() => setHoveredSlot(null)}
            onClick={() =>
              secondPlace && onSelectCompetitor && onSelectCompetitor(secondPlace)
            }
            className="col-span-3 cursor-pointer h-full"
          />
          <div
            onMouseEnter={() => setHoveredSlot("first")}
            onMouseLeave={() => setHoveredSlot(null)}
            onClick={() =>
              firstPlace && onSelectCompetitor && onSelectCompetitor(firstPlace)
            }
            className="col-span-4 cursor-pointer h-full"
          />
          <div
            onMouseEnter={() => setHoveredSlot("third")}
            onMouseLeave={() => setHoveredSlot(null)}
            onClick={() =>
              thirdPlace && onSelectCompetitor && onSelectCompetitor(thirdPlace)
            }
            className="col-span-3 cursor-pointer h-full"
          />
          <div className="col-span-1" />
        </div>
      </div>

      {/* Aligned Top-3 Winner Plaques */}
      <div className="relative z-30 -mt-9 sm:-mt-11 px-4 sm:px-7 pb-5 bg-gradient-to-b from-transparent via-[#080705] to-[#080705]">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4 items-stretch">
          {podiumSlots.map((slot) => {
            const u = slot.user;
            if (!u) return <div key={slot.id} />;
            const val = tabTheme.getValue(u);

            return (
              <div
                key={slot.id}
                onMouseEnter={() => setHoveredSlot(slot.id)}
                onMouseLeave={() => setHoveredSlot(null)}
                onClick={() => onSelectCompetitor && onSelectCompetitor(u)}
                className="flex flex-col items-center cursor-pointer group"
              >
                <div className="flex flex-col items-center mb-1">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${slot.dotCls} transition-transform duration-300 group-hover:scale-125`}
                  />
                  <div
                    className={`w-[2px] h-3.5 bg-gradient-to-b ${slot.tetherGrad}`}
                  />
                </div>

                <div
                  className={`w-full flex-1 rounded-2xl p-3.5 sm:p-4 border ${slot.cardBg} ${slot.borderCls} backdrop-blur-xl transition-all duration-300 relative overflow-hidden flex flex-col items-center justify-between text-center`}
                >
                  <div
                    className={`pointer-events-none absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r ${slot.topHighlight}`}
                  />

                  <div
                    className={`px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${slot.badgePill}`}
                  >
                    {slot.rankTag}
                  </div>

                  <div className="my-2.5 w-full">
                    <h3
                      className={`${
                        slot.isChampion
                          ? "text-base sm:text-xl"
                          : "text-sm sm:text-base"
                      } font-black tracking-wide truncate ${slot.nameCls}`}
                    >
                      {u.name}
                    </h3>
                    <span className="text-[11px] font-bold text-amber-100/65 block truncate mt-0.5">
                      {slot.title}
                    </span>
                  </div>

                  <div
                    className={`w-full py-1.5 px-3 rounded-xl border ${slot.scoreBox} flex items-center justify-between`}
                  >
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-300">
                      {tabTheme.label}
                    </span>
                    <span
                      className={`${
                        slot.isChampion
                          ? "text-base sm:text-lg"
                          : "text-sm sm:text-base"
                      } font-black ${slot.scoreText}`}
                    >
                      🪙 {val}
                      {tabTheme.shortUnit}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 4. LIVE VIEW COMPETITOR SHOWCASE MODAL
// ============================================================================
function CompetitorLiveViewModal({ user, onClose, tabTheme }) {
  if (!user) return null;
  const isTop3 = user.rank <= 3;
  const medalTier =
    user.rank === 1 ? "gold" : user.rank === 2 ? "silver" : "bronze";

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg gold-vault-frame rounded-3xl p-6 text-center shadow-[0_0_90px_rgba(212,175,55,0.35)] overflow-hidden"
      >
        <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-80 h-80 bg-amber-300/20 rounded-full blur-3xl" />

        <div className="flex items-center justify-between relative z-10 mb-3">
          <span
            className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${tabTheme.badgeCls}`}
          >
            Live Competitor Showcase • Rank #{user.rank}
          </span>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white/5 hover:bg-amber-500/20 text-slate-300 hover:text-amber-200 font-bold text-xs cursor-pointer border border-white/10"
          >
            ✕
          </button>
        </div>

        <div className="my-5 flex justify-center relative z-10">
          {isTop3 ? (
            <RealisticMetallicMedalSVG
              tier={medalTier}
              size={155}
              showRibbon={true}
            />
          ) : (
            <div className="w-28 h-28 rounded-3xl bg-gradient-to-b from-[#1E1910] to-[#0B0906] border-2 border-amber-300/45 shadow-[0_12px_30px_rgba(0,0,0,0.85)] flex flex-col items-center justify-center">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-200/70">
                Standing
              </span>
              <span className="text-3xl font-black text-white mt-0.5">
                #{user.rank}
              </span>
            </div>
          )}
        </div>

        <h2 className="text-2xl font-black text-white tracking-tight relative z-10">
          {user.name}
        </h2>
        <p className="text-xs font-bold text-amber-300 mt-1 relative z-10">
          {isTop3 ? tabTheme.titles[user.rank - 1] : "Cohort Contender"} •{" "}
          {user.program_name}
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 my-5 relative z-10">
          <div className="p-3 rounded-2xl bg-[#0D0B07] border border-amber-400/40">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">
              Curos
            </span>
            <span className="text-base font-black text-amber-300 mt-0.5 block">
              🪙 {user.curos}
            </span>
          </div>
          <div className="p-3 rounded-2xl bg-[#0D0B07] border border-purple-400/35">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">
              Completion
            </span>
            <span className="text-base font-black text-purple-300 mt-0.5 block">
              {user.completion_pct}%
            </span>
          </div>
          <div className="p-3 rounded-2xl bg-[#0D0B07] border border-emerald-400/35">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">
              Retention
            </span>
            <span className="text-base font-black text-emerald-300 mt-0.5 block">
              {user.retention_pct}%
            </span>
          </div>
          <div className="p-3 rounded-2xl bg-[#0D0B07] border border-rose-400/35">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">
              Streak
            </span>
            <span className="text-base font-black text-rose-300 mt-0.5 block">
              🔥 {user.streak_days}d
            </span>
          </div>
        </div>

        <button
          onClick={onClose}
          className={`w-full py-3 rounded-2xl bg-gradient-to-r ${tabTheme.champRibbon} font-black text-xs uppercase tracking-wider shadow-lg transition relative z-10 cursor-pointer`}
        >
          Close Live View
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// 4B. GRAPH SCORE BREAKDOWN TAB / MODAL (OPENS WHEN CLICKING THE GRAPH)
//     Lists all users currently plotted on the graph with Name & Score beside it
// ============================================================================
function GraphScoreBreakdownModal({
  isOpen,
  onClose,
  graphUsers = [],
  graphTheme,
  graphMetric,
  onSelectGraphMetric,
  onInspectUser,
}) {
  if (!isOpen) return null;

  const maxScore = Math.max(
    1,
    ...graphUsers.map((u) => graphTheme.getValue(u))
  );

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl gold-vault-frame rounded-3xl p-6 space-y-5 my-auto relative overflow-hidden"
        style={{
          borderColor: `${graphTheme.accentHex}aa`,
          boxShadow: `0 0 65px -10px ${graphTheme.accentHex}45, 0 24px 60px rgba(0,0,0,0.95)`,
        }}
      >
        <div className="gold-brushed-grain" />

        {/* Header */}
        <div className="relative z-10 flex flex-wrap items-start justify-between gap-3 border-b border-amber-300/25 pb-4">
          <div>
            <span
              className="text-[10px] font-black uppercase tracking-[0.22em] px-3 py-0.5 rounded-full border inline-flex items-center gap-1.5"
              style={{
                color: graphTheme.accentHex,
                borderColor: `${graphTheme.accentHex}66`,
                backgroundColor: `${graphTheme.accentHex}18`,
              }}
            >
              <span>📊</span>
              <span>{graphTheme.label} Graph Roster</span>
            </span>
            <h2 className="text-xl font-black text-white mt-1.5 tracking-tight">
              {graphTheme.chartTitle} — User Scores
            </h2>
            <p className="text-xs text-amber-100/65 mt-0.5">
              Showing all {graphUsers.length} users plotted on the active{" "}
              {graphTheme.label} chart
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-amber-500/20 border border-amber-200/30 text-xs font-black text-amber-100 cursor-pointer transition"
          >
            ✕ Close
          </button>
        </div>

        {/* Metric Switcher Inside Modal for Fast Comparison */}
        <div className="relative z-10 flex flex-wrap items-center gap-1.5">
          {[
            { id: "curos", label: "🪙 Curos" },
            { id: "completion", label: "🏆 Completion" },
            { id: "retention", label: "🛡️ Retention" },
            { id: "application", label: "🎯 Application" },
            { id: "streaks", label: "🔥 Streaks" },
          ].map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => onSelectGraphMetric(m.id)}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-black transition cursor-pointer ${
                graphMetric === m.id
                  ? graphTheme.pillActive
                  : "bg-[#0D0B08] text-slate-300 border border-amber-200/20 hover:border-amber-300/60"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        {/* Ranked User Name + Score Rows */}
        <div className="relative z-10 space-y-2.5 max-h-[390px] overflow-y-auto pr-1">
          {graphUsers.map((u, idx) => {
            const val = graphTheme.getValue(u);
            const pct = Math.round((val / maxScore) * 100);
            const rankNum = idx + 1;

            const rowCls =
              rankNum === 1
                ? "lb-tab-rank-1"
                : rankNum === 2
                ? "lb-tab-rank-2"
                : rankNum === 3
                ? "lb-tab-rank-3"
                : "lb-tab-standard";

            return (
              <div
                key={u.id ?? `${u.name}-${idx}`}
                onClick={() => {
                  onClose();
                  onInspectUser && onInspectUser(u);
                }}
                className={`cursor-pointer rounded-2xl px-4 py-3 flex items-center justify-between gap-4 ${rowCls}`}
              >
                {/* Left: Rank + Avatar + Name */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <span
                    className={`w-8 h-8 rounded-xl text-xs font-black flex items-center justify-center shrink-0 ${
                      rankNum === 1
                        ? "bg-gradient-to-br from-amber-200 via-yellow-400 to-amber-500 text-black"
                        : rankNum === 2
                        ? "bg-gradient-to-br from-white via-slate-200 to-slate-400 text-black"
                        : rankNum === 3
                        ? "bg-gradient-to-br from-orange-200 via-amber-400 to-orange-600 text-black"
                        : "bg-black/60 text-amber-100 border border-amber-200/35"
                    }`}
                  >
                    #{rankNum}
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="font-black text-sm text-white truncate">
                      {u.name}
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-black/60 border border-white/10 overflow-hidden mt-1.5">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.max(val > 0 ? 8 : 2, pct)}%`,
                          background: `linear-gradient(90deg, ${graphTheme.accentHex}, #FEF08A)`,
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Right: Exact Score Beside Name */}
                <span
                  className="px-3.5 py-1.5 rounded-xl text-sm font-black border shrink-0"
                  style={{
                    color: val > 0 ? graphTheme.accentHex : "#94A3B8",
                    borderColor:
                      val > 0
                        ? `${graphTheme.accentHex}88`
                        : "rgba(253,230,138,0.28)",
                    backgroundColor:
                      val > 0 ? `${graphTheme.accentHex}1A` : "rgba(0,0,0,0.5)",
                  }}
                >
                  {graphMetric === "curos" && "🪙 "}
                  {val}
                  {graphTheme.unit}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// ============================================================================
// MAIN COMPONENT: Leaderboards.jsx (DARK PREMIUM GOLDEN SHINING THEME)
// ============================================================================
export default function Leaderboards({ backendData = null }) {
  const [rawCompetitors, setRawCompetitors] = useState([]);
  const [loading, setLoading] = useState(!backendData);
  const [syncing, setSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [liveViewUser, setLiveViewUser] = useState(null);

  // Main Tab is permanently based on Curos; Variations belong ONLY to the Graph Tab
  const [graphMetric, setGraphMetric] = useState("curos");
  const [graphModalOpen, setGraphModalOpen] = useState(false);

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

  // Deduplicated base roster
  const uniqueCompetitors = useMemo(() => {
    const map = new Map();
    rawCompetitors.forEach((c, idx) => {
      const key = String(c.email || c.name || idx)
        .toLowerCase()
        .trim();
      if (
        !map.has(key) ||
        (c.curos || 0) > (map.get(key).curos || 0) ||
        (c.completion_pct || 0) > (map.get(key).completion_pct || 0)
      ) {
        map.set(key, { ...c });
      }
    });
    return Array.from(map.values());
  }, [rawCompetitors]);

  // 1. MAIN TAB RANKING (PERMANENTLY BY CURO COUNT)
  const curosRankedCompetitors = useMemo(() => {
    const sorted = [...uniqueCompetitors].sort(
      (a, b) =>
        (b.curos || 0) - (a.curos || 0) ||
        (b.completion_pct || 0) - (a.completion_pct || 0)
    );
    return sorted.map((u, idx) => ({ ...u, rank: idx + 1 }));
  }, [uniqueCompetitors]);

  // 2. GRAPH-ONLY RANKING (DYNAMIC BY SELECTED GRAPH VARIATION)
  const graphRankedCompetitors = useMemo(() => {
    const sorted = [...uniqueCompetitors].sort((a, b) => {
      if (graphMetric === "curos")
        return (
          (b.curos || 0) - (a.curos || 0) ||
          (b.completion_pct || 0) - (a.completion_pct || 0)
        );
      if (graphMetric === "completion")
        return (
          (b.completion_pct || 0) - (a.completion_pct || 0) ||
          (b.curos || 0) - (a.curos || 0)
        );
      if (graphMetric === "retention")
        return (
          (b.retention_pct || 0) - (a.retention_pct || 0) ||
          (b.curos || 0) - (a.curos || 0)
        );
      if (graphMetric === "application")
        return (
          (b.application_pct || 0) - (a.application_pct || 0) ||
          (b.curos || 0) - (a.curos || 0)
        );
      if (graphMetric === "streaks")
        return (
          (b.streak_days || 0) - (a.streak_days || 0) ||
          (b.curos || 0) - (a.curos || 0)
        );
      return 0;
    });
    return sorted.map((u, idx) => ({ ...u, graphRank: idx + 1 }));
  }, [uniqueCompetitors, graphMetric]);

  const curosMainTheme = useMemo(
    () => ({
      id: "curos",
      label: "Curos",
      columnHeader: "CUROS",
      subtitle: "Top performers based on current Curo treasury balance",
      unit: " Curos",
      shortUnit: "",
      accentHex: "#F5C451",
      secondaryHex: "#D97706",
      badgeCls:
        "text-amber-200 bg-amber-500/15 border-amber-300/50 shadow-[0_0_12px_rgba(245,196,81,0.18)]",
      champRibbon: "from-amber-200 via-yellow-400 to-amber-500 text-black",
      titles: ["Curo Champion", "Curo Achiever", "Curo Star"],
      getValue: (u) => Number(u?.curos || 0),
    }),
    []
  );

  // Graph Theme (Uses themes object keyed by graphMetric)
  const graphTheme = useMemo(() => {
    const themes = {
      curos: {
        ...curosMainTheme,
        pillActive:
          "bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 text-black shadow-[0_0_18px_rgba(245,196,81,0.55)] border border-yellow-100/80",
        chartType: "area",
        chartTitle: "Top 10 Curos Treasury Curve",
      },
      completion: {
        id: "completion",
        label: "Completion",
        subtitle: "Top performers based on curriculum completion percentage",
        unit: "%",
        shortUnit: "%",
        accentHex: "#C084FC",
        secondaryHex: "#F5C451",
        pillActive:
          "bg-gradient-to-r from-purple-400 via-fuchsia-500 to-amber-400 text-slate-950 shadow-[0_0_18px_rgba(192,132,252,0.55)] border border-purple-200/80",
        badgeCls: "text-purple-200 bg-purple-500/15 border-purple-300/50",
        chartType: "bar",
        chartTitle: "Curriculum Completion Milestone Bars",
        getValue: (u) => Number(u?.completion_pct || 0),
      },
      retention: {
        id: "retention",
        label: "Retention",
        subtitle: "Top performers based on long-term knowledge retention stability",
        unit: "%",
        shortUnit: "%",
        accentHex: "#34D399",
        secondaryHex: "#F5C451",
        pillActive:
          "bg-gradient-to-r from-emerald-300 via-teal-400 to-amber-300 text-slate-950 shadow-[0_0_18px_rgba(52,211,153,0.5)] border border-emerald-200/80",
        badgeCls: "text-emerald-200 bg-emerald-500/15 border-emerald-300/50",
        chartType: "radar",
        chartTitle: "5-Pillar Cohort Stability Polygon",
        getValue: (u) => Number(u?.retention_pct || 0),
      },
      application: {
        id: "application",
        label: "Application",
        subtitle: "Top performers based on assessment accuracy and practical mastery",
        unit: "%",
        shortUnit: "%",
        accentHex: "#38BDF8",
        secondaryHex: "#F5C451",
        pillActive:
          "bg-gradient-to-r from-cyan-300 via-sky-400 to-amber-300 text-slate-950 shadow-[0_0_18px_rgba(56,189,248,0.5)] border border-cyan-200/80",
        badgeCls: "text-cyan-200 bg-cyan-500/15 border-cyan-300/50",
        chartType: "composed",
        chartTitle: "Quiz Application vs. Completion Precision",
        getValue: (u) => Number(u?.application_pct || 0),
      },
      streaks: {
        id: "streaks",
        label: "Streaks",
        subtitle: "Top performers based on consecutive active learning days",
        unit: " Days",
        shortUnit: "d",
        accentHex: "#FB7185",
        secondaryHex: "#F5C451",
        pillActive:
          "bg-gradient-to-r from-rose-400 via-orange-400 to-amber-300 text-slate-950 shadow-[0_0_18px_rgba(251,113,133,0.55)] border border-rose-200/80",
        badgeCls: "text-rose-200 bg-rose-500/15 border-rose-300/50",
        chartType: "stepArea",
        chartTitle: "Consecutive Habit Flame Momentum",
        getValue: (u) => Number(u?.streak_days || 0),
      },
    };
    return themes[graphMetric] || themes.curos;
  }, [graphMetric, curosMainTheme]);

  

  const filteredCompetitors = useMemo(() => {
    if (!searchQuery.trim()) return curosRankedCompetitors;
    const q = searchQuery.toLowerCase();
    return curosRankedCompetitors.filter((u) =>
      u.name.toLowerCase().includes(q)
    );
  }, [curosRankedCompetitors, searchQuery]);

  // Top 10 plotted on the graph + Top 3 for the Graph vs. Top 3 for Curos Podium
  const graphTop10Users = useMemo(
    () => graphRankedCompetitors.slice(0, 10),
    [graphRankedCompetitors]
  );

  const chartData = useMemo(
    () =>
      graphTop10Users.map((u) => ({
        name: u.name.split(" ")[0],
        score: graphTheme.getValue(u),
        secondary: Number(u.completion_pct || 0),
      })),
    [graphTop10Users, graphTheme]
  );

  const cohortAvgMetric = useMemo(() => {
    if (!graphRankedCompetitors.length) return 0;
    const sum = graphRankedCompetitors.reduce(
      (acc, u) => acc + graphTheme.getValue(u),
      0
    );
    return Math.round((sum / graphRankedCompetitors.length) * 10) / 10;
  }, [graphRankedCompetitors, graphTheme]);

  const cohortRadarData = useMemo(() => {
    const denom = Math.max(1, graphRankedCompetitors.length);
    const avgComp = Math.round(
      graphRankedCompetitors.reduce((s, u) => s + (u.completion_pct || 0), 0) / denom
    );
    const avgRet = Math.round(
      graphRankedCompetitors.reduce((s, u) => s + (u.retention_pct || 0), 0) / denom
    );
    const avgApp = Math.round(
      graphRankedCompetitors.reduce((s, u) => s + (u.application_pct || 0), 0) / denom
    );
    return [
      { subject: "Retention", score: Math.max(25, avgRet), target: 85 },
      { subject: "Completion", score: Math.max(20, avgComp), target: 80 },
      { subject: "Application", score: Math.max(25, avgApp), target: 80 },
      { subject: "Consistency", score: 68, target: 75 },
      { subject: "Curos Velocity", score: 74, target: 75 },
    ];
  }, [graphRankedCompetitors]);

  // Curos Podium Leaders
  const firstPlace = curosRankedCompetitors[0];
  const secondPlace = curosRankedCompetitors[1];
  const thirdPlace = curosRankedCompetitors[2];

  // Graph Top 3 Leaders (Names displayed below graph without "1st / 2nd / 3rd Place")
  const graphTop1 = graphTop10Users[0];
  const graphTop2 = graphTop10Users[1];
  const graphTop3 = graphTop10Users[2];

  return (
    <div className="h-screen w-full obsidian-gold-canvas text-slate-100 font-sans overflow-y-auto overflow-x-hidden scroll-smooth leaderboards-scroll-container relative">
      {/* =====================================================================
          PREMIUM DARK GOLDEN SHINING & MACHINED METAL KPI CSS
      ===================================================================== */}
      <style>{`
        .leaderboards-scroll-container {
          scrollbar-width: thin;
          scrollbar-color: rgba(245, 196, 81, 0.5) #070605;
        }
        .leaderboards-scroll-container::-webkit-scrollbar {
          width: 8px;
        }
        .leaderboards-scroll-container::-webkit-scrollbar-track {
          background: #070605;
        }
        .leaderboards-scroll-container::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, #F5C451, #92400E);
          border-radius: 9999px;
        }

        /* 1. ROYAL OBSIDIAN & CARBON-GOLD PAGE TEXTURE */
        .obsidian-gold-canvas {
          background-color: #050506;
          background-image:
            radial-gradient(ellipse 75% 40% at 50% -5%, rgba(212, 175, 55, 0.16) 0%, transparent 70%),
            radial-gradient(ellipse 45% 35% at 88% 35%, rgba(245, 158, 11, 0.08) 0%, transparent 65%),
            radial-gradient(ellipse 45% 35% at 12% 75%, rgba(212, 175, 55, 0.07) 0%, transparent 65%),
            repeating-linear-gradient(
              135deg,
              rgba(255, 232, 175, 0.018) 0px,
              rgba(255, 232, 175, 0.018) 1px,
              transparent 1px,
              transparent 5px
            );
        }

        /* Fine Brushed Metallic Gold Grain Overlay */
        .gold-brushed-grain {
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 0;
          background-image: repeating-linear-gradient(
            135deg,
            rgba(254, 240, 138, 0.028) 0px,
            rgba(254, 240, 138, 0.028) 1px,
            transparent 1px,
            transparent 3px
          );
        }

        /* 2. PREMIUM GOLDEN VAULT CONTAINER (HEADER, PODIUM, GRAPH, RANKINGS) */
        .gold-vault-frame {
          position: relative;
          isolation: isolate;
          background:
            radial-gradient(circle at 12% 0%, rgba(254, 240, 138, 0.12) 0%, transparent 42%),
            radial-gradient(circle at 88% 100%, rgba(217, 119, 6, 0.1) 0%, transparent 45%),
            linear-gradient(155deg, #120F0A 0%, #0A0908 54%, #060607 100%);
          border: 1.8px solid rgba(234, 179, 8, 0.55);
          box-shadow:
            0 20px 50px rgba(0, 0, 0, 0.88),
            0 0 32px -6px rgba(212, 175, 55, 0.22),
            inset 0 1.5px 2px rgba(254, 249, 195, 0.35),
            inset 0 0 24px rgba(212, 175, 55, 0.06);
        }

                
        /* 2. HIGH-VISIBILITY GRAPH INNER FRAME BORDER */
        .graph-inner-lit-frame {
          background: radial-gradient(circle at 50% 0%, rgba(245, 196, 81, 0.1) 0%, #060608 72%);
          border: 2px solid rgba(251, 191, 36, 0.78) !important;
          box-shadow:
            0 0 26px -4px rgba(245, 196, 81, 0.32),
            inset 0 0 20px rgba(245, 196, 81, 0.12),
            inset 0 1px 2px rgba(254, 249, 195, 0.45) !important;
        }

        /* 3. RANK #4+ HORIZONTAL TABS: CLEARLY VISIBLE LIGHT CHAMPAGNE BORDER */
        .lb-tab-standard {
          position: relative;
          background: linear-gradient(145deg, #13110E 0%, #0C0B0B 60%, #080809 100%);
          border: 1.6px solid rgba(253, 230, 138, 0.52) !important;
          box-shadow:
            0 6px 18px rgba(0, 0, 0, 0.72),
            0 0 14px -4px rgba(245, 196, 81, 0.22),
            inset 0 1px 1.5px rgba(255, 255, 255, 0.2) !important;
          transition: transform 0.2s ease, border-color 0.2s ease, background 0.2s ease, box-shadow 0.2s ease;
        }
        .lb-tab-standard:hover {
          transform: translateY(-1.5px);
          border-color: rgba(254, 240, 138, 0.9) !important;
          background: linear-gradient(145deg, #1C170F 0%, #110F0C 60%, #0A0908 100%);
          box-shadow:
            0 10px 24px rgba(0, 0, 0, 0.85),
            0 0 20px -3px rgba(250, 204, 21, 0.38) !important;
        }

        /* Podium Plaque Surfaces */
        .podium-plaque-gold {
          background: linear-gradient(180deg, rgba(50, 36, 12, 0.96) 0%, rgba(22, 16, 7, 0.98) 55%, #090703 100%);
        }
        .podium-plaque-silver {
          background: linear-gradient(180deg, rgba(34, 38, 48, 0.95) 0%, rgba(16, 18, 24, 0.98) 55%, #07080C 100%);
        }
        .podium-plaque-bronze {
          background: linear-gradient(180deg, rgba(46, 23, 14, 0.95) 0%, rgba(22, 11, 8, 0.98) 55%, #0A0504 100%);
        }

        /* 5. CHART TELEMETRY SCANLINE */
        @keyframes goldTelemetryScan {
          0% { left: -20%; opacity: 0; }
          20% { opacity: 1; }
          80% { opacity: 1; }
          100% { left: 110%; opacity: 0; }
        }
        .animate-gold-chart-scan {
          animation: goldTelemetryScan 5.5s linear infinite;
        }

        /* 6. LEADERBOARD RANKING HORIZONTAL TABS:
              - TOP 3: Noticeable Metallic Borders + Live Sweeping Shine
              - REST (#4+): Separate Horizontal Tabs with Crisp Light Border */
        @keyframes top3LiveShineSweep {
          0%   { transform: translateX(-140%) skewX(-24deg); }
          48%, 100% { transform: translateX(250%) skewX(-24deg); }
        }

        .lb-row-shine-overlay {
          position: absolute;
          top: 0;
          bottom: 0;
          left: 0;
          width: 34%;
          pointer-events: none;
          z-index: 1;
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(255, 255, 255, 0.06) 35%,
            rgba(255, 255, 255, 0.28) 50%,
            rgba(255, 255, 255, 0.06) 65%,
            transparent 100%
          );
          animation: top3LiveShineSweep 5.5s cubic-bezier(0.22, 1, 0.36, 1) infinite;
        }

        /* RANK #1: 24K GOLD HORIZONTAL TAB WITH LIVE SHINE */
        .lb-tab-rank-1 {
          position: relative;
          overflow: hidden;
          background:
            radial-gradient(circle at 12% 50%, rgba(250, 204, 21, 0.22) 0%, transparent 55%),
            linear-gradient(135deg, #2D210B 0%, #191308 55%, #0F0C06 100%);
          border: 2px solid rgba(253, 224, 71, 0.92);
          box-shadow:
            0 10px 26px rgba(0, 0, 0, 0.8),
            0 0 26px -3px rgba(245, 158, 11, 0.45),
            inset 0 1.5px 2px rgba(254, 249, 195, 0.55);
          transition: transform 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease;
        }
        .lb-tab-rank-1:hover {
          transform: translateY(-2px);
          border-color: #FEF9C3;
          box-shadow:
            0 14px 32px rgba(0, 0, 0, 0.9),
            0 0 34px 0px rgba(250, 204, 21, 0.62);
        }

        /* RANK #2: PLATINUM-SILVER HORIZONTAL TAB WITH LIVE SHINE */
        .lb-tab-rank-2 {
          position: relative;
          overflow: hidden;
          background:
            radial-gradient(circle at 12% 50%, rgba(226, 232, 240, 0.2) 0%, transparent 55%),
            linear-gradient(135deg, #232732 0%, #14171F 55%, #0C0E14 100%);
          border: 2px solid rgba(226, 232, 240, 0.85);
          box-shadow:
            0 10px 26px rgba(0, 0, 0, 0.8),
            0 0 22px -4px rgba(226, 232, 240, 0.32),
            inset 0 1.5px 2px rgba(255, 255, 255, 0.5);
          transition: transform 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease;
        }
        .lb-tab-rank-2:hover {
          transform: translateY(-2px);
          border-color: #FFFFFF;
          box-shadow:
            0 14px 32px rgba(0, 0, 0, 0.9),
            0 0 30px 0px rgba(241, 245, 249, 0.45);
        }

        /* RANK #3: BURNISHED BRONZE HORIZONTAL TAB WITH LIVE SHINE */
        .lb-tab-rank-3 {
          position: relative;
          overflow: hidden;
          background:
            radial-gradient(circle at 12% 50%, rgba(251, 146, 60, 0.22) 0%, transparent 55%),
            linear-gradient(135deg, #2B170E 0%, #190E0A 55%, #100907 100%);
          border: 2px solid rgba(253, 186, 116, 0.85);
          box-shadow:
            0 10px 26px rgba(0, 0, 0, 0.8),
            0 0 22px -4px rgba(249, 115, 22, 0.36),
            inset 0 1.5px 2px rgba(255, 237, 213, 0.48);
          transition: transform 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease;
        }
        .lb-tab-rank-3:hover {
          transform: translateY(-2px);
          border-color: #FFEDD5;
          box-shadow:
            0 14px 32px rgba(0, 0, 0, 0.9),
            0 0 30px 0px rgba(251, 146, 60, 0.5);
        }
      `}</style>

      <div className="w-full p-5 md:p-6 pb-28 space-y-6 relative z-10">
        {/* ===================================================================
            1. PREMIUM DARK-GOLD HEADER BAR (PERMANENTLY CUROS ARENA)
        =================================================================== */}
        <header className="gold-vault-frame rounded-3xl p-6 md:p-7 flex flex-wrap items-center justify-between gap-4 overflow-hidden">
          <div className="gold-brushed-grain" />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-amber-300/90 to-transparent" />
          <div className="pointer-events-none absolute -right-10 -top-16 w-72 h-72 rounded-full blur-3xl opacity-20 bg-amber-400" />

          <div className="relative z-10">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="text-[10px] font-black uppercase tracking-[0.25em] text-amber-300">
                PERFORMANCE &amp; ACHIEVEMENTS • {curosMainTheme.label.toUpperCase()}{" "}
                ARENA
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/10 text-amber-200 border border-amber-300/30 flex items-center gap-1.5">
                <span
                  className={`w-1.5 h-1.5 rounded-full bg-emerald-400 ${
                    syncing ? "animate-ping" : ""
                  }`}
                />
                {lastSynced
                  ? `Live Synced ${lastSynced}`
                  : "Supabase Connected"}
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight mt-1.5 bg-gradient-to-r from-white via-amber-100 to-amber-300 bg-clip-text text-transparent">
              Leaderboards
            </h1>
            <p className="text-xs md:text-sm text-amber-100/65 mt-1 font-medium">
              {curosMainTheme.subtitle}
            </p>
          </div>

          <div className="relative z-10 flex items-center gap-2.5">
            <button
              onClick={() => fetchLeaderboard(false)}
              className="px-4 py-2.5 rounded-2xl bg-gradient-to-b from-[#231B0E] to-[#120E07] hover:from-[#302411] hover:to-[#181209] border border-amber-300/55 hover:border-amber-200 text-xs font-black text-amber-100 shadow-[0_6px_18px_rgba(0,0,0,0.65)] transition-all flex items-center gap-2 cursor-pointer"
            >
              <span className={syncing ? "animate-spin" : ""}>↻</span>
              <span>{syncing ? "Syncing..." : "Refresh Standings"}</span>
            </button>
          </div>
        </header>

        

        {/* ===================================================================
            2. GRAND STAGE: CUROS PODIUM (NO SHINE WAVE) + CLICKABLE GRAPH TAB
               WITH VARIATION SWITCHERS AT TOP & TOPPER NAMES ONLY BELOW
        =================================================================== */}
        {!loading && curosRankedCompetitors.length > 0 && (
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
            {/* LEFT (7 COLS): Curos Championship Podium */}
            <TrophyCabinetPodiumStage
              firstPlace={firstPlace}
              secondPlace={secondPlace}
              thirdPlace={thirdPlace}
              totalCompetitors={curosRankedCompetitors.length}
              tabTheme={curosMainTheme}
              activeTab="curos"
              onSelectCompetitor={(u) => setLiveViewUser(u)}
            />

            {/* RIGHT (5 COLS): CLICKABLE TELEMETRY GRAPH WITH VARIATIONS AT TOP */}
            <div
              onClick={() => setGraphModalOpen(true)}
              title="Click graph to view full list of users & scores"
              className="lg:col-span-5 gold-vault-frame rounded-3xl p-5 sm:p-6 flex flex-col justify-between overflow-hidden cursor-pointer group"
              style={{
                borderColor: `${graphTheme.accentHex}99`,
              }}
            >
              <div className="gold-brushed-grain" />
              <div
                className="pointer-events-none absolute inset-x-0 top-0 h-[2.5px]"
                style={{
                  background: `linear-gradient(90deg, transparent, ${graphTheme.accentHex}, transparent)`,
                }}
              />

              {/* TOP VARIATION SELECTOR BAR (LIMITED ONLY TO GRAPH!) */}
              <div
                onClick={(e) => e.stopPropagation()}
                className="relative z-10 flex flex-wrap items-center gap-1.5 pb-3 border-b border-amber-300/20"
              >
                {[
                  { id: "curos", label: "🪙 Curos" },
                  { id: "completion", label: "🏆 Completion" },
                  { id: "retention", label: "🛡️ Retention" },
                  { id: "application", label: "🎯 Application" },
                  { id: "streaks", label: "🔥 Streaks" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setGraphMetric(tab.id)}
                    className={`px-2.5 py-1.5 rounded-xl text-[10.5px] font-black transition-all cursor-pointer ${
                      graphMetric === tab.id
                        ? graphTheme.pillActive
                        : "bg-black/50 text-amber-100/70 border border-white/10 hover:text-amber-200 hover:border-amber-300/45"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Graph Title + Leader/Avg + Click Hint */}
              <div className="relative z-10 pt-3 flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
                    {graphTheme.chartTitle}
                  </h3>
                  <p className="text-[11px] text-amber-100/65 font-medium">
                    Click graph to view all plotted users &amp; scores →
                  </p>
                </div>

                <div className="flex items-center gap-1.5 text-[10.5px] font-black">
                  <span
                    className="px-2.5 py-0.5 rounded-lg border"
                    style={{
                      color: graphTheme.accentHex,
                      borderColor: `${graphTheme.accentHex}66`,
                      backgroundColor: `${graphTheme.accentHex}18`,
                    }}
                  >
                    Top:{" "}
                    {graphTop1
                      ? `${graphTheme.getValue(graphTop1)}${graphTheme.shortUnit}`
                      : "-"}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-lg bg-white/5 border border-white/15 text-slate-300">
                    Avg: {cohortAvgMetric}
                    {graphTheme.shortUnit}
                  </span>
                </div>
              </div>

              {/* INNER GRAPH BOX WITH HIGH-VISIBILITY GLOWING BORDER */}
              <div
                className="relative z-10 w-full h-56 my-3.5 rounded-2xl p-3.5 graph-inner-lit-frame overflow-hidden transition group-hover:brightness-110"
                style={{
                  borderColor: `${graphTheme.accentHex}CC`,
                  boxShadow: `0 0 26px -4px ${graphTheme.accentHex}45, inset 0 0 20px ${graphTheme.accentHex}1A`,
                }}
              >
                <div className="pointer-events-none absolute inset-y-0 w-24 bg-gradient-to-r from-transparent via-amber-300/[0.08] to-transparent animate-gold-chart-scan z-0" />

                <div className="relative z-10 w-full h-full">
                  <ResponsiveContainer width="100%" height="100%">
                    {graphTheme.chartType === "bar" ? (
                      <BarChart
                        data={chartData}
                        margin={{ top: 12, right: 10, left: -20, bottom: 0 }}
                      >
                        <CartesianGrid
                          stroke="rgba(254, 243, 199, 0.08)"
                          strokeDasharray="3 3"
                          vertical={false}
                        />
                        <XAxis
                          dataKey="name"
                          tick={{ fill: "#E2E8F0", fontSize: 10, fontWeight: 700 }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          tick={{ fill: "#94A3B8", fontSize: 10 }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip
                          content={
                            <DynamicTooltip
                              unit={graphTheme.unit}
                              accentHex={graphTheme.accentHex}
                            />
                          }
                        />
                        <Bar
                          dataKey="score"
                          name={graphTheme.label}
                          radius={[8, 8, 0, 0]}
                          barSize={24}
                        >
                          {chartData.map((_, i) => (
                            <Cell
                              key={i}
                              fill={
                                i === 0
                                  ? "#FEF08A"
                                  : i < 3
                                  ? graphTheme.accentHex
                                  : "rgba(212, 175, 55, 0.35)"
                              }
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    ) : graphTheme.chartType === "radar" ? (
                      <RadarChart
                        cx="50%"
                        cy="50%"
                        outerRadius="70%"
                        data={cohortRadarData}
                      >
                        <PolarGrid stroke="rgba(254, 243, 199, 0.14)" />
                        <PolarAngleAxis
                          dataKey="subject"
                          tick={{ fill: "#FEF08A", fontSize: 10, fontWeight: 800 }}
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
                              accentHex={graphTheme.accentHex}
                            />
                          }
                        />
                        <Radar
                          name="Cohort Stability"
                          dataKey="score"
                          stroke={graphTheme.accentHex}
                          fill={graphTheme.accentHex}
                          fillOpacity={0.42}
                          strokeWidth={2.8}
                        />
                        <Radar
                          name="Benchmark"
                          dataKey="target"
                          stroke="#F5C451"
                          fill="none"
                          strokeDasharray="4 4"
                          strokeWidth={1.8}
                        />
                      </RadarChart>
                    ) : graphTheme.chartType === "composed" ? (
                      <ComposedChart
                        data={chartData}
                        margin={{ top: 12, right: 10, left: -20, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient
                            id="appGoldCyanGrad"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop offset="5%" stopColor="#38BDF8" stopOpacity={0.55} />
                            <stop offset="95%" stopColor="#38BDF8" stopOpacity={0.02} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid
                          stroke="rgba(254, 243, 199, 0.08)"
                          strokeDasharray="3 3"
                          vertical={false}
                        />
                        <XAxis
                          dataKey="name"
                          tick={{ fill: "#E2E8F0", fontSize: 10, fontWeight: 700 }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          tick={{ fill: "#94A3B8", fontSize: 10 }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip
                          content={
                            <DynamicTooltip
                              unit="%"
                              accentHex={graphTheme.accentHex}
                            />
                          }
                        />
                        <Area
                          type="monotone"
                          dataKey="score"
                          name="Application Mastery"
                          stroke="#38BDF8"
                          strokeWidth={3}
                          fill="url(#appGoldCyanGrad)"
                        />
                        <Line
                          type="monotone"
                          dataKey="secondary"
                          name="Course Progress"
                          stroke="#F5C451"
                          strokeWidth={2.4}
                          dot={{
                            r: 3.5,
                            fill: "#F5C451",
                            stroke: "#FFFFFF",
                            strokeWidth: 1,
                          }}
                        />
                      </ComposedChart>
                    ) : (
                      <AreaChart
                        data={chartData}
                        margin={{ top: 14, right: 12, left: -20, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient
                            id="luxuryGoldCurveFill"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="0%"
                              stopColor={graphTheme.accentHex}
                              stopOpacity={0.68}
                            />
                            <stop
                              offset="55%"
                              stopColor={graphTheme.secondaryHex}
                              stopOpacity={0.22}
                            />
                            <stop
                              offset="100%"
                              stopColor={graphTheme.accentHex}
                              stopOpacity={0.02}
                            />
                          </linearGradient>
                          <filter
                            id="goldCurveNeonGlow"
                            x="-20%"
                            y="-20%"
                            width="140%"
                            height="140%"
                          >
                            <feGaussianBlur
                              stdDeviation="3.5"
                              result="coloredBlur"
                            />
                            <feMerge>
                              <feMergeNode in="coloredBlur" />
                              <feMergeNode in="SourceGraphic" />
                            </feMerge>
                          </filter>
                        </defs>
                        <CartesianGrid
                          stroke="rgba(254, 243, 199, 0.08)"
                          strokeDasharray="3 3"
                          vertical={false}
                        />
                        <XAxis
                          dataKey="name"
                          tick={{ fill: "#E2E8F0", fontSize: 10, fontWeight: 700 }}
                          axisLine={{ stroke: "rgba(254, 243, 199, 0.14)" }}
                          tickLine={false}
                        />
                        <YAxis
                          tick={{ fill: "#94A3B8", fontSize: 10 }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip
                          content={
                            <DynamicTooltip
                              unit={graphTheme.unit}
                              accentHex={graphTheme.accentHex}
                            />
                          }
                        />
                        <Area
                          type={
                            graphTheme.chartType === "stepArea"
                              ? "stepAfter"
                              : "monotone"
                          }
                          dataKey="score"
                          name={graphTheme.label}
                          stroke={graphTheme.accentHex}
                          strokeWidth={3.2}
                          fill="url(#luxuryGoldCurveFill)"
                          filter="url(#goldCurveNeonGlow)"
                          dot={{
                            r: 4,
                            fill: "#FEF08A",
                            stroke: graphTheme.accentHex,
                            strokeWidth: 2,
                          }}
                          activeDot={{
                            r: 7,
                            fill: "#FFFFFF",
                            stroke: graphTheme.accentHex,
                            strokeWidth: 2.5,
                          }}
                        />
                      </AreaChart>
                    )}
                  </ResponsiveContainer>
                </div>
              </div>

              {/* 3 TOPPER NAME CARDS BELOW GRAPH (NAMES ONLY — NO 1ST / 2ND / 3RD PLACE TEXT!) */}
              <div
                onClick={(e) => e.stopPropagation()}
                className="relative z-10 grid grid-cols-3 gap-2.5 pt-2.5 border-t border-amber-300/20 text-center text-xs"
              >
                {[
                  {
                    user: graphTop1,
                    boxCls:
                      "bg-gradient-to-b from-[#2A1F0B] to-[#110D06] border-amber-300/75 shadow-[0_0_16px_-4px_rgba(245,196,81,0.38)]",
                    nameCls: "text-amber-200",
                    valCls: "text-white",
                  },
                  {
                    user: graphTop2,
                    boxCls:
                      "bg-gradient-to-b from-[#20232C] to-[#0E1015] border-slate-300/60",
                    nameCls: "text-slate-200",
                    valCls: "text-slate-100",
                  },
                  {
                    user: graphTop3,
                    boxCls:
                      "bg-gradient-to-b from-[#29160E] to-[#110A07] border-orange-300/60",
                    nameCls: "text-orange-200",
                    valCls: "text-orange-100",
                  },
                ].map((slot, idx) => (
                  <div
                    key={idx}
                    onClick={() => slot.user && setLiveViewUser(slot.user)}
                    className={`p-2.5 rounded-2xl border cursor-pointer transition hover:-translate-y-0.5 ${slot.boxCls}`}
                  >
                    <span
                      className={`text-[11px] font-black truncate block ${slot.nameCls}`}
                    >
                      {slot.user?.name || "—"}
                    </span>
                    <span
                      className={`font-black text-base mt-0.5 block ${slot.valCls}`}
                    >
                      {slot.user
                        ? `${graphTheme.getValue(slot.user)}${graphTheme.shortUnit}`
                        : "-"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ===================================================================
            4. CUROS LEADERBOARD RANKINGS VAULT (WITH INTEGRATED SEARCH)
        =================================================================== */}
        <section className="gold-vault-frame rounded-3xl p-5 sm:p-7 space-y-5 overflow-hidden">
          <div className="gold-brushed-grain" />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-[2.5px] bg-gradient-to-r from-amber-500/20 via-yellow-200 to-amber-500/20" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[2px] bg-gradient-to-r from-transparent via-amber-400/60 to-transparent" />

          {/* Rankings Vault Header with Integrated Search */}
          <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 border-b border-amber-300/25 pb-4">
            <div>
              <span className="text-[10px] font-black uppercase tracking-[0.22em] text-amber-300 block">
                ✦ OFFICIAL HALL OF STANDINGS
              </span>
              <h2 className="text-xl font-black text-white mt-0.5 tracking-tight">
                Curos Leaderboard Rankings
              </h2>
              <p className="text-xs text-amber-100/65 mt-0.5 font-medium">
                Top performers based on current Curo treasury balance
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="relative w-56 sm:w-64">
                <span className="absolute left-3.5 top-2.5 text-xs text-amber-300/80">
                  🔍
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search competitor..."
                  className="w-full bg-[#0A0907] border border-amber-300/45 focus:border-amber-300 rounded-2xl pl-9 pr-3 py-2 text-xs font-bold text-white placeholder-slate-400 outline-none transition"
                />
              </div>

              <span className={`text-xs font-black border px-4 py-1.5 rounded-full ${curosMainTheme.badgeCls}`}>
                Showing {filteredCompetitors.length} Competitors
              </span>
            </div>
          </div>

          {/* Aligned 4-Column Table Header Bar + Separate Horizontal Tabs */}
          <div className="relative z-10 overflow-x-auto">
            <div className="min-w-[680px] space-y-2.5">
              {/* Golden Column Header Strip */}
              <div className="grid grid-cols-12 items-center px-5 py-3 rounded-2xl bg-[#0D0B07]/95 border border-amber-300/30 text-[11px] font-black uppercase tracking-[0.16em] text-amber-200/85">
                <div className="col-span-2">RANK</div>
                <div className="col-span-4">USER</div>
                <div className="col-span-4">TIER &amp; TRACK</div>
                <div className="col-span-2 text-right">
                  {curosMainTheme.columnHeader}
                </div>
              </div>

              {/* Separate Horizontal Tab for Every Ranked Competitor */}
              {filteredCompetitors.map((u) => {
                const val = curosMainTheme.getValue(u);
                const isTop3 = u.rank <= 3;

                const rowTabClass =
                  u.rank === 1
                    ? "lb-tab-rank-1"
                    : u.rank === 2
                    ? "lb-tab-rank-2"
                    : u.rank === 3
                    ? "lb-tab-rank-3"
                    : "lb-tab-standard";

                const tierBadge =
                  u.rank === 1
                    ? {
                        label: curosMainTheme.titles[0],
                        cls: "bg-amber-400/20 text-amber-200 border-amber-300/60",
                      }
                    : u.rank === 2
                    ? {
                        label: curosMainTheme.titles[1],
                        cls: "bg-slate-200/15 text-slate-100 border-slate-200/45",
                      }
                    : u.rank === 3
                    ? {
                        label: curosMainTheme.titles[2],
                        cls: "bg-orange-400/20 text-orange-200 border-orange-300/50",
                      }
                    : {
                        label: "Cohort Contender",
                        cls: "bg-white/[0.05] text-slate-300 border-white/15",
                      };

                return (
                  <div
                    key={u.id ?? `${u.name}-${u.rank}`}
                    onClick={() => setLiveViewUser(u)}
                    className={`cursor-pointer group rounded-2xl px-5 py-3.5 grid grid-cols-12 items-center gap-3 select-none ${rowTabClass}`}
                  >
                    {/* Live Sweeping Shine ONLY on Top 3 Champion Tabs */}
                    {isTop3 && (
                      <div
                        className="lb-row-shine-overlay"
                        style={{
                          animationDelay: `${(u.rank - 1) * -1.4}s`,
                        }}
                      />
                    )}

                    {/* COL 1: RANK + 3D MEDAL FOR TOP 3 */}
                    <div className="col-span-2 flex items-center gap-2.5 relative z-10">
                      {isTop3 && (
                        <RealisticMetallicMedalSVG
                          tier={
                            u.rank === 1
                              ? "gold"
                              : u.rank === 2
                              ? "silver"
                              : "bronze"
                          }
                          size={34}
                          showRibbon={false}
                        />
                      )}
                      <span
                        className={`px-2.5 py-1 rounded-xl text-xs font-black ${
                          u.rank === 1
                            ? "bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-500 text-black shadow-[0_0_12px_rgba(250,204,21,0.45)]"
                            : u.rank === 2
                            ? "bg-gradient-to-r from-white via-slate-200 to-slate-300 text-slate-950"
                            : u.rank === 3
                            ? "bg-gradient-to-r from-orange-200 via-amber-400 to-orange-500 text-slate-950"
                            : "text-amber-100/80 bg-black/55 border border-amber-100/20"
                        }`}
                      >
                        #{u.rank}
                      </span>
                    </div>

                    {/* COL 2: USER AVATAR + NAME */}
                    <div className="col-span-4 flex items-center gap-3.5 min-w-0 relative z-10">
                      <div
                        className={`w-10 h-10 rounded-xl font-black text-xs flex items-center justify-center shrink-0 ${
                          u.rank === 1
                            ? "bg-gradient-to-br from-yellow-200 via-amber-400 to-amber-600 text-black shadow-[0_0_16px_rgba(245,196,81,0.45)]"
                            : u.rank === 2
                            ? "bg-gradient-to-br from-white via-slate-200 to-slate-400 text-black"
                            : u.rank === 3
                            ? "bg-gradient-to-br from-orange-200 via-amber-500 to-orange-700 text-black"
                            : "bg-[#171512] text-amber-100/90 border border-amber-200/25"
                        }`}
                      >
                        {(u.name || "U").slice(0, 2).toUpperCase()}
                      </div>

                      <span
                        className={`font-black text-[15px] tracking-wide truncate transition ${
                          u.rank === 1
                            ? "bg-gradient-to-r from-amber-100 via-yellow-200 to-amber-100 bg-clip-text text-transparent"
                            : "text-white group-hover:text-amber-200"
                        }`}
                      >
                        {u.name}
                      </span>
                    </div>

                    {/* COL 3: TIER & TRACK */}
                    <div className="col-span-4 flex items-center gap-2.5 min-w-0 relative z-10">
                      <span
                        className={`px-3 py-1 rounded-full text-[11px] font-extrabold border shrink-0 ${tierBadge.cls}`}
                      >
                        {tierBadge.label}
                      </span>
                      <span className="text-xs text-slate-300/80 font-medium truncate">
                        • {u.program_name}
                      </span>
                    </div>

                    {/* COL 4: SCORE / CUROS VALUE */}
                    <div className="col-span-2 text-right relative z-10">
                      <span
                        className={`inline-block text-sm font-black px-3.5 py-1.5 rounded-xl border ${
                          u.rank === 1
                            ? "bg-amber-400/20 text-amber-200 border-amber-300/75 shadow-[0_0_14px_rgba(245,196,81,0.3)]"
                            : u.rank === 2
                            ? "bg-slate-200/15 text-white border-slate-200/55"
                            : u.rank === 3
                            ? "bg-orange-400/20 text-orange-200 border-orange-300/60"
                            : val > 0
                            ? curosMainTheme.badgeCls
                            : "text-slate-400 border-amber-100/15 bg-black/45"
                        }`}
                      >
                        🪙 {val}
                        {curosMainTheme.shortUnit}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ===================================================================
            4. MOUNT GRAPH SCORE BREAKDOWN MODAL & COMPETITOR LIVE VIEW MODAL
        =================================================================== */}
        <GraphScoreBreakdownModal
          isOpen={graphModalOpen}
          onClose={() => setGraphModalOpen(false)}
          graphUsers={graphTop10Users}
          graphTheme={graphTheme}
          graphMetric={graphMetric}
          onSelectGraphMetric={(m) => setGraphMetric(m)}
          onInspectUser={(u) => setLiveViewUser(u)}
        />

        <CompetitorLiveViewModal
          user={liveViewUser}
          onClose={() => setLiveViewUser(null)}
          tabTheme={curosMainTheme}
        />
      </div>
    </div>
  );
}
