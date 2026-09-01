// services/dashboardService.js
import axios from "axios";
import { API_BASE } from "../config/api";

export const fetchAdminDashboard = async (userId, roleId) => {
  try {
    const response = await axios.get(`${API_BASE}/dashboard/admin/${userId}?role_id=${roleId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching admin dashboard:", error);
    throw error;
  }
};

export const fetchTeamLeaderDashboard = async (userId, roleId) => {
  try {
    const response = await axios.get(`${API_BASE}/dashboard/team-leader/${userId}?role_id=${roleId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching team leader dashboard:", error);
    throw error;
  }
};
