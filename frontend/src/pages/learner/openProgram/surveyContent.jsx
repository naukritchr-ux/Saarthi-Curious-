import { useState, useEffect } from "react";
import api from "../../../utils/axios";
import { ClipboardCheck, CheckCircle, X } from "lucide-react";
import { API_BASE_URL } from "./dummyData";

const SurveyContent = ({
  content,
  userId,
  handleContentComplete,
  isCompleted,
  isSubmitting,
}) => {
  const [surveyAnswers, setSurveyAnswers] = useState({});
  const [validationShown, setValidationShown] = useState(false);
  const [hasMarkedComplete, setHasMarkedComplete] = useState(false);
  const [isSurveyOpen, setIsSurveyOpen] = useState(false);

  // Reset hasMarkedComplete when isCompleted changes to true
  useEffect(() => {
    if (isCompleted && hasMarkedComplete) {
      setHasMarkedComplete(false);
    }
  }, [isCompleted, hasMarkedComplete]);

  const handleAnswerChange = (questionId, value) => {
    setSurveyAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));
    if (validationShown) setValidationShown(false);
  };

  const handleSurveySubmit = async () => {
    if (isSubmitting || hasMarkedComplete || isCompleted) return;

    const mandatoryQuestions =
      content.questions?.filter((q) => q.is_required !== false) || [];
    const answeredMandatory = mandatoryQuestions.filter(
      (q) => surveyAnswers[q.id] !== undefined && surveyAnswers[q.id] !== "",
    );

    if (answeredMandatory.length < mandatoryQuestions.length) {
      if (!validationShown) {
        setValidationShown(true);
        alert("Please answer all mandatory questions before submitting.");
      }
      return;
    }

    try {
      setHasMarkedComplete(true);

      const answers = Object.entries(surveyAnswers).map(
        ([questionId, answer]) => ({
          question_id: Number(questionId),
          answer: answer,
        })
      );

      // Save survey responses - this now also marks the survey as complete
      await api.post(`/programs/surveys/${content.id}/submit`, {
        user_id: userId,
        answers,
      });

      // Refresh progress after survey completion
      await handleContentComplete(content.id, "survey");

      setIsSurveyOpen(false);

    } catch (error) {
      console.error("Failed to submit survey:", error);
      setHasMarkedComplete(false);
    }
  };

  return (
    <>
      {/* Main survey card */}
      <div className="bg-blue-50 rounded-xl p-6 border border-blue-100">
        <div className="flex items-start gap-3">
          <ClipboardCheck className="w-6 h-6 text-[#693C83] flex-shrink-0 mt-1" />
          <div className="flex-1">
            <h3 className="font-semibold text-[#1E1B4B]">Survey</h3>
            <p className="text-gray-600 mt-1 text-sm">
              {content.description ||
                "Please complete this survey to help us improve."}
            </p>
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
              <span>📝 {content.questions?.length || 5} questions</span>
              <span>⭐ {content.points || 10} points</span>
            </div>

            {!isCompleted && (
              <button
                onClick={() => setIsSurveyOpen(true)}
                className="mt-4 bg-[#693C83] text-white px-6 py-2 rounded-lg hover:bg-[#5a2e6e] transition-colors text-sm"
              >
                Start Survey
              </button>
            )}

            {isCompleted && (
              <div className="mt-4 flex items-center gap-2 text-green-600 text-sm font-medium">
                <CheckCircle className="w-4 h-4" />
                Survey Completed
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Survey Overlay */}
      {isSurveyOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-start mb-4 sticky top-0 bg-white pb-4 border-b">
              <div>
                <h2 className="text-xl font-semibold text-[#1E1B4B]">
                  {content.title || "Survey"}
                </h2>
                <p className="text-sm text-gray-500">
                  Answer all questions to complete the survey
                </p>
              </div>
              <button
                onClick={() => setIsSurveyOpen(false)}
                className="text-gray-400 hover:text-gray-600"
                disabled={isSubmitting}
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-6 mt-4">
              {content.questions?.map((question, index) => (
                <div key={question.id} className="bg-gray-50 rounded-lg p-4">
                  <p className="font-medium text-gray-800 mb-3">
                    {index + 1}. {question.question}{" "}
                    {question.is_required !== false && (
                      <span className="text-red-500 ml-1">*</span>
                    )}
                  </p>

                  {question.options && question.options.length > 0 ? (
                    <div className="space-y-2 ml-4">
                      {question.options.map((option, optIndex) => (
                        <label
                          key={optIndex}
                          className="flex items-center gap-3 text-sm text-gray-700 cursor-pointer hover:bg-gray-100 p-2 rounded"
                        >
                          <input
                            type="radio"
                            name={`survey-question-${question.id}`}
                            value={option.option_text}
                            checked={surveyAnswers[question.id] === option.option_text}
                            onChange={() =>
                              handleAnswerChange(question.id, option.option_text)
                            }
                            disabled={isCompleted || isSubmitting}
                            className="w-4 h-4 text-[#693C83]"
                          />
                          {option.option_text}
                        </label>
                      ))}
                    </div>
                  ) : (
                    <textarea
                      value={surveyAnswers[question.id] || ""}
                      onChange={(e) =>
                        handleAnswerChange(question.id, e.target.value)
                      }
                      disabled={isCompleted || isSubmitting}
                      placeholder="Type your answer..."
                      className="w-full ml-4 p-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#693C83]/30"
                      rows={2}
                    />
                  )}
                </div>
              ))}
            </div>

            <div className="mt-6 pt-4 border-t sticky bottom-0 bg-white">
              <button
                onClick={handleSurveySubmit}
                disabled={hasMarkedComplete || isSubmitting || isCompleted}
                className={`w-full bg-[#693C83] text-white px-4 py-3 rounded-lg hover:bg-[#5a2e6e] transition-colors text-sm font-medium ${
                  hasMarkedComplete || isSubmitting || isCompleted
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                }`}
              >
                {hasMarkedComplete
                  ? "Submitting..."
                  : isSubmitting
                    ? "Saving..."
                    : isCompleted
                      ? "Completed"
                      : "Submit Survey"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SurveyContent;
