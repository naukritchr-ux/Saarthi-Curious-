// MasterAdminDashboard.jsx — Neon dark-mode admin dashboard
import { useState, useEffect, useMemo } from "react";
import MainLayout from "../../layout/mainLayout";
import NeonStatCard from "../../components/ui/NeonStatCard";
import EngagementChart from "../../components/charts/engagementChart";
import UserDistribution3D from "../../components/charts/UserDistribution3D";
import AiChatCard from "../../components/ai/AiChatCard";
import AdminQuickAccess from "./adminQuickAccess";
import LeaderboardCard from "../../components/admin/LeaderboardCard";
import TodayMeetingsWidget from "../../components/admin/TodayMeetingsWidget";
import { fetchAdminDashboard, DEFAULT_ADMIN_SNAPSHOT } from "../../services/dashboardService";
import { leaderboardService } from "../../services/leaderboardService";
import AuditLogsModal from "./auditLogsModal";
import {
  UsersEmblem,
  LearnerEmblem,
  ProgramEmblem,
  CuroEmblem,
} from "../../components/ui/KpiIcons";
import "../../styles/adminNeon.css";

import {
  Users,
  ShieldCheck,
  Coins,
  Loader2,
  CalendarDays,
  Clock3,
  BookOpen,
  Activity,
  Flame,
  Eye,
  BarChart3,
  Sparkles,
} from "lucide-react";

export function CompletionFunnel({ data }) {
  const total = data?.total ?? 0;
  const notStarted = data?.not_started ?? 0;
  const inProgress = data?.in_progress ?? 0;
  const completed = data?.completed ?? 0;

  const levels = [
    { label: "Enrolled", value: total, widthPct: 100, color: "#8b5cf6", glow: "#a855f7" },
    { label: "Started", value: total - notStarted, widthPct: 82, color: "#3b82f6", glow: "#60a5fa" },
    { label: "In Progress", value: inProgress, widthPct: 62, color: "#14b8a6", glow: "#2dd4bf" },
    { label: "Completed", value: completed, widthPct: 38, color: "#f59e0b", glow: "#fbbf24" },
  ];

  const denom = levels[0].value || 1;
  const conversion = Math.round((levels[3].value / denom) * 100);

  return (
    <div
      className="h-full flex flex-col"
      style={{
        background: "rgba(15,15,24,0.72)",
        border: "1px solid rgba(139,92,246,0.14)",
        borderRadius: 22,
        padding: 24,
        boxShadow: "0 20px 40px -18px rgba(0,0,0,0.7)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              background: "linear-gradient(135deg, rgba(168,85,247,0.35), rgba(139,92,246,0.15))",
              border: "1px solid rgba(168,85,247,0.4)",
              display: "grid",
              placeItems: "center",
              boxShadow: "0 0 12px rgba(168,85,247,0.4)",
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#c084fc" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
            </svg>
          </div>
          <div>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: "#fff", lineHeight: 1.2 }}>
              Learning Progress Funnel
            </h3>
            <p style={{ fontSize: 10, color: "rgba(200,200,230,0.55)", marginTop: 2 }}>
              Enrollment → completion
            </p>
          </div>
        </div>
        <span
          style={{
            fontSize: 10,
            color: "rgba(200,200,230,0.75)",
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: 999,
            padding: "4px 10px",
          }}
        >
          Conversion
        </span>
      </div>

      {/* Main visual + data content side-by-side as in reference image */}
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          padding: "6px 0",
        }}
      >
        {/* Left: 3D Glossy Tapered Funnel */}
        <div style={{ width: 115, height: 145, flexShrink: 0, position: "relative", display: "grid", placeItems: "center" }}>
          <svg width="115" height="145" viewBox="0 0 115 145" style={{ filter: "drop-shadow(0 0 16px rgba(168,85,247,0.45))", overflow: "visible" }}>
            <defs>
              <radialGradient id="funnelHole" cx="50%" cy="40%" r="55%">
                <stop offset="0%" stopColor="#1e0f3d" />
                <stop offset="75%" stopColor="#0a0518" />
                <stop offset="100%" stopColor="#2e1065" />
              </radialGradient>
              <linearGradient id="funnelTier1" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#c084fc" />
                <stop offset="40%" stopColor="#9333ea" />
                <stop offset="100%" stopColor="#7e22ce" />
              </linearGradient>
              <linearGradient id="funnelTier2" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#60a5fa" />
                <stop offset="40%" stopColor="#2563eb" />
                <stop offset="100%" stopColor="#1d4ed8" />
              </linearGradient>
              <linearGradient id="funnelTier3" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#5eead4" />
                <stop offset="40%" stopColor="#0d9488" />
                <stop offset="100%" stopColor="#0f766e" />
              </linearGradient>
              <linearGradient id="funnelTier4" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#fde047" />
                <stop offset="40%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#b45309" />
              </linearGradient>
            </defs>

            {/* Ambient ground glow */}
            <ellipse cx="57" cy="138" rx="28" ry="7" fill="rgba(245,158,11,0.3)" filter="blur(6px)" />

            {/* Tier 1 (Purple - Top) */}
            <path d="M 6 22 C 6 22, 18 54, 22 56 C 42 60, 72 60, 92 56 C 96 54, 108 22, 108 22 Z" fill="url(#funnelTier1)" />
            <ellipse cx="57" cy="22" rx="51" ry="16" fill="url(#funnelTier1)" />
            <ellipse cx="57" cy="22" rx="45" ry="12" fill="url(#funnelHole)" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
            <path d="M 14 21 C 24 11, 90 11, 100 21" fill="none" stroke="rgba(255,255,255,0.65)" strokeWidth="1.8" strokeLinecap="round" />

            {/* Tier 2 (Blue) */}
            <path d="M 21 54 C 21 54, 30 81, 33 83 C 48 87, 66 87, 81 83 C 84 81, 93 54, 93 54 C 77 58, 37 58, 21 54 Z" fill="url(#funnelTier2)" />
            <path d="M 21 54 C 38 59, 76 59, 93 54" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="1.4" />

            {/* Tier 3 (Teal) */}
            <path d="M 32 81 C 32 81, 40 105, 43 107 C 52 110, 62 110, 71 107 C 74 105, 82 81, 82 81 C 71 84, 43 84, 32 81 Z" fill="url(#funnelTier3)" />
            <path d="M 32 81 C 44 85, 70 85, 82 81" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="1.4" />

            {/* Tier 4 (Gold/Amber Nozzle) */}
            <path d="M 42 105 C 42 105, 45 124, 47 127 C 51 133, 63 133, 67 127 C 69 124, 72 105, 72 105 C 65 107, 49 107, 42 105 Z" fill="url(#funnelTier4)" />
            <path d="M 42 105 C 49 108, 65 108, 72 105" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="1.4" />
            <ellipse cx="57" cy="127" rx="8" ry="3.5" fill="#fde047" opacity="0.95" />
          </svg>
        </div>

        {/* Right: 4 Data Rows with dot, label, value, capsule bar, percentage */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: 14 }}>
          {levels.map((level) => {
            const pct = Math.max(0, Math.min(100, Math.round((level.value / denom) * 100)));
            return (
              <div
                key={level.label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                {/* Colored glowing dot */}
                <span
                  style={{
                    width: 9,
                    height: 9,
                    borderRadius: "50%",
                    background: level.color,
                    boxShadow: `0 0 8px ${level.glow}`,
                    flexShrink: 0,
                  }}
                />

                {/* Label */}
                <span
                  style={{
                    width: 72,
                    fontSize: 11,
                    color: "rgba(200,200,230,0.85)",
                    fontWeight: 500,
                    flexShrink: 0,
                  }}
                >
                  {level.label}
                </span>

                {/* Value number */}
                <span
                  style={{
                    width: 26,
                    textAlign: "right",
                    fontSize: 14,
                    fontWeight: 800,
                    color: "#fff",
                    tabularNums: true,
                    flexShrink: 0,
                  }}
                >
                  {level.value}
                </span>

                {/* Horizontal capsule progress bar */}
                <div
                  style={{
                    flex: 1,
                    height: 18,
                    borderRadius: 999,
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.05)",
                    overflow: "hidden",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <div
                    style={{
                      width: `${Math.max(pct, 6)}%`,
                      height: "100%",
                      borderRadius: 999,
                      background: `linear-gradient(180deg, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0) 50%), ${level.color}`,
                      boxShadow: `
                        inset 0 2px 2px rgba(255,255,255,0.4),
                        inset 0 -2px 3px rgba(0,0,0,0.35),
                        0 0 12px ${level.glow}88
                      `,
                      transition: "width 600ms cubic-bezier(.22,1,.36,1)",
                    }}
                  />
                </div>

                {/* Percentage */}
                <span
                  style={{
                    width: 36,
                    textAlign: "right",
                    fontSize: 11,
                    fontWeight: 600,
                    color: "rgba(200,200,230,0.75)",
                    tabularNums: true,
                    flexShrink: 0,
                  }}
                >
                  {pct}%
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: 14,
          paddingTop: 12,
          borderTop: "1px solid rgba(139,92,246,0.12)",
          fontSize: 11,
        }}
      >
        <span style={{ color: "rgba(200,200,230,0.6)" }}>Enrollment → graduation pipeline</span>
        <span style={{ color: "#fff", fontWeight: 700 }}>{conversion}% converted</span>
      </div>
    </div>
  );
}



export function PulseGauge({ data }) {
  const active = data?.active_today ?? 0;
  const avgStreak = data?.average_streak ?? 0;
  const learnDays = data?.total_learning_days ?? 0;
  const totalLearners = 12;
  const pct = Math.min((active / totalLearners) * 100, 100);

  const radius = 70;
  const circumference = Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;

  const tiles = [
    { icon: "💧", value: avgStreak, label: "Avg streak", color: "#14b8a6" },
    { icon: "👥", value: active, label: "Online now", color: "#3b82f6" },
    { icon: "📅", value: learnDays, label: "Learn days", color: "#8b5cf6" },
  ];

  return (
    <div
      className="h-full flex flex-col"
      style={{
        background: "rgba(15,15,24,0.72)",
        border: "1px solid rgba(139,92,246,0.14)",
        borderRadius: 22,
        padding: 24,
        boxShadow: "0 20px 40px -18px rgba(0,0,0,0.7)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 12,
            background: "linear-gradient(140deg, #14b8a6, #0f766e)",
            display: "grid",
            placeItems: "center",
            boxShadow:
              "0 6px 14px rgba(20,184,166,0.45), inset 0 -2px 4px rgba(0,0,0,0.4), inset 0 2px 4px rgba(255,255,255,0.25)",
          }}
        >
          <span style={{ fontSize: 16 }}>⚡</span>
        </div>
        <div>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>
            Today's Pulse
          </h3>
          <p style={{ fontSize: 10, color: "rgba(200,200,230,0.55)", marginTop: 2 }}>
            Active learners right now
          </p>
        </div>
      </div>

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* 3D Arc gauge */}
        <div style={{ position: "relative", width: 210, height: 120 }}>
          <svg width="210" height="120" viewBox="0 0 210 120">
            <defs>
              <linearGradient id="pulse-arc-grad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#14b8a6" />
                <stop offset="50%" stopColor="#38bdf8" />
                <stop offset="100%" stopColor="#a855f7" />
              </linearGradient>
              <linearGradient id="pulse-arc-shine" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgba(255,255,255,0.55)" />
                <stop offset="100%" stopColor="rgba(255,255,255,0)" />
              </linearGradient>
            </defs>

            {/* Layer 1 — dark inset track (looks pressed in) */}
            <path
              d={`M 25 105 A ${radius} ${radius} 0 0 1 185 105`}
              fill="none"
              stroke="#050510"
              strokeWidth="22"
              strokeLinecap="round"
            />

            {/* Layer 2 — inner shading of track */}
            <path
              d={`M 25 105 A ${radius} ${radius} 0 0 1 185 105`}
              fill="none"
              stroke="#1a1a2a"
              strokeWidth="18"
              strokeLinecap="round"
            />

            {/* Layer 3 — colored progress (main) */}
            <path
              d={`M 25 105 A ${radius} ${radius} 0 0 1 185 105`}
              fill="none"
              stroke="url(#pulse-arc-grad)"
              strokeWidth="18"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              style={{
                transition: "stroke-dashoffset 900ms ease",
                filter: "drop-shadow(0 0 8px rgba(20,184,166,0.6))",
              }}
            />

            {/* Layer 4 — specular shine on top half (makes it 3D) */}
            <path
              d={`M 25 105 A ${radius} ${radius} 0 0 1 185 105`}
              fill="none"
              stroke="url(#pulse-arc-shine)"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              style={{ transition: "stroke-dashoffset 900ms ease" }}
            />

            {/* Layer 5 — bottom shadow edge */}
            <path
              d={`M 25 105 A ${radius} ${radius} 0 0 1 185 105`}
              fill="none"
              stroke="rgba(0,0,0,0.5)"
              strokeWidth="3"
              strokeLinecap="round"
              transform="translate(0, 3)"
              style={{ opacity: 0.4 }}
            />
          </svg>

          {/* Center number */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "flex-end",
              paddingBottom: 6,
            }}
          >
            <p
              style={{
                fontSize: 38,
                fontWeight: 900,
                color: "#fff",
                lineHeight: 1,
                textShadow:
                  "0 2px 6px rgba(0,0,0,0.8), 0 0 20px rgba(34,211,238,0.35)",
              }}
            >
              {active}
            </p>
            <p
              style={{
                fontSize: 10,
                color: "rgba(200,200,230,0.55)",
                marginTop: 3,
              }}
            >
              of {totalLearners} active
            </p>
          </div>
        </div>

        {/* Percentage below */}
        <p
          style={{
            fontSize: 30,
            fontWeight: 900,
            color: "#fff",
            marginTop: 6,
            textShadow: "0 2px 8px rgba(0,0,0,0.7)",
          }}
        >
          {Math.round(pct)}%
        </p>
      </div>

      {/* Three 3D tile stats */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: 10,
          marginTop: 14,
        }}
      >
        {tiles.map((tile) => (
          <div
            key={tile.label}
            style={{
              background: `linear-gradient(140deg, ${tile.color}22, ${tile.color}08)`,
              borderRadius: 16,
              padding: "12px 6px",
              textAlign: "center",
              border: `1px solid ${tile.color}33`,
              boxShadow: `
                inset 0 2px 4px rgba(255,255,255,0.08),
                inset 0 -3px 6px rgba(0,0,0,0.45),
                0 4px 10px ${tile.color}22
              `,
            }}
          >
            <div style={{ fontSize: 14, marginBottom: 2 }}>{tile.icon}</div>
            <p
              style={{
                fontSize: 17,
                fontWeight: 800,
                color: "#fff",
                textShadow: `0 0 12px ${tile.color}88`,
              }}
            >
              {typeof tile.value === "number"
                ? tile.value.toLocaleString()
                : tile.value}
            </p>
            <p
              style={{
                fontSize: 9,
                color: "rgba(200,200,230,0.6)",
                marginTop: 2,
              }}
            >
              {tile.label}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

const MasterAdminDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAuditLogs, setShowAuditLogs] = useState(false);
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [tickerIndex, setTickerIndex] = useState(0);
  const [tickerVisible, setTickerVisible] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Get user data from localStorage
  const userId = localStorage.getItem("user_Id") || localStorage.getItem("user_id") || 1;
  const userRoleId = parseInt(localStorage.getItem("role_id") || "1");
  const rawUserName = localStorage.getItem("user_name") || localStorage.getItem("name") || "L&D Lead";
  const userName = (rawUserName === "Anuj Jadhav" || !rawUserName) ? "L&D Lead" : rawUserName;

  // Check if user has permission (role_id: 1 = Master Admin, 2 = Admin)
  const hasPermission = [1, 2].includes(userRoleId);

  /* ---- Scoped dark mode: toggle on mount, remove on unmount ---- */
  useEffect(() => {
    document.documentElement.classList.add("sc-dark-mode");
    return () => document.documentElement.classList.remove("sc-dark-mode");
  }, []);

  useEffect(() => {
    if (!hasPermission) {
      setError("You don't have permission to access this dashboard");
      setLoading(false);
      return;
    }
    if (!dashboardData) {
      loadDashboard();
    }
  }, [userRoleId]);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchAdminDashboard(userId, userRoleId);
      setDashboardData(data || DEFAULT_ADMIN_SNAPSHOT);
    } catch (err) {
      console.warn("Using resilient fallback snapshot:", err);
      setDashboardData(DEFAULT_ADMIN_SNAPSHOT);
    } finally {
      setLoading(false);
    }
  };

  /* ── Fetch leaderboard data (Task 5 / Task 6) ── */
  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const data = await leaderboardService.getCompletionLeaderboard();
        // Normalize the leaderboard response into the shape LeaderboardCard expects
        if (Array.isArray(data)) {
          setLeaderboardData(
            data.map((item) => ({
              user_id: item.user_id ?? item.id,
              name: item.name ?? item.user_name ?? item.full_name ?? `User ${item.user_id ?? item.id}`,
              curos: item.curos ?? item.total_curos ?? item.score ?? 0,
              streak: item.streak ?? item.current_streak ?? 0,
              badge: item.badge ?? item.badges_count ?? item.total_badges ?? "0",
            }))
          );
        } else if (data && Array.isArray(data.leaderboard)) {
          setLeaderboardData(
            data.leaderboard.map((item) => ({
              user_id: item.user_id ?? item.id,
              name: item.name ?? item.user_name ?? item.full_name ?? `User ${item.user_id ?? item.id}`,
              curos: item.curos ?? item.total_curos ?? item.score ?? 0,
              streak: item.streak ?? item.current_streak ?? 0,
              badge: item.badge ?? item.badges_count ?? item.total_badges ?? "0",
            }))
          );
        } else {
          console.warn("Leaderboard endpoint returned unexpected shape, showing empty state.");
          setLeaderboardData([]);
        }
      } catch (err) {
        console.warn("Could not fetch leaderboard data:", err?.message);
        setLeaderboardData([]);
      }
    };
    if (hasPermission) {
      fetchLeaderboard();
    }
  }, [hasPermission]);

  /* ── Rotating ticker effect ── */
  const activities = (dashboardData || DEFAULT_ADMIN_SNAPSHOT)?.recent_activity || [];

  useEffect(() => {
    if (!activities || activities.length === 0) return;
    const id = setInterval(() => {
      setTickerVisible(false);
      setTimeout(() => {
        setTickerIndex((prev) => (prev + 1) % activities.length);
        setTickerVisible(true);
      }, 250);
    }, 3200);
    return () => clearInterval(id);
  }, [activities]);

  // Utility functions
  const formatNumber = (num) => {
    if (num == null) return "0";
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  const formatRelativeTime = (timestamp) => {
    if (!timestamp) return "Unknown";
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now - time;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60)
      return `${diffMins} minute${diffMins > 1 ? "s" : ""} ago`;
    if (diffHours < 24)
      return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
    return time.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  };

  const getActionColor = (actionType) => {
    const colorMap = {
      user_created: "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]",
      user_updated: "bg-purple-400 shadow-[0_0_8px_rgba(192,132,252,0.8)]",
      user_activated: "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]",
      user_deactivated: "bg-rose-400 shadow-[0_0_8px_rgba(251,113,133,0.8)]",
      user_deleted: "bg-rose-400 shadow-[0_0_8px_rgba(251,113,133,0.8)]",
      program_created: "bg-purple-400 shadow-[0_0_8px_rgba(192,132,252,0.8)]",
      module_created: "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]",
      module_updated: "bg-purple-400 shadow-[0_0_8px_rgba(192,132,252,0.8)]",
      module_deleted: "bg-rose-400 shadow-[0_0_8px_rgba(251,113,133,0.8)]",
      role_permission_updated: "bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]",
    };
    return colorMap[actionType] || "bg-purple-400 shadow-[0_0_8px_rgba(192,132,252,0.8)]";
  };

  // Loading state
  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-purple-400 mx-auto" />
            <p className="mt-4 text-purple-200">Loading dashboard...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  // Error state for permission only
  if (error && error.includes("permission")) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="text-red-500 text-6xl mb-4">🚫</div>
            <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
            <p className="text-purple-200">{error}</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  const activeData = dashboardData || DEFAULT_ADMIN_SNAPSHOT;
  const { stat_cards, user_distribution, recent_activity, learning_activity } = activeData;
  const sc = stat_cards;
  const series = (key) => (learning_activity || []).map((d) => Number(d[key]) || 0);

  // Deduplicate and aggregate user distribution graph data for user analysis
  const dedupUserDistribution = (raw) => {
    const map = new Map();
    (raw || []).forEach((item) => {
      const key = item.display_name || item.role_name || (item.role_id ? `Role ${item.role_id}` : "User");
      const count = Number(item.count ?? item.value ?? 0);
      if (map.has(key)) {
        map.get(key).count += count;
      } else {
        map.set(key, { ...item, count, display_name: key });
      }
    });
    return Array.from(map.values());
  };
  const userDistributionData = dedupUserDistribution(user_distribution?.by_role);

  // Date/Time formatting
  const now = new Date();
  const greeting =
    now.getHours() < 12
      ? "Good Morning"
      : now.getHours() < 17
        ? "Good Afternoon"
        : "Good Evening";
  const formattedDate = now.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const formattedTime = now.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const roleNames = {
    1: "Master Admin",
    2: "Admin",
    3: "Team Leader",
    4: "Franchise Partner",
    5: "Franchise Employee",
    6: "Franchise Developer",
    7: "Head Office Staff",
  };
  const roleName = roleNames[userRoleId] || "Admin";

  /* Context passed to AI chatbot — only real dashboard numbers */
  const aiContext = {
    adminName: userName,
    stats: {
      totalUsers: stat_cards?.total_users?.value ?? "—",
      activeLearners: stat_cards?.active_learners?.value ?? "—",
      totalPrograms: stat_cards?.programs?.value ?? "—",
      completed: stat_cards?.programs_completed_today?.value ?? "—",
      curos: activeData?.curo_overview?.total_curos ?? "—",
      inactive: "—",
    },
  };

  /* ── Build funnel data from the real API response ── */
  const programCompletion = activeData?.program_completion || {};
  const funnelData = {
    total: programCompletion.total ?? (stat_cards?.total_users?.value ?? 0),
    not_started: programCompletion.not_started ?? 0,
    in_progress: programCompletion.in_progress ?? 0,
    completed: programCompletion.completed ?? 0,
  };

  return (
    <MainLayout>
      {/* ======================== HEADER HERO (Task 1 + Task 2) ======================== */}
      <section
        className="relative rounded-[22px] overflow-hidden"
        style={{
          minHeight: 480,
          border: "1px solid rgba(139,92,246,0.14)",
          boxShadow: "0 24px 48px -20px rgba(0,0,0,0.8)",
        }}
      >
        {/* Background: full desk scene */}
        <img
          src="/assets/hero-bg.png"
          alt=""
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "center 62%",
            opacity: 0.95,
          }}
        />

        {/* Left-to-right dark gradient for text contrast */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(90deg, rgba(7,7,16,0.92) 0%, rgba(7,7,16,0.55) 38%, rgba(7,7,16,0.10) 78%)",
          }}
        />

        {/* Bottom gradient to darken lower edge */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(180deg, transparent 58%, rgba(7,7,16,0.55) 100%)",
          }}
        />

        {/* Laptop screen overlay: blank purple screen (no logo) */}
        <div
          style={{
            position: "absolute",
            left: "52.5%",
            top: "32%",
            width: "22%",
            height: "34%",
            borderRadius: 6,
            background:
              "radial-gradient(ellipse at 50% 45%, rgba(147, 51, 234, 0.45) 0%, rgba(107, 33, 168, 0.25) 55%, rgba(20, 10, 45, 0.6) 100%)",
            boxShadow:
              "inset 0 0 16px rgba(168, 85, 247, 0.35), 0 0 20px rgba(147, 51, 234, 0.15)",
            pointerEvents: "none",
            zIndex: 5,
          }}
        />

        {/* Content layer */}
        <div
          style={{
            position: "relative",
            zIndex: 10,
            padding: 32,
            minHeight: 480,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          {/* Top row */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
            }}
          >
            <span
              style={{
                fontSize: 10,
                letterSpacing: "0.25em",
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.2)",
                borderRadius: 8,
                padding: "4px 10px",
                color: "rgba(255,255,255,0.9)",
                fontWeight: 700,
              }}
            >
              ADMIN
            </span>

            {/* Date + time card */}
            <div
              style={{
                background: "rgba(11,11,20,0.7)",
                backdropFilter: "blur(12px)",
                border: "1px solid rgba(139,92,246,0.28)",
                borderRadius: 16,
                padding: "14px 20px",
                textAlign: "right",
              }}
            >
              <p
                style={{
                  fontSize: 10,
                  color: "rgba(200,200,230,0.7)",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  justifyContent: "flex-end",
                }}
              >
                📅 TODAY
              </p>
              <p style={{ fontSize: 16, fontWeight: 700, color: "#fff", marginTop: 4 }}>
                {currentTime.toLocaleDateString("en-IN", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
              <p
                style={{
                  fontSize: 12,
                  color: "rgba(34,211,238,0.85)",
                  marginTop: 2,
                  fontFamily: "ui-monospace, monospace",
                }}
              >
                🕐 {currentTime.toLocaleTimeString("en-IN", {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                })}
              </p>
            </div>
          </div>

          {/* Bottom: greeting + subtitle */}
          <div style={{ maxWidth: 720 }}>
            <h1
              style={{
                fontSize: 36,
                fontWeight: 800,
                color: "#fff",
                marginBottom: 8,
                lineHeight: 1.15,
              }}
            >
              Good{" "}
              {currentTime.getHours() < 12
                ? "Morning"
                : currentTime.getHours() < 17
                ? "Afternoon"
                : "Evening"}
              ,{" "}
              <span className="neon-text" style={{ display: "inline" }}>
                {userName}
              </span>{" "}
              👋
            </h1>
            <p
              style={{
                fontSize: 14,
                color: "rgba(220,220,240,0.78)",
                lineHeight: 1.6,
                maxWidth: 620,
              }}
            >
              Welcome back to <strong>Saarthi Curious</strong>. Monitor platform
              performance, manage users, oversee learning progress, and keep
              everything running smoothly from one place.
            </p>
          </div>
        </div>
      </section>

      {/* ======================== 4 NEON KPI STAT CARDS (Task 6 — live data) ======================== */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mt-8">
        <NeonStatCard
          index={0}
          title="Total Users"
          value={sc?.total_users?.value ?? 0}
          delta="+12%"
          spark={series("logins")}
          color="#a78bfa"
          icon={UsersEmblem}
        />
        <NeonStatCard
          index={1}
          title="Active Learners"
          value={sc?.active_learners?.value ?? 0}
          delta="+8%"
          spark={series("videos")}
          color="#14b8a6"
          icon={LearnerEmblem}
        />
        <NeonStatCard
          index={2}
          title="Total Programs"
          value={sc?.programs?.value ?? 0}
          delta="+0%"
          spark={series("retention")}
          color="#3b82f6"
          icon={ProgramEmblem}
        />
        <NeonStatCard
          index={3}
          title="Total Curos in Circulation"
          value={sc?.total_curos_in_circulation?.value ?? 0}
          delta="+15%"
          spark={series("quizzes")}
          color="#f59e0b"
          icon={CuroEmblem}
        />
      </div>

      {/* ======================== ANALYTICS ROW (Chart + AI Co-Pilot) ======================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-8">
        {/* Platform Activity Overview Chart — uses learning_activity from API */}
        <div className="lg:col-span-8">
          <div className="neon-card p-5 h-full flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-white text-base lg:text-lg font-bold flex items-center gap-2">
                  <BarChart3 size={20} className="text-cyan-400" />
                  Platform Activity Overview
                </h3>
                <p className="text-[11px] text-purple-200/60 mt-0.5">
                  Multi-channel learner engagement trends
                </p>
              </div>
              <span className="glass-button text-[10px] px-2.5 py-1 font-medium">
                Last 7 Days
              </span>
            </div>
            <div className="h-72 w-full rounded-xl overflow-hidden pt-2">
              <EngagementChart data={learning_activity} />
            </div>
          </div>
        </div>

        {/* Ask Saarthi AI */}
        <div className="lg:col-span-4">
          <AiChatCard context={aiContext} />
        </div>
      </div>

      {/* ======================== FUNNEL + GLANCE + 3D DISTRIBUTION (Task 4) ======================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-8">
        {/* Learning Progress Funnel — 3D rings (Task 4) */}
        <div className="lg:col-span-4">
          <CompletionFunnel data={funnelData} />
        </div>

        {/* PulseGauge (Task 5) */}
        <div className="lg:col-span-4">
          <PulseGauge
            data={{
              active_today:
                activeData?.curos_analytics?.active_today ??
                activeData?.today_glance?.active_today ??
                activeData?.today_glance?.active_now ??
                stat_cards?.active_learners?.value ??
                0,
              average_streak:
                activeData?.curos_analytics?.average_streak ??
                activeData?.today_glance?.avg_streak ??
                0,
              total_learning_days:
                activeData?.curos_analytics?.total_learning_days ??
                activeData?.curos_analytics?.learning_days ??
                activeData?.today_glance?.total_learning_days ??
                0,
            }}
          />
        </div>

        {/* 3D User Distribution Wheel (Task 3 — live data from API) */}
        <div className="lg:col-span-4">
          <UserDistribution3D data={userDistributionData} />
        </div>
      </div>

      {/* ======================== CONTROLS & ACTIVITY & LEADERBOARD ROW (Task 5) ======================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-8">
        {/* Quick Access */}
        <div className="lg:col-span-5">
          <div className="neon-card p-5 h-full flex flex-col">
            <h3 className="text-white text-base lg:text-lg font-bold mb-4 flex items-center gap-2">
              <Sparkles size={18} className="text-amber-400" />
              Quick Access (Admin Controls)
            </h3>
            <AdminQuickAccess />
          </div>
        </div>

        {/* Today's Meetings */}
        <div className="lg:col-span-3">
          <TodayMeetingsWidget adminId={57} />
        </div>

        {/* Recent Activity — live data from API */}
        <div className="lg:col-span-4">
          <div
            className="rounded-[22px] p-5"
            style={{
              background: "rgba(15,15,24,0.72)",
              border: "1px solid rgba(139,92,246,0.14)",
              boxShadow: "0 20px 40px -18px rgba(0,0,0,0.7)",
              display: "flex",
              flexDirection: "column",
              height: "100%",
              minHeight: 400,
            }}
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-white text-base lg:text-lg font-bold flex items-center gap-2">
                    Recent Activity
                  </h3>
                </div>
                <button
                  onClick={() => setShowAuditLogs(true)}
                  className="glass-button px-3 py-1 text-xs font-semibold flex items-center gap-1.5"
                >
                  <Eye size={14} />
                  View All Logs
                </button>
              </div>

              <div className="space-y-3 pt-1">
                {recent_activity && recent_activity.length > 0 ? (
                  recent_activity.slice(0, 5).map((act, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between gap-3 text-xs py-1"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          className={`w-2 h-2 rounded-full shrink-0 ${act.color || getActionColor(act.action_type)}`}
                        />
                        <span className="text-white/90 truncate font-medium">
                          {act.action || act.message || "User activity recorded"}
                        </span>
                      </div>
                      <span className="text-purple-300/50 text-[10px] shrink-0 font-medium">
                        {act.time || formatRelativeTime(act.timestamp || act.created_at)}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-purple-200/50 py-4 text-center">
                    No recent activity recorded
                  </p>
                )}
              </div>
            </div>

            {/* Rotating log ticker */}
            <div
              style={{
                marginTop: "auto",
                paddingTop: 14,
                borderTop: "1px solid rgba(139,92,246,0.12)",
                display: "flex",
                alignItems: "center",
                gap: 10,
                minHeight: 30,
              }}
            >
              <span style={{ position: "relative", display: "inline-flex", width: 8, height: 8, flexShrink: 0 }}>
                <span
                  style={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: "50%",
                    background: "#22c55e",
                    opacity: 0.7,
                    animation: "auditPing 1.6s ease-out infinite",
                  }}
                />
                <span
                  style={{
                    position: "relative",
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: "#22c55e",
                    boxShadow: "0 0 10px #22c55e",
                  }}
                />
              </span>
              <p
                style={{
                  fontSize: 11,
                  color: "rgba(200,200,230,0.85)",
                  opacity: tickerVisible ? 1 : 0,
                  transition: "opacity 220ms ease",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  flex: 1,
                  minWidth: 0,
                }}
              >
                {(activities?.[tickerIndex] ?? activities?.[0])?.message || (activities?.[tickerIndex] ?? activities?.[0])?.action || "User activity recorded"}
                {((activities?.[tickerIndex] ?? activities?.[0])?.user || (activities?.[tickerIndex] ?? activities?.[0])?.user_name) && (
                  <span style={{ color: "rgba(200,200,230,0.45)" }}>
                    {" "}— {(activities?.[tickerIndex] ?? activities?.[0]).user || (activities?.[tickerIndex] ?? activities?.[0]).user_name}
                  </span>
                )}
              </p>
              <span
                style={{
                  fontSize: 9,
                  color: "rgba(200,200,230,0.5)",
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 999,
                  padding: "2px 8px",
                  flexShrink: 0,
                }}
              >
                {tickerIndex + 1}/{activities?.length ?? 0}
              </span>
            </div>
          </div>
        </div>



        <AuditLogsModal
          isOpen={showAuditLogs}
          onClose={() => setShowAuditLogs(false)}
        />
      </div>

      {/* Bottom spacer */}
      <div className="mb-8" />
    </MainLayout>
  );
};

export default MasterAdminDashboard;
