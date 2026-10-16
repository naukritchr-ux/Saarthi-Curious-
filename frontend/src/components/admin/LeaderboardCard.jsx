import { Trophy, Flame } from "lucide-react";

/* Expects a `data` prop: array of { user_id, name, curos, streak, badge } */
export default function LeaderboardCard({ data = [] }) {
  const top = data.slice(0, 5);

  const MEDALS = ["🥇", "🥈", "🥉", "4", "5"];

  return (
    <div
      className="rounded-[22px] p-6"
      style={{
        background: "rgba(15,15,24,0.72)",
        border: "1px solid rgba(139,92,246,0.14)",
        boxShadow: "0 20px 40px -18px rgba(0,0,0,0.7)",
      }}
    >
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              display: "grid",
              placeItems: "center",
              background: "linear-gradient(140deg, #facc15, #f59e0b)",
              boxShadow:
                "0 0 18px rgba(250,204,21,0.55), inset 0 0 12px rgba(255,255,255,0.15)",
            }}
          >
            <Trophy size={16} color="#1a1a1a" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Top Learners</h3>
            <p className="text-[10px] text-purple-200/60 mt-0.5">
              By Curos earned
            </p>
          </div>
        </div>
        <span
          className="text-[10px] text-purple-200/80 rounded-full px-2.5 py-1"
          style={{
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.12)",
          }}
        >
          Leaderboard
        </span>
      </div>

      <div className="space-y-2.5">
        {top.map((user, i) => (
          <div
            key={user.user_id || i}
            className="flex items-center gap-3 p-2.5 rounded-xl"
            style={{
              background:
                i === 0
                  ? "linear-gradient(90deg, rgba(250,204,21,0.10), rgba(250,204,21,0.02))"
                  : "rgba(255,255,255,0.02)",
              border:
                i === 0
                  ? "1px solid rgba(250,204,21,0.22)"
                  : "1px solid rgba(255,255,255,0.04)",
            }}
          >
            <span
              style={{
                width: 30,
                height: 30,
                borderRadius: 8,
                display: "grid",
                placeItems: "center",
                background:
                  i === 0
                    ? "linear-gradient(140deg, #facc15, #f59e0b)"
                    : "rgba(255,255,255,0.06)",
                color: i === 0 ? "#1a1a1a" : "#d0c8e8",
                fontWeight: 800,
                fontSize: 12,
              }}
            >
              {MEDALS[i]}
            </span>

            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-white truncate">
                {user.name || `User ${user.user_id}`}
              </p>
              <p className="text-[10px] text-purple-200/60 mt-0.5 flex items-center gap-1">
                <Flame size={10} color="#fb923c" />
                {user.streak ?? 0}-day streak · {user.badge ?? "0"} badges
              </p>
            </div>

            <div className="text-right">
              <p
                style={{
                  color: "#facc15",
                  fontWeight: 800,
                  fontSize: 14,
                  textShadow: "0 0 10px rgba(250,204,21,0.5)",
                }}
              >
                {user.curos ?? 0}
              </p>
              <p className="text-[9px] text-purple-200/50 mt-0.5">Curos</p>
            </div>
          </div>
        ))}

        {top.length === 0 && (
          <p className="text-xs text-purple-200/50 py-3 text-center">
            No learners yet.
          </p>
        )}
      </div>
    </div>
  );
}
