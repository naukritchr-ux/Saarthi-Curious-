import MainLayout from "../../layout/mainLayout";
import DashboardCard from "../../components/ui/dashboardCard";
import React, { useState, useEffect } from "react";
import { Shield, Users, Building2, Briefcase, UserCheck, X, ChevronRight, LayoutDashboard, BookOpen, FileText, Settings, BarChart3 } from "lucide-react";
import {
  getRoles,
  updateRolePermission
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

  // Define roles with their permission access
  const [roles, setRoles] = useState([]);

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

  const [selectedRoleId, setSelectedRoleId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const toggleRolePermission = async (
    roleId,
    permissionId
  ) => {
    const role = roles.find(
      r => r.id === roleId
    );

    if (!role) {
      console.error("Role not found for id:", roleId);
      return;
    }

    const newValue = !role.permissions[permissionId];

    try {
      await updateRolePermission(
        roleId,
        permissionId,
        newValue
      );

      fetchRoles();
    } catch (err) {
      console.error("Toggle permission error:", err);
    }
  };

  const toggleUserPermission = (roleId, userId, permissionId) => {
    setRoles(roles.map(role => {
      if (role.id === roleId) {
        return {
          ...role,
          users: role.users.map(user => {
            if (user.id === userId) {
              return {
                ...user,
                permissions: {
                  ...user.permissions,
                  [permissionId]: !user.permissions[permissionId]
                }
              };
            }
            return user;
          })
        };
      }
      return role;
    }));
  };

  const openRoleModal = (role) => {
    setSelectedRoleId(role.id);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setSelectedRoleId(null);
    setIsModalOpen(false);
  };

  // Get current role data from roles state
  const getCurrentRole = () => {
    return roles.find(role => role.id === selectedRoleId);
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
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#D9CFE8]">
                <th className="text-left py-4 px-4 text-[#1E1B4B] font-semibold min-w-[200px]">
                  Role
                </th>
                {permissions.map((permission) => (
                  <th key={permission.id} className="text-center py-4 px-4 text-[#1E1B4B] font-semibold min-w-[120px]">
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
                <tr key={role.id} className="border-b border-[#D9CFE8] hover:bg-[#ECE5F2]/30 transition-colors">
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-[#ECE5F2] p-2 rounded-lg">
                        {role.icon}
                      </div>
                      <div>
                        <p className="text-[#1E1B4B] font-medium">{role.name}</p>
                        <p className="text-[#4F4679] text-xs">{role.users.length} users</p>
                      </div>
                    </div>
                  </td>
                  {permissions.map((permission) => (
                    <td key={permission.id} className="text-center py-4 px-4">
                      <button
                        onClick={() => toggleRolePermission(role.id, permission.id)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                          role.permissions[permission.id] ? 'bg-[#10B981]' : 'bg-[#D9CFE8]'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                            role.permissions[permission.id] ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </td>
                  ))}
                  <td className="text-center py-4 px-4">
                    <button
                      onClick={() => openRoleModal(role)}
                      className="bg-[#693C83] hover:bg-[#5a2f6f] text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2 mx-auto transition-colors"
                    >
                      View Users
                      <ChevronRight size={16} />
                    </button>
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
                  <h2 className="text-2xl font-bold">{getCurrentRole().name}</h2>
                  <p className="text-white/80 text-sm">{getCurrentRole().users.length} users</p>
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
                        <th key={permission.id} className="text-center py-4 px-4 text-[#1E1B4B] font-semibold min-w-[120px]">
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
                      <tr key={user.id} className="border-b border-[#D9CFE8] hover:bg-[#ECE5F2]/30 transition-colors">
                        <td className="py-4 px-4">
                          <div>
                            <p className="text-[#1E1B4B] font-medium">{user.name}</p>
                            <p className="text-[#4F4679] text-xs">{user.email}</p>
                          </div>
                        </td>
                        {permissions.map((permission) => (
                          <td key={permission.id} className="text-center py-4 px-4">
                            <button
                              onClick={() => toggleUserPermission(getCurrentRole().id, user.id, permission.id)}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                                user.permissions[permission.id] ? 'bg-[#10B981]' : 'bg-[#D9CFE8]'
                              }`}
                            >
                              <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                                  user.permissions[permission.id] ? 'translate-x-6' : 'translate-x-1'
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
    </MainLayout>
  );
};

export default RoleManagementPage;