import api from "../utils/axios";

export const getAvailableSlots = async (selectedDate, adminId) => {
  // Format date as YYYY-MM-DD for backend
  const formattedDate = selectedDate.toISOString().split("T")[0];

  console.log("Fetching available slots:", {
    selectedDate: formattedDate,
    adminId: adminId,
  });

  const response = await api.get("/bookings/available-slots", {
    params: {
      selected_date: formattedDate,
      admin_id: adminId,
    },
  });

  console.log("Available slots response:", response.data);

  return response.data;
};

export const bookSlot = async (bookingData) => {
  const response = await api.post("/bookings/book", bookingData);
  return response.data;
};

export const rescheduleDate = async (sourceDate, targetDate) => {
  const response = await api.post("/bookings/reschedule-date", {
    source_date: sourceDate,
    target_date: targetDate,
  });
  return response.data;
};

export const generateScheduleForMonth = async (
  date,
  adminId,
  monthsAhead = 1,
) => {
  // Format date as YYYY-MM for backend
  const monthStr = date.toISOString().slice(0, 7); // YYYY-MM

  const response = await api.post("/bookings/generate-schedule", null, {
    params: {
      month: monthStr,
      admin_id: adminId,
      months_ahead: monthsAhead,
    },
  });

  return response.data;
};

export default api;
