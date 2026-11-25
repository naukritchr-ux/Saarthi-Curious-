import { Users, Flame, AlertTriangle, ShieldCheck } from "lucide-react";
import "./AttritionKpiCards.css";

export default function AttritionKpiCards({
  totalCount = 23,
  highCount = 20,
  mediumCount = 2,
  lowCount = 1,
  activeFilter = "all",
  onFilterChange = () => {},
  isLight = false,
}) {
  const safeTotal = Math.max(totalCount, 1);

  const cards = [
    {
      id: "all",
      label: "TOTAL RESPONSES",
      value: `${totalCount} ${totalCount === 1 ? "User" : "Users"}`,
      subtitle: "All Monitored Candidates",
      percent: 100,
      cardCls: "neon-kpi-purple",
      valCls: "text-[#F5D0FE]",
      iconBox:
        "bg-purple-500/20 text-purple-200 border border-purple-300/60 shadow-[0_0_10px_rgba(176,38,255,0.35)]",
      barCls:
        "bg-gradient-to-r from-[#A855F7] via-[#E879F9] to-[#67E8F9] shadow-[0_0_8px_rgba(192,132,252,0.55)]",
      delay: "0s",
      icon: <Users className="w-4 h-4 stroke-[2.2]" />,
    },
    {
      id: "high",
      label: "HIGH RISK (≥70)",
      value: `${highCount} ${highCount === 1 ? "User" : "Users"}`,
      subtitle: `${Math.round((highCount / safeTotal) * 100)}% Severe Velocity`,
      percent: Math.max(14, Math.min(100, Math.round((highCount / safeTotal) * 100))),
      cardCls: "neon-kpi-flame",
      valCls: "text-[#FDA4AF]",
      iconBox:
        "bg-rose-500/20 text-rose-200 border border-rose-300/60 shadow-[0_0_10px_rgba(244,63,94,0.35)]",
      barCls:
        "bg-gradient-to-r from-[#E11D48] via-[#FB7185] to-[#FDE68A] shadow-[0_0_8px_rgba(251,113,133,0.55)]",
      delay: "-1.4s",
      icon: <Flame className="w-4 h-4 stroke-[2.2]" />,
    },
    {
      id: "medium",
      label: "MEDIUM RISK (40-69)",
      value: `${mediumCount} ${mediumCount === 1 ? "User" : "Users"}`,
      subtitle: `${Math.round((mediumCount / safeTotal) * 100)}% Watchlist Cohort`,
      percent: Math.max(14, Math.min(100, Math.round((mediumCount / safeTotal) * 100))),
      cardCls: "neon-kpi-gold",
      valCls: "text-[#FEF08A]",
      iconBox:
        "bg-amber-500/20 text-amber-200 border border-amber-300/60 shadow-[0_0_10px_rgba(245,158,11,0.35)]",
      barCls:
        "bg-gradient-to-r from-[#D97706] via-[#FACC15] to-[#FEF9C3] shadow-[0_0_8px_rgba(250,204,21,0.5)]",
      delay: "-2.8s",
      icon: <AlertTriangle className="w-4 h-4 stroke-[2.2]" />,
    },
    {
      id: "low",
      label: "LOW RISK (<40)",
      value: `${lowCount} ${lowCount === 1 ? "User" : "Users"}`,
      subtitle: `${Math.round((lowCount / safeTotal) * 100)}% Stable Retention`,
      percent: Math.max(14, Math.min(100, Math.round((lowCount / safeTotal) * 100))),
      cardCls: "neon-kpi-cyan",
      valCls: "text-[#A5F3FC]",
      iconBox:
        "bg-cyan-500/20 text-cyan-200 border border-cyan-300/60 shadow-[0_0_10px_rgba(34,211,238,0.35)]",
      barCls:
        "bg-gradient-to-r from-[#0284C7] via-[#22D3EE] to-[#6EE7B7] shadow-[0_0_8px_rgba(34,211,238,0.55)]",
      delay: "-4.2s",
      icon: <ShieldCheck className="w-4 h-4 stroke-[2.2]" />,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 sm:grid-rows-2 gap-4 lg:gap-5 w-full h-full">
      {cards.map((card) => {
        const isActive = activeFilter === card.id;
        return (
          <div
            key={card.id}
            onClick={() => onFilterChange(card.id)}
            style={{ animationDelay: card.delay }}
            className={`cursor-pointer rounded-2xl p-4 flex flex-col justify-between select-none h-full neon-kpi-card ${
              card.cardCls
            } ${isActive ? "is-selected" : ""} ${isLight ? "is-light" : ""}`}
          >
            {/* Top Row: Label + Value + Icon */}
            <div className="flex items-start justify-between gap-2.5 relative z-10">
              <div className="min-w-0">
                <span className="text-[10.5px] font-black uppercase tracking-[0.14em] text-slate-200 block truncate">
                  {card.label}
                </span>
                <span
                  className={`text-2xl font-black font-mono leading-tight mt-1.5 block ${card.valCls}`}
                >
                  {card.value}
                </span>
              </div>

              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${card.iconBox}`}
              >
                {card.icon}
              </div>
            </div>

            {/* Bottom Row: Progress Bar + Subtitle + Filter Pill */}
            <div className="space-y-2.5 relative z-10 pt-3">
              <div className="w-full h-1.5 rounded-full bg-black/60 overflow-hidden">
                <div
                  style={{ width: `${card.percent}%` }}
                  className={`h-full rounded-full transition-all duration-500 ${card.barCls}`}
                />
              </div>

              <div className="flex items-center justify-between gap-2 text-[11px] font-bold text-slate-200">
                <span className="truncate text-slate-300 font-semibold">
                  {card.subtitle}
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onFilterChange(card.id);
                  }}
                  className={`px-2.5 py-0.5 rounded-lg text-[9.5px] font-black uppercase tracking-wider transition shrink-0 cursor-pointer ${
                    isActive
                      ? "bg-white text-slate-950 font-extrabold"
                      : "bg-white/10 hover:bg-white/20 border border-white/25 text-white"
                  }`}
                >
                  {isActive ? "Active ✓" : "Filter →"}
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
