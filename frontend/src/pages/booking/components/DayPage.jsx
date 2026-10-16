import { useState } from "react";
import { Video, X, Check, Clock } from "lucide-react";
import {
  formatLongDate,
  formatTime,
  isPastSlot,
  WEEKDAYS,
} from "../bookingUtils";
import {
  bookSlot,
  cancelBooking,
  approveBooking,
  rejectBooking,
} from "../../../services/bookingApi";

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
  const [pending, setPending] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [workingId, setWorkingId] = useState(null);
  const [done, setDone] = useState(null);

  if (!iso) {
    return (
      <article className="bk-ledger">
        <div className="bk-ledger__head">
          <p className="bk-ledger__weekday">Ledger</p>
          <h3 className="bk-ledger__title">Pick a day</h3>
          <p className="bk-ledger__sub">
            Choose any date with open dots in the calendar to see its times.
          </p>
        </div>
      </article>
    );
  }

  const date = new Date(iso + "T00:00:00");
  const weekdayName = WEEKDAYS[(date.getDay() + 6) % 7];
  const openCount = slots.filter(
    (s) => s.status === "available" && !isPastSlot(s)
  ).length;

  const handleBook = async () => {
    if (!pending) return;
    setBusy(true);
    setError("");
    try {
      await bookSlot({ scheduleId: pending.id, userId: userId || 57 });
      setDone({ date: iso, start: pending.start, end: pending.end });
      setPending(null);
      onChanged?.();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const handleCancel = async (bookingId) => {
    setWorkingId(bookingId);
    setError("");
    try {
      await cancelBooking(bookingId, "Cancelled by admin");
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

  if (done) {
    return (
      <article className="bk-ledger">
        <div className="bk-ledger__head">
          <p className="bk-ledger__weekday">Requested</p>
          <h3 className="bk-done__title">Awaiting approval</h3>
        </div>
        <div className="bk-ledger__divider" />
        <div className="bk-done">
          <p className="bk-done__when">
            <strong className="bk-num bk-num--sm">{formatLongDate(done.date)}</strong>
            <strong>
              {formatTime(done.start)} – {formatTime(done.end)}
            </strong>
          </p>
          <div className="bk-stamp">Pending</div>
          <p className="bk-hint">
            <Clock size={14} />
            Your admin will confirm this call. You'll get a Meet link once approved.
          </p>
          <button
            type="button"
            className="bk-link-ivory"
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
          <span>October</span>
        </h3>
        <p className="bk-ledger__sub">
          {status === "loading"
            ? "Loading…"
            : openCount > 0
            ? `${openCount} time${openCount === 1 ? "" : "s"} open · 15 minutes each`
            : "No open slots this day"}
        </p>
      </div>

      <div className="bk-ledger__divider" />

      {error && (
        <div className="bk-notice">
          <p>{error}</p>
        </div>
      )}

      <ul className="bk-lines">
        {status === "loading" && slots.length === 0 && (
          <>
            <li className="bk-line bk-line--skeleton" />
            <li className="bk-line bk-line--skeleton" />
            <li className="bk-line bk-line--skeleton" />
          </>
        )}

        {slots.map((slot) => {
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
                    <span className="bk-num bk-num--md">{formatTime(slot.start)}</span>
                    <span className="bk-line__to">to {formatTime(slot.end)}</span>
                  </span>
                  <span className={`bk-tag ${isPending ? "is-chosen" : "is-open"}`}>
                    {isPending ? "✓ Chosen" : "Open"}
                  </span>
                </button>
              ) : (
                <div className="bk-line__row">
                  <span className="bk-line__time">
                    <span className="bk-num bk-num--md">{formatTime(slot.start)}</span>
                    <span className="bk-line__to">to {formatTime(slot.end)}</span>
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

              {isAdmin && slot.booking && (
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
                        <X size={13} />
                        Reject
                      </button>
                    </>
                  )}

                  {isConfirmed && (
                    <>
                      {slot.booking.meeting_link &&
                        slot.booking.meeting_link.startsWith("http") && (
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

              {!isAdmin && isAwaitingApproval && (
                <div className="bk-line__admin">
                  <span className="bk-who" style={{ textAlign: "left", alignItems: "flex-start" }}>
                    <small>Awaiting admin approval</small>
                  </span>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      {!isAdmin && (
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
                The admin will confirm this call. You'll receive the Meet link once approved.
              </p>
            </>
          ) : (
            <p className="bk-confirm__text bk-confirm__text--idle">
              Choose a time slot to request a call.
            </p>
          )}
        </div>
      )}

      {isAdmin && (
        <p className="bk-hint" style={{ marginTop: 20 }}>
          Pending bookings appear here. Approve to create the Google Meet link and confirm.
        </p>
      )}
    </article>
  );
}