import React, { useEffect, useState } from "react";
import {
    useParams,
    useSearchParams,
    useNavigate,
} from "react-router-dom";

const ApplicationCheckResult = () => {
    const { checkId } = useParams();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const userId = searchParams.get("user_id");

    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchApplicationCheckResult = async () => {
            try {
                setLoading(true);

                const token =
                    localStorage.getItem("token") ||
                    localStorage.getItem("access_token");

                const response = await fetch(
                    `http://127.0.0.1:8000/learner/application-check/${checkId}/result?user_id=${userId}`,
                    {
                        headers: token
                            ? {
                                  Authorization: `Bearer ${token}`,
                              }
                            : {},
                    }
                );

                if (!response.ok) {
                    throw new Error(
                        "Failed to load Application Check result"
                    );
                }

                const data = await response.json();

                console.log(
                    "Application Check Result:",
                    data
                );

                setResult(data);
            } catch (error) {
                console.error(
                    "Error loading Application Check result:",
                    error
                );

                setError(error.message);
            } finally {
                setLoading(false);
            }
        };

        if (checkId && userId) {
            fetchApplicationCheckResult();
        }
    }, [checkId, userId]);

    /* ================= LOADING ================= */

    if (loading) {
        return (
            <div className="min-h-screen bg-[#f7f5fb] flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-[#693C83] border-t-transparent rounded-full animate-spin mx-auto mb-4" />

                    <p className="text-gray-600 font-medium">
                        Loading Application Check result...
                    </p>
                </div>
            </div>
        );
    }

    /* ================= ERROR ================= */

    if (error) {
        return (
            <div className="min-h-screen bg-[#f7f5fb] flex items-center justify-center p-6">
                <div className="bg-white rounded-2xl shadow-lg border border-red-100 max-w-md w-full p-8 text-center">

                    <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center text-3xl mx-auto mb-5">
                        ✕
                    </div>

                    <h2 className="text-xl font-bold text-gray-800">
                        Unable to Load Result
                    </h2>

                    <p className="text-gray-500 mt-3">
                        {error}
                    </p>

                    <button
                        onClick={() => navigate(-1)}
                        className="mt-6 bg-[#693C83] hover:bg-[#57306e] text-white px-6 py-3 rounded-xl font-semibold transition"
                    >
                        ← Go Back
                    </button>

                </div>
            </div>
        );
    }

    if (!result) {
        return null;
    }

    const isPassed = result.passed;

    return (
        <div className="h-screen overflow-y-auto bg-[#f7f5fb] py-8 px-4 sm:px-6 lg:px-8">

            <div className="max-w-5xl mx-auto">

                {/* ================= BACK BUTTON ================= */}

                <button
                    onClick={() => navigate(-1)}
                    className="inline-flex items-center gap-2 text-gray-600 hover:text-[#693C83] font-semibold transition mb-7"
                >
                    <span className="text-xl">←</span>
                    Back
                </button>


                {/* ================= PAGE HEADER ================= */}

                <div className="mb-7">
                    <p className="text-sm font-semibold text-[#693C83] uppercase tracking-wider">
                        Learning Milestone
                    </p>

                    <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mt-2">
                        Application Check Result
                    </h1>

                    <p className="text-gray-500 mt-2">
                        Review your Application Check performance and submitted answers.
                    </p>
                </div>


                {/* ================= RESULT HERO ================= */}

                <div
                    className={`rounded-3xl p-7 sm:p-9 shadow-sm border ${
                        isPassed
                            ? "bg-gradient-to-r from-[#ecf9f1] to-[#f8fffb] border-green-200"
                            : "bg-gradient-to-r from-[#fff1f1] to-[#fffafa] border-red-200"
                    }`}
                >

                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">

                        {/* STATUS */}

                        <div className="flex items-center gap-5">

                            <div
                                className={`w-20 h-20 rounded-2xl flex items-center justify-center text-4xl shadow-sm ${
                                    isPassed
                                        ? "bg-green-500 text-white"
                                        : "bg-red-500 text-white"
                                }`}
                            >
                                {isPassed ? "✓" : "✕"}
                            </div>

                            <div>
                                <p
                                    className={`text-sm font-bold uppercase tracking-wider ${
                                        isPassed
                                            ? "text-green-600"
                                            : "text-red-600"
                                    }`}
                                >
                                    {isPassed ? "Completed" : "Not Passed"}
                                </p>

                                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1">
                                    {isPassed
                                        ? "Application Check Passed!"
                                        : "Application Check Failed"}
                                </h2>

                                <p className="text-gray-600 mt-2">
                                    Application Check #{result.check_number}
                                </p>
                            </div>

                        </div>


                        {/* PERCENTAGE */}

                        <div className="text-left md:text-right">

                            <p className="text-sm text-gray-500 font-medium">
                                Your Score
                            </p>

                            <div
                                className={`text-5xl font-bold mt-1 ${
                                    isPassed
                                        ? "text-green-600"
                                        : "text-red-500"
                                }`}
                            >
                                {result.percentage}%
                            </div>

                        </div>

                    </div>


                    {/* ================= SCORE CARDS ================= */}

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">

                        <div className="bg-white/80 backdrop-blur rounded-2xl p-5 border border-white">
                            <p className="text-xs text-gray-500 font-semibold uppercase">
                                Score
                            </p>

                            <p className="text-2xl font-bold text-gray-900 mt-2">
                                {result.score}
                                <span className="text-gray-400 text-base">
                                    {" "} / {result.total_marks}
                                </span>
                            </p>
                        </div>


                        <div className="bg-white/80 backdrop-blur rounded-2xl p-5 border border-white">
                            <p className="text-xs text-gray-500 font-semibold uppercase">
                                Percentage
                            </p>

                            <p className="text-2xl font-bold text-gray-900 mt-2">
                                {result.percentage}%
                            </p>
                        </div>


                        <div className="bg-white/80 backdrop-blur rounded-2xl p-5 border border-white">
                            <p className="text-xs text-gray-500 font-semibold uppercase">
                                Attempt
                            </p>

                            <p className="text-2xl font-bold text-gray-900 mt-2">
                                #{result.attempt_number}
                            </p>
                        </div>


                        <div className="bg-white/80 backdrop-blur rounded-2xl p-5 border border-white">
                            <p className="text-xs text-gray-500 font-semibold uppercase">
                                Status
                            </p>

                            <p
                                className={`text-lg font-bold mt-2 capitalize ${
                                    isPassed
                                        ? "text-green-600"
                                        : "text-red-500"
                                }`}
                            >
                                {result.status}
                            </p>
                        </div>

                    </div>

                </div>


                {/* ================= ANSWERS SECTION ================= */}

                <div className="mt-10">

                    <div className="flex items-center justify-between mb-5">

                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">
                                Your Answers
                            </h2>

                            <p className="text-gray-500 text-sm mt-1">
                                Review the answers you submitted.
                            </p>
                        </div>

                        <div className="bg-[#f0e9f5] text-[#693C83] px-4 py-2 rounded-xl text-sm font-semibold">
                            {result.question_results?.length || 0} Questions
                        </div>

                    </div>


                    {result.question_results &&
                    result.question_results.length > 0 ? (

                        <div className="space-y-5">

                            {result.question_results.map(
                                (questionResult, index) => (

                                    <div
                                        key={
                                            questionResult.question_id ||
                                            index
                                        }
                                        className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
                                    >

                                        {/* QUESTION HEADER */}

                                        <div className="px-6 py-4 bg-[#faf8fc] border-b border-gray-100 flex items-center gap-3">

                                            <div className="w-9 h-9 rounded-xl bg-[#693C83] text-white flex items-center justify-center font-bold text-sm">
                                                {index + 1}
                                            </div>

                                            <div>
                                                <p className="font-bold text-gray-900">
                                                    Question {index + 1}
                                                </p>

                                                <p className="text-xs text-gray-500">
                                                    Application Check
                                                </p>
                                            </div>

                                        </div>


                                        {/* QUESTION CONTENT */}

                                        <div className="p-6">

                                            <div className="mb-6">

                                                <p className="text-xs font-bold uppercase tracking-wider text-[#693C83] mb-2">
                                                    Question
                                                </p>

                                                <p className="text-gray-800 text-base leading-relaxed">
                                                    {questionResult.question}
                                                </p>

                                            </div>


                                            <div className="bg-[#f8f6fb] border border-[#ebe5f0] rounded-xl p-5">

                                                <p className="text-xs font-bold uppercase tracking-wider text-[#693C83] mb-3">
                                                    Your Answer
                                                </p>

                                                <p className="text-gray-800 leading-relaxed">
                                                    {questionResult.submitted_answer ||
                                                        "No answer submitted"}
                                                </p>

                                            </div>

                                        </div>

                                    </div>

                                )
                            )}

                        </div>

                    ) : (

                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">

                            <div className="text-4xl mb-4">
                                📝
                            </div>

                            <h3 className="text-lg font-bold text-gray-800">
                                No Question Results Available
                            </h3>

                            <p className="text-gray-500 mt-2">
                                There are no submitted answers available for this Application Check.
                            </p>

                        </div>

                    )}

                </div>


                {/* ================= FOOTER BUTTON ================= */}

                <div className="mt-10 flex justify-center">

                    <button
                        onClick={() => navigate(-1)}
                        className="bg-[#693C83] hover:bg-[#57306e] text-white px-7 py-3 rounded-xl font-semibold shadow-md hover:shadow-lg transition-all"
                    >
                        ← Back to Application Checks
                    </button>

                </div>

            </div>

        </div>
    );
};

export default ApplicationCheckResult;