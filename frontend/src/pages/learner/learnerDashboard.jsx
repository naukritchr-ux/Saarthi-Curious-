import NotificationBell from "../../components/layout/NotificationBell";
import MainLayout from "../../layout/mainLayout";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../utils/axios";
import StatCard from "../../components/ui/statCard";
import DashboardCard from "../../components/ui/dashboardCard";
import PendingAssignments from "../../components/learner/PendingAssignments";

import {
  GraduationCap,
  PlayCircle,
  ClipboardCheck,
  Award,
  BookOpen,
  Clock,
  Target,
  Flame,
  ChevronRight,
  Trophy,
  TrendingUp,
  Calendar,
  CheckCircle,
  Lock,
  Unlock,
  Star,
  Zap,
  Crown,
  Sparkles,
  Grid,
} from "lucide-react";

// Helper function to get thumbnail URL or fallback logo
const getProgramThumbnail = (program) => {
  if (!program) return "/sclogonav.png";

  // Check for thumbnail in the program object
  // The backend stores it in the 'thumbnail' column
  if (
    program.thumbnail &&
    typeof program.thumbnail === "string" &&
    program.thumbnail.trim() !== ""
  ) {
    // If it's a full URL (Supabase or other), use it directly
    if (
      program.thumbnail.startsWith("http://") ||
      program.thumbnail.startsWith("https://")
    ) {
      return program.thumbnail;
    }
    // If it's a relative path, prepend the base URL
    if (program.thumbnail.startsWith("/")) {
      return program.thumbnail;
    }
    // If it's just a filename, you might need to construct the full URL
    // This depends on your Supabase bucket configuration
    const supabaseUrl =
      "https://uwncapxjclbvokpwtkdo.supabase.co/storage/v1/object/public/learning-assets/program-thumbnails/";
    return `${supabaseUrl}${program.thumbnail}`;
  }

  // Check for thumbnail_url as fallback
  if (
    program.thumbnail_url &&
    typeof program.thumbnail_url === "string" &&
    program.thumbnail_url.trim() !== ""
  ) {
    return program.thumbnail_url;
  }

  // Debug: Log the program object to see what fields are available
  console.log("Program object for thumbnail detection:", {
    id: program.id,
    name: program.name,
    thumbnail: program.thumbnail,
    thumbnail_url: program.thumbnail_url,
    availableFields: Object.keys(program),
    program: program,
  });

  // Fallback to default logo
  return "/sclogonav.png";
};

const LearnerDashboard = () => {
  const navigate = useNavigate();
  const userId = Number(localStorage.getItem("user_id"));
  const roleId = Number(localStorage.getItem("role_id") || "5");
  const [stats, setStats] = useState(null);
  const [programs, setPrograms] = useState([]);
  const [badges, setBadges] = useState([]);
  const [weekData, setWeekData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedProgram, setExpandedProgram] = useState(null);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState("path"); // 'path' or 'grid'

  // Get current time greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  // Fetch learner data
  useEffect(() => {
    const fetchLearnerData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch from API
        const response = await api.get(`/dashboard/learner/${userId}`, {
          params: { role_id: roleId },
        });

        const data = response.data;
        console.log("Full API Response:", data);
        console.log("Programs data:", data.programs);

        // Log each program's thumbnail data for debugging
        if (data.programs) {
          data.programs.forEach((program) => {
            const thumbnail = getProgramThumbnail(program);
            console.log(`Program ${program.id} - ${program.name}:`, {
              thumbnailField: program.thumbnail,
              thumbnailUrlField: program.thumbnail_url,
              resolvedThumbnail: thumbnail,
              hasThumbnail: thumbnail !== "/sclogonav.png",
              allFields: Object.keys(program),
            });
          });
        }

        setStats(data.stats);
        setPrograms(data.programs);
        setBadges(data.badges);
        setWeekData(data.week_data);
      } catch (error) {
        console.error("Failed to fetch learner data:", error);
        setError(
          error.response?.data?.detail || "Failed to load dashboard data",
        );
      } finally {
        setLoading(false);
      }
    };
    fetchLearnerData();
  }, [userId, roleId]);

  const handleStartLearning = (programId) => {
    navigate(`/program/${programId}`);
  };

  const toggleProgramExpand = (programId) => {
    setExpandedProgram(expandedProgram === programId ? null : programId);
  };

  // Get unique badges by category (highest level)
  const getUniqueBadgesByCategory = () => {
    if (!badges || badges.length === 0) return [];
    const categoryMap = {};
    badges.forEach((badge) => {
      if (
        !categoryMap[badge.category] ||
        badge.earned_date > categoryMap[badge.category].earned_date
      ) {
        categoryMap[badge.category] = badge;
      }
    });
    return Object.values(categoryMap).slice(0, 4);
  };

  const uniqueBadges = getUniqueBadgesByCategory();

  // Filter programs
  const mandatoryPrograms = programs.filter(
    (p) => p.type?.toLowerCase() === "mandatory",
  );
  const optionalPrograms = programs.filter(
    (p) => p.type?.toLowerCase() === "optional",
  );
  const allMandatoryCompleted = mandatoryPrograms.every(
    (p) => p.completion_status === "completed",
  );

  // Get current program (first in-progress or first available)
  const currentProgram =
    programs.find((p) => p.completion_status === "in_progress") ||
    programs.find((p) => p.completion_status === "not_started") ||
    programs[0];

  // Image component with fallback
  const ProgramImage = ({ program, className, alt }) => {
    const [imgError, setImgError] = useState(false);
    const thumbnailUrl = getProgramThumbnail(program);

    console.log(`Rendering image for ${program?.name}:`, {
      thumbnailUrl,
      hasError: imgError,
      showFallback:
        imgError || !thumbnailUrl || thumbnailUrl === "/sclogonav.png",
    });

    // If there's an error or no thumbnail, show logo
    if (imgError || !thumbnailUrl || thumbnailUrl === "/sclogonav.png") {
      return (
        <img
          src="/sclogonav.png"
          alt={alt || program?.name || "Program"}
          className={`${className} object-contain bg-white p-1`}
        />
      );
    }

    return (
      <img
        src={thumbnailUrl}
        alt={alt || program?.name || "Program thumbnail"}
        className={`${className} object-cover`}
        onError={() => {
          console.log("Image failed to load:", {
            programName: program?.name,
            thumbnailUrl: thumbnailUrl,
          });
          setImgError(true);
        }}
        onLoad={() => {
          console.log("Image loaded successfully:", {
            programName: program?.name,
            thumbnailUrl: thumbnailUrl,
          });
        }}
      />
    );
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#693C83] mx-auto"></div>
            <p className="mt-4 text-[#1E1B4B]">
              Loading your learning dashboard...
            </p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="text-red-500 text-xl mb-4">⚠️</div>
            <p className="text-red-500">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-[#693C83] text-white rounded-lg hover:bg-[#5a2e6e]"
            >
              Retry
            </button>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      {/* Section 1: Welcome Hero */}
      <div className="bg-gradient-to-r from-[#693C83] to-[#10B981] rounded-[24px] p-8 mb-8 text-white shadow-xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-4xl font-bold">
              {getGreeting()}, {localStorage.getItem("user_name") || "Alex"} 👋
            </h1>
            <p className="mt-2 text-white/90 text-lg">
              Your learning journey continues. Every step brings you closer to
              mastery!
            </p>
          </div>
          <div className="flex gap-4">
            <div className="bg-white/20 backdrop-blur-sm rounded-[24px] px-6 py-4 text-center">
              <div className="flex items-center gap-2 justify-center">
                <Flame size={28} className="text-yellow-300" />
                <span className="text-3xl font-bold">
                  {stats?.current_streak || 0}
                </span>
              </div>
              <p className="text-sm text-white/80">Day Streak</p>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-[24px] px-6 py-4 text-center">
              <div className="flex items-center gap-2 justify-center">
                <Zap size={28} className="text-yellow-300" />
                <span className="text-3xl font-bold">
                  {stats?.total_curos || 0}
                </span>
              </div>
              <p className="text-sm text-white/80">Curos Balance</p>
            </div>
          </div>
        </div>
      </div>

      {/* Section 2: Learning Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Badges Earned"
          value={stats?.badges_earned || 0}
          icon={<Award size={26} className="text-white" />}
          iconBg="bg-[#693C83]"
        />
        <StatCard
          title="Programs Completed"
          value={stats?.completed_programs || 0}
          icon={<GraduationCap size={26} className="text-white" />}
          iconBg="bg-[#693C83]"
        />
        <StatCard
          title="Leaderboard Rank"
          value={`#${stats?.leaderboard_rank || 0}`}
          icon={<Trophy size={26} className="text-white" />}
          iconBg="bg-[#693C83]"
        />
        <StatCard
          title="Highest Streak"
          value={stats?.highest_streak || 0}
          icon={<Flame size={26} className="text-white" />}
          iconBg="bg-[#693C83]"
        />
      </div>

      {/* Section 3: Continue Learning */}
      <div className="mb-8">
        <DashboardCard title="Continue Learning">
          {!currentProgram ? (
            <div className="bg-gradient-to-r from-[#E0F2FE] via-[#DBEAFE] to-[#EDE9FE] rounded-2xl p-6 text-center">
              <p className="text-[#4F4679]">
                No programs available yet. Check back later!
              </p>
            </div>
          ) : (
            <div className="bg-gradient-to-r from-[#E0F2FE] via-[#DBEAFE] to-[#EDE9FE] rounded-[24px] p-6">
              <div className="flex flex-col lg:flex-row gap-6">
                {/* Left Side - Program Info */}
                <div className="flex-1 lg:w-3/5">
                  <div className="flex items-start gap-4">
                    <div className="w-20 h-20 rounded-[16px] flex-shrink-0 overflow-hidden bg-white shadow-md border border-gray-200">
                      <ProgramImage
                        program={currentProgram}
                        className="w-full h-full"
                        alt={currentProgram.name}
                      />
                    </div>
                    <div>
                      <p className="text-sm text-[#693C83] font-semibold">
                        {currentProgram.completion_status === "completed"
                          ? "COMPLETED"
                          : "CURRENT PROGRAM"}
                      </p>
                      <h2 className="text-2xl font-bold text-[#1E1B4B] mt-1">
                        {currentProgram.name}
                      </h2>
                      <p className="text-[#4F4679] text-sm mt-1">
                        {currentProgram.modules?.length || 0} Modules •{" "}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="flex justify-between text-sm text-[#4F4679] mb-1">
                      <span>Overall Progress</span>
                      <span className="font-semibold">
                        {currentProgram.progress || 0}%
                      </span>
                    </div>
                    <div className="w-full bg-white rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-[#693C83] to-[#10B981] h-2 rounded-full transition-all duration-500"
                        style={{ width: `${currentProgram.progress || 0}%` }}
                      />
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <Zap size={16} className="text-[#F59E0B]" />
                      <span className="text-sm text-[#4F4679]">
                        <span className="font-semibold text-[#1E1B4B]">
                          {currentProgram.total_curos || 0}
                        </span>{" "}
                        Total Curos
                        <span className="text-xs text-gray-500 ml-1">
                          ({currentProgram.total_module_curos || 0} from modules
                          + {currentProgram.curos || 0} bonus)
                        </span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Side - Progress Details */}
                <div className="flex-1 lg:w-2/5 bg-white/50 rounded-[16px] p-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-[#4F4679]">
                        Last Completed
                      </span>
                      <span className="text-sm font-medium text-[#1E1B4B]">
                        {currentProgram.modules
                          ?.filter((m) => m.completed)
                          .pop()?.name || "Module 1"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-[#4F4679]">
                        Current Module
                      </span>
                      <span className="text-sm font-medium text-[#1E1B4B]">
                        {currentProgram.modules?.find((m) => !m.completed)
                          ?.name || "Completed!"}
                      </span>
                    </div>
                    <button
                      onClick={() => handleStartLearning(currentProgram.id)}
                      className="w-full bg-gradient-to-r from-[#693C83] to-[#10B981] text-white py-3 rounded-[16px] font-semibold hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
                    >
                      {currentProgram.completion_status === "completed"
                        ? "Review Course"
                        : "Continue Learning"}
                      <ChevronRight size={20} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DashboardCard>
      </div>

      {/* Section 4: Recent Badges & Pending Assignments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Recent Badges */}
        <div>
          <DashboardCard title="Recent Badges">
            <div className="grid grid-cols-2 gap-4">
              {uniqueBadges.length > 0 ? (
                uniqueBadges.map((badge) => (
                  <div
                    key={badge.id}
                    className="bg-gradient-to-br from-yellow-50 to-yellow-100 border border-yellow-200 rounded-[24px] p-4 text-center hover:scale-[1.05] transition-all"
                  >
                    <div className="text-4xl mb-2">{badge.icon}</div>
                    <h4 className="text-sm font-semibold text-[#1E1B4B]">
                      {badge.name}
                    </h4>
                    <p className="text-xs text-[#4F4679] mt-1">
                      {badge.category}
                    </p>
                  </div>
                ))
              ) : (
                <div className="col-span-2 text-center text-[#4F4679] py-4">
                  No badges earned yet. Start learning to earn your first badge!
                  🎯
                </div>
              )}
            </div>
          </DashboardCard>
        </div>

        {/* Pending Assignments */}
        <div>
          <DashboardCard>
            <PendingAssignments userId={userId} compact={false} />
          </DashboardCard>
        </div>
      </div>

      {/* Section 5: Weekly Streak */}
      <div className="mb-8">
        <DashboardCard title="Weekly Streak">
          <div className="flex justify-between items-center gap-2">
            {weekData.map((day, index) => {
              const isToday =
                new Date().toLocaleDateString("en-US", { weekday: "short" }) ===
                day.day;
              return (
                <div key={index} className="flex-1 text-center">
                  <div
                    className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center transition-all ${
                      day.completed
                        ? "bg-gradient-to-r from-[#10B981] to-[#06D6A0] text-white shadow-lg"
                        : isToday
                          ? "bg-[#693C83] text-white ring-2 ring-[#693C83] ring-offset-2"
                          : "bg-gray-100 text-gray-400"
                    }`}
                  >
                    {day.completed ? (
                      <CheckCircle size={24} />
                    ) : isToday ? (
                      <Sparkles size={20} />
                    ) : (
                      <Calendar size={20} />
                    )}
                  </div>
                  <p className="text-xs mt-1 text-[#4F4679]">{day.day}</p>
                  {isToday && (
                    <p className="text-[10px] text-[#693C83] font-semibold mt-1">
                      Today
                    </p>
                  )}
                </div>
              );
            })}
          </div>
          <div className="mt-4 text-center">
            <p className="text-sm text-[#4F4679]">
              {stats?.current_streak > 0 ? (
                <>
                  🔥 You're on a {stats.current_streak}-day streak! Keep it up!
                </>
              ) : (
                <>Start your learning streak today! 🚀</>
              )}
            </p>
          </div>
        </DashboardCard>
      </div>

      {/* Section 6: Leaderboard Snapshot */}
      <div className="mb-8">
        <DashboardCard title="Your Standing">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-r from-[#693C83]/10 to-[#693C83]/20 rounded-[24px] p-4 text-center hover:scale-[1.02] transition-all">
              <p className="text-sm text-[#4F4679]">Current Rank</p>
              <p className="text-3xl font-bold text-[#693C83]">
                #{stats?.leaderboard_rank || 0}
              </p>
              <p className="text-xs text-[#4F4679] mt-1">
                {stats?.leaderboard_rank <= 3 ? "🏆 Top 3!" : "Keep climbing!"}
              </p>
            </div>
            <div className="bg-gradient-to-r from-[#10B981]/10 to-[#10B981]/20 rounded-[24px] p-4 text-center hover:scale-[1.02] transition-all">
              <p className="text-sm text-[#4F4679]">Total Participants</p>
              <p className="text-3xl font-bold text-[#10B981]">
                {stats?.total_participants || 0}
              </p>
              <p className="text-xs text-[#4F4679] mt-1">Learning community</p>
            </div>
            <div className="bg-gradient-to-r from-[#F59E0B]/10 to-[#F59E0B]/20 rounded-[24px] p-4 text-center hover:scale-[1.02] transition-all">
              <p className="text-sm text-[#4F4679]">Next Rank Progress</p>
              <div className="flex items-center justify-center gap-2">
                <span className="text-2xl font-bold text-[#F59E0B]">
                  {stats?.next_rank_progress || 0}%
                </span>
                <TrendingUp size={20} className="text-[#F59E0B]" />
              </div>
              <div className="w-full bg-white rounded-full h-1.5 mt-2">
                <div
                  className="bg-gradient-to-r from-[#F59E0B] to-[#EA580C] h-1.5 rounded-full"
                  style={{ width: `${stats?.next_rank_progress || 0}%` }}
                />
              </div>
            </div>
          </div>
        </DashboardCard>
      </div>

      {/* Section 7: Learning Path */}
      <div className="mb-8">
        <DashboardCard
          title={
            allMandatoryCompleted ? "Available Programs" : "Your Learning Path"
          }
        >
          {/* View Toggle Button */}
          {!allMandatoryCompleted && (
            <div className="flex justify-end mb-4">
              <button
                onClick={() =>
                  setViewMode(viewMode === "path" ? "grid" : "path")
                }
                className="flex items-center gap-2 px-4 py-2 bg-[#693C83]/10 text-[#693C83] rounded-[16px] hover:bg-[#693C83]/20 transition-all text-sm font-medium"
              >
                {viewMode === "path" ? (
                  <>
                    <Grid size={18} />
                    View as Grid
                  </>
                ) : (
                  <>
                    <Target size={18} />
                    View as Path
                  </>
                )}
              </button>
            </div>
          )}

          {allMandatoryCompleted ? (
            // Optional Programs Grid
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {optionalPrograms.length > 0 ? (
                optionalPrograms.map((program) => (
                  <div
                    key={program.id}
                    className="bg-gradient-to-br from-blue-50 to-purple-50 border border-gray-200 rounded-[24px] p-6 hover:scale-[1.02] transition-all shadow-sm hover:shadow-md"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-16 h-16 rounded-[12px] flex-shrink-0 overflow-hidden bg-white shadow-sm border border-gray-200">
                        <ProgramImage
                          program={program}
                          className="w-full h-full"
                          alt={program.name}
                        />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-[#1E1B4B]">
                          {program.name}
                        </h3>
                      </div>
                    </div>
                    <p className="text-sm text-[#4F4679] mt-2 line-clamp-2 ml-[76px]">
                      {program.description}
                    </p>
                    <div className="flex items-center gap-2 mt-3 ml-[76px] flex-wrap">
                      <span className="text-xs text-[#4F4679]">
                        {program.modules?.length || 0} modules
                      </span>
                      <span className="text-xs text-[#4F4679]">•</span>
                      <span className="text-xs text-[#4F4679]">
                        {program.duration || "Self-paced"}
                      </span>
                      <span className="text-xs text-[#4F4679]">•</span>
                      <span className="text-xs bg-[#F59E0B]/10 text-[#F59E0B] px-2 py-0.5 rounded-full">
                        {program.total_curos || 0} Curos
                      </span>
                    </div>
                    <button
                      onClick={() => handleStartLearning(program.id)}
                      className="mt-4 bg-[#693C83] text-white px-4 py-2 rounded-[16px] hover:bg-[#5a2e6e] transition-all text-sm w-full"
                    >
                      Start Learning
                    </button>
                  </div>
                ))
              ) : (
                <div className="col-span-3 text-center text-[#4F4679] py-8">
                  🎉 You've completed all available programs! More coming soon.
                </div>
              )}
            </div>
          ) : viewMode === "grid" ? (
            // Grid View - All Programs
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {programs.length > 0 ? (
                programs.map((program) => (
                  <div
                    key={program.id}
                    className={`bg-gradient-to-br ${
                      program.type?.toLowerCase() === "mandatory"
                        ? "from-[#693C83]/10 to-[#10B981]/10 border-[#693C83]/30"
                        : "from-blue-50 to-purple-50 border-gray-200"
                    } border rounded-[24px] p-6 hover:scale-[1.02] transition-all shadow-sm hover:shadow-md`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-16 h-16 rounded-[12px] flex-shrink-0 overflow-hidden bg-white shadow-sm border border-gray-200">
                        <ProgramImage
                          program={program}
                          className="w-full h-full"
                          alt={program.name}
                        />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-[#1E1B4B]">
                          {program.name}
                        </h3>
                        {program.type?.toLowerCase() === "mandatory" && (
                          <span className="text-xs bg-[#693C83] text-white px-2 py-0.5 rounded-full">
                            Mandatory
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-[#4F4679] mt-2 line-clamp-2 ml-[76px]">
                      {program.description}
                    </p>
                    <div className="mt-3 flex items-center gap-2 flex-wrap ml-[76px]">
                      <span
                        className={`text-xs px-3 py-1 rounded-full ${
                          program.completion_status === "completed"
                            ? "bg-[#10B981]/20 text-[#10B981]"
                            : program.completion_status === "in_progress"
                              ? "bg-[#3B82F6]/20 text-[#3B82F6]"
                              : "bg-gray-200 text-gray-500"
                        }`}
                      >
                        {program.completion_status === "completed"
                          ? "✅ Completed"
                          : program.completion_status === "in_progress"
                            ? "🔄 In Progress"
                            : "🔒 Not Started"}
                      </span>
                      <span className="text-xs text-[#4F4679]">
                        {program.modules?.length || 0} modules
                      </span>
                      {program.progress > 0 && program.progress < 100 && (
                        <span className="text-xs text-[#4F4679]">
                          • {program.progress}% complete
                        </span>
                      )}
                      <span className="text-xs bg-[#F59E0B]/10 text-[#F59E0B] px-2 py-0.5 rounded-full">
                        {program.total_curos || 0} Curos
                      </span>
                    </div>
                    <button
                      onClick={() => handleStartLearning(program.id)}
                      className={`mt-4 ${
                        program.completion_status === "not_started"
                          ? "bg-gray-400 cursor-not-allowed"
                          : "bg-[#693C83] hover:bg-[#5a2e6e]"
                      } text-white px-4 py-2 rounded-[16px] transition-all text-sm w-full`}
                      disabled={program.completion_status === "not_started"}
                    >
                      {program.completion_status === "completed"
                        ? "Review Course"
                        : program.completion_status === "in_progress"
                          ? "Continue Learning"
                          : "Not Started"}
                    </button>
                  </div>
                ))
              ) : (
                <div className="col-span-3 text-center text-[#4F4679] py-8">
                  No programs available yet.
                </div>
              )}
            </div>
          ) : (
            // Zig-zag Learning Path
            <div className="relative">
              <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-1 bg-gradient-to-b from-[#693C83] via-[#10B981] to-[#693C83] opacity-20" />
              {mandatoryPrograms.map((program, index) => (
                <div
                  key={program.id}
                  className={`relative flex items-center mb-8 ${
                    index % 2 === 0 ? "flex-row" : "flex-row-reverse"
                  }`}
                >
                  <div className="w-5/12">
                    <div
                      className={`bg-white rounded-[24px] p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer ${
                        expandedProgram === program.id
                          ? "ring-2 ring-[#693C83]"
                          : ""
                      }`}
                      onClick={() => toggleProgramExpand(program.id)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-16 h-16 rounded-[12px] flex-shrink-0 overflow-hidden bg-white shadow-sm border border-gray-200">
                          <ProgramImage
                            program={program}
                            className="w-full h-full"
                            alt={program.name}
                          />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h3 className="text-lg font-bold text-[#1E1B4B]">
                              {program.name}
                            </h3>
                            {program.completion_status === "completed" ? (
                              <CheckCircle
                                className="text-[#10B981]"
                                size={24}
                              />
                            ) : program.completion_status === "in_progress" ? (
                              <PlayCircle
                                className="text-[#3B82F6]"
                                size={24}
                              />
                            ) : (
                              <Lock className="text-gray-400" size={24} />
                            )}
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-[#4F4679] mt-2 line-clamp-2 ml-[76px]">
                        {program.description}
                      </p>
                      <div className="mt-3 flex items-center gap-2 flex-wrap ml-[76px]">
                        <span
                          className={`text-xs px-3 py-1 rounded-full ${
                            program.completion_status === "completed"
                              ? "bg-[#10B981]/20 text-[#10B981]"
                              : program.completion_status === "in_progress"
                                ? "bg-[#3B82F6]/20 text-[#3B82F6]"
                                : "bg-gray-200 text-gray-500"
                          }`}
                        >
                          {program.completion_status === "completed"
                            ? "✅ Completed"
                            : program.completion_status === "in_progress"
                              ? "🔄 In Progress"
                              : "🔒 Not Started"}
                        </span>
                        <span className="text-xs text-[#4F4679]">
                          {program.modules?.length || 0} modules
                        </span>
                        {program.progress > 0 && program.progress < 100 && (
                          <span className="text-xs text-[#4F4679]">
                            • {program.progress}% complete
                          </span>
                        )}
                        <span className="text-xs bg-[#F59E0B]/10 text-[#F59E0B] px-2 py-0.5 rounded-full">
                          {program.total_curos || 0} Curos
                        </span>
                      </div>
                    </div>

                    {/* Expanded Modules */}
                    {expandedProgram === program.id && (
                      <div className="mt-2 bg-gray-50 rounded-[16px] p-4 space-y-2">
                        <p className="text-xs font-semibold text-[#4F4679] mb-2">
                          MODULES
                        </p>
                        {program.modules?.map((module, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between bg-white rounded-[12px] p-3 hover:shadow-sm cursor-pointer hover:bg-gray-100 transition-all"
                            onClick={() => handleStartLearning(program.id)}
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-[#1E1B4B]">
                                {idx + 1}. {module.name}
                              </span>
                              <span className="text-xs bg-[#F59E0B]/10 text-[#F59E0B] px-2 py-0.5 rounded-full">
                                {module.curos || 0} Curos
                              </span>
                            </div>
                            {module.completed ? (
                              <CheckCircle
                                size={16}
                                className="text-[#10B981]"
                              />
                            ) : (
                              <Clock size={16} className="text-gray-400" />
                            )}
                          </div>
                        ))}
                        {program.completion_status !== "not_started" && (
                          <button
                            onClick={() => handleStartLearning(program.id)}
                            className="w-full mt-2 bg-[#693C83] text-white px-4 py-2 rounded-[12px] text-sm hover:bg-[#5a2e6e] transition-all"
                          >
                            {program.completion_status === "completed"
                              ? "Review Course"
                              : "Continue"}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="w-2/12 flex justify-center">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center z-10 ${
                        program.completion_status === "completed"
                          ? "bg-[#10B981]"
                          : program.completion_status === "in_progress"
                            ? "bg-[#3B82F6]"
                            : "bg-gray-300"
                      } text-white font-bold text-sm`}
                    >
                      {index + 1}
                    </div>
                  </div>
                  <div className="w-5/12" />
                </div>
              ))}
            </div>
          )}
        </DashboardCard>
      </div>
    </MainLayout>
  );
};

export default LearnerDashboard;
