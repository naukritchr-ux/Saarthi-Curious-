import { useState } from "react";
import { Loader2, Check, Send } from "lucide-react";
import AssistantLogo from "../../../components/ai/AssistantLogo";
import {
  askScheduleAI,
  rescheduleDate,
  cancelBooking,
  createCustomBooking,
} from "../../../services/bookingApi";

const SUGGESTIONS = [
  "What meetings do I have today?",
  "I'm busy tomorrow afternoon",
  "Cancel my 10 AM call",
  "Set a call Monday 3 PM to 3:45 PM with Priya",
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
      setThread((t) => [
        ...t,
        { role: "ai", text: parsed.reply || "…", parsed },
      ]);
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
      if (
        intent === "reschedule_date" &&
        params.source_date &&
        params.target_date
      ) {
        await rescheduleDate({
          sourceDate: params.source_date,
          targetDate: params.target_date,
        });
        setThread((t) => [
          ...t,
          {
            role: "ai",
            text: `Moved bookings from ${params.source_date} to ${params.target_date}.`,
          },
        ]);
      } else if (intent === "cancel_booking" && params.booking_id) {
        await cancelBooking(params.booking_id, "Cancelled via AI");
        setThread((t) => [
          ...t,
          { role: "ai", text: `Cancelled booking #${params.booking_id}.` },
        ]);
      } else if (
        intent === "create_meeting" &&
        params.date &&
        params.start_time &&
        params.end_time &&
        params.user_id
      ) {
        await createCustomBooking({
          admin_id: adminId,
          user_id: params.user_id,
          date: params.date,
          start_time: params.start_time,
          end_time: params.end_time,
          title: params.title || "Meeting",
          description: params.title || "Scheduled via AI",
          add_meet: true,
        });
        setThread((t) => [
          ...t,
          {
            role: "ai",
            text: `Meeting created for ${params.date} ${params.start_time}–${params.end_time}.`,
          },
        ]);
      } else {
        setThread((t) => [
          ...t,
          {
            role: "ai",
            text: "I understood the request but couldn't map it to a specific action.",
          },
        ]);
      }
      onChanged?.();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="bk-ai-black">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="bk-ai-black__toggle"
      >
        <AssistantLogo size={22} />
        <span className="bk-ai-black__label">Ask Saarthi to schedule</span>
      </button>

      {open && (
        <div className="bk-ai-black__panel">
          {thread.length === 0 && (
            <div className="bk-ai-black__suggestions">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => ask(s)}
                  disabled={busy}
                  className="bk-ai-black__chip"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          <div className="bk-ai-black__thread">
            {thread.map((m, i) => (
              <div
                key={i}
                className={`bk-ai-black__msg bk-ai-black__msg--${m.role}`}
              >
                <p style={{ margin: 0 }}>{m.text}</p>
                {m.parsed?.intent &&
                  m.parsed.intent !== "unknown" &&
                  m.parsed.intent !== "query" && (
                    <button
                      type="button"
                      onClick={() => applyAction(m)}
                      disabled={busy}
                      className="bk-ai-black__apply"
                    >
                      <Check size={12} /> Apply
                    </button>
                  )}
              </div>
            ))}
            {busy && (
              <div className="bk-ai-black__msg bk-ai-black__msg--ai">
                <Loader2 size={13} className="spin" />
                <span>Thinking…</span>
              </div>
            )}
          </div>

          {error && <p className="bk-ai-black__error">{error}</p>}

          <div className="bk-ai-black__input">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && ask(input)}
              placeholder="Ask anything…"
              disabled={busy}
            />
            <button
              type="button"
              onClick={() => ask(input)}
              disabled={busy || !input.trim()}
              aria-label="Send"
            >
              <Send size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}