import { useMemo } from "react";

const COLORS = [
  "#fbbf24",  // bright amber
  "#a855f7",  // bright purple
  "#2dd4bf",  // bright teal
  "#3b82f6",  // bright blue
  "#ec4899",  // bright pink
  "#f43f5e",  // bright rose
  "#22c55e",  // bright emerald
];

function polar(cx, cy, r, angleDeg) {
  const a = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
}

function PieSlice({ cx, cy, r, startAngle, endAngle, fill }) {
  const innerR = r * 0.55;
  const start = polar(cx, cy, r, endAngle);
  const end = polar(cx, cy, r, startAngle);
  const innerStart = polar(cx, cy, innerR, endAngle);
  const innerEnd = polar(cx, cy, innerR, startAngle);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  const path = [
    `M ${start.x} ${start.y}`,
    `A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y}`,
    `L ${innerEnd.x} ${innerEnd.y}`,
    `A ${innerR} ${innerR} 0 ${largeArc} 1 ${innerStart.x} ${innerStart.y}`,
    "Z",
  ].join(" ");
  return <path d={path} fill={fill} />;
}

function darken(hex, amount = 0.55) {
  const h = hex.replace("#", "");
  const r = Math.floor(parseInt(h.slice(0, 2), 16) * amount);
  const g = Math.floor(parseInt(h.slice(2, 4), 16) * amount);
  const b = Math.floor(parseInt(h.slice(4, 6), 16) * amount);
  const hex2 = (n) => n.toString(16).padStart(2, "0");
  return `#${hex2(r)}${hex2(g)}${hex2(b)}`;
}

export default function UserDistribution3D({ data = [] }) {
  const rows = useMemo(() => {
    // Deduplicate and aggregate graph data by role to fix duplicate user analysis data
    const map = new Map();
    (data || []).forEach((d) => {
      const name = d.display_name || d.role_name || (d.role_id ? `Role ${d.role_id}` : "") || "User";
      const val = Number(d.count ?? d.value ?? 0);
      if (val > 0) {
        if (map.has(name)) {
          map.get(name).value += val;
        } else {
          map.set(name, { name, value: val });
        }
      }
    });
    return Array.from(map.values()).map((r, i) => ({
      ...r,
      color: COLORS[i % COLORS.length],
    }));
  }, [data]);

  const total = rows.reduce((s, r) => s + r.value, 0);

  const slices = useMemo(() => {
    let acc = 0;
    return rows.map((r) => {
      const angle = total > 0 ? (r.value / total) * 360 : 0;
      const start = acc;
      acc += angle;
      return { ...r, start, end: acc };
    });
  }, [rows, total]);

  const LAYERS = 14;
  const LAYER_GAP = 1.6;

  return (
    <div
      className="rounded-[22px] p-6"
      style={{
        background: "rgba(15,15,24,0.72)",
        border: "1px solid rgba(139,92,246,0.14)",
        boxShadow: "0 20px 40px -18px rgba(0,0,0,0.7)",
        minHeight: 320,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-white">User Distribution</h3>
          <p className="text-[10px] text-purple-200/60 mt-0.5">Across all roles</p>
        </div>
        <span
          className="text-[10px] text-purple-200/80 rounded-full px-2.5 py-1"
          style={{
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.12)",
          }}
        >
          Total Users
        </span>
      </div>

      <div className="flex items-center gap-6 flex-1">
        {/* Rotating 3D disc */}
        <div
          className="relative shrink-0"
          style={{ width: 230, height: 230, perspective: 800 }}
        >
          {/* Ground glow under the disc */}
          <div
            style={{
              position: "absolute",
              left: "50%",
              bottom: 6,
              transform: "translateX(-50%)",
              width: 180,
              height: 26,
              background:
                "radial-gradient(ellipse at center, rgba(139,92,246,0.55), rgba(34,211,238,0.2) 45%, transparent 75%)",
              filter: "blur(14px)",
              pointerEvents: "none",
            }}
          />

          <div
            style={{
              position: "absolute",
              inset: 0,
              transformStyle: "preserve-3d",
              animation: "wheel3DSpin 24s linear infinite",
            }}
          >
            {Array.from({ length: LAYERS }).map((_, i) => {
              const depth = (LAYERS - 1 - i) * LAYER_GAP;
              const isTop = i === LAYERS - 1;
              return (
                <svg
                  key={i}
                  viewBox="0 0 200 200"
                  style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    transform: `translateZ(${depth}px)`,
                    filter: isTop
                      ? "drop-shadow(0 0 32px rgba(139,92,246,0.75))"
                      : "brightness(0.5)",
                    opacity: isTop ? 1 : 0.92,
                  }}
                >
                  <circle cx="100" cy="100" r="90" fill="#0a0a14" />
                  {slices.map((s, idx) => (
                    <PieSlice
                      key={idx}
                      cx={100}
                      cy={100}
                      r={88}
                      startAngle={s.start}
                      endAngle={s.end}
                      fill={isTop ? s.color : darken(s.color, 0.7)}
                    />
                  ))}
                  <circle cx="100" cy="100" r="48" fill="#0a0a14" />
                </svg>
              );
            })}
          </div>

          {/* Center label (not tilted) */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              pointerEvents: "none",
            }}
          >
            <p
              className="text-3xl font-black text-white"
              style={{
                textShadow:
                  "0 0 16px rgba(139,92,246,0.95), 0 0 34px rgba(34,211,238,0.55)",
              }}
            >
              {total}
            </p>
            <p className="text-[10px] text-purple-200/80 tracking-[0.2em] uppercase mt-1">
              Total Users
            </p>
          </div>
        </div>

        {/* Legend */}
        <div className="flex-1 space-y-2 min-w-0">
          {rows.map((r) => (
            <div key={r.name} className="flex items-center gap-2 text-[11px]">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ background: r.color, boxShadow: `0 0 10px ${r.color}` }}
              />
              <span className="text-purple-100/90 truncate flex-1">{r.name}</span>
              <span className="text-white font-semibold tabular-nums">{r.value}</span>
              <span className="text-purple-300/60 w-9 text-right tabular-nums">
                {total ? Math.round((r.value / total) * 100) : 0}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
