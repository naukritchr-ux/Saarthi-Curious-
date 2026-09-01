import React, { useState, useEffect, useMemo } from "react";
import MainLayout from "../../layout/mainLayout";
import { curoService } from "../../services/curoService";
import { streakService } from "../../services/streakService";
import { leaderboardService } from "../../services/leaderboardService";
import {
  Users,
  Coins,
  Flame,
  Award,
  Trophy,
  Activity,
  Crown,
} from "lucide-react";

const roleId = Number(localStorage.getItem("role_id"));
const isAdmin = roleId === 1 || roleId === 2;
const currentUserId = Number(localStorage.getItem("user_id"));

const LeaderboardTable = ({
  data,
  title,
  scoreLabel,
  loading,
  error,
  onRetry,
  isStreak = false,
}) => {
  if (loading) {
    return (
      <div className="mt-8 grid gap-5 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="rounded-3xl border border-[#E5DEF4] bg-white p-5 shadow-sm"
          >
            <div className="h-3 w-24 animate-pulse rounded-full bg-[#E5DEF4]" />
            <div className="mt-4 h-7 w-3/4 animate-pulse rounded-full bg-[#E5DEF4]" />
            <div className="mt-3 space-y-2">
              <div className="h-3 w-full animate-pulse rounded-full bg-[#E5DEF4]" />
              <div className="h-3 w-5/6 animate-pulse rounded-full bg-[#E5DEF4]" />
            </div>
            <div className="mt-4 flex gap-3">
              <div className="h-8 w-24 animate-pulse rounded-full bg-[#E5DEF4]" />
              <div className="h-8 w-20 animate-pulse rounded-full bg-[#E5DEF4]" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-8 flex justify-center py-6">
        <div className="max-w-md rounded-3xl border border-[#E5DEF4] bg-white p-6 text-center shadow-sm">
          <p className="text-lg font-semibold text-[#1E1B4B]">
            Couldn't load leaderboard
          </p>
          <p className="mt-2 text-sm text-[#4F4679]">{error}</p>
          <button
            type="button"
            onClick={onRetry}
            className="mt-4 rounded-2xl bg-[#693C83] px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-[#693C83]/20 hover:bg-[#5a2f6d] transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="mt-8 flex justify-center py-6">
        <div className="max-w-md rounded-3xl border border-[#E5DEF4] bg-white p-6 text-center shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EDE7F7] text-[#693C83]">
            {isStreak ? <Flame size={24} /> : <Coins size={24} />}
          </div>
          <p className="mt-4 text-lg font-semibold text-[#1E1B4B]">
            No data available
          </p>
          <p className="mt-2 text-sm text-[#4F4679]">
            There is nothing to display yet.
          </p>
        </div>
      </div>
    );
  }

  const currentData = data.map((user, index) => ({
    id: user.id,
    rank: index + 1,
    name: user.name || "Unknown",
    score: user.score || 0,
  }));

  const displayData = isAdmin
    ? currentData
    : currentData.filter((user) => user.rank <= 3 || user.id === currentUserId);

  const currentUser = currentData.find((user) => user.id === currentUserId);
  const userInTop3 = currentUser && currentUser.rank <= 3;

  return (
    <>
      {/* Podium */}
      <div className="flex flex-wrap justify-center items-end gap-4 mt-8">
        {currentData.length >= 2 && (
          <div className="w-full max-w-[200px] text-center bg-white rounded-3xl p-5 border border-[#E5DEF4] shadow-sm h-[220px] flex flex-col items-center justify-end">
            <div className="flex-1 flex flex-col items-center justify-center">
              <div className="w-14 h-14 rounded-full bg-[#F8F5FC] flex items-center justify-center text-3xl mb-3">
                🥈
              </div>
              <h3 className="text-sm font-semibold text-[#1E1B4B]">2nd</h3>
              <p className="text-[#1E1B4B] font-medium text-sm truncate w-full px-2">
                {currentData[1].name}
              </p>
              <p className="text-2xl font-bold text-[#4F4679] mt-1">
                {currentData[1].score}
              </p>
              <p className="text-xs text-[#4F4679] mt-0.5">{scoreLabel}</p>
            </div>
          </div>
        )}

        {currentData.length >= 1 && (
          <div className="w-full max-w-[240px] text-center bg-white rounded-3xl p-6 border-2 border-[#693C83] shadow-lg shadow-[#693C83]/10 h-[260px] flex flex-col items-center justify-end relative">
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <Crown size={24} className="text-[#F59E0B]" />
            </div>
            <div className="flex-1 flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-[#F59E0B] to-[#FBBF24] flex items-center justify-center text-4xl shadow-lg mb-3">
                🥇
              </div>
              <h3 className="text-base font-bold text-[#1E1B4B]">1st</h3>
              <p className="text-[#1E1B4B] font-semibold text-base truncate w-full px-2">
                {currentData[0].name}
              </p>
              <p className="text-3xl font-bold text-[#F59E0B] mt-1">
                {currentData[0].score}
              </p>
              <p className="text-xs text-[#4F4679] mt-0.5">{scoreLabel}</p>
            </div>
          </div>
        )}

        {currentData.length >= 3 && (
          <div className="w-full max-w-[200px] text-center bg-white rounded-3xl p-5 border border-[#E5DEF4] shadow-sm h-[190px] flex flex-col items-center justify-end">
            <div className="flex-1 flex flex-col items-center justify-center">
              <div className="w-14 h-14 rounded-full bg-[#F8F5FC] flex items-center justify-center text-3xl mb-3">
                🥉
              </div>
              <h3 className="text-sm font-semibold text-[#1E1B4B]">3rd</h3>
              <p className="text-[#1E1B4B] font-medium text-sm truncate w-full px-2">
                {currentData[2].name}
              </p>
              <p className="text-2xl font-bold text-[#4F4679] mt-1">
                {currentData[2].score}
              </p>
              <p className="text-xs text-[#4F4679] mt-0.5">{scoreLabel}</p>
            </div>
          </div>
        )}
      </div>

      {/* Leaderboard Table */}
      <div className="mt-8 bg-white rounded-3xl p-6 border border-[#E5DEF4] shadow-sm">
        <div>
          <h3 className="text-xl font-bold text-[#1E1B4B]">{title}</h3>
          <p className="text-sm text-[#4F4679] mt-1">
            {isStreak
              ? "Users ranked by longest active streaks"
              : "Top performers based on current Curo balance"}
          </p>
        </div>

        <div className="overflow-x-auto max-h-[700px] overflow-y-auto -mx-4 sm:mx-0 mt-4">
          <div className="inline-block min-w-full align-middle px-4 sm:px-0">
            <table className="w-full border-collapse">
              <thead className="sticky top-0 bg-white z-10 shadow-[0_1px_0_0_#E5DEF4]">
                <tr>
                  <th className="py-3 px-3 text-left text-xs font-semibold text-[#1E1B4B] uppercase tracking-wider w-[80px]">
                    Rank
                  </th>
                  <th className="py-3 px-3 text-left text-xs font-semibold text-[#1E1B4B] uppercase tracking-wider">
                    User
                  </th>
                  <th className="py-3 px-3 text-right text-xs font-semibold text-[#1E1B4B] uppercase tracking-wider">
                    {isStreak ? "Days" : scoreLabel}
                  </th>
                </tr>
              </thead>

              <tbody>
                {currentData
                  .filter((user) => user.rank <= 3)
                  .map((user) => (
                    <tr
                      key={user.rank}
                      className={`transition-colors duration-150 ${
                        user.id === currentUserId
                          ? "bg-[#F8F5FC] border-l-4 border-[#693C83]"
                          : "hover:bg-[#F8F5FC]"
                      }`}
                    >
                      <td className="py-3 px-3 border-b border-[#E5DEF4]">
                        <span className="inline-flex items-center gap-2 font-semibold text-sm">
                          <span className="w-8">
                            {user.rank === 1 && "🥇"}
                            {user.rank === 2 && "🥈"}
                            {user.rank === 3 && "🥉"}
                          </span>
                          <span
                            className={
                              user.rank === 1
                                ? "text-[#F59E0B]"
                                : user.rank === 2
                                  ? "text-[#94A3B8]"
                                  : user.rank === 3
                                    ? "text-[#D97706]"
                                    : "text-[#1E1B4B]"
                            }
                          >
                            #{user.rank}
                          </span>
                        </span>
                      </td>
                      <td className="py-3 px-3 border-b border-[#E5DEF4] text-[#1E1B4B]">
                        {user.name}
                        {user.id === currentUserId && (
                          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[#693C83] text-white">
                            You
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 border-b border-[#E5DEF4] text-right font-bold text-[#1E1B4B]">
                        {isStreak ? (
                          <span className="inline-flex items-center gap-1.5">
                            <Flame size={16} className="text-[#F59E0B]" />
                            {user.score}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5">
                            <Coins size={16} className="text-[#F59E0B]" />
                            {user.score}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}

                {!isAdmin && !userInTop3 && currentUser && (
                  <>
                    <tr>
                      <td
                        colSpan="3"
                        className="text-center text-[#D9CFE8] py-3"
                      >
                        <span className="text-sm">⋯</span>
                      </td>
                    </tr>

                    <tr className="bg-[#F8F5FC] border-l-4 border-[#693C83] transition-colors duration-150">
                      <td className="py-3 px-3 border-b border-[#E5DEF4] text-[#1E1B4B] font-semibold">
                        #{currentUser.rank}
                      </td>
                      <td className="py-3 px-3 border-b border-[#E5DEF4] text-[#1E1B4B] font-semibold">
                        {currentUser.name}
                        <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[#693C83] text-white">
                          You
                        </span>
                      </td>
                      <td className="py-3 px-3 border-b border-[#E5DEF4] text-right font-bold text-[#1E1B4B]">
                        {isStreak ? (
                          <span className="inline-flex items-center gap-1.5">
                            <Flame size={16} className="text-[#F59E0B]" />
                            {currentUser.score}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5">
                            <Coins size={16} className="text-[#F59E0B]" />
                            {currentUser.score}
                          </span>
                        )}
                      </td>
                    </tr>
                  </>
                )}

                {isAdmin &&
                  currentData.slice(3).map((user) => (
                    <tr
                      key={user.rank}
                      className="hover:bg-[#F8F5FC] transition-colors duration-150"
                    >
                      <td className="py-3 px-3 border-b border-[#E5DEF4] text-[#1E1B4B]">
                        #{user.rank}
                      </td>
                      <td className="py-3 px-3 border-b border-[#E5DEF4] text-[#1E1B4B]">
                        {user.name}
                      </td>
                      <td className="py-3 px-3 border-b border-[#E5DEF4] text-right font-bold text-[#1E1B4B]">
                        {isStreak ? (
                          <span className="inline-flex items-center gap-1.5">
                            <Flame size={16} className="text-[#F59E0B]" />
                            {user.score}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5">
                            <Coins size={16} className="text-[#F59E0B]" />
                            {user.score}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
};

const Leaderboard = () => {
  const [activeTab, setActiveTab] = useState("curos");
  const [leaderboard, setLeaderboard] = useState([]);
  const [streakLeaderboard, setStreakLeaderboard] = useState([]);
  const [completionLeaderboard, setCompletionLeaderboard] = useState([]);
  const [retentionLeaderboard, setRetentionLeaderboard] = useState([]);
  const [applicationLeaderboard, setApplicationLeaderboard] = useState([]);
  const [streakStats, setStreakStats] = useState({
    longest_overall_streak: 0,
  });
  const [completionStats, setCompletionStats] = useState({
    total_completed_programs: 0,
  });
  const [retentionStats, setRetentionStats] = useState({
    total_passed_quizzes: 0,
  });
  const [applicationStats, setApplicationStats] = useState({
    total_passed_checks: 0,
  });
  const [stats, setStats] = useState({
    total_curos: 0,
    active_users: 0,
    avg_curos: 0,
  });
  const [loading, setLoading] = useState(true);
  const [streakLoading, setStreakLoading] = useState(true);
  const [completionLoading, setCompletionLoading] = useState(true);
  const [retentionLoading, setRetentionLoading] = useState(true);
  const [applicationLoading, setApplicationLoading] = useState(true);
  const [streakStatsLoading, setStreakStatsLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");

  useEffect(() => {
    refreshLeaderboardData();
  }, []);

  const refreshLeaderboardData = () => {
    setFetchError("");
    fetchLeaderboard();
    fetchStats();
    fetchStreakLeaderboard();
    fetchStreakStats();
    fetchCompletionLeaderboard();
    fetchCompletionStats();
    fetchRetentionLeaderboard();
    fetchRetentionStats();
    fetchApplicationLeaderboard();
    fetchApplicationStats();
  };

  const fetchLeaderboard = async () => {
    try {
      const data = await curoService.getLeaderboard();
      const filteredData = data.filter(
        (user) => user.role_id !== 1 && user.role_id !== 2,
      );
      setLeaderboard(filteredData);
    } catch (error) {
      console.error("Failed to fetch leaderboard:", error);
      setFetchError("Failed to load leaderboard.");
    }
  };

  const fetchStats = async () => {
    try {
      const data = await curoService.getStats();
      setStats(data);
    } catch (error) {
      console.error("Failed to fetch stats:", error);
      setFetchError("Failed to load leaderboard.");
    } finally {
      setLoading(false);
    }
  };

  const fetchStreakLeaderboard = async () => {
    try {
      const data = await streakService.getStreakLeaderboard();
      console.log("Raw streak leaderboard data:", data);
      const filteredData = data.filter(
        (user) => user.role_id !== 1 && user.role_id !== 2,
      );
      console.log("Filtered streak leaderboard data:", filteredData);
      setStreakLeaderboard(filteredData);
    } catch (error) {
      console.error("Failed to fetch streak leaderboard:", error);
      setFetchError("Failed to load leaderboard.");
    } finally {
      setStreakLoading(false);
    }
  };

  const fetchStreakStats = async () => {
    try {
      const data = await streakService.getStreakStats();
      setStreakStats(data);
    } catch (error) {
      console.error("Failed to fetch streak stats:", error);
      setFetchError("Failed to load leaderboard.");
    } finally {
      setStreakStatsLoading(false);
    }
  };

  const fetchCompletionLeaderboard = async () => {
    try {
      const data = await leaderboardService.getCompletionLeaderboard();
      const filteredData = data.filter(
        (user) => user.role_id !== 1 && user.role_id !== 2,
      );
      setCompletionLeaderboard(filteredData);
    } catch (error) {
      console.error("Failed to fetch completion leaderboard:", error);
      setFetchError("Failed to load leaderboard.");
    } finally {
      setCompletionLoading(false);
    }
  };

  const fetchCompletionStats = async () => {
    try {
      const data = await leaderboardService.getCompletionStats();
      setCompletionStats(data);
    } catch (error) {
      console.error("Failed to fetch completion stats:", error);
      setFetchError("Failed to load leaderboard.");
    }
  };

  const fetchRetentionLeaderboard = async () => {
    try {
      const data = await leaderboardService.getRetentionLeaderboard();
      const filteredData = data.filter(
        (user) => user.role_id !== 1 && user.role_id !== 2,
      );
      setRetentionLeaderboard(filteredData);
    } catch (error) {
      console.error("Failed to fetch retention leaderboard:", error);
      setFetchError("Failed to load leaderboard.");
    } finally {
      setRetentionLoading(false);
    }
  };

  const fetchRetentionStats = async () => {
    try {
      const data = await leaderboardService.getRetentionStats();
      setRetentionStats(data);
    } catch (error) {
      console.error("Failed to fetch retention stats:", error);
      setFetchError("Failed to load leaderboard.");
    }
  };

  const fetchApplicationLeaderboard = async () => {
    try {
      const data = await leaderboardService.getApplicationLeaderboard();
      const filteredData = data.filter(
        (user) => user.role_id !== 1 && user.role_id !== 2,
      );
      setApplicationLeaderboard(filteredData);
    } catch (error) {
      console.error("Failed to fetch application leaderboard:", error);
      setFetchError("Failed to load leaderboard.");
    } finally {
      setApplicationLoading(false);
    }
  };

  const fetchApplicationStats = async () => {
    try {
      const data = await leaderboardService.getApplicationStats();
      setApplicationStats(data);
    } catch (error) {
      console.error("Failed to fetch application stats:", error);
      setFetchError("Failed to load leaderboard.");
    }
  };

  const curoData = useMemo(() => {
    return leaderboard && leaderboard.length > 0
      ? leaderboard.map((user) => ({
          id: user.user_id,
          name: user.name || "Unknown",
          score: user.curos || 0,
        }))
      : [];
  }, [leaderboard]);

  const streakData = useMemo(() => {
    return streakLeaderboard && streakLeaderboard.length > 0
      ? streakLeaderboard.map((user) => ({
          id: user.user_id,
          name: user.name || "Unknown",
          score: user.current_streak || user.streak || 0,
        }))
      : [];
  }, [streakLeaderboard]);

  const completionData = useMemo(() => {
    return completionLeaderboard && completionLeaderboard.length > 0
      ? completionLeaderboard.map((user) => ({
          id: user.user_id,
          name: user.name || "Unknown",
          score: user.completed_programs || 0,
        }))
      : [];
  }, [completionLeaderboard]);

  const retentionData = useMemo(() => {
    return retentionLeaderboard && retentionLeaderboard.length > 0
      ? retentionLeaderboard.map((user) => ({
          id: user.user_id,
          name: user.name || "Unknown",
          score: user.passed_retention_quizzes || 0,
        }))
      : [];
  }, [retentionLeaderboard]);

  const applicationData = useMemo(() => {
    return applicationLeaderboard && applicationLeaderboard.length > 0
      ? applicationLeaderboard.map((user) => ({
          id: user.user_id,
          name: user.name || "Unknown",
          score: user.passed_application_checks || 0,
        }))
      : [];
  }, [applicationLeaderboard]);

  const currentUser = useMemo(() => {
    return leaderboard.find((user) => user.user_id === currentUserId);
  }, [leaderboard, currentUserId]);

  const currentUserStreak = useMemo(() => {
    return streakLeaderboard.find((user) => user.user_id === currentUserId);
  }, [streakLeaderboard, currentUserId]);

  const tabs = [
    { id: "curos", label: "Curos", icon: Coins },
    { id: "completion", label: "Completion", icon: Trophy },
    { id: "retention", label: "Retention", icon: Activity },
    { id: "application", label: "Application", icon: Award },
    { id: "streak", label: "Streaks", icon: Flame },
  ];

  return (
    <MainLayout>
      <div className="min-h-full space-y-8 bg-[#F1ECF7] text-[#1E1B4B]">
        {/* Compact Header */}
        <header className="rounded-3xl bg-gradient-to-r from-[#1E1B4B] via-[#3F2B6D] to-[#693C83] p-4 md:p-6 text-white shadow-md">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold tracking-wider text-[#C4B5D4] uppercase">
                Performance & Achievements
              </p>
              <h1 className="text-2xl font-semibold md:text-3xl">
                Leaderboards
              </h1>
              <p className="mt-1 text-sm text-[#F1ECF7] max-w-2xl">
                Track top performers across learning, retention, application and
                consistency.
              </p>
            </div>
          </div>
        </header>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {isAdmin ? (
            <>
              <div className="bg-white rounded-3xl p-6 border border-[#E5DEF4] shadow-sm">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-[#4F4679]">
                    Total Users
                  </h4>
                  <div className="p-2 bg-[#F8F5FC] rounded-xl">
                    <Users size={18} className="text-[#693C83]" />
                  </div>
                </div>
                <p className="text-3xl font-bold text-[#1E1B4B] mt-2">
                  {loading ? "..." : stats.active_users.toLocaleString()}
                </p>
              </div>

              <div className="bg-white rounded-3xl p-6 border border-[#E5DEF4] shadow-sm">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-[#4F4679]">
                    All Curos
                  </h4>
                  <div className="p-2 bg-[#F8F5FC] rounded-xl">
                    <Coins size={18} className="text-[#F59E0B]" />
                  </div>
                </div>
                <p className="text-3xl font-bold text-[#1E1B4B] mt-2">
                  {loading ? "..." : stats.total_curos.toLocaleString()}
                </p>
              </div>

              <div className="bg-white rounded-3xl p-6 border border-[#E5DEF4] shadow-sm">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-[#4F4679]">
                    Highest Streak
                  </h4>
                  <div className="p-2 bg-[#F8F5FC] rounded-xl">
                    <Flame size={18} className="text-[#F59E0B]" />
                  </div>
                </div>
                <p className="text-3xl font-bold text-[#1E1B4B] mt-2">
                  {streakStatsLoading
                    ? "..."
                    : `${streakStats.longest_overall_streak.toLocaleString()}d`}
                </p>
              </div>

              <div className="bg-white rounded-3xl p-6 border border-[#E5DEF4] shadow-sm">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-[#4F4679]">
                    Programs Completed
                  </h4>
                  <div className="p-2 bg-[#F8F5FC] rounded-xl">
                    <Award size={18} className="text-[#4F4679]" />
                  </div>
                </div>
                <p className="text-3xl font-bold text-[#1E1B4B] mt-2">
                  {loading ? "..." : (currentUser?.completed_programs ?? 0)}
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="bg-white rounded-3xl p-6 border border-[#E5DEF4] shadow-sm">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-[#4F4679]">
                    Total Curos
                  </h4>
                  <div className="p-2 bg-[#F8F5FC] rounded-xl">
                    <Coins size={18} className="text-[#F59E0B]" />
                  </div>
                </div>
                <p className="text-3xl font-bold text-[#1E1B4B] mt-2">
                  {loading ? "..." : (currentUser?.curos ?? 0)}
                </p>
              </div>

              <div className="bg-white rounded-3xl p-6 border border-[#E5DEF4] shadow-sm">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-[#4F4679]">
                    Current Streak
                  </h4>
                  <div className="p-2 bg-[#F8F5FC] rounded-xl">
                    <Flame size={18} className="text-[#F59E0B]" />
                  </div>
                </div>
                <p className="text-3xl font-bold text-[#1E1B4B] mt-2">
                  {streakLoading
                    ? "..."
                    : `${currentUserStreak?.current_streak ?? 0}d`}
                </p>
              </div>

              <div className="bg-white rounded-3xl p-6 border border-[#E5DEF4] shadow-sm">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-[#4F4679]">
                    Longest Streak
                  </h4>
                  <div className="p-2 bg-[#F8F5FC] rounded-xl">
                    <Flame size={18} className="text-[#693C83]" />
                  </div>
                </div>
                <p className="text-3xl font-bold text-[#1E1B4B] mt-2">
                  {streakLoading
                    ? "..."
                    : `${currentUserStreak?.longest_streak ?? 0}d`}
                </p>
              </div>

              <div className="bg-white rounded-3xl p-6 border border-[#E5DEF4] shadow-sm">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-[#4F4679]">
                    Programs Completed
                  </h4>
                  <div className="p-2 bg-[#F8F5FC] rounded-xl">
                    <Award size={18} className="text-[#4F4679]" />
                  </div>
                </div>
                <p className="text-3xl font-bold text-[#1E1B4B] mt-2">
                  {loading ? "..." : (currentUser?.completed_programs ?? 0)}
                </p>
              </div>
            </>
          )}
        </div>

        {/* Tabs */}
        <div className="overflow-x-auto whitespace-nowrap">
          <div className="inline-flex gap-1 p-1 bg-white rounded-2xl border border-[#E5DEF4] shadow-sm">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-[#693C83] text-white shadow-md"
                      : "text-[#4F4679] hover:bg-[#F8F5FC]"
                  }`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <Icon size={16} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === "curos" && (
          <LeaderboardTable
            data={curoData}
            title="Leaderboard Rankings"
            scoreLabel="Curos"
            loading={loading}
            error={fetchError}
            onRetry={refreshLeaderboardData}
          />
        )}

        {activeTab === "streak" && (
          <LeaderboardTable
            data={streakData}
            title="Streak Leaderboard Rankings"
            scoreLabel="Days"
            loading={streakLoading}
            error={fetchError}
            onRetry={refreshLeaderboardData}
            isStreak={true}
          />
        )}

        {activeTab === "completion" && (
          <LeaderboardTable
            data={completionData}
            title="Completion Leaderboard Rankings"
            scoreLabel="Programs"
            loading={completionLoading}
            error={fetchError}
            onRetry={refreshLeaderboardData}
          />
        )}

        {activeTab === "retention" && (
          <LeaderboardTable
            data={retentionData}
            title="Retention Leaderboard Rankings"
            scoreLabel="Quizzes"
            loading={retentionLoading}
            error={fetchError}
            onRetry={refreshLeaderboardData}
          />
        )}

        {activeTab === "application" && (
          <LeaderboardTable
            data={applicationData}
            title="Application Leaderboard Rankings"
            scoreLabel="Checks"
            loading={applicationLoading}
            error={fetchError}
            onRetry={refreshLeaderboardData}
          />
        )}
      </div>
    </MainLayout>
  );
};

export default Leaderboard;
