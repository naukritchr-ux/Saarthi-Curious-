import { useState, useEffect } from "react";
import MainLayout from "../../layout/mainLayout";

const CandidateAttrition = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters State
  const [searchQuery, setSearchQuery] = useState("");
  const [riskFilter, setRiskFilter] = useState("All");
  const [surveyFilter, setSurveyFilter] = useState("All");
  const [programFilter, setProgramFilter] = useState("All");

  // Modal State
  const [selectedResponse, setSelectedResponse] = useState(null);

  // Download states to prevent duplicate clicks
  const [downloadingCsv, setDownloadingCsv] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        "http://127.0.0.1:8000/programs/survey-analytics/candidate-attrition",
      );
      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err.message || "Something went wrong while fetching data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const downloadReport = async (url, fallbackFilename, setDownloadingState) => {
    setDownloadingState(true);
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(
          `Failed to download report. Status: ${response.status}`,
        );
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
      console.error(err.message || "An error occurred during download.");
    } finally {
      setDownloadingState(false);
    }
  };

  const clearFilters = () => {
    setSearchQuery("");
    setRiskFilter("All");
    setSurveyFilter("All");
    setProgramFilter("All");
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (searchQuery) count++;
    if (riskFilter !== "All") count++;
    if (surveyFilter !== "All") count++;
    if (programFilter !== "All") count++;
    return count;
  };

  // Loading State with Skeleton
  if (loading) {
    return (
      <MainLayout>
        <div className="space-y-8">
          {/* Header Skeleton */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="h-10 w-72 bg-gray-200 rounded-lg animate-pulse"></div>
              <div className="h-5 w-96 bg-gray-200 rounded-lg animate-pulse mt-2"></div>
            </div>
            <div className="flex flex-wrap gap-3">
              <div className="h-10 w-32 bg-gray-200 rounded-xl animate-pulse"></div>
              <div className="h-10 w-32 bg-gray-200 rounded-xl animate-pulse"></div>
            </div>
          </div>

          {/* Summary Cards Skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="bg-[#ECE5F2] border border-[#D9CFE8] rounded-2xl p-6"
              >
                <div className="h-4 w-24 bg-gray-300 rounded animate-pulse"></div>
                <div className="h-12 w-20 bg-gray-300 rounded animate-pulse mt-3"></div>
              </div>
            ))}
          </div>

          {/* Filters Skeleton */}
          <div className="bg-[#ECE5F2] border border-[#D9CFE8] rounded-2xl p-6">
            <div className="h-7 w-40 bg-gray-300 rounded animate-pulse mb-4"></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i}>
                  <div className="h-4 w-20 bg-gray-300 rounded animate-pulse mb-1"></div>
                  <div className="h-10 w-full bg-gray-300 rounded-xl animate-pulse"></div>
                </div>
              ))}
            </div>
          </div>

          {/* Table Skeleton */}
          <div className="bg-[#ECE5F2] border border-[#D9CFE8] rounded-2xl p-6">
            <div className="h-8 w-60 bg-gray-300 rounded animate-pulse mb-4"></div>
            <div className="space-y-3">
              <div className="h-10 w-full bg-gray-200 rounded animate-pulse"></div>
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="h-12 w-full bg-gray-100 rounded animate-pulse"
                ></div>
              ))}
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  // Error State
  if (error) {
    return (
      <MainLayout>
        <div className="max-w-md mx-auto my-12 bg-white border border-red-200 rounded-2xl p-8 shadow-lg shadow-black/5 text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-red-600 mb-2">
            Failed to Load Data
          </h2>
          <p className="text-[#4F4679] mb-6">{error}</p>
          <button
            onClick={fetchData}
            className="px-6 py-2 bg-[#693C83] text-white rounded-xl shadow hover:bg-[#57306e] transition-colors focus:outline-none focus:ring-2 focus:ring-[#693C83] focus:ring-offset-2"
          >
            Retry
          </button>
        </div>
      </MainLayout>
    );
  }

  const responsesList = data?.responses || [];

  const surveyEffectiveness = data?.survey_effectiveness;

  // Generate unique dynamic filters
  const uniqueSurveys = Array.from(
    new Set(responsesList.map((r) => r.survey_title).filter(Boolean)),
  );
  const uniquePrograms = Array.from(
    new Set(responsesList.map((r) => r.program_name).filter(Boolean)),
  );

  // Filter Logic
  const filteredResponses = responsesList.filter((item) => {
    const employeeName = item.employee_name || "";
    const employeeEmail = item.employee_email || "";
    const matchesSearch =
      employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      employeeEmail.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRisk = riskFilter === "All" || item.risk_level === riskFilter;
    const matchesSurvey =
      surveyFilter === "All" || item.survey_title === surveyFilter;
    const matchesProgram =
      programFilter === "All" || item.program_name === programFilter;

    return matchesSearch && matchesRisk && matchesSurvey && matchesProgram;
  });

  const activeFilterCount = getActiveFilterCount();
  const riskColors = {
    High: "border-l-4 border-red-500 bg-red-50",
    Medium: "border-l-4 border-amber-500 bg-amber-50",
    Low: "border-l-4 border-emerald-500 bg-emerald-50",
  };

  return (
    <MainLayout>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-4xl font-bold text-[#1E1B4B]">
            Candidate Attrition Report
          </h1>
          <p className="text-[#4F4679] mt-2">
            Analysis of candidate retention and training effectiveness
          </p>
          <p className="text-xs text-[#4F4679]/60 mt-1">
            Last updated: {new Date().toLocaleString()}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            disabled={downloadingCsv}
            onClick={() =>
              downloadReport(
                "http://127.0.0.1:8000/programs/survey-analytics/candidate-attrition/export/csv",
                "candidate_attrition_report.csv",
                setDownloadingCsv,
              )
            }
            className="px-4 py-2 text-sm font-semibold bg-[#ECE5F2] border border-[#D9CFE8] text-[#1E1B4B] rounded-xl shadow-sm hover:bg-[#D9CFE8] transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-[#693C83] focus:ring-offset-2 flex items-center gap-2"
          >
            <span>📄</span>
            {downloadingCsv ? "Downloading..." : "Download CSV"}
          </button>
          <button
            disabled={downloadingPdf}
            onClick={() =>
              downloadReport(
                "http://127.0.0.1:8000/programs/survey-analytics/candidate-attrition/export/pdf",
                "candidate_attrition_report.pdf",
                setDownloadingPdf,
              )
            }
            className="px-4 py-2 text-sm font-semibold bg-[#693C83] text-white rounded-xl shadow-sm hover:bg-[#57306e] transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-[#693C83] focus:ring-offset-2 flex items-center gap-2"
          >
            <span>📊</span>
            {downloadingPdf ? "Downloading..." : "Download PDF"}
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
        <div className="bg-white border border-[#D9CFE8] rounded-2xl p-6 shadow-md hover:shadow-lg transition-shadow duration-300">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-2xl">📋</span>
            <h3 className="text-[#1E1B4B] text-sm font-medium">
              Total Responses
            </h3>
          </div>
          <p className="text-5xl font-bold text-[#693C83]">
            {data?.total_responses ?? 0}
          </p>
          <p className="text-xs text-[#4F4679]/60 mt-2">
            All survey submissions
          </p>
        </div>

        <div className="bg-white border-l-4 border-red-500 border-[#D9CFE8] rounded-2xl p-6 shadow-md hover:shadow-lg transition-shadow duration-300">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-2xl">🔴</span>
            <h3 className="text-[#1E1B4B] text-sm font-medium">High Risk</h3>
          </div>
          <p className="text-5xl font-bold text-red-600">
            {data?.high_risk ?? 0}
          </p>
          <p className="text-xs text-[#4F4679]/60 mt-2">
            Requires immediate attention
          </p>
        </div>

        <div className="bg-white border-l-4 border-amber-500 border-[#D9CFE8] rounded-2xl p-6 shadow-md hover:shadow-lg transition-shadow duration-300">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-2xl">🟡</span>
            <h3 className="text-[#1E1B4B] text-sm font-medium">Medium Risk</h3>
          </div>
          <p className="text-5xl font-bold text-amber-600">
            {data?.medium_risk ?? 0}
          </p>
          <p className="text-xs text-[#4F4679]/60 mt-2">Should be reviewed</p>
        </div>

        <div className="bg-white border-l-4 border-emerald-500 border-[#D9CFE8] rounded-2xl p-6 shadow-md hover:shadow-lg transition-shadow duration-300">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-2xl">🟢</span>
            <h3 className="text-[#1E1B4B] text-sm font-medium">Low Risk</h3>
          </div>
          <p className="text-5xl font-bold text-emerald-600">
            {data?.low_risk ?? 0}
          </p>
          <p className="text-xs text-[#4F4679]/60 mt-2">Currently stable</p>
        </div>
      </div>

      {/* Filters Section */}
      <div className="bg-white border border-[#D9CFE8] rounded-2xl p-6 shadow-md mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-[#1E1B4B]">Filters</h2>
          <div className="flex items-center gap-3">
            {activeFilterCount > 0 && (
              <span className="text-xs font-medium text-[#693C83] bg-[#ECE5F2] px-3 py-1 rounded-full">
                {activeFilterCount} filter{activeFilterCount > 1 ? "s" : ""}{" "}
                applied
              </span>
            )}
            <button
              onClick={clearFilters}
              className="text-sm text-[#4F4679] hover:text-[#1E1B4B] font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[#693C83] focus:ring-offset-2 rounded-lg px-3 py-1"
            >
              Clear Filters
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#4F4679] mb-1.5">
              Search Employee
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4F4679]">
                🔍
              </span>
              <input
                type="text"
                placeholder="Name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 text-sm bg-white border border-[#D9CFE8] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#693C83] focus:border-transparent transition-shadow"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#4F4679] mb-1.5">
              Risk Level
            </label>
            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              className="w-full px-3 py-2.5 text-sm bg-white border border-[#D9CFE8] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#693C83] focus:border-transparent transition-shadow"
            >
              <option value="All">All Risk Levels</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#4F4679] mb-1.5">
              Survey
            </label>
            <select
              value={surveyFilter}
              onChange={(e) => setSurveyFilter(e.target.value)}
              className="w-full px-3 py-2.5 text-sm bg-white border border-[#D9CFE8] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#693C83] focus:border-transparent transition-shadow"
            >
              <option value="All">All Surveys</option>
              {uniqueSurveys.map((survey) => (
                <option key={survey} value={survey}>
                  {survey}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#4F4679] mb-1.5">
              Program
            </label>
            <select
              value={programFilter}
              onChange={(e) => setProgramFilter(e.target.value)}
              className="w-full px-3 py-2.5 text-sm bg-white border border-[#D9CFE8] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#693C83] focus:border-transparent transition-shadow"
            >
              <option value="All">All Programs</option>
              {uniquePrograms.map((prog) => (
                <option key={prog} value={prog}>
                  {prog}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Survey Effectiveness */}
<div className="bg-[#ECE5F2] border border-[#D9CFE8] rounded-2xl p-6 shadow-lg shadow-black/10 mt-8">
  <h2 className="text-2xl font-semibold text-[#1E1B4B] mb-6">
    📊 Survey Effectiveness
  </h2>

  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">

    <div className="bg-white rounded-xl p-6 border border-[#D9CFE8]">
      <p className="text-sm text-[#4F4679]">
        Overall Score
      </p>

      <h1 className="text-5xl font-bold text-[#693C83] mt-2">
        {surveyEffectiveness?.overall_score ?? 0}/10
      </h1>

      <span className="inline-block mt-4 px-4 py-2 rounded-full bg-green-100 text-green-700 font-semibold">
        {surveyEffectiveness?.interpretation || "No Data"}
      </span>
    </div>

    <div className="bg-white rounded-xl p-6 border border-[#D9CFE8] flex flex-col justify-center">

      <div className="mb-6">
        <p className="text-sm text-gray-500">
          🏆 Highest Rated
        </p>

        <h3 className="text-lg font-semibold text-[#1E1B4B]">
          {surveyEffectiveness?.highest_question?.question || "-"}
        </h3>

        <p className="text-green-600 font-bold">
          {((surveyEffectiveness?.highest_question?.average || 0) * 100).toFixed(0)}%
        </p>
      </div>

      <div>
        <p className="text-sm text-gray-500">
          ⚠ Needs Improvement
        </p>

        <h3 className="text-lg font-semibold text-[#1E1B4B]">
          {surveyEffectiveness?.lowest_question?.question || "-"}
        </h3>

        <p className="text-amber-600 font-bold">
          {((surveyEffectiveness?.lowest_question?.average || 0) * 100).toFixed(0)}%
        </p>
      </div>

    </div>

  </div>

  <div className="bg-white rounded-xl border border-[#D9CFE8] p-6">

    <h3 className="text-lg font-semibold text-[#1E1B4B] mb-6">
      Question Analysis
    </h3>

    <div className="space-y-5">

      {surveyEffectiveness?.questions?.map((q) => (

        <div key={q.question}>

          <div className="flex justify-between text-sm mb-2">

            <span className="font-medium text-[#1E1B4B]">
              {q.question}
            </span>

            <span className="font-semibold text-[#693C83]">
              {(q.average * 100).toFixed(0)}%
            </span>

          </div>

          <div className="w-full bg-gray-200 rounded-full h-3">

            <div
              className="bg-[#693C83] h-3 rounded-full transition-all"
              style={{
                width: `${q.average * 100}%`,
              }}
            />

          </div>

        </div>

      ))}

    </div>

  </div>

</div>

      {/* Survey Feedback Responses Table */}
      <div className="bg-white border border-[#D9CFE8] rounded-2xl p-6 shadow-md mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold text-[#1E1B4B]">
            Survey Feedback Responses
          </h2>
          <span className="text-sm text-[#4F4679]">
            Showing {filteredResponses.length} of {responsesList.length}{" "}
            responses
          </span>
        </div>

        {filteredResponses.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <p className="text-[#4F4679] font-medium text-lg mb-2">
              No responses found
            </p>
            <p className="text-[#4F4679]/70 text-sm mb-4">
              Try adjusting your filters
            </p>
            {activeFilterCount > 0 && (
              <button
                onClick={clearFilters}
                className="px-4 py-2 text-sm font-semibold bg-[#693C83] text-white rounded-xl hover:bg-[#57306e] transition-colors"
              >
                Clear All Filters
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead className="sticky top-0 bg-white z-10">
                <tr className="border-b-2 border-[#D9CFE8] text-[#4F4679] text-sm">
                  <th className="py-2.5 pr-3 font-semibold">Employee</th>
                  <th className="py-2.5 pr-3 font-semibold">Email</th>
                  <th className="py-2.5 pr-3 font-semibold">Program</th>
                  <th className="py-2.5 pr-3 font-semibold">Module</th>
                  <th className="py-2.5 pr-3 font-semibold">Survey</th>
                  <th className="py-2.5 pr-3 font-semibold">Risk Score</th>
                  <th className="py-2.5 pr-3 font-semibold">Risk Level</th>
                  <th className="py-2.5 pr-3 font-semibold">Submitted</th>
                  <th className="py-2.5 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D9CFE8] text-[#1E1B4B] text-sm">
                {filteredResponses.map((res) => {
                  let employeeDisplayName = "Unknown Employee";
                  if (res.employee_name) {
                    employeeDisplayName = res.employee_name;
                  } else if (res.employee_email) {
                    employeeDisplayName = res.employee_email;
                  }

                  const riskBadgeStyles = {
                    High: "bg-red-100 text-red-700",
                    Medium: "bg-amber-100 text-amber-700",
                    Low: "bg-emerald-100 text-emerald-700",
                  };
                  const badgeStyle =
                    riskBadgeStyles[res.risk_level] || riskBadgeStyles.Low;

                  const riskScore =
                    res.risk_score !== null ? res.risk_score : 0;
                  const riskScoreColor =
                    riskScore >= 7
                      ? "text-red-600"
                      : riskScore >= 4
                        ? "text-amber-600"
                        : "text-emerald-600";

                  return (
                    <tr
                      key={res.response_id}
                      className="hover:bg-[#ECE5F2]/40 transition-colors"
                    >
                      <td className="py-2 pr-3 font-medium">
                        {employeeDisplayName}
                      </td>
                      <td className="py-2 pr-3 text-[#4F4679]">
                        {res.employee_email || "—"}
                      </td>
                      <td className="py-2 pr-3 max-w-[150px] truncate group relative">
                        <span className="cursor-help">
                          {res.program_name || "—"}
                        </span>
                        {res.program_name && res.program_name.length > 20 && (
                          <div className="invisible group-hover:visible absolute z-20 bg-[#1E1B4B] text-white text-xs rounded-lg px-3 py-2 max-w-xs whitespace-normal bottom-full left-0 mb-1">
                            {res.program_name}
                          </div>
                        )}
                      </td>
                      <td className="py-2 pr-3 max-w-[150px] truncate group relative">
                        <span className="cursor-help">
                          {res.module_title || "—"}
                        </span>
                        {res.module_title && res.module_title.length > 20 && (
                          <div className="invisible group-hover:visible absolute z-20 bg-[#1E1B4B] text-white text-xs rounded-lg px-3 py-2 max-w-xs whitespace-normal bottom-full left-0 mb-1">
                            {res.module_title}
                          </div>
                        )}
                      </td>
                      <td className="py-2 pr-3 max-w-[150px] truncate group relative">
                        <span className="cursor-help">
                          {res.survey_title || "—"}
                        </span>
                        {res.survey_title && res.survey_title.length > 20 && (
                          <div className="invisible group-hover:visible absolute z-20 bg-[#1E1B4B] text-white text-xs rounded-lg px-3 py-2 max-w-xs whitespace-normal bottom-full left-0 mb-1">
                            {res.survey_title}
                          </div>
                        )}
                      </td>
                      <td className="py-2 pr-3">
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${riskScore >= 7 ? "bg-red-500" : riskScore >= 4 ? "bg-amber-500" : "bg-emerald-500"}`}
                              style={{
                                width: `${Math.min(riskScore * 10, 100)}%`,
                              }}
                            />
                          </div>
                          <span
                            className={`font-mono text-xs font-bold ${riskScoreColor}`}
                          >
                            {riskScore}/10
                          </span>
                        </div>
                      </td>
                      <td className="py-2 pr-3">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${badgeStyle}`}
                        >
                          {res.risk_level || "Low"}
                        </span>
                      </td>
                      <td className="py-2 pr-3 whitespace-nowrap text-xs text-[#4F4679]">
                        {res.submitted_at
                          ? new Date(res.submitted_at).toLocaleDateString()
                          : "—"}
                      </td>
                      <td className="py-2 text-right">
                        <button
                          onClick={() => setSelectedResponse(res)}
                          className="px-3 py-1.5 text-xs font-medium bg-[#693C83] text-white rounded-lg hover:bg-[#57306e] transition-colors focus:outline-none focus:ring-2 focus:ring-[#693C83] focus:ring-offset-2 flex items-center gap-1.5 ml-auto"
                        >
                          <span>👁️</span> View
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Risk Summary Insights */}
      <div className="bg-white border border-[#D9CFE8] rounded-2xl p-6 shadow-md">
        <h2 className="text-2xl font-semibold text-[#1E1B4B] mb-6">
          Risk Summary Insights
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data?.total_responses === 0 ? (
            <div className="col-span-2 flex items-center gap-3 bg-[#ECE5F2]/50 p-4 rounded-xl border border-[#D9CFE8]">
              <span className="text-2xl">🎯</span>
              <span className="text-[#4F4679]">
                No survey feedback has been submitted yet.
              </span>
            </div>
          ) : (
            <>
              {data?.high_risk > 0 && (
                <div className="flex items-center gap-3 bg-red-50 border border-red-200 p-4 rounded-xl">
                  <span className="text-2xl">⚠️</span>
                  <div>
                    <p className="font-bold text-red-700">{data.high_risk}</p>
                    <p className="text-sm text-red-600">
                      High-risk candidate(s) require immediate attention
                    </p>
                  </div>
                </div>
              )}
              {data?.medium_risk > 0 && (
                <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 p-4 rounded-xl">
                  <span className="text-2xl">ℹ️</span>
                  <div>
                    <p className="font-bold text-amber-700">
                      {data.medium_risk}
                    </p>
                    <p className="text-sm text-amber-600">
                      Medium-risk candidate(s) should be reviewed
                    </p>
                  </div>
                </div>
              )}
              {data?.low_risk > 0 && (
                <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 p-4 rounded-xl">
                  <span className="text-2xl">✅</span>
                  <div>
                    <p className="font-bold text-emerald-700">
                      {data.low_risk}
                    </p>
                    <p className="text-sm text-emerald-600">
                      Candidate(s) currently show low attrition risk
                    </p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-3 bg-[#ECE5F2]/50 border border-[#D9CFE8] p-4 rounded-xl col-span-full">
                <span className="text-2xl">📈</span>
                <div>
                  <p className="font-bold text-[#1E1B4B]">
                    {data?.total_responses || 0}
                  </p>
                  <p className="text-sm text-[#4F4679]">
                    Total responses successfully loaded from system feedback
                    stream
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* View Feedback Modal */}
      {selectedResponse && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setSelectedResponse(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-[#ECE5F2]">
              <div>
                <h3 className="text-xl font-bold text-[#1E1B4B]">
                  Survey Feedback Details
                </h3>
                <p className="text-sm text-[#4F4679] mt-0.5">
                  {selectedResponse.employee_name ||
                    selectedResponse.employee_email ||
                    "Unknown Candidate"}
                </p>
              </div>
              <button
                onClick={() => setSelectedResponse(null)}
                className="w-8 h-8 flex items-center justify-center text-[#4F4679] hover:text-[#1E1B4B] text-2xl font-bold rounded-full hover:bg-[#D9CFE8] transition-colors focus:outline-none focus:ring-2 focus:ring-[#693C83]"
              >
                ×
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {/* Info Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-[#ECE5F2]/50 p-4 rounded-xl border border-[#D9CFE8]">
                <div>
                  <span className="block text-xs font-semibold text-[#4F4679]">
                    Employee Name
                  </span>
                  <span className="text-sm font-medium text-[#1E1B4B]">
                    {selectedResponse.employee_name || "—"}
                  </span>
                </div>
                <div>
                  <span className="block text-xs font-semibold text-[#4F4679]">
                    Employee Email
                  </span>
                  <span className="text-sm font-medium text-[#1E1B4B] break-all">
                    {selectedResponse.employee_email || "—"}
                  </span>
                </div>
                <div>
                  <span className="block text-xs font-semibold text-[#4F4679]">
                    Program
                  </span>
                  <span className="text-sm font-medium text-[#1E1B4B]">
                    {selectedResponse.program_name || "—"}
                  </span>
                </div>
                <div>
                  <span className="block text-xs font-semibold text-[#4F4679]">
                    Module
                  </span>
                  <span className="text-sm font-medium text-[#1E1B4B]">
                    {selectedResponse.module_title || "—"}
                  </span>
                </div>
                <div>
                  <span className="block text-xs font-semibold text-[#4F4679]">
                    Survey
                  </span>
                  <span className="text-sm font-medium text-[#1E1B4B]">
                    {selectedResponse.survey_title || "—"}
                  </span>
                </div>
                <div>
                  <span className="block text-xs font-semibold text-[#4F4679]">
                    Risk Score
                  </span>
                  <span className="text-sm font-mono font-bold text-[#1E1B4B]">
                    {selectedResponse.risk_score !== null
                      ? `${selectedResponse.risk_score} / 10`
                      : "—"}
                  </span>
                </div>
                <div>
                  <span className="block text-xs font-semibold text-[#4F4679]">
                    Risk Level
                  </span>
                  <span
                    className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      selectedResponse.risk_level === 'High' ? 'bg-red-100 text-red-700' :
                      selectedResponse.risk_level === 'Medium' ? 'bg-amber-100 text-amber-700' :
                      'bg-emerald-100 text-emerald-700'
                    }`}
                  >
                    {selectedResponse.risk_level || "Low"}
                  </span>
                </div>
                <div>
                  <span className="block text-xs font-semibold text-[#4F4679]">
                    Submitted
                  </span>
                  <span className="text-xs text-[#1E1B4B]">
                    {selectedResponse.submitted_at
                      ? new Date(selectedResponse.submitted_at).toLocaleString()
                      : "—"}
                  </span>
                </div>
              </div>

              {/* Questions & Answers Details */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-bold text-[#1E1B4B]">
                    Questions & Answers
                  </h4>
                  {selectedResponse.answers && (
                    <span className="text-xs text-[#4F4679]">
                      {selectedResponse.answers.length} question
                      {selectedResponse.answers.length > 1 ? "s" : ""}
                    </span>
                  )}
                </div>
                {selectedResponse.answers &&
                selectedResponse.answers.length > 0 ? (
                  <div className="space-y-4">
                    {selectedResponse.answers.map((ans, idx) => (
                      <div
                        key={ans.question_id || idx}
                        className="bg-white border border-[#D9CFE8] rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow"
                      >
                        <div className="flex justify-between items-start gap-4 mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-[#4F4679] bg-[#ECE5F2] px-2 py-0.5 rounded-md">
                              Q{idx + 1}
                            </span>
                            <span className="text-xs font-semibold px-2 py-0.5 bg-[#ECE5F2] text-[#693C83] rounded-md">
                              {ans.question_type || "Question"}
                            </span>
                          </div>
                          {ans.numeric_score !== null && (
                            <span className="text-xs font-mono font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md">
                              Score: {ans.numeric_score}/10
                            </span>
                          )}
                        </div>
                        <p className="text-sm font-medium text-[#1E1B4B] mb-2">
                          {ans.question || "No question heading"}
                        </p>
                        <div className="bg-gray-50 border-l-4 border-[#693C83] p-3 rounded-r-lg text-sm text-[#4F4679] whitespace-pre-line">
                          {ans.answer || (
                            <span className="italic text-gray-400">
                              Empty answer provided
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-[#4F4679] italic">
                    No answers available for this response.
                  </p>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 border-t border-gray-100 flex justify-end bg-gray-50">
              <button
                onClick={() => setSelectedResponse(null)}
                className="px-4 py-2 text-sm font-semibold bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-[#693C83] focus:ring-offset-2"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
};

export default CandidateAttrition;
