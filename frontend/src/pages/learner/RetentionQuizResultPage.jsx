import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../utils/axios";

const RetentionQuizResultPage = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchResult = async () => {
      try {
        setLoading(true);
        setError("");

        const userId =
          localStorage.getItem("user_id") ||
          localStorage.getItem("userId");

        if (!userId) {
          setError("User information not found.");
          return;
        }

        const response = await api.get(
  `/learner/retention-quiz/${quizId}/result?user_id=${userId}`
);

const data = response.data;

setResult(data);
      } catch (err) {
        console.error("Retention Quiz Result Error:", err);
        setError(err.message || "Unable to load result.");
      } finally {
        setLoading(false);
      }
    };

    if (quizId) {
      fetchResult();
    }
  }, [quizId]);

  const getOptionText = (question, option) => {
    if (!option) return "";

    const optionMap = {
      A: question.option_a,
      B: question.option_b,
      C: question.option_c,
      D: question.option_d,
    };

    return optionMap[option] || option;
  };

  const getOptionLabel = (option) => {
    const labels = {
      A: "A",
      B: "B",
      C: "C",
      D: "D",
    };

    return labels[option] || option;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F4F0FA] flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-lg px-8 py-6 text-center">
          <div className="animate-spin h-10 w-10 border-4 border-purple-200 border-t-purple-600 rounded-full mx-auto mb-4"></div>

          <p className="text-[#1E1B4B] font-semibold">
            Loading your result...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#F4F0FA] flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-lg w-full text-center">
          <div className="text-5xl mb-4">⚠️</div>

          <h2 className="text-2xl font-bold text-[#1E1B4B] mb-3">
            Unable to Load Result
          </h2>

          <p className="text-red-500 mb-6">{error}</p>

          <button
            onClick={() => navigate(-1)}
            className="px-6 py-3 rounded-xl bg-[#6B3F8F] text-white font-semibold hover:opacity-90"
          >
            Back
          </button>
        </div>
      </div>
    );
  }

  if (!result) {
    return null;
  }

  const questions = result.question_results || [];

  const correctCount =
    result.correct_count ??
    questions.filter((question) => question.is_correct).length;

  const wrongCount =
    result.wrong_count ??
    questions.length - correctCount;

  const totalQuestions =
    result.total_questions ?? questions.length;

  const percentage =
    result.percentage ??
    (totalQuestions > 0
      ? Math.round((correctCount / totalQuestions) * 100)
      : 0);

  return (
    <div className="h-screen overflow-y-auto bg-[#F4F0FA] py-8 px-4">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="rounded-3xl bg-gradient-to-r from-[#6B3F8F] to-[#20B982] text-white p-8 mb-8 shadow-lg">
          <div className="text-center">
            <div className="text-5xl mb-3">🏆</div>

            <h1 className="text-4xl font-bold">
              Retention Quiz Result
            </h1>

            <p className="mt-2 text-lg text-white/90">
              Here is your detailed quiz result.
            </p>
          </div>
        </div>

        {/* Result Summary */}
        <div className="bg-white rounded-2xl shadow-md p-6 mb-8">
          <h2 className="text-2xl font-bold text-[#1E1B4B] mb-6">
            Your Results
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">

            {/* Correct */}
            <div className="rounded-xl bg-green-50 p-5 text-center border border-green-100">
              <div className="text-4xl font-bold text-green-600">
                {correctCount}
              </div>

              <p className="mt-1 text-green-700 font-medium">
                Correct Answers
              </p>
            </div>

            {/* Wrong */}
            <div className="rounded-xl bg-red-50 p-5 text-center border border-red-100">
              <div className="text-4xl font-bold text-red-600">
                {wrongCount}
              </div>

              <p className="mt-1 text-red-700 font-medium">
                Wrong Answers
              </p>
            </div>

            {/* Total */}
            <div className="rounded-xl bg-purple-50 p-5 text-center border border-purple-100">
              <div className="text-4xl font-bold text-[#6B3F8F]">
                {totalQuestions}
              </div>

              <p className="mt-1 text-[#6B3F8F] font-medium">
                Total Questions
              </p>
            </div>

            {/* Score */}
            <div className="rounded-xl bg-orange-50 p-5 text-center border border-orange-100">
              <div className="text-4xl font-bold text-orange-500">
                {percentage}%
              </div>

              <p className="mt-1 text-orange-600 font-medium">
                Score
              </p>
            </div>

          </div>
        </div>

        {/* Question Review */}
        <div>
          <h2 className="text-3xl font-bold text-[#1E1B4B] mb-5">
            Question Review
          </h2>

          <div className="space-y-6">

            {questions.map((question, index) => {
              const isCorrect = Boolean(question.is_correct);

              const selectedAnswer = question.selected_answer;
              const correctAnswer = question.correct_answer;

              return (
                <div
                  key={question.question_id || index}
                  className={`rounded-2xl border-2 p-6 shadow-sm ${
                    isCorrect
                      ? "bg-green-50 border-green-300"
                      : "bg-red-50 border-red-300"
                  }`}
                >

                  {/* Question heading */}
                  <div className="flex items-start gap-4">

                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shrink-0 ${
                        isCorrect
                          ? "bg-green-500"
                          : "bg-red-500"
                      }`}
                    >
                      {isCorrect ? "✓" : "!"}
                    </div>

                    <div className="flex-1">
                      <p className="text-lg font-semibold text-[#1E1B4B]">
                        {index + 1}. {question.question}
                      </p>

                      <p
                        className={`mt-1 font-semibold ${
                          isCorrect
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {isCorrect ? "Correct" : "Wrong"}
                      </p>
                    </div>

                  </div>

                  {/* Options */}
                  <div className="mt-5 space-y-3">

                    {["A", "B", "C", "D"].map((option) => {
                      const optionText = getOptionText(
                        question,
                        option
                      );

                      if (!optionText) return null;

                      const isSelected =
                        selectedAnswer === option;

                      const isCorrectOption =
                        correctAnswer === option;

                      let optionClass =
                        "bg-white border-gray-200";

                      if (isCorrectOption) {
                        optionClass =
                          "bg-green-100 border-green-400";
                      } else if (isSelected && !isCorrectOption) {
                        optionClass =
                          "bg-red-100 border-red-400";
                      }

                      return (
                        <div
                          key={option}
                          className={`rounded-xl border-2 p-4 ${optionClass}`}
                        >
                          <div className="flex items-center gap-3">

                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                                isCorrectOption
                                  ? "bg-green-500 text-white"
                                  : isSelected
                                  ? "bg-red-500 text-white"
                                  : "bg-gray-100 text-gray-700"
                              }`}
                            >
                              {getOptionLabel(option)}
                            </div>

                            <span className="flex-1 text-gray-800">
                              {optionText}
                            </span>

                            {isCorrectOption && (
                              <span className="text-green-600 font-bold">
                                ✓ Correct Answer
                              </span>
                            )}

                            {isSelected && !isCorrectOption && (
                              <span className="text-red-600 font-bold">
                                ✕ Your Answer
                              </span>
                            )}

                          </div>
                        </div>
                      );
                    })}

                  </div>

                  {/* Answer summary */}
                  <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">

                    <div className="rounded-xl bg-white border p-4">
                      <p className="text-sm font-semibold text-gray-500">
                        Your Answer
                      </p>

                      <p
                        className={`mt-1 font-semibold ${
                          isCorrect
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {selectedAnswer
                          ? `${selectedAnswer}. ${getOptionText(
                              question,
                              selectedAnswer
                            )}`
                          : "Not answered"}
                      </p>
                    </div>

                    <div className="rounded-xl bg-white border p-4">
                      <p className="text-sm font-semibold text-gray-500">
                        Correct Answer
                      </p>

                      <p className="mt-1 font-semibold text-green-600">
                        {correctAnswer
                          ? `${correctAnswer}. ${getOptionText(
                              question,
                              correctAnswer
                            )}`
                          : "Not configured"}
                      </p>
                    </div>

                  </div>

                </div>
              );
            })}

          </div>
        </div>

        {/* Back button */}
        <div className="text-center mt-8">
          <button
            onClick={() => navigate(`/program/${result.program_id}`)}
            className="px-7 py-3 rounded-xl bg-[#6B3F8F] text-white font-semibold hover:opacity-90 transition"
          >
            ← Back to Programs
          </button>
        </div>

      </div>
    </div>
  );
};

export default RetentionQuizResultPage;