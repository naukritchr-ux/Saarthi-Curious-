import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { appendActorParams } from "../../utils/auditHelper";
import api from "../../utils/axios";
import { Users, UserCheck, BriefcaseBusiness, ShieldCheck } from "lucide-react";

import MainLayout from "../../layout/mainLayout";
import DashboardCard from "../../components/ui/dashboardCard";

// Import sub-components
import UserHeader from "./userManagement/components/UserHeader";
import CreateUserPanel from "./userManagement/components/CreateUserPanel";
import UserStats from "./userManagement/components/UserStats";
import UserFilters from "./userManagement/components/UserFilters";
import UserTable from "./userManagement/components/UserTable";
import UserMobileCards from "./userManagement/components/UserMobileCards";
import UserDetailModal from "./userManagement/components/UserDetailModal";
import UserEditModal from "./userManagement/components/UserEditModal";

// Import utilities
import { getRoleName, roleFilters } from "./userManagement/utils/userUtils";
import {
  fetchUsers,
  fetchReportingManagers,
  fetchTeamLeaders,
} from "./userManagement/services/userServices";

const UserManagementPage = () => {
  // Get current user role
  const currentRoleId = parseInt(localStorage.getItem("role_id") || "1");
  const canAddUser = [1, 2, 6].includes(currentRoleId);
  const canEditUser = [1, 2].includes(currentRoleId); // Only Admin and Master Admin can edit users

  // Set page title and description based on role
  const getPageDetails = () => {
    if (currentRoleId === 3 || currentRoleId === 6) {
      return {
        title: "Team Directory",
        description:
          "View your team members, franchise partners, and their employees.",
      };
    } else if (currentRoleId === 4) {
      return {
        title: "Franchise Directory",
        description:
          "View your franchise employees and their learning progress.",
      };
    }
    return {
      title: "User Management",
      description:
        "Review workforce groups, apply role filters, and open a full-screen overview for every user.",
    };
  };

  const pageDetails = getPageDetails();

  // State
  const [query, setQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState("All");
  const [activity, setActivity] = useState("All");
  const [location, setLocation] = useState("All");
  const [selectedUser, setSelectedUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [selectedReportingManagerFilter, setSelectedReportingManagerFilter] =
    useState("All");
  const [selectedTeamLeaderFilter, setSelectedTeamLeaderFilter] =
    useState("All");
  const [showCreatePanel, setShowCreatePanel] = useState(false);

  // Form states
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [password, setPassword] = useState("");
  const [city, setCity] = useState("");
  const [reportingManager, setReportingManager] = useState("");
  const [reportingManagerId, setReportingManagerId] = useState("");
  const [teamLeaderId, setTeamLeaderId] = useState("");
  const [roleId, setRoleId] = useState(5);
  const [dateOfJoining, setDateOfJoining] = useState("");

  const [editingUser, setEditingUser] = useState(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Queries
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["admin-users"],
    queryFn: fetchUsers,
  });

  const { data: reportingManagersData } = useQuery({
    queryKey: ["reporting-managers"],
    queryFn: fetchReportingManagers,
  });

  const { data: teamLeadersData } = useQuery({
    queryKey: ["team-leaders"],
    queryFn: fetchTeamLeaders,
  });

  // Filter reporting managers based on selected role
  const filteredReportingManagers = useMemo(() => {
    if (!data) return [];

    switch (roleId) {
      case 5: // Franchise Employee → show Franchise Partners
        return data.filter((user) => user.role_id === 4 && user.is_active);
      case 4: // Franchise Partner → show Team Leader or Developer
        return data.filter(
          (user) =>
            user.role_id === (currentRoleId === 6 ? 6 : 3) && user.is_active,
        );
      case 6: // Franchise Developer → show Admins
      case 7: // Head Office Staff → show Admins
      case 3: // Team Leader → show Admins
        return data.filter((user) => user.role_id === 2 && user.is_active);
      case 2: // Admin → show Master Admin
        return data.filter((user) => user.role_id === 1 && user.is_active);
      default:
        return [];
    }
  }, [data, roleId]);

  // Auto-select reporting manager when role changes
  useEffect(() => {
    if (filteredReportingManagers.length > 0) {
      if (roleId === 2) {
        const masterAdmin = filteredReportingManagers[0];
        setReportingManagerId(masterAdmin.user_id.toString());
        setReportingManager(masterAdmin.full_name);
      } else {
        setReportingManagerId("");
        setReportingManager("");
      }
    }
  }, [roleId, filteredReportingManagers]);

  // Process users data
  useEffect(() => {
    if (data) {
      const formattedUsers = data.map((user) => ({
        id: user.user_id,
        name: user.full_name,
        email: user.email,
        location: user.city,
        Reporting_Manager: user.reporting_manager,
        Team_Leader_id: user.Team_Leader_id,
        role: getRoleName(user.role_id),
        last_login: user.last_login,
        activity: user.is_active ? "Active" : "Inactive",
        is_active: user.is_active,
        role_id: user.role_id,
        date_of_joining: user.date_of_joining,
        franchise_partner: user.role_id === 5 ? user.reporting_manager : null,
        phone: user.phone || "N/A",
        manager: user.manager || "Self-managed",
        children: user.children || [],
      }));

      // Sort users by role order
      const roleOrder = { 2: 1, 3: 2, 4: 3, 5: 4, 6: 5, 7: 6, 1: 7 };
      const sortedUsers = formattedUsers.sort((a, b) => {
        const orderA = roleOrder[a.role_id] || 99;
        const orderB = roleOrder[b.role_id] || 99;
        return orderA - orderB;
      });

      setUsers(sortedUsers);
    }
  }, [data]);

  // Get role-based filters
  const getAvailableRoleFilters = () => {
    if ([1, 2].includes(currentRoleId)) {
      // Admin/Master Admin: Show all filters
      return roleFilters;
    } else if (currentRoleId === 3 || currentRoleId === 6) {
      // Team Leader: Only show Franchise Partner and Franchise Employee
      return ["All", "Franchise Partner", "Franchise Employee"];
    } else if (currentRoleId === 4) {
      // Franchise Partner: Only show All and Franchise Employee
      return ["All", "Franchise Employee"];
    }
    return ["All"];
  };

  // Filter users based on role
  const getFilteredUsers = () => {
    let filtered = users;

    // Apply role-based visibility
    if (currentRoleId === 3 || currentRoleId === 6) {
      // Team Leader: Show only Franchise Partners and Franchise Employees
      filtered = filtered.filter(
        (user) => user.role_id === 4 || user.role_id === 5,
      );
    } else if (currentRoleId === 4) {
      // Franchise Partner: Show only Franchise Employees
      filtered = filtered.filter((user) => user.role_id === 5);
    }

    // Apply search/filter logic
    const term = query.trim().toLowerCase();
    return filtered.filter((user) => {
      const matchesQuery = [
        user.name,
        user.email,
        user.Reporting_Manager,
        user.location,
      ].some((value) => value && value.toLowerCase().includes(term));

      const matchesRole = selectedRole === "All" || user.role === selectedRole;
      const matchesActivity = activity === "All" || user.activity === activity;
      const matchesLocation = location === "All" || user.location === location;
      const matchesTeamLeader =
        selectedTeamLeaderFilter === "All" ||
        user.Team_Leader_id === parseInt(selectedTeamLeaderFilter);

      return (
        matchesQuery &&
        matchesRole &&
        matchesActivity &&
        matchesLocation &&
        matchesTeamLeader
      );
    });
  };

  const filteredUsers = getFilteredUsers();

  // Stats - Role-based
  const statCards = useMemo(() => {
    let baseStats = [];

    if ([1, 2].includes(currentRoleId)) {
      // Admin/Master Admin: Show all stats
      baseStats = [
        {
          label: "Total Users",
          value: users.filter((user) => ![1, 2].includes(user.role_id)).length,
          accent: "from-[#693C83] to-[#8B5CF6]",
          icon: Users,
        },
        {
          label: "Total Franchise Employees",
          value: users.filter((user) => user.role_id === 5).length,
          accent: "from-[#10B981] to-[#34D399]",
          icon: UserCheck,
        },
        {
          label: "Total Franchise Partners",
          value: users.filter((user) => user.role_id === 4).length,
          accent: "from-[#F59E0B] to-[#FBBF24]",
          icon: BriefcaseBusiness,
        },
        {
          label: "Total Franchise Developers",
          value: users.filter((user) => user.role_id === 6).length,
          accent: "from-[#1E1B4B] to-[#312E81]",
          icon: ShieldCheck,
        },
        {
          label: "Total Head Office Staff",
          value: users.filter((user) => user.role_id === 7).length,
          accent: "from-[#1E1B4B] to-[#312E81]",
          icon: ShieldCheck,
        },
      ];
    } else if (currentRoleId === 3 || currentRoleId === 6) {
      // Team Leader: Show only relevant stats
      const franchisePartners = users.filter((user) => user.role_id === 4);
      const franchiseEmployees = users.filter((user) => user.role_id === 5);

      baseStats = [
        {
          label: "Franchise Partners",
          value: franchisePartners.length,
          accent: "from-[#F59E0B] to-[#FBBF24]",
          icon: BriefcaseBusiness,
        },
        {
          label: "Franchise Employees",
          value: franchiseEmployees.length,
          accent: "from-[#10B981] to-[#34D399]",
          icon: UserCheck,
        },
        {
          label: "Total Team Members",
          value: franchisePartners.length + franchiseEmployees.length,
          accent: "from-[#693C83] to-[#8B5CF6]",
          icon: Users,
        },
      ];
    } else if (currentRoleId === 4) {
      // Franchise Partner: Show only employee stats
      const employees = users.filter((user) => user.role_id === 5);

      baseStats = [
        {
          label: "Total Employees",
          value: employees.length,
          accent: "from-[#10B981] to-[#34D399]",
          icon: UserCheck,
        },
        {
          label: "Active Employees",
          value: employees.filter((user) => user.is_active).length,
          accent: "from-[#693C83] to-[#8B5CF6]",
          icon: Users,
        },
        {
          label: "Inactive Employees",
          value: employees.filter((user) => !user.is_active).length,
          accent: "from-[#EF4444] to-[#F87171]",
          icon: Users,
        },
      ];
    }

    return baseStats;
  }, [users, currentRoleId]);

  const locations = useMemo(
    () => ["All", ...new Set(users.map((user) => user.location))],
    [users],
  );

  // Handlers
  const handleAddUser = () => {
    setShowCreatePanel((current) => !current);
  };

  const handleSaveUser = async () => {
    try {
      setEmailError("");
      alert("User Created Successfully");
      setShowCreatePanel(false);

      const url = appendActorParams("/users");

      await api.post(url, {
        full_name: fullName,
        email: email,
        city: city,
        reporting_manager: reportingManager,
        Team_Leader_id: teamLeaderId ? parseInt(teamLeaderId) : null,
        role_id: roleId,
        password: password,
        date_of_joining: dateOfJoining,
      });

      setFullName("");
      setEmail("");
      setPassword("");
      setCity("");
      setReportingManager("");
      setReportingManagerId("");
      setTeamLeaderId("");
      setRoleId(5);
      setDateOfJoining("");
      refetch();
    } catch (error) {
      console.log("ERROR:", error);
      if (error.response?.data?.detail === "Email already exists") {
        setEmailError("Email already exists");
        return;
      }
      alert(JSON.stringify(error.response?.data));
    }
  };

  const handleAction = (type, user) => {
    if (type === "markInactive") {
      setUsers((prev) =>
        prev.map((item) =>
          item.id === user.id
            ? { ...item, status: "Inactive", activity: "Inactive" }
            : item,
        ),
      );
      return;
    }
    if (type === "delete") {
      setUsers((prev) => prev.filter((item) => item.id !== user.id));
      return;
    }
    if (type === "info") setSelectedUser(user);
    if (type === "edit" && canEditUser) openEditPanel(user);
  };

  const openEditPanel = (user) => {
    setEditingUser({
      id: user.id,
      full_name: user.name || "",
      email: user.email || "",
      city: user.location || "",
      reporting_manager: user.Reporting_Manager || "",
      Team_Leader_id: user.Team_Leader_id || "",
      role_id: user.role_id || 5,
      date_of_joining: user.date_of_joining
        ? String(user.date_of_joining).slice(0, 10)
        : "",
      password: "",
    });
  };

  const handleEditFieldChange = (field, value) => {
    setEditingUser((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;

    setIsSavingEdit(true);

    try {
      const payload = {
        full_name: editingUser.full_name,
        email: editingUser.email,
        city: editingUser.city,
        reporting_manager: editingUser.reporting_manager,
        Team_Leader_id: editingUser.Team_Leader_id
          ? parseInt(editingUser.Team_Leader_id)
          : null,
        role_id: editingUser.role_id,
        date_of_joining: editingUser.date_of_joining,
      };

      if (editingUser.password) {
        payload.password = editingUser.password;
      }

      const url = appendActorParams(`/users/${editingUser.id}`);
      await api.put(url, payload);

      alert("User Updated Successfully");
      setEditingUser(null);
      refetch();
    } catch (error) {
      console.log(error);
      alert(error?.response?.data?.detail || "Failed to update user");
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Determine if filters should be shown
  const showFilters = [1, 2].includes(currentRoleId);
  const showRoleFilters = [1, 2, 3, 6].includes(currentRoleId);
  const availableRoleFilters = getAvailableRoleFilters();

  return (
    <MainLayout>
      <div className="min-h-full space-y-6 bg-[#F1ECF7] text-[#1E1B4B]">
        {/* Header */}
        <UserHeader
          onAddUser={handleAddUser}
          canAddUser={canAddUser}
          title={pageDetails.title}
          description={pageDetails.description}
        />

        {/* Create User Panel */}
        {showCreatePanel && canAddUser && (
          <CreateUserPanel
            onClose={() => setShowCreatePanel(false)}
            onSave={handleSaveUser}
            formState={{
              fullName,
              setFullName,
              email,
              setEmail,
              emailError,
              setEmailError,
              password,
              setPassword,
              city,
              setCity,
              reportingManager,
              reportingManagerId,
              setReportingManagerId,
              setReportingManager,
              teamLeaderId,
              setTeamLeaderId,
              roleId,
              setRoleId,
              dateOfJoining,
              setDateOfJoining,
            }}
            reportingManagers={filteredReportingManagers}
            teamLeaders={teamLeadersData}
          />
        )}

        {/* Loading & Error States */}
        {isLoading && (
          <div className="rounded-3xl border border-dashed border-[#D9CFE8] bg-white p-6 text-sm text-[#4F4679] shadow-sm">
            Loading user data from React Query…
          </div>
        )}
        {isError && (
          <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-sm text-red-700 shadow-sm">
            Unable to load the user dataset.
          </div>
        )}

        {/* Stats Cards */}
        <UserStats stats={statCards} />

        {/* User Directory */}
        <section className="grid grid-cols-1 gap-6">
          <DashboardCard title="User Directory">
            <div className="space-y-4 relative">
              {/* Filters - Only show for Admin/Master Admin */}
              {showFilters && (
                <UserFilters
                  query={query}
                  setQuery={setQuery}
                  activity={activity}
                  setActivity={setActivity}
                  location={location}
                  setLocation={setLocation}
                  locations={locations}
                  selectedTeamLeaderFilter={selectedTeamLeaderFilter}
                  setSelectedTeamLeaderFilter={setSelectedTeamLeaderFilter}
                  teamLeaders={teamLeadersData}
                />
              )}

              {/* Role Filter Buttons */}
              {showRoleFilters && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {availableRoleFilters.map((role) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => setSelectedRole(role)}
                      className={`rounded-full px-3 py-2 text-sm font-semibold transition ${
                        selectedRole === role
                          ? "bg-[#693C83] text-white shadow-2xl shadow-black/20"
                          : "bg-[#ECE5F2] text-[#1E1B4B] hover:bg-[#D9CFE8]"
                      }`}
                    >
                      {role}
                    </button>
                  ))}
                </div>
              )}

              {/* Desktop Table */}
              <div className="hidden overflow-auto max-h-[calc(100vh-150px)] rounded-2xl border border-[#D9CFE8] bg-white shadow-sm shadow-black/5 lg:block">
                <UserTable
                  users={filteredUsers}
                  onAction={handleAction}
                  canEditUser={canEditUser}
                />
              </div>

              {/* Mobile Cards */}
              <div className="space-y-3 lg:hidden">
                <UserMobileCards
                  users={filteredUsers}
                  onAction={handleAction}
                  canEditUser={canEditUser}
                />
              </div>

              {/* Empty State */}
              {filteredUsers.length === 0 && (
                <div className="rounded-2xl border border-dashed border-[#D9CFE8] bg-[#FAF8FD] p-6 text-center text-sm text-[#4F4679]">
                  No users match the current search, role, activity, or location
                  filters.
                </div>
              )}
            </div>
          </DashboardCard>
        </section>

        {/* Detail Modal */}
        {selectedUser && (
          <UserDetailModal
            user={selectedUser}
            onClose={() => setSelectedUser(null)}
            onSelectUser={setSelectedUser}
          />
        )}

        {/* Edit Modal */}
        {editingUser && canEditUser && (
          <UserEditModal
            user={editingUser}
            onClose={() => setEditingUser(null)}
            onSave={handleUpdateUser}
            onChange={handleEditFieldChange}
            isSaving={isSavingEdit}
            reportingManagers={reportingManagersData}
            teamLeaders={teamLeadersData}
          />
        )}
      </div>
    </MainLayout>
  );
};

export default UserManagementPage;
