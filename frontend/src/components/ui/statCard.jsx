import React from "react";

const StatCard = ({
  title,
  value,
  change,
  subtitle,
  icon,
  iconBg,
  multiline = false,
}) => {
  return (
    <div className="bg-[#F1ECF7] border border-[#D9CFE8] rounded-2xl p-5 shadow-lg shadow-black/10 hover:scale-[1.02] hover:shadow-lg transition-all duration-300 cursor-pointer">
      <div className="flex items-center gap-5">
        <div
          className={`w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0 ${iconBg}`}
        >
          {icon}
        </div>

        <div className="flex-1">
          <h3 className="text-[#1E1B4B] text-sm">{title}</h3>

          <h2 className="text-4xl font-bold text-[#1E1B4B] mt-1">{value}</h2>

          {subtitle && subtitle.trim().length > 0 && (
            <span
              className={`text-[#10B981] font-medium block mt-1 ${
                multiline ? "text-xs" : "text-sm"
              }`}
            >
              {multiline ? change : `↑ ${change}`}
              <p className="text-xs text-[#4F4679] mt-1">{subtitle}</p>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default StatCard;
