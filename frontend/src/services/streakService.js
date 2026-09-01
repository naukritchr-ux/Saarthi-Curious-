import { API_BASE } from "../config/api";

export const streakService = {
  getCurrentUserStreak: async () => {
    const response = await fetch(`${API_BASE}/streaks/current`);
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.detail || "Failed to fetch current streak");
    }
    return data;
  },

  getUserStreak: async (userId) => {
    const response = await fetch(`${API_BASE}/streaks/user/${userId}`);
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.detail || "Failed to fetch user streak");
    }
    return data;
  },

  getStreakLeaderboard: async () => {
    const response = await fetch(`${API_BASE}/streaks/leaderboard`);
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.detail || "Failed to fetch streak leaderboard");
    }
    return data;
  },

  getStreakStats: async () => {
    const response = await fetch(`${API_BASE}/streaks/stats`);
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.detail || "Failed to fetch streak stats");
    }
    return data;
  },

  recordActivity: async (userId) => {
    const response = await fetch(`${API_BASE}/streaks/user/${userId}/activity`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.detail || "Failed to record activity");
    }
    return data;
  },
};
