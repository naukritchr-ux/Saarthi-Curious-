import api from "../utils/axios";

export const createCalendarEvent = async (payload) => {
    const { data } = await api.post("/calendar/events", payload);
    return data;
};

export const updateCalendarEvent = async (eventId, payload) => {
    const { data } = await api.put(`/calendar/events/${eventId}`, payload);
    return data;
};

export const deleteCalendarEvent = async (eventId) => {
    const { data } = await api.delete(`/calendar/events/${eventId}`);
    return data;
};

export const getMonthEvents = async (month, adminId) => {
    const { data } = await api.get("/calendar/events", {
        params: { month, admin_id: adminId },
    });
    return data;
};