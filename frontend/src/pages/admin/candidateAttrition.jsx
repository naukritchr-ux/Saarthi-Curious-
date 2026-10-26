import React, { useState, useEffect, useMemo } from "react";
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
import { API_BASE } from "../../config/api";

const ROBOT_AVATAR_URL = "/saarthi-robot.png";

// ============================================================================
// 1. OBSIDIAN DARK-GLOW TOOLTIP
// ============================================================================
const ObsidianTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="bg-[#080B16]/95 backdrop-blur-xl border border-cyan-400/40 px-3.5 py-2.5 rounded-xl shadow-[0_0_25px_rgba(34,211,238,0.35)] text-xs z-50">
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
// 2. POLYMORPHIC LOCKER INTELLIGENCE ENGINE (Original Survey Scoring)
// ============================================================================
function buildLockerConfiguration(lockerId, kpiCounts, effectiveness, responses) {
  const total = Math.max(1, kpiCounts.total_responses);
  const highPct = Math.round((kpiCounts.high_risk / total) * 100);
  const medPct = Math.round((kpiCounts.medium_risk / total) * 100);
  const lowPct = Math.round((kpiCounts.low_risk / total) * 100);
  const scorePct = Math.round((effectiveness.overall_score / 10) * 100);

  const baseRadar =
    Array.isArray(effectiveness.questions) && effectiveness.questions.length > 0
      ? effectiveness.questions.map((q, i) => ({
          subject: q.short || `Q${i + 1}`,
          score: Number(q.score_pct || 0),
          benchmark: 80,
        }))
      : [
          { subject: "Curriculum", score: scorePct || 20, benchmark: 80 },
          { subject: "Instruction", score: Math.max(10, scorePct - 5), benchmark: 80 },
          { subject: "Assessment", score: Math.min(100, scorePct + 10), benchmark: 80 },
          { subject: "Support", score: Math.max(15, scorePct), benchmark: 80 },
          { subject: "Retention", score: Math.min(100, 100 - highPct), benchmark: 80 },
        ];

  const configs = {
    total_responses: {
      badge: "KPI LOCKER • COHORT SUBMISSIONS & PARTICIPATION",
      title: "Total Responses & Survey Participation Intelligence",
      subtitle: `${kpiCounts.total_responses} Survey Submissions • ${scorePct}% Overall Survey Effectiveness`,
      accentColor: "#A855F7",
      hasRisk: highPct > 40,
      parameters: [
        { label: "Total Submissions", value: `${kpiCounts.total_responses}`, sub: "Original Surveys" },
        { label: "High Risk Share", value: `${highPct}%`, sub: `${kpiCounts.high_risk} Candidates` },
        { label: "Stable Share", value: `${lowPct}%`, sub: `${kpiCounts.low_risk} Candidates` },
        { label: "Survey Score", value: `${effectiveness.overall_score}/10`, sub: effectiveness.ratingBadge.label },
      ],
      radarTitle: "5-Axis Survey Competency & Sentiment Balance",
      radarData: baseRadar,
      waveTitle: "Cohort Retention vs. 7-Day AI Projected Lift",
      waveSub: "Projected shift in survey feedback positivity over next 7 days",
      waveData: [
        { name: "Day 1", primary: Math.max(15, scorePct), secondary: Math.max(10, 100 - highPct) },
        { name: "Day 3", primary: Math.min(100, scorePct + 16), secondary: Math.min(100, 100 - highPct + 18) },
        { name: "Day 5", primary: Math.min(100, scorePct + 32), secondary: Math.min(100, 100 - highPct + 34) },
        { name: "Day 7 Target", primary: Math.min(95, scorePct + 48), secondary: Math.min(95, 100 - highPct + 46) },
      ],
      sections: [
        {
          badge: "ORIGINAL SURVEY AUDIT",
          title: "1. Survey Submission & Keyword Sentiment Synthesis",
          tone: "cyan",
          body: `Across ${kpiCounts.total_responses} survey submissions in the database, the average survey score is ${effectiveness.overall_score}/10 (${effectiveness.ratingBadge.label}). Currently, ${kpiCounts.high_risk} candidates (${highPct}%) flagged high-risk keywords in their feedback, ${kpiCounts.medium_risk} (${medPct}%) show moderate sentiment, and ${kpiCounts.low_risk} (${lowPct}%) show positive feedback.`,
        },
        ...(highPct > 0
          ? [
              {
                badge: "RETENTION BOTTLENECK",
                title: `2. High Risk Concentration (${highPct}% of Cohort)`,
                tone: "rose",
                body: `Candidates flagging high-risk sentiment report primary dissatisfaction around "${effectiveness.needs_improvement_topic}" (${effectiveness.needs_improvement_pct}% score).`,
              },
            ]
          : []),
        {
          badge: "AI SURVEY PRESCRIPTION",
          title: `${highPct > 0 ? "3." : "2."} Survey & Curriculum Action Plan`,
          tone: "emerald",
          body: `Address feedback for "${effectiveness.needs_improvement_topic}" through targeted micro-learning recaps and a follow-up survey check-in.`,
        },
      ],
      quickPrompts: [
        "How can we improve feedback for lowest-rated questions?",
        "What is driving the current high-risk survey responses?",
        "Give me a 7-day action plan to reduce candidate survey dissatisfaction.",
      ],
    },

    high_risk: {
      badge: "RISK LOCKER • HIGH RISK CANDIDATE INTERVENTION",
      title: "High Risk Cohort Forensics (Score 8/10)",
      subtitle: `${kpiCounts.high_risk} High Risk Candidates (${highPct}% of Total) • Immediate Attention Required`,
      accentColor: "#F43F5E",
      hasRisk: kpiCounts.high_risk > 0,
      parameters: [
        { label: "High Risk Count", value: `${kpiCounts.high_risk}`, sub: `${highPct}% of Total` },
        { label: "Original Risk Score", value: "8 / 10", sub: "Critical Trigger" },
        { label: "Lowest Question", value: `${effectiveness.needs_improvement_pct}%`, sub: "Needs Work" },
        { label: "Action Status", value: "Urgent", sub: "Immediate Review" },
      ],
      radarTitle: "High-Risk Friction Points Radar",
      radarData: baseRadar.map((r) => ({
        ...r,
        score: Math.max(15, Math.round(r.score * 0.65)),
      })),
      waveTitle: "High-Risk Feedback Decay vs. AI Recovery Wave",
      waveSub: "Forecasted risk decrease with targeted mentor check-ins",
      waveData: [
        { name: "Today", primary: 15, secondary: 88 },
        { name: "48h Nudge", primary: 38, secondary: 64 },
        { name: "Day 5 Clip", primary: 62, secondary: 42 },
        { name: "Day 7 Saved", primary: 79, secondary: 24 },
      ],
      sections: [
        {
          badge: "KEYWORD ATTRITION FORENSICS",
          title: "1. Root-Cause Analysis for High-Risk Responses",
          tone: "rose",
          body: `${kpiCounts.high_risk} candidates submitted feedback containing critical stress or departure keywords. The lowest rated survey dimension is "${effectiveness.needs_improvement_topic}" (${effectiveness.needs_improvement_pct}% rating).`,
        },
        {
          badge: "INTERVENTION PROTOCOL",
          title: "2. Urgent Action Sequence",
          tone: "emerald",
          body: `Execute a 3-step intervention for all ${kpiCounts.high_risk} high-risk candidates:`,
          steps: [
            `Conduct an individual check-in addressing their feedback regarding "${effectiveness.needs_improvement_topic}".`,
            "Offer a 15-minute 1-on-1 mentor sync to resolve roadblocks.",
            "Send an updated feedback pulse check in 5 days.",
          ],
        },
      ],
      quickPrompts: [
        `Draft an urgent re-engagement message for the ${kpiCounts.high_risk} high-risk candidates.`,
        "Why are candidates flagging high risk in survey feedback?",
        "What questions are high-risk candidates rating the lowest?",
      ],
    },

    medium_risk: {
      badge: "RISK LOCKER • MEDIUM RISK COHORT (SCORE 5/10)",
      title: "Medium Risk Cohort Review & Support",
      subtitle: `${kpiCounts.medium_risk} Medium Risk Candidates (${medPct}% of Total) • Should Be Reviewed`,
      accentColor: "#F59E0B",
      hasRisk: kpiCounts.medium_risk > 0,
      parameters: [
        { label: "Medium Risk Count", value: `${kpiCounts.medium_risk}`, sub: `${medPct}% of Total` },
        { label: "Original Risk Score", value: "5 / 10", sub: "Neutral / Uncertain" },
        { label: "Conversion Rate", value: "85%", sub: "Potential to Low Risk" },
        { label: "Recommended Sync", value: "Weekly", sub: "Cohort Review" },
      ],
      radarTitle: "Medium-Risk Competency Radar",
      radarData: baseRadar.map((r) => ({
        ...r,
        score: Math.min(100, Math.max(35, r.score + 22)),
      })),
      waveTitle: "Medium-Risk Conversion Curve",
      waveSub: "Lifting neutral candidates into positive pacesetters",
      waveData: [
        { name: "Current", primary: 48, secondary: 52 },
        { name: "Day 3 Sync", primary: 64, secondary: 68 },
        { name: "Day 5 Recap", primary: 78, secondary: 82 },
        { name: "Day 7 Stable", primary: 88, secondary: 90 },
      ],
      sections: [
        {
          badge: "SENTIMENT DIAGNOSTIC",
          title: "1. Why Medium Risk Responses Occur",
          tone: "amber",
          body: `The ${kpiCounts.medium_risk} candidates in Medium Risk submitted neutral responses ("maybe", "unsure", "concern"). A supportive check-in quickly shifts these learners to Low Risk.`,
        },
        {
          badge: "RECOMMENDED ACTION",
          title: "2. Mid-Course Encouragement Sequence",
          tone: "emerald",
          body: "Provide supportive mid-curriculum summaries and quick check-in prompts.",
        },
      ],
      quickPrompts: [
        "How do we convert Medium Risk candidates to Low Risk?",
        "Draft a supportive encouragement message for neutral respondents.",
        "What are the main concerns flagged in Medium Risk feedback?",
      ],
    },

    low_risk: {
      badge: "STABILITY LOCKER • LOW RISK & PACESETTERS (SCORE 2/10)",
      title: "Low Risk & Satisfied Cohort Intelligence",
      subtitle: `${kpiCounts.low_risk} Low Risk Candidates (${lowPct}% of Total) • Currently Stable`,
      accentColor: "#10B981",
      hasRisk: false,
      parameters: [
        { label: "Low Risk Count", value: `${kpiCounts.low_risk}`, sub: `${lowPct}% of Cohort` },
        { label: "Original Risk Score", value: "2 / 10", sub: "Positive Feedback" },
        { label: "Top Rated Topic", value: `${effectiveness.highest_rated_pct}%`, sub: effectiveness.highest_rated_topic },
        { label: "Stability Index", value: "Optimal", sub: "No Flight Risk" },
      ],
      radarTitle: "Low-Risk Satisfaction Polygon",
      radarData: baseRadar.map((r) => ({
        ...r,
        score: Math.min(100, Math.max(78, r.score + 40)),
      })),
      waveTitle: "Sustained Satisfaction Trajectory",
      waveSub: "High retention consistency and peer leadership",
      waveData: [
        { name: "Week 1", primary: 76, secondary: 80 },
        { name: "Week 2", primary: 84, secondary: 86 },
        { name: "Current", primary: 92, secondary: 91 },
        { name: "Projected", primary: 98, secondary: 96 },
      ],
      sections: [
        {
          badge: "HIGH SATISFACTION TELEMETRY",
          title: "1. Positive Feedback Synthesis",
          tone: "emerald",
          body: `${kpiCounts.low_risk} candidates submitted highly positive survey ratings with strong agreement in "${effectiveness.highest_rated_topic}" (${effectiveness.highest_rated_pct}%).`,
        },
        {
          badge: "PEER MENTORSHIP RECOMMENDATION",
          title: "2. Leverage Top Performers",
          tone: "cyan",
          body: "Invite satisfied low-risk candidates to share study tips with peers.",
        },
      ],
      quickPrompts: [
        "How can we recognize and reward our lowest-risk candidates?",
        "Write a thank-you note to candidates with positive survey responses.",
        "What aspects of the training are working best according to feedback?",
      ],
    },

    survey_effectiveness: {
      badge: "EFFECTIVENESS LOCKER • ORIGINAL LIKERT AUDIT",
      title: "Survey Effectiveness & Question Deep-Dive",
      subtitle: `Overall Score: ${effectiveness.overall_score}/10 (${effectiveness.ratingBadge.label}) • Top: ${effectiveness.highest_rated_topic}`,
      accentColor: "#38BDF8",
      hasRisk: effectiveness.overall_score < 6.0,
      parameters: [
        { label: "Overall Score", value: `${effectiveness.overall_score}/10`, sub: effectiveness.ratingBadge.label },
        { label: "Highest Rated", value: `${effectiveness.highest_rated_pct}%`, sub: effectiveness.highest_rated_topic },
        { label: "Needs Improvement", value: `${effectiveness.needs_improvement_pct}%`, sub: effectiveness.needs_improvement_topic },
        { label: "Enterprise Target", value: "8.0 / 10", sub: "Standard SLA" },
      ],
      radarTitle: "Survey Dimension Radar",
      radarData: baseRadar,
      waveTitle: "Dimension Scores vs. 80% SLA Benchmark",
      waveSub: "Original Likert survey averages across modules",
      waveData:
        effectiveness.questions.length > 0
          ? effectiveness.questions.map((q) => ({
              name: q.short,
              primary: q.score_pct,
              secondary: 80,
            }))
          : [
              { name: "Dim 1", primary: 20, secondary: 80 },
              { name: "Dim 2", primary: 35, secondary: 80 },
              { name: "Dim 3", primary: 50, secondary: 80 },
              { name: "Dim 4", primary: 75, secondary: 80 },
            ],
      sections: [
        {
          badge: "LIKERT SCALE ANALYSIS",
          title: "1. Survey Effectiveness Breakdown",
          tone: "cyan",
          body: `The overall training effectiveness score is ${effectiveness.overall_score}/10 (${effectiveness.ratingBadge.label}). "${effectiveness.highest_rated_topic}" leads at ${effectiveness.highest_rated_pct}%, while "${effectiveness.needs_improvement_topic}" trails at ${effectiveness.needs_improvement_pct}%.`,
        },
        ...(effectiveness.overall_score < 6.0
          ? [
              {
                badge: "IMPROVEMENT ALERT",
                title: `2. Priority Remediation (${effectiveness.overall_score}/10)`,
                tone: "rose",
                body: `"${effectiveness.needs_improvement_topic}" (${effectiveness.needs_improvement_pct}%) requires review to raise the overall score to the 8.0/10 target.`,
              },
            ]
          : []),
        {
          badge: "RECOMMENDED ACTION",
          title: `${effectiveness.overall_score < 6.0 ? "3." : "2."} Score Improvement Plan`,
          tone: "emerald",
          body: `Restructure "${effectiveness.needs_improvement_topic}" with quick interactive video checkpoints.`,
        },
      ],
      quickPrompts: [
        `How do we lift Overall Score from ${effectiveness.overall_score}/10 to 8.5/10?`,
        `Why is "${effectiveness.needs_improvement_topic}" scoring ${effectiveness.needs_improvement_pct}%?`,
        "Recommend curriculum updates based on these Likert scores.",
      ],
    },

    question_analysis: {
      badge: "QUESTION LOCKER • GRANULAR QUESTION BREAKDOWN",
      title: "Question-by-Question Likert Scores",
      subtitle: `Analyzing ${effectiveness.questions.length} Survey Evaluation Dimensions`,
      accentColor: "#C084FC",
      hasRisk: effectiveness.needs_improvement_pct < 60,
      parameters: effectiveness.questions.slice(0, 4).map((q) => ({
        label: q.short,
        value: `${q.score_pct}%`,
        sub: q.question,
      })),
      radarTitle: "Question-Level Competency Polygon",
      radarData: baseRadar,
      waveTitle: "Question Score Velocity",
      waveSub: "Current question scores vs. target lift",
      waveData:
        effectiveness.questions.length > 0
          ? effectiveness.questions.map((q) => ({
              name: q.short,
              primary: q.score_pct,
              secondary: Math.min(95, q.score_pct + 35),
            }))
          : [
              { name: "Q1", primary: 20, secondary: 65 },
              { name: "Q2", primary: 35, secondary: 75 },
              { name: "Q3", primary: 50, secondary: 85 },
              { name: "Q4", primary: 65, secondary: 90 },
            ],
      sections: [
        {
          badge: "QUESTION SCORES",
          title: "1. Granular Question Averages",
          tone: "cyan",
          body: effectiveness.questions
            .map((q) => `${q.question}: ${q.score_pct}%`)
            .join(" • ") || "No survey question data submitted yet.",
        },
        {
          badge: "TARGETED REMEDIATION",
          title: "2. Curriculum Action Plan",
          tone: "emerald",
          body: `Focus immediate instructional enhancements on "${effectiveness.needs_improvement_topic}" (${effectiveness.needs_improvement_pct}%).`,
        },
      ],
      quickPrompts: [
        "Rank all survey questions from highest to lowest score.",
        "Which question has the biggest impact on candidate retention?",
        "What questions should we add to future surveys?",
      ],
    },

    feedback_responses: {
      badge: "RESPONSES LOCKER • INDIVIDUAL CANDIDATE LOGS",
      title: "Survey Feedback Responses & Audit Table",
      subtitle: `Showing ${responses.length} Filtered Survey Submissions`,
      accentColor: "#10B981",
      hasRisk: kpiCounts.high_risk > 0,
      parameters: [
        { label: "Total Responses", value: `${responses.length}`, sub: "Filtered Records" },
        { label: "Overall Score", value: `${effectiveness.overall_score}/10`, sub: "Survey Mean" },
        { label: "High Risk (8/10)", value: `${kpiCounts.high_risk}`, sub: "Requires Action" },
        { label: "Low Risk (2/10)", value: `${kpiCounts.low_risk}`, sub: "Stable / Satisfied" },
      ],
      radarTitle: "Response Sentiment Alignment",
      radarData: baseRadar,
      waveTitle: "Candidate Risk Score Distribution",
      waveSub: "Individual candidate risk scores (8: High, 5: Med, 2: Low)",
      waveData: responses.slice(0, 8).map((r) => ({
        name: (r.employee_name || "User").split(" ")[0],
        primary: (r.risk_score || 2) * 10,
        secondary: 20,
      })),
      sections: [
        {
          badge: "RESPONSE AUDIT",
          title: "1. Candidate Feedback Records",
          tone: "cyan",
          body: `Auditing ${responses.length} survey response records from the database. High risk candidates (score 8) flagged keyword concerns, while low risk candidates (score 2) submitted positive ratings.`,
        },
        {
          badge: "NEXT STEPS",
          title: "2. Follow-Up Plan",
          tone: "emerald",
          body: "Click on any response in the table to review their answers, or follow up directly with high-risk candidates.",
        },
      ],
      quickPrompts: [
        "Which candidates in the responses list need immediate follow-up?",
        "Summarize the main themes in candidate survey feedback.",
        "Draft a follow-up email for candidates who reported challenges.",
      ],
    },

    risk_insights: {
      badge: "EXECUTIVE LOCKER • RISK SUMMARY & RECOVERY",
      title: "Risk Summary Insights & Executive Briefing",
      subtitle: effectiveness.risk_summary_insight,
      accentColor: "#06B6D4",
      hasRisk: kpiCounts.high_risk > 0,
      parameters: [
        { label: "Total Surveys", value: `${kpiCounts.total_responses}`, sub: "Original DB Records" },
        { label: "High Risk", value: `${kpiCounts.high_risk}`, sub: "Immediate Attention" },
        { label: "Overall Score", value: `${effectiveness.overall_score}/10`, sub: effectiveness.ratingBadge.label },
        { label: "Target Score", value: "8.0 / 10", sub: "Enterprise SLA" },
      ],
      radarTitle: "Retention & Sentiment Radar",
      radarData: baseRadar,
      waveTitle: "Risk Reduction Forecast",
      waveSub: "Projected cohort stabilization over 7 days",
      waveData: [
        { name: "Day 1", primary: scorePct || 20, secondary: 25 },
        { name: "Day 3", primary: Math.min(100, (scorePct || 20) + 18), secondary: 48 },
        { name: "Day 5", primary: Math.min(100, (scorePct || 20) + 35), secondary: 68 },
        { name: "Day 7 Target", primary: Math.min(95, (scorePct || 20) + 52), secondary: 84 },
      ],
      sections: [
        {
          badge: "ORIGINAL RISK SUMMARY",
          title: "1. Candidate Attrition Risk Synthesis",
          tone: "cyan",
          body: effectiveness.risk_summary_insight,
        },
        ...(kpiCounts.high_risk > 0
          ? [
              {
                badge: "CRITICAL ALERT",
                title: `2. ${kpiCounts.high_risk} Candidate(s) Require Immediate Attention`,
                tone: "rose",
                body: "High-risk candidates reported significant hurdles in survey feedback.",
              },
            ]
          : []),
        {
          badge: "RECOMMENDED STRATEGY",
          title: `${kpiCounts.high_risk > 0 ? "3." : "2."} 7-Day Recovery Protocol`,
          tone: "emerald",
          body: "Direct support to high-risk candidates within 48 hours to resolve survey-identified friction.",
        },
      ],
      quickPrompts: [
        "Give me an executive summary of our candidate retention.",
        "What are the top 3 actions to take today to address survey risks?",
        "Predict our survey score improvement if we address lowest-rated topics.",
      ],
    },
  };

  return configs[lockerId] || configs.total_responses;
}

// ============================================================================
// 3. CENTERED LOCKER MODAL (Opens on Card/Section Click)
// ============================================================================
function LockerDetailModal({
  activeLockerId,
  onClose,
  onSwitchLocker,
  kpiCounts,
  effectiveness,
  responses,
}) {
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);

  const lockerConfig = useMemo(() => {
    if (!activeLockerId) return null;
    return buildLockerConfiguration(
      activeLockerId,
      kpiCounts,
      effectiveness,
      responses
    );
  }, [activeLockerId, kpiCounts, effectiveness, responses]);

  useEffect(() => {
    if (!lockerConfig) return;
    setChatHistory([
      {
        role: "ai",
        text: `Locker loaded for **${lockerConfig.title}**. ${lockerConfig.sections[0]?.body || ""} Select a quick prompt above or ask any question below!`,
      },
    ]);
  }, [lockerConfig]);

  if (!activeLockerId || !lockerConfig) return null;

  const handleSendChat = async (customQ) => {
    const q = (customQ || chatInput).trim();
    if (!q) return;
    setChatInput("");
    setChatHistory((prev) => [...prev, { role: "user", text: q }]);
    setChatLoading(true);

    try {
      const res = await axios.post(`${API_BASE}/analytics/ai-chat`, {
        question: q,
        context_title: lockerConfig.title,
        telemetry_context: {
          subtitle: lockerConfig.subtitle,
          parameters: lockerConfig.parameters,
          sections: lockerConfig.sections,
          kpis: kpiCounts,
        },
      });
      setChatHistory((prev) => [
        ...prev,
        {
          role: "ai",
          text:
            res.data?.answer ||
            lockerConfig.sections[lockerConfig.sections.length - 1]?.body,
        },
      ]);
    } catch {
      const fallback =
        lockerConfig.sections.map((s) => s.body).join(" ") ||
        lockerConfig.subtitle;
      setChatHistory((prev) => [...prev, { role: "ai", text: fallback }]);
    } finally {
      setChatLoading(false);
    }
  };

  const lockerTabs = [
    { id: "total_responses", label: "Total Responses" },
    { id: "high_risk", label: "High Risk" },
    { id: "medium_risk", label: "Medium Risk" },
    { id: "low_risk", label: "Low Risk" },
    { id: "survey_effectiveness", label: "Survey Effectiveness" },
    { id: "question_analysis", label: "Question Analysis" },
    { id: "feedback_responses", label: "Feedback Responses" },
    { id: "risk_insights", label: "Risk Summary Insights" },
  ];

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-6 overflow-y-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-6xl bg-[#0B0D18] border border-cyan-500/35 rounded-3xl shadow-[0_0_90px_rgba(6,182,212,0.25)] overflow-hidden my-auto max-h-[92vh] flex flex-col text-slate-100"
      >
        {/* Modal Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 bg-[#101426] border-b border-white/10">
          <div>
            <div className="flex items-center gap-2">
              <span
                className="text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full border"
                style={{
                  backgroundColor: `${lockerConfig.accentColor}20`,
                  borderColor: `${lockerConfig.accentColor}60`,
                  color: "#F8FAFC",
                }}
              >
                {lockerConfig.badge}
              </span>
              {lockerConfig.hasRisk ? (
                <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40">
                  ⚠️ Action Required
                </span>
              ) : (
                <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  ✓ Optimal Status
                </span>
              )}
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white mt-1">
              {lockerConfig.title}
            </h2>
            <p className="text-xs font-bold text-cyan-300 mt-0.5">
              {lockerConfig.subtitle}
            </p>
          </div>

          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/35 border border-rose-500/40 text-rose-200 text-xs font-extrabold transition"
          >
            ✕ Close Locker
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 px-6 py-2.5 bg-[#080B14] border-b border-white/10 overflow-x-auto">
          {lockerTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onSwitchLocker(tab.id)}
              className={`px-3 py-1 rounded-xl text-[11px] font-extrabold whitespace-nowrap transition ${
                activeLockerId === tab.id
                  ? "bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-[0_0_12px_rgba(56,189,248,0.4)]"
                  : "bg-white/5 text-slate-400 hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Modal Body */}
        <div className="grid grid-cols-12 gap-5 p-6 overflow-y-auto">
          {/* Left Column (Graphs & Telemetry) */}
          <div className="col-span-12 lg:col-span-7 space-y-4">
            {/* Parameters */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {lockerConfig.parameters.map((p, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-2xl bg-[#070913] border border-white/10 flex flex-col justify-between"
                >
                  <span className="text-[10px] font-bold text-slate-400 uppercase block line-clamp-1">
                    {p.label}
                  </span>
                  <span className="text-base font-extrabold text-white my-1 block">
                    {p.value}
                  </span>
                  <span className="text-[10px] text-cyan-300 font-semibold truncate">
                    {p.sub}
                  </span>
                </div>
              ))}
            </div>

            {/* Dual Graphs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-[#070913] rounded-2xl p-3.5 border border-cyan-500/25">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-cyan-200 block mb-1">
                  🕸️ {lockerConfig.radarTitle}
                </span>
                <div className="w-full h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart
                      cx="50%"
                      cy="50%"
                      outerRadius="68%"
                      data={lockerConfig.radarData}
                    >
                      <PolarGrid stroke="#1E293B" />
                      <PolarAngleAxis
                        dataKey="subject"
                        tick={{ fill: "#E2E8F0", fontSize: 10, fontWeight: 600 }}
                      />
                      <PolarRadiusAxis
                        domain={[0, 100]}
                        tick={false}
                        axisLine={false}
                      />
                      <Tooltip content={<ObsidianTooltip />} />
                      <Radar
                        name="Score"
                        dataKey="score"
                        stroke={lockerConfig.accentColor}
                        fill={lockerConfig.accentColor}
                        fillOpacity={0.4}
                        strokeWidth={2.2}
                      />
                      <Radar
                        name="Benchmark"
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
                  🌊 {lockerConfig.waveTitle}
                </span>
                <span className="text-[10px] text-slate-400 block mb-1">
                  {lockerConfig.waveSub}
                </span>
                <div className="w-full h-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={lockerConfig.waveData}
                      margin={{ top: 10, right: 8, left: -24, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="lockerWave1" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#38BDF8" stopOpacity={0.55} />
                          <stop offset="95%" stopColor="#38BDF8" stopOpacity={0.0} />
                        </linearGradient>
                        <linearGradient id="lockerWave2" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10B981" stopOpacity={0.55} />
                          <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        stroke="#1E293B"
                        strokeDasharray="3 3"
                        vertical={false}
                      />
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
                        dataKey="primary"
                        name="Current Trend"
                        stroke="#38BDF8"
                        strokeWidth={2.5}
                        fill="url(#lockerWave1)"
                      />
                      <Area
                        type="monotone"
                        dataKey="secondary"
                        name="Benchmark"
                        stroke="#10B981"
                        strokeWidth={2.5}
                        fill="url(#lockerWave2)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Sections */}
            <div className="space-y-3">
              {lockerConfig.sections.map((sec, idx) => {
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

          {/* Right Column (Saarthi AI Assistant) */}
          <div className="col-span-12 lg:col-span-5 flex flex-col justify-between bg-gradient-to-b from-[#0B1528] via-[#081020] to-[#050811] rounded-2xl p-5 border border-cyan-500/35 shadow-[0_0_45px_-10px_rgba(56,189,248,0.28)] min-h-[480px]">
            <div className="space-y-3.5">
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
                    Saarthi AI Locker Co-Pilot
                  </span>
                  <h3 className="text-base font-extrabold text-white mt-1">
                    AI Assistance & Strategy
                  </h3>
                </div>
              </div>

              <div className="space-y-2">
                {lockerConfig.quickPrompts.map((qp, idx) => (
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

            <div className="my-3 flex-1 overflow-y-auto space-y-2.5 max-h-[250px] pr-1">
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
              {chatLoading && (
                <div className="p-3.5 rounded-2xl bg-[#060B16] border border-cyan-500/30 text-xs text-cyan-300 animate-pulse">
                  ✦ Synthesizing response...
                </div>
              )}
            </div>

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
                placeholder={`Ask Saarthi AI about ${lockerConfig.title}...`}
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
// 4. CANDIDATE SURVEY ANSWERS DETAIL MODAL
// ============================================================================
function SurveyAnswersModal({ response, onClose }) {
  if (!response) return null;
  const answers = Array.isArray(response.answers) ? response.answers : [];

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl bg-[#0E101E] border border-purple-500/30 rounded-2xl p-6 text-slate-100 max-h-[85vh] flex flex-col shadow-2xl"
      >
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div>
            <h3 className="text-lg font-extrabold text-white">
              {response.employee_name || "Employee"} Survey Submission
            </h3>
            <p className="text-xs text-slate-400">
              {response.employee_email} • {response.survey_title || "Survey"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold transition"
          >
            ✕ Close
          </button>
        </div>

        <div className="grid grid-cols-3 gap-3 my-4">
          <div className="p-3 rounded-xl bg-white/5 border border-white/10">
            <span className="text-[10px] text-slate-400 block">Risk Score</span>
            <span className="text-base font-extrabold text-purple-400">
              {response.risk_score !== null ? `${response.risk_score} / 10` : "—"}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-white/5 border border-white/10">
            <span className="text-[10px] text-slate-400 block">Risk Level</span>
            <span
              className={`text-xs font-extrabold px-2 py-0.5 rounded-full inline-block mt-1 ${
                String(response.risk_level).toLowerCase() === "high"
                  ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                  : String(response.risk_level).toLowerCase() === "medium"
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                  : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
              }`}
            >
              {response.risk_level || "Low"}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-white/5 border border-white/10">
            <span className="text-[10px] text-slate-400 block">Submitted</span>
            <span className="text-xs font-semibold text-slate-300">
              {response.submitted_at ? new Date(response.submitted_at).toLocaleDateString() : "—"}
            </span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Questions & Candidate Answers
          </h4>
          {answers.length === 0 ? (
            <p className="text-xs text-slate-500 italic py-4">
              No detailed answers recorded for this submission.
            </p>
          ) : (
            answers.map((ans, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-black/30 border border-white/5 space-y-1"
              >
                <p className="text-xs font-semibold text-purple-300">
                  {idx + 1}. {ans.question || "Question"}
                </p>
                <p className="text-xs text-slate-200 pl-4 border-l-2 border-purple-500/50">
                  {ans.answer || "No response recorded"}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 5. MAIN COMPONENT: CandidateAttrition (100% Original Survey Scoring Mechanics)
// ============================================================================
export default function CandidateAttrition() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(() => new Date().toLocaleString());

  // Original 4 Filters
  const [searchEmployee, setSearchEmployee] = useState("");
  const [riskFilter, setRiskFilter] = useState("all");
  const [surveyFilter, setSurveyFilter] = useState("all");
  const [programFilter, setProgramFilter] = useState("all");

  // Download states
  const [downloadingCsv, setDownloadingCsv] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  // Active Locker Modal State & Selected Answer Detail Modal State
  const [activeLockerId, setActiveLockerId] = useState(null);
  const [selectedResponse, setSelectedResponse] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(
        `${API_BASE}/programs/survey-analytics/candidate-attrition`
      );
      setData(response.data);
      setLastUpdated(new Date().toLocaleString());
    } catch (err) {
      setError(
        err?.response?.data?.detail ||
          err.message ||
          "Failed to fetch original survey candidate attrition analytics."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Download helper for original CSV / PDF endpoints
  const downloadReport = async (url, fallbackFilename, setDownloadingState) => {
    setDownloadingState(true);
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to download report. Status: ${response.status}`);
      }
      const blob = await response.blob();
      let filename = fallbackFilename;
      const disposition = response.headers.get("content-disposition");
      if (disposition && disposition.indexOf("attachment") !== -1) {
        const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
        const matches = filenameRegex.exec(disposition);
        if (matches != null && matches[1]) {
          filename = matches[1].replace(/['"]/g, "");
        }
      }
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(objectUrl);
    } catch (err) {
      console.error(err.message || "Download failed.");
    } finally {
      setDownloadingState(false);
    }
  };

  // 100% Original Responses List
  const responsesList = useMemo(() => {
    return Array.isArray(data?.responses) ? data.responses : [];
  }, [data]);

  const allResponses = responsesList;

  // Unique Filter Options
  const surveyOptions = useMemo(() => {
    const set = new Set(responsesList.map((r) => r.survey_title).filter(Boolean));
    return Array.from(set);
  }, [responsesList]);

  const programOptions = useMemo(() => {
    const set = new Set(responsesList.map((r) => r.program_name).filter(Boolean));
    return Array.from(set);
  }, [responsesList]);

  // Filter Responses
  const filteredResponses = useMemo(() => {
    return responsesList.filter((item) => {
      const empName = item.employee_name || "";
      const empEmail = item.employee_email || "";
      const matchesSearch =
        !searchEmployee.trim() ||
        empName.toLowerCase().includes(searchEmployee.toLowerCase()) ||
        empEmail.toLowerCase().includes(searchEmployee.toLowerCase());

      const itemRisk = String(item.risk_level || "low").toLowerCase();
      const matchesRisk =
        riskFilter === "all" || itemRisk === riskFilter.toLowerCase();

      const matchesSurvey =
        surveyFilter === "all" || item.survey_title === surveyFilter;

      const matchesProgram =
        programFilter === "all" || item.program_name === programFilter;

      return matchesSearch && matchesRisk && matchesSurvey && matchesProgram;
    });
  }, [responsesList, searchEmployee, riskFilter, surveyFilter, programFilter]);

  // 100% Original KPI Counts directly from backend /programs/survey-analytics/candidate-attrition
  const kpiCounts = useMemo(() => {
    return {
      total_responses: data?.total_responses ?? responsesList.length,
      high_risk: data?.high_risk ?? responsesList.filter((r) => String(r.risk_level).toLowerCase() === "high").length,
      medium_risk: data?.medium_risk ?? responsesList.filter((r) => String(r.risk_level).toLowerCase() === "medium").length,
      low_risk: data?.low_risk ?? responsesList.filter((r) => String(r.risk_level).toLowerCase() === "low").length,
    };
  }, [data, responsesList]);

  // 100% Original Survey Effectiveness directly from backend
  const effectivenessData = useMemo(() => {
    const se = data?.survey_effectiveness || {};
    const rawQuestions = Array.isArray(se.questions)
      ? se.questions
      : Array.isArray(data?.question_analysis)
      ? data.question_analysis
      : [];

    const questions = rawQuestions.map((q, i) => {
      const avg = Number(q.average ?? 0);
      return {
        short: `Q${i + 1}`,
        question: q.question || `Question ${i + 1}`,
        score_pct: Math.round(avg <= 1.0 ? avg * 100 : avg),
        average: avg,
      };
    });

    const avgScore10 = Number(se.overall_score ?? 0);
    const interp = se.interpretation || (avgScore10 >= 7.5 ? "Effective" : avgScore10 >= 4.5 ? "Moderate" : "Very Poor");

    const ratingBadge =
      avgScore10 >= 7.5
        ? { label: interp, cls: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40" }
        : avgScore10 >= 4.5
        ? { label: interp, cls: "bg-amber-500/20 text-amber-300 border-amber-500/40" }
        : { label: interp, cls: "bg-rose-500/20 text-rose-300 border-rose-500/40" };

    const highestQ = se.highest_question;
    const lowestQ = se.lowest_question;

    let riskSummary = "All candidates currently show low attrition risk.";
    if (kpiCounts.high_risk > 0) {
      riskSummary = `${kpiCounts.high_risk} High-risk candidate(s) require immediate attention based on survey feedback.`;
    } else if (kpiCounts.medium_risk > 0) {
      riskSummary = `${kpiCounts.medium_risk} Medium-risk candidate(s) should be reviewed.`;
    }

    return {
      overall_score: avgScore10,
      interpretation: interp,
      ratingBadge,
      highest_rated_topic: highestQ?.question || questions[0]?.question || "Course Material",
      highest_rated_pct: Math.round(highestQ?.average ? highestQ.average * 100 : questions[0]?.score_pct ?? 0),
      needs_improvement_topic: lowestQ?.question || questions[questions.length - 1]?.question || "Assessment Velocity",
      needs_improvement_pct: Math.round(lowestQ?.average ? lowestQ.average * 100 : questions[questions.length - 1]?.score_pct ?? 0),
      questions,
      risk_summary_insight: riskSummary,
    };
  }, [data, kpiCounts]);

  const handleClearFilters = () => {
    setSearchEmployee("");
    setRiskFilter("all");
    setSurveyFilter("all");
    setProgramFilter("all");
  };

  // ==========================================================================
  // 1. LIVE MULTI-SECTION EXECUTIVE CSV GENERATOR (EXCEL-READY UTF-8 BOM)
  // ==========================================================================
  const handleDownloadCSV = () => {
    const escapeCSV = (val) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const total = Math.max(1, kpiCounts.total_responses);
    const highPct = ((kpiCounts.high_risk / total) * 100).toFixed(1);
    const medPct = ((kpiCounts.medium_risk / total) * 100).toFixed(1);
    const lowPct = ((kpiCounts.low_risk / total) * 100).toFixed(1);

    const csvLines = [
      // SECTION 1: REPORT METADATA & ACTIVE FILTERS
      ["SAARTHI CURIOUS — CANDIDATE ATTRITION & RETENTION INTELLIGENCE REPORT"].map(escapeCSV).join(","),
      ["Generated Timestamp", lastUpdated, "Active Risk Filter", riskFilter.toUpperCase()].map(escapeCSV).join(","),
      ["Active Program Filter", programFilter === "all" ? "All Programs" : programFilter, "Active Survey Filter", surveyFilter === "all" ? "All Surveys" : surveyFilter].map(escapeCSV).join(","),
      ["Search Query", searchEmployee || "None", "Records Exported", `${filteredResponses.length} of ${allResponses.length}`].map(escapeCSV).join(","),
      "",

      // SECTION 2: EXECUTIVE KPI SUMMARY
      ["1. EXECUTIVE COHORT KPI SUMMARY"].map(escapeCSV).join(","),
      ["Metric", "Count", "Cohort Share (%)", "Status / Action Threshold"].map(escapeCSV).join(","),
      ["Total Responses", kpiCounts.total_responses, "100.0%", "All Survey & Telemetry Submissions"].map(escapeCSV).join(","),
      ["High Risk Candidates", kpiCounts.high_risk, `${highPct}%`, "Requires Immediate Attention (Score 8/10)"].map(escapeCSV).join(","),
      ["Medium Risk Candidates", kpiCounts.medium_risk, `${medPct}%`, "Should Be Reviewed (Score 5/10)"].map(escapeCSV).join(","),
      ["Low Risk Candidates", kpiCounts.low_risk, `${lowPct}%`, "Currently Stable (Score 2/10)"].map(escapeCSV).join(","),
      ["Overall Survey Effectiveness", `${effectivenessData.overall_score}/10`, `${Math.round(effectivenessData.overall_score * 10)}%`, effectivenessData.ratingBadge.label].map(escapeCSV).join(","),
      "",

      // SECTION 3: SURVEY EFFECTIVENESS & QUESTION DIMENSION ANALYSIS
      ["2. SURVEY EFFECTIVENESS & QUESTION DIMENSION ANALYSIS"].map(escapeCSV).join(","),
      ["Highest Rated Dimension", effectivenessData.highest_rated_topic, `${effectivenessData.highest_rated_pct}%`, "Cohort Strength"].map(escapeCSV).join(","),
      ["Needs Improvement Dimension", effectivenessData.needs_improvement_topic, `${effectivenessData.needs_improvement_pct}%`, "Primary Friction Bottleneck"].map(escapeCSV).join(","),
      ["Question Code", "Evaluation Dimension", "Live Score (%)", "Enterprise Benchmark (%)", "Variance to Target"].map(escapeCSV).join(","),
      ...effectivenessData.questions.map((q) =>
        [
          q.short,
          q.question,
          `${q.score_pct}%`,
          "80.0%",
          `${(q.score_pct - 80).toFixed(1)}%`,
        ]
          .map(escapeCSV)
          .join(",")
      ),
      "",

      // SECTION 4: SAARTHI AI EXECUTIVE INSIGHT
      ["3. SAARTHI AI RISK SUMMARY INSIGHT"].map(escapeCSV).join(","),
      ["AI Executive Synthesis", effectivenessData.risk_summary_insight].map(escapeCSV).join(","),
      "",

      // SECTION 5: GRANULAR CANDIDATE ROSTER & AI PRESCRIPTIONS
      ["4. INDIVIDUAL CANDIDATE TELEMETRY, RISK & AI PRESCRIPTIONS"].map(escapeCSV).join(","),
      [
        "Candidate Name",
        "Email",
        "Program",
        "Survey Track",
        "Effectiveness Score (/10)",
        "Flight Risk (/10)",
        "Risk Level",
        "Course Completion (%)",
        "Quiz Mastery (%)",
        "Telemetry Feedback / Summary",
        "Personalized Saarthi AI Prescription",
      ]
        .map(escapeCSV)
        .join(","),
      ...filteredResponses.map((r) => {
        const rName = r.name || r.employee_name || "Candidate";
        const rEmail = r.email || r.employee_email || "N/A";
        const rProg = r.program_name || "N/A";
        const rSurvey = r.survey_name || r.survey_title || "Survey Track";
        const rRisk = String(r.risk_level || "low").toLowerCase();
        const rLabel = r.risk_label || (rRisk === "high" ? "High Risk" : rRisk === "medium" ? "Medium Risk" : "Low Risk");
        const rScore = r.risk_score !== undefined && r.risk_score !== null ? r.risk_score : (rRisk === "high" ? 8 : rRisk === "medium" ? 5 : 2);
        const rScore10 = r.score_out_of_10 !== undefined && r.score_out_of_10 !== null ? r.score_out_of_10 : (10 - rScore);
        const rComp = r.completion_pct !== undefined ? `${r.completion_pct}%` : "100%";
        const rQuiz = r.quiz_mastery_pct !== undefined ? `${r.quiz_mastery_pct}%` : "N/A";
        const rComment = r.feedback_comment || (Array.isArray(r.answers) && r.answers.length ? r.answers.map((a) => `${a.question || 'Q'}: ${a.answer || '-'}`).join(" | ") : "Survey submitted");

        const prescription =
          rRisk === "high"
            ? `Urgent: Review survey feedback for ${rProg} + schedule 1-on-1 check-in to resolve module friction.`
            : rRisk === "medium"
            ? `Momentum Nudge: Send mid-week checkpoint digest + follow up on survey feedback for ${rProg}.`
            : `Champion Track: Recognize positive feedback in ${rProg} & invite peer mentorship.`;

        return [
          rName,
          rEmail,
          rProg,
          rSurvey,
          `${rScore10}/10`,
          `${rScore}/10`,
          rLabel,
          rComp,
          rQuiz,
          rComment,
          prescription,
        ]
          .map(escapeCSV)
          .join(",");
      }),
    ];

    // Prepend UTF-8 BOM (\uFEFF) so Excel opens symbols and formatting cleanly
    const csvContent = "\uFEFF" + csvLines.join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const dateStamp = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.download = `Saarthi_Candidate_Attrition_Report_${dateStamp}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // ==========================================================================
  // 2. LIVE EXECUTIVE PDF DOSSIER GENERATOR (VECTOR CHARTS, KPIS & ROSTER)
  // ==========================================================================
  const handleDownloadPDF = () => {
    const total = Math.max(1, kpiCounts.total_responses);
    const highPct = Math.round((kpiCounts.high_risk / total) * 100);
    const medPct = Math.round((kpiCounts.medium_risk / total) * 100);
    const lowPct = Math.round((kpiCounts.low_risk / total) * 100);
    const effPct = Math.min(100, Math.max(0, Math.round(effectivenessData.overall_score * 10)));

    // SVG Radial Gauge math for PDF
    const rGauge = 42;
    const cGauge = (2 * Math.PI * rGauge).toFixed(2);
    const offGauge = (cGauge - (effPct / 100) * cGauge).toFixed(2);

    const questionRowsHtml =
      effectivenessData.questions.length > 0
        ? effectivenessData.questions
            .map(
              (q) => `
              <div style="margin-bottom: 10px;">
                <div style="display:flex; justify-content:space-between; font-size:11px; font-weight:700; color:#1E293B; margin-bottom:4px;">
                  <span>${q.short} — ${q.question}</span>
                  <span style="color:#6D28D9;">${q.score_pct}% <span style="color:#94A3B8; font-weight:500;">(Target: 80%)</span></span>
                </div>
                <div style="width:100%; height:8px; background:#E2E8F0; border-radius:99px; overflow:hidden;">
                  <div style="width:${Math.min(100, Math.max(4, q.score_pct))}%; height:100%; background:linear-gradient(90deg, #7C3AED, #06B6D4); border-radius:99px;"></div>
                </div>
              </div>`
            )
            .join("")
        : `<div style="font-size:11px; color:#64748B; font-style:italic;">No question telemetry records found yet.</div>`;

    const candidateRowsHtml =
      filteredResponses.length > 0
        ? filteredResponses
            .map((r) => {
              const rName = r.name || r.employee_name || "Candidate";
              const rEmail = r.email || r.employee_email || "";
              const rProg = r.program_name || "Program";
              const rRisk = String(r.risk_level || "low").toLowerCase();
              const rLabel = r.risk_label || (rRisk === "high" ? "High Risk" : rRisk === "medium" ? "Medium Risk" : "Low Risk");
              const rScore = r.risk_score !== undefined && r.risk_score !== null ? r.risk_score : (rRisk === "high" ? 8 : rRisk === "medium" ? 5 : 2);
              const rScore10 = r.score_out_of_10 !== undefined && r.score_out_of_10 !== null ? r.score_out_of_10 : (10 - rScore);
              const rComp = r.completion_pct !== undefined ? `${r.completion_pct}%` : "100%";
              const rQuiz = r.quiz_mastery_pct !== undefined ? `${r.quiz_mastery_pct}%` : "N/A";

              const badgeBg =
                rRisk === "high"
                  ? "#FFE4E6"
                  : rRisk === "medium"
                  ? "#FEF3C7"
                  : "#D1FAE5";
              const badgeCol =
                rRisk === "high"
                  ? "#BE123C"
                  : rRisk === "medium"
                  ? "#B45309"
                  : "#047857";
              const aiAction =
                rRisk === "high"
                  ? `Assign 3-min micro-video recap in ${rProg} + conduct 1-on-1 check-in.`
                  : rRisk === "medium"
                  ? `Send mid-course progress digest + follow up on survey feedback.`
                  : `Recognize positive survey rating & invite peer mentorship.`;

              return `
              <tr>
                <td style="padding:8px 10px; border-bottom:1px solid #E2E8F0; font-weight:700; color:#0F172A;">
                  ${rName}
                  <div style="font-size:9.5px; color:#64748B; font-weight:500;">${rEmail || rProg}</div>
                </td>
                <td style="padding:8px 10px; border-bottom:1px solid #E2E8F0; color:#334155;">${rProg}</td>
                <td style="padding:8px 10px; border-bottom:1px solid #E2E8F0; font-weight:800; color:#6D28D9;">${rScore10}/10</td>
                <td style="padding:8px 10px; border-bottom:1px solid #E2E8F0; color:#0F172A; font-weight:700;">${rComp}</td>
                <td style="padding:8px 10px; border-bottom:1px solid #E2E8F0; color:#059669; font-weight:700;">${rQuiz}</td>
                <td style="padding:8px 10px; border-bottom:1px solid #E2E8F0;">
                  <span style="background:${badgeBg}; color:${badgeCol}; font-weight:800; font-size:9.5px; padding:3px 8px; border-radius:99px; display:inline-block;">
                    ${rLabel} (${rScore}/10)
                  </span>
                </td>
                <td style="padding:8px 10px; border-bottom:1px solid #E2E8F0; font-size:10px; color:#334155; line-height:1.35;">
                  ${aiAction}
                </td>
              </tr>`;
            })
            .join("")
        : `<tr><td colspan="7" style="padding:18px; text-align:center; color:#64748B;">No candidate survey responses match the active filter criteria.</td></tr>`;

    const printWindow = window.open("", "_blank", "width=1120,height=850");
    if (!printWindow) {
      window.print();
      return;
    }

    const htmlDocument = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>Saarthi Curious — Candidate Attrition Report (${lastUpdated})</title>
        <style>
          @page { size: A4 landscape; margin: 12mm; }
          * { box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; color: #0F172A; background: #FFFFFF; margin: 0; padding: 0; }
          .header-banner { background: linear-gradient(135deg, #12101E 0%, #1E1B4B 60%, #0F172A 100%); color: #FFFFFF; padding: 20px 24px; border-radius: 14px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
          .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 16px; }
          .kpi-card { background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; padding: 14px 16px; }
          .mid-grid { display: grid; grid-template-columns: 5fr 7fr; gap: 14px; margin-bottom: 16px; }
          .panel { background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; padding: 16px; }
          .ai-box { background: linear-gradient(90deg, #F5F3FF, #ECFEFF); border: 1px solid #C4B5FD; border-radius: 12px; padding: 14px 18px; margin-bottom: 16px; }
          table { width: 100%; border-collapse: collapse; font-size: 11px; }
          th { background: #1E1B4B; color: #FFFFFF; text-align: left; padding: 9px 10px; font-size: 10px; text-transform: uppercase; letter-spacing: 0.04em; }
        </style>
      </head>
      <body>
        <!-- 1. EXECUTIVE HEADER -->
        <div class="header-banner">
          <div>
            <div style="font-size:10px; font-weight:800; letter-spacing:0.12em; color:#38BDF8; text-transform:uppercase;">
              Saarthi Curious • Enterprise L&D Telemetry Dossier
            </div>
            <h1 style="margin:4px 0 2px; font-size:22px; font-weight:800;">Candidate Attrition & Training Effectiveness Report</h1>
            <div style="font-size:11px; color:#CBD5E1;">
              Generated: ${lastUpdated} &nbsp;|&nbsp; Program Filter: ${programFilter === "all" ? "All Programs" : programFilter} &nbsp;|&nbsp; Risk Filter: ${riskFilter.toUpperCase()}
            </div>
          </div>
          <div style="text-align:right; background:rgba(255,255,255,0.08); padding:10px 16px; border-radius:10px; border:1px solid rgba(255,255,255,0.15);">
            <div style="font-size:10px; color:#E2E8F0; text-transform:uppercase; font-weight:700;">Overall Effectiveness</div>
            <div style="font-size:24px; font-weight:900; color:#C084FC;">${effectivenessData.overall_score}/10</div>
          </div>
        </div>

        <!-- 2. 4 KPI CARDS -->
        <div class="kpi-grid">
          <div class="kpi-card" style="border-left: 4px solid #7C3AED;">
            <div style="font-size:10px; font-weight:800; color:#64748B; text-transform:uppercase;">Total Responses</div>
            <div style="font-size:26px; font-weight:900; color:#6D28D9; margin:4px 0;">${kpiCounts.total_responses}</div>
            <div style="font-size:10px; color:#64748B;">Original Survey Submissions</div>
          </div>
          <div class="kpi-card" style="border-left: 4px solid #E11D48;">
            <div style="font-size:10px; font-weight:800; color:#64748B; text-transform:uppercase;">High Risk (${highPct}%)</div>
            <div style="font-size:26px; font-weight:900; color:#E11D48; margin:4px 0;">${kpiCounts.high_risk}</div>
            <div style="font-size:10px; color:#64748B;">Requires immediate attention</div>
          </div>
          <div class="kpi-card" style="border-left: 4px solid #D97706;">
            <div style="font-size:10px; font-weight:800; color:#64748B; text-transform:uppercase;">Medium Risk (${medPct}%)</div>
            <div style="font-size:26px; font-weight:900; color:#D97706; margin:4px 0;">${kpiCounts.medium_risk}</div>
            <div style="font-size:10px; color:#64748B;">Should be reviewed</div>
          </div>
          <div class="kpi-card" style="border-left: 4px solid #059669;">
            <div style="font-size:10px; font-weight:800; color:#64748B; text-transform:uppercase;">Low Risk (${lowPct}%)</div>
            <div style="font-size:26px; font-weight:900; color:#059669; margin:4px 0;">${kpiCounts.low_risk}</div>
            <div style="font-size:10px; color:#64748B;">Currently stable</div>
          </div>
        </div>

        <!-- 3. SURVEY EFFECTIVENESS & QUESTION DIMENSION GRAPH -->
        <div class="mid-grid">
          <div class="panel" style="display:flex; align-items:center; justify-content:space-between; gap:16px;">
            <div>
              <div style="font-size:11px; font-weight:800; color:#475569; text-transform:uppercase;">Survey Effectiveness</div>
              <div style="font-size:32px; font-weight:900; color:#6D28D9; margin:4px 0;">${effectivenessData.overall_score}/10</div>
              <div style="font-size:10px; font-weight:800; color:#047857; background:#D1FAE5; padding:3px 10px; border-radius:99px; display:inline-block; margin-bottom:10px;">
                ${effectivenessData.ratingBadge.label}
              </div>
              <div style="font-size:10.5px; color:#334155; margin-top:4px;">
                <strong>🏆 Highest Rated:</strong> ${effectivenessData.highest_rated_topic} (${effectivenessData.highest_rated_pct}%)
              </div>
              <div style="font-size:10.5px; color:#334155; margin-top:4px;">
                <strong>⚠️ Needs Improvement:</strong> ${effectivenessData.needs_improvement_topic} (${effectivenessData.needs_improvement_pct}%)
              </div>
            </div>
            <svg width="104" height="104" viewBox="0 0 104 104" style="transform:rotate(-90deg); flex-shrink:0;">
              <circle cx="52" cy="52" r="${rGauge}" fill="none" stroke="#E2E8F0" stroke-width="10" />
              <circle cx="52" cy="52" r="${rGauge}" fill="none" stroke="#7C3AED" stroke-width="10" stroke-dasharray="${cGauge}" stroke-dashoffset="${offGauge}" stroke-linecap="round" />
            </svg>
          </div>

          <div class="panel">
            <div style="font-size:11px; font-weight:800; color:#475569; text-transform:uppercase; margin-bottom:10px;">
              Question & Competency Dimension Analysis
            </div>
            ${questionRowsHtml}
          </div>
        </div>

        <!-- 4. SAARTHI AI EXECUTIVE RISK INSIGHT & PRESCRIPTION -->
        <div class="ai-box">
          <div style="font-size:10px; font-weight:800; color:#5B21B6; text-transform:uppercase; margin-bottom:4px;">
            ✦ Saarthi AI Executive Risk Summary & Retention Prescription
          </div>
          <div style="font-size:11.5px; color:#1E293B; line-height:1.45;">
            ${effectivenessData.risk_summary_insight}
            <strong> Recommended Action:</strong> Focus immediate instructional updates on <em>${effectivenessData.needs_improvement_topic}</em> (${effectivenessData.needs_improvement_pct}%) to resolve survey-identified friction points.
          </div>
        </div>

        <!-- 5. CANDIDATE TELEMETRY & AI PRESCRIPTION TABLE -->
        <div>
          <div style="font-size:11px; font-weight:800; color:#1E1B4B; text-transform:uppercase; margin-bottom:8px;">
            Candidate Retention Roster & Individual AI Prescriptions (Showing ${filteredResponses.length} Records)
          </div>
          <table>
            <thead>
              <tr>
                <th>Candidate</th>
                <th>Program</th>
                <th>Score</th>
                <th>Completion</th>
                <th>Quiz Mastery</th>
                <th>Risk Status</th>
                <th>Personalized Saarthi AI Prescription</th>
              </tr>
            </thead>
            <tbody>
              ${candidateRowsHtml}
            </tbody>
          </table>
        </div>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlDocument);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 350);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080711] text-slate-100 flex flex-col items-center justify-center p-6">
        <div className="w-12 h-12 rounded-full border-4 border-purple-500/30 border-t-purple-400 animate-spin mb-3" />
        <h2 className="text-sm font-bold text-purple-200">
          Loading Candidate Attrition Report...
        </h2>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#080711] text-slate-100 flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md bg-[#12101E] border border-rose-500/40 rounded-2xl p-6">
          <h2 className="text-base font-extrabold text-rose-300">
            Failed to Load Data
          </h2>
          <p className="text-xs text-slate-300 mt-2">{error}</p>
          <button
            onClick={fetchData}
            className="mt-4 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-extrabold transition"
          >
            ↻ Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080711] text-slate-100 font-sans p-5 md:p-6 space-y-5 selection:bg-purple-500 selection:text-white overflow-x-hidden">
      <style>{`
        @keyframes robotFloat {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-6px) rotate(1.5deg); }
        }
        .animate-robot-float {
          animation: robotFloat 3.6s ease-in-out infinite;
        }
      `}</style>

      {/* ===================================================================
          1. FIXED HEADER BAR
      =================================================================== */}
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white">
            Candidate Attrition Report
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Analysis of candidate retention and training effectiveness
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Last updated: {lastUpdated}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleDownloadCSV}
            className="px-4 py-2 rounded-xl bg-[#12101E] hover:bg-[#1A162B] border border-white/15 text-xs font-bold text-slate-200 transition flex items-center gap-2 shadow-sm"
          >
            <span>📄 Download CSV</span>
          </button>
          <button
            onClick={handleDownloadPDF}
            className="px-4 py-2 rounded-xl bg-[#6D28D9] hover:bg-[#5B21B6] text-xs font-extrabold text-white shadow-[0_0_20px_rgba(109,40,217,0.45)] transition flex items-center gap-2"
          >
            <span>📊 Download PDF</span>
          </button>
        </div>
      </header>

      {/* ===================================================================
          2. ROW 1: 4 KPI CARDS (Each acts as an Interactive Locker)
      =================================================================== */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Responses */}
        <div
          onClick={() => setActiveLockerId("total_responses")}
          className="group cursor-pointer bg-[#12101E] rounded-2xl p-5 border border-white/10 hover:border-purple-400/70 hover:-translate-y-0.5 shadow-[0_4px_25px_rgba(0,0,0,0.4)] transition-all"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm">📋</span>
              <span className="text-xs font-bold text-slate-200">
                Total Responses
              </span>
            </div>
            <span className="text-[10px] font-bold text-purple-300 opacity-0 group-hover:opacity-100 transition">
              Open Report ➔
            </span>
          </div>
          <div className="text-3xl font-extrabold text-purple-400 my-2">
            {kpiCounts.total_responses}
          </div>
          <p className="text-[11px] text-slate-400">All survey submissions</p>
        </div>

        {/* High Risk (Score 8) */}
        <div
          onClick={() => setActiveLockerId("high_risk")}
          className="group cursor-pointer bg-[#12101E] rounded-2xl p-5 border border-l-4 border-l-rose-500 border-white/10 hover:border-rose-400/70 hover:-translate-y-0.5 shadow-[0_4px_25px_rgba(0,0,0,0.4)] transition-all"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-full bg-rose-500 shadow-[0_0_10px_#F43F5E]" />
              <span className="text-xs font-bold text-slate-200">High Risk</span>
            </div>
            <span className="text-[10px] font-bold text-rose-300 opacity-0 group-hover:opacity-100 transition">
              Open Report ➔
            </span>
          </div>
          <div className="text-3xl font-extrabold text-rose-500 my-2">
            {kpiCounts.high_risk}
          </div>
          <p className="text-[11px] text-slate-400">
            Requires immediate attention
          </p>
        </div>

        {/* Medium Risk (Score 5) */}
        <div
          onClick={() => setActiveLockerId("medium_risk")}
          className="group cursor-pointer bg-[#12101E] rounded-2xl p-5 border border-l-4 border-l-amber-400 border-white/10 hover:border-amber-400/70 hover:-translate-y-0.5 shadow-[0_4px_25px_rgba(0,0,0,0.4)] transition-all"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-full bg-amber-400 shadow-[0_0_10px_#F59E0B]" />
              <span className="text-xs font-bold text-slate-200">
                Medium Risk
              </span>
            </div>
            <span className="text-[10px] font-bold text-amber-300 opacity-0 group-hover:opacity-100 transition">
              Open Report ➔
            </span>
          </div>
          <div className="text-3xl font-extrabold text-amber-400 my-2">
            {kpiCounts.medium_risk}
          </div>
          <p className="text-[11px] text-slate-400">Should be reviewed</p>
        </div>

        {/* Low Risk (Score 2) */}
        <div
          onClick={() => setActiveLockerId("low_risk")}
          className="group cursor-pointer bg-[#12101E] rounded-2xl p-5 border border-l-4 border-l-emerald-500 border-white/10 hover:border-emerald-400/70 hover:-translate-y-0.5 shadow-[0_4px_25px_rgba(0,0,0,0.4)] transition-all"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 shadow-[0_0_10px_#10B981]" />
              <span className="text-xs font-bold text-slate-200">Low Risk</span>
            </div>
            <span className="text-[10px] font-bold text-emerald-300 opacity-0 group-hover:opacity-100 transition">
              Open Report ➔
            </span>
          </div>
          <div className="text-3xl font-extrabold text-emerald-400 my-2">
            {kpiCounts.low_risk}
          </div>
          <p className="text-[11px] text-slate-400">Currently stable</p>
        </div>
      </section>

      {/* ===================================================================
          3. ROW 2: FILTERS CONTAINER
      =================================================================== */}
      <section className="bg-[#12101E] rounded-2xl p-5 border border-white/10 shadow-[0_4px_25px_rgba(0,0,0,0.4)]">
        <div className="flex items-center justify-between mb-3.5">
          <h2 className="text-sm font-extrabold text-white">Filters</h2>
          <button
            onClick={handleClearFilters}
            className="text-xs font-bold text-purple-300 hover:text-purple-200 transition"
          >
            Clear Filters
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-[11px] font-bold text-slate-400 mb-1.5">
              Search Employee
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-xs text-slate-400">
                🔍
              </span>
              <input
                type="text"
                value={searchEmployee}
                onChange={(e) => setSearchEmployee(e.target.value)}
                placeholder="Name or email..."
                className="w-full bg-[#080711] border border-white/10 focus:border-purple-500 rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-slate-500 outline-none transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-400 mb-1.5">
              Risk Level
            </label>
            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              className="w-full bg-[#080711] border border-white/10 focus:border-purple-500 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none"
            >
              <option value="all">All Risk Levels</option>
              <option value="high">High Risk</option>
              <option value="medium">Medium Risk</option>
              <option value="low">Low Risk</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-400 mb-1.5">
              Survey
            </label>
            <select
              value={surveyFilter}
              onChange={(e) => setSurveyFilter(e.target.value)}
              className="w-full bg-[#080711] border border-white/10 focus:border-purple-500 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none"
            >
              <option value="all">All Surveys</option>
              {surveyOptions.map((surv) => (
                <option key={surv} value={surv}>
                  {surv}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-400 mb-1.5">
              Program
            </label>
            <select
              value={programFilter}
              onChange={(e) => setProgramFilter(e.target.value)}
              className="w-full bg-[#080711] border border-white/10 focus:border-purple-500 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none"
            >
              <option value="all">All Programs</option>
              {programOptions.map((prog) => (
                <option key={prog} value={prog}>
                  {prog}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* ===================================================================
          4. ROW 3: SURVEY EFFECTIVENESS
      =================================================================== */}
      <section className="bg-[#12101E] rounded-2xl p-5 border border-purple-500/20 shadow-[0_4px_25px_rgba(0,0,0,0.4)] space-y-4">
        <div
          onClick={() => setActiveLockerId("survey_effectiveness")}
          className="flex items-center justify-between cursor-pointer group"
        >
          <div className="flex items-center gap-2">
            <span className="text-base">📊</span>
            <h2 className="text-base font-extrabold text-white group-hover:text-purple-300 transition">
              Survey Effectiveness
            </h2>
          </div>
          <span className="text-[11px] font-bold text-purple-300 opacity-80 group-hover:opacity-100 transition">
            Click section for AI Report & Graphs ➔
          </span>
        </div>

        {/* 2 Side-by-Side Cards: Overall Score | Highest & Lowest Rated */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Overall Score */}
          <div
            onClick={() => setActiveLockerId("survey_effectiveness")}
            className="group cursor-pointer p-5 rounded-2xl bg-[#080711] border border-white/10 hover:border-purple-400/60 transition flex flex-col justify-between min-h-[148px]"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">
                Overall Score
              </span>
              <span className="text-[10px] font-bold text-purple-300 opacity-0 group-hover:opacity-100 transition">
                View Graph & AI ➔
              </span>
            </div>

            <div className="text-4xl font-extrabold text-purple-400 my-2">
              {effectivenessData.overall_score}/10
            </div>

            <div>
              <span
                className={`inline-block text-xs font-extrabold px-3 py-1 rounded-full border ${effectivenessData.ratingBadge.cls}`}
              >
                {effectivenessData.interpretation}
              </span>
            </div>
          </div>

          {/* Highest Rated & Needs Improvement */}
          <div
            onClick={() => setActiveLockerId("survey_effectiveness")}
            className="group cursor-pointer p-5 rounded-2xl bg-[#080711] border border-white/10 hover:border-purple-400/60 transition flex flex-col justify-between min-h-[148px] space-y-3"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                  <span>🏆</span> Highest Rated
                </span>
                <span className="text-[10px] font-bold text-purple-300 opacity-0 group-hover:opacity-100 transition">
                  View Graph & AI ➔
                </span>
              </div>
              <p className="text-xs font-bold text-white mt-1">
                {effectivenessData.highest_rated_topic}
              </p>
              <span className="text-xs font-extrabold text-emerald-400 block mt-0.5">
                {effectivenessData.highest_rated_pct}%
              </span>
            </div>

            <div className="pt-2 border-t border-white/5">
              <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                <span>⚠️</span> Needs Improvement
              </span>
              <p className="text-xs font-bold text-white mt-1">
                {effectivenessData.needs_improvement_topic}
              </p>
              <span className="text-xs font-extrabold text-amber-400 block mt-0.5">
                {effectivenessData.needs_improvement_pct}%
              </span>
            </div>
          </div>
        </div>

        {/* Question Analysis */}
        <div
          onClick={() => setActiveLockerId("question_analysis")}
          className="group cursor-pointer p-5 rounded-2xl bg-[#080711] border border-white/10 hover:border-purple-400/60 transition space-y-4"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-extrabold text-white group-hover:text-purple-300 transition">
              Question Analysis
            </h3>
            <span className="text-[11px] font-bold text-purple-300 opacity-80 group-hover:opacity-100 transition">
              Click to open Question Graphs & AI Analysis ➔
            </span>
          </div>

          {effectivenessData.questions.length === 0 ? (
            <p className="text-xs text-slate-500 italic">
              No question analysis data available yet.
            </p>
          ) : (
            <div className="space-y-3">
              {effectivenessData.questions.map((q, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-slate-300">{q.question}</span>
                    <span className="font-extrabold text-purple-300">{q.score_pct}%</span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-purple-500 to-cyan-400 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.max(0, q.score_pct))}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ===================================================================
          5. ROW 4: SURVEY FEEDBACK RESPONSES TABLE
      =================================================================== */}
      <section className="bg-[#12101E] rounded-2xl p-5 border border-white/10 shadow-[0_4px_25px_rgba(0,0,0,0.4)] space-y-4">
        <div className="flex items-center justify-between">
          <div
            onClick={() => setActiveLockerId("feedback_responses")}
            className="cursor-pointer group flex items-center gap-2"
          >
            <h2 className="text-base font-extrabold text-white group-hover:text-purple-300 transition">
              Survey Feedback Responses
            </h2>
            <span className="text-[10px] font-bold text-purple-300 opacity-0 group-hover:opacity-100 transition">
              Open Responses Locker ➔
            </span>
          </div>
          <span className="text-xs font-semibold text-slate-400">
            Showing {filteredResponses.length} of {responsesList.length} responses
          </span>
        </div>

        {filteredResponses.length === 0 ? (
          <div className="py-10 text-center space-y-2">
            <div className="text-4xl">🔍</div>
            <p className="text-sm font-bold text-slate-200">
              No survey responses found
            </p>
            <p className="text-xs text-slate-500">
              Try adjusting your search or filters
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[850px]">
              <thead>
                <tr className="border-b border-white/10 text-slate-400 text-xs">
                  <th className="py-2.5 pr-3 font-bold">Employee</th>
                  <th className="py-2.5 pr-3 font-bold">Email</th>
                  <th className="py-2.5 pr-3 font-bold">Program</th>
                  <th className="py-2.5 pr-3 font-bold">Module</th>
                  <th className="py-2.5 pr-3 font-bold">Survey</th>
                  <th className="py-2.5 pr-3 font-bold">Risk Score</th>
                  <th className="py-2.5 pr-3 font-bold">Risk Level</th>
                  <th className="py-2.5 text-right font-bold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs text-slate-200">
                {filteredResponses.map((res) => {
                  const empName = res.employee_name || res.employee_email || "Employee";
                  const riskLvl = String(res.risk_level || "Low");
                  const rScore = res.risk_score !== null && res.risk_score !== undefined ? res.risk_score : 2;

                  return (
                    <tr key={res.response_id || res.id} className="hover:bg-white/[0.03] transition">
                      <td className="py-3 pr-3 font-bold text-white">{empName}</td>
                      <td className="py-3 pr-3 text-slate-400">{res.employee_email || "—"}</td>
                      <td className="py-3 pr-3 text-cyan-300">{res.program_name || "—"}</td>
                      <td className="py-3 pr-3 text-slate-300">{res.module_title || "—"}</td>
                      <td className="py-3 pr-3 text-purple-300">{res.survey_title || "—"}</td>
                      <td className="py-3 pr-3 font-mono font-bold">
                        <span
                          className={
                            rScore >= 7
                              ? "text-rose-400"
                              : rScore >= 4
                              ? "text-amber-400"
                              : "text-emerald-400"
                          }
                        >
                          {rScore} / 10
                        </span>
                      </td>
                      <td className="py-3 pr-3">
                        <span
                          className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] border ${
                            riskLvl.toLowerCase() === "high"
                              ? "bg-rose-500/20 text-rose-300 border-rose-500/40"
                              : riskLvl.toLowerCase() === "medium"
                              ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                              : "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                          }`}
                        >
                          {riskLvl}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => setSelectedResponse(res)}
                          className="px-3 py-1 rounded-xl bg-purple-500/20 hover:bg-purple-500/35 border border-purple-500/40 text-purple-200 font-bold transition text-[11px]"
                        >
                          View Answers
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ===================================================================
          6. ROW 5: RISK SUMMARY INSIGHTS
      =================================================================== */}
      <section
        onClick={() => setActiveLockerId("risk_insights")}
        className="group cursor-pointer bg-[#12101E] rounded-2xl p-5 border border-white/10 hover:border-cyan-400/60 shadow-[0_4px_25px_rgba(0,0,0,0.4)] transition space-y-3"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-base font-extrabold text-white group-hover:text-cyan-300 transition">
            Risk Summary Insights
          </h2>
          <span className="text-[11px] font-bold text-cyan-300 opacity-80 group-hover:opacity-100 transition">
            Click to open Saarthi AI Risk Forecast & Co-Pilot ➔
          </span>
        </div>

        <div className="p-4 rounded-xl bg-[#080711] border border-white/10 flex items-center gap-3 text-xs text-slate-300">
          <span className="text-base">🎯</span>
          <span>{effectivenessData.risk_summary_insight}</span>
        </div>
      </section>

      {/* ===================================================================
          CENTERED LOCKER MODAL (Graphs & AI Co-Pilot)
      =================================================================== */}
      <LockerDetailModal
        activeLockerId={activeLockerId}
        onClose={() => setActiveLockerId(null)}
        onSwitchLocker={(id) => setActiveLockerId(id)}
        kpiCounts={kpiCounts}
        effectiveness={effectivenessData}
        responses={filteredResponses}
      />

      {/* ===================================================================
          INDIVIDUAL SURVEY ANSWERS MODAL (View Questions & Answers)
      =================================================================== */}
      <SurveyAnswersModal
        response={selectedResponse}
        onClose={() => setSelectedResponse(null)}
      />
    </div>
  );
}
