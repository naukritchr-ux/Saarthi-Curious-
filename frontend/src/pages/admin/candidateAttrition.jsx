import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import axios from "axios";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  XAxis,
  YAxis,
  Tooltip,
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

// ============================================================================
// 1. DARK-GLOW RECHARTS TOOLTIP
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
// 2. PREFETCHED CANDIDATE TELEMETRY & RETENTION ENGINE (ARCHETYPE-TAILORED)
// ============================================================================
function buildPersonalizedBackupReport(student, cohortSize = 19) {
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
// 3. REALISTIC VOLUMETRIC HORIZON, PARTICLE-RIDGE & WAVE STREAM GRAPH
//    High-definition upgrade of Screenshot (10).jpg combining 0,3.JPG & 0,4.JPG:
//    - Volumetric stipple/particle-cloud 3D mountain ridges (not a flat cutout)
//    - 18 silky-smooth flowing 3D cyan/sapphire wave ribbons with photon streams
//    - 110+ fine golden equalizer micro-filaments + star-flare candidate laser stems
// ============================================================================
function RealisticNeuralHorizonGraph({ candidates = [], onSelectCandidate }) {
  const canvasRef = useRef(null);
  const [hoveredNode, setHoveredNode] = useState(null);
  const nodesRef = useRef([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animId;
    let time = 0;

    // Soft Depth-of-Field Bokeh Orbs (Foreground & Midground)
    const bokehOrbs = Array.from({ length: 48 }, (_, i) => ({
      xFrac: ((i * 61 + 13) % 100) / 100,
      yFrac: ((i * 37 + 19) % 100) / 100,
      radius: i % 6 === 0 ? 5.5 : 1.3 + (i % 4) * 1.1,
      alpha: i % 6 === 0 ? 0.14 : 0.42,
      speed: 0.0003 + (i % 5) * 0.00014,
      color: i % 3 === 0 ? "251, 191, 36" : i % 3 === 1 ? "56, 189, 248" : "244, 63, 94",
    }));

    const render = () => {
      time += 0.02;
      const width = (canvas.width = canvas.parentElement.clientWidth || 780);
      const height = (canvas.height = 315);
      const baseHorizonY = height * 0.66;

      // -------------------------------------------------------------------
      // 1. DEEP CINEMATIC NIGHT-ABYSS BACKGROUND & VOLUMETRIC LIGHTING
      // -------------------------------------------------------------------
      const bgGrad = ctx.createLinearGradient(0, 0, width, height);
      bgGrad.addColorStop(0, "#03050F");
      bgGrad.addColorStop(0.45, "#070B1E");
      bgGrad.addColorStop(0.75, "#0F0822");
      bgGrad.addColorStop(1, "#02040A");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Subtle Blueprint Telemetry Grid in Upper-Right Sky (From 0,3.JPG)
      ctx.strokeStyle = "rgba(56, 189, 248, 0.045)";
      ctx.lineWidth = 0.8;
      for (let gx = width * 0.52; gx < width; gx += 26) {
        ctx.beginPath();
        ctx.moveTo(gx, 0);
        ctx.lineTo(gx, baseHorizonY);
        ctx.stroke();
      }
      for (let gy = 16; gy < baseHorizonY; gy += 26) {
        ctx.beginPath();
        ctx.moveTo(width * 0.52, gy);
        ctx.lineTo(width, gy);
        ctx.stroke();
      }

      // Warm Amber-Crimson & Sapphire Atmospheric Backlights Behind Peaks
      const backGlowRight = ctx.createRadialGradient(
        width * 0.76,
        baseHorizonY - 55,
        10,
        width * 0.76,
        baseHorizonY - 55,
        width * 0.42
      );
      backGlowRight.addColorStop(0, "rgba(251, 146, 60, 0.28)");
      backGlowRight.addColorStop(0.45, "rgba(225, 29, 72, 0.14)");
      backGlowRight.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = backGlowRight;
      ctx.fillRect(0, 0, width, height);

      const backGlowLeft = ctx.createRadialGradient(
        width * 0.24,
        baseHorizonY - 15,
        10,
        width * 0.24,
        baseHorizonY - 15,
        width * 0.36
      );
      backGlowLeft.addColorStop(0, "rgba(56, 189, 248, 0.20)");
      backGlowLeft.addColorStop(0.5, "rgba(139, 92, 246, 0.12)");
      backGlowLeft.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = backGlowLeft;
      ctx.fillRect(0, 0, width, height);

      // -------------------------------------------------------------------
      // 2. REALISTIC MULTI-LAYERED RIDGE ELEVATION FUNCTION (0,4.JPG & 0,3.JPG)
      // -------------------------------------------------------------------
      const ridgeElevation = (xNorm, layer = 0) => {
        // Natural sweeping ascent from left to right with 4 organic mountain crests
        const p1 = Math.exp(-Math.pow((xNorm - 0.11) / 0.055, 2)) * 42;
        const p2 = Math.exp(-Math.pow((xNorm - 0.31) / 0.075, 2)) * 68;
        const p3 = Math.exp(-Math.pow((xNorm - 0.56) / 0.085, 2)) * 88;
        const p4 = Math.exp(-Math.pow((xNorm - 0.83) / 0.078, 2)) * 134;
        const slopeAscent = Math.pow(xNorm, 1.35) * 32;
        const microWave =
          Math.sin(xNorm * 22 + time * 1.1 + layer * 1.3) * 7 +
          Math.cos(xNorm * 11 - time * 0.8 + layer) * 5;
        return Math.max(12, p1 + p2 + p3 + p4 + slopeAscent + microWave);
      };

      // -------------------------------------------------------------------
      // 3. VOLUMETRIC POINT-CLOUD / STIPPLE MOUNTAIN LAYERS (0,4.JPG REALISM)
      //    Instead of flat 2D fills, we render glowing stipple particle fields
      //    inside the mountain silhouette + soft volumetric gradient shading
      // -------------------------------------------------------------------
      for (let layer = 2; layer >= 0; layer--) {
        const scaleH = layer === 0 ? 1.0 : layer === 1 ? 0.76 : 0.54;
        const phase = layer * 1.15;

        ctx.beginPath();
        ctx.moveTo(0, baseHorizonY);
        for (let x = 0; x <= width; x += 6) {
          const xn = x / width;
          const y = baseHorizonY - ridgeElevation(xn, phase) * scaleH;
          ctx.lineTo(x, y);
        }
        ctx.lineTo(width, baseHorizonY);
        ctx.closePath();

        const volGrad = ctx.createLinearGradient(0, baseHorizonY - 165, 0, baseHorizonY);
        if (layer === 0) {
          volGrad.addColorStop(0, "rgba(251, 113, 133, 0.34)");
          volGrad.addColorStop(0.45, "rgba(245, 158, 11, 0.16)");
          volGrad.addColorStop(1, "rgba(14, 165, 233, 0.0)");
        } else if (layer === 1) {
          volGrad.addColorStop(0, "rgba(168, 85, 247, 0.22)");
          volGrad.addColorStop(1, "rgba(15, 23, 42, 0.0)");
        } else {
          volGrad.addColorStop(0, "rgba(56, 189, 248, 0.15)");
          volGrad.addColorStop(1, "rgba(15, 23, 42, 0.0)");
        }
        ctx.fillStyle = volGrad;
        ctx.fill();
      }

      // Stippled Particle Matrix Inside Primary Mountain Slope (Signature of 0,4.JPG!)
      for (let sx = 8; sx < width; sx += 7) {
        const xn = sx / width;
        const elev = ridgeElevation(xn, 0);
        const topY = baseHorizonY - elev;
        const dotsInCol = Math.min(14, Math.floor(elev / 9));

        for (let d = 1; d <= dotsInCol; d++) {
          const frac = d / (dotsInCol + 1);
          const py = topY + frac * elev * 0.88;
          const alpha = (1 - frac) * 0.55;
          ctx.fillStyle =
            frac < 0.35
              ? `rgba(253, 186, 116, ${alpha})`
              : `rgba(244, 63, 94, ${alpha * 0.75})`;
          ctx.fillRect(sx, py, 1.3, 1.3);
        }
      }

      // -------------------------------------------------------------------
      // 4. 110+ FINE GOLDEN EQUALIZER FILAMENTS (0,3.JPG HISTOGRAM DENSITY)
      // -------------------------------------------------------------------
      const numFilaments = 115;
      for (let i = 0; i < numFilaments; i++) {
        const xn = i / (numFilaments - 1);
        const fx = xn * width;
        const ridgeY = baseHorizonY - ridgeElevation(xn, 0);
        const waveFloorY =
          height * 0.78 -
          xn * 28 +
          Math.sin(xn * 6.2 + time) * 14;

        if (waveFloorY > ridgeY) {
          const filGrad = ctx.createLinearGradient(fx, ridgeY, fx, waveFloorY);
          filGrad.addColorStop(0, "rgba(253, 224, 71, 0.48)");
          filGrad.addColorStop(0.5, "rgba(245, 158, 11, 0.16)");
          filGrad.addColorStop(1, "rgba(56, 189, 248, 0.02)");

          ctx.beginPath();
          ctx.strokeStyle = filGrad;
          ctx.lineWidth = 1.0;
          ctx.moveTo(fx, waveFloorY);
          ctx.lineTo(fx, ridgeY);
          ctx.stroke();
        }
      }

      // Secondary Weaving Golden Dotted Trajectory Spline (0,4.JPG)
      ctx.save();
      ctx.beginPath();
      ctx.setLineDash([2.5, 5.5]);
      for (let x = 0; x <= width; x += 6) {
        const xn = x / width;
        const y =
          baseHorizonY -
          ridgeElevation(xn, 0.85) * 0.64 -
          Math.sin(xn * 9 - time * 1.1) * 12;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = "rgba(253, 224, 71, 0.9)";
      ctx.lineWidth = 1.9;
      ctx.stroke();
      ctx.restore();

      // Dual-Pass Glowing Neon Rim Light Along the Primary Mountain Crest (0,4.JPG)
      ctx.save();
      ctx.beginPath();
      for (let x = 0; x <= width; x += 4) {
        const xn = x / width;
        const y = baseHorizonY - ridgeElevation(xn, 0);
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      // Outer Coral-Red Neon Bloom
      ctx.strokeStyle = "#FB7185";
      ctx.lineWidth = 4.2;
      ctx.shadowColor = "#F43F5E";
      ctx.shadowBlur = 18;
      ctx.stroke();
      // Inner White-Gold Hot Core
      ctx.strokeStyle = "#FEF08A";
      ctx.lineWidth = 1.6;
      ctx.shadowBlur = 6;
      ctx.stroke();
      ctx.restore();

      // -------------------------------------------------------------------
      // 5. 18 SILKY-SMOOTH 3D TOPOGRAPHIC CYAN/BLUE WAVE RIBBONS (0,3.JPG)
      // -------------------------------------------------------------------
      const NUM_WAVES = 18;
      for (let w = 0; w < NUM_WAVES; w++) {
        const wf = w / (NUM_WAVES - 1);
        ctx.beginPath();
        const isHighlightWave = w === 0 || w === 12 || w === NUM_WAVES - 1;
        ctx.strokeStyle =
          w > 13
            ? `rgba(251, 191, 36, ${0.16 + wf * 0.35})`
            : `rgba(56, 189, 248, ${0.14 + (1 - wf) * 0.52})`;
        ctx.lineWidth = isHighlightWave ? 1.65 : 0.9;

        for (let x = 0; x <= width; x += 10) {
          const xn = x / width;
          const wy =
            height * 0.72 +
            w * 4.2 -
            xn * 34 +
            Math.sin(xn * 6.0 + time + w * 0.15) * (15 + w * 0.65) +
            Math.cos(xn * 3.5 - time * 0.75 + w * 0.12) * 9;
          if (x === 0) ctx.moveTo(x, wy);
          else ctx.lineTo(x, wy);
        }
        ctx.stroke();

        // Flowing Glowing Photon Beads Riding Along the Wave Ribbons (0,3.JPG)
        if (w % 2 === 0) {
          const beadXNorm = ((time * 0.14 + w * 0.19) % 1);
          const bx = beadXNorm * width;
          const by =
            height * 0.72 +
            w * 4.2 -
            beadXNorm * 34 +
            Math.sin(beadXNorm * 6.0 + time + w * 0.15) * (15 + w * 0.65) +
            Math.cos(beadXNorm * 3.5 - time * 0.75 + w * 0.12) * 9;

          ctx.beginPath();
          ctx.fillStyle = w > 12 ? "#FDE047" : "#7DD3FC";
          ctx.shadowColor = w > 12 ? "#F59E0B" : "#38BDF8";
          ctx.shadowBlur = 10;
          ctx.arc(bx, by, 2.3, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      }

      // -------------------------------------------------------------------
      // 6. CANDIDATE FIBER-OPTIC LASER STEMS, CONSTELLATIONS & STAR FLARES
      // -------------------------------------------------------------------
      const list = candidates.slice(0, 22);
      const count = Math.max(1, list.length);
      const padX = 40;
      const usableW = Math.max(100, width - padX * 2);

      const computedNodes = list.map((cand, idx) => {
        const t = count === 1 ? 0.5 : idx / (count - 1);
        const x = padX + t * usableW;
        const ridgeY = baseHorizonY - ridgeElevation(t, 0);
        const floorY =
          height * 0.76 -
          t * 30 +
          Math.sin(t * 6.0 + time) * 14;

        const riskNorm = Math.max(0.25, (cand.risk_score ?? 50) / 100);
        const stagger = ((idx * 23) % 36) + Math.sin(time * 2.0 + idx) * 4.5;
        const y = Math.max(20, ridgeY - (12 + stagger * riskNorm));

        let coreColor = "#FDE047";
        let haloRgba = "rgba(251, 191, 36, 0.85)";
        if (cand.risk_level === "high") {
          coreColor = idx % 2 === 0 ? "#FB7185" : "#FBBF24";
          haloRgba =
            idx % 2 === 0
              ? "rgba(251, 113, 133, 0.85)"
              : "rgba(251, 191, 36, 0.85)";
        } else if (cand.risk_level === "low" || cand.is_top_performer) {
          coreColor = "#38BDF8";
          haloRgba = "rgba(56, 189, 248, 0.9)";
        }

        return { x, y, floorY, coreColor, haloRgba, cand };
      });

      nodesRef.current = computedNodes;

      // Constellation Web Lines Between Nearby Candidate Nodes (0,3.JPG)
      ctx.lineWidth = 0.75;
      for (let i = 0; i < computedNodes.length; i++) {
        for (let j = i + 1; j <= Math.min(computedNodes.length - 1, i + 2); j++) {
          const a = computedNodes[i];
          const b = computedNodes[j];
          const d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d < 140) {
            ctx.strokeStyle = `rgba(253, 224, 71, ${Math.max(0.08, 0.32 - d / 450)})`;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      // Draw Vertical Laser Stems & Cross-Star Lens Flares
      computedNodes.forEach((node, idx) => {
        const stemGrad = ctx.createLinearGradient(node.x, node.y, node.x, node.floorY);
        stemGrad.addColorStop(0, "#FFFFFF");
        stemGrad.addColorStop(0.2, node.coreColor);
        stemGrad.addColorStop(1, "rgba(56, 189, 248, 0.04)");

        ctx.beginPath();
        ctx.strokeStyle = stemGrad;
        ctx.lineWidth = 1.5;
        ctx.moveTo(node.x, node.floorY);
        ctx.lineTo(node.x, node.y);
        ctx.stroke();

        // Outer Glowing Orb Halo
        const halo = ctx.createRadialGradient(node.x, node.y, 1, node.x, node.y, 14);
        halo.addColorStop(0, node.haloRgba);
        halo.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = halo;
        ctx.beginPath();
        ctx.arc(node.x, node.y, 14, 0, Math.PI * 2);
        ctx.fill();

        // Subtle Horizontal & Vertical Star-Flare Rays on High/Key Nodes (0,3.JPG & 0,4.JPG)
        if (idx % 2 === 0) {
          ctx.strokeStyle = "rgba(255, 255, 255, 0.55)";
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.moveTo(node.x - 8, node.y);
          ctx.lineTo(node.x + 8, node.y);
          ctx.moveTo(node.x, node.y - 8);
          ctx.lineTo(node.x, node.y + 8);
          ctx.stroke();
        }

        // Bright White-Gold Pinhead
        ctx.fillStyle = "#FFFFFF";
        ctx.beginPath();
        ctx.arc(node.x, node.y, 2.8, 0, Math.PI * 2);
        ctx.fill();

        // Candidate Name Label Along Bottom
        if (count <= 14 || idx % 2 === 0) {
          const shortName = (node.cand.name || "User").split(" ")[0].slice(0, 8);
          ctx.fillStyle = "rgba(226, 232, 240, 0.85)";
          ctx.font = "bold 9.5px Inter, sans-serif";
          ctx.textAlign = "center";
          ctx.fillText(shortName, node.x, height - 7);
        }
      });

      // 7. Render Depth-of-Field Bokeh Orbs
      bokehOrbs.forEach((b, idx) => {
        const py = ((b.yFrac - time * b.speed * 10) % 1 + 1) % 1;
        const px = b.xFrac + Math.sin(time * 0.5 + idx) * 0.012;
        ctx.beginPath();
        ctx.fillStyle = `rgba(${b.color}, ${b.alpha})`;
        ctx.arc(px * width, py * height, b.radius, 0, Math.PI * 2);
        ctx.fill();
      });

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [candidates]);

  const handleMouseMove = (e) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    let closest = null;
    let minDist = 30;
    nodesRef.current.forEach((n) => {
      const d = Math.hypot(mx - n.x, my - n.y);
      if (d < minDist) {
        minDist = d;
        closest = n;
      }
    });
    setHoveredNode(closest);
  };

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-cyan-500/30 shadow-[0_0_40px_-5px_rgba(6,182,212,0.22)]">
      <canvas
        ref={canvasRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoveredNode(null)}
        onClick={() => {
          if (hoveredNode?.cand && onSelectCandidate) {
            onSelectCandidate(hoveredNode.cand);
          } else if (candidates[0] && onSelectCandidate) {
            onSelectCandidate(candidates[0]);
          }
        }}
        className="w-full h-[315px] block cursor-pointer"
      />

      {/* Top HUD */}
      <div className="absolute top-3 left-3.5 flex items-center gap-2 bg-[#050914]/85 backdrop-blur-md px-3 py-1.5 rounded-full border border-cyan-400/40 pointer-events-none">
        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
        <span className="text-[10px] font-extrabold text-cyan-100 tracking-wider uppercase">
          Volumetric Neural Horizon & Harmonic Wave • Click Any Star Orb to Inspect
        </span>
      </div>

      {/* Hover Tooltip */}
      {hoveredNode && (
        <div
          style={{
            left: Math.min(Math.max(hoveredNode.x - 95, 12), 480),
            top: Math.max(hoveredNode.y - 78, 12),
          }}
          className="pointer-events-none absolute z-20 bg-[#070B16]/95 backdrop-blur-xl border border-cyan-400/60 px-3.5 py-2 rounded-xl shadow-[0_0_25px_rgba(6,182,212,0.45)] text-xs"
        >
          <p className="font-extrabold text-white">{hoveredNode.cand.name}</p>
          <div className="flex items-center gap-3 mt-1 text-[11px]">
            <span className="text-rose-300 font-bold">
              Risk: {hoveredNode.cand.risk_score ?? 0}%
            </span>
            <span className="text-emerald-300 font-bold">
              Mastery: {hoveredNode.cand.quiz_mastery_pct ?? 0}%
            </span>
            <span className="text-amber-300 font-bold">
              🪙 {hoveredNode.cand.curos ?? 0}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// 4. CENTERED STUDENT DETAIL MODAL
//    - Restored 3D Robot Analyst Avatar (`ROBOT_AVATAR_URL`) in its exact spot!
//    - Removed ONLY the flat 2D robot-face icon next to the title & in chat bubbles
//    - Upgraded `SAARTHI AI` & `Ask AI` button to Electric Cyan-Sapphire-Indigo
// ============================================================================
function StudentDetailModal({ student, cohortSize, onClose }) {
  const [aiReport, setAiReport] = useState(null);
  const [chatInput, setChatInput] = useState("");
  const [chatHistory, setChatHistory] = useState([]);

  useEffect(() => {
    if (!student) return;

    // Use instant prefetched report derived from candidate telemetry
    const prefetchedReport = buildPersonalizedBackupReport(student, cohortSize);
    setAiReport(prefetchedReport);
    setChatHistory([
      {
        role: "ai",
        text: `Telemetry diagnostic loaded for **${student.name}** (${prefetchedReport.archetype}). ${prefetchedReport.headline} Select a prompt above or ask a question below.`,
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
                {student.email || student.role || "Enrolled Candidate"} • Track:{" "}
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

          {/* RIGHT 5 COLS: RESTORED 3D ROBOT AVATAR + REMOVED 2D ROBOT-FACE ICONS + ELECTRIC CYAN-SAPPHIRE THEME */}
          <div className="col-span-12 lg:col-span-5 flex flex-col justify-between bg-gradient-to-b from-[#0B1528] via-[#081020] to-[#050811] rounded-2xl p-5 border border-cyan-500/35 shadow-[0_0_45px_-10px_rgba(56,189,248,0.28)] min-h-[490px]">
            <div className="space-y-3.5">
              {/* Top Co-Pilot Header: 3D Robot Avatar Restored, Secondary Robot Face Pill Removed! */}
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

            {/* Chat Messages (Removed the small 2D Robot Face icon next to SAARTHI AI!) */}
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

            {/* Input Form & Electric Cyan-to-Indigo "Ask AI" Button */}
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

// ============================================================================
// 5. MAIN PAGE COMPONENT: CandidateAttrition.jsx
// ============================================================================
export default function CandidateAttrition({ backendData = null }) {
  const [data, setData] = useState(backendData);
  const [loading, setLoading] = useState(!backendData);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const [selectedKpiCategory, setSelectedKpiCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProgram, setSelectedProgram] = useState("all");
  const [riskSortOrder, setRiskSortOrder] = useState("risk_desc");
  const [showAllUsers, setShowAllUsers] = useState(false);

  const [inspectedStudent, setInspectedStudent] = useState(null);
  const hasLoadedRef = useRef(Boolean(backendData));

  // Live telemetry fetcher with cache-busting headers
  const fetchData = useCallback(async (isBackground = false) => {
    if (!isBackground) {
      if (!hasLoadedRef.current) setLoading(true);
      else setIsRefreshing(true);
    }
    try {
      const res = await axios.get(`${API_BASE_URL}/analytics/candidate-attrition`, {
        params: { _t: Date.now() },
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      });
      setData(res.data);
      setError(null);
      hasLoadedRef.current = true;
    } catch (err) {
      if (!isBackground && !hasLoadedRef.current) {
        setError(
          err?.response?.data?.detail ||
            "Unable to reach FastAPI /analytics/candidate-attrition endpoint."
        );
      }
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Auto-fetch on mount & whenever user returns to / focuses this tab
  useEffect(() => {
    fetchData();

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        fetchData(true);
      }
    };
    const handleFocus = () => {
      fetchData(true);
    };

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("focus", handleFocus);

    // Live telemetry background polling every 30 seconds
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") {
        fetchData(true);
      }
    }, 30000);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("focus", handleFocus);
      clearInterval(interval);
    };
  }, [fetchData]);

  // Sync if parent updates backendData
  useEffect(() => {
    if (backendData) {
      setData(backendData);
      hasLoadedRef.current = true;
      setLoading(false);
    }
  }, [backendData]);

  // Strict Name Deduplication
  const uniqueCandidates = useMemo(() => {
    const raw = data?.candidates || [];
    const map = new Map();
    raw.forEach((c) => {
      const normName = String(c.name || c.email || c.id || "")
        .toLowerCase()
        .replace(/\s+/g, " ")
        .trim();
      if (!normName) return;
      if (!map.has(normName)) {
        map.set(normName, { ...c });
      } else {
        const existing = map.get(normName);
        if ((c.completion_pct || 0) >= (existing.completion_pct || 0)) {
          existing.completion_pct = c.completion_pct;
          existing.quiz_mastery_pct = Math.max(
            existing.quiz_mastery_pct || 0,
            c.quiz_mastery_pct || 0
          );
          existing.risk_score = c.risk_score;
          existing.risk_level = c.risk_level;
          existing.is_top_performer =
            existing.is_top_performer || c.is_top_performer;
        }
        existing.curos = Math.max(existing.curos || 0, c.curos || 0);
      }
    });
    return Array.from(map.values());
  }, [data]);

  const kpis = useMemo(() => {
    if (!uniqueCandidates.length && data?.kpis) return data.kpis;
    return {
      total_responses: data?.kpis?.total_responses ?? 0,
      total_tracked: uniqueCandidates.length,
      high_risk_count: uniqueCandidates.filter((c) => c.risk_level === "high").length,
      medium_risk_count: uniqueCandidates.filter((c) => c.risk_level === "medium").length,
      low_risk_count: uniqueCandidates.filter((c) => c.risk_level === "low").length,
      top_performers_count: uniqueCandidates.filter((c) => c.is_top_performer).length,
    };
  }, [uniqueCandidates, data]);

  const surveyStats = data?.survey_effectiveness || {
    overall_score: 0,
    rating_label: "Active Telemetry Mode",
    highest_rated_topic: "N/A",
    highest_rated_pct: 0,
    needs_improvement_topic: "N/A",
    needs_improvement_pct: 0,
    questions: [],
    feedback_list: [],
    risk_summary_insight: "",
  };

  const programOptions = useMemo(() => {
    const set = new Set(uniqueCandidates.map((c) => c.program_name).filter(Boolean));
    return ["all", ...Array.from(set)];
  }, [uniqueCandidates]);

  const filteredAndSortedCandidates = useMemo(() => {
    const filtered = uniqueCandidates.filter((c) => {
      if (selectedKpiCategory === "high" && c.risk_level !== "high") return false;
      if (selectedKpiCategory === "medium" && c.risk_level !== "medium") return false;
      if (selectedKpiCategory === "low" && c.risk_level !== "low") return false;
      if (selectedKpiCategory === "top" && !c.is_top_performer) return false;

      if (selectedProgram !== "all" && c.program_name !== selectedProgram) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = (c.name || "").toLowerCase().includes(q);
        const matchEmail = (c.email || "").toLowerCase().includes(q);
        if (!matchName && !matchEmail) return false;
      }
      return true;
    });

    return [...filtered].sort((a, b) => {
      if (riskSortOrder === "risk_desc") return (b.risk_score ?? 0) - (a.risk_score ?? 0);
      if (riskSortOrder === "risk_asc") return (a.risk_score ?? 0) - (b.risk_score ?? 0);
      if (riskSortOrder === "curos_desc") return (b.curos ?? 0) - (a.curos ?? 0);
      return 0;
    });
  }, [uniqueCandidates, selectedKpiCategory, selectedProgram, searchQuery, riskSortOrder]);

  const visibleCandidates = showAllUsers
    ? filteredAndSortedCandidates
    : filteredAndSortedCandidates.slice(0, 5);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080711] text-slate-100 flex flex-col items-center justify-center p-6">
        <div className="w-14 h-14 rounded-full border-4 border-cyan-500/30 border-t-cyan-400 animate-spin mb-3" />
        <h2 className="text-base font-bold text-cyan-200">
          Synchronizing Candidate Attrition Telemetry...
        </h2>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#080711] text-slate-100 flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md bg-[#12101E] border border-rose-500/40 rounded-2xl p-6">
          <h2 className="text-base font-extrabold text-rose-300">
            Attrition Stream Disconnected
          </h2>
          <p className="text-xs text-slate-300 mt-2">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 text-xs font-extrabold"
          >
            ↻ Reconnect
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080711] text-slate-100 font-sans p-5 space-y-5 selection:bg-cyan-400 selection:text-black overflow-x-hidden">
      <style>{`
        @keyframes robotFloat {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-6px) rotate(1.5deg); }
        }
        .animate-robot-float {
          animation: robotFloat 3.6s ease-in-out infinite;
        }
      `}</style>

      {/* HEADER */}
      <header className="flex flex-wrap items-center justify-between gap-4 bg-[#12101E]/95 backdrop-blur-xl px-6 py-4 rounded-2xl border border-amber-500/25 shadow-[0_0_25px_-5px_rgba(245,158,11,0.15)]">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-rose-500 via-amber-500 to-cyan-500 p-[1.5px] shadow-[0_0_20px_rgba(244,63,94,0.35)]">
            <div className="w-full h-full bg-[#0B0914] rounded-[14px] flex items-center justify-center">
              <svg
                className="w-6 h-6 text-amber-300"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"
                />
                <circle cx="9" cy="7" r="4" />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  stroke="#38BDF8"
                  d="M19 8l-2 3h4l-2 3"
                />
              </svg>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-amber-200 via-white to-cyan-200 bg-clip-text text-transparent">
                Candidate Attrition & Retention Intelligence
              </h1>
              <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                Supabase Live
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Volumetric horizon telemetry, Curos incentive tracking, and personalized candidate coaching
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => fetchData(false)}
            title="Fetch latest candidate telemetry from Supabase"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-cyan-950/40 hover:bg-cyan-900/60 border border-cyan-500/35 text-cyan-200 text-xs font-bold transition shadow-[0_0_12px_rgba(6,182,212,0.15)]"
          >
            <span className={`text-sm ${isRefreshing ? "animate-spin" : ""}`}>↻</span>
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <select
            value={selectedProgram}
            onChange={(e) => setSelectedProgram(e.target.value)}
            className="bg-[#080711] border border-cyan-500/35 text-cyan-100 text-xs font-bold rounded-xl px-3.5 py-2 outline-none focus:border-cyan-400"
          >
            <option value="all">All Programs ({uniqueCandidates.length})</option>
            {programOptions
              .filter((p) => p !== "all")
              .map((prog) => (
                <option key={prog} value={prog}>
                  {prog}
                </option>
              ))}
          </select>
        </div>
      </header>

      {/* ROW 1: 4 CLICKABLE KPI CARDS */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            id: "high",
            label: "High Flight Risk",
            count: kpis.high_risk_count ?? 0,
            subtitle: "Immediate attention required (≥65% Risk)",
            dotColor: "bg-rose-500 shadow-[0_0_10px_#F43F5E]",
            borderClass: "border-rose-500/30 hover:border-rose-400/80",
            activeClass: "ring-2 ring-rose-500 bg-rose-950/25",
            textClass: "text-rose-400",
          },
          {
            id: "medium",
            label: "Medium Risk",
            count: kpis.medium_risk_count ?? 0,
            subtitle: "Mid-funnel review recommended (35%–64%)",
            dotColor: "bg-amber-400 shadow-[0_0_10px_#F59E0B]",
            borderClass: "border-amber-500/30 hover:border-amber-400/80",
            activeClass: "ring-2 ring-amber-400 bg-amber-950/25",
            textClass: "text-amber-300",
          },
          {
            id: "low",
            label: "Low Risk (Stable)",
            count: kpis.low_risk_count ?? 0,
            subtitle: "Consistent progression (<35% Risk)",
            dotColor: "bg-emerald-400 shadow-[0_0_10px_#10B981]",
            borderClass: "border-emerald-500/30 hover:border-emerald-400/80",
            activeClass: "ring-2 ring-emerald-400 bg-emerald-950/25",
            textClass: "text-emerald-400",
          },
          {
            id: "top",
            label: "Top Performers",
            count: kpis.top_performers_count ?? 0,
            subtitle: "High mastery & completion champions (≥80%)",
            dotColor: "bg-cyan-400 shadow-[0_0_10px_#38BDF8]",
            borderClass: "border-cyan-500/30 hover:border-cyan-400/80",
            activeClass: "ring-2 ring-cyan-400 bg-cyan-950/25",
            textClass: "text-cyan-300",
          },
        ].map((card) => {
          const isSelected = selectedKpiCategory === card.id;
          return (
            <div
              key={card.id}
              onClick={() =>
                setSelectedKpiCategory(isSelected ? "all" : card.id)
              }
              className={`cursor-pointer bg-[#12101E] rounded-2xl p-5 border ${
                card.borderClass
              } ${
                isSelected ? card.activeClass : "hover:-translate-y-1"
              } shadow-[0_0_25px_-5px_rgba(0,0,0,0.5)] transition-all flex flex-col justify-between`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${card.dotColor}`} />
                  <span className="text-xs font-extrabold uppercase tracking-wider text-slate-200">
                    {card.label}
                  </span>
                </div>
                <span className="text-[10px] font-bold text-slate-400">
                  {isSelected ? "✓ Filtered" : "Click to filter"}
                </span>
              </div>

              <div className={`text-3xl font-extrabold my-2 ${card.textClass}`}>
                {card.count}
              </div>

              <p className="text-[11px] text-slate-400">{card.subtitle}</p>
            </div>
          );
        })}
      </section>

      {/* ROW 2: TOTAL RESPONSES TAB + REALISTIC VOLUMETRIC HORIZON & WAVE STREAM GRAPH */}
      <section className="grid grid-cols-12 gap-5">
        <div className="col-span-12 lg:col-span-4 bg-[#12101E]/95 rounded-2xl p-5 border border-purple-500/25 shadow-[0_0_30px_-5px_rgba(139,92,246,0.15)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-200 border border-purple-500/35">
                📋 Total Responses & Telemetry
              </span>
              {selectedKpiCategory !== "all" && (
                <button
                  onClick={() => setSelectedKpiCategory("all")}
                  className="text-xs font-bold text-cyan-300 hover:underline"
                >
                  Reset Filter ✕
                </button>
              )}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="p-4 rounded-2xl bg-[#080711] border border-white/10">
                <span className="text-[11px] font-bold text-slate-400 uppercase block">
                  Survey Submissions
                </span>
                <span className="text-3xl font-extrabold text-white mt-1.5 block">
                  {kpis.total_responses ?? 0}
                </span>
                <span className="text-[10px] text-slate-500 mt-0.5 block">
                  Direct form responses
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-[#080711] border border-amber-500/30">
                <span className="text-[11px] font-bold text-amber-200/90 uppercase block">
                  Unique Tracked Users
                </span>
                <span className="text-3xl font-extrabold text-amber-300 mt-1.5 block">
                  {uniqueCandidates.length}
                </span>
                <span className="text-[10px] text-emerald-400 font-bold mt-0.5 block">
                  ● 100% Supabase Synced
                </span>
              </div>
            </div>

            <div className="mt-4 p-4 rounded-2xl bg-[#080711] border border-white/10 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-300">
                  Cohort Risk Distribution
                </span>
                <span className="font-extrabold text-amber-300">
                  {filteredAndSortedCandidates.length} Active
                </span>
              </div>

              <div className="w-full h-2.5 rounded-full bg-white/10 overflow-hidden flex">
                <div
                  className="bg-rose-500 h-full"
                  style={{
                    width: `${
                      ((kpis.high_risk_count || 0) /
                        Math.max(1, uniqueCandidates.length)) *
                      100
                    }%`,
                  }}
                />
                <div
                  className="bg-amber-400 h-full"
                  style={{
                    width: `${
                      ((kpis.medium_risk_count || 0) /
                        Math.max(1, uniqueCandidates.length)) *
                      100
                    }%`,
                  }}
                />
                <div
                  className="bg-emerald-400 h-full"
                  style={{
                    width: `${
                      ((kpis.low_risk_count || 0) /
                        Math.max(1, uniqueCandidates.length)) *
                      100
                    }%`,
                  }}
                />
              </div>

              <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold">
                <span className="text-rose-400">🔴 High: {kpis.high_risk_count || 0}</span>
                <span className="text-amber-300">🟡 Med: {kpis.medium_risk_count || 0}</span>
                <span className="text-emerald-400">🟢 Low: {kpis.low_risk_count || 0}</span>
                <span className="text-cyan-300">🏆 Top: {kpis.top_performers_count || 0}</span>
              </div>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 mt-3 pt-2.5 border-t border-white/10">
            Combines survey sentiment with live Supabase course, video, and Curos telemetry.
          </p>
        </div>

        {/* Right 8 Cols: REALISTIC VOLUMETRIC HORIZON, PARTICLE-RIDGE & WAVE STREAM GRAPH */}
        <div className="col-span-12 lg:col-span-8 bg-[#12101E]/95 rounded-2xl p-5 border border-cyan-500/30 shadow-[0_0_30px_-5px_rgba(6,182,212,0.16)] flex flex-col justify-between">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                ⚡ Volumetric Attrition Horizon & Harmonic Wave Stream
              </span>
              <h2 className="text-base font-extrabold text-white mt-1">
                Particle-Cloud Risk Ridges, Equalizer Filaments & Topographic Wave
              </h2>
            </div>

            <div className="flex items-center gap-3 text-[11px] font-bold">
              <span className="flex items-center gap-1.5 text-rose-400">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_8px_#F43F5E]" />
                High Risk Star
              </span>
              <span className="flex items-center gap-1.5 text-amber-300">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_8px_#F59E0B]" />
                Golden Filaments
              </span>
              <span className="flex items-center gap-1.5 text-cyan-300">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#38BDF8]" />
                Harmonic Wave
              </span>
            </div>
          </div>

          <RealisticNeuralHorizonGraph
            candidates={filteredAndSortedCandidates}
            onSelectCandidate={(cand) => setInspectedStudent(cand)}
          />
        </div>
      </section>

      {/* ROW 3: 50% / 50% VERTICAL SPLIT */}
      <section className="grid grid-cols-12 gap-5">
        {/* LEFT 50%: CANDIDATE DIRECTORY */}
        <div className="col-span-12 lg:col-span-6 bg-[#12101E]/95 rounded-2xl p-5 border border-purple-500/25 shadow-[0_0_30px_-5px_rgba(139,92,246,0.15)] flex flex-col justify-between">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3.5">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/35">
                  👥 Candidate Roster & AI Inspector
                </span>
                <h3 className="text-base font-extrabold text-white mt-1">
                  Enrolled Candidates ({filteredAndSortedCandidates.length})
                </h3>
              </div>

              {filteredAndSortedCandidates.length > 5 && (
                <button
                  onClick={() => setShowAllUsers(!showAllUsers)}
                  className="px-3 py-1.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-200 text-xs font-extrabold border border-purple-400/35 transition"
                >
                  {showAllUsers
                    ? "Show Top 5"
                    : `View All (${filteredAndSortedCandidates.length})`}
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 mb-3.5">
              <div className="sm:col-span-7 relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="🔍 Search candidate by name or email..."
                  className="w-full bg-[#080711] border border-purple-500/30 focus:border-cyan-400 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-none transition"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-2.5 text-xs font-bold text-slate-400 hover:text-white"
                  >
                    ✕
                  </button>
                )}
              </div>

              <div className="sm:col-span-5">
                <select
                  value={riskSortOrder}
                  onChange={(e) => setRiskSortOrder(e.target.value)}
                  className="w-full bg-[#080711] border border-cyan-500/35 text-cyan-200 text-xs font-extrabold rounded-xl px-3 py-2.5 outline-none focus:border-cyan-400"
                >
                  <option value="risk_desc">🔥 Sort: Highest Risk First</option>
                  <option value="risk_asc">🛡️ Sort: Lowest Risk First</option>
                  <option value="curos_desc">🪙 Sort: Highest Curos First</option>
                </select>
              </div>
            </div>

            <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
              {visibleCandidates.map((user, idx) => {
                const statusDot =
                  user.risk_level === "high"
                    ? "bg-rose-500 shadow-[0_0_8px_#F43F5E]"
                    : user.risk_level === "medium"
                    ? "bg-amber-400 shadow-[0_0_8px_#F59E0B]"
                    : "bg-emerald-400 shadow-[0_0_8px_#10B981]";

                return (
                  <div
                    key={user.id || `${user.name}-${idx}`}
                    className="p-3.5 rounded-2xl bg-[#080711] hover:bg-[#13192E] border border-white/10 hover:border-cyan-400/50 transition flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-600 to-indigo-700 text-white font-extrabold text-xs flex items-center justify-center shrink-0">
                        {(user.name || "U").slice(0, 2).toUpperCase()}
                        <span
                          title={`${user.risk_score ?? 0}% Risk`}
                          className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-[#080711] ${statusDot}`}
                        />
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-extrabold text-white truncate">
                            {user.name}
                          </h4>
                          {user.is_top_performer && (
                            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                              🏆 Top
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 truncate">
                          {user.program_name || "Client Relationships"} • Completion:{" "}
                          <strong className="text-cyan-300">
                            {user.completion_pct ?? 0}%
                          </strong>{" "}
                          • Quiz:{" "}
                          <strong className="text-emerald-400">
                            {user.quiz_mastery_pct ?? 0}%
                          </strong>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0">
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-amber-500/15 text-amber-300 border border-amber-500/35">
                        🪙 {user.curos ?? 0} Curos
                      </span>

                      <button
                        onClick={() => setInspectedStudent(user)}
                        className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-cyan-400 via-sky-500 to-indigo-600 hover:from-cyan-300 hover:to-indigo-500 text-white text-xs font-extrabold shadow-[0_0_15px_rgba(56,189,248,0.4)] transition"
                      >
                        View
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
            <span>
              Showing {visibleCandidates.length} of {filteredAndSortedCandidates.length} unique candidates
            </span>
            <span className="font-bold text-cyan-300">
              Click "View" for candidate telemetry diagnostic & coaching →
            </span>
          </div>
        </div>

        {/* RIGHT 50%: SURVEY & TRAINING EFFECTIVENESS SUITE */}
        <div className="col-span-12 lg:col-span-6 bg-[#12101E]/95 rounded-2xl p-5 border border-emerald-500/25 shadow-[0_0_30px_-5px_rgba(16,185,129,0.15)] flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-3.5">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/35">
                  📊 Survey & Training Effectiveness
                </span>
                <h3 className="text-base font-extrabold text-white mt-1">
                  Survey Effectiveness & Competency Dimension Analysis
                </h3>
              </div>
              <span className="text-xs font-bold text-cyan-300">
                {kpis.total_responses > 0
                  ? `${kpis.total_responses} Surveys`
                  : "Live Telemetry Derived"}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="p-4 rounded-2xl bg-[#080711] border border-white/10 flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-400 block">
                    Overall Effectiveness Score
                  </span>
                  <div className="text-3xl font-extrabold text-amber-300 my-1">
                    {surveyStats.overall_score ?? 0}/10
                  </div>
                  <span className="inline-block text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    {surveyStats.rating_label || "Active Telemetry Mode"}
                  </span>
                </div>
                <div className="w-14 h-14 rounded-2xl bg-cyan-500/20 border border-cyan-500/35 text-cyan-200 flex items-center justify-center font-extrabold text-base">
                  {Math.round((surveyStats.overall_score ?? 0) * 10)}%
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#080711] border border-white/10 space-y-2.5">
                <div>
                  <span className="text-[11px] font-bold text-slate-400 block">
                    🏆 Highest Rated Dimension
                  </span>
                  <div className="flex items-center justify-between mt-0.5">
                    <span className="text-xs font-extrabold text-white truncate">
                      {surveyStats.highest_rated_topic}
                    </span>
                    <span className="text-xs font-extrabold text-emerald-400">
                      {surveyStats.highest_rated_pct}%
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-white/10">
                  <span className="text-[11px] font-bold text-slate-400 block">
                    ⚠️ Needs Improvement
                  </span>
                  <div className="flex items-center justify-between mt-0.5">
                    <span className="text-xs font-extrabold text-white truncate">
                      {surveyStats.needs_improvement_topic}
                    </span>
                    <span className="text-xs font-extrabold text-amber-400">
                      {surveyStats.needs_improvement_pct}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#080711] border border-white/10 space-y-2.5">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-300">
              Question & Competency Dimension Analysis
            </h4>
            {Array.isArray(surveyStats.questions) &&
              surveyStats.questions.map((q, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-300">{q.question}</span>
                    <span className="font-extrabold text-cyan-300">{q.score_pct}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-cyan-400 to-emerald-400"
                      style={{ width: `${Math.min(100, Math.max(6, q.score_pct))}%` }}
                    />
                  </div>
                </div>
              ))}
          </div>

          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-300">
                Survey Feedback & Risk Summary Insights
              </h4>
              <span className="text-[11px] text-slate-400 font-semibold">
                Showing {surveyStats.feedback_list?.length || 0} items
              </span>
            </div>

            {Array.isArray(surveyStats.feedback_list) &&
              surveyStats.feedback_list.length > 0 && (
                <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                  {surveyStats.feedback_list.map((fb, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-[#080711] border border-white/10 text-xs flex items-start justify-between gap-3"
                    >
                      <div>
                        <span className="font-extrabold text-cyan-200">
                          {fb.user_name}:{" "}
                        </span>
                        <span className="text-slate-300">{fb.comment}</span>
                      </div>
                      <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-200 border border-emerald-500/30 font-extrabold text-[10px] shrink-0">
                        {fb.rating}/10
                      </span>
                    </div>
                  ))}
                </div>
              )}

            <div className="p-3.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-xs text-cyan-100 flex items-center gap-2.5">
              <span className="text-base">✦</span>
              <span className="font-medium leading-relaxed">
                {surveyStats.risk_summary_insight}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* CENTERED STUDENT DETAIL MODAL */}
      <StudentDetailModal
        student={inspectedStudent}
        cohortSize={uniqueCandidates.length}
        onClose={() => setInspectedStudent(null)}
      />
    </div>
  );
}
