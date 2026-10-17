import { useState } from "react";
import { X, Calendar, Clock, User as UserIcon, FileText } from "lucide-react";
import { createCustomBooking } from "../../../services/bookingApi";

const DURATIONS = [15, 30, 45, 60];

const addMinutes = (hhmm, mins) => {
    const [h, m] = hhmm.split(":").map(Number);
    const total = h * 60 + m + mins;
    const nh = Math.floor(total / 60) % 24;
    const nm = total % 60;
    return `${String(nh).padStart(2, "0")}:${String(nm).padStart(2, "0")}`;
};

export default function CreateMeetingModal({ defaultDate, adminId, learners, onClose, onCreated }) {
    const [date, setDate] = useState(defaultDate || new Date().toISOString().slice(0, 10));
    const [startTime, setStartTime] = useState("10:00");
    const [duration, setDuration] = useState(30);
    const [learnerId, setLearnerId] = useState("");
    const [purpose, setPurpose] = useState("Saarthi Curious - Meeting");
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");

    const endTime = addMinutes(startTime, duration);

    const handleCreate = async () => {
        setError("");
        if (!learnerId) {
            setError("Please select a learner.");
            return;
        }
        setBusy(true);
        try {
            await createCustomBooking({
                admin_id: adminId,
                user_id: parseInt(learnerId),
                date,
                start_time: startTime,
                end_time: endTime,
                title: purpose,
                description: purpose,
            });
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
                position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)",
                display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100,
            }}
            onClick={onClose}
        >
            <div
                style={{
                    background: "white", borderRadius: 14, width: "100%", maxWidth: 460,
                    overflow: "hidden", boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div style={{
                    padding: "16px 20px", borderBottom: "1px solid #E5E7EB",
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    background: "linear-gradient(135deg, #1E3A8A, #3B82F6)",
                }}>
                    <div>
                        <h3 style={{ color: "white", fontWeight: 700, fontSize: 15, margin: 0 }}>New meeting</h3>
                        <p style={{ color: "rgba(255,255,255,0.75)", fontSize: 11, margin: "3px 0 0" }}>
                            Google Calendar invite sent to both parties
                        </p>
                    </div>
                    <button onClick={onClose} style={{
                        background: "rgba(255,255,255,0.15)", border: 0, borderRadius: 8,
                        padding: 6, cursor: "pointer", color: "white",
                    }}>
                        <X size={16} />
                    </button>
                </div>

                {/* Body */}
                <div style={{ padding: "20px" }}>
                    <Field icon={<UserIcon size={14} />} label="Learner">
                        <select
                            value={learnerId}
                            onChange={(e) => setLearnerId(e.target.value)}
                            style={inputStyle}
                        >
                            <option value="">Select a learner…</option>
                            {learners.map((l) => (
                                <option key={l.user_id} value={l.user_id}>
                                    {l.full_name} — {l.email}
                                </option>
                            ))}
                        </select>
                    </Field>

                    <Field icon={<FileText size={14} />} label="Title / purpose">
                        <input
                            type="text"
                            value={purpose}
                            onChange={(e) => setPurpose(e.target.value)}
                            placeholder="Retention session, 1:1 check-in…"
                            style={inputStyle}
                        />
                    </Field>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                        <Field icon={<Calendar size={14} />} label="Date">
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                style={inputStyle}
                            />
                        </Field>

                        <Field icon={<Clock size={14} />} label="Start time">
                            <input
                                type="time"
                                value={startTime}
                                onChange={(e) => setStartTime(e.target.value)}
                                style={inputStyle}
                            />
                        </Field>
                    </div>

                    <Field icon={<Clock size={14} />} label="Duration">
                        <div style={{ display: "flex", gap: 8 }}>
                            {DURATIONS.map((d) => (
                                <button
                                    key={d}
                                    type="button"
                                    onClick={() => setDuration(d)}
                                    style={{
                                        flex: 1, padding: "8px 0", borderRadius: 8, border: 0, cursor: "pointer",
                                        background: duration === d ? "#1E3A8A" : "#F3F4F6",
                                        color: duration === d ? "white" : "#374151",
                                        fontWeight: 600, fontSize: 12,
                                    }}
                                >
                                    {d}m
                                </button>
                            ))}
                        </div>
                    </Field>

                    <div style={{
                        background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: 8,
                        padding: "10px 12px", fontSize: 12, color: "#1E40AF", marginTop: 12,
                    }}>
                        <strong>{startTime} – {endTime}</strong> · {duration} min
                    </div>

                    {error && (
                        <div style={{
                            background: "#FEE2E2", color: "#991B1B", fontSize: 12,
                            padding: "8px 12px", borderRadius: 8, marginTop: 12,
                        }}>
                            {error}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div style={{
                    padding: "14px 20px", borderTop: "1px solid #E5E7EB",
                    display: "flex", justifyContent: "flex-end", gap: 10,
                }}>
                    <button
                        onClick={onClose}
                        disabled={busy}
                        style={{
                            padding: "10px 20px", borderRadius: 8, border: 0, cursor: "pointer",
                            background: "#F3F4F6", color: "#374151", fontWeight: 600, fontSize: 13,
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleCreate}
                        disabled={busy || !learnerId}
                        style={{
                            padding: "10px 24px", borderRadius: 8, border: 0, cursor: "pointer",
                            background: busy || !learnerId ? "#93C5FD" : "linear-gradient(135deg, #1E3A8A, #3B82F6)",
                            color: "white", fontWeight: 700, fontSize: 13,
                        }}
                    >
                        {busy ? "Creating…" : "Create meeting"}
                    </button>
                </div>
            </div>
        </div>
    );
}

const inputStyle = {
    width: "100%", padding: "10px 12px", borderRadius: 8,
    border: "1px solid #D1D5DB", fontSize: 13, outline: "none",
    color: "#111827", background: "white",
};

function Field({ icon, label, children }) {
    return (
        <div style={{ marginBottom: 14 }}>
            <label style={{
                display: "flex", alignItems: "center", gap: 6,
                fontSize: 11, fontWeight: 600, color: "#6B7280",
                marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em",
            }}>
                {icon} {label}
            </label>
            {children}
        </div>
    );
}