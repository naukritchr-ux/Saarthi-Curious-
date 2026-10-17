import { useState, useEffect } from "react";
import { Video, X, Check, Clock, Plus, Calendar } from "lucide-react";
import { formatLongDate, formatTime, WEEKDAYS } from "../bookingUtils";
import {
  cancelBooking,
  approveBooking,
  rejectBooking,
} from "../../../services/bookingApi";
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
  const bookedSlots = slots.filter((s) => s.status !== "available" && s.booking);

  const handleCancel = async (bookingId) => {
    setWorkingId(bookingId);
    setError("");
    try {
      await cancelBooking(bookingId, "Cancelled by admin");
      onChanged?.();
    } catch (e) { setError(e.message); }
    finally { setWorkingId(null); }
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
                          disabled={workingId === slot.booking.booking_id}
                          onClick={() => handleCancel(slot.booking.booking_id)}
                        >
                          <X size={13} />
                          {workingId === slot.booking.booking_id ? "Cancelling…" : "Cancel"}
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
          adminId={userId || 57}
          learners={learners}
          onClose={() => setShowCreate(false)}
          onCreated={onChanged}
        />
      )}
    </article>
  );
}