import "./AttritionKpiCards.css";

export default function AttritionKpiCards({
  totalCount = 23,
  highCount = 20,
  mediumCount = 2,
  lowCount = 1,
  activeFilter = "all", // 'all' | 'high' | 'medium' | 'low'
  onFilterChange = () => {},
  isLight = false,
}) {
  const safeTotal = Math.max(totalCount, 1);

  const cards = [
    {
      id: "all",
      metal: "violet",
      label: "TOTAL RESPONSES",
      value: `${totalCount} ${totalCount === 1 ? "User" : "Users"}`,
      subtitle: "", // Removed color/cluster name as requested
      percent: 88, // Or 100 for full roster bar
      icon: (
        /* 3D Lavender/Violet Users Cluster */
        <svg viewBox="0 0 36 36" fill="none">
          <defs>
            <linearGradient id="uBack" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#e9d5ff" />
              <stop offset="100%" stopColor="#9333ea" />
            </linearGradient>
            <linearGradient id="uFront" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="55%" stopColor="#d8b4fe" />
              <stop offset="100%" stopColor="#7e22ce" />
            </linearGradient>
          </defs>
          {/* Left & Right Rear Users */}
          <circle cx="10.5" cy="14.5" r="3.6" fill="url(#uBack)" />
          <path d="M4.5 25.5c0-3.1 2.7-5.5 6-5.5s6 2.4 6 5.5v1H4.5v-1z" fill="url(#uBack)" opacity="0.9" />
          <circle cx="25.5" cy="14.5" r="3.6" fill="url(#uBack)" />
          <path d="M19.5 25.5c0-3.1 2.7-5.5 6-5.5s6 2.4 6 5.5v1h-12v-1z" fill="url(#uBack)" opacity="0.9" />
          {/* Center Foreground User */}
          <circle cx="18" cy="12.5" r="4.6" fill="url(#uFront)" />
          <path d="M10 27c0-4.1 3.6-7.2 8-7.2s8 3.1 8 7.2v1.2H10V27z" fill="url(#uFront)" />
        </svg>
      ),
    },
    {
      id: "high",
      metal: "crimson",
      label: "HIGH RISK (≥70)",
      value: `${highCount} ${highCount === 1 ? "User" : "Users"}`,
      subtitle: "", // Removed color/cluster name as requested
      percent: Math.max(14, Math.min(100, Math.round((highCount / safeTotal) * 100))),
      icon: (
        /* 3D Multi-Layered Flame */
        <svg viewBox="0 0 36 36" fill="none">
          <defs>
            <linearGradient id="fireOuter" x1="18" y1="4" x2="18" y2="32" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#fb923c" />
              <stop offset="55%" stopColor="#ef4444" />
              <stop offset="100%" stopColor="#991b1b" />
            </linearGradient>
            <linearGradient id="fireInner" x1="18" y1="12" x2="18" y2="31" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#fef08a" />
              <stop offset="65%" stopColor="#facc15" />
              <stop offset="100%" stopColor="#ea580c" />
            </linearGradient>
          </defs>
          <path
            d="M18.8 4.5c.4 4.3-2.6 6.9-4.1 9.8-1.6 3.1-.8 5.8 1.2 6.8-.9-2.2.1-4.5 2.2-5.9-.2 2.7 1.7 4.4 2.9 6.6 1.5 2.8.4 6.8-3.1 8.4 5.9.5 10.6-4.1 10.6-10.1 0-5.4-3.7-9.6-5.7-11.8-.5 1.7-1.6 2.7-2.6 3-.2-2.6-.4-4.9-1.4-6.8z"
            fill="url(#fireOuter)"
          />
          <path
            d="M14.2 11.2c-3.9 3.2-6.7 7.4-6.7 11.7 0 5.5 4.5 9.6 10.5 9.6 6 0 10.5-4.1 10.5-9.6 0-4.7-3.1-8.9-6.6-12.1.3 2.6-.9 4.5-2.4 5.4.4-3.4-1.5-6.7-3.7-9-.1 2.1-.7 3.2-1.6 4z"
            fill="url(#fireOuter)"
          />
          <path
            d="M18.1 15.8c-2.3 2.3-4.6 5.1-4.6 8.4 0 3.4 2.5 5.8 5.2 5.8 3.1 0 5.3-2.4 5.3-5.6 0-2.8-1.9-5.2-3.6-7.2-.2 1.5-1.1 2.5-2.1 2.9.4-1.5.3-3-.2-4.3z"
            fill="url(#fireInner)"
          />
        </svg>
      ),
    },
    {
      id: "medium",
      metal: "bronze",
      label: "MEDIUM RISK",
      value: `${mediumCount} ${mediumCount === 1 ? "User" : "Users"}`,
      subtitle: "", // Removed color/cluster name as requested
      percent: Math.max(14, Math.min(100, Math.round((mediumCount / safeTotal) * 100))),
      icon: (
        /* 3D Sculpted Gold Trophy / Watch Emblem */
        <svg viewBox="0 0 36 36" fill="none">
          <defs>
            <linearGradient id="goldCup" x1="10" y1="6" x2="26" y2="28" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#fef9c3" />
              <stop offset="38%" stopColor="#facc15" />
              <stop offset="80%" stopColor="#ca8a04" />
              <stop offset="100%" stopColor="#854d0e" />
            </linearGradient>
          </defs>
          {/* Handles */}
          <path
            d="M11 9.5H7.8c-.7 0-1.3.6-1.3 1.3 0 4.2 2.4 7.2 5.7 7.8M25 9.5h3.2c.7 0 1.3.6 1.3 1.3 0 4.2-2.4 7.2-5.7 7.8"
            stroke="url(#goldCup)"
            strokeWidth="2.4"
            strokeLinecap="round"
          />
          {/* Cup Body */}
          <path d="M11 7.5h14v7.8c0 4.2-3.1 7.5-7 7.5s-7-3.3-7-7.5V7.5z" fill="url(#goldCup)" />
          {/* Stem & Pedestal */}
          <rect x="16.3" y="22.2" width="3.4" height="4.8" rx="1" fill="url(#goldCup)" />
          <rect x="12" y="26.8" width="12" height="3" rx="1.5" fill="url(#goldCup)" />
        </svg>
      ),
    },
    {
      id: "low",
      metal: "cyan",
      label: "LOW RISK (<40)",
      value: `${lowCount} ${lowCount === 1 ? "User" : "Users"}`,
      subtitle: "", // Removed color/cluster name as requested
      percent: Math.max(14, Math.min(100, Math.round((lowCount / safeTotal) * 100))),
      icon: (
        /* 3D Glowing Cryo-Crystal / Retention Shield */
        <svg viewBox="0 0 36 36" fill="none">
          <defs>
            <linearGradient id="iceCrystal" x1="8" y1="6" x2="28" y2="30" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="45%" stopColor="#67e8f9" />
              <stop offset="100%" stopColor="#0284c7" />
            </linearGradient>
          </defs>
          <g stroke="url(#iceCrystal)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="5.5" x2="18" y2="30.5" />
            <line x1="7.2" y1="11.8" x2="28.8" y2="24.2" />
            <line x1="28.8" y1="11.8" x2="7.2" y2="24.2" />
            {/* Crystal Branches */}
            <path d="M15 8.5L18 11l3-2.5M15 27.5L18 25l3 2.5" />
            <path d="M8.8 15.8l3.8-.6-1.3-3.6M27.2 20.2l-3.8.6 1.3 3.6" />
            <path d="M24.7 11.6l-1.3 3.6 3.8.6M11.3 24.4l1.3-3.6-3.8-.6" />
          </g>
        </svg>
      ),
    },
  ];

  return (
    <div className="metal-kpi-grid">
      {cards.map((card, idx) => {
        const isActive = activeFilter === card.id;

        return (
          <div
            key={card.id}
            onClick={() => onFilterChange(card.id)}
            style={{ "--phase": `${idx * -1.15}s` }}
            className={`metal-kpi-card metal-${card.metal} ${
              isActive ? "is-selected" : ""
            } ${isLight ? "is-light" : ""}`}
          >
            {/* 1. Brushed Metal Micro-Grain (Static GPU Texture - Zero Lag) */}
            <div className="metal-brushed-surface" aria-hidden="true" />

            {/* 2. Studio Corner Specular Reflections (Matches Reference Image) */}
            <div className="metal-studio-bevel" aria-hidden="true" />

            {/* 3. 120FPS Live Anisotropic Metal Shine (Smooth, Decent Rate) */}
            <div className="metal-live-luster" aria-hidden="true" />
            <div className="metal-live-underglow" aria-hidden="true" />

            {/* 4. Machined 3D Rim Highlight */}
            <div className="metal-chamfer-rim" aria-hidden="true" />

            {/* 5. Card Content */}
            <div className="metal-kpi-inner">
              {/* Top Row: Beveled Squircle Icon + Label & Metric */}
              <div className="metal-top-section">
                <div className="metal-icon-squircle">{card.icon}</div>
                <div className="metal-title-stack">
                  <span className="metal-kpi-title">{card.label}</span>
                  <span className="metal-kpi-number">{card.value}</span>
                </div>
              </div>

              {/* Middle Row: Recessed Track + Glowing Tip Filament */}
              <div className="metal-progress-track">
                <div
                  className="metal-progress-bar"
                  style={{ width: `${card.percent}%` }}
                />
              </div>

              {/* Bottom Row: 3D Brushed Silver Filter Pill (Cluster/Color names removed) */}
              <div
                className="metal-bottom-section"
                style={{ justifyContent: card.subtitle ? "space-between" : "flex-end" }}
              >
                {card.subtitle ? (
                  <span className="metal-kpi-sub">{card.subtitle}</span>
                ) : null}
                <button
                  type="button"
                  className="metal-filter-pill"
                  onClick={(e) => {
                    e.stopPropagation();
                    onFilterChange(card.id);
                  }}
                >
                  Filter <span className="metal-filter-arrow">→</span>
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
