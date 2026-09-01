import MainLayout from "../../layout/mainLayout";
import StatCard from "../../components/ui/statCard";
import DashboardCard from "../../components/ui/dashboardCard";
import EmployeeQuickAccess from "./employeeQuickAccess";
import EmployeeProgressChart from "../../components/charts/employeeProgressChart";

import {
  GraduationCap,
  Award,
  Coins,
  ClipboardCheck,
} from "lucide-react";

const EmployeeDashboard = () => {
  return (
    <MainLayout>

      <h1 className="text-4xl font-bold text-[#1E1B4B]">
        Employee Dashboard
      </h1>

      <div className="bg-gradient-to-r from-[#693C83] to-[#10B981] rounded-2xl p-6 mt-6 mb-6 text-white">
        <h2 className="text-2xl font-bold">
          Welcome Back 👋
        </h2>

        <p className="mt-2 text-white/90">
          You have completed 82% of your learning journey.
          Continue Advanced Java to stay on track.
        </p>
      </div>

      {/* Stat Cards */}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">

        <StatCard
          title="Learning Progress"
          value="82%"
          change="+12%"
          subtitle="Course Completion"
          icon={<GraduationCap size={26} className="text-white" />}
          iconBg="bg-[#693C83]"
        />

        <StatCard
          title="Quizzes"
          value="28"
          change="+4"
          subtitle="Completed"
          icon={<ClipboardCheck size={26} className="text-white" />}
          iconBg="bg-[#10B981]"
        />

        <StatCard
          title="Badges"
          value="12"
          change="+2"
          subtitle="Earned"
          icon={<Award size={26} className="text-white" />}
          iconBg="bg-[#F59E0B]"
        />

        <StatCard
          title="Curos"
          value="2850"
          change="+120"
          subtitle="Total Earned"
          icon={<Coins size={26} className="text-white" />}
          iconBg="bg-[#3B82F6]"
        />

      </div>

      {/* Continue Learning */}

      <div className="mt-8">
        <DashboardCard title="Continue Learning">

          <div className="bg-gradient-to-r from-[#E0F2FE] via-[#DBEAFE] to-[#EDE9FE] rounded-2xl p-6">

            <div className="flex justify-between items-center">

              <div>

                <p className="text-sm text-[#693C83] font-semibold">
                  CURRENT COURSE
                </p>

                <h2 className="text-3xl font-bold text-[#1E1B4B] mt-2">
                  Advanced Java
                </h2>

                <p className="text-[#4F4679] mt-2">
                  Module 7 of 10
                </p>

              </div>

              <div className="text-5xl">
                📚
              </div>

            </div>

            <div className="mt-6">
              <div className="w-full bg-gray-200 h-3 rounded-full">

                <div
                  className="bg-gradient-to-r from-[#06B6D4] to-[#3B82F6] h-3 rounded-full"
                  style={{ width: "65%" }}
                />

              </div>

              <p className="mt-2 text-sm text-[#4F4679]">
                65% Completed
              </p>
            </div>

            <button className="mt-5 bg-gradient-to-r from-[#3B82F6] to-[#06B6D4] text-white px-5 py-2 rounded-xl hover:scale-105 transition-all">
              Continue Learning
            </button>

          </div>

        </DashboardCard>
      </div>

      <div className="mt-6">

        <DashboardCard title="Recommended Courses">

          <div className="flex gap-6 overflow-x-auto pb-4">

            {[
              {
                category: "WEB DEVELOPMENT",
                title: "React Development",
                level: "Intermediate",
                videos: "12 Videos",
                badge: "Recommended #1",
              },
              {
                category: "BACKEND",
                title: "Spring Boot Mastery",
                level: "Advanced",
                videos: "18 Videos",
                badge: "Recommended #2",
              },
              {
                category: "DATA ANALYTICS",
                title: "Power BI Essentials",
                level: "Beginner",
                videos: "10 Videos",
                badge: "Recommended #3",
              },
              {
                category: "ARTIFICIAL INTELLIGENCE",
                title: "AI Fundamentals",
                level: "Beginner",
                videos: "15 Videos",
                badge: "Trending",
              },
            ].map((course, index) => (

              <div
                key={course.title}
                className={`min-w-[320px] bg-gradient-to-br ${[
                    "from-blue-50 to-blue-100",
                    "from-green-50 to-green-100",
                    "from-yellow-50 to-yellow-100",
                    "from-purple-50 to-purple-100",
                  ][index % 4]
                  } border border-gray-200 rounded-3xl p-6 hover:scale-[1.02] transition-all duration-300 flex-shrink-0`}
              >

                <div className="flex justify-between items-start">

                  <p className="text-xs tracking-[4px] text-[#693C83]">
                    {course.category}
                  </p>

                  <span className="bg-[#FBE7D2] text-[#C96A00] px-4 py-1 rounded-full text-sm font-medium">
                    {course.level}
                  </span>

                </div>

                <h2 className="text-3xl font-bold text-[#1E1B4B] mt-6">
                  {course.title}
                </h2>

                <p className="text-[#4F4679] mt-4">
                  Personalized course recommendation based on your learning activity.
                </p>

                <div className="flex gap-3 mt-6">

                  <span className="bg-white px-4 py-2 rounded-full shadow">
                    {course.videos}
                  </span>

                  <span className="bg-white px-4 py-2 rounded-full shadow">
                    {course.badge}
                  </span>

                </div>

                <button className="mt-6 bg-[#693C83] text-white px-5 py-2 rounded-xl">
                  Start Learning
                </button>

              </div>

            ))}

          </div>

        </DashboardCard>

      </div>



      {/* Learning Trend + Leaderboard */}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">

        <div className="lg:col-span-2">

          <DashboardCard title="Learning & Attendance Analytics">

            <div className="bg-[#ECE5F2] rounded-2xl p-4">

              <EmployeeProgressChart />

              <div className="grid grid-cols-3 gap-3 mt-4">

                <div className="bg-white rounded-xl p-3 text-center">
                  <p className="text-sm text-gray-500">
                    Attendance
                  </p>

                  <h3 className="text-2xl font-bold text-green-600">
                    98%
                  </h3>
                </div>

                <div className="bg-white rounded-xl p-3 text-center">
                  <p className="text-sm text-gray-500">
                    Progress
                  </p>

                  <h3 className="text-2xl font-bold text-[#693C83]">
                    82%
                  </h3>
                </div>

                <div className="bg-white rounded-xl p-3 text-center">
                  <p className="text-sm text-gray-500">
                    Quizzes
                  </p>

                  <h3 className="text-2xl font-bold text-blue-600">
                    28
                  </h3>
                </div>

              </div>

            </div>

          </DashboardCard>

        </div>

        <DashboardCard title="Leaderboard">

          <div className="space-y-4">

            <div className="bg-yellow-100 border border-yellow-300 rounded-xl p-4 flex justify-between">
              <span>🥇 Rahul Verma</span>
              <span>3250 Curos</span>
            </div>

            <div className="bg-slate-200 border border-slate-300 rounded-xl p-4 flex justify-between">
              <span>🥈 Mousume</span>
              <span>2850 Curos</span>
            </div>

            <div className="bg-orange-100 border border-orange-300 rounded-xl p-4 flex justify-between">
              <span>🥉 Priya Sharma</span>
              <span>2700 Curos</span>
            </div>
            <div className="bg-gradient-to-br from-[#693C83] to-[#8B5CF6] rounded-2xl p-6 text-center text-white">

              <div className="text-5xl">
                🏆
              </div>

              <p className="mt-2 text-white/80">
                Your Rank
              </p>

              <h1 className="text-7xl font-bold mt-3">
                #2
              </h1>

              <p className="text-white/90 mt-2">
                Out of 128 Learners
              </p>

              <div className="mt-5 bg-white/20 rounded-xl p-3">
                Top 2% Performer 🚀
              </div>

            </div>

          </div>

        </DashboardCard>

      </div>

      {/* Upcoming Quiz */}

      <div className="mt-6">

        <DashboardCard title="Upcoming Quiz">

          <div className="bg-gradient-to-r from-yellow-50 to-orange-100 rounded-xl p-5">

            <h3 className="font-bold text-xl">
              Spring Boot Assessment
            </h3>

            <p className="mt-2 text-[#4F4679]">
              Due Tomorrow
            </p>

            <button className="mt-4 bg-[#F59E0B] text-white px-4 py-2 rounded-lg">
              Start Quiz
            </button>

          </div>

        </DashboardCard>

      </div>

      {/* Quick Access */}

      <div className="mt-6">

        <DashboardCard title="Quick Access">
          <EmployeeQuickAccess />
        </DashboardCard>

      </div>

      {/* Bottom Section */}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">

        <DashboardCard title="Recent Achievements">

          <div className="space-y-3">

            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 hover:scale-[1.02] transition-all">
              🏆 Quiz Master
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 hover:scale-[1.02] transition-all">
              ⭐ Fast Learner
            </div>

            <div className="bg-red-50 border border-red-200 rounded-xl p-4 hover:scale-[1.02] transition-all">
              🔥 Consistency Star
            </div>

          </div>

        </DashboardCard>

        <DashboardCard title="Curos Wallet">

          <div className="space-y-4">

            <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-4">

              <p>Total Curos</p>

              <h2 className="text-4xl font-bold mt-2">
                2,850
              </h2>

            </div>

            <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-4">

              <p>This Month</p>

              <h2 className="text-3xl font-bold text-green-500 mt-2">
                +120
              </h2>

            </div>

          </div>

        </DashboardCard>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">

        <DashboardCard title="Learning Streak">

          <div className="bg-gradient-to-br from-orange-50 to-red-100 rounded-2xl p-8 text-center">

            <div className="text-7xl animate-pulse">
              🔥
            </div>

            <h2 className="text-5xl font-bold text-[#EA580C] mt-4">
              12 Days
            </h2>

            <p className="text-[#7C2D12] mt-3 font-medium">
              Amazing consistency!
            </p>

            <div className="mt-6 bg-white/70 rounded-xl p-4">

              <p className="text-sm text-gray-600">
                Next Reward
              </p>

              <h3 className="text-xl font-bold text-[#EA580C] mt-1">
                15 Day Streak Badge
              </h3>

              <p className="text-sm text-gray-500 mt-2">
                Only 3 more days to unlock
              </p>

            </div>

          </div>

        </DashboardCard>

        <DashboardCard title="Recent Activity">

          <div className="space-y-3">

            <div className="bg-green-50 border border-green-200 p-4 rounded-xl">
              ✅ Completed React Quiz (+50 Curos)
            </div>

            <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl">
              🎥 Watched Spring Boot Video
            </div>

            <div className="bg-purple-50 border border-purple-200 p-4 rounded-xl">
              🏅 Earned Quiz Master Badge
            </div>

          </div>

        </DashboardCard>

      </div>
    </MainLayout>
  );
};

export default EmployeeDashboard;