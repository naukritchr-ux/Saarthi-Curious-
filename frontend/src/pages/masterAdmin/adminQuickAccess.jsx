import { useNavigate } from "react-router-dom";
import {
  UsersRound,
  Shield,
  BellRing,
  UserPlus,
  BarChart3,
  BookPlus,
} from "lucide-react";

const items = [
  { icon: UsersRound, label: "User Management", path: "/admin/users" },
  { icon: Shield, label: "Role Management", path: "/admin/roles" },
  {
    icon: BellRing,
    label: "Add Notification Scripts",
    path: "/communication/notification-scripts",
  },
  { icon: UserPlus, label: "Add Users", path: "/admin/users" },
  { icon: BarChart3, label: "Reports & Analytics", path: "/reports" },
  { icon: BookPlus, label: "Add Programs", path: "/programs/create" },
];

const AdminQuickAccess = () => {
  const navigate = useNavigate();

  const handleClick = (path) => {
    if (path) {
      navigate(path);
    }
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {items.map((item, index) => {
        const Icon = item.icon;

        return (
          <div
            key={index}
            onClick={() => handleClick(item.path)}
            className={`bg-[#F1ECF7] border border-[#D9CFE8] rounded-xl p-5 flex flex-col items-center justify-center hover:border-[#693C83] hover:shadow-md cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:shadow-lg`}
          >
            <Icon size={24} className="text-[#693C83] mb-2" />

            <p className="text-sm font-medium text-center text-[#1E1B4B]">
              {item.label}
            </p>
          </div>
        );
      })}
    </div>
  );
};

export default AdminQuickAccess;
