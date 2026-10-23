import React, { useState, useEffect } from "react";
import NeuralRiskMeshDark from "../../components/NeuralRiskMeshDark";

const BACKEND_URL =
  import.meta.env.VITE_API_URL ||
  (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
    ? ""
    : "https://saarthi-curious-00e8.onrender.com");

export default function ReportsAnalyticsDarkGlow() {
  // Filter & Tab State
  const [roleFilter, setRoleFilter] = useState("all"); // 'all' | 'employee' | 'student'
  const [scopeTab, setScopeTab] = useState("org"); // 'org' | 'franchise' | 'current'
  const [daysRange, setDaysRange] = useState(7); // 7 | 30
  const [isolatedStream, setIsolatedStream] = useState("all"); // 'all' | 'quizzes' | 'videos'
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Graph 1 State (UserProgramProgress Donut)
  const [donut, setDonut] = useState({
    counts: { completed: 5, in_progress: 14, not_started: 3, total: 22 },
    percentages: { completed: 22.7, in_progress: 63.6, not_started: 13.7 },
    needs_reminder_blast: true,
    recommended_action: "14 learners (63.6%) are stuck In-Progress. Dispatch Saarthi AI nudge?",
  });

  // Graph 2 & Row 2 Telemetry State (QuizAttempt + UserVideoProgress)
  const [engagement, setEngagement] = useState({
    series: [
      { date_label: "Oct 16", quizzes_taken: 4, videos_completed: 9 },
      { date_label: "Oct 17", quizzes_taken: 8, videos_completed: 15 },
      { date_label: "Oct 18", quizzes_taken: 6, videos_completed: 12 },
      { date_label: "Oct 19", quizzes_taken: 12, videos_completed: 21 },
      { date_label: "Oct 20", quizzes_taken: 10, videos_completed: 18 },
      { date_label: "Oct 21", quizzes_taken: 16, videos_completed: 25 },
      { date_label: "Oct 22", quizzes_taken: 19, videos_completed: 31 },
    ],
    telemetry_cards: {
      total_quizzes: 75,
      avg_quiz_mastery: 78.4,
      total_videos: 131,
      staff_count: 10,
      student_count: 12,
      curos_in_circulation: 435,
      platform_health_score: 86,
    },
  });

  // AI Insights State
  const [aiInsights, setAiInsights] = useState({
    high_risk_count: 17,
    high_risk_summary: "17 of 22 learners stalled in Client Relationships (26.6% completion).",
    prescription_title: "30-Day AI Prescription",
    prescription_detail: "Assign 3-min micro-videos + 50 Curos quiz bounty to hit 45% active rate.",
    target_activation_pct: 45,
  });

  // Row 3 Right: Persona AI Prescription Simulator State
  const [persona, setPersona] = useState({
    name: "Marcus Vance",
    role: "Employee • Franchise West",
    cohort: "Module 3: Client Relationships",
    baseRisk: 86,
    toggles: {
      microVideo: true,
      peerBuddy: true,
      bonusCuros: false,
    },
  });

  // Connect to FastAPI Backend Endpoints
  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const [donutRes, engRes, aiRes] = await Promise.all([
          fetch(`${BACKEND_URL}/api/analytics/completion-donut?role=${roleFilter}`),
          fetch(`${BACKEND_URL}/api/analytics/weekly-engagement?days=${daysRange}&scope=${scopeTab}&role=${roleFilter}`),
          fetch(`${BACKEND_URL}/api/analytics/ai-insights`),
        ]);
        if (donutRes.ok) setDonut(await donutRes.json());
        if (engRes.ok) setEngagement(await engRes.json());
        if (aiRes.ok) setAiInsights(await aiRes.json());
      } catch (err) {
        // Fallback state remains active if backend is offline during UI preview
        console.warn("Analytics fetch fallback active:", err);
      }
    };
    fetchAnalytics();
  }, [roleFilter, scopeTab, daysRange]);

  // SVG Donut Math (r = 54 => circumference = 339.29)
  const C = 339.29;
  const completedArc = ((donut.percentages?.completed || 0) / 100) * C;
  const inProgressArc = ((donut.percentages?.in_progress || 0) / 100) * C;

  // Simulated Flight Risk Calculation
  const simulatedRisk = Math.max(
    12,
    persona.baseRisk -
      (persona.toggles.microVideo ? 24 : 0) -
      (persona.toggles.peerBuddy ? 19 : 0) -
      (persona.toggles.bonusCuros ? 14 : 0)
  );

  return (
    <div className="min-h-screen bg-[#090812] text-slate-100 flex relative overflow-x-hidden font-sans selection:bg-purple-500 selection:text-white">
      {/* Ambient Background Glows */}
      <div className="pointer-events-none fixed top-0 left-1/4 w-[500px] h-[500px] bg-purple-700/10 rounded-full blur-[130px]" />
      <div className="pointer-events-none fixed bottom-0 right-1/4 w-[450px] h-[450px] bg-fuchsia-600/10 rounded-full blur-[140px]" />

      {/* MAIN CONTENT CONTAINER */}
      <div className="flex-1 p-6 pr-16 max-w-[1620px] mx-auto space-y-6 relative z-10">
        
        {/* TOP HEADER BAR */}
        <header className="flex flex-wrap items-center justify-between gap-4 bg-[#12101E]/90 backdrop-blur-xl p-4 rounded-2xl border border-purple-500/20 shadow-[0_0_25px_-5px_rgba(139,92,246,0.15)]">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-white via-purple-200 to-fuchsia-400 bg-clip-text text-transparent">
                Reports & Analytics
              </h1>
              <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30">
                FastAPI Live Telemetry
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Monitor program completion health, daily engagement velocity, and Saarthi AI prescriptions
            </p>
          </div>

          {/* Employee vs. Student Persona Role Filter */}
          <div className="flex items-center gap-1.5 bg-[#090812] p-1.5 rounded-xl border border-white/10">
            {[
              { id: "all", label: "🌐 All Users (22)" },
              { id: "employee", label: "👨💼 Employees / Staff (10)" },
              { id: "student", label: "🎓 Students / Learners (12)" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setRoleFilter(tab.id)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  roleFilter === tab.id
                    ? "bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white shadow-[0_0_15px_rgba(168,85,247,0.5)]"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </header>

        {/* ===================================================================
            ROW 1: GRAPH 1 (DONUT) + GRAPH 2/3 (AREA) + AI INSIGHTS
        =================================================================== */}
        <section className="grid grid-cols-12 gap-5">
          
          {/* GRAPH 1: Course Completion & Progress (The Donut Chart) */}
          <div className="col-span-12 lg:col-span-4 bg-[#12101E]/90 backdrop-blur-xl rounded-2xl p-5 border border-purple-500/20 shadow-[0_0_30px_-5px_rgba(139,92,246,0.15)] flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-purple-300 bg-purple-500/15 border border-purple-500/30 px-2 py-0.5 rounded-md">
                  Graph 1 • Org Main
                </span>
                <h2 className="text-base font-bold text-white mt-1.5">
                  Course Completion & Progress
                </h2>
                <p className="text-[11px] text-slate-400">Table: UserProgramProgress</p>
              </div>
              {donut.needs_reminder_blast && (
                <span className="text-[11px] font-semibold text-amber-300 bg-amber-500/15 border border-amber-500/30 px-2.5 py-1 rounded-full animate-pulse">
                  ⚠️ {donut.percentages.in_progress}% In Progress
                </span>
              )}
            </div>

            {/* Glowing SVG Donut Chart */}
            <div className="flex items-center gap-6 my-4">
              <div className="relative w-36 h-36 flex items-center justify-center shrink-0">
                <svg className="w-36 h-36 -rotate-90 overflow-visible" viewBox="0 0 128 128">
                  <defs>
                    <filter id="neonGlowPurple" x="-20%" y="-20%" width="140%" height="140%">
                      <feDropShadow dx="0" dy="0" stdDeviation="3.5" floodColor="#A855F7" />
                    </filter>
                    <filter id="neonGlowEmerald" x="-20%" y="-20%" width="140%" height="140%">
                      <feDropShadow dx="0" dy="0" stdDeviation="3.5" floodColor="#10B981" />
                    </filter>
                  </defs>

                  {/* Track */}
                  <circle cx="64" cy="64" r="54" fill="none" stroke="#1E1B2E" strokeWidth="14" />

                  {/* In-Progress Arc (Glowing Purple) */}
                  <circle
                    cx="64"
                    cy="64"
                    r="54"
                    fill="none"
                    stroke="#A855F7"
                    strokeWidth="14"
                    strokeDasharray={`${inProgressArc} ${C}`}
                    strokeDashoffset={-completedArc}
                    strokeLinecap="round"
                    filter="url(#neonGlowPurple)"
                  />

                  {/* Completed Arc (Glowing Emerald) */}
                  <circle
                    cx="64"
                    cy="64"
                    r="54"
                    fill="none"
                    stroke="#10B981"
                    strokeWidth="14"
                    strokeDasharray={`${completedArc} ${C}`}
                    strokeLinecap="round"
                    filter="url(#neonGlowEmerald)"
                  />
                </svg>
                <div className="absolute text-center">
                  <span className="text-2xl font-extrabold text-white drop-shadow-[0_0_10px_rgba(16,185,129,0.5)]">
                    {donut.percentages.completed}%
                  </span>
                  <span className="block text-[10px] uppercase tracking-widest text-slate-400 font-semibold">
                    Completed
                  </span>
                </div>
              </div>

              {/* Status Breakdown Pills */}
              <div className="space-y-2.5 flex-1 text-xs">
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25">
                  <span className="flex items-center gap-2 text-emerald-300 font-medium">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#10B981]" />
                    Completed
                  </span>
                  <span className="font-bold text-white">
                    {donut.counts.completed} ({donut.percentages.completed}%)
                  </span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-purple-500/15 border border-purple-500/35">
                  <span className="flex items-center gap-2 text-purple-200 font-semibold">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-400 shadow-[0_0_8px_#A855F7]" />
                    In Progress
                  </span>
                  <span className="font-bold text-purple-200">
                    {donut.counts.in_progress} ({donut.percentages.in_progress}%)
                  </span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/10">
                  <span className="flex items-center gap-2 text-slate-400">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-500" />
                    Not Started
                  </span>
                  <span className="font-bold text-slate-300">
                    {donut.counts.not_started} ({donut.percentages.not_started}%)
                  </span>
                </div>
              </div>
            </div>

            {/* Automated Action CTA */}
            <button
              onClick={() => alert(`Nudge blast scheduled for ${donut.counts.in_progress} in-progress learners!`)}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white text-xs font-bold shadow-[0_0_20px_rgba(168,85,247,0.4)] hover:opacity-95 transition"
            >
              🔔 Blast Reminder to {donut.counts.in_progress} In-Progress Users
            </button>
          </div>

          {/* GRAPH 2 & 3: Weekly Engagement / Active Learners (The Area Chart) */}
          <div className="col-span-12 lg:col-span-5 bg-[#12101E]/90 backdrop-blur-xl rounded-2xl p-5 border border-fuchsia-500/20 shadow-[0_0_30px_-5px_rgba(217,70,239,0.12)] flex flex-col justify-between">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-md inline-flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  Graph 2 & 3 • Live Velocity
                </span>
                <h2 className="text-base font-bold text-white mt-1.5">
                  Weekly Engagement & Active Learners
                </h2>
                <p className="text-[11px] text-slate-400">
                  Tables: QuizAttempt (attempted_at) & UserVideoProgress (completed_at)
                </p>
              </div>

              {/* Scope Switcher from Sketch: Organization | Franchise | Current */}
              <div className="flex items-center gap-1 bg-[#090812] p-1 rounded-xl border border-white/10 text-xs">
                {[
                  { id: "org", label: "Organization" },
                  { id: "franchise", label: "Franchise" },
                  { id: "current", label: "Current" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setScopeTab(tab.id)}
                    className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                      scopeTab === tab.id
                        ? "bg-purple-600/30 text-purple-200 border border-purple-500/40"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Glowing Multi-Spline Area Chart */}
            <div className="my-3 relative">
              <svg className="w-full h-44 overflow-visible" viewBox="0 0 500 150">
                <defs>
                  <linearGradient id="darkVideoGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#D946EF" stopOpacity="0.45" />
                    <stop offset="100%" stopColor="#D946EF" stopOpacity="0.0" />
                  </linearGradient>
                  <linearGradient id="darkQuizGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10B981" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Subtle Dark Grid Lines */}
                {[30, 70, 110].map((y) => (
                  <line key={y} x1="0" y1={y} x2="500" y2={y} stroke="#1F1B33" strokeDasharray="4 4" />
                ))}

                {/* Video Completions Glowing Magenta-Purple Spline */}
                {isolatedStream !== "quizzes" && (
                  <>
                    <path
                      d="M 10,118 C 85,82 155,95 235,55 C 315,72 395,30 485,15 L 485,140 L 10,140 Z"
                      fill="url(#darkVideoGrad)"
                    />
                    <path
                      d="M 10,118 C 85,82 155,95 235,55 C 315,72 395,30 485,15"
                      fill="none"
                      stroke="#D946EF"
                      strokeWidth="3"
                      style={{ filter: "drop-shadow(0 0 8px rgba(217, 70, 239, 0.7))" }}
                    />
                    <circle cx="485" cy="15" r="5" fill="#F0ABFC" />
                    <circle cx="485" cy="15" r="11" fill="none" stroke="#D946EF" strokeWidth="1.5" className="animate-ping" />
                  </>
                )}

                {/* Quiz Attempts Glowing Emerald Spline */}
                {isolatedStream !== "videos" && (
                  <>
                    <path
                      d="M 10,132 C 85,112 155,120 235,88 C 315,98 395,62 485,45 L 485,140 L 10,140 Z"
                      fill="url(#darkQuizGrad)"
                    />
                    <path
                      d="M 10,132 C 85,112 155,120 235,88 C 315,98 395,62 485,45"
                      fill="none"
                      stroke="#10B981"
                      strokeWidth="2.5"
                      style={{ filter: "drop-shadow(0 0 8px rgba(16, 185, 129, 0.65))" }}
                    />
                    <circle cx="485" cy="45" r="4.5" fill="#6EE7B7" />
                  </>
                )}
              </svg>

              <div className="flex justify-between text-[11px] text-slate-400 font-medium px-2">
                {engagement.series.map((pt) => (
                  <span key={pt.date_label}>{pt.date_label}</span>
                ))}
              </div>
            </div>

            {/* Legend & 7D / 30D Toggle */}
            <div className="flex items-center justify-between pt-2 border-t border-white/10 text-xs">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5 font-semibold text-fuchsia-300">
                  <span className="w-2.5 h-2.5 rounded-full bg-fuchsia-400 shadow-[0_0_8px_#D946EF]" />
                  Videos Completed ({engagement.telemetry_cards?.total_videos || 131})
                </span>
                <span className="flex items-center gap-1.5 font-semibold text-emerald-300">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#10B981]" />
                  Quiz Attempts ({engagement.telemetry_cards?.total_quizzes || 75})
                </span>
              </div>

              <div className="flex gap-1 bg-[#090812] p-1 rounded-lg border border-white/10">
                {[7, 30].map((d) => (
                  <button
                    key={d}
                    onClick={() => setDaysRange(d)}
                    className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                      daysRange === d ? "bg-purple-600 text-white" : "text-slate-400"
                    }`}
                  >
                    {d}D
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* AI INSIGHTS CARD (-High Risk, -Prescription) */}
          <div className="col-span-12 lg:col-span-3 bg-[#151226]/95 backdrop-blur-xl rounded-2xl p-5 border border-purple-500/30 shadow-[0_0_30px_-5px_rgba(139,92,246,0.2)] flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-purple-200 bg-purple-500/20 border border-purple-400/30 px-2.5 py-1 rounded-full">
                ✨ Saarthi & Groq AI
              </span>
              <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                Live Co-Pilot
              </span>
            </div>

            <div className="space-y-3 my-3">
              {/* Sketch Item 1: -High Risk */}
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30">
                <div className="flex items-center justify-between text-xs font-bold text-rose-300">
                  <span>🔴 High Risk Alert</span>
                  <span>{aiInsights.high_risk_count} Inactive</span>
                </div>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  {aiInsights.high_risk_summary}
                </p>
              </div>

              {/* Sketch Item 2: -Prescription */}
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                <div className="flex items-center justify-between text-xs font-bold text-emerald-300">
                  <span>💊 {aiInsights.prescription_title}</span>
                  <span>Goal: {aiInsights.target_activation_pct}%</span>
                </div>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  {aiInsights.prescription_detail}
                </p>
              </div>
            </div>

            <button
              onClick={() => alert("AI Prescription deployed! Micro-videos and bonus curos enabled.")}
              className="w-full py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/15 border border-purple-400/30 text-purple-200 font-semibold text-xs transition"
            >
              ⚡ Execute AI Prescription Plan →
            </button>
          </div>
        </section>

        {/* ===================================================================
            ROW 2: 4 REAL-TIME TELEMETRY CARDS (From Wireframe Middle Strip)
            1. Tests / Quizzes | 2. Info - Detailed | 3. Videos | 4. Health ♡
        =================================================================== */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Tests / Quizzes */}
          <div
            onClick={() => setIsolatedStream(isolatedStream === "quizzes" ? "all" : "quizzes")}
            className={`cursor-pointer p-4 rounded-2xl bg-[#12101E] border transition ${
              isolatedStream === "quizzes"
                ? "border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                : "border-white/10 hover:border-emerald-500/40"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase">1. Tests & Quizzes</span>
              <span className="text-xs font-bold text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded-md">
                Avg {engagement.telemetry_cards?.avg_quiz_mastery || 78.4}%
              </span>
            </div>
            <div className="text-2xl font-extrabold text-white mt-1.5">
              {engagement.telemetry_cards?.total_quizzes || 75} Attempts
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Click card to isolate Quiz spline in Graph 2</p>
          </div>

          {/* Card 2: Info - Detailed */}
          <div className="p-4 rounded-2xl bg-[#12101E] border border-white/10 hover:border-amber-500/40 transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase">2. Info - Detailed</span>
              <span className="text-xs font-bold text-amber-300 bg-amber-500/15 px-2 py-0.5 rounded-md">
                🪙 {engagement.telemetry_cards?.curos_in_circulation || 435} Curos
              </span>
            </div>
            <div className="text-2xl font-extrabold text-white mt-1.5">
              {engagement.telemetry_cards?.staff_count || 10} Staff / {engagement.telemetry_cards?.student_count || 12} Students
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Active across 5 Franchise partner hubs</p>
          </div>

          {/* Card 3: Videos */}
          <div
            onClick={() => setIsolatedStream(isolatedStream === "videos" ? "all" : "videos")}
            className={`cursor-pointer p-4 rounded-2xl bg-[#12101E] border transition ${
              isolatedStream === "videos"
                ? "border-fuchsia-400 shadow-[0_0_20px_rgba(217,70,239,0.3)]"
                : "border-white/10 hover:border-fuchsia-500/40"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase">3. Videos</span>
              <span className="text-xs font-bold text-fuchsia-300 bg-fuchsia-500/15 px-2 py-0.5 rounded-md">
                82% Retention
              </span>
            </div>
            <div className="text-2xl font-extrabold text-white mt-1.5">
              {engagement.telemetry_cards?.total_videos || 131} Completed
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Click card to isolate Video spline in Graph 2</p>
          </div>

          {/* Card 4: Health ♡ */}
          <div className="p-4 rounded-2xl bg-[#12101E] border border-white/10 hover:border-rose-500/40 transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase">4. Platform Health ♡</span>
              <span className="text-xs font-bold text-rose-400 animate-pulse">♥ Live Pulse</span>
            </div>
            <div className="text-2xl font-extrabold text-emerald-400 mt-1.5">
              {engagement.telemetry_cards?.platform_health_score || 86}% Vitality
            </div>
            <p className="text-[11px] text-slate-400 mt-1">9 High-Risk learners rescued this month</p>
          </div>
        </section>

        {/* ===================================================================
            ROW 3: PREDICTED GRAPH (3D MESH) + DETAILED GRAPH & AI REPORT RISKS
        =================================================================== */}
        <section className="grid grid-cols-12 gap-5">
          {/* Bottom Left: Predicted Graph (3D Moving Node-Mesh from DP.JPG) */}
          <div className="col-span-12 lg:col-span-7 bg-[#12101E]/90 backdrop-blur-xl rounded-2xl p-5 border border-amber-500/20 shadow-[0_0_30px_-5px_rgba(245,158,11,0.12)]">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-amber-300 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-md">
                  Predicted Graph • 3D Neural Risk Mesh
                </span>
                <h3 className="text-base font-bold text-white mt-1">
                  AI Predicted Attrition & Curriculum Bottleneck Topology
                </h3>
              </div>
              <span className="text-xs text-slate-400">
                Real-Time 30-Day Trajectory Projection
              </span>
            </div>

            <NeuralRiskMeshDark
              onSelectHotspot={(spot) =>
                setPersona((prev) => ({
                  ...prev,
                  name: spot.name,
                  cohort: spot.cohort,
                  baseRisk: spot.baseRisk,
                }))
              }
            />
          </div>

          {/* Bottom Right: Detailed Graph / Prediction, AI Report Risks */}
          <div className="col-span-12 lg:col-span-5 bg-[#12101E]/90 backdrop-blur-xl rounded-2xl p-5 border border-purple-500/25 shadow-[0_0_30px_-5px_rgba(139,92,246,0.18)] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-widest text-purple-300 bg-purple-500/15 border border-purple-500/30 px-2 py-0.5 rounded-md">
                  Detailed Graph • AI Report Risks & Simulator
                </span>
                <span
                  className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full ${
                    simulatedRisk < 40
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                      : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                  }`}
                >
                  Simulated Risk: {simulatedRisk}%
                </span>
              </div>

              {/* Selected Persona Card */}
              <div className="mt-3 p-3.5 rounded-xl bg-[#090812] border border-white/10 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-white">{persona.name}</h4>
                  <p className="text-xs text-slate-400">
                    {persona.role} • {persona.cohort}
                  </p>
                </div>
                <div className="text-right">
                  <span
                    className={`text-xl font-extrabold ${
                      simulatedRisk < 40 ? "text-emerald-400" : "text-rose-400"
                    }`}
                  >
                    {simulatedRisk}%
                  </span>
                  <span className="block text-[10px] text-slate-500 uppercase">Flight Risk</span>
                </div>
              </div>

              {/* Interactive "What-If" Prescription Toggles */}
              <div className="mt-4 space-y-2.5">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Simulate AI Prescriptions (Live Risk Reduction):
                </p>
                {[
                  {
                    key: "microVideo",
                    label: "Convert Module 3 to 3-Min Micro-Video (-24% Risk)",
                  },
                  {
                    key: "peerBuddy",
                    label: "Pair with Franchise Top-Performer Buddy (-19% Risk)",
                  },
                  {
                    key: "bonusCuros",
                    label: "Inject +50 Bonus Curos Completion Bounty (-14% Risk)",
                  },
                ].map((item) => (
                  <label
                    key={item.key}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.03] border border-white/10 hover:border-purple-500/40 cursor-pointer text-xs text-slate-200 transition"
                  >
                    <span>{item.label}</span>
                    <input
                      type="checkbox"
                      checked={persona.toggles[item.key]}
                      onChange={() =>
                        setPersona((prev) => ({
                          ...prev,
                          toggles: {
                            ...prev.toggles,
                            [item.key]: !prev.toggles[item.key],
                          },
                        }))
                      }
                      className="rounded bg-slate-900 border-purple-500 text-purple-600 focus:ring-purple-500"
                    />
                  </label>
                ))}
              </div>
            </div>

            <button
              onClick={() => alert(`Prescription deployed for ${persona.name}! Risk reduced to ${simulatedRisk}%. PDF summary triggered.`)}
              className="mt-4 w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-xs font-bold shadow-[0_0_20px_rgba(16,185,129,0.35)] hover:opacity-95 transition"
            >
              ⚡ Deploy AI Prescription & Export Detailed Risk PDF
            </button>
          </div>
        </section>
      </div>

      {/* ===================================================================
          FAR-RIGHT "CLOSED TAB" SLIDE-OVER DRAWER (From Wireframe Right Edge)
      =================================================================== */}
      <button
        onClick={() => setIsDrawerOpen(!isDrawerOpen)}
        className="fixed right-0 top-1/3 bg-[#161329] text-purple-200 py-6 px-2.5 rounded-l-2xl shadow-[0_0_25px_rgba(139,92,246,0.35)] border-l border-y border-purple-500/40 z-40 flex flex-col items-center gap-2 hover:bg-purple-900/60 transition"
      >
        <span className="text-[11px] font-bold tracking-widest [writing-mode:vertical-rl] rotate-180">
          {isDrawerOpen ? "CLOSE REPORTS DRAWER ✕" : "REPORTS & EXPORTS TAB ◀"}
        </span>
      </button>

      {isDrawerOpen && (
        <aside className="fixed right-0 top-0 h-full w-96 bg-[#110E20]/95 backdrop-blur-2xl shadow-2xl border-l border-purple-500/30 p-6 z-30 overflow-y-auto text-slate-100">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-bold text-white">Generated Reports & Exports</h3>
            <button
              onClick={() => setIsDrawerOpen(false)}
              className="text-slate-400 hover:text-white p-1 rounded-lg"
            >
              ✕
            </button>
          </div>
          <p className="text-xs text-slate-400 mb-5">
            Instant PDF & CSV generation for all 5 Saarthi report templates
          </p>
          <div className="space-y-3">
            {[
              "Organization Learning Report",
              "Franchise Performance Report",
              "Learner Engagement Report",
              "Franchise Learning Report",
              "Team Progress Report",
            ].map((rep) => (
              <div
                key={rep}
                className="p-3.5 rounded-xl border border-white/10 bg-white/[0.03] flex items-center justify-between"
              >
                <span className="text-xs font-semibold text-slate-200">{rep}</span>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => alert(`Generating PDF for ${rep}...`)}
                    className="px-2.5 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-[11px] font-bold transition"
                  >
                    PDF
                  </button>
                  <button
                    onClick={() => alert(`Exporting CSV for ${rep}...`)}
                    className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-slate-200 rounded-lg text-[11px] font-bold transition"
                  >
                    CSV
                  </button>
                </div>
              </div>
            ))}
          </div>
        </aside>
      )}
    </div>
  );
}
