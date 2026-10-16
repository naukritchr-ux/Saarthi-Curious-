import { useEffect, useRef, useState, useCallback } from "react";
import { Send, Sparkles, X, MessageSquare, RotateCw } from "lucide-react";
import { sendAiMessage } from "../../services/aiService";
import RobotHero, { ROBOT_ASSETS } from "./RobotHero";
import { getInitialGreeting, getRandomMessage } from "./robotMessages";

const SUGGESTIONS = [
  {
    icon: "📄",
    label: "Summarize learner progress",
    prompt: "Summarize learner progress across the platform.",
  },
  {
    icon: "🔍",
    label: "Find inactive learners",
    prompt: "Find inactive learners and suggest actions.",
  },
  {
    icon: "📅",
    label: "What meetings do I have today?",
    prompt: "What meetings do I have scheduled for today?",
  },
];

const AUTO_MESSAGE_INTERVAL_MS = 30000; // 30 seconds

const AiChatCard = ({ context }) => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [mood, setMood] = useState("idle");
  const [gesture, setGesture] = useState(null);
  const [talking, setTalking] = useState(false);
  const [autoMessage, setAutoMessage] = useState("");

  const adminName = context?.adminName || "Anuj";

  const timerRef = useRef(null);
  const autoMessageIntervalRef = useRef(null);
  const gestureTimeoutRef = useRef(null);
  const listeningTimeoutRef = useRef(null);
  const errorResetTimeoutRef = useRef(null);
  const listRef = useRef(null);

  // Trigger a new message from the 85+ message bank
  const triggerRandomMessage = useCallback(() => {
    const next = getRandomMessage(adminName);
    setAutoMessage(next.text);
    setGesture(next.gesture || "talking1");
    setMood(next.mood || "happy");

    if (gestureTimeoutRef.current) clearTimeout(gestureTimeoutRef.current);
    gestureTimeoutRef.current = setTimeout(() => {
      setGesture(null);
      setMood("idle");
    }, 2800);
  }, [adminName]);

  // Initial greeting on dashboard mount + 30-second recurring timer
  useEffect(() => {
    const greeting = getInitialGreeting(adminName);
    setAutoMessage(greeting.text);
    setGesture(greeting.gesture);
    setMood(greeting.mood);

    gestureTimeoutRef.current = setTimeout(() => {
      setGesture(null);
      setMood("idle");
    }, 3000);

    // Auto-messages every 30 seconds
    autoMessageIntervalRef.current = setInterval(() => {
      // Don't interrupt if user is actively chatting or open
      if (!talking && !open) {
        triggerRandomMessage();
      }
    }, AUTO_MESSAGE_INTERVAL_MS);

    return () => {
      if (autoMessageIntervalRef.current) clearInterval(autoMessageIntervalRef.current);
      if (gestureTimeoutRef.current) clearTimeout(gestureTimeoutRef.current);
    };
  }, [adminName, talking, open, triggerRandomMessage]);

  /* Cleanup intervals and timeouts on unmount */
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (listeningTimeoutRef.current) clearTimeout(listeningTimeoutRef.current);
      if (errorResetTimeoutRef.current) clearTimeout(errorResetTimeoutRef.current);
    };
  }, []);

  /* Auto-scroll on new message */
  useEffect(() => {
    listRef.current?.scrollTo({ top: 99999, behavior: "smooth" });
  }, [messages, open]);

  /* Typewriter streaming effect while robot changes expressions */
  const speak = (text) => {
    setMood("happy");
    setGesture("talking1");
    setTalking(true);
    setMessages((m) => [...m, { role: "ai", text: "", streaming: true }]);
    let i = 0;
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      i += 2;
      setMessages((m) => {
        const c = [...m];
        c[c.length - 1] = {
          role: "ai",
          text: text.slice(0, i),
          streaming: i < text.length,
        };
        return c;
      });
      if (i >= text.length) {
        clearInterval(timerRef.current);
        setMood("idle");
        setGesture(null);
        setTalking(false);
      }
    }, 22);
  };

  /* Send prompt to AI backend */
  const ask = async (prompt) => {
    if (!prompt.trim()) return;
    setInput("");
    setOpen(true);
    setMessages((m) => [...m, { role: "user", text: prompt }]);

    setMood("thinking");
    setGesture(null);
    setTalking(false);

    try {
      const { text } = await sendAiMessage(
        [
          ...messages.map((m) => ({
            role: m.role === "ai" ? "assistant" : "user",
            content: m.text,
          })),
          { role: "user", content: prompt },
        ],
        context,
      );

      setMood("listening");
      listeningTimeoutRef.current = setTimeout(() => {
        speak(text);
      }, 250);
    } catch (err) {
      console.error("AI chat error:", err);
      setMood("error");
      setTalking(false);
      errorResetTimeoutRef.current = setTimeout(() => {
        speak("I encountered an issue connecting to the AI service. Please try again.");
      }, 400);
    }
  };

  return (
    <div
      className="neon-card glow-pulse p-5 h-full min-h-[350px] flex flex-col justify-between"
      style={{ borderColor: "rgba(139, 92, 246, 0.22)" }}
    >
      {/* Top section: robot on the LEFT, heading + suggestions + button on RIGHT */}
      <div className="grid grid-cols-1 sm:grid-cols-[200px_1fr] items-center sm:items-start gap-4">
        {/* Left Side: RobotHero with dynamic animated expressions & gestures */}
        <div className="flex flex-col items-center">
          <RobotHero
            mood={mood}
            gesture={gesture}
            talking={talking}
            size={200}
            onClick={triggerRandomMessage}
            interactive={true}
          />
          <span className="text-[10px] text-cyan-300/60 mt-1 hover:text-cyan-300 cursor-pointer transition select-none" onClick={triggerRandomMessage}>
            ✦ Click robot to interact
          </span>
        </div>

        {/* Right Side: Header, Live Speech Bubble, Suggestions, and Toggle Button */}
        <div className="flex-1 min-w-0 w-full flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                Ask Saarthi AI
                <Sparkles size={16} className="text-fuchsia-400" />
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live Co-Pilot
              </span>
            </div>

            {/* Floating Live Speech Bubble — Updates every 30s */}
            <div
              className="mt-2.5 p-3 rounded-2xl transition-all duration-300 border"
              style={{
                background:
                  "linear-gradient(135deg, rgba(30, 27, 75, 0.75) 0%, rgba(15, 15, 26, 0.85) 100%)",
                borderColor: "rgba(139, 92, 246, 0.35)",
                boxShadow: "0 8px 24px -10px rgba(139, 92, 246, 0.35)",
              }}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-semibold text-cyan-300 tracking-wide flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                  Saarthi Live Note
                </span>
                <button
                  type="button"
                  onClick={triggerRandomMessage}
                  className="text-[10px] text-purple-200/60 hover:text-white flex items-center gap-1 transition"
                  title="Cycle to next auto-message"
                >
                  <RotateCw size={10} />
                  <span>Next</span>
                </button>
              </div>
              <p className="text-xs text-purple-100 font-medium leading-relaxed">
                "{autoMessage}"
              </p>
            </div>

            {/* 3 Quick Suggestion Buttons */}
            <div className="mt-3 space-y-1.5">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s.label}
                  type="button"
                  onClick={() => ask(s.prompt)}
                  className="w-full text-left text-xs text-purple-100 rounded-xl border border-purple-500/30 bg-purple-500/10 px-3 py-2 hover:bg-purple-500/25 hover:border-purple-400/60 hover:shadow-[0_0_14px_rgba(139,92,246,0.35)] transition-all flex items-center gap-2"
                >
                  <span>{s.icon}</span>
                  <span className="truncate">{s.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Action toggle button */}
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="mt-3 w-full rounded-xl bg-gradient-to-r from-fuchsia-600 via-purple-600 to-indigo-600 py-2.5 text-xs font-semibold text-white shadow-[0_0_20px_rgba(192,38,211,0.45)] hover:brightness-110 transition-all hover:scale-[1.01] flex items-center justify-center gap-1.5"
          >
            <MessageSquare size={13} />
            <span>{open ? "Close conversation" : "Chat with Saarthi AI →"}</span>
          </button>
        </div>
      </div>

      {/* Chat Conversation Panel (Shown when open) */}
      {open && (
        <div className="mt-4 pt-3 border-t border-purple-500/20 flex-1 flex flex-col min-h-[220px]">
          {/* Scrollable message stream */}
          <div
            ref={listRef}
            className="flex-1 overflow-y-auto pr-1 space-y-2 max-h-[240px]"
          >
            {messages.map((m, i) => (
              <div
                key={i}
                className={`text-xs rounded-xl px-3 py-2 leading-relaxed ${
                  m.role === "user"
                    ? "bg-cyan-500/15 text-cyan-100 border border-cyan-500/30 ml-6"
                    : "bg-purple-500/15 text-purple-100 border border-purple-500/30 mr-6"
                }`}
              >
                {m.text}
                {m.streaming && <span className="animate-pulse">▍</span>}
              </div>
            ))}
          </div>

          {/* Input field */}
          <div className="mt-3 flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && ask(input)}
              placeholder="Ask anything, e.g. what meetings do I have today?"
              className="flex-1 rounded-xl bg-black/50 border border-purple-500/30 px-3 py-2 text-xs text-white placeholder-purple-300/50 outline-none focus:border-cyan-400/60 focus:shadow-[0_0_12px_rgba(34,211,238,0.25)] transition"
            />
            <button
              type="button"
              onClick={() => ask(input)}
              className="rounded-xl bg-cyan-500/20 border border-cyan-400/40 px-3 text-cyan-300 hover:bg-cyan-400/30 transition flex items-center justify-center"
              aria-label="Send message"
            >
              <Send size={14} />
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-xl bg-white/5 border border-white/10 px-2 text-purple-200 hover:bg-white/10 transition flex items-center justify-center"
              aria-label="Close chat"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AiChatCard;
