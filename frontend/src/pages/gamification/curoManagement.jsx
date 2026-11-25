/* eslint-disable react-hooks/set-state-in-effect */
import "../admin/AttritionKpiCards.css";
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
  Check,
  Edit3,
  Send,
  Upload,
  ShieldCheck,
  Crown,
  Filter,
  ChevronRight,
  RotateCcw,
} from "lucide-react";
import MainLayout from "../../layout/mainLayout";
import { API_BASE } from "../../config/api";
import api from "../../utils/axios";
import curoBotAvatar from "../../assets/curo_bot.png";
import celestialBotAvatar from "../../assets/celestial_bot.png";
import curoHeroCoinsImg from "../../assets/Golden Curo Coins Collection.png";

const API_BASE_URL =
  import.meta.env?.VITE_API_URL ||
  API_BASE ||
  (import.meta.env?.DEV
    ? "http://127.0.0.1:8000"
    : "https://saarthi-curious-00e8.onrender.com");

const STORAGE_KEY_AI_MODEL = "saarthi_celestial_curo_ai_model_v1";
const STORAGE_KEY_CURO_RULES = "saarthi_celestial_curo_rules_v1";
const STORAGE_KEY_BADGE_RULES = "saarthi_celestial_badge_rules_v1";
const STORAGE_KEY_USER_CUROS = "saarthi_celestial_user_curos_v1";

// Automatically locates uploaded AI assistant PNG model in src/ or public/
const AI_MODEL_ASSETS = import.meta.glob("/src/**/*.{png,webp,jpg,jpeg}", {
  eager: true,
  import: "default",
});

function resolveUploadedAiModel() {
  const match = Object.entries(AI_MODEL_ASSETS).find(([path]) =>
    /curo_bot|celestial_bot/i.test(path)
  );
  return match ? match[1] : curoBotAvatar || celestialBotAvatar || "/curo_bot.png";
}

const DEFAULT_AI_MODEL_SRC = resolveUploadedAiModel();

// ============================================================================
// 1. 15 OFFICIAL BADGE DEFINITIONS & UNLOCK RULES (FROM REWARDS ENGINE)
// ============================================================================
const DEFAULT_BADGE_RULES = [
  // BRONZE TIER
  {
    id: "app_bronze",
    badge_id: 7,
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
    badge_id: 1,
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
    badge_id: 10,
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
    badge_id: 4,
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
    badge_id: 13,
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
  // SILVER TIER
  {
    id: "app_silver",
    badge_id: 8,
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
    badge_id: 2,
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
    badge_id: 11,
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
    badge_id: 5,
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
    badge_id: 14,
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
  // GOLD TIER
  {
    id: "comp_gold",
    badge_id: 3,
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
    badge_id: 9,
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
    badge_id: 12,
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
    badge_id: 6,
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
    badge_id: 15,
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
];

// ============================================================================
// 2. DEFAULT CURO ECONOMY RULES & PROGRAM CONFIGURATION
// ============================================================================
const DEFAULT_CURO_CONFIG = {
  programs: [
    {
      id: "prog_client_rel",
      name: "Client Relationships",
      rewardAmount: 85,
      active: true,
      description: "Issued upon completing all track videos & final evaluation.",
    },
    {
      id: "prog_leadership",
      name: "Leadership Foundations",
      rewardAmount: 120,
      active: true,
      description: "Core enterprise leadership milestone treasury grant.",
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
      trigger: "Upon reaching 3 consecutive days",
      enabled: true,
    },
    {
      id: "rule_retention_80",
      title: "High Retention Mastery (≥80%)",
      reward: 30,
      trigger: "Per verified retention checkpoint",
      enabled: true,
    },
    {
      id: "rule_leader_override",
      title: "Team Leader Subordinate Dividend",
      reward: 10,
      trigger: "10% bonus mirror on subordinate payouts",
      enabled: true,
    },
  ],
};

// ============================================================================
// 3. INITIAL ROSTER (SYNCED WITH PLATFORM SNAPSHOT)
// ============================================================================
const INITIAL_USERS = [
  {
    id: 1,
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
    id: 2,
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
    id: 3,
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
    id: 4,
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
    id: 5,
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
    id: 8,
    name: "Anuj Jadhav",
    role: "Master Admin",
    franchise_partner: "-",
    curos: 140,
    completion: 2,
    application: 2,
    retention: 3,
    streak: 4,
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
// 4. PHOTOREALISTIC LIVE-SHINING 3D METALLIC MEDAL SVG (FULL & MINI SIZES)
// ============================================================================
function LiveShiningMetallicMedalSVG({
  badge,
  size = 42,
  showRibbon = true,
  isEarned = true,
}) {
  const {
    tier = "gold",
    bezelType = "classic_mirror",
    emblem = "trophy_cup",
    number,
    hasWings = false,
  } = badge || {};

  const uid = useMemo(
    () => `${badge?.id || "bdg"}-${Math.random().toString(36).slice(2, 7)}`,
    [badge?.id]
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
      halo: "rgba(250, 204, 21, 0.55)",
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
    const spikes = 24;
    for (let i = 0; i < spikes * 2; i++) {
      const r = i % 2 === 0 ? 52 : 47.5;
      const a = (i * Math.PI) / spikes;
      pts.push(`${(80 + r * Math.cos(a)).toFixed(1)},${(102 + r * Math.sin(a)).toFixed(1)}`);
    }
    return pts.join(" ");
  }, []);

  const viewBox = showRibbon ? "0 0 160 168" : "24 46 112 112";

  return (
    <div
      className="relative inline-flex items-center justify-center select-none shrink-0"
      style={{ width: size, height: size }}
      title={`${badge?.name || "Medal"} (+${badge?.curos || 0} Curos)`}
    >
      <div
        className={`pointer-events-none absolute inset-1 rounded-full blur-md transition-opacity ${
          isEarned ? "opacity-85" : "opacity-30"
        }`}
        style={{ background: p.halo }}
      />
      <svg
        viewBox={viewBox}
        className={`w-full h-full relative z-10 overflow-visible drop-shadow-[0_6px_12px_rgba(0,0,0,0.85)] ${
          !isEarned ? "opacity-45 grayscale" : ""
        }`}
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
            <stop offset="22%" stopColor={p.lathe[1]} />
            <stop offset="44%" stopColor={p.lathe[3]} />
            <stop offset="66%" stopColor={p.lathe[4]} />
            <stop offset="100%" stopColor={p.lathe[6]} />
          </linearGradient>
          <linearGradient id={`sweep-${uid}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0" />
            <stop offset="44%" stopColor="#FFFFFF" stopOpacity="0.2" />
            <stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.92" />
            <stop offset="56%" stopColor="#FFFFFF" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </linearGradient>
          <clipPath id={`coinClip-${uid}`}>
            <circle cx="80" cy="102" r="51" />
          </clipPath>
        </defs>

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
              stroke={`url(#bzl-${uid})`}
              strokeWidth="5"
            />
          </g>
        )}

        {hasWings && showRibbon && (
          <g fill={`url(#bzl-${uid})`} stroke={p.leafLight} strokeWidth="0.7">
            <path d="M32,88 C10,76 2,54 1,34 C15,44 28,58 38,70 Z" />
            <path d="M30,98 C8,90 1,72 0,54 C14,62 27,74 37,84 Z" />
            <path d="M128,88 C150,76 158,54 159,34 C145,44 132,58 122,70 Z" />
            <path d="M130,98 C152,90 159,72 160,54 C146,62 133,74 123,84 Z" />
          </g>
        )}

        {/* Coin Extrusion & Bezel */}
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
        <circle cx="80" cy="102" r="45" fill={p.deepShadow} />
        <circle
          cx="80"
          cy="102"
          r="43"
          fill={`url(#dsh-${uid})`}
          stroke={`url(#bzl-${uid})`}
          strokeWidth="2"
        />
        <circle
          cx="80"
          cy="102"
          r="40.5"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="0.9"
          opacity="0.78"
        />

        {/* Center Relief Emblem */}
        <g transform="translate(80, 103)">
          {emblem === "trophy_cup" && (
            <>
              <path
                d="M-13,-20 L13,-20 C13,-3 6.5,5 0,5 C-6.5,5 -13,-3 -13,-20 Z"
                fill={`url(#lth-${uid})`}
                stroke={p.leafDark}
                strokeWidth="0.9"
              />
              <path
                d="M-12,-17 C-20,-17 -20,-4 -11,-3 M12,-17 C20,-17 20,-4 11,-3"
                fill="none"
                stroke={`url(#lth-${uid})`}
                strokeWidth="2.8"
                strokeLinecap="round"
              />
              <path d="M-3,5 L3,5 L4.5,14 L-4.5,14 Z" fill={`url(#lth-${uid})`} />
              <rect x="-11" y="14" width="22" height="4.5" rx="1.5" fill={`url(#lth-${uid})`} />
            </>
          )}
          {emblem === "curo_crest" && (
            <>
              <polygon
                points="0,-22 5.5,-7 21,-7 8.5,3 13,18 0,9 -13,18 -8.5,3 -21,-7 -5.5,-7"
                fill={`url(#lth-${uid})`}
                stroke="#FFFFFF"
                strokeWidth="1"
              />
              <circle cx="0" cy="0" r="8" fill={`url(#dsh-${uid})`} stroke="#FFFFFF" strokeWidth="1" />
              <text x="0" y="4.2" textAnchor="middle" fill="#FFFFFF" fontSize="12" fontWeight="900">
                C
              </text>
            </>
          )}
          {emblem === "shield_check" && (
            <>
              <path
                d="M0,-20 L15,-12 L15,2 C15,12 0,19 0,19 C0,19 -15,12 -15,2 L-15,-12 Z"
                fill={`url(#lth-${uid})`}
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
                fill={`url(#lth-${uid})`}
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
          {(emblem === "pillars_11" || emblem === "open_book" || emblem === "number_10") && (
            <>
              <polygon
                points="0,-22 5,-8 19,-8 8,1 12,15 0,7 -12,15 -8,1 -19,-8 -5,-8"
                fill={`url(#lth-${uid})`}
                stroke="#FFFFFF"
                strokeWidth="1"
              />
              {number && (
                <text x="0" y="6" textAnchor="middle" fill={p.deepShadow} fontSize="14" fontWeight="900">
                  {number}
                </text>
              )}
            </>
          )}
        </g>

        {/* Live Animated Specular Sheen Sweep */}
        {isEarned && (
          <g clipPath={`url(#coinClip-${uid})`}>
            <rect
              x="-90"
              y="40"
              width="75"
              height="140"
              fill={`url(#sweep-${uid})`}
              transform="rotate(28 80 102)"
              className="celestial-medal-sheen"
            />
          </g>
        )}

        {/* Twinkling Rim Sparkle */}
        {isEarned && (
          <g transform="translate(45, 68)" fill="#FFFFFF" className="animate-pulse">
            <polygon points="0,-7 1.6,-1.6 7,0 1.6,1.6 0,7 -1.6,1.6 -7,0 -1.6,-1.6" />
          </g>
        )}
      </svg>
    </div>
  );
}

// ============================================================================
// 5. FLOATING CELESTIAL AI MODEL (USES UPLOADED DOLLAR-COIN AVATAR + CLICK-TO-SWAP)
// ============================================================================
function CelestialAiModelAvatar({ size = 86, allowUpload = false }) {
  const [src, setSrc] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_AI_MODEL);
      if (stored && !stored.includes("ai_avatar")) return stored;
    } catch {}
    return DEFAULT_AI_MODEL_SRC || curoBotAvatar || "/curo_bot.png";
  });
  const [imgError, setImgError] = useState(false);
  const fileRef = useRef(null);

  const handleUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (typeof ev.target?.result === "string") {
        setSrc(ev.target.result);
        setImgError(false);
        try {
          localStorage.setItem(STORAGE_KEY_AI_MODEL, ev.target.result);
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
          fileRef.current?.click();
        }
      }}
      title={allowUpload ? "Click to upload custom transparent AI PNG" : "Saarthi Celestial AI"}
      style={{ width: size, height: size }}
      className={`relative flex items-center justify-center shrink-0 select-none ${
        allowUpload ? "cursor-pointer" : ""
      }`}
    >
      {allowUpload && (
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          onChange={handleUpload}
          className="hidden"
        />
      )}

      {/* Soft Ambient Celestial Glow (No Rigid Spinning Circle Frame) */}
      <div className="pointer-events-none absolute -inset-2 rounded-3xl bg-gradient-to-tr from-cyan-400/25 via-indigo-500/20 to-amber-300/20 blur-xl animate-pulse" />

      {/* Live Floating PNG Model */}
      <div className="relative z-10 w-full h-full flex items-center justify-center celestial-ai-float">
        {src && !imgError ? (
          <img
            src={src}
            alt="Saarthi Celestial AI Model"
            onError={() => {
              if (src !== curoBotAvatar) {
                setSrc(curoBotAvatar);
              } else {
                setImgError(true);
              }
            }}
            className="w-full h-full object-contain drop-shadow-[0_12px_24px_rgba(56,189,248,0.55)] transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <svg viewBox="0 0 120 120" className="w-full h-full drop-shadow-[0_10px_20px_rgba(56,189,248,0.65)]">
            <defs>
              <linearGradient id="celAiBody" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#FFFFFF" />
                <stop offset="50%" stopColor="#BAE6FD" />
                <stop offset="100%" stopColor="#3B82F6" />
              </linearGradient>
              <linearGradient id="celAiGold" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#FEF08A" />
                <stop offset="100%" stopColor="#F59E0B" />
              </linearGradient>
            </defs>
            <ellipse cx="60" cy="14" rx="22" ry="5" fill="none" stroke="#38BDF8" strokeWidth="2.6" />
            <rect x="28" y="26" width="64" height="46" rx="20" fill="url(#celAiBody)" stroke="#FFFFFF" strokeWidth="1.6" />
            <rect x="36" y="36" width="48" height="24" rx="10" fill="#070B1C" stroke="#38BDF8" strokeWidth="1.6" />
            <circle cx="50" cy="48" r="5" fill="#38BDF8" />
            <circle cx="70" cy="48" r="5" fill="#38BDF8" />
            <circle cx="51.5" cy="46" r="1.8" fill="#FFFFFF" />
            <circle cx="71.5" cy="46" r="1.8" fill="#FFFFFF" />
            <path d="M40 76 L80 76 L73 102 C71 107 49 107 47 102 Z" fill="url(#celAiBody)" stroke="#FFFFFF" strokeWidth="1.4" />
            <circle cx="60" cy="90" r="7" fill="url(#celAiGold)" />
          </svg>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// 6. MODAL 1: CURO MANAGEMENT RULES & PROGRAM CONFIG EDITOR (FROM TAB 1)
// ============================================================================
function CuroRulesModal({
  isOpen,
  onClose,
  config,
  onUpdateProgram,
  onUpdateRule,
  onAddProgram,
  onResetDefaults,
}) {
  const [newProgName, setNewProgName] = useState("");
  const [newProgReward, setNewProgReward] = useState("100");

  if (!isOpen) return null;

  const handleCreateProgram = (e) => {
    e.preventDefault();
    if (!newProgName.trim()) return;
    onAddProgram({
      id: `prog_${Date.now()}`,
      name: newProgName.trim(),
      rewardAmount: Math.max(5, Number(newProgReward) || 50),
      active: true,
      description: "Custom program completion Curo allocation.",
    });
    setNewProgName("");
    setNewProgReward("100");
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/82 backdrop-blur-md p-4 overflow-y-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-3xl rounded-3xl p-6 bg-[#070B1D] border-2 border-[#FDE047] shadow-[0_0_55px_rgba(250,204,21,0.3),0_28px_70px_rgba(0,0,0,0.95)] space-y-6 my-auto relative overflow-hidden"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/15 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl celestial-btn-gold flex items-center justify-center">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-[0.24em] text-[#FDE047] block">
                TAB 1 • TREASURY ENGINE CONFIGURATION
              </span>
              <h2 className="text-xl font-black text-white">
                Curo Management &amp; Economy Rules
              </h2>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onResetDefaults}
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

        {/* Section A: Program Curo Payouts */}
        <div className="space-y-3">
          <span className="text-xs font-black uppercase tracking-wider text-cyan-300 block">
            Program Completion Curo Rates
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {config.programs.map((prog) => (
              <div
                key={prog.id}
                className="rounded-2xl p-4 bg-[#0B122B] border border-amber-400/50 space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="text-sm font-black text-white">{prog.name}</h4>
                    <p className="text-[11px] text-slate-300 mt-0.5">{prog.description}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onUpdateProgram(prog.id, { active: !prog.active })}
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-black cursor-pointer ${
                      prog.active
                        ? "bg-emerald-400 text-slate-950"
                        : "bg-slate-700 text-slate-300"
                    }`}
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
                    className="w-24 rounded-xl bg-[#050816] border border-amber-300/60 px-3 py-1.5 text-sm font-black text-amber-200 outline-none"
                  />
                  <span className="text-xs font-bold text-slate-300">Curos</span>
                  <div className="ml-auto flex gap-1">
                    {[50, 85, 120].map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => onUpdateProgram(prog.id, { rewardAmount: v })}
                        className={`px-2 py-1 rounded-lg text-[10px] font-black cursor-pointer ${
                          prog.rewardAmount === v
                            ? "bg-amber-400 text-slate-950"
                            : "bg-white/10 text-slate-200 hover:bg-white/20"
                        }`}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Add New Program Rule Inline */}
          <form
            onSubmit={handleCreateProgram}
            className="flex flex-wrap items-center gap-2.5 pt-1"
          >
            <input
              type="text"
              value={newProgName}
              onChange={(e) => setNewProgName(e.target.value)}
              placeholder="Add program track name..."
              className="flex-1 min-w-[180px] rounded-xl bg-[#050816] border border-white/20 focus:border-cyan-400 px-3.5 py-2 text-xs font-bold text-white outline-none"
            />
            <input
              type="number"
              min="5"
              value={newProgReward}
              onChange={(e) => setNewProgReward(e.target.value)}
              className="w-24 rounded-xl bg-[#050816] border border-white/20 focus:border-amber-300 px-3 py-2 text-xs font-black text-amber-200 outline-none"
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

        {/* Section B: Automated Earning Rules */}
        <div className="space-y-3 pt-2 border-t border-white/15">
          <span className="text-xs font-black uppercase tracking-wider text-purple-300 block">
            Automated Curo Earning Rules
          </span>
          <div className="space-y-2.5">
            {config.rules.map((rule) => (
              <div
                key={rule.id}
                className="rounded-2xl p-3.5 bg-[#0A1026] border border-white/15 flex flex-wrap items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <h4 className="text-sm font-black text-white">{rule.title}</h4>
                  <p className="text-[11px] text-slate-400 font-semibold">{rule.trigger}</p>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="flex items-center gap-1.5 bg-[#050816] border border-amber-300/45 rounded-xl px-2.5 py-1">
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
                      className="w-14 bg-transparent text-xs font-black text-white outline-none text-center"
                    />
                    <span className="text-[10px] font-bold text-slate-400">Curos</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onUpdateRule(rule.id, { enabled: !rule.enabled })}
                    className={`px-3 py-1.5 rounded-xl text-[11px] font-black cursor-pointer ${
                      rule.enabled
                        ? "bg-emerald-400/20 text-emerald-300 border border-emerald-400/60"
                        : "bg-slate-800 text-slate-400 border border-slate-600"
                    }`}
                  >
                    {rule.enabled ? "Enabled" : "Disabled"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 7. MODAL 2: REWARDS MANAGEMENT & 15-MEDAL RULES EDITOR (FROM TAB 2)
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

  const visibleBadges = badgeRules.filter((b) =>
    tierTab === "all" ? true : b.tier === tierTab
  );

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/82 backdrop-blur-md p-4 overflow-y-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-4xl rounded-3xl p-6 bg-[#070B1D] border-2 border-[#C084FC] shadow-[0_0_60px_rgba(192,132,252,0.35),0_28px_70px_rgba(0,0,0,0.95)] space-y-5 my-auto relative overflow-hidden"
      >
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/15 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl celestial-btn-purple flex items-center justify-center">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-[0.24em] text-purple-300 block">
                TAB 2 • 15 OFFICIAL MEDALS &amp; UNLOCK CRITERIA
              </span>
              <h2 className="text-xl font-black text-white">
                Rewards &amp; Shining Medal Rules Engine
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

        {/* Tier Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: "all", label: `All Medals (${badgeRules.length})` },
              { id: "gold", label: "Sovereign Gold (5)" },
              { id: "silver", label: "Sterling Silver (5)" },
              { id: "bronze", label: "Burnished Bronze (5)" },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTierTab(t.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-black cursor-pointer ${
                  tierTab === t.id ? "celestial-btn-gold" : "celestial-btn-slate"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <span className="text-[11px] font-bold text-cyan-300">
            Edits recalculate user medals live in the table below
          </span>
        </div>

        {/* Editable Medal Rules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 max-h-[470px] overflow-y-auto pr-1">
          {visibleBadges.map((b) => {
            const isEditing = editingId === b.id;
            return (
              <div
                key={b.id}
                className={`rounded-2xl p-4 bg-[#0B1128] border transition space-y-3 ${
                  b.enabled
                    ? b.tier === "gold"
                      ? "border-amber-400/65"
                      : b.tier === "silver"
                      ? "border-slate-300/55"
                      : "border-orange-400/55"
                    : "border-white/10 opacity-60"
                }`}
              >
                <div className="flex items-start gap-3">
                  <LiveShiningMetallicMedalSVG
                    badge={b}
                    size={58}
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
                      <span className="text-[10px] font-bold uppercase text-slate-400">
                        • {b.category}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-300 mt-1.5 leading-snug">
                      {b.ruleText}
                    </p>
                  </div>
                </div>

                {/* Inline Rule Editor Controls */}
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
                          className="w-full rounded-lg bg-[#050816] border border-cyan-400/60 px-2.5 py-1.5 text-xs font-black text-white outline-none"
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
                          className="w-full rounded-lg bg-[#050816] border border-amber-400/60 px-2.5 py-1.5 text-xs font-black text-amber-200 outline-none"
                        />
                      </div>
                      <div className="flex flex-col justify-end">
                        <button
                          type="button"
                          onClick={() =>
                            onUpdateBadge(b.id, { enabled: !b.enabled })
                          }
                          className={`w-full py-1.5 rounded-lg text-[11px] font-black cursor-pointer ${
                            b.enabled
                              ? "bg-emerald-400 text-slate-950"
                              : "bg-rose-500/25 text-rose-200 border border-rose-400/50"
                          }`}
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
// 8. MODAL 3: CELESTIAL AI ECONOMY & REWARDS CO-PILOT (FROM TAB 3)
// ============================================================================
function CelestialAiAssistantModal({ isOpen, onClose, kpis, users, badgeRules }) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    if (!isOpen) return;
    setMessages([
      {
        role: "ai",
        text: `Celestial Economy Telemetry synced. Total circulation is ${kpis.totalCuros.toLocaleString()} Curos across ${kpis.activeHolders} active holders, with ${kpis.totalMedalsUnlocked} shining medals unlocked across ${badgeRules.filter((b) => b.enabled).length} active rules.`,
      },
    ]);
  }, [isOpen, kpis, badgeRules]);

  if (!isOpen) return null;

  const quickPrompts = [
    "Who holds the most shining medals right now?",
    "Which learners are closest to unlocking Curos Bronze (100)?",
    "Suggest a Curo reward boost for zero-balance accounts.",
  ];

  const handleAsk = (customQ) => {
    const q = (customQ || input).trim();
    if (!q) return;
    setInput("");
    const lower = q.toLowerCase();
    let reply = "";

    if (lower.includes("medal") || lower.includes("most")) {
      const topByMedals = [...users]
        .sort((a, b) => b.earnedMedals.length - a.earnedMedals.length)
        .slice(0, 3)
        .map((u) => `${u.name} (${u.earnedMedals.length} medals, ${u.curos} Curos)`)
        .join(" • ");
      reply = `Top Medal Leaders: ${topByMedals}. Increasing Streak Bronze or Application Bronze targets in Tab 2 will tighten medal scarcity immediately.`;
    } else if (lower.includes("closest") || lower.includes("bronze")) {
      const nearBronze = users
        .filter((u) => u.curos > 0 && u.curos < 100)
        .map((u) => `${u.name} (${u.curos}/100 Curos)`)
        .join(", ");
      reply = nearBronze
        ? `Learners closest to Curos Bronze: ${nearBronze}. Granting a +30 Curos milestone bonus pushes them into instant Bronze medal unlocks.`
        : `Every funded learner has already crossed the 100 Curos Bronze mark! Focus on pushing active earners toward Curos Silver(500).`;
    } else {
      const zeroCount = users.filter((u) => u.curos === 0).length;
      reply = `Economy Prescription: ${zeroCount} learners currently sit at 0 Curos. Activating a +25 Curos first-module ignition grant in Tab 1 (Curo Management) will lift participation from ${kpis.participationPct}% toward 75%+ within 1 week.`;
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
        className="w-full max-w-2xl rounded-3xl p-6 bg-[#070B1D] border-2 border-[#38BDF8] shadow-[0_0_60px_rgba(56,189,248,0.35),0_28px_70px_rgba(0,0,0,0.95)] space-y-5 relative overflow-hidden"
      >
        <div className="flex items-center justify-between gap-4 border-b border-white/15 pb-4">
          <div className="flex items-center gap-4">
            <CelestialAiModelAvatar size={72} allowUpload={true} />
            <div>
              <span className="text-[10px] font-black uppercase tracking-[0.24em] text-[#38BDF8] block">
                TAB 3 • SAARTHI CELESTIAL AI CO-PILOT
              </span>
              <h2 className="text-xl font-black text-white">
                Curo &amp; Rewards Intelligence
              </h2>
              <p className="text-[11px] text-slate-300 font-semibold">
                Click the floating AI avatar to swap PNG • Ask anything about Curos &amp; Medals
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

        {/* Quick Prompts */}
        <div className="space-y-2">
          {quickPrompts.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleAsk(p)}
              className="w-full text-left px-4 py-2.5 rounded-xl bg-[#0D1633] border border-cyan-400/45 hover:border-amber-300 text-xs font-bold text-slate-100 flex items-center justify-between cursor-pointer transition"
            >
              <span>{p}</span>
              <ChevronRight className="w-4 h-4 text-amber-300 shrink-0" />
            </button>
          ))}
        </div>

        {/* Chat History */}
        <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`p-3.5 rounded-2xl text-xs leading-relaxed font-semibold ${
                m.role === "user"
                  ? "ml-10 bg-purple-600/35 border border-purple-400/60 text-white"
                  : "mr-6 bg-[#0B132B] border border-cyan-400/45 text-slate-100"
              }`}
            >
              {m.text}
            </div>
          ))}
        </div>

        {/* Input */}
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
            placeholder="Ask Celestial AI about Curos, rewards, or medal balances..."
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
// 9. USER INSPECT & CURO ADJUSTMENT MODAL (CLICK ANY USER TAB IN TABLE)
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
        className="w-full max-w-xl rounded-3xl p-6 bg-[#070B1D] border-2 border-[#FDE047] shadow-[0_0_55px_rgba(250,204,21,0.3),0_28px_70px_rgba(0,0,0,0.95)] space-y-5 my-auto"
      >
        <div className="flex items-start justify-between gap-3 border-b border-white/15 pb-4">
          <div>
            <span className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-300 block">
              INDIVIDUAL WALLET &amp; MEDAL VAULT
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

        {/* Balance + Medal Summary */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-4 rounded-2xl bg-[#0B122B] border border-amber-400/55">
            <span className="text-[10px] font-black uppercase text-amber-300 block">
              Current Curos
            </span>
            <span className="text-3xl font-black text-white mt-1 block font-mono">
              {user.curos}
            </span>
          </div>
          <div className="p-4 rounded-2xl bg-[#0B122B] border border-purple-400/55">
            <span className="text-[10px] font-black uppercase text-purple-300 block">
              Unlocked Medals
            </span>
            <span className="text-3xl font-black text-white mt-1 block font-mono">
              {user.earnedMedals?.length || 0}{" "}
              <span className="text-sm text-slate-400">/ 15</span>
            </span>
          </div>
        </div>

        {/* Shining Earned Medals Showcase */}
        <div className="space-y-2">
          <span className="text-[11px] font-black uppercase tracking-wider text-amber-200 block">
            Unlocked Shining Medals ({user.earnedMedals?.length || 0})
          </span>
          {!user.earnedMedals || user.earnedMedals.length === 0 ? (
            <div className="p-4 rounded-2xl bg-[#050816] border border-white/10 text-xs text-slate-400 font-semibold text-center">
              No medals unlocked yet — grant Curos below to trigger Curos Bronze (100).
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
                    size={54}
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

        {/* Adjust Curos Controls */}
        <div className="space-y-2.5 pt-2 border-t border-white/15">
          <span className="text-[11px] font-black uppercase tracking-wider text-cyan-300 block">
            Adjust Curos Balance
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
              className="w-20 rounded-xl bg-[#050816] border border-white/25 px-3 py-2 text-xs font-black text-white outline-none ml-auto"
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
// 10. MAIN COMPONENT: CuroManagement (DIGITAL + CELESTIAL EDITION)
// ============================================================================
export default function CuroManagement() {
  const [rawUsers, setRawUsers] = useState(INITIAL_USERS);
  const [syncing, setSyncing] = useState(false);

  // Editable Curo Config (Tab 1)
  const [curoConfig, setCuroConfig] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CURO_RULES);
      return saved ? JSON.parse(saved) : DEFAULT_CURO_CONFIG;
    } catch {
      return DEFAULT_CURO_CONFIG;
    }
  });

  // Editable 15-Medal Rules (Tab 2)
  const [badgeRules, setBadgeRules] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_BADGE_RULES);
      return saved ? JSON.parse(saved) : DEFAULT_BADGE_RULES;
    } catch {
      return DEFAULT_BADGE_RULES;
    }
  });

  // User Curo Adjustments
  const [userCuroOverrides, setUserCuroOverrides] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_USER_CUROS);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_CURO_RULES, JSON.stringify(curoConfig));
    } catch {
      // Ignore quota
    }
  }, [curoConfig]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_BADGE_RULES, JSON.stringify(badgeRules));
    } catch {
      // Ignore quota
    }
  }, [badgeRules]);

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY_USER_CUROS,
        JSON.stringify(userCuroOverrides)
      );
    } catch {
      // Ignore quota
    }
  }, [userCuroOverrides]);

  // Modals & Table Filter State
  const [curoModalOpen, setCuroModalOpen] = useState(false);
  const [rewardsModalOpen, setRewardsModalOpen] = useState(false);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);

  // Outside-table Primary Filter: 'curos' | 'medals'
  const [tableViewMode, setTableViewMode] = useState("curos");
  const [searchQuery, setSearchQuery] = useState("");
  const [toast, setToast] = useState(null);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3200);
  };

  // Sync live backend telemetry if available
  const fetchLiveEconomy = useCallback(async (isRefresh = false) => {
    if (isRefresh) setSyncing(true);
    const endpoints = [
      `${API_BASE_URL}/curo/programs`,
      `${API_BASE_URL}/analytics/leaderboards`,
      `${API_BASE_URL}/admin/curo-management`,
    ];

    try {
      // Also fetch live badges if available
      const badgesRes = await axios.get(`${API_BASE_URL}/badges/all`, { params: { _t: Date.now() } });
      if (Array.isArray(badgesRes.data) && badgesRes.data.length > 0) {
        setBadgeRules((prev) =>
          prev.map((r) => {
            const dbMatch = badgesRes.data.find((b) => b.badge_id === r.badge_id || b.name === r.name);
            if (dbMatch) {
              return {
                ...r,
                target: dbMatch.requirement_value ?? r.target,
                curos: dbMatch.curos_reward ?? r.curos,
                ruleText: dbMatch.description ?? r.ruleText,
                enabled: dbMatch.is_active ?? r.enabled,
              };
            }
            return r;
          })
        );
      }
    } catch {
      // Ignore optional badge sync
    }

    try {
      // Fetch live programs if available
      const progRes = await axios.get(`${API_BASE_URL}/curo/programs`, { params: { _t: Date.now() } });
      if (Array.isArray(progRes.data) && progRes.data.length > 0) {
        setCuroConfig((prev) => ({
          ...prev,
          programs: progRes.data.map((p) => ({
            id: p.id || `prog_${p.program_id}`,
            name: p.name || p.program_name || "Program",
            rewardAmount: p.reward_amount || p.curos || 85,
            active: p.status === "Active" || p.active !== false,
            description: p.description || "Active curriculum module completion grant.",
          })),
        }));
      }
    } catch {
      // Fall back to default config
    }

    const rosterEndpoints = [
      `${API_BASE_URL}/analytics/leaderboards`,
      `${API_BASE_URL}/admin/curo-management`,
    ];

    for (const url of rosterEndpoints) {
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
        // Continue to next endpoint
      }
    }
    setSyncing(false);
  }, []);

  useEffect(() => {
    fetchLiveEconomy(false);
  }, [fetchLiveEconomy]);

  // Dynamically Compute Every User's Earned Shining Medals from Active Badge Rules
  const enrichedUsers = useMemo(() => {
    const activeRules = badgeRules.filter((b) => b.enabled);
    return rawUsers.map((u) => {
      const liveCuros =
        userCuroOverrides[u.id] !== undefined ? userCuroOverrides[u.id] : u.curos;
      const metrics = {
        curos: liveCuros,
        completion: Number(u.completion || 0),
        application: Number(u.application || 0),
        retention: Number(u.retention || 0),
        streak: Number(u.streak || 0),
      };

      const earnedMedals = activeRules
        .filter((rule) => Number(metrics[rule.metricKey] || 0) >= rule.target)
        .sort((a, b) => {
          const rankOrder = { gold: 3, silver: 2, bronze: 1 };
          return (rankOrder[b.tier] || 0) - (rankOrder[a.tier] || 0);
        });

      const goldCount = earnedMedals.filter((m) => m.tier === "gold").length;
      const silverCount = earnedMedals.filter((m) => m.tier === "silver").length;
      const bronzeCount = earnedMedals.filter((m) => m.tier === "bronze").length;

      return {
        ...u,
        curos: liveCuros,
        earnedMedals,
        goldCount,
        silverCount,
        bronzeCount,
      };
    });
  }, [rawUsers, userCuroOverrides, badgeRules]);

  // Sorted & Filtered Roster Based on Outside 'Curos' vs 'Medals' Toggle
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
      if (tableViewMode === "medals") {
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
  }, [enrichedUsers, searchQuery, tableViewMode]);

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

    return {
      totalCuros,
      activeHolders,
      totalMedalsUnlocked,
      avgCuros,
      totalUsers: enrichedUsers.length,
      participationPct,
    };
  }, [enrichedUsers]);

  const activeSelectedUser = useMemo(
    () => enrichedUsers.find((u) => u.id === selectedUserId) || null,
    [enrichedUsers, selectedUserId]
  );

  // Handlers for Tab 1 (Curo Config)
  const handleUpdateProgram = async (id, patch) => {
    setCuroConfig((prev) => ({
      ...prev,
      programs: prev.programs.map((p) => (p.id === id ? { ...p, ...patch } : p)),
    }));
    try {
      const numId = typeof id === "number" ? id : parseInt(String(id).replace("prog_", ""), 10);
      if (numId && !isNaN(numId)) {
        await api.put(`/curo/programs/${numId}`, patch);
      }
    } catch {
      // Saved in state
    }
    showToast("Updated Curo program allocation");
  };

  const handleAddProgram = async (prog) => {
    setCuroConfig((prev) => ({
      ...prev,
      programs: [...prev.programs, prog],
    }));
    try {
      await api.post("/curo/programs", {
        name: prog.name,
        reward_amount: prog.rewardAmount,
        status: prog.active ? "Active" : "Paused",
        description: prog.description,
      });
    } catch {
      // Saved in state
    }
    showToast(`Added "${prog.name}" (${prog.rewardAmount} Curos)`);
  };

  const handleUpdateRule = (id, patch) => {
    setCuroConfig((prev) => ({
      ...prev,
      rules: prev.rules.map((r) => (r.id === id ? { ...r, ...patch } : r)),
    }));
    showToast("Updated Curo earning rule");
  };

  // Handler for Tab 2 (15-Medal Rules)
  const handleUpdateBadgeRule = async (id, patch) => {
    setBadgeRules((prev) =>
      prev.map((b) => (b.id === id ? { ...b, ...patch } : b))
    );
    const targetBadge = badgeRules.find((b) => b.id === id);
    if (targetBadge?.badge_id) {
      try {
        await api.put(`/badges/${targetBadge.badge_id}`, {
          requirement_value: patch.target,
          curos_reward: patch.curos,
          description: patch.ruleText,
          is_active: patch.enabled,
        });
      } catch {
        // Saved in state
      }
    }
    showToast("Updated medal unlock rule");
  };

  // Handler for Individual User Curo Adjustment
  const handleAdjustUserCuros = async (user, delta) => {
    const nextVal = Math.max(0, user.curos + delta);
    setUserCuroOverrides((prev) => ({ ...prev, [user.id]: nextVal }));
    try {
      await api.post("/curo/adjust", {
        user_id: user.id,
        delta: delta,
      });
    } catch {
      // Saved in state
    }
    showToast(
      delta > 0
        ? `Granted +${delta} Curos to ${user.name} (New Total: ${nextVal})`
        : `Deducted ${Math.abs(delta)} Curos from ${user.name} (New Total: ${nextVal})`
    );
  };

  // Sample 3 Shining Mini Medals displayed directly on Tab 2
  const sampleGold = badgeRules.find((b) => b.tier === "gold") || badgeRules[10];
  const sampleSilver = badgeRules.find((b) => b.tier === "silver") || badgeRules[5];
  const sampleBronze = badgeRules.find((b) => b.tier === "bronze") || badgeRules[0];

  return (
    <MainLayout>
      <div className="-m-4 sm:-m-6 p-5 sm:p-7 min-h-screen celestial-digital-stage text-slate-100 font-sans space-y-6 overflow-x-hidden relative selection:bg-cyan-400 selection:text-slate-950">
        {/* ===================================================================
        DIGITAL + CELESTIAL CSS SYSTEM
        - Deep Starlight Cosmos + Subtle Digital Coordinate Grid
        - 4 Streak-Style Digital Live-Glow KPI Cards
        - 3 Celestial Interactive Command Tabs (Curos / Rewards / AI Model)
        - Premium Bordered Table Vault with Separate Opaque User Tabs &
          Live-Shining 3D Mini Medals
        =================================================================== */}
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800;900&display=swap');

          .font-curo-serif {
            font-family: 'Playfair Display', Georgia, Cambria, serif;
          }

          @property --cmrx1 { syntax: "<percentage>"; inherits: false; initial-value: 6%; }
          @property --cmry1 { syntax: "<percentage>"; inherits: false; initial-value: 8%; }
          @property --cmrx2 { syntax: "<percentage>"; inherits: false; initial-value: 46%; }
          @property --cmry2 { syntax: "<percentage>"; inherits: false; initial-value: 92%; }

          @keyframes cmTitleLiquidGold {
            0%   { background-position: 0% 50%; }
            50%  { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
          @keyframes cmWarmAmbientDrift {
            0%, 100% { transform: translate3d(-6%, -4%, 0) scale(1); opacity: 0.72; }
            50%      { transform: translate3d(10%, 6%, 0) scale(1.12); opacity: 1; }
          }
          @keyframes cmGoldPathA {
            0%   { --cmrx1: 5%;  --cmry1: 6%;  }
            28%  { --cmrx1: 50%; --cmry1: 10%; }
            55%  { --cmrx1: 40%; --cmry1: 94%; }
            80%  { --cmrx1: 4%;  --cmry1: 72%; }
            100% { --cmrx1: 5%;  --cmry1: 6%;  }
          }
          @keyframes cmGoldPathB {
            0%   { --cmrx2: 46%; --cmry2: 92%; }
            34%  { --cmrx2: 8%;  --cmry2: 44%; }
            68%  { --cmrx2: 36%; --cmry2: 4%;  }
            100% { --cmrx2: 46%; --cmry2: 92%; }
          }

          /* 1. DIGITAL + CELESTIAL STARFIELD BACKDROP */
          .celestial-digital-stage {
            background-color: #030614;
            background-image:
              radial-gradient(1.5px 1.5px at 14% 18%, rgba(255, 255, 255, 0.55) 50%, transparent 100%),
              radial-gradient(1px 1px at 42% 9%, rgba(186, 230, 253, 0.5) 50%, transparent 100%),
              radial-gradient(1.5px 1.5px at 76% 24%, rgba(254, 240, 138, 0.6) 50%, transparent 100%),
              radial-gradient(1px 1px at 88% 62%, rgba(216, 180, 254, 0.55) 50%, transparent 100%),
              radial-gradient(1.2px 1.2px at 26% 74%, rgba(255, 255, 255, 0.45) 50%, transparent 100%),
              radial-gradient(ellipse 52% 38% at 84% 8%, rgba(56, 189, 248, 0.16) 0%, transparent 68%),
              radial-gradient(ellipse 48% 36% at 14% 22%, rgba(139, 92, 246, 0.18) 0%, transparent 68%),
              linear-gradient(rgba(56, 189, 248, 0.03) 1px, transparent 1px),
              linear-gradient(90deg, rgba(168, 85, 247, 0.03) 1px, transparent 1px);
            background-size:
              100% 100%, 100% 100%, 100% 100%, 100% 100%, 100% 100%,
              100% 100%, 100% 100%, 52px 52px, 52px 52px;
          }

          /* Live Medal Specular Sweep */
          @keyframes celestialMedalSweep {
            0% { transform: translateX(-140px) rotate(25deg); opacity: 0; }
            22% { opacity: 0.92; }
            48% { transform: translateX(260px) rotate(25deg); opacity: 0; }
            100% { transform: translateX(260px) rotate(25deg); opacity: 0; }
          }
          .celestial-medal-sheen {
            animation: celestialMedalSweep 4.2s cubic-bezier(0.4, 0, 0.2, 1) infinite;
          }

          /* Floating Celestial AI Model */
          @keyframes celestialAiFloat {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            50% { transform: translateY(-7px) rotate(1.5deg); }
          }
          .celestial-ai-float {
            animation: celestialAiFloat 3.4s ease-in-out infinite;
          }

          /* 2. WARM SUNLIT WALNUT + LIQUID-GOLD CURO HERO BANNER */
          .cm-hero-shell {
            position: relative;
            overflow: hidden;
            border-radius: 1.5rem;
            background:
              /* Dark espresso vignette on left so Playfair title & balance pod pop crisply */
              linear-gradient(
                90deg,
                rgba(22, 11, 5, 0.96) 0%,
                rgba(34, 18, 9, 0.88) 44%,
                rgba(52, 28, 14, 0.44) 66%,
                transparent 84%
              ),
              /* Warm morning-lit wall & varnished walnut desk matching Golden Curo Coins photo */
              linear-gradient(
                180deg,
                #6C5242 0%,
                #64483C 34%,
                #9A6038 48%,
                #8C4E27 72%,
                #6B381B 100%
              );
            box-shadow:
              0 18px 46px rgba(0, 0, 0, 0.85),
              0 0 34px -10px rgba(245, 196, 81, 0.34),
              inset 0 1px 1px rgba(254, 240, 138, 0.25);
          }

          .cm-hero-studio-glow {
            position: absolute;
            top: -28%;
            left: 6%;
            width: 48%;
            height: 155%;
            border-radius: 9999px;
            pointer-events: none;
            z-index: 1;
            background: radial-gradient(
              ellipse at center,
              rgba(251, 191, 36, 0.24) 0%,
              rgba(194, 108, 42, 0.16) 45%,
              transparent 74%
            );
            filter: blur(48px);
            animation: cmWarmAmbientDrift 11s ease-in-out infinite;
          }

          .cm-hero-border-mask {
            position: absolute;
            inset: 0;
            border-radius: inherit;
            pointer-events: none;
            z-index: 25;
            -webkit-mask-image: linear-gradient(
              90deg,
              #000 0%,
              #000 54%,
              rgba(0, 0, 0, 0.25) 64%,
              transparent 72%
            );
            mask-image: linear-gradient(
              90deg,
              #000 0%,
              #000 54%,
              rgba(0, 0, 0, 0.25) 64%,
              transparent 72%
            );
          }

          .cm-hero-live-gold-rim {
            position: absolute;
            inset: 0;
            border-radius: inherit;
            padding: 2.8px;
            background:
              radial-gradient(ellipse 36% 58% at var(--cmrx1) var(--cmry1), #FFFFFF 0%, #FEF08A 24%, transparent 66%),
              radial-gradient(ellipse 42% 60% at var(--cmrx2) var(--cmry2), #FDE047 0%, #D97706 34%, transparent 68%),
              linear-gradient(135deg, #F5CE67 0%, #8A5A14 45%, #FEF08A 80%, #B46914 100%);
            -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
            -webkit-mask-composite: xor;
            mask-composite: exclude;
            animation:
              cmGoldPathA 10.4s ease-in-out infinite,
              cmGoldPathB 15.2s ease-in-out infinite;
          }

          .cm-hero-photo-blend {
            -webkit-mask-image: linear-gradient(
              90deg,
              transparent 0%,
              rgba(0, 0, 0, 0.45) 16%,
              #000 36%,
              #000 100%
            );
            mask-image: linear-gradient(
              90deg,
              transparent 0%,
              rgba(0, 0, 0, 0.45) 16%,
              #000 36%,
              #000 100%
            );
          }

          .cm-hero-live-title {
            background-image: linear-gradient(
              105deg,
              #FFFBEB 0%,
              #FDE047 16%,
              #EA9A1C 32%,
              #FFFFFF 48%,
              #F59E0B 64%,
              #FDBA74 80%,
              #FFFBEB 100%
            );
            background-size: 280% 100%;
            -webkit-background-clip: text;
            background-clip: text;
            color: transparent;
            animation: cmTitleLiquidGold 6.2s ease-in-out infinite;
            filter:
              drop-shadow(0 3px 10px rgba(18, 8, 2, 0.85))
              drop-shadow(0 0 18px rgba(250, 204, 21, 0.34));
          }

          /* 3. DIGITAL LIVE-GLOW KPI CARDS (STREAK-MANAGEMENT STYLE + CELESTIAL PALETTE) */
          @keyframes digiBaseShift {
            0% { background-position: 0% 50%, 0% 0%; }
            50% { background-position: 100% 50%, 100% 100%; }
            100% { background-position: 0% 50%, 0% 0%; }
          }
          @keyframes digiPulseGold {
            0%, 100% { box-shadow: 0 0 14px rgba(250, 204, 21, 0.45), inset 0 0 20px rgba(250, 204, 21, 0.18); }
            50% { box-shadow: 0 0 26px rgba(253, 224, 71, 0.78), inset 0 0 28px rgba(250, 204, 21, 0.3); }
          }
          @keyframes digiPulseCyan {
            0%, 100% { box-shadow: 0 0 14px rgba(0, 240, 255, 0.48), inset 0 0 20px rgba(0, 240, 255, 0.18); }
            50% { box-shadow: 0 0 26px rgba(56, 189, 248, 0.82), inset 0 0 28px rgba(0, 240, 255, 0.3); }
          }
          @keyframes digiPulseViolet {
            0%, 100% { box-shadow: 0 0 14px rgba(176, 38, 255, 0.48), inset 0 0 20px rgba(176, 38, 255, 0.2); }
            50% { box-shadow: 0 0 26px rgba(192, 132, 252, 0.84), inset 0 0 28px rgba(176, 38, 255, 0.32); }
          }
          @keyframes digiPulseEmerald {
            0%, 100% { box-shadow: 0 0 14px rgba(16, 245, 160, 0.45), inset 0 0 20px rgba(16, 245, 160, 0.18); }
            50% { box-shadow: 0 0 26px rgba(52, 211, 153, 0.8), inset 0 0 28px rgba(16, 245, 160, 0.28); }
          }

          .digi-kpi-card {
            position: relative;
            isolation: isolate;
            overflow: hidden;
            background-size: 260% 260%, 200% 200% !important;
            transition: transform 0.24s cubic-bezier(0.22, 1, 0.36, 1);
          }
          .digi-kpi-card:hover {
            transform: translateY(-4px) scale(1.012);
          }
          .digi-kpi-gold {
            background-image:
              radial-gradient(circle at 22% 20%, rgba(253, 224, 71, 0.42) 0%, rgba(217, 119, 6, 0.2) 46%, transparent 72%),
              linear-gradient(135deg, #171003 0%, #3A2606 40%, #0A0703 74%, #312006 100%) !important;
            border: 2px solid #FDE047 !important;
            animation: digiBaseShift 6s ease-in-out infinite, digiPulseGold 3.8s ease-in-out infinite !important;
          }
          .digi-kpi-cyan {
            background-image:
              radial-gradient(circle at 80% 22%, rgba(0, 240, 255, 0.42) 0%, rgba(2, 132, 199, 0.22) 46%, transparent 72%),
              linear-gradient(135deg, #031224 0%, #072E4E 40%, #020914 74%, #082947 100%) !important;
            border: 2px solid #38BDF8 !important;
            animation: digiBaseShift 6s ease-in-out infinite, digiPulseCyan 3.8s ease-in-out infinite !important;
          }
          .digi-kpi-violet {
            background-image:
              radial-gradient(circle at 20% 78%, rgba(192, 132, 252, 0.44) 0%, rgba(124, 58, 237, 0.22) 46%, transparent 72%),
              linear-gradient(135deg, #0D0520 0%, #240D4F 40%, #060312 74%, #2B105C 100%) !important;
            border: 2px solid #C084FC !important;
            animation: digiBaseShift 6s ease-in-out infinite, digiPulseViolet 3.8s ease-in-out infinite !important;
          }
          .digi-kpi-emerald {
            background-image:
              radial-gradient(circle at 80% 78%, rgba(16, 245, 160, 0.4) 0%, rgba(5, 150, 105, 0.2) 46%, transparent 72%),
              linear-gradient(135deg, #031814 0%, #07382E 40%, #020C0A 74%, #063128 100%) !important;
            border: 2px solid #34D399 !important;
            animation: digiBaseShift 6s ease-in-out infinite, digiPulseEmerald 3.8s ease-in-out infinite !important;
          }

          /* 4. 3 INTERACTIVE COMMAND HUB TABS (SKETCH BOXES 1, 2, 3) */
          .celestial-hub-card {
            position: relative;
            overflow: hidden;
            background: linear-gradient(155deg, #0C132E 0%, #070B1C 58%, #050814 100%);
            transition: transform 0.24s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.24s ease, border-color 0.24s ease;
          }
          .celestial-hub-card:hover {
            transform: translateY(-4px);
          }
          .hub-curo {
            border: 2px solid rgba(250, 204, 21, 0.78);
            box-shadow: 0 16px 38px rgba(0, 0, 0, 0.8), 0 0 24px -6px rgba(250, 204, 21, 0.35);
          }
          .hub-curo:hover {
            border-color: #FEF08A;
            box-shadow: 0 20px 44px rgba(0, 0, 0, 0.88), 0 0 34px -4px rgba(250, 204, 21, 0.52);
          }
          .hub-rewards {
            border: 2px solid rgba(192, 132, 252, 0.8);
            box-shadow: 0 16px 38px rgba(0, 0, 0, 0.8), 0 0 24px -6px rgba(192, 132, 252, 0.38);
          }
          .hub-rewards:hover {
            border-color: #E9D5FF;
            box-shadow: 0 20px 44px rgba(0, 0, 0, 0.88), 0 0 34px -4px rgba(192, 132, 252, 0.56);
          }
          .hub-ai {
            border: 2px solid rgba(56, 189, 248, 0.82);
            box-shadow: 0 16px 38px rgba(0, 0, 0, 0.8), 0 0 24px -6px rgba(56, 189, 248, 0.4);
          }
          .hub-ai:hover {
            border-color: #BAE6FD;
            box-shadow: 0 20px 44px rgba(0, 0, 0, 0.88), 0 0 34px -4px rgba(56, 189, 248, 0.58);
          }

          /* 5. PREMIUM CELESTIAL TABLE VAULT + SEPARATE OPAQUE USER TABS */
          @keyframes celestialNebulaDrift {
            0%, 100% { transform: translate3d(-12%, -10%, 0) scale(0.96); opacity: 0.42; }
            50% { transform: translate3d(38%, 26%, 0) scale(1.12); opacity: 0.68; }
          }
          .celestial-table-vault {
            position: relative;
            isolation: isolate;
            overflow: hidden;
            border: 2px solid transparent;
            background-clip: padding-box, border-box;
            background-origin: padding-box, border-box;
            background-image:
              linear-gradient(160deg, #090F24 0%, #050816 55%, #070A1A 100%),
              linear-gradient(135deg, #FEF08A 0%, #38BDF8 34%, #C084FC 68%, #FDE047 100%);
            box-shadow:
              0 24px 56px rgba(0, 0, 0, 0.9),
              0 0 36px -10px rgba(56, 189, 248, 0.32),
              0 0 30px -10px rgba(250, 204, 21, 0.28);
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
            background: radial-gradient(circle, rgba(56, 189, 248, 0.28) 0%, transparent 70%);
            filter: blur(58px);
            animation: celestialNebulaDrift 16s ease-in-out infinite;
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
            background: radial-gradient(circle, rgba(250, 204, 21, 0.22) 0%, rgba(168, 85, 247, 0.16) 45%, transparent 72%);
            filter: blur(60px);
            animation: celestialNebulaDrift 21s ease-in-out infinite reverse;
          }

          /* Separate Opaque User Tabs Inside the Celestial Table */
          .celestial-user-tab {
            position: relative;
            z-index: 10;
            background: #070B1A !important;
            transition: transform 0.2s cubic-bezier(0.22, 1, 0.36, 1), border-color 0.2s ease, box-shadow 0.2s ease;
          }
          .celestial-user-tab:hover {
            transform: translateY(-2px);
          }
          .utab-gold { border: 2px solid #FACC15 !important; box-shadow: 0 8px 22px rgba(0, 0, 0, 0.8), 0 0 14px -4px rgba(250, 204, 21, 0.42); }
          .utab-cyan { border: 2px solid #38BDF8 !important; box-shadow: 0 8px 22px rgba(0, 0, 0, 0.8), 0 0 14px -4px rgba(56, 189, 248, 0.42); }
          .utab-purple { border: 2px solid #C084FC !important; box-shadow: 0 8px 22px rgba(0, 0, 0, 0.8), 0 0 14px -4px rgba(192, 132, 252, 0.42); }
          .utab-emerald { border: 2px solid #34D399 !important; box-shadow: 0 8px 22px rgba(0, 0, 0, 0.8), 0 0 14px -4px rgba(52, 211, 153, 0.42); }
          .utab-rose { border: 2px solid #FB7185 !important; box-shadow: 0 8px 22px rgba(0, 0, 0, 0.8), 0 0 14px -4px rgba(251, 113, 133, 0.42); }

          /* 6. CRISP CELESTIAL BUTTONS */
          .celestial-btn-gold {
            background: linear-gradient(180deg, #FDE047 0%, #EAB308 100%);
            border: 1.5px solid #FEF9C3;
            color: #090704;
            box-shadow: 0 4px 14px rgba(234, 179, 8, 0.35);
            transition: transform 0.16s ease, filter 0.16s ease;
          }
          .celestial-btn-gold:hover { filter: brightness(1.06); transform: translateY(-1px); }
          .celestial-btn-cyan {
            background: linear-gradient(180deg, #38BDF8 0%, #0284C7 100%);
            border: 1.5px solid #BAE6FD;
            color: #04101D;
            box-shadow: 0 4px 14px rgba(56, 189, 248, 0.35);
            transition: transform 0.16s ease, filter 0.16s ease;
          }
          .celestial-btn-cyan:hover { filter: brightness(1.08); transform: translateY(-1px); }
          .celestial-btn-purple {
            background: linear-gradient(180deg, #8B5CF6 0%, #5B21B6 100%);
            border: 1.5px solid #DDD6FE;
            color: #FFFFFF;
            box-shadow: 0 4px 14px rgba(139, 92, 246, 0.38);
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
          <div className="fixed bottom-6 right-6 z-50 px-5 py-3.5 rounded-2xl bg-[#070C1F] border-2 border-[#38BDF8] shadow-[0_0_26px_rgba(56,189,248,0.45)] text-white flex items-center gap-3 text-xs font-extrabold animate-bounce">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span>{toast}</span>
          </div>
        )}

        {/* ===================================================================
        ROW 1 (SKETCH TOP): WARM SUNLIT WALNUT + LIQUID-GOLD HERO BANNER
        =================================================================== */}
        <header className="cm-hero-shell grid grid-cols-1 lg:grid-cols-12 items-stretch min-h-[164px] lg:h-[178px]">
          <div className="cm-hero-studio-glow" aria-hidden="true" />

          <div className="cm-hero-border-mask" aria-hidden="true">
            <div className="cm-hero-live-gold-rim" />
          </div>

          {/* LEFT 7 COLS: EDITORIAL LIQUID-GOLD TITLE + LIVE ECONOMY POD + SYNC CTA */}
          <div className="lg:col-span-7 px-5 py-3.5 sm:px-6 sm:py-4 flex flex-col justify-between space-y-2.5 relative z-20">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[9.5px] font-black uppercase tracking-[0.22em] bg-[#6B1222]/85 text-[#FEF08A] border border-amber-300/55 shadow-[0_4px_14px_rgba(0,0,0,0.45)]">
                  CELESTIAL ECONOMY &amp; REWARDS COMMAND
                </span>
                <span className="px-2 py-0.5 rounded-full text-[9.5px] font-extrabold bg-[#1E1109]/80 text-amber-100 border border-amber-300/35 inline-flex items-center gap-1.5 backdrop-blur-md">
                  <span
                    className={`w-1.5 h-1.5 rounded-full bg-emerald-400 ${
                      syncing ? "animate-ping" : ""
                    }`}
                  />
                  <span>Digital Rule Engine Live</span>
                </span>
              </div>

              <h1 className="font-curo-serif text-white text-2xl sm:text-3xl lg:text-[36px] font-black tracking-tight leading-[1.08] drop-shadow-[0_2px_10px_rgba(0,0,0,0.85)]">
                Curo Management
              </h1>

              <p className="text-[11.5px] sm:text-xs text-[#F7ECE0] font-medium max-w-md leading-snug drop-shadow-[0_1px_4px_rgba(0,0,0,0.75)]">
                Configure Curo treasury rules, manage 15 shining medal criteria, and monitor learner standings.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <div className="bg-[#1A0E07]/75 backdrop-blur-xl border border-amber-300/45 rounded-xl px-3.5 py-1.5 flex items-center gap-3.5 shadow-[0_8px_20px_rgba(0,0,0,0.5)]">
                <div>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-amber-200/80 block">
                    In Circulation
                  </span>
                  <span className="text-sm font-black font-mono text-[#FEF08A]">
                    {(kpis.totalCuros || 0).toLocaleString()} Curos
                  </span>
                </div>
                <div className="h-5 w-px bg-amber-300/25" />
                <div>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-amber-200/80 block">
                    Active Holders
                  </span>
                  <span className="text-sm font-black font-mono text-white">
                    {kpis.activeHolders} / {kpis.totalUsers}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  fetchLiveEconomy(true);
                  showToast("Synced live celestial Curo & medal telemetry");
                }}
                className="celestial-btn-gold px-3.5 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider inline-flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${syncing ? "animate-spin" : ""}`} />
                <span>{syncing ? "Syncing..." : "Sync Telemetry"}</span>
              </button>
            </div>
          </div>

          {/* RIGHT 5 COLS: FULL UNCROPPED GOLDEN CURO COINS STUDIO SCENE */}
          <div className="lg:col-span-5 relative z-10 flex items-center justify-end overflow-hidden h-[168px] lg:h-full">
            <img
              src={curoHeroCoinsImg}
              alt="Golden Curo Coins Collection"
              onError={(e) => {
                if (!e.currentTarget.dataset.fb) {
                  e.currentTarget.dataset.fb = "1";
                  e.currentTarget.src = "/Golden Curo Coins Collection.png";
                }
              }}
              className="cm-hero-photo-blend h-full w-auto max-w-full object-contain object-right ml-auto block select-none brightness-105 contrast-105"
            />
          </div>
        </header>

        {/* ===================================================================
        ROW 2 (SKETCH 4 BOXES): 4 MACHINED ANODIZED METALLIC KPI CARDS
        (FROM CANDIDATE ATTRITION & USER MGMT — PROPORTIONAL "NORMAL NOT TOO BIG")
        =================================================================== */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              title: "CUROS IN CIRCULATION",
              value: (kpis.totalCuros || 0).toLocaleString(),
              sub: `${kpis.participationPct}% Wallet Activity`,
              metal: "bronze",
              percent: Math.min(100, Math.max(10, kpis.participationPct || 70)),
              action: "Treasury",
              icon: (
                /* 3D Sculpted Gold Trophy / Coins Emblem */
                <svg viewBox="0 0 36 36" fill="none">
                  <defs>
                    <linearGradient id="curoKpi_goldCup" x1="10" y1="6" x2="26" y2="28" gradientUnits="userSpaceOnUse">
                      <stop offset="0%" stopColor="#fef9c3" />
                      <stop offset="38%" stopColor="#facc15" />
                      <stop offset="80%" stopColor="#ca8a04" />
                      <stop offset="100%" stopColor="#854d0e" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M11 9.5H7.8c-.7 0-1.3.6-1.3 1.3 0 4.2 2.4 7.2 5.7 7.8M25 9.5h3.2c.7 0 1.3.6 1.3 1.3 0 4.2-2.4 7.2-5.7 7.8"
                    stroke="url(#curoKpi_goldCup)"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                  />
                  <path d="M11 7.5h14v7.8c0 4.2-3.1 7.5-7 7.5s-7-3.3-7-7.5V7.5z" fill="url(#curoKpi_goldCup)" />
                  <rect x="16.3" y="22.2" width="3.4" height="4.8" rx="1" fill="url(#curoKpi_goldCup)" />
                  <rect x="12" y="26.8" width="12" height="3" rx="1.5" fill="url(#curoKpi_goldCup)" />
                </svg>
              ),
              onClick: () => setTableViewMode("curos"),
            },
            {
              title: "ACTIVE CURO HOLDERS",
              value: kpis.activeHolders,
              sub: `of ${kpis.totalUsers} Enrolled Users`,
              metal: "cyan",
              percent: Math.round((kpis.activeHolders / Math.max(kpis.totalUsers, 1)) * 100) || 60,
              action: "Holders",
              icon: (
                /* 3D Glowing Cryo-Crystal / Star Shield */
                <svg viewBox="0 0 36 36" fill="none">
                  <defs>
                    <linearGradient id="curoKpi_iceCrystal" x1="8" y1="6" x2="28" y2="30" gradientUnits="userSpaceOnUse">
                      <stop offset="0%" stopColor="#ffffff" />
                      <stop offset="45%" stopColor="#67e8f9" />
                      <stop offset="100%" stopColor="#0284c7" />
                    </linearGradient>
                  </defs>
                  <g stroke="url(#curoKpi_iceCrystal)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="5.5" x2="18" y2="30.5" />
                    <line x1="7.2" y1="11.8" x2="28.8" y2="24.2" />
                    <line x1="28.8" y1="11.8" x2="7.2" y2="24.2" />
                    <path d="M15 8.5L18 11l3-2.5M15 27.5L18 25l3 2.5" />
                    <path d="M8.8 15.8l3.8-.6-1.3-3.6M27.2 20.2l-3.8.6 1.3 3.6" />
                    <path d="M24.7 11.6l-1.3 3.6 3.8.6M11.3 24.4l1.3-3.6-3.8-.6" />
                  </g>
                </svg>
              ),
              onClick: () => setTableViewMode("curos"),
            },
            {
              title: "SHINING MEDALS UNLOCKED",
              value: kpis.totalMedalsUnlocked,
              sub: `${badgeRules.filter((b) => b.enabled).length} Active Medal Rules`,
              metal: "violet",
              percent: Math.min(100, Math.max(15, Math.round((kpis.totalMedalsUnlocked / 25) * 100))),
              action: "Medals",
              icon: (
                /* 3D Lavender/Violet Medal & Users Cluster */
                <svg viewBox="0 0 36 36" fill="none">
                  <defs>
                    <linearGradient id="curoKpi_uBack" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#e9d5ff" />
                      <stop offset="100%" stopColor="#9333ea" />
                    </linearGradient>
                    <linearGradient id="curoKpi_uFront" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#ffffff" />
                      <stop offset="55%" stopColor="#d8b4fe" />
                      <stop offset="100%" stopColor="#7e22ce" />
                    </linearGradient>
                  </defs>
                  <circle cx="10.5" cy="14.5" r="3.6" fill="url(#curoKpi_uBack)" />
                  <path d="M4.5 25.5c0-3.1 2.7-5.5 6-5.5s6 2.4 6 5.5v1H4.5v-1z" fill="url(#curoKpi_uBack)" opacity="0.9" />
                  <circle cx="25.5" cy="14.5" r="3.6" fill="url(#curoKpi_uBack)" />
                  <path d="M19.5 25.5c0-3.1 2.7-5.5 6-5.5s6 2.4 6 5.5v1h-12v-1z" fill="url(#curoKpi_uBack)" opacity="0.9" />
                  <circle cx="18" cy="12.5" r="4.6" fill="url(#curoKpi_uFront)" />
                  <path d="M10 27c0-4.1 3.6-7.2 8-7.2s8 3.1 8 7.2v1.2H10V27z" fill="url(#curoKpi_uFront)" />
                </svg>
              ),
              onClick: () => setTableViewMode("medals"),
            },
            {
              title: "AVG CUROS / HOLDER",
              value: kpis.avgCuros,
              sub: "Mean Active Treasury",
              metal: "crimson",
              percent: 75,
              action: "Rules",
              icon: (
                /* 3D Multi-Layered Crimson Flame / Spark */
                <svg viewBox="0 0 36 36" fill="none">
                  <defs>
                    <linearGradient id="curoKpi_fireOuter" x1="18" y1="4" x2="18" y2="32" gradientUnits="userSpaceOnUse">
                      <stop offset="0%" stopColor="#fb923c" />
                      <stop offset="55%" stopColor="#ef4444" />
                      <stop offset="100%" stopColor="#991b1b" />
                    </linearGradient>
                    <linearGradient id="curoKpi_fireInner" x1="18" y1="12" x2="18" y2="31" gradientUnits="userSpaceOnUse">
                      <stop offset="0%" stopColor="#fef08a" />
                      <stop offset="65%" stopColor="#facc15" />
                      <stop offset="100%" stopColor="#ea580c" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M18.8 4.5c.4 4.3-2.6 6.9-4.1 9.8-1.6 3.1-.8 5.8 1.2 6.8-.9-2.2.1-4.5 2.2-5.9-.2 2.7 1.7 4.4 2.9 6.6 1.5 2.8.4 6.8-3.1 8.4 5.9.5 10.6-4.1 10.6-10.1 0-5.4-3.7-9.6-5.7-11.8-.5 1.7-1.6 2.7-2.6 3-.2-2.6-.4-4.9-1.4-6.8z"
                    fill="url(#curoKpi_fireOuter)"
                  />
                  <path
                    d="M14.2 11.2c-3.9 3.2-6.7 7.4-6.7 11.7 0 5.5 4.5 9.6 10.5 9.6 6 0 10.5-4.1 10.5-9.6 0-4.7-3.1-8.9-6.6-12.1.3 2.6-.9 4.5-2.4 5.4.4-3.4-1.5-6.7-3.7-9-.1 2.1-.7 3.2-1.6 4z"
                    fill="url(#curoKpi_fireOuter)"
                  />
                  <path
                    d="M18.1 15.8c-2.3 2.3-4.6 5.1-4.6 8.4 0 3.4 2.5 5.8 5.2 5.8 3.1 0 5.3-2.4 5.3-5.6 0-2.8-1.9-5.2-3.6-7.2-.2 1.5-1.1 2.5-2.1 2.9.4-1.5.3-3-.2-4.3z"
                    fill="url(#curoKpi_fireInner)"
                  />
                </svg>
              ),
              onClick: () => setCuroModalOpen(true),
            },
          ].map((card, idx) => (
            <div
              key={card.title}
              onClick={card.onClick}
              style={{ "--phase": `${idx * -1.15}s` }}
              className={`metal-kpi-card metal-${card.metal}`}
            >
              {/* 1. Brushed Metal Micro-Grain */}
              <div className="metal-brushed-surface" aria-hidden="true" />

              {/* 2. Studio Corner Specular Reflections */}
              <div className="metal-studio-bevel" aria-hidden="true" />

              {/* 3. 120FPS Live Anisotropic Metal Shine */}
              <div className="metal-live-luster" aria-hidden="true" />
              <div className="metal-live-underglow" aria-hidden="true" />

              {/* 4. Machined 3D Rim Highlight */}
              <div className="metal-chamfer-rim" aria-hidden="true" />

              {/* 5. Card Content */}
              <div className="metal-kpi-inner">
                {/* Top Row: Squircle Icon + Title & Metric */}
                <div className="metal-top-section">
                  <div className="metal-icon-squircle">{card.icon}</div>
                  <div className="metal-title-stack">
                    <span className="metal-kpi-title">{card.title}</span>
                    <span className="metal-kpi-number">{card.value}</span>
                  </div>
                </div>

                {/* Middle Row: Progress Track */}
                <div className="metal-progress-track">
                  <div
                    className="metal-progress-bar"
                    style={{ width: `${card.percent}%` }}
                  />
                </div>

                {/* Bottom Row: Subtitle + Action Button */}
                <div className="metal-bottom-section">
                  <span className="metal-kpi-sub">{card.sub}</span>
                  <button
                    type="button"
                    className="metal-filter-pill"
                    onClick={(e) => {
                      e.stopPropagation();
                      card.onClick();
                    }}
                  >
                    {card.action} <span className="metal-filter-arrow">→</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </section>

        {/* ===================================================================
        ROW 3 (SKETCH TABS 1, 2, 3):
        - TAB 1: CURO MANAGEMENT (Click to view & edit rules/rates)
        - TAB 2: REWARDS MANAGEMENT (Displays mini shining medals + click to edit)
        - TAB 3: AI ASSISTANCE LIVE MODEL (Uploaded PNG floating + live AI chat)
        =================================================================== */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          {/* TAB 1 (4 COLS): CURO MANAGEMENT COMMAND TAB */}
          <div
            onClick={() => setCuroModalOpen(true)}
            className="lg:col-span-4 cursor-pointer group celestial-hub-card hub-curo rounded-3xl p-5 flex flex-col justify-between space-y-4 select-none"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-amber-400/15 border border-amber-300/70 flex items-center justify-center shrink-0">
                  <Sliders className="w-5 h-5 text-[#FDE047]" />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-300 block">
                    01 • TREASURY RULES
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

            {/* Live Program & Rules Preview */}
            <div className="space-y-2">
              {curoConfig.programs.slice(0, 2).map((p) => (
                <div
                  key={p.id}
                  className="px-3.5 py-2 rounded-xl bg-[#050816] border border-white/10 flex items-center justify-between text-xs"
                >
                  <span className="font-bold text-slate-200 truncate pr-2">
                    {p.name}
                  </span>
                  <span className="font-black text-[#FDE047] shrink-0 font-mono">
                    +{p.rewardAmount} Curos
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs font-extrabold">
              <span className="text-slate-400">
                {curoConfig.rules.filter((r) => r.enabled).length} active earning rules
              </span>
              <span className="text-[#FDE047] inline-flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                <span>Configure</span>
                <ChevronRight className="w-4 h-4" />
              </span>
            </div>
          </div>

          {/* TAB 2 (4 COLS): REWARDS MANAGEMENT TAB (WITH MINI SHINING MEDALS!) */}
          <div
            onClick={() => setRewardsModalOpen(true)}
            className="lg:col-span-4 cursor-pointer group celestial-hub-card hub-rewards rounded-3xl p-5 flex flex-col justify-between space-y-4 select-none"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-purple-500/20 border border-purple-300/70 flex items-center justify-center shrink-0">
                  <Award className="w-5 h-5 text-purple-200" />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-purple-300 block">
                    02 • MEDAL VAULT RULES
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

            {/* Mini Live-Shining Metallic Medals Displayed Directly Inside Tab 2 */}
            <div className="px-3.5 py-2.5 rounded-2xl bg-[#050816] border border-purple-400/35 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <LiveShiningMetallicMedalSVG
                  badge={sampleGold}
                  size={44}
                  showRibbon={false}
                  isEarned={true}
                />
                <LiveShiningMetallicMedalSVG
                  badge={sampleSilver}
                  size={44}
                  showRibbon={false}
                  isEarned={true}
                />
                <LiveShiningMetallicMedalSVG
                  badge={sampleBronze}
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
                Edit targets, Curo bonuses &amp; rules
              </span>
              <span className="text-purple-300 inline-flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                <span>Manage Medals</span>
                <ChevronRight className="w-4 h-4" />
              </span>
            </div>
          </div>

          {/* TAB 3 (4 COLS): AI ASSISTANCE LIVE MODEL TAB */}
          <div
            onClick={() => setAiModalOpen(true)}
            className="lg:col-span-4 cursor-pointer group celestial-hub-card hub-ai rounded-3xl p-5 flex items-center justify-between gap-4 select-none"
          >
            <div className="flex flex-col justify-between h-full space-y-3 min-w-0">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-400/15 border border-cyan-300/55 text-[9.5px] font-black uppercase tracking-widest text-cyan-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  <span>03 • AI ASSISTANT</span>
                </div>
                <h2 className="text-lg font-black text-white mt-1.5 group-hover:text-cyan-200 transition">
                  Celestial AI Co-Pilot
                </h2>
                <p className="text-xs text-slate-300 font-medium mt-1 leading-relaxed">
                  Audit Curo flow, forecast medal unlocks, and design reward incentives live.
                </p>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <span className="celestial-btn-cyan px-3.5 py-1.5 rounded-xl text-[11px] font-black inline-flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Open AI Analyst</span>
                </span>
              </div>
            </div>

            {/* Live Floating Uploaded Dollar Coin Mascot AI Model */}
            <CelestialAiModelAvatar size={96} allowUpload={false} />
          </div>
        </section>

        {/* ===================================================================
        OUTSIDE TOP OF MAIN TABLE: TWO PRIMARY OPTIONS ("CUROS" & "MEDALS")
        + LIVE SEARCH FILTER
        =================================================================== */}
        <section className="flex flex-wrap items-center justify-between gap-3 pt-1">
          {/* Two Prominent Mode/Filter Options Outside the Main Table */}
          <div className="flex items-center gap-2.5 p-1.5 rounded-2xl bg-[#070C1F] border-2 border-cyan-400/45 shadow-[0_10px_28px_rgba(0,0,0,0.75)]">
            <button
              type="button"
              onClick={() => setTableViewMode("curos")}
              className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 cursor-pointer transition ${
                tableViewMode === "curos"
                  ? "celestial-btn-gold"
                  : "text-slate-300 hover:text-white"
              }`}
            >
              <Coins className="w-4 h-4" />
              <span>Curos</span>
            </button>
            <button
              type="button"
              onClick={() => setTableViewMode("medals")}
              className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 cursor-pointer transition ${
                tableViewMode === "medals"
                  ? "celestial-btn-purple"
                  : "text-slate-300 hover:text-white"
              }`}
            >
              <Award className="w-4 h-4" />
              <span>Medals</span>
            </button>
          </div>

          {/* Search Input */}
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <Search className="w-4 h-4 text-cyan-300 absolute left-4 top-3.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search learner, role, or medal name..."
              className="w-full rounded-2xl bg-[#070C1F] border-2 border-white/15 focus:border-cyan-400 pl-11 pr-4 py-2.5 text-xs font-bold text-white placeholder-slate-400 outline-none transition"
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
                {tableViewMode === "medals" ? (
                  <Crown className="w-5 h-5 text-[#FDE047]" />
                ) : (
                  <Coins className="w-5 h-5 text-[#FDE047]" />
                )}
              </div>
              <div>
                <h2 className="text-xl font-black text-white tracking-tight">
                  {tableViewMode === "medals"
                    ? "Shining Medals & Curos Registry"
                    : "Curos & Shining Medals Leaderboard"}
                </h2>
                <p className="text-xs text-cyan-200/85 font-bold">
                  Sorted by{" "}
                  {tableViewMode === "medals"
                    ? "Total Shining Medals Earned"
                    : "Current Curo Balance"}{" "}
                  • Showing {displayedUsers.length} learners
                </p>
              </div>
            </div>

            <span className="px-3.5 py-1.5 rounded-full bg-[#070B1A] border border-cyan-300/50 text-[11px] font-extrabold text-cyan-200">
              Click any learner tab to inspect medals or grant Curos
            </span>
          </div>

          {/* Aligned Columns + Separate User Tabs */}
          <div className="relative z-10 overflow-x-auto">
            <div className="min-w-[920px] space-y-3">
              {/* Column Strip */}
              <div className="grid grid-cols-12 items-center gap-3 px-5 py-3 rounded-2xl bg-[#050814]/85 border border-white/15 text-[10.5px] font-black uppercase tracking-[0.16em] text-cyan-200">
                <div className="col-span-1">RANK</div>
                <div className="col-span-2">LEARNER</div>
                <div className="col-span-2">ROLE</div>
                <div className="col-span-2 text-center">CUROS BALANCE</div>
                <div className="col-span-4">SHINING MEDALS EARNED</div>
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
                const visibleMedals = u.earnedMedals.slice(
                  0,
                  tableViewMode === "medals" ? 6 : 4
                );
                const overflowCount = Math.max(
                  0,
                  u.earnedMedals.length - visibleMedals.length
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
                        className={`inline-flex items-center justify-center px-2.5 py-1 rounded-xl text-xs font-black font-mono ${
                          idx === 0
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

                    {/* CUROS (ALWAYS VISIBLE IN BOTH MODES, HIGHLIGHTED IN CUROS MODE) */}
                    <div className="col-span-2 flex justify-center">
                      <span
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-black font-mono inline-flex items-center gap-1.5 border ${
                          tableViewMode === "curos" && u.curos > 0
                            ? "bg-amber-400/20 text-[#FEF08A] border-[#FDE047] shadow-[0_0_14px_rgba(250,204,21,0.3)]"
                            : u.curos > 0
                            ? "bg-amber-400/12 text-amber-200 border-amber-400/45"
                            : "bg-black/45 text-slate-400 border-white/15"
                        }`}
                      >
                        <Coins className="w-3.5 h-3.5 text-[#FDE047]" />
                        <span>{u.curos}</span>
                      </span>
                    </div>

                    {/* MINI SHINING 3D METALLIC MEDALS (ALWAYS VISIBLE, ENLARGED IN MEDALS MODE) */}
                    <div className="col-span-4 flex items-center gap-2 min-w-0">
                      {u.earnedMedals.length === 0 ? (
                        <span className="text-xs font-bold text-slate-500 italic">
                          No medals unlocked yet
                        </span>
                      ) : (
                        <>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {visibleMedals.map((medal) => (
                              <LiveShiningMetallicMedalSVG
                                key={medal.id}
                                badge={medal}
                                size={tableViewMode === "medals" ? 42 : 34}
                                showRibbon={false}
                                isEarned={true}
                              />
                            ))}
                          </div>
                          {overflowCount > 0 && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-500/25 text-purple-200 border border-purple-400/50 shrink-0">
                              +{overflowCount}
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
        MODALS FOR TAB 1 (CUROS), TAB 2 (REWARDS), TAB 3 (AI), & USER ROW
        =================================================================== */}
        <CuroRulesModal
          isOpen={curoModalOpen}
          onClose={() => setCuroModalOpen(false)}
          config={curoConfig}
          onUpdateProgram={handleUpdateProgram}
          onUpdateRule={handleUpdateRule}
          onAddProgram={handleAddProgram}
          onResetDefaults={() => {
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

        <CelestialAiAssistantModal
          isOpen={aiModalOpen}
          onClose={() => setAiModalOpen(false)}
          kpis={kpis}
          users={enrichedUsers}
          badgeRules={badgeRules}
        />

        <UserTreasuryModal
          user={activeSelectedUser}
          onClose={() => setSelectedUserId(null)}
          onAdjustCuros={handleAdjustUserCuros}
        />
      </div>
    </MainLayout>
  );
}
