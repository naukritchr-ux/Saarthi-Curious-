import { useEffect, useRef, useState } from "react";
import { Send, Sparkles, X } from "lucide-react";
import { sendAiMessage } from "../../services/aiService";
import RobotHero from "./RobotHero";

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
    icon: "📊",
    label: "Explain this week's trends",
    prompt: "Explain this week's activity trends.",
  },
];

const PRELOAD_IMAGES = [
  "/assets/robot-idle.png",
  "/assets/robot-thinking.png",
  "/assets/robot-happy.png",
  "/assets/robot-listening.png",
  "/assets/robot-error.png",
];

const AiChatCard = ({ context }) => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [mood, setMood] = useState("idle");
  const [talking, setTalking] = useState(false);

  const timerRef = useRef(null);
  const listeningTimeoutRef = useRef(null);
  const errorResetTimeoutRef = useRef(null);
  const listRef = useRef(null);

  /* Preload robot images on mount for instant zero-flicker transitions */
  useEffect(() => {
    PRELOAD_IMAGES.forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  }, []);

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
    // happy — set while the reply streams (talking: true also active)
    setMood("happy");
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
        // Return to idle when streaming finishes
        setMood("idle");
        setTalking(false);
      }
    }, 24);
  };

  /* Send prompt to AI backend */
  const ask = async (prompt) => {
    if (!prompt.trim()) return;
    setInput("");
    setOpen(true);
    setMessages((m) => [...m, { role: "user", text: prompt }]);

    // thinking — set when a user question is submitted
    setMood("thinking");
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

      // listening — set 300ms before the reply starts streaming
      setMood("listening");
      listeningTimeoutRef.current = setTimeout(() => {
        speak(text);
      }, 300);
    } catch (err) {
      console.error("AI chat error:", err);
      // error — set only when the API call fails
      setMood("error");
      setTalking(false);
      errorResetTimeoutRef.current = setTimeout(() => {
        speak("I encountered an issue connecting to the AI service. Please try again.");
      }, 400);
    }
  };

  return (
    <div
      className="neon-card glow-pulse p-5 h-full min-h-[340px] flex flex-col justify-between"
      style={{ borderColor: "rgba(139, 92, 246, 0.22)" }}
    >
      {/* Top section: robot component on the LEFT, heading + suggestions + button on RIGHT */}
      <div className="grid grid-cols-1 sm:grid-cols-[220px_1fr] items-center sm:items-start gap-4">
        {/* Left Side: RobotHero with dynamic mood-driven expressions */}
        <RobotHero mood={mood} talking={talking} size={220} />

        {/* Right Side: Header, Subtitle, Suggestions, and Toggle Button */}
        <div className="flex-1 min-w-0 w-full">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            Ask Saarthi AI
            <Sparkles size={16} className="text-fuchsia-400" />
          </h3>
          <p className="text-xs text-purple-200/70 mt-1">
            Your live assistant — reacts and talks with animated expressions.
          </p>

          {/* 3 Quick Suggestion Buttons */}
          <div className="mt-3.5 space-y-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s.label}
                onClick={() => ask(s.prompt)}
                className="w-full text-left text-xs text-purple-100 rounded-xl border border-purple-500/30 bg-purple-500/10 px-3 py-2 hover:bg-purple-500/25 hover:border-purple-400/60 hover:shadow-[0_0_14px_rgba(139,92,246,0.35)] transition-all flex items-center gap-2"
              >
                <span>{s.icon}</span>
                <span className="truncate">{s.label}</span>
              </button>
            ))}
          </div>

          {/* Action toggle button */}
          <button
            onClick={() => setOpen((o) => !o)}
            className="mt-3 w-full rounded-xl bg-gradient-to-r from-fuchsia-600 via-purple-600 to-indigo-600 py-2.5 text-xs font-semibold text-white shadow-[0_0_20px_rgba(192,38,211,0.45)] hover:brightness-110 transition-all hover:scale-[1.01]"
          >
            {open ? "Close conversation" : "Ask Saarthi AI →"}
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
              placeholder="Type anything…"
              className="flex-1 rounded-xl bg-black/50 border border-purple-500/30 px-3 py-2 text-xs text-white placeholder-purple-300/50 outline-none focus:border-cyan-400/60 focus:shadow-[0_0_12px_rgba(34,211,238,0.25)] transition"
            />
            <button
              onClick={() => ask(input)}
              className="rounded-xl bg-cyan-500/20 border border-cyan-400/40 px-3 text-cyan-300 hover:bg-cyan-400/30 transition flex items-center justify-center"
              aria-label="Send message"
            >
              <Send size={14} />
            </button>
            <button
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
