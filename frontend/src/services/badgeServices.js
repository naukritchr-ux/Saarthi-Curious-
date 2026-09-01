import axios from "axios";
import { API_BASE } from "../config/api";

// Helper function to validate image URL
const isValidImageUrl = (url) => {
  if (!url) return false;
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// Process badge data to ensure badge_icon is properly formatted
const processBadgeData = (badge) => {
  return {
    ...badge,
    badge_icon: badge.badge_icon || null,
    // You can also add a fallback icon URL if needed
    // badge_icon: badge.badge_icon || '/default-badge.png'
  };
};

export const getUserBadges = async (userId) => {
  try {
    const response = await axios.get(`${API_BASE}/badges/user/${userId}`);
    return response.data.map(processBadgeData);
  } catch (error) {
    console.error("Error fetching user badges:", error);
    throw error;
  }
};

export const checkUserBadges = async (userId) => {
  try {
    const response = await axios.post(`${API_BASE}/badges/check/${userId}`);
    return response.data;
  } catch (error) {
    console.error("Error checking user badges:", error);
    throw error;
  }
};

export const getAllBadges = async () => {
  try {
    const response = await axios.get(`${API_BASE}/badges/all`);
    return response.data.map(processBadgeData);
  } catch (error) {
    console.error("Error fetching all badges:", error);
    throw error;
  }
};

export const checkAllUsersBadges = async () => {
  try {
    const response = await axios.post(`${API_BASE}/badges/check-all`);
    return response.data;
  } catch (error) {
    console.error("Error checking all users badges:", error);
    throw error;
  }
};
