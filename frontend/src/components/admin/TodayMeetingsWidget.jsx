import { useEffect, useState } from "react";
import { Calendar, Video, Clock } from "lucide-react";
import { getMonthCalendar } from "../../services/bookingApi";

const MONTH_KEY = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

const TODAY_ISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const fmt = (hhmm) => {
  if (!hhmm) return "";
  const [h, m] = hhmm.split(":").map(Number);
  const s = h >= 12 ? "PM" : "AM";
  const hr = h % 12 === 0 ? 12 : h % 12;
  return `${hr}:${String(m).padStart(2, "0")} ${s}`;
};

export default function TodayMeetingsWidget({ adminId = 57 }) {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getMonthCalendar(MONTH_KEY(), adminId)
      .then((rows) => {
        if (cancelled) return;
        const today = TODAY_ISO();
        const todayMeetings = rows
          .filter((s) => s.date === today && s.booking)
          .sort((a, b) => a.start.localeCompare(b.start))
          .map((s) => ({
            slotId: s.id,
            start: s.start,
            end: s.end,
            status: s.booking.booking_status,
            userName: s.booking.user_name,
            userEmail: s.booking.user_email,
            meetingLink: s.booking.meeting_link,
          }));
        setMeetings(todayMeetings);
      })
      .catch((e) => console.error("[TodayMeetings]", e))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [adminId]);

  return (
    <div
      className="rounded-[22px] p-5 h-full"
      style={{
        background: "rgba(15,15,24,0.72)",
        border: "1px solid rgba(139,92,246,0.14)",
        boxShadow: "0 20px 40px -18px rgba(0,0,0,0.7)",
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div
            style={{
              width: 34, height: 34, borderRadius: 10, display: "grid", placeItems: "center",
              background: "linear-gradient(140deg, #3ea1e6, #1f6fa8)",
              boxShadow: "0 0 18px rgba(62,161,230,0.45), inset 0 0 12px rgba(255,255,255,0.15)",
            }}
          >
            <Calendar size={16} color="#0a1420" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Today's Meetings</h3>
            <p className="text-[10px] text-purple-200/60 mt-0.5">
              {loading ? "Loading…" : `${meetings.length} scheduled`}
            </p>
          </div>
        </div>
      </div>

      {!loading && meetings.length === 0 && (
        <p className="text-xs text-purple-200/60 py-4 text-center">
          No calls scheduled for today.
        </p>
      )}

      <div className="space-y-2">
        {meetings.map((m) => (
          <div
            key={m.slotId}
            className="flex items-center gap-3 p-2.5 rounded-xl"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <div className="flex flex-col items-center" style={{ minWidth: 44 }}>
              <span className="text-xs font-bold text-white">{fmt(m.start)}</span>
              <span className="text-[9px] text-purple-200/50 mt-0.5">to {fmt(m.end)}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">{m.userName}</p>
              <p className="text-[10px] text-purple-200/60 truncate">{m.userEmail}</p>
            </div>
            {m.status === "pending" && (
              <span
                className="text-[10px] px-2 py-1 rounded-full font-semibold"
                style={{
                  background: "rgba(56,152,219,0.15)",
                  color: "#9bd2f7",
                  border: "1px solid rgba(56,152,219,0.4)",
                }}
              >
                Pending
              </span>
            )}
            {m.status === "confirmed" && m.meetingLink && m.meetingLink.startsWith("http") && (
              <a
                href={m.meetingLink}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-lg"
                style={{
                  background: "rgba(62,161,230,0.15)",
                  color: "#cfe8fb",
                  border: "1px solid rgba(62,161,230,0.4)",
                }}
              >
                <Video size={11} /> Meet
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
