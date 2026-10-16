import { useState, useEffect, useCallback } from "react";
import { getMonthCalendar, getMonthSchedule } from "../../services/bookingApi";

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
        const fetcher = mode === "admin" ? getMonthCalendar : getMonthCalendar;
        const slots = await fetcher(month, hostId);

        if (cancelled) return;

        const map = {};
        for (const slot of slots) {
          if (!map[slot.date]) {
            map[slot.date] = [];
          }
          map[slot.date].push(slot);
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
