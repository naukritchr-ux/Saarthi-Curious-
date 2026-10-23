import { useNavigate } from "react-router-dom";
import {
  UserPlus,
  ShieldCheck,
  BellRing,
  ChartColumn,
  BookOpen,
  Flame,
  CalendarDays,
} from "lucide-react";

const QUICK = [
  { label: "User Management", path: "/admin/users", icon: UserPlus, c: "#8b5cf6" },
  { label: "Role Management", path: "/admin/roles", icon: ShieldCheck, c: "#0ea5e9" },
  { label: "Add Notification Scripts", path: "/communication/notification-scripts", icon: BellRing, c: "#f97316" },
  { label: "Add Users", path: "/admin/users", icon: UserPlus, c: "#a855f7" },
  { label: "Analytics", path: "/reports", icon: ChartColumn, c: "#14b8a6" },
  { label: "Add Programs", path: "/programs/create", icon: BookOpen, c: "#db2777" },
  { label: "Streak Management", path: "/admin/streak-management", icon: Flame, c: "#ef4444" },
  { label: "Saarthi Calendar", path: "/admin/reschedule", icon: CalendarDays, c: "#22c55e" },
];

const AdminQuickAccess = () => {
  const navigate = useNavigate();

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, width: "100%" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, flex: 1 }}>
        {QUICK.map((q) => (
          <button
            key={q.label}
            onClick={() => navigate(q.path)}
            style={{
              padding: "20px 16px",
              borderRadius: 18,
              border: `1px solid ${q.c}55`,
              background: `linear-gradient(140deg, ${q.c}ee, ${q.c}44)`,
              color: "#fff",
              fontSize: 12,
              fontWeight: 700,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              cursor: "pointer",
              transition: "transform 180ms ease, box-shadow 180ms ease",
              boxShadow: `0 6px 16px ${q.c}33, inset 0 2px 4px rgba(255,255,255,0.18), inset 0 -3px 6px rgba(0,0,0,0.35)`,
              minHeight: 88,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = `0 12px 24px ${q.c}55, inset 0 2px 4px rgba(255,255,255,0.25), inset 0 -3px 6px rgba(0,0,0,0.35)`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = `0 6px 16px ${q.c}33, inset 0 2px 4px rgba(255,255,255,0.18), inset 0 -3px 6px rgba(0,0,0,0.35)`;
            }}
          >
            <q.icon size={22} style={{ filter: "drop-shadow(0 2px 3px rgba(0,0,0,0.4))" }} />
            <span style={{ textAlign: "center", lineHeight: 1.3 }}>{q.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default AdminQuickAccess;
