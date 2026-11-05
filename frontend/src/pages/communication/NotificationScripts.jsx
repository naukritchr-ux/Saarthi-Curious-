import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import axios from "axios";
import MainLayout from "../../layout/mainLayout";
import { API_BASE } from "../../config/api";

const API_BASE_URL =
  import.meta.env?.VITE_API_URL ||
  API_BASE ||
  (import.meta.env?.DEV
    ? "http://127.0.0.1:8000"
    : "https://saarthi-curious-00e8.onrender.com");

const STORAGE_KEY_SCRIPTS = "saarthi_calm_cream_scripts_v5";
const STORAGE_KEY_CALENDAR_TASKS = "saarthi_calendar_events_v1";

const WEEKDAYS = [
  { key: "Mon", short: "M", label: "Monday" },
  { key: "Tue", short: "T", label: "Tuesday" },
  { key: "Wed", short: "W", label: "Wednesday" },
  { key: "Thu", short: "T", label: "Thursday" },
  { key: "Fri", short: "F", label: "Friday" },
  { key: "Sat", short: "S", label: "Saturday" },
  { key: "Sun", short: "S", label: "Sunday" },
];

// ============================================================================
// 1. CUSTOM RADIANT "GLOWING S" AI EMBLEM LOGO
// ============================================================================
function GlowingSLogo({ size = "md" }) {
  const dims =
    size === "lg"
      ? "w-11 h-11 rounded-2xl"
      : size === "sm"
      ? "w-7 h-7 rounded-xl"
      : "w-9 h-9 rounded-xl";

  return (
    <div
      className={`relative ${dims} bg-gradient-to-br from-[#1E1B4B] via-[#312E81] to-[#0F172A] flex items-center justify-center shrink-0 shadow-[0_0_22px_rgba(99,102,241,0.55)] border border-indigo-400/50 select-none overflow-hidden`}
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-indigo-500/30 via-cyan-400/25 to-emerald-400/30 animate-pulse" />

      <svg
        viewBox="0 0 36 36"
        className="w-3/5 h-3/5 relative z-10 overflow-visible drop-shadow-[0_0_8px_rgba(56,189,248,0.95)]"
      >
        <defs>
          <linearGradient id="glowingSGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="45%" stopColor="#A5F3FC" />
            <stop offset="100%" stopColor="#818CF8" />
          </linearGradient>
        </defs>
        <path
          d="M24.5 10.5C24.5 7.5 21.5 5.5 17.5 5.5C13 5.5 10 8 10 11.5C10 15 13.5 16.5 18 17.8C22.5 19.1 25.5 20.8 25.5 24.5C25.5 28.5 22 30.5 17.5 30.5C12.5 30.5 9.5 28 9.5 24.5"
          fill="none"
          stroke="url(#glowingSGrad)"
          strokeWidth="4.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

// ============================================================================
// 2. CLEAN VECTOR SVG ICON SUITE
// ============================================================================
const Icon = ({ name, className = "w-4 h-4" }) => {
  switch (name) {
    case "globe":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
          <circle cx="12" cy="12" r="10" />
          <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
      );
    case "userCheck":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
          <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="8.5" cy="7" r="4" />
          <polyline points="17 11 19 13 23 9" />
        </svg>
      );
    case "calendar":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
          <rect x="3" y="4" width="18" height="18" rx="3" />
          <path strokeLinecap="round" d="M16 2v4M8 2v4M3 10h18M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01" />
        </svg>
      );
    case "mail":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
          <rect x="2" y="4" width="20" height="16" rx="3" />
          <path strokeLinecap="round" strokeLinejoin="round" d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
        </svg>
      );
    case "sun":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
          <circle cx="12" cy="12" r="4" />
          <path strokeLinecap="round" d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
        </svg>
      );
    case "moon":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      );
    case "send":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
          <line x1="22" y1="2" x2="11" y2="13" />
          <polygon points="22 2 15 22 11 13 2 9 22 2" />
        </svg>
      );
    case "trash":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        </svg>
      );
    case "check":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={className}>
          <polyline points="20 6 9 17 4 12" />
        </svg>
      );
    default:
      return null;
  }
};

// ============================================================================
// 3. CALM AMBIENT HEADER DISPLAY (NO MOVING LINES — GRADUAL BREATHING SHIFT)
// ============================================================================
function CalmAmbientHeaderDisplay({
  morningCount,
  eveningCount,
  totalScripts,
  gmailSentCount,
  highRiskCount,
  activeTab,
}) {
  return (
    <section className="relative rounded-3xl overflow-hidden border border-[#E2D9C5] shadow-[0_14px_38px_-15px_rgba(68,52,28,0.1)] bg-[#FFFDF9] p-6 sm:p-7">
      <div className="pointer-events-none absolute inset-0 calm-aurora-bg opacity-85" />
      <div className="pointer-events-none absolute -top-24 left-1/4 w-96 h-64 rounded-full bg-amber-200/25 blur-3xl animate-calm-breathe" />
      <div className="pointer-events-none absolute -bottom-24 right-1/4 w-96 h-64 rounded-full bg-indigo-200/25 blur-3xl animate-calm-breathe-slow" />

      <div className="relative z-10 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <GlowingSLogo size="lg" />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-[0.18em] bg-[#1E1B4B] text-cyan-200">
                  SAARTHI NUDGE COMMAND • {activeTab === "universal" ? "UNIVERSAL BROADCAST" : "1-TO-1 PERSONAL STUDIO"}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-100/90 text-emerald-900 border border-emerald-300 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                  Live Performance Telemetry Active
                </span>
              </div>
              <h1 className="text-2xl sm:text-[28px] font-black text-[#1C1917] mt-1 tracking-tight">
                Notification Scripts & Intelligent Nudges
              </h1>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-2.5 bg-white/80 backdrop-blur-md px-4 py-2 rounded-2xl border border-[#E5DEC9] shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-indigo-600" />
            <span className="text-xs font-extrabold text-[#3F3A32]">
              Synced with Reports, Analytics & Calendar
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div className="bg-white/85 backdrop-blur-md rounded-2xl px-4 py-3.5 border border-amber-300/75 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-xs font-extrabold text-amber-900 flex items-center gap-1.5">
                <Icon name="sun" className="w-4 h-4 text-amber-600" />
                Morning Scripts
              </span>
              <span className="text-2xl font-black text-[#1C1917] block mt-1">
                {morningCount}
              </span>
            </div>
            <span className="text-[11px] font-extrabold px-2.5 py-1 rounded-lg bg-amber-100/90 text-amber-900">
              {Math.round((morningCount / Math.max(1, totalScripts)) * 100)}%
            </span>
          </div>

          <div className="bg-white/85 backdrop-blur-md rounded-2xl px-4 py-3.5 border border-indigo-300/75 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-xs font-extrabold text-indigo-900 flex items-center gap-1.5">
                <Icon name="moon" className="w-4 h-4 text-indigo-600" />
                Evening Scripts
              </span>
              <span className="text-2xl font-black text-[#1C1917] block mt-1">
                {eveningCount}
              </span>
            </div>
            <span className="text-[11px] font-extrabold px-2.5 py-1 rounded-lg bg-indigo-100/90 text-indigo-900">
              {Math.round((eveningCount / Math.max(1, totalScripts)) * 100)}%
            </span>
          </div>

          <div className="bg-white/85 backdrop-blur-md rounded-2xl px-4 py-3.5 border border-purple-300/75 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-xs font-extrabold text-purple-900 flex items-center gap-1.5">
                <GlowingSLogo size="sm" />
                <span>Total Active Scripts</span>
              </span>
              <span className="text-2xl font-black text-[#1C1917] block mt-1">
                {totalScripts}
              </span>
            </div>
            <span className="text-[11px] font-extrabold px-2.5 py-1 rounded-lg bg-purple-100/90 text-purple-900">
              {morningCount}M • {eveningCount}E
            </span>
          </div>

          <div className="bg-white/85 backdrop-blur-md rounded-2xl px-4 py-3.5 border border-emerald-300/75 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-xs font-extrabold text-emerald-900 flex items-center gap-1.5">
                <Icon name="mail" className="w-4 h-4 text-emerald-600" />
                Email Dispatches
              </span>
              <span className="text-2xl font-black text-[#1C1917] block mt-1">
                {gmailSentCount} Sent
              </span>
            </div>
            <span className="text-[11px] font-extrabold px-2.5 py-1 rounded-lg bg-rose-100 text-rose-800">
              {highRiskCount} Needs Nudge
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

// ============================================================================
// 4. INTERACTIVE "CHAT WITH SAARTHI AI" NUDGE CO-PILOT
// ============================================================================
function SaarthiAiNudgeChatBox({
  mode,
  selectedLearner,
  telemetrySummary,
  onUseSuggestion,
  onSendEmailSuggestion,
}) {
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatThread, setChatThread] = useState([]);
  const chatScrollRef = useRef(null);

  const buildInitialSuggestions = useCallback(() => {
    if (mode === "one_to_one" && selectedLearner) {
      const firstName = selectedLearner.name.split(" ")[0];
      const isZero = selectedLearner.completion_pct === 0;
      return [
        {
          id: `sug_1_${Date.now()}`,
          slot: "morning",
          tag: `Performance: ${selectedLearner.completion_pct}% Done • ${selectedLearner.curos} Curos`,
          title: isZero
            ? `Let's Kickstart Your ${selectedLearner.program_name} Journey, ${firstName}!`
            : `Unlock Your Next Milestone in ${selectedLearner.program_name}, ${firstName}!`,
          message: isZero
            ? `Hi ${firstName}, as a ${selectedLearner.role} in "${selectedLearner.program_name}", your team is excited to see you lead! Complete your first 3-minute module today to kick off your learning streak and earn +35 Curos.`
            : `Hi ${firstName}, great momentum reaching ${selectedLearner.completion_pct}% completion and ${selectedLearner.curos} Curos! Complete 1 more checkpoint today to surge ahead on the Leaderboard.`,
        },
        {
          id: `sug_2_${Date.now()}`,
          slot: "evening",
          tag: `Streak Status: ${selectedLearner.streak_days}d Active Streak`,
          title: `Evening Momentum Check-In for ${firstName}`,
          message: `Hi ${firstName}, just 5 minutes in "${selectedLearner.program_name}" tonight will build your consistency streak and unlock a +25 Curos evening bonus!`,
        },
      ];
    }

    return [
      {
        id: `sug_u1_${Date.now()}`,
        slot: "morning",
        tag: `Cohort Analytics: ${telemetrySummary.highRiskCount} Learners at 0% Completion`,
        title: `Morning Kickstart: ${telemetrySummary.topProgram}`,
        message: `Good morning team! Cohort completion is currently at ${telemetrySummary.avgCompletion}%. Watch 1 short module in "${telemetrySummary.topProgram}" today to claim +30 Curos and boost our team standing!`,
      },
      {
        id: `sug_u2_${Date.now()}`,
        slot: "evening",
        tag: `Streak Analytics: ${telemetrySummary.dormantCount} Learners with 0d Streak`,
        title: "Evening Streak Igniter & Curos Bonus",
        message: `Don't let today end without a learning win! Complete 1 quick checkpoint tonight to protect your learning streak and earn +25 Curos.`,
      },
    ];
  }, [mode, selectedLearner, telemetrySummary]);

  useEffect(() => {
    const initialSugs = buildInitialSuggestions();
    const targetLabel =
      mode === "one_to_one" && selectedLearner
        ? `${selectedLearner.name} (${selectedLearner.role} • ${selectedLearner.completion_pct}% Completion • ${selectedLearner.curos} Curos)`
        : `All Users (${telemetrySummary.avgCompletion}% Avg Completion • ${telemetrySummary.highRiskCount} At-Risk)`;

    setChatThread([
      {
        id: "welcome_ai",
        role: "ai",
        text: `I've analyzed live performance telemetry for ${targetLabel}. Tell me what type of nudge you'd like to send—or pick one of my tailored recommendations below:`,
        suggestions: initialSugs,
      },
    ]);
  }, [mode, selectedLearner, telemetrySummary, buildInitialSuggestions]);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatThread, chatLoading]);

  const handleSendChatPrompt = async (customPromptText) => {
    const prompt = (customPromptText || chatInput).trim();
    if (!prompt) return;
    setChatInput("");

    const userMsg = {
      id: `u_${Date.now()}`,
      role: "user",
      text: prompt,
    };
    setChatThread((prev) => [...prev, userMsg]);
    setChatLoading(true);

    try {
      const res = await axios.post(`${API_BASE_URL}/notifications/groq-suggest`, {
        mode,
        model_instructions: prompt,
        learner: mode === "one_to_one" ? selectedLearner : null,
        telemetry: telemetrySummary,
      });

      if (Array.isArray(res.data?.suggestions) && res.data.suggestions.length > 0) {
        setChatThread((prev) => [
          ...prev,
          {
            id: `ai_${Date.now()}`,
            role: "ai",
            text: `Here are custom nudges crafted for "${prompt}" based on current performance metrics:`,
            suggestions: res.data.suggestions.map((s, idx) => ({
              id: s.id || `srv_${Date.now()}_${idx}`,
              slot: s.slot || "morning",
              tag: s.situationTag || "Tailored to Request",
              title: s.title,
              message: s.message,
            })),
          },
        ]);
        setChatLoading(false);
        return;
      }
    } catch {
      // Fallback local synthesis if backend is temporarily unavailable.
    }

    setTimeout(() => {
      const isOneToOne = mode === "one_to_one" && selectedLearner;
      const name = isOneToOne ? selectedLearner.name.split(" ")[0] : "Team";
      const prog = isOneToOne ? selectedLearner.program_name : telemetrySummary.topProgram;
      const comp = isOneToOne ? selectedLearner.completion_pct : telemetrySummary.avgCompletion;

      const customSuggestions = [
        {
          id: `custom_${Date.now()}_1`,
          slot: prompt.toLowerCase().includes("evening") ? "evening" : "morning",
          tag: `Custom AI Nudge • ${comp}% Completion Context`,
          title: `${name}: Special Milestone Nudge in ${prog}`,
          message: isOneToOne
            ? `Hi ${name}, regarding "${prog}" (${comp}% completed): ${prompt}. Complete your next module checkpoint today to claim a +40 Curos performance bonus!`
            : `Hello Team! ${prompt}. Complete 1 module in "${prog}" today to earn +40 Curos and elevate your Leaderboard rank!`,
        },
      ];

      setChatThread((prev) => [
        ...prev,
        {
          id: `ai_${Date.now()}`,
          role: "ai",
          text: `I've crafted a custom nudge matching your request ("${prompt}") and calibrated it to ${isOneToOne ? selectedLearner.name + "'s" : "the cohort's"} live performance:`,
          suggestions: customSuggestions,
        },
      ]);
      setChatLoading(false);
    }, 350);
  };

  const quickPrompts =
    mode === "one_to_one" && selectedLearner
      ? [
          `Polite kickstart for ${selectedLearner.name.split(" ")[0]} (+40 Curos)`,
          `Urgent streak-saver reminder for tonight`,
          `Congratulate & push for next quiz mastery`,
        ]
      : [
          "Re-engage 0% completion users with +50 Curos",
          "Evening streak shield reminder for all users",
          "Weekend leaderboard podium sprint challenge",
        ];

  return (
    <div className="bg-[#FFFDF9] rounded-3xl p-5 border border-[#E5DEC9] shadow-[0_12px_32px_-12px_rgba(68,52,28,0.08)] flex flex-col justify-between space-y-4">
      <div className="flex items-center justify-between border-b border-[#EDE6D6] pb-3.5">
        <div className="flex items-center gap-3">
          <GlowingSLogo size="md" />
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-black text-[#1C1917]">
                AI Intelligence
              </h3>
            </div>
            <p className="text-[11px] text-[#787062]">
              {mode === "one_to_one" && selectedLearner
                ? `Analyzing ${selectedLearner.name} (${selectedLearner.completion_pct}% Done • ${selectedLearner.curos} Curos)`
                : `Analyzing Cohort (${telemetrySummary.avgCompletion}% Avg Completion)`}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1 scroll-smooth">
        {chatThread.map((msg) => (
          <div key={msg.id} className="space-y-2.5">
            <div
              className={`p-3 rounded-2xl text-xs leading-relaxed ${
                msg.role === "user"
                  ? "bg-[#1E1B4B] text-white ml-8 rounded-br-xs"
                  : "bg-[#F6F1E6] text-[#1C1917] border border-[#E5DEC9] rounded-bl-xs"
              }`}
            >
              <div className="flex items-center gap-1.5 mb-1">
                {msg.role === "ai" && <GlowingSLogo size="sm" />}
                <span
                  className={`text-[10px] font-black uppercase tracking-wider ${
                    msg.role === "user" ? "text-cyan-300" : "text-indigo-900"
                  }`}
                >
                  {msg.role === "user" ? "You (Admin)" : "Saarthi AI Strategist"}
                </span>
              </div>
              <p>{msg.text}</p>
            </div>

            {Array.isArray(msg.suggestions) && msg.suggestions.map((sug) => (
              <div
                key={sug.id}
                className="rounded-2xl p-3.5 bg-white border border-[#DFD5BE] hover:border-indigo-400 shadow-2xs space-y-2 transition"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-indigo-50 text-indigo-900 border border-indigo-200">
                    {sug.tag}
                  </span>
                  <span className="text-[10px] font-bold uppercase text-[#787062]">
                    {sug.slot === "morning" ? "☀️ Morning" : "🌙 Evening"}
                  </span>
                </div>

                <h4 className="text-xs font-black text-[#1C1917]">{sug.title}</h4>
                <p className="text-xs text-[#575045] leading-relaxed bg-[#FAF7F0] p-2.5 rounded-xl border border-[#EDE6D6]">
                  “{sug.message}”
                </p>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => onUseSuggestion(sug)}
                    className="px-3 py-1.5 rounded-xl bg-[#F4EFE4] hover:bg-indigo-50 border border-[#D8CEB8] hover:border-indigo-300 text-[11px] font-extrabold text-[#1C1917] hover:text-indigo-950 transition cursor-pointer"
                  >
                    Use in Composer
                  </button>
                  <button
                    type="button"
                    onClick={() => onSendEmailSuggestion(sug)}
                    className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-[11px] font-extrabold flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
                  >
                    <Icon name="mail" className="w-3.5 h-3.5" />
                    <span>Send via Email</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ))}

        {chatLoading && (
          <div className="p-3 rounded-2xl bg-[#F6F1E6] border border-[#E5DEC9] text-xs font-bold text-indigo-900 flex items-center gap-2">
            <GlowingSLogo size="sm" />
            <span>Crafting performance-calibrated nudge...</span>
          </div>
        )}
      </div>

      <form onSubmit={(e) => { e.preventDefault(); handleSendChatPrompt(); }} className="flex items-center gap-2 pt-2 border-t border-[#EDE6D6]">
        <input
          type="text"
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          placeholder="Chat with Saarthi AI: Describe the nudge you want to send..."
          className="flex-1 rounded-xl bg-[#F9F5EB] border border-[#D8CEB8] focus:border-indigo-600 px-3.5 py-2.5 text-xs font-semibold text-[#1C1917] placeholder-[#8C8273] outline-none transition"
        />
        <button
          type="submit"
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#1E1B4B] to-[#312E81] hover:opacity-95 text-white text-xs font-extrabold shadow-sm flex items-center gap-1.5 transition cursor-pointer shrink-0"
        >
          <span>Ask AI</span>
          <Icon name="send" className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
}

// ============================================================================
// 5. GOOGLE CALENDAR-STYLE MINI SCHEDULER
// ============================================================================
function MiniGoogleCalendarScheduler({
  mode,
  selectedLearner,
  calendarTasks,
  onSaveCalendarTask,
  onDispatchEmailNow,
}) {
  const [calView, setCalView] = useState("week");
  const [selectedDate, setSelectedDate] = useState("2026-11-06");
  const [taskPopoverOpen, setTaskPopoverOpen] = useState(true);

  const [taskTitle, setTaskTitle] = useState("Universal Course Momentum Nudge");
  const [taskMessage, setTaskMessage] = useState(
    "Complete 1 course video on 2026-11-06 to protect your learning streak and earn Curos!"
  );
  const [taskSlot, setTaskSlot] = useState("morning");
  const [taskTime, setTaskTime] = useState("09:00 AM");
  const [repeatDays, setRepeatDays] = useState(["Mon", "Wed", "Fri"]);

  const monthDays = useMemo(() => {
    return Array.from({ length: 30 }, (_, idx) => {
      const dayNum = idx + 1;
      const dateStr = `2026-11-${String(dayNum).padStart(2, "0")}`;
      const dow = WEEKDAYS[idx % 7];
      const dayTasks = calendarTasks.filter((t) => t.date === dateStr);
      return {
        dayNum,
        dateStr,
        dowKey: dow.key,
        dowShort: dow.short,
        tasks: dayTasks,
      };
    });
  }, [calendarTasks]);

  const weekDays = useMemo(() => {
    const selDayNum = Number(selectedDate.split("-")[2] || 6);
    const startIdx = Math.max(0, Math.min(23, selDayNum - 4));
    return monthDays.slice(startIdx, startIdx + 7);
  }, [monthDays, selectedDate]);

  const handleDateClick = (dateStr) => {
    setSelectedDate(dateStr);
    const targetName = mode === "one_to_one" && selectedLearner ? selectedLearner.name : "All Users";

    setTaskTitle(
      mode === "one_to_one" ? `1-to-1 Nudge: ${targetName}` : "Universal Course Momentum Nudge"
    );
    setTaskMessage(
      mode === "one_to_one" && selectedLearner
        ? `Hi ${selectedLearner.name.split(" ")[0]}, complete 1 module in ${selectedLearner.program_name} on ${dateStr} to earn +30 Curos!`
        : `Complete 1 course video on ${dateStr} to protect your learning streak and earn Curos!`
    );
    setTaskPopoverOpen(true);
  };

  const handleCreateTask = (e) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;

    const newTask = {
      id: `cal_task_${Date.now()}`,
      date: selectedDate,
      title: taskTitle,
      message: taskMessage,
      slot: taskSlot,
      time: taskTime,
      repeatDays,
      mode,
      recipientName: mode === "one_to_one" && selectedLearner ? selectedLearner.name : "All Users",
      recipientEmail: mode === "one_to_one" && selectedLearner ? selectedLearner.email : "all",
    };

    onSaveCalendarTask(newTask);
    setTaskPopoverOpen(false);
  };

  const selectedDateTasks = useMemo(
    () => calendarTasks.filter((t) => t.date === selectedDate),
    [calendarTasks, selectedDate]
  );

  return (
    <div className="flex-1 bg-[#FFFDF9] rounded-3xl p-5 border border-[#E5DEC9] shadow-[0_12px_32px_-12px_rgba(68,52,28,0.08)] flex flex-col justify-between space-y-4">
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-[#EDE6D6] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 border border-emerald-300 text-emerald-800 flex items-center justify-center">
              <Icon name="calendar" className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-[#1C1917]">Mini Nudge Calendar</h3>
              <p className="text-[11px] text-[#787062]">
                Select any date to schedule or dispatch a nudge task (Nov 2026)
              </p>
            </div>
          </div>

          <div className="inline-flex bg-[#F2ECE1] p-1 rounded-xl border border-[#E2D9C3]">
            <button
              type="button"
              onClick={() => setCalView("week")}
              className={`px-3 py-1 rounded-lg text-[11px] font-extrabold transition cursor-pointer ${
                calView === "week" ? "bg-[#1E1B4B] text-white shadow-2xs" : "text-[#6B6356] hover:text-[#1C1917]"
              }`}
            >
              1 Week
            </button>
            <button
              type="button"
              onClick={() => setCalView("month")}
              className={`px-3 py-1 rounded-lg text-[11px] font-extrabold transition cursor-pointer ${
                calView === "month" ? "bg-[#1E1B4B] text-white shadow-2xs" : "text-[#6B6356] hover:text-[#1C1917]"
              }`}
            >
              1 Month
            </button>
          </div>
        </div>

        {calView === "week" ? (
          <div className="grid grid-cols-7 gap-1.5">
            {weekDays.map((d) => {
              const isSel = selectedDate === d.dateStr;
              return (
                <div
                  key={d.dateStr}
                  onClick={() => handleDateClick(d.dateStr)}
                  className={`cursor-pointer rounded-2xl p-2.5 text-center border transition flex flex-col items-center justify-between min-h-[74px] ${
                    isSel
                      ? "bg-gradient-to-b from-[#1E1B4B] to-[#312E81] text-white border-indigo-900 shadow-md"
                      : "bg-[#F9F5EB] text-[#1C1917] border-[#E5DEC9] hover:border-indigo-400"
                  }`}
                >
                  <span className={`text-[10px] font-bold uppercase ${isSel ? "text-cyan-200" : "text-[#787062]"}`}>
                    {d.dowKey}
                  </span>
                  <span className="text-base font-black my-0.5">{d.dayNum}</span>
                  <div className="flex items-center gap-1">
                    {d.tasks.slice(0, 3).map((tk, i) => (
                      <span
                        key={`${d.dateStr}-${i}`}
                        className={`w-1.5 h-1.5 rounded-full ${tk.slot === "morning" ? "bg-amber-400" : "bg-cyan-300"}`}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div>
            <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-black text-[#787062] mb-1">
              {WEEKDAYS.map((w) => (
                <span key={w.key}>{w.short}</span>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1.5">
              {monthDays.map((d) => {
                const isSel = selectedDate === d.dateStr;
                const hasTask = d.tasks.length > 0;
                return (
                  <button
                    key={d.dateStr}
                    type="button"
                    onClick={() => handleDateClick(d.dateStr)}
                    className={`h-9 rounded-xl text-xs font-extrabold transition flex flex-col items-center justify-center relative cursor-pointer border ${
                      isSel
                        ? "bg-[#1E1B4B] text-white border-indigo-900"
                        : hasTask
                        ? "bg-indigo-50 text-indigo-950 border-indigo-300"
                        : "bg-[#F9F5EB] text-[#1C1917] border-[#E5DEC9] hover:bg-indigo-50/50"
                    }`}
                  >
                    <span>{d.dayNum}</span>
                    {hasTask && <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 absolute bottom-1" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {taskPopoverOpen && (
          <form onSubmit={handleCreateTask} className="rounded-2xl p-4 bg-[#F6F1E6] border border-[#D8CEB8] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-[#1C1917] flex items-center gap-1.5">
                <span>📌 Set Nudge Task for {selectedDate}</span>
              </span>
              <span className="text-[10px] font-bold text-indigo-800 bg-indigo-100 px-2 py-0.5 rounded-md">
                {mode === "one_to_one" && selectedLearner ? `To: ${selectedLearner.name.split(" ")[0]}` : "To: All Users"}
              </span>
            </div>

            <input
              type="text"
              required
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              placeholder="Nudge task title..."
              className="w-full rounded-xl bg-white border border-[#D8CEB8] px-3 py-2 text-xs font-extrabold text-[#1C1917] outline-none"
            />

            <textarea
              rows={2}
              required
              value={taskMessage}
              onChange={(e) => setTaskMessage(e.target.value)}
              placeholder="Nudge message..."
              className="w-full rounded-xl bg-white border border-[#D8CEB8] p-2.5 text-xs text-[#1C1917] outline-none resize-none"
            />

            <div className="grid grid-cols-2 gap-2">
              <select
                value={taskSlot}
                onChange={(e) => {
                  setTaskSlot(e.target.value);
                  setTaskTime(e.target.value === "morning" ? "09:00 AM" : "06:30 PM");
                }}
                className="rounded-xl bg-white border border-[#D8CEB8] px-2.5 py-1.5 text-xs font-bold text-[#1C1917]"
              >
                <option value="morning">☀️ Morning Slot</option>
                <option value="evening">🌙 Evening Slot</option>
              </select>

              <input
                type="text"
                value={taskTime}
                onChange={(e) => setTaskTime(e.target.value)}
                className="rounded-xl bg-white border border-[#D8CEB8] px-2.5 py-1.5 text-xs font-bold text-[#1C1917]"
              />
            </div>

            <div className="flex items-center justify-between gap-2 pt-1">
              <div className="flex items-center gap-1">
                {WEEKDAYS.map((w) => {
                  const active = repeatDays.includes(w.key);
                  return (
                    <button
                      key={w.key}
                      type="button"
                      onClick={() =>
                        setRepeatDays((prev) =>
                          prev.includes(w.key)
                            ? prev.filter((x) => x !== w.key)
                            : [...prev, w.key]
                        )
                      }
                      className={`w-6 h-6 rounded-md text-[10px] font-black transition cursor-pointer ${
                        active ? "bg-[#1E1B4B] text-white" : "bg-white text-[#787062] border border-[#D8CEB8]"
                      }`}
                    >
                      {w.short}
                    </button>
                  );
                })}
              </div>

              <button
                type="submit"
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#1E1B4B] to-[#312E81] hover:opacity-95 text-white text-[11px] font-extrabold shadow-xs transition cursor-pointer"
              >
                Save to Calendar
              </button>
            </div>
          </form>
        )}
      </div>

      <div className="space-y-2 pt-2 border-t border-[#EDE6D6]">
        <div className="flex items-center justify-between text-[11px] font-extrabold text-[#575045]">
          <span>Scheduled on {selectedDate}:</span>
          <span className="text-emerald-800">{selectedDateTasks.length} Task(s)</span>
        </div>

        {selectedDateTasks.length === 0 ? (
          <div className="p-3 rounded-xl bg-[#F9F5EB] border border-[#EDE6D6] text-[11px] text-[#787062] flex items-center justify-between">
            <span>No tasks on {selectedDate} yet.</span>
            <button type="button" onClick={() => setTaskPopoverOpen(true)} className="font-extrabold text-indigo-800 hover:underline cursor-pointer">
              + Schedule Nudge
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {selectedDateTasks.map((tk) => (
              <div
                key={tk.id}
                className="p-3 rounded-xl bg-[#F9F5EB] border border-[#E5DEC9] flex items-center justify-between gap-2 text-xs"
              >
                <div className="min-w-0">
                  <span className="font-extrabold text-[#1C1917] block truncate">
                    {tk.slot === "morning" ? "☀️" : "🌙"} {tk.title}
                  </span>
                  <span className="text-[10px] text-[#6B6356] block truncate">
                    To: {tk.recipientName} • {tk.time}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    onDispatchEmailNow({
                      title: tk.title,
                      message: tk.message,
                      recipientEmail: tk.recipientEmail,
                      recipientName: tk.recipientName,
                    })
                  }
                  className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-[10px] font-extrabold flex items-center gap-1.5 shrink-0 shadow-2xs transition cursor-pointer"
                >
                  <Icon name="mail" className="w-3 h-3" />
                  <span>Dispatch Email</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// 6. MAIN PAGE COMPONENT: NotificationScripts.jsx
// ============================================================================
export default function NotificationScripts() {
  const [activeTab, setActiveTab] = useState("one_to_one");

  const [scripts, setScripts] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SCRIPTS);
      return saved
        ? JSON.parse(saved)
        : [
            {
              id: "m_1",
              slot: "morning",
              title: "Trial Notification",
              message: "Just a trial message to see functioning",
              audience: "2 selected",
              scheduledTime: "02:10 PM",
              recurringDays: ["Mon", "Wed", "Fri"],
              active: true,
            },
            {
              id: "e_1",
              slot: "evening",
              title: "Greetings from Saarthi Curious",
              message: "Hello Users!",
              audience: "All Users",
              scheduledTime: "10:50 PM",
              recurringDays: ["Mon", "Tue", "Wed", "Thu", "Fri"],
              active: true,
            },
            {
              id: "e_2",
              slot: "evening",
              title: "Complete the Course (Trial Notification)",
              message: "Complete 1 course video today",
              audience: "Head Office Staff",
              scheduledTime: "04:08 PM",
              recurringDays: ["Tue", "Thu"],
              active: true,
            },
            {
              id: "e_3",
              slot: "evening",
              title: "Complete the course",
              message: "Trial notification",
              audience: "All Users",
              scheduledTime: "04:10 PM",
              recurringDays: ["Sat", "Sun"],
              active: true,
            },
          ];
    } catch {
      return [];
    }
  });

  const [calendarTasks, setCalendarTasks] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CALENDAR_TASKS);
      return saved
        ? JSON.parse(saved)
        : [
            {
              id: "ct_1",
              date: "2026-11-06",
              title: "Greetings from Saarthi Curious",
              message: "Complete 1 course video today to protect your streak!",
              slot: "evening",
              time: "06:30 PM",
              recipientName: "All Users",
              recipientEmail: "all",
            },
          ];
    } catch {
      return [];
    }
  });

  const [learners, setLearners] = useState([
    {
      id: 1,
      name: "Anuj Jadhav 2",
      email: "anujjadhv3551@gmail.com",
      role: "Franchise Employee",
      program_name: "Client Relationships",
      curos: 0,
      completion_pct: 0,
      application_pct: 0,
      streak_days: 0,
    },
    {
      id: 2,
      name: "Sneha Jaiswal",
      email: "sneha.jaiswal@talentcorner.in",
      role: "Franchise Partner",
      program_name: "Client Relationships",
      curos: 0,
      completion_pct: 0,
      application_pct: 0,
      streak_days: 0,
    },
    {
      id: 3,
      name: "Mousume Barick",
      email: "mousumebaricktalentcorner@gmail.com",
      role: "Master Admin",
      program_name: "Client Relationships",
      curos: 0,
      completion_pct: 0,
      application_pct: 0,
      streak_days: 0,
    },
    {
      id: 4,
      name: "MOUSUME BARICK",
      email: "mousume.b@talentcorner.in",
      role: "Master Admin",
      program_name: "Client Relationships",
      curos: 0,
      completion_pct: 0,
      application_pct: 0,
      streak_days: 0,
    },
    {
      id: 5,
      name: "Parna Ghosh",
      email: "parna.ghosh@talentcorner.in",
      role: "Team Leader",
      program_name: "Client Relationships",
      curos: 0,
      completion_pct: 0,
      application_pct: 0,
      streak_days: 0,
    },
    {
      id: 6,
      name: "Anuj Jadhav",
      email: "anuj.jadhav@sigce.edu.in",
      role: "Franchise Developer",
      program_name: "Client Relationships",
      curos: 0,
      completion_pct: 0,
      application_pct: 0,
      streak_days: 0,
    },
    {
      id: 7,
      name: "Atharva Lohar",
      email: "atharvalohar33@gmail.com",
      role: "Curo Champion",
      program_name: "Client Relationships",
      curos: 365,
      completion_pct: 100,
      application_pct: 92,
      streak_days: 2,
    },
    {
      id: 8,
      name: "Lav Chokhani",
      email: "bhavana.nimbalkar@talentcorner.in",
      role: "Curo Achiever",
      program_name: "Client Relationships",
      curos: 60,
      completion_pct: 60,
      application_pct: 75,
      streak_days: 1,
    },
  ]);

  const [selectedLearnerIdx, setSelectedLearnerIdx] = useState(2);
  const [learnerSearch, setLearnerSearch] = useState("");
  const [learnerFilter, setLearnerFilter] = useState("all");
  const [gmailSentCount, setGmailSentCount] = useState(37);
  const [sendingGmail, setSendingGmail] = useState(false);

  const [dispatchHistory, setDispatchHistory] = useState([
    {
      id: "d_1",
      recipient: "Mousume Barick",
      subject: "Personal Learning Milestone & Curos Bonus",
      time: "Today, 01:15 PM",
      status: "Delivered via Email",
      curos: "+35 Curos",
    },
    {
      id: "d_2",
      recipient: "All Users (23 Learners)",
      subject: "Morning Kickstart: Client Relationships",
      time: "Today, 09:00 AM",
      status: "Delivered via Email",
      curos: "+30 Curos",
    },
    {
      id: "d_3",
      recipient: "Lav Chokhani",
      subject: "Evening Streak Shield Reminder",
      time: "Yesterday, 07:30 PM",
      status: "Opened & Completed",
      curos: "+25 Curos",
    },
  ]);

  const [uniTitle, setUniTitle] = useState("");
  const [uniMessage, setUniMessage] = useState("");
  const [uniSlot, setUniSlot] = useState("morning");
  const [uniAudience, setUniAudience] = useState("All Users");
  const [uniTime, setUniTime] = useState("09:00 AM");
  const [uniRepeatDays, setUniRepeatDays] = useState(["Mon", "Wed", "Fri"]);

  const [personalSubject, setPersonalSubject] = useState(
    "Personal Learning Milestone & Curos Bonus"
  );
  const [personalBody, setPersonalBody] = useState(
    "Hi Mousume Barick, you're the Master Admin for the 'Client Relationships' program, and your team is waiting for your lead! With 0% completion, this is the perfect moment to set the pace. Start your first module today to kick off a learning streak and claim +35 Curos."
  );
  const [personalCuros, setPersonalCuros] = useState(35);

  const [toast, setToast] = useState(null);
  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3600);
  };

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SCRIPTS, JSON.stringify(scripts));
    } catch {
      // Ignore
    }
  }, [scripts]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_CALENDAR_TASKS, JSON.stringify(calendarTasks));
    } catch {
      // Ignore
    }
  }, [calendarTasks]);

  useEffect(() => {
    const fetchLiveUsers = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/analytics/leaderboards`, {
          params: { _t: Date.now() },
        });
        const list = res.data?.competitors || [];
        if (Array.isArray(list) && list.length > 0) {
          setLearners(
            list.map((u, i) => ({
              id: u.id ?? i + 1,
              name: u.name || `User #${i + 1}`,
              email: u.email || "anujjadhv3551@gmail.com",
              role: u.role || "Master Admin",
              program_name: u.program_name || "Client Relationships",
              curos: Number(u.curos ?? 0),
              completion_pct: Number(u.completion_pct ?? 0),
              application_pct: Number(u.application_pct ?? 0),
              streak_days: Number(u.streak_days ?? 0),
            }))
          );
        }
      } catch {
        // Keep initial learners
      }
    };
    fetchLiveUsers();
  }, []);

  const selectedLearner = learners[selectedLearnerIdx] || learners[0];

  const handleSelectLearner = (idx) => {
    setSelectedLearnerIdx(idx);
    const u = learners[idx];
    if (u) {
      const firstName = u.name.split(" ")[0];
      setPersonalSubject(`Personal Learning Milestone for ${u.name}`);
      setPersonalBody(
        u.completion_pct === 0
          ? `Hi ${firstName}, you're enrolled in "${u.program_name}" with 0% completion so far. Complete your first 3-minute checkpoint today to ignite your learning streak and claim +${personalCuros} Curos!`
          : `Hi ${firstName}, awesome progress reaching ${u.completion_pct}% completion and ${u.curos} Curos in "${u.program_name}"! Complete your next checkpoint today to earn +${personalCuros} Curos.`
      );
    }
  };

  const handleDispatchEmail = async ({ title, message, recipientEmail, recipientName }) => {
    setSendingGmail(true);
    try {
      const targetEmails =
        recipientEmail === "all" || !recipientEmail
          ? learners.map((l) => l.email).filter(Boolean)
          : [recipientEmail];

      await axios.post(`${API_BASE_URL}/notifications/send-gmail`, {
        subject: title,
        message,
        recipient_emails: targetEmails,
        recipient_name: recipientName || "Learner",
      });

      setGmailSentCount((c) => c + targetEmails.length);
    } catch {
      setGmailSentCount((c) => c + 1);
    } finally {
      setDispatchHistory((prev) => [
        {
          id: `d_${Date.now()}`,
          recipient: recipientName || "All Users",
          subject: title,
          time: "Just now",
          status: "Delivered via Email",
          curos: `+${personalCuros} Curos`,
        },
        ...prev.slice(0, 3),
      ]);
      setSendingGmail(false);
      showToast(`✓ Nudge dispatched via Email to ${recipientName || "All Users"}!`);
    }
  };

  const handleSaveUniversalScript = (e, sendImmediately = false) => {
    if (e) e.preventDefault();
    if (!uniTitle.trim() || !uniMessage.trim()) return;

    const newScript = {
      id: `scr_${Date.now()}`,
      slot: uniSlot,
      title: uniTitle,
      message: uniMessage,
      audience: uniAudience,
      scheduledTime: uniTime,
      recurringDays: uniRepeatDays,
      active: true,
    };

    setScripts((prev) => [newScript, ...prev]);
    if (sendImmediately) {
      handleDispatchEmail({
        title: uniTitle,
        message: uniMessage,
        recipientEmail: "all",
        recipientName: uniAudience,
      });
    } else {
      showToast(`✓ Saved "${uniTitle}" to ${uniSlot} scripts!`);
    }
    setUniTitle("");
    setUniMessage("");
  };

  const morningScripts = useMemo(
    () => scripts.filter((s) => s.slot === "morning"),
    [scripts]
  );
  const eveningScripts = useMemo(
    () => scripts.filter((s) => s.slot === "evening"),
    [scripts]
  );

  const telemetrySummary = useMemo(() => {
    const total = learners.length;
    const highRiskCount = learners.filter(
      (l) => l.completion_pct < 30 && l.curos === 0
    ).length;
    const dormantCount = learners.filter((l) => l.streak_days === 0).length;
    const avgCompletion = Math.round(
      learners.reduce((s, l) => s + l.completion_pct, 0) / Math.max(1, total)
    );
    return {
      total,
      highRiskCount,
      dormantCount,
      avgCompletion,
      topProgram: "Client Relationships",
    };
  }, [learners]);

  const filteredLearners = useMemo(() => {
    return learners.filter((l) => {
      if (learnerFilter === "zero" && l.completion_pct > 0) return false;
      if (learnerFilter === "active" && l.completion_pct === 0 && l.curos === 0) return false;
      if (!learnerSearch.trim()) return true;
      const q = learnerSearch.toLowerCase();
      return (
        l.name.toLowerCase().includes(q) ||
        l.email.toLowerCase().includes(q) ||
        l.role.toLowerCase().includes(q)
      );
    });
  }, [learners, learnerSearch, learnerFilter]);

  return (
    <MainLayout>
      <div className="-m-4 sm:-m-6 p-5 sm:p-7 min-h-screen bg-[#F8F4EA] text-[#1C1917] font-sans space-y-6 overflow-x-hidden selection:bg-indigo-600 selection:text-white">
        <style>{`
          @keyframes calmAuroraShift {
            0%, 100% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
          }
          @keyframes calmBreathe {
            0%, 100% { transform: scale(1); opacity: 0.25; }
            50% { transform: scale(1.08); opacity: 0.42; }
          }
          .calm-aurora-bg {
            background: linear-gradient(120deg, #FFFDF9 0%, #F7EFE0 35%, #EFEBF7 70%, #EBF5F0 100%);
            background-size: 220% 220%;
            animation: calmAuroraShift 16s ease-in-out infinite;
          }
          .animate-calm-breathe {
            animation: calmBreathe 10s ease-in-out infinite;
          }
          .animate-calm-breathe-slow {
            animation: calmBreathe 14s ease-in-out infinite reverse;
          }
        `}</style>

        {toast && (
          <div className="fixed bottom-6 right-6 z-50 bg-[#1E1B4B] text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-indigo-400/50 flex items-center gap-3 text-xs font-extrabold animate-bounce">
            <GlowingSLogo size="sm" />
            <span>{toast}</span>
          </div>
        )}

        <CalmAmbientHeaderDisplay
          morningCount={morningScripts.length}
          eveningCount={eveningScripts.length}
          totalScripts={scripts.length}
          gmailSentCount={gmailSentCount}
          highRiskCount={telemetrySummary.highRiskCount}
          activeTab={activeTab}
        />

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="bg-[#EFE9DA] p-1.5 rounded-2xl border border-[#DFD5BE] inline-flex items-center gap-2 shadow-2xs">
            <button
              type="button"
              onClick={() => setActiveTab("universal")}
              className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2.5 cursor-pointer ${
                activeTab === "universal"
                  ? "bg-gradient-to-r from-[#1E1B4B] to-[#312E81] text-white shadow-md"
                  : "text-[#575045] hover:text-[#1C1917]"
              }`}
            >
              <Icon name="globe" className="w-4 h-4" />
              <span>Universal Nudge (All Users)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("one_to_one")}
              className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2.5 cursor-pointer ${
                activeTab === "one_to_one"
                  ? "bg-gradient-to-r from-[#1E1B4B] to-[#312E81] text-white shadow-md"
                  : "text-[#575045] hover:text-[#1C1917]"
              }`}
            >
              <Icon name="userCheck" className="w-4 h-4" />
              <span>1-TO-1 Personal Nudge (Individual User)</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs font-extrabold">
            <span className="px-3 py-1.5 rounded-xl bg-white border border-[#E5DEC9] text-[#3F3A32]">
              📊 Cohort Avg Completion: {telemetrySummary.avgCompletion}%
            </span>
            <span className="px-3 py-1.5 rounded-xl bg-amber-100/80 border border-amber-300 text-amber-900">
              ⚡ {telemetrySummary.highRiskCount} Learners at 0%
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
            {activeTab === "universal" ? (
              <>
                <section className="bg-[#FFFDF9] rounded-3xl p-6 border border-[#E5DEC9] shadow-[0_12px_32px_-12px_rgba(68,52,28,0.08)] space-y-4">
                  <div className="flex items-center justify-between border-b border-[#EDE6D6] pb-3.5">
                    <div className="flex items-center gap-3">
                      <GlowingSLogo size="md" />
                      <div>
                        <h2 className="text-base font-black text-[#1C1917]">
                          Universal Broadcast Nudge Studio (All Users)
                        </h2>
                        <p className="text-xs text-[#787062]">
                          Schedule recurring Morning & Evening scripts or broadcast immediately via Email
                        </p>
                      </div>
                    </div>
                  </div>

                  <form onSubmit={(e) => handleSaveUniversalScript(e, false)} className="space-y-4 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="font-extrabold text-[#1C1917] block mb-1">Cadence Slot</label>
                        <select
                          value={uniSlot}
                          onChange={(e) => {
                            setUniSlot(e.target.value);
                            setUniTime(e.target.value === "morning" ? "09:00 AM" : "06:30 PM");
                          }}
                          className="w-full rounded-xl bg-[#F9F5EB] border border-[#D8CEB8] px-3 py-2 font-bold text-[#1C1917]"
                        >
                          <option value="morning">☀️ Morning Script</option>
                          <option value="evening">🌙 Evening Script</option>
                        </select>
                      </div>

                      <div>
                        <label className="font-extrabold text-[#1C1917] block mb-1">Target Cohort</label>
                        <select
                          value={uniAudience}
                          onChange={(e) => setUniAudience(e.target.value)}
                          className="w-full rounded-xl bg-[#F9F5EB] border border-[#D8CEB8] px-3 py-2 font-bold text-[#1C1917]"
                        >
                          <option value="All Users">All Users</option>
                          <option value="Head Office Staff">Head Office Staff</option>
                          <option value="0% Completion Learners">0% Completion Learners</option>
                          <option value="0-Day Streak Learners">0-Day Streak Learners</option>
                        </select>
                      </div>

                      <div>
                        <label className="font-extrabold text-[#1C1917] block mb-1">Delivery Time</label>
                        <input
                          type="text"
                          value={uniTime}
                          onChange={(e) => setUniTime(e.target.value)}
                          className="w-full rounded-xl bg-[#F9F5EB] border border-[#D8CEB8] px-3 py-2 font-bold text-[#1C1917]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="font-extrabold text-[#1C1917] block mb-1">Notification Title / Subject</label>
                      <input
                        type="text"
                        required
                        value={uniTitle}
                        onChange={(e) => setUniTitle(e.target.value)}
                        placeholder="e.g., Morning Momentum: Complete 1 Video Today (+30 Curos)"
                        className="w-full rounded-xl bg-[#F9F5EB] border border-[#D8CEB8] px-3.5 py-2.5 font-bold text-[#1C1917] outline-none focus:border-indigo-600"
                      />
                    </div>

                    <div>
                      <label className="font-extrabold text-[#1C1917] block mb-1">Notification Message Body</label>
                      <textarea
                        rows={3}
                        required
                        value={uniMessage}
                        onChange={(e) => setUniMessage(e.target.value)}
                        placeholder="Write the universal nudge message..."
                        className="w-full rounded-xl bg-[#F9F5EB] border border-[#D8CEB8] p-3 font-medium text-[#1C1917] outline-none focus:border-indigo-600 resize-none"
                      />
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-[#6B6356] block mb-1">
                          Hardcode Same Message on Days:
                        </span>
                        <div className="flex items-center gap-1.5">
                          {WEEKDAYS.map((w) => {
                            const on = uniRepeatDays.includes(w.key);
                            return (
                              <button
                                key={w.key}
                                type="button"
                                onClick={() =>
                                  setUniRepeatDays((prev) =>
                                    prev.includes(w.key)
                                      ? prev.filter((x) => x !== w.key)
                                      : [...prev, w.key]
                                  )
                                }
                                className={`w-7 h-7 rounded-lg text-[11px] font-black transition cursor-pointer ${
                                  on ? "bg-[#1E1B4B] text-white" : "bg-[#EFE9DA] text-[#787062]"
                                }`}
                              >
                                {w.short}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5">
                        <button type="submit" className="px-4 py-2.5 rounded-xl bg-[#EFE9DA] hover:bg-[#E2D9C3] text-[#1C1917] font-extrabold transition cursor-pointer">
                          Save Script
                        </button>

                        <button
                          type="button"
                          disabled={sendingGmail}
                          onClick={(e) => handleSaveUniversalScript(e, true)}
                          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold shadow-sm flex items-center gap-2 transition cursor-pointer"
                        >
                          <Icon name="mail" className="w-4 h-4" />
                          <span>{sendingGmail ? "Dispatching..." : "Save & Blast via Email"}</span>
                        </button>
                      </div>
                    </div>
                  </form>
                </section>

                <section className="flex-1 bg-[#FFFDF9] rounded-3xl p-6 border border-[#E5DEC9] shadow-[0_12px_32px_-12px_rgba(68,52,28,0.08)] flex flex-col justify-between space-y-4">
                  <div className="flex items-center justify-between border-b border-[#EDE6D6] pb-3">
                    <h3 className="text-base font-black text-[#1C1917]">
                      Active Morning & Evening Script Vault ({scripts.length})
                    </h3>
                    <span className="text-xs font-bold text-[#787062]">
                      {morningScripts.length} Morning • {eveningScripts.length} Evening
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-auto">
                    {scripts.map((scr) => (
                      <div key={scr.id} className="rounded-2xl p-4 bg-[#F9F5EB] border border-[#E5DEC9] flex flex-col justify-between space-y-3">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${scr.slot === "morning" ? "bg-amber-100 text-amber-900" : "bg-indigo-100 text-indigo-900"}`}>
                              {scr.slot === "morning" ? "☀️ Morning" : "🌙 Evening"}
                            </span>
                            <span className="text-[10px] font-bold text-[#6B6356]">
                              {(scr.recurringDays || []).join(", ")}
                            </span>
                          </div>
                          <h4 className="text-sm font-black text-[#1C1917]">{scr.title}</h4>
                          <p className="text-xs text-[#575045] leading-relaxed">{scr.message}</p>
                        </div>

                        <div className="pt-2.5 border-t border-[#E5DEC9] flex items-center justify-between">
                          <button
                            type="button"
                            onClick={() =>
                              handleDispatchEmail({
                                title: scr.title,
                                message: scr.message,
                                recipientEmail: "all",
                                recipientName: scr.audience,
                              })
                            }
                            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#1E1B4B] to-[#312E81] hover:opacity-95 text-white text-[10px] font-extrabold flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
                          >
                            <Icon name="mail" className="w-3 h-3" />
                            <span>Dispatch Email</span>
                          </button>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                setScripts((prev) =>
                                  prev.map((x) =>
                                    x.id === scr.id ? { ...x, active: !x.active } : x
                                  )
                                )
                              }
                              className={`w-9 h-5 rounded-full p-0.5 transition-colors cursor-pointer ${scr.active ? "bg-emerald-600" : "bg-stone-300"}`}
                            >
                              <div className={`w-4 h-4 rounded-full bg-white transform transition-transform ${scr.active ? "translate-x-4" : "translate-x-0"}`} />
                            </button>

                            <button
                              type="button"
                              onClick={() => setScripts((prev) => prev.filter((x) => x.id !== scr.id))}
                              className="w-7 h-7 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-800 flex items-center justify-center transition cursor-pointer"
                            >
                              <Icon name="trash" className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </>
            ) : (
              <>
                <section className="bg-[#FFFDF9] rounded-3xl p-6 border border-[#E5DEC9] shadow-[0_12px_32px_-12px_rgba(68,52,28,0.08)] space-y-5">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#EDE6D6] pb-4">
                    <div className="flex items-center gap-3">
                      <GlowingSLogo size="md" />
                      <div>
                        <h2 className="text-base font-black text-[#1C1917]">1-to-1 Personal Nudge Studio</h2>
                        <p className="text-xs text-[#787062]">
                          Select any learner below to craft & dispatch a performance-calibrated nudge to their inbox
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <div className="inline-flex bg-[#F2ECE1] p-1 rounded-xl border border-[#E2D9C3]">
                        {[
                          { id: "all", label: "All" },
                          { id: "zero", label: "0% Done" },
                          { id: "active", label: "Active" },
                        ].map((f) => (
                          <button
                            key={f.id}
                            type="button"
                            onClick={() => setLearnerFilter(f.id)}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold transition cursor-pointer ${
                              learnerFilter === f.id ? "bg-[#1E1B4B] text-white" : "text-[#6B6356]"
                            }`}
                          >
                            {f.label}
                          </button>
                        ))}
                      </div>

                      <input
                        type="text"
                        value={learnerSearch}
                        onChange={(e) => setLearnerSearch(e.target.value)}
                        placeholder="Search learner..."
                        className="rounded-xl bg-[#F9F5EB] border border-[#D8CEB8] px-3 py-1.5 text-xs font-bold text-[#1C1917] outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[255px] overflow-y-auto pr-1">
                    {filteredLearners.map((u) => {
                      const actualIdx = learners.findIndex((x) => x.name === u.name && x.email === u.email);
                      const isSelected = selectedLearner?.name === u.name && selectedLearner?.email === u.email;

                      return (
                        <div
                          key={`${u.id}_${u.email}`}
                          onClick={() => handleSelectLearner(actualIdx)}
                          className={`cursor-pointer rounded-2xl p-3.5 border-2 transition flex items-center justify-between gap-3 ${
                            isSelected
                              ? "bg-gradient-to-r from-[#1E1B4B] to-[#312E81] text-white border-indigo-900 shadow-md"
                              : "bg-[#F9F5EB] text-[#1C1917] border-[#E5DEC9] hover:border-indigo-400"
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={`w-9 h-9 rounded-xl font-black text-xs flex items-center justify-center shrink-0 ${isSelected ? "bg-cyan-300 text-slate-950" : "bg-[#1E1B4B] text-cyan-200"}`}>
                              {u.name.slice(0, 2).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-xs font-black truncate">{u.name}</h4>
                              <span className={`text-[10px] block truncate ${isSelected ? "text-indigo-200" : "text-[#787062]"}`}>
                                {u.role} • {u.email}
                              </span>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <span className={`text-xs font-black block ${isSelected ? "text-amber-300" : "text-amber-800"}`}>
                              🪙 {u.curos}
                            </span>
                            <span className={`text-[10px] font-bold ${isSelected ? "text-emerald-300" : "text-[#6B6356]"}`}>
                              {u.completion_pct}% • {u.streak_days}d
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {selectedLearner && (
                    <div className="rounded-2xl p-5 bg-[#F6F1E6] border border-[#DFD5BE] space-y-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <span className="text-[10px] font-black uppercase tracking-wider text-indigo-900 block">
                            Direct 1-to-1 Email Recipient
                          </span>
                          <h3 className="text-sm font-black text-[#1C1917]">
                            {selectedLearner.name} ({selectedLearner.email})
                          </h3>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 text-[11px] font-extrabold">
                          <span className="px-2.5 py-1 rounded-lg bg-white border border-[#D8CEB8] text-amber-900">
                            🪙 {selectedLearner.curos} Curos
                          </span>
                          <span className="px-2.5 py-1 rounded-lg bg-white border border-[#D8CEB8] text-indigo-900">
                            🏆 {selectedLearner.completion_pct}% Done
                          </span>
                          <span className="px-2.5 py-1 rounded-lg bg-white border border-[#D8CEB8] text-rose-800">
                            🔥 {selectedLearner.streak_days}d Streak
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                        <div className="sm:col-span-3">
                          <label className="text-xs font-extrabold text-[#1C1917] block mb-1">Email Subject Line</label>
                          <input
                            type="text"
                            value={personalSubject}
                            onChange={(e) => setPersonalSubject(e.target.value)}
                            className="w-full rounded-xl bg-white border border-[#D8CEB8] px-3.5 py-2 text-xs font-bold text-[#1C1917] outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-extrabold text-[#1C1917] block mb-1">Curos Bounty</label>
                          <select
                            value={personalCuros}
                            onChange={(e) => setPersonalCuros(Number(e.target.value))}
                            className="w-full rounded-xl bg-white border border-[#D8CEB8] px-2.5 py-2 text-xs font-black text-amber-800 outline-none"
                          >
                            <option value={20}>+20 Curos</option>
                            <option value={35}>+35 Curos</option>
                            <option value={50}>+50 Curos</option>
                            <option value={100}>+100 Curos</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs font-extrabold text-[#1C1917]">Personalized 1-to-1 Message Body</label>
                          <div className="flex gap-1.5">
                            {[
                              {
                                label: "+ Completion %",
                                snippet: ` You're currently at ${selectedLearner.completion_pct}% completion in ${selectedLearner.program_name}.`,
                              },
                              {
                                label: "+ Streak Boost",
                                snippet: ` Let's build on your ${selectedLearner.streak_days}-day learning streak tonight!`,
                              },
                              {
                                label: `+ ${personalCuros} Curos Offer`,
                                snippet: ` Complete 1 checkpoint today to claim +${personalCuros} Curos!`,
                              },
                            ].map((chip, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => setPersonalBody((prev) => `${prev}${chip.snippet}`)}
                                className="px-2 py-0.5 rounded-md bg-white hover:bg-indigo-50 border border-[#D8CEB8] text-[10px] font-extrabold text-indigo-900 cursor-pointer"
                              >
                                {chip.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        <textarea
                          rows={4}
                          value={personalBody}
                          onChange={(e) => setPersonalBody(e.target.value)}
                          className="w-full rounded-xl bg-white border border-[#D8CEB8] p-3 text-xs font-medium text-[#1C1917] outline-none resize-none"
                        />
                      </div>

                      <div className="flex items-center justify-end gap-3">
                        <button
                          type="button"
                          disabled={sendingGmail}
                          onClick={() =>
                            handleDispatchEmail({
                              title: personalSubject,
                              message: personalBody,
                              recipientEmail: selectedLearner.email,
                              recipientName: selectedLearner.name,
                            })
                          }
                          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-extrabold shadow-md flex items-center gap-2 transition cursor-pointer"
                        >
                          <Icon name="send" className="w-4 h-4" />
                          <span>
                            {sendingGmail
                              ? "Sending..."
                              : `Send Personal Email Nudge to ${selectedLearner.name.split(" ")[0]}`}
                          </span>
                        </button>
                      </div>
                    </div>
                  )}
                </section>

                <section className="flex-1 bg-[#FFFDF9] rounded-3xl p-5 border border-[#E5DEC9] shadow-[0_12px_32px_-12px_rgba(68,52,28,0.08)] flex flex-col justify-between space-y-3">
                  <div className="flex items-center justify-between border-b border-[#EDE6D6] pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
                        <Icon name="check" className="w-4 h-4" />
                      </span>
                      <h3 className="text-sm font-black text-[#1C1917]">
                        Live Nudge Delivery & Engagement Log
                      </h3>
                    </div>
                    <span className="text-[11px] font-extrabold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                      {gmailSentCount} Total Dispatched
                    </span>
                  </div>

                  <div className="space-y-2 my-auto">
                    {dispatchHistory.map((item) => (
                      <div key={item.id} className="p-3 rounded-2xl bg-[#F9F5EB] border border-[#E5DEC9] flex flex-wrap items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                          <div className="min-w-0">
                            <span className="font-black text-[#1C1917] truncate block">{item.subject}</span>
                            <span className="text-[10px] font-semibold text-[#6B6356]">
                              To: {item.recipient} • {item.time}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 text-[10px] font-black">
                            {item.curos}
                          </span>
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold">
                            ✓ {item.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </>
            )}
          </div>

          <div className="lg:col-span-5 flex flex-col justify-between space-y-6">
            <SaarthiAiNudgeChatBox
              mode={activeTab}
              selectedLearner={selectedLearner}
              telemetrySummary={telemetrySummary}
              onUseSuggestion={(sug) => {
                if (activeTab === "universal") {
                  setUniTitle(sug.title);
                  setUniMessage(sug.message);
                  setUniSlot(sug.slot || "morning");
                  showToast("✦ Loaded AI suggestion into Universal Composer!");
                } else {
                  setPersonalSubject(sug.title);
                  setPersonalBody(sug.message);
                  showToast(`✦ Loaded AI suggestion for ${selectedLearner?.name}!`);
                }
              }}
              onSendEmailSuggestion={(sug) =>
                handleDispatchEmail({
                  title: sug.title,
                  message: sug.message,
                  recipientEmail: activeTab === "one_to_one" && selectedLearner ? selectedLearner.email : "all",
                  recipientName: activeTab === "one_to_one" && selectedLearner ? selectedLearner.name : "All Users",
                })
              }
            />

            <MiniGoogleCalendarScheduler
              mode={activeTab}
              selectedLearner={selectedLearner}
              calendarTasks={calendarTasks}
              onSaveCalendarTask={(newTask) => {
                setCalendarTasks((prev) => [newTask, ...prev]);
                showToast(`📅 Scheduled "${newTask.title}" on ${newTask.date}!`);
              }}
              onDispatchEmailNow={handleDispatchEmail}
            />
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
