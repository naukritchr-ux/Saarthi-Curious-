import { useState, useEffect, useCallback } from "react";
import axios from "axios";

const API_BASE_URL =
  import.meta.env?.VITE_API_URL ||
  (typeof window !== "undefined" &&
  (window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1")
    ? "http://127.0.0.1:8000"
    : "https://saarthi-curious-00e8.onrender.com");

function getAuthHeaders() {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("token") || localStorage.getItem("access_token")
      : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function useAgentTabSync(tabName = "reports") {
  const [syncData, setSyncData] = useState(null);
  const [syncLoading, setSyncLoading] = useState(false);

  const refreshSync = useCallback(async () => {
    setSyncLoading(true);
    try {
      const res = await axios.get(
        `${API_BASE_URL}/api/agent/tab-sync/${encodeURIComponent(tabName)}`,
        {
          params: { _t: Date.now() },
          headers: getAuthHeaders(),
        }
      );
      setSyncData(res.data || null);
    } catch {
      // Non-blocking: tab UI continues smoothly with its local data
    } finally {
      setSyncLoading(false);
    }
  }, [tabName]);

  useEffect(() => {
    const t = setTimeout(() => {
      refreshSync();
    }, 0);
    const onFocus = () => {
      if (document.visibilityState === "visible") refreshSync();
    };
    document.addEventListener("visibilitychange", onFocus);
    return () => {
      clearTimeout(t);
      document.removeEventListener("visibilitychange", onFocus);
    };
  }, [refreshSync]);

  const sendGroundedCommand = useCallback(async (prompt) => {
    const res = await axios.post(
      `${API_BASE_URL}/api/agent/command`,
      { prompt },
      { headers: getAuthHeaders() }
    );
    return res.data;
  }, []);

  return { syncData, syncLoading, refreshSync, sendGroundedCommand };
}

