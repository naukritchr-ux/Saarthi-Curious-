/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../utils/axios";
import MainLayout from "../../layout/mainLayout";
import {
  ClipboardCheck,
  ChevronRight,
  CheckCircle,
  Clock,
  AlertCircle,
  ArrowLeft,
  FileText,
  Sparkles,
  Check,
} from "lucide-react";

// ============================================================================
// VIVID, HIGH-VOLTAGE QUESTION TAB THEMES
// Noticeable 2.5px bright neon borders + rich ambient outer/inner glow
// Ultra-dark void bases + radiant glowing typography
// ============================================================================
const QUESTION_TAB_THEMES = [
  {
    name: "cyan",
    card: "bg-[#030812] border-[2.5px] border-[#00F5FF] shadow-[0_0_32px_rgba(0,245,255,0.48),inset_0_0_24px_rgba(0,245,255,0.12)]",
    badge: "bg-[#00F5FF] text-slate-950 shadow-[0_0_18px_rgba(0,245,255,0.85)]",
    label: "text-[#00F5FF] drop-shadow-[0_0_10px_rgba(0,245,255,0.6)]",
    qTag: "text-[#67E8F9] drop-shadow-[0_0_8px_rgba(0,245,255,0.5)]",
    counter: "bg-[#00F5FF]/15 border border-[#00F5FF]/60 text-[#67E8F9]",
    input:
      "bg-[#01040A] border-[2px] border-[#00F5FF]/65 focus:border-[#00F5FF] focus:ring-4 focus:ring-[#00F5FF]/30 text-white placeholder-slate-400",
  },
  {
    name: "purple",
    card: "bg-[#090314] border-[2.5px] border-[#D946EF] shadow-[0_0_32px_rgba(217,70,239,0.48),inset_0_0_24px_rgba(217,70,239,0.12)]",
    badge: "bg-[#D946EF] text-slate-950 shadow-[0_0_18px_rgba(217,70,239,0.85)]",
    label: "text-[#F0ABFC] drop-shadow-[0_0_10px_rgba(217,70,239,0.6)]",
    qTag: "text-[#E879F9] drop-shadow-[0_0_8px_rgba(217,70,239,0.5)]",
    counter: "bg-[#D946EF]/15 border border-[#D946EF]/60 text-[#F0ABFC]",
    input:
      "bg-[#05010A] border-[2px] border-[#D946EF]/65 focus:border-[#D946EF] focus:ring-4 focus:ring-[#D946EF]/30 text-white placeholder-slate-400",
  },
  {
    name: "gold",
    card: "bg-[#0F0A02] border-[2.5px] border-[#FFE600] shadow-[0_0_32px_rgba(255,230,0,0.48),inset_0_0_24px_rgba(255,230,0,0.12)]",
    badge: "bg-[#FFE600] text-slate-950 shadow-[0_0_18px_rgba(255,230,0,0.85)]",
    label: "text-[#FFE600] drop-shadow-[0_0_10px_rgba(255,230,0,0.6)]",
    qTag: "text-[#FDE047] drop-shadow-[0_0_8px_rgba(255,230,0,0.5)]",
    counter: "bg-[#FFE600]/15 border border-[#FFE600]/60 text-[#FEF08A]",
    input:
      "bg-[#060400] border-[2px] border-[#FFE600]/65 focus:border-[#FFE600] focus:ring-4 focus:ring-[#FFE600]/30 text-white placeholder-slate-400",
  },
  {
    name: "emerald",
    card: "bg-[#020D08] border-[2.5px] border-[#10F5A0] shadow-[0_0_32px_rgba(16,245,160,0.48),inset_0_0_24px_rgba(16,245,160,0.12)]",
    badge: "bg-[#10F5A0] text-slate-950 shadow-[0_0_18px_rgba(16,245,160,0.85)]",
    label: "text-[#10F5A0] drop-shadow-[0_0_10px_rgba(16,245,160,0.6)]",
    qTag: "text-[#6EE7B7] drop-shadow-[0_0_8px_rgba(16,245,160,0.5)]",
    counter: "bg-[#10F5A0]/15 border border-[#10F5A0]/60 text-[#A7F3D0]",
    input:
      "bg-[#010604] border-[2px] border-[#10F5A0]/65 focus:border-[#10F5A0] focus:ring-4 focus:ring-[#10F5A0]/30 text-white placeholder-slate-400",
  },
  {
    name: "rose",
    card: "bg-[#12030B] border-[2.5px] border-[#FF2A85] shadow-[0_0_32px_rgba(255,42,133,0.48),inset_0_0_24px_rgba(255,42,133,0.12)]",
    badge: "bg-[#FF2A85] text-white shadow-[0_0_18px_rgba(255,42,133,0.85)]",
    label: "text-[#FF66B2] drop-shadow-[0_0_10px_rgba(255,42,133,0.6)]",
    qTag: "text-[#FDA4AF] drop-shadow-[0_0_8px_rgba(255,42,133,0.5)]",
    counter: "bg-[#FF2A85]/15 border border-[#FF2A85]/60 text-[#FECDD3]",
    input:
      "bg-[#080105] border-[2px] border-[#FF2A85]/65 focus:border-[#FF2A85] focus:ring-4 focus:ring-[#FF2A85]/30 text-white placeholder-slate-400",
  },
];

const ApplicationCheckPage = () => {
  const navigate = useNavigate();
  const { checkId } = useParams();
  const userId = Number(localStorage.getItem("user_id"));

  const [check, setCheck] = useState(null);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCheck();
  }, [checkId]);

  const fetchCheck = async () => {
    setLoading(true);
    try {
      const response = await api.get(
        `/learner/application-check/${checkId}?user_id=${userId}`
      );
      setCheck(response.data);

      const initialAnswers = {};
      if (response.data && response.data.questions) {
        response.data.questions.forEach((q) => {
          initialAnswers[q.id] = "";
        });
      }
      setAnswers(initialAnswers);
    } catch (err) {
      console.error("Failed to fetch application check:", err);
      setError(
        err.response?.data?.detail ||
          "Failed to load application check. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionId, value) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  const handleSubmit = async () => {
    if (!check || !check.questions) return;

    setSubmitting(true);
    setError(null);

    try {
      const formattedAnswers = Object.entries(answers).map(
        ([questionId, answer]) => ({
          question_id: parseInt(questionId, 10),
          answer: answer.trim(),
        })
      );

      const response = await api.post("/learner/application-check/attempt", {
        user_id: userId,
        application_check_id: parseInt(checkId, 10),
        answers: formattedAnswers,
      });

      setResult(response.data);
    } catch (err) {
      console.error("Failed to submit application check:", err);
      setError(
        err.response?.data?.detail ||
          "Failed to submit application check. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  const totalQuestions = check?.questions?.length || 0;
  const answeredCount = useMemo(() => {
    if (!check?.questions) return 0;
    return check.questions.filter((q) => (answers[q.id] || "").trim().length > 0)
      .length;
  }, [check, answers]);

  const completionPct =
    totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;

  // ==========================================================================
  // LOADING STATE
  // ==========================================================================
  if (loading) {
    return (
      <MainLayout>
        <div className="-m-4 sm:-m-6 min-h-screen bg-[#020308] flex items-center justify-center p-6">
          <div className="bg-[#050917] border-[2.5px] border-[#00F5FF] shadow-[0_0_36px_rgba(0,245,255,0.45)] rounded-3xl px-12 py-10 text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#00F5FF]/30 border-t-[#00F5FF] mx-auto shadow-[0_0_18px_rgba(0,245,255,0.6)]" />
            <p className="text-sm font-black tracking-wider text-white uppercase">
              Loading Application Check...
            </p>
          </div>
        </div>
      </MainLayout>
    );
  }

  // ==========================================================================
  // ERROR STATE (NO CHECK LOADED)
  // ==========================================================================
  if (error && !check) {
    return (
      <MainLayout>
        <div className="-m-4 sm:-m-6 min-h-screen bg-[#020308] flex items-center justify-center p-6">
          <div className="max-w-lg w-full bg-[#14030B] border-[2.5px] border-[#FF2A85] shadow-[0_0_40px_rgba(255,42,133,0.45)] rounded-3xl p-8 text-center space-y-5">
            <div className="w-16 h-16 rounded-2xl bg-[#FF2A85]/20 border-2 border-[#FF2A85] flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(255,42,133,0.5)]">
              <AlertCircle size={34} className="text-[#FF66B2]" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white">
                Unable to Load Assessment
              </h2>
              <p className="text-sm text-rose-200 font-semibold mt-1.5">
                {error}
              </p>
            </div>
            <button
              onClick={handleBack}
              className="px-6 py-3 rounded-xl bg-[#00F5FF] hover:bg-[#67E8F9] text-slate-950 font-black text-xs uppercase tracking-wider shadow-[0_0_24px_rgba(0,245,255,0.6)] transition inline-flex items-center gap-2 cursor-pointer"
            >
              <ArrowLeft size={16} />
              Go Back
            </button>
          </div>
        </div>
      </MainLayout>
    );
  }

  // ==========================================================================
  // RESULT STATE (APPROVED / REJECTED / SUBMITTED)
  // ==========================================================================
  if (result) {
    const status = result.status?.toLowerCase();
    const isApproved = status === "approved";
    const isRejected = status === "rejected";
    const isSubmitted = status === "submitted";

    const resultCardCls = isApproved
      ? "bg-[#020D08] border-[2.5px] border-[#10F5A0] shadow-[0_0_48px_rgba(16,245,160,0.45),inset_0_0_24px_rgba(16,245,160,0.12)]"
      : isRejected
      ? "bg-[#14030B] border-[2.5px] border-[#FF2A85] shadow-[0_0_48px_rgba(255,42,133,0.45),inset_0_0_24px_rgba(255,42,133,0.12)]"
      : "bg-[#120902] border-[2.5px] border-[#FFE600] shadow-[0_0_48px_rgba(255,230,0,0.45),inset_0_0_24px_rgba(255,230,0,0.12)]";

    return (
      <MainLayout>
        <div className="-m-4 sm:-m-6 min-h-screen bg-[#020308] p-6 sm:p-10 flex items-center justify-center">
          <div
            className={`w-full max-w-2xl rounded-3xl p-8 sm:p-10 text-center space-y-6 ${resultCardCls}`}
          >
            {isApproved && (
              <>
                <div className="w-20 h-20 rounded-3xl bg-[#10F5A0]/20 border-2 border-[#10F5A0] shadow-[0_0_28px_rgba(16,245,160,0.6)] flex items-center justify-center mx-auto">
                  <CheckCircle size={44} className="text-[#10F5A0]" />
                </div>
                <div className="space-y-2">
                  <span className="px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest bg-[#10F5A0] text-slate-950 shadow-[0_0_16px_rgba(16,245,160,0.7)]">
                    Verified &amp; Approved
                  </span>
                  <h1 className="text-3xl sm:text-4xl font-black text-white pt-1 drop-shadow-[0_2px_12px_rgba(255,255,255,0.2)]">
                    Application Check Approved!
                  </h1>
                  <p className="text-slate-200 text-sm sm:text-base font-semibold max-w-md mx-auto">
                    Your Application Check has been verified and recorded on your
                    progress track.
                  </p>
                </div>
              </>
            )}

            {isRejected && (
              <>
                <div className="w-20 h-20 rounded-3xl bg-[#FF2A85]/20 border-2 border-[#FF2A85] shadow-[0_0_28px_rgba(255,42,133,0.6)] flex items-center justify-center mx-auto">
                  <AlertCircle size={44} className="text-[#FF2A85]" />
                </div>
                <div className="space-y-2">
                  <span className="px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest bg-[#FF2A85] text-white shadow-[0_0_16px_rgba(255,42,133,0.7)]">
                    Action Required
                  </span>
                  <h1 className="text-3xl sm:text-4xl font-black text-white pt-1 drop-shadow-[0_2px_12px_rgba(255,255,255,0.2)]">
                    Application Check Needs Revision
                  </h1>
                  <p className="text-slate-200 text-sm sm:text-base font-semibold max-w-md mx-auto">
                    Some required answers were missing or empty. Please review
                    your responses and reattempt the Application Check.
                  </p>
                </div>
              </>
            )}

            {isSubmitted && (
              <>
                <div className="w-20 h-20 rounded-3xl bg-[#FFE600]/20 border-2 border-[#FFE600] shadow-[0_0_28px_rgba(255,230,0,0.6)] flex items-center justify-center mx-auto">
                  <Clock size={44} className="text-[#FFE600]" />
                </div>
                <div className="space-y-2">
                  <span className="px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest bg-[#FFE600] text-slate-950 shadow-[0_0_16px_rgba(255,230,0,0.7)]">
                    In Review Queue
                  </span>
                  <h1 className="text-3xl sm:text-4xl font-black text-white pt-1 drop-shadow-[0_2px_12px_rgba(255,255,255,0.2)]">
                    Application Check Submitted
                  </h1>
                  <p className="text-slate-200 text-sm sm:text-base font-semibold max-w-md mx-auto">
                    Your Application Check has been submitted and is currently
                    awaiting Admin review.
                  </p>
                </div>
              </>
            )}

            <div className="flex flex-wrap justify-center gap-3 pt-3">
              {isRejected && (
                <button
                  onClick={() => setResult(null)}
                  className="px-6 py-3 rounded-2xl bg-[#FFE600] hover:bg-[#FFF066] text-slate-950 font-black text-xs uppercase tracking-wider shadow-[0_0_24px_rgba(255,230,0,0.65)] transition cursor-pointer"
                >
                  Reattempt Now
                </button>
              )}
              <button
                onClick={handleBack}
                className="px-6 py-3 rounded-2xl bg-[#00F5FF] hover:bg-[#67E8F9] text-slate-950 font-black text-xs uppercase tracking-wider shadow-[0_0_24px_rgba(0,245,255,0.65)] transition flex items-center gap-2 cursor-pointer"
              >
                <ArrowLeft size={16} />
                Back to Program
              </button>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  // ==========================================================================
  // MAIN QUESTION FORM VIEW: ENHANCED BRIGHT BORDERS + ULTRA-DARK VOID
  // ==========================================================================
  return (
    <MainLayout>
      <div className="-m-4 sm:-m-6 min-h-screen bg-[#020308] text-slate-100 p-5 sm:p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Top Navigation Button */}
          <div>
            <button
              onClick={handleBack}
              className="px-5 py-2.5 rounded-2xl bg-[#030917] border-2 border-[#00F5FF] text-[#00F5FF] hover:bg-[#00F5FF] hover:text-slate-950 font-black text-xs uppercase tracking-wider shadow-[0_0_22px_rgba(0,245,255,0.45)] transition inline-flex items-center gap-2 cursor-pointer"
            >
              <ArrowLeft size={16} />
              Back to Program
            </button>
          </div>

          {/* Header Tab (Pitch-Black Base + Bright Luminous Violet/Purple 2.5px Border) */}
          <header className="rounded-3xl p-6 sm:p-7 bg-[#060414] border-[2.5px] border-[#B026FF] shadow-[0_0_36px_rgba(176,38,255,0.45),inset_0_0_24px_rgba(176,38,255,0.14)] space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#00F5FF] via-[#B026FF] to-[#FFE600] shadow-[0_0_26px_rgba(176,38,255,0.65)] flex items-center justify-center shrink-0">
                  <ClipboardCheck size={30} className="text-slate-950 stroke-[2.5]" />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-[0.22em] text-[#C084FC] block drop-shadow-[0_0_8px_rgba(192,132,252,0.6)]">
                    PRACTICAL MASTERY ASSESSMENT
                  </span>
                  <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-0.5 drop-shadow-[0_2px_12px_rgba(255,255,255,0.2)]">
                    Application Check{" "}
                    {check && check.check_number ? `#${check.check_number}` : ""}
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-300 font-semibold mt-0.5">
                    Complete all {totalQuestions} scenario questions below with
                    clear, applied reasoning.
                  </p>
                </div>
              </div>

              {/* Completion Pill */}
              <div className="px-5 py-3 rounded-2xl bg-[#020712] border-[2.2px] border-[#10F5A0] shadow-[0_0_24px_rgba(16,245,160,0.45),inset_0_0_14px_rgba(16,245,160,0.15)] text-right shrink-0">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#10F5A0] block drop-shadow-[0_0_8px_rgba(16,245,160,0.6)]">
                  Completion
                </span>
                <span className="text-2xl font-black text-white tracking-tight">
                  {answeredCount} / {totalQuestions}
                </span>
              </div>
            </div>

            {/* Bright Progress Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] font-black">
                <span className="text-[#E9D5FF] flex items-center gap-1.5 drop-shadow-[0_0_8px_rgba(233,213,255,0.4)]">
                  <FileText size={14} className="text-[#00F5FF]" />
                  <span>Response Readiness</span>
                </span>
                <span className="text-[#10F5A0] font-black drop-shadow-[0_0_8px_rgba(16,245,160,0.6)]">
                  {completionPct}% Ready
                </span>
              </div>
              <div className="w-full h-3 rounded-full bg-[#010206] border-2 border-white/20 overflow-hidden p-0.5">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#00F5FF] via-[#B026FF] to-[#10F5A0] shadow-[0_0_18px_rgba(0,245,255,0.85)] transition-all duration-300"
                  style={{ width: `${completionPct}%` }}
                />
              </div>
            </div>
          </header>

          {/* Inline Error Alert */}
          {error && (
            <div className="rounded-2xl p-4 bg-[#18030D] border-[2.2px] border-[#FF2A85] shadow-[0_0_26px_rgba(255,42,133,0.4)] flex items-center gap-3">
              <AlertCircle size={20} className="text-[#FF66B2] shrink-0" />
              <p className="text-xs sm:text-sm font-bold text-rose-100">
                {error}
              </p>
            </div>
          )}

          {/* Question Tabs — Noticeable Bright 2.5px Borders + Ultra-Dark Bases */}
          {check && check.questions && (
            <div className="space-y-6">
              {check.questions.map((question, index) => {
                const theme =
                  QUESTION_TAB_THEMES[index % QUESTION_TAB_THEMES.length];
                const currentVal = answers[question.id] || "";
                const isAnswered = currentVal.trim().length > 0;

                return (
                  <div
                    key={question.id}
                    className={`rounded-3xl p-6 sm:p-7 transition-all duration-200 hover:-translate-y-0.5 ${theme.card}`}
                  >
                    <div className="flex items-start gap-4 sm:gap-5">
                      {/* Bright Number Pill */}
                      <div
                        className={`w-11 h-11 rounded-2xl font-black text-sm flex items-center justify-center shrink-0 ${theme.badge}`}
                      >
                        {index + 1}
                      </div>

                      <div className="flex-1 min-w-0 space-y-4">
                        <div className="flex flex-wrap items-start justify-between gap-2.5">
                          <div>
                            <span
                              className={`text-[10.5px] font-black uppercase tracking-[0.18em] block mb-1 ${theme.qTag}`}
                            >
                              Scenario Question {index + 1}
                            </span>
                            <p className="text-base sm:text-lg font-black text-white leading-relaxed drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
                              {question.question}
                            </p>
                          </div>

                          {/* Bright Status Badge */}
                          <span
                            className={`px-3.5 py-1.5 rounded-full text-[10.5px] font-black uppercase tracking-wider shrink-0 inline-flex items-center gap-1.5 ${
                              isAnswered
                                ? "bg-[#10F5A0] text-slate-950 shadow-[0_0_16px_rgba(16,245,160,0.7)] border border-[#10F5A0]"
                                : "bg-[#0A0D1A] text-[#FFE600] border-2 border-[#FFE600]/80 shadow-[0_0_12px_rgba(255,230,0,0.35)]"
                            }`}
                          >
                            {isAnswered ? (
                              <>
                                <Check size={13} className="stroke-[3]" />
                                <span>Answered</span>
                              </>
                            ) : (
                              <span>Pending</span>
                            )}
                          </span>
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <label
                              className={`text-xs font-black uppercase tracking-wider ${theme.label}`}
                            >
                              Your Written Response
                            </label>
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10.5px] font-black ${theme.counter}`}
                            >
                              {currentVal.trim().length} characters
                            </span>
                          </div>

                          <textarea
                            value={currentVal}
                            onChange={(e) =>
                              handleAnswerChange(question.id, e.target.value)
                            }
                            placeholder="Write your comprehensive, applied reasoning here..."
                            rows={4}
                            className={`w-full px-4 py-3.5 rounded-2xl text-sm font-semibold text-white focus:outline-none resize-y transition shadow-inner ${theme.input}`}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Bright Submit Action Bar */}
          {check && check.questions && check.questions.length > 0 && (
            <div className="rounded-3xl p-5 sm:p-6 bg-[#030814] border-[2.5px] border-[#10F5A0] shadow-[0_0_36px_rgba(16,245,160,0.45),inset_0_0_24px_rgba(16,245,160,0.14)] flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3 text-xs sm:text-sm font-black text-slate-100">
                <Sparkles size={20} className="text-[#FFE600] shrink-0 drop-shadow-[0_0_8px_rgba(255,230,0,0.8)]" />
                <span>
                  {answeredCount === totalQuestions
                    ? "All questions answered — ready for official submission!"
                    : `${totalQuestions - answeredCount} question(s) still empty.`}
                </span>
              </div>

              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="px-8 py-4 rounded-2xl bg-gradient-to-r from-[#00F5FF] via-[#10F5A0] to-[#FFE600] hover:brightness-110 text-slate-950 font-black text-sm tracking-wide shadow-[0_0_32px_rgba(16,245,160,0.7)] hover:scale-[1.02] active:scale-[0.99] transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-slate-950 border-t-transparent" />
                    <span>Submitting Assessment...</span>
                  </>
                ) : (
                  <>
                    <span>Submit Application Check</span>
                    <ChevronRight size={18} className="stroke-[3]" />
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default ApplicationCheckPage;
