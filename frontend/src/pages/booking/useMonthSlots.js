import { useState, useEffect, useCallback } from "react";
import { getMonthCalendar, getMonthSchedule } from "../../services/bookingApi";
import { getMonthEvents } from "../../services/calendarEventsApi";
import { getDeviceId } from "../../utils/deviceId";

export function useMonthSlots({ month, hostId, mode }) {
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");
  const [byDate, setByDate] = useState({});
  const [tick, setTick] = useState(0);

  const reload = useCallback(() => {
    setTick((t) => t + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!month || !hostId) return;
      setStatus("loading");
      setError("");

      try {
        const deviceId = getDeviceId();
        const fetcher = mode === "admin" ? getMonthCalendar : getMonthCalendar;
        const [slots, customEvents] = await Promise.all([
          fetcher(month, hostId, deviceId).catch(() => []),
          getMonthEvents(month, hostId).catch(() => []),
        ]);

        if (cancelled) return;

        const map = {};
        for (const slot of slots || []) {
          if (!map[slot.date]) {
            map[slot.date] = [];
          }
          map[slot.date].push(slot);
        }

        for (const ev of customEvents || []) {
          if (!map[ev.date]) {
            map[ev.date] = [];
          }
          const slotId = `event-${ev.id}`;
          if (!map[ev.date].some((s) => s.id === slotId)) {
            map[ev.date].push({
              id: slotId,
              isCalendarEvent: true,
              calendarEventId: ev.id,
              date: ev.date,
              start: ev.start_time || "00:00",
              end: ev.end_time || (ev.all_day ? "23:59" : "01:00"),
              status: "booked",
              booking: {
                booking_id: slotId,
                calendar_event_id: ev.id,
                user_id: null,
                user_name: ev.title,
                user_email: ev.event_type
                  ? `${ev.event_type.charAt(0).toUpperCase() + ev.event_type.slice(1)} Event`
                  : "Calendar Event",
                meeting_link: ev.meeting_link || null,
                google_event_id: ev.google_event_id,
                booking_status: "confirmed",
              },
            });
          }
        }

        setByDate(map);
        setStatus("ready");
      } catch (err) {
        if (cancelled) return;
        console.error("Error loading month slots:", err);
        setError(err.message || "Failed to load slots");
        setStatus("error");
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [month, hostId, mode, tick]);

  return { status, error, byDate, reload };
}
