/* eslint-disable react-hooks/set-state-in-effect */
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../utils/axios";
import MainLayout from "../../layout/mainLayout";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  Search,
  ClipboardCheck,
  Eye,
  X,
  FileText,
  Sparkles,
  Loader2,
} from "lucide-react";

// ============================================================================
// REVIEW SUBMISSION DETAIL MODAL (READ ANSWERS & APPROVE / REJECT)
// ============================================================================
function SubmissionReviewModal({
  submission,
  detailLoading,
  onClose,
  onDecision,
  processingId,
}) {
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    setFeedback(submission?.admin_feedback || submission?.review_comment || "");
  }, [submission]);

  if (!submission) return null;

  const isPending = submission.status === "Pending";
  const isBusy = processingId === submission.id;

  const questionMap = new Map(
    (submission.questions || []).map((q) => [q.id, q.question])
  );

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto animate-fadeIn"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl rounded-3xl p-6 sm:p-7 bg-[#050918] border-[2.5px] border-[#00F5FF] shadow-[0_0_50px_rgba(0,245,255,0.45),inset_0_0_25px_rgba(0,245,255,0.12)] text-slate-100 space-y-5 my-auto relative"
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between gap-3 border-b border-white/15 pb-4">
          <div>
            <span className="text-[10.5px] font-black uppercase tracking-[0.22em] text-[#00F5FF] block drop-shadow-[0_0_8px_rgba(0,245,255,0.6)]">
              SUBMISSION INSPECTION
            </span>
            <h3 className="text-xl sm:text-2xl font-black text-white mt-0.5">
              {submission.learner_name}
            </h3>
            <p className="text-xs text-slate-300 font-semibold mt-1">
              {submission.email && `${submission.email} • `}
              <span className="text-[#C084FC] font-black">
                {submission.program_name}
              </span>{" "}
              • Check #{submission.check_number} •{" "}
              <span
                className={`font-black ${
                  submission.status === "Approved"
                    ? "text-[#10F5A0]"
                    : submission.status === "Rejected"
                    ? "text-[#FF2A85]"
                    : "text-[#FFE600]"
                }`}
              >
                {submission.status}
              </span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-[#091126] border-2 border-[#00F5FF]/60 hover:border-[#00F5FF] text-white flex items-center justify-center cursor-pointer transition shadow-[0_0_12px_rgba(0,245,255,0.3)]"
          >
            <X size={16} />
          </button>
        </div>

        {/* Submitted Q&A Responses */}
        <div className="space-y-3.5 max-h-80 overflow-y-auto pr-1">
          {detailLoading ? (
            <div className="p-8 rounded-2xl bg-[#02050E] border-2 border-white/15 text-center space-y-2">
              <Loader2 className="w-8 h-8 animate-spin text-[#00F5FF] mx-auto shadow-[0_0_14px_rgba(0,245,255,0.6)]" />
              <p className="text-xs font-bold text-slate-300">
                Loading learner's written responses...
              </p>
            </div>
          ) : (submission.answers || []).length === 0 ? (
            <div className="p-6 rounded-2xl bg-[#02050E] border-2 border-white/15 text-xs text-slate-300 text-center font-semibold">
              No written responses recorded for this submission.
            </div>
          ) : (
            submission.answers.map((ans, idx) => {
              const qText =
                questionMap.get(ans.question_id) ||
                ans.question ||
                `Scenario Question ${idx + 1}`;

              return (
                <div
                  key={ans.question_id ?? idx}
                  className="p-4 rounded-2xl bg-[#0A0518] border-[2px] border-[#D946EF]/80 shadow-[0_0_18px_rgba(217,70,239,0.3)] space-y-2"
                >
                  <span className="text-[11px] font-black uppercase tracking-wider text-[#F0ABFC] block">
                    Q{idx + 1}: {qText}
                  </span>
                  <div className="text-sm text-white font-medium bg-[#020308] rounded-xl p-3.5 border border-white/15 leading-relaxed whitespace-pre-wrap">
                    {ans.answer ? (
                      ans.answer
                    ) : (
                      <span className="italic text-rose-300">Empty response</span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Optional Reviewer Note */}
        <div>
          <label className="text-[11px] font-black uppercase tracking-wider text-[#FFE600] block mb-1.5 drop-shadow-[0_0_6px_rgba(255,230,0,0.5)]">
            Reviewer Feedback / Comments
          </label>
          <textarea
            rows={2}
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            disabled={!isPending}
            placeholder={
              isPending
                ? "Add an optional review comment for the learner..."
                : "No reviewer feedback entered."
            }
            className="w-full rounded-xl bg-[#020308] border-[2px] border-[#FFE600]/60 focus:border-[#FFE600] px-3.5 py-2.5 text-xs font-semibold text-white placeholder-slate-400 outline-none resize-none disabled:opacity-60 shadow-inner"
          />
        </div>

        {/* Bright Decision Buttons */}
        <div className="flex flex-wrap items-center justify-end gap-3 pt-2 border-t border-white/15">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-[#091126] border-2 border-slate-500 text-white text-xs font-black cursor-pointer hover:border-white transition"
          >
            Close
          </button>

          {isPending && (
            <>
              <button
                type="button"
                disabled={isBusy}
                onClick={() => onDecision(submission, "Rejected", feedback)}
                className="px-5 py-2.5 rounded-xl bg-[#FF2A85] hover:bg-[#FF55A0] text-white text-xs font-black shadow-[0_0_24px_rgba(255,42,133,0.6)] flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition"
              >
                {isBusy ? <Loader2 size={15} className="animate-spin" /> : <XCircle size={15} />}
                <span>Reject</span>
              </button>

              <button
                type="button"
                disabled={isBusy}
                onClick={() => onDecision(submission, "Approved", feedback)}
                className="px-5 py-2.5 rounded-xl bg-[#10F5A0] hover:bg-[#5CFAC0] text-slate-950 text-xs font-black shadow-[0_0_24px_rgba(16,245,160,0.65)] flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition"
              >
                {isBusy ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
                <span>Approve Submission</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN ADMIN COMPONENT: ApplicationCheckSubmissions
// ============================================================================
export default function ApplicationCheckSubmissions() {
  const navigate = useNavigate();

  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingId, setProcessingId] = useState(null);
  const [activeFilter, setActiveFilter] = useState("Pending"); // 'Pending' | 'Approved' | 'Rejected' | 'All'
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const normalizeRecord = (item, idx) => {
    const rawStatus = String(
      item.status || item.review_status || "Pending"
    ).toLowerCase();

    let status = "Pending";
    if (rawStatus.includes("approv") || rawStatus === "passed") {
      status = "Approved";
    } else if (rawStatus.includes("reject") || rawStatus === "failed") {
      status = "Rejected";
    }

    const dateVal = item.attempted_at || item.submitted_at || item.created_at;
    let formattedDate = "19 Nov 2026";
    if (dateVal) {
      const d = new Date(dateVal);
      if (!Number.isNaN(d.getTime())) {
        formattedDate = d.toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        });
      }
    }

    return {
      id: item.attempt_id ?? item.id ?? idx + 1,
      attempt_id: item.attempt_id ?? item.id ?? idx + 1,
      learner_name:
        item.employee_name ||
        item.candidate_name ||
        item.learner_name ||
        item.user_name ||
        item.full_name ||
        `Learner #${idx + 1}`,
      email: item.employee_email || item.candidate_email || item.email || "",
      program_name:
        item.program_name ||
        item.program_title ||
        item.program ||
        "Client Relationships",
      check_number: item.check_number || item.application_check_id || 1,
      submitted_at: formattedDate,
      status,
      answers: Array.isArray(item.answers) ? item.answers : [],
      questions: Array.isArray(item.questions) ? item.questions : [],
      admin_feedback: item.review_comment || item.admin_feedback || "",
    };
  };

  // --------------------------------------------------------------------------
  // 1. DATA FETCHER (SUBMISSIONS)
  // --------------------------------------------------------------------------
  const fetchSubmissions = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    const endpoints = [
      "/programs/application-check-submissions",
      "/application-check-submissions",
      "/admin/application-check-submissions",
    ];

    for (const ep of endpoints) {
      try {
        const res = await api.get(ep, { params: { _t: Date.now() } });
        const list =
          res.data?.submissions ||
          res.data?.data ||
          res.data?.items ||
          (Array.isArray(res.data) ? res.data : null);

        if (Array.isArray(list)) {
          setSubmissions(list.map(normalizeRecord));
          setLoading(false);
          setRefreshing(false);
          return;
        }
      } catch {
        // Continue to fallback
      }
    }

    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    fetchSubmissions(false);
  }, [fetchSubmissions]);

  // --------------------------------------------------------------------------
  // 2. REVIEW SUBMISSION DETAIL FETCH & DECISION HANDLER
  // --------------------------------------------------------------------------
  const handleOpenReview = async (sub) => {
    setSelectedSubmission(sub);
    setDetailLoading(true);

    try {
      const endpoints = [
        `/programs/application-check-submissions/${sub.id}`,
        `/application-check-submissions/${sub.id}`,
        `/admin/application-check-submissions/${sub.id}`,
      ];

      for (const ep of endpoints) {
        try {
          const res = await api.get(ep);
          if (res.data) {
            setSelectedSubmission((prev) => ({
              ...prev,
              ...res.data,
              learner_name:
                res.data.candidate_name ||
                res.data.employee_name ||
                prev.learner_name,
              email:
                res.data.candidate_email ||
                res.data.employee_email ||
                prev.email,
              answers: res.data.answers || prev.answers || [],
              questions: res.data.questions || prev.questions || [],
              admin_feedback:
                res.data.review_comment || prev.admin_feedback,
            }));
            break;
          }
        } catch {
          // Try next
        }
      }
    } finally {
      setDetailLoading(false);
    }
  };

  const handleDecision = async (submission, nextStatus, feedback = "") => {
    setProcessingId(submission.id);
    const actorId = localStorage.getItem("user_id");

    try {
      await api.put(
        `/programs/application-check-submissions/${submission.id}/review`,
        {
          status: nextStatus,
          review_comment: feedback,
        },
        {
          params: actorId ? { actor_id: actorId } : {},
        }
      );
    } catch (err) {
      console.warn("Primary review PUT endpoint error, trying fallback...", err);
      try {
        const actionSlug = nextStatus === "Approved" ? "approve" : "reject";
        await api.post(
          `/admin/application-check-submissions/${submission.id}/${actionSlug}`,
          { status: nextStatus, feedback, review_comment: feedback }
        );
      } catch (secondErr) {
        console.warn("Second review route attempt:", secondErr);
      }
    } finally {
      setSubmissions((prev) =>
        prev.map((s) =>
          s.id === submission.id
            ? { ...s, status: nextStatus, admin_feedback: feedback }
            : s
        )
      );
      setProcessingId(null);
      setSelectedSubmission(null);
      showToast(
        nextStatus === "Approved"
          ? `✓ Approved ${submission.learner_name}'s Application Check!`
          : `✕ Rejected ${submission.learner_name}'s Application Check.`
      );
    }
  };

  // --------------------------------------------------------------------------
  // 3. COUNTS & FILTERING
  // --------------------------------------------------------------------------
  const counts = useMemo(() => {
    const pending = submissions.filter((s) => s.status === "Pending").length;
    const approved = submissions.filter((s) => s.status === "Approved").length;
    const rejected = submissions.filter((s) => s.status === "Rejected").length;
    return {
      pending,
      approved,
      rejected,
      all: submissions.length,
    };
  }, [submissions]);

  const filteredSubmissions = useMemo(() => {
    return submissions.filter((s) => {
      if (activeFilter !== "All" && s.status !== activeFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          s.learner_name.toLowerCase().includes(q) ||
          s.email.toLowerCase().includes(q) ||
          s.program_name.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [submissions, activeFilter, searchQuery]);

  // Submission tab style based on candidate attrition classes
  const getSubmissionTabClass = (status) => {
    if (status === "Approved") return "perm-user-tab-emerald";
    if (status === "Rejected") return "perm-user-tab-rose";
    return "perm-user-tab-amber";
  };

  const getStatusPill = (status) => {
    if (status === "Approved") {
      return {
        pill: "bg-[#10F5A0] text-slate-950 font-black shadow-[0_0_16px_rgba(16,245,160,0.65)]",
        accent: "text-[#10F5A0] font-black drop-shadow-[0_0_6px_rgba(16,245,160,0.5)]",
      };
    }
    if (status === "Rejected") {
      return {
        pill: "bg-[#FF2A85] text-white font-black shadow-[0_0_16px_rgba(255,42,133,0.65)]",
        accent: "text-[#FF66B2] font-black drop-shadow-[0_0_6px_rgba(255,42,133,0.5)]",
      };
    }
    return {
      pill: "bg-[#FFE600] text-slate-950 font-black shadow-[0_0_16px_rgba(255,230,0,0.65)]",
      accent: "text-[#FFE600] font-black drop-shadow-[0_0_6px_rgba(255,230,0,0.5)]",
    };
  };

  return (
    <MainLayout>
      <div className="-m-4 sm:-m-6 min-h-screen bg-[#020308] text-slate-100 p-5 sm:p-7 space-y-6">
        {/* ===================================================================
            ENHANCED BRIGHT 2.5px BORDERS & NOTICEABLE FAST LIVE ACCENT SHIFT (4.5s)
        =================================================================== */}
        <style>{`
          @keyframes fastAccentShadeDrift {
            0% {
              background-position: 0% 0%, 100% 100%, 50% 50%;
            }
            33% {
              background-position: 100% 30%, 0% 70%, 50% 50%;
            }
            66% {
              background-position: 30% 100%, 70% 10%, 50% 50%;
            }
            100% {
              background-position: 0% 0%, 100% 100%, 50% 50%;
            }
          }

          .perm-user-tab-cyan,
          .perm-user-tab-amber,
          .perm-user-tab-purple,
          .perm-user-tab-emerald,
          .perm-user-tab-rose {
            position: relative;
            background-size: 220% 220%, 220% 220%, 100% 100% !important;
            animation: fastAccentShadeDrift 4.5s ease-in-out infinite !important;
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            transition: transform 0.28s cubic-bezier(0.22, 1, 0.36, 1),
              box-shadow 0.28s ease, border-color 0.28s ease !important;
          }

          /* CYAN USER TAB: Noticeable 2.5px Cyan Border + Fast Cyan Shade Glow */
          .perm-user-tab-cyan {
            background-image:
              radial-gradient(circle at 18% 22%, rgba(0, 245, 255, 0.35) 0%, transparent 58%),
              radial-gradient(circle at 84% 80%, rgba(14, 165, 233, 0.3) 0%, transparent 58%),
              linear-gradient(155deg, #0B2036 0%, #071524 55%, #030A14 100%) !important;
            border: 2.5px solid rgba(0, 245, 255, 0.95) !important;
            box-shadow:
              0 12px 32px -6px rgba(0, 0, 0, 0.92),
              0 0 32px 0px rgba(0, 245, 255, 0.5),
              inset 0 0 24px rgba(0, 245, 255, 0.18),
              inset 0 1px 2px rgba(255, 255, 255, 0.35) !important;
          }
          .perm-user-tab-cyan:hover {
            transform: translateY(-4px);
            border-color: #67E8F9 !important;
            box-shadow:
              0 16px 36px -6px rgba(0, 0, 0, 0.95),
              0 0 36px 0px rgba(0, 245, 255, 0.7),
              inset 0 0 28px rgba(0, 245, 255, 0.26) !important;
          }

          /* AMBER USER TAB: Noticeable 2.5px Gold Border + Fast Amber Shade Glow */
          .perm-user-tab-amber {
            background-image:
              radial-gradient(circle at 18% 22%, rgba(255, 230, 0, 0.35) 0%, transparent 58%),
              radial-gradient(circle at 84% 80%, rgba(245, 158, 11, 0.3) 0%, transparent 58%),
              linear-gradient(155deg, #2B1D08 0%, #1D1104 55%, #0F0902 100%) !important;
            border: 2.5px solid rgba(255, 230, 0, 0.95) !important;
            box-shadow:
              0 12px 32px -6px rgba(0, 0, 0, 0.92),
              0 0 32px 0px rgba(255, 230, 0, 0.5),
              inset 0 0 24px rgba(255, 230, 0, 0.18),
              inset 0 1px 2px rgba(255, 255, 255, 0.35) !important;
          }
          .perm-user-tab-amber:hover {
            transform: translateY(-4px);
            border-color: #FFF066 !important;
            box-shadow:
              0 16px 36px -6px rgba(0, 0, 0, 0.95),
              0 0 36px 0px rgba(255, 230, 0, 0.7),
              inset 0 0 28px rgba(255, 230, 0, 0.26) !important;
          }

          /* PURPLE USER TAB: Noticeable 2.5px Violet Border + Fast Violet Shade Glow */
          .perm-user-tab-purple {
            background-image:
              radial-gradient(circle at 18% 22%, rgba(217, 70, 239, 0.36) 0%, transparent 58%),
              radial-gradient(circle at 84% 80%, rgba(168, 85, 247, 0.32) 0%, transparent 58%),
              linear-gradient(155deg, #240E3B 0%, #170926 55%, #0B0413 100%) !important;
            border: 2.5px solid rgba(217, 70, 239, 0.95) !important;
            box-shadow:
              0 12px 32px -6px rgba(0, 0, 0, 0.92),
              0 0 32px 0px rgba(217, 70, 239, 0.5),
              inset 0 0 24px rgba(217, 70, 239, 0.18),
              inset 0 1px 2px rgba(255, 255, 255, 0.35) !important;
          }
          .perm-user-tab-purple:hover {
            transform: translateY(-4px);
            border-color: #F0ABFC !important;
            box-shadow:
              0 16px 36px -6px rgba(0, 0, 0, 0.95),
              0 0 36px 0px rgba(217, 70, 239, 0.7),
              inset 0 0 28px rgba(217, 70, 239, 0.26) !important;
          }

          /* EMERALD USER TAB: Noticeable 2.5px Emerald Border + Fast Emerald Shade Glow */
          .perm-user-tab-emerald {
            background-image:
              radial-gradient(circle at 18% 22%, rgba(16, 245, 160, 0.35) 0%, transparent 58%),
              radial-gradient(circle at 84% 80%, rgba(5, 150, 105, 0.3) 0%, transparent 58%),
              linear-gradient(155deg, #0B281E 0%, #061913 55%, #020C09 100%) !important;
            border: 2.5px solid rgba(16, 245, 160, 0.95) !important;
            box-shadow:
              0 12px 32px -6px rgba(0, 0, 0, 0.92),
              0 0 32px 0px rgba(16, 245, 160, 0.5),
              inset 0 0 24px rgba(16, 245, 160, 0.18),
              inset 0 1px 2px rgba(255, 255, 255, 0.35) !important;
          }
          .perm-user-tab-emerald:hover {
            transform: translateY(-4px);
            border-color: #6EE7B7 !important;
            box-shadow:
              0 16px 36px -6px rgba(0, 0, 0, 0.95),
              0 0 36px 0px rgba(16, 245, 160, 0.7),
              inset 0 0 28px rgba(16, 245, 160, 0.26) !important;
          }

          /* ROSE USER TAB: Noticeable 2.5px Rose Border + Fast Rose Shade Glow */
          .perm-user-tab-rose {
            background-image:
              radial-gradient(circle at 18% 22%, rgba(255, 42, 133, 0.35) 0%, transparent 58%),
              radial-gradient(circle at 84% 80%, rgba(225, 29, 72, 0.3) 0%, transparent 58%),
              linear-gradient(155deg, #2E0B20 0%, #1D0614 55%, #0F030B 100%) !important;
            border: 2.5px solid rgba(255, 42, 133, 0.95) !important;
            box-shadow:
              0 12px 32px -6px rgba(0, 0, 0, 0.92),
              0 0 32px 0px rgba(255, 42, 133, 0.5),
              inset 0 0 24px rgba(255, 42, 133, 0.18),
              inset 0 1px 2px rgba(255, 255, 255, 0.35) !important;
          }
          .perm-user-tab-rose:hover {
            transform: translateY(-4px);
            border-color: #FF80B5 !important;
            box-shadow:
              0 16px 36px -6px rgba(0, 0, 0, 0.95),
              0 0 36px 0px rgba(255, 42, 133, 0.7),
              inset 0 0 28px rgba(255, 42, 133, 0.26) !important;
          }

          /* ===================================================================
              RICH BASE-COLOUR KPI CARDS (MATCHING CERTIFICATE MANAGEMENT)
              Gentle organic fading & moving realness without dark/dim centers
          =================================================================== */
          @keyframes kpiGentleFadeDriftA {
            0%   { transform: translate3d(-12%, -10%, 0) scale(0.95); opacity: 0.25; }
            35%  { transform: translate3d(18%, 6%, 0) scale(1.12); opacity: 0.78; }
            70%  { transform: translate3d(38%, -6%, 0) scale(1.04); opacity: 0.48; }
            100% { transform: translate3d(-12%, -10%, 0) scale(0.95); opacity: 0.25; }
          }

          @keyframes kpiGentleFadeDriftB {
            0%   { transform: translate3d(28%, 14%, 0) scale(1.06); opacity: 0.22; }
            45%  { transform: translate3d(-14%, -6%, 0) scale(0.96); opacity: 0.68; }
            80%  { transform: translate3d(12%, 18%, 0) scale(1.1); opacity: 0.38; }
            100% { transform: translate3d(28%, 14%, 0) scale(1.06); opacity: 0.22; }
          }

          @keyframes kpiBaseToneShift {
            0%   { background-position: 0% 50%; }
            50%  { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }

          .app-kpi-rich {
            position: relative;
            z-index: 10;
            isolation: isolate;
            overflow: hidden;
            background-size: 200% 200% !important;
            animation: kpiBaseToneShift 11s ease-in-out infinite;
            transition: transform 0.24s cubic-bezier(0.22, 1, 0.36, 1), border-color 0.24s ease, box-shadow 0.24s ease;
          }
          .app-kpi-rich:hover {
            transform: translateY(-3px);
          }

          .kpi-living-wave-a,
          .kpi-living-wave-b {
            position: absolute;
            pointer-events: none;
            z-index: 0;
            border-radius: 9999px;
            will-change: transform, opacity;
          }
          .kpi-living-wave-a {
            width: 78%;
            height: 120%;
            top: -25%;
            left: -15%;
            filter: blur(34px);
            animation: kpiGentleFadeDriftA 9.5s ease-in-out infinite;
          }
          .kpi-living-wave-b {
            width: 72%;
            height: 115%;
            bottom: -30%;
            right: -12%;
            filter: blur(36px);
            animation: kpiGentleFadeDriftB 12s ease-in-out infinite;
          }

          /* KPI 1: Rich Championship Gold / Amber Base (Pending Review) */
          .app-kpi-rich-gold {
            background-image: linear-gradient(125deg, #B47B08 0%, #854D0E 45%, #452806 82%, #925809 100%);
            border: 2px solid #FDE047;
            box-shadow: 0 14px 32px rgba(0, 0, 0, 0.78), 0 0 22px -6px rgba(250, 204, 21, 0.42);
          }
          .app-kpi-rich-gold .kpi-living-wave-a {
            background: radial-gradient(circle, rgba(254, 240, 138, 0.52) 0%, rgba(234, 179, 8, 0.28) 48%, transparent 72%);
          }
          .app-kpi-rich-gold .kpi-living-wave-b {
            background: radial-gradient(circle, rgba(251, 191, 36, 0.48) 0%, rgba(217, 119, 6, 0.26) 48%, transparent 72%);
          }

          /* KPI 2: Rich Emerald Green Base (Approved) */
          .app-kpi-rich-emerald {
            background-image: linear-gradient(125deg, #059669 0%, #047857 45%, #064E3B 82%, #065F46 100%);
            border: 2px solid #6EE7B7;
            box-shadow: 0 14px 32px rgba(0, 0, 0, 0.78), 0 0 22px -6px rgba(16, 185, 129, 0.45);
          }
          .app-kpi-rich-emerald .kpi-living-wave-a {
            background: radial-gradient(circle, rgba(110, 231, 183, 0.52) 0%, rgba(16, 185, 129, 0.28) 48%, transparent 72%);
          }
          .app-kpi-rich-emerald .kpi-living-wave-b {
            background: radial-gradient(circle, rgba(45, 212, 191, 0.48) 0%, rgba(5, 150, 105, 0.24) 48%, transparent 72%);
          }

          /* KPI 3: Rich Vivid Ruby / Rose Base (Rejected) */
          .app-kpi-rich-rose {
            background-image: linear-gradient(125deg, #BE123C 0%, #9F1239 45%, #4C0519 82%, #881337 100%);
            border: 2px solid #FDA4AF;
            box-shadow: 0 14px 32px rgba(0, 0, 0, 0.78), 0 0 22px -6px rgba(244, 63, 94, 0.45);
          }
          .app-kpi-rich-rose .kpi-living-wave-a {
            background: radial-gradient(circle, rgba(254, 205, 211, 0.52) 0%, rgba(244, 63, 94, 0.28) 48%, transparent 72%);
          }
          .app-kpi-rich-rose .kpi-living-wave-b {
            background: radial-gradient(circle, rgba(251, 113, 133, 0.48) 0%, rgba(190, 18, 60, 0.26) 48%, transparent 72%);
          }

          /* KPI 4: Rich Royal Purple Base (Total Submissions) */
          .app-kpi-rich-purple {
            background-image: linear-gradient(125deg, #6B21A8 0%, #4C1D95 45%, #2E1065 82%, #581C87 100%);
            border: 2px solid #E879F9;
            box-shadow: 0 14px 32px rgba(0, 0, 0, 0.78), 0 0 22px -6px rgba(217, 70, 239, 0.45);
          }
          .app-kpi-rich-purple .kpi-living-wave-a {
            background: radial-gradient(circle, rgba(240, 171, 252, 0.55) 0%, rgba(192, 38, 211, 0.28) 48%, transparent 72%);
          }
          .app-kpi-rich-purple .kpi-living-wave-b {
            background: radial-gradient(circle, rgba(168, 85, 247, 0.52) 0%, rgba(99, 102, 241, 0.25) 48%, transparent 72%);
          }
        `}</style>

        {toast && (
          <div className="fixed bottom-6 right-6 z-50 px-5 py-3.5 rounded-2xl bg-[#050C1F] border-[2.2px] border-[#00F5FF] shadow-[0_0_30px_rgba(0,245,255,0.6)] text-white text-xs font-black flex items-center gap-2.5 animate-fadeIn">
            <Sparkles size={16} className="text-[#FFE600] drop-shadow-[0_0_6px_rgba(255,230,0,0.8)]" />
            <span>{toast}</span>
          </div>
        )}

        {/* ===================================================================
            1. HEADER WITH BRIGHT BORDER & REFRESH (ULTRA DARK VOID)
        =================================================================== */}
        <header className="rounded-3xl p-6 sm:p-7 bg-[#060414] border-[2.5px] border-[#B026FF] shadow-[0_0_36px_rgba(176,38,255,0.45),inset_0_0_24px_rgba(176,38,255,0.14)] flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="w-12 h-12 rounded-2xl bg-[#02050E] border-2 border-[#00F5FF] text-[#00F5FF] hover:bg-[#00F5FF] hover:text-slate-950 flex items-center justify-center transition cursor-pointer shrink-0 shadow-[0_0_18px_rgba(0,245,255,0.4)]"
              title="Go Back"
            >
              <ArrowLeft size={18} className="stroke-[2.5]" />
            </button>

            <div>
              <span className="text-[10px] font-black uppercase tracking-[0.22em] text-[#C084FC] block drop-shadow-[0_0_8px_rgba(192,132,252,0.6)]">
                ADMIN REVIEW CONSOLE
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-0.5 drop-shadow-[0_2px_12px_rgba(255,255,255,0.2)]">
                Application Check Submissions
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 font-semibold mt-0.5">
                Review learner application check submissions and approve or
                reject them with immediate effect.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 ml-auto">
            {/* Bright Refresh Button */}
            <button
              type="button"
              onClick={() => {
                fetchSubmissions(true);
                showToast("↻ Refreshed application check submissions!");
              }}
              className="px-5 py-3.5 rounded-2xl bg-[#00F5FF] hover:bg-[#67E8F9] text-slate-950 font-black text-xs uppercase tracking-wider shadow-[0_0_24px_rgba(0,245,255,0.65)] flex items-center gap-2 cursor-pointer transition hover:scale-105 active:scale-95"
            >
              <RefreshCw
                size={16}
                className={`stroke-[2.5] ${refreshing ? "animate-spin" : ""}`}
              />
              <span>Refresh</span>
            </button>
          </div>
        </header>

        {/* ===================================================================
            2. 4 RICH BASE-COLOUR KPI CARDS WITH GENTLE LIVE FADING MOVEMENT
               (MATCHING CERTIFICATE MANAGEMENT SPECIFICATION)
        =================================================================== */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
          {[
            {
              key: "Pending",
              label: "PENDING REVIEW",
              value: counts.pending,
              sub: counts.pending > 0 ? "Awaiting Decision" : "Queue 100% Cleared",
              cardCls: "app-kpi-rich-gold",
              valCls: "text-white",
              iconBox:
                "bg-[#FACC15] text-slate-950 border-2 border-[#FEFCE8] shadow-[0_4px_14px_rgba(0,0,0,0.45)]",
              delayA: "-5.4s",
              delayB: "-9s",
              icon: <Clock className="w-5 h-5 stroke-[2.5]" />,
            },
            {
              key: "Approved",
              label: "APPROVED",
              value: counts.approved,
              sub: `${counts.approved} Submissions Verified`,
              cardCls: "app-kpi-rich-emerald",
              valCls: "text-white",
              iconBox:
                "bg-[#34D399] text-slate-950 border-2 border-[#ECFDF5] shadow-[0_4px_14px_rgba(0,0,0,0.45)]",
              delayA: "-2.8s",
              delayB: "-6s",
              icon: <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />,
            },
            {
              key: "Rejected",
              label: "REJECTED",
              value: counts.rejected,
              sub: "Actioned & Closed",
              cardCls: "app-kpi-rich-rose",
              valCls: "text-white",
              iconBox:
                "bg-[#FF2A85] text-white border-2 border-[#FFE4E6] shadow-[0_4px_14px_rgba(0,0,0,0.45)]",
              delayA: "-3.6s",
              delayB: "-7.5s",
              icon: <XCircle className="w-5 h-5 stroke-[2.5]" />,
            },
            {
              key: "All",
              label: "TOTAL SUBMISSIONS",
              value: counts.all,
              sub: "All Learner Check Attempts",
              cardCls: "app-kpi-rich-purple",
              valCls: "text-white",
              iconBox:
                "bg-[#E879F9] text-slate-950 border-2 border-[#FDF4FF] shadow-[0_4px_14px_rgba(0,0,0,0.45)]",
              delayA: "0s",
              delayB: "-3s",
              icon: <ClipboardCheck className="w-5 h-5 stroke-[2.5]" />,
            },
          ].map((card) => {
            const isActive = activeFilter === card.key;
            return (
              <div
                key={card.key}
                onClick={() => setActiveFilter(card.key)}
                className={`cursor-pointer rounded-3xl p-5 flex flex-col justify-between space-y-4 select-none app-kpi-rich ${
                  card.cardCls
                } ${isActive ? "ring-2 ring-white" : ""}`}
              >
                {/* Gentle Fading & Moving Base Colour Waves */}
                <div
                  className="kpi-living-wave-a"
                  style={{ animationDelay: card.delayA }}
                />
                <div
                  className="kpi-living-wave-b"
                  style={{ animationDelay: card.delayB }}
                />

                <div className="flex items-start justify-between gap-3 relative z-10">
                  <div className="flex items-center gap-3.5">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${card.iconBox}`}
                    >
                      {card.icon}
                    </div>
                    <div>
                      <span className="text-[11px] font-black uppercase tracking-[0.14em] text-white/90 block">
                        {card.label}
                      </span>
                      <span
                        className={`text-3xl sm:text-4xl font-black leading-tight mt-0.5 block ${card.valCls}`}
                      >
                        {card.value}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 relative z-10">
                  <div className="w-full h-1.5 rounded-full bg-black/55 overflow-hidden" />
                  <div className="flex items-center justify-between gap-2 text-xs font-extrabold text-white">
                    <span className="truncate">{card.sub}</span>
                    <span className="px-3 py-1 rounded-full text-[10.5px] font-black bg-[#090B12] border border-white/30 text-white shrink-0">
                      {isActive ? "• Filter Active" : "Filter →"}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </section>

        {/* ===================================================================
            3. FILTER TABS & SEARCH BAR (NOTICEABLE 2.5px CYAN BORDER)
        =================================================================== */}
        <section className="rounded-3xl p-4 sm:p-5 bg-[#030814] border-[2.5px] border-[#00F5FF] shadow-[0_0_32px_rgba(0,245,255,0.4),inset_0_0_20px_rgba(0,245,255,0.12)] flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {[
              {
                id: "Pending",
                label: `Pending Review (${counts.pending})`,
                activeCls:
                  "bg-[#FFE600] text-slate-950 border-[#FFE600] shadow-[0_0_20px_rgba(255,230,0,0.7)]",
              },
              {
                id: "Approved",
                label: `Approved (${counts.approved})`,
                activeCls:
                  "bg-[#10F5A0] text-slate-950 border-[#10F5A0] shadow-[0_0_20px_rgba(16,245,160,0.7)]",
              },
              {
                id: "Rejected",
                label: `Rejected (${counts.rejected})`,
                activeCls:
                  "bg-[#FF2A85] text-white border-[#FF2A85] shadow-[0_0_20px_rgba(255,42,133,0.7)]",
              },
              {
                id: "All",
                label: `All (${counts.all})`,
                activeCls:
                  "bg-[#00F5FF] text-slate-950 border-[#00F5FF] shadow-[0_0_20px_rgba(0,245,255,0.7)]",
              },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveFilter(tab.id)}
                className={`px-4 py-2.5 rounded-xl text-xs font-black border-2 transition cursor-pointer ${
                  activeFilter === tab.id
                    ? tab.activeCls
                    : "bg-[#02050E] text-slate-200 border-white/25 hover:border-white/70"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-80">
            <Search
              size={17}
              className="text-[#00F5FF] absolute left-3.5 top-3 stroke-[2.5]"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, email, or program..."
              className="w-full rounded-xl bg-[#020409] border-[2px] border-[#00F5FF]/60 focus:border-[#00F5FF] pl-10 pr-4 py-2.5 text-xs font-bold text-white placeholder-slate-400 outline-none transition shadow-inner"
            />
          </div>
        </section>

        {/* ===================================================================
            4. SUBMISSIONS LIST CONTAINER WITH ATTRITION-THEMED TABS
        =================================================================== */}
        <section className="rounded-3xl p-6 sm:p-7 bg-[#060414] border-[2.5px] border-[#C084FC] shadow-[0_0_36px_rgba(192,132,252,0.4),inset_0_0_22px_rgba(192,132,252,0.12)] space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-4">
            <div className="flex items-center gap-2.5">
              <FileText size={20} className="text-[#C084FC] stroke-[2.5]" />
              <h2 className="text-xl font-black text-white">
                {activeFilter === "All"
                  ? "All Submissions"
                  : `${activeFilter} Submissions`}{" "}
                ({filteredSubmissions.length})
              </h2>
            </div>
          </div>

          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center gap-3">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#00F5FF]/30 border-t-[#00F5FF] shadow-[0_0_20px_rgba(0,245,255,0.6)]" />
              <p className="text-xs font-bold text-slate-300">
                Loading application check submissions...
              </p>
            </div>
          ) : filteredSubmissions.length === 0 ? (
            <div className="py-14 rounded-2xl bg-[#020308] border-2 border-dashed border-white/20 text-center space-y-2">
              <ClipboardCheck
                size={38}
                className="text-[#00F5FF] mx-auto opacity-80"
              />
              <p className="text-base font-black text-white">
                No {activeFilter !== "All" ? activeFilter.toLowerCase() : ""}{" "}
                submissions found
              </p>
              <p className="text-xs text-slate-400 font-medium">
                {searchQuery
                  ? "Try clearing your search filter."
                  : "New learner application check attempts will appear here automatically."}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredSubmissions.map((sub) => {
                const tabCls = getSubmissionTabClass(sub.status);
                const pillMeta = getStatusPill(sub.status);
                const isBusy = processingId === sub.id;

                return (
                  <div
                    key={sub.id}
                    onClick={() => handleOpenReview(sub)}
                    className={`cursor-pointer rounded-2xl p-5 sm:p-6 flex flex-wrap items-center justify-between gap-4 ${tabCls}`}
                  >
                    {/* Left: Learner Info + Program & Check Number */}
                    <div className="space-y-1.5 min-w-[220px]">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <h3 className="text-base sm:text-lg font-black text-white">
                          {sub.learner_name}
                        </h3>
                        <span
                          className={`px-3 py-1 rounded-full text-[10px] uppercase tracking-wider ${pillMeta.pill}`}
                        >
                          {sub.status}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-300">
                        {sub.email && <span>{sub.email}</span>}
                        <span className={pillMeta.accent}>
                          • {sub.program_name}
                        </span>
                        <span className="text-slate-400">
                          • Check #{sub.check_number} • {sub.submitted_at}
                        </span>
                      </div>
                    </div>

                    {/* Right: Bright Action Buttons */}
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="flex flex-wrap items-center gap-2.5 ml-auto"
                    >
                      <button
                        type="button"
                        onClick={() => handleOpenReview(sub)}
                        className="px-4 py-2.5 rounded-xl bg-[#00F5FF] hover:bg-[#67E8F9] text-slate-950 font-black text-xs shadow-[0_0_18px_rgba(0,245,255,0.6)] flex items-center gap-1.5 cursor-pointer transition hover:scale-105 active:scale-95"
                      >
                        <Eye size={14} className="stroke-[2.5]" />
                        <span>Review</span>
                      </button>

                      {sub.status === "Pending" && (
                        <>
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => handleDecision(sub, "Approved")}
                            className="px-4 py-2.5 rounded-xl bg-[#10F5A0] hover:bg-[#6EE7B7] text-slate-950 font-black text-xs shadow-[0_0_18px_rgba(16,245,160,0.6)] flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition hover:scale-105 active:scale-95"
                          >
                            <CheckCircle2 size={14} className="stroke-[2.5]" />
                            <span>Approve</span>
                          </button>

                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => handleDecision(sub, "Rejected")}
                            className="px-4 py-2.5 rounded-xl bg-[#FF2A85] hover:bg-[#FF66B2] text-white font-black text-xs shadow-[0_0_18px_rgba(255,42,133,0.6)] flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition hover:scale-105 active:scale-95"
                          >
                            <XCircle size={14} className="stroke-[2.5]" />
                            <span>Reject</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <SubmissionReviewModal
          submission={selectedSubmission}
          detailLoading={detailLoading}
          onClose={() => setSelectedSubmission(null)}
          onDecision={handleDecision}
          processingId={processingId}
        />
      </div>
    </MainLayout>
  );
}
