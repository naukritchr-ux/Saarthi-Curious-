import { Plus, Trash2, X } from "lucide-react";

const buildQuestionTemplate = (isAppCheck, defaultQuestionType) => ({
  question: "",
  type: isAppCheck ? "Short Answer" : defaultQuestionType,
  required: false,
  options:
    isAppCheck || !["Multiple Choice", "Checkbox", "Dropdown"].includes(defaultQuestionType)
      ? []
      : ["Option 1", "Option 2"],
  correctOption: defaultQuestionType === "Multiple Choice" ? 0 : null,
});

const SurveyQuestionBuilder = ({
  title = "",
  description = "",
  onTitleChange,
  onDescriptionChange,
  questions = [],
  onQuestionsChange,
  onSave,
  onCancel,
  saving = false,
  heading = "Survey Builder",
  subtitle = "Create and edit survey questions.",
  saveLabel = "Save Survey",
  emptyStateTitle = "This survey currently contains zero question nodes.",
  emptyStateButton = "Add First Question",
  isAppCheck = false,
  defaultQuestionType = "Paragraph",
  showHeader = true,
  showFooterActions = true,
  headerActions = null,
  dark = true,
}) => {
  const addQuestion = () => {
  onQuestionsChange([
    ...questions,
    buildQuestionTemplate(isAppCheck, defaultQuestionType),
  ]);
};

  const updateQuestionField = (qIdx, field, value) => {
    const updated = [...questions];
    updated[qIdx][field] = value;
    onQuestionsChange(updated);
  };

  const removeQuestion = (qIdx) => {
    onQuestionsChange(questions.filter((_, idx) => idx !== qIdx));
  };

  const addOption = (qIdx) => {
    const updated = [...questions];
    const optionCounter = (updated[qIdx].options || []).length + 1;
    updated[qIdx].options = [
      ...(updated[qIdx].options || []),
      `Option ${optionCounter}`,
    ];
    onQuestionsChange(updated);
  };

  const updateOptionValue = (qIdx, oIdx, val) => {
    const updated = [...questions];
    updated[qIdx].options[oIdx] = val;
    onQuestionsChange(updated);
  };

  const removeOption = (qIdx, oIdx) => {
    const updated = [...questions];
    if ((updated[qIdx].options || []).length <= 2) {
      alert("A question must retain at least 2 distinct choosing options.");
      return;
    }
    updated[qIdx].options = (updated[qIdx].options || []).filter(
      (_, idx) => idx !== oIdx
    );
    onQuestionsChange(updated);
  };

  const questionTypes = isAppCheck
    ? [
        { value: "Short Answer", label: "Short Answer" },
        { value: "Paragraph", label: "Paragraph" },
      ]
    : [
        { value: "Short Answer", label: "Short Answer" },
        { value: "Paragraph", label: "Paragraph" },
        { value: "Multiple Choice", label: "Multiple Choice" },
        { value: "Checkbox", label: "Checkbox" },
        { value: "Dropdown", label: "Dropdown" },
        { value: "Linear Scale", label: "Linear Scale" },
        { value: "Date", label: "Date" },
        { value: "Time", label: "Time" },
      ];

  return (
    <div className="space-y-6">
      {showHeader && (
        <div
          className={`rounded-2xl p-6 border-2 transition ${
            dark
              ? "bg-[#0A0E1F] border-purple-500/40 shadow-lg text-white"
              : "bg-[#F8F5FC] border-purple-100 text-slate-900"
          }`}
        >
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div className="space-y-1 flex-1">
              <h2
                className={`text-2xl font-bold ${
                  dark ? "text-white" : "text-[#1E1B4B]"
                }`}
              >
                {heading}
              </h2>
              <p
                className={`text-sm ${
                  dark ? "text-slate-400" : "text-gray-500"
                }`}
              >
                {subtitle}
              </p>

              <div className="mt-4 space-y-4">
                <div>
                  <label
                    className={`text-xs font-bold uppercase tracking-wider block mb-1 ${
                      dark ? "text-slate-300" : "text-gray-400"
                    }`}
                  >
                    Title
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => onTitleChange?.(e.target.value)}
                    className={`w-full text-xl font-semibold rounded-xl border-2 p-3 outline-none transition ${
                      dark
                        ? "bg-[#050814] border-slate-700/80 text-white placeholder-slate-500 focus:border-purple-400"
                        : "bg-white border-gray-300 text-gray-800 focus:border-purple-500"
                    }`}
                    placeholder="Application Check Title"
                  />
                </div>

                <div>
                  <label
                    className={`text-xs font-bold uppercase tracking-wider block mb-1 ${
                      dark ? "text-slate-300" : "text-gray-400"
                    }`}
                  >
                    Description
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => onDescriptionChange?.(e.target.value)}
                    rows={2}
                    className={`w-full text-sm rounded-xl border-2 p-3 resize-none outline-none transition ${
                      dark
                        ? "bg-[#050814] border-slate-700/80 text-slate-200 placeholder-slate-500 focus:border-purple-400"
                        : "bg-white border-gray-300 text-gray-600 focus:border-purple-400"
                    }`}
                    placeholder="Add context or instructions for this application check"
                  />
                </div>
              </div>

              <div
                className={`inline-block mt-4 text-xs font-bold px-3 py-1 rounded-full border ${
                  dark
                    ? "bg-purple-950/80 text-purple-300 border-purple-500/50"
                    : "bg-purple-100 text-[#1E1B4B] border-transparent"
                }`}
              >
                📋 {questions.length} Form Question Block nodes
              </div>
            </div>

            {headerActions}
          </div>
        </div>
      )}

      <div className="space-y-4 mt-6">
        {questions.length > 0 ? (
          questions.map((question, qIdx) => (
            <div
              key={qIdx}
              className={`rounded-2xl border-2 p-5 shadow-lg relative space-y-4 transition ${
                dark
                  ? "bg-[#080C1A] border-slate-700/80 text-white hover:border-purple-400/80"
                  : "bg-white border-gray-200 text-gray-900 hover:border-purple-300"
              }`}
            >
              <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                <div className="flex-1 w-full">
                  <label
                    className={`text-xs font-bold uppercase tracking-wider block mb-1 ${
                      dark ? "text-slate-300" : "text-gray-400"
                    }`}
                  >
                    Question Prompt #{qIdx + 1}
                  </label>
                  <input
                    type="text"
                    value={question.question}
                    onChange={(e) =>
                      updateQuestionField(qIdx, "question", e.target.value)
                    }
                    className={`w-full text-base font-medium rounded-xl border-2 p-3 outline-none transition ${
                      dark
                        ? "bg-[#050814] border-slate-700 text-white placeholder-slate-500 focus:border-purple-400"
                        : "bg-white border-gray-300 text-gray-800 focus:border-purple-500"
                    }`}
                    placeholder="Type question text details here..."
                  />
                </div>

                <div className="w-full md:w-52 shrink-0">
                  <label
                    className={`text-xs font-bold uppercase tracking-wider block mb-1 ${
                      dark ? "text-slate-300" : "text-gray-400"
                    }`}
                  >
                    Response Format
                  </label>
                  <select
                    value={question.type}
                    onChange={(e) =>
                      updateQuestionField(qIdx, "type", e.target.value)
                    }
                    className={`w-full text-sm font-medium rounded-xl border-2 p-3 outline-none cursor-pointer ${
                      dark
                        ? "bg-[#050814] border-slate-700 text-slate-200 focus:border-purple-400"
                        : "bg-gray-50 border-gray-300 text-gray-800 focus:bg-white"
                    }`}
                  >
                    {questionTypes.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div
                className={`p-4 rounded-xl border mt-2 ${
                  dark
                    ? "bg-[#050814] border-slate-800"
                    : "bg-gray-50 border-gray-100"
                }`}
              >
                {question.type === "Short Answer" && (
                  <input
                    type="text"
                    disabled
                    placeholder="Short text field answering prompt preview viewport"
                    className={`w-full md:w-2/3 text-xs p-2.5 rounded-lg italic cursor-not-allowed border ${
                      dark
                        ? "bg-[#080C1A] border-slate-800 text-slate-500"
                        : "bg-white border-gray-300 text-gray-400"
                    }`}
                  />
                )}

                {question.type === "Paragraph" && (
                  <textarea
                    disabled
                    rows={2}
                    placeholder="Long paragraph multi-line dynamic block entry preview canvas viewport"
                    className={`w-full text-xs p-2.5 rounded-lg italic cursor-not-allowed resize-none border ${
                      dark
                        ? "bg-[#080C1A] border-slate-800 text-slate-500"
                        : "bg-white border-gray-300 text-gray-400"
                    }`}
                  />
                )}

                {!isAppCheck &&
                  ["Multiple Choice", "Checkbox", "Dropdown"].includes(
                    question.type
                  ) && (
                    <div className="space-y-2.5">
                      {(question.options || []).map((option, oIdx) => (
                        <div
                          key={oIdx}
                          className={`flex items-center gap-2 rounded-lg p-2 transition border ${
                            question.type === "Multiple Choice" &&
                            question.correctOption === oIdx
                              ? dark
                                ? "bg-purple-950/70 border-purple-500/80 text-purple-200"
                                : "bg-purple-50 border-purple-200"
                              : dark
                                ? "bg-[#0A0E1F] border-slate-700/60 text-slate-300"
                                : "border-transparent"
                          }`}
                        >
                          {question.type === "Multiple Choice" && (
                            <input
                              type="radio"
                              name={`correct_option_${qIdx}`}
                              checked={question.correctOption === oIdx}
                              onChange={() =>
                                updateQuestionField(qIdx, "correctOption", oIdx)
                              }
                              className="h-4 w-4 text-purple-500 cursor-pointer accent-purple-500"
                              title="Mark this option as correct"
                            />
                          )}
                          {question.type === "Checkbox" && (
                            <span
                              className={
                                dark ? "text-slate-500" : "text-gray-400"
                              }
                            >
                              ☐
                            </span>
                          )}
                          {question.type === "Dropdown" && (
                            <span
                              className={`text-xs font-bold ${
                                dark ? "text-slate-500" : "text-gray-400"
                              }`}
                            >
                              {oIdx + 1}.
                            </span>
                          )}

                          <input
                            type="text"
                            value={option}
                            onChange={(e) =>
                              updateOptionValue(qIdx, oIdx, e.target.value)
                            }
                            className={`flex-1 px-3 py-1.5 rounded-lg text-sm outline-none transition border ${
                              dark
                                ? "bg-[#050814] border-slate-700 text-white focus:border-purple-400 placeholder-slate-500"
                                : "bg-white border-gray-300 text-gray-700 focus:border-purple-400"
                            }`}
                            placeholder={`Option choice index value #${oIdx + 1}`}
                          />
                          <button
                            type="button"
                            onClick={() => removeOption(qIdx, oIdx)}
                            className={`p-1 rounded-md transition ${
                              dark
                                ? "text-slate-400 hover:text-red-400"
                                : "text-gray-400 hover:text-red-500"
                            }`}
                            title="Delete Option Entry row"
                          >
                            <X size={15} />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => addOption(qIdx)}
                        className={`text-xs font-bold px-3 py-1.5 rounded-lg transition inline-flex items-center gap-1 mt-1 border ${
                          dark
                            ? "text-purple-300 bg-purple-950/80 hover:bg-purple-900/80 border-purple-500/50"
                            : "text-purple-600 bg-purple-50 hover:bg-purple-100 border-transparent"
                        }`}
                      >
                        + Add Option
                      </button>
                    </div>
                  )}
              </div>

              <div
                className={`flex justify-end items-center border-t pt-3 mt-2 gap-4 ${
                  dark ? "border-slate-800" : "border-gray-100"
                }`}
              >
                <div
                  className={`flex items-center gap-1.5 text-xs font-bold ${
                    dark ? "text-slate-300" : "text-gray-600"
                  }`}
                >
                  <input
                    type="checkbox"
                    id={`req_toggle_${qIdx}`}
                    checked={question.required || false}
                    onChange={(e) =>
                      updateQuestionField(qIdx, "required", e.target.checked)
                    }
                    className="h-3.5 w-3.5 text-purple-600 rounded cursor-pointer accent-purple-600"
                  />
                  <label
                    htmlFor={`req_toggle_${qIdx}`}
                    className="cursor-pointer select-none"
                  >
                    Required answer condition
                  </label>
                </div>
                <div
                  className={`h-4 w-px ${
                    dark ? "bg-slate-700" : "bg-gray-200"
                  }`}
                ></div>
                <button
                  type="button"
                  onClick={() => removeQuestion(qIdx)}
                  className="text-red-400 hover:text-red-300 font-semibold text-xs flex items-center gap-1 transition"
                  title="Remove complete Question card"
                >
                  <Trash2 size={13} /> Delete Question
                </button>
              </div>
            </div>
          ))
        ) : (
          <div
            className={`text-center py-10 border-2 border-dashed rounded-2xl ${
              dark
                ? "border-slate-700 bg-[#050814]"
                : "border-gray-200 bg-gray-50"
            }`}
          >
            <p
              className={`text-sm italic font-medium ${
                dark ? "text-slate-400" : "text-gray-400"
              }`}
            >
              {emptyStateTitle}
            </p>
            <button
              onClick={addQuestion}
              className={`mt-3 text-xs font-bold px-4 py-2 rounded-xl transition ${
                dark
                  ? "bg-purple-600 hover:bg-purple-500 text-white shadow-md shadow-purple-600/30"
                  : "bg-[#1E1B4B] text-white"
              }`}
            >
              {emptyStateButton}
            </button>
          </div>
        )}

        <div className="pt-2">
          <button
            type="button"
            onClick={addQuestion}
            className={`w-full border-2 border-dashed rounded-2xl py-4 font-bold transition flex items-center justify-center gap-2 ${
              dark
                ? "border-purple-500/60 text-purple-300 hover:bg-purple-950/30 hover:border-purple-400 bg-[#050814]"
                : "border-purple-300 text-purple-700 hover:bg-purple-50 hover:border-purple-500"
            }`}
          >
            <Plus size={18} />
            Add Another Question
          </button>
        </div>
      </div>

      {showFooterActions && (
        <div
          className={`flex justify-end gap-2 border-t pt-4 ${
            dark ? "border-slate-800" : "border-gray-100"
          }`}
        >
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className={`rounded-xl border px-4 py-2 text-sm font-medium transition ${
                dark
                  ? "border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800"
                  : "border-gray-200 hover:bg-gray-50 text-gray-700"
              }`}
            >
              Cancel
            </button>
          )}
          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 px-5 py-2 text-white text-sm font-bold shadow-md shadow-emerald-600/30 transition disabled:opacity-50"
          >
            {saving ? "Saving..." : saveLabel}
          </button>
        </div>
      )}
    </div>
  );
};

export default SurveyQuestionBuilder;
