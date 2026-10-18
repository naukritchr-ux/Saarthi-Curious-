// services/bookingApi.js
import { API_BASE } from "../config/api";
import { getDeviceId } from "../utils/deviceId";

async function request(path, { method = "GET", body, timeout = 25000 } = {}) {
  const token =
    localStorage.getItem("token") || localStorage.getItem("access_token");

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  let res;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(timer);
    if (err.name === "AbortError") {
      throw new Error(
        "Request timed out. The backend may be cold-starting — try again in 30 seconds."
      );
    }
    throw new Error("Can't reach the server. Check your connection.");
  }

  clearTimeout(timer);

  let data = null;
  try {
    data = await res.json();
  } catch {
    /* empty or non-JSON body */
  }

  if (!res.ok) {
    const detail = Array.isArray(data?.detail)
      ? data.detail.map((d) => d.msg).join(", ")
      : data?.detail;
    if (res.status === 404) {
      throw new Error(
        "Endpoint not found. The backend may not be deployed yet with this feature."
      );
    }
    throw new Error(detail || `Request failed (${res.status})`);
  }
  return data;
}

const toSlot = (row) => {
  let date = row.date;
  let start = row.start_time || row.start;
  let end = row.end_time || row.end;
  if (!date && typeof row.start === "string") {
    date = row.start.slice(0, 10);
    start = row.start.length > 11 && row.start.includes("T") ? row.start.slice(11, 16) : row.start;
  }
  if (end && typeof end === "string" && end.length > 11 && end.includes("T")) {
    end = end.slice(11, 16);
  }
  return {
    id: row.slot_id ?? row.id,
    date,
    start,
    end,
    status: row.status || "booked",
    source: row.source || "db",
    isGoogleEvent: Boolean(row.isGoogleEvent),
    booking: row.booking || (row.title && row.status !== "available" ? {
      booking_id: row.id,
      user_id: null,
      user_name: row.title,
      user_email: "Google Calendar Event",
      meeting_link: row.meeting_link,
      google_event_id: row.google_event_id || row.id,
      booking_status: "confirmed",
    } : null),
  };
};

export const getMonthSchedule = async (month, adminId) => {
  const rows = await request(`/bookings/schedule?month=${month}&admin_id=${adminId}`);
  return rows.map(toSlot);
};

export const getMonthCalendar = async (month, adminId, deviceId) => {
  const effectiveDeviceId = deviceId || getDeviceId();
  const devParam = effectiveDeviceId ? `&device_id=${encodeURIComponent(effectiveDeviceId)}` : "";
  const rows = await request(`/bookings/calendar?month=${month}&admin_id=${adminId}${devParam}`);
  return rows.map(toSlot);
};

export const bookSlot = ({ scheduleId, userId }) =>
  request("/bookings/book", {
    method: "POST",
    body: { schedule_id: scheduleId, user_id: userId },
  });

export const cancelBooking = (bookingId, reason = "Cancelled by admin") =>
  request(`/bookings/${bookingId}/cancel`, { method: "POST", body: { reason } });

export const approveBooking = (bookingId) =>
  request(`/bookings/${bookingId}/approve`, { method: "POST" });

export const rejectBooking = (bookingId, reason = "Rejected by admin") =>
  request(`/bookings/${bookingId}/reject`, {
    method: "POST",
    body: { reason },
  });

export const rescheduleBooking = (bookingId, newScheduleId) =>
  request(`/bookings/${bookingId}/reschedule`, {
    method: "POST",
    body: { new_schedule_id: newScheduleId },
  });

export const rescheduleDate = ({ sourceDate, targetDate }) =>
  request("/bookings/reschedule-date", {
    method: "POST",
    body: { source_date: sourceDate, target_date: targetDate },
  });

// Create a meeting at an arbitrary time (admin picks start + end)
export const createCustomBooking = (payload) =>
  request("/bookings/create-custom", { method: "POST", body: payload });

// Legacy backwards-compatibility exports
export const getAvailableSlots = async (selectedDate, adminId) => {
  const formattedDate = typeof selectedDate === "string" ? selectedDate : selectedDate.toISOString().split("T")[0];
  return request(`/bookings/available-slots?selected_date=${formattedDate}&admin_id=${adminId}`);
};

export const generateScheduleForMonth = async (date, adminId, monthsAhead = 1) => {
  const monthStr = typeof date === "string" ? date : date.toISOString().slice(0, 7);
  return request(`/bookings/generate-schedule?month=${monthStr}&admin_id=${adminId}&months_ahead=${monthsAhead}`, {
    method: "POST",
  });
};

export const askScheduleAI = ({ message, adminId, today }) =>
  request("/ai/schedule", {
    method: "POST",
    body: { message, admin_id: adminId, today },
    timeout: 30000,
  });