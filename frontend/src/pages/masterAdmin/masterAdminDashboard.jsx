// MasterAdminDashboard.jsx
import { useState, useEffect } from "react";
import MainLayout from "../../layout/mainLayout";
import StatCard from "../../components/ui/statCard";
import DashboardCard from "../../components/ui/dashboardCard";
import EngagementChart from "../../components/charts/engagementChart";
import UserDistribution from "../../components/charts/userDistribution";
import AdminQuickAccess from "./adminQuickAccess";
import { fetchAdminDashboard } from "../../services/dashboardService";
import AuditLogsModal from "./auditLogsModal";

import {
  Users,
  ShieldCheck,
  Bell,
  Coins,
  Loader2,
  CalendarDays,
  Clock3,
} from "lucide-react";

const MasterAdminDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAuditLogs, setShowAuditLogs] = useState(false);

  // Get user data from localStorage
  const userId = localStorage.getItem("user_Id") || 1;
  const userRoleId = parseInt(localStorage.getItem("role_id") || "1");
  const userName = localStorage.getItem("user_name") || "Guest";

  // Check if user has permission (role_id: 1 = Master Admin, 2 = Admin)
  const hasPermission = [1, 2].includes(userRoleId);

  useEffect(() => {
    if (!hasPermission) {
      setError("You don't have permission to access this dashboard");
      setLoading(false);
      return;
    }
    if (!dashboardData) {
      loadDashboard();
    }
  }, [userRoleId]);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchAdminDashboard(userId, userRoleId);
      setDashboardData(data);
    } catch (err) {
      console.error("Failed to load dashboard:", err);
      setError(
        err.response?.data?.detail ||
          "Failed to load dashboard data. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  // Utility functions
  const formatNumber = (num) => {
    if (!num) return "0";
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  const formatRelativeTime = (timestamp) => {
    if (!timestamp) return "Unknown";
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now - time;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60)
      return `${diffMins} minute${diffMins > 1 ? "s" : ""} ago`;
    if (diffHours < 24)
      return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
    return time.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  };

  const getActionColor = (actionType) => {
    const colorMap = {
      user_created: "bg-[#10B981]",
      user_updated: "bg-[#693C83]",
      user_activated: "bg-[#10B981]",
      user_deactivated: "bg-[#EF4444]",
      user_deleted: "bg-[#EF4444]",
      program_created: "bg-[#693C83]",
      module_created: "bg-[#F59E0B]",
      module_updated: "bg-[#693C83]",
      module_deleted: "bg-[#EF4444]",
      role_permission_updated: "bg-[#8B5CF6]",
    };
    return colorMap[actionType] || "bg-[#693C83]";
  };

  // Loading state
  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-[#693C83] mx-auto" />
            <p className="mt-4 text-[#4F4679]">Loading dashboard...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  // Error states
  if (error) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div
              className={
                error.includes("permission")
                  ? "text-red-500 text-6xl mb-4"
                  : "text-red-500 text-xl mb-4"
              }
            >
              {error.includes("permission") ? "🚫" : "⚠️"}
            </div>
            <h2 className="text-2xl font-bold text-[#1E1B4B] mb-2">
              {error.includes("permission") ? "Access Denied" : ""}
            </h2>
            <p
              className={
                error.includes("permission") ? "text-[#4F4679]" : "text-red-500"
              }
            >
              {error}
            </p>
            {!error.includes("permission") && (
              <button
                onClick={loadDashboard}
                className="mt-4 px-4 py-2 bg-[#693C83] text-white rounded-lg hover:bg-[#5a2e6e]"
              >
                Retry
              </button>
            )}
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!dashboardData) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <p className="text-[#4F4679]">No data available</p>
        </div>
      </MainLayout>
    );
  }

  // Destructure data
  const { stat_cards, user_distribution, recent_activity, learning_activity } = dashboardData;

  // Date/Time formatting
  const now = new Date();
  const greeting =
    now.getHours() < 12
      ? "Good Morning"
      : now.getHours() < 17
        ? "Good Afternoon"
        : "Good Evening";
  const formattedDate = now.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const formattedTime = now.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const roleNames = {
    1: "Master Admin",
    2: "Admin",
    3: "Team Leader",
    4: "Franchise Partner",
    5: "Franchise Employee",
    6: "Franchise Developer",
    7: "Head Office Staff",
  };
  const roleName = roleNames[userRoleId] || "User";

  return (
    <MainLayout>
      {/* Header */}
      <header className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#1E1B4B] via-[#3F2B6D] to-[#693C83] p-8 text-white shadow-xl">
        <div className="absolute -right-24 -top-20 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-48 w-48 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute -bottom-20 left-10 h-56 w-56 rounded-full bg-[#A78BFA]/10 blur-3xl" />

        <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          {/* Left Section */}
          <div>
            <span className="inline-flex rounded-full bg-white/10 px-4 py-1 text-xs font-medium uppercase tracking-[0.2em] backdrop-blur">
              {roleName}
            </span>

            <h1 className="mt-4 text-4xl font-bold tracking-tight">
              {greeting}, {userName} 👋
            </h1>

            <p className="mt-3 max-w-2xl text-base leading-relaxed text-white/80">
              Welcome back to{" "}
              <span className="font-semibold">Saarthi Curious</span>. Monitor
              platform performance, manage users, oversee learning progress, and
              keep everything running smoothly from one place.
            </p>

            {/* Quick Stats */}
            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur transition-all duration-300 hover:bg-white/15">
                <p className="text-sm text-white/70">
                  Programs Completed Today
                </p>
                <h3 className="mt-2 text-3xl font-bold">
                  {formatNumber(
                    stat_cards?.programs_completed_today?.value || 0,
                  )}
                </h3>
                <p className="mt-1 text-sm text-emerald-300">
                  Across all learners
                </p>
              </div>

              <div className="rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur transition-all duration-300 hover:bg-white/15">
                <p className="text-sm text-white/70">Curos Earned Today</p>
                <h3 className="mt-2 text-3xl font-bold text-yellow-300">
                  {formatNumber(stat_cards?.curos_earned_today?.value || 0)}
                </h3>
                <p className="mt-1 text-sm text-yellow-200">
                  Reward points awarded
                </p>
              </div>

              <div className="rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur transition-all duration-300 hover:bg-white/15">
                <p className="text-sm text-white/70">Badges Earned Today</p>
                <h3 className="mt-2 text-3xl font-bold text-purple-200">
                  {formatNumber(stat_cards?.badges_earned_today?.value || 0)}
                </h3>
                <p className="mt-1 text-sm text-purple-100">
                  Achievement badges unlocked
                </p>
              </div>
            </div>
          </div>

          {/* Right Section */}
          <div className="flex flex-col gap-4 lg:items-end">
            {/* Date Card */}
            <div className="min-w-[250px] rounded-3xl border border-white/15 bg-white/10 p-6 backdrop-blur-md">
              <div className="flex items-center gap-2 text-white/70">
                <CalendarDays className="h-4 w-4" />
                <span className="text-sm font-medium">Today</span>
              </div>
              <h2 className="mt-2 text-2xl font-bold leading-tight">
                {formattedDate}
              </h2>
              <div className="mt-4 flex items-center gap-2 text-white/80">
                <Clock3 className="h-4 w-4" />
                <span className="text-lg font-semibold">{formattedTime}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mt-8">
        <StatCard
          title="Total Users"
          value={formatNumber(stat_cards?.total_users?.value)}
          icon={<Users size={26} className="text-white" />}
          iconBg="bg-[#693C83]"
        />

        <StatCard
          title="Active Learners"
          value={formatNumber(stat_cards?.active_learners?.value)}
          icon={<Users size={26} className="text-white" />}
          iconBg="bg-[#693C83]"
        />

        <StatCard
          title="Total Programs"
          value={formatNumber(stat_cards?.programs?.value)}
          icon={<ShieldCheck size={26} className="text-white" />}
          iconBg="bg-[#693C83]"
          multiline={true}
        />

        <StatCard
          title="Total Curos in Circulation"
          value={formatNumber(dashboardData?.curo_overview?.total_curos || 0)}
          icon={<Coins size={26} className="text-white" />}
          iconBg="bg-[#693C83]"
        />
      </div>

      {/* Analytics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-8">
        <div className="lg:col-span-8">
          <DashboardCard title="Platform Activity Overview">
            <div className="h-72 bg-[#ECE5F2] rounded-lg">
              <EngagementChart data={learning_activity} />
            </div>
          </DashboardCard>
        </div>

        <div className="lg:col-span-4">
          <DashboardCard title="User Distribution">
            <UserDistribution data={user_distribution?.by_role || []} />
          </DashboardCard>
        </div>
      </div>

      {/* Activity & Quick Access Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-8">
        <div className="lg:col-span-6">
          <DashboardCard title="Quick Access (Admin Controls)">
            <AdminQuickAccess />
          </DashboardCard>
        </div>

        <div className="lg:col-span-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-[#1E1B4B]">
                Recent Activity
              </h3>
              <button
                onClick={() => setShowAuditLogs(true)}
                className="px-4 py-2 text-sm font-medium text-[#4F46E5] border border-[#4F46E5] rounded-lg hover:bg-[#4F46E5] hover:text-white transition-all duration-200 flex items-center gap-2"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                  />
                </svg>
                View All Logs
              </button>
            </div>

            <div className="p-4">
              <div className="space-y-4">
                {recent_activity?.length > 0 ? (
                  recent_activity.slice(0, 5).map((activity, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div
                        className={`w-3 h-3 ${getActionColor(activity.action_type)} rounded-full mt-1.5 flex-shrink-0`}
                      />
                      <div className="flex-1">
                        <p className="text-[#1E1B4B] font-medium">
                          {activity.action}
                        </p>
                        <p className="text-[#4F4679] text-sm">
                          {activity.user} • {activity.entity_type}
                        </p>
                        <p className="text-[#4F4679] text-xs mt-1">
                          {formatRelativeTime(activity.timestamp)}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-[#4F4679] text-center py-4">
                    No recent activity
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        <AuditLogsModal
          isOpen={showAuditLogs}
          onClose={() => setShowAuditLogs(false)}
        />
      </div>

      {/* Performance Cards Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-8">
        {/* Top Programs */}
        <div className="lg:col-span-4">
          <DashboardCard title="Top Programs">
            <div className="space-y-3">
              {dashboardData?.top_programs?.slice(0, 5).map((program) => (
                <div
                  key={program.program_id}
                  className="bg-[#ECE5F2] rounded-xl p-3 hover:scale-[1.02] hover:shadow-lg transition-all duration-300 cursor-pointer"
                >
                  <div className="flex justify-between items-center">
                    <div className="flex-1">
                      <p className="text-[#1E1B4B] font-medium text-sm truncate">
                        {program.program_name}
                      </p>
                      <p className="text-[#4F4679] text-xs mt-1">
                        {formatNumber(program.enrollments)} enrolled
                      </p>
                    </div>
                    <div className="text-right ml-2">
                      <p className="text-[#10B981] font-bold text-sm">
                        {formatNumber(program.completions)}
                      </p>
                      <p className="text-[#4F4679] text-xs">completed</p>
                    </div>
                  </div>
                </div>
              ))}
              {!dashboardData?.top_programs?.length && (
                <p className="text-[#4F4679] text-center py-4">
                  No programs available
                </p>
              )}
            </div>
          </DashboardCard>
        </div>

        {/* Top Team Leaders */}
        <div className="lg:col-span-4">
          <DashboardCard title="Top Team Leaders">
            <div className="space-y-3">
              {dashboardData?.top_team_leaders?.slice(0, 5).map((leader) => (
                <div
                  key={leader.leader_id}
                  className="bg-[#ECE5F2] rounded-xl p-3 hover:scale-[1.02] hover:shadow-lg transition-all duration-300 cursor-pointer"
                >
                  <div className="flex justify-between items-center">
                    <div className="flex-1">
                      <p className="text-[#1E1B4B] font-medium text-sm truncate">
                        {leader.leader_name}
                      </p>
                      <p className="text-[#4F4679] text-xs mt-1">
                        {formatNumber(leader.team_size)} team members
                      </p>
                    </div>
                    <div className="text-right ml-2">
                      <p className="text-[#693C83] font-bold text-sm">
                        {leader.engagement_score}
                      </p>
                      <p className="text-[#4F4679] text-xs">score</p>
                    </div>
                  </div>
                </div>
              ))}
              {!dashboardData?.top_team_leaders?.length && (
                <p className="text-[#4F4679] text-center py-4">
                  No team leaders available
                </p>
              )}
            </div>
          </DashboardCard>
        </div>

        {/* Curo Overview */}
        <div className="lg:col-span-4">
          <DashboardCard title="Curo Overview">
            <div className="space-y-3">
              <div className="bg-[#ECE5F2] rounded-xl p-4 hover:scale-[1.02] hover:shadow-lg transition-all duration-300 cursor-pointer">
                <p className="text-[#4F4679] text-sm">Total Curos</p>
                <h2 className="text-4xl font-bold text-[#F59E0B] mt-2">
                  {formatNumber(dashboardData?.curo_overview?.total_curos || 0)}
                </h2>
                <p className="text-[#4F4679] mt-1">Total awarded</p>
              </div>

              <div className="bg-[#ECE5F2] rounded-xl p-4 hover:scale-[1.02] hover:shadow-lg transition-all duration-300 cursor-pointer">
                <p className="text-[#4F4679] text-sm">Average Curos</p>
                <h2 className="text-4xl font-bold text-[#10B981] mt-2">
                  {formatNumber(
                    Math.round(
                      dashboardData?.curo_overview?.average_curos || 0,
                    ),
                  )}
                </h2>
                <p className="text-[#4F4679] mt-1">Per user</p>
              </div>

              <div className="bg-[#ECE5F2] rounded-xl p-4 hover:scale-[1.02] hover:shadow-lg transition-all duration-300 cursor-pointer">
                <p className="text-[#4F4679] text-sm">Highest Curos</p>
                <h2 className="text-4xl font-bold text-[#693C83] mt-2">
                  {formatNumber(
                    dashboardData?.curo_overview?.highest_curos || 0,
                  )}
                </h2>
                <p className="text-[#4F4679] mt-1">
                  {dashboardData?.curo_overview?.highest_curos_holder || "N/A"}
                </p>
              </div>
            </div>
          </DashboardCard>
        </div>
      </div>
    </MainLayout>
  );
};

export default MasterAdminDashboard;
