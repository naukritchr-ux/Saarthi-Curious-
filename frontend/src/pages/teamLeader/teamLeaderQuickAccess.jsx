import { Users, ChartPie, Trophy } from "lucide-react";
import { useNavigate } from "react-router-dom";

const items = [
  {
    icon: Users,
    label: "Team Directory",
    path: "/team-directory",
  },
  {
    icon: ChartPie,
    label: "Team Reports",
    path: "/reports",
  },
  {
    icon: Trophy,
    label: "LeaderBoard",
    path: "/leaderboards",
  },
];

const TeamLeaderQuickAccess = () => {
  const navigate = useNavigate();

  const handleClick = (path) => {
    if (path) {
      navigate(path);
    }
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {items.map((item, index) => {
        const Icon = item.icon;

        return (
          <div
            key={index}
            className="bg-[#F1ECF7] border border-[#D9CFE8] rounded-xl p-5 flex flex-col items-center justify-center hover:border-[#693C83] hover:shadow-md cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:shadow-lg"
            onClick={() => handleClick(item.path)}
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

export default TeamLeaderQuickAccess;
