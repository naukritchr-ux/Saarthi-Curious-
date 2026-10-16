import { useState } from "react";
import { Sparkles, Loader2, Check } from "lucide-react";
import {
  askScheduleAI,
  rescheduleDate,
  cancelBooking,
} from "../../../services/bookingApi";

const SUGGESTIONS = [
  "I'm busy tomorrow afternoon",
  "Move all Friday meetings to Monday",
  "Cancel my 10 AM call",
  "What's on my schedule this week?",
];

export default function ScheduleAI({ adminId, onChanged }) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [thread, setThread] = useState([]);

  const today = new Date().toISOString().slice(0, 10);

  const ask = async (prompt) => {
    if (!prompt.trim()) return;
    setError("");
    setBusy(true);
    setThread((t) => [...t, { role: "user", text: prompt }]);
    setInput("");
    try {
      const parsed = await askScheduleAI({ message: prompt, adminId, today });
      setThread((t) => [...t, { role: "ai", text: parsed.reply || "…", parsed }]);
    } catch (e) {
      setError(e.message);
      setThread((t) => [...t, { role: "ai", text: `Error: ${e.message}` }]);
    } finally {
      setBusy(false);
    }
  };

  const applyAction = async (entry) => {
    setBusy(true);
    setError("");
    try {
      const { intent, params } = entry.parsed;
      if (intent === "reschedule_date" && params.source_date && params.target_date) {
        await rescheduleDate({
          sourceDate: params.source_date,
          targetDate: params.target_date,
        });
        setThread((t) => [...t, { role: "ai", text: `Moved bookings from ${params.source_date} to ${params.target_date}.` }]);
      } else if (intent === "cancel_booking" && params.booking_id) {
        await cancelBooking(params.booking_id, "Cancelled via AI");
        setThread((t) => [...t, { role: "ai", text: `Cancelled booking #${params.booking_id}.` }]);
      } else {
        setThread((t) => [...t, { role: "ai", text: "I understood the request but couldn't map it to a specific action." }]);
      }
      onChanged?.();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={`bk-ai ${open ? "is-open" : ""}`}>
      <button
        type="button"
        className="bk-ai__toggle"
        onClick={() => setOpen((v) => !v)}
      >
        <Sparkles size={16} />
        <span>Ask Saarthi to schedule</span>
      </button>

      {open && (
        <div className="bk-ai__panel">
          {thread.length === 0 && (
            <div className="bk-ai__suggestions">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  className="bk-ai__chip"
                  onClick={() => ask(s)}
                  disabled={busy}
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          <div className="bk-ai__thread">
            {thread.map((m, i) => (
              <div key={i} className={`bk-ai__msg bk-ai__msg--${m.role}`}>
                <p>{m.text}</p>
                {m.parsed?.intent &&
                  m.parsed.intent !== "unknown" &&
                  m.parsed.intent !== "query" && (
                    <button
                      type="button"
                      className="bk-ai__apply"
                      onClick={() => applyAction(m)}
                      disabled={busy}
                    >
                      <Check size={13} /> Apply
                    </button>
                  )}
              </div>
            ))}
            {busy && (
              <div className="bk-ai__msg bk-ai__msg--ai">
                <Loader2 size={14} className="spin" />
                <span>Thinking…</span>
              </div>
            )}
          </div>

          {error && <p className="bk-ai__error">{error}</p>}

          <div className="bk-ai__input">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && ask(input)}
              placeholder="e.g. I'm busy tomorrow afternoon"
              disabled={busy}
            />
            <button type="button" onClick={() => ask(input)} disabled={busy || !input.trim()}>
              Ask
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
