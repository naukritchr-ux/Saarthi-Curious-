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

const STORAGE_KEY_SCRIPTS = "saarthi_notification_scripts_v8";
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
// 1. WARM CORAL-GOLD "GLOWING S" LOGO (NON-BLUE)
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
      className={`relative ${dims} bg-gradient-to-br from-[#D97706] via-[#EA580C] to-[#E11D48] flex items-center justify-center shrink-0 shadow-[0_4px_18px_rgba(234,88,12,0.45)] border border-amber-200/80 select-none overflow-hidden`}
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-rose-400/30 via-amber-200/35 to-white/30 animate-pulse" />
      <svg
        viewBox="0 0 36 36"
        className="w-3/5 h-3/5 relative z-10 overflow-visible drop-shadow-[0_0_6px_rgba(255,255,255,0.95)]"
      >
        <path
          d="M24.5 10.5C24.5 7.5 21.5 5.5 17.5 5.5C13 5.5 10 8 10 11.5C10 15 13.5 16.5 18 17.8C22.5 19.1 25.5 20.8 25.5 24.5C25.5 28.5 22 30.5 17.5 30.5C12.5 30.5 9.5 28 9.5 24.5"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

// ============================================================================
// 2. CLEAN VECTOR SVG ICONS
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
    case "user":
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
    case "refresh":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className={className}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v5h5" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M16 16h5v5" />
        </svg>
      );
    case "edit":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
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
// 3. LIVE RESONANCE RINGS HERO BANNER
// ============================================================================
function LiveHeroBanner({
  morningCount,
  eveningCount,
  totalScripts,
  mailsSentCount,
}) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animId;
    let t = 0;

    const render = () => {
      t += 0.018;
      const parent = canvas.parentElement;
      const w = (canvas.width = parent?.clientWidth || 1100);
      const h = (canvas.height = 225);

      const baseHue = (t * 25) % 360;

      // Dynamic Color-Shifting Backdrop
      const bgGrad = ctx.createLinearGradient(0, 0, w, h);
      bgGrad.addColorStop(0, `hsla(${(baseHue + 190) % 360}, 76%, 92%, 1)`);
      bgGrad.addColorStop(0.5, `hsla(${(baseHue + 215) % 360}, 72%, 90%, 1)`);
      bgGrad.addColorStop(1, `hsla(${(baseHue + 240) % 360}, 76%, 93%, 1)`);
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, w, h);

      // PULSE RESONANCE RINGS
      const centers = [
        { x: w * 0.22, y: h * 0.5 },
        { x: w * 0.52, y: h * 0.45 },
        { x: w * 0.82, y: h * 0.52 },
      ];
      centers.forEach((pt, idx) => {
        for (let k = 0; k < 4; k++) {
          const radius = ((t * 36 + k * 40 + idx * 22) % 170) + 12;
          const alpha = Math.max(0, 1 - radius / 180) * 0.44;
          const hue = (baseHue + idx * 55 + k * 20) % 360;

          ctx.strokeStyle = `hsla(${hue}, 86%, 54%, ${alpha})`;
          ctx.lineWidth = 2.2;
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, radius, 0, Math.PI * 2);
          ctx.stroke();
        }
      });

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <section className="relative rounded-3xl overflow-hidden border border-[#DFD3BC] shadow-[0_14px_36px_-12px_rgba(68,52,28,0.12)] bg-[#FFFDF9]">
      <canvas
        ref={canvasRef}
        className="w-full h-[230px] sm:h-[215px] block pointer-events-none"
      />

      <div className="absolute inset-0 p-5 sm:p-6 flex flex-col justify-between">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3.5">
            <GlowingSLogo size="lg" />
            <div>
              <h1 className="text-2xl sm:text-[26px] font-black text-[#1C1917] tracking-tight">
                Notification Scripts
              </h1>
              <p className="text-xs text-[#575045] font-semibold">
                Manage Morning, Evening, and Personalized Mail Nudges
              </p>
            </div>
          </div>
        </div>

        {/* 4 Frosted Glass KPI Pods */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-white/75 backdrop-blur-md rounded-2xl px-4 py-3 border border-white/90 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-extrabold text-amber-800 flex items-center gap-1.5">
                <Icon name="sun" className="w-3.5 h-3.5 text-amber-600" />
                Morning Scripts
              </span>
              <span className="text-2xl font-black text-[#1C1917] block mt-0.5">
                {morningCount}
              </span>
            </div>
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-lg bg-amber-500/15 text-amber-900">
              {Math.round((morningCount / Math.max(1, totalScripts)) * 100)}%
            </span>
          </div>

          <div className="bg-white/75 backdrop-blur-md rounded-2xl px-4 py-3 border border-white/90 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-extrabold text-rose-800 flex items-center gap-1.5">
                <Icon name="moon" className="w-3.5 h-3.5 text-rose-600" />
                Evening Scripts
              </span>
              <span className="text-2xl font-black text-[#1C1917] block mt-0.5">
                {eveningCount}
              </span>
            </div>
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-lg bg-rose-500/15 text-rose-900">
              {Math.round((eveningCount / Math.max(1, totalScripts)) * 100)}%
            </span>
          </div>

          <div className="bg-white/75 backdrop-blur-md rounded-2xl px-4 py-3 border border-white/90 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-extrabold text-sky-900 flex items-center gap-1.5">
                <span>🔔</span>
                <span>Total Scripts</span>
              </span>
              <span className="text-2xl font-black text-[#1C1917] block mt-0.5">
                {totalScripts}
              </span>
            </div>
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-lg bg-sky-500/15 text-sky-900">
              {morningCount}M • {eveningCount}E
            </span>
          </div>

          <div className="bg-white/75 backdrop-blur-md rounded-2xl px-4 py-3 border border-white/90 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-extrabold text-emerald-900 flex items-center gap-1.5">
                <Icon name="mail" className="w-3.5 h-3.5 text-emerald-600" />
                Mails Sent
              </span>
              <span className="text-2xl font-black text-[#1C1917] block mt-0.5">
                {mailsSentCount}
              </span>
            </div>
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-lg bg-emerald-500/15 text-emerald-800">
              Live Mail
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

// ============================================================================
// 4. MINIMALIST "AI ASSISTANCE" PANEL
//    Header has ONLY: Glowing S Logo + "AI Assistance" + Small Refresh Icon
// ============================================================================
function SimpleAiAssistancePanel({
  mode,
  selectedLearner,
  telemetrySummary,
  onUseSuggestion,
  onSendMailSuggestion,
}) {
  const [promptInput, setPromptInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);

  const generateSuggestions = useCallback(
    async (customGoal = "") => {
      setLoading(true);
      const goal = customGoal.trim();

      try {
        const res = await axios.post(
          `${API_BASE_URL}/notifications/groq-suggest`,
          {
            mode,
            model_instructions:
              goal || "Suggest 2 simple, friendly learning nudges.",
            learner: mode === "one_to_one" ? selectedLearner : null,
            telemetry: telemetrySummary,
          }
        );
        if (
          Array.isArray(res.data?.suggestions) &&
          res.data.suggestions.length > 0
        ) {
          setSuggestions(res.data.suggestions.slice(0, 2));
          setLoading(false);
          return;
        }
      } catch {
        // Fallback synthesis
      }

      setTimeout(() => {
        if (mode === "one_to_one" && selectedLearner) {
          const firstName = selectedLearner.name.split(" ")[0];
          const isZero = selectedLearner.completion_pct === 0;
          setSuggestions([
            {
              id: `ai_1_${Date.now()}`,
              slot: "morning",
              title: goal
                ? `${firstName}: ${goal.slice(0, 36)}`
                : isZero
                ? `Start "${selectedLearner.program_name}", ${firstName}!`
                : `Great Progress, ${firstName} (+35 Curos)`,
              message: goal
                ? `Hi ${firstName}, ${goal}. Complete 1 module in "${selectedLearner.program_name}" today to earn +35 Curos!`
                : isZero
                ? `Hi ${firstName}, complete your first 3-minute module in "${selectedLearner.program_name}" today to start your streak and earn +35 Curos!`
                : `Hi ${firstName}, you've reached ${selectedLearner.completion_pct}% completion and ${selectedLearner.curos} Curos! Complete 1 more checkpoint today.`,
            },
            {
              id: `ai_2_${Date.now()}`,
              slot: "evening",
              title: `Evening Reminder for ${firstName}`,
              message: `Hi ${firstName}, spend 3 minutes in "${selectedLearner.program_name}" tonight to keep your ${selectedLearner.streak_days}d streak active and earn +25 Curos!`,
            },
          ]);
        } else {
          setSuggestions([
            {
              id: `ai_u1_${Date.now()}`,
              slot: "morning",
              title: goal
                ? `Morning Update: ${goal.slice(0, 36)}`
                : `Morning Kickstart: ${telemetrySummary.topProgram}`,
              message: goal
                ? `Hello Everyone! ${goal}. Complete 1 module in "${telemetrySummary.topProgram}" today to earn +30 Curos!`
                : `Good morning! Watch 1 short module in "${telemetrySummary.topProgram}" today to claim +30 Curos and boost your progress.`,
            },
            {
              id: `ai_u2_${Date.now()}`,
              slot: "evening",
              title: "Evening Course Reminder",
              message:
                "Complete 1 quick checkpoint before tonight ends to protect your learning streak and unlock +25 Curos!",
            },
          ]);
        }
        setLoading(false);
      }, 240);
    },
    [mode, selectedLearner, telemetrySummary]
  );

  useEffect(() => {
    generateSuggestions("");
  }, [generateSuggestions]);

  const handlePromptSubmit = (e) => {
    e.preventDefault();
    if (!promptInput.trim()) return;
    generateSuggestions(promptInput);
    setPromptInput("");
  };

  return (
    <div className="bg-[#FFFDF9] rounded-3xl p-5 border border-[#E5DEC9] shadow-[0_10px_28px_-12px_rgba(68,52,28,0.07)] space-y-4">
      {/* STRICTLY: Logo + "AI Assistance" + Small Refresh Icon */}
      <div className="flex items-center justify-between border-b border-[#EDE6D6] pb-3">
        <div className="flex items-center gap-2.5">
          <GlowingSLogo size="md" />
          <h3 className="text-base font-black text-[#1C1917] tracking-tight">
            AI Assistance
          </h3>
        </div>

        <button
          type="button"
          onClick={() => generateSuggestions("")}
          title="Refresh AI Assistance"
          className="glass-btn-light w-8 h-8 rounded-xl flex items-center justify-center cursor-pointer"
        >
          <Icon
            name="refresh"
            className={`w-4 h-4 ${loading ? "animate-spin text-amber-600" : ""}`}
          />
        </button>
      </div>

      {/* Chat Prompt Input */}
      <form onSubmit={handlePromptSubmit} className="flex items-center gap-2">
        <input
          type="text"
          value={promptInput}
          onChange={(e) => setPromptInput(e.target.value)}
          placeholder="Tell AI what type of nudge you want..."
          className="flex-1 rounded-xl bg-[#F9F5EB] border border-[#D8CEB8] focus:border-sky-500 px-3.5 py-2 text-xs font-semibold text-[#1C1917] placeholder-[#8C8273] outline-none transition"
        />
        <button
          type="submit"
          className="glass-btn-blue px-4 py-2 rounded-xl text-xs font-extrabold cursor-pointer shrink-0"
        >
          Ask AI
        </button>
      </form>

      {/* 2 Clean Suggestion Cards */}
      <div className="space-y-3">
        {suggestions.map((sug) => (
          <div
            key={sug.id}
            className="rounded-2xl p-3.5 bg-[#F9F5EB] border border-[#E5DEC9] space-y-2"
          >
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black text-[#1C1917] truncate pr-2">
                {sug.title}
              </h4>
              <span className="text-[10px] font-bold text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded-md shrink-0">
                {sug.slot === "morning" ? "☀️ Morning" : "🌙 Evening"}
              </span>
            </div>

            <p className="text-xs text-[#575045] leading-relaxed bg-white/90 p-2.5 rounded-xl border border-[#EDE6D6]">
              {sug.message}
            </p>

            <div className="flex items-center justify-end gap-2 pt-0.5">
              <button
                type="button"
                onClick={() => onUseSuggestion(sug)}
                className="glass-btn-light px-3 py-1.5 rounded-xl text-[11px] font-bold cursor-pointer"
              >
                Use Text
              </button>
              <button
                type="button"
                onClick={() => onSendMailSuggestion(sug)}
                className="glass-btn-mail px-3.5 py-1.5 rounded-xl text-[11px] font-extrabold flex items-center gap-1.5 cursor-pointer"
              >
                <Icon name="mail" className="w-3.5 h-3.5" />
                <span>Send Mail</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// 5. SIMPLE MINI CALENDAR SCHEDULER (1-WEEK & 1-MONTH)
// ============================================================================
function MiniCalendarScheduler({
  mode,
  selectedLearner,
  calendarTasks,
  onSaveCalendarTask,
  onSendMailNow,
}) {
  const [calView, setCalView] = useState("week");
  const [selectedDate, setSelectedDate] = useState("2026-11-06");

  const [taskTitle, setTaskTitle] = useState("Course Reminder");
  const [taskMessage, setTaskMessage] = useState(
    "Complete 1 course video today to protect your learning streak and earn Curos!"
  );
  const [taskSlot, setTaskSlot] = useState("morning");
  const [taskTime, setTaskTime] = useState("09:00 AM");

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
    const targetName =
      mode === "one_to_one" && selectedLearner
        ? selectedLearner.name
        : "All Users";

    setTaskTitle(
      mode === "one_to_one"
        ? `Reminder for ${targetName}`
        : "Course Momentum Reminder"
    );
    setTaskMessage(
      mode === "one_to_one" && selectedLearner
        ? `Hi ${selectedLearner.name.split(" ")[0]}, complete 1 module in ${
            selectedLearner.program_name
          } on ${dateStr} to earn +30 Curos!`
        : `Complete 1 course video on ${dateStr} to protect your learning streak and earn Curos!`
    );
  };

  const handleCreateTask = (e) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;

    onSaveCalendarTask({
      id: `cal_task_${Date.now()}`,
      date: selectedDate,
      title: taskTitle,
      message: taskMessage,
      slot: taskSlot,
      time: taskTime,
      recipientName:
        mode === "one_to_one" && selectedLearner
          ? selectedLearner.name
          : "All Users",
      recipientEmail:
        mode === "one_to_one" && selectedLearner
          ? selectedLearner.email
          : "all",
    });
  };

  const selectedDateTasks = useMemo(
    () => calendarTasks.filter((t) => t.date === selectedDate),
    [calendarTasks, selectedDate]
  );

  return (
    <div className="flex-1 bg-[#FFFDF9] rounded-3xl p-5 border border-[#E5DEC9] shadow-[0_10px_28px_-12px_rgba(68,52,28,0.07)] flex flex-col justify-between space-y-4">
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-[#EDE6D6] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-sky-500/15 border border-sky-400/40 text-sky-800 flex items-center justify-center">
              <Icon name="calendar" className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-[#1C1917]">
                Mini Calendar
              </h3>
              <p className="text-[11px] text-[#787062]">
                Select any date to schedule or send mail (Nov 2026)
              </p>
            </div>
          </div>

          <div className="inline-flex bg-[#F2ECE1] p-1 rounded-xl border border-[#E2D9C3]">
            <button
              type="button"
              onClick={() => setCalView("week")}
              className={`px-3 py-1 rounded-lg text-[11px] font-extrabold transition-all cursor-pointer ${
                calView === "week"
                  ? "glass-btn-blue"
                  : "text-[#6B6356] hover:text-[#1C1917]"
              }`}
            >
              1 Week
            </button>
            <button
              type="button"
              onClick={() => setCalView("month")}
              className={`px-3 py-1 rounded-lg text-[11px] font-extrabold transition-all cursor-pointer ${
                calView === "month"
                  ? "glass-btn-blue"
                  : "text-[#6B6356] hover:text-[#1C1917]"
              }`}
            >
              1 Month
            </button>
          </div>
        </div>

        {/* Week or Month Grid */}
        {calView === "week" ? (
          <div className="grid grid-cols-7 gap-1.5">
            {weekDays.map((d) => {
              const isSel = selectedDate === d.dateStr;
              return (
                <div
                  key={d.dateStr}
                  onClick={() => handleDateClick(d.dateStr)}
                  className={`cursor-pointer rounded-2xl p-2.5 text-center border transition-all flex flex-col items-center justify-between min-h-[70px] ${
                    isSel
                      ? "glass-btn-blue"
                      : "bg-[#F9F5EB] text-[#1C1917] border-[#E5DEC9] hover:bg-white"
                  }`}
                >
                  <span
                    className={`text-[10px] font-bold uppercase ${
                      isSel ? "text-sky-100" : "text-[#787062]"
                    }`}
                  >
                    {d.dowKey}
                  </span>
                  <span className="text-base font-black my-0.5">
                    {d.dayNum}
                  </span>
                  <div className="flex items-center gap-1">
                    {d.tasks.slice(0, 3).map((_, i) => (
                      <span
                        key={i}
                        className={`w-1.5 h-1.5 rounded-full ${
                          isSel ? "bg-white" : "bg-emerald-600"
                        }`}
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
                    className={`h-9 rounded-xl text-xs font-extrabold transition-all flex flex-col items-center justify-center relative cursor-pointer border ${
                      isSel
                        ? "glass-btn-blue"
                        : hasTask
                        ? "bg-sky-100/80 text-sky-950 border-sky-300"
                        : "bg-[#F9F5EB] text-[#1C1917] border-[#E5DEC9] hover:bg-white"
                    }`}
                  >
                    <span>{d.dayNum}</span>
                    {hasTask && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 absolute bottom-1" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Simple Date Task Form */}
        <form
          onSubmit={handleCreateTask}
          className="rounded-2xl p-4 bg-[#F6F1E6] border border-[#D8CEB8] space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-[#1C1917]">
              📌 Schedule for {selectedDate}
            </span>
            <span className="text-[10px] font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded-md">
              {mode === "one_to_one" && selectedLearner
                ? selectedLearner.name.split(" ")[0]
                : "All Users"}
            </span>
          </div>

          <input
            type="text"
            required
            value={taskTitle}
            onChange={(e) => setTaskTitle(e.target.value)}
            placeholder="Title..."
            className="w-full rounded-xl bg-white border border-[#D8CEB8] px-3 py-2 text-xs font-bold text-[#1C1917] outline-none"
          />

          <textarea
            rows={2}
            required
            value={taskMessage}
            onChange={(e) => setTaskMessage(e.target.value)}
            placeholder="Message..."
            className="w-full rounded-xl bg-white border border-[#D8CEB8] p-2.5 text-xs text-[#1C1917] outline-none resize-none"
          />

          <div className="grid grid-cols-2 gap-2">
            <select
              value={taskSlot}
              onChange={(e) => {
                setTaskSlot(e.target.value);
                setTaskTime(
                  e.target.value === "morning" ? "09:00 AM" : "06:30 PM"
                );
              }}
              className="rounded-xl bg-white border border-[#D8CEB8] px-2.5 py-1.5 text-xs font-bold text-[#1C1917]"
            >
              <option value="morning">☀️ Morning</option>
              <option value="evening">🌙 Evening</option>
            </select>

            <input
              type="text"
              value={taskTime}
              onChange={(e) => setTaskTime(e.target.value)}
              className="rounded-xl bg-white border border-[#D8CEB8] px-2.5 py-1.5 text-xs font-bold text-[#1C1917]"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="submit"
              className="glass-btn-light px-3.5 py-1.5 rounded-xl text-[11px] font-bold cursor-pointer"
            >
              Save Date
            </button>
            <button
              type="button"
              onClick={() =>
                onSendMailNow({
                  title: taskTitle,
                  message: taskMessage,
                  recipientEmail:
                    mode === "one_to_one" && selectedLearner
                      ? selectedLearner.email
                      : "all",
                  recipientName:
                    mode === "one_to_one" && selectedLearner
                      ? selectedLearner.name
                      : "All Users",
                })
              }
              className="glass-btn-mail px-3.5 py-1.5 rounded-xl text-[11px] font-extrabold flex items-center gap-1.5 cursor-pointer"
            >
              <Icon name="mail" className="w-3.5 h-3.5" />
              <span>Send Mail</span>
            </button>
          </div>
        </form>
      </div>

      {/* Scheduled List for Selected Date */}
      <div className="space-y-2 pt-2 border-t border-[#EDE6D6]">
        <div className="flex items-center justify-between text-[11px] font-extrabold text-[#575045]">
          <span>Scheduled on {selectedDate}:</span>
          <span className="text-emerald-800">
            {selectedDateTasks.length} Item(s)
          </span>
        </div>

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
                onSendMailNow({
                  title: tk.title,
                  message: tk.message,
                  recipientEmail: tk.recipientEmail,
                  recipientName: tk.recipientName,
                })
              }
              className="glass-btn-mail px-3 py-1.5 rounded-xl text-[10px] font-extrabold flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              <Icon name="mail" className="w-3 h-3" />
              <span>Send Mail</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// 6. GMAIL SMTP DISPATCHER CONFIGURATION MODAL
// ============================================================================
function SmtpConfigModal({
  isOpen,
  onClose,
  currentStatus,
  onConfigSaved,
}) {
  const [senderEmail, setSenderEmail] = useState(
    currentStatus?.sender_email || "anujjadhv3551@gmail.com"
  );
  const [appPassword, setAppPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    if (currentStatus?.sender_email) {
      setSenderEmail(currentStatus.sender_email);
    }
  }, [currentStatus]);

  if (!isOpen) return null;

  const handleTestAndSave = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    const cleanEmail = senderEmail.trim();
    const cleanPass = appPassword.replace(/\s+/g, "").trim();

    if (!cleanEmail || !cleanEmail.includes("@")) {
      setErrorMsg("Please enter a valid Gmail address.");
      return;
    }
    if (!cleanPass) {
      setErrorMsg("Please enter your 16-character Google App Password.");
      return;
    }

    setSaving(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/notifications/configure-smtp`, {
        sender_email: cleanEmail,
        app_password: cleanPass,
      });

      setSuccessMsg(res.data?.message || "Connected to Gmail SMTP successfully!");
      if (onConfigSaved) {
        onConfigSaved({
          configured: true,
          sender_email: cleanEmail,
          has_password: true,
        });
      }
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err) {
      setErrorMsg(
        err.response?.data?.detail ||
          err.response?.data?.message ||
          err.message ||
          "Failed to verify credentials with Google."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
      <div className="bg-[#FFFDF9] rounded-3xl max-w-lg w-full p-6 sm:p-7 border border-[#DFD3BC] shadow-[0_24px_60px_-15px_rgba(0,0,0,0.35)] relative space-y-5 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-[#EBE3D0] pb-4">
          <div className="flex items-center gap-3">
            <GlowingSLogo size="md" />
            <div>
              <h3 className="text-lg font-black text-[#1C1917]">
                Gmail SMTP Setup
              </h3>
              <p className="text-xs text-[#787062]">
                Configure real email delivery for learning nudges
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#F3ECDD] hover:bg-[#E5DEC9] text-[#575045] flex items-center justify-center font-bold text-sm cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Informative Guidance Card */}
        <div className="bg-[#F8F4EA] rounded-2xl p-4 border border-[#E5DEC9] text-xs space-y-2 text-[#4A4337]">
          <p className="font-extrabold text-[#1C1917] flex items-center gap-1.5">
            <span>🔑</span>
            <span>How to get your 16-character Google App Password:</span>
          </p>
          <ol className="list-decimal list-inside space-y-1 pl-1 text-[11px] leading-relaxed">
            <li>
              Ensure 2-Step Verification is ON in your Google Account.
            </li>
            <li>
              Open{" "}
              <a
                href="https://myaccount.google.com/apppasswords"
                target="_blank"
                rel="noreferrer"
                className="text-sky-600 font-extrabold underline hover:text-sky-800"
              >
                myaccount.google.com/apppasswords ↗
              </a>
            </li>
            <li>Create an app name (e.g. <i>Saarthi Curious</i>) and click Generate.</li>
            <li>Copy and paste the 16 characters below.</li>
          </ol>
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-300 text-rose-800 text-xs font-semibold leading-relaxed">
            ⚠️ {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-extrabold flex items-center gap-2">
            <span>✓</span>
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleTestAndSave} className="space-y-4 text-xs">
          <div>
            <label className="font-extrabold text-[#1C1917] block mb-1.5">
              Sender Gmail Address
            </label>
            <input
              type="email"
              required
              value={senderEmail}
              onChange={(e) => setSenderEmail(e.target.value)}
              placeholder="e.g. anujjadhv3551@gmail.com"
              className="w-full rounded-xl bg-[#F9F5EB] border border-[#D8CEB8] px-3.5 py-2.5 font-bold text-[#1C1917] outline-none focus:border-sky-500 focus:bg-white"
            />
          </div>

          <div>
            <label className="font-extrabold text-[#1C1917] block mb-1.5">
              16-Character Google App Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={appPassword}
                onChange={(e) => setAppPassword(e.target.value)}
                placeholder="xxxx xxxx xxxx xxxx"
                className="w-full rounded-xl bg-[#F9F5EB] border border-[#D8CEB8] px-3.5 py-2.5 font-mono text-sm font-bold text-[#1C1917] outline-none focus:border-sky-500 focus:bg-white tracking-wider pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-extrabold text-[#787062] hover:text-[#1C1917] cursor-pointer"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
            <span className="text-[10px] text-[#787062] block mt-1">
              {currentStatus?.has_password
                ? `Currently configured with ${currentStatus.masked_password}`
                : "Not yet configured in backend."}
            </span>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#EBE3D0]">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2.5 rounded-xl border border-[#D8CEB8] text-[#575045] font-extrabold hover:bg-stone-100 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="glass-btn-blue px-6 py-2.5 rounded-xl font-extrabold text-white flex items-center gap-2 cursor-pointer disabled:opacity-60"
            >
              <span>{saving ? "Verifying with Google..." : "Test & Save Connection"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================================================
// 7. MAIN PAGE COMPONENT: NotificationScripts.jsx
// ============================================================================
export default function NotificationScripts() {
  const [activeTab, setActiveTab] = useState("universal");

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
              createdAt: "Sep 17, 2026, 08:00 AM",
              scheduledDate: "Sep 17, 2026 at",
              scheduledTime: "02:10 PM",
              active: true,
            },
            {
              id: "e_1",
              slot: "evening",
              title: "Greetings from Saarthi Curious",
              message: "Hello Users!",
              audience: "All Users",
              createdAt: "Aug 28, 2026, 10:49 PM",
              scheduledDate: "Aug 28, 2026 at",
              scheduledTime: "10:50 PM",
              active: true,
            },
            {
              id: "e_2",
              slot: "evening",
              title: "Complete the Course (Trial Notification)",
              message: "Complete 1 course video today",
              audience: "Head Office Staff",
              createdAt: "Sep 21, 2026, 09:38 AM",
              scheduledDate: "Sep 21, 2026 at",
              scheduledTime: "04:08 PM",
              active: true,
            },
            {
              id: "e_3",
              slot: "evening",
              title: "Complete the course",
              message: "Trial notification",
              audience: "All Users",
              createdAt: "Sep 21, 2026, 09:39 AM",
              scheduledDate: "Sep 21, 2026 at",
              scheduledTime: "04:10 PM",
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
      streak_days: 0,
    },
    {
      id: 4,
      name: "Parna Ghosh",
      email: "parna.ghosh@talentcorner.in",
      role: "Team Leader",
      program_name: "Client Relationships",
      curos: 0,
      completion_pct: 0,
      streak_days: 0,
    },
    {
      id: 5,
      name: "Anuj Jadhav",
      email: "2025ad16f@sigce.edu.in",
      role: "Franchise Developer",
      program_name: "Client Relationships",
      curos: 0,
      completion_pct: 0,
      streak_days: 0,
    },
    {
      id: 6,
      name: "Atharva Lohar",
      email: "atharvalohar33@gmail.com",
      role: "Curo Champion",
      program_name: "Client Relationships",
      curos: 365,
      completion_pct: 100,
      streak_days: 2,
    },
  ]);

  const [selectedLearnerIdx, setSelectedLearnerIdx] = useState(0);
  const [learnerSearch, setLearnerSearch] = useState("");
  const [mailsSentCount, setMailsSentCount] = useState(37);
  const [sendingMail, setSendingMail] = useState(false);

  // SMTP Configuration State
  const [smtpStatus, setSmtpStatus] = useState({
    configured: true,
    sender_email: "anujjadhv3558@gmail.com",
    has_password: true,
    masked_password: "dp••••••••my",
  });
  const [showSmtpModal, setShowSmtpModal] = useState(false);

  const [dispatchHistory, setDispatchHistory] = useState([
    {
      id: "d_1",
      recipient: "anujjadhv3551@gmail.com",
      subject: "Personal Learning Milestone & Curos Bonus",
      time: "Today, 01:15 PM",
      status: "Delivered to Gmail",
      success: true,
    },
    {
      id: "d_2",
      recipient: "All Users",
      subject: "Morning Kickstart: Client Relationships",
      time: "Today, 09:00 AM",
      status: "Delivered to Gmail",
      success: true,
    },
  ]);

  // Universal Composer State
  const [uniTitle, setUniTitle] = useState("");
  const [uniMessage, setUniMessage] = useState("");
  const [uniSlot, setUniSlot] = useState("morning");
  const [uniAudience, setUniAudience] = useState("All Users");
  const [uniTime, setUniTime] = useState("09:00 AM");

  // 1-to-1 Personal Composer State
  const [personalSubject, setPersonalSubject] = useState(
    "Personal Learning Milestone & Curos Bonus"
  );
  const [personalBody, setPersonalBody] = useState(
    "Hi Anuj, start your first module in 'Client Relationships' today to kick off your learning streak and earn +35 Curos!"
  );

  const [toast, setToast] = useState(null);
  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4500);
  };

  // Check SMTP connection status from backend
  useEffect(() => {
    const fetchSmtpStatus = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/notifications/smtp-status`);
        if (res.data) {
          setSmtpStatus(res.data);
        }
      } catch {
        // Fallback default
      }
    };
    fetchSmtpStatus();
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SCRIPTS, JSON.stringify(scripts));
    } catch {
      // Ignore
    }
  }, [scripts]);

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY_CALENDAR_TASKS,
        JSON.stringify(calendarTasks)
      );
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
              role: u.role || "Learner",
              program_name: u.program_name || "Client Relationships",
              curos: Number(u.curos ?? 0),
              completion_pct: Number(u.completion_pct ?? 0),
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
      setPersonalSubject(`Learning Update for ${u.name}`);
      setPersonalBody(
        u.completion_pct === 0
          ? `Hi ${firstName}, complete your first 3-minute checkpoint in "${u.program_name}" today to start your learning streak and earn +35 Curos!`
          : `Hi ${firstName}, great progress reaching ${u.completion_pct}% completion and ${u.curos} Curos in "${u.program_name}"! Complete your next checkpoint today.`
      );
    }
  };

  // ==========================================================================
  // REAL BACKEND EMAIL SENDER (CALLS FASTAPI SMTP ENDPOINT)
  // ==========================================================================
  const handleSendMail = async ({
    title,
    message,
    recipientEmail,
    recipientName,
  }) => {
    setSendingMail(true);
    const targetEmails =
      recipientEmail === "all" || !recipientEmail
        ? Array.from(
            new Set(
              learners
                .map((l) => l.email)
                .filter((e) => e && e.includes("@"))
            )
          )
        : [recipientEmail];

    if (!targetEmails.length) {
      setSendingMail(false);
      showToast("⚠️ No valid recipient email addresses found.");
      return;
    }

    const payload = {
      subject: title || "Saarthi Curious Learning Update",
      message: message || "Continue your learning journey today!",
      recipient_emails: targetEmails,
      recipient_name: recipientName || "Learner",
    };

    let delivered = false;
    let errorDetail = "";
    const mailEndpoints = [
      `${API_BASE_URL}/notifications/send-mail`,
      `${API_BASE_URL}/notifications/send-gmail`,
    ];

    for (const url of mailEndpoints) {
      try {
        const res = await axios.post(url, payload);
        if (res.status >= 200 && res.status < 300) {
          delivered = true;
          break;
        }
      } catch (err) {
        errorDetail =
          err.response?.data?.detail ||
          err.response?.data?.message ||
          err.message ||
          "Could not connect to SMTP server";
      }
    }

    if (delivered) {
      setMailsSentCount((c) => c + targetEmails.length);
      setDispatchHistory((prev) => [
        {
          id: `d_${Date.now()}`,
          recipient:
            recipientEmail === "all"
              ? `All Users (${targetEmails.length})`
              : recipientEmail,
          subject: payload.subject,
          time: "Just now",
          status: "Delivered to Gmail",
          success: true,
        },
        ...prev.slice(0, 4),
      ]);
      setSendingMail(false);
      showToast(
        `✉️ Email delivered successfully to ${recipientName || recipientEmail || "All Users"}!`
      );
    } else {
      setDispatchHistory((prev) => [
        {
          id: `d_${Date.now()}`,
          recipient:
            recipientEmail === "all"
              ? `All Users (${targetEmails.length})`
              : recipientEmail,
          subject: payload.subject,
          time: "Just now",
          status: `Failed: ${errorDetail}`,
          success: false,
        },
        ...prev.slice(0, 4),
      ]);
      setSendingMail(false);
      showToast(`❌ Mail failed: ${errorDetail}`);
    }
  };

  const handleSaveUniversalScript = (e, sendNow = false) => {
    if (e) e.preventDefault();
    if (!uniTitle.trim() || !uniMessage.trim()) return;

    const nowStr = new Date().toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    });

    const newScript = {
      id: `scr_${Date.now()}`,
      slot: uniSlot,
      title: uniTitle,
      message: uniMessage,
      audience: uniAudience,
      createdAt: `${nowStr}, ${uniTime}`,
      scheduledDate: `${nowStr} at`,
      scheduledTime: uniTime,
      active: true,
    };

    setScripts((prev) => [newScript, ...prev]);
    if (sendNow) {
      handleSendMail({
        title: uniTitle,
        message: uniMessage,
        recipientEmail: "all",
        recipientName: uniAudience,
      });
    } else {
      showToast(`✓ Saved "${uniTitle}"`);
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
    const avgCompletion = Math.round(
      learners.reduce((s, l) => s + l.completion_pct, 0) / Math.max(1, total)
    );
    return {
      total,
      highRiskCount,
      avgCompletion,
      topProgram: "Client Relationships",
    };
  }, [learners]);

  const filteredLearners = useMemo(() => {
    if (!learnerSearch.trim()) return learners;
    const q = learnerSearch.toLowerCase();
    return learners.filter(
      (l) =>
        l.name.toLowerCase().includes(q) ||
        l.email.toLowerCase().includes(q) ||
        l.role.toLowerCase().includes(q)
    );
  }, [learners, learnerSearch]);

  return (
    <MainLayout>
      <div className="-m-4 sm:-m-6 p-5 sm:p-7 min-h-screen bg-[#F8F4EA] text-[#1C1917] font-sans space-y-6 overflow-x-hidden">
        {/* Glassy Button Styles with Hover Lift */}
        <style>{`
          .glass-btn-mail {
            background: linear-gradient(135deg, rgba(16, 185, 129, 0.85), rgba(13, 148, 136, 0.88));
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            border: 1px solid rgba(255, 255, 255, 0.45);
            color: #ffffff;
            box-shadow: 0 4px 14px rgba(16, 185, 129, 0.22), inset 0 1px 0 rgba(255, 255, 255, 0.35);
            transition: all 0.22s ease;
          }
          .glass-btn-mail:hover {
            background: linear-gradient(135deg, rgba(5, 150, 105, 0.95), rgba(15, 118, 110, 0.96));
            box-shadow: 0 8px 22px rgba(16, 185, 129, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.5);
            transform: translateY(-1.5px);
          }
          .glass-btn-blue,
          .glass-btn-warm {
            background: linear-gradient(135deg, rgba(56, 189, 248, 0.9), rgba(14, 165, 233, 0.92));
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            border: 1px solid rgba(255, 255, 255, 0.55);
            color: #ffffff;
            box-shadow: 0 4px 14px rgba(14, 165, 233, 0.28), inset 0 1px 0 rgba(255, 255, 255, 0.45);
            transition: all 0.22s ease;
          }
          .glass-btn-blue:hover,
          .glass-btn-warm:hover {
            background: linear-gradient(135deg, rgba(14, 165, 233, 0.98), rgba(2, 132, 199, 1));
            box-shadow: 0 8px 22px rgba(14, 165, 233, 0.42), inset 0 1px 0 rgba(255, 255, 255, 0.65);
            transform: translateY(-1.5px);
          }
          .glass-btn-light {
            background: rgba(255, 255, 255, 0.72);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            border: 1px solid #DFD3BC;
            color: #1C1917;
            box-shadow: 0 2px 8px rgba(68, 52, 28, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.8);
            transition: all 0.22s ease;
          }
          .glass-btn-light:hover {
            background: rgba(255, 255, 255, 0.95);
            border-color: #C8B99E;
            box-shadow: 0 6px 16px rgba(68, 52, 28, 0.1);
            transform: translateY(-1.5px);
          }
        `}</style>

        {toast && (
          <div
            className={`fixed bottom-6 right-6 z-50 bg-white/95 backdrop-blur-xl px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 text-xs font-extrabold border transition-all ${
              toast.includes("❌")
                ? "border-rose-400 text-rose-950 shadow-rose-500/25"
                : toast.includes("⚠️")
                ? "border-amber-400 text-amber-950 shadow-amber-500/25"
                : "border-emerald-400/80 text-emerald-950 shadow-emerald-500/25"
            }`}
          >
            <GlowingSLogo size="sm" />
            <span className="max-w-md">{toast}</span>
          </div>
        )}

        {/* GMAIL SMTP SETUP MODAL */}
        <SmtpConfigModal
          isOpen={showSmtpModal}
          onClose={() => setShowSmtpModal(false)}
          currentStatus={smtpStatus}
          onConfigSaved={(newStatus) => {
            setSmtpStatus(newStatus);
            showToast("✓ Gmail SMTP connected successfully!");
          }}
        />

        {/* 1. LIVE COLOR-SHIFTING HERO BANNER */}
        <LiveHeroBanner
          morningCount={morningScripts.length}
          eveningCount={eveningScripts.length}
          totalScripts={scripts.length}
          mailsSentCount={mailsSentCount}
        />

        {/* 2. TWO SIMPLE TABS & SMTP DISPATCH STATUS */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="bg-white/65 backdrop-blur-md p-1.5 rounded-2xl border border-[#DFD5BE] inline-flex items-center gap-2 shadow-2xs">
            <button
              type="button"
              onClick={() => setActiveTab("universal")}
              className={`px-5 py-2.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === "universal"
                  ? "glass-btn-blue"
                  : "text-[#575045] hover:bg-white/80"
              }`}
            >
              <Icon name="globe" className="w-4 h-4" />
              <span>Universal Nudge (All Users)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("one_to_one")}
              className={`px-5 py-2.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === "one_to_one"
                  ? "glass-btn-blue"
                  : "text-[#575045] hover:bg-white/80"
              }`}
            >
              <Icon name="user" className="w-4 h-4" />
              <span>1-to-1 Personal Nudge</span>
            </button>
          </div>

          {/* GMAIL SMTP STATUS & CREDENTIALS TRIGGER */}
          <button
            type="button"
            onClick={() => setShowSmtpModal(true)}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2.5 border transition-all cursor-pointer backdrop-blur-md shadow-2xs ${
              smtpStatus.configured
                ? "bg-emerald-500/15 border-emerald-500/35 text-emerald-900 hover:bg-emerald-500/25"
                : "bg-amber-500/20 border-amber-500/40 text-amber-950 hover:bg-amber-500/30 animate-pulse"
            }`}
          >
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                smtpStatus.configured ? "bg-emerald-500" : "bg-amber-500"
              }`}
            />
            <span>
              {smtpStatus.configured
                ? `Gmail SMTP Active (${smtpStatus.sender_email})`
                : "⚠️ Configure Gmail SMTP (Required for Real Mails)"}
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-lg bg-white/70 font-black text-[#1C1917]">
              {smtpStatus.configured ? "Settings" : "Setup"}
            </span>
          </button>
        </div>

        {/* 3. EQUAL-HEIGHT 12-COLUMN WORKSPACE */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* LEFT 7 COLUMNS */}
          <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
            {activeTab === "universal" ? (
              <>
                {/* UNIVERSAL COMPOSER */}
                <section className="bg-[#FFFDF9] rounded-3xl p-6 border border-[#E5DEC9] shadow-[0_10px_28px_-12px_rgba(68,52,28,0.07)] space-y-4">
                  <div className="border-b border-[#EDE6D6] pb-3">
                    <h2 className="text-base font-black text-[#1C1917]">
                      Universal Nudge Composer
                    </h2>
                    <p className="text-xs text-[#787062]">
                      Create a Morning or Evening script or send mail to all users
                    </p>
                  </div>

                  <form
                    onSubmit={(e) => handleSaveUniversalScript(e, false)}
                    className="space-y-4 text-xs"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="font-bold text-[#1C1917] block mb-1">
                          Slot
                        </label>
                        <select
                          value={uniSlot}
                          onChange={(e) => {
                            setUniSlot(e.target.value);
                            setUniTime(
                              e.target.value === "morning"
                                ? "09:00 AM"
                                : "06:30 PM"
                            );
                          }}
                          className="w-full rounded-xl bg-[#F9F5EB] border border-[#D8CEB8] px-3 py-2 font-bold text-[#1C1917]"
                        >
                          <option value="morning">☀️ Morning</option>
                          <option value="evening">🌙 Evening</option>
                        </select>
                      </div>

                      <div>
                        <label className="font-bold text-[#1C1917] block mb-1">
                          Audience
                        </label>
                        <select
                          value={uniAudience}
                          onChange={(e) => setUniAudience(e.target.value)}
                          className="w-full rounded-xl bg-[#F9F5EB] border border-[#D8CEB8] px-3 py-2 font-bold text-[#1C1917]"
                        >
                          <option value="All Users">All Users</option>
                          <option value="Head Office Staff">
                            Head Office Staff
                          </option>
                        </select>
                      </div>

                      <div>
                        <label className="font-bold text-[#1C1917] block mb-1">
                          Time
                        </label>
                        <input
                          type="text"
                          value={uniTime}
                          onChange={(e) => setUniTime(e.target.value)}
                          className="w-full rounded-xl bg-[#F9F5EB] border border-[#D8CEB8] px-3 py-2 font-bold text-[#1C1917]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="font-bold text-[#1C1917] block mb-1">
                        Subject / Title
                      </label>
                      <input
                        type="text"
                        required
                        value={uniTitle}
                        onChange={(e) => setUniTitle(e.target.value)}
                        placeholder="Enter subject..."
                        className="w-full rounded-xl bg-[#F9F5EB] border border-[#D8CEB8] px-3.5 py-2.5 font-bold text-[#1C1917] outline-none"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-[#1C1917] block mb-1">
                        Message
                      </label>
                      <textarea
                        rows={3}
                        required
                        value={uniMessage}
                        onChange={(e) => setUniMessage(e.target.value)}
                        placeholder="Write message..."
                        className="w-full rounded-xl bg-[#F9F5EB] border border-[#D8CEB8] p-3 font-medium text-[#1C1917] outline-none resize-none"
                      />
                    </div>

                    <div className="flex items-center justify-end gap-2.5 pt-1">
                      <button
                        type="submit"
                        className="glass-btn-light px-4 py-2.5 rounded-xl font-bold cursor-pointer"
                      >
                        Save Script
                      </button>

                      <button
                        type="button"
                        disabled={sendingMail}
                        onClick={(e) => handleSaveUniversalScript(e, true)}
                        className="glass-btn-mail px-5 py-2.5 rounded-xl font-extrabold flex items-center gap-2 cursor-pointer"
                      >
                        <Icon name="mail" className="w-4 h-4" />
                        <span>{sendingMail ? "Sending..." : "Send Mail"}</span>
                      </button>
                    </div>
                  </form>
                </section>

                {/* MORNING & EVENING SCRIPTS SECTIONS */}
                {[
                  {
                    slotKey: "morning",
                    title: "Morning Scripts",
                    icon: "sun",
                    badgeCls: "bg-amber-100 text-amber-800",
                    list: morningScripts,
                  },
                  {
                    slotKey: "evening",
                    title: "Evening Scripts",
                    icon: "moon",
                    badgeCls: "bg-rose-100 text-rose-800",
                    list: eveningScripts,
                  },
                ].map((group) => (
                  <section
                    key={group.slotKey}
                    className="bg-[#FFFDF9] rounded-3xl p-6 border border-[#E5DEC9] shadow-[0_10px_28px_-12px_rgba(68,52,28,0.07)] space-y-4"
                  >
                    <div className="flex items-center justify-between border-b border-[#EDE6D6] pb-3">
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`w-8 h-8 rounded-xl ${group.badgeCls} flex items-center justify-center`}
                        >
                          <Icon name={group.icon} className="w-4 h-4" />
                        </span>
                        <h3 className="text-sm font-black text-[#1C1917]">
                          {group.title}
                        </h3>
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-black ${group.badgeCls}`}
                        >
                          {group.list.length}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {group.list.map((scr) => (
                        <div
                          key={scr.id}
                          className="rounded-2xl p-4 bg-[#F9F5EB] border border-[#E5DEC9] flex flex-col justify-between space-y-3"
                        >
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${group.badgeCls}`}
                              >
                                {scr.slot === "morning"
                                  ? "☀️ Morning"
                                  : "🌙 Evening"}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                                  scr.active
                                    ? "bg-emerald-100 text-emerald-800"
                                    : "bg-stone-200 text-stone-600"
                                }`}
                              >
                                {scr.active ? "Active" : "Paused"}
                              </span>
                            </div>
                            <h4 className="text-sm font-black text-[#1C1917]">
                              {scr.title}
                            </h4>
                            <p className="text-xs text-[#575045] leading-relaxed">
                              {scr.message}
                            </p>
                          </div>

                          <div className="space-y-2.5 pt-2 border-t border-[#E5DEC9]">
                            <div className="flex items-center justify-between text-[11px] font-bold text-[#6B6356]">
                              <span>👥 {scr.audience}</span>
                              <span>🕒 {scr.scheduledTime}</span>
                            </div>

                            <div className="flex items-center justify-between">
                              <button
                                type="button"
                                onClick={() =>
                                  handleSendMail({
                                    title: scr.title,
                                    message: scr.message,
                                    recipientEmail: "all",
                                    recipientName: scr.audience,
                                  })
                                }
                                className="glass-btn-mail px-3.5 py-1.5 rounded-xl text-[11px] font-extrabold flex items-center gap-1.5 cursor-pointer"
                              >
                                <Icon name="mail" className="w-3.5 h-3.5" />
                                <span>Send Mail</span>
                              </button>

                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setScripts((prev) =>
                                      prev.map((x) =>
                                        x.id === scr.id
                                          ? { ...x, active: !x.active }
                                          : x
                                      )
                                    )
                                  }
                                  className={`w-9 h-5 rounded-full p-0.5 transition-colors cursor-pointer ${
                                    scr.active
                                      ? "bg-emerald-600"
                                      : "bg-stone-300"
                                  }`}
                                >
                                  <div
                                    className={`w-4 h-4 rounded-full bg-white transform transition-transform ${
                                      scr.active
                                        ? "translate-x-4"
                                        : "translate-x-0"
                                    }`}
                                  />
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    setScripts((prev) =>
                                      prev.filter((x) => x.id !== scr.id)
                                    )
                                  }
                                  className="glass-btn-light w-8 h-8 rounded-xl text-rose-700 flex items-center justify-center cursor-pointer"
                                >
                                  <Icon name="trash" className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                ))}

                {/* RECENT SENT MAILS LOG (UNIVERSAL) */}
                <section className="bg-[#FFFDF9] rounded-3xl p-5 border border-[#E5DEC9] shadow-[0_10px_28px_-12px_rgba(68,52,28,0.07)] space-y-3">
                  <div className="flex items-center justify-between border-b border-[#EDE6D6] pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
                        <Icon name="check" className="w-4 h-4" />
                      </span>
                      <h3 className="text-sm font-black text-[#1C1917]">
                        Recent Sent Mails
                      </h3>
                    </div>
                    <span className="text-[11px] font-extrabold text-emerald-800">
                      {mailsSentCount} Sent
                    </span>
                  </div>

                  <div className="space-y-2">
                    {dispatchHistory.map((item) => (
                      <div
                        key={item.id}
                        className="p-3 rounded-2xl bg-[#F9F5EB] border border-[#E5DEC9] flex items-center justify-between gap-2 text-xs"
                      >
                        <div className="min-w-0">
                          <span className="font-black text-[#1C1917] truncate block">
                            {item.subject}
                          </span>
                          <span className="text-[10px] text-[#6B6356]">
                            To: {item.recipient} • {item.time}
                          </span>
                        </div>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold shrink-0 flex items-center gap-1 ${
                            item.success !== false
                              ? "bg-emerald-100 text-emerald-800 border border-emerald-300/60"
                              : "bg-rose-100 text-rose-800 border border-rose-300/60"
                          }`}
                        >
                          <span>{item.success !== false ? "✓" : "⚠️"}</span>
                          <span>{item.status}</span>
                        </span>
                      </div>
                    ))}
                  </div>
                </section>
              </>
            ) : (
              /* TAB 2: 1-TO-1 PERSONAL NUDGE */
              <>
                <section className="bg-[#FFFDF9] rounded-3xl p-6 border border-[#E5DEC9] shadow-[0_10px_28px_-12px_rgba(68,52,28,0.07)] space-y-5">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#EDE6D6] pb-4">
                    <div>
                      <h2 className="text-base font-black text-[#1C1917]">
                        1-to-1 Personal Nudge
                      </h2>
                      <p className="text-xs text-[#787062]">
                        Select a user below to send a personal mail directly to their inbox
                      </p>
                    </div>

                    <input
                      type="text"
                      value={learnerSearch}
                      onChange={(e) => setLearnerSearch(e.target.value)}
                      placeholder="Search user..."
                      className="rounded-xl bg-[#F9F5EB] border border-[#D8CEB8] px-3.5 py-1.5 text-xs font-bold text-[#1C1917] outline-none"
                    />
                  </div>

                  {/* Learners Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[240px] overflow-y-auto pr-1">
                    {filteredLearners.map((u) => {
                      const actualIdx = learners.findIndex(
                        (x) => x.name === u.name && x.email === u.email
                      );
                      const isSelected =
                        selectedLearner?.name === u.name &&
                        selectedLearner?.email === u.email;

                      return (
                        <div
                          key={`${u.id}_${u.email}`}
                          onClick={() => handleSelectLearner(actualIdx)}
                          className={`cursor-pointer rounded-2xl p-3.5 border transition-all flex items-center justify-between gap-3 ${
                            isSelected
                              ? "bg-sky-500/15 border-sky-500 shadow-xs"
                              : "bg-[#F9F5EB] border-[#E5DEC9] hover:bg-white"
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-xl bg-sky-500 text-white font-black text-xs flex items-center justify-center shrink-0">
                              {u.name.slice(0, 2).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-xs font-black text-[#1C1917] truncate">
                                {u.name}
                              </h4>
                              <span className="text-[10px] text-[#787062] block truncate">
                                {u.email}
                              </span>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="text-xs font-black text-sky-800 block">
                              🪙 {u.curos}
                            </span>
                            <span className="text-[10px] font-bold text-[#6B6356]">
                              {u.completion_pct}%
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Personal Mail Composer */}
                  {selectedLearner && (
                    <div className="rounded-2xl p-5 bg-[#F6F1E6] border border-[#DFD5BE] space-y-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <span className="text-[10px] font-bold uppercase text-[#6B6356] block">
                            Recipient
                          </span>
                          <h3 className="text-sm font-black text-[#1C1917]">
                            {selectedLearner.name} ({selectedLearner.email})
                          </h3>
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-[#1C1917] block mb-1">
                          Subject
                        </label>
                        <input
                          type="text"
                          value={personalSubject}
                          onChange={(e) => setPersonalSubject(e.target.value)}
                          className="w-full rounded-xl bg-white border border-[#D8CEB8] px-3.5 py-2 text-xs font-bold text-[#1C1917] outline-none"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-[#1C1917] block mb-1">
                          Message
                        </label>
                        <textarea
                          rows={4}
                          value={personalBody}
                          onChange={(e) => setPersonalBody(e.target.value)}
                          className="w-full rounded-xl bg-white border border-[#D8CEB8] p-3 text-xs font-medium text-[#1C1917] outline-none resize-none"
                        />
                      </div>

                      <div className="flex items-center justify-end">
                        <button
                          type="button"
                          disabled={sendingMail}
                          onClick={() =>
                            handleSendMail({
                              title: personalSubject,
                              message: personalBody,
                              recipientEmail: selectedLearner.email,
                              recipientName: selectedLearner.name,
                            })
                          }
                          className="glass-btn-mail px-5 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2 cursor-pointer"
                        >
                          <Icon name="mail" className="w-4 h-4" />
                          <span>{sendingMail ? "Sending..." : "Send Mail"}</span>
                        </button>
                      </div>
                    </div>
                  )}
                </section>

                {/* RECENT SENT MAILS LOG */}
                <section className="flex-1 bg-[#FFFDF9] rounded-3xl p-5 border border-[#E5DEC9] shadow-[0_10px_28px_-12px_rgba(68,52,28,0.07)] flex flex-col justify-between space-y-3">
                  <div className="flex items-center justify-between border-b border-[#EDE6D6] pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
                        <Icon name="check" className="w-4 h-4" />
                      </span>
                      <h3 className="text-sm font-black text-[#1C1917]">
                        Recent Sent Mails
                      </h3>
                    </div>
                    <span className="text-[11px] font-extrabold text-emerald-800">
                      {mailsSentCount} Sent
                    </span>
                  </div>

                  <div className="space-y-2 my-auto">
                    {dispatchHistory.map((item) => (
                      <div
                        key={item.id}
                        className="p-3 rounded-2xl bg-[#F9F5EB] border border-[#E5DEC9] flex items-center justify-between gap-2 text-xs"
                      >
                        <div className="min-w-0">
                          <span className="font-black text-[#1C1917] truncate block">
                            {item.subject}
                          </span>
                          <span className="text-[10px] text-[#6B6356]">
                            To: {item.recipient} • {item.time}
                          </span>
                        </div>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold shrink-0 flex items-center gap-1 ${
                            item.success !== false
                              ? "bg-emerald-100 text-emerald-800 border border-emerald-300/60"
                              : "bg-rose-100 text-rose-800 border border-rose-300/60"
                          }`}
                        >
                          <span>{item.success !== false ? "✓" : "⚠️"}</span>
                          <span>{item.status}</span>
                        </span>
                      </div>
                    ))}
                  </div>
                </section>
              </>
            )}
          </div>

          {/* RIGHT 5 COLUMNS: MINIMALIST "AI ASSISTANCE" + MINI CALENDAR */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-6">
            <SimpleAiAssistancePanel
              mode={activeTab}
              selectedLearner={selectedLearner}
              telemetrySummary={telemetrySummary}
              onUseSuggestion={(sug) => {
                if (activeTab === "universal") {
                  setUniTitle(sug.title);
                  setUniMessage(sug.message);
                  setUniSlot(sug.slot || "morning");
                  showToast("✦ Loaded into Universal Composer");
                } else {
                  setPersonalSubject(sug.title);
                  setPersonalBody(sug.message);
                  showToast(`✦ Loaded for ${selectedLearner?.name}`);
                }
              }}
              onSendMailSuggestion={(sug) =>
                handleSendMail({
                  title: sug.title,
                  message: sug.message,
                  recipientEmail:
                    activeTab === "one_to_one" && selectedLearner
                      ? selectedLearner.email
                      : "all",
                  recipientName:
                    activeTab === "one_to_one" && selectedLearner
                      ? selectedLearner.name
                      : "All Users",
                })
              }
            />

            <MiniCalendarScheduler
              mode={activeTab}
              selectedLearner={selectedLearner}
              calendarTasks={calendarTasks}
              onSaveCalendarTask={(newTask) => {
                setCalendarTasks((prev) => [newTask, ...prev]);
                showToast(`📅 Saved for ${newTask.date}`);
              }}
              onSendMailNow={handleSendMail}
            />
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

