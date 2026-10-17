import React, { useState } from "react";
import { X, Download, Sparkles, RefreshCw, User } from "lucide-react";
import {
  downloadReportPDF,
  generateAIInsights,
  generateReport,
} from "../../services/reportsService";

const ReportPreview = ({
  isOpen,
  onClose,
  reportData,
  reportTitle,
  reportId,
  onLoadData,
  reportFilters,
}) => {
  const [showDateSelector, setShowDateSelector] = useState(false);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiInsights, setAiInsights] = useState(null);
  const [generatedReportId, setGeneratedReportId] = useState(null);

  if (!isOpen) return null;

  const handleLoadData = async () => {
    setLoading(true);
    setShowDateSelector(false);
    await onLoadData(reportId, fromDate, toDate);
    setLoading(false);
  };

  const handleBack = () => {
    setShowDateSelector(true);
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      if (generatedReportId) {
        await downloadReportPDF(generatedReportId);
      } else if (reportId && reportFilters) {
        const result = await generateReport(
          reportId,
          reportFilters,
          reportFilters.generated_for,
        );
        if (result && result.report) {
          setGeneratedReportId(result.report.id);
          await downloadReportPDF(result.report.id);
        } else {
          alert("Failed to generate report for download");
        }
      } else {
        alert("No report available for download");
      }
    } catch (error) {
      console.error("Download error:", error);
      alert(`Failed to download report: ${error.message || "Unknown error"}`);
    } finally {
      setDownloading(false);
    }
  };

  const handleAIInsights = async () => {
    if (!reportId) return;
    setAiLoading(true);
    try {
      const result = await generateAIInsights({
        reportType: reportId,
        filters: reportFilters || {},
        generatedFor: reportFilters?.generated_for || null,
      });
      setAiInsights(result.ai_summary || null);
      if (result.id) setGeneratedReportId(result.id);
    } catch (error) {
      console.error("Failed to generate AI insights:", error);
      alert(`Failed to generate AI insights: ${error.message || error}`);
    } finally {
      setAiLoading(false);
    }
  };

  const handleViewProfile = () => {
    const targetUserId = reportFilters?.generated_for;
    if (!targetUserId) return;
    onClose();
    window.location.href = `/admin/users/${targetUserId}/report`;
  };

  const renderPersonalReport = (data) => {
    const summary = data.summary || {};
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatTile label="Completed Programs" value={summary.completed_programs || 0} />
          <StatTile label="In Progress" value={summary.in_progress_programs || 0} />
          <StatTile label="Total Curos" value={summary.total_curos || 0} />
          <StatTile label="Current Streak" value={`${summary.current_streak || 0} days`} />
        </div>

        <Section title="Completed Programs">
          {(data.completed_programs || []).length === 0 ? (
            <EmptyRow text="No completed programs yet" />
          ) : (
            <div className="space-y-2">
              {data.completed_programs.map((program, idx) => (
                <Row key={idx}>
                  <div>
                    <p className="font-medium text-[#1E1B4B]">{program.name}</p>
                    <p className="text-xs text-[#4F4679]">{program.completed_date}</p>
                  </div>
                  <span className="text-sm font-semibold text-[#10B981]">
                    {program.score}%
                  </span>
                </Row>
              ))}
            </div>
          )}
        </Section>

        <Section title="Quiz Performance">
          <div className="bg-[#F1ECF7] p-4 rounded-lg">
            <div className="grid grid-cols-3 gap-4 text-center">
              <StatInner label="Average" value={`${data.quiz_performance?.average || 0}%`} />
              <StatInner label="Highest" value={`${data.quiz_performance?.highest || 0}%`} color="text-[#10B981]" />
              <StatInner label="Lowest" value={`${data.quiz_performance?.lowest || 0}%`} color="text-[#F59E0B]" />
            </div>
          </div>
        </Section>

        <div className="grid grid-cols-2 gap-4">
          <Section title="Certificates">
            {(data.certificates || []).length === 0 ? (
              <EmptyRow text="None" />
            ) : (
              <div className="space-y-2">
                {data.certificates.map((cert, idx) => (
                  <Row key={idx}>
                    <div>
                      <p className="font-medium text-[#1E1B4B] text-sm">{cert.name}</p>
                      <p className="text-xs text-[#4F4679]">{cert.issued_date}</p>
                    </div>
                  </Row>
                ))}
              </div>
            )}
          </Section>
          <Section title="Badges">
            {(data.badges || []).length === 0 ? (
              <EmptyRow text="None" />
            ) : (
              <div className="space-y-2">
                {data.badges.map((badge, idx) => (
                  <Row key={idx}>
                    <div>
                      <p className="font-medium text-[#1E1B4B] text-sm">{badge.name}</p>
                      <p className="text-xs text-[#4F4679]">{badge.earned_date}</p>
                    </div>
                  </Row>
                ))}
              </div>
            )}
          </Section>
        </div>
      </div>
    );
  };

  const renderTeamReport = (data) => {
    const summary = data.summary || {};
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatTile label="Total Employees" value={summary.total_employees || 0} />
          <StatTile label="Active" value={summary.active_employees || 0} color="text-[#10B981]" />
          <StatTile label="Completion Rate" value={`${summary.completion_rate || 0}%`} />
          <StatTile label="Pending" value={summary.pending_employees || 0} color="text-[#F59E0B]" />
        </div>

        <Section title="Top Performers">
          {(data.top_performers || []).length === 0 ? (
            <EmptyRow text="No performer data yet" />
          ) : (
            <div className="space-y-2">
              {data.top_performers.map((p, idx) => (
                <Row key={idx}>
                  <div>
                    <p className="font-medium text-[#1E1B4B]">{p.name}</p>
                    <p className="text-xs text-[#4F4679]">{p.programs_completed} programs</p>
                  </div>
                  <span className="text-sm font-semibold text-[#10B981]">
                    {p.avg_score}%
                  </span>
                </Row>
              ))}
            </div>
          )}
        </Section>

        <Section title="Pending Employees">
          {(data.pending_employees || []).length === 0 ? (
            <EmptyRow text="Everyone is on track" />
          ) : (
            <div className="space-y-2">
              {data.pending_employees.map((e, idx) => (
                <Row key={idx}>
                  <div>
                    <p className="font-medium text-[#1E1B4B]">{e.name}</p>
                    <p className="text-xs text-[#4F4679]">{e.pending_programs} pending</p>
                  </div>
                  <span className="text-xs text-[#F59E0B]">{e.last_activity}</span>
                </Row>
              ))}
            </div>
          )}
        </Section>
      </div>
    );
  };

  const renderOrgReport = (data) => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Object.entries(data.summary || {}).map(([key, value]) => (
          <StatTile
            key={key}
            label={key.replace(/_/g, " ").replace(/([A-Z])/g, " $1").trim()}
            value={typeof value === "number" ? (value % 1 !== 0 ? value.toFixed(2) : value) : value}
          />
        ))}
      </div>

      {(data.top_performers || []).length > 0 && (
        <Section title="Top Performers">
          <div className="space-y-2">
            {data.top_performers.map((p, idx) => (
              <Row key={idx}>
                <div>
                  <p className="font-medium text-[#1E1B4B]">{p.name}</p>
                  <p className="text-xs text-[#4F4679]">{p.programs_completed} programs</p>
                </div>
                <span className="text-sm font-semibold text-[#10B981]">{p.avg_score}%</span>
              </Row>
            ))}
          </div>
        </Section>
      )}

      {(data.top_programs || []).length > 0 && (
        <Section title="Top Programs">
          <div className="space-y-2">
            {data.top_programs.map((p, idx) => (
              <Row key={idx}>
                <p className="font-medium text-[#1E1B4B]">{p.name}</p>
                <span className="text-sm font-semibold text-[#10B981]">{p.completion}%</span>
              </Row>
            ))}
          </div>
        </Section>
      )}

      {(data.franchise_comparison || []).length > 0 && (
        <Section title="Franchise Comparison">
          <div className="space-y-2">
            {data.franchise_comparison.map((f, idx) => (
              <Row key={idx}>
                <div>
                  <p className="font-medium text-[#1E1B4B]">{f.name}</p>
                  <p className="text-xs text-[#4F4679]">{f.employees} employees</p>
                </div>
                <span className="text-sm font-semibold text-[#10B981]">{f.completion}%</span>
              </Row>
            ))}
          </div>
        </Section>
      )}

      {(data.program_metrics || []).length > 0 && (
        <Section title="Program Metrics">
          <div className="space-y-2">
            {data.program_metrics.map((p, idx) => (
              <Row key={idx}>
                <div>
                  <p className="font-medium text-[#1E1B4B]">{p.name}</p>
                  <p className="text-xs text-[#4F4679]">{p.enrollments} enrollments</p>
                </div>
                <div className="text-right">
                  <span className="text-sm font-semibold text-[#10B981]">{p.completion}%</span>
                  <p className="text-xs text-[#4F4679]">Avg: {p.avg_score}%</p>
                </div>
              </Row>
            ))}
          </div>
        </Section>
      )}

      {(data.engagement_metrics || []).length > 0 && (
        <Section title="Engagement Metrics">
          <div className="space-y-2">
            {data.engagement_metrics.map((m, idx) => (
              <Row key={idx}>
                <p className="font-medium text-[#1E1B4B]">{m.metric}</p>
                <div className="text-right">
                  <span className="text-sm font-semibold text-[#1E1B4B]">{m.value}</span>
                  <p className="text-xs text-[#10B981]">{m.change}</p>
                </div>
              </Row>
            ))}
          </div>
        </Section>
      )}
    </div>
  );

  const renderContent = () => {
    if (showDateSelector) {
      return (
        <div className="space-y-6">
          <div>
            <h4 className="font-semibold text-[#1E1B4B] mb-4">Select Date Range</h4>
            <p className="text-sm text-[#4F4679] mb-4">
              Choose the date range for this report. Leave empty to show all data.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#1E1B4B] mb-2">From Date</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full px-4 py-2.5 border border-[#D9CFE8] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#693C83]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1E1B4B] mb-2">To Date</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full px-4 py-2.5 border border-[#D9CFE8] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#693C83]"
              />
            </div>
          </div>
        </div>
      );
    }

    if (loading) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#693C83] mx-auto mb-4"></div>
            <p className="text-[#4F4679]">Loading report data...</p>
          </div>
        </div>
      );
    }

    if (!reportData) return <p className="text-[#4F4679]">No report data available.</p>;

    const summary = reportData.summary || {};

    if (summary.completed_programs !== undefined) return renderPersonalReport(reportData);
    if (summary.total_employees !== undefined) return renderTeamReport(reportData);
    if (
      summary.total_learners !== undefined ||
      summary.total_franchises !== undefined ||
      summary.total_programs !== undefined ||
      summary.avg_daily_active !== undefined
    ) {
      return renderOrgReport(reportData);
    }
    return <p className="text-[#4F4679]">Report data format not recognized.</p>;
  };

  const showProfileButton = !showDateSelector && !!reportFilters?.generated_for;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-[#D9CFE8]">
          <h2 className="text-xl font-semibold text-[#1E1B4B]">{reportTitle}</h2>
          <button onClick={onClose} className="p-2 hover:bg-[#F1ECF7] rounded-lg transition-colors">
            <X size={20} className="text-[#4F4679]" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {renderContent()}

          {aiInsights && (
            <div className="mt-8 border-t border-[#D9CFE8] pt-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Sparkles size={20} className="text-[#8B5CF6]" />
                  <h3 className="text-lg font-semibold text-[#1E1B4B]">AI Insights</h3>
                  <span className="text-xs bg-[#8B5CF6]/10 text-[#8B5CF6] px-2 py-1 rounded-full">
                    Powered by Groq
                  </span>
                </div>
                <button
                  onClick={handleAIInsights}
                  disabled={aiLoading}
                  className="flex items-center gap-1 text-sm text-[#693C83] hover:text-[#5A2F6E] disabled:opacity-50"
                >
                  <RefreshCw size={14} className={aiLoading ? "animate-spin" : ""} />
                  {aiLoading ? "Refreshing..." : "Refresh"}
                </button>
              </div>
              <div className="bg-gradient-to-r from-[#8B5CF6]/10 to-[#8B5CF6]/5 rounded-xl p-6">
                <AIBody aiInsights={aiInsights} />
              </div>
            </div>
          )}

          {aiLoading && (
            <div className="mt-8 border-t border-[#D9CFE8] pt-6">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles size={20} className="text-[#8B5CF6]" />
                <h3 className="text-lg font-semibold text-[#1E1B4B]">AI Insights</h3>
              </div>
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#8B5CF6] mx-auto mb-4"></div>
                  <p className="text-sm text-[#4F4679]">Generating AI insights...</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-[#D9CFE8] flex flex-wrap justify-end gap-3">
          {showDateSelector ? (
            <>
              <button
                onClick={onClose}
                className="px-6 py-2.5 bg-[#F1ECF7] text-[#693C83] rounded-lg hover:bg-[#E8E0F0] transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleLoadData}
                disabled={loading}
                className="px-6 py-2.5 bg-[#693C83] text-white rounded-lg hover:bg-[#5A2F6E] transition-colors font-medium disabled:opacity-50"
              >
                {loading ? "Loading..." : "View Report"}
              </button>
            </>
          ) : (
            <>
              {showProfileButton && (
                <button
                  onClick={handleViewProfile}
                  className="px-6 py-2.5 bg-[#10B981] text-white rounded-lg hover:bg-[#0E9F6E] transition-colors font-medium flex items-center gap-2"
                >
                  <User size={16} />
                  View full profile
                </button>
              )}
              <button
                onClick={handleBack}
                className="px-6 py-2.5 bg-[#F1ECF7] text-[#693C83] rounded-lg hover:bg-[#E8E0F0] transition-colors font-medium"
              >
                Back
              </button>
              <button
                onClick={handleDownload}
                disabled={downloading}
                className="px-6 py-2.5 bg-[#693C83] text-white rounded-lg hover:bg-[#5A2F6E] transition-colors font-medium flex items-center gap-2 disabled:opacity-50"
              >
                <Download size={16} />
                {downloading ? "Generating..." : "Download"}
              </button>
              <button
                onClick={handleAIInsights}
                disabled={aiLoading}
                className="px-6 py-2.5 bg-gradient-to-r from-[#693C83] to-[#8B5CF6] text-white rounded-lg hover:from-[#5A2F6E] hover:to-[#7C3AED] transition-colors font-medium flex items-center gap-2 disabled:opacity-50"
              >
                <Sparkles size={16} />
                {aiLoading ? "Generating..." : "Get AI Insights"}
              </button>
              <button
                onClick={onClose}
                className="px-6 py-2.5 bg-[#F1ECF7] text-[#693C83] rounded-lg hover:bg-[#E8E0F0] transition-colors font-medium"
              >
                Close
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// Small presentational helpers (no business logic)
// ─────────────────────────────────────────────────────────────

const StatTile = ({ label, value, color = "text-[#1E1B4B]" }) => (
  <div className="bg-[#F1ECF7] p-4 rounded-lg">
    <p className="text-xs text-[#4F4679] mb-1">{label}</p>
    <p className={`text-2xl font-bold ${color}`}>{value}</p>
  </div>
);

const StatInner = ({ label, value, color = "text-[#1E1B4B]" }) => (
  <div>
    <p className={`text-2xl font-bold ${color}`}>{value}</p>
    <p className="text-xs text-[#4F4679]">{label}</p>
  </div>
);

const Section = ({ title, children }) => (
  <div>
    <h4 className="font-semibold text-[#1E1B4B] mb-3">{title}</h4>
    {children}
  </div>
);

const Row = ({ children }) => (
  <div className="flex justify-between items-center bg-[#F1ECF7] p-3 rounded-lg">
    {children}
  </div>
);

const EmptyRow = ({ text }) => (
  <p className="text-sm text-[#9D8FB8] py-3 text-center bg-[#F1ECF7] rounded-lg">{text}</p>
);

const AIBody = ({ aiInsights }) => {
  if (typeof aiInsights === "string") {
    return <p className="text-sm text-[#4F4679] leading-relaxed whitespace-pre-wrap">{aiInsights}</p>;
  }
  const sections = [
    ["executive_summary", "Executive Summary", "text"],
    ["key_insights", "Key Insights", "list"],
    ["trends", "Trends", "list"],
    ["notable_achievements", "Notable Achievements", "list"],
    ["risks_or_concerns", "Risks or Concerns", "list"],
    ["recommendations", "Recommendations", "list"],
    ["next_suggested_actions", "Next Suggested Actions", "list"],
  ];
  return (
    <div className="space-y-4">
      {sections.map(([key, label, kind]) => {
        const val = aiInsights[key];
        if (!val || (Array.isArray(val) && val.length === 0)) return null;
        return (
          <div key={key}>
            <h4 className="font-semibold text-[#1E1B4B] mb-2">{label}</h4>
            {kind === "text" ? (
              <p className="text-sm text-[#4F4679] leading-relaxed">{val}</p>
            ) : (
              <ul className="list-disc list-inside text-sm text-[#4F4679] space-y-1">
                {val.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default ReportPreview;