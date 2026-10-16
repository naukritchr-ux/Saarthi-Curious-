import api from "../utils/axios";

/* If your FastAPI route is named differently, change ONLY this line: */
export const AI_CHAT_PATH = "/ai/chat";

/**
 * Send a message to the AI backend.
 * Falls back to a smart local reply when the backend is unreachable.
 */
export const sendAiMessage = async (messages, context = {}) => {
  try {
    const res = await api.post(AI_CHAT_PATH, { messages, context });
    const d = res.data;
    const reply =
      d?.reply ||
      d?.response ||
      d?.message ||
      d?.content ||
      (typeof d === "string" ? d : null);
    if (reply) return { text: reply, source: "ai" };
    throw new Error("Empty AI response");
  } catch (err) {
    console.warn("[AI] backend unavailable:", err?.message);
    return { text: fallbackReply(messages, context), source: "fallback" };
  }
};

/**
 * Fallback brain — uses ONLY numbers passed in from the live dashboard.
 * Never invents values; if a number is missing, it says so.
 */
const fallbackReply = (messages, ctx = {}) => {
  const last = (messages[messages.length - 1]?.content || "").toLowerCase();
  const s = ctx.stats || {};
  const known = (v) => (v != null ? v : "unknown");

  if (last.includes("inactive")) {
    return s.inactive != null
      ? `${s.inactive} learners have been inactive for 7+ days. Suggest triggering the re-engagement notification script.`
      : "I don't have inactivity data in the current dashboard snapshot.";
  }
  if (last.includes("trend") || last.includes("week")) {
    return `This week: ${known(s.logins7)} logins, ${known(s.videos7)} video views, ${known(s.quizzes7)} quiz attempts.`;
  }
  if (last.includes("summar") || last.includes("progress")) {
    return `Platform snapshot: ${known(s.totalUsers)} users, ${known(s.activeLearners)} active learners, ${known(s.completed)} completed programs, ${known(s.curos)} Curos in circulation.`;
  }
  return "The live AI service is offline right now. I can still answer about users, completion, activity, or Curos from the current snapshot.";
};
