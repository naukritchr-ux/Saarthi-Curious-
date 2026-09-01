import { API_BASE } from "../config/api";

export const leaderboardService = {
  getCompletionLeaderboard: async () => {
    const response = await fetch(`${API_BASE}/leaderboards/completion`);
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.detail || "Failed to fetch completion leaderboard");
    }
    return data;
  },

  getRetentionLeaderboard: async () => {
    const response = await fetch(`${API_BASE}/leaderboards/retention`);
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.detail || "Failed to fetch retention leaderboard");
    }
    return data;
  },

  getApplicationLeaderboard: async () => {
    const response = await fetch(`${API_BASE}/leaderboards/application`);
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.detail || "Failed to fetch application leaderboard");
    }
    return data;
  },

  getCompletionStats: async () => {
    const response = await fetch(`${API_BASE}/leaderboards/completion/stats`);
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.detail || "Failed to fetch completion stats");
    }
    return data;
  },

  getRetentionStats: async () => {
    const response = await fetch(`${API_BASE}/leaderboards/retention/stats`);
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.detail || "Failed to fetch retention stats");
    }
    return data;
  },

  getApplicationStats: async () => {
    const response = await fetch(`${API_BASE}/leaderboards/application/stats`);
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.detail || "Failed to fetch application stats");
    }
    return data;
  },
};
