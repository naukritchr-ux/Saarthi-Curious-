import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../utils/axios";
import MainLayout from "../../layout/mainLayout";
import {
  ClipboardCheck,
  ChevronRight,
  CheckCircle,
  Clock,
  AlertCircle,
  Award,
  ArrowLeft,
  FileText,
} from "lucide-react";

const ApplicationCheckPage = () => {
  const navigate = useNavigate();
  const { checkId } = useParams();
  const userId = Number(localStorage.getItem("user_id"));
  
  const [check, setCheck] = useState(null);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCheck();
  }, [checkId]);

  const fetchCheck = async () => {
    try {
      const response = await api.get(
        `/learner/application-check/${checkId}?user_id=${userId}`
      );
      setCheck(response.data);
      
      const initialAnswers = {};
      if (response.data && response.data.questions) {
        response.data.questions.forEach((q) => {
          initialAnswers[q.id] = "";
        });
      }
      setAnswers(initialAnswers);
    } catch (error) {
      console.error("Failed to fetch application check:", error);
      setError(
        error.response?.data?.detail ||
        "Failed to load application check. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionId, value) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  const handleSubmit = async () => {
    if (!check || !check.questions) return;

    setSubmitting(true);
    setError(null);

    try {
      const formattedAnswers = Object.entries(answers).map(
  ([questionId, answer]) => ({
    question_id: parseInt(questionId),
    answer: answer.trim(),
  })
);

const response = await api.post(
  "/learner/application-check/attempt",
  {
    user_id: userId,
    application_check_id: parseInt(checkId),
    answers: formattedAnswers,
  }
);

      setResult(response.data);
    } catch (error) {
      console.error("Failed to submit application check:", error);
      setError(
        error.response?.data?.detail ||
        "Failed to submit application check. Please try again."
      );
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
            <p className="mt-4 text-[#1E1B4B]">Loading application check...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (error && !check) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-96 max-w-xl mx-auto px-4">
          <div className="text-center">
            <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
            <p className="text-red-600 font-medium mb-4">{error}</p>
            <button
              onClick={handleBack}
              className="px-4 py-2 bg-[#693C83] text-white rounded-lg hover:bg-[#5a2e6e]"
            >
              Go Back
            </button>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (result) {
  const status = result.status?.toLowerCase();

  const isApproved = status === "approved";
  const isRejected = status === "rejected";
  const isSubmitted = status === "submitted";

  return (
    <MainLayout>
      <div className="p-8 max-w-4xl mx-auto">
        <div className="bg-white rounded-[24px] p-8 text-center shadow-sm border border-[#D9CFE8]">

          {isApproved && (
            <>
              <CheckCircle
                size={64}
                className="text-green-500 mx-auto mb-4"
              />

              <h1 className="text-3xl font-bold text-[#1E1B4B] mb-3">
                Application Check Approved!
              </h1>

              <p className="text-[#4F4679] text-lg mb-6">
                Your Application Check has been automatically approved.
              </p>
            </>
          )}

          {isRejected && (
            <>
              <AlertCircle
                size={64}
                className="text-red-500 mx-auto mb-4"
              />

              <h1 className="text-3xl font-bold text-[#1E1B4B] mb-3">
                Application Check Rejected
              </h1>

              <p className="text-[#4F4679] text-lg mb-6">
                Some required answers were missing or empty. Please reattempt
                the Application Check.
              </p>
            </>
          )}

          {isSubmitted && (
            <>
              <Clock
                size={64}
                className="text-yellow-500 mx-auto mb-4"
              />

              <h1 className="text-3xl font-bold text-[#1E1B4B] mb-3">
                Application Check Submitted
              </h1>

              <p className="text-[#4F4679] text-lg mb-6">
                Your Application Check has been submitted and is waiting for
                Admin review.
              </p>
            </>
          )}

          <div className="flex justify-center gap-4">
            <button
              onClick={handleBack}
              className="px-6 py-3 bg-[#693C83] text-white rounded-lg hover:bg-[#5a2e6e] flex items-center gap-2"
            >
              <ArrowLeft size={20} />
              Back to Program
            </button>
          </div>
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
              <ClipboardCheck size={32} className="text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-[#1E1B4B]">
                Application Check {check && check.check_number ? check.check_number : ""}
              </h1>
              <p className="text-[#4F4679]">
                {check && check.questions ? check.questions.length : 0} Questions
              </p>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center gap-3">
            <AlertCircle size={20} className="text-red-500 flex-shrink-0" />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Questions */}
        {check && check.questions && (
          <div className="space-y-6 mb-8">
            {check.questions.map((question, index) => (
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
                    </p>

                    {/* Text Answer */}
                    <div>
                      <label className="block text-sm text-[#4F4679] mb-2">
                        Your Answer
                      </label>
                      <textarea
                        value={answers[question.id] || ""}
                        onChange={(e) =>
                          handleAnswerChange(question.id, e.target.value)
                        }
                        placeholder="Type your answer here..."
                        rows={4}
                        className="w-full px-4 py-3 border border-[#D9CFE8] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#693C83] resize-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Submit Button */}
        {check && check.questions && check.questions.length > 0 && (
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
                  Submit Application Check
                  <ChevronRight size={20} />
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default ApplicationCheckPage;