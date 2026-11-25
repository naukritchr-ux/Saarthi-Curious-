/* eslint-disable no-unused-vars, react-hooks/set-state-in-effect */
import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import axios from "axios";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LabelList,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  CartesianGrid,
} from "recharts";
import {
  BookOpen,
  Users,
  Coins,
  HeartPulse,
  HelpCircle,
  PlayCircle,
  Sparkles,
  Send,
  X,
  ChevronRight,
  AlertTriangle,
  ShieldCheck,
  Bell,
  Download,
  RefreshCw,
  Sliders,
  CheckCircle2,
  UserX,
  Target,
  Activity,
  ArrowLeft,
  Flame,
  Zap,
  FileText,
  FileSpreadsheet,
  TrendingUp,
  BarChart3,
} from "lucide-react";
import reportsHeroImg from "../../assets/reports-hero.png";
import saarthiRobotImg from "../../assets/saarthi-robot.png";
import MainLayout from "../../layout/mainLayout";
import { useAgentTabSync } from "../../hooks/useAgentTabSync";
import AgentSyncStrip from "../../components/AgentSyncStrip";
import MeetingSchedulerModal from "../../components/MeetingSchedulerModal";

const API_BASE_URL =
  import.meta.env?.VITE_API_URL ||
  (typeof window !== "undefined" &&
  (window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1")
    ? "http://127.0.0.1:8000"
    : "https://saarthi-curious-00e8.onrender.com");

function resolveHeroRightImage() {
  return reportsHeroImg || "/reports-hero.png";
}

const DEFAULT_HERO_PNG = resolveHeroRightImage();
const STORAGE_KEY_AI_ROBOT_AVATAR = "saarthi_transparent_ai_model_v4";

function resolveRobotAvatar() {
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_AI_ROBOT_AVATAR);
      if (stored && !stored.includes("ca_avatar") && !stored.includes("caAvatar")) return stored;
    } catch {
      // storage unavailable
    }
  }
  return saarthiRobotImg || "/saarthi-robot.png";
}

const DEPT_PALETTE = [
  { hex: "#F59E0B", glow: "#FDE047", rgb: [251, 191, 36] },
  { hex: "#10B981", glow: "#6EE7B7", rgb: [52, 211, 153] },
  { hex: "#A855F7", glow: "#E9D5FF", rgb: [192, 132, 252] },
  { hex: "#22D3EE", glow: "#A5F3FC", rgb: [56, 189, 248] },
  { hex: "#FB7185", glow: "#FECDD3", rgb: [251, 113, 133] },
];

// ============================================================================
// 1. STRUCTURED FALLBACK TELEMETRY (ACTIVE ONLY IF BACKEND IS OFFLINE/PARTIAL)
// ============================================================================
const FALLBACK_PROGRAMS = [
  {
    id: 1,
    title: "Client Relationships",
    category: "Client Success",
    status: "Published",
    enrolled: 15,
    completionPct: 42,
    modules: [
      { id: "m1", title: "Module 1: Executive Client Trust", videos: 1, quizzes: 1, avgScore: 84 },
      { id: "m2", title: "Module 2: Managing Friction & Retention", videos: 1, quizzes: 2, avgScore: 76 },
      { id: "m3", title: "Module 3: Quarterly Value Reviews", videos: 1, quizzes: 1, avgScore: 68 },
    ],
  },
  {
    id: 2,
    title: "Leadership & Franchise Operations",
    category: "Corporate L&D",
    status: "Published",
    enrolled: 8,
    completionPct: 68,
    modules: [
      { id: "m4", title: "Module 1: Hub Governance & SLA", videos: 2, quizzes: 1, avgScore: 88 },
      { id: "m5", title: "Module 2: Coaching Subordinate Squads", videos: 2, quizzes: 2, avgScore: 79 },
    ],
  },
];

const FALLBACK_DASHBOARD = {
  donut: {
    counts: { completed: 5, in_progress: 11, not_started: 7, total: 23 },
    percentages: { completed: 21.7, in_progress: 47.8, not_started: 30.5 },
    needs_reminder_blast: true,
    recommended_action:
      "11 learners are mid-funnel and 7 accounts remain inactive (0% start). Triggering a 3-min micro-video reminder + +50 Curos completion bounty lifts graduation rate within 7 days.",
  },
  engagement: {
    series: [
      { date_label: "Nov 16", quizzes: 2, videos: 5, mastery: 72 },
      { date_label: "Nov 17", quizzes: 4, videos: 8, mastery: 75 },
      { date_label: "Nov 18", quizzes: 3, videos: 6, mastery: 71 },
      { date_label: "Nov 19", quizzes: 6, videos: 11, mastery: 79 },
      { date_label: "Nov 20", quizzes: 5, videos: 9, mastery: 76 },
      { date_label: "Nov 21", quizzes: 8, videos: 14, mastery: 82 },
      { date_label: "Nov 22", quizzes: 7, videos: 12, mastery: 80 },
    ],
    telemetry_cards: {
      total_quizzes: 35,
      avg_quiz_mastery: 76.4,
      total_videos: 7,
      video_completions: 65,
      staff_count: 11,
      student_count: 12,
      curos_in_circulation: 510,
      medals_unlocked: 18,
      platform_health_score: 73,
      on_time_users: 14,
      dead_users: 9,
    },
  },
  global_ai_report: {
    executiveSummary:
      "Platform health stands at 73% with 14 on-time active learners and 9 dormant accounts. Corporate L&D and Regional Cohorts trail target benchmarks by 12%–19%.",
    hasRisk: true,
    riskCount: 4,
    highRiskAlert:
      "9 inactive ('dead') users have logged 0 video sessions in 14+ days, pulling overall completion below the 75% quarterly SLA.",
    prescription:
      "Deploy 3-minute micro-video reminders to stalled learners and activate a +50 Curos completion bounty on Module 3.",
    prediction30d:
      "Projected completion lifts from 21.7% to 54% within 14 days if nudges execute.",
  },
  departments: [
    {
      id: "corporate_ld",
      badge: "Corporate L&D",
      title: "Corporate L&D Operations",
      metrics: "11 Staff • 68% Target Attainment",
      target: 80,
      aiDeepDive: {
        healthScore: 68,
        hasRisk: true,
        aiSummary:
          "Corporate L&D shows strong early video adoption (84%), but Module 3 assessment submissions slow down across mid-tenure staff.",
        highRiskAlert: "3 staff members have stalled at Module 2 for over 10 days.",
        prescription:
          "Schedule a 15-minute live quiz sprint and pair stalled staff with top Curo performers to close the 12% SLA gap.",
        prediction30d:
          "Attainment projected to climb from 68% to 84% within 14 days after peer pairing.",
      },
      data: [
        { name: "Mod 1", value: 88, target: 80 },
        { name: "Mod 2", value: 72, target: 80 },
        { name: "Mod 3", value: 44, target: 80 },
        { name: "Quiz Avg", value: 78, target: 75 },
      ],
    },
    {
      id: "regional_cohorts",
      badge: "Regional Cohorts",
      title: "Franchise Partner Cohorts",
      metrics: "5 Hubs • 56% Target Attainment",
      target: 75,
      aiDeepDive: {
        healthScore: 56,
        hasRisk: true,
        aiSummary:
          "Top hub (West Hub) operates at 92% efficiency, while trailing hubs show 0% quiz initiation among newly onboarded candidates.",
        highRiskAlert:
          "2 franchise hubs sit below 35% completion with elevated candidate attrition risk.",
        prescription:
          "Trigger automated Franchise Partner accountability digest + +50 Curos first-quiz starter bonus.",
        prediction30d:
          "Expected +22% cohort attainment lift (56% → 78%) once onboarding friction clears.",
      },
      data: [
        { name: "West Hub", value: 92, target: 75 },
        { name: "North Hub", value: 64, target: 75 },
        { name: "South Hub", value: 52, target: 75 },
        { name: "East Hub", value: 28, target: 75 },
      ],
    },
    {
      id: "behavioral_telemetry",
      badge: "Behavioral Telemetry",
      title: "Candidate Engagement & Retention",
      metrics: "12 Candidates • 80% Target Attainment",
      target: 80,
      aiDeepDive: {
        healthScore: 80,
        hasRisk: false,
        aiSummary:
          "Active candidates show strong retention (82%) and consistent 3-day learning streaks once they pass their first video checkpoint.",
        highRiskAlert: null,
        prescription:
          "Maintain momentum by unlocking Silver Streak badges at 7 consecutive active days and spotlighting top finishers.",
        prediction30d:
          "Sustained 89%+ mastery rate projected across active candidates over the next 14 days.",
      },
      data: [
        { name: "Week 1", value: 74, target: 80 },
        { name: "Week 2", value: 79, target: 80 },
        { name: "Week 3", value: 82, target: 80 },
        { name: "Week 4", value: 85, target: 80 },
      ],
    },
    {
      id: "curriculum_funnel",
      badge: "Curriculum Funnel",
      title: "Module & Assessment Mastery",
      metrics: "2 Programs • 64% Target Attainment",
      target: 75,
      aiDeepDive: {
        healthScore: 64,
        hasRisk: true,
        aiSummary:
          "Video completion outpaces quiz submission by 1.8x, indicating assessment hesitation before Module 3 practical checks.",
        highRiskAlert:
          "36% drop-off observed between watching video lectures and attempting quizzes.",
        prescription:
          "Surface instant 2-question warm-up flashcards immediately after each video lecture ends.",
        prediction30d:
          "Quiz conversion projected to rise from 64% to 82% within two cycles.",
      },
      data: [
        { name: "Enrolled", value: 100, target: 75 },
        { name: "Video Done", value: 74, target: 75 },
        { name: "Quiz Tried", value: 58, target: 75 },
        { name: "Certified", value: 42, target: 75 },
      ],
    },
    {
      id: "squad_leaderboard",
      badge: "Squad Leaderboard",
      title: "Team Leader Squad Progress",
      metrics: "4 Squads • 74% Target Attainment",
      target: 80,
      aiDeepDive: {
        healthScore: 74,
        hasRisk: false,
        aiSummary:
          "Sasuke Uchiha and Vedika Tolani squads drive 88% of subordinate Curo circulation.",
        highRiskAlert: null,
        prescription:
          "Replicate Sasuke squad's 48-hour check-in cadence across newer team leaders to lift lagging squads.",
        prediction30d:
          "Squad average attainment forecast to cross 85% next cycle.",
      },
      data: [
        { name: "Sasuke", value: 94, target: 80 },
        { name: "Vedika", value: 76, target: 80 },
        { name: "Mousume", value: 68, target: 80 },
        { name: "Surbhi", value: 58, target: 80 },
      ],
    },
  ],
};

const FALLBACK_USERS = [
  {
    id: 1,
    name: "Atharva Lohar",
    email: "atharvalohar33@gmail.com",
    role: "Franchise Employee",
    isCandidate: true,
    departmentId: "regional_cohorts",
    progress: 100,
    videosCompleted: 7,
    totalVideos: 7,
    quizzesCompleted: 6,
    totalQuizzes: 6,
    quizMastery: 94,
    curos: 365,
    medals: 6,
    status: "On-Time",
    lastActiveDays: 0,
    attritionRisk: 11,
    aiPrescription:
      "Promote Atharva to Peer Mentor for Regional Cohorts to lift lagging squad members.",
  },
  {
    id: 2,
    name: "Lav Chokhani",
    email: "lav.chokhani@talentcorner.in",
    role: "Franchise Partner",
    isCandidate: false,
    departmentId: "regional_cohorts",
    progress: 72,
    videosCompleted: 5,
    totalVideos: 7,
    quizzesCompleted: 4,
    totalQuizzes: 6,
    quizMastery: 82,
    curos: 110,
    medals: 3,
    status: "On-Time",
    lastActiveDays: 1,
    attritionRisk: 24,
    aiPrescription:
      "Prompt completion of Module 3 practical quiz to unlock Silver Certification.",
  },
  {
    id: 3,
    name: "Sneha Jaiswal",
    email: "sneha.jaiswal@talentcorner.in",
    role: "Candidate",
    isCandidate: true,
    departmentId: "regional_cohorts",
    progress: 12,
    videosCompleted: 1,
    totalVideos: 7,
    quizzesCompleted: 0,
    totalQuizzes: 6,
    quizMastery: 0,
    curos: 0,
    medals: 0,
    status: "Dead / Inactive",
    lastActiveDays: 16,
    attritionRisk: 86,
    aiPrescription:
      "High candidate attrition risk. Send 3-min micro-video intro + +50 Curos starter incentive immediately.",
  },
  {
    id: 4,
    name: "Anuj Jadhav",
    email: "anujjadhav3558@gmail.com",
    role: "Master Admin",
    isCandidate: false,
    departmentId: "corporate_ld",
    progress: 86,
    videosCompleted: 6,
    totalVideos: 7,
    quizzesCompleted: 5,
    totalQuizzes: 6,
    quizMastery: 91,
    curos: 210,
    medals: 4,
    status: "On-Time",
    lastActiveDays: 0,
    attritionRisk: 14,
    aiPrescription:
      "On track for 100% completion; complete final executive review quiz.",
  },
  {
    id: 5,
    name: "Parna Ghosh",
    email: "parna.ghosh@talentcorner.in",
    role: "Team Leader",
    isCandidate: false,
    departmentId: "corporate_ld",
    progress: 45,
    videosCompleted: 3,
    totalVideos: 7,
    quizzesCompleted: 2,
    totalQuizzes: 6,
    quizMastery: 74,
    curos: 60,
    medals: 1,
    status: "Stalled",
    lastActiveDays: 6,
    attritionRisk: 58,
    aiPrescription:
      "Stalled mid-way through Module 2. Dispatch automated reminder nudge.",
  },
  {
    id: 6,
    name: "Mousume Barick",
    email: "mousumebaricktalentcorner@gmail.com",
    role: "Head Office Staff",
    isCandidate: false,
    departmentId: "corporate_ld",
    progress: 82,
    videosCompleted: 6,
    totalVideos: 7,
    quizzesCompleted: 5,
    totalQuizzes: 6,
    quizMastery: 86,
    curos: 195,
    medals: 4,
    status: "On-Time",
    lastActiveDays: 1,
    attritionRisk: 18,
    aiPrescription:
      "Strong assessment mastery. Assign Leadership Foundations advanced track.",
  },
  {
    id: 7,
    name: "Mama Singh",
    email: "mama.singh@talentcorner.in",
    role: "Candidate",
    isCandidate: true,
    departmentId: "behavioral_telemetry",
    progress: 28,
    videosCompleted: 2,
    totalVideos: 7,
    quizzesCompleted: 1,
    totalQuizzes: 6,
    quizMastery: 65,
    curos: 10,
    medals: 1,
    status: "Stalled",
    lastActiveDays: 9,
    attritionRisk: 74,
    aiPrescription:
      "Candidate engagement dipping after Quiz 1. Pair with peer buddy and trigger concept recap.",
  },
  {
    id: 8,
    name: "Priyanka Panjwani",
    email: "priyanka.p@talentcorner.in",
    role: "Candidate",
    isCandidate: true,
    departmentId: "behavioral_telemetry",
    progress: 0,
    videosCompleted: 0,
    totalVideos: 7,
    quizzesCompleted: 0,
    totalQuizzes: 6,
    quizMastery: 0,
    curos: 0,
    medals: 0,
    status: "Dead / Inactive",
    lastActiveDays: 19,
    attritionRisk: 91,
    aiPrescription:
      "Dormant candidate account (0 starts). Escalate to Team Leader + send 1-click onboarding call link.",
  },
  {
    id: 9,
    name: "Sasuke Uchiha",
    email: "sasuke.uchiha@talentcorner.in",
    role: "Team Leader",
    isCandidate: false,
    departmentId: "squad_leaderboard",
    progress: 96,
    videosCompleted: 7,
    totalVideos: 7,
    quizzesCompleted: 6,
    totalQuizzes: 6,
    quizMastery: 92,
    curos: 365,
    medals: 5,
    status: "On-Time",
    lastActiveDays: 0,
    attritionRisk: 9,
    aiPrescription: "Benchmark squad leader. Maintain weekly coaching syncs.",
  },
  {
    id: 10,
    name: "Vedika Tolani",
    email: "vedika.tolani@talentcorner.in",
    role: "Team Leader",
    isCandidate: false,
    departmentId: "curriculum_funnel",
    progress: 64,
    videosCompleted: 5,
    totalVideos: 7,
    quizzesCompleted: 3,
    totalQuizzes: 6,
    quizMastery: 78,
    curos: 85,
    medals: 2,
    status: "On-Time",
    lastActiveDays: 2,
    attritionRisk: 31,
    aiPrescription:
      "Video velocity is high; nudge to finish remaining 3 module quizzes.",
  },
  {
    id: 11,
    name: "Preshita Rane",
    email: "preshita.rane@talentcorner.in",
    role: "Candidate",
    isCandidate: true,
    departmentId: "curriculum_funnel",
    progress: 18,
    videosCompleted: 1,
    totalVideos: 7,
    quizzesCompleted: 0,
    totalQuizzes: 6,
    quizMastery: 0,
    curos: 0,
    medals: 0,
    status: "Dead / Inactive",
    lastActiveDays: 14,
    attritionRisk: 83,
    aiPrescription:
      "Watched intro video but hesitated on Quiz 1. Send warm-up flashcards and +25 Curos nudge.",
  },
  {
    id: 12,
    name: "Surbhi Jain",
    email: "surbhi.jain@talentcorner.in",
    role: "Team Leader",
    isCandidate: false,
    departmentId: "squad_leaderboard",
    progress: 38,
    videosCompleted: 3,
    totalVideos: 7,
    quizzesCompleted: 1,
    totalQuizzes: 6,
    quizMastery: 70,
    curos: 30,
    medals: 1,
    status: "Stalled",
    lastActiveDays: 8,
    attritionRisk: 62,
    aiPrescription:
      "Subordinate completion is lagging; trigger squad milestone challenge.",
  },
];

// ============================================================================
// 2. CUSTOM RECHARTS CLEAN HIGH-CONTRAST TOOLTIP
// ============================================================================
function ObsidianTooltip({ active, payload, label, suffix = "" }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="bg-[#080915]/96 backdrop-blur-xl border-2 border-amber-400/75 px-3.5 py-2.5 rounded-xl shadow-[0_10px_28px_rgba(0,0,0,0.85),0_0_20px_rgba(245,158,11,0.28)] text-xs z-50">
      {label && (
        <p className="font-black text-amber-200 mb-1 border-b border-white/15 pb-1">
          {label}
        </p>
      )}
      {payload.map((entry, idx) => (
        <div key={idx} className="flex items-center justify-between gap-4 py-0.5">
          <span className="flex items-center gap-1.5 text-slate-200 font-semibold">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{
                backgroundColor: entry.color || entry.stroke || "#F59E0B",
                boxShadow: `0 0 8px ${entry.color || entry.stroke || "#F59E0B"}`,
              }}
            />
            {entry.name}:
          </span>
          <span className="font-black text-white font-mono">
            {entry.value}
            {suffix}
          </span>
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// 3. 3D SCROLL-ANIMATED CIRCULAR COMPLETION GAUGE (GRAPH 1)
// ============================================================================
function ScrollAnimated3DCompletionRing({ donut, onInspect }) {
  const containerRef = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setInView(true);
      },
      { threshold: 0.2 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const completedPct = Number(donut?.percentages?.completed ?? 0);
  const inProgressPct = Number(donut?.percentages?.in_progress ?? 0);
  const notStartedPct = Number(donut?.percentages?.not_started ?? 0);

  // Denser proportions: tighter radius + thicker 25px sculpted 3D ring
  const R = 52;
  const C = 2 * Math.PI * R;
  const gap = 3.5;
  const compArc = inView ? Math.max(0, (completedPct / 100) * C - gap) : 0;
  const progArc = inView ? Math.max(0, (inProgressPct / 100) * C - gap) : 0;
  const idleArc = inView ? Math.max(0, (notStartedPct / 100) * C - gap) : 0;

  return (
    <div
      ref={containerRef}
      onClick={onInspect}
      className="cursor-pointer group reports-panel reports-border-purple p-6 flex flex-col justify-between space-y-5 h-full"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="px-2.5 py-1 rounded-lg bg-purple-500/20 border border-purple-300/60 text-[10px] font-black uppercase tracking-[0.2em] text-purple-100 inline-block">
            GRAPH 01 • 3D COMPLETION RING
          </span>
          <h2 className="text-lg font-black text-white mt-2 group-hover:text-amber-200 transition">
            Overall Cohort Completion
          </h2>
          <p className="text-xs text-slate-200 font-medium">
            Dense 3D sculpted ring • Click for stage bar breakdown
          </p>
        </div>

        <span className="px-3 py-1 rounded-xl bg-[#070812] border border-cyan-300/60 text-xs font-black font-mono text-cyan-200 shrink-0">
          {donut?.counts?.total ?? 0} Total
        </span>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-6 my-auto py-1">
        <div className="relative w-48 h-48 flex items-center justify-center shrink-0">
          {/* Realistic Ambient Floor Reflection */}
          <div className="pointer-events-none absolute -bottom-2 w-36 h-8 rounded-full bg-purple-600/35 blur-xl" />
          <div className="pointer-events-none absolute inset-2 rounded-full bg-gradient-to-tr from-emerald-500/20 via-purple-500/25 to-amber-400/20 blur-xl" />

          <svg
            viewBox="0 0 168 168"
            className="w-48 h-48 overflow-visible transition-transform duration-1000 ease-out"
            style={{
              transform: inView ? "rotate(-90deg)" : "rotate(-145deg)",
            }}
          >
            <defs>
              {/* Glossy 3D Torus Gradients */}
              <linearGradient id="dense3DComp" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#A7F3D0" />
                <stop offset="35%" stopColor="#10B981" />
                <stop offset="100%" stopColor="#0284C7" />
              </linearGradient>
              <linearGradient id="dense3DProg" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#F3E8FF" />
                <stop offset="40%" stopColor="#9333EA" />
                <stop offset="100%" stopColor="#D97706" />
              </linearGradient>
              <linearGradient id="dense3DIdle" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#FECDD3" />
                <stop offset="45%" stopColor="#F43F5E" />
                <stop offset="100%" stopColor="#881337" />
              </linearGradient>
              <radialGradient id="dense3DCenterWell" cx="34%" cy="28%" r="74%">
                <stop offset="0%" stopColor="#262148" />
                <stop offset="55%" stopColor="#100D22" />
                <stop offset="100%" stopColor="#05040B" />
              </radialGradient>
              <filter id="dense3DDepth" x="-25%" y="-25%" width="150%" height="150%">
                <feDropShadow dx="3" dy="6" stdDeviation="4.5" floodColor="#000000" floodOpacity="0.92" />
              </filter>
            </defs>

            {/* 3D Extruded Cylinder Side Wall (Thickness Below Ring) */}
            <circle
              cx="89"
              cy="84"
              r={R}
              fill="none"
              stroke="#05040C"
              strokeWidth="29"
              opacity="0.95"
            />
            <circle
              cx="86.5"
              cy="84"
              r={R}
              fill="none"
              stroke="#1C1636"
              strokeWidth="27"
            />

            {/* Main Dense Base Channel */}
            <circle
              cx="84"
              cy="84"
              r={R}
              fill="none"
              stroke="#120F24"
              strokeWidth="26"
            />

            {/* Segment 3: Not Started (Dense Rose) */}
            <circle
              cx="84"
              cy="84"
              r={R}
              fill="none"
              stroke="url(#dense3DIdle)"
              strokeWidth="25"
              strokeDasharray={`${idleArc} ${C}`}
              strokeDashoffset={-((completedPct + inProgressPct) / 100) * C}
              filter="url(#dense3DDepth)"
              style={{ transition: "stroke-dasharray 1.1s ease, stroke-dashoffset 1.1s ease" }}
            />

            {/* Segment 2: In Progress (Dense Violet -> Amber) */}
            <circle
              cx="84"
              cy="84"
              r={R}
              fill="none"
              stroke="url(#dense3DProg)"
              strokeWidth="25"
              strokeDasharray={`${progArc} ${C}`}
              strokeDashoffset={-(completedPct / 100) * C}
              filter="url(#dense3DDepth)"
              style={{ transition: "stroke-dasharray 1s ease, stroke-dashoffset 1s ease" }}
            />

            {/* Segment 1: Completed (Dense Emerald -> Cyan) */}
            <circle
              cx="84"
              cy="84"
              r={R}
              fill="none"
              stroke="url(#dense3DComp)"
              strokeWidth="26"
              strokeDasharray={`${compArc} ${C}`}
              filter="url(#dense3DDepth)"
              style={{ transition: "stroke-dasharray 0.9s ease" }}
            />

            {/* Realistic Specular Gloss Rim Highlight Along Top Outer Edge */}
            <circle
              cx="84"
              cy="84"
              r={R + 9.5}
              fill="none"
              stroke="rgba(255, 255, 255, 0.36)"
              strokeWidth="2"
            />
            {/* Inner Shadow Bevel Separating Ring from Hub */}
            <circle
              cx="84"
              cy="84"
              r={R - 11}
              fill="none"
              stroke="rgba(0, 0, 0, 0.72)"
              strokeWidth="3.5"
            />

            {/* Sculpted Dark Inner Core Disc */}
            <circle
              cx="84"
              cy="84"
              r="37"
              fill="url(#dense3DCenterWell)"
              stroke="rgba(254, 240, 138, 0.4)"
              strokeWidth="1.4"
            />
          </svg>

          <div className="absolute text-center flex flex-col items-center justify-center pointer-events-none select-none">
            <svg className="w-5 h-5 text-amber-300 drop-shadow-[0_0_8px_rgba(250,204,21,0.6)] mb-0.5" viewBox="0 0 24 24" fill="currentColor">
              <rect x="3" y="13" width="4" height="8" rx="1.5" />
              <rect x="10" y="8" width="4" height="13" rx="1.5" />
              <rect x="17" y="3" width="4" height="18" rx="1.5" />
            </svg>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300">
              Total
            </span>
            <span className="text-xl sm:text-2xl font-black font-mono text-white tracking-tight leading-none mt-0.5 drop-shadow-[0_2px_10px_rgba(0,0,0,0.95)]">
              {(donut?.counts?.total ?? 23).toLocaleString()}
            </span>
            <span className="text-[9.5px] font-black uppercase tracking-wider text-emerald-400 mt-1">
              {completedPct}% Done
            </span>
          </div>
        </div>

        <div className="flex-1 w-full bg-[#0C0B18]/70 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-[0_12px_32px_rgba(0,0,0,0.6)] space-y-3 text-xs">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2.5 font-bold text-white">
              <span className="w-3.5 h-3.5 rounded-md bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.7)] shrink-0" />
              <span>Completed</span>
            </span>
            <span className="font-black font-mono text-emerald-300 text-[13px]">
              {completedPct}%
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2.5 font-bold text-white">
              <span className="w-3.5 h-3.5 rounded-md bg-purple-400 shadow-[0_0_10px_rgba(192,132,252,0.7)] shrink-0" />
              <span>In Progress</span>
            </span>
            <span className="font-black font-mono text-purple-300 text-[13px]">
              {inProgressPct}%
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2.5 font-bold text-white">
              <span className="w-3.5 h-3.5 rounded-md bg-rose-400 shadow-[0_0_10px_rgba(251,113,133,0.7)] shrink-0" />
              <span>Not Started</span>
            </span>
            <span className="font-black font-mono text-rose-300 text-[13px]">
              {notStartedPct}%
            </span>
          </div>
        </div>
      </div>

      <div className="pt-3 border-t border-white/15 flex items-center justify-between text-xs font-bold">
        <span className="text-slate-200">Live Cohort Funnel</span>
        <span className="text-amber-200 inline-flex items-center gap-1 group-hover:translate-x-1 transition-transform">
          <span>Open Bar Breakdown</span>
          <ChevronRight className="w-4 h-4" />
        </span>
      </div>
    </div>
  );
}

// ============================================================================
// 4. 3D NEURAL TARGET ATTAINMENT MESH (ROW 3 LEFT ~70%)
// ============================================================================
function NeuralTargetMesh({
  departments,
  deptTargets,
  activeDeptId,
  onSelectDept,
  onEditTargets,
}) {
  const canvasRef = useRef(null);

  const peakNodes = useMemo(() => {
    const coords = [
      { gx: 4.0, gz: 6.8 },
      { gx: 9.0, gz: 5.2 },
      { gx: 14.0, gz: 7.4 },
      { gx: 19.0, gz: 5.4 },
      { gx: 23.5, gz: 7.0 },
    ];
    return (departments || []).map((dept, idx) => {
      const c = coords[idx % coords.length];
      const pal = DEPT_PALETTE[idx % DEPT_PALETTE.length];
      const actual = Number(dept.aiDeepDive?.healthScore ?? 70);
      const target = Number(deptTargets[dept.id] ?? dept.target ?? 75);
      const attainmentRatio = Math.min(
        130,
        Math.round((actual / Math.max(1, target)) * 100)
      );
      const peakHeight = 42 + Math.min(44, Math.max(12, attainmentRatio * 0.36));

      return { ...c, dept, actual, target, attainmentRatio, height: peakHeight, pal };
    });
  }, [departments, deptTargets]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let frameId;
    let t = 0;

    const COLS = 28;
    const ROWS = 14;
    const jitter = [];
    for (let z = 0; z < ROWS; z++) {
      jitter[z] = [];
      for (let x = 0; x < COLS; x++) {
        const seed = (x * 43 + z * 97) % 100;
        jitter[z][x] = {
          jx: ((seed % 11) - 5) * 1.15,
          jz: (((seed * 7) % 11) - 5) * 0.8,
        };
      }
    }

    const render = () => {
      t += 0.022;
      const width = (canvas.width = canvas.parentElement?.clientWidth || 720);
      const height = (canvas.height = 305);

      const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
      bgGrad.addColorStop(0, "#1E1233");
      bgGrad.addColorStop(0.5, "#0E0B1D");
      bgGrad.addColorStop(1, "#070610");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      const glowA = ctx.createRadialGradient(
        width * 0.28,
        height * 0.28,
        10,
        width * 0.28,
        height * 0.28,
        width * 0.4
      );
      glowA.addColorStop(0, "rgba(245, 158, 11, 0.22)");
      glowA.addColorStop(1, "rgba(245, 158, 11, 0)");
      ctx.fillStyle = glowA;
      ctx.fillRect(0, 0, width, height);

      const glowB = ctx.createRadialGradient(
        width * 0.75,
        height * 0.26,
        10,
        width * 0.75,
        height * 0.26,
        width * 0.38
      );
      glowB.addColorStop(0, "rgba(56, 189, 248, 0.18)");
      glowB.addColorStop(1, "rgba(56, 189, 248, 0)");
      ctx.fillStyle = glowB;
      ctx.fillRect(0, 0, width, height);

      const vertices = [];
      const fov = 355;
      const viewerDist = 245;
      const spreadX = (width * 0.84) / COLS;

      for (let z = 0; z < ROWS; z++) {
        vertices[z] = [];
        for (let x = 0; x < COLS; x++) {
          const { jx, jz } = jitter[z][x];
          const worldX = (x - (COLS - 1) / 2) * spreadX + jx;
          const worldZ = (ROWS - z) * 18.5 + jz;

          let elev =
            Math.sin(x * 0.36 + t) * 4 + Math.cos(z * 0.44 - t * 0.8) * 4;

          let wr = 155;
          let wg = 125;
          let wb = 225;
          let tw = 0.28;

          peakNodes.forEach((pk) => {
            const dist = Math.hypot(x - pk.gx, z - pk.gz);
            if (dist < 4.5) {
              const cone = Math.pow(Math.max(0, 1 - dist / 4.5), 1.6);
              const pulse = 0.93 + 0.07 * Math.sin(t * 2.2 + x * 0.4);
              elev += pk.height * cone * pulse;

              const tip = cone > 0.55 ? (cone - 0.55) * 2.1 : 0;
              const rMix = pk.pal.rgb[0] * (1 - tip) + 254 * tip;
              const gMix = pk.pal.rgb[1] * (1 - tip) + 240 * tip;
              const bMix = pk.pal.rgb[2] * (1 - tip) + 138 * tip;

              wr += rMix * cone * 3.2;
              wg += gMix * cone * 3.2;
              wb += bMix * cone * 3.2;
              tw += cone * 3.2;
            }
          });

          const r = Math.min(255, Math.round(wr / tw));
          const g = Math.min(255, Math.round(wg / tw));
          const b = Math.min(255, Math.round(wb / tw));

          const scale = fov / (viewerDist + worldZ);
          const sx = width * 0.5 + worldX * scale * 1.18;
          const sy = height * 0.87 - worldZ * 0.33 - elev * scale * 1.28;
          vertices[z][x] = { x: sx, y: sy, elev, depth: worldZ, rgb: [r, g, b] };
        }
      }

      for (let z = 0; z < ROWS - 1; z++) {
        for (let x = 0; x < COLS - 1; x++) {
          const p00 = vertices[z][x];
          const p10 = vertices[z][x + 1];
          const p01 = vertices[z + 1][x];
          const p11 = vertices[z + 1][x + 1];

          const avgElev = (p00.elev + p10.elev + p01.elev + p11.elev) / 4;
          const alpha = Math.max(0.24, Math.min(1, 1 - p00.depth / 380));
          const [r, g, b] = p00.rgb;
          const isSlope = avgElev > 16;

          ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${(isSlope ? 0.88 : 0.4) * alpha})`;
          ctx.lineWidth = avgElev > 32 ? 1.5 : isSlope ? 1.15 : 0.78;

          ctx.beginPath();
          ctx.moveTo(p00.x, p00.y);
          ctx.lineTo(p10.x, p10.y);
          ctx.lineTo(p01.x, p01.y);
          ctx.closePath();
          ctx.stroke();

          ctx.beginPath();
          ctx.moveTo(p10.x, p10.y);
          ctx.lineTo(p11.x, p11.y);
          ctx.lineTo(p01.x, p01.y);
          ctx.stroke();

          const isApex = avgElev > 30;
          ctx.fillStyle = isApex
            ? `rgba(254, 249, 195, ${alpha})`
            : `rgba(${Math.min(255, r + 40)}, ${Math.min(255, g + 40)}, ${Math.min(
                255,
                b + 40
              )}, ${alpha})`;
          ctx.beginPath();
          ctx.arc(p00.x, p00.y, isApex ? 2.4 : isSlope ? 1.6 : 1.1, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      peakNodes.forEach((pk) => {
        const v = vertices[Math.round(pk.gz)]?.[Math.round(pk.gx)];
        if (!v) return;
        const isOnTarget = pk.actual >= pk.target;
        const label = `${pk.dept.badge}: ${pk.actual}%/${pk.target}%`;
        ctx.font = "700 10px Inter, system-ui, sans-serif";
        const tw = ctx.measureText(label).width + 16;

        ctx.fillStyle = "rgba(9, 8, 18, 0.92)";
        ctx.strokeStyle = isOnTarget ? "#6EE7B7" : pk.pal.glow;
        ctx.lineWidth = pk.dept.id === activeDeptId ? 2 : 1.25;

        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(v.x - tw / 2, v.y - 26, tw, 20, 6);
        } else {
          ctx.rect(v.x - tw / 2, v.y - 26, tw, 20);
        }
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = isOnTarget ? "#A7F3D0" : pk.pal.glow;
        ctx.textAlign = "center";
        ctx.fillText(label, v.x, v.y - 12);
      });

      frameId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(frameId);
  }, [peakNodes, activeDeptId]);

  return (
    <div className="reports-panel reports-border-amber p-5 flex flex-col justify-between space-y-4 h-full">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 border border-amber-300/60 text-[10px] font-black uppercase tracking-[0.2em] text-amber-200 inline-block">
            LIVE NEURAL MESH TELEMETRY • TARGET ATTAINMENT
          </span>
          <h2 className="text-lg font-black text-white mt-1.5">
            Departmental Target Trajectory (AI &amp; Admin Goals)
          </h2>
        </div>

        <button
          type="button"
          onClick={onEditTargets}
          className="px-3.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/35 border border-amber-300/65 text-xs font-extrabold text-amber-100 inline-flex items-center gap-1.5 cursor-pointer transition"
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Edit AI / Admin Targets</span>
        </button>
      </div>

      <div className="relative w-full rounded-2xl overflow-hidden border border-amber-400/45">
        <canvas ref={canvasRef} className="w-full h-[305px] block" />

        <div className="absolute top-3 left-3.5 flex items-center gap-2 bg-[#090814]/88 backdrop-blur-md px-3 py-1 rounded-full border border-amber-400/45">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
          <span className="text-[10.5px] font-extrabold text-amber-100 tracking-wide">
            CLICK ANY DEPARTMENT BELOW TO JUMP TO ITS REPORT
          </span>
        </div>

        <div className="absolute bottom-2.5 left-3 right-3 flex flex-wrap items-center justify-between gap-2 bg-[#090814]/92 backdrop-blur-md px-3 py-2 rounded-xl border border-white/15 text-[10.5px]">
          {peakNodes.map((pk) => {
            const met = pk.actual >= pk.target;
            const isSel = pk.dept.id === activeDeptId;
            return (
              <button
                key={pk.dept.id}
                type="button"
                onClick={() => onSelectDept(pk.dept.id)}
                className={`flex items-center gap-1.5 px-2 py-0.5 rounded-lg font-bold transition cursor-pointer ${
                  isSel
                    ? "bg-amber-500/25 text-white border border-amber-300/70"
                    : "text-slate-200 hover:text-amber-200"
                }`}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{
                    backgroundColor: pk.pal.hex,
                    boxShadow: `0 0 8px ${pk.pal.glow}`,
                  }}
                />
                <span>{pk.dept.badge}</span>
                <span
                  className={
                    met
                      ? "text-emerald-300 font-mono"
                      : "text-amber-300 font-mono"
                  }
                >
                  {pk.actual}%/{pk.target}%
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}



export default function ReportsAnalytics({
  backendData = null,
  heroImageSrc = DEFAULT_HERO_PNG,
}) {
  const [dashboard, setDashboard] = useState(backendData || FALLBACK_DASHBOARD);
  const [programs, setPrograms] = useState(FALLBACK_PROGRAMS);
  const [users, setUsers] = useState(FALLBACK_USERS);
  const [isLiveDb, setIsLiveDb] = useState(false);
  const [loading, setLoading] = useState(false);
  const [daysRange, setDaysRange] = useState(7);
  const [syncing, setSyncing] = useState(false);
  const [isolatedStream, setIsolatedStream] = useState("all");
  const [aiAvatarUrl, setAiAvatarUrl] = useState(() => resolveRobotAvatar());
  const aiFileInputRef = useRef(null);

  const handleAvatarUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result;
      if (typeof result === "string") {
        setAiAvatarUrl(result);
        try {
          localStorage.setItem(STORAGE_KEY_AI_ROBOT_AVATAR, result);
        } catch {
          // ignore quota
        }
        showToast("Updated custom AI model avatar!");
      }
    };
    reader.readAsDataURL(file);
  };
  const [heroImgErr, setHeroImgErr] = useState(false);

  // Active Department Tab & Editable Admin/AI Targets
  const [activeDeptId, setActiveDeptId] = useState(null);
  const [deptTargets, setDeptTargets] = useState({});
  const [targetModalOpen, setTargetModalOpen] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);

  // Drill-down Modals State
  const [activeModal, setActiveModal] = useState(null);
  const [selectedProgramInModal, setSelectedProgramInModal] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [schedulerAttendee, setSchedulerAttendee] = useState(null);

  // Candidate Attrition Simulator toggles inside User Detail Modal
  const [deptViewMode, setDeptViewMode] = useState("predicted");
    const [prescriptionHorizon, setPrescriptionHorizon] = useState("week"); // "week" | "month"
  const [attritionToggles, setAttritionToggles] = useState({
    microVideo: true,
    peerBuddy: false,
    bonusCuros: true,
  });

  // Live AI Pod Ticker & Interactive Chat State
  const [aiTipIdx, setAiTipIdx] = useState(0);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [toast, setToast] = useState(null);
  const { syncData, syncLoading, refreshSync, sendGroundedCommand } =
    useAgentTabSync("reports");

  const deptSectionRef = useRef(null);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3400);
  };

  // Fetch Live FastAPI / Supabase Telemetry (Parallel, Non-blocking, Instant 0ms Paint)
  const fetchAllTelemetry = useCallback(
    async (manual = false) => {
      if (manual) setSyncing(true);
      let connected = false;

      const token =
        (typeof window !== "undefined" &&
          (localStorage.getItem("access_token") ||
            localStorage.getItem("token"))) ||
        "";
      const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};
      const reqTimeout = 35000;

      const dashboardPromise = !backendData
        ? axios.get(`${API_BASE_URL}/analytics/dashboard`, {
            params: {
              days: daysRange,
              role: "all",
              ...(manual ? { force_refresh: true } : {}),
              _t: Date.now(),
            },
            headers: authHeaders,
            timeout: reqTimeout,
          })
        : Promise.resolve(null);

      const programsPromise = axios.get(`${API_BASE_URL}/programs`, {
        params: { _t: Date.now() },
        timeout: reqTimeout,
      });

      const attritionPromise = axios.get(
        `${API_BASE_URL}/analytics/candidate-attrition`,
        { params: { _t: Date.now() }, timeout: reqTimeout }
      );

      const [dashResult, progResult, attrResult] = await Promise.allSettled([
        dashboardPromise,
        programsPromise,
        attritionPromise,
      ]);

      if (dashResult.status === "fulfilled" && dashResult.value?.data) {
        const dData = dashResult.value.data;
        if (dData.donut || dData.departments) {
          setDashboard(dData);
          connected = true;
        }
      }

      if (progResult.status === "fulfilled" && progResult.value?.data) {
        const list =
          progResult.value.data?.programs ||
          progResult.value.data?.data ||
          progResult.value.data;
        if (Array.isArray(list) && list.length > 0) {
          setPrograms(
            list.map((p, idx) => ({
              id: p.id ?? idx + 1,
              title: p.title || p.name || `Program #${idx + 1}`,
              category: p.category || "Enterprise Track",
              status: String(p.status || "Published"),
              enrolled: Number(p.enrolled_count ?? p.enrolled ?? 12),
              completionPct: Number(p.completion_pct ?? 55),
              modules:
                Array.isArray(p.modules) && p.modules.length > 0
                  ? p.modules.map((m, mi) => ({
                      id: m.id ?? `m-${mi}`,
                      title: m.title || m.name || `Module ${mi + 1}`,
                      videos: Number(m.videos_count ?? m.videos ?? 1),
                      quizzes: Number(m.quizzes_count ?? m.quizzes ?? 1),
                      avgScore: Number(m.avg_score ?? 78),
                    }))
                  : Array.from(
                      { length: Math.max(1, Number(p.modules_count ?? 3)) },
                      (_, mi) => ({
                        id: `${p.id}-m-${mi}`,
                        title: `Module ${mi + 1}: Core Track Unit`,
                        videos: 1,
                        quizzes: 1,
                        avgScore: 76 + mi * 3,
                      })
                    ),
            }))
          );
          connected = true;
        }
      }

      if (attrResult.status === "fulfilled" && attrResult.value?.data) {
        const cands =
          attrResult.value.data?.candidates || attrResult.value.data?.users;
        if (Array.isArray(cands) && cands.length > 0) {
          const deptIds = FALLBACK_DASHBOARD.departments.map((d) => d.id);
          setUsers(
            cands.map((u, idx) => {
              const prog = Number(u.completion_pct ?? u.progress ?? 0);
              const roleStr = String(u.role || "Candidate");
              const isCand = /candidate|student|learner|employee/i.test(roleStr);
              const isDead = prog === 0 || Number(u.days_inactive ?? 0) >= 12;
              return {
                id: u.id ?? u.user_id ?? idx + 1,
                name: u.name || u.full_name || `Learner #${idx + 1}`,
                email: u.email || "learner@saarthi.lms",
                role: roleStr,
                isCandidate: isCand,
                departmentId: u.department_id || deptIds[idx % deptIds.length],
                progress: prog,
                videosCompleted: Number(
                  u.videos_completed_count ??
                    u.videos_completed ??
                    Math.round(prog / 15)
                ),
                totalVideos: Number(u.total_videos ?? 3),
                quizzesCompleted: Number(
                  u.quiz_attempts_count ??
                    u.quizzes_attempted ??
                    Math.round(prog / 18)
                ),
                totalQuizzes: Number(u.total_quizzes ?? 6),
                quizMastery: Number(
                  u.quiz_mastery_pct ??
                    u.avg_quiz_score ??
                    u.quiz_mastery ??
                    (prog > 0 ? 78 : 0)
                ),
                curos: Number(u.curos ?? 0),
                medals: Number(
                  u.medals_count ?? (prog >= 80 ? 4 : prog >= 40 ? 2 : 0)
                ),
                status: isDead
                  ? "Dead / Inactive"
                  : prog >= 60
                  ? "On-Time"
                  : "Stalled",
                lastActiveDays: Number(u.days_inactive ?? (isDead ? 15 : 1)),
                attritionRisk: Number(
                  u.risk_score ?? u.attrition_risk ?? (isDead ? 84 : 26)
                ),
                aiPrescription:
                  u.ai_prescription ||
                  (isDead
                    ? "Account is dormant. Trigger micro-video revival nudge + +50 Curos completion incentive."
                    : "Steady learning pace. Recommend advancing to next quiz checkpoint."),
              };
            })
          );
          connected = true;
        }
      }

      if (!connected && !backendData) {
        setDashboard((prev) => prev || FALLBACK_DASHBOARD);
        setPrograms((prev) => (prev && prev.length > 0 ? prev : FALLBACK_PROGRAMS));
        setUsers((prev) => (prev && prev.length > 0 ? prev : FALLBACK_USERS));
      }

      setIsLiveDb(connected);
      setLoading(false);
      if (manual) {
        setTimeout(() => setSyncing(false), 350);
        showToast(
          connected
            ? "Synced live FastAPI & Supabase analytics"
            : "Refreshed telemetry snapshot"
        );
      }
    },
    [backendData, daysRange]
  );

  useEffect(() => {
    fetchAllTelemetry(false);
  }, [fetchAllTelemetry]);

  const donut = dashboard?.donut || FALLBACK_DASHBOARD.donut;
  const engagement = dashboard?.engagement || FALLBACK_DASHBOARD.engagement;
  const departments =
    dashboard?.departments && dashboard.departments.length > 0
      ? dashboard.departments
      : FALLBACK_DASHBOARD.departments;
  const globalAi =
    dashboard?.global_ai_report || FALLBACK_DASHBOARD.global_ai_report;
  const tc =
    engagement?.telemetry_cards ||
    FALLBACK_DASHBOARD.engagement.telemetry_cards;

  useEffect(() => {
    if (!activeDeptId && departments.length > 0) {
      setActiveDeptId(departments[0].id);
    }
  }, [departments, activeDeptId]);

  const activeDept = useMemo(
    () => departments.find((d) => d.id === activeDeptId) || departments[0],
    [departments, activeDeptId]
  );

  const healthStats = useMemo(() => {
    const onTimeUsersList = users.filter((u) => u.status === "On-Time");
    const deadUsersList = users.filter((u) => u.status === "Dead / Inactive");
    const stalledUsersList = users.filter((u) => u.status === "Stalled");

    const onTimeCount = tc.on_time_users ?? onTimeUsersList.length;
    const deadCount = tc.dead_users ?? deadUsersList.length;
    const stalledCount = Math.max(
      0,
      stalledUsersList.length || users.length - onTimeCount - deadCount
    );
    const vitalityScore = Number(
      tc.platform_health_score ??
        Math.round((onTimeCount / Math.max(1, users.length)) * 100)
    );

    return {
      onTimeCount,
      deadCount,
      stalledCount,
      vitalityScore,
      deadUsersList,
      onTimeUsersList,
    };
  }, [tc, users]);

  const programTotals = useMemo(() => {
    const totalModules = programs.reduce(
      (s, p) => s + (p.modules?.length || 0),
      0
    );
    const totalQuizzes = programs.reduce(
      (s, p) =>
        s + (p.modules || []).reduce((ms, m) => ms + Number(m.quizzes || 0), 0),
      0
    );
    return { count: programs.length, totalModules, totalQuizzes };
  }, [programs]);

  const activeDeptUsers = useMemo(() => {
    const exact = users.filter((u) => u.departmentId === activeDept?.id);
    return exact.length > 0 ? exact : users.slice(0, 6);
  }, [users, activeDept]);

  const aiInsightsTicker = useMemo(() => {
    const sortedDepts = [...departments].sort(
      (a, b) =>
        (a.aiDeepDive?.healthScore ?? 0) - (b.aiDeepDive?.healthScore ?? 0)
    );
    const lowest = sortedDepts[0];
    const highest = sortedDepts[sortedDepts.length - 1];

    return [
      {
        tag: "DEAD USERS ALERT",
        color: "text-rose-200 border-rose-400/50 bg-rose-500/12",
        text: `${healthStats.deadCount} dormant accounts logged 0 starts. Dispatching micro-nudges lifts vitality +16%.`,
      },
      {
        tag: "TARGET GAP DETECTED",
        color: "text-amber-200 border-amber-400/50 bg-amber-500/12",
        text: `${lowest?.badge || "Department"} sits at ${
          lowest?.aiDeepDive?.healthScore ?? 0
        }% vs ${deptTargets[lowest?.id] ?? lowest?.target ?? 75}% target.`,
      },
      {
        tag: "TOP PERFORMING UNIT",
        color: "text-emerald-200 border-emerald-400/50 bg-emerald-500/12",
        text: `${highest?.badge || "Cohort"} leads platform velocity at ${
          highest?.aiDeepDive?.healthScore ?? 0
        }% attainment.`,
      },
    ];
  }, [departments, deptTargets, healthStats.deadCount]);

  useEffect(() => {
    const timer = setInterval(() => {
      setAiTipIdx((prev) => (prev + 1) % aiInsightsTicker.length);
    }, 5200);
    return () => clearInterval(timer);
  }, [aiInsightsTicker.length]);

  const normalizedEngagementSeries = useMemo(() => {
    return (engagement?.series || []).map((pt) => {
      const videos = Number(pt.videos ?? pt.videos_completed ?? 0);
      const quizzes = Number(pt.quizzes ?? pt.quizzes_taken ?? 0);
      const conversion =
        videos > 0 ? Math.min(100, Math.round((quizzes / videos) * 100)) : 0;
      return {
        date_label: pt.date_label,
        videos,
        quizzes,
        conversion,
        mastery: Number(pt.mastery ?? tc.avg_quiz_mastery ?? 76),
      };
    });
  }, [engagement, tc.avg_quiz_mastery]);

  const overallConversionPct = useMemo(() => {
    const v = Number(tc.video_completions ?? 65);
    const q = Number(tc.total_quizzes ?? 35);
    return v > 0 ? Math.min(100, Math.round((q / v) * 100)) : 0;
  }, [tc]);

  // Department Chart 1: Target Attainment Bar
  const activeDeptTarget = Number(
    deptTargets[activeDept?.id] ?? activeDept?.target ?? 75
  );
  const activeDeptActual = Number(activeDept?.aiDeepDive?.healthScore ?? 70);

  const activeDeptBarData = useMemo(() => {
    const raw = activeDept?.data || [];
    const baseScore = Number(activeDept?.aiDeepDive?.healthScore ?? 70);

    const stages = [
      { name: "Orientation", val: Math.min(98, baseScore + 22), color: "#0EA5E9" },
      { name: "Workflows", val: Math.min(96, baseScore + 14), color: "#F97316" },
      { name: "Deep Dive", val: Math.min(94, baseScore + 4), color: "#84CC16" },
      { name: "Quizzes", val: Math.max(38, baseScore - 6), color: "#EC4899" },
      { name: "Simulation", val: Math.max(32, baseScore - 14), color: "#A855F7" },
      { name: "Certify", val: Math.max(26, baseScore - 22), color: "#06B6D4" },
    ];

    return stages.map((s, idx) => {
      const match = raw[idx];
      return {
        name: s.name,
        value: match ? Number(match.value ?? s.val) : s.val,
        color: s.color,
        target: activeDeptTarget,
      };
    });
  }, [activeDept, activeDeptTarget]);

  // Department Chart 2: AI Prescription Predicted Trajectory (Baseline vs. With AI Prescription)
  
  // AI Prescription Predicted Series & Trajectory
  const prescriptionPredictedSeries = useMemo(() => {
    const base = activeDeptActual;
    const goal = Math.min(98, base + (prescriptionHorizon === "month" ? 22 : 16));
    
    if (prescriptionHorizon === "month") {
      return [
        { step: "Week 1", baseline: base, aiPredicted: base },
        { step: "Week 2", baseline: Math.min(100, base + 2), aiPredicted: Math.round(base + (goal - base) * 0.38) },
        { step: "Week 3", baseline: Math.min(100, base + 4), aiPredicted: Math.round(base + (goal - base) * 0.72) },
        { step: "Week 4", baseline: Math.min(100, base + 6), aiPredicted: goal },
      ];
    }

    return [
      { step: "Day 1", baseline: base, aiPredicted: base },
      { step: "Day 2", baseline: base, aiPredicted: Math.round(base + (goal - base) * 0.16) },
      { step: "Day 3", baseline: Math.min(100, base + 1), aiPredicted: Math.round(base + (goal - base) * 0.34) },
      { step: "Day 4", baseline: Math.min(100, base + 1), aiPredicted: Math.round(base + (goal - base) * 0.55) },
      { step: "Day 5", baseline: Math.min(100, base + 2), aiPredicted: Math.round(base + (goal - base) * 0.72) },
      { step: "Day 6", baseline: Math.min(100, base + 2), aiPredicted: Math.round(base + (goal - base) * 0.88) },
      { step: "Day 7", baseline: Math.min(100, base + 3), aiPredicted: goal },
    ];
  }, [activeDeptActual, prescriptionHorizon]);

  const predictedGain = useMemo(() => {
    const last = prescriptionPredictedSeries[prescriptionPredictedSeries.length - 1];
    return Math.max(1, (last?.aiPredicted ?? 0) - activeDeptActual);
  }, [prescriptionPredictedSeries, activeDeptActual]);

  const adjacentPolygonSeries = useMemo(() => {
    if (Array.isArray(activeDept?.radarData) && activeDept.radarData.length > 0) {
      return activeDept.radarData.map(r => ({
        stage: r.subject || r.stage || r.name,
        aiScore: Number(r.score ?? r.aiScore ?? r.value ?? 0),
      }));
    }
    return (activeDeptBarData || []).map(r => ({
      stage: r.name,
      aiScore: Number(r.value ?? 0),
    }));
  }, [activeDept, activeDeptBarData]);

  const prescriptionForecastData = useMemo(() => {
    const base = activeDeptActual;
    const goal = Math.max(activeDeptTarget + 4, Math.min(96, base + 19));
    
    if (prescriptionHorizon === "month") {
      return [
        { day: "Week 1", baseline: base, withAI: base },
        { day: "Week 2", baseline: Math.min(100, base + 2), withAI: Math.min(98, Math.round(base + (goal - base) * 0.38)) },
        { day: "Week 3", baseline: Math.min(100, base + 4), withAI: Math.min(98, Math.round(base + (goal - base) * 0.72)) },
        { day: "Week 4", baseline: Math.min(100, base + 6), withAI: Math.min(98, goal) },
      ];
    }

    // Default: "week" (7 days)
    return [
      { day: "Day 1", baseline: base, withAI: base },
      { day: "Day 2", baseline: base, withAI: Math.min(98, Math.round(base + (goal - base) * 0.15)) },
      { day: "Day 3", baseline: Math.min(100, base + 1), withAI: Math.min(98, Math.round(base + (goal - base) * 0.32)) },
      { day: "Day 4", baseline: Math.min(100, base + 1), withAI: Math.min(98, Math.round(base + (goal - base) * 0.52)) },
      { day: "Day 5", baseline: Math.min(100, base + 2), withAI: Math.min(98, Math.round(base + (goal - base) * 0.70)) },
      { day: "Day 6", baseline: Math.min(100, base + 2), withAI: Math.min(98, Math.round(base + (goal - base) * 0.86)) },
      { day: "Day 7", baseline: Math.min(100, base + 3), withAI: Math.min(98, goal) },
    ];
  }, [activeDeptActual, activeDeptTarget, prescriptionHorizon]);

  const predictedUplift =
    (prescriptionForecastData[prescriptionForecastData.length - 1]?.withAI ?? 0) -
    activeDeptActual;

  // Interactive AI Chat Handler (Grounded Hybrid PydanticAI + Deterministic Backup)
  const handleSendAiChat = async (customPrompt) => {
    const q = (customPrompt || chatInput).trim();
    if (!q) return;
    setChatInput("");
    setChatMessages((prev) => [...prev, { role: "user", text: q }]);
    setChatLoading(true);

    try {
      const data = await sendGroundedCommand(q);
      const engineTag =
        data.engine === "saarthi_ai" ? "Saarthi AI" : "Deterministic Backup";

      setChatMessages((prev) => [
        ...prev,
        { role: "ai", text: `[${engineTag}] ${data.answer}` },
      ]);

      if (data.ui_action?.switch_dept) {
        setActiveDeptId(data.ui_action.switch_dept);
        deptSectionRef.current?.scrollIntoView({ behavior: "smooth" });
      }
      if (data.queued_action) {
        showToast("Tier-3 Action Card added to Admin Approval Inbox!");
      }
    } catch {
      const lower = q.toLowerCase();
      let localAnswer = `${globalAi.executiveSummary} Prescription: ${globalAi.prescription}`;
      if (lower.includes("dead") || lower.includes("inactive")) {
        localAnswer = `Currently ${healthStats.deadCount} learners are Dead/Inactive vs ${healthStats.onTimeCount} On-Time completers. Send a +50 Curos starter bounty to revive dormant accounts.`;
      } else if (lower.includes("department") || lower.includes("target")) {
        localAnswer = departments
          .map(
            (d) =>
              `${d.badge}: ${d.aiDeepDive?.healthScore ?? 0}% (Target ${
                deptTargets[d.id] ?? d.target ?? 75
              }%)`
          )
          .join(" • ");
      } else if (lower.includes("candidate") || lower.includes("attrition")) {
        const highRiskCands = users
          .filter((u) => u.isCandidate && u.attritionRisk >= 70)
          .map((u) => `${u.name} (${u.attritionRisk}% risk)`)
          .join(", ");
        localAnswer = highRiskCands
          ? `High-Risk Candidates: ${highRiskCands}. Open their user tabs below to run the Attrition Rescue Simulator.`
          : "All tracked candidates sit within safe engagement thresholds.";
      }
      setChatMessages((prev) => [...prev, { role: "ai", text: localAnswer }]);
    } finally {
      setChatLoading(false);
    }
  };

  const openAiChatModal = () => {
    if (chatMessages.length === 0) {
      setChatMessages([
        {
          role: "ai",
          text: `Saarthi AI online. Monitoring ${departments.length} departments, ${healthStats.onTimeCount} on-time learners, and ${healthStats.deadCount} dormant accounts. Ask me anything about department targets, quiz velocity, or candidate attrition.`,
        },
      ]);
    }
    setActiveModal("ai_chat");
  };

  const handleSendNudge = async (targetLabel) => {
    try {
      await axios.post(`${API_BASE_URL}/analytics/nudge`, {
        target: targetLabel,
      });
    } catch {
      // Optimistic confirmation
    }
    showToast(`Nudge dispatched to ${targetLabel}!`);
  };

  // ==========================================================================
  // STRUCTURED 4-SECTION CSV WORKBOOK EXPORTER
  // ==========================================================================
  const handleExportCSV = () => {
    const timestamp = new Date().toLocaleString();
    const lines = [
      `"SAARTHI CURIOUS — EXECUTIVE REPORTS & ANALYTICS WORKBOOK"`,
      `"Generated At","${timestamp}"`,
      `"Reporting Window","Last ${daysRange} Days"`,
      `""`,
      `"SECTION 1: EXECUTIVE KPI & PLATFORM VITALITY SUMMARY"`,
      `"Metric","Value","Context / Benchmark"`,
      `"Active Programs","${programTotals.count}","${programTotals.totalModules} Modules • ${programTotals.totalQuizzes} Quizzes"`,
      `"Total Enrolled Users","${(tc.staff_count || 0) + (tc.student_count || 0)}","${tc.staff_count || 11} Staff / ${tc.student_count || 12} Candidates"`,
      `"Curos in Circulation","${tc.curos_in_circulation || 510}","${tc.medals_unlocked ?? 18} Shining Medals Unlocked"`,
      `"Platform Health Vitality","${healthStats.vitalityScore}%","${healthStats.onTimeCount} On-Time / ${healthStats.stalledCount} Stalled / ${healthStats.deadCount} Dead"`,
      `"Overall Completion Rate","${donut?.percentages?.completed ?? 0}%","${donut?.counts?.completed ?? 0} Completed / ${donut?.counts?.in_progress ?? 0} In Progress / ${donut?.counts?.not_started ?? 0} Not Started"`,
      `"Video to Quiz Conversion","${overallConversionPct}%","${tc.video_completions ?? 65} Videos Watched vs ${tc.total_quizzes ?? 35} Quizzes Attempted"`,
      `""`,
      `"SECTION 2: DAILY ASSESSMENT & VIDEO VELOCITY (${daysRange}D)"`,
      `"Date","Videos Watched","Quizzes Attempted","Conversion %","Avg Mastery %"`,
      ...normalizedEngagementSeries.map(
        (r) => `"${r.date_label}",${r.videos},${r.quizzes},"${r.conversion}%","${r.mastery}%"`
      ),
      `""`,
      `"SECTION 3: DEPARTMENT TARGET ATTAINMENT & AI PRESCRIPTIONS"`,
      `"Department","Actual %","Target %","Gap %","Status","AI Prescription","14-Day Forecast"`,
      ...departments.map((d) => {
        const act = Number(d.aiDeepDive?.healthScore ?? 70);
        const tgt = Number(deptTargets[d.id] ?? d.target ?? 75);
        const gap = act - tgt;
        const presc = String(d.aiDeepDive?.prescription || "").replace(/"/g, '""');
        const fore = String(d.aiDeepDive?.prediction30d || "").replace(/"/g, '""');
        return `"${d.badge}","${act}%","${tgt}%","${gap >= 0 ? `+${gap}%` : `${gap}%`}","${
          act >= tgt ? "On Target" : "Below Target"
        }","${presc}","${fore}"`;
      }),
      `""`,
      `"SECTION 4: COMPLETE PERSONNEL & CANDIDATE ROSTER"`,
      `"Name","Email","Role","Type","Progress %","Videos","Quizzes","Mastery %","Curos","Status","Attrition Risk %","AI Prescription"`,
      ...users.map((u) => {
        const presc = String(u.aiPrescription || "").replace(/"/g, '""');
        return `"${u.name}","${u.email}","${u.role}","${
          u.isCandidate ? "Candidate" : "Staff"
        }","${u.progress}%","${u.videosCompleted}/${u.totalVideos}","${u.quizzesCompleted}/${
          u.totalQuizzes
        }","${u.quizMastery}%",${u.curos},"${u.status}","${u.attritionRisk}%","${presc}"`;
      }),
    ];

    const blob = new Blob(["\uFEFF" + lines.join("\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Saarthi_Reports_Analytics_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast("Downloaded 4-Section Executive Analytics CSV!");
  };

  // ==========================================================================
  // EXECUTIVE VISUAL PDF DOSSIER GENERATOR (3 EMBEDDED SVG GRAPHS + TABLES)
  // ==========================================================================
  const handleExportPDF = () => {
    const reportDate = new Date().toLocaleString();
    const printWin = window.open("", "_blank", "width=1160,height=920");
    if (!printWin) {
      window.print();
      return;
    }

    // SVG 1: Completion Donut Chart
    const compP = Number(donut?.percentages?.completed ?? 0);
    const progP = Number(donut?.percentages?.in_progress ?? 0);
    const idleP = Number(donut?.percentages?.not_started ?? 0);
    const rad = 52;
    const circ = 2 * Math.PI * rad;
    const cLen = (compP / 100) * circ;
    const pLen = (progP / 100) * circ;

    const completionSvg = `
      <svg viewBox="0 0 340 165" width="100%" height="165" style="background:#FFFDF9;border:1.5px solid #E5DEC9;border-radius:12px;">
        <g transform="translate(88,82) rotate(-90)">
          <circle r="${rad}" fill="none" stroke="#F1ECE1" stroke-width="16"/>
          <circle r="${rad}" fill="none" stroke="#FB7185" stroke-width="16" stroke-dasharray="${circ} ${circ}"/>
          <circle r="${rad}" fill="none" stroke="#A855F7" stroke-width="16" stroke-dasharray="${pLen} ${circ}" stroke-dashoffset="${-cLen}"/>
          <circle r="${rad}" fill="none" stroke="#10B981" stroke-width="16" stroke-dasharray="${cLen} ${circ}"/>
        </g>
        <text x="88" y="84" text-anchor="middle" font-size="18" font-weight="900" fill="#0F172A">${compP}%</text>
        <text x="88" y="99" text-anchor="middle" font-size="8.5" font-weight="800" fill="#047857">COMPLETED</text>
        <rect x="172" y="34" width="10" height="10" rx="3" fill="#10B981"/><text x="188" y="43" font-size="10.5" font-weight="700" fill="#1C1917">Completed: ${donut?.counts?.completed ?? 0} (${compP}%)</text>
        <rect x="172" y="64" width="10" height="10" rx="3" fill="#A855F7"/><text x="188" y="73" font-size="10.5" font-weight="700" fill="#1C1917">In Progress: ${donut?.counts?.in_progress ?? 0} (${progP}%)</text>
        <rect x="172" y="94" width="10" height="10" rx="3" fill="#FB7185"/><text x="188" y="103" font-size="10.5" font-weight="700" fill="#1C1917">Not Started: ${donut?.counts?.not_started ?? 0} (${idleP}%)</text>
        <text x="172" y="132" font-size="9.5" font-weight="800" fill="#B45309">Total Enrollments: ${donut?.counts?.total ?? 0}</text>
      </svg>`;

    // SVG 2: Quizzes vs Videos Velocity Chart
    const maxEng = Math.max(
      1,
      ...normalizedEngagementSeries.map((r) => Math.max(r.videos, r.quizzes))
    );
    const engBars = normalizedEngagementSeries
      .map((r, i) => {
        const x = 36 + i * 44;
        const vh = Math.max(4, Math.round((r.videos / maxEng) * 105));
        const qh = Math.max(4, Math.round((r.quizzes / maxEng) * 105));
        return `
          <rect x="${x}" y="${130 - vh}" width="14" height="${vh}" rx="3" fill="#8B5CF6"/>
          <rect x="${x + 16}" y="${130 - qh}" width="14" height="${qh}" rx="3" fill="#06B6D4"/>
          <text x="${x + 15}" y="146" text-anchor="middle" font-size="8.5" font-weight="700" fill="#57534E">${r.date_label}</text>
        `;
      })
      .join("");

    const velocitySvg = `
      <svg viewBox="0 0 360 165" width="100%" height="165" style="background:#FFFDF9;border:1.5px solid #E5DEC9;border-radius:12px;">
        <line x1="28" y1="130" x2="345" y2="130" stroke="#E5DEC9"/>
        ${engBars}
        <rect x="28" y="10" width="9" height="9" rx="2" fill="#8B5CF6"/><text x="41" y="18" font-size="9" font-weight="800" fill="#4C1D95">Videos (${tc.video_completions ?? 65})</text>
        <rect x="128" y="10" width="9" height="9" rx="2" fill="#06B6D4"/><text x="141" y="18" font-size="9" font-weight="800" fill="#0E7490">Quizzes (${tc.total_quizzes ?? 35})</text>
        <text x="342" y="18" text-anchor="end" font-size="9" font-weight="800" fill="#047857">Conv: ${overallConversionPct}%</text>
      </svg>`;

    // SVG 3: Department Attainment vs Target Bars
    const deptSvgRows = departments
      .map((d, i) => {
        const y = 20 + i * 28;
        const act = Number(d.aiDeepDive?.healthScore ?? 70);
        const tgt = Number(deptTargets[d.id] ?? d.target ?? 75);
        const wAct = Math.round((act / 100) * 280);
        const xTgt = 165 + Math.round((tgt / 100) * 280);
        const col = act >= tgt ? "#059669" : act >= tgt - 15 ? "#D97706" : "#E11D48";
        return `
          <text x="14" y="${y + 11}" font-size="10" font-weight="800" fill="#1C1917">${d.badge}</text>
          <rect x="165" y="${y}" width="280" height="14" rx="5" fill="#F1ECE1"/>
          <rect x="165" y="${y}" width="${wAct}" height="14" rx="5" fill="${col}"/>
          <line x1="${xTgt}" y1="${y - 3}" x2="${xTgt}" y2="${y + 17}" stroke="#1E1B4B" stroke-width="2" stroke-dasharray="2 2"/>
          <text x="454" y="${y + 11}" font-size="10" font-weight="900" fill="${col}">${act}% / ${tgt}%</text>
        `;
      })
      .join("");

    const deptSvg = `
      <svg viewBox="0 0 540 ${Math.max(120, departments.length * 28 + 30)}" width="100%" style="background:#FFFDF9;border:1.5px solid #E5DEC9;border-radius:12px;">
        ${deptSvgRows}
      </svg>`;

    const deptRowsHtml = departments
      .map((d) => {
        const act = Number(d.aiDeepDive?.healthScore ?? 70);
        const tgt = Number(deptTargets[d.id] ?? d.target ?? 75);
        return `
          <tr>
            <td><strong>${d.badge}</strong><br/><span style="font-size:10px;color:#64748B;">${d.title}</span></td>
            <td style="text-align:center;font-weight:900;">${act}%</td>
            <td style="text-align:center;font-weight:700;">${tgt}%</td>
            <td style="text-align:center;"><span class="badge ${act >= tgt ? "ok" : "warn"}">${
          act >= tgt ? "On Target" : `Gap -${tgt - act}%`
        }</span></td>
            <td style="font-size:10.5px;">${d.aiDeepDive?.prescription || ""}</td>
          </tr>`;
      })
      .join("");

    const userRowsHtml = users
      .map(
        (u) => `
        <tr>
          <td><strong>${u.name}</strong><br/><span style="font-size:9.5px;color:#64748B;">${u.email}</span></td>
          <td>${u.role}</td>
          <td style="text-align:center;">${u.videosCompleted}/${u.totalVideos}</td>
          <td style="text-align:center;">${u.quizzesCompleted}/${u.totalQuizzes}</td>
          <td style="text-align:center;font-weight:800;">${u.quizMastery}%</td>
          <td style="text-align:center;font-weight:800;color:#B45309;">${u.curos}</td>
          <td style="text-align:center;"><span class="badge ${
            u.status === "On-Time" ? "ok" : u.status === "Dead / Inactive" ? "risk" : "warn"
          }">${u.status}</span></td>
        </tr>`
      )
      .join("");

    printWin.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Saarthi Curious — Executive Reports & Analytics Dossier</title>
        <style>
          @page { size: A4 portrait; margin: 12mm; }
          * { box-sizing: border-box; font-family: 'Segoe UI', Inter, Roboto, sans-serif; }
          body { margin: 0; padding: 24px; background: #FAF7F0; color: #1C1917; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .hero { background: linear-gradient(135deg, #130F28 0%, #1F173D 60%, #2D1F10 100%); color: #FFF; padding: 22px 26px; border-radius: 16px; border-bottom: 4px solid #F59E0B; display: flex; justify-content: space-between; align-items: center; }
          .hero h1 { margin: 0; font-size: 21px; font-weight: 900; }
          .hero p { margin: 4px 0 0; font-size: 11px; color: #CBD5E1; }
          .kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin: 16px 0; }
          .kpi { background: #FFFDF9; border: 1.5px solid #E5DEC9; border-radius: 12px; padding: 12px; }
          .kpi span { font-size: 9px; font-weight: 800; text-transform: uppercase; color: #78716C; display: block; }
          .kpi strong { font-size: 20px; font-weight: 900; margin-top: 3px; display: block; }
          .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin: 14px 0; }
          .box { background: #FFFDF9; border: 1.5px solid #E5DEC9; border-radius: 14px; padding: 12px; }
          .box h3 { margin: 0 0 8px; font-size: 11px; font-weight: 900; text-transform: uppercase; color: #44403C; }
          h2 { font-size: 12.5px; font-weight: 900; text-transform: uppercase; color: #1C1917; margin: 18px 0 8px; border-left: 4px solid #D97706; padding-left: 10px; }
          table { width: 100%; border-collapse: collapse; background: #FFFDF9; border: 1.5px solid #E5DEC9; border-radius: 10px; overflow: hidden; font-size: 10.5px; margin-bottom: 12px; }
          th { background: #F3EFE6; color: #44403C; text-align: left; padding: 8px 9px; font-size: 9px; font-weight: 900; text-transform: uppercase; border-bottom: 1.5px solid #E5DEC9; }
          td { padding: 7px 9px; border-bottom: 1px solid #F1ECE1; vertical-align: middle; }
          .badge { padding: 2px 7px; border-radius: 999px; font-size: 9px; font-weight: 800; display: inline-block; }
          .badge.ok { background: #D1FAE5; color: #047857; }
          .badge.warn { background: #FEF3C7; color: #B45309; }
          .badge.risk { background: #FFE4E6; color: #BE123C; }
          .ai-box { background: #ECFDF5; border: 1.5px solid #6EE7B7; border-radius: 12px; padding: 12px 16px; font-size: 11px; color: #064E3B; line-height: 1.55; margin-top: 12px; }
          @media print { body { padding: 0; background: #FFF; } }
        </style>
      </head>
      <body>
        <div class="hero">
          <div>
            <h1>Saarthi Curious — Executive Reports &amp; Analytics Dossier</h1>
            <p>Window: Last ${daysRange} Days • Generated ${reportDate}</p>
          </div>
          <div style="text-align:right;">
            <div style="font-size:9.5px;color:#FDE68A;font-weight:800;">PLATFORM VITALITY</div>
            <div style="font-size:20px;font-weight:900;color:#6EE7B7;">${healthStats.vitalityScore}% Health • ${tc.curos_in_circulation || 510} Curos</div>
          </div>
        </div>

        <div class="kpis">
          <div class="kpi"><span>Curriculum</span><strong style="color:#6D28D9;">${programTotals.count} Programs</strong></div>
          <div class="kpi"><span>Users Cohort</span><strong style="color:#0369A1;">${(tc.staff_count || 0) + (tc.student_count || 0)} Enrolled</strong></div>
          <div class="kpi"><span>Curos &amp; Rewards</span><strong style="color:#B45309;">${tc.curos_in_circulation || 510} Curos</strong></div>
          <div class="kpi"><span>On-Time vs Dead</span><strong style="color:#BE123C;">${healthStats.onTimeCount} / ${healthStats.deadCount}</strong></div>
        </div>

        <div class="grid2">
          <div class="box"><h3>1. Overall Completion Funnel</h3>${completionSvg}</div>
          <div class="box"><h3>2. Quizzes Attempted vs. Videos Watched</h3>${velocitySvg}</div>
        </div>

        <h2>3. Departmental Target Attainment vs. SLA Benchmark</h2>
        <div class="box" style="margin-bottom:12px;">${deptSvg}</div>
        <table>
          <thead><tr><th>Department</th><th style="text-align:center;">Actual</th><th style="text-align:center;">Target</th><th style="text-align:center;">Status</th><th>AI Prescription</th></tr></thead>
          <tbody>${deptRowsHtml}</tbody>
        </table>

        <h2>4. Personnel &amp; Candidate Performance Roster (${users.length} Users)</h2>
        <table>
          <thead><tr><th>User</th><th>Role</th><th style="text-align:center;">Videos</th><th style="text-align:center;">Quizzes</th><th style="text-align:center;">Mastery</th><th style="text-align:center;">Curos</th><th style="text-align:center;">Status</th></tr></thead>
          <tbody>${userRowsHtml}</tbody>
        </table>

        <div class="ai-box">
          <strong>Global AI Executive Summary &amp; Prescription:</strong><br/>
          ${globalAi.executiveSummary}<br/>
          <strong>Recommended Action:</strong> ${globalAi.prescription} (${globalAi.prediction30d})
        </div>

        <script>window.onload = function(){ setTimeout(function(){ window.print(); }, 400); };</script>
      </body>
      </html>
    `);
    printWin.document.close();
    showToast("Generated Visual Executive PDF Report with Embedded Graphs!");
  };

  // Simulated Candidate Attrition Risk inside User Detail Modal
  const simulatedUserRisk = useMemo(() => {
    if (!selectedUser) return 0;
    return Math.max(
      8,
      selectedUser.attritionRisk -
        (attritionToggles.microVideo ? 22 : 0) -
        (attritionToggles.peerBuddy ? 18 : 0) -
        (attritionToggles.bonusCuros ? 15 : 0)
    );
  }, [selectedUser, attritionToggles]);

  const selectedUserChartData = useMemo(() => {
    if (!selectedUser) return [];
    const vidPct = Math.round(
      (selectedUser.videosCompleted / Math.max(1, selectedUser.totalVideos)) * 100
    );
    const quizPct = Math.round(
      (selectedUser.quizzesCompleted / Math.max(1, selectedUser.totalQuizzes)) * 100
    );
    return [
      { metric: "Progress", value: selectedUser.progress, fill: "#22D3EE" },
      { metric: "Videos %", value: vidPct, fill: "#C084FC" },
      { metric: "Quizzes %", value: quizPct, fill: "#F59E0B" },
      { metric: "Mastery", value: selectedUser.quizMastery, fill: "#34D399" },
    ];
  }, [selectedUser]);

  const userTabVariants = [
    "perm-user-tab-cyan",
    "perm-user-tab-amber",
    "perm-user-tab-purple",
    "perm-user-tab-emerald",
    "perm-user-tab-rose",
  ];

  const userBtnVariants = [
    "obsidian-btn-cyan",
    "obsidian-btn-amber",
    "obsidian-btn-purple",
    "obsidian-btn-emerald",
    "obsidian-btn-rose",
  ];

  if (loading) {
    return (
      <MainLayout dark={true}>
        <div className="-m-4 sm:-m-6 p-5 sm:p-7 min-h-screen font-sans flex flex-col items-center justify-center bg-[#07060F] text-slate-100 relative overflow-hidden select-none">
          <style>{`
            @keyframes indeterminateSlide {
              0% { transform: translateX(-100%); }
              50% { transform: translateX(80%); }
              100% { transform: translateX(220%); }
            }
            .animate-indeterminate-slide {
              animation: indeterminateSlide 1.75s ease-in-out infinite;
            }
            @keyframes aiRobotFloat {
              0%, 100% { transform: translateY(0px) rotate(0deg); }
              50%      { transform: translateY(-7px) rotate(1.5deg); }
            }
            .animate-ai-float { animation: aiRobotFloat 3.6s ease-in-out infinite; }
          `}</style>

          {/* Ambient Glowing Orbs */}
          <div className="pointer-events-none absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] bg-amber-500/15 rounded-full blur-[140px]" />
          <div className="pointer-events-none absolute bottom-12 right-1/4 w-[460px] h-[460px] bg-purple-700/18 rounded-full blur-[140px]" />

          {/* Central Holographic Loading Card */}
          <div className="relative z-10 max-w-lg w-full p-8 sm:p-10 rounded-3xl bg-[#0D0A1C]/92 border border-amber-400/50 shadow-[0_24px_70px_rgba(0,0,0,0.9),0_0_40px_rgba(245,158,11,0.25)] flex flex-col items-center text-center space-y-6 backdrop-blur-2xl">
            {/* Pulsing Avatar with Gold Aura */}
            <div className="relative">
              <div className="absolute -inset-4 rounded-full bg-gradient-to-tr from-amber-400/35 via-purple-600/30 to-amber-300/20 blur-2xl animate-pulse" />
              <img
                src={aiAvatarUrl}
                alt="Saarthi AI Telemetry"
                className="w-32 h-32 object-contain animate-ai-float drop-shadow-[0_0_26px_rgba(251,191,36,0.65)] relative z-10"
                onError={(e) => {
                  e.currentTarget.src = "/saarthi-robot.png";
                }}
              />
            </div>

            {/* Title & Status */}
            <div className="space-y-2.5">
              <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.25em] bg-amber-500/20 text-amber-200 border border-amber-300/60 inline-flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                <span>Connecting to Live Database</span>
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Synthesizing Reports &amp; Analytics
              </h2>
              <p className="text-xs text-slate-300 max-w-sm leading-relaxed">
                Compiling live learner cohort telemetry, department velocity, and AI prescriptions from the database. It can take a few moments to compute...
              </p>
            </div>

            {/* Glowing Indeterminate Progress Bar */}
            <div className="w-full space-y-2.5">
              <div className="w-full h-2.5 rounded-full bg-white/10 overflow-hidden relative border border-amber-400/35">
                <div className="h-full bg-gradient-to-r from-amber-400 via-purple-500 to-cyan-400 rounded-full animate-indeterminate-slide w-3/5" />
              </div>
              <div className="flex justify-between items-center text-[10.5px] text-amber-200/80 font-mono">
                <span>FastAPI Telemetry Engine</span>
                <span className="animate-pulse">Live Querying...</span>
              </div>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout dark={true}>
      <div className="-m-4 sm:-m-6 p-5 sm:p-7 min-h-screen font-sans space-y-7 overflow-x-hidden overflow-y-auto scroll-smooth reports-scroll-container bg-[#07060F] text-slate-100 selection:bg-amber-400 selection:text-slate-950 relative">
      {/* =====================================================================
          PREMIUM + DIGITAL REPORTS CSS ARCHITECTURE
          1. Hero Banner: Live Random Golden Shining Border MASKED OUT on the
             Right Side so it NEVER travels over the uploaded right-side PNG!
          2. Restored Anodized Metallic KPI Cards
          3. Standard Panels: Clean Visible Default Borders -> Illuminated Hover
          4. Department User Tabs: Candidate-Attrition Style (Dim Plum Vault +
             20s Long-Stay Smooth Colour Drift)
      ===================================================================== */}
      <style>{`
        @property --gold-x1 { syntax: "<percentage>"; inherits: false; initial-value: 12%; }
        @property --gold-y1 { syntax: "<percentage>"; inherits: false; initial-value: 10%; }
        @property --gold-x2 { syntax: "<percentage>"; inherits: false; initial-value: 60%; }
        @property --gold-y2 { syntax: "<percentage>"; inherits: false; initial-value: 88%; }
        @property --gold-x3 { syntax: "<percentage>"; inherits: false; initial-value: 34%; }
        @property --gold-y3 { syntax: "<percentage>"; inherits: false; initial-value: 94%; }

        /* Random non-looping wander restricted to 0%-70% X for Hero Banner */
        @keyframes heroGoldWanderA {
          0%   { --gold-x1: 8%;  --gold-y1: 6%;  }
          26%  { --gold-x1: 62%; --gold-y1: 12%; }
          54%  { --gold-x1: 48%; --gold-y1: 94%; }
          78%  { --gold-x1: 6%;  --gold-y1: 76%; }
          100% { --gold-x1: 8%;  --gold-y1: 6%;  }
        }
        @keyframes heroGoldWanderB {
          0%   { --gold-x2: 58%; --gold-y2: 92%; }
          32%  { --gold-x2: 10%; --gold-y2: 44%; }
          66%  { --gold-x2: 44%; --gold-y2: 4%;  }
          100% { --gold-x2: 58%; --gold-y2: 92%; }
        }
        @keyframes heroGoldWanderC {
          0%   { --gold-x3: 28%; --gold-y3: 96%; }
          35%  { --gold-x3: 66%; --gold-y3: 18%; }
          72%  { --gold-x3: 4%;  --gold-y3: 24%; }
          100% { --gold-x3: 28%; --gold-y3: 96%; }
        }

        @keyframes ecgHeartbeatWave {
          0%   { stroke-dashoffset: 280; }
          100% { stroke-dashoffset: 0; }
        }
        @keyframes heartPulseLubDub {
          0%, 100% { transform: scale(1); }
          15%      { transform: scale(1.26); }
          30%      { transform: scale(1); }
          45%      { transform: scale(1.18); }
          70%      { transform: scale(1); }
        }
        @keyframes aiRobotFloat {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50%      { transform: translateY(-7px) rotate(1.5deg); }
        }
        .animate-ecg-wave { stroke-dasharray: 280; animation: ecgHeartbeatWave 2.2s linear infinite; }
        .animate-heart-pulse { animation: heartPulseLubDub 1.35s ease-in-out infinite; }
        .animate-ai-float { animation: aiRobotFloat 3.6s ease-in-out infinite; }

        /* 1. HERO BANNER WITH RIGHT-EXCLUDED LIVE GOLDEN SHINING BORDER */
        .reports-hero-shell {
          position: relative;
          overflow: hidden;
          border-radius: 1.5rem;
          background:
            radial-gradient(ellipse 46% 70% at 14% 20%, rgba(245, 196, 81, 0.14) 0%, transparent 66%),
            radial-gradient(ellipse 45% 75% at 52% 90%, rgba(139, 92, 246, 0.16) 0%, transparent 68%),
            linear-gradient(125deg, #120E24 0%, #0D0C1C 52%, #080814 100%);
          box-shadow:
            0 22px 54px rgba(0, 0, 0, 0.88),
            0 0 36px -10px rgba(245, 196, 81, 0.28);
        }

        /* Mask wrapper cuts the live border off cleanly before the right PNG zone */
        .reports-hero-border-mask {
          position: absolute;
          inset: 0;
          border-radius: inherit;
          pointer-events: none;
          z-index: 15;
          -webkit-mask-image: linear-gradient(90deg, #000 0%, #000 48%, rgba(0, 0, 0, 0.2) 54%, transparent 60%);
        }

        .reports-hero-live-gold-rim {
          position: absolute;
          inset: 0;
          border-radius: inherit;
          padding: 2.2px;
          background:
            radial-gradient(ellipse 38% 58% at var(--gold-x1) var(--gold-y1), #FFFFFF 0%, #FEF08A 26%, transparent 68%),
            radial-gradient(ellipse 42% 60% at var(--gold-x2) var(--gold-y2), #FDE047 0%, #F59E0B 32%, transparent 70%),
            radial-gradient(ellipse 36% 52% at var(--gold-x3) var(--gold-y3), #FFFBEB 0%, #EAB308 28%, transparent 68%),
            linear-gradient(135deg, rgba(254, 240, 138, 0.72) 0%, rgba(180, 128, 30, 0.42) 45%, rgba(245, 196, 81, 0.7) 100%);
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          animation:
            heroGoldWanderA 9.4s ease-in-out infinite,
            heroGoldWanderB 13.6s ease-in-out infinite,
            heroGoldWanderC 17.2s ease-in-out infinite;
        }

        /* =====================================================================
           LOGIN-STYLE LIVE GOLDEN + BASE-COLOUR BORDERS ON DEEP DARK KPI CARDS
           3 independent roaming highlights (9.4s / 13.6s / 17.4s) per card
        ===================================================================== */
        @property --k1x { syntax: "<percentage>"; inherits: false; initial-value: 14%; }
        @property --k1y { syntax: "<percentage>"; inherits: false; initial-value: 10%; }
        @property --k2x { syntax: "<percentage>"; inherits: false; initial-value: 86%; }
        @property --k2y { syntax: "<percentage>"; inherits: false; initial-value: 84%; }
        @property --k3x { syntax: "<percentage>"; inherits: false; initial-value: 50%; }
        @property --k3y { syntax: "<percentage>"; inherits: false; initial-value: 96%; }

        @keyframes kpiLoginDriftA {
          0%   { --k1x: 12%; --k1y: 8%;  }
          23%  { --k1x: 78%; --k1y: 92%; }
          49%  { --k1x: 92%; --k1y: 24%; }
          74%  { --k1x: 18%; --k1y: 80%; }
          100% { --k1x: 12%; --k1y: 8%;  }
        }

        @keyframes kpiLoginDriftB {
          0%   { --k2x: 88%; --k2y: 86%; }
          28%  { --k2x: 14%; --k2y: 42%; }
          56%  { --k2x: 68%; --k2y: 6%;  }
          82%  { --k2x: 94%; --k2y: 64%; }
          100% { --k2x: 88%; --k2y: 86%; }
        }

        @keyframes kpiLoginDriftC {
          0%   { --k3x: 48%; --k3y: 96%; }
          31%  { --k3x: 90%; --k3y: 12%; }
          63%  { --k3x: 8%;  --k3y: 88%; }
          87%  { --k3x: 34%; --k3y: 4%;  }
          100% { --k3x: 48%; --k3y: 96%; }
        }

        .login-gold-kpi {
          position: relative;
          isolation: isolate;
          overflow: hidden;
          border-radius: 1.25rem;
          border: 2.2px solid transparent;
          background-clip: padding-box, border-box, border-box, border-box, border-box;
          background-origin: padding-box, border-box, border-box, border-box, border-box;
          transition: transform 0.24s cubic-bezier(0.22, 1, 0.36, 1),
            box-shadow 0.24s ease;
        }
        .login-gold-kpi:hover {
          transform: translateY(-4px);
        }

        /* Subtle dark top-corner glass depth inside every dark card */
        .login-gold-kpi::before {
          content: "";
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 0;
          background: radial-gradient(
            ellipse 70% 55% at 12% 0%,
            rgba(255, 255, 255, 0.06) 0%,
            transparent 65%
          );
        }

        /* KPI 1: DEEP DARK AMETHYST BASE + LIVE GOLDEN & VIOLET BORDER */
        .kpi-dark-amethyst {
          background-image:
            linear-gradient(158deg, #130B24 0%, #0B0615 55%, #07040E 100%),
            radial-gradient(ellipse 62% 54% at var(--k1x) var(--k1y), #FFFFFF 0%, #FEF08A 24%, transparent 64%),
            radial-gradient(ellipse 68% 58% at var(--k2x) var(--k2y), #E9D5FF 0%, #A855F7 32%, transparent 66%),
            radial-gradient(ellipse 58% 58% at var(--k3x) var(--k3y), #FFFBEB 0%, #F59E0B 30%, transparent 64%),
            linear-gradient(135deg, #D4AF37 0%, #6D28D9 38%, #FDE68A 68%, #9333EA 100%);
          animation:
            kpiLoginDriftA 9.4s ease-in-out infinite,
            kpiLoginDriftB 13.6s ease-in-out infinite,
            kpiLoginDriftC 17.4s ease-in-out infinite;
          box-shadow:
            0 16px 38px rgba(0, 0, 0, 0.85),
            0 0 22px -6px rgba(245, 196, 81, 0.32),
            0 0 26px -8px rgba(168, 85, 247, 0.36);
        }
        .kpi-dark-amethyst:hover {
          box-shadow:
            0 20px 46px rgba(0, 0, 0, 0.92),
            0 0 30px -4px rgba(253, 224, 71, 0.48),
            0 0 34px -6px rgba(192, 132, 252, 0.5);
        }

        /* KPI 2: DEEP DARK SAPPHIRE BASE + LIVE GOLDEN & CYAN BORDER */
        .kpi-dark-sapphire {
          background-image:
            linear-gradient(158deg, #081826 0%, #050F1A 55%, #030911 100%),
            radial-gradient(ellipse 62% 54% at var(--k1x) var(--k1y), #FFFFFF 0%, #FEF08A 24%, transparent 64%),
            radial-gradient(ellipse 68% 58% at var(--k2x) var(--k2y), #BAE6FD 0%, #0EA5E9 32%, transparent 66%),
            radial-gradient(ellipse 58% 58% at var(--k3x) var(--k3y), #FFFBEB 0%, #F59E0B 30%, transparent 64%),
            linear-gradient(135deg, #D4AF37 0%, #0284C7 38%, #FDE68A 68%, #22D3EE 100%);
          animation:
            kpiLoginDriftA 10.2s ease-in-out -2.8s infinite,
            kpiLoginDriftB 14.4s ease-in-out -5.1s infinite,
            kpiLoginDriftC 18.2s ease-in-out -1.9s infinite;
          box-shadow:
            0 16px 38px rgba(0, 0, 0, 0.85),
            0 0 22px -6px rgba(245, 196, 81, 0.32),
            0 0 26px -8px rgba(34, 211, 238, 0.34);
        }
        .kpi-dark-sapphire:hover {
          box-shadow:
            0 20px 46px rgba(0, 0, 0, 0.92),
            0 0 30px -4px rgba(253, 224, 71, 0.48),
            0 0 34px -6px rgba(56, 189, 248, 0.5);
        }

        /* KPI 3: DEEP DARK OBSIDIAN-BRONZE BASE + LIVE 24K GOLD & AMBER BORDER */
        .kpi-dark-bronze {
          background-image:
            linear-gradient(158deg, #1A1207 0%, #100B04 55%, #090602 100%),
            radial-gradient(ellipse 62% 54% at var(--k1x) var(--k1y), #FFFFFF 0%, #FEF9C3 24%, transparent 64%),
            radial-gradient(ellipse 68% 58% at var(--k2x) var(--k2y), #FDE047 0%, #D97706 32%, transparent 66%),
            radial-gradient(ellipse 58% 58% at var(--k3x) var(--k3y), #FFFBEB 0%, #EAB308 30%, transparent 64%),
            linear-gradient(135deg, #FEF08A 0%, #92400E 38%, #FACC15 68%, #B45309 100%);
          animation:
            kpiLoginDriftA 9.8s ease-in-out -5.5s infinite reverse,
            kpiLoginDriftB 13.9s ease-in-out -2.2s infinite,
            kpiLoginDriftC 17.8s ease-in-out -7.1s infinite;
          box-shadow:
            0 16px 38px rgba(0, 0, 0, 0.85),
            0 0 26px -6px rgba(250, 204, 21, 0.4);
        }
        .kpi-dark-bronze:hover {
          box-shadow:
            0 20px 46px rgba(0, 0, 0, 0.92),
            0 0 36px -4px rgba(253, 224, 71, 0.58);
        }

        /* KPI 4: DEEP DARK CRIMSON BASE + LIVE GOLDEN & RUBY-CRIMSON BORDER */
        .kpi-dark-crimson {
          background-image:
            linear-gradient(158deg, #210710 0%, #14040A 55%, #0B0205 100%),
            radial-gradient(ellipse 62% 54% at var(--k1x) var(--k1y), #FFFFFF 0%, #FEF08A 24%, transparent 64%),
            radial-gradient(ellipse 68% 58% at var(--k2x) var(--k2y), #FECDD3 0%, #E11D48 32%, transparent 66%),
            radial-gradient(ellipse 58% 58% at var(--k3x) var(--k3y), #FFFBEB 0%, #F59E0B 30%, transparent 64%),
            linear-gradient(135deg, #D4AF37 0%, #9F1239 38%, #FDE68A 68%, #F43F5E 100%);
          animation:
            kpiLoginDriftA 10.6s ease-in-out -4.2s infinite,
            kpiLoginDriftB 14.8s ease-in-out -8.1s infinite reverse,
            kpiLoginDriftC 18.6s ease-in-out -3.4s infinite;
          box-shadow:
            0 16px 38px rgba(0, 0, 0, 0.85),
            0 0 22px -6px rgba(245, 196, 81, 0.34),
            0 0 28px -8px rgba(225, 29, 72, 0.42);
        }
        .kpi-dark-crimson:hover {
          box-shadow:
            0 20px 46px rgba(0, 0, 0, 0.92),
            0 0 30px -4px rgba(253, 224, 71, 0.48),
            0 0 36px -6px rgba(251, 113, 133, 0.55);
        }

        /* Reports Tab Full Smooth Vertical Scrolling */
        .reports-scroll-container {
          height: 100vh;
          max-height: 100vh;
          overflow-y: auto !important;
          overflow-x: hidden !important;
          -webkit-overflow-scrolling: touch;
          scroll-behavior: smooth;
          scrollbar-width: thin;
          scrollbar-color: rgba(245, 158, 11, 0.45) #080711;
        }
        .reports-scroll-container::-webkit-scrollbar {
          width: 8px;
        }
        .reports-scroll-container::-webkit-scrollbar-track {
          background: #080711;
        }
        .reports-scroll-container::-webkit-scrollbar-thumb {
          background: rgba(245, 158, 11, 0.45);
          border-radius: 9999px;
        }
        .reports-scroll-container::-webkit-scrollbar-thumb:hover {
          background: rgba(245, 158, 11, 0.8);
        }

        /* 3. STANDARD GRAPH PANELS (CLEAR VISIBLE DEFAULT BORDER -> GLOW ON HOVER) */
        .reports-panel {
          position: relative;
          background: linear-gradient(165deg, #131125 0%, #0C0B18 60%, #080712 100%);
          border-radius: 1.5rem;
          transition: transform 0.24s cubic-bezier(0.22, 1, 0.36, 1),
            border-color 0.24s ease, box-shadow 0.24s ease;
        }
        .reports-border-purple {
          border: 1.5px solid rgba(192, 132, 252, 0.48);
          box-shadow: 0 14px 36px rgba(0, 0, 0, 0.78);
        }
        .reports-border-purple:hover {
          transform: translateY(-2px);
          border-color: #E9D5FF;
          box-shadow: 0 18px 44px rgba(0, 0, 0, 0.88), 0 0 28px -4px rgba(168, 85, 247, 0.48);
        }

        .reports-border-cyan {
          border: 1.5px solid rgba(34, 211, 238, 0.48);
          box-shadow: 0 14px 36px rgba(0, 0, 0, 0.78);
        }
        .reports-border-cyan:hover {
          transform: translateY(-2px);
          border-color: #A5F3FC;
          box-shadow: 0 18px 44px rgba(0, 0, 0, 0.88), 0 0 28px -4px rgba(34, 211, 238, 0.48);
        }

        .reports-border-amber {
          border: 1.5px solid rgba(251, 191, 36, 0.5);
          box-shadow: 0 14px 36px rgba(0, 0, 0, 0.78);
        }
        .reports-border-amber:hover {
          border-color: #FEF08A;
          box-shadow: 0 18px 44px rgba(0, 0, 0, 0.88), 0 0 28px -4px rgba(245, 158, 11, 0.48);
        }

        /* 4. MODAL SUB-TABS (CRISP 2PX VISIBLE BORDERS + BRIGHT CONTRAST) */
        .modal-tab-border-cyan    { background: #0B1120; border: 1.8px solid rgba(34, 211, 238, 0.8); box-shadow: 0 0 16px -4px rgba(34, 211, 238, 0.26); }
        .modal-tab-border-amber   { background: #0B1120; border: 1.8px solid rgba(251, 191, 36, 0.82); box-shadow: 0 0 16px -4px rgba(245, 158, 11, 0.26); }
        .modal-tab-border-purple  { background: #0B1120; border: 1.8px solid rgba(192, 132, 252, 0.8); box-shadow: 0 0 16px -4px rgba(168, 85, 247, 0.26); }
        .modal-tab-border-emerald { background: #0B1120; border: 1.8px solid rgba(52, 211, 153, 0.8); box-shadow: 0 0 16px -4px rgba(16, 185, 129, 0.26); }
        .modal-tab-border-rose    { background: #0B1120; border: 1.8px solid rgba(251, 113, 133, 0.82); box-shadow: 0 0 16px -4px rgba(244, 63, 94, 0.28); }

        /* 5. CANDIDATE-ATTRITION STYLE USER TABS (DIM PLUM VAULT + 20s LONG-STAY COLOUR DRIFT) */
        .dim-plum-users-vault {
          position: relative;
          overflow: hidden;
          background:
            radial-gradient(circle at 86% 14%, rgba(192, 132, 252, 0.1) 0%, transparent 62%),
            linear-gradient(145deg, #1E1A35 0%, #131122 52%, #0A0914 100%);
          border: 1.5px solid rgba(192, 132, 252, 0.45);
          box-shadow: 0 16px 38px rgba(0, 0, 0, 0.78);
        }

        @keyframes longStayAccentDrift {
          0%       { background-position: 8% 12%, 88% 82%, 50% 50%; }
          15%, 45% { background-position: 92% 28%, 12% 76%, 50% 50%; }
          53%      { background-position: 50% 50%, 50% 50%, 50% 50%; }
          62%, 88% { background-position: 24% 88%, 82% 16%, 50% 50%; }
          100%     { background-position: 8% 12%, 88% 82%, 50% 50%; }
        }

        .perm-user-tab-cyan,
        .perm-user-tab-amber,
        .perm-user-tab-purple,
        .perm-user-tab-emerald,
        .perm-user-tab-rose {
          position: relative;
          background-size: 240% 240%, 240% 240%, 100% 100%;
          animation: longStayAccentDrift 20s ease-in-out infinite;
          transition: transform 0.24s cubic-bezier(0.22, 1, 0.36, 1),
            box-shadow 0.24s ease, border-color 0.24s ease;
        }
        .perm-user-tab-cyan {
          background-image:
            radial-gradient(circle at 22% 24%, rgba(34, 211, 238, 0.34) 0%, rgba(6, 182, 212, 0.14) 42%, transparent 66%),
            radial-gradient(circle at 80% 78%, rgba(56, 189, 248, 0.28) 0%, transparent 65%),
            linear-gradient(155deg, #10263F 0%, #0A1728 58%, #070E1A 100%);
          border: 1.8px solid rgba(56, 189, 248, 0.78);
          box-shadow: 0 10px 26px rgba(0, 0, 0, 0.8);
        }
        .perm-user-tab-cyan:hover { transform: translateY(-4px); border-color: #A5F3FC; box-shadow: 0 14px 32px rgba(0,0,0,0.88), 0 0 24px -4px rgba(34,211,238,0.45); }

        .perm-user-tab-amber {
          background-image:
            radial-gradient(circle at 22% 24%, rgba(250, 204, 21, 0.32) 0%, rgba(245, 158, 11, 0.14) 42%, transparent 66%),
            radial-gradient(circle at 80% 78%, rgba(217, 119, 6, 0.28) 0%, transparent 65%),
            linear-gradient(155deg, #2E2113 0%, #1C140C 58%, #110C09 100%);
          border: 1.8px solid rgba(251, 191, 36, 0.78);
          box-shadow: 0 10px 26px rgba(0, 0, 0, 0.8);
        }
        .perm-user-tab-amber:hover { transform: translateY(-4px); border-color: #FEF08A; box-shadow: 0 14px 32px rgba(0,0,0,0.88), 0 0 24px -4px rgba(245,158,11,0.45); }

        .perm-user-tab-purple {
          background-image:
            radial-gradient(circle at 22% 24%, rgba(192, 132, 252, 0.34) 0%, rgba(147, 51, 234, 0.16) 42%, transparent 66%),
            radial-gradient(circle at 80% 78%, rgba(139, 92, 246, 0.3) 0%, transparent 65%),
            linear-gradient(155deg, #271942 0%, #17102B 58%, #0D0919 100%);
          border: 1.8px solid rgba(192, 132, 252, 0.8);
          box-shadow: 0 10px 26px rgba(0, 0, 0, 0.8);
        }
        .perm-user-tab-purple:hover { transform: translateY(-4px); border-color: #F3E8FF; box-shadow: 0 14px 32px rgba(0,0,0,0.88), 0 0 24px -4px rgba(168,85,247,0.48); }

        .perm-user-tab-emerald {
          background-image:
            radial-gradient(circle at 22% 24%, rgba(52, 211, 153, 0.32) 0%, rgba(16, 185, 129, 0.14) 42%, transparent 66%),
            radial-gradient(circle at 80% 78%, rgba(5, 150, 105, 0.28) 0%, transparent 65%),
            linear-gradient(155deg, #0F2E28 0%, #091C19 58%, #06100F 100%);
          border: 1.8px solid rgba(52, 211, 153, 0.78);
          box-shadow: 0 10px 26px rgba(0, 0, 0, 0.8);
        }
        .perm-user-tab-emerald:hover { transform: translateY(-4px); border-color: #A7F3D0; box-shadow: 0 14px 32px rgba(0,0,0,0.88), 0 0 24px -4px rgba(16,185,129,0.45); }

        .perm-user-tab-rose {
          background-image:
            radial-gradient(circle at 22% 24%, rgba(251, 113, 133, 0.33) 0%, rgba(225, 29, 72, 0.15) 42%, transparent 66%),
            radial-gradient(circle at 80% 78%, rgba(244, 63, 94, 0.28) 0%, transparent 65%),
            linear-gradient(155deg, #321627 0%, #1E0D18 58%, #11080E 100%);
          border: 1.8px solid rgba(251, 113, 133, 0.78);
          box-shadow: 0 10px 26px rgba(0, 0, 0, 0.8);
        }
        .perm-user-tab-rose:hover { transform: translateY(-4px); border-color: #FECDD3; box-shadow: 0 14px 32px rgba(0,0,0,0.88), 0 0 24px -4px rgba(244,63,94,0.45); }

        /* 6. HIGH-CONTRAST VELVET-SATIN BUTTONS */
        .obsidian-btn {
          border: 1.5px solid transparent;
          background-clip: padding-box, border-box;
          background-origin: padding-box, border-box;
          transition: transform 0.18s ease, filter 0.18s ease, box-shadow 0.18s ease;
        }
        .obsidian-btn:hover { transform: translateY(-1.5px); filter: brightness(1.08); }
        .obsidian-btn-gold {
          background-image: linear-gradient(180deg, #FEF08A 0%, #FACC15 52%, #CA8A04 100%), linear-gradient(135deg, #FFFFFF 0%, #FEF08A 60%, #B45309 100%);
          color: #0F172A !important;
          box-shadow: 0 5px 16px rgba(234, 179, 8, 0.4);
        }
        .obsidian-btn-cyan {
          background-image: linear-gradient(180deg, #0E7490 0%, #095269 100%), linear-gradient(135deg, #FFFFFF 0%, #A5F3FC 50%, #0284C7 100%);
          color: #ECFEFF !important;
        }
        .obsidian-btn-amber {
          background-image: linear-gradient(180deg, #B45309 0%, #853A07 100%), linear-gradient(135deg, #FFFFFF 0%, #FDE68A 50%, #B45309 100%);
          color: #FEF9C3 !important;
        }
        .obsidian-btn-purple {
          background-image: linear-gradient(180deg, #6D48D8 0%, #4D2EA8 100%), linear-gradient(135deg, #FFFFFF 0%, #E9D5FF 50%, #7E22CE 100%);
          color: #FFFFFF !important;
        }
        .obsidian-btn-emerald {
          background-image: linear-gradient(180deg, #1E7E62 0%, #0E4234 100%), linear-gradient(135deg, #FFFFFF 0%, #A7F3D0 50%, #047857 100%);
          color: #ECFDF5 !important;
        }
        .obsidian-btn-rose {
          background-image: linear-gradient(180deg, #BE123C 0%, #881337 100%), linear-gradient(135deg, #FFFFFF 0%, #FECDD3 50%, #BE123C 100%);
          color: #FFF1F2 !important;
        }
        .obsidian-btn-slate {
          background-image: linear-gradient(180deg, #273249 0%, #182032 100%), linear-gradient(135deg, #FFFFFF 0%, #CBD5E1 50%, #475569 100%);
          color: #F8FAFC !important;
        }
      `}</style>

      {/* Ambient Atmospheric Glows */}
      <div className="pointer-events-none fixed top-0 left-1/4 w-[500px] h-[500px] bg-purple-700/12 rounded-full blur-[140px]" />
      <div className="pointer-events-none fixed bottom-0 right-1/4 w-[480px] h-[480px] bg-amber-500/10 rounded-full blur-[140px]" />

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 px-5 py-3.5 rounded-2xl bg-[#0E0C1D] border-2 border-amber-400 shadow-[0_0_30px_rgba(245,158,11,0.4)] text-amber-100 text-xs font-extrabold flex items-center gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      {/* MAIN PAGE STAGE */}
      <div className="relative z-10 max-w-[1640px] mx-auto px-4 sm:px-6 py-5 pb-20 space-y-6">
        {/* ===================================================================
            HERO BANNER: PREMIUM FINISH + RIGHT-SIDE PNG + MASKED LIVE GOLDEN
            BORDER (NEVER TRAVELS OVER THE RIGHT PNG IMAGE) + CSV & PDF EXPORT
        =================================================================== */}
        <header className="reports-hero-shell grid grid-cols-1 lg:grid-cols-12 items-stretch min-h-[205px]">
          {/* Masked Live Golden Border — Restricted strictly to Left Side */}
          <div className="reports-hero-border-mask" aria-hidden="true">
            <div className="reports-hero-live-gold-rim" />
          </div>

          {/* LEFT 7 COLS: TITLE, LIVE STATUS & EXPORT CONTROLS */}
          <div className="lg:col-span-7 p-6 sm:p-7 flex flex-col justify-between space-y-5 relative z-20">
            <div className="flex items-start gap-4">
              <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-[#2B1D09] via-[#1A1336] to-[#0B0A18] border-2 border-amber-300/80 shadow-[0_8px_24px_rgba(245,158,11,0.3)] flex items-center justify-center shrink-0">
                <Activity className="w-6 h-6 text-amber-300" />
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-[0.26em] text-amber-300">
                    PREMIUM DIGITAL INTELLIGENCE
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-200 border border-emerald-400/55 inline-flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    <span>{isLiveDb ? "Live DB Synced" : "Live Current Reports"}</span>
                  </span>
                </div>

                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight mt-1 bg-gradient-to-r from-amber-100 via-white to-amber-300 bg-clip-text text-transparent">
                  Reports &amp; Analytics
                </h1>

                <p className="text-xs sm:text-sm text-slate-200 font-medium mt-1 max-w-xl">
                  Real-time cohort completion, assessment trajectory, departmental
                  performance reports, and AI prescription forecasts.
                </p>
              </div>
            </div>

            {/* Clean Action Strip (No 7D / 14D / 30D clutter) */}
            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => fetchAllTelemetry(true)}
                className="px-3.5 py-2 rounded-xl text-xs font-black inline-flex items-center gap-1.5 cursor-pointer obsidian-btn obsidian-btn-purple"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${syncing ? "animate-spin" : ""}`}
                />
                <span>Sync Live</span>
              </button>

              <button
                type="button"
                onClick={handleExportCSV}
                className="px-4 py-2 rounded-xl text-xs font-black inline-flex items-center gap-1.5 cursor-pointer obsidian-btn obsidian-btn-emerald"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </button>

              <button
                type="button"
                onClick={handleExportPDF}
                className="px-4 py-2 rounded-xl text-xs font-black inline-flex items-center gap-1.5 cursor-pointer obsidian-btn obsidian-btn-gold"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Export Visual PDF</span>
              </button>

              <button
                type="button"
                onClick={() => setExportModalOpen(true)}
                className="px-3.5 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer obsidian-btn obsidian-btn-slate"
              >
                <Download className="w-3.5 h-3.5 text-amber-300" />
                <span>Report Contents</span>
              </button>
            </div>
          </div>

          {/* RIGHT 5 COLS: PUSHED FLUSH TO RIGHT EDGE WITH SEAMLESS LEFT BLEND */}
          <div className="lg:col-span-5 relative z-25 flex items-center justify-end overflow-hidden min-h-[205px] p-0 m-0">
            <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-[#0C0B1B] via-[#0C0B1B]/75 to-transparent z-20" />
            {!heroImgErr ? (
              <img
                src={heroImageSrc}
                alt="Reports & Analytics Visual"
                onError={() => setHeroImgErr(true)}
                className="relative z-10 w-full h-full max-h-[240px] object-cover object-right ml-auto block select-none"
              />
            ) : (
              <div className="relative z-10 w-full h-full flex items-center justify-end pr-4">
                <span className="text-xs font-bold text-slate-300">
                  Place hero image in public/85683.jpg
                </span>
              </div>
            )}
          </div>
        </header>

        <AgentSyncStrip
          syncData={syncData}
          syncLoading={syncLoading}
          onRefresh={refreshSync}
          onQuickAction={(cmd) => {
            openAiChatModal();
            handleSendAiChat(cmd);
          }}
        />

        {/* ===================================================================
            ROW 1: 4 DEEP-DARK KPI CARDS WITH LOGIN-STYLE LIVE GOLDEN+BASE BORDERS
        =================================================================== */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 01 • CURRICULUM (ROYAL AMETHYST PURPLE + MOVING VIOLET BORDER) */}
          <div
            onClick={() => {
              setSelectedProgramInModal(null);
              setActiveModal("programs");
            }}
            className="cursor-pointer group kpi-vivid-card kpi-vivid-purple p-4 sm:p-5 flex flex-col justify-between space-y-3.5 select-none"
          >
            <div className="kpi-flow-wave-a" />
            <div className="kpi-flow-wave-b" style={{ animationDelay: "-2.4s" }} />

            <div className="flex items-start justify-between gap-3 relative z-10">
              <div>
                <span className="text-[10.5px] font-black uppercase tracking-[0.16em] text-purple-100 block drop-shadow-[0_1px_2px_rgba(0,0,0,0.55)]">
                  01 • CURRICULUM
                </span>
                <div className="mt-1.5 flex items-baseline gap-2">
                  <span className="text-3xl sm:text-4xl font-black text-white font-mono leading-none drop-shadow-[0_2px_6px_rgba(0,0,0,0.55)]">
                    {programTotals.count}
                  </span>
                  <span className="text-xs font-bold text-white/90">
                    Active Tracks
                  </span>
                </div>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-purple-500/35 border border-purple-200/70 text-white shadow-[0_6px_16px_rgba(0,0,0,0.4)] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <BookOpen className="w-5 h-5 stroke-[2.2]" />
              </div>
            </div>

            <div className="relative z-10 w-full h-1.5 rounded-full bg-black/40 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-purple-300 via-fuchsia-200 to-white"
                style={{ width: "78%" }}
              />
            </div>

            <div className="relative z-10 flex items-center justify-between text-[11px] pt-0.5">
              <span className="text-white/90 font-semibold truncate drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">
                {programTotals.totalModules} Modules • {programTotals.totalQuizzes} Quizzes
              </span>
              <span className="text-white font-black inline-flex items-center gap-0.5 group-hover:translate-x-1 transition-transform shrink-0">
                <span>Inspect</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>

          {/* 02 • USERS COHORT (DEEP SAPPHIRE CYAN + MOVING ICE-CYAN BORDER) */}
          <div
            onClick={() => setActiveModal("users")}
            className="cursor-pointer group kpi-vivid-card kpi-vivid-cyan p-4 sm:p-5 flex flex-col justify-between space-y-3.5 select-none"
          >
            <div className="kpi-flow-wave-a" style={{ animationDelay: "-2.6s" }} />
            <div className="kpi-flow-wave-b" style={{ animationDelay: "-5.1s" }} />

            <div className="flex items-start justify-between gap-3 relative z-10">
              <div>
                <span className="text-[10.5px] font-black uppercase tracking-[0.16em] text-cyan-100 block drop-shadow-[0_1px_2px_rgba(0,0,0,0.55)]">
                  02 • USERS COHORT
                </span>
                <div className="mt-1.5 flex items-baseline gap-2">
                  <span className="text-3xl sm:text-4xl font-black text-white font-mono leading-none drop-shadow-[0_2px_6px_rgba(0,0,0,0.55)]">
                    {(tc.staff_count || 0) + (tc.student_count || 0)}
                  </span>
                  <span className="text-xs font-bold text-white/90">
                    Enrolled
                  </span>
                </div>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-cyan-500/35 border border-cyan-200/70 text-white shadow-[0_6px_16px_rgba(0,0,0,0.4)] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Users className="w-5 h-5 stroke-[2.2]" />
              </div>
            </div>

            <div className="relative z-10 w-full h-1.5 rounded-full bg-black/40 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan-300 via-sky-200 to-white"
                style={{ width: "86%" }}
              />
            </div>

            <div className="relative z-10 flex items-center justify-between text-[11px] pt-0.5">
              <span className="text-white/90 font-semibold truncate drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">
                {tc.staff_count || 11} Staff • {tc.student_count || 12} Candidates
              </span>
              <span className="text-white font-black inline-flex items-center gap-0.5 group-hover:translate-x-1 transition-transform shrink-0">
                <span>Breakdown</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>

          {/* 03 • CURO & REWARDS (BURNISHED AMBER GOLD + MOVING GOLD BORDER) */}
          <div
            onClick={() => setActiveModal("curos")}
            className="cursor-pointer group kpi-vivid-card kpi-vivid-amber p-4 sm:p-5 flex flex-col justify-between space-y-3.5 select-none"
          >
            <div className="kpi-flow-wave-a" style={{ animationDelay: "-5.2s" }} />
            <div className="kpi-flow-wave-b" style={{ animationDelay: "-7.8s" }} />

            <div className="flex items-start justify-between gap-3 relative z-10">
              <div>
                <span className="text-[10.5px] font-black uppercase tracking-[0.16em] text-amber-100 block drop-shadow-[0_1px_2px_rgba(0,0,0,0.55)]">
                  03 • CURO &amp; REWARDS
                </span>
                <div className="mt-1.5 flex items-baseline gap-2">
                  <span className="text-3xl sm:text-4xl font-black text-amber-100 font-mono leading-none drop-shadow-[0_2px_6px_rgba(0,0,0,0.55)]">
                    {(tc.curos_in_circulation || 0).toLocaleString()}
                  </span>
                  <span className="text-xs font-bold text-amber-50">
                    Curos
                  </span>
                </div>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-amber-500/35 border border-amber-200/70 text-amber-50 shadow-[0_6px_16px_rgba(0,0,0,0.4)] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Coins className="w-5 h-5 stroke-[2.2]" />
              </div>
            </div>

            <div className="relative z-10 w-full h-1.5 rounded-full bg-black/40 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-300 via-yellow-200 to-white"
                style={{ width: "70%" }}
              />
            </div>

            <div className="relative z-10 flex items-center justify-between text-[11px] pt-0.5">
              <span className="text-amber-50 font-semibold truncate drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">
                {tc.medals_unlocked ?? 18} Medals Unlocked
              </span>
              <span className="text-white font-black inline-flex items-center gap-0.5 group-hover:translate-x-1 transition-transform shrink-0">
                <span>Treasury</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>

          {/* 04 • LIVE HEALTH (VELVET RUBY CRIMSON + MOVING CRIMSON BORDER) */}
          <div
            onClick={() => setActiveModal("health")}
            className="cursor-pointer group kpi-vivid-card kpi-vivid-crimson p-4 sm:p-5 flex flex-col justify-between space-y-2.5 select-none"
          >
            <div className="kpi-flow-wave-a" style={{ animationDelay: "-7.8s" }} />
            <div className="kpi-flow-wave-b" style={{ animationDelay: "-3.5s" }} />

            <div className="flex items-center justify-between gap-2 relative z-10">
              <span className="text-[10.5px] font-black uppercase tracking-[0.16em] text-rose-100 flex items-center gap-1.5 drop-shadow-[0_1px_2px_rgba(0,0,0,0.55)]">
                <HeartPulse className="w-4 h-4 text-rose-300 animate-heart-pulse shrink-0" />
                <span>04 • LIVE HEALTH</span>
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-950/60 border border-rose-300/60 text-white font-mono shadow-sm">
                {healthStats.vitalityScore}% BPM
              </span>
            </div>

            <div className="relative z-10 h-11 rounded-xl bg-black/35 border border-rose-300/40 px-2 flex items-center overflow-hidden shadow-inner">
              <svg className="w-full h-8 overflow-visible" viewBox="0 0 260 40">
                <path
                  d="M 0,22 L 42,22 L 52,11 L 60,32 L 70,4 L 80,36 L 90,15 L 100,22 L 154,22 L 164,10 L 172,31 L 182,5 L 192,35 L 202,16 L 214,22 L 260,22"
                  fill="none"
                  stroke="#FECDD3"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="animate-ecg-wave"
                  style={{ filter: "drop-shadow(0 0 8px rgba(254,205,211,0.95))" }}
                />
              </svg>
            </div>

            <div className="relative z-10 flex items-center justify-between text-[11px] pt-0.5">
              <span className="font-bold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">
                ✓ {healthStats.onTimeCount} On-Time
              </span>
              <span className="font-bold text-rose-100 drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">
                ✕ {healthStats.deadCount} Dead / Idle
              </span>
            </div>
          </div>
        </section>
        {/* ===================================================================
            ROW 2: 3D CIRCULAR COMPLETION RING + QUIZZES VS VIDEOS VELOCITY
        =================================================================== */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          <div className="lg:col-span-5">
            <ScrollAnimated3DCompletionRing
              donut={donut}
              onInspect={() => setActiveModal("completion")}
            />
          </div>

          <div
            onClick={() => setActiveModal("engagement")}
            className="lg:col-span-7 cursor-pointer group reports-panel reports-border-cyan p-6 flex flex-col justify-between space-y-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <span className="px-2.5 py-1 rounded-lg bg-cyan-500/20 border border-cyan-300/55 text-[10px] font-black uppercase tracking-[0.2em] text-cyan-200 inline-block">
                  GRAPH 02 • ASSESSMENT &amp; VIDEO VELOCITY
                </span>
                <h2 className="text-lg font-black text-white mt-2 group-hover:text-cyan-200 transition">
                  Quizzes &amp; Tests Attempted vs. Videos Watched
                </h2>
                <p className="text-xs text-slate-200 font-medium">
                  Strict multi-line velocity trajectory • Zero bar clutter
                </p>
              </div>

              <div
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-1 bg-[#080712] p-1 rounded-xl border border-white/15 text-[11px]"
              >
                {[
                  { id: "all", label: "Both" },
                  { id: "videos", label: "Videos" },
                  { id: "quizzes", label: "Quizzes" },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setIsolatedStream(opt.id)}
                    className={`px-2.5 py-1 rounded-lg font-extrabold cursor-pointer transition ${
                      isolatedStream === opt.id
                        ? "bg-cyan-500/25 text-cyan-200 border border-cyan-300/60"
                        : "text-slate-300 hover:text-white"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="w-full h-56 my-auto">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={normalizedEngagementSeries}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid stroke="#1E1A36" strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="date_label"
                    tick={{ fill: "#E2E8F0", fontSize: 11, fontWeight: 700 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: "#94A3B8", fontSize: 10.5 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<ObsidianTooltip />} />

                  {/* Strict Line Graph: Videos Watched Curve */}
                  {isolatedStream !== "quizzes" && (
                    <Line
                      type="monotone"
                      dataKey="videos"
                      name="Videos Watched"
                      stroke="#C084FC"
                      strokeWidth={3}
                      dot={{ r: 4, fill: "#C084FC", stroke: "#080712", strokeWidth: 2 }}
                      activeDot={{ r: 6, fill: "#F3E8FF", stroke: "#A855F7", strokeWidth: 2 }}
                    />
                  )}

                  {/* Strict Line Graph: Quizzes Attempted Curve */}
                  {isolatedStream !== "videos" && (
                    <Line
                      type="monotone"
                      dataKey="quizzes"
                      name="Quizzes Attempted"
                      stroke="#22D3EE"
                      strokeWidth={3}
                      dot={{ r: 4, fill: "#22D3EE", stroke: "#080712", strokeWidth: 2 }}
                      activeDot={{ r: 6, fill: "#A5F3FC", stroke: "#22D3EE", strokeWidth: 2 }}
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs font-bold">
              <div className="flex items-center gap-4">
                <span className="inline-flex items-center gap-1.5 text-purple-200">
                  <span className="w-2.5 h-2.5 rounded-sm bg-purple-400" />
                  Videos Watched ({tc.video_completions ?? 65})
                </span>
                <span className="inline-flex items-center gap-1.5 text-cyan-200">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                  Quizzes Attempted ({tc.total_quizzes ?? 35})
                </span>
                <span className="text-emerald-300 hidden sm:inline">
                  Conversion: {overallConversionPct}%
                </span>
              </div>

              <span className="text-cyan-200 inline-flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                <span>View Conversion Detail</span>
                <ChevronRight className="w-4 h-4" />
              </span>
            </div>
          </div>
        </section>

        {/* ===================================================================
            ROW 3: ~70% 3D NEURAL TARGET MESH + ~30% LIVE FLOATING AI MODEL
        =================================================================== */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          <div className="lg:col-span-8">
            <NeuralTargetMesh
              departments={departments}
              deptTargets={deptTargets}
              activeDeptId={activeDept?.id}
              onSelectDept={(deptId) => {
                setActiveDeptId(deptId);
                deptSectionRef.current?.scrollIntoView({
                  behavior: "smooth",
                  block: "start",
                });
              }}
              onEditTargets={() => setTargetModalOpen(true)}
            />
          </div>

          <div
            onClick={openAiChatModal}
            className="lg:col-span-4 cursor-pointer group reports-panel reports-border-purple p-5 flex flex-col justify-between space-y-4 overflow-hidden"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="px-2.5 py-1 rounded-full bg-amber-500/20 border border-amber-300/60 text-[10px] font-black uppercase tracking-[0.2em] text-amber-200 inline-flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-amber-300" />
                <span>SAARTHI AI LIVE</span>
              </span>
              <span className="text-[10.5px] font-bold text-emerald-300 inline-flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                <span>Interactive</span>
              </span>
            </div>

            <div className="relative flex flex-col items-center justify-center py-1">
              <div className="pointer-events-none absolute w-40 h-40 rounded-full bg-gradient-to-tr from-amber-400/25 via-purple-500/25 to-cyan-400/25 blur-2xl group-hover:scale-110 transition-transform" />
              <img
                src={aiAvatarUrl}
                alt="Saarthi AI Model"
                onError={(e) => {
                  e.currentTarget.src = "/saarthi-robot.png";
                }}
                className="w-36 h-36 object-contain animate-ai-float drop-shadow-[0_14px_28px_rgba(245,158,11,0.48)] relative z-10"
              />
            </div>

            <div className="space-y-2.5 relative z-10">
              <div
                className={`p-3.5 rounded-2xl border text-xs leading-relaxed transition-all ${
                  aiInsightsTicker[aiTipIdx]?.color ||
                  "border-amber-400/45 bg-amber-500/12"
                }`}
              >
                <span className="text-[9.5px] font-black uppercase tracking-widest block mb-1 opacity-90">
                  {aiInsightsTicker[aiTipIdx]?.tag}
                </span>
                <p className="text-white font-semibold">
                  {aiInsightsTicker[aiTipIdx]?.text}
                </p>
              </div>

              <div className="flex items-center justify-between gap-2 pt-1">
                <div className="flex items-center gap-1.5">
                  {aiInsightsTicker.map((_, i) => (
                    <span
                      key={i}
                      className={`h-1.5 rounded-full transition-all ${
                        i === aiTipIdx ? "w-5 bg-amber-400" : "w-1.5 bg-white/25"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-xs font-black text-amber-300 inline-flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  <span>Chat with AI</span>
                  <ChevronRight className="w-4 h-4" />
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ===================================================================
            ROW 4: DEPARTMENT REPORTS CONSOLE
            - Graph 1: Key Target Attainment Graph (Inline, Info Directly Beside)
            - Graph 2: AI Prescription Predicted Trajectory Graph (Baseline vs AI)
            - Below: Candidate-Attrition Style Separate User Tabs
        =================================================================== */}
        <section
          ref={deptSectionRef}
          className="reports-panel reports-border-cyan p-5 sm:p-6 space-y-6"
        >
          {/* Department Selector Tabs */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/15 pb-4">
            <div className="flex flex-wrap items-center gap-2">
              {departments.map((dept, idx) => {
                const pal = DEPT_PALETTE[idx % DEPT_PALETTE.length];
                const isSelected = dept.id === activeDept?.id;
                const dActual = Number(dept.aiDeepDive?.healthScore ?? 70);
                const dTarget = Number(deptTargets[dept.id] ?? dept.target ?? 75);

                return (
                  <button
                    key={dept.id}
                    type="button"
                    onClick={() => setActiveDeptId(dept.id)}
                    className={`px-4 py-2 rounded-xl text-xs font-extrabold inline-flex items-center gap-2 cursor-pointer transition ${
                      isSelected
                        ? "bg-gradient-to-r from-amber-500/25 via-purple-600/30 to-cyan-500/25 text-white border-2 border-amber-300 shadow-[0_0_18px_rgba(245,158,11,0.3)]"
                        : "bg-[#080712] text-slate-200 border border-white/20 hover:border-cyan-300 hover:text-white"
                    }`}
                  >
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{
                        backgroundColor: pal.hex,
                        boxShadow: `0 0 8px ${pal.glow}`,
                      }}
                    />
                    <span>{dept.badge}</span>
                    <span className="font-mono text-[10.5px] opacity-85">
                      {dActual}%/{dTarget}%
                    </span>
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={handleExportPDF}
              className="px-4 py-2 rounded-xl text-xs font-black inline-flex items-center gap-1.5 cursor-pointer obsidian-btn obsidian-btn-amber"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Dept PDF</span>
            </button>
          </div>

          {/* ROW A: COMPACT BRIGHT NEON BAR GRAPH (5 COLS) + 5-LINE STRUCTURED BRIEF (7 COLS) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
            {/* LEFT (5 COLS): COMPACT, BRIGHT NEON BAR CHART (ZERO WASTED SPACE) */}
            <div className="lg:col-span-5 p-5 rounded-2xl bg-gradient-to-b from-[#160F29] via-[#0E0A1D] to-[#080712] border-2 border-purple-400/65 hover:border-purple-300 shadow-[0_14px_34px_rgba(0,0,0,0.82)] transition flex flex-col justify-between space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-purple-200 block">
                    CURRENT PERFORMANCE REPORT
                  </span>
                  <h3 className="text-lg font-black text-white mt-0.5">
                    {activeDept?.badge}{" "}
                    <span className="text-purple-300">Metrics</span>
                  </h3>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[11px] font-black font-mono bg-emerald-500/20 text-emerald-200 border border-emerald-400/60">
                  {activeDeptActual}% Avg
                </span>
              </div>

              <div className="w-full h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={activeDeptBarData}
                    barCategoryGap="12%"
                    margin={{ top: 26, right: 12, left: -16, bottom: 4 }}
                  >
                    <defs>
                      <linearGradient id="neonBarBlue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#38BDF8" />
                        <stop offset="100%" stopColor="#1D4ED8" />
                      </linearGradient>
                      <linearGradient id="neonBarOrange" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#FBBF24" />
                        <stop offset="100%" stopColor="#EA580C" />
                      </linearGradient>
                      <linearGradient id="neonBarGreen" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#84CC16" />
                        <stop offset="100%" stopColor="#15803D" />
                      </linearGradient>
                      <linearGradient id="neonBarPink" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#F472B6" />
                        <stop offset="100%" stopColor="#DB2777" />
                      </linearGradient>
                      <linearGradient id="neonBarViolet" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#C084FC" />
                        <stop offset="100%" stopColor="#7C3AED" />
                      </linearGradient>
                      <linearGradient id="neonBarTeal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#2DD4BF" />
                        <stop offset="100%" stopColor="#0D9488" />
                      </linearGradient>
                    </defs>

                    <CartesianGrid
                      stroke="rgba(255, 255, 255, 0.12)"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="name"
                      tick={{ fill: "#FFFFFF", fontSize: 12, fontWeight: 700 }}
                      axisLine={{ stroke: "rgba(255, 255, 255, 0.65)", strokeWidth: 1.5 }}
                      tickLine={false}
                    />
                    <YAxis
                      domain={[0, 100]}
                      ticks={[0, 20, 40, 60, 80, 100]}
                      tick={{ fill: "#F1F5F9", fontSize: 11, fontWeight: 600 }}
                      axisLine={{ stroke: "rgba(255, 255, 255, 0.65)", strokeWidth: 1.5 }}
                      tickLine={false}
                    />
                    <Tooltip
                      content={<ObsidianTooltip suffix="%" />}
                      cursor={{ fill: "rgba(255,255,255,0.06)" }}
                    />
                    <Bar
                      dataKey="value"
                      name="Score"
                      radius={[7, 7, 0, 0]}
                    >
                      {activeDeptBarData.map((_, idx) => {
                        const gradIds = [
                          "url(#neonBarBlue)",
                          "url(#neonBarOrange)",
                          "url(#neonBarGreen)",
                          "url(#neonBarPink)",
                          "url(#neonBarViolet)",
                          "url(#neonBarTeal)",
                        ];
                        return (
                          <Cell
                            key={idx}
                            fill={gradIds[idx % gradIds.length]}
                          />
                        );
                      })}
                      <LabelList
                        dataKey="value"
                        position="top"
                        formatter={(val) => `${val}%`}
                        fill="#FFFFFF"
                        fontSize={12}
                        fontWeight={800}
                        offset={8}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* RIGHT (7 COLS): 5-LINE WELL-STRUCTURED DEPARTMENT INTELLIGENCE BRIEF */}
            <div className="lg:col-span-7 p-5 sm:p-6 rounded-2xl bg-[#090814] border-2 border-cyan-400/55 hover:border-cyan-300 transition flex flex-col justify-between space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/15 pb-3">
                <div>
                  <span className="text-[10.5px] font-black uppercase tracking-[0.22em] text-cyan-200 block">
                    CURRENT DEPARTMENT BRIEF
                  </span>
                  <h3 className="text-xl font-black text-white mt-0.5">
                    {activeDept?.title}
                  </h3>
                </div>
                <span className="px-3 py-1 rounded-xl bg-amber-500/20 border border-amber-300/60 text-xs font-black font-mono text-amber-200">
                  {activeDeptUsers.length} Tracked Users
                </span>
              </div>

              {/* 5 Clean, High-Contrast Structured Insight Lines */}
              {(() => {
                const sortedBars = [...activeDeptBarData].sort(
                  (a, b) => b.value - a.value
                );
                const topBar = sortedBars[0];
                const lowBar = sortedBars[sortedBars.length - 1];
                const deptOnTime = activeDeptUsers.filter(
                  (u) => u.status === "On-Time"
                ).length;
                const deptDead = activeDeptUsers.filter(
                  (u) => u.status === "Dead / Inactive"
                ).length;

                const insightLines = [
                  {
                    label: "Executive Summary",
                    accent: "text-cyan-200 border-cyan-400/45",
                    text:
                      activeDept?.aiDeepDive?.aiSummary ||
                      activeDept?.metrics ||
                      "Active department telemetry synced across current modules.",
                  },
                  {
                    label: "Leading Benchmark",
                    accent: "text-emerald-200 border-emerald-400/45",
                    text: topBar
                      ? `${topBar.name} leads this department at ${topBar.value}% performance, setting the current pace for peers.`
                      : "Initial benchmark data is being collected.",
                  },
                  {
                    label: "Bottleneck Watch",
                    accent: "text-rose-200 border-rose-400/45",
                    text:
                      activeDept?.aiDeepDive?.highRiskAlert ||
                      (lowBar
                        ? `${lowBar.name} currently trails at ${lowBar.value}% and represents the main recovery opportunity.`
                        : "Zero critical drop-off signals detected across this cohort."),
                  },
                  {
                    label: "Cohort Activity Split",
                    accent: "text-amber-200 border-amber-400/45",
                    text: `${deptOnTime} member(s) are completing on time while ${deptDead} account(s) remain inactive or require a direct nudge.`,
                  },
                  {
                    label: "Recommended Next Action",
                    accent: "text-purple-200 border-purple-400/45",
                    text:
                      activeDept?.aiDeepDive?.prescription ||
                      "Dispatch a targeted micro-video recap and quiz check-in to sustain momentum.",
                  },
                ];

                return (
                  <div className="space-y-2.5">
                    {insightLines.map((line, i) => (
                      <div
                        key={i}
                        className={`px-3.5 py-2.5 rounded-xl bg-[#0D1122] border-l-4 ${line.accent} border border-white/10`}
                      >
                        <span className="text-[10px] font-black uppercase tracking-wider block opacity-95">
                          0{i + 1}. {line.label}
                        </span>
                        <p className="text-xs sm:text-[13px] text-white font-medium leading-snug mt-0.5">
                          {line.text}
                        </p>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          </div>

          {/* ROW B: AI PRESCRIPTION BRIEF + POLYGON/AREA GRAPH WITH CURRENT / PREDICTED TOGGLE */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
            {/* LEFT (5 COLS): AI PRESCRIPTION CARD + MATCHING GOLD/CYAN BUTTONS */}
            <div className="lg:col-span-5 p-5 rounded-2xl bg-gradient-to-br from-[#0F1B1D] via-[#0B1020] to-[#080712] border-2 border-emerald-400/55 hover:border-emerald-300 transition flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <span className="text-[10.5px] font-black uppercase tracking-[0.2em] text-emerald-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>AI PRESCRIPTION ENGINE</span>
                </span>
                <h3 className="text-lg font-black text-white">
                  Recommended Intervention Plan
                </h3>
                <p className="text-xs sm:text-sm text-slate-100 leading-relaxed font-medium">
                  {activeDept?.aiDeepDive?.prescription}
                </p>

                <div className="p-3.5 rounded-xl bg-[#070B16] border border-amber-400/50 text-xs text-amber-100 font-semibold leading-relaxed">
                  <strong className="text-amber-300">AI Outcome Lift: </strong>+
                  {predictedGain}% projected attainment gain when the prescription
                  is deployed across {activeDept?.badge}.
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() =>
                    handleSendNudge(`${activeDept?.badge} AI prescription`)
                  }
                  className="px-4 py-2.5 rounded-xl text-xs font-black inline-flex items-center gap-1.5 cursor-pointer obsidian-btn obsidian-btn-emerald"
                >
                  <Bell className="w-3.5 h-3.5" />
                  <span>Deploy Prescription</span>
                </button>
                <button
                  type="button"
                  onClick={openAiChatModal}
                  className="px-4 py-2.5 rounded-xl text-xs font-black inline-flex items-center gap-1.5 cursor-pointer obsidian-btn obsidian-btn-gold"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Ask AI Co-Pilot</span>
                </button>
              </div>
            </div>

            {/* RIGHT (7 COLS): POLYGON / AREA GRAPH WITH TOP "CURRENT" VS "AI PREDICTED" TOGGLE */}
            <div className="lg:col-span-7 p-5 rounded-2xl bg-[#090814] border-2 border-purple-400/55 hover:border-purple-300 transition flex flex-col justify-between space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <span className="text-[10.5px] font-black uppercase tracking-[0.2em] text-cyan-200 flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-300" />
                    <span>
                      {deptViewMode === "predicted"
                        ? "AI PRESCRIPTION PREDICTED GRAPH"
                        : "CURRENT STAGE COVERAGE"}
                    </span>
                  </span>
                  <h3 className="text-base sm:text-lg font-black text-white mt-0.5">
                    {deptViewMode === "predicted"
                      ? `${activeDept?.badge} — Predicted Uplift Trajectory`
                      : `${activeDept?.badge} — Current Distribution Polygon`}
                  </h3>
                </div>

                {/* Top Toggle: Current vs AI Predicted (plus Week/Month when Predicted) */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1 bg-[#060711] p-1 rounded-xl border border-cyan-400/50">
                    <button
                      type="button"
                      onClick={() => setDeptViewMode("current")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-black cursor-pointer transition ${
                        deptViewMode === "current"
                          ? "bg-cyan-400 text-slate-950"
                          : "text-slate-200 hover:text-white"
                      }`}
                    >
                      Current
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeptViewMode("predicted")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-black cursor-pointer transition ${
                        deptViewMode === "predicted"
                          ? "bg-emerald-400 text-slate-950"
                          : "text-slate-200 hover:text-white"
                      }`}
                    >
                      AI Predicted
                    </button>
                  </div>

                  {deptViewMode === "predicted" && (
                    <div className="flex items-center gap-1 bg-[#060711] p-1 rounded-xl border border-amber-400/45">
                      <button
                        type="button"
                        onClick={() => setPrescriptionHorizon("week")}
                        className={`px-2.5 py-1.5 rounded-lg text-[11px] font-black cursor-pointer transition ${
                          prescriptionHorizon === "week"
                            ? "bg-amber-400 text-slate-950"
                            : "text-slate-300 hover:text-white"
                        }`}
                      >
                        A Week
                      </button>
                      <button
                        type="button"
                        onClick={() => setPrescriptionHorizon("month")}
                        className={`px-2.5 py-1.5 rounded-lg text-[11px] font-black cursor-pointer transition ${
                          prescriptionHorizon === "month"
                            ? "bg-amber-400 text-slate-950"
                            : "text-slate-300 hover:text-white"
                        }`}
                      >
                        A Month
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="w-full h-56">
                <ResponsiveContainer width="100%" height="100%">
                  {deptViewMode === "predicted" ? (
                    <AreaChart
                      data={prescriptionPredictedSeries}
                      margin={{ top: 12, right: 14, left: -18, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="rxPredFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10B981" stopOpacity={0.55} />
                          <stop offset="95%" stopColor="#10B981" stopOpacity={0.04} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke="#1E1A36" strokeDasharray="3 3" vertical={false} />
                      <XAxis
                        dataKey="step"
                        tick={{ fill: "#FFFFFF", fontSize: 11, fontWeight: 700 }}
                        axisLine={{ stroke: "rgba(255,255,255,0.2)" }}
                        tickLine={false}
                      />
                      <YAxis
                        domain={[0, 100]}
                        tick={{ fill: "#CBD5E1", fontSize: 10.5 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip content={<ObsidianTooltip suffix="%" />} />
                      <Line
                        type="monotone"
                        dataKey="baseline"
                        name="Current Baseline"
                        stroke="#94A3B8"
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        dot={{ r: 3.5, fill: "#94A3B8" }}
                      />
                      <Area
                        type="monotone"
                        dataKey="aiPredicted"
                        name="AI Predicted Score"
                        stroke="#34D399"
                        strokeWidth={3.2}
                        fill="url(#rxPredFill)"
                        dot={{ r: 4.5, fill: "#34D399", stroke: "#FFFFFF", strokeWidth: 1.5 }}
                      />
                    </AreaChart>
                  ) : (
                    <RadarChart
                      cx="50%"
                      cy="50%"
                      outerRadius="70%"
                      data={adjacentPolygonSeries}
                    >
                      <PolarGrid stroke="#312952" />
                      <PolarAngleAxis
                        dataKey="stage"
                        tick={{ fill: "#FFFFFF", fontSize: 11, fontWeight: 700 }}
                      />
                      <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                      <Tooltip content={<ObsidianTooltip suffix="%" />} />
                      <Radar
                        name="Current Score"
                        dataKey="aiScore"
                        stroke="#22D3EE"
                        strokeWidth={2.8}
                        fill="#0EA5E9"
                        fillOpacity={0.42}
                      />
                    </RadarChart>
                  )}
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* ROW C: CANDIDATE-ATTRITION STYLE USER TABS FOR THIS DEPARTMENT */}
          <div className="dim-plum-users-vault rounded-3xl p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/15 pb-3.5">
              <div>
                <span className="text-[10.5px] font-black uppercase tracking-[0.22em] text-amber-200 block">
                  DEPARTMENT PERSONNEL &amp; CANDIDATE TABS ({activeDeptUsers.length})
                </span>
                <h3 className="text-lg font-black text-white mt-0.5">
                  Users in {activeDept?.badge}
                </h3>
              </div>
              <span className="text-xs text-slate-200 font-semibold">
                Click any user tab for Videos/Quizzes graph, AI Prescription,
                Nudge &amp; Candidate Attrition
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeDeptUsers.map((u, idx) => {
                const accentIdx = idx % 5;
                const tabCls = userTabVariants[accentIdx];
                const btnCls = `obsidian-btn ${userBtnVariants[accentIdx]}`;
                const isDead = u.status === "Dead / Inactive";
                const statusBtnCls = `obsidian-btn ${
                  isDead
                    ? "obsidian-btn-rose"
                    : u.status === "On-Time"
                    ? "obsidian-btn-emerald"
                    : "obsidian-btn-amber"
                }`;

                return (
                  <div
                    key={u.id}
                    onClick={() => {
                      setSelectedUser(u);
                      setAttritionToggles({
                        microVideo: true,
                        peerBuddy: false,
                        bonusCuros: true,
                      });
                      setActiveModal("user_detail");
                    }}
                    className={`cursor-pointer group rounded-3xl p-5 flex flex-col justify-between space-y-4 select-none ${tabCls}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-11 h-11 rounded-2xl font-black text-xs flex items-center justify-center shrink-0 ${btnCls}`}
                        >
                          {u.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-sm sm:text-[15px] font-black text-white group-hover:text-amber-200 transition truncate">
                            {u.name}
                          </h4>
                          <span className="text-[11.5px] text-slate-200 block truncate">
                            {u.email}
                          </span>
                        </div>
                      </div>

                      <span className="px-3 py-1 rounded-full text-[10px] font-black shrink-0 obsidian-btn obsidian-btn-slate">
                        {u.role}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="p-2.5 rounded-2xl bg-[#070B16]/92 border border-purple-300/65">
                        <span className="text-[10px] text-slate-300 font-bold block">
                          Videos
                        </span>
                        <span className="font-black text-purple-200 font-mono">
                          {u.videosCompleted}/{u.totalVideos}
                        </span>
                      </div>
                      <div className="p-2.5 rounded-2xl bg-[#070B16]/92 border border-cyan-300/65">
                        <span className="text-[10px] text-slate-300 font-bold block">
                          Quizzes
                        </span>
                        <span className="font-black text-cyan-200 font-mono">
                          {u.quizzesCompleted}/{u.totalQuizzes}
                        </span>
                      </div>
                      <div className="p-2.5 rounded-2xl bg-[#070B16]/92 border border-amber-300/65">
                        <span className="text-[10px] text-slate-300 font-bold block">
                          Curos
                        </span>
                        <span className="font-black text-amber-200 font-mono">
                          🪙 {u.curos}
                        </span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-white/15 flex items-center justify-between gap-2">
                      <span
                        className={`px-3 py-1 rounded-full text-[10.5px] font-black ${statusBtnCls}`}
                      >
                        {isDead ? "Dead / Inactive" : u.status}
                      </span>
                      <span
                        className={`px-3.5 py-1 rounded-full text-[10.5px] font-black ${btnCls}`}
                      >
                        {u.isCandidate ? "Report + Attrition →" : "Inspect →"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </div>

      {/* =====================================================================
          INTERACTIVE DRILL-DOWN MODALS (STRUCTURED, ENLARGED, CRISP BORDERS)
      ===================================================================== */}

      {/* MODAL 0: REPORT STRUCTURE & EXPORT PREVIEW MODAL */}
      {exportModalOpen && (
        <div
          onClick={() => setExportModalOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/82 backdrop-blur-md p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xl rounded-3xl p-6 bg-[#0B1020] modal-tab-border-amber text-white space-y-5 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-white/15 pb-3.5">
              <div>
                <span className="text-[10px] font-black uppercase tracking-[0.22em] text-amber-200 block">
                  EXECUTIVE REPORT GENERATOR
                </span>
                <h3 className="text-xl font-black text-white mt-0.5">
                  PDF Dossier &amp; CSV Structure
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setExportModalOpen(false)}
                className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/15 border border-white/20 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 rounded-2xl modal-tab-border-cyan space-y-2 text-xs text-slate-100 leading-relaxed">
              <p className="font-black uppercase tracking-wider text-cyan-200">
                Included Automatically in Both Exports:
              </p>
              <ul className="space-y-1.5 font-medium">
                <li>
                  • <strong>Section 1 — KPIs &amp; Vitality:</strong> Programs,
                  Staff/Candidate Split, Curos Treasury, On-Time vs. Dead Users.
                </li>
                <li>
                  • <strong>Section 2 — Embedded Graphs (PDF) &amp; Series (CSV):</strong>{" "}
                  Completion Ring, Daily Quizzes vs. Videos Velocity, &amp;
                  Department SLA Target Chart.
                </li>
                <li>
                  • <strong>Section 3 — Department Intelligence:</strong> Actual
                  vs. Target Attainment, Variance Gap, &amp; AI Prescriptions.
                </li>
                <li>
                  • <strong>Section 4 — Full Personnel Roster:</strong> Every
                  user&apos;s Videos, Quizzes, Mastery, Curos, Status &amp;
                  Attrition Risk.
                </li>
              </ul>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  handleExportCSV();
                  setExportModalOpen(false);
                }}
                className="py-3 rounded-2xl text-xs font-black inline-flex items-center justify-center gap-2 cursor-pointer obsidian-btn obsidian-btn-emerald"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Download 4-Section CSV</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  handleExportPDF();
                  setExportModalOpen(false);
                }}
                className="py-3 rounded-2xl text-xs font-black inline-flex items-center justify-center gap-2 cursor-pointer obsidian-btn obsidian-btn-gold"
              >
                <FileText className="w-4 h-4" />
                <span>Generate Visual PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: KPI 1 — PROGRAMS -> MODULES & QUIZZES */}
      {activeModal === "programs" && (
        <div
          onClick={() => setActiveModal(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/82 backdrop-blur-md p-4 overflow-y-auto"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-4xl rounded-3xl p-6 bg-[#0B1020] modal-tab-border-purple shadow-2xl space-y-5 my-auto"
          >
            <div className="flex items-center justify-between gap-3 border-b border-white/15 pb-4">
              <div className="flex items-center gap-3">
                {selectedProgramInModal && (
                  <button
                    type="button"
                    onClick={() => setSelectedProgramInModal(null)}
                    className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-bold text-white inline-flex items-center gap-1 cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>All Programs</span>
                  </button>
                )}
                <div>
                  <span className="text-[10px] font-black uppercase tracking-[0.22em] text-purple-200 block">
                    KPI 01 • CURRICULUM INVENTORY
                  </span>
                  <h3 className="text-xl font-black text-white">
                    {selectedProgramInModal
                      ? `${selectedProgramInModal.title} — Modules & Quizzes`
                      : `All Active Programs (${programs.length})`}
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {!selectedProgramInModal ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {programs.map((prog) => {
                  const modCount = prog.modules?.length || 0;
                  const quizCount = (prog.modules || []).reduce(
                    (s, m) => s + Number(m.quizzes || 0),
                    0
                  );
                  return (
                    <div
                      key={prog.id}
                      onClick={() => setSelectedProgramInModal(prog)}
                      className="cursor-pointer p-5 rounded-2xl modal-tab-border-cyan hover:border-amber-300 transition space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-200 border border-emerald-400/50">
                          {prog.status}
                        </span>
                        <span className="text-xs font-bold text-slate-300">
                          {prog.category}
                        </span>
                      </div>
                      <h4 className="text-lg font-black text-white">{prog.title}</h4>
                      <div className="grid grid-cols-2 gap-2.5 text-xs">
                        <div className="p-3 rounded-xl bg-black/50 border border-cyan-400/40">
                          <span className="text-[10px] text-slate-300 block">Modules</span>
                          <span className="text-lg font-black text-cyan-200 font-mono">
                            {modCount}
                          </span>
                        </div>
                        <div className="p-3 rounded-xl bg-black/50 border border-amber-400/40">
                          <span className="text-[10px] text-slate-300 block">Quizzes</span>
                          <span className="text-lg font-black text-amber-200 font-mono">
                            {quizCount}
                          </span>
                        </div>
                      </div>
                      <span className="text-xs font-extrabold text-amber-200 inline-flex items-center gap-1 pt-1">
                        <span>Click to inspect modules &amp; quizzes</span>
                        <ChevronRight className="w-4 h-4" />
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-3.5 rounded-2xl modal-tab-border-cyan">
                    <span className="text-[10px] text-cyan-200 uppercase font-bold block">
                      Total Modules
                    </span>
                    <span className="text-2xl font-black text-white font-mono">
                      {selectedProgramInModal.modules?.length || 0}
                    </span>
                  </div>
                  <div className="p-3.5 rounded-2xl modal-tab-border-amber">
                    <span className="text-[10px] text-amber-200 uppercase font-bold block">
                      Total Quizzes
                    </span>
                    <span className="text-2xl font-black text-white font-mono">
                      {(selectedProgramInModal.modules || []).reduce(
                        (s, m) => s + Number(m.quizzes || 0),
                        0
                      )}
                    </span>
                  </div>
                  <div className="p-3.5 rounded-2xl modal-tab-border-emerald">
                    <span className="text-[10px] text-emerald-200 uppercase font-bold block">
                      Completion
                    </span>
                    <span className="text-2xl font-black text-white font-mono">
                      {selectedProgramInModal.completionPct}%
                    </span>
                  </div>
                </div>

                <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
                  {(selectedProgramInModal.modules || []).map((mod, idx) => (
                    <div
                      key={mod.id || idx}
                      className="p-4 rounded-2xl bg-[#12162A] border border-purple-400/50 flex flex-wrap items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="w-9 h-9 rounded-xl bg-purple-500/25 border border-purple-300/60 text-white text-xs font-black font-mono flex items-center justify-center shrink-0">
                          {String(idx + 1).padStart(2, "0")}
                        </span>
                        <div className="min-w-0">
                          <h5 className="text-sm font-black text-white truncate">
                            {mod.title}
                          </h5>
                          <span className="text-xs text-slate-300 font-semibold">
                            Avg Quiz Mastery: {mod.avgScore ?? 78}%
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-xs font-mono font-black">
                        <span className="px-3 py-1 rounded-lg bg-cyan-500/20 border border-cyan-300/60 text-cyan-100 inline-flex items-center gap-1">
                          <PlayCircle className="w-3.5 h-3.5" />
                          {mod.videos} Video
                        </span>
                        <span className="px-3 py-1 rounded-lg bg-amber-500/20 border border-amber-300/60 text-amber-100 inline-flex items-center gap-1">
                          <HelpCircle className="w-3.5 h-3.5" />
                          {mod.quizzes} Quiz
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 2: KPI 2 — USERS BREAKDOWN */}
      {activeModal === "users" && (
        <div
          onClick={() => setActiveModal(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/82 backdrop-blur-md p-4 overflow-y-auto"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-3xl rounded-3xl p-6 bg-[#0B1020] modal-tab-border-cyan space-y-5 my-auto"
          >
            <div className="flex items-center justify-between border-b border-white/15 pb-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-200 block">
                  KPI 02 • USER DEMOGRAPHICS
                </span>
                <h3 className="text-xl font-black text-white mt-0.5">
                  Staff &amp; Candidates Cohort Breakdown
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl modal-tab-border-cyan space-y-2">
                <span className="text-xs font-black uppercase tracking-wider text-cyan-200 block">
                  Staff &amp; Hub Leaders
                </span>
                <span className="text-4xl font-black text-white font-mono block">
                  {tc.staff_count || 11}
                </span>
                <p className="text-xs text-slate-200">
                  Master Admins, Head Office Staff, Team Leaders, and Franchise Partners.
                </p>
              </div>
              <div className="p-5 rounded-2xl modal-tab-border-purple space-y-2">
                <span className="text-xs font-black uppercase tracking-wider text-purple-200 block">
                  Candidates &amp; Learners
                </span>
                <span className="text-4xl font-black text-white font-mono block">
                  {tc.student_count || 12}
                </span>
                <p className="text-xs text-slate-200">
                  Enrolled franchise employees and candidates tracked for retention &amp; certification.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl modal-tab-border-amber space-y-2">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-cyan-200">
                  Staff (
                  {Math.round(
                    ((tc.staff_count || 11) /
                      Math.max(1, (tc.staff_count || 11) + (tc.student_count || 12))) *
                      100
                  )}
                  %)
                </span>
                <span className="text-purple-200">
                  Candidates (
                  {Math.round(
                    ((tc.student_count || 12) /
                      Math.max(1, (tc.staff_count || 11) + (tc.student_count || 12))) *
                      100
                  )}
                  %)
                </span>
              </div>
              <div className="w-full h-3 rounded-full bg-black/70 overflow-hidden flex">
                <div
                  className="h-full bg-gradient-to-r from-cyan-400 to-blue-500"
                  style={{
                    width: `${Math.round(
                      ((tc.staff_count || 11) /
                        Math.max(1, (tc.staff_count || 11) + (tc.student_count || 12))) *
                        100
                    )}%`,
                  }}
                />
                <div className="h-full flex-1 bg-gradient-to-r from-purple-500 to-fuchsia-500" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: KPI 3 — CURO & REWARDS */}
      {activeModal === "curos" && (
        <div
          onClick={() => setActiveModal(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/82 backdrop-blur-md p-4 overflow-y-auto"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-3xl rounded-3xl p-6 bg-[#0B1020] modal-tab-border-amber space-y-5 my-auto"
          >
            <div className="flex items-center justify-between border-b border-white/15 pb-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-[0.22em] text-amber-200 block">
                  KPI 03 • CURO &amp; REWARDS ECONOMY
                </span>
                <h3 className="text-xl font-black text-white mt-0.5">
                  Gamification Treasury &amp; Medal Circulation
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="p-4 rounded-2xl modal-tab-border-amber">
                <span className="text-[10px] font-bold uppercase text-amber-200 block">
                  Total Circulation
                </span>
                <span className="text-2xl font-black text-white font-mono mt-1 block">
                  {(tc.curos_in_circulation || 510).toLocaleString()}
                </span>
              </div>
              <div className="p-4 rounded-2xl modal-tab-border-purple">
                <span className="text-[10px] font-bold uppercase text-purple-200 block">
                  Medals Unlocked
                </span>
                <span className="text-2xl font-black text-white font-mono mt-1 block">
                  {tc.medals_unlocked ?? 18}
                </span>
              </div>
              <div className="p-4 rounded-2xl modal-tab-border-emerald">
                <span className="text-[10px] font-bold uppercase text-emerald-200 block">
                  Avg / Active User
                </span>
                <span className="text-2xl font-black text-white font-mono mt-1 block">
                  {Math.round(
                    (tc.curos_in_circulation || 510) / Math.max(1, healthStats.onTimeCount)
                  )}
                </span>
              </div>
            </div>

            <div className="space-y-2.5">
              <span className="text-xs font-black uppercase tracking-wider text-amber-200 block">
                Top Curo &amp; Medal Earners
              </span>
              {[...users]
                .sort((a, b) => b.curos - a.curos)
                .slice(0, 4)
                .map((u, idx) => (
                  <div
                    key={u.id}
                    className="p-3.5 rounded-xl bg-[#070B16] border border-amber-400/40 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-7 h-7 rounded-lg bg-amber-400 text-slate-950 font-black flex items-center justify-center">
                        #{idx + 1}
                      </span>
                      <span className="font-bold text-white">{u.name}</span>
                      <span className="text-slate-300">({u.role})</span>
                    </div>
                    <div className="flex items-center gap-3 font-mono font-black">
                      <span className="text-amber-200">{u.curos} Curos</span>
                      <span className="text-purple-200">{u.medals} Medals</span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: KPI 4 — LIVE HEALTH (ON-TIME VS DEAD USERS) */}
      {activeModal === "health" && (
        <div
          onClick={() => setActiveModal(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/82 backdrop-blur-md p-4 overflow-y-auto"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-4xl rounded-3xl p-6 bg-[#0B1020] modal-tab-border-rose space-y-5 my-auto"
          >
            <div className="flex items-center justify-between border-b border-white/15 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-rose-500/20 border border-rose-400/70 flex items-center justify-center">
                  <HeartPulse className="w-6 h-6 text-rose-300 animate-heart-pulse" />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-[0.22em] text-rose-200 block">
                    KPI 04 • BIOMETRIC PLATFORM VITALITY STUDY
                  </span>
                  <h3 className="text-xl font-black text-white">
                    On-Time Completers vs. Dead / Inactive Users
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 rounded-2xl modal-tab-border-emerald">
                <span className="text-[10px] font-black uppercase text-emerald-200 block">
                  Completing On-Time
                </span>
                <span className="text-3xl font-black text-white font-mono mt-1 block">
                  {healthStats.onTimeCount}
                </span>
                <span className="text-xs text-emerald-200">Active within 48 hrs</span>
              </div>
              <div className="p-4 rounded-2xl modal-tab-border-amber">
                <span className="text-[10px] font-black uppercase text-amber-200 block">
                  Stalled Mid-Way
                </span>
                <span className="text-3xl font-black text-white font-mono mt-1 block">
                  {healthStats.stalledCount}
                </span>
                <span className="text-xs text-amber-200">5–11 days since activity</span>
              </div>
              <div className="p-4 rounded-2xl modal-tab-border-rose">
                <span className="text-[10px] font-black uppercase text-rose-200 block">
                  Dead / Inactive Users
                </span>
                <span className="text-3xl font-black text-white font-mono mt-1 block">
                  {healthStats.deadCount}
                </span>
                <span className="text-xs text-rose-200">0% start or 12+ days silent</span>
              </div>
            </div>

            <div className="space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-rose-200 flex items-center gap-1.5">
                  <UserX className="w-4 h-4" />
                  <span>Dormant / Dead Accounts Watchlist</span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    handleSendNudge(`${healthStats.deadCount} dormant/dead accounts`);
                    setActiveModal(null);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-black inline-flex items-center gap-1.5 cursor-pointer obsidian-btn obsidian-btn-gold"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>Revive All Dead Users (+50 Curos)</span>
                </button>
              </div>

              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {healthStats.deadUsersList.map((u) => (
                  <div
                    key={u.id}
                    className="p-3.5 rounded-xl bg-[#070B16] border border-rose-400/50 flex flex-wrap items-center justify-between gap-2 text-xs"
                  >
                    <div>
                      <span className="font-black text-white">{u.name}</span>
                      <span className="text-slate-300 ml-2">{u.role}</span>
                      <span className="text-rose-200 font-mono ml-2">
                        • {u.lastActiveDays}d silent
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleSendNudge(u.name)}
                      className="px-3.5 py-1.5 rounded-lg text-xs font-black cursor-pointer obsidian-btn obsidian-btn-rose"
                    >
                      Nudge Now
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: GRAPH 1 — ENLARGED, STRUCTURED COMPLETION FUNNEL DIAGNOSTICS */}
      {activeModal === "completion" && (
        <div
          onClick={() => setActiveModal(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/84 backdrop-blur-md p-4 overflow-y-auto"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-5xl rounded-3xl p-6 sm:p-7 bg-[#0B1020] modal-tab-border-purple space-y-5 my-auto shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-white/15 pb-4">
              <div>
                <span className="text-[10.5px] font-black uppercase tracking-[0.22em] text-purple-200 block">
                  GRAPH 01 • COMPLETION FUNNEL DIAGNOSTICS
                </span>
                <h3 className="text-2xl font-black text-white mt-0.5">
                  Cohort Graduation &amp; Bottleneck Breakdown
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 rounded-xl text-xs font-black cursor-pointer obsidian-btn obsidian-btn-slate"
              >
                ✕ Close
              </button>
            </div>

            {/* 4 Bright Summary KPIs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-4 rounded-2xl modal-tab-border-cyan">
                <span className="text-[10px] font-black uppercase text-cyan-200 block">
                  Total Enrollments
                </span>
                <span className="text-2xl font-black text-white font-mono mt-1 block">
                  {donut?.counts?.total ?? 0}
                </span>
              </div>
              <div className="p-4 rounded-2xl modal-tab-border-emerald">
                <span className="text-[10px] font-black uppercase text-emerald-200 block">
                  Completed
                </span>
                <span className="text-2xl font-black text-emerald-300 font-mono mt-1 block">
                  {donut?.counts?.completed ?? 0} ({donut?.percentages?.completed ?? 0}%)
                </span>
              </div>
              <div className="p-4 rounded-2xl modal-tab-border-purple">
                <span className="text-[10px] font-black uppercase text-purple-200 block">
                  In Progress
                </span>
                <span className="text-2xl font-black text-purple-200 font-mono mt-1 block">
                  {donut?.counts?.in_progress ?? 0} ({donut?.percentages?.in_progress ?? 0}%)
                </span>
              </div>
              <div className="p-4 rounded-2xl modal-tab-border-rose">
                <span className="text-[10px] font-black uppercase text-rose-200 block">
                  Not Started
                </span>
                <span className="text-2xl font-black text-rose-200 font-mono mt-1 block">
                  {donut?.counts?.not_started ?? 0} ({donut?.percentages?.not_started ?? 0}%)
                </span>
              </div>
            </div>

            {/* Structured 2-Column Body: Rich Bar Chart Left + Explanation & Action Right */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
              <div className="lg:col-span-7 p-5 rounded-2xl modal-tab-border-cyan flex flex-col justify-between space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-cyan-200">
                    Stage Distribution Volume
                  </span>
                  <span className="text-xs font-bold text-slate-300">
                    Hover bars for exact counts
                  </span>
                </div>

                <div className="h-64 w-full p-2 rounded-2xl bg-[#070614] border-2 border-purple-500/60 shadow-[0_0_25px_rgba(168,85,247,0.25)]">
                  <div className="flex items-center justify-between px-3 pt-2 pb-1 border-b border-purple-500/20 mb-2">
                    <span className="text-[11px] font-black uppercase tracking-wider text-purple-200 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-sm bg-purple-400 shadow-[0_0_8px_#C084FC]" />
                      <span>Cohort Track Velocity</span>
                    </span>
                    <span className="text-[10px] font-bold text-slate-400">Values Displayed Above Bars</span>
                  </div>
                  <ResponsiveContainer width="100%" height="82%">
                    <BarChart
                      data={[
                        { milestone: "Orientation", value: 94, fill: "#0EA5E9" },
                        { milestone: "Foundation", value: 86, fill: "#F97316" },
                        { milestone: "Core Labs", value: 78, fill: "#84CC16" },
                        { milestone: "Quizzes", value: 68, fill: "#EC4899" },
                        { milestone: "Capstone", value: 58, fill: "#A855F7" },
                        { milestone: "Certified", value: 45, fill: "#06B6D4" },
                      ]}
                      margin={{ top: 22, right: 12, left: -18, bottom: 0 }}
                    >
                      <CartesianGrid stroke="#1E1A36" strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="milestone" tick={{ fill: "#F8FAFC", fontSize: 11, fontWeight: 700 }} axisLine={false} tickLine={false} />
                      <YAxis domain={[0, 100]} tick={{ fill: "#94A3B8", fontSize: 10.5 }} axisLine={false} tickLine={false} />
                      <Tooltip content={<ObsidianTooltip suffix="%" />} />
                      <Bar dataKey="value" name="Completion %" radius={[8, 8, 2, 2]} barSize={34}>
                        <LabelList dataKey="value" position="top" fill="#F8FAFC" fontSize={11} fontWeight={900} formatter={(v) => `${v}%`} />
                        {[
                          "#0EA5E9",
                          "#F97316",
                          "#84CC16",
                          "#EC4899",
                          "#A855F7",
                          "#06B6D4",
                        ].map((c, i) => (
                          <Cell key={i} fill={c} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
                <div className="p-4 rounded-2xl modal-tab-border-amber space-y-2">
                  <span className="text-xs font-black uppercase tracking-wider text-amber-200 block">
                    Funnel Telemetry Explanation
                  </span>
                  <p className="text-xs sm:text-sm text-slate-100 leading-relaxed font-medium">
                    Out of <strong>{donut?.counts?.total ?? 0}</strong> enrolled
                    learners,{" "}
                    <strong className="text-purple-200">
                      {donut?.counts?.in_progress ?? 0} (
                      {donut?.percentages?.in_progress ?? 0}%)
                    </strong>{" "}
                    are actively mid-stream while{" "}
                    <strong className="text-rose-200">
                      {donut?.counts?.not_started ?? 0}
                    </strong>{" "}
                    have not initiated Module 1.
                  </p>
                </div>

                <div className="p-4 rounded-2xl modal-tab-border-emerald space-y-3 flex-1 flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <span className="text-xs font-black uppercase tracking-wider text-emerald-300 block">
                      AI Funnel Prescription
                    </span>
                    <p className="text-xs sm:text-sm text-emerald-50 leading-relaxed font-medium">
                      {donut?.recommended_action || globalAi.prescription}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      handleSendNudge(
                        `${donut?.counts?.in_progress ?? 0} in-progress learners`
                      );
                      setActiveModal(null);
                    }}
                    className="w-full py-2.5 rounded-xl text-xs font-black inline-flex items-center justify-center gap-2 cursor-pointer obsidian-btn obsidian-btn-gold"
                  >
                    <Bell className="w-4 h-4" />
                    <span>Blast Completion Nudge Now</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 6: GRAPH 2 — ENLARGED QUIZZES VS VIDEOS CONVERSION REPORT */}
      {activeModal === "engagement" && (
        <div
          onClick={() => setActiveModal(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/84 backdrop-blur-md p-4 overflow-y-auto"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-5xl rounded-3xl p-6 sm:p-7 bg-[#0B1020] modal-tab-border-cyan space-y-5 my-auto shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-white/15 pb-4">
              <div>
                <span className="text-[10.5px] font-black uppercase tracking-[0.22em] text-cyan-200 block">
                  GRAPH 02 • VIDEO-TO-QUIZ CONVERSION REPORT
                </span>
                <h3 className="text-2xl font-black text-white mt-0.5">
                  Daily Quizzes Attempted vs. Videos Watched ({daysRange}D)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 rounded-xl text-xs font-black cursor-pointer obsidian-btn obsidian-btn-slate"
              >
                ✕ Close
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 rounded-2xl modal-tab-border-purple text-center">
                <span className="text-[10px] font-black text-purple-200 uppercase block">
                  Videos Watched
                </span>
                <span className="text-3xl font-black text-white font-mono mt-1 block">
                  {tc.video_completions ?? 65}
                </span>
              </div>
              <div className="p-4 rounded-2xl modal-tab-border-cyan text-center">
                <span className="text-[10px] font-black text-cyan-200 uppercase block">
                  Quizzes &amp; Tests
                </span>
                <span className="text-3xl font-black text-white font-mono mt-1 block">
                  {tc.total_quizzes ?? 35}
                </span>
              </div>
              <div className="p-4 rounded-2xl modal-tab-border-emerald text-center">
                <span className="text-[10px] font-black text-emerald-200 uppercase block">
                  Video → Quiz Ratio
                </span>
                <span className="text-3xl font-black text-emerald-300 font-mono mt-1 block">
                  {overallConversionPct}%
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
              <div className="lg:col-span-6 p-4 rounded-2xl modal-tab-border-amber">
                <span className="text-xs font-black uppercase tracking-wider text-amber-200 block mb-3">
                  Daily Telemetry Breakdown
                </span>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-white/15 text-amber-200 uppercase text-[10px]">
                        <th className="p-2.5">Date</th>
                        <th className="p-2.5">Videos</th>
                        <th className="p-2.5">Quizzes</th>
                        <th className="p-2.5 text-right">Conv %</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                      {normalizedEngagementSeries.map((row) => (
                        <tr key={row.date_label}>
                          <td className="p-2.5 font-bold text-white">
                            {row.date_label}
                          </td>
                          <td className="p-2.5 font-mono text-purple-200 font-bold">
                            {row.videos}
                          </td>
                          <td className="p-2.5 font-mono text-cyan-200 font-bold">
                            {row.quizzes}
                          </td>
                          <td className="p-2.5 text-right font-mono font-black text-emerald-300">
                            {row.conversion}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="lg:col-span-6 flex flex-col justify-between space-y-4">
                <div className="p-4 rounded-2xl modal-tab-border-purple space-y-2">
                  <span className="text-xs font-black uppercase tracking-wider text-purple-200 block">
                    Engagement Diagnostics
                  </span>
                  <p className="text-xs sm:text-sm text-slate-100 leading-relaxed font-medium">
                    Learners logged{" "}
                    <strong className="text-purple-200">
                      {tc.video_completions ?? 65} video completions
                    </strong>{" "}
                    and{" "}
                    <strong className="text-cyan-200">
                      {tc.total_quizzes ?? 35} graded quiz attempts
                    </strong>{" "}
                    with an average mastery score of{" "}
                    <strong className="text-emerald-300">
                      {tc.avg_quiz_mastery ?? 76.4}%
                    </strong>
                    .
                  </p>
                </div>

                <div className="p-4 rounded-2xl modal-tab-border-emerald space-y-3 flex-1 flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <span className="text-xs font-black uppercase tracking-wider text-emerald-300 block">
                      AI Conversion Prescription
                    </span>
                    <p className="text-xs sm:text-sm text-emerald-50 leading-relaxed font-medium">
                      Embed a 2-question quick-check prompt directly at the end of
                      every video lesson to lift Video → Quiz conversion from{" "}
                      <strong>{overallConversionPct}%</strong> above{" "}
                      <strong>75%</strong>.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      handleSendNudge("video-only watchers");
                      setActiveModal(null);
                    }}
                    className="w-full py-2.5 rounded-xl text-xs font-black inline-flex items-center justify-center gap-2 cursor-pointer obsidian-btn obsidian-btn-cyan"
                  >
                    <Bell className="w-4 h-4" />
                    <span>Send Quiz Readiness Reminder</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 7: EDIT AI / ADMIN DEPARTMENT TARGETS */}
      {targetModalOpen && (
        <div
          onClick={() => setTargetModalOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/82 backdrop-blur-md p-4 overflow-y-auto"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xl rounded-3xl p-6 bg-[#0B1020] modal-tab-border-amber space-y-5 my-auto"
          >
            <div className="flex items-center justify-between border-b border-white/15 pb-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-[0.22em] text-amber-200 block">
                  NEURAL MESH TARGET CONTROLLER
                </span>
                <h3 className="text-xl font-black text-white mt-0.5">
                  Set AI &amp; Admin Department Targets
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setTargetModalOpen(false)}
                className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              {departments.map((d) => {
                const curTarget = Number(deptTargets[d.id] ?? d.target ?? 75);
                const actual = Number(d.aiDeepDive?.healthScore ?? 70);
                return (
                  <div
                    key={d.id}
                    className="p-4 rounded-2xl bg-[#070B16] border border-amber-400/35 space-y-2"
                  >
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-white">{d.badge}</span>
                      <span className="font-mono text-amber-200">
                        Actual {actual}% • Target {curTarget}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="40"
                      max="100"
                      step="5"
                      value={curTarget}
                      onChange={(e) =>
                        setDeptTargets((prev) => ({
                          ...prev,
                          [d.id]: Number(e.target.value),
                        }))
                      }
                      className="w-full accent-amber-400 cursor-pointer"
                    />
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setTargetModalOpen(false);
                  showToast("Updated department targets across Neural Mesh!");
                }}
                className="px-5 py-2.5 rounded-xl text-xs font-black cursor-pointer obsidian-btn obsidian-btn-gold"
              >
                Apply Targets Live
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 8: INTERACTIVE SAARTHI AI CO-PILOT CHAT */}
      {activeModal === "ai_chat" && (
        <div
          onClick={() => setActiveModal(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/82 backdrop-blur-md p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl rounded-3xl p-6 bg-[#0B1020] modal-tab-border-amber space-y-4"
          >
            <div className="flex items-center justify-between border-b border-white/15 pb-4">
              <div className="flex items-center gap-3.5">
                <img
                  src={aiAvatarUrl}
                  alt="Saarthi AI"
                  onError={(e) => {
                    e.currentTarget.src = "/saarthi-robot.png";
                  }}
                  className="w-14 h-14 object-contain animate-ai-float"
                />
                <div>
                  <span className="text-[10px] font-black uppercase tracking-[0.22em] text-amber-200 block">
                    SAARTHI AI ANALYTICS CO-PILOT
                  </span>
                  <h3 className="text-lg font-black text-white">
                    Live Telemetry &amp; Target Intelligence
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {[
                "Summarize dead/inactive users right now",
                "Which departments are behind target?",
                "List high-risk candidate attrition alerts",
              ].map((qp) => (
                <button
                  key={qp}
                  type="button"
                  onClick={() => handleSendAiChat(qp)}
                  className="px-3 py-1.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/35 border border-purple-300/55 text-[11px] font-bold text-white cursor-pointer transition"
                >
                  {qp}
                </button>
              ))}
            </div>

            <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
              {chatMessages.map((m, idx) => (
                <div
                  key={idx}
                  className={`p-3.5 rounded-2xl text-xs sm:text-[13px] leading-relaxed font-medium ${
                    m.role === "user"
                      ? "ml-10 obsidian-btn obsidian-btn-purple text-white"
                      : "mr-4 modal-tab-border-cyan text-white"
                  }`}
                >
                  <span className="text-[9.5px] font-black uppercase text-amber-200 block mb-1">
                    {m.role === "user" ? "You" : "Saarthi AI"}
                  </span>
                  {m.text}
                </div>
              ))}
              {chatLoading && (
                <div className="p-3 rounded-2xl modal-tab-border-cyan text-xs text-cyan-200 animate-pulse">
                  Analyzing live telemetry...
                </div>
              )}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendAiChat();
              }}
              className="flex items-center gap-2 pt-2 border-t border-white/15"
            >
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask Saarthi AI about targets, dormant users, or candidates..."
                className="flex-1 rounded-xl bg-[#070B16] border-2 border-purple-300/65 focus:border-amber-300 px-4 py-2.5 text-xs font-semibold text-white outline-none"
              />
              <button
                type="submit"
                className="px-4 py-2.5 rounded-xl text-xs font-black inline-flex items-center gap-1.5 cursor-pointer obsidian-btn obsidian-btn-gold"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Ask AI</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 9: INDIVIDUAL USER REPORT + GRAPH + AI PRESCRIPTION + NUDGE + CANDIDATE ATTRITION */}
      {activeModal === "user_detail" && selectedUser && (
        <div
          onClick={() => setActiveModal(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/84 backdrop-blur-md p-4 overflow-y-auto"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-4xl rounded-3xl p-6 bg-[#0C0A1A] border-2 border-cyan-400/75 shadow-[0_24px_75px_rgba(0,0,0,0.96)] space-y-5 my-auto"
          >
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/15 pb-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-300 to-amber-500 text-slate-950 font-black text-sm flex items-center justify-center shrink-0 shadow-[0_2px_12px_rgba(245,158,11,0.4)]">
                  {selectedUser.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-xl font-black text-white">
                      {selectedUser.name}
                    </h3>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-purple-500/25 text-purple-200 border border-purple-400/50">
                      {selectedUser.role}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border ${
                        selectedUser.status === "On-Time"
                          ? "bg-emerald-500/20 text-emerald-300 border-emerald-400/50"
                          : selectedUser.status === "Dead / Inactive"
                          ? "bg-rose-500/20 text-rose-300 border-rose-400/50"
                          : "bg-amber-500/20 text-amber-300 border-amber-400/50"
                      }`}
                    >
                      {selectedUser.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {selectedUser.email} • Last active{" "}
                    {selectedUser.lastActiveDays === 0
                      ? "Today"
                      : `${selectedUser.lastActiveDays} day(s) ago`}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/15 border border-white/15 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 4 Key User Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-2xl bg-[#080712] border border-purple-400/40">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">
                  Videos Completed
                </span>
                <span className="text-2xl font-black text-purple-300 font-mono mt-1 block">
                  {selectedUser.videosCompleted} / {selectedUser.totalVideos}
                </span>
              </div>
              <div className="p-3.5 rounded-2xl bg-[#080712] border border-cyan-400/40">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">
                  Quizzes Completed
                </span>
                <span className="text-2xl font-black text-cyan-300 font-mono mt-1 block">
                  {selectedUser.quizzesCompleted} / {selectedUser.totalQuizzes}
                </span>
              </div>
              <div className="p-3.5 rounded-2xl bg-[#080712] border border-emerald-400/40">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">
                  Quiz Mastery
                </span>
                <span className="text-2xl font-black text-emerald-300 font-mono mt-1 block">
                  {selectedUser.quizMastery}%
                </span>
              </div>
              <div className="p-3.5 rounded-2xl bg-[#080712] border border-amber-400/40">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">
                  Curos &amp; Medals
                </span>
                <span className="text-xl font-black text-amber-300 font-mono mt-1 block">
                  {selectedUser.curos} • {selectedUser.medals}M
                </span>
              </div>
            </div>

            {/* Individual Performance Graph + AI Prescription & Nudge */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Dedicated Individual Performance Graph */}
              <div className="lg:col-span-6 p-4 rounded-2xl bg-[#080712] border border-white/15 space-y-2">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-300 block">
                  INDIVIDUAL PERFORMANCE TELEMETRY
                </span>
                <div className="w-full h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={selectedUserChartData}
                      margin={{ top: 10, right: 10, left: -24, bottom: 0 }}
                    >
                      <CartesianGrid stroke="#1C1833" strokeDasharray="3 3" vertical={false} />
                      <XAxis
                        dataKey="metric"
                        tick={{ fill: "#E2E8F0", fontSize: 11, fontWeight: 700 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        domain={[0, 100]}
                        tick={{ fill: "#64748B", fontSize: 10 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip content={<ObsidianTooltip />} />
                      <Bar dataKey="value" name="Score %" radius={[8, 8, 2, 2]} barSize={36}>
                        {selectedUserChartData.map((entry, idx) => (
                          <Cell key={idx} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* AI Prescription + Instant Nudge */}
              <div className="lg:col-span-6 p-4 rounded-2xl bg-gradient-to-br from-[#0F1B1D] via-[#0B0E1A] to-[#080712] border border-emerald-400/45 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>PERSONALIZED AI PRESCRIPTION</span>
                  </span>
                  <p className="text-xs sm:text-sm text-emerald-100 leading-relaxed font-medium">
                    {selectedUser.aiPrescription}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => handleSendNudge(selectedUser.name)}
                    className="flex-1 py-2.5 px-4 rounded-xl text-xs font-black inline-flex items-center justify-center gap-1.5 cursor-pointer obsidian-btn obsidian-btn-gold"
                  >
                    <Bell className="w-3.5 h-3.5" />
                    <span>Send Direct Nudge</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSchedulerAttendee(selectedUser)}
                    className="py-2.5 px-4 rounded-xl text-xs font-black inline-flex items-center gap-1.5 cursor-pointer obsidian-btn obsidian-btn-cyan"
                  >
                    <span>📅 Book Call</span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      showToast(
                        `Granted +50 Curos encouragement bounty to ${selectedUser.name}`
                      )
                    }
                    className="py-2.5 px-4 rounded-xl text-xs font-extrabold inline-flex items-center gap-1.5 cursor-pointer transition obsidian-btn obsidian-btn-purple"
                  >
                    <Coins className="w-3.5 h-3.5 text-amber-300" />
                    <span>+50 Curos</span>
                  </button>
                </div>
              </div>
            </div>

            {/* CANDIDATE ATTRITION SECTION (SHOWN SPECIFICALLY FOR CANDIDATES) */}
            {selectedUser.isCandidate && (
              <div className="p-5 rounded-2xl bg-gradient-to-r from-[#1D0D1A] via-[#120D1F] to-[#0B0A18] border-2 border-rose-400/60 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-[0.22em] text-rose-300 flex items-center gap-1.5">
                      <Flame className="w-3.5 h-3.5" />
                      <span>CANDIDATE ATTRITION DIAGNOSTICS &amp; SIMULATOR</span>
                    </span>
                    <h4 className="text-base font-black text-white mt-0.5">
                      Flight Risk Forecast for {selectedUser.name}
                    </h4>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-400 line-through font-mono">
                      Base: {selectedUser.attritionRisk}%
                    </span>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-black font-mono border ${
                        simulatedUserRisk < 40
                          ? "bg-emerald-500/20 text-emerald-300 border-emerald-400/50 shadow-[0_0_10px_rgba(52,211,153,0.3)]"
                          : "bg-rose-500/20 text-rose-300 border-rose-400/55 shadow-[0_0_10px_rgba(244,63,94,0.3)]"
                      }`}
                    >
                      Projected Risk: {simulatedUserRisk}%
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {[
                    {
                      key: "microVideo",
                      label: "3-Min Micro-Video Recap",
                      impact: "-22% Risk",
                    },
                    {
                      key: "peerBuddy",
                      label: "Assign Top-Performer Buddy",
                      impact: "-18% Risk",
                    },
                    {
                      key: "bonusCuros",
                      label: "+50 Curos Quiz Bounty",
                      impact: "-15% Risk",
                    },
                  ].map((item) => (
                    <label
                      key={item.key}
                      className={`p-3 rounded-xl border flex items-center justify-between gap-2 cursor-pointer text-xs transition ${
                        attritionToggles[item.key]
                          ? "bg-emerald-500/12 border-emerald-400/60 text-white shadow-[0_0_10px_rgba(52,211,153,0.2)]"
                          : "bg-black/40 border-white/10 text-slate-300"
                      }`}
                    >
                      <div>
                        <span className="font-bold block">{item.label}</span>
                        <span className="text-[10px] font-black text-emerald-300 font-mono">
                          {item.impact}
                        </span>
                      </div>
                      <input
                        type="checkbox"
                        checked={attritionToggles[item.key]}
                        onChange={() =>
                          setAttritionToggles((prev) => ({
                            ...prev,
                            [item.key]: !prev[item.key],
                          }))
                        }
                        className="accent-emerald-400 w-4 h-4 cursor-pointer"
                      />
                    </label>
                  ))}
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      showToast(
                        `Candidate Retention Plan deployed for ${selectedUser.name} (Risk projected down to ${simulatedUserRisk}%)`
                      );
                      setActiveModal(null);
                    }}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 text-xs font-black inline-flex items-center gap-2 cursor-pointer hover:brightness-110 transition shadow-[0_0_18px_rgba(52,211,153,0.4)]"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Deploy Candidate Attrition Rescue Plan</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      <MeetingSchedulerModal
        isOpen={Boolean(schedulerAttendee)}
        onClose={() => setSchedulerAttendee(null)}
        attendee={schedulerAttendee}
        onQueued={() => {
          showToast("Coaching call queued in Admin Agent Inbox!");
        }}
      />
      </div>
    </MainLayout>
  );
}
