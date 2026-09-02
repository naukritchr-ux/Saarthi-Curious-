import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../../utils/axios";
import {
  LayoutDashboard,
  BookOpen,
  Award,
  Trophy,
  Users,
  BarChart3,
  Settings,
  Coins,
  ShieldCheck,
  Bell,
  Flame,
  UserMinus,
  GraduationCap,
  FileText,
} from "lucide-react";

const Sidebar = ({ isExpanded, onMouseEnter, onMouseLeave, onNavigate }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const roleId = Number(localStorage.getItem("role_id"));
  const [isHovered, setIsHovered] = useState(false);

  const getLearningLabel = () => {
    return roleId === 5 ? "Learn" : "Start Learning";
  };

  const handleNavigate = (path) => {
    navigate(path);
    onNavigate?.();
  };

  useEffect(() => {
    setIsHovered(isExpanded);
  }, [isExpanded]);

  const handleMouseEnter = () => {
    setIsHovered(true);
    onMouseEnter?.();
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    onMouseLeave?.();
  };

  const shouldShowExpanded = isExpanded || isHovered;
  const sidebarWidthClass = shouldShowExpanded ? "w-64" : "w-20";

  const getMenuItems = () => {
    const allItems = [
      {
        id: "programs",
        icon: BookOpen,
        label: "Programs",
        path: "/programs",
        section: "Content Management",
      },

      {
        id: "curo-management",
        icon: Coins,
        label: "Curos Management",
        path: "/curo-management",
        section: "Engagement & Gamification",
      },
      {
        id: "rewards",
        icon: Award,
        label: "Rewards",
        path: "/rewards",
        section: "Engagement & Gamification",
      },
      {
        id: "leaderboards",
        icon: Trophy,
        label: "Leaderboards",
        path: "/leaderboards",
        section: "Engagement & Gamification",
      },
      {
        id: "streak-management",
        icon: Flame,
        label: "Streak Management",
        path: "/streak-management",
        section: "Engagement & Gamification",
      },
      {
        id: "user-management",
        icon: Users,
        label: "User Management",
        path: "/admin/users",
        section: "Administration",
      },
      {
        id: "team-directory",
        icon: Users,
        label: "Team Directory",
        path: "/team-directory",
        section: "Team Management",
        roles: [3, 6], // Team Leaders and Franchise Developers
      },
      {
        id: "franchise-directory",
        icon: Users,
        label: "Franchise Directory",
        path: "/franchise-directory",
        section: "Franchise Management",
        roles: [4], // Only for Franchise Partners
      },
      {
        id: "role-management",
        icon: ShieldCheck,
        label: "Role Management",
        path: "/admin/roles",
        section: "Administration",
      },
      {
        id: "reports-analytics",
        icon: BarChart3,
        label: "Reports & Analytics",
        path: "/reports",
        section: "Reports",
      },
      {
        id: "candidate-attrition",
        icon: UserMinus,
        label: "Candidate Attrition",
        path: "/candidate-attrition",
        section: "Reports",
      },
      {
        id: "inactive-users",
        icon: Users,
        label: "Inactive Users",
        path: "/admin/inactive-users",
        section: "Administration",
      },
      {
        id: "notification-scripts",
        icon: Bell,
        label: "Notification Scripts",
        path: "/communication/notification-scripts",
        section: "Administration",
      },
      {
        id: "application-check-submissions",
        icon: FileText,
        label: "Application Check Submissions",
        path: "/application-check-submissions",
        section: "Content Management",
      },
    ];

    const rolePermissions = {
      1: [
        "programs",
        "curo-management",
        "leaderboards",
        "rewards",
        "streak-management",
        "user-management",
        "role-management",
        "inactive-users",
        "notification-scripts",
        "reports-analytics",
        "candidate-attrition",
        "application-check-submissions",
      ],
      2: [
        "programs",
        "curo-management",
        "leaderboards",
        "rewards",
        "streak-management",
        "user-management",
        "role-management",
        "inactive-users",
        "notification-scripts",
        "reports-analytics",
        "candidate-attrition",
        "application-check-submissions",
      ],
      3: [
        "team-directory",
        "leaderboards",
        "rewards",
        "reports-analytics",
        "streak-management",
      ],
      4: [
        "franchise-directory",
        "leaderboards",
        "rewards",
        "reports-analytics",
        "streak-management",
      ],
      5: [
        "leaderboards",
        "rewards",
        "reports-analytics",
        "streak-management",
      ],
      6: [
        "team-directory",
        "leaderboards",
        "rewards",
        "reports-analytics",
        "streak-management",
      ],
      7: ["leaderboards", "rewards", "streak-management", "reports-analytics"],
    };

    const allowedItems = rolePermissions[roleId] || [];
    return allItems.filter((item) => {
      // Check if item is in allowed permissions
      if (!allowedItems.includes(item.id)) return false;
      
      // Check if item has specific role restrictions
      if (item.roles && !item.roles.includes(roleId)) return false;
      
      return true;
    });
  };

  const menuItems = getMenuItems();

  // Tooltip component for collapsed state
  const Tooltip = ({ children, label }) => {
    if (shouldShowExpanded) return children;

    return (
      <div className="relative group">
        {children}
        <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-3 py-2 bg-[#1E1B4B] text-[#F1ECF7] text-xs rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 whitespace-nowrap z-50 border border-[#7B6A9A]/30 shadow-lg">
          {label}
        </div>
      </div>
    );
  };

  // Navigation item component for consistency
  const NavItem = ({ icon: Icon, label, onClick, isActive, tooltipLabel }) => {
    return (
      <Tooltip label={tooltipLabel || label}>
        <div
          onClick={onClick}
          className={`flex items-center rounded-xl cursor-pointer transition-all duration-200 ${
            isActive
              ? "bg-gradient-to-r from-[#693C83] to-[#10B981] text-[#F1ECF7] shadow-md"
              : "hover:bg-[#352951] text-[#F1ECF7]"
          } ${shouldShowExpanded ? "px-4 py-3 gap-3" : "px-3 py-3 justify-center"}`}
        >
          <Icon size={20} className="flex-shrink-0" />
          <span
            className={`text-sm font-medium overflow-hidden whitespace-nowrap transition-all duration-300 ease-in-out ${
              shouldShowExpanded
                ? "max-w-[180px] opacity-100 ml-0"
                : "max-w-0 opacity-0 ml-0"
            }`}
          >
            {label}
          </span>
        </div>
      </Tooltip>
    );
  };

  // Section heading component
  const SectionHeading = ({ title }) => {
    if (!shouldShowExpanded) {
      return (
        <div className="h-6">
          <hr className="border-[#7B6A9A]/30" />
        </div>
      );
    }
    return (
      <p className="text-[10px] font-semibold uppercase tracking-wider text-[#B8A7D6] mb-2">
        {title}
      </p>
    );
  };

  return (
    <aside
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`fixed left-0 top-16 z-50 h-[calc(100vh-4rem)] bg-[#1E1B4B] text-[#F1ECF7] border-r border-[#7B6A9A] overflow-y-auto overflow-x-hidden transition-all duration-300 ease-in-out ${sidebarWidthClass} max-md:w-64 ${isExpanded ? "max-md:translate-x-0" : "max-md:-translate-x-full"}`}
      style={{
        scrollbarWidth: 'none', /* Firefox */
        msOverflowStyle: 'none' /* IE and Edge */
      }}
    >
      <style jsx>{`
        aside::-webkit-scrollbar {
          display: none; /* Chrome, Safari, Opera */
        }
      `}</style>

      <nav className="px-3 py-4">
        {/* Dashboard Section */}
        <div className="mb-2">
          <SectionHeading title="Dashboard" />

          {roleId === 1 || roleId === 2 ? (
            <NavItem
              icon={LayoutDashboard}
              label="Admin Dashboard"
              onClick={() => handleNavigate("/master-admin")}
              isActive={location.pathname === "/master-admin"}
              tooltipLabel="Admin Dashboard"
            />
          ) : null}

          {roleId === 3 || roleId === 6 ? (
            <NavItem
              icon={LayoutDashboard}
              label="Team Leader Dashboard"
              onClick={() => handleNavigate("/team-leader")}
              isActive={location.pathname === "/team-leader"}
              tooltipLabel="Team Leader Dashboard"
            />
          ) : null}

          {roleId === 4 || roleId === 6 ? (
            <NavItem
              icon={LayoutDashboard}
              label="Franchise Dashboard"
              onClick={() => handleNavigate("/franchiseePartner")}
              isActive={location.pathname === "/franchiseePartner"}
              tooltipLabel="Franchise Dashboard"
            />
          ) : null}

          {roleId === 3 ||
          roleId === 4 ||
          roleId === 5 ||
          roleId === 6 ||
          roleId === 7 ? (
            <NavItem
              icon={GraduationCap}
              label={getLearningLabel()}
              onClick={() => handleNavigate("/learner")}
              isActive={location.pathname === "/learner"}
              tooltipLabel={getLearningLabel()}
            />
          ) : null}
        </div>

        {/* Menu Items Grouped by Section */}
        {[
          "Content Management",
          "Engagement & Gamification",
          "Administration",
          "Team Management",
          "Franchise Management",
          "Reports",
          "Communication",
        ].map((section) => {
          const sectionItems = menuItems.filter(
            (item) => item.section === section,
          );
          if (sectionItems.length === 0) return null;

          return (
            <div key={section} className="mb-2">
              <SectionHeading title={section} />
              {sectionItems.map((item) => (
                <NavItem
                  key={item.id}
                  icon={item.icon}
                  label={item.label}
                  onClick={() => handleNavigate(item.path)}
                  isActive={location.pathname === item.path}
                  tooltipLabel={item.label}
                />
              ))}
            </div>
          );
        })}
      </nav>
    </aside>
  );
};

export default Sidebar;
