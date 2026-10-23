import React, { useState, useEffect } from "react";
import { 
  X, 
  Plus, 
  Ban, 
  Trash2,
  Copy, 
  Globe, 
  Clock, 
  ChevronDown, 
  ChevronUp,
  ExternalLink, 
  Check, 
  Share2, 
  Sparkles,
  Info,
  Calendar,
  AlertCircle
} from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";

const BACKEND_URL =
  import.meta.env.VITE_API_URL ||
  (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
    ? "http://127.0.0.1:8000"
    : "https://saarthi-curious-00e8.onrender.com");

const defaultDays = [
  { day_of_week: 6, short: "Sun", full: "Sunday", is_available: false, intervals: [{ id: "sun-1", start_time: "09:00", end_time: "17:00" }] },
  { day_of_week: 0, short: "Mon", full: "Monday", is_available: true, intervals: [{ id: "mon-1", start_time: "09:00", end_time: "17:00" }] },
  { day_of_week: 1, short: "Tue", full: "Tuesday", is_available: true, intervals: [{ id: "tue-1", start_time: "09:00", end_time: "17:00" }] },
  { day_of_week: 2, short: "Wed", full: "Wednesday", is_available: true, intervals: [{ id: "wed-1", start_time: "09:00", end_time: "17:00" }] },
  { day_of_week: 3, short: "Thu", full: "Thursday", is_available: true, intervals: [{ id: "thu-1", start_time: "09:00", end_time: "17:00" }] },
  { day_of_week: 4, short: "Fri", full: "Friday", is_available: true, intervals: [{ id: "fri-1", start_time: "09:00", end_time: "17:00" }] },
  { day_of_week: 5, short: "Sat", full: "Saturday", is_available: false, intervals: [{ id: "sat-1", start_time: "09:00", end_time: "17:00" }] },
];

export default function AppointmentScheduleSidebar({
  adminId,
  onClose,
  onAvailabilityUpdated,
}) {
  const [title, setTitle] = useState("Bookable appointment schedule");
  const [duration, setDuration] = useState("60"); // in minutes
  const [repeatType, setRepeatType] = useState("weekly");
  const [isSaving, setIsSaving] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Expandable sections
  const [isSchedulingWindowOpen, setIsSchedulingWindowOpen] = useState(false);
  const [advanceDays, setAdvanceDays] = useState("60");
  const [noticeHours, setNoticeHours] = useState("4");

  const [isAdjustedAvailOpen, setIsAdjustedAvailOpen] = useState(false);
  const [dateOverrides, setDateOverrides] = useState([]);
  const [newOverrideDate, setNewOverrideDate] = useState("");

  // Modals for Tour & Feedback
  const [showTourModal, setShowTourModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");

  // Weekly Days with Multiple Intervals per day
  const [days, setDays] = useState(defaultDays);

  // Load existing availability from DB
  useEffect(() => {
    const fetchAvailability = async () => {
      try {
        const res = await axios.get(`${BACKEND_URL}/bookings/user-availability/${adminId}`);
        if (res.data?.schedule) {
          if (res.data.title) setTitle(res.data.title);
          if (res.data.duration_minutes) setDuration(String(res.data.duration_minutes));

          const rawSchedule = res.data.schedule;
          const grouped = {};
          [6, 0, 1, 2, 3, 4, 5].forEach(d => {
            grouped[d] = { is_available: false, intervals: [] };
          });

          rawSchedule.forEach((item, idx) => {
            const d = item.day_of_week;
            if (grouped[d]) {
              if (item.is_available) {
                grouped[d].is_available = true;
                grouped[d].intervals.push({
                  id: `interval-${d}-${idx}-${Math.random().toString(36).slice(2, 6)}`,
                  start_time: item.start_time || "09:00",
                  end_time: item.end_time || "17:00",
                });
              }
            }
          });

          const loadedDays = defaultDays.map(def => {
            const custom = grouped[def.day_of_week];
            if (custom && custom.intervals.length > 0) {
              return {
                ...def,
                is_available: true,
                intervals: custom.intervals
              };
            } else if (custom && !custom.is_available) {
              return {
                ...def,
                is_available: false,
                intervals: [{ id: `${def.short.toLowerCase()}-1`, start_time: "09:00", end_time: "17:00" }]
              };
            }
            return def;
          });
          setDays(loadedDays);
        }
      } catch (err) {
        console.error("Could not fetch user availability:", err);
      }
    };
    if (adminId) fetchAvailability();
  }, [adminId]);

  // Make an unavailable day available
  const handleMakeDayAvailable = (dayIndex) => {
    setDays(prevDays => {
      return prevDays.map((dItem, idx) => {
        if (idx !== dayIndex) return dItem;
        const intervals = dItem.intervals && dItem.intervals.length > 0 
          ? dItem.intervals 
          : [{ id: `iv-${Date.now()}`, start_time: "09:00", end_time: "17:00" }];
        return {
          ...dItem,
          is_available: true,
          intervals
        };
      });
    });
    toast.success(`${days[dayIndex].full} set to available!`);
  };

  // Add multiple intervals within the same day
  const handleAddInterval = (dayIndex, currentInterval) => {
    setDays(prevDays => {
      return prevDays.map((dItem, idx) => {
        if (idx !== dayIndex) return dItem;

        // Calculate a smart next interval
        const lastEndTime = currentInterval?.end_time || dItem.intervals[dItem.intervals.length - 1]?.end_time || "17:00";
        const [hStr, mStr] = lastEndTime.split(":");
        const endH = parseInt(hStr, 10) || 12;
        const endM = parseInt(mStr, 10) || 0;

        let nextStartH = endH;
        let nextStartM = endM;
        // 1-hour break between intervals if space permits
        if (nextStartH < 22) {
          nextStartH += 1;
        }
        let nextEndH = Math.min(23, nextStartH + 4);
        if (nextEndH <= nextStartH) {
          nextEndH = Math.min(24, nextStartH + 1);
        }

        const newStart = `${String(nextStartH % 24).padStart(2, "0")}:${String(nextStartM).padStart(2, "0")}`;
        const newEnd = `${String(nextEndH % 24).padStart(2, "0")}:${String(nextStartM).padStart(2, "0")}`;

        const newInterval = {
          id: `iv-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          start_time: newStart,
          end_time: newEnd,
        };

        const updatedIntervals = [...dItem.intervals, newInterval].sort((a, b) => a.start_time.localeCompare(b.start_time));
        return {
          ...dItem,
          is_available: true,
          intervals: updatedIntervals
        };
      });
    });
    toast.success(`Added new interval to ${days[dayIndex].full}!`);
  };

  // Remove an interval (or mark day unavailable if it's the last interval)
  const handleRemoveInterval = (dayIndex, intervalId) => {
    const currentDay = days[dayIndex];
    if (currentDay.intervals.length <= 1) {
      setDays(prevDays => {
        return prevDays.map((dItem, idx) => {
          if (idx !== dayIndex) return dItem;
          return { ...dItem, is_available: false };
        });
      });
      toast(`${currentDay.full} marked as unavailable`, { icon: "🚫" });
    } else {
      setDays(prevDays => {
        return prevDays.map((dItem, idx) => {
          if (idx !== dayIndex) return dItem;
          return {
            ...dItem,
            intervals: dItem.intervals.filter(iv => iv.id !== intervalId)
          };
        });
      });
      toast.success(`Removed interval from ${currentDay.full}`);
    }
  };

  // Update interval start/end time
  const handleUpdateIntervalTime = (dayIndex, intervalId, field, value) => {
    setDays(prevDays => {
      return prevDays.map((dItem, idx) => {
        if (idx !== dayIndex) return dItem;
        return {
          ...dItem,
          intervals: dItem.intervals.map(iv => {
            if (iv.id === intervalId) {
              return { ...iv, [field]: value };
            }
            return iv;
          })
        };
      });
    });
  };

  // Copy all intervals from a day to all other days
  const handleCopyToAllDays = (sourceIndex) => {
    const src = days[sourceIndex];
    if (!src.is_available || src.intervals.length === 0) {
      toast.error("Cannot copy from an unavailable day");
      return;
    }
    setDays(prevDays => {
      return prevDays.map(dItem => ({
        ...dItem,
        is_available: true,
        intervals: src.intervals.map((iv, i) => ({
          id: `copied-${dItem.day_of_week}-${i}-${Math.random().toString(36).slice(2, 6)}`,
          start_time: iv.start_time,
          end_time: iv.end_time,
        }))
      }));
    });
    const ivCount = src.intervals.length;
    toast.success(`Copied ${src.full} (${ivCount} interval${ivCount > 1 ? "s" : ""}) to all days!`);
  };

  // Save Schedule to Backend
  const handleSave = async () => {
    // Validate intervals
    for (const d of days) {
      if (d.is_available) {
        for (const iv of d.intervals) {
          if (iv.start_time >= iv.end_time) {
            toast.error(`Invalid hours on ${d.full}: Start time (${iv.start_time}) must be earlier than End time (${iv.end_time})`);
            return;
          }
        }
        // Check for overlaps
        const sorted = [...d.intervals].sort((a, b) => a.start_time.localeCompare(b.start_time));
        for (let i = 0; i < sorted.length - 1; i++) {
          if (sorted[i].end_time > sorted[i + 1].start_time) {
            toast.error(`Overlapping intervals on ${d.full} (${sorted[i].start_time}-${sorted[i].end_time} overlaps with ${sorted[i + 1].start_time}-${sorted[i + 1].end_time})`);
            return;
          }
        }
      }
    }

    setIsSaving(true);
    try {
      const schedulePayload = [];
      days.forEach(d => {
        if (d.is_available && d.intervals.length > 0) {
          d.intervals.forEach(iv => {
            schedulePayload.push({
              day_of_week: d.day_of_week,
              start_time: iv.start_time,
              end_time: iv.end_time,
              is_available: true,
            });
          });
        } else {
          schedulePayload.push({
            day_of_week: d.day_of_week,
            start_time: "09:00",
            end_time: "17:00",
            is_available: false,
          });
        }
      });

      const payload = {
        user_id: Number(adminId),
        title: title || "Bookable appointment schedule",
        duration_minutes: Number(duration),
        schedule: schedulePayload,
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

  // Copy shareable booking link
  const handleCopyLink = () => {
    const origin = window.location.origin;
    const url = `${origin}/book/${adminId}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    toast.success("Shareable booking link copied to clipboard!");
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleOpenBookingPage = () => {
    window.open(`/book/${adminId}`, "_blank");
  };

  const handleAddDateOverride = () => {
    if (!newOverrideDate) {
      toast.error("Please pick a date");
      return;
    }
    setDateOverrides(prev => [...prev, { date: newOverrideDate, status: "unavailable" }]);
    setNewOverrideDate("");
    toast.success(`Added holiday/date override for ${newOverrideDate}`);
  };

  return (
    <aside className="gcal-appointment-sidebar" onClick={e => e.stopPropagation()}>
      {/* Top Header Actions */}
      <div className="appt-sidebar-top-bar">
        <div className="appt-sidebar-top-left">
          <button 
            type="button" 
            className="appt-header-text-btn"
            onClick={() => setShowTourModal(true)}
          >
            Take a tour
          </button>
          <button 
            type="button" 
            className="appt-header-text-btn"
            onClick={() => setShowFeedbackModal(true)}
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
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              className="appt-share-copy-btn"
              onClick={handleCopyLink}
              title="Copy booking link"
            >
              {copiedLink ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
              <span>{copiedLink ? "Copied" : "Copy"}</span>
            </button>
            <button
              type="button"
              className="appt-share-open-btn"
              onClick={handleOpenBookingPage}
              title="Open public booking page in new tab"
            >
              <ExternalLink size={14} />
            </button>
          </div>
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
                <button
                  type="button"
                  onClick={() => setShowTourModal(true)}
                  className="appt-link-blue"
                >
                  Learn more
                </button>
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

          {/* 7 Days Availability Rows with Multiple Intervals */}
          <div className="appt-days-list">
            {days.map((dayItem, dIdx) => (
              <div key={dayItem.day_of_week} className="appt-day-group">
                {!dayItem.is_available ? (
                  <div className="appt-day-row">
                    <span className="appt-day-name">{dayItem.short}</span>
                    <div className="appt-day-unavailable-row">
                      <span className="appt-unavailable-text">Unavailable</span>
                      <button
                        type="button"
                        className="appt-day-action-icon"
                        onClick={() => handleMakeDayAvailable(dIdx)}
                        title={`Make ${dayItem.full} available`}
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>
                ) : (
                  dayItem.intervals.map((iv, ivIdx) => (
                    <div key={iv.id || ivIdx} className="appt-day-row">
                      {ivIdx === 0 ? (
                        <span className="appt-day-name">{dayItem.short}</span>
                      ) : (
                        <span className="appt-day-name appt-day-spacer" />
                      )}

                      <div className="appt-day-controls">
                        <input
                          type="time"
                          value={iv.start_time}
                          onChange={e => handleUpdateIntervalTime(dIdx, iv.id, "start_time", e.target.value)}
                          className="appt-time-input"
                          title={`${dayItem.full} interval ${ivIdx + 1} start`}
                        />
                        <span className="appt-time-dash">–</span>
                        <input
                          type="time"
                          value={iv.end_time}
                          onChange={e => handleUpdateIntervalTime(dIdx, iv.id, "end_time", e.target.value)}
                          className="appt-time-input"
                          title={`${dayItem.full} interval ${ivIdx + 1} end`}
                        />

                        {/* Remove interval or Mark as unavailable */}
                        <button
                          type="button"
                          className="appt-day-action-icon"
                          onClick={() => handleRemoveInterval(dIdx, iv.id)}
                          title={dayItem.intervals.length > 1 ? "Remove this interval" : "Mark as unavailable"}
                        >
                          {dayItem.intervals.length > 1 ? <Trash2 size={15} /> : <Ban size={15} />}
                        </button>

                        {/* Add Multiple Intervals (+) Button */}
                        <button
                          type="button"
                          className="appt-day-action-icon"
                          onClick={() => handleAddInterval(dIdx, iv)}
                          title="Add interval within this day"
                        >
                          <Plus size={15} />
                        </button>

                        {/* Copy to All Days (Only shown on primary interval) */}
                        {ivIdx === 0 ? (
                          <button
                            type="button"
                            className="appt-day-action-icon"
                            onClick={() => handleCopyToAllDays(dIdx)}
                            title="Copy times to all days"
                          >
                            <Copy size={15} />
                          </button>
                        ) : (
                          <span className="appt-action-placeholder" />
                        )}
                      </div>
                    </div>
                  ))
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
              onClick={() => toast("Time zone locked to Asia/Kolkata (IST)", { icon: "🌐" })}
              title="Timezone details"
            >
              <Globe size={14} />
            </button>
          </div>
        </div>

        {/* Scheduling Window Accordion */}
        <div className="appt-form-section">
          <div className="appt-expandable-section">
            <button
              type="button"
              className="appt-expand-header w-full text-left"
              onClick={() => setIsSchedulingWindowOpen(!isSchedulingWindowOpen)}
            >
              <div className="flex items-center gap-2">
                <span className="appt-expand-title">Scheduling window</span>
              </div>
              {isSchedulingWindowOpen ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
            </button>
            <p className="appt-expand-desc">{advanceDays} days in advance to {noticeHours} hours before</p>

            {isSchedulingWindowOpen && (
              <div className="appt-accordion-content mt-3 p-3 bg-gray-50 dark:bg-zinc-800/60 rounded-lg flex flex-col gap-2.5">
                <div>
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Maximum days in advance</label>
                  <select
                    className="appt-select-input mt-1"
                    value={advanceDays}
                    onChange={e => setAdvanceDays(e.target.value)}
                  >
                    <option value="14">14 days in advance</option>
                    <option value="30">30 days in advance</option>
                    <option value="60">60 days in advance</option>
                    <option value="90">90 days in advance</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Minimum notice before booking</label>
                  <select
                    className="appt-select-input mt-1"
                    value={noticeHours}
                    onChange={e => setNoticeHours(e.target.value)}
                  >
                    <option value="1">1 hour before</option>
                    <option value="2">2 hours before</option>
                    <option value="4">4 hours before</option>
                    <option value="24">24 hours before</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Adjusted Availability Accordion */}
        <div className="appt-form-section">
          <div className="appt-expandable-section">
            <button
              type="button"
              className="appt-expand-header w-full text-left"
              onClick={() => setIsAdjustedAvailOpen(!isAdjustedAvailOpen)}
            >
              <div className="flex items-center gap-2">
                <span className="appt-expand-title">Adjusted availability</span>
              </div>
              {isAdjustedAvailOpen ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
            </button>
            <p className="appt-expand-desc">
              Indicate times on specific dates when you're available or unavailable
            </p>

            {isAdjustedAvailOpen && (
              <div className="appt-accordion-content mt-3 p-3 bg-gray-50 dark:bg-zinc-800/60 rounded-lg flex flex-col gap-2.5">
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={newOverrideDate}
                    onChange={e => setNewOverrideDate(e.target.value)}
                    className="appt-time-input flex-1"
                  />
                  <button
                    type="button"
                    className="px-3 py-1.5 text-xs font-semibold rounded bg-blue-600 text-white hover:bg-blue-700"
                    onClick={handleAddDateOverride}
                  >
                    Add Override
                  </button>
                </div>
                {dateOverrides.length > 0 && (
                  <div className="flex flex-col gap-1.5 mt-1">
                    {dateOverrides.map((ov, i) => (
                      <div key={i} className="flex items-center justify-between text-xs bg-white dark:bg-zinc-700/50 p-2 rounded border border-gray-200 dark:border-zinc-700">
                        <span>{ov.date} (Unavailable)</span>
                        <button
                          type="button"
                          className="text-red-500 hover:text-red-600"
                          onClick={() => setDateOverrides(prev => prev.filter((_, idx) => idx !== i))}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
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
          {isSaving ? "Saving..." : "Save Schedule"}
        </button>
      </div>

      {/* Tour Modal */}
      {showTourModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setShowTourModal(false)}>
          <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl max-w-md w-full p-6 shadow-2xl text-gray-900 dark:text-gray-100" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Sparkles size={20} className="text-blue-500" />
                <h3 className="font-bold text-lg">Appointment Schedule Tour</h3>
              </div>
              <button onClick={() => setShowTourModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                <X size={18} />
              </button>
            </div>
            <div className="flex flex-col gap-3 text-sm text-gray-600 dark:text-gray-300">
              <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-900/60">
                <strong className="text-blue-700 dark:text-blue-400 block mb-1">1. Multiple Intervals per Day</strong>
                Click the <Plus size={13} className="inline mx-1 text-blue-600" /> button on any day to add multiple working shifts (e.g. 09:00 - 13:00 and 14:00 - 18:00).
              </div>
              <div className="p-3 bg-purple-50 dark:bg-purple-950/40 rounded-xl border border-purple-200 dark:border-purple-900/60">
                <strong className="text-purple-700 dark:text-purple-400 block mb-1">2. One-Click Copy to All Days</strong>
                Click the <Copy size={13} className="inline mx-1 text-purple-600" /> icon to instantly duplicate your ideal daily shifts to the whole week.
              </div>
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-900/60">
                <strong className="text-emerald-700 dark:text-emerald-400 block mb-1">3. Real-Time Booking Link</strong>
                Share your personalized <code>/book/{adminId}</code> page with learners or clients to let them book appointments seamlessly.
              </div>
            </div>
            <button
              type="button"
              className="mt-6 w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-colors"
              onClick={() => setShowTourModal(false)}
            >
              Got it, let's configure!
            </button>
          </div>
        </div>
      )}

      {/* Feedback Modal */}
      {showFeedbackModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setShowFeedbackModal(false)}>
          <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl max-w-md w-full p-6 shadow-2xl text-gray-900 dark:text-gray-100" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg">Send Feedback</h3>
              <button onClick={() => setShowFeedbackModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                <X size={18} />
              </button>
            </div>
            <textarea
              className="w-full h-28 p-3 rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Tell us what you love or what could be better about the scheduler..."
              value={feedbackText}
              onChange={e => setFeedbackText(e.target.value)}
            />
            <div className="flex justify-end gap-2 mt-4">
              <button
                type="button"
                className="px-4 py-2 text-sm rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800"
                onClick={() => setShowFeedbackModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="px-4 py-2 text-sm font-semibold rounded-xl bg-blue-600 text-white hover:bg-blue-700"
                onClick={() => {
                  toast.success("Thank you for your valuable feedback!");
                  setShowFeedbackModal(false);
                  setFeedbackText("");
                }}
              >
                Submit Feedback
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
