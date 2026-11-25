import React, { useState, useEffect } from "react";
import axios from "axios";
import { Search, X, Copy, Eye, ArrowLeft, ClipboardList, Trash2 } from "lucide-react";

const SurveyTemplateGallery = ({ isOpen, onClose, onSelectTemplate, apiBaseUrl }) => {
  const [templates, setTemplates] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState(null);

  useEffect(() => {
    if (isOpen) {
      fetchTemplates();
    }
  }, [isOpen]);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${apiBaseUrl}/programs/templates`);
      setTemplates(response.data || []);
    } catch (error) {
      console.error(error);
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTemplate = async (templateId) => {
  const confirmed = window.confirm(
    "Are you sure you want to delete this survey from the reuse gallery?"
  );

  if (!confirmed) return;

  try {
    await axios.delete(
      `${apiBaseUrl}/programs/surveys/${templateId}`
    );

    setTemplates((prevTemplates) =>
      prevTemplates.filter(
        (template) => template.id !== templateId
      )
    );
  } catch (error) {
    console.error("Failed to delete survey:", error);

    alert(
      error.response?.data?.detail ||
        "Failed to delete survey."
    );
  }
};  

  const filteredTemplates = templates.filter((t) =>
    t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4">
      <div className="w-full max-w-5xl h-[85vh] rounded-3xl bg-[#080C1A] shadow-[0_0_50px_rgba(168,85,247,0.35)] flex flex-col overflow-hidden border-2 border-purple-500 text-white">
        
        {/* Header Ribbon Context */}
        <div className="bg-[#0D1226] border-b border-slate-800 px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            {previewTemplate && (
              <button 
                onClick={() => setPreviewTemplate(null)}
                className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white mr-1 transition cursor-pointer"
              >
                <ArrowLeft size={18} />
              </button>
            )}
            <h2 className="text-xl font-black text-white tracking-tight">
              {previewTemplate ? "Template Preview" : "Survey Template Gallery"}
            </h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition cursor-pointer border border-slate-700">
            <X size={20} />
          </button>
        </div>

        {/* Dynamic Display Layout */}
        {previewTemplate ? (
          /* PREVIEW WINDOW VIEW */
          <div className="flex-1 overflow-y-auto p-6 space-y-4 max-w-3xl mx-auto w-full custom-scrollbar">
            <div className="bg-[#0A0E1F] border-t-8 border-purple-500 rounded-2xl p-6 shadow-sm space-y-2 border border-slate-700">
              <h1 className="text-3xl font-black text-white">{previewTemplate.title}</h1>
              <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{previewTemplate.description || "No description provided."}</p>
            </div>
            
            {previewTemplate.questions?.map((q, idx) => (
              <div key={q.id || idx} className="bg-[#0A0E1F] border-2 border-slate-700/80 rounded-2xl p-5 shadow-xs space-y-3">
                <h3 className="font-bold text-white text-base">
                  {idx + 1}. {q.question} {q.is_required && <span className="text-rose-400">*</span>}
                </h3>
                <p className="text-xs text-purple-300 font-bold bg-purple-950/80 border border-purple-500/40 px-2.5 py-1 rounded-md inline-block">
                  Type: {q.question_type}
                </p>
                <div className="space-y-2 pl-2">
                  {["Multiple Choice", "Checkbox", "Dropdown"].includes(q.question_type) && 
                    q.options?.map((opt, oIdx) => (
                      <div key={opt.id || oIdx} className="flex items-center gap-2 text-sm text-slate-300">
                        <span className="text-purple-400 text-lg">
                          {q.question_type === "Multiple Choice" ? "○" : "□"}
                        </span>
                        <span>{opt.option_text}</span>
                      </div>
                    ))
                  }
                  {["Short Answer", "Paragraph"].includes(q.question_type) && (
                    <div className="w-full border-b border-dashed border-slate-700 py-2 text-xs italic text-slate-500">
                      User placeholder dynamic textbox response viewport
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-800 sticky bottom-0 bg-[#080C1A] pb-4">
              <button 
                onClick={() => setPreviewTemplate(null)}
                className="px-5 py-2.5 rounded-xl border border-slate-700 font-bold bg-slate-900 hover:bg-slate-800 text-slate-300 cursor-pointer"
              >
                Back to Selection
              </button>
              <button 
                onClick={() => {
                  const target = previewTemplate;
                  setPreviewTemplate(null);
                  onSelectTemplate(target);
                }}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold shadow-md flex items-center gap-2 cursor-pointer"
              >
                <Copy size={16} /> Use This Template
              </button>
            </div>
          </div>
        ) : (
          /* SELECTION LIST WINDOW VIEW */
          <>
            {/* Search Frame Control */}
            <div className="bg-[#0D1226] border-b border-slate-800 px-6 py-3 shrink-0">
              <div className="relative max-w-md">
                <Search className="absolute left-3.5 top-3 text-slate-400" size={18} />
                <input
                  type="text"
                  placeholder="Search form templates..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#050814] border border-slate-700 rounded-xl pl-11 pr-4 py-2 text-sm text-white placeholder-slate-500 outline-none focus:border-purple-400 transition"
                />
              </div>
            </div>

            {/* Template Gallery Workspace Grid */}
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-[#050814]">
              {loading ? (
                <div className="h-full flex items-center justify-center text-slate-400 font-bold">
                  Loading Gallery Modules...
                </div>
              ) : filteredTemplates.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-2">
                  <ClipboardList size={40} className="text-slate-600" />
                  <p className="text-sm font-medium">No layout blocks found matching your query.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredTemplates.map((template) => (
                    <div 
                      key={template.id} 
                      className="bg-[#0A0E1F] border-2 border-slate-700/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:border-purple-400 transition-all group"
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between">
                          <h4 className="font-bold text-white line-clamp-1 group-hover:text-purple-300 transition-colors">
                            {template.title}
                          </h4>
                          <span className="text-[11px] bg-purple-950/80 text-purple-300 border border-purple-500/40 px-2 py-0.5 rounded-full font-bold uppercase shrink-0 ml-2">
                            {template.questions?.length || 0} Qs
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed min-h-[48px]">
                          {template.description || "No instruction rules established."}
                        </p>
                        <p className="text-[10px] text-slate-500 font-medium">
                          Created: {new Date(template.created_at).toLocaleDateString()}
                        </p>
                      </div>

                      <div className="flex gap-2 border-t border-slate-800 mt-4 pt-3">
                        <button
                          onClick={() => setPreviewTemplate(template)}
                          className="flex-1 py-2 border border-slate-700 rounded-xl font-bold text-xs text-slate-300 bg-slate-900 hover:bg-slate-800 transition flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <Eye size={14} />
                          Preview
                        </button>

                        <button
                          onClick={() => onSelectTemplate(template)}
                          className="flex-1 py-2 rounded-xl font-bold text-xs text-white bg-purple-600 hover:bg-purple-500 transition shadow-xs flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <Copy size={14} />
                          Use Template
                        </button>

                        <button
                          onClick={() => handleDeleteTemplate(template.id)}
                          className="w-10 py-2 border border-rose-500/40 rounded-xl text-rose-400 bg-rose-950/40 hover:bg-rose-900/60 transition flex items-center justify-center cursor-pointer"
                          title="Delete survey"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SurveyTemplateGallery;