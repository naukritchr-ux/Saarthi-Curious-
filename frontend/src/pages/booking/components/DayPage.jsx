import { useState, useEffect, useCallback } from "react";
import { Video, X, Check, Clock, Plus, Calendar } from "lucide-react";
import { formatLongDate, formatTime, WEEKDAYS } from "../bookingUtils";
import {
  cancelBooking,
  approveBooking,
  rejectBooking,
} from "../../../services/bookingApi";
import {
  getMonthEvents,
  deleteCalendarEvent,
} from "../../../services/calendarEventsApi";
import CreateEventModal from "./CreateEventModal";
import api from "../../../utils/axios";

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
    api.get("/users").then(({ data }) => {
      const rows = Array.isArray(data) ? data : data.users || [];
      setLearners(rows.filter((u) => [3, 4, 5, 6, 7].includes(u.role_id)));
    }).catch(() => setLearners([]));
  }, [isAdmin]);

  if (!iso) {
    return (
      <article className="bk-ledger">
        <div className="bk-ledger__head">
          <p className="bk-ledger__weekday">Ledger</p>
          <h3 className="bk-ledger__title">Pick a day</h3>
          <p className="bk-ledger__sub">
            Choose any date on the calendar.
          </p>
        </div>
      </article>
    );
  }

  const date = new Date(iso + "T00:00:00");
  const weekdayName = WEEKDAYS[(date.getDay() + 6) % 7];

  // Merge slots from props and customEvents from /calendar/events for this day
  const bookedFromProps = (slots || []).filter((s) => s.status !== "available" && s.booking);
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

  const handleCancel = async (slot) => {
    const slotId = slot?.id || slot?.booking?.booking_id;
    const isCalEvent = slot?.isCalendarEvent || String(slot?.id).startsWith("event-");
    const calId = slot?.calendarEventId || (isCalEvent ? Number(String(slot?.id).replace("event-", "")) : null);

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
    } catch (e) { setError(e.message); }
    finally { setWorkingId(null); }
  };

  const handleReject = async (bookingId) => {
    setWorkingId(bookingId);
    setError("");
    try {
      await rejectBooking(bookingId, "Rejected by admin");
      onChanged?.();
    } catch (e) { setError(e.message); }
    finally { setWorkingId(null); }
  };

  return (
    <article className="bk-ledger" aria-label="Day view">
      <div className="bk-ledger__head">
        <p className="bk-ledger__weekday">{weekdayName}</p>
        <h3 className="bk-ledger__title">
          <span className="bk-num bk-num--xl">{date.getDate()}</span>
          <span>{date.toLocaleDateString("en-IN", { month: "long" })}</span>
        </h3>
        <p className="bk-ledger__sub">
          {bookedSlots.length > 0
            ? `${bookedSlots.length} event${bookedSlots.length === 1 ? "" : "s"} scheduled`
            : "No meetings scheduled this day"}
        </p>
      </div>

      {isAdmin && (
        <button
          type="button"
          className="bk-new-meeting-btn"
          onClick={() => setShowCreate(true)}
        >
          <Plus size={16} /> New event
        </button>
      )}

      <div className="bk-ledger__divider" />

      {error && (
        <div className="bk-notice">
          <p>{error}</p>
        </div>
      )}

      {bookedSlots.length === 0 ? (
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 10,
          padding: "36px 16px",
          color: "rgba(191,219,254,0.65)",
          textAlign: "center",
        }}>
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
                    <span className="bk-num bk-num--md">{formatTime(slot.start)}</span>
                    <span className="bk-line__to">to {formatTime(slot.end)}</span>
                  </span>
                  {isAwaitingApproval ? (
                    <span className="bk-tag is-pending">Pending</span>
                  ) : isConfirmed ? (
                    <span className="bk-tag is-taken">Confirmed</span>
                  ) : (
                    <span className="bk-tag is-taken">{bookingStatus || "Booked"}</span>
                  )}
                </div>

                {isAdmin && (
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
                          disabled={workingId === slot.booking.booking_id}
                          onClick={() => handleApprove(slot.booking.booking_id)}
                        >
                          <Check size={13} />
                          {workingId === slot.booking.booking_id ? "Approving…" : "Approve"}
                        </button>
                        <button
                          type="button"
                          className="bk-link-ivory is-danger"
                          disabled={workingId === slot.booking.booking_id}
                          onClick={() => handleReject(slot.booking.booking_id)}
                        >
                          <X size={13} /> Reject
                        </button>
                      </>
                    )}

                    {isConfirmed && (
                      <>
                        {slot.booking.meeting_link?.startsWith("http") && (
                          <a className="bk-link-ivory" href={slot.booking.meeting_link} target="_blank" rel="noreferrer">
                            <Video size={13} /> Meet
                          </a>
                        )}
                        <button
                          type="button"
                          className="bk-link-ivory is-danger"
                          disabled={workingId === slot.id || workingId === slot.booking?.booking_id}
                          onClick={() => handleCancel(slot)}
                        >
                          <X size={13} />
                          {workingId === slot.id || workingId === slot.booking?.booking_id ? "Cancelling…" : "Cancel"}
                        </button>
                      </>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
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