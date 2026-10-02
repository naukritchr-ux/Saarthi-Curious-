import React, { useEffect, useMemo, useState } from "react";
import MainLayout from "../../layout/mainLayout";
import {
  Users,
  Flame,
  Trophy,
  Snowflake,
  RefreshCw,
  Search,
  X,
  Award,
} from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const ROLE_NAMES = {
  1: "Master Admin",
  2: "Admin",
  3: "Team Leader",
  4: "Franchise Partner",
  5: "Franchise Employee",
  6: "Franchise Developer",
  7: "Head Office Staff",
};

const AdminStreakManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState("all");

  const [selectedUser, setSelectedUser] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchStreaks = async () => {
    try {
      setLoading(true);
      setError("");

      const token =
        localStorage.getItem("access_token") || localStorage.getItem("token");

      const response = await fetch(`${API_BASE_URL}/streaks/admin`, {
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {},
      });

      if (!response.ok) {
        throw new Error("Failed to fetch streak data");
      }

      const data = await response.json();

      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching admin streaks:", err);
      setError("Unable to load streak data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStreaks();
  }, []);

  const getRoleName = (roleId) => {
    return ROLE_NAMES[roleId] || `Role ${roleId}`;
  };

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const search = searchTerm.toLowerCase().trim();

      const matchesSearch =
        !search ||
        (user.name || "").toLowerCase().includes(search) ||
        (user.email || "").toLowerCase().includes(search);

      const matchesRole =
        selectedRole === "all" || String(user.role_id) === String(selectedRole);

      return matchesSearch && matchesRole;
    });
  }, [users, searchTerm, selectedRole]);

  const statistics = useMemo(() => {
    const totalUsers = users.length;

    const activeStreaks = users.filter(
      (user) => Number(user.current_streak || 0) > 0,
    ).length;

    const longestStreak =
      users.length > 0
        ? Math.max(...users.map((user) => Number(user.longest_streak || 0)))
        : 0;

    const totalFreezes = users.reduce(
      (total, user) => total + Number(user.freezes || 0),
      0,
    );

    return {
      totalUsers,
      activeStreaks,
      longestStreak,
      totalFreezes,
    };
  }, [users]);

  const formatDate = (dateValue) => {
    if (!dateValue) {
      return "Never";
    }

    try {
      const date = new Date(dateValue);

      if (Number.isNaN(date.getTime())) {
        return "Never";
      }

      return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return "Never";
    }
  };

  const handleAddFreeze = async (userId) => {
    try {
      setActionLoading(true);

      const token =
        localStorage.getItem("access_token") || localStorage.getItem("token");

      const response = await fetch(
        `${API_BASE_URL}/streaks/user/${userId}/freeze`,
        {
          method: "POST",
          headers: token
            ? {
                Authorization: `Bearer ${token}`,
              }
            : {},
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Failed to add freeze");
      }

      await fetchStreaks();

      setSelectedUser(null);
    } catch (err) {
      console.error("Error adding freeze:", err);
      alert(err.message || "Failed to add freeze");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveFreeze = async (userId) => {
    try {
      setActionLoading(true);

      const token =
        localStorage.getItem("access_token") || localStorage.getItem("token");

      const response = await fetch(
        `${API_BASE_URL}/streaks/user/${userId}/freeze/remove`,
        {
          method: "POST",
          headers: token
            ? {
                Authorization: `Bearer ${token}`,
              }
            : {},
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Failed to remove freeze");
      }

      await fetchStreaks();

      setSelectedUser(null);
    } catch (err) {
      console.error("Error removing freeze:", err);
      alert(err.message || "Failed to remove freeze");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <MainLayout>
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-[#23195A] to-[#6A3EA1] rounded-3xl p-8 text-white flex justify-between items-start mb-8 max-[700px]:flex-col max-[700px]:gap-5">
        <div>
          <p className="uppercase tracking-[6px] text-sm opacity-80 mb-3">
            Admin Panel
          </p>
          <h1 className="text-5xl font-bold mb-3 max-[700px]:text-3xl">
            Streak Management
          </h1>
          <p className="text-lg opacity-90 max-w-2xl">
            Monitor and manage learning streaks for all users.
          </p>
        </div>

        <button
          onClick={fetchStreaks}
          disabled={loading}
          className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white px-5 py-3 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
        >
          <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-100 text-red-700 rounded-3xl p-5 mb-8">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-40 bg-white rounded-3xl shadow-sm">
          <p className="text-lg text-[#1E1B4B]">Loading streak data...</p>
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid md:grid-cols-4 gap-5 mb-8">
            <StatCard
              title="Total Users"
              value={statistics.totalUsers}
              icon={<Users size={24} />}
            />
            <StatCard
              title="Active Streaks"
              value={statistics.activeStreaks}
              icon={<Flame size={24} />}
            />
            <StatCard
              title="Longest Streak"
              value={`${statistics.longestStreak} Days`}
              icon={<Trophy size={24} />}
            />
            <StatCard
              title="Total Freezes"
              value={statistics.totalFreezes}
              icon={<Snowflake size={24} />}
            />
          </div>

          {/* Filters */}
          <div className="flex gap-4 mb-6 max-[700px]:flex-col">
            <div className="flex-1 bg-white border border-gray-200 rounded-2xl h-12 flex items-center px-4 gap-3 shadow-sm">
              <Search size={18} className="text-gray-400 shrink-0" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full border-none outline-none text-sm text-[#23195A] bg-transparent placeholder:text-gray-400"
              />
            </div>

            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="w-[220px] h-12 px-4 border border-gray-200 rounded-2xl bg-white text-[#23195A] outline-none cursor-pointer shadow-sm max-[700px]:w-full"
            >
              <option value="all">All Roles</option>
              <option value="1">Master Admin</option>
              <option value="2">Admin</option>
              <option value="3">Team Leader</option>
              <option value="4">Franchise Partner</option>
              <option value="5">Franchise Employee</option>
              <option value="6">Franchise Developer</option>
              <option value="7">Head Office Staff</option>
            </select>
          </div>

          {/* Table Card */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <Award className="text-purple-600" />
                <div>
                  <h2 className="text-2xl font-bold text-[#23195A]">
                    User Streaks
                  </h2>
                  <span className="block text-sm text-gray-500 mt-1">
                    Showing {filteredUsers.length} of {users.length} users
                  </span>
                </div>
              </div>
            </div>

            {filteredUsers.length === 0 ? (
              <div className="min-h-[280px] flex flex-col items-center justify-center text-gray-500">
                <div className="text-[38px] mb-2">🔥</div>
                <h3 className="m-0 mb-1 text-[#23195A] font-bold text-lg">
                  No users found
                </h3>
                <p className="m-0 text-sm">
                  There are no users matching your search or filter.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse min-w-[1050px]">
                  <thead>
                    <tr>
                      {[
                        "User",
                        "Role",
                        "Current Streak",
                        "Longest Streak",
                        "Learning Days",
                        "Freezes",
                        "Last Active",
                        "Action",
                      ].map((head) => (
                        <th
                          key={head}
                          className="bg-gray-50 text-gray-500 text-xs font-semibold text-left px-6 py-4 border-b border-gray-100 whitespace-nowrap uppercase tracking-wider"
                        >
                          {head}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    {filteredUsers.map((user) => (
                      <tr
                        key={user.user_id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        {/* User */}
                        <td className="px-6 py-4 border-b border-gray-100 text-[#23195A] text-sm whitespace-nowrap">
                          <div className="flex items-center gap-3 min-w-[220px]">
                            <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-sm shrink-0">
                              {(user.name || "U").charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <strong className="block text-sm text-[#23195A] mb-0.5">
                                {user.name || "Unknown User"}
                              </strong>
                              <span className="block text-xs text-gray-500">
                                {user.email || "No email"}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Role */}
                        <td className="px-6 py-4 border-b border-gray-100 text-sm whitespace-nowrap">
                          <span className="bg-purple-100 text-purple-700 px-3 py-1.5 rounded-full text-xs font-semibold">
                            {getRoleName(user.role_id)}
                          </span>
                        </td>

                        {/* Current */}
                        <td className="px-6 py-4 border-b border-gray-100 text-sm whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <Flame size={16} className="text-orange-500" />
                            <strong className="text-sm text-[#23195A]">
                              {Number(user.current_streak || 0)}
                            </strong>
                            <small className="text-xs text-gray-500">
                              days
                            </small>
                          </div>
                        </td>

                        {/* Longest */}
                        <td className="px-6 py-4 border-b border-gray-100 text-sm whitespace-nowrap text-gray-600">
                          <div className="flex items-center gap-1.5">
                            <Trophy size={16} className="text-yellow-500" />
                            {Number(user.longest_streak || 0)} days
                          </div>
                        </td>

                        {/* Learning Days */}
                        <td className="px-6 py-4 border-b border-gray-100 text-sm whitespace-nowrap text-[#23195A]">
                          <strong>
                            {Number(user.total_learning_days || 0)}
                          </strong>
                        </td>

                        {/* Freezes */}
                        <td className="px-6 py-4 border-b border-gray-100 text-sm whitespace-nowrap text-gray-600">
                          <div className="flex items-center gap-1.5">
                            <Snowflake size={16} className="text-blue-500" />
                            {Number(user.freezes || 0)}
                          </div>
                        </td>

                        {/* Last Active */}
                        <td className="px-6 py-4 border-b border-gray-100 text-sm whitespace-nowrap text-gray-600">
                          {formatDate(user.last_activity_date)}
                        </td>

                        {/* Action */}
                        <td className="px-6 py-4 border-b border-gray-100 text-sm whitespace-nowrap">
                          <button
                            className="border border-purple-200 bg-white text-purple-700 px-4 py-2 rounded-xl cursor-pointer text-xs font-semibold transition-colors duration-200 hover:bg-purple-50"
                            onClick={() => setSelectedUser(user)}
                          >
                            Manage
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* Manage Modal */}
      {selectedUser && (
        <div
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4"
          onClick={() => {
            if (!actionLoading) {
              setSelectedUser(null);
            }
          }}
        >
          <div
            className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-[#693C83] text-white p-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Award size={28} />
                <div>
                  <h2 className="text-2xl font-bold">Manage Streak</h2>
                  <p className="text-white/80 text-sm">{selectedUser.name}</p>
                </div>
              </div>

              <button
                onClick={() => setSelectedUser(null)}
                disabled={actionLoading}
                className="bg-white/20 hover:bg-white/30 p-2 rounded-lg transition-colors disabled:opacity-50"
              >
                <X size={24} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-100px)]">
              {/* User Summary */}
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xl shrink-0">
                  {(selectedUser.name || "U").charAt(0).toUpperCase()}
                </div>

                <div>
                  <strong className="block text-[#23195A] mb-1">
                    {selectedUser.name}
                  </strong>
                  <span className="block text-sm text-gray-500 mb-1">
                    {selectedUser.email}
                  </span>
                  <span className="inline-block bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs font-semibold">
                    {getRoleName(selectedUser.role_id)}
                  </span>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-4 gap-3 mb-5 max-[700px]:grid-cols-2">
                <div className="bg-gray-50 rounded-2xl px-3 py-4 text-center">
                  <span className="block text-xs text-gray-500 mb-1">
                    Current
                  </span>
                  <strong className="text-lg text-[#23195A] flex items-center justify-center gap-1">
                    <Flame size={18} className="text-orange-500" />
                    {Number(selectedUser.current_streak || 0)}
                  </strong>
                </div>

                <div className="bg-gray-50 rounded-2xl px-3 py-4 text-center">
                  <span className="block text-xs text-gray-500 mb-1">
                    Longest
                  </span>
                  <strong className="text-lg text-[#23195A] flex items-center justify-center gap-1">
                    <Trophy size={18} className="text-yellow-500" />
                    {Number(selectedUser.longest_streak || 0)}
                  </strong>
                </div>

                <div className="bg-gray-50 rounded-2xl px-3 py-4 text-center">
                  <span className="block text-xs text-gray-500 mb-1">
                    Learning Days
                  </span>
                  <strong className="text-lg text-[#23195A]">
                    {Number(selectedUser.total_learning_days || 0)}
                  </strong>
                </div>

                <div className="bg-gray-50 rounded-2xl px-3 py-4 text-center">
                  <span className="block text-xs text-gray-500 mb-1">
                    Freezes
                  </span>
                  <strong className="text-lg text-[#23195A] flex items-center justify-center gap-1">
                    <Snowflake size={18} className="text-blue-500" />
                    {Number(selectedUser.freezes || 0)}
                  </strong>
                </div>
              </div>

              {/* Last Active */}
              <div className="bg-gray-50 rounded-2xl px-4 py-3 flex justify-between mb-6">
                <span className="text-sm text-gray-500">Last Active</span>
                <strong className="text-sm text-[#23195A]">
                  {formatDate(selectedUser.last_activity_date)}
                </strong>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  className="flex-1 h-12 rounded-xl cursor-pointer text-sm font-semibold border-none bg-[#693C83] text-white transition-colors hover:bg-[#5a2f6d] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  onClick={() => handleAddFreeze(selectedUser.user_id)}
                  disabled={actionLoading}
                >
                  <Snowflake size={18} />
                  Add Freeze
                </button>

                <button
                  className="flex-1 h-12 rounded-xl cursor-pointer text-sm font-semibold border border-purple-200 bg-white text-purple-700 transition-colors hover:bg-purple-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => handleRemoveFreeze(selectedUser.user_id)}
                  disabled={
                    actionLoading || Number(selectedUser.freezes || 0) <= 0
                  }
                >
                  Remove Freeze
                </button>
              </div>

              <p className="mt-4 pt-4 border-t border-gray-100 text-xs text-gray-500 leading-relaxed">
                Admins can manually adjust a user's freeze balance. Streak
                values themselves are automatically calculated from successful
                login days.
              </p>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
};

function StatCard({ title, value, icon }) {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
      <div className="flex justify-between items-center">
        <div>
          <p className="text-gray-500 text-xs">{title}</p>
          <h2 className="text-2xl font-bold text-[#23195A] mt-1">{value}</h2>
        </div>
        <div className="bg-purple-100 p-2 rounded-xl text-purple-600">
          {icon}
        </div>
      </div>
    </div>
  );
}

export default AdminStreakManagement;
