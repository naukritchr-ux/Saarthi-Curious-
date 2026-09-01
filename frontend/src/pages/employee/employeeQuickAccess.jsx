import {
  ClipboardCheck,
  Award,
  FileBadge2,
  BookOpen,
} from "lucide-react";

const EmployeeQuickAccess = () => {
const actions = [
  {
    title: "Courses",
    icon: <BookOpen size={30} />,
    color: "bg-blue-50",
    iconColor: "text-blue-600",
  },
  {
    title: "Take Quiz",
    icon: <ClipboardCheck size={30} />,
    color: "bg-green-50",
    iconColor: "text-green-600",
  },
  {
    title: "My Badges",
    icon: <Award size={30} />,
    color: "bg-yellow-50",
    iconColor: "text-yellow-600",
  },
  {
    title: "Certificates",
    icon: <FileBadge2 size={30} />,
    color: "bg-purple-50",
    iconColor: "text-purple-600",
  },
];

return (
  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
    {actions.map((item) => (
      <div
        key={item.title}
        className={`${item.color} rounded-2xl p-6 flex flex-col items-center border border-gray-200 hover:scale-105 hover:shadow-lg transition-all duration-300 cursor-pointer`}
      >
        <div className={`${item.iconColor}`}>
          {item.icon}
        </div>

        <p className="mt-4 font-semibold text-[#1E1B4B]">
          {item.title}
        </p>
      </div>
    ))}
  </div>
);
};

export default EmployeeQuickAccess;