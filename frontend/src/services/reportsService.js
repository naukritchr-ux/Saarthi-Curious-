// reportsService.js - Reports & Analytics Service
import api from "../utils/axios";

export const buildApiUrl = (path, params = {}) => {
  const API_BASE_URL =
    (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL) ||
    "http://127.0.0.1:8000";
  
  const url = new URL(`${API_BASE_URL}${path}`);
  const queryParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== "") {
      queryParams.set(key, String(value));
    }
  });

  const queryString = queryParams.toString();
  if (queryString) {
    url.search = queryString;
  }

  return url.toString();
};

// Get reports available for the user's role from backend
export const getReportsForRole = async () => {
  try {
    const response = await api.get("/reports");
    return response.data.reports || [];
  } catch (error) {
    console.log("Reports API not available, using fallback data");
  }
  return getFallbackReports();
};

// Fallback report definitions (used when API is unavailable)
const getFallbackReports = () => {
  const REPORT_DEFINITIONS = {
    my_learning_report: {
      id: "my_learning_report",
      title: "My Learning Report",
      description:
        "Your personal learning progress, completed programs, and achievements.",
      icon: "User",
      filter_schema: {
        scope: { type: "fixed", value: "self" },
        time_range: {
          type: "select",
          options: ["today", "last_month", "all_time"],
          default: "all_time"
        },
        custom_range: { type: "date_range", enabled: false }
      }
    },
    team_progress_report: {
      id: "team_progress_report",
      title: "Team Progress Report",
      description: "Overview of your team's learning progress and performance.",
      icon: "Users",
      filter_schema: {
        scope: {
          type: "user_select",
          role_filter: "team_leader",
          default: "self"
        },
        time_range: {
          type: "select",
          options: ["today", "last_month", "all_time", "custom"],
          default: "all_time"
        },
        custom_range: { type: "date_range", enabled: true }
      }
    },
    franchise_performance_report: {
      id: "franchise_performance_report",
      title: "Franchise Performance Report",
      description: "Aggregate performance metrics across franchises.",
      icon: "Building",
      filter_schema: {
        scope: {
          type: "user_select",
          role_filter: "franchise_user",
          default: "self"
        },
        time_range: {
          type: "select",
          options: ["today", "last_month", "all_time", "custom"],
          default: "all_time"
        },
        custom_range: { type: "date_range", enabled: true }
      }
    },
    organization_learning_report: {
      id: "organization_learning_report",
      title: "Organization Learning Report",
      description: "Detailed organization-wide learning analytics and trends.",
      icon: "BarChart",
      filter_schema: {
        scope: { type: "fixed", value: "organization" },
        time_range: {
          type: "select",
          options: ["today", "last_month", "all_time", "custom"],
          default: "all_time"
        },
        custom_range: { type: "date_range", enabled: true }
      }
    },
    program_performance_report: {
      id: "program_performance_report",
      title: "Program Performance Report",
      description: "Performance metrics for all learning programs.",
      icon: "BookOpen",
      filter_schema: {
        scope: {
          type: "user_select",
          role_filter: "program",
          default: "all"
        },
        time_range: {
          type: "select",
          options: ["today", "last_month", "all_time", "custom"],
          default: "all_time"
        },
        custom_range: { type: "date_range", enabled: true }
      }
    },
    learner_engagement_report: {
      id: "learner_engagement_report",
      title: "Learner Engagement Report",
      description: "Engagement metrics and activity across learners.",
      icon: "TrendingUp",
      filter_schema: {
        scope: {
          type: "user_select",
          role_filter: "learner",
          default: "all"
        },
        time_range: {
          type: "select",
          options: ["today", "last_month", "all_time", "custom"],
          default: "all_time"
        },
        custom_range: { type: "date_range", enabled: true }
      }
    },
  };

  return Object.values(REPORT_DEFINITIONS);
};

// Get report history from backend
export const getRecentReports = async () => {
  try {
    const response = await api.get("/reports/history");
    // Transform backend data to frontend format
    return (response.data.reports || []).map((report) => ({
      id: report.id,
      report: report.title,
      generatedOn: report.generated_at,
      status: report.status,
      periodStart: report.period_start,
      periodEnd: report.period_end,
      reportType: report.report_type,
      generatedFor: report.generated_for
    }));
  } catch (error) {
    console.log("Recent reports API not available, using fallback data");
  }
  return getFallbackRecentReports();
};

// Preview or generate a report using the new unified endpoint
export const previewReport = async (reportType, filters = {}, generatedFor = null) => {
  try {
    console.log("Making preview request:", { reportType, filters, generatedFor });
    const response = await api.post("/reports/preview", {
      report_type: reportType,
      filters: filters,
      generated_for: generatedFor,
    });

    console.log("Preview response:", response.data);

    // Return just the preview data
    return {
      report: null,
      data: response.data.data
    };
  } catch (error) {
    console.error("Report preview API error:", error);
    console.error("Error response:", error.response?.data);
    throw error;
  }

  return null;
};

// Generate report with PDF (for download)
export const generateReport = async (reportType, filters = {}, generatedFor = null) => {
  try {
    console.log("Making generate request:", { reportType, filters, generatedFor });
    const response = await api.post("/reports/generate", {
      report_type: reportType,
      filters: filters,
      generated_for: generatedFor,
    });

    console.log("Generate response:", response.data);

    // Return report metadata
    return {
      report: response.data.report
    };
  } catch (error) {
    console.error("Report generate API error:", error);
    console.error("Error response:", error.response?.data);
    throw error;
  }

  return null;
};

const getFallbackRecentReports = () => {
  return [
    {
      id: 1,
      report: "My Learning Report",
      generatedOn: "2024-01-15",
      status: "Completed",
      periodStart: null,
      periodEnd: null,
      reportType: "my_learning_report",
      generatedFor: null
    },
    {
      id: 2,
      report: "Team Progress Report",
      generatedOn: "2024-01-14",
      status: "Completed",
      periodStart: null,
      periodEnd: null,
      reportType: "team_progress_report",
      generatedFor: null
    },
    {
      id: 3,
      report: "My Learning Report",
      generatedOn: "2024-01-10",
      status: "Completed",
      periodStart: null,
      periodEnd: null,
      reportType: "my_learning_report",
      generatedFor: null
    },
  ];
};

// Download report PDF from backend
export const downloadReportPDF = async (reportId) => {
  try {
    const response = await api.get(`/reports/${reportId}/download`);
    
    // If the backend returns a signed URL, open it in a new tab
    if (response.data.download_url) {
      window.open(response.data.download_url, "_blank");
      return true;
    }
    
    // If the backend returns the PDF directly, download it
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `report-${reportId}-${new Date().toISOString().split("T")[0]}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    return true;
  } catch (error) {
    console.log("PDF download not available:", error);
  }
  return false;
};

// Regenerate report with AI insights
export const regenerateWithAIInsights = async (reportId) => {
  try {
    const response = await api.post(`/reports/${reportId}/ai-insights`);
    return response.data;
  } catch (error) {
    console.error("AI insights API not available:", error.message || error);
    const errorMessage = error.response?.data?.detail || error.response?.data?.message || "Failed to generate AI insights";
    throw new Error(errorMessage);
  }
};

export default {
  getReportsForRole,
  getRecentReports,
  previewReport,
  generateReport,
  downloadReportPDF,
};
