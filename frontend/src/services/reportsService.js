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
  if (queryString) url.search = queryString;
  return url.toString();
};

export const getReportsForRole = async () => {
  const response = await api.get("/reports");
  return response.data.reports || [];
};

export const getRecentReports = async () => {
  const response = await api.get("/reports/history");
  return (response.data.reports || []).map((report) => ({
    id: report.id,
    report: report.title,
    generatedOn: report.generated_at,
    status: report.status,
    periodStart: report.period_start,
    periodEnd: report.period_end,
    reportType: report.report_type,
    generatedFor: report.generated_for,
    aiSummary: report.ai_summary,
  }));
};

export const previewReport = async (reportType, filters = {}, generatedFor = null) => {
  const response = await api.post("/reports/preview", {
    report_type: reportType,
    filters: filters,
    generated_for: generatedFor,
  });
  return {
    report: null,
    data: response.data.data,
  };
};

export const generateReport = async (reportType, filters = {}, generatedFor = null, programId = null) => {
  const response = await api.post("/reports/generate", {
    report_type: reportType,
    filters: filters,
    generated_for: generatedFor,
    program_id: programId,
  });
  return { report: response.data.report };
};

export const downloadReportPDF = async (reportId) => {
  try {
    const response = await api.get(`/reports/${reportId}/download`, {
      responseType: "blob",
    });
    const blob = new Blob([response.data], { type: "application/pdf" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `report-${reportId}-${new Date().toISOString().split("T")[0]}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    return true;
  } catch (err) {
    try {
      const fallback = await api.get(`/reports/${reportId}/download`);
      if (fallback.data?.download_url) {
        window.open(fallback.data.download_url, "_blank");
        return true;
      }
    } catch (e2) {
      console.error("Download failed:", e2);
    }
    console.error("Download failed:", err);
    return false;
  }
};

export const generateAIInsights = async ({
  reportId = null,
  reportType = null,
  filters = {},
  generatedFor = null,
}) => {
  const response = await api.post("/reports/ai-insights", {
    report_id: reportId,
    report_type: reportType,
    filters,
    generated_for: generatedFor,
  });
  return response.data;
};

export const regenerateWithAIInsights = async (reportId) =>
  generateAIInsights({ reportId });

export const getLearnerReport = async (userId) => {
  const response = await api.get(`/reports/learner/${userId}`);
  return response.data;
};

export default {
  getReportsForRole,
  getRecentReports,
  previewReport,
  generateReport,
  downloadReportPDF,
  generateAIInsights,
  regenerateWithAIInsights,
  getLearnerReport,
};