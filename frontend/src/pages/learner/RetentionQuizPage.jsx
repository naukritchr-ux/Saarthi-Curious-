import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../utils/axios";
import MainLayout from "../../layout/mainLayout";
import {
  BookOpen,
  ChevronRight,
  CheckCircle,
  Clock,
  AlertCircle,
  Award,
  ArrowLeft,
} from "lucide-react";

const RetentionQuizPage = () => {
  const navigate = useNavigate();
  const { quizId } = useParams();
  const userId = Number(localStorage.getItem("user_id"));
  
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchQuiz();
  }, [quizId]);

  const fetchQuiz = async () => {
    try {
      const response = await api.get(
  `/learner/retention-quiz/${quizId}?user_id=${userId}`
);
      setQuiz(response.data);
      
      // Initialize answers with null for each question
      const initialAnswers = {};
      if (response.data && response.data.questions) {
        response.data.questions.forEach((q) => {
          initialAnswers[q.id] = null;
        });
      }
      setAnswers(initialAnswers);
    } catch (err) {
      console.error("Failed to fetch quiz:", err);
      const errorMessage =
        err.response?.data?.detail || "Failed to load quiz. Please try again.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionId, option) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: option,
    }));
  };

  const handleSubmit = async () => {
  if (!quiz || !quiz.questions) return;

  const unansweredRequired = quiz.questions.filter(
    (q) => q.required && !answers[q.id]
  );

  if (unansweredRequired.length > 0) {
    setError("Please answer all required questions before submitting.");
    return;
  }

  setSubmitting(true);
  setError(null);

  try {
    const formattedAnswers = Object.entries(answers).map(
      ([questionId, selectedOption]) => ({
        question_id: parseInt(questionId),
        selected_option: selectedOption,
      })
    );

    const response = await api.post(
      "/learner/retention-quiz/attempt",
      {
        user_id: userId,
        retention_quiz_id: parseInt(quizId),
        answers: formattedAnswers,
      }
    );

    // Go to the result page for BOTH pass and fail
navigate(
  `/retention-quiz/${quizId}/result?user_id=${userId}`
);
  } catch (err) {
    console.error("Failed to submit quiz:", err);

    const errorMessage =
      err.response?.data?.detail ||
      "Failed to submit quiz. Please try again.";

    setError(errorMessage);

  } finally {
    setSubmitting(false);
  }
};

  const handleBack = () => {
    navigate(-1);
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#693C83] mx-auto"></div>
            <p className="mt-4 text-[#1E1B4B]">Loading quiz...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (error && !quiz) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center max-w-md mx-auto p-8 bg-white rounded-xl shadow-sm border border-[#D9CFE8]">
            <span className="text-4xl block mb-4">🔒</span>
            <h2 className="text-2xl font-bold text-[#1E1B4B] mb-2">Retention Quiz Locked</h2>
            <p className="text-red-600 mb-6">{error}</p>
            <button
              onClick={handleBack}
              className="px-6 py-3 bg-[#693C83] text-white rounded-lg hover:bg-[#5a2e6e] flex items-center gap-2 mx-auto"
            >
              <ArrowLeft size={20} />
              Back
            </button>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (result) {
  const questionResults = result.question_results || [];

  const wrongAnswers = questionResults.filter(
    (q) => q.is_correct === false
  ).length;

  return (
    <MainLayout>
      <div className="p-8 max-w-4xl mx-auto">

        {/* Result Header */}
        <div className="bg-gradient-to-r from-[#693C83] to-[#10B981] rounded-[24px] p-8 text-white text-center mb-8">
          <Award size={64} className="mx-auto mb-4" />

          <h1 className="text-3xl font-bold mb-2">
            Retention Quiz Result
          </h1>

          <p className="text-white/90 text-lg">
            Here is your detailed quiz result.
          </p>
        </div>

        {/* Score Summary */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-[#D9CFE8] mb-8">

          <h2 className="text-xl font-semibold text-[#1E1B4B] mb-6">
            Your Results
          </h2>

          <div className="grid grid-cols-4 gap-4">

            {/* Correct */}
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">
                {result.score}
              </p>
              <p className="text-sm text-[#4F4679]">
                Correct Answers
              </p>
            </div>

            {/* Wrong */}
            <div className="text-center">
              <p className="text-3xl font-bold text-red-600">
                {wrongAnswers}
              </p>
              <p className="text-sm text-[#4F4679]">
                Wrong Answers
              </p>
            </div>

            {/* Total */}
            <div className="text-center">
              <p className="text-3xl font-bold text-[#693C83]">
                {result.total_questions}
              </p>
              <p className="text-sm text-[#4F4679]">
                Total Questions
              </p>
            </div>

            {/* Score */}
            <div className="text-center">
              <p className="text-3xl font-bold text-[#F59E0B]">
                {Number(result.percentage || 0).toFixed(1)}%
              </p>
              <p className="text-sm text-[#4F4679]">
                Score
              </p>
            </div>

          </div>
        </div>

        {/* Question Review */}
        <div className="mb-8">

          <h2 className="text-2xl font-bold text-[#1E1B4B] mb-5">
            Question Review
          </h2>

          <div className="space-y-5">

            {questionResults.map((item, index) => {

              const isCorrect = item.is_correct === true;

              return (
                <div
                  key={item.question_id}
                  className={`rounded-xl border-2 p-6 ${
                    isCorrect
                      ? "border-green-300 bg-green-50"
                      : "border-red-300 bg-red-50"
                  }`}
                >

                  {/* Question */}
                  <div className="flex items-start gap-4">

                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                        isCorrect
                          ? "bg-green-500"
                          : "bg-red-500"
                      }`}
                    >
                      {isCorrect ? (
                        <CheckCircle
                          size={22}
                          className="text-white"
                        />
                      ) : (
                        <AlertCircle
                          size={22}
                          className="text-white"
                        />
                      )}
                    </div>

                    <div className="flex-1">

                      <p className="font-semibold text-[#1E1B4B] mb-4">
                        {index + 1}. {item.question}
                      </p>

                      {/* Your Answer */}
                      <div className="mb-3">

                        <p className="text-sm font-semibold text-[#4F4679] mb-1">
                          Your Answer
                        </p>

                        <div
                          className={`p-3 rounded-lg border ${
                            isCorrect
                              ? "bg-green-100 border-green-300 text-green-800"
                              : "bg-red-100 border-red-300 text-red-800"
                          }`}
                        >
                          {item.selected_answer || "Not answered"}
                        </div>

                      </div>

                      {/* Correct Answer */}
                      <div>

                        <p className="text-sm font-semibold text-[#4F4679] mb-1">
                          Correct Answer
                        </p>

                        <div className="p-3 rounded-lg bg-green-100 border border-green-300 text-green-800">
                          {item.correct_answer || "Not configured"}
                        </div>

                      </div>

                      {/* Status */}
                      <div className="mt-4">

                        {isCorrect ? (
                          <span className="font-semibold text-green-600">
                            ✓ Correct
                          </span>
                        ) : (
                          <span className="font-semibold text-red-600">
                            ✗ Wrong
                          </span>
                        )}

                      </div>

                    </div>
                  </div>

                </div>
              );
            })}

          </div>
        </div>

        {/* Back */}
        <div className="flex justify-center">

          <button
            onClick={handleBack}
            className="px-6 py-3 bg-[#693C83] text-white rounded-lg hover:bg-[#5a2e6e] flex items-center gap-2"
          >
            <ArrowLeft size={20} />
            Back to Dashboard
          </button>

        </div>

      </div>
    </MainLayout>
  );
}

  return (
    <MainLayout>
      <div className="p-8 max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={handleBack}
            className="text-[#693C83] hover:text-[#5a2e6e] mb-4 flex items-center gap-2"
          >
            <ArrowLeft size={20} />
            Back
          </button>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#693C83] to-[#10B981] flex items-center justify-center">
              <BookOpen size={32} className="text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-[#1E1B4B]">
                Retention Quiz
              </h1>
              <p className="text-[#4F4679]">
                {quiz?.questions?.length || 0} Questions
              </p>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center gap-3">
            <AlertCircle size={20} className="text-red-500" />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Questions */}
        <div className="space-y-6 mb-8">
          {quiz?.questions?.map((question, index) => (
            <div
              key={question.id}
              className="bg-white rounded-xl p-6 shadow-sm border border-[#D9CFE8]"
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="w-10 h-10 rounded-full bg-[#693C83] flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-semibold">{index + 1}</span>
                </div>
                <div className="flex-1">
                  <p className="text-[#1E1B4B] font-medium mb-4">
                    {question.question}
                    {question.required && (
                      <span className="text-red-500 ml-1">*</span>
                    )}
                  </p>

                  {/* Answer */}
{["Short Answer", "Paragraph"].includes(question.response_format) ? (
  <textarea
    value={answers[question.id] || ""}
    onChange={(e) =>
      handleAnswerChange(question.id, e.target.value)
    }
    placeholder="Write your answer here..."
    rows={5}
    className="w-full p-4 rounded-lg border-2 border-[#D9CFE8] focus:border-[#693C83] focus:outline-none resize-none text-[#4F4679]"
  />
) : (
  <div className="space-y-3">
    {["option_a", "option_b", "option_c", "option_d"].map(
      (optionKey) => {
        if (!question[optionKey]) return null;

        return (
          <label
            key={optionKey}
            className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
              answers[question.id] === question[optionKey]
                ? "border-[#693C83] bg-[#F1ECF7]"
                : "border-[#D9CFE8] hover:border-[#693C83]"
            }`}
          >
            <input
              type="radio"
              name={`question-${question.id}`}
              value={question[optionKey]}
              checked={answers[question.id] === question[optionKey]}
              onChange={() =>
                handleAnswerChange(
                  question.id,
                  question[optionKey]
                )
              }
              className="w-5 h-5 text-[#693C83]"
            />

            <span className="text-[#4F4679]">
              {question[optionKey]}
            </span>
          </label>
        );
      }
    )}
  </div>
)}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Submit Button */}
        <div className="flex justify-center">
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="px-8 py-4 bg-gradient-to-r from-[#693C83] to-[#10B981] text-white rounded-xl font-semibold hover:scale-[1.02] transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Submitting...
              </>
            ) : (
              <>
                Submit Quiz
                <ChevronRight size={20} />
              </>
            )}
          </button>
        </div>
      </div>
    </MainLayout>
  );
};

export default RetentionQuizPage;