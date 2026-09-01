// FranchiseeDashboard.jsx
import { useState, useEffect } from "react";
import MainLayout from "../../layout/mainLayout";
import StatCard from "../../components/ui/statCard";
import DashboardCard from "../../components/ui/dashboardCard";
import EngagementChart from "../../components/charts/engagementChart";
import UserDistribution from "../../components/charts/userDistribution";
import FranchiseeQuickAccess from "./franchiseeQuickAccess";
import {
  Users,
  Coins,
  Award,
  BookOpen,
  Loader2,
  CalendarDays,
  Clock3,
  CheckCircle,
  Clock,
  PlayCircle,
  TrendingUp,
  BarChart3,
  FileText,
  Trophy,
} from "lucide-react";
import api from "../../utils/axios";

const FranchiseeDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Get user info from localStorage
  const userId = localStorage.getItem("user_id");
  const userRoleId = parseInt(localStorage.getItem("role_id"));
  const userName = localStorage.getItem("user_name") || "Franchise Partner";

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/dashboard/franchisee/${userId}`, {
          params: { role_id: userRoleId },
        });
        setDashboardData(response.data);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setError(JSON.stringify(err.response?.data));
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [userId, userRoleId]);

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

  // Error state
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

  const roleName = "Franchise Partner";

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
              <span className="font-semibold">Franchise Dashboard</span>.
              Monitor employee performance, track learning progress, and manage
              your franchise operations from one centralized location.
            </p>

            {/* Today's Highlights */}
            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur transition-all duration-300 hover:bg-white/15">
                <p className="text-sm text-white/70">
                  Programs Completed Today
                </p>
                <h3 className="mt-2 text-3xl font-bold">
                  {formatNumber(
                    dashboardData?.stat_cards?.programs_completed_today
                      ?.value || 0,
                  )}
                </h3>
                <p className="mt-1 text-sm text-emerald-300">
                  Across your franchise
                </p>
              </div>

              <div className="rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur transition-all duration-300 hover:bg-white/15">
                <p className="text-sm text-white/70">Curos Earned Today</p>
                <h3 className="mt-2 text-3xl font-bold text-yellow-300">
                  {formatNumber(
                    dashboardData?.stat_cards?.curos_earned_today?.value || 0,
                  )}
                </h3>
                <p className="mt-1 text-sm text-yellow-200">
                  Reward points awarded
                </p>
              </div>

              <div className="rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur transition-all duration-300 hover:bg-white/15">
                <p className="text-sm text-white/70">Badges Earned Today</p>
                <h3 className="mt-2 text-3xl font-bold text-purple-200">
                  {formatNumber(
                    dashboardData?.stat_cards?.badges_earned_today?.value || 0,
                  )}
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

      {/* Row 1 – Franchise Overview KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mt-8">
        <StatCard
          title="Total Employees"
          value={formatNumber(
            dashboardData?.stat_cards?.total_employees?.value,
          )}
          icon={<Users size={26} className="text-white" />}
          iconBg="bg-[#693C83]"
        />

        <StatCard
          title="Curos Earned"
          value={formatNumber(
            dashboardData?.stat_cards?.total_curos_earned?.value,
          )}
          icon={<Coins size={26} className="text-white" />}
          iconBg="bg-[#693C83]"
        />

        <StatCard
          title="Completion Rate"
          value={`${dashboardData?.stat_cards?.completion_rate?.value || 0}%`}
          icon={<Award size={26} className="text-white" />}
          iconBg="bg-[#693C83]"
        />

        <StatCard
          title="Total Programs"
          value={formatNumber(dashboardData?.stat_cards?.total_programs?.value)}
          icon={<BookOpen size={26} className="text-white" />}
          iconBg="bg-[#693C83]"
        />
      </div>

      {/* Row 2 – Analytics: 8:4 split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-8">
        {/* Left (8 columns): Franchise Learning Activity */}
        <div className="lg:col-span-8">
          <DashboardCard title="Franchise Learning Activity">
            <div className="h-72 bg-[#ECE5F2] rounded-lg">
              <EngagementChart data={dashboardData?.learning_activity || []} />
            </div>
          </DashboardCard>
        </div>

        {/* Right (4 columns): Learning Status Distribution */}
        <div className="lg:col-span-4">
          <DashboardCard title="Learning Status">
            <div className="space-y-6">
              {/* Donut Chart Visualization */}
              <div className="relative w-48 h-48 mx-auto">
                <svg viewBox="0 0 100 100" className="transform -rotate-90">
                  {dashboardData?.learning_status &&
                    (() => {
                      let cumulativeAngle = 0;
                      const radius = 40;
                      const circumference = 2 * Math.PI * radius;

                      return dashboardData.learning_status.map(
                        (status, index) => {
                          const percentage = status.value / 100;
                          const strokeDasharray = circumference * percentage;
                          const strokeDashoffset =
                            circumference * (1 - percentage);
                          const startAngle = cumulativeAngle;
                          cumulativeAngle += percentage * 360;

                          return (
                            <circle
                              key={index}
                              cx="50"
                              cy="50"
                              r={radius}
                              fill="none"
                              stroke={status.color}
                              strokeWidth="15"
                              strokeDasharray={`${strokeDasharray} ${circumference - strokeDasharray}`}
                              strokeDashoffset={strokeDashoffset}
                              className="transition-all duration-1000"
                            />
                          );
                        },
                      );
                    })()}
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-[#1E1B4B]">
                      {dashboardData?.performance_metrics?.average_engagement ||
                        0}
                      %
                    </p>
                    <p className="text-xs text-[#4F4679]">Engagement</p>
                  </div>
                </div>
              </div>

              {/* Legend */}
              <div className="space-y-2">
                {dashboardData?.learning_status?.map((status, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: status.color }}
                      ></div>
                      <span className="text-sm text-[#1E1B4B]">
                        {status.label}
                      </span>
                    </div>
                    <span className="text-sm font-semibold text-[#1E1B4B]">
                      {status.value}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </DashboardCard>
        </div>
      </div>

      {/* Row 3 – Franchise Operations: 6:6 split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-8">
        {/* Left (6 columns): Quick Access */}
        <div className="lg:col-span-6">
          <DashboardCard title="Quick Access">
            <FranchiseeQuickAccess />
          </DashboardCard>
        </div>

        {/* Right (6 columns): Recent Activity */}
        <div className="lg:col-span-6">
          <DashboardCard title="Recent Employee Activity">
            <div className="space-y-4 max-h-[400px] overflow-y-auto">
              {dashboardData?.recent_activity?.length > 0 ? (
                dashboardData.recent_activity.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-3 hover:bg-[#ECE5F2] p-3 rounded-lg transition-all duration-200"
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
                      <div className="flex justify-between items-start">
                        <p className="text-[#1E1B4B] font-medium text-sm">
                          {activity.title}
                        </p>
                        <span className="text-xs text-[#4F4679]">
                          {activity.timestamp}
                        </span>
                      </div>
                      <p className="text-[#4F4679] text-sm mt-0.5">
                        {activity.description}
                      </p>
                      <p className="text-[#693C83] text-xs mt-1 font-medium">
                        👤 {activity.employee}
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

export default FranchiseeDashboard;
