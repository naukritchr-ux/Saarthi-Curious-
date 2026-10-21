import React, { useState, useEffect } from "react";
import { 
  X, 
  Plus, 
  Ban, 
  Copy, 
  Globe, 
  Clock, 
  ChevronDown, 
  ExternalLink, 
  Check, 
  Share2, 
  Sparkles,
  Info
} from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";

const BACKEND_URL =
  import.meta.env.VITE_API_URL ||
  (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
    ? "http://127.0.0.1:8000"
    : "https://saarthi-curious-00e8.onrender.com");

const dayLabels = [
  { day: 0, short: "Mon", full: "Monday" },
  { day: 1, short: "Tue", full: "Tuesday" },
  { day: 2, short: "Wed", full: "Wednesday" },
  { day: 3, short: "Thu", full: "Thursday" },
  { day: 4, short: "Fri", full: "Friday" },
  { day: 5, short: "Sat", full: "Saturday" },
  { day: 6, short: "Sun", full: "Sunday" }
];

export default function AppointmentScheduleSidebar({
  adminId,
  onClose,
  onAvailabilityUpdated,
}) {
  const [title, setTitle] = useState("Bookable appointment schedule");
  const [duration, setDuration] = useState("60"); // in minutes (e.g. 60 = 1 hour)
  const [repeatType, setRepeatType] = useState("weekly");
  const [schedulingWindow, setSchedulingWindow] = useState("60 days in advance to 4 hours before");
  const [isSaving, setIsSaving] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // 7 Days Weekly Availability Schedule (0=Mon, 6=Sun)
  const [schedule, setSchedule] = useState([
    { day_of_week: 6, short: "Sun", start_time: "09:00", end_time: "17:00", is_available: false },
    { day_of_week: 0, short: "Mon", start_time: "09:00", end_time: "17:00", is_available: true },
    { day_of_week: 1, short: "Tue", start_time: "09:00", end_time: "17:00", is_available: true },
    { day_of_week: 2, short: "Wed", start_time: "09:00", end_time: "17:00", is_available: true },
    { day_of_week: 3, short: "Thu", start_time: "09:00", end_time: "17:00", is_available: true },
    { day_of_week: 4, short: "Fri", start_time: "09:00", end_time: "17:00", is_available: true },
    { day_of_week: 5, short: "Sat", start_time: "09:00", end_time: "17:00", is_available: false },
  ]);

  // Load existing availability from DB
  useEffect(() => {
    const fetchAvailability = async () => {
      try {
        const res = await axios.get(`${BACKEND_URL}/bookings/user-availability/${adminId}`);
        if (res.data?.schedule) {
          if (res.data.title) setTitle(res.data.title);
          if (res.data.duration_minutes) setDuration(String(res.data.duration_minutes));

          // Map database days (0=Mon..6=Sun) into our display order: Sun, Mon, Tue, Wed, Thu, Fri, Sat
          const dbDays = res.data.schedule;
          const map = {};
          dbDays.forEach(d => { map[d.day_of_week] = d; });

          const displayOrder = [6, 0, 1, 2, 3, 4, 5];
          const newSchedule = displayOrder.map(dIdx => {
            const item = map[dIdx];
            const shortName = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][dIdx];
            return {
              day_of_week: dIdx,
              short: shortName,
              start_time: item?.start_time || "09:00",
              end_time: item?.end_time || "17:00",
              is_available: item ? item.is_available : (dIdx < 5),
            };
          });
          setSchedule(newSchedule);
        }
      } catch (err) {
        console.error("Could not fetch user availability:", err);
      }
    };
    if (adminId) fetchAvailability();
  }, [adminId]);

  const toggleDayAvailable = (dayIndex, makeAvailable) => {
    setSchedule(prev => prev.map((item, idx) => {
      if (idx === dayIndex) {
        return { ...item, is_available: makeAvailable };
      }
      return item;
    }));
  };

  const updateDayTime = (dayIndex, field, value) => {
    setSchedule(prev => prev.map((item, idx) => {
      if (idx === dayIndex) {
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  const copyToAllDays = (sourceIndex) => {
    const src = schedule[sourceIndex];
    setSchedule(prev => prev.map(item => ({
      ...item,
      start_time: src.start_time,
      end_time: src.end_time,
      is_available: true,
    })));
    toast.success(`Copied ${src.short} (${src.start_time} - ${src.end_time}) to all days!`);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const payload = {
        user_id: Number(adminId),
        title: title || "Bookable appointment schedule",
        duration_minutes: Number(duration),
        schedule: schedule.map(s => ({
          day_of_week: s.day_of_week,
          start_time: s.start_time,
          end_time: s.end_time,
          is_available: s.is_available,
        })),
      };

      await axios.post(`${BACKEND_URL}/bookings/user-availability`, payload);
      toast.success("Appointment schedule saved! Working hours updated.");
      onAvailabilityUpdated?.(payload);
    } catch (err) {
      console.error("Failed to save schedule:", err);
      toast.error("Failed to save appointment schedule.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopyLink = () => {
    const origin = window.location.origin;
    const url = `${origin}/book/${adminId}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    toast.success("Shareable booking link copied to clipboard!");
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <aside className="gcal-appointment-sidebar" onClick={e => e.stopPropagation()}>
      {/* Top Header Actions */}
      <div className="appt-sidebar-top-bar">
        <div className="appt-sidebar-top-left">
          <button 
            type="button" 
            className="appt-header-text-btn"
            onClick={() => toast("Appointment schedule allows learners to book slots in your free time.", { icon: "💡" })}
          >
            Take a tour
          </button>
          <button 
            type="button" 
            className="appt-header-text-btn"
            onClick={() => toast("Thank you for your feedback!", { icon: "✉️" })}
          >
            Feedback
          </button>
        </div>
        <button
          type="button"
          className="appt-sidebar-close-btn"
          onClick={onClose}
          title="Close sidebar"
        >
          <X size={18} />
        </button>
      </div>

      <div className="appt-sidebar-content-scroll">
        {/* Section Heading */}
        <div className="appt-subtitle-pill">
          BOOKABLE APPOINTMENT SCHEDULE
        </div>

        {/* Title Input */}
        <div className="appt-title-input-wrap">
          <input
            type="text"
            className="appt-title-input"
            placeholder="Add title"
            value={title}
            onChange={e => setTitle(e.target.value)}
          />
        </div>

        {/* Shareable Booking Link Callout */}
        <div className="appt-share-banner">
          <div className="appt-share-info">
            <span className="appt-share-label">Your Booking Page</span>
            <span className="appt-share-url">/book/{adminId}</span>
          </div>
          <button
            type="button"
            className="appt-share-copy-btn"
            onClick={handleCopyLink}
            title="Copy booking link"
          >
            {copiedLink ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
            <span>{copiedLink ? "Copied" : "Copy Link"}</span>
          </button>
        </div>

        {/* Appointment Duration */}
        <div className="appt-form-section">
          <div className="appt-section-icon-row">
            <Clock size={16} className="appt-sec-icon" />
            <div>
              <label className="appt-section-label">Appointment duration</label>
              <p className="appt-section-sub">How long should each appointment last?</p>
            </div>
          </div>
          <div className="appt-select-wrap">
            <select
              className="appt-select-input"
              value={duration}
              onChange={e => setDuration(e.target.value)}
            >
              <option value="15">15 minutes</option>
              <option value="30">30 minutes</option>
              <option value="45">45 minutes</option>
              <option value="60">1 hour</option>
              <option value="90">1.5 hours</option>
              <option value="120">2 hours</option>
            </select>
          </div>
        </div>

        {/* General Availability */}
        <div className="appt-form-section">
          <div className="appt-section-icon-row">
            <Clock size={16} className="appt-sec-icon" />
            <div>
              <label className="appt-section-label">General availability</label>
              <p className="appt-section-sub">
                Set when you're regularly available for appointments.{" "}
                <a href="#learn" onClick={(e) => { e.preventDefault(); toast("Standard working hours define your open schedule.", { icon: "ℹ️" }); }} className="appt-link-blue">
                  Learn more
                </a>
              </p>
            </div>
          </div>

          <div className="appt-select-wrap">
            <select
              className="appt-select-input"
              value={repeatType}
              onChange={e => setRepeatType(e.target.value)}
            >
              <option value="weekly">Repeat weekly</option>
              <option value="does_not_repeat">Does not repeat</option>
            </select>
          </div>

          {/* 7 Days Availability Rows */}
          <div className="appt-days-list">
            {schedule.map((dayItem, idx) => (
              <div key={dayItem.day_of_week} className="appt-day-row">
                <span className="appt-day-name">{dayItem.short}</span>

                {dayItem.is_available ? (
                  <div className="appt-day-controls">
                    <input
                      type="time"
                      value={dayItem.start_time}
                      onChange={e => updateDayTime(idx, "start_time", e.target.value)}
                      className="appt-time-input"
                    />
                    <span className="appt-time-dash">–</span>
                    <input
                      type="time"
                      value={dayItem.end_time}
                      onChange={e => updateDayTime(idx, "end_time", e.target.value)}
                      className="appt-time-input"
                    />

                    {/* Make Unavailable Button */}
                    <button
                      type="button"
                      className="appt-day-action-icon"
                      onClick={() => toggleDayAvailable(idx, false)}
                      title="Mark as unavailable"
                    >
                      <Ban size={15} />
                    </button>

                    {/* Add Split Time Button */}
                    <button
                      type="button"
                      className="appt-day-action-icon"
                      onClick={() => toast("Additional slot intervals are supported via multiple entries.", { icon: "⏱️" })}
                      title="Add interval"
                    >
                      <Plus size={15} />
                    </button>

                    {/* Copy to All Days Button */}
                    <button
                      type="button"
                      className="appt-day-action-icon"
                      onClick={() => copyToAllDays(idx)}
                      title="Copy times to all days"
                    >
                      <Copy size={15} />
                    </button>
                  </div>
                ) : (
                  <div className="appt-day-unavailable-row">
                    <span className="appt-unavailable-text">Unavailable</span>
                    <button
                      type="button"
                      className="appt-day-action-icon"
                      onClick={() => toggleDayAvailable(idx, true)}
                      title="Make available"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Time Zone Chip */}
          <div className="appt-timezone-chip">
            <div className="appt-tz-content">
              <span className="appt-tz-title">Time zone</span>
              <span className="appt-tz-val">(GMT+05:30) India Standard Time - Kolkata</span>
            </div>
            <button
              type="button"
              className="appt-tz-close"
              onClick={() => toast("Time zone locked to Asia/Kolkata", { icon: "🌐" })}
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Scheduling Window */}
        <div className="appt-form-section">
          <div className="appt-expandable-section">
            <div className="appt-expand-header">
              <div className="flex items-center gap-2">
                <span className="appt-expand-title">Scheduling window</span>
              </div>
              <ChevronDown size={16} className="text-gray-400" />
            </div>
            <p className="appt-expand-desc">{schedulingWindow}</p>
          </div>
        </div>

        {/* Adjusted Availability */}
        <div className="appt-form-section">
          <div className="appt-expandable-section">
            <div className="appt-expand-header">
              <div className="flex items-center gap-2">
                <span className="appt-expand-title">Adjusted availability</span>
              </div>
            </div>
            <p className="appt-expand-desc">
              Indicate times on specific dates when you're available
            </p>
          </div>
        </div>
      </div>

      {/* Footer Next / Save Button */}
      <div className="appt-sidebar-footer">
        <button
          type="button"
          className="appt-sidebar-next-btn"
          onClick={handleSave}
          disabled={isSaving}
        >
          {isSaving ? "Saving..." : "Next"}
        </button>
      </div>
    </aside>
  );
}
