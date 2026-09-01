import React, { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { generateAIReport } from "../../services/reportsService";

const AIInsightsCard = () => {
  const [loading, setLoading] = useState(false);
  const [aiData, setAiData] = useState(null);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const data = await generateAIReport("my_learning_report");
      setAiData(data);
    } catch (error) {
      console.error("Failed to generate AI report:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-[#D9CFE8]">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#693C83] to-[#10B981] flex items-center justify-center">
          <Sparkles size={20} className="text-white" />
        </div>
        <div>
          <h3 className="text-[#1E1B4B] text-lg font-semibold">AI Learning Insights</h3>
          <p className="text-sm text-[#4F4679]">Generate an AI summary based on available learning data</p>
        </div>
      </div>

      <button
        onClick={handleGenerate}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-[#693C83] text-white rounded-lg hover:bg-[#5A2F6E] transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed mb-6"
      >
        {loading ? (
          <>
            <Loader2 size={18} className="animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <Sparkles size={18} />
            Generate AI Report
          </>
        )}
      </button>

      {aiData && (
        <div className="space-y-4">
          <div className="bg-[#F1ECF7] p-4 rounded-lg">
            <h4 className="font-semibold text-[#1E1B4B] mb-2">Executive Summary</h4>
            <p className="text-sm text-[#4F4679] leading-relaxed">{aiData.executiveSummary}</p>
          </div>

          <div className="bg-[#F1ECF7] p-4 rounded-lg">
            <h4 className="font-semibold text-[#1E1B4B] mb-2">Key Insights</h4>
            <ul className="space-y-1">
              {aiData.keyInsights?.map((insight, idx) => (
                <li key={idx} className="text-sm text-[#4F4679] flex items-start gap-2">
                  <span className="text-[#10B981] mt-1">•</span>
                  {insight}
                </li>
              ))}
            </ul>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-[#F1ECF7] p-4 rounded-lg">
              <h4 className="font-semibold text-[#1E1B4B] mb-2">Strengths</h4>
              <ul className="space-y-1">
                {aiData.strengths?.map((strength, idx) => (
                  <li key={idx} className="text-sm text-[#4F4679] flex items-start gap-2">
                    <span className="text-[#10B981] mt-1">•</span>
                    {strength}
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-[#F1ECF7] p-4 rounded-lg">
              <h4 className="font-semibold text-[#1E1B4B] mb-2">Areas Needing Attention</h4>
              <ul className="space-y-1">
                {aiData.areasNeedingAttention?.map((area, idx) => (
                  <li key={idx} className="text-sm text-[#4F4679] flex items-start gap-2">
                    <span className="text-[#F59E0B] mt-1">•</span>
                    {area}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="bg-[#F1ECF7] p-4 rounded-lg">
            <h4 className="font-semibold text-[#1E1B4B] mb-2">Recommendations</h4>
            <ul className="space-y-1">
              {aiData.recommendations?.map((rec, idx) => (
                <li key={idx} className="text-sm text-[#4F4679] flex items-start gap-2">
                  <span className="text-[#693C83] mt-1">•</span>
                  {rec}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIInsightsCard;
