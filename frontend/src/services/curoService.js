import { API_BASE } from "../config/api";
import axios from "axios";

export const curoService = {
  getProgramCuros: async () => {
    const response = await fetch(`${API_BASE}/curo/programs`);
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.detail || "Failed to fetch program curos");
    }
    return data;
  },

  updateProgramCuro: async (programId, curos) => {
    const response = await fetch(`${API_BASE}/curo/programs/${programId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ curos }),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.detail || "Failed to update program curo");
    }
    return data;
  },

  getLeaderboard: async () => {
    const response = await fetch(`${API_BASE}/curo/leaderboard`);
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.detail || "Failed to fetch leaderboard");
    }
    return data;
  },

  getStats: async () => {
    const response = await fetch(`${API_BASE}/curo/stats`);
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.detail || "Failed to fetch stats");
    }
    return data;
  },

  getTeamLeaderRankings: async () => {
    const response = await fetch(`${API_BASE}/curo/team-leader-rankings`);

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || "Failed to fetch team leader rankings");
    }

    return data;
  },
};
