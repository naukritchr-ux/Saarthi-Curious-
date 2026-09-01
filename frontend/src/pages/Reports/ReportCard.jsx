import React from "react";
import {
  User,
  Users,
  Building,
  Building2,
  BarChart,
  BookOpen,
  Clock,
  TrendingUp,
  Eye,
  Download,
} from "lucide-react";

const ICON_MAP = {
  User,
  Users,
  Building,
  Building2,
  BarChart,
  BookOpen,
  Clock,
  TrendingUp,
};

const ReportCard = ({
  report,
  onPreview,
  onDownload,
  onGenerate,
  isGenerating,
}) => {
  const Icon = ICON_MAP[report.icon] || User;
  const lastGenerated = "2024-01-15"; // Mock date

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow border border-[#D9CFE8]">
      <div className="flex items-start justify-between mb-4">
        <div className="w-12 h-12 rounded-full bg-[#693C83] flex items-center justify-center">
          <Icon size={24} className="text-white" />
        </div>
        <span className="text-xs text-[#4F4679] bg-[#F1ECF7] px-2 py-1 rounded-full">
          {lastGenerated}
        </span>
      </div>

      <h3 className="text-[#1E1B4B] text-lg font-semibold mb-2">
        {report.title}
      </h3>

      <p className="text-[#4F4679] text-sm mb-6 leading-relaxed">
        {report.description}
      </p>

      <div className="flex gap-3">
        <button
          onClick={() => onPreview(report.id)}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[#F1ECF7] text-[#693C83] rounded-lg hover:bg-[#E8E0F0] transition-colors text-sm font-medium"
        >
          <Eye size={16} />
          Preview
        </button>
        <button
          onClick={() => onGenerate(report.id)}
          disabled={isGenerating}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[#693C83] text-white rounded-lg hover:bg-[#5A2F6E] transition-colors text-sm font-medium disabled:opacity-50"
        >
          <Download size={16} />
          {isGenerating ? "Generating..." : "Generate Report"}
        </button>
      </div>
    </div>
  );
};

export default ReportCard;
