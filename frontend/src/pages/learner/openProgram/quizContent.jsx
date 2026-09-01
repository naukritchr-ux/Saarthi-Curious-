import { useState, useEffect } from "react";
import api from "../../../utils/axios";
import {
  ClipboardCheck,
  CheckCircle,
  X,
  XCircle,
  Trophy,
  Lightbulb,
} from "lucide-react";
import { API_BASE_URL } from "./dummyData";

const QuizContent = ({
  content,
  userId,
  handleContentComplete,
  isCompleted,
  isSubmitting,
}) => {
  const [quizAnswers, setQuizAnswers] = useState({});
  const [validationShown, setValidationShown] = useState(false);
  const [hasMarkedComplete, setHasMarkedComplete] = useState(false);
  const [isQuizOpen, setIsQuizOpen] = useState(false);
  const [quizResult, setQuizResult] = useState(null);
  const [isLoadingResult, setIsLoadingResult] = useState(false);

  // Reset hasMarkedComplete when isCompleted changes to true
  useEffect(() => {
    if (isCompleted && hasMarkedComplete) {
      setHasMarkedComplete(false);
    }
  }, [isCompleted, hasMarkedComplete]);

  const handleViewResult = async () => {
  try {
    setIsLoadingResult(true);

    const response = await api.get(
      `/learner/quiz-attempt/${userId}/${content.id}/latest`
    );

    setQuizResult(response.data);
  } catch (error) {
    console.error("Failed to load quiz result:", error);
    alert("Unable to load quiz result.");
  } finally {
    setIsLoadingResult(false);
  }
};

useEffect(() => {
  const loadLatestQuizAttempt = async () => {
    if (!userId || !content?.id) return;

    try {
      const response = await api.get(
        `/learner/quiz-attempt/${userId}/${content.id}/latest`
      );

      if (response.data) {
        setQuizResult(response.data);

        // If the learner already passed the quiz,
        // make sure the parent knows it is completed.
        if (response.data.passed && !isCompleted) {
          await handleContentComplete(content.id, "quiz");
        }
      }
    } catch (error) {
      // 404 simply means the learner has never attempted this quiz.
      if (error.response?.status !== 404) {
        console.error("Failed to load latest quiz attempt:", error);
      }
    }
  };

  loadLatestQuizAttempt();
}, [userId, content?.id]);

  const handleQuizSubmit = async () => {
  if (isSubmitting || hasMarkedComplete || isCompleted) return;

  const mandatoryQuestions =
    content.questions?.filter((q) => q.is_required !== false) || [];

  const answeredMandatory = mandatoryQuestions.filter(
    (q) => quizAnswers[q.id] !== undefined
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

    const answersArray = Object.entries(quizAnswers).map(
      ([questionId, answer]) => ({
        question_id: parseInt(questionId),
        selected_option: answer,
      })
    );

    const response = await api.post("/learner/quiz-attempt", {
      user_id: userId,
      quiz_id: content.id,
      answers: answersArray,

      // Change this later if you want proper attempt numbering
      attempt_number: 1,
    });

    // Save the result locally
    setQuizResult(response.data);

    // Only mark content as completed if learner PASSED
    if (response.data.passed) {
      await handleContentComplete(content.id, "quiz");
    }

    // Close quiz questions
    setIsQuizOpen(false);

    // Allow retake if failed
    setHasMarkedComplete(false);

  } catch (error) {
    console.error("Failed to submit quiz:", error);

    setHasMarkedComplete(false);

    alert(
      error.response?.data?.detail ||
        "Failed to submit quiz. Please try again."
    );
  }
};

  return (
    <>
      {/* Main quiz card */}
      <div className="bg-purple-50 rounded-xl p-6 border border-purple-100">
        <div className="flex items-start gap-3">
          <ClipboardCheck className="w-6 h-6 text-[#693C83] flex-shrink-0 mt-1" />
          <div className="flex-1">
            <h3 className="font-semibold text-[#1E1B4B]">Quiz Time!</h3>
            <p className="text-gray-600 mt-1 text-sm">
              {content.description ||
                "Test your knowledge with this quiz. Complete all questions to proceed."}
            </p>
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
              <span>⏱ {content.duration || "10 min"}</span>
              <span>📝 {content.questions?.length || 5} questions</span>
              <span>⭐ {content.points || 10} points</span>
              {content.passing_percentage && (
                <span>🎯 Pass: {content.passing_percentage}%</span>
              )}
            </div>

            {!isCompleted && !quizResult && (
  <button
    onClick={() => {
  setQuizAnswers({});
  setValidationShown(false);
  setHasMarkedComplete(false);
  setIsQuizOpen(true);
}}
    className="mt-4 bg-[#693C83] text-white px-6 py-2 rounded-lg hover:bg-[#5a2e6e] transition-colors text-sm"
  >
    Start Quiz
  </button>
)}

{!isCompleted && quizResult && !quizResult.passed && (
  <div className="mt-4">
    <div className="flex items-center gap-2 text-red-600 text-sm font-medium">
      <XCircle className="w-4 h-4" />
      Quiz Attempted — Not Passed
    </div>

    <div className="flex gap-3 mt-3">
      <button
        onClick={() => setIsQuizOpen(true)}
        className="bg-[#693C83] text-white px-5 py-2 rounded-lg hover:bg-[#5a2e6e] transition-colors text-sm font-medium"
      >
        Retake Quiz
      </button>

      <button
        onClick={handleViewResult}
        disabled={isLoadingResult}
        className="bg-gray-200 text-gray-700 px-5 py-2 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
      >
        {isLoadingResult ? "Loading..." : "View Result"}
      </button>
    </div>
  </div>
)}

{isCompleted && (
  <div className="mt-4">
    <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
      <CheckCircle className="w-4 h-4" />
      Quiz Completed
    </div>

    <button
      onClick={handleViewResult}
      disabled={isLoadingResult}
      className="mt-3 bg-[#693C83] text-white px-5 py-2 rounded-lg hover:bg-[#5a2e6e] transition-colors text-sm font-medium"
    >
      {isLoadingResult ? "Loading Result..." : "View Result"}
    </button>
  </div>
)}
          </div>
        </div>
      </div>

      {/* Quiz Overlay */}
      {isQuizOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-start mb-4 sticky top-0 bg-white pb-4 border-b">
              <div>
                <h2 className="text-xl font-semibold text-[#1E1B4B]">
                  {content.title || "Quiz"}
                </h2>
                <p className="text-sm text-gray-500">
                  Answer all questions to complete the quiz
                </p>
              </div>
              <button
                onClick={() => setIsQuizOpen(false)}
                className="text-gray-400 hover:text-gray-600"
                disabled={isSubmitting}
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Questions - FIXED field name */}
            <div className="space-y-6 mt-4">
              {content.questions?.map((question, index) => (
                <div key={question.id} className="bg-gray-50 rounded-lg p-4">
                  <p className="font-medium text-gray-800 mb-3">
                    {index + 1}. {question.question}{" "}
                    {/* FIXED: using question.question */}
                    {question.is_required !== false && (
                      <span className="text-red-500 ml-1">*</span>
                    )}
                  </p>
                  <div className="space-y-2 ml-4">
                    {question.options?.map((option, optIndex) => (
                      <label
                        key={optIndex}
                        className="flex items-center gap-3 text-sm text-gray-700 cursor-pointer hover:bg-gray-100 p-2 rounded"
                      >
                        <input
                          type="radio"
                          name={`question-${question.id}`}
                          value={option.text}
                          checked={quizAnswers[question.id] === option.text}
                          onChange={() => {
                            setQuizAnswers((prev) => ({
                              ...prev,
                              [question.id]: option.text,
                            }));
                            if (validationShown) setValidationShown(false);
                          }}
                          disabled={isCompleted || isSubmitting}
                          className="w-4 h-4 text-[#693C83]"
                        />
                        {option.text}
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-4 border-t sticky bottom-0 bg-white">
              <button
                onClick={handleQuizSubmit}
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
                      : "Submit Quiz"}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Quiz Result */}
{quizResult && (
  <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
    <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6">

      {/* Result Header */}
      <div className="text-center border-b pb-6">
        <div className="flex justify-center mb-3">
          {quizResult.passed ? (
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
              <Trophy className="w-8 h-8 text-green-600" />
            </div>
          ) : (
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
          )}
        </div>

        <h2 className="text-2xl font-bold text-[#1E1B4B]">
          Quiz Result
        </h2>

        <p className="text-gray-500 mt-1">
          {quizResult.passed
            ? "Congratulations! You passed the quiz."
            : "You did not pass the quiz. Please review your answers."}
        </p>
      </div>

      {/* Score Summary */}
      <div className="grid grid-cols-3 gap-4 mt-6">

        <div className="bg-purple-50 rounded-xl p-4 text-center">
          <p className="text-sm text-gray-500">Score</p>
          <p className="text-2xl font-bold text-[#693C83]">
            {quizResult.question_results?.filter(
  (question) => question.is_correct
).length || 0}/{quizResult.total_questions}
          </p>
        </div>

        <div className="bg-purple-50 rounded-xl p-4 text-center">
          <p className="text-sm text-gray-500">Percentage</p>
          <p className="text-2xl font-bold text-[#693C83]">
            {quizResult.percentage}%
          </p>
        </div>

        <div className="bg-purple-50 rounded-xl p-4 text-center">
          <p className="text-sm text-gray-500">Result</p>
          <p
            className={`text-2xl font-bold ${
              quizResult.passed ? "text-green-600" : "text-red-600"
            }`}
          >
            {quizResult.passed ? "Passed" : "Failed"}
          </p>
        </div>

      </div>

      {/* Question Review */}
      <div className="mt-8">

        <h3 className="text-lg font-semibold text-[#1E1B4B] mb-4">
          Question Review
        </h3>

        <div className="space-y-4">

          {quizResult.question_results?.map((result, index) => (
            <div
              key={result.question_id}
              className={`rounded-xl border p-5 ${
                result.is_correct
                  ? "border-green-200 bg-green-50"
                  : "border-red-200 bg-red-50"
              }`}
            >

              {/* Question */}
              <div className="flex items-start gap-3">

                {result.is_correct ? (
                  <CheckCircle className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-600 mt-1 flex-shrink-0" />
                )}

                <div className="flex-1">

                  <p className="font-semibold text-gray-800">
                    {index + 1}. {result.question}
                  </p>

                  {/* Your Answer */}
                  <div className="mt-3">
                    <p className="text-sm text-gray-500">
                      Your answer
                    </p>

                    <p
                      className={`font-medium ${
                        result.is_correct
                          ? "text-green-700"
                          : "text-red-700"
                      }`}
                    >
                      {result.selected_answer || "Not answered"}
                    </p>
                  </div>

                  {/* Correct Answer */}
                  {!result.is_correct && (
                    <div className="mt-3">
                      <p className="text-sm text-gray-500">
                        Correct answer
                      </p>

                      <p className="font-medium text-green-700">
                        {result.correct_answer}
                      </p>
                    </div>
                  )}

                  {/* Explanation */}
                  {result.explanation && (
                    <div className="mt-4 bg-white rounded-lg p-3 border border-purple-100">
                      <div className="flex items-start gap-2">
                        <Lightbulb className="w-4 h-4 text-[#693C83] mt-0.5 flex-shrink-0" />

                        <div>
                          <p className="text-sm font-semibold text-[#693C83]">
                            Explanation
                          </p>

                          <p className="text-sm text-gray-600 mt-1">
                            {result.explanation}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              </div>

            </div>
          ))}

        </div>
      </div>

      {/* Close Button */}
      <div className="mt-6 pt-4 border-t">
        <button
          onClick={() => setQuizResult(null)}
          className="w-full bg-[#693C83] text-white px-4 py-3 rounded-lg hover:bg-[#5a2e6e] transition-colors font-medium"
        >
          Close Result
        </button>
      </div>

    </div>
  </div>
)}
    </>
  );
};

export default QuizContent;
