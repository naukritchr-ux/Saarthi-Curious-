import axios from "axios";
import { API_BASE } from "../config/api";

// Create axios instance
const api = axios.create({
  baseURL: API_BASE,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add token
api.interceptors.request.use(
  (config) => {
    const token =
      localStorage.getItem("access_token") || localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 Unauthorized errors
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      // Clear tokens and redirect to login
      localStorage.removeItem("access_token");
      localStorage.removeItem("token");
      localStorage.removeItem("user_id");
      localStorage.removeItem("role_id");
      localStorage.removeItem("name");

      // Redirect to login if not already there
      if (window.location.pathname !== "/") {
        window.location.href = "/";
      }

      return Promise.reject(error);
    }

    return Promise.reject(error);
  }
);

export default api;
