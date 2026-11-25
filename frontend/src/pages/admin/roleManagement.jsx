import "./AttritionKpiCards.css";
/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import MainLayout from "../../layout/mainLayout";
import {
  ChevronRight,
  Shield,
  Users,
  Award,
  Flame,
  X,
  MoreHorizontal,
  Download,
  RefreshCw,
  CheckSquare,
  Square,
  Sliders,
} from "lucide-react";

const STORAGE_KEY_RBAC_ROLES = "saarthi_rbac_roles_matrix_v5";
const STORAGE_KEY_IAM_THEME = "saarthi_iam_theme_v1";

// ============================================================================
// REAL 23-USER ROSTER SNAPSHOT (SYNCED WITH TAB 1 FOR READ-ONLY ROLE ROSTERS)
// ============================================================================
const DIRECTORY_USERS = [
  { id: 3, name: "Mousume Barick", email: "snehabarick2@gmail.com", role: "Master Admin" },
  { id: 24, name: "Rashesh Doshi", email: "rashesh.doshi@talentcorner.in", role: "Master Admin" },
  { id: 1, name: "Jiya Shinde", email: "jiyashinde27052005@gmail.com", role: "Admin" },
  { id: 2, name: "Shreya Jain", email: "shreya.jain@talentcorner.in", role: "Admin" },
  { id: 4, name: "Anuj Jadhav", email: "anujjadhav3558@gmail.com", role: "Admin" },
  { id: 6, name: "Surbhi Jain", email: "surbhi.jain@talentcorner.in", role: "Team Leader" },
  { id: 10, name: "Vedika Tolani", email: "vedika.tolani@talentcorner.in", role: "Team Leader" },
  { id: 11, name: "Sasuke Uchiha", email: "sasuke.uchiha@talentcorner.in", role: "Team Leader" },
  { id: 5, name: "Amy Kaul", email: "amy.kaul@talentcorner.in", role: "Franchise Partner" },
  { id: 20, name: "Naman Jadhav", email: "naman.jadhav@talentcorner.in", role: "Franchise Partner" },
  { id: 7, name: "Atharva Lohar", email: "atharvalohar33@gmail.com", role: "Franchise Employee" },
  { id: 8, name: "Lav Chokhani", email: "bhavana.nimbalkar@talentcorner.in", role: "Franchise Employee" },
  { id: 22, name: "Sumit Jagdale", email: "sumit.jagdale@talentcorner.in", role: "Franchise Employee" },
  { id: 23, name: "Shruti Kadam", email: "shruti.kadam@talentcorner.in", role: "Franchise Employee" },
  { id: 12, name: "Priyanka Panjwani", email: "priyanka.panjwani@talentcorner.in", role: "Franchise Developer" },
  { id: 17, name: "Shlok Verma", email: "shlok.verma@talentcorner.in", role: "Franchise Developer" },
  { id: 19, name: "Vinit Pardule", email: "vinit.pardule@talentcorner.in", role: "Franchise Developer" },
  { id: 9, name: "Mama Singh", email: "mama.paltasingh@talentcorner.in", role: "Head Office Staff" },
  { id: 14, name: "Sneha Jaiswal", email: "sneha.jaiswal@talentcorner.in", role: "Head Office Staff" },
  { id: 15, name: "Parna Ghosh", email: "parna.ghosh@talentcorner.in", role: "Head Office Staff" },
  { id: 21, name: "Vedanki Jadhav", email: "vedanki.jadhav@talentcorner.in", role: "Head Office Staff" },
  { id: 13, name: "Anuj Jadhav 2", email: "anujjadhv3551@gmail.com", role: "Franchise Intern" },
  { id: 16, name: "Preshita Rane", email: "preshita.rane@talentcorner.in", role: "Franchise Intern" },
  { id: 18, name: "Rohan Navle", email: "rohan.navle@talentcorner.in", role: "Franchise Intern" },
];

const DATA_SCOPE_OPTIONS = [
  { value: "Organization", badge: "Global HQ" },
  { value: "Assigned Franchise", badge: "Franchise" },
  { value: "Assigned Team", badge: "Team Only" },
  { value: "Own Profile Only", badge: "Self Only" },
];

// ============================================================================
// INITIAL 8 ROLES (2 SYSTEM ROLES + 6 CUSTOM ROLES, 1 SECURITY FLAG)
// ============================================================================
const INITIAL_ROLES = [
  {
    id: "master-admin",
    name: "Master Admin",
    code: "MA",
    isSystem: true,
    description: "Full organization access across all modules, users, and system settings.",
    dataScope: "Organization",
    permissions: {
      dashboard: { view_dashboard: true, view_analytics: true },
      programs: { view: true, assign: true, create: true, edit: true, publish: true },
      users: { view: true, invite: true, edit: true, suspend: true },
      reports: { view: true, export_csv: true },
      settings: { view: true, manage_system: true },
    },
  },
  {
    id: "admin",
    name: "Admin",
    code: "AD",
    isSystem: true,
    description: "Operational administrator with program publishing, user lifecycle, and report export rights.",
    dataScope: "Organization",
    permissions: {
      dashboard: { view_dashboard: true, view_analytics: true },
      programs: { view: true, assign: true, create: true, edit: true, publish: true },
      users: { view: true, invite: true, edit: true, suspend: true },
      reports: { view: true, export_csv: true },
      settings: { view: true, manage_system: false },
    },
  },
  {
    id: "team-leader",
    name: "Team Leader",
    code: "TL",
    isSystem: false,
    description: "Supervises assigned team cohorts, assigns learning tracks, and monitors team telemetry.",
    dataScope: "Assigned Team",
    permissions: {
      dashboard: { view_dashboard: true, view_analytics: true },
      programs: { view: true, assign: true, create: false, edit: false, publish: false },
      users: { view: true, invite: false, edit: false, suspend: false },
      reports: { view: true, export_csv: false },
      settings: { view: false, manage_system: false },
    },
  },
  {
    id: "franchise-partner",
    name: "Franchise Partner",
    code: "FP",
    isSystem: false,
    description: "Regional franchise owner overseeing branch learners, onboarding progress, and branch reports.",
    dataScope: "Assigned Franchise",
    permissions: {
      dashboard: { view_dashboard: true, view_analytics: true },
      programs: { view: true, assign: true, create: false, edit: false, publish: false },
      // Security Flag: User Editing & Suspension enabled on restricted Franchise scope
      users: { view: true, invite: true, edit: true, suspend: true },
      reports: { view: true, export_csv: true },
      settings: { view: false, manage_system: false },
    },
  },
  {
    id: "franchise-employee",
    name: "Franchise Employee",
    code: "FE",
    isSystem: false,
    description: "Standard franchise learner access to assigned courses, quizzes, and personal dashboard.",
    dataScope: "Own Profile Only",
    permissions: {
      dashboard: { view_dashboard: true, view_analytics: false },
      programs: { view: true, assign: false, create: false, edit: false, publish: false },
      users: { view: false, invite: false, edit: false, suspend: false },
      reports: { view: false, export_csv: false },
      settings: { view: false, manage_system: false },
    },
  },
  {
    id: "franchise-developer",
    name: "Franchise Developer",
    code: "FD",
    isSystem: false,
    description: "Growth specialist managing franchise expansion tracks and regional onboarding analytics.",
    dataScope: "Assigned Franchise",
    permissions: {
      dashboard: { view_dashboard: true, view_analytics: true },
      programs: { view: true, assign: true, create: false, edit: false, publish: false },
      users: { view: true, invite: false, edit: false, suspend: false },
      reports: { view: true, export_csv: false },
      settings: { view: false, manage_system: false },
    },
  },
  {
    id: "head-office-staff",
    name: "Head Office Staff",
    code: "HO",
    isSystem: false,
    description: "Corporate HQ staff with access to internal training programs and department reports.",
    dataScope: "Assigned Team",
    permissions: {
      dashboard: { view_dashboard: true, view_analytics: false },
      programs: { view: true, assign: false, create: false, edit: false, publish: false },
      users: { view: true, invite: false, edit: false, suspend: false },
      reports: { view: true, export_csv: false },
      settings: { view: false, manage_system: false },
    },
  },
  {
    id: "franchise-intern",
    name: "Franchise Intern",
    code: "FI",
    isSystem: false,
    description: "Temporary intern role restricted strictly to assigned onboarding learning modules.",
    dataScope: "Own Profile Only",
    permissions: {
      dashboard: { view_dashboard: false, view_analytics: false },
      programs: { view: true, assign: false, create: false, edit: false, publish: false },
      users: { view: false, invite: false, edit: false, suspend: false },
      reports: { view: false, export_csv: false },
      settings: { view: false, manage_system: false },
    },
  },
];

// ============================================================================
// HELPER: DETECT SECURITY & SCOPE FLAGS
// ============================================================================
function evaluateRoleSecurityFlags(role) {
  const flags = [];
  const p = role.permissions || {};

  if (
    !role.isSystem &&
    (p.users?.edit || p.users?.suspend) &&
    role.dataScope !== "Organization"
  ) {
    flags.push({
      id: "scope_user_edit_mismatch",
      title: `${role.name} has User Editing on restricted "${role.dataScope}" Scope`,
      detail:
        "Non-admin roles scoped to a single franchise or team should not hold global Edit/Suspend User rights.",
    });
  }

  if (!role.isSystem && p.settings?.manage_system) {
    flags.push({
      id: "non_admin_system_settings",
      title: `${role.name} holds Manage System Settings privilege`,
      detail: "System settings should remain locked to System Admin roles.",
    });
  }

  return flags;
}

// ============================================================================
// 1. CENTERED ROLE EDITOR MODAL (~4xl CENTERED OVERLAY)
// ============================================================================
function RoleEditorDrawer({
  role,
  assignedUsers = [],
  onClose,
  onSaveRole,
  onDeleteRole,
  onNavigateToUsersTab,
  isLight,
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [dataScope, setDataScope] = useState("Assigned Team");
  const [permissions, setPermissions] = useState(null);
  const [confirmSaveModal, setConfirmSaveModal] = useState(null);

  useEffect(() => {
    if (!role) return;
    setName(role.name || "");
    setDescription(role.description || "");
    setDataScope(role.dataScope || "Assigned Team");
    setPermissions(JSON.parse(JSON.stringify(role.permissions)));
    setConfirmSaveModal(null);
  }, [role]);

  const liveFlags = useMemo(() => {
    if (!role || !permissions) return [];
    return evaluateRoleSecurityFlags({
      ...role,
      name,
      dataScope,
      permissions,
    });
  }, [role, name, dataScope, permissions]);

  if (!role || !permissions) return null;

  const canDelete = !role.isSystem && assignedUsers.length === 0;

  const handleTogglePerm = (moduleKey, permKey) => {
    setPermissions((prev) => ({
      ...prev,
      [moduleKey]: {
        ...prev[moduleKey],
        [permKey]: !prev[moduleKey]?.[permKey],
      },
    }));
  };

  const handleResolveFlag = () => {
    setPermissions((prev) => ({
      ...prev,
      users: {
        ...prev.users,
        edit: false,
        suspend: false,
      },
      settings: {
        ...prev.settings,
        manage_system: false,
      },
    }));
  };

  const computeChangedModules = () => {
    const changed = [];
    const labels = {
      dashboard: "Dashboard",
      programs: "Programs",
      users: "Users",
      reports: "Reports",
      settings: "Settings",
    };
    Object.keys(labels).forEach((modKey) => {
      const before = JSON.stringify(role.permissions?.[modKey] || {});
      const after = JSON.stringify(permissions?.[modKey] || {});
      if (before !== after) changed.push(labels[modKey]);
    });
    if (role.dataScope !== dataScope) changed.push(`Scope (${dataScope})`);
    return changed;
  };

  const handleTriggerSave = (e) => {
    e.preventDefault();
    const changedModules = computeChangedModules();
    if (assignedUsers.length > 0 && changedModules.length > 0) {
      setConfirmSaveModal({
        affectedCount: assignedUsers.length,
        modules: changedModules.join(", "),
      });
    } else {
      onSaveRole(role.id, {
        name: name.trim() || role.name,
        description: description.trim() || role.description,
        dataScope,
        permissions,
      });
    }
  };

  const MODULE_GROUPS = [
    {
      key: "dashboard",
      title: "Dashboard & Telemetry",
      accent: "modal-tab-border-cyan",
      creamAccent: "cream-inner-pod-cyan",
      items: [
        { key: "view_dashboard", label: "View Dashboard" },
        { key: "view_analytics", label: "View Analytics" },
      ],
    },
    {
      key: "programs",
      title: "Learning Programs",
      accent: "modal-tab-border-purple",
      creamAccent: "cream-inner-pod-purple",
      items: [
        { key: "view", label: "View" },
        { key: "assign", label: "Assign" },
        { key: "create", label: "Create" },
        { key: "edit", label: "Edit" },
        { key: "publish", label: "Publish" },
      ],
    },
    {
      key: "users",
      title: "Users & Lifecycle",
      accent: "modal-tab-border-amber",
      creamAccent: "cream-inner-pod-amber",
      items: [
        { key: "view", label: "View Directory" },
        { key: "invite", label: "Invite Users" },
        { key: "edit", label: "Edit Users" },
        { key: "suspend", label: "Suspend / Deactivate" },
      ],
    },
    {
      key: "reports",
      title: "Reports & Exports",
      accent: "modal-tab-border-emerald",
      creamAccent: "cream-inner-pod-emerald",
      items: [
        { key: "view", label: "View Reports" },
        { key: "export_csv", label: "Export CSV" },
      ],
    },
    {
      key: "settings",
      title: "System Settings",
      accent: "modal-tab-border-rose",
      creamAccent: "cream-inner-pod-rose",
      items: [
        { key: "view", label: "View Settings" },
        { key: "manage_system", label: "Manage System" },
      ],
    },
  ];

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 sm:p-6 overflow-y-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-4xl max-h-[88vh] my-auto rounded-3xl p-6 sm:p-7 overflow-y-auto flex flex-col justify-between space-y-6 border-2 shadow-[0_0_90px_rgba(34,211,238,0.22),0_28px_75px_rgba(0,0,0,0.95)] ${
          isLight
            ? "bg-[#FAF7F0] border-[#C8B99E] text-stone-900"
            : "bg-[#090E1E] border-cyan-400/75 text-slate-100"
        }`}
      >
        <form onSubmit={handleTriggerSave} className="space-y-6">
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/15 pb-4">
            <div className="flex items-center gap-3.5">
              <div
                className={`w-11 h-11 rounded-2xl font-black text-xs flex items-center justify-center shrink-0 ${
                  isLight ? "cream-pill-gold" : "polished-btn-purple"
                }`}
              >
                {role.code || role.name.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-black">
                    Editing Role: {role.name}
                  </h2>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                      role.isSystem
                        ? "polished-btn-cyan"
                        : "polished-btn-purple"
                    }`}
                  >
                    {role.isSystem ? "System Locked" : "Custom Role"}
                  </span>
                </div>
                <p className="text-xs opacity-75 mt-0.5">
                  Configure module permissions, data visibility scope, and inspect assigned members.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={!canDelete}
                onClick={() => canDelete && onDeleteRole(role)}
                title={
                  role.isSystem
                    ? "System roles cannot be deleted"
                    : assignedUsers.length > 0
                    ? `Cannot delete while ${assignedUsers.length} user(s) are assigned`
                    : "Delete Role"
                }
                className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 ${
                  canDelete
                    ? "polished-btn-rose cursor-pointer"
                    : "bg-white/5 border border-white/10 text-slate-500 cursor-not-allowed opacity-60"
                }`}
              >
                <span>🗑️</span>
                <span>Delete Role</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className={`w-9 h-9 rounded-xl flex items-center justify-center cursor-pointer ${
                  isLight ? "cream-dark-btn" : "polished-btn-slate"
                }`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Section 1: Basic Details + Security Flag Alert */}
          <div className="space-y-4 text-xs">
            <span className="text-[11px] font-black uppercase tracking-wider text-amber-300 block">
              Section 1: Role Identity &amp; Data Scope
            </span>

            {liveFlags.length > 0 && (
              <div
                className={`p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3 ${
                  isLight ? "cream-inner-pod-rose" : "modal-tab-border-rose"
                }`}
              >
                <div className="space-y-1 max-w-lg">
                  <span className="text-[10px] font-black uppercase tracking-wider text-rose-300 block">
                    ⚠️ SECURITY &amp; SCOPE FLAG DETECTED
                  </span>
                  {liveFlags.map((fl) => (
                    <div key={fl.id}>
                      <p className="text-xs font-black text-white">{fl.title}</p>
                      <p className="text-[11px] opacity-85 mt-0.5">{fl.detail}</p>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={handleResolveFlag}
                  className="polished-btn-amber px-3.5 py-2 rounded-xl text-xs font-black cursor-pointer shrink-0"
                >
                  ✓ Fix Scope Mismatch
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="font-black uppercase tracking-wider opacity-80 block mb-1">
                  Role Name *
                </label>
                <input
                  type="text"
                  required
                  disabled={role.isSystem}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={`w-full rounded-xl border px-3.5 py-2.5 font-bold outline-none ${
                    isLight
                      ? "bg-white border-stone-400 text-stone-900"
                      : "bg-[#0B1120] border-cyan-400/50 text-white focus:border-amber-300"
                  } ${role.isSystem ? "opacity-70 cursor-not-allowed" : ""}`}
                />
              </div>

              <div>
                <label className="font-black uppercase tracking-wider opacity-80 block mb-1">
                  Data Visibility Scope
                </label>
                <select
                  value={dataScope}
                  onChange={(e) => setDataScope(e.target.value)}
                  className={`w-full rounded-xl border px-3.5 py-2.5 font-bold outline-none ${
                    isLight
                      ? "bg-white border-stone-400 text-stone-900"
                      : "bg-[#0B1120] border-cyan-400/50 text-white focus:border-amber-300"
                  }`}
                >
                  <option value="Organization" className="bg-[#0B1120] text-white">
                    Organization (Global HQ)
                  </option>
                  <option
                    value="Assigned Franchise"
                    className="bg-[#0B1120] text-white"
                  >
                    Assigned Franchise
                  </option>
                  <option value="Assigned Team" className="bg-[#0B1120] text-white">
                    Assigned Team (Team Only)
                  </option>
                  <option
                    value="Own Profile Only"
                    className="bg-[#0B1120] text-white"
                  >
                    Own Profile Only (Self Only)
                  </option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="font-black uppercase tracking-wider opacity-80 block mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className={`w-full rounded-xl border px-3.5 py-2.5 font-semibold outline-none ${
                    isLight
                      ? "bg-white border-stone-400 text-stone-900"
                      : "bg-[#0B1120] border-cyan-400/50 text-white focus:border-amber-300"
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Section 2: Granular Permissions */}
          <div className="space-y-3.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-cyan-300">
                Section 2: Granular Permissions (Grouped by LMS Module)
              </span>
              <span className="text-[10.5px] opacity-75 font-semibold">
                Click any permission pill to toggle
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {MODULE_GROUPS.map((group, gIdx) => (
                <div
                  key={group.key}
                  className={`p-4 rounded-2xl space-y-2.5 ${
                    gIdx === MODULE_GROUPS.length - 1 ? "md:col-span-2" : ""
                  } ${isLight ? group.creamAccent : group.accent}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-black text-sm">{group.title}</span>
                    <span className="text-[10px] font-bold opacity-75 uppercase">
                      {
                        Object.values(permissions[group.key] || {}).filter(
                          Boolean
                        ).length
                      }{" "}
                      / {group.items.length} Active
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5">
                    {group.items.map((item) => {
                      const isChecked = Boolean(
                        permissions[group.key]?.[item.key]
                      );
                      return (
                        <button
                          key={item.key}
                          type="button"
                          onClick={() => handleTogglePerm(group.key, item.key)}
                          className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-2 cursor-pointer transition ${
                            isChecked
                              ? isLight
                                ? "cream-pill-gold"
                                : "polished-btn-emerald"
                              : isLight
                              ? "bg-white border border-stone-300 text-stone-600"
                              : "bg-[#11182E] border border-white/15 text-slate-300 hover:border-white/35"
                          }`}
                        >
                          {isChecked ? (
                            <CheckSquare className="w-3.5 h-3.5" />
                          ) : (
                            <Square className="w-3.5 h-3.5 opacity-60" />
                          )}
                          <span>{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {confirmSaveModal && (
              <div className="p-4 rounded-2xl modal-tab-border-rose space-y-3">
                <p className="text-xs font-bold text-white leading-relaxed">
                  ⚠️{" "}
                  <strong>
                    This change affects {confirmSaveModal.affectedCount} users.
                  </strong>{" "}
                  They will immediately lose/gain access to{" "}
                  <strong className="text-amber-300">
                    [{confirmSaveModal.modules}]
                  </strong>
                  . Confirm?
                </p>
                <div className="flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setConfirmSaveModal(null)}
                    className="polished-btn-slate px-3.5 py-1.5 rounded-xl text-xs font-black cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onSaveRole(role.id, {
                        name: name.trim() || role.name,
                        description: description.trim() || role.description,
                        dataScope,
                        permissions,
                      });
                      setConfirmSaveModal(null);
                    }}
                    className="polished-btn-emerald px-4 py-1.5 rounded-xl text-xs font-black cursor-pointer"
                  >
                    ✓ Confirm &amp; Apply
                  </button>
                </div>
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className={`px-6 py-2.5 rounded-xl text-xs font-black cursor-pointer ${
                  isLight ? "cream-pill-gold" : "polished-btn-amber"
                }`}
              >
                Save Role Changes
              </button>
            </div>
          </div>

          {/* Section 3: Read-Only Assigned Users */}
          <div className="space-y-3 pt-3 border-t border-white/15 text-xs">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="text-[11px] font-black uppercase tracking-wider text-purple-300 block">
                  Section 3: Assigned Users ({assignedUsers.length} Read-Only)
                </span>
                <p className="text-[11px] opacity-75">
                  Users inherit permissions from this role automatically.
                </p>
              </div>

              <button
                type="button"
                onClick={() => onNavigateToUsersTab(role)}
                className={`px-4 py-2 rounded-xl text-xs font-black cursor-pointer ${
                  isLight ? "cream-dark-btn" : "polished-btn-cyan"
                }`}
              >
                Manage Users in Directory →
              </button>
            </div>

            {assignedUsers.length === 0 ? (
              <div className="p-4 rounded-2xl bg-black/30 border border-white/10 text-xs opacity-75 text-center">
                No users are currently assigned to {role.name}.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-52 overflow-y-auto pr-1">
                {assignedUsers.map((u) => (
                  <div
                    key={u.id}
                    className={`p-3 rounded-2xl flex items-center gap-3 ${
                      isLight
                        ? "cream-inner-pod-purple"
                        : "modal-tab-border-purple"
                    }`}
                  >
                    <div
                      className={`w-9 h-9 rounded-xl font-black text-xs flex items-center justify-center shrink-0 ${
                        isLight ? "cream-pill-gold" : "polished-btn-purple"
                      }`}
                    >
                      {u.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="font-black truncate">{u.name}</div>
                      <div className="text-[10.5px] opacity-75 truncate">
                        {u.email}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================================================
// 2. CREATE NEW ROLE MODAL
// ============================================================================
function CreateRoleModal({
  isOpen,
  onClose,
  onCreateRole,
  existingRoles,
  isLight,
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [dataScope, setDataScope] = useState("Assigned Franchise");
  const [templateId, setTemplateId] = useState("scratch");

  const defaultScratchPerms = {
    dashboard: { view_dashboard: true, view_analytics: false },
    programs: {
      view: true,
      assign: false,
      create: false,
      edit: false,
      publish: false,
    },
    users: { view: false, invite: false, edit: false, suspend: false },
    reports: { view: false, export_csv: false },
    settings: { view: false, manage_system: false },
  };

  const [permissions, setPermissions] = useState(defaultScratchPerms);

  if (!isOpen) return null;

  const handleTemplateChange = (tpl) => {
    setTemplateId(tpl);
    if (tpl === "scratch") {
      setPermissions(defaultScratchPerms);
      return;
    }
    const found = existingRoles.find((r) => r.id === tpl);
    if (found) {
      setDataScope(found.dataScope);
      setPermissions(JSON.parse(JSON.stringify(found.permissions)));
    }
  };

  const handleToggleModuleQuick = (modKey) => {
    setPermissions((prev) => {
      const next = JSON.parse(JSON.stringify(prev));
      if (modKey === "dashboard") {
        next.dashboard.view_dashboard = !next.dashboard.view_dashboard;
      } else {
        next[modKey].view = !next[modKey].view;
      }
      return next;
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    const words = name.trim().split(/\s+/);
    const code =
      words.length >= 2
        ? (words[0][0] + words[1][0]).toUpperCase()
        : name.trim().slice(0, 2).toUpperCase();

    onCreateRole({
      id: `${name.trim().toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`,
      name: name.trim(),
      code,
      isSystem: false,
      description:
        description.trim() ||
        `Custom ${name.trim()} role scoped to ${dataScope}.`,
      dataScope,
      permissions,
    });
    setName("");
    setDescription("");
    onClose();
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-xl rounded-3xl p-6 space-y-5 my-auto border-2 ${
          isLight
            ? "cream-plate-surface text-stone-900"
            : "bg-[#0B1020] border-cyan-400/65 text-slate-100 shadow-2xl"
        }`}
      >
        <div className="flex items-center justify-between border-b border-white/15 pb-3.5">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-amber-300 block">
              RBAC POLICY ENGINE
            </span>
            <h3 className="text-xl font-black mt-0.5">Create New Role</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="polished-btn-slate w-8 h-8 rounded-xl flex items-center justify-center cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="font-black uppercase block mb-1">
                Role Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Regional Auditor"
                className="w-full rounded-xl bg-[#090D1A] border border-white/20 px-3.5 py-2.5 font-bold text-white outline-none focus:border-cyan-400"
              />
            </div>

            <div>
              <label className="font-black uppercase block mb-1">
                Data Scope
              </label>
              <select
                value={dataScope}
                onChange={(e) => setDataScope(e.target.value)}
                className="w-full rounded-xl bg-[#090D1A] border border-white/20 px-3.5 py-2.5 font-bold text-white outline-none"
              >
                <option value="Organization">Organization (Global HQ)</option>
                <option value="Assigned Franchise">Assigned Franchise</option>
                <option value="Assigned Team">Assigned Team</option>
                <option value="Own Profile Only">Own Profile Only</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="font-black uppercase block mb-1">
                Clone Permissions From (Optional)
              </label>
              <select
                value={templateId}
                onChange={(e) => handleTemplateChange(e.target.value)}
                className="w-full rounded-xl bg-[#090D1A] border border-white/20 px-3.5 py-2.5 font-bold text-white outline-none"
              >
                <option value="scratch">Start from scratch</option>
                <option value="admin">Clone from Admin</option>
                <option value="team-leader">Clone from Team Leader</option>
                <option value="franchise-partner">
                  Clone from Franchise Partner
                </option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="font-black uppercase block mb-1">
                Description
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Explain what members in this role are allowed to do..."
                className="w-full rounded-xl bg-[#090D1A] border border-white/20 px-3.5 py-2.5 font-semibold text-white outline-none focus:border-cyan-400"
              />
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-black/35 border border-white/10 space-y-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
              Initial Module Access (Click to Toggle):
            </span>
            <div className="flex flex-wrap gap-2">
              {[
                {
                  key: "dashboard",
                  label: "Dashboard",
                  on: permissions.dashboard?.view_dashboard,
                },
                {
                  key: "programs",
                  label: "Programs",
                  on: permissions.programs?.view,
                },
                { key: "users", label: "Users", on: permissions.users?.view },
                {
                  key: "reports",
                  label: "Reports",
                  on: permissions.reports?.view,
                },
                {
                  key: "settings",
                  label: "Settings",
                  on: permissions.settings?.view,
                },
              ].map((m) => (
                <button
                  key={m.key}
                  type="button"
                  onClick={() => handleToggleModuleQuick(m.key)}
                  className={`px-3 py-1.5 rounded-xl text-[11px] font-black cursor-pointer transition ${
                    m.on
                      ? "polished-btn-emerald"
                      : "polished-btn-slate opacity-70"
                  }`}
                >
                  {m.on ? "✅" : "❌"} {m.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-white/15">
            <button
              type="button"
              onClick={onClose}
              className="polished-btn-slate px-4 py-2.5 rounded-xl font-black cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="polished-btn-amber px-5 py-2.5 rounded-xl font-black cursor-pointer"
            >
              + Create Role
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================================================
// 3. MAIN COMPONENT: RoleManagement.jsx
//    - Full Tab Overall Background: Vivid Multi-Colour Changing & Moving Orbs
//    - 4 KPI Cards: Simple Normal Dark Background (#0A0E1C) + Glowing Coloured
//      Borders (Purple, Cyan, Amber, Rose) — Zero Metallic Glare!
//    - Role Tabs Grid: Exact Cloned Candidate Attrition User Tabs
//      (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4`, `perm-user-tab-*`,
//      `rounded-3xl p-5 space-y-4`, 3 inner metric pods, bottom pill + Inspect)
// ============================================================================
export default function RoleManagement() {
  const navigate = useNavigate();

  const [themeMode, setThemeMode] = useState(
    () => localStorage.getItem(STORAGE_KEY_IAM_THEME) || "dark"
  );
  const isLight = themeMode === "cream";

  const handleToggleTheme = () => {
    setThemeMode((prev) => {
      const next = prev === "dark" ? "cream" : "dark";
      try {
        localStorage.setItem(STORAGE_KEY_IAM_THEME, next);
      } catch {
        // Ignore quota
      }
      return next;
    });
  };

  const [roles, setRoles] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_RBAC_ROLES);
      return saved ? JSON.parse(saved) : INITIAL_ROLES;
    } catch {
      return INITIAL_ROLES;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_RBAC_ROLES, JSON.stringify(roles));
    } catch {
      // Ignore quota
    }
  }, [roles]);

  // Filter & UI State
  const [kpiFilter, setKpiFilter] = useState("ALL"); // 'ALL' | 'SYSTEM' | 'CUSTOM' | 'FLAGS'
  const [scopeFilter, setScopeFilter] = useState("All Scopes");
  const [searchRole, setSearchRole] = useState("");
  const [editingRoleId, setEditingRoleId] = useState(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [openMenuRoleId, setOpenMenuRoleId] = useState(null);
  const [headerOverflowOpen, setHeaderOverflowOpen] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3600);
  };

  // Enrich Roles with Assigned User Counts, Module Counts & Security Flags
  const enrichedRoles = useMemo(() => {
    return roles.map((r) => {
      const assignedUsers = DIRECTORY_USERS.filter(
        (u) => u.role.toLowerCase() === r.name.toLowerCase()
      );
      const securityFlags = evaluateRoleSecurityFlags(r);
      const scopeMeta =
        DATA_SCOPE_OPTIONS.find((s) => s.value === r.dataScope) ||
        DATA_SCOPE_OPTIONS[2];

      const hasDashboard = Boolean(
        r.permissions?.dashboard?.view_dashboard ||
          r.permissions?.dashboard?.view_analytics
      );
      const hasPrograms = Boolean(r.permissions?.programs?.view);
      const hasUsers = Boolean(r.permissions?.users?.view);
      const hasReports = Boolean(
        r.permissions?.reports?.view || r.permissions?.reports?.export_csv
      );
      const hasSettings = Boolean(
        r.permissions?.settings?.view || r.permissions?.settings?.manage_system
      );

      const activeModulesCount = [
        hasDashboard,
        hasPrograms,
        hasUsers,
        hasReports,
        hasSettings,
      ].filter(Boolean).length;

      const totalGranularChecked = [
        ...Object.values(r.permissions?.dashboard || {}),
        ...Object.values(r.permissions?.programs || {}),
        ...Object.values(r.permissions?.users || {}),
        ...Object.values(r.permissions?.reports || {}),
        ...Object.values(r.permissions?.settings || {}),
      ].filter(Boolean).length;

      return {
        ...r,
        assignedUsers,
        userCount: assignedUsers.length,
        securityFlags,
        hasSecurityFlag: securityFlags.length > 0,
        scopeBadge: scopeMeta.badge,
        hasDashboard,
        hasPrograms,
        hasUsers,
        hasReports,
        hasSettings,
        activeModulesCount,
        totalGranularChecked,
      };
    });
  }, [roles]);

  // 4 KPI Card Counts
  const roleKpis = useMemo(() => {
    const total = enrichedRoles.length;
    const system = enrichedRoles.filter((r) => r.isSystem).length;
    const custom = enrichedRoles.filter((r) => !r.isSystem).length;
    const securityFlags = enrichedRoles.filter((r) => r.hasSecurityFlag).length;
    return { total, system, custom, securityFlags };
  }, [enrichedRoles]);

  const filteredRoles = useMemo(() => {
    return enrichedRoles.filter((r) => {
      if (kpiFilter === "SYSTEM" && !r.isSystem) return false;
      if (kpiFilter === "CUSTOM" && r.isSystem) return false;
      if (kpiFilter === "FLAGS" && !r.hasSecurityFlag) return false;

      if (scopeFilter !== "All Scopes" && r.scopeBadge !== scopeFilter)
        return false;

      if (searchRole.trim()) {
        const q = searchRole.toLowerCase();
        return (
          r.name.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q) ||
          r.scopeBadge.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [enrichedRoles, kpiFilter, scopeFilter, searchRole]);

  const activeEditingRole = useMemo(
    () => enrichedRoles.find((r) => r.id === editingRoleId) || null,
    [enrichedRoles, editingRoleId]
  );

  // Redirect to Tab 1 Filtered by Role
  const handleNavigateToUsersByRole = (role) => {
    const slug = encodeURIComponent(
      role.name.toLowerCase().replace(/\s+/g, "-")
    );
    showToast(
      `↗ Redirecting to Tab 1: Users & Access filtered by role "${role.name}"...`
    );
    try {
      navigate(`/admin/users?role=${slug}`);
    } catch {
      window.location.assign(`/admin/users?role=${slug}`);
    }
  };

  const handleSaveEditedRole = (roleId, updatedData) => {
    setRoles((prev) =>
      prev.map((r) => (r.id === roleId ? { ...r, ...updatedData } : r))
    );
    setEditingRoleId(null);
    showToast(`✓ Saved permission changes for "${updatedData.name}"!`);
  };

  const handleDuplicateRole = (sourceRole) => {
    const copy = {
      ...JSON.parse(JSON.stringify(sourceRole)),
      id: `${sourceRole.id}-copy-${Date.now()}`,
      name: `${sourceRole.name} (Copy)`,
      isSystem: false,
    };
    setRoles((prev) => [...prev, copy]);
    showToast(`📋 Duplicated "${sourceRole.name}" as a custom role!`);
  };

  const handleDeleteRole = (targetRole) => {
    if (targetRole.isSystem || targetRole.userCount > 0) return;
    setRoles((prev) => prev.filter((r) => r.id !== targetRole.id));
    setEditingRoleId(null);
    showToast(`🗑️ Deleted custom role "${targetRole.name}".`);
  };

  const handleExportRbacCSV = () => {
    const headers = [
      "Role Name,Type,Users Assigned,Data Scope,Dashboard,Programs,Users Module,Reports & Analytics,Settings,Security Flag,Description",
    ];
    const rows = enrichedRoles.map(
      (r) =>
        `"${r.name}","${r.isSystem ? "System" : "Custom"}",${r.userCount},"${
          r.scopeBadge
        }","${r.hasDashboard ? "Enabled" : "Disabled"}","${
          r.hasPrograms ? "Enabled" : "Disabled"
        }","${r.hasUsers ? "Enabled" : "Disabled"}","${
          r.hasReports ? "Enabled" : "Disabled"
        }","${r.hasSettings ? "Enabled" : "Disabled"}","${
          r.hasSecurityFlag ? r.securityFlags[0]?.title : "Clean"
        }","${r.description}"`
    );
    const blob = new Blob(["\uFEFF" + [...headers, ...rows].join("\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Saarthi_Roles_And_Permissions_Matrix_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("📊 Exported Roles & Permissions Matrix CSV!");
  };

  // Exact CandidateAttrition User Tab Variants
  const userTabDimVariants = [
    "perm-user-tab-cyan",
    "perm-user-tab-amber",
    "perm-user-tab-purple",
    "perm-user-tab-emerald",
    "perm-user-tab-rose",
  ];

  const creamTabVariants = [
    "cream-tab-purple",
    "cream-tab-cyan",
    "cream-tab-amber",
    "cream-tab-rose",
    "cream-tab-emerald",
  ];

  return (
    <MainLayout>
      <div
        onClick={() => {
          setOpenMenuRoleId(null);
          setHeaderOverflowOpen(false);
        }}
        className={`-m-4 sm:-m-6 p-5 sm:p-7 min-h-screen font-sans space-y-6 overflow-x-hidden relative transition-colors duration-300 ${
          isLight
            ? "bg-[#F5F0E6] text-stone-900 selection:bg-amber-400 selection:text-stone-950"
            : "rbac-full-tab-live-canvas text-slate-100 selection:bg-amber-400 selection:text-slate-950"
        }`}
      >
        {/* ===================================================================
            CSS ARCHITECTURE:
            1. Overall Full-Tab Background: Vivid Multi-Colour Changing & Moving
               Ambient Orbs + Spectrum Shift (`.rbac-full-tab-live-canvas`)
            2. Simple Normal Dark KPI Cards with Glowing Coloured Borders
               (`.simple-dark-kpi-purple`, `-cyan`, `-amber`, `-rose`)
            3. Exact Cloned Candidate Attrition User Tabs (`.perm-user-tab-*`
               + `.polished-btn-*`)
        =================================================================== */}
        <style>{`
          /* ===================================================================
             1. OVERALL FULL-TAB DARK BACKGROUND WITH VISIBLE MULTI-COLOUR
                CHANGING & MOVING AMBIENT ORBS
          =================================================================== */
          @keyframes fullTabGradientFlow {
            0%   { background-position: 0% 50%; }
            50%  { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }

          @keyframes fullTabOrbRoamA {
            0%   { transform: translate3d(-12%, -10%, 0) scale(1); filter: blur(60px) hue-rotate(0deg); }
            33%  { transform: translate3d(55%, 20%, 0) scale(1.28); filter: blur(60px) hue-rotate(60deg); }
            66%  { transform: translate3d(18%, 60%, 0) scale(0.95); filter: blur(60px) hue-rotate(120deg); }
            100% { transform: translate3d(-12%, -10%, 0) scale(1); filter: blur(60px) hue-rotate(0deg); }
          }

          @keyframes fullTabOrbRoamB {
            0%   { transform: translate3d(75%, -8%, 0) scale(1.12); filter: blur(60px) hue-rotate(0deg); }
            33%  { transform: translate3d(10%, 48%, 0) scale(0.92); filter: blur(60px) hue-rotate(-70deg); }
            66%  { transform: translate3d(68%, 72%, 0) scale(1.24); filter: blur(60px) hue-rotate(-140deg); }
            100% { transform: translate3d(75%, -8%, 0) scale(1.12); filter: blur(60px) hue-rotate(0deg); }
          }

          @keyframes fullTabOrbRoamC {
            0%   { transform: translate3d(30%, 75%, 0) scale(1.05); filter: blur(65px) hue-rotate(0deg); }
            50%  { transform: translate3d(-8%, 22%, 0) scale(1.3); filter: blur(65px) hue-rotate(90deg); }
            100% { transform: translate3d(30%, 75%, 0) scale(1.05); filter: blur(65px) hue-rotate(0deg); }
          }

          .rbac-full-tab-live-canvas {
            position: relative;
            isolation: isolate;
            background: linear-gradient(
              130deg,
              #090718 0%,
              #1B0D36 22%,
              #081E36 46%,
              #260E2E 72%,
              #092226 100%
            );
            background-size: 320% 320%;
            animation: fullTabGradientFlow 10s ease-in-out infinite;
          }

          .overall-live-orb-1 {
            position: fixed;
            width: 560px;
            height: 560px;
            top: 2%;
            left: 2%;
            pointer-events: none;
            z-index: 0;
            background: radial-gradient(
              circle,
              rgba(236, 72, 153, 0.46) 0%,
              rgba(168, 85, 247, 0.34) 48%,
              transparent 74%
            );
            animation: fullTabOrbRoamA 9s ease-in-out infinite;
            will-change: transform, filter;
          }

          .overall-live-orb-2 {
            position: fixed;
            width: 600px;
            height: 600px;
            top: 6%;
            right: 2%;
            pointer-events: none;
            z-index: 0;
            background: radial-gradient(
              circle,
              rgba(34, 211, 238, 0.44) 0%,
              rgba(99, 102, 241, 0.32) 48%,
              transparent 74%
            );
            animation: fullTabOrbRoamB 10.5s ease-in-out infinite;
            will-change: transform, filter;
          }

          .overall-live-orb-3 {
            position: fixed;
            width: 540px;
            height: 540px;
            bottom: 2%;
            left: 26%;
            pointer-events: none;
            z-index: 0;
            background: radial-gradient(
              circle,
              rgba(245, 158, 11, 0.4) 0%,
              rgba(16, 185, 129, 0.3) 48%,
              transparent 74%
            );
            animation: fullTabOrbRoamC 8.5s ease-in-out infinite;
            will-change: transform, filter;
          }

          /* =====================================================================
             LOGIN-STYLE LIVE GOLDEN + BASE-COLOUR BORDERS ON DEEP DARK KPI CARDS
             3 independent roaming highlights (9.4s / 13.6s / 17.4s) per card
          ===================================================================== */
          @property --k1x { syntax: "<percentage>"; inherits: false; initial-value: 14%; }
          @property --k1y { syntax: "<percentage>"; inherits: false; initial-value: 10%; }
          @property --k2x { syntax: "<percentage>"; inherits: false; initial-value: 86%; }
          @property --k2y { syntax: "<percentage>"; inherits: false; initial-value: 84%; }
          @property --k3x { syntax: "<percentage>"; inherits: false; initial-value: 50%; }
          @property --k3y { syntax: "<percentage>"; inherits: false; initial-value: 96%; }

          @keyframes kpiLoginDriftA {
            0%   { --k1x: 12%; --k1y: 8%;  }
            23%  { --k1x: 78%; --k1y: 92%; }
            49%  { --k1x: 92%; --k1y: 24%; }
            74%  { --k1x: 18%; --k1y: 80%; }
            100% { --k1x: 12%; --k1y: 8%;  }
          }

          @keyframes kpiLoginDriftB {
            0%   { --k2x: 88%; --k2y: 86%; }
            28%  { --k2x: 14%; --k2y: 42%; }
            56%  { --k2x: 68%; --k2y: 6%;  }
            82%  { --k2x: 94%; --k2y: 64%; }
            100% { --k2x: 88%; --k2y: 86%; }
          }

          @keyframes kpiLoginDriftC {
            0%   { --k3x: 48%; --k3y: 96%; }
            31%  { --k3x: 90%; --k3y: 12%; }
            63%  { --k3x: 8%;  --k3y: 88%; }
            87%  { --k3x: 34%; --k3y: 4%;  }
            100% { --k3x: 48%; --k3y: 96%; }
          }

          .login-gold-kpi {
            position: relative;
            isolation: isolate;
            overflow: hidden;
            border-radius: 1.25rem;
            border: 2.2px solid transparent;
            background-clip: padding-box, border-box, border-box, border-box, border-box;
            background-origin: padding-box, border-box, border-box, border-box, border-box;
            transition: transform 0.24s cubic-bezier(0.22, 1, 0.36, 1),
              box-shadow 0.24s ease;
          }
          .login-gold-kpi:hover {
            transform: translateY(-4px);
          }

          /* Subtle dark top-corner glass depth inside every dark card */
          .login-gold-kpi::before {
            content: "";
            position: absolute;
            inset: 0;
            pointer-events: none;
            z-index: 0;
            background: radial-gradient(
              ellipse 70% 55% at 12% 0%,
              rgba(255, 255, 255, 0.06) 0%,
              transparent 65%
            );
          }

          /* KPI 1: DEEP DARK AMETHYST BASE + LIVE GOLDEN & VIOLET BORDER */
          .kpi-dark-amethyst {
            background-image:
              linear-gradient(158deg, #130B24 0%, #0B0615 55%, #07040E 100%),
              radial-gradient(ellipse 62% 54% at var(--k1x) var(--k1y), #FFFFFF 0%, #FEF08A 24%, transparent 64%),
              radial-gradient(ellipse 68% 58% at var(--k2x) var(--k2y), #E9D5FF 0%, #A855F7 32%, transparent 66%),
              radial-gradient(ellipse 58% 58% at var(--k3x) var(--k3y), #FFFBEB 0%, #F59E0B 30%, transparent 64%),
              linear-gradient(135deg, #D4AF37 0%, #6D28D9 38%, #FDE68A 68%, #9333EA 100%);
            animation:
              kpiLoginDriftA 9.4s ease-in-out infinite,
              kpiLoginDriftB 13.6s ease-in-out infinite,
              kpiLoginDriftC 17.4s ease-in-out infinite;
            box-shadow:
              0 16px 38px rgba(0, 0, 0, 0.85),
              0 0 22px -6px rgba(245, 196, 81, 0.32),
              0 0 26px -8px rgba(168, 85, 247, 0.36);
          }
          .kpi-dark-amethyst:hover {
            box-shadow:
              0 20px 46px rgba(0, 0, 0, 0.92),
              0 0 30px -4px rgba(253, 224, 71, 0.48),
              0 0 34px -6px rgba(192, 132, 252, 0.5);
          }

          /* KPI 2: DEEP DARK SAPPHIRE BASE + LIVE GOLDEN & CYAN BORDER */
          .kpi-dark-sapphire {
            background-image:
              linear-gradient(158deg, #071526 0%, #040E1B 55%, #020811 100%),
              radial-gradient(ellipse 62% 54% at var(--k1x) var(--k1y), #FFFFFF 0%, #FEF08A 24%, transparent 64%),
              radial-gradient(ellipse 68% 58% at var(--k2x) var(--k2y), #BAE6FD 0%, #0284C7 32%, transparent 66%),
              radial-gradient(ellipse 58% 58% at var(--k3x) var(--k3y), #FFFBEB 0%, #F59E0B 30%, transparent 64%),
              linear-gradient(135deg, #D4AF37 0%, #0369A1 38%, #FDE68A 68%, #0284C7 100%);
            animation:
              kpiLoginDriftA 11.2s ease-in-out infinite,
              kpiLoginDriftB 15.4s ease-in-out infinite,
              kpiLoginDriftC 8.8s ease-in-out infinite;
            box-shadow:
              0 16px 38px rgba(0, 0, 0, 0.85),
              0 0 22px -6px rgba(245, 196, 81, 0.32),
              0 0 26px -8px rgba(14, 165, 233, 0.36);
          }
          .kpi-dark-sapphire:hover {
            box-shadow:
              0 20px 46px rgba(0, 0, 0, 0.92),
              0 0 30px -4px rgba(253, 224, 71, 0.48),
              0 0 34px -6px rgba(56, 189, 248, 0.5);
          }

          /* KPI 3: DEEP DARK BRONZE BASE + LIVE 24K GOLD BORDER */
          .kpi-dark-bronze {
            background-image:
              linear-gradient(158deg, #1C1204 0%, #120B02 55%, #0A0601 100%),
              radial-gradient(ellipse 62% 54% at var(--k1x) var(--k1y), #FFFFFF 0%, #FEF08A 24%, transparent 64%),
              radial-gradient(ellipse 68% 58% at var(--k2x) var(--k2y), #FEF08A 0%, #D97706 32%, transparent 66%),
              radial-gradient(ellipse 58% 58% at var(--k3x) var(--k3y), #FFFBEB 0%, #F59E0B 30%, transparent 64%),
              linear-gradient(135deg, #FDE68A 0%, #B45309 38%, #FFFBEB 68%, #D97706 100%);
            animation:
              kpiLoginDriftA 8.6s ease-in-out infinite,
              kpiLoginDriftB 12.8s ease-in-out infinite,
              kpiLoginDriftC 16.2s ease-in-out infinite;
            box-shadow:
              0 16px 38px rgba(0, 0, 0, 0.85),
              0 0 24px -4px rgba(245, 196, 81, 0.4),
              0 0 28px -6px rgba(217, 119, 6, 0.38);
          }
          .kpi-dark-bronze:hover {
            box-shadow:
              0 20px 46px rgba(0, 0, 0, 0.92),
              0 0 34px -2px rgba(253, 224, 71, 0.58),
              0 0 36px -4px rgba(245, 158, 11, 0.52);
          }

          /* KPI 4: DEEP DARK CRIMSON BASE + LIVE GOLDEN & CRIMSON BORDER */
          .kpi-dark-crimson {
            background-image:
              linear-gradient(158deg, #22070E 0%, #150308 55%, #0B0104 100%),
              radial-gradient(ellipse 62% 54% at var(--k1x) var(--k1y), #FFFFFF 0%, #FEF08A 24%, transparent 64%),
              radial-gradient(ellipse 68% 58% at var(--k2x) var(--k2y), #FECDD3 0%, #E11D48 32%, transparent 66%),
              radial-gradient(ellipse 58% 58% at var(--k3x) var(--k3y), #FFFBEB 0%, #F59E0B 30%, transparent 64%),
              linear-gradient(135deg, #D4AF37 0%, #9F1239 38%, #FDE68A 68%, #E11D48 100%);
            animation:
              kpiLoginDriftA 10.4s ease-in-out infinite,
              kpiLoginDriftB 14.2s ease-in-out infinite,
              kpiLoginDriftC 9.6s ease-in-out infinite;
            box-shadow:
              0 16px 38px rgba(0, 0, 0, 0.85),
              0 0 22px -6px rgba(245, 196, 81, 0.32),
              0 0 26px -8px rgba(225, 29, 72, 0.38);
          }
          .kpi-dark-crimson:hover {
            box-shadow:
              0 20px 46px rgba(0, 0, 0, 0.92),
              0 0 30px -4px rgba(253, 224, 71, 0.48),
              0 0 34px -6px rgba(251, 113, 133, 0.52);
          }

          /* ===================================================================
             3. MAIN CONTAINER: TRANSLUCENT DARK GLASS SO OVERALL LIVE COLOUR
                MOVEMENT SHOWS THROUGH BEHIND THE CARDS
          =================================================================== */
          .rbac-main-glass-section {
            position: relative;
            z-index: 10;
            background: rgba(8, 11, 24, 0.52);
            backdrop-filter: blur(14px);
            -webkit-backdrop-filter: blur(14px);
            border: 1.5px solid rgba(216, 180, 254, 0.45);
            box-shadow:
              0 18px 42px rgba(0, 0, 0, 0.82),
              inset 0 1px 2px rgba(255, 255, 255, 0.25);
          }

          /* ===================================================================
             4. EXACT CLONED CANDIDATE ATTRITION USER TABS ('.perm-user-tab-*')
                Premium 4-Sided Accent Border + Slow Shade Movement (16s Cycle)
          =================================================================== */
          @keyframes slowAccentShadeDrift {
            0% {
              background-position: 0% 0%, 100% 100%, 50% 50%;
            }
            33% {
              background-position: 100% 25%, 0% 75%, 50% 50%;
            }
            66% {
              background-position: 35% 100%, 75% 15%, 50% 50%;
            }
            100% {
              background-position: 0% 0%, 100% 100%, 50% 50%;
            }
          }

          .perm-user-tab-cyan,
          .perm-user-tab-amber,
          .perm-user-tab-purple,
          .perm-user-tab-emerald,
          .perm-user-tab-rose {
            position: relative;
            background-size: 230% 230%, 230% 230%, 100% 100% !important;
            animation: slowAccentShadeDrift 16s ease-in-out infinite !important;
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            transition: transform 0.28s cubic-bezier(0.22, 1, 0.36, 1),
              box-shadow 0.28s ease, border-color 0.28s ease !important;
          }

          /* CYAN USER TAB */
          .perm-user-tab-cyan {
            background-image:
              radial-gradient(circle at 18% 22%, rgba(34, 211, 238, 0.24) 0%, transparent 55%),
              radial-gradient(circle at 84% 80%, rgba(14, 165, 233, 0.2) 0%, transparent 58%),
              linear-gradient(155deg, #0D1F33 0%, #091524 55%, #070E1A 100%) !important;
            border: 1.8px solid rgba(56, 189, 248, 0.82) !important;
            box-shadow:
              0 10px 28px -6px rgba(0, 0, 0, 0.8),
              0 0 22px -4px rgba(34, 211, 238, 0.28),
              inset 0 0 24px rgba(34, 211, 238, 0.1),
              inset 0 1px 1.5px rgba(255, 255, 255, 0.28) !important;
          }
          .perm-user-tab-cyan:hover {
            transform: translateY(-4px);
            border-color: #7DD3FC !important;
            box-shadow:
              0 14px 32px -6px rgba(0, 0, 0, 0.85),
              0 0 28px 0px rgba(34, 211, 238, 0.42),
              inset 0 0 28px rgba(34, 211, 238, 0.16) !important;
          }

          /* AMBER USER TAB */
          .perm-user-tab-amber {
            background-image:
              radial-gradient(circle at 18% 22%, rgba(245, 158, 11, 0.24) 0%, transparent 55%),
              radial-gradient(circle at 84% 80%, rgba(217, 119, 6, 0.2) 0%, transparent 58%),
              linear-gradient(155deg, #271C12 0%, #19120C 55%, #110C09 100%) !important;
            border: 1.8px solid rgba(251, 191, 36, 0.82) !important;
            box-shadow:
              0 10px 28px -6px rgba(0, 0, 0, 0.8),
              0 0 22px -4px rgba(245, 158, 11, 0.28),
              inset 0 0 24px rgba(245, 158, 11, 0.1),
              inset 0 1px 1.5px rgba(255, 255, 255, 0.28) !important;
          }
          .perm-user-tab-amber:hover {
            transform: translateY(-4px);
            border-color: #FDE047 !important;
            box-shadow:
              0 14px 32px -6px rgba(0, 0, 0, 0.85),
              0 0 28px 0px rgba(245, 158, 11, 0.42),
              inset 0 0 28px rgba(245, 158, 11, 0.16) !important;
          }

          /* PURPLE USER TAB */
          .perm-user-tab-purple {
            background-image:
              radial-gradient(circle at 18% 22%, rgba(168, 85, 247, 0.26) 0%, transparent 55%),
              radial-gradient(circle at 84% 80%, rgba(139, 92, 246, 0.22) 0%, transparent 58%),
              linear-gradient(155deg, #211638 0%, #150E26 55%, #0D0919 100%) !important;
            border: 1.8px solid rgba(192, 132, 252, 0.84) !important;
            box-shadow:
              0 10px 28px -6px rgba(0, 0, 0, 0.8),
              0 0 22px -4px rgba(168, 85, 247, 0.3),
              inset 0 0 24px rgba(168, 85, 247, 0.12),
              inset 0 1px 1.5px rgba(255, 255, 255, 0.28) !important;
          }
          .perm-user-tab-purple:hover {
            transform: translateY(-4px);
            border-color: #E9D5FF !important;
            box-shadow:
              0 14px 32px -6px rgba(0, 0, 0, 0.85),
              0 0 28px 0px rgba(168, 85, 247, 0.44),
              inset 0 0 28px rgba(168, 85, 247, 0.18) !important;
          }

          /* EMERALD USER TAB */
          .perm-user-tab-emerald {
            background-image:
              radial-gradient(circle at 18% 22%, rgba(16, 185, 129, 0.24) 0%, transparent 55%),
              radial-gradient(circle at 84% 80%, rgba(5, 150, 105, 0.2) 0%, transparent 58%),
              linear-gradient(155deg, #0D2622 0%, #091917 55%, #06100F 100%) !important;
            border: 1.8px solid rgba(52, 211, 153, 0.82) !important;
            box-shadow:
              0 10px 28px -6px rgba(0, 0, 0, 0.8),
              0 0 22px -4px rgba(16, 185, 129, 0.28),
              inset 0 0 24px rgba(16, 185, 129, 0.1),
              inset 0 1px 1.5px rgba(255, 255, 255, 0.28) !important;
          }
          .perm-user-tab-emerald:hover {
            transform: translateY(-4px);
            border-color: #6EE7B7 !important;
            box-shadow:
              0 14px 32px -6px rgba(0, 0, 0, 0.85),
              0 0 28px 0px rgba(16, 185, 129, 0.42),
              inset 0 0 28px rgba(16, 185, 129, 0.16) !important;
          }

          /* ROSE USER TAB */
          .perm-user-tab-rose {
            background-image:
              radial-gradient(circle at 18% 22%, rgba(244, 63, 94, 0.24) 0%, transparent 55%),
              radial-gradient(circle at 84% 80%, rgba(225, 29, 72, 0.2) 0%, transparent 58%),
              linear-gradient(155deg, #2A1321 0%, #1B0C16 55%, #11080E 100%) !important;
            border: 1.8px solid rgba(251, 113, 133, 0.82) !important;
            box-shadow:
              0 10px 28px -6px rgba(0, 0, 0, 0.8),
              0 0 22px -4px rgba(244, 63, 94, 0.28),
              inset 0 0 24px rgba(244, 63, 94, 0.1),
              inset 0 1px 1.5px rgba(255, 255, 255, 0.28) !important;
          }
          .perm-user-tab-rose:hover {
            transform: translateY(-4px);
            border-color: #FDA4AF !important;
            box-shadow:
              0 14px 32px -6px rgba(0, 0, 0, 0.85),
              0 0 28px 0px rgba(244, 63, 94, 0.42),
              inset 0 0 28px rgba(244, 63, 94, 0.16) !important;
          }

          /* ===================================================================
             5. POLISHED NON-METALLIC BUTTONS (CLONED FROM CANDIDATE ATTRITION)
          =================================================================== */
          .polished-btn-purple {
            background: linear-gradient(180deg, #5B35B5 0%, #43248F 100%) !important;
            border: 1.5px solid rgba(216, 180, 254, 0.72) !important;
            color: #F5F3FF !important;
            box-shadow:
              0 4px 12px rgba(76, 29, 149, 0.38),
              inset 0 1px 0.5px rgba(255, 255, 255, 0.22) !important;
            transition: all 0.2s ease !important;
          }
          .polished-btn-purple:hover {
            background: linear-gradient(180deg, #6D42D1 0%, #4E2BA3 100%) !important;
            border-color: #E9D5FF !important;
            transform: translateY(-1.5px);
          }

          .polished-btn-cyan {
            background: linear-gradient(180deg, #0E7490 0%, #095269 100%) !important;
            border: 1.5px solid rgba(103, 232, 249, 0.72) !important;
            color: #ECFEFF !important;
            box-shadow:
              0 4px 12px rgba(8, 145, 178, 0.36),
              inset 0 1px 0.5px rgba(255, 255, 255, 0.22) !important;
            transition: all 0.2s ease !important;
          }
          .polished-btn-cyan:hover {
            background: linear-gradient(180deg, #0891B2 0%, #0E6480 100%) !important;
            border-color: #A5F3FC !important;
            transform: translateY(-1.5px);
          }

          .polished-btn-amber {
            background: linear-gradient(180deg, #B45309 0%, #853A07 100%) !important;
            border: 1.5px solid rgba(253, 224, 71, 0.78) !important;
            color: #FEF9C3 !important;
            box-shadow:
              0 4px 12px rgba(180, 83, 9, 0.38),
              inset 0 1px 0.5px rgba(255, 255, 255, 0.24) !important;
            transition: all 0.2s ease !important;
          }
          .polished-btn-amber:hover {
            background: linear-gradient(180deg, #D97706 0%, #9A4408 100%) !important;
            border-color: #FEF08A !important;
            color: #FFFFFF !important;
            transform: translateY(-1.5px);
          }

          .polished-btn-emerald {
            background: linear-gradient(180deg, #0F765E 0%, #095241 100%) !important;
            border: 1.5px solid rgba(110, 231, 183, 0.72) !important;
            color: #ECFDF5 !important;
            box-shadow:
              0 4px 12px rgba(5, 150, 105, 0.36),
              inset 0 1px 0.5px rgba(255, 255, 255, 0.22) !important;
            transition: all 0.2s ease !important;
          }
          .polished-btn-emerald:hover {
            background: linear-gradient(180deg, #059669 0%, #0B634F 100%) !important;
            border-color: #A7F3D0 !important;
            transform: translateY(-1.5px);
          }

          .polished-btn-rose {
            background: linear-gradient(180deg, #BE123C 0%, #881337 100%) !important;
            border: 1.5px solid rgba(253, 164, 175, 0.75) !important;
            color: #FFF1F2 !important;
            box-shadow:
              0 4px 12px rgba(190, 18, 60, 0.38),
              inset 0 1px 0.5px rgba(255, 255, 255, 0.22) !important;
            transition: all 0.2s ease !important;
          }
          .polished-btn-rose:hover {
            background: linear-gradient(180deg, #E11D48 0%, #9F1239 100%) !important;
            border-color: #FECDD3 !important;
            transform: translateY(-1.5px);
          }

          .polished-btn-slate {
            background: linear-gradient(180deg, #273249 0%, #182032 100%) !important;
            border: 1.5px solid rgba(148, 163, 184, 0.65) !important;
            color: #F8FAFC !important;
            box-shadow:
              0 4px 12px rgba(0, 0, 0, 0.5),
              inset 0 1px 0.5px rgba(255, 255, 255, 0.2) !important;
            transition: all 0.2s ease !important;
          }
          .polished-btn-slate:hover {
            background: linear-gradient(180deg, #33415C 0%, #1F293F 100%) !important;
            border-color: #CBD5E1 !important;
            color: #FEF08A !important;
            transform: translateY(-1.5px);
          }

          /* Modal Sub-Tab Borders */
          .modal-tab-border-cyan { background: #0B1120 !important; border: 1.8px solid rgba(34, 211, 238, 0.82) !important; }
          .modal-tab-border-amber { background: #0B1120 !important; border: 1.8px solid rgba(251, 191, 36, 0.82) !important; }
          .modal-tab-border-purple { background: #0B1120 !important; border: 1.8px solid rgba(192, 132, 252, 0.82) !important; }
          .modal-tab-border-emerald { background: #0B1120 !important; border: 1.8px solid rgba(52, 211, 153, 0.82) !important; }
          .modal-tab-border-rose { background: #0B1120 !important; border: 1.8px solid rgba(251, 113, 133, 0.82) !important; }

          /* Cream Theme Variants */
          .cream-plate-surface { background: #FFFDF9; border: 1.5px solid #E5DEC9; color: #1C1917; }
          .cream-dark-btn { background: #18181B; border: 1.5px solid #D97706; color: #FAF8F5; }
          .cream-pill-gold { background: #FEF3C7; border: 1px solid #FCD34D; color: #92400E; }
          .cream-pill-emerald { background: #DCFCE7; border: 1px solid #86EFAC; color: #065F46; }
          .cream-inner-pod-emerald { background: #EBFBF3; border: 1.5px solid #34D399; color: #064E3B; }
          .cream-inner-pod-amber { background: #FEF7E0; border: 1.5px solid #F59E0B; color: #451A03; }
          .cream-inner-pod-cyan { background: #EBF6FD; border: 1.5px solid #38BDF8; color: #0C4A6E; }
          .cream-inner-pod-purple { background: #F5F0FF; border: 1.5px solid #A855F7; color: #3B0764; }
          .cream-inner-pod-rose { background: #FFF0F2; border: 1.5px solid #FB7185; color: #4C0519; }
          .cream-tab-purple { background: linear-gradient(180deg, #FFFFFF 0%, #F9F6FF 100%); border: 1.5px solid #E2D6F8; border-top: 3.5px solid #8B5CF6; color: #1C1917; }
          .cream-tab-cyan { background: linear-gradient(180deg, #FFFFFF 0%, #F2F9FD 100%); border: 1.5px solid #C8E5F3; border-top: 3.5px solid #0284C7; color: #1C1917; }
          .cream-tab-amber { background: linear-gradient(180deg, #FFFFFF 0%, #FFFBF0 100%); border: 1.5px solid #F3E0B5; border-top: 3.5px solid #D97706; color: #1C1917; }
          .cream-tab-rose { background: linear-gradient(180deg, #FFFFFF 0%, #FFF5F6 100%); border: 1.5px solid #F6D0D6; border-top: 3.5px solid #E11D48; color: #1C1917; }
          .cream-tab-emerald { background: linear-gradient(180deg, #FFFFFF 0%, #F2FBF7 100%); border: 1.5px solid #C6EAD9; border-top: 3.5px solid #059669; color: #1C1917; }
        `}</style>

        {/* ===================================================================
            OVERALL PAGE LIVE COLOUR-CHANGING & MOVING ORBS
        =================================================================== */}
        {!isLight && (
          <>
            <div className="overall-live-orb-1" />
            <div className="overall-live-orb-2" />
            <div className="overall-live-orb-3" />
          </>
        )}

        {toast && (
          <div className="fixed bottom-6 right-6 z-50 simple-dark-kpi-purple text-amber-300 px-5 py-3.5 rounded-2xl flex items-center gap-3 text-xs font-extrabold">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span>{toast}</span>
          </div>
        )}

        {/* ===================================================================
            1. TOP PAGE HEADER BAR
        =================================================================== */}
        <header
          className={`rounded-3xl p-5 sm:p-6 flex flex-wrap items-center justify-between gap-4 relative overflow-visible ${
            isLight ? "cream-plate-surface" : "rbac-main-glass-section"
          }`}
        >
          <div className="flex items-center gap-4">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                isLight ? "cream-pill-gold" : "polished-btn-purple"
              }`}
            >
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
                Roles &amp; Permissions
              </h1>
              <p className="text-xs sm:text-sm opacity-80 font-semibold mt-0.5">
                Define module permissions, action privileges, and data visibility scopes across the organization.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 ml-auto">
            <button
              type="button"
              onClick={handleExportRbacCSV}
              className={`px-4 py-2.5 rounded-2xl text-xs font-black flex items-center gap-1.5 cursor-pointer ${
                isLight ? "cream-dark-btn" : "polished-btn-cyan"
              }`}
            >
              <Download className="w-4 h-4" />
              <span>Export Matrix CSV</span>
            </button>

            <button
              type="button"
              onClick={() => setCreateModalOpen(true)}
              className={`px-5 py-2.5 rounded-2xl text-xs font-black flex items-center gap-1.5 cursor-pointer ${
                isLight ? "cream-pill-gold" : "polished-btn-amber"
              }`}
            >
              <span>+ Create New Role</span>
            </button>

            <div className="relative">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setHeaderOverflowOpen((prev) => !prev);
                }}
                className={`px-3.5 py-2.5 rounded-2xl text-xs font-black flex items-center gap-1 cursor-pointer ${
                  isLight ? "cream-dark-btn" : "polished-btn-slate"
                }`}
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>

              {headerOverflowOpen && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="absolute right-0 mt-2 w-56 rounded-2xl bg-[#0B1120] border-2 border-cyan-400/60 shadow-2xl py-2 z-50 text-xs text-white"
                >
                  <button
                    type="button"
                    onClick={() => {
                      setHeaderOverflowOpen(false);
                      setRoles(INITIAL_ROLES);
                      showToast("↻ Restored default organization role policies!");
                    }}
                    className="w-full px-4 py-2.5 hover:bg-white/10 flex items-center gap-2.5 font-bold cursor-pointer"
                  >
                    <RefreshCw className="w-4 h-4 text-cyan-300" />
                    <span>Reset Default Policies</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setHeaderOverflowOpen(false);
                      handleToggleTheme();
                    }}
                    className="w-full px-4 py-2.5 hover:bg-white/10 flex items-center gap-2.5 font-bold cursor-pointer border-t border-white/10 mt-1 pt-2"
                  >
                    <span>{isLight ? "🌙" : "☀️"}</span>
                    <span>
                      Switch to {isLight ? "Dark Mode" : "Cream Luxe"}
                    </span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* ===================================================================
            2. 4 VIVID BASE-COLOUR KPI CARDS (SMOOTH SILK BASE + SAME-COLOUR BORDERS)
               - Royal Amethyst (01 • Total Roles)
               - Deep Sapphire Cyan (02 • System Roles)
               - Burnished Amber Gold (03 • Custom Roles)
               - Velvet Ruby Crimson (04 • Security Flags)
        =================================================================== */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
          {[
            {
              id: "ALL",
              tag: "01 • TOTAL ROLES",
              value: roleKpis.total,
              unit: roleKpis.total === 1 ? "Role" : "Roles",
              subtitle: "All defined system & custom roles",
              cardCls: "kpi-vivid-purple",
              tagCls: "text-purple-100",
              iconBox:
                "bg-purple-500/35 border border-purple-200/70 text-white shadow-[0_6px_16px_rgba(0,0,0,0.4)]",
              barCls: "from-purple-300 via-fuchsia-200 to-white",
              barWidth: "100%",
              delayA: "0s",
              delayB: "-2.4s",
              icon: <Users className="w-5 h-5 stroke-[2.2]" />,
            },
            {
              id: "SYSTEM",
              tag: "02 • SYSTEM ROLES",
              value: roleKpis.system,
              unit: "Core Locked",
              subtitle: "Locked core (Master Admin & Admin)",
              cardCls: "kpi-vivid-cyan",
              tagCls: "text-cyan-100",
              iconBox:
                "bg-cyan-500/35 border border-cyan-200/70 text-white shadow-[0_6px_16px_rgba(0,0,0,0.4)]",
              barCls: "from-cyan-300 via-sky-200 to-white",
              barWidth: `${Math.round((roleKpis.system / Math.max(roleKpis.total, 1)) * 100) || 35}%`,
              delayA: "-2.6s",
              delayB: "-5.1s",
              icon: <Shield className="w-5 h-5 stroke-[2.2]" />,
            },
            {
              id: "CUSTOM",
              tag: "03 • CUSTOM ROLES",
              value: roleKpis.custom,
              unit: "Custom",
              subtitle: "Franchise & custom staff roles",
              cardCls: "kpi-vivid-amber",
              tagCls: "text-amber-100",
              iconBox:
                "bg-amber-500/35 border border-amber-200/70 text-amber-50 shadow-[0_6px_16px_rgba(0,0,0,0.4)]",
              barCls: "from-amber-300 via-yellow-200 to-white",
              barWidth: `${Math.round((roleKpis.custom / Math.max(roleKpis.total, 1)) * 100) || 75}%`,
              delayA: "-5.2s",
              delayB: "-7.8s",
              icon: <Award className="w-5 h-5 stroke-[2.2]" />,
            },
            {
              id: "FLAGS",
              tag: "04 • SECURITY FLAGS",
              value: roleKpis.securityFlags,
              unit: roleKpis.securityFlags === 1 ? "Alert" : "Alerts",
              subtitle:
                roleKpis.securityFlags > 0
                  ? "Elevated scope permissions"
                  : "All role scopes verified clean",
              cardCls: "kpi-vivid-crimson",
              tagCls: "text-rose-100",
              iconBox:
                "bg-rose-500/35 border border-rose-200/70 text-rose-50 shadow-[0_6px_16px_rgba(0,0,0,0.4)]",
              barCls: "from-rose-300 via-pink-200 to-white",
              barWidth: `${roleKpis.securityFlags > 0 ? Math.min(100, roleKpis.securityFlags * 35) : 0}%`,
              delayA: "-7.8s",
              delayB: "-3.5s",
              icon: <Flame className="w-5 h-5 stroke-[2.2]" />,
            },
          ].map((card) => {
            const isActive = kpiFilter === card.id;
            return (
              <div
                key={card.id}
                onClick={() =>
                  setKpiFilter(kpiFilter === card.id ? "ALL" : card.id)
                }
                className={`cursor-pointer group kpi-vivid-card ${card.cardCls} p-4 sm:p-5 flex flex-col justify-between space-y-3.5 select-none ${
                  isActive
                    ? "ring-2 ring-white shadow-[0_0_24px_rgba(255,255,255,0.45)]"
                    : ""
                }`}
              >
                {/* Smooth Live Internal Base-Colour Waves */}
                <div
                  className="kpi-flow-wave-a"
                  style={{ animationDelay: card.delayA }}
                />
                <div
                  className="kpi-flow-wave-b"
                  style={{ animationDelay: card.delayB }}
                />

                {/* Top Row: Tag, Number & Icon */}
                <div className="relative z-10 flex items-start justify-between gap-3">
                  <div>
                    <span
                      className={`text-[10.5px] font-black uppercase tracking-[0.16em] block drop-shadow-[0_1px_2px_rgba(0,0,0,0.55)] ${card.tagCls}`}
                    >
                      {card.tag}
                    </span>
                    <div className="mt-1.5 flex items-baseline gap-2">
                      <span className="text-3xl sm:text-4xl font-black text-white font-mono leading-none drop-shadow-[0_2px_6px_rgba(0,0,0,0.55)]">
                        {card.value}
                      </span>
                      <span className="text-xs font-bold text-white/90">
                        {card.unit}
                      </span>
                    </div>
                  </div>

                  <div
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform ${card.iconBox}`}
                  >
                    {card.icon}
                  </div>
                </div>

                {/* Crisp Progress Accent Track */}
                <div className="relative z-10 w-full h-1.5 rounded-full bg-black/40 overflow-hidden">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${card.barCls}`}
                    style={{ width: card.barWidth }}
                  />
                </div>

                {/* Bottom Row: Description + Active/Filter Action */}
                <div className="relative z-10 flex items-center justify-between gap-2 text-[11px] pt-0.5">
                  <span className="text-white/90 font-semibold truncate drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">
                    {card.subtitle}
                  </span>
                  <span
                    className={`font-black inline-flex items-center gap-0.5 shrink-0 transition-transform group-hover:translate-x-0.5 ${
                      isActive ? "text-amber-200" : "text-white"
                    }`}
                  >
                    <span>{isActive ? "✓ Active" : "Filter"}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            );
          })}
        </section>

                {/* ===================================================================
            3. ROLE ACCESS PROFILE CARDS (EXACT CLONED CANDIDATE ATTRITION
               USER TABS STRUCTURE, SIZES & LIVE BASE SHADE MOVEMENT!)
        =================================================================== */}
        <section
          className={`rounded-3xl p-6 space-y-5 relative overflow-visible ${
            isLight ? "cream-plate-surface" : "rbac-main-glass-section"
          }`}
        >
          {/* Header & Filter Bar Cloned from CandidateAttrition Section 3 */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/15 pb-4 relative z-10">
            <div>
              <span
                className={`text-[10px] font-black uppercase tracking-wider block ${
                  isLight ? "text-amber-800" : "text-amber-300"
                }`}
              >
                🛡️ ORGANIZATION RBAC RULEBOOK &amp; PERMISSION BENCHMARKING
              </span>
              <h2 className="text-xl font-black">
                Role Access Cards ({filteredRoles.length})
              </h2>
              <p className="text-xs opacity-80">
                Every role tab below features a permanent 4-sided light border and live base color movement — click any card to edit granular permissions
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {[
                { label: "All Scopes", icon: "✦" },
                { label: "Global HQ", icon: "🏛️" },
                { label: "Franchise", icon: "🏢" },
                { label: "Team Only", icon: "🎯" },
                { label: "Self Only", icon: "👤" },
              ].map((item) => {
                const isActive = scopeFilter === item.label;
                return (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => setScopeFilter(item.label)}
                    className={`px-4 py-2 rounded-2xl text-xs font-black cursor-pointer ${
                      isLight
                        ? isActive
                          ? "cream-pill-gold"
                          : "cream-dark-btn"
                        : isActive
                        ? "polished-btn-amber"
                        : "polished-btn-slate"
                    }`}
                  >
                    {item.icon} {item.label}
                  </button>
                );
              })}

              <input
                type="text"
                value={searchRole}
                onChange={(e) => setSearchRole(e.target.value)}
                placeholder="🔍 Search role or scope..."
                className={`rounded-2xl border px-4 py-2 text-xs font-bold outline-none transition ${
                  isLight
                    ? "bg-white border-stone-800 text-stone-900 placeholder-stone-500"
                    : "bg-[#090D1A]/90 border-slate-300/40 text-white placeholder-slate-400 focus:border-amber-300"
                }`}
              />
            </div>
          </div>

          {/* EXACT 3-COLUMN COMPACT GRID CLONED FROM CANDIDATE ATTRITION USER TABS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 relative z-10">
            {filteredRoles.map((r, idx) => {
              const accentIdx = idx % 5;
              const permTabCls = isLight
                ? creamTabVariants[accentIdx]
                : userTabDimVariants[accentIdx];

              const accentBtnList = [
                "polished-btn-cyan",
                "polished-btn-amber",
                "polished-btn-purple",
                "polished-btn-emerald",
                "polished-btn-rose",
              ];
              const tabAccentBtn = isLight
                ? "cream-dark-btn"
                : accentBtnList[accentIdx];

              const statusBtnCls = isLight
                ? "cream-pill-emerald"
                : r.hasSecurityFlag
                ? "polished-btn-rose"
                : r.isSystem
                ? "polished-btn-cyan"
                : "polished-btn-emerald";

              return (
                <div
                  key={r.id}
                  onClick={() => setEditingRoleId(r.id)}
                  style={{ animationDelay: `${(idx % 5) * -2.2}s` }}
                  className={`cursor-pointer group relative overflow-visible rounded-3xl p-5 flex flex-col justify-between space-y-4 ${permTabCls}`}
                >
                  {/* TOP ROW: w-11 h-11 rounded-2xl Avatar + Role Name + 1-Line Subtitle | Users Assigned Pill + ⋮ */}
                  <div className="flex items-start justify-between gap-3 relative z-10">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-11 h-11 rounded-2xl font-black text-xs flex items-center justify-center shrink-0 ${
                          isLight ? "cream-pill-gold" : tabAccentBtn
                        }`}
                      >
                        {r.code || r.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <h3
                          className={`text-sm font-black transition truncate ${
                            isLight
                              ? "text-stone-950 group-hover:text-amber-800"
                              : "text-white group-hover:text-amber-200"
                          }`}
                        >
                          {r.name}
                        </h3>
                        <span
                          className={`text-[11px] font-medium block truncate ${
                            isLight ? "text-stone-600" : "text-slate-300"
                          }`}
                        >
                          {r.description}
                        </span>
                      </div>
                    </div>

                    {/* Right Pill: Users Assigned Redirect + ⋮ */}
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-1 shrink-0 relative"
                    >
                      <button
                        type="button"
                        onClick={() => handleNavigateToUsersByRole(r)}
                        title={`View ${r.userCount} users in Tab 1`}
                        className={`px-3 py-1 rounded-full text-[10.5px] font-black shrink-0 cursor-pointer ${
                          isLight ? "cream-dark-btn" : "polished-btn-slate"
                        }`}
                      >
                        {r.userCount} Users ↗
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenuRoleId(
                            openMenuRoleId === r.id ? null : r.id
                          );
                        }}
                        className={`w-7 h-7 rounded-xl inline-flex items-center justify-center cursor-pointer ${
                          isLight ? "cream-dark-btn" : "polished-btn-slate"
                        }`}
                      >
                        <MoreHorizontal className="w-3.5 h-3.5" />
                      </button>

                      {openMenuRoleId === r.id && (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="absolute right-0 top-9 w-44 rounded-2xl bg-[#0B1120] border-2 border-cyan-400/65 shadow-2xl py-1.5 z-50 text-left text-xs text-white"
                        >
                          <button
                            type="button"
                            onClick={() => {
                              setOpenMenuRoleId(null);
                              setEditingRoleId(r.id);
                            }}
                            className="w-full px-3.5 py-2 hover:bg-white/10 flex items-center gap-2 font-bold cursor-pointer"
                          >
                            <Sliders className="w-3.5 h-3.5 text-amber-300" />
                            <span>Edit Role</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setOpenMenuRoleId(null);
                              handleDuplicateRole(r);
                            }}
                            className="w-full px-3.5 py-2 hover:bg-white/10 flex items-center gap-2 font-bold cursor-pointer"
                          >
                            <span>📋</span>
                            <span>Duplicate</span>
                          </button>
                          <button
                            type="button"
                            disabled={r.isSystem || r.userCount > 0}
                            onClick={() => {
                              setOpenMenuRoleId(null);
                              handleDeleteRole(r);
                            }}
                            className={`w-full px-3.5 py-2 flex items-center gap-2 font-bold border-t border-white/10 mt-1 pt-2 ${
                              r.isSystem || r.userCount > 0
                                ? "text-slate-500 cursor-not-allowed opacity-60"
                                : "hover:bg-rose-500/20 text-rose-300 cursor-pointer"
                            }`}
                          >
                            <span>🗑️</span>
                            <span>
                              {r.isSystem
                                ? "System Locked"
                                : r.userCount > 0
                                ? `In Use (${r.userCount})`
                                : "Delete Role"}
                            </span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* MIDDLE ROW: 3 INNER METRIC PODS ON NORMAL DARK #070B16 BACKGROUND (EXACT CLONE!) */}
                  <div className="grid grid-cols-3 gap-2 text-center text-xs relative z-10">
                    <div
                      className={`p-2.5 rounded-2xl border ${
                        isLight
                          ? "cream-inner-pod-cyan"
                          : "bg-[#070B16]/90 border-cyan-400/50"
                      }`}
                    >
                      <span className="text-[10px] opacity-75 font-bold block">
                        Scope
                      </span>
                      <span
                        className={`font-black truncate block ${
                          isLight ? "text-sky-900" : "text-cyan-300"
                        }`}
                      >
                        {r.scopeBadge}
                      </span>
                    </div>

                    <div
                      className={`p-2.5 rounded-2xl border ${
                        isLight
                          ? "cream-inner-pod-purple"
                          : "bg-[#070B16]/90 border-purple-400/50"
                      }`}
                    >
                      <span className="text-[10px] opacity-75 font-bold block">
                        Modules
                      </span>
                      <span
                        className={`font-black ${
                          isLight ? "text-purple-900" : "text-purple-300"
                        }`}
                      >
                        ★ {r.activeModulesCount}/5
                      </span>
                    </div>

                    <div
                      className={`p-2.5 rounded-2xl border ${
                        isLight
                          ? "cream-inner-pod-amber"
                          : "bg-[#070B16]/90 border-amber-400/50"
                      }`}
                    >
                      <span className="text-[10px] opacity-75 font-bold block">
                        Perms
                      </span>
                      <span
                        className={`font-black ${
                          isLight ? "text-amber-900" : "text-amber-300"
                        }`}
                      >
                        🛡️ {r.totalGranularChecked}
                      </span>
                    </div>
                  </div>

                  {/* BOTTOM ROW: Status Pill + Inspect → Button (EXACT CLONE!) */}
                  <div className="pt-2 border-t border-white/15 flex items-center justify-between gap-2 relative z-10">
                    <span
                      className={`px-3.5 py-1 rounded-full text-[10.5px] font-black ${statusBtnCls}`}
                    >
                      {r.hasSecurityFlag
                        ? "⚠️ Flag: User Edit Scope"
                        : r.isSystem
                        ? "🔒 System Role (Locked)"
                        : `✓ Verified (${r.scopeBadge})`}
                    </span>

                    <span
                      className={`px-4 py-1 rounded-full text-[10.5px] font-black ${tabAccentBtn}`}
                    >
                      Inspect →
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ===================================================================
            4. CENTERED ROLE EDITOR MODAL
        =================================================================== */}
        <RoleEditorDrawer
          role={activeEditingRole}
          assignedUsers={activeEditingRole?.assignedUsers || []}
          onClose={() => setEditingRoleId(null)}
          onSaveRole={handleSaveEditedRole}
          onDeleteRole={handleDeleteRole}
          onNavigateToUsersTab={handleNavigateToUsersByRole}
          isLight={isLight}
        />

        {/* ===================================================================
            5. CREATE NEW ROLE MODAL
        =================================================================== */}
        <CreateRoleModal
          isOpen={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          onCreateRole={(newRole) => {
            setRoles((prev) => [...prev, newRole]);
            showToast(`✨ Created new role "${newRole.name}"!`);
          }}
          existingRoles={enrichedRoles}
          isLight={isLight}
        />
      </div>
    </MainLayout>
  );
}