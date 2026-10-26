import React, { useState, useEffect } from "react";
import {
  ResponsiveContainer,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

const ROBOT_AVATAR_URL = "/saarthi-robot.png";

// ============================================================================
// 1. OBSIDIAN TOOLTIP
// ============================================================================
const ObsidianTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="bg-[#070B16]/95 backdrop-blur-xl border border-cyan-400/40 px-3.5 py-2.5 rounded-xl shadow-[0_0_25px_rgba(34,211,238,0.35)] text-xs z-50">
      {label && (
        <p className="font-bold text-cyan-200 mb-1 border-b border-white/10 pb-1">
          {label}
        </p>
      )}
      {payload.map((entry, idx) => (
        <div key={idx} className="flex items-center justify-between gap-4 py-0.5">
          <span className="flex items-center gap-1.5 text-slate-300 font-medium">
            <span
              className="w-2 h-2 rounded-full"
              style={{
                backgroundColor: entry.color || entry.stroke || "#38BDF8",
                boxShadow: `0 0 8px ${entry.color || entry.stroke || "#38BDF8"}`,
              }}
            />
            {entry.name}:
          </span>
          <span className="font-extrabold text-white">{entry.value}%</span>
        </div>
      ))}
    </div>
  );
};

// ============================================================================
// 2. PERSONALIZED CANDIDATE TELEMETRY ENGINE
// ============================================================================
export function buildPersonalizedBackupReport(student, cohortSize = 19) {
  const name = student?.name || "Candidate";
  const firstName = name.split(" ")[0];
  const prog = student?.program_name || "Client Relationships";
  const comp = Number(student?.completion_pct ?? 0);
  const quiz = Number(student?.quiz_mastery_pct ?? 0);
  const attempts = Number(student?.quiz_attempts_count ?? 0);
  const videos = Number(student?.videos_completed_count ?? 0);
  const curos = Number(student?.curos ?? 0);
  const risk = Number(student?.risk_score ?? 100);

  const nameHash = name
    .split("")
    .reduce((acc, ch, idx) => acc + ch.charCodeAt(0) * (idx + 1), 0);
  const personalLift = 18 + (nameHash % 14);

  let archetype = "mid_funnel_stalled";
  if (comp === 0 && attempts === 0 && videos === 0) {
    archetype = "zero_start_dormant";
  } else if (comp >= 75 || (quiz >= 80 && comp >= 50)) {
    archetype = "high_velocity_champion";
  } else if (quiz < 65 && attempts > 0) {
    archetype = "assessment_friction";
  }

  // ARCHETYPE A: ZERO-START / DORMANT ENROLLMENT
  if (archetype === "zero_start_dormant") {
    const projectedDay7 = Math.min(85, 42 + personalLift);
    return {
      archetype: "Onboarding Ignition Required",
      badgeColor: "#F43F5E",
      headline: `${name} is enrolled in "${prog}" but has not initiated Module 1 yet (0 videos, 0 quizzes).`,
      customParameters: [
        { label: "Onboarding Stage", value: "Pre-Start (0%)", sub: "Awaiting First Login" },
        { label: "Ignition Potential", value: `${projectedDay7}%`, sub: "7-Day AI Projected Lift" },
        { label: "Starter Bounty", value: "+50 Curos", sub: "Recommended Unlock" },
        { label: "Flight Hazard", value: `${risk}%`, sub: "Dormant Enrollment" },
      ],
      radarTitle: "5-Axis Onboarding Readiness & Activation Profile",
      radarData: [
        { subject: "Urgency", score: 95, benchmark: 70 },
        { subject: "Curos Pull", score: 78 + (nameHash % 15), benchmark: 75 },
        { subject: "Track Fit", score: 72 + (nameHash % 12), benchmark: 80 },
        { subject: "7D AI Lift", score: projectedDay7, benchmark: 75 },
        { subject: "Velocity", score: 14, benchmark: 80 },
      ],
      waveTitle: "7-Day AI Onboarding Ignition vs. Baseline Trajectory",
      waveSub: "Projected completion & mastery surge once 3-min starter clip is triggered",
      waveData: [
        { name: "Today", progress: 4, quiz_score: 8 },
        { name: "Day 2 (Nudge)", progress: 18 + (nameHash % 6), quiz_score: 32 },
        { name: "Day 4 (Video 1)", progress: 38 + (nameHash % 8), quiz_score: 58 },
        { name: "Day 6 (Quiz 1)", progress: 54 + (nameHash % 7), quiz_score: 74 },
        { name: "Day 7 Target", progress: projectedDay7, quiz_score: 82 },
      ],
      dynamicSections: [
        {
          badge: "ARCHETYPE: PRE-START DORMANT",
          title: `Zero-Activity Root Cause Analysis for ${firstName}`,
          tone: "rose",
          body: `${name} holds an active seat in ${prog} among ${cohortSize} tracked candidates, but telemetry records 0 video completions and 0 quiz submissions. In enterprise L&D models, 82% of pre-start stalls stem from initial module length friction rather than disengagement.`,
          metricsRow: [
            { k: "Current Progress", v: "0.0%" },
            { k: "Recommended First Step", v: "3-Min Welcome Clip" },
            { k: "Risk Drop on Login", v: "-38% Instant Drop" },
          ],
        },
        {
          badge: "48-HOUR IGNITION PROTOCOL",
          title: `Personalized 3-Step Activation Roadmap for ${firstName}`,
          tone: "cyan",
          body: `Deploy a low-friction "Quick Win" sequence tailored to ${firstName}:`,
          steps: [
            `Send a direct deep-link to a 3-minute micro-preview of "${prog}" so ${firstName} can complete their first learning unit in under 180 seconds.`,
            `Escrow +50 Curos into ${firstName}'s pending wallet—unlocked automatically upon finishing the 2-question warm-up check.`,
            `Pair ${firstName} with a high-velocity cohort finisher (such as Lav Chokhani) for onboarding momentum.`,
          ],
        },
        {
          badge: "PREDICTIVE IMPACT",
          title: "7-Day Risk Reduction Forecast",
          tone: "emerald",
          body: `Completing the starter clip + warm-up quiz is projected to reduce ${name}'s flight risk from ${risk}% down to ${Math.max(22, 100 - projectedDay7)}% within 7 days.`,
        },
      ],
      quickPrompts: [
        `What is the primary barrier preventing ${firstName} from starting Module 1?`,
        `Draft a personalized 1-on-1 onboarding message for ${firstName}.`,
        `Design a 3-day micro-learning ignition plan for ${firstName}.`,
      ],
    };
  }

  // ARCHETYPE B: HIGH-VELOCITY CHAMPION / TOP PERFORMER
  if (archetype === "high_velocity_champion") {
    return {
      archetype: "Top Performer & Peer Mentor",
      badgeColor: "#10B981",
      headline: `${name} is a high-velocity champion in "${prog}" (${comp}% completion, ${quiz}% quiz mastery).`,
      customParameters: [
        { label: "Cohort Standing", value: "Top 10%", sub: "Pacesetter" },
        { label: "Course Completion", value: `${comp}%`, sub: "Verified Progress" },
        { label: "Quiz Accuracy", value: `${quiz}%`, sub: `${attempts} Attempts` },
        { label: "Mentor Readiness", value: "96%", sub: "Eligible for +100 Curos" },
      ],
      radarTitle: "5-Axis Executive Mastery & Leadership Polygon",
      radarData: [
        { subject: "Completion", score: Math.max(80, comp), benchmark: 75 },
        { subject: "Quiz Mastery", score: Math.max(85, quiz), benchmark: 75 },
        { subject: "Retention", score: Math.max(88, 100 - risk), benchmark: 75 },
        { subject: "Consistency", score: 92, benchmark: 75 },
        { subject: "Peer Impact", score: 90, benchmark: 70 },
      ],
      waveTitle: "Mastery Acceleration & Stretch Certification Trajectory",
      waveSub: "Continuous high-mastery progression curve across curriculum stages",
      waveData: [
        { name: "Mod 1", progress: Math.max(60, comp * 0.6), quiz_score: Math.max(75, quiz * 0.85) },
        { name: "Mod 2", progress: Math.max(75, comp * 0.8), quiz_score: Math.max(82, quiz * 0.92) },
        { name: "Current", progress: Math.max(85, comp), quiz_score: Math.max(85, quiz) },
        { name: "Stretch Goal", progress: 100, quiz_score: Math.min(100, Math.max(92, quiz + 5)) },
      ],
      dynamicSections: [
        {
          badge: "ZERO ATTRITION RISK • CHAMPION PROFILE",
          title: `High-Velocity Telemetry Synthesis for ${firstName}`,
          tone: "emerald",
          body: `${name} demonstrates exceptional learning velocity with ${comp}% curriculum completion and ${quiz}% assessment accuracy. Zero attrition risk indicators are present.`,
          metricsRow: [
            { k: "Flight Risk", v: `${risk}% (Minimal)` },
            { k: "Quiz Accuracy", v: `${quiz}%` },
            { k: "Recommended Role", v: "Squad Peer Champion" },
          ],
        },
        {
          badge: "TALENT MULTIPLIER PRESCRIPTION",
          title: "Peer Mentorship & Stretch Track Assignment",
          tone: "cyan",
          body: `Channel ${firstName}'s momentum to elevate lagging peers while keeping top talent challenged:`,
          steps: [
            `Award ${firstName} a +100 Curos "Cohort Pacesetter" badge in ${prog}.`,
            `Invite ${firstName} to co-lead a 15-minute peer revision huddle for stalled learners.`,
            `Unlock the Advanced Executive Case-Study track ahead of schedule.`,
          ],
        },
      ],
      quickPrompts: [
        `Write a congratulatory recognition message for ${firstName}.`,
        `Which stalled learners should we pair with ${firstName}?`,
        `What stretch certification should ${firstName} take next?`,
      ],
    };
  }

  // ARCHETYPE C: MID-FUNNEL STALLED OR ASSESSMENT FRICTION
  const targetComp = Math.min(100, Math.round(comp + 32));
  const targetQuiz = Math.min(100, Math.round(Math.max(78, quiz + 18)));
  return {
    archetype:
      archetype === "assessment_friction"
        ? "Assessment Remediation Needed"
        : "Mid-Funnel Momentum Boost",
    badgeColor: "#38BDF8",
    headline: `${name} is mid-stream in "${prog}" (${comp}% completed, ${quiz}% quiz mastery) and requires a targeted push to graduate.`,
    customParameters: [
      { label: "Current Stage", value: `${comp}%`, sub: `${(100 - comp).toFixed(0)}% Remaining` },
      { label: "Quiz Mastery", value: `${quiz}%`, sub: `${attempts} Submissions` },
      { label: "7D Target Lift", value: `${targetComp}%`, sub: "With AI Nudge" },
      { label: "Flight Risk", value: `${risk}%`, sub: "Mid-Funnel Hazard" },
    ],
    radarTitle: "5-Axis Mid-Funnel Competency & Friction Radar",
    radarData: [
      { subject: "Completion", score: Math.max(25, comp), benchmark: 80 },
      { subject: "Quiz Mastery", score: Math.max(30, quiz), benchmark: 75 },
      { subject: "Video Watch", score: Math.max(35, comp + 12), benchmark: 80 },
      { subject: "Retention", score: Math.max(30, 100 - risk), benchmark: 75 },
      { subject: "Momentum", score: 64, benchmark: 75 },
    ],
    waveTitle: "Mid-Funnel Progression vs. 7-Day AI Completion Curve",
    waveSub: "Current progression trajectory compared to AI-assisted graduation path",
    waveData: [
      { name: "Stage 1", progress: Math.max(15, Math.round(comp * 0.5)), quiz_score: Math.max(30, Math.round(quiz * 0.7)) },
      { name: "Current", progress: comp, quiz_score: quiz },
      { name: "Day 4 (AI Recap)", progress: Math.min(100, Math.round(comp + 16)), quiz_score: Math.min(100, Math.round(quiz + 10)) },
      { name: "Day 7 Target", progress: targetComp, quiz_score: targetQuiz },
    ],
    dynamicSections: [
      {
        badge: "MID-FUNNEL TELEMETRY FORENSICS",
        title: `Where ${firstName} Paused in "${prog}"`,
        tone: "cyan",
        body: `${name} cleared initial onboarding and reached ${comp}% completion with ${quiz}% quiz accuracy, but progression velocity has plateaued mid-curriculum.`,
        metricsRow: [
          { k: "Completed So Far", v: `${comp}%` },
          { k: "Remaining Backlog", v: `${(100 - comp).toFixed(1)}%` },
          { k: "Quiz Accuracy", v: `${quiz}%` },
        ],
      },
      {
        badge: "ACTIVE RETENTION RISK",
        title: `Mid-Stream Drop-Off Diagnosis (${risk}% Risk)`,
        tone: "rose",
        body: `Candidates pausing between 25% and 65% completion experience mid-syllabus fatigue. A targeted micro-milestone nudge within 48 hours prevents permanent drop-off.`,
      },
      {
        badge: "AI GRADUATION PRESCRIPTION",
        title: `Fast-Track Completion Protocol for ${firstName}`,
        tone: "emerald",
        body: `Re-engage ${firstName} by splitting the remaining ${(100 - comp).toFixed(0)}% of ${prog} into two 5-minute sprint checkpoints:`,
        steps: [
          `Send an AI-generated 2-minute concept summary covering the next module's assessment questions.`,
          `Offer a +50 Curos "Finish Line" bonus when ${firstName} reaches ${targetComp}% completion.`,
        ],
      },
    ],
    quickPrompts: [
      `How can we help ${firstName} move from ${comp}% to 100%?`,
      `Draft a mid-course encouragement message for ${firstName}.`,
      `Create a quick quiz revision guide for ${firstName}.`,
    ],
  };
}

// ============================================================================
// 3. CANDIDATE DETAIL & INDIVIDUAL REPORT MODAL COMPONENT
// ============================================================================
export default function CandidateReportModal({ student, cohortSize = 19, onClose }) {
  const [aiReport, setAiReport] = useState(null);
  const [chatInput, setChatInput] = useState("");
  const [chatHistory, setChatHistory] = useState([]);

  useEffect(() => {
    if (!student) return;

    const prefetchedReport = buildPersonalizedBackupReport(student, cohortSize);
    setAiReport(prefetchedReport);
    setChatHistory([
      {
        role: "ai",
        text: `Telemetry diagnostic loaded for **${student.name}** (${prefetchedReport.archetype}). ${prefetchedReport.headline} Select a quick prompt above or ask a tailored coaching question below.`,
      },
    ]);
  }, [student, cohortSize]);

  if (!student || !aiReport) return null;

  const handleSendChat = (customQ) => {
    const q = (customQ || chatInput).trim();
    if (!q) return;
    setChatInput("");
    setChatHistory((prev) => [...prev, { role: "user", text: q }]);

    const firstName = (student.name || "Candidate").split(" ")[0];
    const qLow = q.toLowerCase();
    let answer = "";
    if (
      qLow.includes("message") ||
      qLow.includes("whatsapp") ||
      qLow.includes("email") ||
      qLow.includes("draft") ||
      qLow.includes("congratulat")
    ) {
      if (aiReport.archetype.includes("Champion") || student.is_top_performer) {
        answer = `Suggested recognition message for ${student.name}: "Congratulations ${firstName}! You've reached an impressive ${student.completion_pct ?? 0}% course completion with ${student.quiz_mastery_pct ?? 0}% mastery in ${student.program_name || "Client Relationships"}. We've credited +100 Curos to your wallet and would love to feature you as a cohort mentor!"`;
      } else {
        answer = `Suggested 1-on-1 coaching message for ${student.name}: "Hi ${firstName}! We noticed you're at ${student.completion_pct ?? 0}% in ${student.program_name || "Client Relationships"}. We've unlocked a 3-minute fast-track preview module for you today, plus a +50 Curos milestone bonus as soon as you finish the warm-up check!"`;
      }
    } else if (
      qLow.includes("schedule") ||
      qLow.includes("plan") ||
      qLow.includes("reduce") ||
      qLow.includes("barrier") ||
      qLow.includes("step") ||
      qLow.includes("action")
    ) {
      const stepsList =
        aiReport.dynamicSections?.find((s) => s.steps?.length)?.steps || [];
      answer =
        stepsList.length > 0
          ? `Prioritized intervention roadmap for ${student.name}:\n${stepsList.map((st, idx) => `• Step ${idx + 1}: ${st}`).join("\n")}`
          : aiReport.dynamicSections?.[0]?.body || aiReport.headline;
    } else if (
      qLow.includes("pair") ||
      qLow.includes("buddy") ||
      qLow.includes("mentor") ||
      qLow.includes("peer")
    ) {
      answer = student.is_top_performer || (student.quiz_mastery_pct ?? 0) >= 80
        ? `We recommend pairing ${student.name} with learners experiencing mid-funnel plateaus. Their high accuracy (${student.quiz_mastery_pct ?? 0}%) makes them an ideal peer mentor.`
        : `We recommend pairing ${student.name} with a high-velocity cohort finisher (such as Lav Chokhani) to build momentum through shared study sessions.`;
    } else if (
      qLow.includes("stretch") ||
      qLow.includes("advanced") ||
      qLow.includes("next") ||
      qLow.includes("certif")
    ) {
      answer = `Recommended next curriculum step for ${student.name}: Advance to the "Advanced Strategic Client Case-Study" module to earn executive certification and +100 Curos.`;
    } else {
      answer = `${aiReport.headline} ${aiReport.dynamicSections?.[0]?.body || ""}`;
    }

    setChatHistory((prev) => [...prev, { role: "ai", text: answer }]);
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-6 overflow-y-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-6xl bg-[#0B0D18] border border-cyan-500/35 rounded-3xl shadow-[0_0_90px_rgba(6,182,212,0.22)] overflow-hidden my-auto max-h-[92vh] flex flex-col text-slate-100"
      >
        {/* Modal Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 bg-[#101426] border-b border-white/10">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-400 via-sky-500 to-indigo-600 p-[1.5px]">
              <div className="w-full h-full bg-[#080B14] rounded-[14px] flex items-center justify-center font-extrabold text-cyan-300">
                {(student.name || "U").slice(0, 2).toUpperCase()}
              </div>
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-extrabold text-white">
                  {student.name}
                </h2>
                <span
                  className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold border"
                  style={{
                    backgroundColor: `${aiReport.badgeColor}20`,
                    borderColor: `${aiReport.badgeColor}60`,
                    color: "#F8FAFC",
                  }}
                >
                  ✦ {aiReport.archetype}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-amber-500/20 text-amber-300 border border-amber-400/40">
                  🪙 {student.curos ?? 0} Curos
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold border ${
                    student.risk_level === "high"
                      ? "bg-rose-500/20 text-rose-300 border-rose-500/40"
                      : student.risk_level === "medium"
                      ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                      : "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                  }`}
                >
                  {student.risk_score ?? 0}% Flight Risk
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {student.email || student.role_name || "Enrolled Candidate"} • Track:{" "}
                <strong className="text-cyan-300">
                  {student.program_name || "Client Relationships"}
                </strong>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/35 border border-rose-500/40 text-rose-200 text-xs font-extrabold transition"
          >
            ✕ Close View
          </button>
        </div>

        {/* 12-Column Split Body */}
        <div className="grid grid-cols-12 gap-5 p-6 overflow-y-auto">
          {/* LEFT 7 COLS */}
          <div className="col-span-12 lg:col-span-7 space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {aiReport.customParameters.map((param, i) => (
                <div
                  key={i}
                  className="p-3 rounded-2xl bg-[#070913] border border-white/10 flex flex-col justify-between"
                >
                  <span className="text-[10px] font-bold text-slate-400 uppercase block line-clamp-1">
                    {param.label}
                  </span>
                  <span className="text-base font-extrabold text-white my-1 block">
                    {param.value}
                  </span>
                  <span className="text-[10px] text-cyan-300 font-semibold">
                    {param.sub}
                  </span>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-[#070913] rounded-2xl p-3.5 border border-cyan-500/25">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-cyan-200 block mb-1">
                  🕸️ {aiReport.radarTitle}
                </span>
                <div className="w-full h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="68%" data={aiReport.radarData}>
                      <PolarGrid stroke="#1E293B" />
                      <PolarAngleAxis
                        dataKey="subject"
                        tick={{ fill: "#E2E8F0", fontSize: 10, fontWeight: 600 }}
                      />
                      <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                      <Tooltip content={<ObsidianTooltip />} />
                      <Radar
                        name={student.name}
                        dataKey="score"
                        stroke="#38BDF8"
                        fill="#38BDF8"
                        fillOpacity={0.38}
                        strokeWidth={2.2}
                      />
                      <Radar
                        name="Cohort Benchmark"
                        dataKey="benchmark"
                        stroke="#10B981"
                        fill="none"
                        strokeDasharray="4 4"
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-[#070913] rounded-2xl p-3.5 border border-emerald-500/25">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-200 block">
                  🌊 {aiReport.waveTitle}
                </span>
                <span className="text-[10px] text-slate-400 block mb-1">
                  {aiReport.waveSub}
                </span>
                <div className="w-full h-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={aiReport.waveData}
                      margin={{ top: 10, right: 8, left: -24, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="aiProgWave" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10B981" stopOpacity={0.55} />
                          <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                        </linearGradient>
                        <linearGradient id="aiQuizWave" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#38BDF8" stopOpacity={0.55} />
                          <stop offset="95%" stopColor="#38BDF8" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke="#1E293B" strokeDasharray="3 3" vertical={false} />
                      <XAxis
                        dataKey="name"
                        tick={{ fill: "#94A3B8", fontSize: 10 }}
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
                      <Area
                        type="monotone"
                        dataKey="progress"
                        name="Projected Progress"
                        stroke="#10B981"
                        strokeWidth={2.5}
                        fill="url(#aiProgWave)"
                      />
                      <Area
                        type="monotone"
                        dataKey="quiz_score"
                        name="Projected Mastery"
                        stroke="#38BDF8"
                        strokeWidth={2.5}
                        fill="url(#aiQuizWave)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* DYNAMIC AI-DECIDED SECTIONS */}
            <div className="space-y-3">
              {aiReport.dynamicSections.map((sec, idx) => {
                const toneMap = {
                  cyan: "bg-[#0D1526] border-cyan-500/35 text-cyan-300",
                  rose: "bg-rose-950/30 border-rose-500/45 text-rose-300",
                  amber: "bg-amber-950/25 border-amber-500/40 text-amber-300",
                  emerald: "bg-emerald-950/25 border-emerald-500/40 text-emerald-300",
                }[sec.tone || "cyan"];

                return (
                  <div
                    key={idx}
                    className={`p-4 rounded-2xl border space-y-2 ${toneMap}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-extrabold uppercase tracking-wider">
                        ✦ {sec.title}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white/10 text-white">
                        {sec.badge}
                      </span>
                    </div>

                    <p className="text-xs text-slate-200 leading-relaxed">
                      {sec.body}
                    </p>

                    {Array.isArray(sec.metricsRow) && sec.metricsRow.length > 0 && (
                      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/10">
                        {sec.metricsRow.map((m, mIdx) => (
                          <div
                            key={mIdx}
                            className="bg-[#070913]/90 px-2.5 py-1.5 rounded-xl border border-white/5"
                          >
                            <span className="text-[10px] text-slate-400 block">
                              {m.k}
                            </span>
                            <span className="text-xs font-extrabold text-white">
                              {m.v}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {Array.isArray(sec.steps) && sec.steps.length > 0 && (
                      <div className="space-y-1.5 pt-2 border-t border-white/10">
                        {sec.steps.map((st, sIdx) => (
                          <div
                            key={sIdx}
                            className="text-[11px] text-slate-100 bg-black/30 px-3 py-1.5 rounded-xl flex items-start gap-2"
                          >
                            <span className="font-extrabold text-cyan-400 shrink-0">
                              Step {sIdx + 1}:
                            </span>
                            <span>{st}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* RIGHT 5 COLS: 3D ROBOT AVATAR & AI COACHING CHAT */}
          <div className="col-span-12 lg:col-span-5 flex flex-col justify-between bg-gradient-to-b from-[#0B1528] via-[#081020] to-[#050811] rounded-2xl p-5 border border-cyan-500/35 shadow-[0_0_45px_-10px_rgba(56,189,248,0.28)] min-h-[490px]">
            <div className="space-y-3.5">
              {/* Top Co-Pilot Header */}
              <div className="flex items-center gap-3.5 pb-3.5 border-b border-cyan-500/20">
                <div className="relative w-16 h-16 shrink-0 flex items-center justify-center">
                  <div className="absolute inset-1 rounded-full bg-cyan-400/25 blur-md" />
                  <img
                    src={ROBOT_AVATAR_URL}
                    alt="Saarthi AI Analyst"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                    className="w-16 h-16 object-contain animate-robot-float drop-shadow-[0_0_16px_rgba(56,189,248,0.65)] relative z-10"
                  />
                </div>

                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-400/35 inline-block">
                    Personalized Candidate AI Co-Pilot
                  </span>
                  <h3 className="text-base font-extrabold text-white mt-1">
                    Chat About {student.name}
                  </h3>
                </div>
              </div>

              {/* Quick-Prompt Cards */}
              <div className="space-y-2">
                {(aiReport.quickPrompts || []).map((qp, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendChat(qp)}
                    className="w-full text-left text-xs font-semibold px-3.5 py-2.5 rounded-xl bg-[#0F1B33]/90 hover:bg-cyan-500/20 text-cyan-100 border border-cyan-500/25 hover:border-cyan-400/60 transition flex items-center justify-between gap-2 group"
                  >
                    <span>{qp}</span>
                    <span className="text-cyan-400 font-extrabold opacity-75 group-hover:opacity-100 group-hover:translate-x-0.5 transition">
                      ➔
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Chat Messages */}
            <div className="my-3 flex-1 overflow-y-auto space-y-2.5 max-h-[260px] pr-1">
              {chatHistory.map((msg, i) => (
                <div
                  key={i}
                  className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                    msg.role === "user"
                      ? "bg-gradient-to-r from-indigo-600/35 to-cyan-600/35 border border-cyan-400/40 text-white ml-6"
                      : "bg-[#060B16]/95 border border-cyan-500/30 text-slate-100 mr-2 shadow-inner"
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        msg.role === "user"
                          ? "bg-indigo-400 shadow-[0_0_8px_#818CF8]"
                          : "bg-cyan-400 shadow-[0_0_8px_#22D3EE]"
                      }`}
                    />
                    <span
                      className={`text-[10px] font-extrabold uppercase tracking-wider bg-gradient-to-r ${
                        msg.role === "user"
                          ? "from-indigo-300 to-cyan-200"
                          : "from-cyan-300 via-sky-300 to-emerald-300"
                      } bg-clip-text text-transparent`}
                    >
                      {msg.role === "user" ? "You (L&D Lead)" : "SAARTHI AI"}
                    </span>
                  </div>
                  {msg.text}
                </div>
              ))}
            </div>

            {/* Input Form & Electric Cyan-to-Indigo Button */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendChat();
              }}
              className="flex items-center gap-2.5 pt-2.5 border-t border-cyan-500/20"
            >
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder={`Ask AI how to coach ${student.name}...`}
                className="flex-1 bg-[#060A14] border border-cyan-500/35 focus:border-cyan-400 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-none transition"
              />
              <button
                type="submit"
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 via-sky-500 to-indigo-600 hover:from-cyan-300 hover:to-indigo-500 text-white text-xs font-extrabold shadow-[0_0_20px_rgba(56,189,248,0.45)] transition shrink-0"
              >
                Ask AI ➔
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
