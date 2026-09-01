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
        <div className="rounded-2xl bg-[#F8F5FC] p-6 border border-purple-100">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div className="space-y-1 flex-1">
              <h2 className="text-2xl font-bold text-[#1E1B4B]">{heading}</h2>
              <p className="text-sm text-gray-500">{subtitle}</p>

              <div className="mt-4 space-y-4">
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => onTitleChange?.(e.target.value)}
                    className="w-full text-xl font-semibold rounded-xl border border-gray-300 p-3 bg-white outline-none focus:border-purple-500 transition"
                    placeholder="Application Check Title"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">
                    Description
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => onDescriptionChange?.(e.target.value)}
                    rows={2}
                    className="w-full text-sm text-gray-600 bg-white border border-gray-300 rounded-xl p-3 resize-none outline-none focus:border-purple-400"
                    placeholder="Add context or instructions for this application check"
                  />
                </div>
              </div>

              <div className="inline-block mt-4 text-xs font-bold bg-purple-100 text-[#1E1B4B] px-3 py-1 rounded-full">
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
              className="rounded-2xl bg-white border border-gray-200 p-5 shadow-xs relative space-y-4 hover:border-purple-300 transition"
            >
              <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                <div className="flex-1 w-full">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">
                    Question Prompt #{qIdx + 1}
                  </label>
                  <input
                    type="text"
                    value={question.question}
                    onChange={(e) =>
                      updateQuestionField(qIdx, "question", e.target.value)
                    }
                    className="w-full text-base font-medium rounded-xl border border-gray-300 p-3 bg-white outline-none focus:border-purple-500 transition text-gray-800"
                    placeholder="Type question text details here..."
                  />
                </div>

                <div className="w-full md:w-52 shrink-0">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">
                    Response Format
                  </label>
                  <select
                    value={question.type}
                    onChange={(e) =>
                      updateQuestionField(qIdx, "type", e.target.value)
                    }
                    className="w-full text-sm font-medium rounded-xl border border-gray-300 p-3 bg-gray-50 focus:bg-white outline-none cursor-pointer"
                  >
                    {questionTypes.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 mt-2">
                {question.type === "Short Answer" && (
                  <input
                    type="text"
                    disabled
                    placeholder="Short text field answering prompt preview viewport"
                    className="w-full md:w-2/3 text-xs bg-white border border-gray-300 p-2.5 rounded-lg italic text-gray-400 cursor-not-allowed"
                  />
                )}

                {question.type === "Paragraph" && (
                  <textarea
                    disabled
                    rows={2}
                    placeholder="Long paragraph multi-line dynamic block entry preview canvas viewport"
                    className="w-full text-xs bg-white border border-gray-300 p-2.5 rounded-lg italic text-gray-400 cursor-not-allowed resize-none"
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
  className={`flex items-center gap-2 rounded-lg p-2 transition ${
    question.type === "Multiple Choice" &&
    question.correctOption === oIdx
      ? "bg-purple-50 border border-purple-200"
      : "border border-transparent"
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
    className="h-4 w-4 text-purple-600 border-gray-300 cursor-pointer"
    title="Mark this option as correct"
  />
)}
                          {question.type === "Checkbox" && (
                            <span className="text-gray-400 text-base">☐</span>
                          )}
                          {question.type === "Dropdown" && (
                            <span className="text-xs font-bold text-gray-400">
                              {oIdx + 1}.
                            </span>
                          )}

                          <input
                            type="text"
                            value={option}
                            onChange={(e) =>
                              updateOptionValue(qIdx, oIdx, e.target.value)
                            }
                            className="flex-1 bg-white border border-gray-300 px-3 py-1.5 rounded-lg text-sm text-gray-700 outline-none focus:border-purple-400"
                            placeholder={`Option choice index value #${oIdx + 1}`}
                          />
                          <button
                            type="button"
                            onClick={() => removeOption(qIdx, oIdx)}
                            className="text-gray-400 hover:text-red-500 p-1 rounded-md transition"
                            title="Delete Option Entry row"
                          >
                            <X size={15} />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => addOption(qIdx)}
                        className="text-xs font-bold text-purple-600 bg-purple-50 hover:bg-purple-100 px-3 py-1.5 rounded-lg transition inline-flex items-center gap-1 mt-1"
                      >
                        + Add Option
                      </button>
                    </div>
                  )}
              </div>

              <div className="flex justify-end items-center border-t border-gray-100 pt-3 mt-2 gap-4">
                <div className="flex items-center gap-1.5 text-xs font-bold text-gray-600">
                  <input
                    type="checkbox"
                    id={`req_toggle_${qIdx}`}
                    checked={question.required || false}
                    onChange={(e) =>
                      updateQuestionField(qIdx, "required", e.target.checked)
                    }
                    className="h-3.5 w-3.5 text-purple-600 border-gray-300 rounded cursor-pointer"
                  />
                  <label
                    htmlFor={`req_toggle_${qIdx}`}
                    className="cursor-pointer select-none"
                  >
                    Required answer condition
                  </label>
                </div>
                <div className="h-4 w-px bg-gray-200"></div>
                <button
                  type="button"
                  onClick={() => removeQuestion(qIdx)}
                  className="text-red-500 hover:text-red-700 font-semibold text-xs flex items-center gap-1 transition"
                  title="Remove complete Question card"
                >
                  <Trash2 size={13} /> Delete Question
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50">
            <p className="text-sm text-gray-400 italic font-medium">
              {emptyStateTitle}
            </p>
            <button
              onClick={addQuestion}
              className="mt-3 text-xs bg-[#1E1B4B] text-white font-bold px-4 py-2 rounded-xl"
            >
              {emptyStateButton}
            </button>
          </div>
        )}

        <div className="pt-2">
          <button
            type="button"
            onClick={addQuestion}
            className="w-full border-2 border-dashed border-purple-300 rounded-2xl py-4 text-purple-700 font-bold hover:bg-purple-50 hover:border-purple-500 transition flex items-center justify-center gap-2"
          >
            <Plus size={18} />
            Add Another Question
          </button>
        </div>
      </div>

      {showFooterActions && (
        <div className="flex justify-end gap-2 border-t border-gray-100 pt-4">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="rounded-xl border px-4 py-2 text-sm font-medium hover:bg-gray-50"
            >
              Cancel
            </button>
          )}
          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="rounded-xl bg-[#10B981] hover:bg-[#0fA773] px-4 py-2 text-white text-sm font-bold shadow-sm transition disabled:opacity-50"
          >
            {saving ? "Saving..." : saveLabel}
          </button>
        </div>
      )}
    </div>
  );
};

export default SurveyQuestionBuilder;
