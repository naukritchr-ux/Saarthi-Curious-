import React from "react";
import { Download } from "lucide-react";
import { downloadReportPDF, generateReport } from "../../services/reportsService";

const RecentReportsTable = ({ reports }) => {
  const handleDownload = async (report) => {
    try {
      // Try to download the existing report first
      const success = await downloadReportPDF(report.id);
      
      // If download fails (no PDF exists), generate it
      if (!success) {
        console.log("PDF not found, generating new report...");
        const result = await generateReport(report.reportType, {}, report.generatedFor);
        
        if (result && result.report) {
          await downloadReportPDF(result.report.id);
        } else {
          alert("Failed to generate report for download");
        }
      }
    } catch (error) {
      console.error("Download error:", error);
      alert(`Failed to download report: ${error.message || "Unknown error"}`);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-[#D9CFE8] overflow-hidden">
      <div className="p-6 border-b border-[#D9CFE8]">
        <h3 className="text-[#1E1B4B] text-lg font-semibold">Generated Reports</h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-[#F1ECF7]">
            <tr>
              <th className="text-left px-6 py-3 text-sm font-semibold text-[#1E1B4B]">
                Report
              </th>
              <th className="text-left px-6 py-3 text-sm font-semibold text-[#1E1B4B]">
                Generated On
              </th>
              <th className="text-left px-6 py-3 text-sm font-semibold text-[#1E1B4B]">
                Status
              </th>
              <th className="text-right px-6 py-3 text-sm font-semibold text-[#1E1B4B]">
                Download
              </th>
            </tr>
          </thead>
          <tbody>
            {reports?.map((report) => (
              <tr key={report.id} className="border-t border-[#D9CFE8] hover:bg-[#F1ECF7]/50 transition-colors">
                <td className="px-6 py-4 text-sm text-[#1E1B4B] font-medium">
                  {report.report}
                </td>
                <td className="px-6 py-4 text-sm text-[#4F4679]">
                  {report.generatedOn}
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-[#10B981]/10 text-[#10B981]">
                    {report.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => handleDownload(report)}
                    className="p-2 hover:bg-[#693C83]/10 rounded-lg transition-colors"
                    title="Download"
                  >
                    <Download size={18} className="text-[#693C83]" />
                  </button>
                </td>
              </tr>
            ))}
            {(!reports || reports.length === 0) && (
              <tr>
                <td colSpan="4" className="px-6 py-8 text-center text-sm text-[#4F4679]">
                  No generated reports found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RecentReportsTable;
