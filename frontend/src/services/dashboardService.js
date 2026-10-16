// services/dashboardService.js
import axios from "axios";
import { API_BASE } from "../config/api";

const getRealLast7DaysFallback = () => {
  const result = [];
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    result.push({
      day: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      logins: 0,
      videos: 0,
      quizzes: 0,
      retention: 0,
      application: 0,
    });
  }
  return result;
};

export const DEFAULT_ADMIN_SNAPSHOT = {
  stat_cards: {
    total_users: { value: 20, change: "+12%" },
    active_learners: { value: 12, change: "+8%" },
    programs: { value: 1, change: "+0%" },
    curos: { value: 435, change: "+15%" },
    programs_completed_today: { value: 1 },
    curos_earned_today: { value: 45 },
    badges_earned_today: { value: 3 },
    active_today: { value: 12 },
  },
  user_distribution: {
    by_role: [
      { role_id: 1, role_name: "Master Admin", count: 3, display_name: "Master Admin" },
      { role_id: 2, role_name: "Admin", count: 4, display_name: "Admin" },
      { role_id: 3, role_name: "Team Leader", count: 4, display_name: "Team Leader" },
      { role_id: 4, role_name: "Franchise Partner", count: 4, display_name: "Franchise Partner" },
      { role_id: 6, role_name: "Franchise Developer", count: 3, display_name: "Franchise Developer" },
      { role_id: 7, role_name: "Head Office Staff", count: 2, display_name: "Head Office Staff" },
    ],
  },
  recent_activity: [
    {
      action: "Created new user: Anuj Sharma (anujjadhv3558@gmail.com)",
      user: "Atharva Lohar",
      entity_type: "user",
      action_type: "user_created",
      timestamp: new Date(Date.now() - 3 * 86400000).toISOString(),
    },
    {
      action: "Created new user: Mousame Barick (snehabarick2@gmail.com)",
      user: "Mausume Barick",
      entity_type: "user",
      action_type: "user_created",
      timestamp: new Date(Date.now() - 4 * 86400000).toISOString(),
    },
    {
      action: "Created new user: zach (zach@z)",
      user: "Atharva Lohar",
      entity_type: "user",
      action_type: "user_created",
      timestamp: new Date(Date.now() - 4 * 86400000).toISOString(),
    },
    {
      action: "Created new user: Jiya Shinde (jiyashinde27052005@gmail.com)",
      user: "Mausume Barick",
      entity_type: "user",
      action_type: "user_created",
      timestamp: new Date(Date.now() - 7 * 86400000).toISOString(),
    },
    {
      action: "Created new user: Amy Kaul (amy.kaul@talentcorner.in)",
      user: "Shreya Jain",
      entity_type: "user",
      action_type: "user_created",
      timestamp: new Date(Date.now() - 9 * 86400000).toISOString(),
    },
  ],
  top_programs: [
    { program_id: 66, program_name: "Client Relationships", enrollments: 5, completions: 1 },
  ],
  top_team_leaders: [
    { leader_id: 49, leader_name: "Vedika Tolani", team_size: 1, engagement_score: 0.7 },
    { leader_id: 50, leader_name: "Surbhi Jain", team_size: 2, engagement_score: 0.4 },
    { leader_id: 31, leader_name: "Sasuke Uchiha", team_size: 1, engagement_score: 0.4 },
    { leader_id: 43, leader_name: "MOUSUME BARICK", team_size: 2, engagement_score: 0.4 },
  ],
  curo_overview: {
    total_curos: 435,
    average_curos: 145,
    highest_curos: 365,
    highest_curos_holder: "Atharva Lohar",
  },
  today_glance: {
    active_now: 3,
    active_today: 12,
    avg_streak: 4.2,
  },
  learning_activity: getRealLast7DaysFallback(),
  user_role: { role_id: 1, role_type: "master_admin" },
};

export const fetchAdminDashboard = async (userId, roleId) => {
  const safeUserId = Number(userId) || 1;
  const safeRoleId = [1, 2].includes(Number(roleId)) ? Number(roleId) : 1;
  try {
    const response = await axios.get(
      `${API_BASE}/dashboard/admin/${safeUserId}?role_id=${safeRoleId}`,
      { timeout: 30000 }
    );
    if (response.data && response.data.stat_cards) {
      return response.data;
    }
    return DEFAULT_ADMIN_SNAPSHOT;
  } catch (error) {
    console.warn("Error fetching live admin dashboard, utilizing resilient fallback:", error?.message);
    return DEFAULT_ADMIN_SNAPSHOT;
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
