import MainLayout from "../../layout/mainLayout";
import DashboardCard from "../../components/ui/dashboardCard";
import React, { useState, useEffect } from "react";
import {
  Shield,
  Users,
  Building2,
  Briefcase,
  UserCheck,
  X,
  ChevronRight,
  LayoutDashboard,
  BookOpen,
  FileText,
  Settings,
  BarChart3,
  Plus,
  Edit2,
  Trash2,
} from "lucide-react";
import {
  getRoles,
  updateRolePermission,
  createRole,
  updateRoleName,
  deleteRole,
} from "../../services/roleApi";

const RoleManagementPage = () => {
  // Define permissions
  const permissions = [
    { id: "dashboard", name: "Dashboard", icon: <LayoutDashboard size={16} /> },
    { id: "programs", name: "Programs", icon: <BookOpen size={16} /> },
    { id: "reports", name: "Reports", icon: <FileText size={16} /> },
    { id: "analytics", name: "Analytics", icon: <BarChart3 size={16} /> },
    { id: "settings", name: "Settings", icon: <Settings size={16} /> },
  ];

  const [roles, setRoles] = useState([]);
  const [selectedRoleId, setSelectedRoleId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingRoleId, setEditingRoleId] = useState(null);
  const [editRoleName, setEditRoleName] = useState("");
  const [newRoleName, setNewRoleName] = useState("");
  const [newRolePermissions, setNewRolePermissions] = useState({
    dashboard: false,
    programs: false,
    reports: false,
    analytics: false,
    settings: false,
  });

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      const data = await getRoles();
      console.log("Roles API Response:", data);

      if (!Array.isArray(data)) {
        console.error("API is not returning an array:", data);
        return;
      }

      const formattedRoles = data.map((role) => ({
        id: role.id,
        name: role.role_name || role.name,
        permissions: {
          dashboard: role.dashboard ?? false,
          programs: role.programs ?? false,
          reports: role.reports ?? false,
          analytics: role.analytics ?? false,
          settings: role.settings ?? false,
        },
        users: role.users || [],
        icon: <Users size={24} className="text-[#693C83]" />,
        description: "",
      }));

      setRoles(formattedRoles);
    } catch (err) {
      console.error("Fetch Roles Error:", err);
    }
  };

  const toggleRolePermission = async (roleId, permissionId) => {
    const role = roles.find((r) => r.id === roleId);

    if (!role) {
      console.error("Role not found for id:", roleId);
      return;
    }

    const newValue = !role.permissions[permissionId];

    try {
      // The backend expects { permission: "name", value: true/false }
      await updateRolePermission(roleId, {
        permission: permissionId,
        value: newValue,
      });

      // Refresh roles to get updated permissions
      await fetchRoles();
    } catch (err) {
      console.error("Toggle permission error:", err);
      alert("Failed to update permission. Please try again.");
    }
  };

  const toggleUserPermission = (roleId, userId, permissionId) => {
    setRoles(
      roles.map((role) => {
        if (role.id === roleId) {
          return {
            ...role,
            users: role.users.map((user) => {
              if (user.id === userId) {
                return {
                  ...user,
                  permissions: {
                    ...user.permissions,
                    [permissionId]: !user.permissions[permissionId],
                  },
                };
              }
              return user;
            }),
          };
        }
        return role;
      }),
    );
  };

  const openRoleModal = (role) => {
    setSelectedRoleId(role.id);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setSelectedRoleId(null);
    setIsModalOpen(false);
  };

  const openCreateModal = () => {
    setNewRoleName("");
    setNewRolePermissions({
      dashboard: false,
      programs: false,
      reports: false,
      analytics: false,
      settings: false,
    });
    setIsCreateModalOpen(true);
  };

  const closeCreateModal = () => {
    setIsCreateModalOpen(false);
  };

  const handleCreateRole = async () => {
    if (!newRoleName.trim()) {
      alert("Please enter a role name");
      return;
    }

    try {
      // The API expects these exact field names
      const payload = {
        role_name: newRoleName.trim(),
        dashboard: newRolePermissions.dashboard || false,
        programs: newRolePermissions.programs || false,
        reports: newRolePermissions.reports || false,
        analytics: newRolePermissions.analytics || false,
        settings: newRolePermissions.settings || false,
      };

      console.log("Creating role with payload:", payload);

      const response = await createRole(payload);
      console.log("Create role response:", response);

      await fetchRoles();
      closeCreateModal();
      alert("Role created successfully!");
    } catch (error) {
      console.error("Error creating role:", error);
      // Show more detailed error
      const errorMessage =
        error.response?.data?.detail ||
        error.message ||
        "Failed to create role. Please try again.";
      alert(errorMessage);
    }
  };

  const openEditModal = (role) => {
    setEditingRoleId(role.id);
    setEditRoleName(role.name);
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setEditingRoleId(null);
    setEditRoleName("");
    setIsEditModalOpen(false);
  };

  const handleUpdateRoleName = async () => {
    if (!editRoleName.trim()) {
      alert("Please enter a role name");
      return;
    }

    try {
      await updateRoleName(editingRoleId, editRoleName);
      await fetchRoles();
      closeEditModal();
      alert("Role name updated successfully!");
    } catch (error) {
      console.error("Error updating role name:", error);
      alert("Failed to update role name. Please try again.");
    }
  };

  const handleDeleteRole = async (roleId) => {
    if (roleId <= 7) {
      alert("Cannot delete default system roles");
      return;
    }

    if (!confirm("Are you sure you want to delete this role?")) {
      return;
    }

    try {
      await deleteRole(roleId);
      await fetchRoles();
      alert("Role deleted successfully!");
    } catch (error) {
      console.error("Error deleting role:", error);
      alert("Failed to delete role. Please try again.");
    }
  };

  // Get current role data from roles state
  const getCurrentRole = () => {
    return roles.find((role) => role.id === selectedRoleId);
  };

  return (
    <MainLayout>
      {/* Header */}
      <h1 className="text-4xl font-bold text-[#1E1B4B]">
        Role Access Management
      </h1>

      <p className="text-[#4F4679] mt-2 mb-8">
        Manage access permissions for different user roles
      </p>

      {/* Role Permission Matrix */}
      <DashboardCard title="Role Access Matrix">
        <div className="flex justify-end mb-4">
          <button
            onClick={openCreateModal}
            className="bg-[#10B981] hover:bg-[#059669] text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors"
          >
            <Plus size={16} />
            Create New Role
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#D9CFE8]">
                <th className="text-left py-4 px-4 text-[#1E1B4B] font-semibold min-w-[200px]">
                  Role
                </th>
                {permissions.map((permission) => (
                  <th
                    key={permission.id}
                    className="text-center py-4 px-4 text-[#1E1B4B] font-semibold min-w-[120px]"
                  >
                    <div className="flex flex-col items-center gap-1">
                      {permission.icon}
                      <span className="text-sm">{permission.name}</span>
                    </div>
                  </th>
                ))}
                <th className="text-center py-4 px-4 text-[#1E1B4B] font-semibold min-w-[100px]">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {roles.map((role) => (
                <tr
                  key={role.id}
                  className="border-b border-[#D9CFE8] hover:bg-[#ECE5F2]/30 transition-colors"
                >
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-[#ECE5F2] p-2 rounded-lg">
                        {role.icon}
                      </div>
                      <div>
                        <p className="text-[#1E1B4B] font-medium">
                          {role.name}
                        </p>
                        <p className="text-[#4F4679] text-xs">
                          {role.users.length} users
                        </p>
                      </div>
                    </div>
                  </td>
                  {permissions.map((permission) => (
                    <td key={permission.id} className="text-center py-4 px-4">
                      <button
                        onClick={() =>
                          toggleRolePermission(role.id, permission.id)
                        }
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                          role.permissions[permission.id]
                            ? "bg-[#10B981]"
                            : "bg-[#D9CFE8]"
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                            role.permissions[permission.id]
                              ? "translate-x-6"
                              : "translate-x-1"
                          }`}
                        />
                      </button>
                    </td>
                  ))}
                  <td className="text-center py-4 px-4">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => openEditModal(role)}
                        className="bg-blue-100 hover:bg-blue-200 text-blue-700 p-2 rounded-lg transition-colors"
                        title="Edit Role Name"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteRole(role.id)}
                        className={`p-2 rounded-lg transition-colors ${
                          role.id <= 7
                            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                            : "bg-red-100 hover:bg-red-200 text-red-700"
                        }`}
                        title={
                          role.id <= 7
                            ? "Cannot delete default role"
                            : "Delete Role"
                        }
                        disabled={role.id <= 7}
                      >
                        <Trash2 size={16} />
                      </button>
                      <button
                        onClick={() => openRoleModal(role)}
                        className="bg-[#693C83] hover:bg-[#5a2f6f] text-white px-3 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors"
                      >
                        View Users
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DashboardCard>

      {/* User Modal */}
      {isModalOpen && selectedRoleId && getCurrentRole() && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
            {/* Modal Header */}
            <div className="bg-[#693C83] text-white p-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-lg">
                  {getCurrentRole().icon}
                </div>
                <div>
                  <h2 className="text-2xl font-bold">
                    {getCurrentRole().name}
                  </h2>
                  <p className="text-white/80 text-sm">
                    {getCurrentRole().users.length} users
                  </p>
                </div>
              </div>
              <button
                onClick={closeModal}
                className="bg-white/20 hover:bg-white/30 p-2 rounded-lg transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-100px)]">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#D9CFE8]">
                      <th className="text-left py-4 px-4 text-[#1E1B4B] font-semibold min-w-[250px]">
                        User
                      </th>
                      {permissions.map((permission) => (
                        <th
                          key={permission.id}
                          className="text-center py-4 px-4 text-[#1E1B4B] font-semibold min-w-[120px]"
                        >
                          <div className="flex flex-col items-center gap-1">
                            {permission.icon}
                            <span className="text-sm">{permission.name}</span>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {getCurrentRole().users.map((user) => (
                      <tr
                        key={user.id}
                        className="border-b border-[#D9CFE8] hover:bg-[#ECE5F2]/30 transition-colors"
                      >
                        <td className="py-4 px-4">
                          <div>
                            <p className="text-[#1E1B4B] font-medium">
                              {user.name}
                            </p>
                            <p className="text-[#4F4679] text-xs">
                              {user.email}
                            </p>
                          </div>
                        </td>
                        {permissions.map((permission) => (
                          <td
                            key={permission.id}
                            className="text-center py-4 px-4"
                          >
                            <button
                              onClick={() =>
                                toggleUserPermission(
                                  getCurrentRole().id,
                                  user.id,
                                  permission.id,
                                )
                              }
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                                user.permissions[permission.id]
                                  ? "bg-[#10B981]"
                                  : "bg-[#D9CFE8]"
                              }`}
                            >
                              <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                                  user.permissions[permission.id]
                                    ? "translate-x-6"
                                    : "translate-x-1"
                                }`}
                              />
                            </button>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Role Modal */}
      {isCreateModalOpen && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={closeCreateModal}
        >
          <div
            className="bg-white rounded-2xl max-w-md w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-[#693C83] text-white p-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-lg">
                  <Shield size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Create New Role</h2>
                  <p className="text-white/80 text-sm">
                    Define role permissions
                  </p>
                </div>
              </div>
              <button
                onClick={closeCreateModal}
                className="bg-white/20 hover:bg-white/30 p-2 rounded-lg transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role Name
                </label>
                <input
                  type="text"
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 p-3 focus:border-[#693C83] focus:ring-2 focus:ring-[#693C83]/10 outline-none transition-all"
                  placeholder="Enter role name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Permissions
                </label>
                <div className="space-y-3">
                  {permissions.map((permission) => (
                    <div
                      key={permission.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-[#693C83]">{permission.icon}</div>
                        <span className="text-sm font-medium">
                          {permission.name}
                        </span>
                      </div>
                      <button
                        onClick={() =>
                          setNewRolePermissions((prev) => ({
                            ...prev,
                            [permission.id]: !prev[permission.id],
                          }))
                        }
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                          newRolePermissions[permission.id]
                            ? "bg-[#10B981]"
                            : "bg-[#D9CFE8]"
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                            newRolePermissions[permission.id]
                              ? "translate-x-6"
                              : "translate-x-1"
                          }`}
                        />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  onClick={closeCreateModal}
                  className="px-4 py-2 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateRole}
                  className="px-4 py-2 rounded-xl bg-[#693C83] text-white font-medium hover:bg-[#5a2f6f] transition-all"
                >
                  Create Role
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Role Modal */}
      {isEditModalOpen && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={closeEditModal}
        >
          <div
            className="bg-white rounded-2xl max-w-md w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-[#693C83] text-white p-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-lg">
                  <Edit2 size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Edit Role Name</h2>
                  <p className="text-white/80 text-sm">Update the role name</p>
                </div>
              </div>
              <button
                onClick={closeEditModal}
                className="bg-white/20 hover:bg-white/30 p-2 rounded-lg transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role Name
                </label>
                <input
                  type="text"
                  value={editRoleName}
                  onChange={(e) => setEditRoleName(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 p-3 focus:border-[#693C83] focus:ring-2 focus:ring-[#693C83]/10 outline-none transition-all"
                  placeholder="Enter role name"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  onClick={closeEditModal}
                  className="px-4 py-2 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateRoleName}
                  className="px-4 py-2 rounded-xl bg-[#693C83] text-white font-medium hover:bg-[#5a2f6f] transition-all"
                >
                  Update Role
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
};

export default RoleManagementPage;
