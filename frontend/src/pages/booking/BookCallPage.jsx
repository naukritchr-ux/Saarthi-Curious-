import { useEffect, useMemo, useRef, useState } from "react";
import "./booking.css";
import DiaryCalendar from "./components/DiaryCalendar";
import DayPage from "./components/DayPage";
import ScheduleAI from "./components/ScheduleAI";
import { useMonthSlots } from "./useMonthSlots";
import {
  addMonths,
  getSessionUserId,
  monthDiff,
  startOfMonth,
  summariseDay,
  toISODate,
  toMonthKey,
} from "./bookingUtils";

const MONTHS_AHEAD = 2;
const DEFAULT_HOST_ID = Number(import.meta.env?.VITE_BOOKING_HOST_ID) || 57;

export default function BookCallPage({
  mode = "learner",
  hostId = DEFAULT_HOST_ID,
  hostName = "your admin",
}) {
  const isAdmin = mode === "admin";
  const thisMonth = useMemo(() => startOfMonth(new Date()), []);
  const [cursor, setCursor] = useState(thisMonth);
  const [selectedISO, setSelectedISO] = useState(null);
  const userId = useMemo(getSessionUserId, []);

  const { status, error, byDate, reload } = useMonthSlots({
    month: toMonthKey(cursor),
    hostId,
    mode,
  });

  const autoPicked = useRef(false);
  useEffect(() => {
    autoPicked.current = false;
  }, [cursor]);

  useEffect(() => {
    if (status !== "ready" || autoPicked.current) return;
    autoPicked.current = true;
    const today = toISODate(new Date());
    // Pick the first future day that has any open slot
    const first = Object.keys(byDate)
      .sort()
      .find((iso) => iso >= today && summariseDay(byDate[iso]).open > 0);
    setSelectedISO(first || null);
  }, [status, byDate]);

  const diff = monthDiff(thisMonth, cursor);
  const canGoPrev = isAdmin || diff > 0;
  const canGoNext = isAdmin || diff < MONTHS_AHEAD;

  const changeMonth = (delta) => {
    setCursor((c) => addMonths(c, delta));
    setSelectedISO(null);
  };

  const goToday = () => {
    setCursor(thisMonth);
    setSelectedISO(null);
  };

  return (
    <main className="bk-root">
      <div className="bk-stone">
        <header className="bk-head">
          <h1 className="bk-head__title">
            {isAdmin ? "Call schedule" : "Book a call"}
          </h1>
          <p className="bk-head__lede">
            {isAdmin
              ? "See who has booked each day, open their Meet link, cancel a call, or book a new slot on behalf of a learner."
              : `Fifteen minutes with ${hostName} on Google Meet. Choose a day, then a time.`}
          </p>
        </header>

        <section className="bk-desk">
          <DiaryCalendar
            cursor={cursor}
            byDate={byDate}
            status={status}
            error={error}
            selectedISO={selectedISO}
            mode={mode}
            canGoPrev={canGoPrev}
            canGoNext={canGoNext}
            onMonthChange={changeMonth}
            onToday={goToday}
            onSelect={setSelectedISO}
            onRetry={reload}
          />
          <DayPage
            iso={selectedISO}
            slots={selectedISO ? byDate[selectedISO] || [] : []}
            status={status}
            mode={mode}
            userId={userId}
            hostName={hostName}
            onChanged={reload}
          />
          {isAdmin && (
            <div className="bk-desk__ai">
              <ScheduleAI adminId={hostId} onChanged={reload} />
            </div>
          )}
        </section>
      </div>
    </main>
  );
}