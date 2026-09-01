import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../utils/axios";
import MainLayout from "../../layout/mainLayout";
import {
  BookOpen,
  ClipboardCheck,
  ChevronRight,
  CheckCircle,
  Clock,
  XCircle,
  ArrowLeft,
  Filter,
} from "lucide-react";

const AllAssignmentsPage = () => {
  const navigate = useNavigate();
  const userId = Number(localStorage.getItem("user_id"));
  
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAssignments();
  }, [userId]);

  const fetchAssignments = async () => {
    try {
      const response = await api.get(`/learner/available-quizzes/${userId}`);
      // Map API response to component format
      const mappedAssignments = response.data.map(quiz => ({
        ...quiz,
        questions_count: quiz.type === "retention_quiz" ? 5 : 3,
        days_since_start: quiz.days_since_completion || 0,
        is_unlocked: quiz.is_available,
        completed: false,
        score: null,
        percentage: null,
        attempted_at: null
      }));
      setAssignments(mappedAssignments);
    } catch (error) {
      console.error("Failed to fetch assignments:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignmentClick = (assignment) => {
    if (assignment.type === "retention_quiz") {
      if (assignment.completed) {
        // Could navigate to a results page in the future
        return;
      }
      navigate(`/retention-quiz/${assignment.id}`);
    } else if (assignment.type === "application_check") {
      if (assignment.completed) {
        // Could navigate to a results page in the future
        return;
      }
      navigate(`/application-check/${assignment.id}`);
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
            <p className="mt-4 text-[#1E1B4B]">Loading assignments...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="p-8 max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={handleBack}
            className="text-[#693C83] hover:text-[#5a2e6e] mb-4 flex items-center gap-2"
          >
            <ArrowLeft size={20} />
            Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold text-[#1E1B4B] mb-2">
            All Assignments
          </h1>
          <p className="text-[#4F4679]">
            View your retention quizzes and application checks
          </p>
        </div>

        {/* Assignments Table */}
        <div className="bg-white rounded-xl shadow-sm border border-[#D9CFE8] overflow-hidden">
          {assignments.length === 0 ? (
            <div className="p-12 text-center">
              <ClipboardCheck size={48} className="text-gray-300 mx-auto mb-4" />
              <p className="text-[#4F4679]">No assignments found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#F1ECF7]">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-[#1E1B4B]">
                      Assignment
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-[#1E1B4B]">
                      Questions
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-[#1E1B4B]">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D9CFE8]">
                  {assignments.map((assignment) => (
                    <tr
                      key={assignment.id}
                      className="hover:bg-[#F1ECF7]/50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#693C83] to-[#10B981] flex items-center justify-center flex-shrink-0">
                            {assignment.type === "retention_quiz" ? (
                              <BookOpen size={18} className="text-white" />
                            ) : (
                              <ClipboardCheck size={18} className="text-white" />
                            )}
                          </div>
                          <div>
                            <p className="text-[#1E1B4B] font-medium">
                              {assignment.program_name} {assignment.type === "retention_quiz" ? "Retention Quiz" : `Application Check ${assignment.check_number}`}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-[#4F4679]">
                        {assignment.questions_count}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleAssignmentClick(assignment)}
                          className="text-[#693C83] hover:text-[#5a2e6e] font-medium flex items-center gap-1"
                        >
                          Start
                          <ChevronRight size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default AllAssignmentsPage;