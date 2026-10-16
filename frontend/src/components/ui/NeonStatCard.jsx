import { Area, AreaChart, ResponsiveContainer } from "recharts";
import { TrendingUp } from "lucide-react";

const NeonStatCard = ({
  title,
  value,
  delta,
  spark = [],
  color = "#a78bfa",
  icon: Icon,
  index = 0,
}) => {
  const gid = `ng${title.replace(/\W/g, "")}`;
  const data = spark.map((v, i) => ({ i, v }));

  return (
    <div
      className="neon-card p-4 flex items-center gap-4"
      style={{ animationDelay: `${index * 0.7}s` }}
    >
      {/* Metallic Icon Container with Specular Highlight Overlay */}
      <div
        className="neon-icon relative overflow-hidden w-14 h-14 shrink-0 rounded-2xl flex items-center justify-center text-white"
        style={{
          background: `linear-gradient(140deg, ${color}, ${color}55)`,
          "--glow": `${color}88`,
          boxShadow: `0 0 22px ${color}88, 0 0 0 1px rgba(255, 255, 255, 0.18) inset, 0 -3px 8px rgba(0, 0, 0, 0.5) inset, 0 8px 16px rgba(0, 0, 0, 0.45)`,
        }}
      >
        {/* Diagonal specular highlight overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "linear-gradient(135deg, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0.10) 25%, transparent 45%)",
          }}
        />
        <Icon size={24} className="relative z-10" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-[11px] text-purple-200/70 truncate">{title}</p>
        <div className="flex items-end gap-2 mt-0.5">
          <h2
            className="text-3xl font-black text-white tabular-nums leading-none"
            style={{ textShadow: "0 0 20px rgba(255,255,255,0.15)" }}
          >
            {value}
          </h2>
          {delta != null && (
            <span className="text-[11px] font-semibold text-emerald-400 flex items-center gap-0.5 mb-1">
              <TrendingUp size={12} />
              {delta}
            </span>
          )}
        </div>
      </div>

      <div className="w-24 h-10 shrink-0 opacity-95">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.7} />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey="v"
              stroke={color}
              strokeWidth={2.5}
              fill={`url(#${gid})`}
              dot={{ r: 2.5, fill: color, strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default NeonStatCard;
