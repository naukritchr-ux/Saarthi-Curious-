import React, { useState } from "react";
import DashboardCard from "../../components/ui/dashboardCard";
import { Sparkles, Lightbulb, CheckCircle, AlertTriangle, ArrowRight, RefreshCw } from "lucide-react";

const AIInsightsSection = ({ data, loading, onGenerateReport }) => {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);
    await onGenerateReport();
    setIsGenerating(false);
  };

  if (loading) {
    return (
      <DashboardCard 
        title="AI Insights"
        icon={<Sparkles size={20} className="text-[#8B5CF6]" />}
      >
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8B5CF6] mx-auto mb-4"></div>
            <p className="text-sm text-[#4F4679]">Loading AI insights...</p>
          </div>
        </div>
      </DashboardCard>
    );
  }

  if (!data) {
    return (
      <DashboardCard 
        title="AI Insights"
        icon={<Sparkles size={20} className="text-[#8B5CF6]" />}
      >
        <div className="flex flex-col items-center justify-center h-64">
          <Sparkles size={48} className="text-[#8B5CF6]/30 mb-4" />
          <p className="text-sm text-[#4F4679] mb-4">No AI insights available</p>
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#8B5CF6] to-[#693C83] text-white rounded-xl hover:opacity-90 transition-all text-sm font-medium disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <RefreshCw size={18} className="animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles size={18} />
                Generate AI Report
              </>
            )}
          </button>
        </div>
      </DashboardCard>
    );
  }

  const { executive_summary, key_insights, strengths, areas_needing_attention, recommendations, next_suggested_actions } = data;

  return (
    <div className="space-y-6">
      {/* Generate Button */}
      <div className="flex justify-end">
        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#8B5CF6] to-[#693C83] text-white rounded-xl hover:opacity-90 transition-all text-sm font-medium disabled:opacity-50"
        >
          {isGenerating ? (
            <>
              <RefreshCw size={18} className="animate-spin" />
              Regenerating...
            </>
          ) : (
            <>
              <Sparkles size={18} />
              Generate AI Report
            </>
          )}
        </button>
      </div>

      {/* Executive Summary */}
      <DashboardCard 
        title="Executive Summary"
        icon={<Sparkles size={20} className="text-[#8B5CF6]" />}
      >
        <div className="bg-gradient-to-r from-[#8B5CF6]/10 to-[#8B5CF6]/5 rounded-xl p-6">
          <p className="text-sm text-[#4F4679] leading-relaxed">{executive_summary}</p>
        </div>
      </DashboardCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Key Insights */}
        <DashboardCard 
          title="Key Insights"
          icon={<Lightbulb size={20} className="text-[#F59E0B]" />}
        >
          <div className="space-y-3">
            {key_insights?.map((insight, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-[#F1ECF7] rounded-lg">
                <div className="w-6 h-6 rounded-full bg-[#F59E0B]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Lightbulb size={12} className="text-[#F59E0B]" />
                </div>
                <p className="text-sm text-[#4F4679]">{insight}</p>
              </div>
            ))}
          </div>
        </DashboardCard>

        {/* Strengths */}
        <DashboardCard 
          title="Strengths"
          icon={<CheckCircle size={20} className="text-[#10B981]" />}
        >
          <div className="space-y-3">
            {strengths?.map((strength, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-gradient-to-r from-[#10B981]/10 to-[#10B981]/5 rounded-lg">
                <CheckCircle size={16} className="text-[#10B981] mt-0.5 flex-shrink-0" />
                <p className="text-sm text-[#4F4679]">{strength}</p>
              </div>
            ))}
          </div>
        </DashboardCard>
      </div>

      {/* Areas Needing Attention */}
      <DashboardCard 
        title="Areas Needing Attention"
        icon={<AlertTriangle size={20} className="text-[#EF4444]" />}
      >
        <div className="space-y-3">
          {areas_needing_attention?.map((area, index) => (
            <div key={index} className="flex items-start gap-3 p-3 bg-gradient-to-r from-[#EF4444]/10 to-[#EF4444]/5 rounded-lg">
              <AlertTriangle size={16} className="text-[#EF4444] mt-0.5 flex-shrink-0" />
              <p className="text-sm text-[#4F4679]">{area}</p>
            </div>
          ))}
        </div>
      </DashboardCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recommendations */}
        <DashboardCard 
          title="Recommendations"
          icon={<ArrowRight size={20} className="text-[#693C83]" />}
        >
          <div className="space-y-3">
            {recommendations?.map((recommendation, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-gradient-to-r from-[#693C83]/10 to-[#10B981]/10 rounded-lg">
                <div className="w-6 h-6 rounded-full bg-[#693C83] flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-xs font-bold">{index + 1}</span>
                </div>
                <p className="text-sm text-[#4F4679]">{recommendation}</p>
              </div>
            ))}
          </div>
        </DashboardCard>

        {/* Next Suggested Actions */}
        <DashboardCard 
          title="Next Suggested Actions"
          icon={<ArrowRight size={20} className="text-[#3B82F6]" />}
        >
          <div className="space-y-3">
            {next_suggested_actions?.map((action, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-gradient-to-r from-[#3B82F6]/10 to-[#3B82F6]/5 rounded-lg">
                <div className="w-6 h-6 rounded-full bg-[#3B82F6] flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-xs font-bold">{index + 1}</span>
                </div>
                <p className="text-sm text-[#4F4679]">{action}</p>
              </div>
            ))}
          </div>
        </DashboardCard>
      </div>

      {/* API Integration Notice */}
      <div className="mt-4 p-4 bg-[#E0F2FE] rounded-xl border border-[#BAE6FD]">
        <p className="text-sm text-[#0369A1] flex items-center gap-2">
          <Sparkles size={16} />
          AI insights powered by Gemini/Groq API (Coming Soon)
        </p>
      </div>
    </div>
  );
};

export default AIInsightsSection;
