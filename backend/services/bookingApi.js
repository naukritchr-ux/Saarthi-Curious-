export const getAvailableSlots = async (selectedDate, adminId) => {
  const response = await API.get("/bookings/available-slots", {
    params: {
      selected_date: selectedDate,
      admin_id: adminId,
    },
  });

  return response.data;
};

export const bookSlot = async (bookingData) => {
  const response = await API.post("/bookings/book", bookingData);

  return response.data;
}; 

export const rescheduleDate = async (selectedDate) => {
  const response = await API.post(
    "/bookings/reschedule-date",
    {
      selected_date: selectedDate,
    }
  );

  return response.data;
};