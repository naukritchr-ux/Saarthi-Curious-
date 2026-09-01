import MainLayout from "../../layout/mainLayout";
import StatCard from "../../components/ui/statCard";
import DashboardCard from "../../components/ui/dashboardCard";
import EmployeeProgressChart from "../../components/charts/employeeProgressChart";

import {
  GraduationCap,
  PlayCircle,
  ClipboardCheck,
  Award,
} from "lucide-react";

const HeadOfficeDashboard = () => {
  return (
    <MainLayout>

      {/* Header */}

      <h1 className="text-4xl font-bold text-[#1E1B4B]">
        Head Office Dashboard
      </h1>

      <div className="bg-gradient-to-r from-[#5B3F92] via-[#4F6AA3] to-[#16B87F] rounded-2xl p-6 mt-6 mb-6 text-white">
        <h2 className="text-2xl font-bold">
          Welcome Back 👋
        </h2>

        <p className="mt-2 text-white/90">
          Continue your learning journey and complete your assigned training modules.
        </p>
      </div>

      {/* Stats */}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">

        <StatCard
          title="Learning Progress"
          value="78%"
          change="+8%"
          subtitle="Course Completion"
          icon={<GraduationCap size={26} className="text-white" />}
          iconBg="bg-[#693C83]"
        />

        <StatCard
          title="Videos Watched"
          value="54"
          change="+6"
          subtitle="Completed"
          icon={<PlayCircle size={26} className="text-white" />}
          iconBg="bg-[#3B82F6]"
        />

        <StatCard
          title="Quizzes"
          value="18"
          change="+3"
          subtitle="Passed"
          icon={<ClipboardCheck size={26} className="text-white" />}
          iconBg="bg-[#10B981]"
        />

        <StatCard
          title="Badges"
          value="7"
          change="+1"
          subtitle="Earned"
          icon={<Award size={26} className="text-white" />}
          iconBg="bg-[#F59E0B]"
        />

      </div>

      {/* Continue Learning */}

      <div className="mt-8">

        <DashboardCard title="Continue Learning">

          <div className="bg-gradient-to-r from-[#EAF3FF] to-[#D9E8FF] rounded-2xl p-6">

            <div className="flex justify-between items-center">

              <div>

                <p className="text-sm font-semibold text-[#3B82F6]">
                  CURRENT COURSE
                </p>

                <h2 className="text-3xl font-bold text-[#1E1B4B] mt-2">
                  Business Communication
                </h2>

                <p className="text-[#4F4679] mt-2">
                  Module 5 of 8
                </p>

              </div>

              <div className="text-5xl">
                💼
              </div>

            </div>

            <div className="mt-6">

              <div className="w-full bg-white h-3 rounded-full">

                <div
                  className="h-3 rounded-full bg-gradient-to-r from-[#3B82F6] to-[#10B981]"
                  style={{ width: "62%" }}
                />

              </div>

              <p className="mt-2 text-sm text-[#4F4679]">
                62% Completed
              </p>

            </div>

            <button className="mt-5 bg-[#16B87F] hover:bg-[#109E6C] text-white px-5 py-2 rounded-xl">
              Continue Learning
            </button>

          </div>

        </DashboardCard>

      </div>

      {/* Recommended Courses */}

      {/* Recommended Courses */}

      <div className="mt-6">

        <DashboardCard title="Recommended Courses">

          <div className="flex gap-6 overflow-x-auto pb-4">

            {[
              {
                category: "COMMUNICATION",
                title: "Corporate Communication",
                level: "Beginner",
                videos: "8 Videos",
                bg: "bg-[#F9F7FC]",
              },
              {
                category: "LEADERSHIP",
                title: "Leadership Skills",
                level: "Intermediate",
                videos: "12 Videos",
                bg: "bg-[#F9F7FC]",
              },
              {
                category: "PRODUCTIVITY",
                title: "MS Excel Advanced",
                level: "Advanced",
                videos: "10 Videos",
                bg: "bg-[#F9F7FC]",
              },
              {
                category: "WORKPLACE",
                title: "Workplace Productivity",
                level: "Beginner",
                videos: "6 Videos",
                bg: "bg-[#F9F7FC]",
              },
            ].map((course) => (

              <div
                key={course.title}
                className={`${course.bg} min-w-[340px] max-w-[340px] h-[420px] border border-[#D9CFE8] rounded-[32px] p-7 flex flex-col hover:shadow-xl hover:-translate-y-1 transition-all duration-300`}
              >

                <div className="flex justify-between items-start">

                  <p className="text-xs tracking-[6px] text-[#693C83]">
                    {course.category}
                  </p>

                  <span className="bg-[#FBE7D2] text-[#C96A00] px-4 py-2 rounded-full text-sm font-medium">
                    {course.level}
                  </span>

                </div>

                <h2 className="text-3xl font-bold text-[#1E1B4B] mt-8 leading-tight">
                  {course.title}
                </h2>

                <p className="text-[#5B5B7A] mt-6 text-lg">
                  Strengthen workplace skills and improve overall professional performance.
                </p>

                <div className="flex gap-3 mt-8 flex-wrap">

                  <span className="bg-white px-4 py-2 rounded-full shadow-sm">
                    {course.videos}
                  </span>

                  <span className="bg-white px-4 py-2 rounded-full shadow-sm">
                    Quiz Included
                  </span>

                </div>

                <div className="mt-auto">

                  <button className="bg-[#693C83] hover:bg-[#5B3471] text-white px-6 py-3 rounded-xl transition-all">
                    Start Learning
                  </button>

                </div>

              </div>

            ))}

          </div>

        </DashboardCard>

      </div>

      {/* Analytics */}

      <div className="mt-6">

        <DashboardCard title="Learning Analytics">

          <div className="h-[380px] bg-[#ECE5F2] rounded-xl p-4">
            <EmployeeProgressChart />
          </div>

        </DashboardCard>

      </div>

      {/* Upcoming Quiz */}

      <div className="mt-6">

        <DashboardCard title="Upcoming Quiz">

          <div className="bg-gradient-to-r from-[#FFF7D6] to-[#FFE9B3] rounded-xl p-6">

            <h3 className="text-3xl font-bold">
              Corporate Communication Quiz
            </h3>

            <p className="mt-2 text-[#4F4679]">
              Due in 2 Days
            </p>

            <button className="mt-4 bg-[#F59E0B] text-white px-5 py-2 rounded-xl">
              Start Quiz
            </button>

          </div>

        </DashboardCard>

      </div>

      {/* Quick Access */}

      <div className="mt-6">

        <DashboardCard title="Quick Access">

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

            <div className="bg-blue-50 p-6 rounded-xl text-center">
              📚
              <p className="mt-3 font-medium">Courses</p>
            </div>

            <div className="bg-green-50 p-6 rounded-xl text-center">
              📝
              <p className="mt-3 font-medium">Quizzes</p>
            </div>

            <div className="bg-yellow-50 p-6 rounded-xl text-center">
              🏅
              <p className="mt-3 font-medium">Badges</p>
            </div>

            <div className="bg-purple-50 p-6 rounded-xl text-center">
              📊
              <p className="mt-3 font-medium">Progress</p>
            </div>

          </div>

        </DashboardCard>

      </div>

      {/* Bottom Section */}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">

        <DashboardCard title="Recent Achievements">

          <div className="space-y-3">

            <div className="bg-yellow-50 p-4 rounded-xl">
              🏆 Communication Expert
            </div>

            <div className="bg-blue-50 p-4 rounded-xl">
              ⭐ Quick Learner
            </div>

            <div className="bg-green-50 p-4 rounded-xl">
              🎯 Quiz Champion
            </div>

          </div>

        </DashboardCard>

        <DashboardCard title="Recent Activity">

          <div className="space-y-3">

            <div className="bg-green-50 p-4 rounded-xl">
              ✅ Completed Excel Assessment
            </div>

            <div className="bg-blue-50 p-4 rounded-xl">
              🎥 Watched Leadership Video
            </div>

            <div className="bg-purple-50 p-4 rounded-xl">
              🏅 Earned Communication Badge
            </div>

          </div>

        </DashboardCard>

      </div>

    </MainLayout>
  );
};

export default HeadOfficeDashboard;