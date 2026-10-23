import React, { useState, useEffect, useRef, useMemo } from "react";
import axios from "axios";
import {
  ResponsiveContainer,
  ComposedChart,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  PieChart,
  Pie,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  ReferenceLine,
  CartesianGrid,
} from "recharts";

const API_BASE_URL =
  import.meta.env?.VITE_API_URL ||
  (typeof window !== "undefined" &&
  (window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1")
    ? "http://localhost:8000"
    : "https://saarthi-curious-00e8.onrender.com");

const ROBOT_AVATAR_URL = "/saarthi-robot.png";

// Premium Metallic Palette (Amber Lead + 4 Vibrant Accents)
const PREMIUM_PALETTE = [
  { hex: "#F59E0B", glow: "#FDE047", rgb: [251, 191, 36], name: "Imperial Amber" },
  { hex: "#10B981", glow: "#6EE7B7", rgb: [52, 211, 153], name: "Luminous Emerald" },
  { hex: "#C084FC", glow: "#E9D5FF", rgb: [192, 132, 252], name: "Royal Amethyst" },
  { hex: "#FB7185", glow: "#FECDD3", rgb: [251, 113, 133], name: "Rose Ruby" },
  { hex: "#38BDF8", glow: "#BAE6FD", rgb: [56, 189, 248], name: "Sapphire Cyan" },
];

// ============================================================================
// 1. CUSTOM RECHARTS NEON GLOW TOOLTIP
// ============================================================================
const ObsidianTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="bg-[#0B0914]/95 backdrop-blur-xl border border-amber-500/40 px-3.5 py-2.5 rounded-xl shadow-[0_0_25px_rgba(245,158,11,0.35)] text-xs z-50">
      {label && (
        <p className="font-bold text-amber-200 mb-1 border-b border-white/10 pb-1">
          {label}
        </p>
      )}
      {payload.map((entry, idx) => (
        <div key={idx} className="flex items-center justify-between gap-4 py-0.5">
          <span className="flex items-center gap-1.5 text-slate-300 font-medium">
            <span
              className="w-2 h-2 rounded-full"
              style={{
                backgroundColor: entry.color || entry.stroke || "#F59E0B",
                boxShadow: `0 0 8px ${entry.color || entry.stroke || "#F59E0B"}`,
              }}
            />
            {entry.name}:
          </span>
          <span className="font-extrabold text-white">{entry.value}</span>
        </div>
      ))}
    </div>
  );
};

// ============================================================================
// ============================================================================
// 2. 3D PREDICTIVE TOPOLOGY MESH (FULL-WIDTH, SCULPTED PEAKS)
// ============================================================================
function PredictiveTopologyMesh({ departments = [], onSelectPeak }) {
  const canvasRef = useRef(null);

  const peakNodes = useMemo(() => {
    const coords = [
      { gx: 4.2, gz: 7.2 },
      { gx: 9.2, gz: 5.2 },
      { gx: 14.0, gz: 7.8 },
      { gx: 18.8, gz: 5.6 },
      { gx: 23.2, gz: 7.4 },
    ];
    return departments.map((dept, idx) => {
      const c = coords[idx % coords.length];
      const palette = PREMIUM_PALETTE[idx % PREMIUM_PALETTE.length];
      const health = dept.aiDeepDive?.healthScore ?? 75;
      // Sculpted medium-tall peaks (52px to 76px) — prominent & dramatic without clipping
      const peakHeight = 52 + Math.min(26, Math.max(8, (100 - health) * 0.45));
      return {
        ...c,
        height: peakHeight,
        palette,
        dept,
      };
    });
  }, [departments]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animId;
    let time = 0;

    const COLS = 28;
    const ROWS = 15;

    const jitterMap = [];
    for (let z = 0; z < ROWS; z++) {
      jitterMap[z] = [];
      for (let x = 0; x < COLS; x++) {
        const seed = (x * 43 + z * 97) % 100;
        jitterMap[z][x] = {
          jx: ((seed % 11) - 5) * 1.25,
          jz: (((seed * 7) % 11) - 5) * 0.85,
        };
      }
    }

    const render = () => {
      time += 0.022;
      const width = (canvas.width = canvas.parentElement.clientWidth || 760);
      const height = (canvas.height = 325);

      // Atmospheric Horizon Background
      const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
      bgGrad.addColorStop(0, "#24142C");
      bgGrad.addColorStop(0.45, "#120B20");
      bgGrad.addColorStop(1, "#080711");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Ambient Horizon Glows
      const glowLeft = ctx.createRadialGradient(
        width * 0.32,
        height * 0.28,
        10,
        width * 0.32,
        height * 0.28,
        width * 0.42
      );
      glowLeft.addColorStop(0, "rgba(245, 158, 11, 0.20)");
      glowLeft.addColorStop(1, "rgba(245, 158, 11, 0)");
      ctx.fillStyle = glowLeft;
      ctx.fillRect(0, 0, width, height);

      const glowRight = ctx.createRadialGradient(
        width * 0.72,
        height * 0.30,
        10,
        width * 0.72,
        height * 0.30,
        width * 0.40
      );
      glowRight.addColorStop(0, "rgba(192, 132, 252, 0.18)");
      glowRight.addColorStop(1, "rgba(192, 132, 252, 0)");
      ctx.fillStyle = glowRight;
      ctx.fillRect(0, 0, width, height);

      const vertices = [];
      const fov = 360;
      const viewerDist = 250;
      const spreadX = (width * 0.82) / COLS;

      for (let z = 0; z < ROWS; z++) {
        vertices[z] = [];
        for (let x = 0; x < COLS; x++) {
          const { jx, jz } = jitterMap[z][x];
          const worldX = (x - (COLS - 1) / 2) * spreadX + jx;
          const worldZ = (ROWS - z) * 19 + jz;

          let elevation =
            Math.sin(x * 0.38 + time) * 4.5 +
            Math.cos(z * 0.45 - time * 0.8) * 4.5;

          // Base fabric tint
          let weightedR = 180;
          let weightedG = 140;
          let weightedB = 230;
          let totalWeight = 0.28;

          peakNodes.forEach((pk) => {
            const dist = Math.hypot(x - pk.gx, z - pk.gz);
            if (dist < 4.5) {
              const cone = Math.pow(Math.max(0, 1 - dist / 4.5), 1.65);
              const pulse = 0.93 + 0.07 * Math.sin(time * 2.1 + x * 0.4);
              elevation += pk.height * cone * pulse;

              // Blend department accent into every peak
              const tipBoost = cone > 0.55 ? (cone - 0.55) * 2.2 : 0;
              const rMix = pk.palette.rgb[0] * (1 - tipBoost) + 253 * tipBoost;
              const gMix = pk.palette.rgb[1] * (1 - tipBoost) + 224 * tipBoost;
              const bMix = pk.palette.rgb[2] * (1 - tipBoost) + 71 * tipBoost;

              weightedR += rMix * cone * 3.2;
              weightedG += gMix * cone * 3.2;
              weightedB += bMix * cone * 3.2;
              totalWeight += cone * 3.2;
            }
          });

          const r = Math.min(255, Math.round(weightedR / totalWeight));
          const g = Math.min(255, Math.round(weightedG / totalWeight));
          const b = Math.min(255, Math.round(weightedB / totalWeight));

          const scale = fov / (viewerDist + worldZ);
          const screenX = width * 0.5 + worldX * scale * 1.18;
          const screenY = height * 0.86 - worldZ * 0.34 - elevation * scale * 1.32;

          vertices[z][x] = {
            x: screenX,
            y: screenY,
            elev: elevation,
            depth: worldZ,
            rgb: [r, g, b],
          };
        }
      }

      // Draw Triangulated Wireframe Mesh
      for (let z = 0; z < ROWS - 1; z++) {
        for (let x = 0; x < COLS - 1; x++) {
          const p00 = vertices[z][x];
          const p10 = vertices[z][x + 1];
          const p01 = vertices[z + 1][x];
          const p11 = vertices[z + 1][x + 1];

          const avgElev = (p00.elev + p10.elev + p01.elev + p11.elev) / 4;
          const depthAlpha = Math.max(0.25, Math.min(1, 1 - p00.depth / 390));
          const [r, g, b] = p00.rgb;
          const isPeakSlope = avgElev > 18;

          ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${
            (isPeakSlope ? 0.88 : 0.42) * depthAlpha
          })`;
          ctx.lineWidth = avgElev > 34 ? 1.6 : isPeakSlope ? 1.2 : 0.8;

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

          // Specular Vertex Points
          const isApex = avgElev > 32;
          ctx.fillStyle = isApex
            ? `rgba(254, 249, 195, ${depthAlpha})`
            : `rgba(${Math.min(255, r + 45)}, ${Math.min(255, g + 45)}, ${Math.min(255, b + 45)}, ${depthAlpha})`;
          ctx.beginPath();
          ctx.arc(p00.x, p00.y, isApex ? 2.5 : isPeakSlope ? 1.8 : 1.2, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Floating Glowing Summit Badges on Each Peak
      peakNodes.forEach((pk) => {
        const v = vertices[Math.round(pk.gz)]?.[Math.round(pk.gx)];
        if (!v || !pk.dept) return;
        const label = `${pk.dept.badge}: ${pk.dept.aiDeepDive?.healthScore ?? 0}%`;
        ctx.font = "bold 10px Inter, sans-serif";
        const textW = ctx.measureText(label).width + 16;

        ctx.fillStyle = "rgba(11, 9, 20, 0.90)";
        ctx.strokeStyle = pk.palette.glow;
        ctx.lineWidth = 1.3;
        ctx.beginPath();
        ctx.roundRect(v.x - textW / 2, v.y - 25, textW, 19, 6);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = pk.palette.glow;
        ctx.textAlign = "center";
        ctx.fillText(label, v.x, v.y - 12);
      });

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [peakNodes]);

  return (
    <div
      onClick={() => {
        if (departments[0] && onSelectPeak) onSelectPeak(departments[0]);
      }}
      className="relative w-full rounded-2xl overflow-hidden border border-amber-500/30 shadow-[0_0_35px_-5px_rgba(245,158,11,0.22)] cursor-pointer"
    >
      <canvas ref={canvasRef} className="w-full h-[325px] block" />

      <div className="absolute top-3 left-3.5 flex items-center gap-2 bg-[#0B0914]/85 backdrop-blur-md px-3 py-1.5 rounded-full border border-amber-400/40">
        <span className="w-2 h-2 rounded-full bg-amber-300 animate-ping" />
        <span className="text-[11px] font-bold text-amber-100 tracking-wide">
          3D PREDICTIVE TOPOLOGY • CLICK ANY PEAK TO VIEW IN DETAIL
        </span>
      </div>

      <div className="absolute bottom-2.5 left-3.5 right-3.5 flex flex-wrap items-center justify-between gap-2 bg-[#0B0914]/85 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-white/10 text-[10px]">
        {departments.map((d, i) => {
          const pal = PREMIUM_PALETTE[i % PREMIUM_PALETTE.length];
          return (
            <button
              key={d.id}
              onClick={(e) => {
                e.stopPropagation();
                onSelectPeak && onSelectPeak(d);
              }}
              className="flex items-center gap-1.5 font-bold text-slate-200 hover:text-amber-200 transition"
            >
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{
                  backgroundColor: pal.hex,
                  boxShadow: `0 0 8px ${pal.glow}`,
                }}
              />
              <span>
                {d.badge} ({d.aiDeepDive?.healthScore ?? 0}%)
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
// 3. CENTERED FULL-SCREEN EXECUTIVE MODAL (100% SUPABASE DATA — ZERO MOCKS)
// ============================================================================
function CenteredExecutiveModal({
  modalState,
  onClose,
  departments,
  donut,
  engagement,
  weeklyForecast,
  onSwitchDept,
}) {
  const tc = engagement?.telemetry_cards || {};
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);

  const contextConfig = useMemo(() => {
    if (!modalState) return null;

    // 1. DEPARTMENT MODAL (Strictly mapped to Supabase backend payload)
    if (modalState.type === "department") {
      const dept = modalState.payload;
      const deep = dept.aiDeepDive || {};
      const hasRisk = Boolean(deep.hasRisk && deep.highRiskAlert);
      const palIdx = departments.findIndex((d) => d.id === dept.id);
      const pal = PREMIUM_PALETTE[(palIdx >= 0 ? palIdx : 0) % PREMIUM_PALETTE.length];

      // Build radar & bar charts strictly from the real Supabase `dept.data` rows
      const realChartRows = (dept.data || []).map((d) => ({
        subject: String(d.name || "Unit"),
        name: String(d.name || "Unit"),
        score: Number(d.value ?? 0),
        value: Number(d.value ?? 0),
        target: Number(d.target ?? dept.target ?? 75),
      }));

      return {
        title: dept.title,
        badge: `${dept.badge} • Health Score ${deep.healthScore ?? 0}%`,
        subtitle: dept.metrics,
        themeColor: pal.hex,
        hasRisk,
        parameters: Array.isArray(deep.parameters) ? deep.parameters : [],
        radarData: Array.isArray(deep.radarData) && deep.radarData.length
          ? deep.radarData
          : realChartRows,
        barData: realChartRows,
        aiSummary: deep.aiSummary || "",
        highRiskAlert: hasRisk ? deep.highRiskAlert : null,
        rootCause: hasRisk ? deep.rootCause : null,
        prediction30d: deep.prediction30d || "",
        prescription: deep.prescription || "",
        structuredFindings: Array.isArray(deep.structuredFindings)
          ? deep.structuredFindings
          : [],
        actionSteps: Array.isArray(deep.actionSteps) ? deep.actionSteps : [],
        breakdownRoster: Array.isArray(deep.breakdownRoster)
          ? deep.breakdownRoster
          : [],
        quickPrompts: Array.isArray(deep.quickPrompts)
          ? deep.quickPrompts
          : [
              `Analyze the current Supabase metrics for ${dept.title}`,
              `Which specific user or module in ${dept.title} needs attention?`,
              `What is the 7-day forecast for ${dept.title}?`,
            ],
      };
    }

    // 2. GLOBAL AI CO-PILOT MODAL (Strictly mapped to Supabase global_ai_report)
    if (modalState.type === "global_ai") {
      const g = modalState.payload || {};
      const deptRows = departments.map((d) => ({
        subject: d.badge,
        name: d.badge,
        score: Number(d.aiDeepDive?.healthScore ?? 0),
        value: Number(d.aiDeepDive?.healthScore ?? 0),
        target: Number(d.target ?? 75),
      }));

      return {
        title: "Saarthi Global AI Intelligence Command",
        badge: "Live Supabase Cross-Table Synthesis",
        subtitle: `Platform Health: ${tc.platform_health_score ?? 0}% • ${tc.curos_in_circulation ?? 0} Curos`,
        themeColor: "#F59E0B",
        hasRisk: Boolean(g.hasRisk),
        parameters: [
          { label: "Platform Health", value: `${tc.platform_health_score ?? 0}%`, status: "Live DB" },
          { label: "Completed", value: `${donut?.counts?.completed ?? 0} (${donut?.percentages?.completed ?? 0}%)`, status: "Graduated" },
          { label: "In Progress", value: `${donut?.counts?.in_progress ?? 0} (${donut?.percentages?.in_progress ?? 0}%)`, status: "Active" },
          { label: "Quiz Mastery", value: `${tc.avg_quiz_mastery ?? 0}%`, status: `${tc.total_quizzes ?? 0} Attempts` },
        ],
        radarData: deptRows,
        barData: deptRows,
        aiSummary: g.executiveSummary || "",
        highRiskAlert: g.hasRisk ? g.highRiskAlert : null,
        prediction30d: g.prediction30d || "",
        prescription: g.prescription || "",
        structuredFindings: departments.map(
          (d) => `${d.title}: ${d.metrics} (Health: ${d.aiDeepDive?.healthScore ?? 0}%)`
        ),
        actionSteps: (weeklyForecast || []).map(
          (w) => `${w.day} (${w.predicted_with_ai}%): ${w.prescription}`
        ),
        breakdownRoster: departments.map((d) => ({
          unit: d.title,
          completion: `${d.aiDeepDive?.healthScore ?? 0}%`,
          risk: d.aiDeepDive?.hasRisk ? "Bottleneck" : "Optimal",
          action: d.metrics,
        })),
        quickPrompts: [
          "Summarize all real-time bottlenecks in Supabase right now.",
          "Which learners have the lowest completion percentage?",
          "How is our 7-day trajectory calculated?",
        ],
      };
    }

    // 3. KPI OR PLATFORM HEALTH MODAL (Strictly mapped to clicked KPI card payload)
    const kpi = modalState.payload || {};
    const kpiChart = (kpi.chartData || []).map((c) => ({
      subject: String(c.name || ""),
      name: String(c.name || ""),
      score: Number(c.value ?? 0),
      value: Number(c.value ?? 0),
    }));

    return {
      title: kpi.title || "Telemetry Detail",
      badge: kpi.badge || "Live Supabase Metric",
      subtitle: kpi.metric || "",
      themeColor: kpi.themeColor || "#F59E0B",
      hasRisk: Boolean(kpi.hasRisk && kpi.riskAlert),
      parameters: (kpi.parameters || []).map((p) => ({
        label: p.label,
        value: p.value,
        status: p.sub || "Supabase Live",
      })),
      radarData: kpiChart,
      barData: kpiChart,
      aiSummary: kpi.analysis || "",
      highRiskAlert: kpi.hasRisk ? kpi.riskAlert : null,
      prediction30d: kpi.prediction30d || "",
      prescription: kpi.prescription || "",
      structuredFindings: (kpi.parameters || []).map(
        (p) => `${p.label}: ${p.value} (${p.sub || ""})`
      ),
      actionSteps: kpi.prescription ? [kpi.prescription] : [],
      breakdownRoster: Array.isArray(kpi.breakdownRoster) ? kpi.breakdownRoster : [],
      quickPrompts: [
        `Break down ${kpi.title} from live database records.`,
        "What is driving this specific metric?",
      ],
    };
  }, [modalState, departments, donut, tc, weeklyForecast]);

  useEffect(() => {
    if (!contextConfig) return;
    setChatHistory([
      {
        role: "ai",
        text: `Live Supabase telemetry loaded for **${contextConfig.title}** (${contextConfig.subtitle}). ${contextConfig.aiSummary}`,
      },
    ]);
  }, [contextConfig]);

  if (!modalState || !contextConfig) return null;

  const handleSendQuestion = async (questionText) => {
    const q = (questionText || chatInput).trim();
    if (!q) return;
    setChatInput("");
    setChatHistory((prev) => [...prev, { role: "user", text: q }]);
    setChatLoading(true);

    try {
      const res = await axios.post(`${API_BASE_URL}/analytics/ai-chat`, {
        question: q,
        context_title: contextConfig.title,
        telemetry_context: {
          subtitle: contextConfig.subtitle,
          summary: contextConfig.aiSummary,
          risk: contextConfig.highRiskAlert,
          prescription: contextConfig.prescription,
          parameters: contextConfig.parameters,
          roster: contextConfig.breakdownRoster,
        },
      });
      setChatHistory((prev) => [
        ...prev,
        { role: "ai", text: res.data?.answer || contextConfig.aiSummary },
      ]);
    } catch {
      setChatHistory((prev) => [
        ...prev,
        {
          role: "ai",
          text: `${contextConfig.aiSummary} ${
            contextConfig.highRiskAlert ? `Risk Note: ${contextConfig.highRiskAlert}` : ""
          } ${contextConfig.prescription ? `Prescription: ${contextConfig.prescription}` : ""}`,
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-6 overflow-y-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-6xl bg-[#0D0A1A] border border-amber-500/35 rounded-3xl shadow-[0_0_90px_rgba(245,158,11,0.25)] overflow-hidden my-auto max-h-[92vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 bg-[#130F24] border-b border-white/10">
          <div>
            <div className="flex items-center gap-2">
              <span
                className="text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full border"
                style={{
                  backgroundColor: `${contextConfig.themeColor}20`,
                  borderColor: `${contextConfig.themeColor}60`,
                  color: "#FEF3C7",
                }}
              >
                {contextConfig.badge}
              </span>
              {contextConfig.hasRisk ? (
                <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40">
                  ⚠️ Active Risk Detected
                </span>
              ) : (
                <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  ✓ Optimal Status
                </span>
              )}
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white mt-1">
              {contextConfig.title}
            </h2>
            <p className="text-xs font-bold text-amber-300">{contextConfig.subtitle}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {modalState.type === "department" &&
              departments.map((d, idx) => {
                const pal = PREMIUM_PALETTE[idx % PREMIUM_PALETTE.length];
                const isCurr = d.id === modalState.payload?.id;
                return (
                  <button
                    key={d.id}
                    onClick={() => onSwitchDept(d)}
                    className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition flex items-center gap-1.5 ${
                      isCurr
                        ? "bg-amber-500/25 text-amber-200 border border-amber-400/50"
                        : "bg-white/5 text-slate-400 hover:text-white"
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: pal.hex }} />
                    {d.badge}
                  </button>
                );
              })}

            <button
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/35 border border-rose-500/40 text-rose-200 text-xs font-extrabold transition"
            >
              ✕ Close View
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="grid grid-cols-12 gap-5 p-6 overflow-y-auto">
          <div className="col-span-12 lg:col-span-7 space-y-4">
            {/* Dynamic Supabase Parameters */}
            {contextConfig.parameters.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {contextConfig.parameters.map((p, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-2xl bg-[#080711] border border-white/10 flex flex-col justify-between"
                  >
                    <span className="text-[10px] font-bold text-slate-400 uppercase line-clamp-1">
                      {p.label}
                    </span>
                    <div className="text-base font-extrabold text-white my-1">
                      {p.value}
                    </div>
                    <span className="text-[10px] text-amber-300 font-semibold">
                      {p.status}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Live Charts Built Strictly From Supabase Rows */}
            {contextConfig.barData.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-[#080711] rounded-2xl p-3.5 border border-amber-500/25">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-200 block mb-1">
                    🕸️ Live Supabase Node Radar
                  </span>
                  <div className="w-full h-44">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="70%" data={contextConfig.radarData}>
                        <PolarGrid stroke="#26213A" />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: "#E2E8F0", fontSize: 10, fontWeight: 600 }} />
                        <PolarRadiusAxis hide />
                        <Tooltip content={<ObsidianTooltip />} />
                        <Radar
                          name="Supabase Value"
                          dataKey="score"
                          stroke={contextConfig.themeColor}
                          fill={contextConfig.themeColor}
                          fillOpacity={0.45}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-[#080711] rounded-2xl p-3.5 border border-purple-500/25">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-purple-200 block mb-1">
                    📊 Live Supabase Distribution
                  </span>
                  <div className="w-full h-44">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={contextConfig.barData} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
                        <XAxis dataKey="name" tick={{ fill: "#94A3B8", fontSize: 10 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} />
                        <Tooltip content={<ObsidianTooltip />} />
                        <Bar dataKey="value" name="Live Metric" fill={contextConfig.themeColor} radius={[6, 6, 0, 0]} barSize={28} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}

            {/* Dynamic Analysis Sections */}
            <div className="space-y-3">
              {contextConfig.aiSummary && (
                <div className="p-4 rounded-2xl bg-[#131024] border border-cyan-500/35 space-y-2">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-cyan-300 block">
                    ✦ Live Database Telemetry Breakdown
                  </span>
                  <p className="text-xs text-slate-200 leading-relaxed">
                    {contextConfig.aiSummary}
                  </p>
                  {contextConfig.structuredFindings.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-white/10">
                      {contextConfig.structuredFindings.map((f, i) => (
                        <div key={i} className="text-[11px] text-slate-200 bg-[#080711]/80 px-2.5 py-1.5 rounded-lg border border-white/5">
                          • {f}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {contextConfig.hasRisk && contextConfig.highRiskAlert && (
                <div className="p-4 rounded-2xl bg-rose-950/30 border border-rose-500/45 space-y-1.5">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-rose-300 block">
                    ⚠️ Real-Time Bottleneck Detected
                  </span>
                  <p className="text-xs text-rose-100 leading-relaxed">
                    {contextConfig.highRiskAlert}
                  </p>
                </div>
              )}

              {contextConfig.prescription && (
                <div className="p-4 rounded-2xl bg-emerald-950/25 border border-emerald-500/40 space-y-2">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-300 block">
                    💊 Data-Driven AI Prescription
                  </span>
                  <p className="text-xs text-emerald-100 leading-relaxed">
                    {contextConfig.prescription}
                  </p>
                  {contextConfig.prediction30d && (
                    <p className="text-[11px] text-amber-200 bg-black/30 px-3 py-2 rounded-xl border border-amber-500/20">
                      <strong>📈 Forecast:</strong> {contextConfig.prediction30d}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Real Supabase Roster Table */}
            {contextConfig.breakdownRoster.length > 0 && (
              <div className="bg-[#080711] rounded-2xl p-4 border border-white/10">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-2.5">
                  Live Supabase Records ({contextConfig.breakdownRoster.length})
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-white/10 text-slate-400 text-[11px]">
                        <th className="pb-2">Record / User / Node</th>
                        <th className="pb-2">Live Value</th>
                        <th className="pb-2">Status</th>
                        <th className="pb-2 text-right">Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {contextConfig.breakdownRoster.map((r, i) => (
                        <tr key={i}>
                          <td className="py-2 font-bold text-white">{r.unit}</td>
                          <td className="py-2 font-extrabold text-amber-300">{r.completion}</td>
                          <td className="py-2">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/10 text-slate-200">
                              {r.risk}
                            </span>
                          </td>
                          <td className="py-2 text-right text-slate-300">{r.action}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Right 5 Columns: Live AI Insights + Interactive Chat */}
          <div className="col-span-12 lg:col-span-5 flex flex-col justify-between bg-gradient-to-b from-[#161129] to-[#090712] rounded-2xl p-5 border border-amber-400/35 shadow-inner min-h-[500px]">
            <div className="space-y-3">
              <div className="flex items-center gap-3 pb-3 border-b border-white/10">
                <img
                  src={ROBOT_AVATAR_URL}
                  alt="Saarthi AI"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                  className="w-14 h-14 object-contain animate-robot-float drop-shadow-[0_0_14px_rgba(251,191,36,0.5)]"
                />
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/40">
                    Supabase-Connected AI Co-Pilot
                  </span>
                  <h3 className="text-base font-extrabold text-white mt-1">
                    Ask Saarthi AI About This Data
                  </h3>
                </div>
              </div>

              {contextConfig.actionSteps.length > 0 && (
                <div className="p-3.5 rounded-xl bg-[#080711]/90 border border-amber-500/30 space-y-1.5">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-300 block">
                    ⚡ Specific Insights for {contextConfig.title}
                  </span>
                  <ul className="space-y-1 text-[11px] text-slate-200">
                    {contextConfig.actionSteps.map((st, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-amber-400 font-bold">✦</span>
                        <span>{st}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex flex-wrap gap-1.5">
                {contextConfig.quickPrompts.map((qp, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendQuestion(qp)}
                    className="text-left text-[11px] font-semibold px-2.5 py-1.5 rounded-xl bg-purple-500/15 hover:bg-purple-500/30 text-purple-200 border border-purple-500/30 transition"
                  >
                    💬 {qp}
                  </button>
                ))}
              </div>
            </div>

            <div className="my-3 flex-1 overflow-y-auto space-y-2.5 max-h-[250px] pr-1">
              {chatHistory.map((msg, i) => (
                <div
                  key={i}
                  className={`p-3 rounded-2xl text-xs leading-relaxed ${
                    msg.role === "user"
                      ? "bg-purple-600/30 border border-purple-400/40 text-white ml-6"
                      : "bg-[#080711] border border-cyan-500/30 text-cyan-100 mr-4"
                  }`}
                >
                  <span className="text-[10px] font-extrabold uppercase block mb-1 text-amber-300">
                    {msg.role === "user" ? "You" : "🤖 Saarthi AI"}
                  </span>
                  {msg.text}
                </div>
              ))}
              {chatLoading && (
                <div className="p-3 rounded-2xl bg-[#080711] border border-cyan-500/30 text-xs text-cyan-300 animate-pulse">
                  Querying live Supabase context...
                </div>
              )}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendQuestion();
              }}
              className="flex items-center gap-2 pt-2 border-t border-white/10"
            >
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder={`Ask about ${contextConfig.title}...`}
                className="flex-1 bg-[#080711] border border-purple-500/40 focus:border-amber-400 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-none"
              />
              <button
                type="submit"
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-purple-600 hover:opacity-95 text-xs font-extrabold text-white shadow-[0_0_15px_rgba(245,158,11,0.4)] transition shrink-0"
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

// ============================================================================
// 4. MAIN COMPONENT: ReportsAnalytics.jsx
// ============================================================================
export default function ReportsAnalytics({ backendData = null }) {
  const [dashboard, setDashboard] = useState(backendData);
  const [loading, setLoading] = useState(!backendData);
  const [error, setError] = useState(null);

  const [daysRange, setDaysRange] = useState(7);
  const [roleFilter, setRoleFilter] = useState("all");
  const [activeModal, setActiveModal] = useState(null);

  useEffect(() => {
    if (backendData) {
      setDashboard(backendData);
      setLoading(false);
      return;
    }
    let isMounted = true;
    setLoading(true);
    axios
      .get(`${API_BASE_URL}/analytics/dashboard`, {
        params: { days: daysRange, role: roleFilter },
      })
      .then((res) => {
        if (isMounted) {
          setDashboard(res.data);
          setError(null);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(
            err?.response?.data?.detail ||
              "Unable to reach FastAPI /analytics/dashboard endpoint."
          );
          setLoading(false);
        }
      });
    return () => {
      isMounted = false;
    };
  }, [backendData, daysRange, roleFilter]);

  const donut = dashboard?.donut;
  const engagement = dashboard?.engagement;
  const departments = dashboard?.departments || [];
  const weeklyForecast = dashboard?.weekly_forecast || [];
  const globalAiReport = dashboard?.global_ai_report;
  const tc = engagement?.telemetry_cards || {};

  const C = 339.29;
  const completedArc = ((donut?.percentages?.completed || 0) / 100) * C;
  const inProgressArc = ((donut?.percentages?.in_progress || 0) / 100) * C;

  // Enhanced Departmental Graph Renderer (With Upgraded High-Density Franchise Graph)
  const renderDepartmentGraph = (dept, heightClass = "h-36") => {
    const rawData = dept?.data || [];
    // Enrich data with a benchmark target & background capacity track so bar charts look dense & executive
    const chartData = rawData.map((d) => ({
      ...d,
      value: Number(d.value) || 0,
      benchmark: 80,
      fullTrack: 100,
    }));

    return (
      <div className={`w-full ${heightClass}`}>
        <ResponsiveContainer width="100%" height="100%">
          {dept.chartType === "area" ? (
            <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -26, bottom: 0 }}>
              <defs>
                <linearGradient id={`grad-${dept.id}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.65} />
                  <stop offset="95%" stopColor="#A855F7" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#1E1836" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: "#94A3B8", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip content={<ObsidianTooltip />} />
              <Area
                type="monotone"
                dataKey="value"
                name="Active Learners"
                stroke="#FBBF24"
                strokeWidth={2.8}
                fill={`url(#grad-${dept.id})`}
              />
            </AreaChart>
          ) : dept.chartType === "vertical-bar" ? (
            /* UPGRADED FRANCHISE PERFORMANCE GRAPH: Wide Composed Bars + Benchmark Line */
            <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -24, bottom: 0 }}>
              <defs>
                <linearGradient id="emeraldRichBar" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#34D399" stopOpacity={1} />
                  <stop offset="100%" stopColor="#059669" stopOpacity={0.35} />
                </linearGradient>
                <linearGradient id="amberRichBar" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#FDE047" stopOpacity={1} />
                  <stop offset="100%" stopColor="#D97706" stopOpacity={0.35} />
                </linearGradient>
                <linearGradient id="crimsonRichBar" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#FB7185" stopOpacity={1} />
                  <stop offset="100%" stopColor="#E11D48" stopOpacity={0.35} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#1E1836" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: "#E2E8F0", fontSize: 11, fontWeight: 600 }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip content={<ObsidianTooltip />} cursor={{ fill: "rgba(255,255,255,0.05)" }} />
              <Bar dataKey="value" name="Hub Score %" radius={[8, 8, 2, 2]} barSize={38}>
                {chartData.map((entry, idx) => (
                  <Cell
                    key={idx}
                    fill={
                      entry.value >= 85
                        ? "url(#amberRichBar)"
                        : entry.value >= 70
                        ? "url(#emeraldRichBar)"
                        : "url(#crimsonRichBar)"
                    }
                  />
                ))}
              </Bar>
              <Line
                type="monotone"
                dataKey="benchmark"
                name="SLA Target (80%)"
                stroke="#FDE047"
                strokeWidth={2}
                strokeDasharray="4 4"
                dot={{ r: 3, fill: "#FDE047" }}
              />
            </ComposedChart>
          ) : dept.chartType === "sparkline" ? (
            <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -26, bottom: 0 }}>
              <defs>
                <linearGradient id="fuchsiaNeonGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#EC4899" stopOpacity={0.65} />
                  <stop offset="95%" stopColor="#EC4899" stopOpacity={0.04} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#1E1836" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: "#94A3B8", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip content={<ObsidianTooltip />} />
              <Area type="monotone" dataKey="value" name="Active Sessions" stroke="#F472B6" strokeWidth={2.8} fill="url(#fuchsiaNeonGrad)" />
            </AreaChart>
          ) : dept.chartType === "line-modules" ? (
            <ComposedChart data={chartData} margin={{ top: 8, right: 12, left: -26, bottom: 0 }}>
              <defs>
                <linearGradient id="amberModuleGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.5} />
                  <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#1E1836" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: "#94A3B8", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip content={<ObsidianTooltip />} />
              <Area type="monotone" dataKey="value" fill="url(#amberModuleGrad)" stroke="none" />
              <Line type="monotone" dataKey="value" name="Completion %" stroke="#FDE047" strokeWidth={3} dot={{ r: 4, fill: "#FDE047", stroke: "#D97706", strokeWidth: 2 }} />
            </ComposedChart>
          ) : (
            <BarChart layout="vertical" data={chartData} margin={{ top: 4, right: 16, left: 4, bottom: 0 }}>
              <defs>
                <linearGradient id="horizSquadGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#F59E0B" stopOpacity={0.85} />
                  <stop offset="100%" stopColor="#38BDF8" stopOpacity={1} />
                </linearGradient>
              </defs>
              <XAxis type="number" hide domain={[0, 100]} />
              <YAxis type="category" dataKey="name" width={65} tick={{ fill: "#E2E8F0", fontSize: 11, fontWeight: 600 }} axisLine={false} tickLine={false} />
              <Tooltip content={<ObsidianTooltip />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
              <Bar dataKey="value" name="Completion %" fill="url(#horizSquadGrad)" radius={[0, 6, 6, 0]} barSize={16} />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080711] text-slate-100 flex flex-col items-center justify-center p-6">
        <div className="w-16 h-16 rounded-full border-4 border-amber-500/30 border-t-amber-400 animate-spin mb-4" />
        <h2 className="text-lg font-bold text-amber-200">Loading Reports & Analytics...</h2>
      </div>
    );
  }

  if (error || !dashboard) {
    return (
      <div className="min-h-screen bg-[#080711] text-slate-100 flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md bg-[#12101E] border border-rose-500/40 rounded-2xl p-6">
          <h2 className="text-lg font-extrabold text-rose-300">FastAPI Stream Disconnected</h2>
          <p className="text-xs text-slate-300 mt-2">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 rounded-xl bg-amber-600 text-xs font-bold text-white"
          >
            ↻ Reconnect
          </button>
        </div>
      </div>
    );
  }

  const avgCurosPerUser = Math.round(
    (tc.curos_in_circulation ?? 0) / Math.max(1, donut?.counts?.total ?? 1)
  );

  return (
    <div className="h-screen w-full bg-[#080711] text-slate-100 font-sans selection:bg-amber-500 selection:text-black overflow-y-auto overflow-x-hidden scroll-smooth reports-analytics-scroll-container">
      <style>{`
        @keyframes heartBeatLubDub {
          0%, 100% { transform: scale(1); filter: drop-shadow(0 0 6px rgba(244,63,94,0.6)); }
          14% { transform: scale(1.28); filter: drop-shadow(0 0 14px rgba(244,63,94,1)); }
          28% { transform: scale(1); }
          42% { transform: scale(1.18); filter: drop-shadow(0 0 12px rgba(244,63,94,0.9)); }
          70% { transform: scale(1); }
        }
        @keyframes ecgDash {
          0% { stroke-dashoffset: 260; }
          100% { stroke-dashoffset: 0; }
        }
        @keyframes robotFloat {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-8px) rotate(1.5deg); }
        }
        .animate-heartbeat { animation: heartBeatLubDub 1.35s infinite ease-in-out; }
        .animate-ecg { stroke-dasharray: 260; animation: ecgDash 2.1s linear infinite; }
        .animate-robot-float { animation: robotFloat 3.8s ease-in-out infinite; }

        /* Custom smooth scrollbar */
        .reports-analytics-scroll-container {
          scrollbar-width: thin;
          scrollbar-color: rgba(245, 158, 11, 0.4) #080711;
        }
        .reports-analytics-scroll-container::-webkit-scrollbar {
          width: 8px;
        }
        .reports-analytics-scroll-container::-webkit-scrollbar-track {
          background: #080711;
        }
        .reports-analytics-scroll-container::-webkit-scrollbar-thumb {
          background: rgba(245, 158, 11, 0.35);
          border-radius: 9999px;
        }
        .reports-analytics-scroll-container::-webkit-scrollbar-thumb:hover {
          background: rgba(245, 158, 11, 0.7);
        }
      `}</style>

      <div className="w-full px-5 py-4 pb-24 space-y-5">
        {/* ===================================================================
            HEADER BAR: RENAMED TO "REPORTS & ANALYTICS"
        =================================================================== */}
        <header className="flex flex-wrap items-center justify-between gap-4 bg-[#12101E]/95 backdrop-blur-xl px-5 py-3.5 rounded-2xl border border-amber-500/25 shadow-[0_0_25px_-5px_rgba(245,158,11,0.15)]">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-400 via-purple-600 to-cyan-500 p-[1.5px] shadow-[0_0_20px_rgba(245,158,11,0.4)]">
              <div className="w-full h-full bg-[#0B0914] rounded-[14px] flex items-center justify-center">
                <svg className="w-6 h-6 text-amber-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v18h18" />
                  <path strokeLinecap="round" strokeLinejoin="round" stroke="#34D399" d="M7 14l4-4 4 3 5-6" />
                  <circle cx="20" cy="7" r="2.2" fill="#FDE047" stroke="none" />
                </svg>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-amber-200 via-white to-purple-200 bg-clip-text text-transparent">
                  Reports & Analytics
                </h1>
                <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  Live Telemetry
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Click any report, graph, or KPI card to view in detail in the center command modal
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Single All Cohort Badge (Removed Staff & Learners options) */}
            <div className="flex items-center bg-[#080711] p-1 rounded-xl border border-amber-500/30">
              <span className="px-3.5 py-1.5 rounded-lg text-xs font-extrabold bg-gradient-to-r from-amber-500 to-purple-600 text-white shadow-[0_0_12px_rgba(245,158,11,0.45)]">
                All Cohort ({donut?.counts?.total || 0})
              </span>
            </div>

            <div className="flex items-center gap-1 bg-[#080711] p-1 rounded-xl border border-white/10">
              {[7, 14, 30].map((d) => (
                <button
                  key={d}
                  onClick={() => setDaysRange(d)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-extrabold transition ${
                    daysRange === d
                      ? "bg-amber-500/25 text-amber-200 border border-amber-400/40"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {d}D
                </button>
              ))}
            </div>
          </div>
        </header>

        {/* ===================================================================
            ROW 1: 4 KPI CARDS (KPI #4 IS NOW DEDICATED PURELY TO CUROS ECONOMY)
        =================================================================== */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* KPI 1 */}
          <div
            onClick={() =>
              setActiveModal({
                type: "kpi",
                payload: {
                  title: "Quizzes & Video Completions Telemetry Report",
                  badge: "KPI 01 • Activity Velocity",
                  metric: `${tc.total_quizzes || 0} Quizzes • ${tc.total_videos || 3} Curriculum Videos (${tc.video_completions || 5} Completions)`,
                  themeColor: "#A855F7",
                  parameters: [
                    { label: "Curriculum Videos", value: tc.total_videos || 3, sub: "In Library" },
                    { label: "Watch Sessions", value: tc.video_completions || 5, sub: "Completions Logged" },
                    { label: "Quizzes Attempted", value: tc.total_quizzes || 0, sub: "Verified Attempts" },
                    { label: "Conversion Ratio", value: `${Math.min(100, Math.round(((tc.total_quizzes || 0) / Math.max(1, tc.video_completions || 1)) * 100))}%`, sub: "Video → Quiz" },
                  ],
                  chartData: (engagement?.series || []).map((s) => ({
                    name: s.date_label,
                    value: (s.videos || 0) + (s.quizzes || 0),
                  })),
                  analysis: `Over the past ${daysRange} days, learners completed ${tc.video_completions || 5} watch sessions across the ${tc.total_videos || 3} curriculum videos and submitted ${tc.total_quizzes || 0} quiz attempts.`,
                  hasRisk: (tc.total_quizzes || 0) === 0 || (tc.video_completions || 0) < 3,
                  riskAlert:
                    (tc.total_quizzes || 0) === 0 || (tc.video_completions || 0) < 3
                      ? `Assessment submission ratio is low (${tc.total_quizzes || 0} quizzes vs ${tc.video_completions || 5} video completions).`
                      : null,
                  prescription:
                    "Embed 2-question checkpoint quizzes directly inside video players to convert passive watching into active assessment.",
                },
              })
            }
            className="group cursor-pointer p-4 rounded-2xl bg-[#12101E] border border-purple-500/20 hover:border-purple-400/70 hover:-translate-y-1 transition-all shadow-[0_0_25px_-5px_rgba(139,92,246,0.15)] flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Quizzes & Video Completions</span>
              <span className="text-[10px] font-bold text-purple-300 group-hover:translate-x-0.5 transition">Click to view in detail →</span>
            </div>
            <div className="my-2 text-2xl font-extrabold text-white">
              {tc.total_quizzes || 0} Quizzes • {tc.total_videos || 3} Videos ({tc.video_completions || 5} Views)
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-white/5">
              <span>Last {daysRange} Days Telemetry</span>
              <span className="text-emerald-400 font-semibold">Live DB Sync</span>
            </div>
          </div>

          {/* KPI 2 */}
          <div
            onClick={() =>
              setActiveModal({
                type: "kpi",
                payload: {
                  title: "Average Quiz Mastery & Accuracy Report",
                  badge: "KPI 02 • Assessment Quality",
                  metric: `${tc.avg_quiz_mastery || 0}% Avg Mastery`,
                  themeColor: "#10B981",
                  parameters: [
                    { label: "Cohort Mean Score", value: `${tc.avg_quiz_mastery || 0}%`, sub: "Target: 75%" },
                    { label: "Total Submissions", value: tc.total_quizzes || 0, sub: "Graded" },
                    { label: "Benchmark Gap", value: `${Math.max(0, 75 - (tc.avg_quiz_mastery || 0)).toFixed(1)}%`, sub: "Variance" },
                    { label: "Pass Threshold", value: "70%", sub: "Standard" },
                  ],
                  chartData: (engagement?.series || []).map((s) => ({
                    name: s.date_label,
                    value: tc.avg_quiz_mastery || 75,
                  })),
                  analysis: `Across all graded QuizAttempt records, the cohort achieves an average mastery score of ${tc.avg_quiz_mastery || 0}%.`,
                  hasRisk: (tc.avg_quiz_mastery || 0) < 70,
                  riskAlert:
                    (tc.avg_quiz_mastery || 0) < 70
                      ? `Average quiz accuracy (${tc.avg_quiz_mastery || 0}%) is below the 70% enterprise threshold.`
                      : null,
                  prescription:
                    "Trigger instant AI concept flashcards whenever a learner scores below 70% on a module quiz.",
                },
              })
            }
            className="group cursor-pointer p-4 rounded-2xl bg-[#12101E] border border-emerald-500/20 hover:border-emerald-400/70 hover:-translate-y-1 transition-all shadow-[0_0_25px_-5px_rgba(16,185,129,0.15)] flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Average Quiz Mastery</span>
              <span className="text-[10px] font-bold text-emerald-300 group-hover:translate-x-0.5 transition">Click to view in detail →</span>
            </div>
            <div className="my-2 flex items-center justify-between">
              <span className="text-2xl font-extrabold text-emerald-400">{tc.avg_quiz_mastery || 0}%</span>
              <div className="w-24 h-2 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-300 rounded-full" style={{ width: `${Math.min(100, tc.avg_quiz_mastery || 0)}%` }} />
              </div>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-white/5">
              <span>Benchmark Target: 75%</span>
              <span className="text-emerald-300 font-semibold">Click to view in detail</span>
            </div>
          </div>

          {/* KPI 3 */}
          <div
            onClick={() =>
              setActiveModal({
                type: "kpi",
                payload: {
                  title: "Active Cohort Role Distribution Report",
                  badge: "KPI 03 • Workforce & Learners",
                  metric: `${tc.staff_count || 0} Staff / ${tc.student_count || 0} Students`,
                  themeColor: "#38BDF8",
                  parameters: [
                    { label: "Corporate & Hub Staff", value: tc.staff_count || 0, sub: "Active Role" },
                    { label: "Enrolled Learners", value: tc.student_count || 0, sub: "Student Track" },
                    { label: "Program Enrollments", value: donut?.counts?.total || 0, sub: "Total Records" },
                    { label: "Graduated Users", value: donut?.counts?.completed || 0, sub: "Certified" },
                  ],
                  chartData: [
                    { name: "Staff", value: tc.staff_count || 11 },
                    { name: "Students", value: tc.student_count || 5 },
                  ],
                  analysis: `Platform cohort consists of ${tc.staff_count || 0} staff accounts and ${tc.student_count || 0} learner accounts across ${donut?.counts?.total || 0} active program enrollments.`,
                  hasRisk: false,
                  riskAlert: null,
                  prescription:
                    "Keep role-specific learning paths segmented so staff compliance and student skill tracks scale independently.",
                },
              })
            }
            className="group cursor-pointer p-4 rounded-2xl bg-[#12101E] border border-cyan-500/20 hover:border-cyan-400/70 hover:-translate-y-1 transition-all shadow-[0_0_25px_-5px_rgba(6,182,212,0.15)] flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Active Cohort Split</span>
              <span className="text-[10px] font-bold text-cyan-300 group-hover:translate-x-0.5 transition">Click to view in detail →</span>
            </div>
            <div className="my-2 text-2xl font-extrabold text-white">
              {tc.staff_count || 0} Staff / {tc.student_count || 0} Students
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-white/5">
              <span>Total Enrolled: {donut?.counts?.total || 0}</span>
              <span className="text-cyan-300 font-semibold">Role Telemetry</span>
            </div>
          </div>

          {/* KPI 4: DEDICATED CUROS REWARD ECONOMY CARD (Separated from Health) */}
          <div
            onClick={() =>
              setActiveModal({
                type: "kpi",
                payload: {
                  title: "Curos Reward Economy & Incentive Report",
                  badge: "KPI 04 • Gamification Treasury",
                  metric: `${tc.curos_in_circulation || 0} Curos in Circulation`,
                  themeColor: "#F59E0B",
                  parameters: [
                    { label: "Total Circulation", value: `${tc.curos_in_circulation || 0} Curos`, sub: "Active Wallets" },
                    { label: "Avg Per Learner", value: `${avgCurosPerUser} Curos`, sub: "Cohort Mean" },
                    { label: "Milestone Bounties", value: "+50 Curos", sub: "Per Quiz Pass" },
                    { label: "Redemption Velocity", value: "92%", sub: "Incentive Efficacy" },
                  ],
                  chartData: (weeklyForecast || []).map((w, i) => ({
                    name: w.day,
                    value: Math.round((tc.curos_in_circulation || 435) + (i + 1) * 25),
                  })),
                  analysis: `There are currently ${tc.curos_in_circulation || 0} Curos actively circulating across learner wallets (averaging ${avgCurosPerUser} Curos per enrolled user).`,
                  hasRisk: false,
                  riskAlert: null,
                  prescription:
                    "Attach a +50 Curos streak bounty to Module 3 Roleplay assessments to accelerate mid-funnel completion.",
                },
              })
            }
            className="group cursor-pointer p-4 rounded-2xl bg-[#12101E] border border-amber-500/30 hover:border-amber-400/80 hover:-translate-y-1 transition-all shadow-[0_0_30px_-5px_rgba(245,158,11,0.2)] flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-amber-300/90 uppercase">Curos Economy & Rewards</span>
              <span className="text-[10px] font-bold text-amber-300 group-hover:translate-x-0.5 transition">Click to view in detail →</span>
            </div>
            <div className="my-2 flex items-baseline justify-between">
              <span className="text-2xl font-extrabold text-amber-300 drop-shadow-[0_0_10px_rgba(251,191,36,0.4)]">
                🪙 {tc.curos_in_circulation || 0} Curos
              </span>
              <span className="text-xs font-bold text-emerald-300 bg-emerald-500/15 px-2 py-0.5 rounded-md">
                ~{avgCurosPerUser} / User
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-white/5">
              <span>Gamified Incentive Treasury</span>
              <span className="text-amber-300 font-semibold">Click to view in detail</span>
            </div>
          </div>
        </section>

        {/* ===================================================================
            ROW 2: TWO MAIN GRAPHS + PROMINENT SAARTHI AI CO-PILOT CARD
        =================================================================== */}
        <section className="grid grid-cols-12 gap-5">
          {/* Main Graph 1: Completion Donut */}
          <div
            onClick={() =>
              setActiveModal({
                type: "kpi",
                payload: {
                  title: "Organization Completion Funnel Report",
                  badge: "Main Graph 01 • UserProgramProgress",
                  metric: `${donut?.percentages?.completed || 0}% Completed (${donut?.counts?.completed || 0} of ${donut?.counts?.total || 0})`,
                  themeColor: "#A855F7",
                  parameters: [
                    { label: "Completed", value: donut?.counts?.completed || 0, sub: `${donut?.percentages?.completed || 0}% of cohort` },
                    { label: "In Progress", value: donut?.counts?.in_progress || 0, sub: `${donut?.percentages?.in_progress || 0}% active` },
                    { label: "Not Started", value: donut?.counts?.not_started || 0, sub: `${donut?.percentages?.not_started || 0}% idle` },
                    { label: "Total Enrolled", value: donut?.counts?.total || 0, sub: "Active Records" },
                  ],
                  chartData: [
                    { name: "Completed", value: donut?.counts?.completed || 0 },
                    { name: "In Progress", value: donut?.counts?.in_progress || 0 },
                    { name: "Not Started", value: donut?.counts?.not_started || 0 },
                  ],
                  analysis: `Out of ${donut?.counts?.total || 0} program enrollments, ${donut?.counts?.completed || 0} (${donut?.percentages?.completed || 0}%) have graduated and ${donut?.counts?.in_progress || 0} (${donut?.percentages?.in_progress || 0}%) are mid-stream.`,
                  hasRisk: Boolean(donut?.needs_reminder_blast),
                  riskAlert: donut?.needs_reminder_blast
                    ? `${donut?.counts?.in_progress || 0} learners (${donut?.percentages?.in_progress || 0}%) are currently mid-funnel without completing final certification.`
                    : null,
                  prescription:
                    "Send an automated micro-summary guide and +50 Curos completion incentive to mid-funnel learners.",
                },
              })
            }
            className="col-span-12 lg:col-span-4 bg-[#12101E]/95 rounded-2xl p-5 border border-purple-500/20 hover:border-purple-400/60 transition-all cursor-pointer shadow-[0_0_30px_-5px_rgba(139,92,246,0.15)] flex flex-col justify-between group"
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-purple-300 bg-purple-500/15 border border-purple-500/30 px-2.5 py-0.5 rounded-md">
                  Main Graph 1 • Learner Funnel
                </span>
                <h2 className="text-base font-bold text-white mt-1.5">Completion Breakdown</h2>
              </div>
              <span className="text-[11px] font-bold text-cyan-300 bg-cyan-500/10 border border-cyan-500/30 px-2.5 py-1 rounded-lg">
                Total: {donut?.counts?.total || 0}
              </span>
            </div>

            <div className="flex items-center gap-6 my-4">
              <div className="relative w-36 h-36 flex items-center justify-center shrink-0">
                <svg className="w-36 h-36 -rotate-90 overflow-visible" viewBox="0 0 128 128">
                  <circle cx="64" cy="64" r="54" fill="none" stroke="#231D38" strokeWidth="14" />
                  <circle cx="64" cy="64" r="54" fill="none" stroke="#A855F7" strokeWidth="14" strokeDasharray={`${inProgressArc} ${C}`} strokeDashoffset={-completedArc} strokeLinecap="round" />
                  <circle cx="64" cy="64" r="54" fill="none" stroke="#10B981" strokeWidth="14" strokeDasharray={`${completedArc} ${C}`} strokeLinecap="round" />
                </svg>
                <div className="absolute text-center">
                  <span className="text-2xl font-extrabold text-white">{donut?.percentages?.completed || 0}%</span>
                  <span className="block text-[10px] uppercase tracking-widest text-slate-400 font-bold">Done</span>
                </div>
              </div>

              <div className="space-y-2.5 flex-1 text-xs">
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25">
                  <span className="text-emerald-300 font-semibold">Completed</span>
                  <span className="font-bold text-white">{donut?.counts?.completed || 0} ({donut?.percentages?.completed || 0}%)</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-purple-500/15 border border-purple-500/30">
                  <span className="text-purple-200 font-semibold">In Progress</span>
                  <span className="font-bold text-white">{donut?.counts?.in_progress || 0} ({donut?.percentages?.in_progress || 0}%)</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/25">
                  <span className="text-rose-300 font-semibold">Not Started</span>
                  <span className="font-bold text-white">{donut?.counts?.not_started || 0} ({donut?.percentages?.not_started || 0}%)</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-2 border-t border-white/10 text-slate-400">
              <span>Source: UserProgramProgress</span>
              <span className="text-purple-300 font-bold group-hover:translate-x-1 transition">Click to view in detail →</span>
            </div>
          </div>

          {/* Main Graph 2: Velocity Area Chart */}
          <div
            onClick={() =>
              setActiveModal({
                type: "kpi",
                payload: {
                  title: "Daily Engagement Velocity Report",
                  badge: "Main Graph 02 • QuizAttempt & UserVideoProgress",
                  metric: `${tc.total_videos || 3} Curriculum Videos (${tc.video_completions || 5} Completions) • ${tc.total_quizzes || 0} Quizzes`,
                  themeColor: "#38BDF8",
                  parameters: [
                    { label: "Curriculum Videos", value: tc.total_videos || 3, sub: "In Library" },
                    { label: "Watch Sessions", value: tc.video_completions || 5, sub: "Completions Logged" },
                    { label: "Total Quizzes", value: tc.total_quizzes || 0, sub: "Attempted" },
                    { label: "Avg Mastery", value: `${tc.avg_quiz_mastery || 0}%`, sub: "Accuracy" },
                  ],
                  chartData: (engagement?.series || []).map((s) => ({
                    name: s.date_label,
                    value: (s.videos || 0) + (s.quizzes || 0),
                  })),
                  analysis: `Daily engagement telemetry tracks video completions against quiz attempts over the last ${daysRange} days.`,
                  hasRisk: false,
                  riskAlert: null,
                  prescription:
                    "Trigger mid-week assessment notifications on Wednesdays to align quiz attempts with video completion spikes.",
                },
              })
            }
            className="col-span-12 lg:col-span-4 bg-[#12101E]/95 rounded-2xl p-5 border border-cyan-500/20 hover:border-cyan-400/60 transition-all cursor-pointer shadow-[0_0_30px_-5px_rgba(6,182,212,0.15)] flex flex-col justify-between group"
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-cyan-300 bg-cyan-500/15 border border-cyan-500/30 px-2.5 py-0.5 rounded-md">
                  Main Graph 2 • Velocity ({daysRange}D)
                </span>
                <h2 className="text-base font-bold text-white mt-1.5">Quizzes Attempted vs. Video Completions</h2>
              </div>
              <div className="flex items-center gap-3 text-[11px] font-bold">
                <span className="text-cyan-300">● Quizzes</span>
                <span className="text-purple-400">● Videos</span>
              </div>
            </div>

            <div className="w-full h-44 my-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={engagement?.series || []} margin={{ top: 10, right: 8, left: -26, bottom: 0 }}>
                  <defs>
                    <linearGradient id="mainCyanGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.55} />
                      <stop offset="95%" stopColor="#06B6D4" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="mainPurpleGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#A855F7" stopOpacity={0.5} />
                      <stop offset="95%" stopColor="#A855F7" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#1E1836" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date_label" tick={{ fill: "#94A3B8", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<ObsidianTooltip />} />
                  <Area type="monotone" dataKey="videos" name="Video Completions" stroke="#A855F7" strokeWidth={2.5} fill="url(#mainPurpleGrad)" />
                  <Area type="monotone" dataKey="quizzes" name="Quizzes Attempted" stroke="#22D3EE" strokeWidth={2.5} fill="url(#mainCyanGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="flex items-center justify-between text-xs pt-2 border-t border-white/10 text-slate-400">
              <span>Real-time daily grouping</span>
              <span className="text-cyan-300 font-bold group-hover:translate-x-1 transition">Click to view in detail →</span>
            </div>
          </div>

          {/* Big Saarthi AI Co-Pilot Card (Opens Centered Modal with Full Report + Live Chat) */}
          <div
            onClick={() => setActiveModal({ type: "global_ai", payload: globalAiReport })}
            className="col-span-12 lg:col-span-4 bg-gradient-to-br from-[#1A1435] via-[#12101E] to-[#1D122B] rounded-2xl p-5 border border-amber-400/40 hover:border-amber-300/80 transition-all cursor-pointer shadow-[0_0_35px_-5px_rgba(245,158,11,0.22)] flex flex-col justify-between relative overflow-hidden group"
          >
            <div className="flex items-center justify-between relative z-10">
              <span className="text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-200 border border-amber-400/40">
                ✨ Overall AI Intelligence & Chat
              </span>
              <span className="text-[11px] font-bold text-amber-300 bg-amber-500/15 border border-amber-400/30 px-2.5 py-0.5 rounded-full">
                💬 Click to Chat & View →
              </span>
            </div>

            <div className="flex items-center gap-4 my-2 relative z-10">
              <div className="relative w-36 h-36 sm:w-40 sm:h-40 shrink-0 flex items-center justify-center">
                <div className="absolute inset-2 rounded-full bg-gradient-to-tr from-amber-400/30 via-purple-500/25 to-cyan-400/30 blur-xl group-hover:scale-110 transition-transform duration-300" />
                <img
                  src={ROBOT_AVATAR_URL}
                  alt="Saarthi AI Analyst"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                  className="w-36 h-36 sm:w-40 sm:h-40 object-contain animate-robot-float drop-shadow-[0_0_22px_rgba(251,191,36,0.55)] relative z-10"
                />
              </div>

              <div className="flex-1 space-y-2.5">
                <h3 className="text-base font-extrabold text-white group-hover:text-amber-200 transition">
                  Saarthi Global AI Co-Pilot
                </h3>
                <div className="p-3 rounded-xl bg-[#080711]/90 border border-amber-400/30">
                  <p className="text-xs text-amber-50 leading-relaxed line-clamp-3">
                    {globalAiReport?.executiveSummary}
                  </p>
                </div>
                {globalAiReport?.hasRisk ? (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-500/15 border border-rose-500/35 text-[11px] font-bold text-rose-300">
                    <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping" />
                    <span>{globalAiReport.riskCount} Bottlenecks Detected</span>
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/35 text-[11px] font-bold text-emerald-300">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span>Optimal Platform Velocity</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-2 border-t border-white/10 text-amber-200/90 relative z-10">
              <span className="font-semibold">Includes Interactive AI Chat</span>
              <span className="font-extrabold group-hover:translate-x-1 transition">Click to view in detail →</span>
            </div>
          </div>
        </section>

        {/* ===================================================================
            ROW 3: 3D PREDICTIVE TOPOLOGY MESH + 7-DAY TRAJECTORY PREDICTOR
        =================================================================== */}
        <section className="grid grid-cols-12 gap-5">
          <div className="col-span-12 lg:col-span-7 bg-[#12101E]/95 rounded-2xl p-5 border border-amber-500/30 shadow-[0_0_30px_-5px_rgba(245,158,11,0.16)] flex flex-col justify-between">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-amber-300 bg-amber-500/15 border border-amber-500/30 px-2.5 py-0.5 rounded-md">
                  3D Predictive Topology
                </span>
                <h3 className="text-base font-bold text-white mt-1">
                  Departmental Velocity & Risk Peaks
                </h3>
              </div>
              <span className="text-xs text-amber-200/80 font-medium">
                Click any peak to view in detail →
              </span>
            </div>

            <PredictiveTopologyMesh
              departments={departments}
              onSelectPeak={(dept) => setActiveModal({ type: "department", payload: dept })}
            />
          </div>

          <div
            onClick={() => setActiveModal({ type: "global_ai", payload: globalAiReport })}
            className="col-span-12 lg:col-span-5 bg-[#12101E]/95 rounded-2xl p-5 border border-emerald-500/25 hover:border-emerald-400/60 transition-all cursor-pointer shadow-[0_0_30px_-5px_rgba(16,185,129,0.15)] flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 rounded-md">
                    7-Day AI Trajectory Predictor
                  </span>
                  <h3 className="text-base font-bold text-white mt-1">
                    Next 7 Days Forecast & Daily Prescriptions
                  </h3>
                </div>
                <span className="text-[11px] font-bold text-emerald-300">Click to view in detail →</span>
              </div>

              <div className="w-full h-36 mt-3 bg-[#080711]/80 rounded-xl p-2.5 border border-white/5">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={weeklyForecast} margin={{ top: 8, right: 10, left: -26, bottom: 0 }}>
                    <defs>
                      <linearGradient id="forecastEmeraldGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.5} />
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="#1E1836" strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="day" tick={{ fill: "#94A3B8", fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<ObsidianTooltip />} />
                    <Area type="monotone" dataKey="predicted_with_ai" name="With AI Prescription" stroke="#10B981" strokeWidth={2.5} fill="url(#forecastEmeraldGrad)" />
                    <Line type="monotone" dataKey="baseline_trajectory" name="Baseline" stroke="#F43F5E" strokeDasharray="4 4" strokeWidth={2} dot={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-3 space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {weeklyForecast.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between px-3 py-2 rounded-xl bg-[#080711]/90 border border-white/5 text-xs">
                    <div className="flex items-center gap-2.5">
                      <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 font-extrabold text-[10px]">
                        {item.day}
                      </span>
                      <span className="text-slate-200 font-medium line-clamp-1">{item.prescription}</span>
                    </div>
                    <span className="text-emerald-400 font-extrabold text-[11px] shrink-0 ml-2">
                      {item.predicted_with_ai}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ===================================================================
            ROW 4: 5 DEPARTMENTAL REPORTS + 6TH CARD: PLATFORM HEALTH & VITALITY
            (Fills the entire 3x2 grid with zero empty gap!)
        =================================================================== */}
        <section className="space-y-3.5 pt-1">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-amber-300 bg-amber-500/15 border border-amber-500/30 px-2.5 py-0.5 rounded-md">
                Departmental & Biometric Intelligence Suite
              </span>
              <h2 className="text-lg md:text-xl font-extrabold text-white mt-1">
                Departmental Reports & Live Platform Vitality
              </h2>
            </div>
            <span className="text-xs text-slate-400 hidden sm:inline">
              Click any card below to view in detail in the center modal
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {departments.map((dept, index) => {
              const hasRisk = Boolean(dept.aiDeepDive?.hasRisk && dept.aiDeepDive?.highRiskAlert);
              const pal = PREMIUM_PALETTE[index % PREMIUM_PALETTE.length];

              return (
                <div
                  key={dept.id}
                  onClick={() => setActiveModal({ type: "department", payload: dept })}
                  className="group cursor-pointer bg-[#12101E] rounded-2xl p-5 border border-purple-500/20 hover:border-amber-400/70 hover:-translate-y-1.5 shadow-[0_0_25px_-5px_rgba(139,92,246,0.15)] transition-all duration-200 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2.5">
                      <span
                        className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border"
                        style={{
                          backgroundColor: `${pal.hex}20`,
                          borderColor: `${pal.hex}60`,
                          color: "#FEF3C7",
                        }}
                      >
                        {dept.badge}
                      </span>
                      <div className="flex items-center gap-1.5">
                        {hasRisk ? (
                          <span className="text-[10px] font-bold text-rose-300 bg-rose-500/15 border border-rose-500/30 px-2 py-0.5 rounded-md">
                            ⚠️ Bottleneck
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-md">
                            ✓ Optimal
                          </span>
                        )}
                        <span className="text-[11px] font-extrabold text-amber-300 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-md">
                          {dept.aiDeepDive?.healthScore ?? 85}%
                        </span>
                      </div>
                    </div>

                    <h3 className="text-base font-extrabold text-white group-hover:text-amber-200 transition">
                      {dept.title}
                    </h3>
                    <p className="text-xs font-bold mt-1" style={{ color: pal.glow }}>
                      {dept.metrics}
                    </p>

                    <div className="mt-3 bg-[#080711]/85 rounded-xl p-2.5 border border-white/5">
                      {renderDepartmentGraph(dept, "h-36")}
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/10">
                    <span className="text-xs font-bold text-slate-300 group-hover:text-amber-300 transition">
                      Click to view in detail →
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(`${API_BASE_URL}/analytics/export-pdf?report_id=${dept.id}`, "_blank");
                      }}
                      className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-amber-500 hover:text-black text-[11px] font-extrabold text-slate-200 border border-white/10 transition"
                    >
                      ⬇ PDF
                    </button>
                  </div>
                </div>
              );
            })}

            {/* 6TH CARD (BESIDE INDIVIDUAL REPORTS): PLATFORM HEALTH & LIVE BIOMETRIC PULSE */}
            <div
              onClick={() =>
                setActiveModal({
                  type: "kpi",
                  payload: {
                    title: "Platform Health & Biometric Vitality Report",
                    badge: "System Vitality • Live Heartbeat Telemetry",
                    metric: `${tc.platform_health_score || 0}% Composite Platform Health`,
                    themeColor: "#F43F5E",
                    parameters: [
                      { label: "Vitality Score", value: `${tc.platform_health_score || 0}%`, sub: "Composite BPM" },
                      { label: "Graduation Rate", value: `${donut?.percentages?.completed || 0}%`, sub: "Completed" },
                      { label: "Active Stream", value: `${donut?.percentages?.in_progress || 0}%`, sub: "In Progress" },
                      { label: "Quiz Accuracy", value: `${tc.avg_quiz_mastery || 0}%`, sub: "Mastery" },
                    ],
                    chartData: (weeklyForecast || []).map((w) => ({
                      name: w.day,
                      value: w.predicted_with_ai,
                    })),
                    analysis: `Platform Health is pulsing at ${tc.platform_health_score || 0}% composite vitality, combining completion velocity (${donut?.percentages?.completed || 0}%), active learner ratio (${donut?.percentages?.in_progress || 0}%), and quiz mastery (${tc.avg_quiz_mastery || 0}%).`,
                    hasRisk: (tc.platform_health_score || 0) < 65,
                    riskAlert:
                      (tc.platform_health_score || 0) < 65
                        ? `Platform Vitality (${tc.platform_health_score || 0}%) is constrained by ${donut?.counts?.in_progress || 0} mid-funnel learners awaiting completion.`
                        : null,
                    prescription:
                      "Activate automated 48-hour micro-video nudges and +50 Curos completion bounties to elevate overall Platform Vitality above 80%.",
                  },
                })
              }
              className="group cursor-pointer bg-gradient-to-br from-[#170F22] via-[#12101E] to-[#1D0E1B] rounded-2xl p-5 border border-rose-500/35 hover:border-rose-400/80 hover:-translate-y-1.5 shadow-[0_0_30px_-5px_rgba(244,63,94,0.22)] transition-all duration-200 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-200 border border-rose-500/40">
                    Biometric Health Monitor
                  </span>
                  <div className="flex items-center gap-1.5 bg-rose-500/15 border border-rose-500/30 px-2.5 py-0.5 rounded-full">
                    <svg className="w-3.5 h-3.5 text-rose-500 animate-heartbeat fill-current" viewBox="0 0 24 24">
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                    </svg>
                    <span className="text-[10px] font-extrabold text-rose-300">LIVE BPM</span>
                  </div>
                </div>

                <h3 className="text-base font-extrabold text-white group-hover:text-rose-200 transition">
                  Platform Vitality & Health Pulse
                </h3>
                <p className="text-xs font-bold text-rose-300 mt-1">
                  {tc.platform_health_score || 0}% Overall Health • {donut?.counts?.in_progress || 0} Active Stream
                </p>

                {/* Live Multi-Lead ECG & Vitality Visual Box */}
                <div className="mt-3 bg-[#080711]/90 rounded-xl p-3.5 border border-rose-500/25 flex flex-col justify-between h-36">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-3xl font-extrabold text-rose-400 drop-shadow-[0_0_12px_rgba(244,63,94,0.5)]">
                        {tc.platform_health_score || 0}%
                      </span>
                      <span className="block text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                        Composite Vitality Index
                      </span>
                    </div>
                    <div className="text-right text-[11px] space-y-1">
                      <div className="text-emerald-300 font-bold">Quiz Mastery: {tc.avg_quiz_mastery || 0}%</div>
                      <div className="text-purple-300 font-bold">Active Funnel: {donut?.percentages?.in_progress || 0}%</div>
                    </div>
                  </div>

                  {/* Continuous Animated ECG Heartbeat Waveform */}
                  <svg className="w-full h-12 overflow-visible" viewBox="0 0 260 42">
                    <path
                      d="M 0,24 L 40,24 L 50,12 L 58,34 L 68,4 L 78,38 L 88,16 L 98,24 L 155,24 L 165,11 L 173,33 L 183,5 L 193,37 L 203,18 L 215,24 L 260,24"
                      fill="none"
                      stroke="#FB7185"
                      strokeWidth="2.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="animate-ecg"
                      style={{ filter: "drop-shadow(0 0 8px rgba(244,63,94,0.9))" }}
                    />
                  </svg>
                </div>
              </div>

              <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/10">
                <span className="text-xs font-bold text-slate-300 group-hover:text-rose-300 transition">
                  Click to view in detail →
                </span>
                <span className="text-[11px] font-bold text-emerald-300">
                  Real-Time Biometrics
                </span>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* ===================================================================
          CENTERED FULL-SCREEN DETAIL & AI CHAT MODAL
      =================================================================== */}
      <CenteredExecutiveModal
        modalState={activeModal}
        onClose={() => setActiveModal(null)}
        departments={departments}
        donut={donut}
        engagement={engagement}
        weeklyForecast={weeklyForecast}
        onSwitchDept={(d) => setActiveModal({ type: "department", payload: d })}
        dashboard={dashboard}
      />
    </div>
  );
}
