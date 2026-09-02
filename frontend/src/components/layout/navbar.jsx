import { useState } from "react";
import {
  Search,
  Menu,
  User,
  Settings,
  LogOut,
  ChevronDown,
  Phone,
} from "lucide-react";

import NotificationBell from "./NotificationBell";
import { useNavigate } from "react-router-dom";

const roleNames = {
  1: "Master Admin",
  2: "Admin",
  3: "Team Leader",
  4: "Franchise Partner",
  5: "Franchise Employee",
  6: "Franchise Developer",
  7: "Head Office Staff",
};

const Navbar = ({ onMenuToggle }) => {
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);
  const userName = localStorage.getItem("user_name") || "Guest";
  const roleId = Number(localStorage.getItem("role_id"));

  const handleLogout = () => {
    localStorage.removeItem("user_name");
    localStorage.removeItem("user_id");
    localStorage.removeItem("id");
    localStorage.removeItem("token");
    localStorage.removeItem("role_id");
    localStorage.removeItem("user");

    navigate("/", { replace: true });
  };

  const roleName = roleNames[roleId] || "User";

  return (
    <header className="relative z-50 flex h-16 items-center justify-between border-b border-[#D9CFE8]/20 bg-[#1E1B4B] px-3 sm:px-4 lg:px-6">
      <button
        type="button"
        onClick={onMenuToggle}
        aria-label="Open navigation"
        className="mr-2 rounded-lg p-2 text-[#EDE3F5] transition hover:bg-[#2F264D] md:hidden"
      >
        <Menu size={20} />
      </button>

      {/* Logo */}
      <div className="flex h-10 w-14 shrink-0 items-center">
        <img
          src="/sclogonav.png"
          alt="Saarthi Curious Logo"
          className="w-full h-full object-contain"
        />
      </div>

      {/* Search Bar */}
      <div className="relative mx-2 hidden max-w-96 flex-1 sm:mx-4 sm:block sm:w-80 lg:w-96">
        <Search
          size={18}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-[#EDE3F5] pointer-events-none"
        />
        <input
          type="text"
          placeholder="Search programs, videos, quizzes..."
          className="w-full bg-[#2F264D] border border-[#7B6A9A] rounded-lg py-2 pl-10 pr-4 text-[#F1ECF7] placeholder:text-[#B8A7D6] text-sm focus:outline-none focus:border-[#693C83] focus:ring-2 focus:ring-[#693C83]/30 transition-all duration-200"
        />
      </div>

      {/* Right Section */}
      <div className="flex shrink-0 items-center gap-1 sm:gap-4 lg:gap-6">
        <NotificationBell />

        {/* Profile */}
        <div className="relative">
          <div
            className="group flex cursor-pointer items-center gap-2 rounded-xl px-1 py-1.5 transition-colors duration-200 hover:bg-[#2F264D] sm:gap-3 sm:px-2"
            onClick={() => setShowMenu(!showMenu)}
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#693C83] to-[#8B5FBF] flex items-center justify-center font-bold text-[#F1ECF7] shadow-lg transition-transform duration-200 group-hover:scale-105 flex-shrink-0">
              {userName
                .split(" ")
                .map((word) => word[0])
                .join("")
                .slice(0, 2)
                .toUpperCase()}
            </div>

            <div className="flex min-w-0 items-center gap-1 sm:gap-2">
              <div className="hidden min-w-0 sm:block">
                <h3 className="max-w-[160px] truncate text-sm font-semibold text-[#F1ECF7]">
                  {userName}
                </h3>
                <p className="max-w-[160px] truncate text-xs text-[#D9CFE8]">
                  {roleName}
                </p>
              </div>
              <ChevronDown
                size={16}
                className={`text-[#D9CFE8] transition-all duration-200 flex-shrink-0 ${
                  showMenu ? "rotate-180" : ""
                } group-hover:text-[#F1ECF7]`}
              />
            </div>
          </div>

          {/* Dropdown Menu */}
          {showMenu && (
            <div className="absolute right-0 top-14 w-64 min-w-[16rem] bg-[#2F264D] rounded-xl shadow-xl border border-[#7B6A9A]/30 z-50 overflow-hidden animate-fadeIn">
              <div className="px-4 py-3.5 border-b border-[#7B6A9A]/30">
                <p className="text-[#D9CFE8] text-xs uppercase tracking-wider font-semibold">
                  Account
                </p>
              </div>

              <button
                onClick={() => {
                  setShowMenu(false);
                  navigate("/profile");
                }}
                className="w-full flex items-center gap-3 px-4 py-3 text-[#F1ECF7] hover:bg-[#693C83]/30 transition-colors duration-200 group"
              >
                <User size={18} className="text-[#EDE3F5] flex-shrink-0" />
                <span className="text-sm font-medium">My Profile</span>
              </button>

              <button
                onClick={() => {
                  setShowMenu(false);
                  navigate("/book-call");
                }}
                className="w-full flex items-center gap-3 px-4 py-3 text-[#F1ECF7] hover:bg-[#693C83]/30 transition-colors duration-200 group"
              >
                <Phone size={18} className="text-[#EDE3F5] flex-shrink-0" />
                <span className="text-sm font-medium">Book Call</span>
              </button>

              <button
                onClick={() => {
                  setShowMenu(false);
                  navigate("/settings");
                }}
                className="w-full flex items-center gap-3 px-4 py-3 text-[#F1ECF7] hover:bg-[#693C83]/30 transition-colors duration-200 group"
              >
                <Settings size={18} className="text-[#EDE3F5] flex-shrink-0" />
                <span className="text-sm font-medium">Settings</span>
              </button>

              <div className="border-t border-[#7B6A9A]/30">
                <button
                  className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-500/10 transition-colors duration-200 group"
                  onClick={handleLogout}
                >
                  <LogOut size={18} className="flex-shrink-0" />
                  <span className="text-sm font-medium">Logout</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add animation keyframes */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-8px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.15s ease-out forwards;
        }
      `}</style>
    </header>
  );
};

export default Navbar;
