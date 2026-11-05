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

// ============================================================================
// 2. PHOTOREALISTIC 3D METALLIC MEDAL SVG (EXACT REPLICA OF medal_2.jpg)
//    - Woven Red-White-Blue Tricolor V-Ribbon + Rectangular Cast-Metal Bail
//    - Multi-Stop High-Gloss Specular Metallic Rim (Gold #1, Silver #2, Bronze #3)
//    - 3D Embossed Laurel Wreath with Crossed Stems + 3D Lathe-Shaded Trophy Cup
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
      glowColor: "rgba(250, 204, 21, 0.45)",
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
      glowColor: "rgba(251, 146, 60, 0.45)",
    },
  };

  const p = palettes[tier] || palettes.gold;

  // 8 pairs of sculpted 3D laurel leaves along each side of the wreath (matching medal_2.jpg)
  const laurelPairs = [
    { cx: -16, cy: 23, ang: -48, s: 0.92 },
    { cx: -24, cy: 15, ang: -28, s: 1.0 },
    { cx: -29, cy: 5, ang: -10, s: 1.05 },
    { cx: -30, cy: -6, ang: 10, s: 1.05 },
    { cx: -27, cy: -17, ang: 28, s: 1.0 },
    { cx: -21, cy: -26, ang: 45, s: 0.92 },
    { cx: -14, cy: -32, ang: 62, s: 0.82 },
    // Inner leaf row for lush embossed volume
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
      {/* Realistic Metallic Back-Glow */}
      <div
        className="pointer-events-none absolute inset-2 rounded-full blur-2xl opacity-80"
        style={{ background: p.glowColor }}
      />

      <svg
        viewBox={showRibbon ? "0 0 160 175" : "12 36 136 136"}
        className="w-full h-full relative z-10 overflow-visible drop-shadow-[0_14px_22px_rgba(0,0,0,0.9)]"
      >
        <defs>
          {/* 1. Stepped Outer Metallic Bezel Gradient */}
          <linearGradient id={`bezel-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={p.bezelOuter[0]} />
            <stop offset="18%" stopColor={p.bezelOuter[1]} />
            <stop offset="38%" stopColor={p.bezelOuter[2]} />
            <stop offset="54%" stopColor={p.bezelOuter[3]} />
            <stop offset="72%" stopColor={p.bezelOuter[4]} />
            <stop offset="88%" stopColor={p.bezelOuter[5]} />
            <stop offset="100%" stopColor={p.bezelOuter[6]} />
          </linearGradient>

          {/* 2. Brushed Metallic Dish Face Gradient */}
          <radialGradient id={`dish-${uid}`} cx="32%" cy="26%" r="78%">
            <stop offset="0%" stopColor={p.dishFace[0]} />
            <stop offset="32%" stopColor={p.dishFace[1]} />
            <stop offset="68%" stopColor={p.dishFace[2]} />
            <stop offset="90%" stopColor={p.dishFace[3]} />
            <stop offset="100%" stopColor={p.dishFace[4]} />
          </radialGradient>

          {/* 3. Horizontal Cylindrical Lathe Gradient for 3D Center Trophy Cup */}
          <linearGradient id={`cup-${uid}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={p.cupLathe[0]} />
            <stop offset="18%" stopColor={p.cupLathe[1]} />
            <stop offset="36%" stopColor={p.cupLathe[2]} />
            <stop offset="46%" stopColor={p.cupLathe[3]} />
            <stop offset="60%" stopColor={p.cupLathe[4]} />
            <stop offset="84%" stopColor={p.cupLathe[5]} />
            <stop offset="100%" stopColor={p.cupLathe[6]} />
          </linearGradient>

          {/* 4. 3D Embossed Laurel Leaf Gradient */}
          <linearGradient id={`leaf-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={p.leafLight} />
            <stop offset="48%" stopColor={p.leafMid} />
            <stop offset="100%" stopColor={p.leafDark} />
          </linearGradient>

          {/* 5. Specular White Mirror Sweep */}
          <linearGradient id={`sheen-${uid}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0" />
            <stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.58" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </linearGradient>

          {/* 6. 3D Emboss Drop Shadow Filter for Trophy & Wreath */}
          <filter id={`emboss-${uid}`} x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow
              dx="1.4"
              dy="2.2"
              stdDeviation="1.1"
              floodColor={p.deepShadow}
              floodOpacity="0.88"
            />
          </filter>
        </defs>

        {/* ===============================================================
            WOVEN RED-WHITE-BLUE TRICOLOR V-RIBBON & METALLIC BAIL (medal_2.jpg)
        =============================================================== */}
        {showRibbon && (
          <g>
            {/* Left Ribbon Strap (Blue outer, White middle, Red inner) */}
            <polygon points="36,2 65,44 55,48 24,2" fill="#1E40AF" />
            <polygon points="44,2 71,44 63,46 35,2" fill="#F1F5F9" />
            <polygon points="52,2 77,44 70,45 44,2" fill="#DC2626" />

            {/* Right Ribbon Strap (Red inner, White middle, Blue outer) */}
            <polygon points="108,2 83,44 90,45 116,2" fill="#DC2626" />
            <polygon points="116,2 89,44 97,46 125,2" fill="#F1F5F9" />
            <polygon points="124,2 95,44 105,48 136,2" fill="#1E40AF" />

            {/* Ribbon Shadow Over Bail */}
            <ellipse cx="80" cy="43" rx="18" ry="4" fill="rgba(0,0,0,0.55)" />

            {/* Cast-Metal Rectangular Top Loop / Bail (From medal_2.jpg) */}
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

        {/* ===============================================================
            STEPPED HIGH-GLOSS METALLIC COIN BODY & BEZEL RIMS
        =============================================================== */}
        {/* 3D Lower Coin Edge Thickness */}
        <circle cx="81" cy="107.5" r="56" fill={p.deepShadow} />

        {/* Outer Mirror-Polished Bezel */}
        <circle
          cx="80"
          cy="105"
          r="56"
          fill={`url(#bezel-${uid})`}
          stroke={p.rimHighlight}
          strokeWidth="1.4"
        />

        {/* Outer Bezel Specular Inner Lip */}
        <circle
          cx="80"
          cy="105"
          r="49.5"
          fill={p.deepShadow}
        />

        {/* Recessed Metallic Dish Face */}
        <circle
          cx="80"
          cy="105"
          r="47.5"
          fill={`url(#dish-${uid})`}
          stroke={`url(#bezel-${uid})`}
          strokeWidth="2.2"
        />

        {/* Crisp Specular Rim Ring Inside Dish */}
        <circle
          cx="80"
          cy="105"
          r="45.8"
          fill="none"
          stroke={p.rimHighlight}
          strokeWidth="0.9"
          opacity="0.75"
        />

        {/* ===============================================================
            EMBOSSED 3D LAUREL WREATH + 3D TROPHY CUP (medal_2.jpg)
        =============================================================== */}
        <g transform="translate(80, 106)" filter={`url(#emboss-${uid})`}>
          {/* Curved Left & Right Laurel Stems */}
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

          {/* Sculpted 3D Laurel Leaves (Mirrored Left & Right with Central Vein) */}
          {laurelPairs.map((lf, i) => (
            <React.Fragment key={i}>
              {/* Left Leaf */}
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

              {/* Right Mirrored Leaf */}
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

          {/* Crossed Laurel Stems & Ribbon Knot at Bottom (6 o'clock in medal_2.jpg) */}
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

          {/* =============================================================
              CENTER 3D EMBOSSED CHAMPIONSHIP TROPHY CUP (medal_2.jpg)
          ============================================================= */}
          {/* Ornate S-Curved Trophy Handles (Left & Right) */}
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

          {/* Main 3D Lathe-Shaded Trophy Cup Bowl */}
          <path
            d="M-14,-24 L14,-24 C14,-4 7,5 0,5 C-7,5 -14,-4 -14,-24 Z"
            fill={`url(#cup-${uid})`}
            stroke={p.leafDark}
            strokeWidth="0.85"
          />

          {/* Raised Top Rim Lip of Trophy Cup */}
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

          {/* Bright Specular Vertical Glint on Trophy Bowl */}
          <path
            d="M-8,-22 L-3,-22 C-3,-7 -4.5,1 -6,2 C-7.5,1 -8,-7 -8,-22 Z"
            fill="#FFFFFF"
            opacity="0.65"
          />

          {/* Sculpted Trophy Stem */}
          <path
            d="M-3,5 L3,5 L4.5,15 L-4.5,15 Z"
            fill={`url(#cup-${uid})`}
            stroke={p.leafDark}
            strokeWidth="0.7"
          />

          {/* Two-Tiered Trophy Pedestal Base */}
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

        {/* Diagonal Specular Light Sheen Across Medal Face */}
        <path
          d="M42,72 L68,52 L116,134 L90,154 Z"
          fill={`url(#sheen-${uid})`}
          opacity="0.45"
        />

        {/* Crisp Starburst Glints on Bezel */}
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
// 3. TROPHY CABINET SHOWCASE + ALIGNED WINNER PLAQUES
// ============================================================================
function TrophyCabinetPodiumStage({
  firstPlace,
  secondPlace,
  thirdPlace,
  totalCompetitors,
  tabTheme,
  activeTab,
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
      tetherGrad: "from-purple-400 via-slate-200 to-transparent",
      dotCls: "bg-slate-100 shadow-[0_0_14px_#E2E8F0]",
      cardBg:
        "bg-gradient-to-b from-[#18152B]/95 via-[#0E0D18]/98 to-[#07070C]",
      borderCls:
        hoveredSlot === "second"
          ? "border-purple-400 ring-2 ring-purple-400/40 shadow-[0_0_35px_rgba(168,85,247,0.45)] -translate-y-1.5"
          : "border-slate-300/35 hover:border-purple-400/75 shadow-[0_10px_28px_rgba(0,0,0,0.85)]",
      topHighlight: "from-transparent via-purple-400 to-transparent",
      badgePill: "bg-purple-500/25 text-purple-200 border-purple-400/50",
      nameCls: "text-white",
      scoreBox: "bg-white/[0.05] border-slate-300/30",
      scoreText: "text-slate-100",
    },
    {
      id: "first",
      rankTag: "👑 #1 CHAMPION",
      title: tabTheme.titles[0],
      user: firstPlace,
      isChampion: true,
      tetherGrad: "from-amber-200 via-yellow-400 to-transparent",
      dotCls: "bg-amber-300 shadow-[0_0_18px_#FBBF24]",
      cardBg:
        "bg-gradient-to-b from-[#291F0B]/98 via-[#161106]/98 to-[#090703]",
      borderCls:
        hoveredSlot === "first"
          ? "border-amber-300 ring-2 ring-amber-400/60 shadow-[0_0_55px_rgba(245,158,11,0.6)] -translate-y-2.5"
          : "border-amber-400/85 shadow-[0_0_45px_-5px_rgba(245,158,11,0.42)] -translate-y-1.5",
      topHighlight: "from-amber-500/20 via-yellow-300 to-amber-500/20",
      badgePill:
        "bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 text-black border-amber-200 shadow-[0_0_18px_rgba(245,158,11,0.5)]",
      nameCls:
        "bg-gradient-to-r from-amber-100 via-yellow-200 to-amber-100 bg-clip-text text-transparent",
      scoreBox:
        "bg-amber-500/20 border-amber-400/65 shadow-[inset_0_0_15px_rgba(245,158,11,0.25)]",
      scoreText: "text-amber-300",
    },
    {
      id: "third",
      rankTag: "🥉 3RD PLACE",
      title: tabTheme.titles[2],
      user: thirdPlace,
      isChampion: false,
      tetherGrad: "from-rose-500 via-orange-400 to-transparent",
      dotCls: "bg-orange-400 shadow-[0_0_14px_#FB923C]",
      cardBg:
        "bg-gradient-to-b from-[#271312]/95 via-[#140B0B]/98 to-[#080506]",
      borderCls:
        hoveredSlot === "third"
          ? "border-orange-400 ring-2 ring-orange-400/40 shadow-[0_0_35px_rgba(251,146,60,0.45)] -translate-y-1.5"
          : "border-orange-400/35 hover:border-orange-400/75 shadow-[0_10px_28px_rgba(0,0,0,0.85)]",
      topHighlight: "from-transparent via-orange-400 to-transparent",
      badgePill: "bg-orange-500/25 text-orange-200 border-orange-400/50",
      nameCls: "text-white",
      scoreBox: "bg-orange-500/15 border-orange-400/35",
      scoreText: "text-orange-300",
    },
  ];

  return (
    <div
      className={`lg:col-span-7 ${tabTheme.cardBg} rounded-3xl border border-white/10 shadow-[0_15px_50px_rgba(0,0,0,0.85)] flex flex-col justify-between relative overflow-hidden select-none`}
    >
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

      {/* 1. TOP STAGE HEADER BAR */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-6 pt-5 pb-3 relative z-30 bg-gradient-to-b from-black/80 to-transparent">
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

        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400 font-semibold">
            Live Standing • {totalCompetitors} Competitors
          </span>
        </div>
      </div>

      {/* 2. FULL-BLEED GLASS TROPHY CABINET IMAGE STAGE */}
      <div className="relative w-full overflow-hidden bg-[#0A0C12] -mt-2">
        <img
          src={activeImgSrc}
          alt="Glass Trophy Display with Gold Cup and Medals"
          onError={handleImageError}
          className="w-full h-[250px] sm:h-[295px] object-cover object-center block select-none pointer-events-none"
        />

        {/* Synchronized Spotlight Aura When Hovering a Winner */}
        <div className="pointer-events-none absolute inset-0 grid grid-cols-12">
          <div className="col-span-1" />
          <div
            className={`col-span-3 transition-opacity duration-300 bg-gradient-to-b from-purple-400/25 via-white/10 to-transparent blur-md ${
              hoveredSlot === "second" ? "opacity-100" : "opacity-0"
            }`}
          />
          <div
            className={`col-span-4 transition-opacity duration-300 bg-gradient-to-b from-amber-300/30 via-yellow-200/15 to-transparent blur-md ${
              hoveredSlot === "first" ? "opacity-100" : "opacity-0"
            }`}
          />
          <div
            className={`col-span-3 transition-opacity duration-300 bg-gradient-to-b from-orange-400/25 via-rose-400/10 to-transparent blur-md ${
              hoveredSlot === "third" ? "opacity-100" : "opacity-0"
            }`}
          />
          <div className="col-span-1" />
        </div>

        {/* Top & Bottom Vignette Blends */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-[#0A0C12] to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#08090E] via-[#08090E]/80 to-transparent" />

        {/* Interactive Click/Hover Zones Over the 3 Pedestals */}
        <div className="absolute inset-0 z-20 grid grid-cols-12">
          <div className="col-span-1" />
          <div
            onMouseEnter={() => setHoveredSlot("second")}
            onMouseLeave={() => setHoveredSlot(null)}
            onClick={() =>
              secondPlace &&
              onSelectCompetitor &&
              onSelectCompetitor(secondPlace)
            }
            className="col-span-3 cursor-pointer h-full"
          />
          <div
            onMouseEnter={() => setHoveredSlot("first")}
            onMouseLeave={() => setHoveredSlot(null)}
            onClick={() =>
              firstPlace &&
              onSelectCompetitor &&
              onSelectCompetitor(firstPlace)
            }
            className="col-span-4 cursor-pointer h-full"
          />
          <div
            onMouseEnter={() => setHoveredSlot("third")}
            onMouseLeave={() => setHoveredSlot(null)}
            onClick={() =>
              thirdPlace &&
              onSelectCompetitor &&
              onSelectCompetitor(thirdPlace)
            }
            className="col-span-3 cursor-pointer h-full"
          />
          <div className="col-span-1" />
        </div>
      </div>

      {/* 3. PEDESTAL-DOCKED WINNER PLAQUES DIRECTLY BELOW THE 3 GLASS PEDESTALS */}
      <div className="relative z-30 -mt-9 sm:-mt-11 px-4 sm:px-8 pb-5 bg-gradient-to-b from-transparent via-[#08090E] to-[#08090E]">
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
                {/* Glowing Vertical Laser Tether Connecting Pedestal Base to Winner Plaque */}
                <div className="flex flex-col items-center mb-1">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${slot.dotCls} transition-transform duration-300 group-hover:scale-125`}
                  />
                  <div
                    className={`w-[2px] h-3.5 bg-gradient-to-b ${slot.tetherGrad}`}
                  />
                </div>

                {/* Illuminated Winner Plaque Card */}
                <div
                  className={`w-full flex-1 rounded-2xl p-3.5 sm:p-4 border ${slot.cardBg} ${slot.borderCls} backdrop-blur-xl transition-all duration-300 relative overflow-hidden flex flex-col items-center justify-between text-center`}
                >
                  {/* Top Specular Neon Line */}
                  <div
                    className={`pointer-events-none absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r ${slot.topHighlight}`}
                  />

                  {/* Rank Badge Pill */}
                  <div
                    className={`px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${slot.badgePill}`}
                  >
                    {slot.rankTag}
                  </div>

                  {/* Winner Name & Official Title */}
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
                    <span className="text-[11px] font-bold text-slate-400 block truncate mt-0.5">
                      {slot.title}
                    </span>
                  </div>

                  {/* Highlighted Score Readout Box */}
                  <div
                    className={`w-full py-1.5 px-3 rounded-xl border ${slot.scoreBox} flex items-center justify-between`}
                  >
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                      {tabTheme.label}
                    </span>
                    <span
                      className={`${
                        slot.isChampion
                          ? "text-base sm:text-lg"
                          : "text-sm sm:text-base"
                      } font-black ${slot.scoreText}`}
                    >
                      {activeTab === "curos" && "🪙 "}
                      {val}
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
//    - Rank #1 -> Shiny Metallic Gold Medal (medal_2.jpg)
//    - Rank #2 -> Shiny Metallic Silver Medal (medal_2.jpg)
//    - Rank #3 -> Shiny Metallic Bronze Medal (medal_2.jpg)
//    - Rank #4+ -> NO Medal (Clean Obsidian Rank Shield)
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
        className="relative w-full max-w-lg bg-[#070911] border border-amber-400/45 rounded-3xl p-6 text-center shadow-[0_0_90px_rgba(245,158,11,0.3)] overflow-hidden"
      >
        <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-80 h-80 bg-white/15 rounded-full blur-3xl" />

        <div className="flex items-center justify-between relative z-10 mb-3">
          <span
            className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${tabTheme.badgeCls}`}
          >
            ◎ Live Competitor Showcase • Rank #{user.rank}
          </span>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white/5 hover:bg-rose-500/20 text-slate-300 hover:text-rose-300 font-bold text-xs cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Realistic Metallic Medal ONLY for Top 3 Winners; Clean Rank Shield for Others */}
        <div className="my-5 flex justify-center relative z-10">
          {isTop3 ? (
            <RealisticMetallicMedalSVG
              tier={medalTier}
              size={155}
              showRibbon={true}
            />
          ) : (
            <div className="w-28 h-28 rounded-3xl bg-gradient-to-b from-[#161926] to-[#090B12] border-2 border-white/15 shadow-[0_12px_30px_rgba(0,0,0,0.8)] flex flex-col items-center justify-center">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
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
          {isTop3
            ? tabTheme.titles[user.rank - 1]
            : "Cohort Contender"}{" "}
          • {user.program_name}
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 my-5 relative z-10">
          <div className="p-3 rounded-2xl bg-[#0E101A] border border-amber-400/25">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">
              Curos
            </span>
            <span className="text-base font-black text-amber-300 mt-0.5 block">
              🪙 {user.curos}
            </span>
          </div>
          <div className="p-3 rounded-2xl bg-[#0E101A] border border-purple-400/25">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">
              Completion
            </span>
            <span className="text-base font-black text-purple-300 mt-0.5 block">
              🏆 {user.completion_pct}%
            </span>
          </div>
          <div className="p-3 rounded-2xl bg-[#0E101A] border border-emerald-400/25">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">
              Retention
            </span>
            <span className="text-base font-black text-emerald-300 mt-0.5 block">
              📈 {user.retention_pct}%
            </span>
          </div>
          <div className="p-3 rounded-2xl bg-[#0E101A] border border-rose-400/25">
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
// 5. MAIN COMPONENT: Leaderboards.jsx
// ============================================================================
export default function Leaderboards({ backendData = null }) {
  const [rawCompetitors, setRawCompetitors] = useState([]);
  const [loading, setLoading] = useState(!backendData);
  const [syncing, setSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState(null);

  // 5 Distinct Tabs: 'curos' | 'completion' | 'retention' | 'application' | 'streaks'
  const [activeTab, setActiveTab] = useState("curos");
  const [searchQuery, setSearchQuery] = useState("");
  const [liveViewUser, setLiveViewUser] = useState(null);

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

  // 5 DISTINCT VISUAL THEMES & STAGE CONFIGURATIONS (ONE PER TAB!)
  const tabTheme = useMemo(() => {
    const themes = {
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
        champRibbon: "from-amber-300 via-yellow-400 to-amber-500 text-black",
        titles: ["Curo Champion", "Curo Achiever", "Curo Star"],
        chartType: "area",
        chartTitle: "Top 10 Curos Treasury Curve",
        getValue: (u) => Number(u?.curos || 0),
      },
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
        champRibbon: "from-purple-400 via-fuchsia-400 to-indigo-400 text-slate-950",
        titles: ["Completion Master", "Curriculum Finisher", "Track Pacesetter"],
        chartType: "bar",
        chartTitle: "Curriculum Completion Milestone Bars",
        getValue: (u) => Number(u?.completion_pct || 0),
      },
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
        champRibbon: "from-emerald-300 via-teal-300 to-cyan-300 text-slate-950",
        titles: ["Retention Guardian", "Stability Anchor", "Memory Sentinel"],
        chartType: "radar",
        chartTitle: "5-Pillar Cohort Stability Polygon",
        getValue: (u) => Number(u?.retention_pct || 0),
      },
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
        champRibbon: "from-cyan-300 via-sky-300 to-blue-400 text-slate-950",
        titles: ["Mastery Architect", "Precision Specialist", "Applied Scholar"],
        chartType: "composed",
        chartTitle: "Quiz Application vs. Completion Precision",
        getValue: (u) => Number(u?.application_pct || 0),
      },
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
        champRibbon: "from-rose-400 via-orange-400 to-amber-300 text-slate-950",
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
    return rankedCompetitors.filter((u) =>
      u.name.toLowerCase().includes(q)
    );
  }, [rankedCompetitors, searchQuery]);

  const chartData = useMemo(() => {
    return rankedCompetitors.slice(0, 10).map((u) => ({
      name: u.name.split(" ")[0],
      score: tabTheme.getValue(u),
      secondary: Number(u.completion_pct || 0),
    }));
  }, [rankedCompetitors, tabTheme]);

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

  const firstPlace = rankedCompetitors[0];
  const secondPlace = rankedCompetitors[1];
  const thirdPlace = rankedCompetitors[2];

  return (
    <div
      className={`h-screen w-full ${tabTheme.pageBg} text-slate-100 font-sans overflow-y-auto overflow-x-hidden scroll-smooth transition-colors duration-500 leaderboards-scroll-container`}
    >
      <style>{`
        .leaderboards-scroll-container {
          scrollbar-width: thin;
          scrollbar-color: ${tabTheme.accentHex}66 #080711;
        }
        .leaderboards-scroll-container::-webkit-scrollbar {
          width: 8px;
        }
        .leaderboards-scroll-container::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.4);
        }
        .leaderboards-scroll-container::-webkit-scrollbar-thumb {
          background: ${tabTheme.accentHex}55;
          border-radius: 9999px;
        }
        .leaderboards-scroll-container::-webkit-scrollbar-thumb:hover {
          background: ${tabTheme.accentHex}aa;
        }
      `}</style>

      <div className="w-full p-5 md:p-6 pb-28 space-y-6">
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
            2. 4 KPI SUMMARY CARDS
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
            3. 5 CATEGORY TABS + SEARCH BAR
        =================================================================== */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="overflow-x-auto max-w-full pb-1">
            <div
              className={`inline-flex items-center gap-1.5 ${tabTheme.cardBg} p-1.5 rounded-2xl border border-white/10 shadow-md whitespace-nowrap`}
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
            4. GRAND STAGE: TROPHY CABINET + WINNER PLAQUES (LEFT 7 COLS)
               + PER-TAB TELEMETRY CHART (RIGHT 5 COLS)
        =================================================================== */}
        {!loading && rankedCompetitors.length > 0 && (
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
            <TrophyCabinetPodiumStage
              firstPlace={firstPlace}
              secondPlace={secondPlace}
              thirdPlace={thirdPlace}
              totalCompetitors={rankedCompetitors.length}
              tabTheme={tabTheme}
              activeTab={activeTab}
              onSelectCompetitor={(u) => setLiveViewUser(u)}
            />

            {/* RIGHT 5 COLS: BESPOKE VISUALIZATION THAT CHANGES PER TAB */}
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

              <div className="w-full h-60 my-3 bg-black/50 rounded-2xl p-3 border border-white/5">
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
                          tabTheme.chartType === "stepArea"
                            ? "stepAfter"
                            : "monotone"
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
            5. RESTORED LEADERBOARD RANKINGS TABLE
               - Original 4 Columns: RANK | USER | TIER & TRACK | {COLUMN_HEADER}
               - RELATIVE STANDING removed; no extra columns added
               - Gold Medal for #1, Silver for #2, Bronze for #3, NO medals for #4+
               - Only candidate name visible (no Gmail/email clutter)
        =================================================================== */}
        <section
          className={`${tabTheme.cardBg} rounded-3xl p-6 border border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.6)] space-y-4`}
        >
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-4">
            <div>
              <h2 className="text-lg font-extrabold text-white">
                {tabTheme.label} Leaderboard Rankings
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {tabTheme.subtitle}
              </p>
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
                  <th className="py-3.5 px-4 w-32">RANK</th>
                  <th className="py-3.5 px-4 w-[38%]">USER</th>
                  <th className="py-3.5 px-4 hidden md:table-cell">
                    TIER & TRACK
                  </th>
                  <th className="py-3.5 px-4 text-right">
                    {tabTheme.columnHeader}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs">
                {filteredCompetitors.map((u) => {
                  const val = tabTheme.getValue(u);
                  const isTop3 = u.rank <= 3;

                  const rowBg =
                    u.rank === 1
                      ? "bg-gradient-to-r from-amber-500/10 via-transparent to-transparent"
                      : u.rank === 2
                      ? "bg-gradient-to-r from-slate-300/[0.06] via-transparent to-transparent"
                      : u.rank === 3
                      ? "bg-gradient-to-r from-orange-500/[0.07] via-transparent to-transparent"
                      : "hover:bg-white/[0.03]";

                  const tierBadge =
                    u.rank === 1
                      ? {
                          label: tabTheme.titles[0],
                          cls: tabTheme.badgeCls,
                        }
                      : u.rank === 2
                      ? {
                          label: tabTheme.titles[1],
                          cls: "bg-slate-400/15 text-slate-200 border-slate-300/35",
                        }
                      : u.rank === 3
                      ? {
                          label: tabTheme.titles[2],
                          cls: "bg-orange-500/15 text-orange-300 border-orange-400/35",
                        }
                      : {
                          label: "Cohort Contender",
                          cls: "bg-white/5 text-slate-400 border-white/10",
                        };

                  return (
                    <tr
                      key={u.id ?? u.name}
                      onClick={() => setLiveViewUser(u)}
                      className={`cursor-pointer ${rowBg} transition group`}
                    >
                      {/* 1. RANK (Realistic Gold #1, Silver #2, Bronze #3; No medal for #4+) */}
                      <td className="py-3.5 px-4 font-extrabold">
                        <div className="flex items-center gap-2.5">
                          {isTop3 && (
                            <RealisticMetallicMedalSVG
                              tier={
                                u.rank === 1
                                  ? "gold"
                                  : u.rank === 2
                                  ? "silver"
                                  : "bronze"
                              }
                              size={32}
                              showRibbon={false}
                            />
                          )}
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

                      {/* 2. USER (Clean Name Only — No Gmail/Email) */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3.5">
                          <div
                            className={`w-9 h-9 rounded-xl font-extrabold text-xs flex items-center justify-center shrink-0 ${
                              u.rank === 1
                                ? `bg-gradient-to-br ${tabTheme.champRibbon}`
                                : u.rank === 2
                                ? "bg-gradient-to-br from-white via-slate-300 to-slate-400 text-black"
                                : u.rank === 3
                                ? "bg-gradient-to-br from-orange-300 via-amber-500 to-orange-700 text-black"
                                : "bg-white/[0.04] text-slate-300 border border-white/10"
                            }`}
                          >
                            {(u.name || "U").slice(0, 2).toUpperCase()}
                          </div>
                          <span className="font-extrabold text-white text-[15px] tracking-wide group-hover:text-amber-200 transition">
                            {u.name}
                          </span>
                        </div>
                      </td>

                      {/* 3. TIER & TRACK */}
                      <td className="py-3.5 px-4 hidden md:table-cell">
                        <div className="flex items-center gap-2.5">
                          <span
                            className={`px-3 py-0.5 rounded-full text-[11px] font-extrabold border ${tierBadge.cls}`}
                          >
                            {tierBadge.label}
                          </span>
                          <span className="text-xs text-slate-400 font-medium">
                            • {u.program_name}
                          </span>
                        </div>
                      </td>

                      {/* 4. SCORE COLUMN */}
                      <td className="py-3.5 px-4 text-right">
                        <span
                          className={`text-sm font-black px-3.5 py-1 rounded-xl border ${
                            val > 0
                              ? tabTheme.badgeCls
                              : "text-slate-500 border-white/5 bg-black/30"
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

        {/* LIVE VIEW COMPETITOR SHOWCASE MODAL */}
        <CompetitorLiveViewModal
          user={liveViewUser}
          onClose={() => setLiveViewUser(null)}
          tabTheme={tabTheme}
        />
      </div>
    </div>
  );
}