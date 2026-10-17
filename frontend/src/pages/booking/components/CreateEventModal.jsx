import { useState } from "react";
import { X } from "lucide-react";
import { createCustomBooking } from "../../../services/bookingApi";
import { createCalendarEvent } from "../../../services/calendarEventsApi";

const diffMinutes = (a, b) => {
    const [ah, am] = a.split(":").map(Number);
    const [bh, bm] = b.split(":").map(Number);
    return bh * 60 + bm - (ah * 60 + am);
};

const fmtDuration = (mins) => {
    if (mins <= 0) return "—";
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h === 0) return `${m}m`;
    if (m === 0) return `${h}h`;
    return `${h}h ${m}m`;
};

export default function CreateEventModal({
    defaultDate,
    adminId,
    learners,
    onClose,
    onCreated,
}) {
    const [date, setDate] = useState(
        defaultDate || new Date().toISOString().slice(0, 10)
    );
    const [startTime, setStartTime] = useState("10:00");
    const [endTime, setEndTime] = useState("10:30");
    const [learnerId, setLearnerId] = useState("");
    const [title, setTitle] = useState("");
    const [addMeet, setAddMeet] = useState(true);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");

    const duration = diffMinutes(startTime, endTime);
    const isMeeting = !!learnerId;

    const handleCreate = async () => {
        setError("");
        if (duration <= 0) {
            setError("End time must be after start time.");
            return;
        }
        if (!title.trim()) {
            setError("Please enter a title.");
            return;
        }

        setBusy(true);
        try {
            if (isMeeting) {
                await createCustomBooking({
                    admin_id: adminId,
                    user_id: parseInt(learnerId),
                    date,
                    start_time: startTime,
                    end_time: endTime,
                    title,
                    description: title,
                    add_meet: addMeet,
                });
            } else {
                await createCalendarEvent({
                    admin_id: adminId,
                    date,
                    start_time: startTime,
                    end_time: endTime,
                    title,
                    event_type: "custom",
                    add_meet: addMeet,
                });
            }
            onCreated?.();
            onClose();
        } catch (e) {
            setError(e.message);
        } finally {
            setBusy(false);
        }
    };

    return (
        <div
            style={{
                position: "fixed",
                inset: 0,
                background: "rgba(0,0,0,0.6)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 200,
            }}
            onClick={onClose}
        >
            <div
                style={{
                    background: "white",
                    borderRadius: 14,
                    width: "100%",
                    maxWidth: 440,
                    overflow: "hidden",
                    boxShadow: "0 30px 80px rgba(0,0,0,0.55)",
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <div
                    style={{
                        padding: "16px 20px",
                        background: "#1E3A8A",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                    }}
                >
                    <div>
                        <h3
                            style={{
                                color: "white",
                                fontWeight: 700,
                                fontSize: 15,
                                margin: 0,
                            }}
                        >
                            New event
                        </h3>
                        <p
                            style={{
                                color: "rgba(255,255,255,0.75)",
                                fontSize: 11,
                                margin: "3px 0 0",
                            }}
                        >
                            Syncs to Google Calendar
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            background: "rgba(255,255,255,0.2)",
                            border: 0,
                            borderRadius: 8,
                            padding: 6,
                            cursor: "pointer",
                            color: "white",
                        }}
                    >
                        <X size={16} />
                    </button>
                </div>

                <div style={{ padding: "20px" }}>
                    <Field label="Title">
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Retention session, birthday, holiday…"
                            style={inputStyle}
                            autoFocus
                        />
                    </Field>

                    <Field label="Learner (optional)">
                        <select
                            value={learnerId}
                            onChange={(e) => setLearnerId(e.target.value)}
                            style={inputStyle}
                        >
                            <option value="">— Personal event (no learner) —</option>
                            {learners.map((l) => (
                                <option key={l.user_id} value={l.user_id}>
                                    {l.full_name} — {l.email}
                                </option>
                            ))}
                        </select>
                    </Field>

                    <Field label="Date">
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            style={inputStyle}
                        />
                    </Field>

                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr",
                            gap: 12,
                        }}
                    >
                        <Field label="Start">
                            <input
                                type="time"
                                value={startTime}
                                onChange={(e) => setStartTime(e.target.value)}
                                style={inputStyle}
                            />
                        </Field>
                        <Field label="End">
                            <input
                                type="time"
                                value={endTime}
                                onChange={(e) => setEndTime(e.target.value)}
                                style={inputStyle}
                            />
                        </Field>
                    </div>

                    <div
                        style={{
                            background: duration > 0 ? "#EFF6FF" : "#FEE2E2",
                            border: `1px solid ${duration > 0 ? "#BFDBFE" : "#FECACA"}`,
                            borderRadius: 8,
                            padding: "10px 12px",
                            fontSize: 12,
                            color: duration > 0 ? "#1E40AF" : "#991B1B",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginTop: 4,
                        }}
                    >
                        <span>
                            <strong>
                                {startTime} – {endTime}
                            </strong>
                        </span>
                        <span style={{ fontWeight: 700 }}>{fmtDuration(duration)}</span>
                    </div>

                    {/* Google Meet toggle */}
                    <label
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            marginTop: 14,
                            cursor: "pointer",
                            padding: "10px 12px",
                            border: "1px solid #E5E7EB",
                            borderRadius: 8,
                            background: addMeet ? "#ECFDF5" : "#F9FAFB",
                        }}
                    >
                        <input
                            type="checkbox"
                            checked={addMeet}
                            onChange={(e) => setAddMeet(e.target.checked)}
                            style={{
                                width: 16,
                                height: 16,
                                cursor: "pointer",
                                accentColor: "#10B981",
                            }}
                        />
                        <span
                            style={{
                                fontSize: 13,
                                fontWeight: 600,
                                color: addMeet ? "#065F46" : "#6B7280",
                            }}
                        >
                            Add Google Meet link
                        </span>
                    </label>

                    {error && (
                        <div
                            style={{
                                background: "#FEE2E2",
                                color: "#991B1B",
                                fontSize: 12,
                                padding: "8px 12px",
                                borderRadius: 8,
                                marginTop: 12,
                            }}
                        >
                            {error}
                        </div>
                    )}
                </div>

                <div
                    style={{
                        padding: "14px 20px",
                        borderTop: "1px solid #E5E7EB",
                        display: "flex",
                        justifyContent: "flex-end",
                        gap: 10,
                    }}
                >
                    <button
                        onClick={onClose}
                        disabled={busy}
                        style={{
                            padding: "10px 20px",
                            borderRadius: 8,
                            border: 0,
                            cursor: "pointer",
                            background: "#F3F4F6",
                            color: "#374151",
                            fontWeight: 600,
                            fontSize: 13,
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleCreate}
                        disabled={busy || duration <= 0 || !title.trim()}
                        style={{
                            padding: "10px 24px",
                            borderRadius: 8,
                            border: 0,
                            cursor:
                                busy || duration <= 0 || !title.trim()
                                    ? "not-allowed"
                                    : "pointer",
                            background:
                                busy || duration <= 0 || !title.trim()
                                    ? "#93C5FD"
                                    : "#1E3A8A",
                            color: "white",
                            fontWeight: 700,
                            fontSize: 13,
                            minWidth: 130,
                        }}
                    >
                        {busy ? "Creating…" : "Create event"}
                    </button>
                </div>
            </div>
        </div>
    );
}

const inputStyle = {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 8,
    border: "1px solid #D1D5DB",
    fontSize: 13,
    outline: "none",
    color: "#111827",
    background: "white",
};

function Field({ label, children }) {
    return (
        <div style={{ marginBottom: 14 }}>
            <label
                style={{
                    display: "block",
                    fontSize: 10,
                    fontWeight: 700,
                    color: "#6B7280",
                    marginBottom: 6,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                }}
            >
                {label}
            </label>
            {children}
        </div>
    );
}