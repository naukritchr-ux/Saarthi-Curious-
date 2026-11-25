const SURFACE_PALETTE = [
  {
    surface: "metal-gloss-purple",
    barGrad: "from-purple-400 via-fuchsia-300 to-indigo-300",
    valCol: "text-white",
  },
  {
    surface: "metal-gloss-cyan",
    barGrad: "from-cyan-400 via-sky-300 to-indigo-300",
    valCol: "text-cyan-300",
  },
  {
    surface: "metal-gloss-amber",
    barGrad: "from-amber-400 via-yellow-300 to-orange-300",
    valCol: "text-amber-300",
  },
  {
    surface: "metal-gloss-emerald",
    barGrad: "from-emerald-400 via-teal-300 to-cyan-300",
    valCol: "text-emerald-300",
  },
  {
    surface: "metal-gloss-rose",
    barGrad: "from-rose-500 via-pink-400 to-amber-300",
    valCol: "text-rose-300",
  },
  {
    surface: "metal-gloss-purple",
    barGrad: "from-fuchsia-400 via-purple-300 to-violet-300",
    valCol: "text-purple-300",
  },
];

const UserStats = ({ stats = [] }) => {
  return (
    <div className="space-y-4">
      <style>{`
        .metal-gloss-purple {
          background:
            radial-gradient(circle at 88% 14%, rgba(255, 255, 255, 0.34) 0%, rgba(192, 132, 252, 0.16) 28%, transparent 62%),
            linear-gradient(135deg, #352F5B 0%, #211F3D 52%, #14142B 100%);
          border: 1.5px solid rgba(216, 180, 254, 0.55);
          box-shadow: 0 14px 34px rgba(0, 0, 0, 0.72), inset 0 1.5px 2px rgba(255, 255, 255, 0.45);
        }
        .metal-gloss-emerald {
          background:
            radial-gradient(circle at 88% 14%, rgba(255, 255, 255, 0.34) 0%, rgba(52, 211, 153, 0.2) 28%, transparent 62%),
            linear-gradient(135deg, #1E3F3B 0%, #14292B 52%, #0D1A20 100%);
          border: 1.5px solid rgba(110, 231, 183, 0.55);
          box-shadow: 0 14px 34px rgba(0, 0, 0, 0.72), inset 0 1.5px 2px rgba(255, 255, 255, 0.45);
        }
        .metal-gloss-rose {
          background:
            radial-gradient(circle at 88% 14%, rgba(255, 255, 255, 0.34) 0%, rgba(251, 113, 133, 0.2) 28%, transparent 62%),
            linear-gradient(135deg, #49263B 0%, #2B192C 52%, #181120 100%);
          border: 1.5px solid rgba(253, 164, 175, 0.55);
          box-shadow: 0 14px 34px rgba(0, 0, 0, 0.72), inset 0 1.5px 2px rgba(255, 255, 255, 0.45);
        }
        .metal-gloss-amber {
          background:
            radial-gradient(circle at 88% 14%, rgba(255, 255, 255, 0.36) 0%, rgba(251, 191, 36, 0.18) 28%, transparent 62%),
            linear-gradient(135deg, #463730 0%, #292228 52%, #181622 100%);
          border: 1.5px solid rgba(253, 224, 71, 0.58);
          box-shadow: 0 14px 34px rgba(0, 0, 0, 0.72), inset 0 1.5px 2px rgba(255, 255, 255, 0.45);
        }
        .metal-gloss-cyan {
          background:
            radial-gradient(circle at 88% 14%, rgba(255, 255, 255, 0.36) 0%, rgba(56, 189, 248, 0.2) 28%, transparent 62%),
            linear-gradient(135deg, #243B55 0%, #17263C 52%, #0F1829 100%);
          border: 1.5px solid rgba(125, 211, 252, 0.58);
          box-shadow: 0 14px 34px rgba(0, 0, 0, 0.72), inset 0 1.5px 2px rgba(255, 255, 255, 0.45);
        }
      `}</style>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6">
        {stats.map((item, idx) => {
          const Icon = item.icon;
          const pal = SURFACE_PALETTE[idx % SURFACE_PALETTE.length];
          return (
            <article
              key={item.label}
              className={`rounded-3xl p-5 transition-all duration-200 hover:-translate-y-1 flex flex-col justify-between space-y-3 ${pal.surface}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/25 flex items-center justify-center text-white shadow-inner">
                    <Icon size={18} />
                  </div>
                  <div>
                    <span className="text-[10.5px] font-black tracking-wider opacity-85 block uppercase truncate max-w-[120px]">
                      {item.label}
                    </span>
                    <span className={`text-2xl font-black leading-tight block ${pal.valCol}`}>
                      {item.value}
                    </span>
                  </div>
                </div>
              </div>

              <div className="w-full h-2 rounded-full bg-slate-950/60 p-0.5 border border-white/20 overflow-hidden">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${pal.barGrad}`}
                  style={{ width: `${Math.min(100, Math.max(15, (Number(item.value) || 1) * 8))}%` }}
                />
              </div>

              <span className="text-[10.5px] font-semibold opacity-75 block truncate">
                Role Telemetry Active
              </span>
            </article>
          );
        })}
      </div>
    </div>
  );
};

export default UserStats;
