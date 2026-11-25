import { useState, useEffect } from "react";
import axios from "axios";
import {
  Calendar,
  Clock,
  Sparkles,
  CheckCircle2,
  ExternalLink,
  X,
  Video,
} from "lucide-react";

const API_BASE_URL =
  import.meta.env?.VITE_API_URL ||
  (typeof window !== "undefined" &&
  (window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1")
    ? "http://127.0.0.1:8000"
    : "https://saarthi-curious-00e8.onrender.com");

function getAuthHeaders() {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("token") || localStorage.getItem("access_token")
      : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function MeetingSchedulerModal({
  isOpen,
  onClose,
  attendee,
  onQueued,
}) {
  const [slots, setSlots] = useState([]);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [connected, setConnected] = useState(false);
  const [source, setSource] = useState("deterministic_fallback");
  const [agenda, setAgenda] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [doneMsg, setDoneMsg] = useState(null);

  useEffect(() => {
    if (!isOpen || !attendee) return;
    let cancelled = false;
    const t = setTimeout(() => {
      if (cancelled) return;
      setDoneMsg(null);
      setAgenda(
        attendee.aiPrescription ||
          attendee.ai_prescription ||
          `15-min progress review with ${attendee.name}: unblock stalled modules and review quiz readiness.`
      );
      setLoading(true);
      axios
        .get(`${API_BASE_URL}/api/integrations/google/free-slots`, {
          params: { days: 3 },
          headers: getAuthHeaders(),
        })
        .then((res) => {
          if (cancelled) return;
          setSlots(res.data?.slots || []);
          setConnected(Boolean(res.data?.connected));
          setSource(res.data?.source || "deterministic_fallback");
          setSelectedIdx(0);
        })
        .catch(() => {
          if (cancelled) return;
          setSlots([
            {
              label: "Tomorrow • 11:00 AM IST",
              start_iso: new Date(Date.now() + 86400000).toISOString(),
              end_iso: new Date(Date.now() + 86400000 + 900000).toISOString(),
            },
            {
              label: "Tomorrow • 04:00 PM IST",
              start_iso: new Date(Date.now() + 104400000).toISOString(),
              end_iso: new Date(Date.now() + 104400000 + 900000).toISOString(),
            },
          ]);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 0);

    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [isOpen, attendee]);

  if (!isOpen || !attendee) return null;

  const handleConnectGoogle = async () => {
    try {
      const res = await axios.get(
        `${API_BASE_URL}/api/integrations/google/auth-url`,
        { headers: getAuthHeaders() }
      );
      if (res.data?.auth_url) {
        window.location.href = res.data.auth_url;
      } else {
        setDoneMsg(
          res.data?.message ||
            "Google OAuth keys not set yet — ICS fallback booking works immediately."
        );
      }
    } catch {
      setDoneMsg("Unable to reach OAuth route. ICS fallback booking is ready.");
    }
  };

  const handleQueueBooking = async () => {
    const slot = slots[selectedIdx];
    if (!slot) return;
    setSubmitting(true);
    try {
      const res = await axios.post(
        `${API_BASE_URL}/api/integrations/meetings/queue`,
        {
          attendee_name: attendee.name,
          attendee_email: attendee.email || "",
          start_iso: slot.start_iso,
          end_iso: slot.end_iso,
          slot_label: slot.label,
          agenda,
        },
        { headers: getAuthHeaders() }
      );
      setDoneMsg(
        `Booking card queued for ${slot.label}. Approve it in the Agent Inbox to dispatch the invite.`
      );
      if (onQueued) onQueued(res.data?.action);
    } catch {
      setDoneMsg("Could not queue booking—check FastAPI connection.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/82 backdrop-blur-md p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-3xl p-6 bg-[#0B1020] border-2 border-amber-400/70 shadow-[0_24px_75px_rgba(0,0,0,0.95)] text-white space-y-5"
      >
        <div className="flex items-start justify-between gap-3 border-b border-white/15 pb-4">
          <div>
            <span className="text-[10px] font-black uppercase tracking-[0.22em] text-amber-300 flex items-center gap-1.5">
              <Video className="w-3.5 h-3.5" />
              <span>COACHING SESSION SCHEDULER</span>
            </span>
            <h3 className="text-xl font-black mt-1">
              Book Call with {attendee.name}
            </h3>
            <p className="text-xs text-slate-300 mt-0.5">{attendee.email}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Google Calendar Status Bar */}
        <div className="p-3 rounded-2xl bg-[#070914] border border-white/15 flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="font-bold text-slate-200 inline-flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                connected ? "bg-emerald-400" : "bg-amber-400"
              }`}
            />
            {connected
              ? "Google Calendar Connected (Live Meet Links)"
              : "Calendar Backup Mode (ICS + Email Invite)"}
          </span>
          {!connected && (
            <button
              type="button"
              onClick={handleConnectGoogle}
              className="px-2.5 py-1 rounded-lg bg-amber-400/20 hover:bg-amber-400/35 border border-amber-300/60 text-amber-200 font-extrabold inline-flex items-center gap-1 cursor-pointer"
            >
              <span>Connect Google</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Free Slots Grid */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-wider text-cyan-200">
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              <span>Select 15-Min Slot (IST)</span>
            </span>
            <span className="text-[10px] font-mono text-slate-400">
              {source === "google_calendar" ? "Live FreeBusy" : "Default Slots"}
            </span>
          </div>

          {loading ? (
            <div className="p-4 text-center text-xs text-slate-300 animate-pulse">
              Checking calendar availability...
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {slots.map((slot, idx) => (
                <button
                  key={slot.start_iso}
                  type="button"
                  onClick={() => setSelectedIdx(idx)}
                  className={`p-2.5 rounded-xl text-left text-xs font-bold inline-flex items-center gap-2 cursor-pointer transition border ${
                    selectedIdx === idx
                      ? "bg-amber-400/20 border-amber-300 text-amber-100"
                      : "bg-[#070914] border-white/15 text-slate-300 hover:border-cyan-400/60"
                  }`}
                >
                  <Clock className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                  <span className="truncate">{slot.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Editable Agenda */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-black uppercase tracking-wider text-emerald-300 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Coaching Agenda (Sent in Invite)</span>
          </label>
          <textarea
            rows={3}
            value={agenda}
            onChange={(e) => setAgenda(e.target.value)}
            className="w-full rounded-xl bg-[#070914] border border-white/20 focus:border-amber-300 px-3.5 py-2.5 text-xs text-white outline-none resize-none"
          />
        </div>

        {doneMsg && (
          <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-400/50 text-xs font-bold text-emerald-200 flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{doneMsg}</span>
          </div>
        )}

        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-white/15">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-bold cursor-pointer"
          >
            Close
          </button>
          <button
            type="button"
            disabled={submitting || slots.length === 0}
            onClick={handleQueueBooking}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 text-slate-950 text-xs font-black cursor-pointer disabled:opacity-50"
          >
            {submitting ? "Queuing..." : "Queue Booking for Approval"}
          </button>
        </div>
      </div>
    </div>
  );
}

