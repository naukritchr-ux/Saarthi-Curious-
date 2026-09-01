// TeamLeaderDashboard.jsx
import { useState, useEffect, useCallback } from "react";
import MainLayout from "../../layout/mainLayout";
import StatCard from "../../components/ui/statCard";
import DashboardCard from "../../components/ui/dashboardCard";
import EngagementChart from "../../components/charts/engagementChart";
import UserDistribution from "../../components/charts/userDistribution";
import TeamLeaderQuickAccess from "./teamLeaderQuickAccess";
import { fetchTeamLeaderDashboard } from "../../services/dashboardService";

import {
  Users,
  Building2,
  Coins,
  Loader2,
  CalendarDays,
  Clock3,
  Users2,
} from "lucide-react";

const TeamLeaderDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Get user_id and role_id from localStorage or context
  const userId = localStorage.getItem("user_id") || 1;
  const userRoleId = parseInt(localStorage.getItem("role_id") || "3");

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await fetchTeamLeaderDashboard(userId, userRoleId);
      setDashboardData(data);
    } catch (err) {
      const message =
        err?.response?.data?.detail || "Failed to load dashboard data";
      setError(message);
      setDashboardData(null);
    } finally {
      setLoading(false);
    }
  }, [userId, userRoleId]);

  useEffect(() => {
    if (userRoleId !== 3) {
      setError("You don't have permission to access this dashboard");
      setLoading(false);
      return;
    }
    loadDashboard();
  }, [userRoleId, loadDashboard]);

  // Format number with commas
  const formatNumber = (num) => {
    if (!num) return "0";
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
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

  // Permission Denied
  if (error && error.includes("permission")) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="text-red-500 text-6xl mb-4">🚫</div>
            <h2 className="text-2xl font-bold text-[#1E1B4B] mb-2">
              Access Denied
            </h2>
            <p className="text-[#4F4679]">{error}</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  // Error state
  if (error) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="text-red-500 text-xl mb-4">⚠️</div>
            <p className="text-red-500">{error}</p>
            <button
              onClick={loadDashboard}
              className="mt-4 px-4 py-2 bg-[#693C83] text-white rounded-lg hover:bg-[#5a2e6e]"
            >
              Retry
            </button>
          </div>
        </div>
      </MainLayout>
    );
  }

  // If no data, show empty state
  if (!dashboardData) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <p className="text-[#4F4679]">No data available</p>
        </div>
      </MainLayout>
    );
  }

  // Destructure data for easier access
  const {
    stat_cards,
    franchise_distribution,
    team_analytics,
    recent_activity,
    team_members,
    franchises,
  } = dashboardData;

  // Transform franchise distribution for the chart component
  // Option 1: If you want to use the existing UserDistribution component
  const chartFriendlyFranchiseDistribution = (franchise_distribution || []).map(
    (item) => ({
      display_name: item.name,
      count: item.value,
    }),
  );

  // Option 2: If you want to add colors manually (UserDistribution has its own color map)
  // The UserDistribution component uses roleColorMap which won't match franchise names
  // So we need to either:
  // a) Use the component as-is (it will use default colors)
  // b) Create a custom color mapping for franchises

  // Option 3: If you want to create a custom color mapping for franchises
  const franchiseColorMap = {
    // Add specific colors for known franchise partners
    // Example:
    // "John Doe": "#693C83",
    // "Jane Smith": "#10B981",
  };

  const chartDataWithColors = (franchise_distribution || []).map((item) => ({
    display_name: item.name,
    count: item.value,
    // The UserDistribution component will use roleColorMap,
    // but franchise names won't match, so it will use default #6B7280
    // To fix this, you can modify the UserDistribution component
    // or use a custom chart component
  }));

  // Dynamic Greeting & Time
  const greeting =
    currentTime.getHours() < 12
      ? "Good Morning"
      : currentTime.getHours() < 17
        ? "Good Afternoon"
        : "Good Evening";

  const formattedDate = currentTime.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const formattedTime = currentTime.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const userName = localStorage.getItem("user_name") || "Guest";
  const roleId = Number(localStorage.getItem("role_id"));
  const roleNames = {
    1: "Master Admin",
    2: "Admin",
    3: "Team Leader",
    4: "Franchise Partner",
    5: "Franchise Employee",
    6: "Franchise Developer",
    7: "Head Office Staff",
  };
  const roleName = roleNames[roleId] || "User";

  return (
    <MainLayout>
      {/* Header */}
      <header className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#1E1B4B] via-[#3F2B6D] to-[#693C83] p-8 text-white shadow-xl">
        {/* Decorative Blobs */}
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
              Welcome to your{" "}
              <span className="font-semibold">Team Leader Dashboard</span>.
              Monitor your team's performance, track learning progress, and
              manage your franchises from one centralized location.
            </p>

            {/* Today's Highlights */}
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
                  Across your team
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

      {/* Row 1 – Team Overview KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mt-8">
        <StatCard
          title="Total Team Members"
          value={formatNumber(stat_cards?.total_team_members?.value)}
          icon={<Users2 size={26} className="text-white" />}
          iconBg="bg-[#693C83]"
        />

        <StatCard
          title="Franchise Partners"
          value={formatNumber(stat_cards?.franchise_partners?.value)}
          icon={<Building2 size={26} className="text-white" />}
          iconBg="bg-[#693C83]"
        />

        <StatCard
          title="Franchise Employees"
          value={formatNumber(stat_cards?.franchise_employees?.value)}
          icon={<Users size={26} className="text-white" />}
          iconBg="bg-[#693C83]"
        />

        <StatCard
          title="Curos in Team"
          value={formatNumber(stat_cards?.team_curos?.value)}
          icon={<Coins size={26} className="text-white" />}
          iconBg="bg-[#693C83]"
        />
      </div>

      {/* Row 2 – Analytics: 8:4 split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-8">
        {/* Left (8 columns): Team Learning Activity Chart */}
        <div className="lg:col-span-8">
          <DashboardCard title="Team Learning Activity">
            <div className="h-72 bg-[#ECE5F2] rounded-lg">
              <EngagementChart data={team_analytics?.learning_activity || []} />
            </div>
          </DashboardCard>
        </div>

        {/* Right (4 columns): Franchise Distribution */}
        <div className="lg:col-span-4">
          <DashboardCard title="Franchise Distribution">
            {chartFriendlyFranchiseDistribution.length > 0 ? (
              <UserDistribution data={chartFriendlyFranchiseDistribution} />
            ) : (
              <div className="flex items-center justify-center h-56 bg-[#ECE5F2] rounded-lg">
                <p className="text-[#4F4679]">No franchise data available</p>
              </div>
            )}
          </DashboardCard>
        </div>
      </div>

      {/* Row 3 – Team Operations: 6:6 split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-8">
        {/* Left (6 columns): Quick Access */}
        <div className="lg:col-span-6">
          <DashboardCard title="Quick Access">
            <TeamLeaderQuickAccess />
          </DashboardCard>
        </div>

        {/* Right (6 columns): Recent Activity */}
        <div className="lg:col-span-6">
          <DashboardCard title="Recent Team Activity">
            <div className="space-y-4">
              {recent_activity && recent_activity.length > 0 ? (
                recent_activity.slice(0, 5).map((activity, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 hover:bg-[#ECE5F2] p-2 rounded-lg transition-all duration-200"
                  >
                    <div
                      className={`w-3 h-3 rounded-full mt-1.5 flex-shrink-0 ${
                        activity.type === "completion"
                          ? "bg-[#10B981]"
                          : activity.type === "registration"
                            ? "bg-[#693C83]"
                            : activity.type === "curo"
                              ? "bg-[#F59E0B]"
                              : "bg-[#EF4444]"
                      }`}
                    ></div>
                    <div className="flex-1">
                      <p className="text-[#1E1B4B] font-medium">
                        {activity.title}
                      </p>
                      <p className="text-[#4F4679] text-sm">
                        {activity.description}
                      </p>
                      <p className="text-[#4F4679] text-xs mt-1">
                        {activity.timestamp || "-"}
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
          </DashboardCard>
        </div>
      </div>
    </MainLayout>
  );
};

export default TeamLeaderDashboard;
