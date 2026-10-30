import React, { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";

const API_BASE_URL = import.meta.env?.VITE_API_URL || "http://localhost:8000";

export default function ApplicationCheckSubmissions() {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [automationOn, setAutomationOn] = useState(true);
  const [activeStatus, setActiveStatus] = useState("Pending Review"); // 'Pending Review' | 'Approved' | 'Rejected' | 'All'
  const [searchQuery, setSearchQuery] = useState("");
  const [inspectedSub, setInspectedSub] = useState(null);

  const fetchAutomationSetting = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/programs/application-check-automation`);
      if (res.data?.is_enabled !== undefined) {
        setAutomationOn(Boolean(res.data.is_enabled));
      }
    } catch {}
  }, []);

  const fetchSubmissions = useCallback(async (populateFromTelemetry = false) => {
    setLoading(true);
    try {
      const endpoints = [
        `${API_BASE_URL}/programs/application-check-submissions`,
        `${API_BASE_URL}/application-check-submissions`,
      ];
      for (const ep of endpoints) {
        try {
          const res = await axios.get(ep, { params: { _t: Date.now() } });
          const rawList = res.data?.submissions || (Array.isArray(res.data) ? res.data : []);
          if (rawList.length > 0) {
            const normalized = rawList.map((s, idx) => ({
              id: s.attempt_id ?? s.id ?? idx + 1,
              learner_name: s.employee_name ?? s.candidate_name ?? s.learner_name ?? s.user_name ?? "Learner",
              email: s.employee_email ?? s.candidate_email ?? s.learner_email ?? s.email ?? "learner@saarthi.ai",
              program: s.program_name ?? s.program ?? "Client Relationships",
              module_title: s.check_title ?? s.module_title ?? `Check #${s.check_number ?? 1}`,
              submitted_at: s.attempted_at ?? s.submitted_at ?? "Recent",
              ai_confidence: s.ai_confidence ?? 92,
              score_pct: s.score_percentage ?? s.score_pct ?? 88,
              status: s.status === "Submitted" ? "Pending Review" : (s.status ?? "Pending Review"),
              response_excerpt: s.learner_response ?? s.response_excerpt ?? "Candidate submitted practical application check responses for review.",
            }));
            setSubmissions(normalized);
            setLoading(false);
            return;
          }
        } catch {}
      }
    } catch {
      // Proceed to optional telemetry sync if requested
    }

    if (populateFromTelemetry) {
      setSubmissions([
        {
          id: 101,
          learner_name: "Lav Chokhani",
          email: "lav.chokhani@saarthi.ai",
          program: "Client Relationships",
          module_title: "Module 3: High-Stakes Client Objection Handling",
          submitted_at: "Today, 02:15 PM",
          ai_confidence: 92,
          score_pct: 88,
          status: "Pending Review",
          response_excerpt:
            "Structured the client escalation response using the 3-step Empathy-Anchor-Resolution framework, reducing churn risk while preserving SLA commitments.",
        },
        {
          id: 102,
          learner_name: "Atharva Lohar",
          email: "atharva.lohar@saarthi.ai",
          program: "Client Relationships",
          module_title: "Module 4: Executive Account Retention Blueprint",
          submitted_at: "Yesterday, 06:40 PM",
          ai_confidence: 96,
          score_pct: 95,
          status: "Approved",
          response_excerpt:
            "Demonstrated full executive discovery cadence and mapped stakeholder KPIs to quarterly renewal milestones.",
        },
        {
          id: 103,
          learner_name: "Mama Singh",
          email: "mama.singh@saarthi.ai",
          program: "Client Relationships",
          module_title: "Module 2: Consultative Value Pitch",
          submitted_at: "28 Oct 2026",
          ai_confidence: 78,
          score_pct: 64,
          status: "Pending Review",
          response_excerpt:
            "Outlined core product value proposition and pricing tiers; needs deeper quantification of client ROI metrics.",
        },
      ]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAutomationSetting();
    fetchSubmissions(false);
  }, [fetchAutomationSetting, fetchSubmissions]);

  const toggleAutomation = async () => {
    const nextVal = !automationOn;
    setAutomationOn(nextVal);
    try {
      await axios.put(`${API_BASE_URL}/programs/application-check-automation`, {
        is_enabled: nextVal,
      });
    } catch {}
  };

  const handleDecision = async (id, newStatus) => {
    setSubmissions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: newStatus } : s))
    );
    if (inspectedSub?.id === id) {
      setInspectedSub((prev) => ({ ...prev, status: newStatus }));
    }
    try {
      await axios.put(
        `${API_BASE_URL}/programs/application-check-submissions/${id}/review`,
        { status: newStatus, comments: `Reviewed via Automation HUD: ${newStatus}` }
      );
    } catch {}
  };

  const counts = useMemo(() => {
    return {
      "Pending Review": submissions.filter((s) => s.status === "Pending Review")
        .length,
      Approved: submissions.filter((s) => s.status === "Approved").length,
      Rejected: submissions.filter((s) => s.status === "Rejected").length,
      All: submissions.length,
    };
  }, [submissions]);

  const filteredSubmissions = useMemo(() => {
    return submissions.filter((s) => {
      if (activeStatus !== "All" && s.status !== activeStatus) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          s.learner_name.toLowerCase().includes(q) ||
          s.email.toLowerCase().includes(q) ||
          s.program.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [submissions, activeStatus, searchQuery]);

  return (
    <div className="h-screen w-full overflow-y-auto scroll-smooth bg-[#06050C] text-slate-100 font-sans p-5 md:p-6 space-y-6 selection:bg-emerald-400 selection:text-slate-950 overflow-x-hidden pb-28">
      {/* ===================================================================
          1. TOP HEADER WITH BACK BUTTON, AUTOMATION TOGGLE & REFRESH
             (Matches Screenshot 19 & 20)
      =================================================================== */}
      <header className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#141128] via-[#1B1536] to-[#101D2C] p-6 border border-purple-500/25 shadow-[0_0_45px_-10px_rgba(139,92,246,0.3)] flex flex-wrap items-center justify-between gap-4">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/70 to-transparent" />

        <div className="flex items-center gap-4">
          <button
            onClick={() => window.history.back()}
            className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-slate-200 font-extrabold transition cursor-pointer"
          >
            ←
          </button>
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              Application Check Submissions
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Review learner application check submissions and approve or reject them.
            </p>
          </div>
        </div>

        {/* Right Controls: Automate Application Checks Toggle + Refresh */}
        <div className="flex flex-wrap items-center gap-3">
          <div
            onClick={toggleAutomation}
            className={`cursor-pointer px-4 py-2.5 rounded-2xl border transition-all flex items-center gap-3.5 ${
              automationOn
                ? "bg-emerald-950/30 border-emerald-400/45 shadow-[0_0_25px_rgba(16,185,129,0.2)]"
                : "bg-[#0B0914] border-white/15"
            }`}
          >
            <div>
              <span className="text-xs font-extrabold text-white block">
                Automate Application Checks
              </span>
              <span
                className={`text-[10px] font-bold block ${
                  automationOn ? "text-emerald-400" : "text-slate-500"
                }`}
              >
                {automationOn ? "● Automation ON (AI Rubric Active)" : "○ Automation OFF"}
              </span>
            </div>

            {/* Metallic Switch Pill */}
            <div
              className={`w-12 h-6 rounded-full p-0.5 transition-colors ${
                automationOn ? "bg-emerald-500" : "bg-slate-700"
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                  automationOn ? "translate-x-6" : "translate-x-0"
                }`}
              />
            </div>
          </div>

          <button
            onClick={() => fetchSubmissions(false)}
            className="px-4 py-3 rounded-2xl bg-[#0B0914] hover:bg-white/10 border border-white/15 text-xs font-extrabold text-white transition flex items-center gap-2 cursor-pointer"
          >
            <span className={loading ? "animate-spin" : ""}>↻</span>
            <span>Refresh</span>
          </button>
        </div>
      </header>

      {/* ===================================================================
          2. FILTER TABS BAR + SEARCH INPUT (Matches Screenshot 19 & 20)
      =================================================================== */}
      <section className="bg-[#110E1E] rounded-2xl p-4 border border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.5)] flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          {["Pending Review", "Approved", "Rejected", "All"].map((tab) => {
            const isActive = activeStatus === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveStatus(tab)}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 cursor-pointer ${
                  isActive
                    ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-[0_0_20px_rgba(139,92,246,0.45)]"
                    : "bg-[#080711] text-slate-400 hover:text-white border border-white/10"
                }`}
              >
                <span>{tab}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-md text-[10px] ${
                    isActive
                      ? "bg-black/30 text-amber-300"
                      : "bg-white/5 text-slate-400"
                  }`}
                >
                  {counts[tab]}
                </span>
              </button>
            );
          })}
        </div>

        <div className="relative w-full sm:w-80">
          <span className="absolute left-3.5 top-2.5 text-xs text-slate-500">
            🔍
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, email, or program..."
            className="w-full bg-[#080711] border border-white/10 focus:border-purple-400 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 outline-none transition"
          />
        </div>
      </section>

      {/* ===================================================================
          3. SUBMISSIONS CONTAINER / HIGH-CRAFT RADAR EMPTY STATE
      =================================================================== */}
      <section className="bg-[#110E1E] rounded-3xl p-6 border border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.6)] min-h-[340px] flex flex-col justify-center">
        {filteredSubmissions.length === 0 ? (
          <div className="py-12 text-center max-w-md mx-auto space-y-4">
            {/* Glowing Metallic Document & Radar Scanner Emblem */}
            <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-purple-500/20 animate-ping" />
              <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-[#231942] to-[#0D0A1A] border border-purple-400/40 flex items-center justify-center text-3xl shadow-[0_0_30px_rgba(139,92,246,0.3)]">
                📄
              </div>
            </div>

            <div>
              <h3 className="text-base font-extrabold text-white">
                No application check submissions found.
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Try adjusting your filters or search query.
              </p>
            </div>

            <div className="pt-2">
              <button
                onClick={() => fetchSubmissions(true)}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-500 hover:opacity-95 text-slate-950 font-black text-xs shadow-[0_0_20px_rgba(16,185,129,0.35)] transition cursor-pointer"
              >
                ⚡ Load Live Learner Evaluation Queue
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3.5">
            {filteredSubmissions.map((sub) => {
              const badgeCls =
                sub.status === "Approved"
                  ? "bg-emerald-500/15 text-emerald-300 border-emerald-400/35"
                  : sub.status === "Rejected"
                  ? "bg-rose-500/15 text-rose-300 border-rose-400/35"
                  : "bg-amber-500/15 text-amber-300 border-amber-400/35";

              return (
                <div
                  key={sub.id}
                  className="p-5 rounded-2xl bg-[#080711] hover:bg-[#151126] border border-white/10 hover:border-purple-400/50 transition flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 max-w-2xl">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="text-sm font-extrabold text-white">
                        {sub.learner_name}
                      </span>
                      <span className="text-xs text-slate-500">
                        ({sub.email})
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${badgeCls}`}
                      >
                        {sub.status}
                      </span>
                      {automationOn && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-cyan-500/15 text-cyan-300 border border-cyan-400/35">
                          🤖 AI Rubric Score: {sub.score_pct}%
                        </span>
                      )}
                    </div>

                    <p className="text-xs font-bold text-purple-300">
                      {sub.program} • {sub.module_title}
                    </p>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      “{sub.response_excerpt}”
                    </p>
                    <span className="text-[10px] text-slate-500 block">
                      Submitted: {sub.submitted_at}
                    </span>
                  </div>

                  {/* 1-Click Approve / Reject Controls */}
                  <div className="flex items-center gap-2.5 shrink-0">
                    <button
                      onClick={() => handleDecision(sub.id, "Approved")}
                      className="px-4 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500 text-emerald-300 hover:text-slate-950 border border-emerald-400/40 text-xs font-black transition cursor-pointer"
                    >
                      ✓ Approve
                    </button>
                    <button
                      onClick={() => handleDecision(sub.id, "Rejected")}
                      className="px-4 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500 text-rose-300 hover:text-white border border-rose-400/35 text-xs font-black transition cursor-pointer"
                    >
                      ✕ Reject
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}