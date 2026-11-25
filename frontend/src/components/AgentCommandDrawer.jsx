import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { supabase } from "../lib/supabase";
import {
  Bell,
  Sparkles,
  ShieldCheck,
  Check,
  X,
  Send,
  Cpu,
  Play,
  AlertTriangle,
  Clock,
  CheckCircle2,
} from "lucide-react";

const API_BASE_URL =
  import.meta.env?.VITE_API_URL ||
  (typeof window !== "undefined" &&
  (window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1")
    ? "http://127.0.0.1:8000"
    : "https://saarthi-curious-00e8.onrender.com");

function getAuthHeaders() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function AgentCommandDrawer({ onNavigate }) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("approvals"); // 'approvals' | 'alerts' | 'command'
  const [actions, setActions] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [prompt, setPrompt] = useState("");
  const [busy, setBusy] = useState(false);
  const [lastEngine, setLastEngine] = useState("saarthi_ai");
  const [commandLog, setCommandLog] = useState([]);

  const fetchInbox = useCallback(async () => {
    try {
      const headers = getAuthHeaders();
      const [actRes, notRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/agent/actions`, {
          params: { status: "pending" },
          headers,
        }),
        axios.get(`${API_BASE_URL}/api/agent/notifications`, { headers }),
      ]);
      setActions(actRes.data?.actions || []);
      setNotifications(notRes.data?.notifications || []);
    } catch {
      // Silent retry next cycle
    }
  }, []);

  useEffect(() => {
    const initTimer = setTimeout(() => {
      fetchInbox();
    }, 0);

    let channel = null;
    if (supabase?.channel) {
      channel = supabase
        .channel("saarthi-agent-inbox")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "agent_action_queue" },
          () => fetchInbox()
        )
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "agent_notifications" },
          () => fetchInbox()
        )
        .subscribe();
    }

    // Safe polling fallback (30s reconciliation when Realtime is active, 15s otherwise)
    const timer = setInterval(fetchInbox, channel ? 30000 : 15000);
    return () => {
      clearTimeout(initTimer);
      clearInterval(timer);
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [fetchInbox]);

  // Ctrl+K / Cmd+K shortcut to open Command Tab
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(true);
        setActiveTab("command");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const handleDecision = async (actionId, decision) => {
    setBusy(true);
    try {
      await axios.post(
        `${API_BASE_URL}/api/agent/actions/${actionId}/decision`,
        { decision },
        { headers: getAuthHeaders() }
      );
      await fetchInbox();
    } finally {
      setBusy(false);
    }
  };

  const handleRunCommand = async (customText) => {
    const text = (customText || prompt).trim();
    if (!text) return;
    setPrompt("");
    setBusy(true);
    setCommandLog((prev) => [...prev, { role: "user", text }]);

    try {
      const res = await axios.post(
        `${API_BASE_URL}/api/agent/command`,
        { prompt: text },
        { headers: getAuthHeaders() }
      );
      const data = res.data || {};
      setLastEngine(data.engine || "deterministic_backup");
      setCommandLog((prev) => [
        ...prev,
        {
          role: "agent",
          text: data.answer || "Workflow executed.",
          engine: data.engine,
        },
      ]);
      if (data.queued_action) {
        await fetchInbox();
        setActiveTab("approvals");
      }
      if (data.ui_action?.route && onNavigate) {
        onNavigate(data.ui_action.route);
      }
    } catch {
      setCommandLog((prev) => [
        ...prev,
        {
          role: "agent",
          text: "Backend unreachable or unauthorized. Verify FastAPI server & Admin session.",
          engine: "offline",
        },
      ]);
    } finally {
      setBusy(false);
    }
  };

  const handleRunDailyPlaybook = async () => {
    setBusy(true);
    try {
      const res = await axios.post(
        `${API_BASE_URL}/api/agent/workflows/run-daily`,
        {},
        { headers: getAuthHeaders() }
      );
      const d = res.data || {};
      setLastEngine("deterministic_backup");
      setCommandLog((prev) => [
        ...prev,
        {
          role: "agent",
          engine: "deterministic_backup",
          text: `Daily Backup Workflow complete: ${d.nudges_sent || 0} nudges sent, ${
            d.nudges_skipped_cooldown || 0
          } skipped (72h cooldown), ${d.tier3_cards_queued || 0} Tier-3 approvals queued.`,
        },
      ]);
      await fetchInbox();
      if ((d.tier3_cards_queued || 0) > 0) setActiveTab("approvals");
    } finally {
      setBusy(false);
    }
  };

  const unreadCount =
    actions.length + notifications.filter((n) => !n.is_read).length;

  return (
    <>
      {/* Trigger Button (Inside Navbar Header) */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="relative px-3 py-2 rounded-xl bg-[#100D1E] border border-amber-400/50 hover:border-amber-300 text-amber-200 inline-flex items-center gap-2 text-xs font-black cursor-pointer transition"
      >
        <Bell className="w-4 h-4 text-amber-300" />
        <span className="hidden sm:inline">Agent Inbox</span>
        {unreadCount > 0 && (
          <span className="px-1.5 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black font-mono">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Slide-Over Obsidian + 24K Gold Agent Drawer */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex justify-end"
        >
          <aside
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md h-full bg-[#090814] border-l-2 border-amber-400/60 shadow-2xl flex flex-col justify-between text-white"
          >
            {/* Header */}
            <div className="p-5 border-b border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-400/20 border border-amber-300/60 flex items-center justify-center text-amber-300">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-base font-black">Saarthi Agent Hub</h2>
                    <span className="text-[10.5px] font-bold text-emerald-300 inline-flex items-center gap-1">
                      <Cpu className="w-3 h-3" />
                      {lastEngine === "saarthi_ai"
                        ? "Primary AI Engine Active"
                        : "Deterministic Backup Ready"}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Tabs */}
              <div className="grid grid-cols-3 gap-1.5 bg-[#05040B] p-1 rounded-xl border border-white/10 text-xs font-extrabold">
                {[
                  { id: "approvals", label: `Approvals (${actions.length})` },
                  { id: "command", label: "Command" },
                  { id: "alerts", label: `Alerts (${notifications.length})` },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setActiveTab(t.id)}
                    className={`py-1.5 rounded-lg cursor-pointer transition ${
                      activeTab === t.id
                        ? "bg-amber-400 text-slate-950"
                        : "text-slate-300 hover:text-white"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-3.5">
              {activeTab === "approvals" && (
                <>
                  {actions.length === 0 ? (
                    <div className="p-6 rounded-2xl bg-[#0F0E1D] border border-white/10 text-center space-y-2">
                      <ShieldCheck className="w-8 h-8 text-emerald-400 mx-auto" />
                      <p className="text-sm font-black">No Pending Approvals</p>
                      <p className="text-xs text-slate-400">
                        All Tier-3 writes (user approvals, role edits, calendar
                        bookings) appear here for 1-click sign-off.
                      </p>
                    </div>
                  ) : (
                    actions.map((act) => (
                      <div
                        key={act.id}
                        className="p-4 rounded-2xl bg-[#110F22] border border-amber-400/50 space-y-3"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-400/20 text-amber-200 border border-amber-300/50">
                            {act.action_type.replace("_", " ")}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">
                            via {act.engine_source}
                          </span>
                        </div>

                        <p className="text-xs font-bold text-white leading-relaxed">
                          {act.summary}
                        </p>

                        {act.diff_preview && (
                          <div className="p-2.5 rounded-xl bg-black/50 border border-white/10 text-[11px] space-y-1 font-mono">
                            <div className="text-rose-300">
                              - {act.diff_preview.before}
                            </div>
                            <div className="text-emerald-300">
                              + {act.diff_preview.after}
                            </div>
                          </div>
                        )}

                        <div className="flex items-center gap-2 pt-1">
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => handleDecision(act.id, "approve")}
                            className="flex-1 py-2 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 text-xs font-black inline-flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Approve &amp; Run</span>
                          </button>
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => handleDecision(act.id, "reject")}
                            className="px-3.5 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/35 border border-rose-400/50 text-rose-200 text-xs font-bold cursor-pointer"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </>
              )}

              {activeTab === "command" && (
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      "Revive dormant users",
                      "Approve pending invites",
                      "Book meeting with Sneha",
                    ].map((quick) => (
                      <button
                        key={quick}
                        type="button"
                        onClick={() => handleRunCommand(quick)}
                        className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-amber-400/20 border border-amber-400/35 text-[11px] font-bold text-amber-100 cursor-pointer"
                      >
                        {quick}
                      </button>
                    ))}
                  </div>

                  <div className="space-y-2.5">
                    {commandLog.map((m, i) => (
                      <div
                        key={i}
                        className={`p-3 rounded-2xl text-xs leading-relaxed ${
                          m.role === "user"
                            ? "ml-8 bg-purple-600/30 border border-purple-400/45"
                            : "mr-4 bg-[#101223] border border-cyan-400/40"
                        }`}
                      >
                        {m.engine && (
                          <span className="text-[9.5px] font-black uppercase text-amber-300 block mb-1">
                            {m.engine}
                          </span>
                        )}
                        {m.text}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === "alerts" && (
                <div className="space-y-2.5">
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      className="p-3.5 rounded-2xl bg-[#10101F] border border-white/15 space-y-1"
                    >
                      <div className="flex items-center justify-between text-xs font-black">
                        <span className="text-amber-200 flex items-center gap-1.5">
                          {n.severity === "action_required" ? (
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                          ) : (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          )}
                          {n.title}
                        </span>
                        <Clock className="w-3 h-3 text-slate-500" />
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        {n.body}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer: Command Input + Manual Backup Playbook Trigger */}
            <div className="p-4 border-t border-white/10 space-y-2.5 bg-[#06050E]">
              <button
                type="button"
                disabled={busy}
                onClick={handleRunDailyPlaybook}
                className="w-full py-2 rounded-xl bg-white/5 hover:bg-amber-400/15 border border-amber-400/40 text-amber-200 text-xs font-extrabold inline-flex items-center justify-center gap-1.5 cursor-pointer transition"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Run Pre-Decided Daily Backup Workflow</span>
              </button>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setActiveTab("command");
                  handleRunCommand();
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Command AI (or backup engine)..."
                  className="flex-1 rounded-xl bg-[#0F1020] border border-amber-400/45 focus:border-amber-300 px-3.5 py-2 text-xs text-white outline-none"
                />
                <button
                  type="submit"
                  disabled={busy}
                  className="px-3.5 py-2 rounded-xl bg-amber-400 text-slate-950 font-black text-xs inline-flex items-center gap-1 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
