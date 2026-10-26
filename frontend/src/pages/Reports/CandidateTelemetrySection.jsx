import React, { useState, useMemo, useRef, useEffect } from "react";
import CandidateReportModal from "./CandidateReportModal";

// ============================================================================
// 1. VOLUMETRIC HORIZON & WAVE STREAM GRAPH FOR CANDIDATE TELEMETRY
// ============================================================================
function NeuralHorizonWaveGraph({ candidates = [], onSelectCandidate }) {
  const canvasRef = useRef(null);
  const [hoveredNode, setHoveredNode] = useState(null);
  const nodesRef = useRef([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animId;
    let time = 0;

    const render = () => {
      time += 0.02;
      const width = (canvas.width = canvas.parentElement.clientWidth || 780);
      const height = (canvas.height = 290);
      const baseHorizonY = height * 0.68;

      // 1. Abyss Background & Volumetric Glow
      const bgGrad = ctx.createLinearGradient(0, 0, width, height);
      bgGrad.addColorStop(0, "#03050F");
      bgGrad.addColorStop(0.45, "#070B1E");
      bgGrad.addColorStop(0.75, "#0F0822");
      bgGrad.addColorStop(1, "#02040A");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Subtle Blueprint Grid
      ctx.strokeStyle = "rgba(56, 189, 248, 0.05)";
      ctx.lineWidth = 0.8;
      for (let gx = width * 0.45; gx < width; gx += 28) {
        ctx.beginPath();
        ctx.moveTo(gx, 0);
        ctx.lineTo(gx, baseHorizonY);
        ctx.stroke();
      }
      for (let gy = 16; gy < baseHorizonY; gy += 28) {
        ctx.beginPath();
        ctx.moveTo(width * 0.45, gy);
        ctx.lineTo(width, gy);
        ctx.stroke();
      }

      // Backlight Glows
      const backGlowRight = ctx.createRadialGradient(
        width * 0.78,
        baseHorizonY - 50,
        10,
        width * 0.78,
        baseHorizonY - 50,
        width * 0.42
      );
      backGlowRight.addColorStop(0, "rgba(251, 146, 60, 0.25)");
      backGlowRight.addColorStop(0.5, "rgba(225, 29, 72, 0.12)");
      backGlowRight.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = backGlowRight;
      ctx.fillRect(0, 0, width, height);

      const backGlowLeft = ctx.createRadialGradient(
        width * 0.22,
        baseHorizonY - 15,
        10,
        width * 0.22,
        baseHorizonY - 15,
        width * 0.36
      );
      backGlowLeft.addColorStop(0, "rgba(56, 189, 248, 0.18)");
      backGlowLeft.addColorStop(0.5, "rgba(139, 92, 246, 0.1)");
      backGlowLeft.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = backGlowLeft;
      ctx.fillRect(0, 0, width, height);

      // 2. Ridge elevation function
      const ridgeElevation = (xNorm, layer = 0) => {
        const p1 = Math.exp(-Math.pow((xNorm - 0.12) / 0.06, 2)) * 38;
        const p2 = Math.exp(-Math.pow((xNorm - 0.32) / 0.075, 2)) * 62;
        const p3 = Math.exp(-Math.pow((xNorm - 0.58) / 0.085, 2)) * 82;
        const p4 = Math.exp(-Math.pow((xNorm - 0.84) / 0.078, 2)) * 120;
        const slopeAscent = Math.pow(xNorm, 1.35) * 30;
        const microWave =
          Math.sin(xNorm * 20 + time * 1.1 + layer * 1.3) * 6 +
          Math.cos(xNorm * 10 - time * 0.8 + layer) * 4;
        return Math.max(10, p1 + p2 + p3 + p4 + slopeAscent + microWave);
      };

      // 3. Volumetric mountain layers
      for (let layer = 2; layer >= 0; layer--) {
        const scaleH = layer === 0 ? 1.0 : layer === 1 ? 0.74 : 0.52;
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

        const volGrad = ctx.createLinearGradient(0, baseHorizonY - 150, 0, baseHorizonY);
        if (layer === 0) {
          volGrad.addColorStop(0, "rgba(251, 113, 133, 0.3)");
          volGrad.addColorStop(0.5, "rgba(245, 158, 11, 0.14)");
          volGrad.addColorStop(1, "rgba(14, 165, 233, 0.0)");
        } else if (layer === 1) {
          volGrad.addColorStop(0, "rgba(168, 85, 247, 0.2)");
          volGrad.addColorStop(1, "rgba(15, 23, 42, 0.0)");
        } else {
          volGrad.addColorStop(0, "rgba(56, 189, 248, 0.14)");
          volGrad.addColorStop(1, "rgba(15, 23, 42, 0.0)");
        }
        ctx.fillStyle = volGrad;
        ctx.fill();
      }

      // Stippled particle field
      for (let sx = 10; sx < width; sx += 8) {
        const xn = sx / width;
        const elev = ridgeElevation(xn, 0);
        const topY = baseHorizonY - elev;
        const dotsInCol = Math.min(12, Math.floor(elev / 10));

        for (let d = 1; d <= dotsInCol; d++) {
          const frac = d / (dotsInCol + 1);
          const py = topY + frac * elev * 0.88;
          const alpha = (1 - frac) * 0.5;
          ctx.fillStyle =
            frac < 0.35
              ? `rgba(253, 186, 116, ${alpha})`
              : `rgba(244, 63, 94, ${alpha * 0.7})`;
          ctx.fillRect(sx, py, 1.3, 1.3);
        }
      }

      // 4. Equalizer filaments
      const numFilaments = 90;
      for (let i = 0; i < numFilaments; i++) {
        const xn = i / (numFilaments - 1);
        const fx = xn * width;
        const elev = ridgeElevation(xn, 0);
        const topY = baseHorizonY - elev;

        const pulse = Math.sin(time * 2.2 + i * 0.35) * 5;
        const botY = baseHorizonY + 12 + Math.sin(i * 0.4 + time) * 3;

        const filGrad = ctx.createLinearGradient(fx, topY, fx, botY);
        filGrad.addColorStop(0, "rgba(253, 224, 71, 0.75)");
        filGrad.addColorStop(0.35, "rgba(245, 158, 11, 0.45)");
        filGrad.addColorStop(0.7, "rgba(244, 63, 94, 0.25)");
        filGrad.addColorStop(1, "rgba(56, 189, 248, 0.0)");

        ctx.strokeStyle = filGrad;
        ctx.lineWidth = i % 4 === 0 ? 1.4 : 0.8;
        ctx.beginPath();
        ctx.moveTo(fx, topY - pulse * 0.4);
        ctx.lineTo(fx, botY);
        ctx.stroke();
      }

      // 5. Silky Flowing Cyan Wave Ribbons
      const numRibbons = 9;
      for (let r = 0; r < numRibbons; r++) {
        const rFrac = r / (numRibbons - 1);
        const yOffset = (rFrac - 0.5) * 44;
        const ribbonPhase = r * 0.45;

        ctx.beginPath();
        for (let x = 0; x <= width; x += 8) {
          const xn = x / width;
          const wave1 = Math.sin(xn * 9 - time * 1.5 + ribbonPhase) * 16;
          const wave2 = Math.cos(xn * 14 + time * 0.9 - ribbonPhase) * 9;
          const wave3 = Math.sin(xn * 4 + time * 0.5) * 12;
          const y = baseHorizonY + yOffset + wave1 + wave2 + wave3;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }

        const alpha = 0.25 + (1 - Math.abs(rFrac - 0.5) * 2) * 0.45;
        const ribbonGrad = ctx.createLinearGradient(0, 0, width, 0);
        ribbonGrad.addColorStop(0, `rgba(56, 189, 248, ${alpha * 0.2})`);
        ribbonGrad.addColorStop(0.3, `rgba(34, 211, 238, ${alpha})`);
        ribbonGrad.addColorStop(0.65, `rgba(96, 165, 250, ${alpha * 0.9})`);
        ribbonGrad.addColorStop(1, `rgba(168, 85, 247, ${alpha * 0.3})`);

        ctx.strokeStyle = ribbonGrad;
        ctx.lineWidth = 1.3 + (1 - Math.abs(rFrac - 0.5) * 2) * 1.6;
        ctx.stroke();
      }

      // 6. Candidate Telemetry Nodes (Stars with Laser Stems)
      const visibleCands = candidates.slice(0, 16);
      const computedNodes = [];

      visibleCands.forEach((cand, idx) => {
        const xn = 0.08 + (idx / Math.max(1, visibleCands.length - 1)) * 0.84;
        const cx = xn * width;
        const elev = ridgeElevation(xn, 0);
        const cy = baseHorizonY - elev - 12;

        const isChampion = cand.is_top_performer || (cand.completion_pct || 0) >= 70;
        const isAtRisk = cand.risk_level === "high" || (cand.risk_score || 0) >= 65;

        const nodeColor = isChampion
          ? "#10B981"
          : isAtRisk
          ? "#F43F5E"
          : "#38BDF8";

        // Vertical Laser Stem
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx, baseHorizonY + 18);
        ctx.strokeStyle = `${nodeColor}40`;
        ctx.lineWidth = 1;
        ctx.stroke();

        // Glowing Star Node
        ctx.beginPath();
        ctx.arc(cx, cy, 5.5, 0, Math.PI * 2);
        ctx.fillStyle = nodeColor;
        ctx.shadowColor = nodeColor;
        ctx.shadowBlur = 12;
        ctx.fill();
        ctx.shadowBlur = 0;

        // White core
        ctx.beginPath();
        ctx.arc(cx, cy, 2, 0, Math.PI * 2);
        ctx.fillStyle = "#FFFFFF";
        ctx.fill();

        computedNodes.push({
          x: cx,
          y: cy,
          candidate: cand,
          radius: 12,
        });
      });

      nodesRef.current = computedNodes;
      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [candidates]);

  const handleCanvasClick = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const clicked = nodesRef.current.find((n) => {
      const dist = Math.hypot(n.x - clickX, n.y - clickY);
      return dist <= n.radius + 6;
    });

    if (clicked && onSelectCandidate) {
      onSelectCandidate(clicked.candidate);
    }
  };

  const handleCanvasMouseMove = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    const hit = nodesRef.current.find((n) => {
      const dist = Math.hypot(n.x - mx, n.y - my);
      return dist <= n.radius + 6;
    });

    setHoveredNode(hit || null);
    canvas.style.cursor = hit ? "pointer" : "default";
  };

  return (
    <div className="relative w-full h-[290px] rounded-2xl overflow-hidden border border-cyan-500/25 shadow-[0_0_40px_-10px_rgba(6,182,212,0.2)] bg-[#03050F]">
      <canvas
        ref={canvasRef}
        onClick={handleCanvasClick}
        onMouseMove={handleCanvasMouseMove}
        onMouseLeave={() => setHoveredNode(null)}
        className="w-full h-full block"
      />

      {/* Floating Header Overlay */}
      <div className="absolute top-3.5 left-4 pointer-events-none flex items-center gap-2.5">
        <span className="text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/35">
          ⚡ Volumetric Candidate Topology & Horizon Stream
        </span>
        <span className="text-xs text-slate-400 font-medium">
          Click any glowing candidate star to open their individual diagnostic report
        </span>
      </div>

      {/* Tooltip on Hover */}
      {hoveredNode && (
        <div
          className="absolute z-20 pointer-events-none -translate-x-1/2 -translate-y-full mb-3 px-3 py-2 rounded-xl bg-[#090D1A]/95 border border-cyan-400/50 shadow-[0_0_20px_rgba(34,211,238,0.4)] text-xs text-white"
          style={{ left: hoveredNode.x, top: hoveredNode.y }}
        >
          <div className="font-extrabold text-cyan-200">
            {hoveredNode.candidate.name}
          </div>
          <div className="text-[11px] text-slate-300">
            Completion:{" "}
            <strong className="text-cyan-400">
              {hoveredNode.candidate.completion_pct ?? 0}%
            </strong>{" "}
            • Quiz:{" "}
            <strong className="text-emerald-400">
              {hoveredNode.candidate.quiz_mastery_pct ?? 0}%
            </strong>
          </div>
          <div className="text-[10px] text-amber-300 font-bold mt-0.5">
            🪙 {hoveredNode.candidate.curos ?? 0} Curos • Click to view report
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// 2. MAIN CANDIDATE TELEMETRY & INDIVIDUAL REPORTS SECTION COMPONENT
// ============================================================================
export default function CandidateTelemetrySection({
  candidates = [],
  loading = false,
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [programFilter, setProgramFilter] = useState("all");
  const [sortBy, setSortBy] = useState("risk_desc");
  const [inspectedCandidate, setInspectedCandidate] = useState(null);

  // Strict Name Deduplication
  const uniqueCandidates = useMemo(() => {
    const map = new Map();
    candidates.forEach((c) => {
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
  }, [candidates]);

  const kpis = useMemo(() => {
    return {
      total: uniqueCandidates.length,
      high_risk: uniqueCandidates.filter((c) => c.risk_level === "high").length,
      in_progress: uniqueCandidates.filter(
        (c) => (c.completion_pct || 0) > 0 && (c.completion_pct || 0) < 75
      ).length,
      champions: uniqueCandidates.filter((c) => c.is_top_performer).length,
    };
  }, [uniqueCandidates]);

  const programOptions = useMemo(() => {
    const set = new Set(uniqueCandidates.map((c) => c.program_name).filter(Boolean));
    return ["all", ...Array.from(set)];
  }, [uniqueCandidates]);

  const filteredCandidates = useMemo(() => {
    let list = [...uniqueCandidates];

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (c) =>
          (c.name || "").toLowerCase().includes(q) ||
          (c.email || "").toLowerCase().includes(q) ||
          (c.program_name || "").toLowerCase().includes(q)
      );
    }

    // Program filter
    if (programFilter !== "all") {
      list = list.filter((c) => c.program_name === programFilter);
    }

    // Category filter
    if (filterCategory === "at_risk") {
      list = list.filter((c) => c.risk_level === "high" || (c.risk_score || 0) >= 60);
    } else if (filterCategory === "in_progress") {
      list = list.filter(
        (c) => (c.completion_pct || 0) > 0 && (c.completion_pct || 0) < 75
      );
    } else if (filterCategory === "champions") {
      list = list.filter((c) => c.is_top_performer || (c.completion_pct || 0) >= 75);
    }

    // Sorting
    list.sort((a, b) => {
      if (sortBy === "risk_desc") return (b.risk_score || 0) - (a.risk_score || 0);
      if (sortBy === "comp_desc") return (b.completion_pct || 0) - (a.completion_pct || 0);
      if (sortBy === "quiz_desc") return (b.quiz_mastery_pct || 0) - (a.quiz_mastery_pct || 0);
      if (sortBy === "curos_desc") return (b.curos || 0) - (a.curos || 0);
      return (a.name || "").localeCompare(b.name || "");
    });

    return list;
  }, [uniqueCandidates, searchQuery, filterCategory, programFilter, sortBy]);

  return (
    <section className="bg-[#12101E]/95 rounded-2xl p-5 border border-cyan-500/25 shadow-[0_0_35px_-5px_rgba(6,182,212,0.18)] space-y-5">
      {/* SECTION HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-cyan-400 via-sky-500 to-indigo-600 p-[1.5px] shadow-[0_0_20px_rgba(56,189,248,0.4)]">
            <div className="w-full h-full bg-[#080B14] rounded-[14px] flex items-center justify-center">
              <svg className="w-6 h-6 text-cyan-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M22 21v-2a4 4 0 00-3-3.87" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 3.13a4 4 0 010 7.75" />
              </svg>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-extrabold text-white">
                Individual Candidate Reports & Performance Diagnostics
              </h2>
              <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/35">
                ✦ {uniqueCandidates.length} Tracked
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Select any candidate card below or on the horizon wave to inspect 5-axis radars, dynamic telemetry diagnostics, and personalized AI coaching
            </p>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setFilterCategory("all")}
            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition border ${
              filterCategory === "all"
                ? "bg-cyan-500/25 text-cyan-200 border-cyan-400/50 shadow-[0_0_15px_rgba(6,182,212,0.35)]"
                : "bg-[#090D1B] text-slate-400 border-white/10 hover:text-white"
            }`}
          >
            All Candidates ({kpis.total})
          </button>
          <button
            onClick={() => setFilterCategory("at_risk")}
            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition border ${
              filterCategory === "at_risk"
                ? "bg-rose-500/25 text-rose-200 border-rose-400/50 shadow-[0_0_15px_rgba(244,63,94,0.35)]"
                : "bg-[#090D1B] text-slate-400 border-white/10 hover:text-white"
            }`}
          >
            ⚠️ At-Risk ({kpis.high_risk})
          </button>
          <button
            onClick={() => setFilterCategory("in_progress")}
            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition border ${
              filterCategory === "in_progress"
                ? "bg-amber-500/25 text-amber-200 border-amber-400/50 shadow-[0_0_15px_rgba(245,158,11,0.35)]"
                : "bg-[#090D1B] text-slate-400 border-white/10 hover:text-white"
            }`}
          >
            ⚡ In-Progress ({kpis.in_progress})
          </button>
          <button
            onClick={() => setFilterCategory("champions")}
            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition border ${
              filterCategory === "champions"
                ? "bg-emerald-500/25 text-emerald-200 border-emerald-400/50 shadow-[0_0_15px_rgba(16,185,129,0.35)]"
                : "bg-[#090D1B] text-slate-400 border-white/10 hover:text-white"
            }`}
          >
            🏆 Champions ({kpis.champions})
          </button>
        </div>
      </div>

      {/* VOLUMETRIC HORIZON GRAPH */}
      <NeuralHorizonWaveGraph
        candidates={uniqueCandidates}
        onSelectCandidate={(cand) => setInspectedCandidate(cand)}
      />

      {/* SEARCH & CONTROLS BAR */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative w-full">
            <svg
              className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search candidate by name, email, or track..."
              className="w-full bg-[#080B16] border border-white/15 focus:border-cyan-400 rounded-xl pl-9 pr-3.5 py-2 text-xs text-white placeholder-slate-500 outline-none transition"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {programOptions.length > 2 && (
            <select
              value={programFilter}
              onChange={(e) => setProgramFilter(e.target.value)}
              className="bg-[#080B16] border border-white/15 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none"
            >
              <option value="all">All Tracks</option>
              {programOptions
                .filter((p) => p !== "all")
                .map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
            </select>
          )}

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-[#080B16] border border-white/15 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none"
          >
            <option value="risk_desc">Sort: Flight Risk (High → Low)</option>
            <option value="comp_desc">Sort: Course Completion %</option>
            <option value="quiz_desc">Sort: Quiz Accuracy %</option>
            <option value="curos_desc">Sort: Curos Balance</option>
            <option value="name_asc">Sort: Name (A → Z)</option>
          </select>
        </div>
      </div>

      {/* CANDIDATE CARDS GRID */}
      {filteredCandidates.length === 0 ? (
        <div className="p-8 text-center text-xs text-slate-400 bg-[#080711] rounded-2xl border border-white/10">
          No candidates match the selected filters or search query.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5 max-h-[460px] overflow-y-auto pr-1">
          {filteredCandidates.map((user) => {
            const isChampion = user.is_top_performer || (user.completion_pct || 0) >= 75;
            const isAtRisk = user.risk_level === "high" || (user.risk_score || 0) >= 60;

            return (
              <div
                key={user.id || user.user_id || user.name}
                className="p-3.5 rounded-2xl bg-[#090D1B] border border-white/10 hover:border-cyan-400/50 hover:bg-[#0C1226] transition-all flex flex-col justify-between group shadow-sm"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-400 via-sky-500 to-indigo-600 p-[1.5px] shrink-0">
                        <div className="w-full h-full bg-[#080B16] rounded-[10px] flex items-center justify-center font-extrabold text-cyan-300 text-xs">
                          {(user.name || "U").slice(0, 2).toUpperCase()}
                        </div>
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-extrabold text-white truncate group-hover:text-cyan-200 transition">
                          {user.name}
                        </h4>
                        <p className="text-[11px] text-slate-400 truncate">
                          {user.program_name || "Client Relationships"}
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-1.5">
                      {isChampion ? (
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/35">
                          🏆 Top
                        </span>
                      ) : isAtRisk ? (
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/35">
                          ⚠️ {user.risk_score ?? 80}%
                        </span>
                      ) : (
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/35">
                          ⚡ Active
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Progress bars & metrics */}
                  <div className="space-y-1.5 my-2.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">Completion</span>
                      <strong className="text-cyan-300 font-extrabold">
                        {user.completion_pct ?? 0}%
                      </strong>
                    </div>
                    <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-cyan-500 to-sky-400 rounded-full"
                        style={{ width: `${Math.min(100, user.completion_pct ?? 0)}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] pt-1">
                      <span className="text-slate-400">Quiz Accuracy</span>
                      <strong className="text-emerald-400 font-extrabold">
                        {user.quiz_mastery_pct ?? 0}%
                      </strong>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2.5 border-t border-white/5 mt-1">
                  <span className="px-2 py-0.5 rounded-md text-[11px] font-extrabold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                    🪙 {user.curos ?? 0} Curos
                  </span>

                  <button
                    onClick={() => setInspectedCandidate(user)}
                    className="px-3 py-1 rounded-xl bg-gradient-to-r from-cyan-400 via-sky-500 to-indigo-600 hover:from-cyan-300 hover:to-indigo-500 text-white text-[11px] font-extrabold shadow-[0_0_12px_rgba(56,189,248,0.4)] transition"
                  >
                    View Report →
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* POPUP INDIVIDUAL CANDIDATE REPORT MODAL */}
      <CandidateReportModal
        student={inspectedCandidate}
        cohortSize={uniqueCandidates.length}
        onClose={() => setInspectedCandidate(null)}
      />
    </section>
  );
}
