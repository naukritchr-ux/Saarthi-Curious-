import React, { useState } from "react";
import { X, Calendar, Download, Sparkles, RefreshCw } from "lucide-react";
import {
  downloadReportPDF,
  regenerateWithAIInsights,
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
      let numericReportId = reportId;

      if (typeof reportId === "string") {
        const apiFilters = {
          time_range: "all_time",
          custom_start: fromDate,
          custom_end: toDate,
          scope: "self",
          generated_for: null,
        };

        const result = await generateReport(reportId, apiFilters, null);
        if (result && result.report) {
          numericReportId = result.report.id;
          setGeneratedReportId(result.report.id);
        } else {
          throw new Error("Failed to generate report");
        }
      }

      const updatedReport = await regenerateWithAIInsights(numericReportId);
      setAiInsights(updatedReport.ai_summary);
    } catch (error) {
      console.error("Failed to generate AI insights:", error.message || error);
      alert(`Failed to generate AI insights: ${error.message || error}`);
    } finally {
      setAiLoading(false);
    }
  };

  // ==========================================
  // Render Functions
  // ==========================================

  const renderPersonalReport = (data) => {
    const summary = data.summary || {};
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-[#F1ECF7] p-4 rounded-lg">
            <p className="text-xs text-[#4F4679] mb-1">Completed Programs</p>
            <p className="text-2xl font-bold text-[#1E1B4B]">
              {summary.completed_programs || summary.completedPrograms || 0}
            </p>
          </div>
          <div className="bg-[#F1ECF7] p-4 rounded-lg">
            <p className="text-xs text-[#4F4679] mb-1">In Progress</p>
            <p className="text-2xl font-bold text-[#1E1B4B]">
              {summary.in_progress_programs || summary.inProgressPrograms || 0}
            </p>
          </div>
          <div className="bg-[#F1ECF7] p-4 rounded-lg">
            <p className="text-xs text-[#4F4679] mb-1">Total Curos</p>
            <p className="text-2xl font-bold text-[#1E1B4B]">
              {summary.total_curos || summary.totalCuros || 0}
            </p>
          </div>
          <div className="bg-[#F1ECF7] p-4 rounded-lg">
            <p className="text-xs text-[#4F4679] mb-1">Current Streak</p>
            <p className="text-2xl font-bold text-[#1E1B4B]">
              {summary.current_streak || summary.currentStreak || 0} days
            </p>
          </div>
        </div>

        <div>
          <h4 className="font-semibold text-[#1E1B4B] mb-3">
            Completed Programs
          </h4>
          <div className="space-y-2">
            {(data.completed_programs || data.completedPrograms || []).map(
              (program, idx) => (
                <div
                  key={idx}
                  className="flex justify-between items-center bg-[#F1ECF7] p-3 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-[#1E1B4B]">{program.name}</p>
                    <p className="text-xs text-[#4F4679]">
                      {program.completed_date || program.completedDate}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-[#10B981]">
                    {program.score}%
                  </span>
                </div>
              ),
            )}
          </div>
        </div>

        <div>
          <h4 className="font-semibold text-[#1E1B4B] mb-3">
            Quiz Performance
          </h4>
          <div className="bg-[#F1ECF7] p-4 rounded-lg">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-[#1E1B4B]">
                  {data.quiz_performance?.average ||
                    data.quizPerformance?.average ||
                    0}
                  %
                </p>
                <p className="text-xs text-[#4F4679]">Average</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-[#10B981]">
                  {data.quiz_performance?.highest ||
                    data.quizPerformance?.highest ||
                    0}
                  %
                </p>
                <p className="text-xs text-[#4F4679]">Highest</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-[#F59E0B]">
                  {data.quiz_performance?.lowest ||
                    data.quizPerformance?.lowest ||
                    0}
                  %
                </p>
                <p className="text-xs text-[#4F4679]">Lowest</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <h4 className="font-semibold text-[#1E1B4B] mb-3">Certificates</h4>
            <div className="space-y-2">
              {(data.certificates || []).map((cert, idx) => (
                <div key={idx} className="bg-[#F1ECF7] p-3 rounded-lg">
                  <p className="font-medium text-[#1E1B4B] text-sm">
                    {cert.name}
                  </p>
                  <p className="text-xs text-[#4F4679]">
                    {cert.issued_date || cert.issuedDate}
                  </p>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-[#1E1B4B] mb-3">Badges</h4>
            <div className="space-y-2">
              {(data.badges || []).map((badge, idx) => (
                <div key={idx} className="bg-[#F1ECF7] p-3 rounded-lg">
                  <p className="font-medium text-[#1E1B4B] text-sm">
                    {badge.name}
                  </p>
                  <p className="text-xs text-[#4F4679]">
                    {badge.earned_date || badge.earnedDate}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-[#693C83] text-white p-4 rounded-lg">
          <p className="text-sm">Leaderboard Position</p>
          <p className="text-3xl font-bold">
            #{data.leaderboard_position || data.leaderboardPosition || 0}
          </p>
        </div>
      </div>
    );
  };

  const renderTeamReport = (data) => {
    const summary = data.summary || {};
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-[#F1ECF7] p-4 rounded-lg">
            <p className="text-xs text-[#4F4679] mb-1">Total Employees</p>
            <p className="text-2xl font-bold text-[#1E1B4B]">
              {summary.total_employees || summary.totalEmployees || 0}
            </p>
          </div>
          <div className="bg-[#F1ECF7] p-4 rounded-lg">
            <p className="text-xs text-[#4F4679] mb-1">Active</p>
            <p className="text-2xl font-bold text-[#10B981]">
              {summary.active_employees || summary.activeEmployees || 0}
            </p>
          </div>
          <div className="bg-[#F1ECF7] p-4 rounded-lg">
            <p className="text-xs text-[#4F4679] mb-1">Completion Rate</p>
            <p className="text-2xl font-bold text-[#1E1B4B]">
              {summary.completion_rate || summary.completionRate || 0}%
            </p>
          </div>
          <div className="bg-[#F1ECF7] p-4 rounded-lg">
            <p className="text-xs text-[#4F4679] mb-1">Pending</p>
            <p className="text-2xl font-bold text-[#F59E0B]">
              {summary.pending_employees || summary.pendingEmployees || 0}
            </p>
          </div>
        </div>

        <div>
          <h4 className="font-semibold text-[#1E1B4B] mb-3">Top Performers</h4>
          <div className="space-y-2">
            {(data.top_performers || data.topPerformers || []).map(
              (performer, idx) => (
                <div
                  key={idx}
                  className="flex justify-between items-center bg-[#F1ECF7] p-3 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-[#1E1B4B]">
                      {performer.name}
                    </p>
                    <p className="text-xs text-[#4F4679]">
                      {performer.programs_completed ||
                        performer.programsCompleted}{" "}
                      programs
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-[#10B981]">
                    {performer.avg_score || performer.avgScore}%
                  </span>
                </div>
              ),
            )}
          </div>
        </div>

        <div>
          <h4 className="font-semibold text-[#1E1B4B] mb-3">
            Pending Employees
          </h4>
          <div className="space-y-2">
            {(data.pending_employees || data.pendingEmployees || []).map(
              (employee, idx) => (
                <div
                  key={idx}
                  className="flex justify-between items-center bg-[#F1ECF7] p-3 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-[#1E1B4B]">
                      {employee.name}
                    </p>
                    <p className="text-xs text-[#4F4679]">
                      {employee.pending_programs || employee.pendingPrograms}{" "}
                      pending
                    </p>
                  </div>
                  <span className="text-xs text-[#F59E0B]">
                    {employee.last_activity || employee.lastActivity}
                  </span>
                </div>
              ),
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderOrgReport = (data) => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Object.entries(data.summary || {}).map(([key, value]) => (
          <div key={key} className="bg-[#F1ECF7] p-4 rounded-lg">
            <p className="text-xs text-[#4F4679] mb-1 capitalize">
              {key
                .replace(/_/g, " ")
                .replace(/([A-Z])/g, " $1")
                .trim()}
            </p>
            <p className="text-2xl font-bold text-[#1E1B4B]">
              {typeof value === "number"
                ? value % 1 !== 0
                  ? value.toFixed(2)
                  : value
                : value}
            </p>
          </div>
        ))}
      </div>

      {(data.top_programs || data.topPrograms) && (
        <div>
          <h4 className="font-semibold text-[#1E1B4B] mb-3">Top Programs</h4>
          <div className="space-y-2">
            {(data.top_programs || data.topPrograms || []).map(
              (program, idx) => (
                <div
                  key={idx}
                  className="flex justify-between items-center bg-[#F1ECF7] p-3 rounded-lg"
                >
                  <p className="font-medium text-[#1E1B4B]">{program.name}</p>
                  <span className="text-sm font-semibold text-[#10B981]">
                    {program.completion}%
                  </span>
                </div>
              ),
            )}
          </div>
        </div>
      )}

      {(data.franchise_comparison || data.franchiseComparison) && (
        <div>
          <h4 className="font-semibold text-[#1E1B4B] mb-3">
            Franchise Comparison
          </h4>
          <div className="space-y-2">
            {(data.franchise_comparison || data.franchiseComparison || []).map(
              (franchise, idx) => (
                <div
                  key={idx}
                  className="flex justify-between items-center bg-[#F1ECF7] p-3 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-[#1E1B4B]">
                      {franchise.name}
                    </p>
                    <p className="text-xs text-[#4F4679]">
                      {franchise.employees} employees
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-[#10B981]">
                    {franchise.completion}%
                  </span>
                </div>
              ),
            )}
          </div>
        </div>
      )}

      {(data.program_metrics || data.programMetrics) && (
        <div>
          <h4 className="font-semibold text-[#1E1B4B] mb-3">Program Metrics</h4>
          <div className="space-y-2">
            {(data.program_metrics || data.programMetrics || []).map(
              (program, idx) => (
                <div
                  key={idx}
                  className="flex justify-between items-center bg-[#F1ECF7] p-3 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-[#1E1B4B]">{program.name}</p>
                    <p className="text-xs text-[#4F4679]">
                      {program.enrollments} enrollments
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-semibold text-[#10B981]">
                      {program.completion}%
                    </span>
                    <p className="text-xs text-[#4F4679]">
                      Avg: {program.avg_score}%
                    </p>
                  </div>
                </div>
              ),
            )}
          </div>
        </div>
      )}

      {(data.engagement_metrics || data.engagementMetrics) && (
        <div>
          <h4 className="font-semibold text-[#1E1B4B] mb-3">
            Engagement Metrics
          </h4>
          <div className="space-y-2">
            {(data.engagement_metrics || data.engagementMetrics || []).map(
              (metric, idx) => (
                <div
                  key={idx}
                  className="flex justify-between items-center bg-[#F1ECF7] p-3 rounded-lg"
                >
                  <p className="font-medium text-[#1E1B4B]">{metric.metric}</p>
                  <div className="text-right">
                    <span className="text-sm font-semibold text-[#1E1B4B]">
                      {metric.value}
                    </span>
                    <p className="text-xs text-[#10B981]">{metric.change}</p>
                  </div>
                </div>
              ),
            )}
          </div>
        </div>
      )}
    </div>
  );

  const renderContent = () => {
    if (showDateSelector) {
      return (
        <div className="space-y-6">
          <div>
            <h4 className="font-semibold text-[#1E1B4B] mb-4">
              Select Date Range
            </h4>
            <p className="text-sm text-[#4F4679] mb-4">
              Choose the date range for this report. Leave empty to show all
              data.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#1E1B4B] mb-2">
                From Date
              </label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full px-4 py-2.5 border border-[#D9CFE8] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#693C83]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1E1B4B] mb-2">
                To Date
              </label>
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

    if (!reportData)
      return <p className="text-[#4F4679]">No report data available.</p>;

    // Debug: log the report data to understand the structure
    console.log("Report data:", reportData);

    // Handle both camelCase and snake_case from backend
    const summary = reportData.summary || {};

    if (
      summary.completed_programs !== undefined ||
      summary.completedPrograms !== undefined
    ) {
      return renderPersonalReport(reportData);
    }
    if (
      summary.total_employees !== undefined ||
      summary.totalEmployees !== undefined
    ) {
      return renderTeamReport(reportData);
    }
    if (
      summary.total_learners !== undefined ||
      summary.totalLearners !== undefined ||
      summary.total_franchises !== undefined ||
      summary.totalFranchises !== undefined ||
      summary.total_programs !== undefined ||
      summary.totalPrograms !== undefined ||
      summary.avg_daily_active !== undefined ||
      summary.avgDailyActive !== undefined
    ) {
      return renderOrgReport(reportData);
    }
    return <p className="text-[#4F4679]">Report data format not recognized.</p>;
  };

  // ==========================================
  // Main Render
  // ==========================================

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-[#D9CFE8]">
          <h2 className="text-xl font-semibold text-[#1E1B4B]">
            {reportTitle}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[#F1ECF7] rounded-lg transition-colors"
          >
            <X size={20} className="text-[#4F4679]" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {renderContent()}

          {/* AI Insights Section */}
          {aiInsights && (
            <div className="mt-8 border-t border-[#D9CFE8] pt-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Sparkles size={20} className="text-[#8B5CF6]" />
                  <h3 className="text-lg font-semibold text-[#1E1B4B]">
                    AI Insights
                  </h3>
                  <span className="text-xs bg-[#8B5CF6]/10 text-[#8B5CF6] px-2 py-1 rounded-full">
                    Powered by Gemini/Groq
                  </span>
                </div>
                <button
                  onClick={handleAIInsights}
                  disabled={aiLoading}
                  className="flex items-center gap-1 text-sm text-[#693C83] hover:text-[#5A2F6E] disabled:opacity-50"
                >
                  <RefreshCw
                    size={14}
                    className={aiLoading ? "animate-spin" : ""}
                  />
                  {aiLoading ? "Refreshing..." : "Refresh"}
                </button>
              </div>
              <div className="bg-gradient-to-r from-[#8B5CF6]/10 to-[#8B5CF6]/5 rounded-xl p-6">
                {typeof aiInsights === "string" ? (
                  <p className="text-sm text-[#4F4679] leading-relaxed whitespace-pre-wrap">
                    {aiInsights}
                  </p>
                ) : (
                  <div className="space-y-4">
                    {aiInsights.executive_summary && (
                      <div>
                        <h4 className="font-semibold text-[#1E1B4B] mb-2">
                          Executive Summary
                        </h4>
                        <p className="text-sm text-[#4F4679] leading-relaxed">
                          {aiInsights.executive_summary}
                        </p>
                      </div>
                    )}
                    {aiInsights.key_insights &&
                      aiInsights.key_insights.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-[#1E1B4B] mb-2">
                            Key Insights
                          </h4>
                          <ul className="list-disc list-inside text-sm text-[#4F4679] space-y-1">
                            {aiInsights.key_insights.map((insight, idx) => (
                              <li key={idx}>{insight}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    {aiInsights.trends && aiInsights.trends.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-[#1E1B4B] mb-2">
                          Trends
                        </h4>
                        <ul className="list-disc list-inside text-sm text-[#4F4679] space-y-1">
                          {aiInsights.trends.map((trend, idx) => (
                            <li key={idx}>{trend}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {aiInsights.notable_achievements &&
                      aiInsights.notable_achievements.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-[#1E1B4B] mb-2">
                            Notable Achievements
                          </h4>
                          <ul className="list-disc list-inside text-sm text-[#4F4679] space-y-1">
                            {aiInsights.notable_achievements.map(
                              (achievement, idx) => (
                                <li key={idx}>{achievement}</li>
                              ),
                            )}
                          </ul>
                        </div>
                      )}
                    {aiInsights.risks_or_concerns &&
                      aiInsights.risks_or_concerns.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-[#1E1B4B] mb-2">
                            Risks or Concerns
                          </h4>
                          <ul className="list-disc list-inside text-sm text-[#4F4679] space-y-1">
                            {aiInsights.risks_or_concerns.map((risk, idx) => (
                              <li key={idx}>{risk}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    {aiInsights.recommendations &&
                      aiInsights.recommendations.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-[#1E1B4B] mb-2">
                            Recommendations
                          </h4>
                          <ul className="list-disc list-inside text-sm text-[#4F4679] space-y-1">
                            {aiInsights.recommendations.map((rec, idx) => (
                              <li key={idx}>{rec}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    {aiInsights.next_suggested_actions &&
                      aiInsights.next_suggested_actions.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-[#1E1B4B] mb-2">
                            Next Suggested Actions
                          </h4>
                          <ul className="list-disc list-inside text-sm text-[#4F4679] space-y-1">
                            {aiInsights.next_suggested_actions.map(
                              (action, idx) => (
                                <li key={idx}>{action}</li>
                              ),
                            )}
                          </ul>
                        </div>
                      )}
                  </div>
                )}
              </div>
            </div>
          )}

          {aiLoading && (
            <div className="mt-8 border-t border-[#D9CFE8] pt-6">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles size={20} className="text-[#8B5CF6]" />
                <h3 className="text-lg font-semibold text-[#1E1B4B]">
                  AI Insights
                </h3>
              </div>
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#8B5CF6] mx-auto mb-4"></div>
                  <p className="text-sm text-[#4F4679]">
                    Generating AI insights...
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-[#D9CFE8] flex justify-end gap-3">
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

export default ReportPreview;
