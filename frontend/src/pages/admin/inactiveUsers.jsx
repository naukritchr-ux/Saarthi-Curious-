import MainLayout from "../../layout/mainLayout";
import DashboardCard from "../../components/ui/dashboardCard";
import React, { useEffect, useState } from "react";
import {
  UserX,
  Trash2,
  Search,
  Mail,
  Calendar,
  Users,
  UserCheck,
  UserMinus,
  Shield,
  Crown,
  X,
} from "lucide-react";
import { API_BASE } from "../../config/api";
import { appendActorParams } from "../../utils/auditHelper";

const InactiveUsersPage = () => {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteModal, setDeleteModal] = useState(null); // { user, show }
  const currentUserRole = Number(localStorage.getItem("id"));

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("access_token") || localStorage.getItem("token");
      const response = await fetch(`${API_BASE}/users`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();

      // Sort: master admin at bottom, admins above, then by active status
      const sortedData = [...data].sort((a, b) => {
        if (a.role_id === 1 && b.role_id !== 1) return 1;
        if (b.role_id === 1 && a.role_id !== 1) return -1;
        if (a.role_id === 2 && b.role_id !== 1 && b.role_id !== 2) return -1;
        if (b.role_id === 2 && a.role_id !== 1 && a.role_id !== 2) return 1;
        if (a.is_active === b.is_active) return 0;
        return a.is_active ? -1 : 1;
      });

      setUsers(sortedData);
    } catch (error) {
      console.error(error);
    }
  };

  const toggleUserStatus = async (userId, isActive) => {
    const userToToggle = users.find((user) => user.user_id === userId);

    if (userToToggle?.role_id === 1 && isActive) {
      alert("Master Admin cannot be deactivated");
      return;
    }

    if (userToToggle?.role_id === 2 && isActive) {
      const activeAdmins = users.filter(
        (user) => user.role_id === 2 && user.is_active,
      );
      if (activeAdmins.length <= 1) {
        alert("At least one Admin must remain active");
        return;
      }
    }

    setUsers((prevUsers) =>
      prevUsers.map((user) =>
        user.user_id === userId ? { ...user, is_active: !isActive } : user,
      ),
    );

    try {
      const endpoint = isActive
        ? `${API_BASE}/users/${userId}/deactivate`
        : `${API_BASE}/users/${userId}/activate`;

      const url = appendActorParams(endpoint);
      const token = localStorage.getItem("access_token") || localStorage.getItem("token");
      await fetch(url, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (error) {
      console.error(error);
      fetchUsers();
    }
  };

  const deleteUser = async (userId) => {
    try {
      const url = appendActorParams(`${API_BASE}/users/${userId}`);
      const token = localStorage.getItem("access_token") || localStorage.getItem("token");
      await fetch(url, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setDeleteModal(null);
      fetchUsers();
    } catch (error) {
      console.error(error);
      alert("Failed to delete user. Please try again.");
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const clearSearch = () => setSearchTerm("");

  const roleMap = {
    1: "Master Admin",
    2: "Admin",
    3: "Team Leader",
    4: "Franchise Partner",
    5: "Franchise Employee",
    6: "Franchise Developer",
    7: "Head Office Staff",
  };

  const getRoleBadgeStyle = (roleId) => {
    const styles = {
      1: "bg-purple-100 text-purple-700 border-purple-200",
      2: "bg-blue-100 text-blue-700 border-blue-200",
      3: "bg-emerald-100 text-emerald-700 border-emerald-200",
      4: "bg-amber-100 text-amber-700 border-amber-200",
      5: "bg-slate-100 text-slate-700 border-slate-200",
      6: "bg-indigo-100 text-indigo-700 border-indigo-200",
      7: "bg-rose-100 text-rose-700 border-rose-200",
    };
    return (
      styles[roleId] || "bg-[#693C83]/20 text-[#693C83] border-[#693C83]/20"
    );
  };

  const getInitialsColor = (name) => {
    const colors = [
      "bg-purple-100 text-purple-700",
      "bg-blue-100 text-blue-700",
      "bg-emerald-100 text-emerald-700",
      "bg-amber-100 text-amber-700",
      "bg-rose-100 text-rose-700",
      "bg-indigo-100 text-indigo-700",
      "bg-cyan-100 text-cyan-700",
      "bg-pink-100 text-pink-700",
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  const totalUsers = users.length;
  const activeUsers = users.filter((u) => u.is_active).length;
  const inactiveUsers = users.filter((u) => !u.is_active).length;
  const activePercentage =
    totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0;
  const inactivePercentage =
    totalUsers > 0 ? Math.round((inactiveUsers / totalUsers) * 100) : 0;

  return (
    <MainLayout>
      {/* Header */}
      <h1 className="text-4xl font-bold text-[#1E1B4B]">User Access Control</h1>
      <p className="text-[#4F4679] mt-2 mb-8">
        Activate, deactivate and manage user account access
      </p>

      {/* Summary Section */}
      <DashboardCard className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Users size={20} className="text-[#693C83]" />
          <h2 className="text-lg font-semibold text-[#1E1B4B]">Summary</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-[#ECE5F2] rounded-xl p-4 text-center border-l-4 border-[#693C83]">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Users size={20} className="text-[#693C83]" />
              <p className="text-[#4F4679] text-sm">Total Users</p>
            </div>
            <h2 className="text-3xl font-bold text-[#693C83] mt-2">
              {totalUsers}
            </h2>
          </div>
          <div className="bg-[#ECE5F2] rounded-xl p-4 text-center border-l-4 border-emerald-500">
            <div className="flex items-center justify-center gap-2 mb-2">
              <UserCheck size={20} className="text-emerald-500" />
              <p className="text-[#4F4679] text-sm">Active Users</p>
            </div>
            <h2 className="text-3xl font-bold text-emerald-500 mt-2">
              {activeUsers}
            </h2>
            <p className="text-xs text-[#4F4679] mt-1">
              {activePercentage}% of total
            </p>
          </div>
          <div className="bg-[#ECE5F2] rounded-xl p-4 text-center border-l-4 border-red-500">
            <div className="flex items-center justify-center gap-2 mb-2">
              <UserMinus size={20} className="text-red-500" />
              <p className="text-[#4F4679] text-sm">Inactive Users</p>
            </div>
            <h2 className="text-3xl font-bold text-red-500 mt-2">
              {inactiveUsers}
            </h2>
            <p className="text-xs text-[#4F4679] mt-1">
              {inactivePercentage}% of total
            </p>
          </div>
        </div>
      </DashboardCard>

      {/* Users Table */}
      <div className="bg-white border border-[#D9CFE8] rounded-2xl shadow-md overflow-hidden">
        {/* Search Bar */}
        <div className="p-4 border-b border-[#D9CFE8]">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#4F4679]"
              size={20}
            />
            <input
              type="text"
              placeholder="Search users by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-10 py-3 bg-[#ECE5F2] rounded-xl text-[#1E1B4B] placeholder-[#4F4679] focus:outline-none focus:ring-2 focus:ring-[#693C83] focus:border-transparent transition-shadow"
            />
            {searchTerm && (
              <button
                onClick={clearSearch}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#4F4679] hover:text-[#1E1B4B] transition-colors focus:outline-none focus:ring-2 focus:ring-[#693C83] rounded-full p-0.5"
                aria-label="Clear search"
              >
                <X size={18} />
              </button>
            )}
          </div>
        </div>

        {/* Table Header Info */}
        <div className="px-4 py-2 border-b border-[#D9CFE8] flex justify-between items-center bg-[#FAF8FB]">
          <span className="text-sm text-[#4F4679]">
            Showing {filteredUsers.length}{" "}
            {filteredUsers.length === 1 ? "user" : "users"}
          </span>
          <div className="flex items-center gap-3 text-xs text-[#4F4679]">
            <span className="flex items-center gap-1">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              Active
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-red-500"></span>
              Inactive
            </span>
          </div>
        </div>

        {/* Table Container - Scrollable */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="sticky top-0 z-10">
              <tr className="border-b-2 border-[#D9CFE8] bg-white shadow-sm">
                <th className="text-left py-3 px-4 text-[#1E1B4B] font-semibold text-sm">
                  User
                </th>
                <th className="text-left py-3 px-4 text-[#1E1B4B] font-semibold text-sm">
                  Role
                </th>
                <th className="text-left py-3 px-4 text-[#1E1B4B] font-semibold text-sm">
                  Last Login
                </th>
                <th className="text-left py-3 px-4 text-[#1E1B4B] font-semibold text-sm">
                  Status
                </th>
                <th className="text-center py-3 px-4 text-[#1E1B4B] font-semibold text-sm">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-12 text-[#4F4679]">
                    <UserX size={48} className="mx-auto mb-4 text-[#693C83]" />
                    <p className="text-lg font-medium">
                      {users.length === 0
                        ? "No users found"
                        : "No users match your search"}
                    </p>
                    {users.length > 0 && searchTerm && (
                      <p className="text-sm mt-1">
                        Try adjusting your search terms
                      </p>
                    )}
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr
                    key={user.user_id}
                    className="border-b border-[#D9CFE8] hover:bg-[#ECE5F2]/40 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-11 w-11 items-center justify-center rounded-xl text-sm font-bold ${getInitialsColor(user.full_name)}`}
                        >
                          {user.full_name
                            .split(" ")
                            .map((part) => part[0])
                            .join("")
                            .toUpperCase()
                            .slice(0, 2)}
                        </div>
                        <div>
                          <p className="text-[#1E1B4B] font-medium flex items-center gap-1.5">
                            {user.full_name}
                            {user.role_id === 1 && (
                              <span className="inline-flex items-center gap-0.5 text-xs font-medium text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded-full border border-purple-200">
                                <Crown size={12} />
                                Protected
                              </span>
                            )}
                          </p>
                          <p className="text-[#4F4679] text-xs flex items-center gap-1">
                            <Mail size={12} />
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-medium border ${getRoleBadgeStyle(user.role_id)}`}
                      >
                        {user.role_id === 1 && (
                          <Shield size={12} className="inline mr-1" />
                        )}
                        {roleMap[user.role_id]}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {user.last_login ? (
                        <div className="flex flex-col">
                          <span className="text-sm text-[#1E1B4B]">
                            {new Date(user.last_login).toLocaleDateString(
                              "en-GB",
                              {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              },
                            )}
                          </span>
                          <span className="text-xs text-[#4F4679]">
                            {new Date(user.last_login).toLocaleTimeString(
                              "en-US",
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                                hour12: true,
                              },
                            )}
                          </span>
                        </div>
                      ) : (
                        <span className="inline-block px-2.5 py-0.5 bg-gray-100 text-gray-500 rounded-full text-xs font-medium">
                          Never logged in
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex justify-center items-center min-w-[72px] px-3 py-1 rounded-full text-xs font-semibold ${
                          user.is_active
                            ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                            : "bg-red-100 text-red-700 border border-red-200"
                        }`}
                      >
                        {user.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-3">
                        <div className="flex items-center gap-2">
                          <button
                            disabled={user.role_id === 1}
                            onClick={() =>
                              toggleUserStatus(user.user_id, user.is_active)
                            }
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#693C83] focus:ring-offset-2 ${
                              user.role_id === 1
                                ? "bg-blue-400 cursor-not-allowed opacity-70"
                                : user.is_active
                                  ? "bg-emerald-500"
                                  : "bg-gray-300"
                            }`}
                            title={
                              user.role_id === 1
                                ? "Master Admin cannot be deactivated"
                                : user.is_active
                                  ? "Click to deactivate"
                                  : "Click to activate"
                            }
                            aria-label={
                              user.role_id === 1
                                ? "Master Admin protected"
                                : user.is_active
                                  ? "Deactivate user"
                                  : "Activate user"
                            }
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                                user.role_id === 1 || user.is_active
                                  ? "translate-x-6"
                                  : "translate-x-1"
                              }`}
                            />
                          </button>
                          <span className="text-xs font-medium text-[#4F4679] min-w-[12px]">
                            {user.role_id === 1
                              ? "—"
                              : user.is_active
                                ? "On"
                                : "Off"}
                          </span>
                        </div>
                        {currentUserRole === 1 && user.role_id !== 1 && (
                          <button
                            onClick={() => setDeleteModal({ user, show: true })}
                            className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                            aria-label="Delete user"
                            title="Delete user"
                          >
                            <Trash2 size={20} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        {filteredUsers.length > 0 && (
          <div className="px-4 py-3 border-t border-[#D9CFE8] bg-[#FAF8FB] flex justify-between items-center text-xs text-[#4F4679]">
            <span>
              {filteredUsers.length}{" "}
              {filteredUsers.length === 1 ? "user" : "users"}
            </span>
            <span>
              {activeUsers} active · {inactiveUsers} inactive
            </span>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModal && deleteModal.show && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setDeleteModal(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-50 rounded-full">
                <Trash2 size={24} className="text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-[#1E1B4B]">Delete User</h3>
            </div>
            <p className="text-[#4F4679] mb-2">
              Are you sure you want to delete the following user?
            </p>
            <div className="bg-[#ECE5F2] rounded-xl p-3 mb-4">
              <p className="font-medium text-[#1E1B4B]">
                {deleteModal.user.full_name}
              </p>
              <p className="text-sm text-[#4F4679]">{deleteModal.user.email}</p>
            </div>
            <p className="text-sm text-red-600 mb-6">
              ⚠️ This action cannot be undone. All associated data will be
              permanently removed.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteModal(null)}
                className="px-4 py-2 text-sm font-medium bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteUser(deleteModal.user.user_id)}
                className="px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              >
                Delete User
              </button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
};

export default InactiveUsersPage;
