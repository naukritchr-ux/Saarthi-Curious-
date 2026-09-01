import React, { useState, useEffect } from "react";
import {
  User,
  Users,
  Building,
  Building2,
  BarChart,
  BookOpen,
  TrendingUp,
  Eye,
  Download,
} from "lucide-react";
import ReportPreview from "./ReportPreview";
import RecentReportsTable from "./RecentReportsTable";
import {
  getReportsForRole,
  getRecentReports,
  previewReport,
  downloadReportPDF,
  generateReport,
} from "../../services/reportsService";
import MainLayout from "../../layout/mainLayout.jsx";

const ReportsPage = () => {
  const [availableReports, setAvailableReports] = useState([]);
  const [recentReports, setRecentReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [previewReportData, setPreviewReportData] = useState(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const roleId = localStorage.getItem("roleId");
  const [reportFilters, setReportFilters] = useState({});

  useEffect(() => {
    loadReports();
    loadRecentReports();
  }, []);

  const loadReports = async () => {
    const reports = await getReportsForRole();
    setAvailableReports(reports);

    const initialFilters = {};
    reports.forEach((report) => {
      initialFilters[report.id] = {
        time_range: report.filter_schema?.time_range?.default || "all_time",
        custom_start: "",
        custom_end: "",
        scope: report.filter_schema?.scope?.default || "self",
        generated_for: null,
      };
    });
    setReportFilters(initialFilters);
  };

  const loadRecentReports = async () => {
    const reports = await getRecentReports();
    setRecentReports(reports);
  };

  const handleFilterChange = (reportId, field, value) => {
    setReportFilters((prev) => ({
      ...prev,
      [reportId]: {
        ...prev[reportId],
        [field]: value,
      },
    }));
  };

  const handlePreview = async (report) => {
    setIsPreviewing(true);
    const filters = reportFilters[report.id] || {};

    const apiFilters = {
      time_range: filters.time_range,
      custom_start: filters.custom_start,
      custom_end: filters.custom_end,
      scope: filters.scope,
      generated_for: filters.generated_for,
    };

    try {
      const result = await previewReport(
        report.id,
        apiFilters,
        filters.generated_for,
      );
      setIsPreviewing(false);

      if (result) {
        setPreviewReportData(result.data || {});
        setSelectedReport(report);
        setIsPreviewOpen(true);
        await loadRecentReports();
      } else {
        alert("Failed to generate report preview");
      }
    } catch (error) {
      setIsPreviewing(false);
      console.error("Preview error:", error);
      alert(`Failed to preview report: ${error.message || "Unknown error"}`);
    }
  };

  const handleGenerateAndDownload = async (report) => {
    setIsGenerating(true);
    const filters = reportFilters[report.id] || {};

    const apiFilters = {
      time_range: filters.time_range,
      custom_start: filters.custom_start,
      custom_end: filters.custom_end,
      scope: filters.scope,
      generated_for: filters.generated_for,
    };

    try {
      const result = await generateReport(
        report.id,
        apiFilters,
        filters.generated_for,
      );

      if (result && result.report && result.report.id) {
        // Download the generated report
        await downloadReportPDF(result.report.id);
        await loadRecentReports();
      } else {
        alert("Failed to generate report");
      }
    } catch (error) {
      console.error("Generation error:", error);
      alert(`Failed to generate report: ${error.message || "Unknown error"}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const ICON_MAP = {
    User,
    Users,
    Building,
    Building2,
    BarChart,
    BookOpen,
    TrendingUp,
  };

  const renderFilterUI = (report) => {
    const filters = reportFilters[report.id] || {};
    const schema = report.filter_schema || {};

    return (
      <div className="space-y-3 mb-4 p-4 bg-[#F1ECF7] rounded-lg">
        {schema.time_range && (
          <div>
            <label className="block text-sm font-medium text-[#1E1B4B] mb-1">
              Time Range
            </label>
            <select
              value={filters.time_range || "all_time"}
              onChange={(e) =>
                handleFilterChange(report.id, "time_range", e.target.value)
              }
              className="w-full px-3 py-2 border border-[#D9CFE8] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#693C83] text-sm"
            >
              {schema.time_range.options?.map((option) => (
                <option key={option} value={option}>
                  {option === "today"
                    ? "Today"
                    : option === "last_week"
                      ? "Last Week"
                      : option === "last_month"
                        ? "Last Month"
                        : option === "last_year"
                          ? "Last Year"
                          : option === "all_time"
                            ? "All Time"
                            : option === "custom"
                              ? "Custom Range"
                              : option}
                </option>
              ))}
            </select>
          </div>
        )}

        {filters.time_range === "custom" && schema.custom_range?.enabled && (
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-sm font-medium text-[#1E1B4B] mb-1">
                From
              </label>
              <input
                type="date"
                value={filters.custom_start || ""}
                onChange={(e) =>
                  handleFilterChange(report.id, "custom_start", e.target.value)
                }
                className="w-full px-3 py-2 border border-[#D9CFE8] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#693C83] text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1E1B4B] mb-1">
                To
              </label>
              <input
                type="date"
                value={filters.custom_end || ""}
                onChange={(e) =>
                  handleFilterChange(report.id, "custom_end", e.target.value)
                }
                className="w-full px-3 py-2 border border-[#D9CFE8] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#693C83] text-sm"
              />
            </div>
          </div>
        )}

        {schema.scope?.type === "user_select" &&
          report.selector_options &&
          report.selector_options.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-[#1E1B4B] mb-1">
                {report.id === "program_performance_report"
                  ? "Select Program"
                  : report.id === "learner_engagement_report"
                    ? "Select Learner"
                    : "Select User"}
              </label>
              <select
                value={
                  filters.generated_for !== null &&
                  filters.generated_for !== undefined
                    ? filters.generated_for
                    : ""
                }
                onChange={(e) =>
                  handleFilterChange(
                    report.id,
                    "generated_for",
                    e.target.value === "" ? null : parseInt(e.target.value),
                  )
                }
                className="w-full px-3 py-2 border border-[#D9CFE8] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#693C83] text-sm"
              >
                {report.selector_options.map((option) => (
                  <option key={option.id || "all"} value={option.id || ""}>
                    {option.name}
                  </option>
                ))}
              </select>
            </div>
          )}
      </div>
    );
  };

  return (
    <MainLayout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#1E1B4B] mb-2">
            Reports & Analytics
          </h1>
          <p className="text-[#4F4679]">
            Generate and view learning analytics reports
          </p>
        </div>

        <div className="space-y-8">
          {/* Available Reports Section */}
          <div>
            <h2 className="text-xl font-semibold text-[#1E1B4B] mb-4">
              Available Reports
            </h2>
            <div className="space-y-4">
              {availableReports.map((report) => {
                const Icon = ICON_MAP[report.icon] || User;
                return (
                  <div
                    key={report.id}
                    className="bg-white rounded-xl p-6 shadow-sm border border-[#D9CFE8]"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-full bg-[#693C83] flex items-center justify-center flex-shrink-0">
                          <Icon size={24} className="text-white" />
                        </div>
                        <div>
                          <h3 className="text-[#1E1B4B] text-lg font-semibold mb-1">
                            {report.title}
                          </h3>
                          <p className="text-[#4F4679] text-sm leading-relaxed">
                            {report.description}
                          </p>
                        </div>
                      </div>
                    </div>

                    {renderFilterUI(report)}

                    <div className="flex gap-3">
                      <button
                        onClick={() => handlePreview(report)}
                        disabled={isPreviewing}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[#F1ECF7] text-[#693C83] rounded-lg hover:bg-[#E8E0F0] transition-colors text-sm font-medium disabled:opacity-50"
                      >
                        <Eye size={16} />
                        {isPreviewing ? "Loading..." : "Preview"}
                      </button>
                      <button
                        onClick={() => handleGenerateAndDownload(report)}
                        disabled={isGenerating}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[#693C83] text-white rounded-lg hover:bg-[#5A2F6E] transition-colors text-sm font-medium disabled:opacity-50"
                      >
                        <Download size={16} />
                        {isGenerating ? "Generating..." : "Generate & Download"}
                      </button>
                    </div>
                  </div>
                );
              })}
              {availableReports.length === 0 && (
                <div className="bg-white rounded-xl p-8 shadow-sm border border-[#D9CFE8] text-center">
                  <p className="text-[#4F4679]">
                    No reports available for your role
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Generated Reports Section */}
          <div>
            <h2 className="text-xl font-semibold text-[#1E1B4B] mb-4">
              Generated Reports
            </h2>
            <RecentReportsTable
              reports={recentReports}
              onRefresh={loadRecentReports}
            />
          </div>
        </div>

        <ReportPreview
          isOpen={isPreviewOpen}
          onClose={() => {
            setIsPreviewOpen(false);
            setSelectedReport(null);
            setPreviewReportData(null);
          }}
          reportData={previewReportData}
          reportTitle={selectedReport?.title || ""}
          reportId={selectedReport?.id}
          reportFilters={
            selectedReport ? reportFilters[selectedReport.id] : null
          }
          onLoadData={() => {}}
        />
      </div>
    </MainLayout>
  );
};

export default ReportsPage;
