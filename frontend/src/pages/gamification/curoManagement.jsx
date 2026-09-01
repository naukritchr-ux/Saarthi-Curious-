import { useState, useEffect } from "react";
import MainLayout from "../../layout/mainLayout";
import DashboardCard from "../../components/ui/dashboardCard";
import {
  Coins,
  Users,
  Award,
  TrendingUp,
  Search,
  Crown,
  UserMinus,
} from "lucide-react";
import { curoService } from "../../services/curoService";

const getRoleName = (roleId) => {
  switch (roleId) {
    case 1:
      return "Master Admin";
    case 2:
      return "Admin";
    case 3:
      return "Team Leader";
    case 4:
      return "Franchise Partner";
    case 5:
      return "Franchise Employee";
    case 6:
      return "Franchise Developer";
    case 7:
      return "Head Office Staff";
    default:
      return "Unknown";
  }
};

const CuroManagement = () => {
  // State for program curo settings
  const [programs, setPrograms] = useState([]);
  const [programsLoading, setProgramsLoading] = useState(true);

  // State for leaderboard
  const [leaderboard, setLeaderboard] = useState([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(true);

  // State for stats
  const [stats, setStats] = useState({
    total_curos: 0,
    active_users: 0,
    avg_curos: 0,
  });
  const [statsLoading, setStatsLoading] = useState(true);

  // State for team leader rankings
  const [teamLeaderRankings, setTeamLeaderRankings] = useState([]);

  // State for filters
  const [searchQuery, setSearchQuery] = useState("");

  // Generate curo options in multiples of 5
  const curoOptions = Array.from({ length: 21 }, (_, i) => (i + 1) * 5); // 5 to 105

  // Filter leaderboard based on search
  const filteredLeaderboard = leaderboard.filter((user) => {
    const matchesSearch = user.name
      ?.toLowerCase()
      .includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  // Handle program curo change
  const handleProgramCuroChange = async (programId, newCuros) => {
    try {
      await curoService.updateProgramCuro(programId, parseInt(newCuros));
      setPrograms(
        programs.map((p) =>
          p.id === programId ? { ...p, curos: parseInt(newCuros) } : p,
        ),
      );
    } catch (error) {
      console.error("Failed to update program curo:", error);
    }
  };

  // Fetch data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch program curos
        try {
          const programCurosData = await curoService.getProgramCuros();
          setPrograms(programCurosData || []);
        } catch (err) {
          console.error("Failed to fetch program curos:", err);
          setPrograms([]);
        }
        setProgramsLoading(false);

        // Fetch leaderboard
        try {
          const leaderboardData = await curoService.getLeaderboard();
          setLeaderboard(leaderboardData || []);
        } catch (err) {
          console.error("Failed to fetch leaderboard:", err);
          setLeaderboard([]);
        }
        setLeaderboardLoading(false);

        // Fetch stats
        try {
          const statsData = await curoService.getStats();
          setStats(
            statsData || { total_curos: 0, active_users: 0, avg_curos: 0 },
          );
        } catch (err) {
          console.error("Failed to fetch stats:", err);
          setStats({ total_curos: 0, active_users: 0, avg_curos: 0 });
        }
        setStatsLoading(false);

        //fetch team leader rankings
        try {
          const rankingData = await curoService.getTeamLeaderRankings();
          console.log("API Response:", rankingData);
          setTeamLeaderRankings(rankingData);
        } catch (err) {
          console.error(err);
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
        setProgramsLoading(false);
        setLeaderboardLoading(false);
        setStatsLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <MainLayout>
      <div className="min-h-full space-y-8 bg-[#F1ECF7] text-[#1E1B4B]">
        {/* Compact Header */}
        <header className="rounded-3xl bg-gradient-to-r from-[#1E1B4B] via-[#3F2B6D] to-[#693C83] p-4 md:p-6 text-white">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold tracking-wider text-[#C4B5D4] uppercase">
                Rewards & Economy
              </p>
              <h1 className="text-2xl font-semibold md:text-3xl">
                Curo Management
              </h1>
              <p className="mt-1 text-sm text-[#F1ECF7] max-w-2xl">
                Manage rewards, configure program curos, and track user economy.
              </p>
            </div>
          </div>
        </header>

        {/* Stats Overview with distinct icon colors */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          <DashboardCard title="Total Curos in Circulation">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="p-3 sm:p-4 bg-[#693C83] rounded-xl shadow-sm flex items-center justify-center">
                <Coins size={24} className="text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl sm:text-3xl font-bold text-[#1E1B4B]">
                  {statsLoading
                    ? "..."
                    : (stats?.total_curos || 0).toLocaleString()}
                </h2>
                <p className="text-[#4F4679] text-xs sm:text-sm">
                  Across all users
                </p>
              </div>
            </div>
          </DashboardCard>

          <DashboardCard title="Active Users with Curos">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="p-3 sm:p-4 bg-[#693C83] rounded-xl shadow-sm flex items-center justify-center">
                <Users size={24} className="text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl sm:text-3xl font-bold text-[#1E1B4B]">
                  {statsLoading
                    ? "..."
                    : (stats?.active_users || 0).toLocaleString()}
                </h2>
                <p className="text-[#4F4679] text-xs sm:text-sm">
                  Active participants
                </p>
              </div>
            </div>
          </DashboardCard>

          <DashboardCard title="Avg Curos per User">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="p-3 sm:p-4 bg-[#693C83] rounded-xl shadow-sm flex items-center justify-center">
                <TrendingUp size={24} className="text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl sm:text-3xl font-bold text-[#1E1B4B]">
                  {statsLoading ? "..." : stats?.avg_curos || 0}
                </h2>
                <p className="text-[#4F4679] text-xs sm:text-sm">
                  Average balance
                </p>
              </div>
            </div>
          </DashboardCard>

          <DashboardCard title="Users with 0 Curos">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="p-3 sm:p-4 bg-[#693C83] rounded-xl shadow-sm flex items-center justify-center">
                <UserMinus size={24} className="text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl sm:text-3xl font-bold text-[#1E1B4B]">
                  {statsLoading ? "..." : stats?.zero_curos_users || 0}
                </h2>
                <p className="text-[#4F4679] text-xs sm:text-sm">
                  Inactive accounts
                </p>
              </div>
            </div>
          </DashboardCard>
        </div>

        {/* Program Curo Settings - Cleaner cards */}
        <DashboardCard title="Program Curo Configuration">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
            {programsLoading ? (
              <div className="col-span-full py-8 text-center">
                <p className="text-[#4F4679]">Loading programs...</p>
              </div>
            ) : programs.length === 0 ? (
              <div className="col-span-full py-8 text-center">
                <p className="text-[#4F4679]">
                  No program curo configurations found
                </p>
              </div>
            ) : (
              programs.map((program) => (
                <div
                  key={program.id}
                  className="bg-white rounded-xl p-4 sm:p-5 border border-[#E5DEF4] hover:border-[#693C83] transition-colors duration-300"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-[#1E1B4B] font-semibold text-base sm:text-lg">
                      {program.name}
                    </h4>
                    <Coins size={20} className="text-[#F59E0B] flex-shrink-0" />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[#4F4679] text-xs font-medium uppercase tracking-wider">
                      Reward amount
                    </label>
                    <select
                      value={program.curos}
                      onChange={(e) =>
                        handleProgramCuroChange(program.id, e.target.value)
                      }
                      className="w-full bg-white border-2 border-[#D9CFE8] rounded-lg px-3 py-2.5 text-[#1E1B4B] text-sm focus:outline-none focus:ring-2 focus:ring-[#693C83] focus:border-transparent transition-all"
                    >
                      {curoOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ))
            )}
          </div>
        </DashboardCard>

        {/* Leaderboard Section */}
        <DashboardCard title="User Leaderboard">
          {/* Section subtitle */}
          <p className="text-sm text-[#4F4679] mb-4">
            Users ranked by current Curo balance
          </p>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search
                size={18}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#4F4679]"
              />
              <input
                type="text"
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#D9CFE8] rounded-lg text-[#1E1B4B] focus:outline-none focus:ring-2 focus:ring-[#693C83] text-sm sm:text-base"
              />
            </div>
          </div>

          {/* Search result count */}
          {!leaderboardLoading && (
            <p className="text-sm text-[#4F4679] mb-3">
              {searchQuery
                ? `Showing ${filteredLeaderboard.length} of ${leaderboard.length} users`
                : `${leaderboard.length} users`}
            </p>
          )}

          {/* Leaderboard Table */}
          <div className="overflow-x-auto -mx-4 sm:mx-0 max-h-[700px] overflow-y-auto">
            <div className="inline-block min-w-full align-middle px-4 sm:px-0">
              <table className="min-w-full">
                <thead className="sticky top-0 bg-white z-10 shadow-[0_1px_0_0_#D9CFE8]">
                  <tr className="border-b border-[#D9CFE8]">
                    <th className="text-left py-3 px-2 sm:px-3 text-[#1E1B4B] font-semibold text-xs sm:text-sm w-[60px]">
                      Rank
                    </th>
                    <th className="text-left py-3 px-2 sm:px-3 text-[#1E1B4B] font-semibold text-xs sm:text-sm">
                      User
                    </th>
                    <th className="text-left py-3 px-2 sm:px-3 text-[#1E1B4B] font-semibold text-xs sm:text-sm hidden sm:table-cell">
                      Role
                    </th>
                    <th className="text-left py-3 px-2 sm:px-3 text-[#1E1B4B] font-semibold text-xs sm:text-sm hidden sm:table-cell">
                      Franchise Partner
                    </th>
                    <th className="text-right py-3 px-2 sm:px-3 text-[#1E1B4B] font-semibold text-xs sm:text-sm">
                      Curos
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboardLoading ? (
                    <tr>
                      <td
                        colSpan="5"
                        className="py-8 text-center text-[#4F4679]"
                      >
                        Loading leaderboard...
                      </td>
                    </tr>
                  ) : filteredLeaderboard.length === 0 ? (
                    <tr>
                      <td
                        colSpan="5"
                        className="py-8 text-center text-[#4F4679]"
                      >
                        <div className="flex flex-col items-center gap-2">
                          <Search size={32} className="text-[#D9CFE8]" />
                          <p>
                            {searchQuery
                              ? `No users found matching "${searchQuery}"`
                              : "No users found"}
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredLeaderboard.map((user, index) => {
                      const rank = index + 1;
                      let rankDisplay = (
                        <span className="text-[#1E1B4B] font-semibold text-sm sm:text-base">
                          #{rank}
                        </span>
                      );
                      if (rank === 1) {
                        rankDisplay = (
                          <div className="flex items-center gap-1.5">
                            <Crown
                              size={16}
                              className="text-[#F59E0B] flex-shrink-0"
                            />
                            <span className="text-[#1E1B4B] font-semibold text-sm sm:text-base">
                              #1
                            </span>
                          </div>
                        );
                      } else if (rank === 2) {
                        rankDisplay = (
                          <div className="flex items-center gap-1.5">
                            <Crown
                              size={16}
                              className="text-[#94A3B8] flex-shrink-0"
                            />
                            <span className="text-[#1E1B4B] font-semibold text-sm sm:text-base">
                              #2
                            </span>
                          </div>
                        );
                      } else if (rank === 3) {
                        rankDisplay = (
                          <div className="flex items-center gap-1.5">
                            <Crown
                              size={16}
                              className="text-[#D97706] flex-shrink-0"
                            />
                            <span className="text-[#1E1B4B] font-semibold text-sm sm:text-base">
                              #3
                            </span>
                          </div>
                        );
                      }
                      return (
                        <tr
                          key={user.user_id}
                          className="border-b border-[#D9CFE8] hover:bg-[#ECE5F2] transition-colors"
                        >
                          <td className="py-3 px-2 sm:px-3">{rankDisplay}</td>
                          <td className="py-3 px-2 sm:px-3">
                            <span className="text-[#1E1B4B] font-medium text-sm sm:text-base block truncate max-w-[120px] sm:max-w-none">
                              {user.name}
                            </span>
                          </td>
                          <td className="py-3 px-2 sm:px-3 hidden sm:table-cell">
                            <span className="text-[#4F4679] text-sm">
                              {getRoleName(user.role_id)}
                            </span>
                          </td>
                          <td className="py-3 px-2 sm:px-3 hidden sm:table-cell">
                            <span className="text-[#4F4679] text-sm">
                              {user.role_id === 5
                                ? user.reporting_manager || "Not Assigned"
                                : "-"}
                            </span>
                          </td>
                          <td className="py-3 px-2 sm:px-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <Coins
                                size={14}
                                className="text-[#F59E0B] flex-shrink-0"
                              />
                              <span className="text-[#F59E0B] font-bold text-sm sm:text-base">
                                {(user.curos || 0).toLocaleString()}
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </DashboardCard>

        {/* Team Leader Subordinate Rankings */}
        <DashboardCard title="Team Leader Performance (Subordinate Curos)">
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <div className="inline-block min-w-full align-middle px-4 sm:px-0">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-[#D9CFE8]">
                    <th className="text-left py-3 px-2 sm:px-3 text-[#1E1B4B] font-semibold text-xs sm:text-sm w-[60px]">
                      Rank
                    </th>
                    <th className="text-left py-3 px-2 sm:px-3 text-[#1E1B4B] font-semibold text-xs sm:text-sm">
                      Team Leader
                    </th>
                    <th className="text-right py-3 px-2 sm:px-3 text-[#1E1B4B] font-semibold text-xs sm:text-sm hidden md:table-cell">
                      Total Subordinate Curos
                    </th>
                    <th className="text-right py-3 px-2 sm:px-3 text-[#1E1B4B] font-semibold text-xs sm:text-sm hidden sm:table-cell">
                      Subordinates
                    </th>
                    <th className="text-right py-3 px-2 sm:px-3 text-[#1E1B4B] font-semibold text-xs sm:text-sm">
                      <div className="flex items-center justify-end gap-1.5">
                        <TrendingUp size={14} className="text-[#4F4679]" />
                        <span>Avg per Subordinate</span>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {teamLeaderRankings.length === 0 ? (
                    <tr>
                      <td
                        colSpan="5"
                        className="py-8 text-center text-[#4F4679]"
                      >
                        No team leader rankings available
                      </td>
                    </tr>
                  ) : (
                    teamLeaderRankings.map((leader, index) => {
                      const rank = index + 1;
                      let rankDisplay = (
                        <span className="text-[#1E1B4B] font-semibold text-sm sm:text-base">
                          #{rank}
                        </span>
                      );
                      if (rank === 1) {
                        rankDisplay = (
                          <div className="flex items-center gap-1.5">
                            <Crown
                              size={16}
                              className="text-[#F59E0B] flex-shrink-0"
                            />
                            <span className="text-[#1E1B4B] font-semibold text-sm sm:text-base">
                              #1
                            </span>
                          </div>
                        );
                      } else if (rank === 2) {
                        rankDisplay = (
                          <div className="flex items-center gap-1.5">
                            <Crown
                              size={16}
                              className="text-[#94A3B8] flex-shrink-0"
                            />
                            <span className="text-[#1E1B4B] font-semibold text-sm sm:text-base">
                              #2
                            </span>
                          </div>
                        );
                      } else if (rank === 3) {
                        rankDisplay = (
                          <div className="flex items-center gap-1.5">
                            <Crown
                              size={16}
                              className="text-[#D97706] flex-shrink-0"
                            />
                            <span className="text-[#1E1B4B] font-semibold text-sm sm:text-base">
                              #3
                            </span>
                          </div>
                        );
                      }
                      return (
                        <tr
                          key={leader.id}
                          className="border-b border-[#D9CFE8] hover:bg-[#ECE5F2] transition-colors"
                        >
                          <td className="py-3 px-2 sm:px-3">{rankDisplay}</td>
                          <td className="py-3 px-2 sm:px-3">
                            <span className="text-[#1E1B4B] font-medium text-sm sm:text-base block truncate max-w-[120px] sm:max-w-none">
                              {leader.name}
                            </span>
                          </td>
                          <td className="py-3 px-2 sm:px-3 text-right hidden md:table-cell">
                            <span className="text-[#10B981] font-bold text-sm sm:text-base">
                              {leader.totalSubordinateCuros.toLocaleString()}
                            </span>
                          </td>
                          <td className="py-3 px-2 sm:px-3 text-right hidden sm:table-cell">
                            <span className="text-[#4F4679] text-sm sm:text-base">
                              {leader.subordinates}
                            </span>
                          </td>
                          <td className="py-3 px-2 sm:px-3 text-right">
                            <span className="text-[#693C83] font-semibold text-sm sm:text-base">
                              {leader.subordinates > 0
                                ? Math.round(
                                    leader.totalSubordinateCuros /
                                      leader.subordinates,
                                  ).toLocaleString()
                                : 0}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </DashboardCard>
      </div>
    </MainLayout>
  );
};

export default CuroManagement;
