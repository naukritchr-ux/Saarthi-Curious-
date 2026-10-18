import { useState, useEffect, useCallback } from "react";
import { Video, X, Check, Clock, Plus, Calendar } from "lucide-react";
import { formatLongDate, formatTime, WEEKDAYS, isPastSlot } from "../bookingUtils";
import {
  cancelBooking,
  approveBooking,
  rejectBooking,
  bookSlot,
} from "../../../services/bookingApi";
import {
  getMonthEvents,
  deleteCalendarEvent,
} from "../../../services/calendarEventsApi";
import CreateEventModal from "./CreateEventModal";
import GoogleCalendar from "../GoogleCalendar";
import api from "../../../utils/axios";
import { getDeviceId } from "../../../utils/deviceId";

export default function DayPage({
  iso,
  slots,
  status,
  mode,
  userId,
  hostName,
  onChanged,
}) {
  const isAdmin = mode === "admin";
  const [error, setError] = useState("");
  const [workingId, setWorkingId] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [learners, setLearners] = useState([]);
  const [customEvents, setCustomEvents] = useState([]);
  const [pending, setPending] = useState(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(null);

  const currentMonth = iso ? iso.slice(0, 7) : null;
  const adminId = userId || Number(localStorage.getItem("user_id")) || 57;

  const fetchCustomEvents = useCallback(async () => {
    if (!currentMonth) return;
    try {
      const data = await getMonthEvents(currentMonth, adminId);
      setCustomEvents(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("[DayPage] Error fetching custom events:", err);
    }
  }, [currentMonth, adminId]);

  useEffect(() => {
    fetchCustomEvents();
  }, [fetchCustomEvents]);

  useEffect(() => {
    if (!isAdmin) return;
    api
      .get("/users")
      .then(({ data }) => {
        const rows = Array.isArray(data) ? data : data.users || [];
        setLearners(rows.filter((u) => [3, 4, 5, 6, 7].includes(u.role_id)));
      })
      .catch(() => setLearners([]));
  }, [isAdmin]);

  useEffect(() => {
    setPending(null);
    setDone(null);
    setError("");
  }, [iso]);

  if (!iso) {
    return (
      <article className="bk-ledger">
        <div className="bk-ledger__head">
          <p className="bk-ledger__weekday">Ledger</p>
          <h3 className="bk-ledger__title">Pick a day</h3>
          <p className="bk-ledger__sub">Choose any date on the calendar.</p>
        </div>
      </article>
    );
  }

  const date = new Date(iso + "T00:00:00");
  const weekdayName = WEEKDAYS[(date.getDay() + 6) % 7];

  // Merge slots from props and customEvents from /calendar/events for this day
  const bookedFromProps = (slots || []).filter(
    (s) => s.status !== "available" && s.booking
  );
  const dayCustomEvents = customEvents.filter((e) => e.date === iso);

  const seenIds = new Set(bookedFromProps.map((s) => String(s.id)));
  const customSlots = [];

  for (const ev of dayCustomEvents) {
    const slotId = `event-${ev.id}`;
    if (!seenIds.has(slotId)) {
      seenIds.add(slotId);
      customSlots.push({
        id: slotId,
        isCalendarEvent: true,
        calendarEventId: ev.id,
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

  const bookedSlots = [...bookedFromProps, ...customSlots].sort((a, b) => {
    const timeA = a.start || a.start_time || "";
    const timeB = b.start || b.start_time || "";
    return timeA.localeCompare(timeB);
  });

  const allDaySlots = (slots || []).sort((a, b) => {
    const timeA = a.start || a.start_time || "";
    const timeB = b.start || b.start_time || "";
    return timeA.localeCompare(timeB);
  });

  const openCount = allDaySlots.filter(
    (s) => s.status === "available" && !isPastSlot(s)
  ).length;

  const handleCancel = async (slot) => {
    const slotId = slot?.id || slot?.booking?.booking_id;
    const isGoogle = slot?.isGoogleEvent || String(slotId).startsWith("google-");
    if (isGoogle) {
      setError(
        "This event is synced from Google Calendar. Please edit or delete it directly in your Google Calendar."
      );
      return;
    }

    const isCalEvent =
      slot?.isCalendarEvent || String(slot?.id).startsWith("event-");
    const calId =
      slot?.calendarEventId ||
      (isCalEvent ? Number(String(slot?.id).replace("event-", "")) : null);

    setWorkingId(slotId);
    setError("");
    try {
      if (isCalEvent && calId) {
        await deleteCalendarEvent(calId);
        setCustomEvents((prev) => prev.filter((e) => e.id !== calId));
      } else if (slot?.booking?.booking_id) {
        await cancelBooking(slot.booking.booking_id, "Cancelled by admin");
      }
      fetchCustomEvents();
      onChanged?.();
    } catch (e) {
      setError(e.message);
    } finally {
      setWorkingId(null);
    }
  };

  const handleApprove = async (bookingId) => {
    setWorkingId(bookingId);
    setError("");
    try {
      await approveBooking(bookingId);
      onChanged?.();
    } catch (e) {
      setError(e.message);
    } finally {
      setWorkingId(null);
    }
  };

  const handleReject = async (bookingId) => {
    setWorkingId(bookingId);
    setError("");
    try {
      await rejectBooking(bookingId, "Rejected by admin");
      onChanged?.();
    } catch (e) {
      setError(e.message);
    } finally {
      setWorkingId(null);
    }
  };

  const handleBook = async () => {
    if (!pending) return;
    setBusy(true);
    setError("");
    try {
      const res = await bookSlot({
        scheduleId: pending.id,
        userId: userId || Number(localStorage.getItem("user_id")),
      });
      setDone(res);
      onChanged?.();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const handleConnectPersonal = () => {
    const deviceId = getDeviceId();
    const stateString = encodeURIComponent(
      JSON.stringify({ is_personal: true, device_id: deviceId })
    );
    window.location.href = `https://saarthi-curious-00e8.onrender.com/auth/google/login?state=${stateString}`;
  };

  // If learner has successfully requested a booking
  if (done) {
    return (
      <article className="bk-ledger" aria-label="Booking requested">
        <div className="bk-ledger__head">
          <p className="bk-ledger__weekday">{weekdayName}</p>
          <h3 className="bk-ledger__title">
            <span className="bk-num bk-num--xl">{date.getDate()}</span>
            <span>
              {date.toLocaleDateString("en-IN", { month: "long" })}
            </span>
          </h3>
        </div>
        <div className="bk-ledger__divider" />
        <div style={{ textAlign: "center", padding: "32px 16px" }}>
          <p className="bk-confirm__text">
            <span>Call Requested for</span>
            <strong>
              {formatLongDate(iso)}, {formatTime(pending?.start)} –{" "}
              {formatTime(pending?.end)}
            </strong>
          </p>
          <div className="bk-stamp">Pending</div>
          <p className="bk-hint" style={{ marginTop: 12 }}>
            <Clock size={14} />
            Your admin will confirm this call. You will get a Google Meet link once approved.
          </p>
          <button
            type="button"
            className="bk-link-ivory"
            style={{ marginTop: 16 }}
            onClick={() => setDone(null)}
          >
            Back to day
          </button>
        </div>
      </article>
    );
  }

  return (
    <article className="bk-ledger" aria-label="Day view">
      <div className="bk-ledger__head">
        <p className="bk-ledger__weekday">{weekdayName}</p>
        <h3 className="bk-ledger__title">
          <span className="bk-num bk-num--xl">{date.getDate()}</span>
          <span>{date.toLocaleDateString("en-IN", { month: "long" })}</span>
        </h3>
        <p className="bk-ledger__sub">
          {isAdmin
            ? bookedSlots.length > 0
              ? `${bookedSlots.length} event${bookedSlots.length === 1 ? "" : "s"} scheduled`
              : "No meetings scheduled this day"
            : openCount > 0
            ? `${openCount} time${openCount === 1 ? "" : "s"} open · 15 minutes each`
            : "No open slots this day"}
        </p>
      </div>

      {isAdmin && (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <button
            type="button"
            className="bk-new-meeting-btn"
            onClick={() => setShowCreate(true)}
          >
            <Plus size={16} /> New event
          </button>
          <button
            type="button"
            onClick={handleConnectPersonal}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg shadow font-medium flex items-center justify-center gap-1.5 transition-colors text-sm"
          >
            <Calendar size={15} /> Link Personal Google Calendar
          </button>
        </div>
      )}

      <div className="bk-ledger__divider" />

      {error && (
        <div className="bk-notice">
          <p>{error}</p>
        </div>
      )}

      {isAdmin ? (
        /* ================= ADMIN VIEW ================= */
        bookedSlots.length === 0 ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 10,
              padding: "36px 16px",
              color: "rgba(191,219,254,0.65)",
              textAlign: "center",
            }}
          >
            <Calendar size={32} opacity={0.5} />
            <p style={{ fontSize: 13, fontWeight: 500, margin: 0 }}>
              No meetings scheduled this day
            </p>
            <p style={{ fontSize: 11, margin: 0, opacity: 0.7 }}>
              Click "New event" above to add one.
            </p>
          </div>
        ) : (
          <ul className="bk-lines">
            {bookedSlots.map((slot) => {
              const bookingStatus = slot.booking?.booking_status;
              const isAwaitingApproval = bookingStatus === "pending";
              const isConfirmed = bookingStatus === "confirmed";

              return (
                <li className="bk-line is-taken is-booked" key={slot.id}>
                  <div className="bk-line__row">
                    <span className="bk-line__time">
                      <span className="bk-num bk-num--md">
                        {formatTime(slot.start)}
                      </span>
                      <span className="bk-line__to">
                        to {formatTime(slot.end)}
                      </span>
                    </span>
                    <div
                      style={{
                        display: "flex",
                        gap: "6px",
                        alignItems: "center",
                      }}
                    >
                      {slot.source === "personal" && (
                        <span
                          className="bk-tag"
                          style={{
                            background: "rgba(168, 85, 247, 0.2)",
                            color: "#c084fc",
                            border: "1px solid rgba(168, 85, 247, 0.4)",
                            fontSize: "11px",
                            padding: "2px 6px",
                          }}
                        >
                          Personal
                        </span>
                      )}
                      {slot.source === "company" && (
                        <span
                          className="bk-tag"
                          style={{
                            background: "rgba(59, 130, 246, 0.2)",
                            color: "#93c5fd",
                            border: "1px solid rgba(59, 130, 246, 0.4)",
                            fontSize: "11px",
                            padding: "2px 6px",
                          }}
                        >
                          Company
                        </span>
                      )}
                      {isAwaitingApproval ? (
                        <span className="bk-tag is-pending">Pending</span>
                      ) : isConfirmed ? (
                        <span className="bk-tag is-taken">Confirmed</span>
                      ) : (
                        <span className="bk-tag is-taken">
                          {bookingStatus || "Booked"}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="bk-line__admin">
                    <span className="bk-who">
                      <strong>{slot.booking.user_name}</strong>
                      <small>{slot.booking.user_email}</small>
                    </span>

                    {isAwaitingApproval && (
                      <>
                        <button
                          type="button"
                          className="bk-link-ivory is-approve"
                          disabled={workingId === slot.booking?.booking_id}
                          onClick={() => handleApprove(slot.booking.booking_id)}
                        >
                          <Check size={13} />
                          {workingId === slot.booking?.booking_id
                            ? "Approving…"
                            : "Approve"}
                        </button>
                        <button
                          type="button"
                          className="bk-link-ivory is-danger"
                          disabled={workingId === slot.booking?.booking_id}
                          onClick={() => handleReject(slot.booking.booking_id)}
                        >
                          <X size={13} /> Reject
                        </button>
                      </>
                    )}

                    {isConfirmed && (
                      <>
                        {slot.booking.meeting_link?.startsWith("http") && (
                          <a
                            className="bk-link-ivory"
                            href={slot.booking.meeting_link}
                            target="_blank"
                            rel="noreferrer"
                          >
                            <Video size={13} /> Meet
                          </a>
                        )}
                        <button
                          type="button"
                          className="bk-link-ivory is-danger"
                          disabled={
                            workingId === slot.id ||
                            workingId === slot.booking?.booking_id
                          }
                          onClick={() => handleCancel(slot)}
                        >
                          <X size={13} />
                          {workingId === slot.id ||
                          workingId === slot.booking?.booking_id
                            ? "Cancelling…"
                            : "Cancel"}
                        </button>
                      </>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )
      ) : (
        /* ================= LEARNER VIEW ================= */
        <>
          <ul className="bk-lines">
            {allDaySlots.length === 0 && (
              <li
                style={{
                  textAlign: "center",
                  padding: "24px 12px",
                  color: "#cbd5e1",
                  fontSize: "13px",
                }}
              >
                No available call slots for this day.
              </li>
            )}

            {allDaySlots.map((slot) => {
              const past = isPastSlot(slot);
              const isBooked = slot.status !== "available";
              const isPending = pending?.id === slot.id;
              const bookingStatus = slot.booking?.booking_status;
              const isAwaitingApproval = bookingStatus === "pending";
              const isConfirmed = bookingStatus === "confirmed";

              const rowClass = [
                "bk-line",
                past ? "is-past" : "",
                isBooked ? "is-taken" : "",
                isPending ? "is-selected" : "",
                isAwaitingApproval ? "is-pending" : "",
                slot.booking ? "is-booked" : "",
              ]
                .filter(Boolean)
                .join(" ");

              const canSelect = !past && !isBooked;

              return (
                <li className={rowClass} key={slot.id}>
                  {canSelect ? (
                    <button
                      type="button"
                      className="bk-line__row bk-line__btn"
                      onClick={() => setPending(slot)}
                    >
                      <span className="bk-line__time">
                        <span className="bk-num bk-num--md">
                          {formatTime(slot.start)}
                        </span>
                        <span className="bk-line__to">
                          to {formatTime(slot.end)}
                        </span>
                      </span>
                      <span
                        className={`bk-tag ${
                          isPending ? "is-chosen" : "is-open"
                        }`}
                      >
                        {isPending ? "✓ Chosen" : "Open"}
                      </span>
                    </button>
                  ) : (
                    <div className="bk-line__row">
                      <span className="bk-line__time">
                        <span className="bk-num bk-num--md">
                          {formatTime(slot.start)}
                        </span>
                        <span className="bk-line__to">
                          to {formatTime(slot.end)}
                        </span>
                      </span>
                      {past ? (
                        <span className="bk-tag is-past">Past</span>
                      ) : isAwaitingApproval ? (
                        <span className="bk-tag is-pending">Pending</span>
                      ) : isBooked && isConfirmed ? (
                        <span className="bk-tag is-taken">Confirmed</span>
                      ) : isBooked ? (
                        <span className="bk-tag is-taken">Taken</span>
                      ) : (
                        <span className="bk-tag is-open">Open</span>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>

          <div className="bk-confirm">
            {pending ? (
              <>
                <p className="bk-confirm__text">
                  <span>Your call</span>
                  <strong>
                    {formatLongDate(iso)}, {formatTime(pending.start)} –{" "}
                    {formatTime(pending.end)}
                  </strong>
                </p>
                <button
                  type="button"
                  className="bk-primary"
                  onClick={handleBook}
                  disabled={busy}
                >
                  {busy ? "Requesting…" : "Request this slot"}
                </button>
                <p className="bk-hint">
                  <Clock size={14} />
                  Your admin will confirm this call. You will get a Google Meet link once approved.
                </p>
              </>
            ) : (
              <p className="bk-confirm__text bk-confirm__text--idle">
                Choose an open time slot above to request a call.
              </p>
            )}
          </div>
        </>
      )}

      {isAdmin && showCreate && (
        <CreateEventModal
          defaultDate={iso}
          adminId={adminId}
          learners={learners}
          onClose={() => {
            setShowCreate(false);
            fetchCustomEvents();
            onChanged?.();
          }}
          onCreated={(createdEvent) => {
            if (createdEvent && createdEvent.date) {
              setCustomEvents((prev) => {
                const filtered = prev.filter((e) => e.id !== createdEvent.id);
                return [...filtered, createdEvent];
              });
            }
            fetchCustomEvents();
            onChanged?.();
          }}
          onEventCreated={(createdEvent) => {
            if (createdEvent && createdEvent.date) {
              setCustomEvents((prev) => {
                const filtered = prev.filter((e) => e.id !== createdEvent.id);
                return [...filtered, createdEvent];
              });
            }
            fetchCustomEvents();
            onChanged?.();
          }}
          onSuccess={(createdEvent) => {
            if (createdEvent && createdEvent.date) {
              setCustomEvents((prev) => {
                const filtered = prev.filter((e) => e.id !== createdEvent.id);
                return [...filtered, createdEvent];
              });
            }
            fetchCustomEvents();
            onChanged?.();
          }}
        />
      )}
    </article>
  );
}