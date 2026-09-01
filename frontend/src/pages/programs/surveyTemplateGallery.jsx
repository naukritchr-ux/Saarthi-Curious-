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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-5xl h-[85vh] rounded-3xl bg-[#F8F9FA] shadow-2xl flex flex-col overflow-hidden border border-gray-100">
        
        {/* Header Ribbon Context */}
        <div className="bg-white border-b px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            {previewTemplate && (
              <button 
                onClick={() => setPreviewTemplate(null)}
                className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 mr-1"
              >
                <ArrowLeft size={18} />
              </button>
            )}
            <h2 className="text-xl font-bold text-gray-800">
              {previewTemplate ? "Template Preview" : "Survey Template Gallery"}
            </h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition">
            <X size={20} />
          </button>
        </div>

        {/* Dynamic Display Layout */}
        {previewTemplate ? (
          /* PREVIEW WINDOW VIEW */
          <div className="flex-1 overflow-y-auto p-6 space-y-4 max-w-3xl mx-auto w-full">
            <div className="bg-white border-t-8 border-purple-700 rounded-2xl p-6 shadow-sm space-y-2">
              <h1 className="text-3xl font-bold text-gray-900">{previewTemplate.title}</h1>
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{previewTemplate.description || "No description provided."}</p>
            </div>
            
            {previewTemplate.questions?.map((q, idx) => (
              <div key={q.id || idx} className="bg-white border rounded-2xl p-5 shadow-xs space-y-3">
                <h3 className="font-semibold text-gray-800 text-base">
                  {idx + 1}. {q.question} {q.is_required && <span className="text-red-500">*</span>}
                </h3>
                <p className="text-xs text-purple-600 font-medium bg-purple-50 px-2.5 py-1 rounded-md inline-block">
                  Type: {q.question_type}
                </p>
                <div className="space-y-2 pl-2">
                  {["Multiple Choice", "Checkbox", "Dropdown"].includes(q.question_type) && 
                    q.options?.map((opt, oIdx) => (
                      <div key={opt.id || oIdx} className="flex items-center gap-2 text-sm text-gray-700">
                        <span className="text-gray-300 text-lg">
                          {q.question_type === "Multiple Choice" ? "○" : "□"}
                        </span>
                        <span>{opt.option_text}</span>
                      </div>
                    ))
                  }
                  {["Short Answer", "Paragraph"].includes(q.question_type) && (
                    <div className="w-full border-b border-dashed border-gray-300 py-2 text-xs italic text-gray-400">
                      User placeholder dynamic textbox response viewport
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            <div className="flex justify-end gap-3 pt-4 border-t sticky bottom-0 bg-[#F8F9FA] pb-4">
              <button 
                onClick={() => setPreviewTemplate(null)}
                className="px-5 py-2.5 rounded-xl border font-medium bg-white hover:bg-gray-50 text-gray-700"
              >
                Back to Selection
              </button>
              <button 
                onClick={() => {
                  const target = previewTemplate;
                  setPreviewTemplate(null);
                  onSelectTemplate(target);
                }}
                className="px-6 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-semibold shadow-md flex items-center gap-2"
              >
                <Copy size={16} /> Use This Template
              </button>
            </div>
          </div>
        ) : (
          /* SELECTION LIST WINDOW VIEW */
          <>
            {/* Search Frame Control */}
            <div className="bg-white border-b px-6 py-3 shrink-0">
              <div className="relative max-w-md">
                <Search className="absolute left-3.5 top-3 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Search form templates..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-gray-100 border border-transparent rounded-xl pl-11 pr-4 py-2 text-sm outline-none focus:bg-white focus:border-purple-600 transition"
                />
              </div>
            </div>

            {/* Template Gallery Workspace Grid */}
            <div className="flex-1 overflow-y-auto p-6">
              {loading ? (
                <div className="h-full flex items-center justify-center text-gray-500 font-medium">
                  Loading Gallery Modules...
                </div>
              ) : filteredTemplates.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-2">
                  <ClipboardList size={40} className="text-gray-300" />
                  <p className="text-sm font-medium">No layout blocks found matching your query.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredTemplates.map((template) => (
                    <div 
                      key={template.id} 
                      className="bg-white border rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:shadow-md hover:border-purple-200 transition-all group"
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between">
                          <h4 className="font-bold text-gray-900 line-clamp-1 group-hover:text-purple-700 transition-colors">
                            {template.title}
                          </h4>
                          <span className="text-[11px] bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full font-bold uppercase shrink-0 ml-2">
                            {template.questions?.length || 0} Qs
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 line-clamp-3 leading-relaxed min-h-[48px]">
                          {template.description || "No instruction rules established."}
                        </p>
                        <p className="text-[10px] text-gray-400 font-medium">
                          Created: {new Date(template.created_at).toLocaleDateString()}
                        </p>
                      </div>

                      <div className="flex gap-2 border-t mt-4 pt-3">
  <button
    onClick={() => setPreviewTemplate(template)}
    className="flex-1 py-2 border rounded-xl font-semibold text-xs text-gray-600 bg-white hover:bg-gray-50 transition flex items-center justify-center gap-1"
  >
    <Eye size={14} />
    Preview
  </button>

  <button
    onClick={() => onSelectTemplate(template)}
    className="flex-1 py-2 rounded-xl font-bold text-xs text-white bg-purple-600 hover:bg-purple-700 transition shadow-xs flex items-center justify-center gap-1"
  >
    <Copy size={14} />
    Use Template
  </button>

  <button
    onClick={() => handleDeleteTemplate(template.id)}
    className="w-10 py-2 border border-red-200 rounded-xl text-red-500 bg-red-50 hover:bg-red-100 hover:text-red-700 transition flex items-center justify-center"
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