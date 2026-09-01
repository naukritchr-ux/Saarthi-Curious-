import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../utils/axios";
import {
  ClipboardCheck,
  ChevronRight,
  BookOpen,
  Clock,
  CheckCircle,
  Lock,
  Zap,
} from "lucide-react";

const PendingAssignments = ({ userId, compact = false }) => {
  const navigate = useNavigate();
  const [pendingAssignments, setPendingAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    fetchPendingAssignments();
  }, [userId]);

  const fetchPendingAssignments = async () => {
    try {
      // Use all-quizzes endpoint to get available retention quizzes and application checks
      const response = await api.get(`/learner/available-quizzes/${userId}`);

      // Map API response to component format
      const mappedAssignments = response.data.map(quiz => ({
        ...quiz,
        questions_count: quiz.type === "retention_quiz" ? 5 : 3, // Default question count
        days_since_start: quiz.days_since_completion || 0,
        is_unlocked: quiz.is_available
      }));

      setPendingAssignments(mappedAssignments);
    } catch (error) {
      console.error("Failed to fetch pending assignments:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignmentClick = (assignment) => {
    if (assignment.type === "retention_quiz") {
      navigate(`/retention-quiz/${assignment.id}`);
    } else if (assignment.type === "application_check") {
      navigate(`/application-check/${assignment.id}`);
    }
  };

  const handleViewAll = () => {
    navigate("/all-assignments");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#693C83]"></div>
      </div>
    );
  }

  const displayAssignments = showAll ? pendingAssignments : pendingAssignments.slice(0, 1);

  if (pendingAssignments.length === 0) {
    return (
      <div className="bg-gradient-to-r from-[#E0F2FE] via-[#DBEAFE] to-[#EDE9FE] rounded-2xl p-6 text-center">
        <ClipboardCheck size={32} className="text-[#693C83] mx-auto mb-2" />
        <p className="text-[#4F4679]">No pending assignments</p>
        <p className="text-sm text-[#6B7280] mt-1">You're all caught up!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-[#1E1B4B]">
          Pending Assignments ({pendingAssignments.length} total)
        </h3>
        {pendingAssignments.length > 1 && !compact && (
          <button
            onClick={handleViewAll}
            className="text-[#693C83] hover:text-[#5a2e6e] text-sm font-medium flex items-center gap-1"
          >
            View All
            <ChevronRight size={16} />
          </button>
        )}
      </div>

      <div className="space-y-3">
        {displayAssignments.map((assignment) => (
          <div
            key={assignment.id}
            onClick={() => handleAssignmentClick(assignment)}
            className="bg-white border border-[#D9CFE8] rounded-xl p-4 hover:shadow-md hover:border-[#693C83] transition-all cursor-pointer"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#693C83] to-[#10B981] flex items-center justify-center flex-shrink-0">
                {assignment.type === "retention_quiz" ? (
                  <BookOpen size={20} className="text-white" />
                ) : (
                  <ClipboardCheck size={20} className="text-white" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="text-[#1E1B4B] font-semibold truncate">
                      {assignment.program_name} {assignment.type === "retention_quiz" ? "Retention Quiz" : `Application Check ${assignment.check_number}`}
                    </h4>
                  </div>
                  {assignment.is_unlocked ? (
                    <CheckCircle size={20} className="text-[#10B981] flex-shrink-0" />
                  ) : (
                    <Lock size={20} className="text-gray-400 flex-shrink-0" />
                  )}
                </div>
                <div className="flex items-center gap-4 mt-3 text-sm text-[#6B7280]">
                  <div className="flex items-center gap-1">
                    <ClipboardCheck size={16} />
                    <span>{assignment.questions_count} questions</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock size={16} />
                    <span>Day {assignment.days_since_start}</span>
                  </div>
                  {assignment.type === "retention_quiz" && (
                    <div className="flex items-center gap-1">
                      <Zap size={16} className="text-[#F59E0B]" />
                      <span className="text-[#F59E0B]">+Curos</span>
                    </div>
                  )}
                </div>
              </div>
              <ChevronRight size={20} className="text-[#6B7280] flex-shrink-0" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PendingAssignments;