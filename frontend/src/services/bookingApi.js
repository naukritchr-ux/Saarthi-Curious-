// services/bookingApi.js
// Talks to backend/routes/bookings.py.
import { API_BASE } from "../config/api";

async function request(path, { method = "GET", body } = {}) {
  const token = localStorage.getItem("token") || localStorage.getItem("access_token");
  let res;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error("Can't reach the server. Check your connection and try again.");
  }

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
    throw new Error(detail || `Request failed (${res.status})`);
  }
  return data;
}

const toSlot = (row) => ({
  id: row.slot_id ?? row.id,
  date: row.date,
  start: row.start_time,
  end: row.end_time,
  status: row.status,
  booking: row.booking || null,
});

export const getMonthSchedule = async (month, adminId) => {
  const rows = await request(`/bookings/schedule?month=${month}&admin_id=${adminId}`);
  return rows.map(toSlot);
};

export const getMonthCalendar = async (month, adminId) => {
  const rows = await request(`/bookings/calendar?month=${month}&admin_id=${adminId}`);
  return rows.map(toSlot);
};

export const bookSlot = ({ scheduleId, userId }) =>
  request("/bookings/book", { method: "POST", body: { schedule_id: scheduleId, user_id: userId } });

export const cancelBooking = (bookingId, reason = "Cancelled by admin") =>
  request(`/bookings/${bookingId}/cancel`, { method: "POST", body: { reason } });

export const rescheduleBooking = (bookingId, newScheduleId) =>
  request(`/bookings/${bookingId}/reschedule`, { method: "POST", body: { new_schedule_id: newScheduleId } });

export const rescheduleDate = ({ sourceDate, targetDate }) =>
  request("/bookings/reschedule-date", {
    method: "POST",
    body: { source_date: sourceDate, target_date: targetDate },
  });

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

export const approveBooking = (bookingId) =>
  request(`/bookings/${bookingId}/approve`, { method: "POST" });

export const rejectBooking = (bookingId, reason = "Rejected by admin") =>
  request(`/bookings/${bookingId}/reject`, {
    method: "POST",
    body: { reason },
  });

export const askScheduleAI = ({ message, adminId, today }) =>
  request("/ai/schedule", {
    method: "POST",
    body: { message, admin_id: adminId, today },
  });
