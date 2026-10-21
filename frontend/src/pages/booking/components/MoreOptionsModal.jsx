import React, { useState } from "react";
import { 
  X, 
  Video, 
  MapPin, 
  Bell, 
  Calendar as CalendarIcon, 
  AlignLeft, 
  Users, 
  HelpCircle, 
  ChevronDown, 
  Check, 
  Bold, 
  Italic, 
  Underline, 
  ListOrdered, 
  List, 
  Link as LinkIcon, 
  RemoveFormatting, 
  HardDrive
} from "lucide-react";
import toast from "react-hot-toast";

const COLOR_PALETTE = [
  { name: "Peacock Blue", value: "#039be5" },
  { name: "Lavender", value: "#7986cb" },
  { name: "Sage", value: "#33b679" },
  { name: "Grape", value: "#8e24aa" },
  { name: "Flamingo", value: "#e67c73" },
  { name: "Banana", value: "#f6bf26" },
  { name: "Tangerine", value: "#f4511e" },
  { name: "Graphite", value: "#616161" },
];

export default function MoreOptionsModal({
  initialData,
  userName = "Anuj Jadhav",
  onClose,
  onSave,
  isSaving = false,
}) {
  const [title, setTitle] = useState(initialData?.title || "");
  const [date, setDate] = useState(initialData?.date || new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(initialData?.date || new Date().toISOString().slice(0, 10));
  const [startTime, setStartTime] = useState(initialData?.start || "10:30");
  const [endTime, setEndTime] = useState(initialData?.end || "11:30");
  const [allDay, setAllDay] = useState(false);
  const [recurrence, setRecurrence] = useState("Does not repeat");
  const [activeTab, setActiveTab] = useState("details"); // 'details' | 'find_time'
  
  // Event Details Fields
  const [hasMeet, setHasMeet] = useState(true);
  const [location, setLocation] = useState(initialData?.location || "");
  const [notifications, setNotifications] = useState([
    { type: "Notification", count: 30, unit: "minutes" }
  ]);
  const [selectedColor, setSelectedColor] = useState(COLOR_PALETTE[0].value);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [busyState, setBusyState] = useState("Busy");
  const [visibility, setVisibility] = useState("Default visibility");
  const [description, setDescription] = useState(initialData?.description || "");

  // Guests & Permissions
  const [guests, setGuests] = useState(
    initialData?.guests 
      ? initialData.guests.split(",").map(g => g.trim()).filter(Boolean)
      : []
  );
  const [guestInput, setGuestInput] = useState("");
  const [permissions, setPermissions] = useState({
    modify: false,
    inviteOthers: true,
    seeGuestList: true,
  });

  const handleAddGuest = (e) => {
    if ((e.key === "Enter" || e.key === ",") && guestInput.trim()) {
      e.preventDefault();
      const newG = guestInput.replace(",", "").trim();
      if (!guests.includes(newG)) {
        setGuests([...guests, newG]);
      }
      setGuestInput("");
    }
  };

  const handleRemoveGuest = (idx) => {
    setGuests(guests.filter((_, i) => i !== idx));
  };

  const handleAddNotification = () => {
    setNotifications([...notifications, { type: "Notification", count: 10, unit: "minutes" }]);
  };

  const handleRemoveNotification = (idx) => {
    setNotifications(notifications.filter((_, i) => i !== idx));
  };

  const handleSaveClick = () => {
    if (!title.trim()) {
      toast.error("Please add a title for the event.");
      return;
    }
    onSave({
      title,
      date,
      start: startTime,
      end: endTime,
      allDay,
      recurrence,
      location,
      meetEnabled: hasMeet,
      color: selectedColor,
      busyState,
      visibility,
      description,
      guests: guests.join(", "),
      permissions,
    });
  };

  return (
    <div className="gcal-more-options-page" onClick={(e) => e.stopPropagation()}>
      {/* Top Navigation Bar */}
      <div className="more-options-top-bar">
        <div className="more-options-top-left">
          <button
            type="button"
            className="more-options-close-btn"
            onClick={onClose}
            title="Close"
          >
            <X size={20} />
          </button>
          <div className="more-options-title-wrap">
            <input
              type="text"
              placeholder="Add title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="more-options-title-input"
              autoFocus
            />
          </div>
        </div>

        <div className="more-options-top-right">
          <button
            type="button"
            className="more-options-save-pill"
            onClick={handleSaveClick}
            disabled={isSaving}
          >
            {isSaving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      {/* Date & Time Row */}
      <div className="more-options-datetime-row">
        <div className="more-options-datetime-pills">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="more-options-date-pill"
          />
          {!allDay && (
            <>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="more-options-time-pill"
              />
              <span className="more-options-to-text">to</span>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="more-options-time-pill"
              />
            </>
          )}
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="more-options-date-pill"
          />
          <button
            type="button"
            className="more-options-tz-btn"
            onClick={() => toast("Time zone: Asia/Kolkata (GMT+05:30)", { icon: "🌐" })}
          >
            Time zone
          </button>
        </div>

        <div className="more-options-repeat-toggles">
          <label className="more-options-checkbox-label">
            <input
              type="checkbox"
              checked={allDay}
              onChange={(e) => setAllDay(e.target.checked)}
              className="more-options-checkbox"
            />
            <span>All day</span>
          </label>

          <div className="more-options-select-wrapper">
            <select
              value={recurrence}
              onChange={(e) => setRecurrence(e.target.value)}
              className="more-options-select-pill"
            >
              <option value="Does not repeat">Does not repeat</option>
              <option value="Daily">Daily</option>
              <option value="Weekly">Weekly on this day</option>
              <option value="Monthly">Monthly</option>
              <option value="Custom">Custom...</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabs Row: Event details | Find a time */}
      <div className="more-options-tabs-row">
        <button
          type="button"
          className={`more-options-tab-btn ${activeTab === "details" ? "active" : ""}`}
          onClick={() => setActiveTab("details")}
        >
          Event details
        </button>
        <button
          type="button"
          className={`more-options-tab-btn ${activeTab === "find_time" ? "active" : ""}`}
          onClick={() => setActiveTab("find_time")}
        >
          Find a time
        </button>
      </div>

      {/* Main Two-Column Layout */}
      {activeTab === "details" ? (
        <div className="more-options-content-grid">
          {/* Left Column: Conferencing, Location, Notification, Description */}
          <div className="more-options-col-left">
            {/* Google Meet Conferencing */}
            <div className="more-options-row">
              <div className="more-options-icon-col text-amber-500">
                <Video size={18} />
              </div>
              <div className="more-options-row-body">
                {hasMeet ? (
                  <div className="more-options-meet-pill">
                    <span className="meet-pill-text">Google Meet video conferencing added</span>
                    <button
                      type="button"
                      className="meet-pill-remove"
                      onClick={() => setHasMeet(false)}
                      title="Remove Google Meet"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="more-options-add-meet-btn"
                    onClick={() => setHasMeet(true)}
                  >
                    Add Google Meet video conferencing
                  </button>
                )}
              </div>
            </div>

            {/* Location */}
            <div className="more-options-row">
              <div className="more-options-icon-col">
                <MapPin size={18} />
              </div>
              <div className="more-options-row-body">
                <input
                  type="text"
                  placeholder="Add location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="more-options-text-input"
                />
              </div>
            </div>

            {/* Notifications */}
            <div className="more-options-row">
              <div className="more-options-icon-col">
                <Bell size={18} />
              </div>
              <div className="more-options-row-body space-y-2">
                {notifications.map((notif, idx) => (
                  <div key={idx} className="more-options-notif-line">
                    <select
                      value={notif.type}
                      onChange={(e) => {
                        const copy = [...notifications];
                        copy[idx].type = e.target.value;
                        setNotifications(copy);
                      }}
                      className="more-options-select-sm"
                    >
                      <option value="Notification">Notification</option>
                      <option value="Email">Email</option>
                    </select>
                    <input
                      type="number"
                      value={notif.count}
                      onChange={(e) => {
                        const copy = [...notifications];
                        copy[idx].count = e.target.value;
                        setNotifications(copy);
                      }}
                      className="more-options-num-sm"
                    />
                    <select
                      value={notif.unit}
                      onChange={(e) => {
                        const copy = [...notifications];
                        copy[idx].unit = e.target.value;
                        setNotifications(copy);
                      }}
                      className="more-options-select-sm"
                    >
                      <option value="minutes">minutes</option>
                      <option value="hours">hours</option>
                      <option value="days">days</option>
                    </select>
                    <button
                      type="button"
                      className="notif-remove-btn"
                      onClick={() => handleRemoveNotification(idx)}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  className="more-options-link-action"
                  onClick={handleAddNotification}
                >
                  Add notification
                </button>
              </div>
            </div>

            {/* Calendar Owner & Color Picker */}
            <div className="more-options-row">
              <div className="more-options-icon-col">
                <CalendarIcon size={18} />
              </div>
              <div className="more-options-row-body flex items-center gap-4">
                <span className="font-medium text-sm">{userName}</span>
                <div className="relative">
                  <button
                    type="button"
                    className="w-5 h-5 rounded-full border border-white/20 transition transform hover:scale-110"
                    style={{ backgroundColor: selectedColor }}
                    onClick={() => setShowColorPicker(!showColorPicker)}
                    title="Select color"
                  />
                  {showColorPicker && (
                    <div className="more-options-color-popover">
                      {COLOR_PALETTE.map((c) => (
                        <button
                          key={c.value}
                          type="button"
                          className="w-6 h-6 rounded-full border border-white/10 flex items-center justify-center transition hover:scale-110"
                          style={{ backgroundColor: c.value }}
                          onClick={() => {
                            setSelectedColor(c.value);
                            setShowColorPicker(false);
                          }}
                          title={c.name}
                        >
                          {selectedColor === c.value && <Check size={12} className="text-white" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Busy / Visibility Status */}
            <div className="more-options-row">
              <div className="more-options-icon-col" />
              <div className="more-options-row-body flex items-center gap-3">
                <select
                  value={busyState}
                  onChange={(e) => setBusyState(e.target.value)}
                  className="more-options-select-pill"
                >
                  <option value="Busy">Busy</option>
                  <option value="Free">Free</option>
                </select>
                <select
                  value={visibility}
                  onChange={(e) => setVisibility(e.target.value)}
                  className="more-options-select-pill"
                >
                  <option value="Default visibility">Default visibility</option>
                  <option value="Public">Public</option>
                  <option value="Private">Private</option>
                </select>
                <HelpCircle size={16} className="text-gray-400 cursor-pointer" title="Visibility info" />
              </div>
            </div>

            {/* Rich Description Box with Formatting Toolbar */}
            <div className="more-options-row">
              <div className="more-options-icon-col">
                <AlignLeft size={18} />
              </div>
              <div className="more-options-row-body">
                <div className="more-options-rich-editor">
                  {/* Formatting Toolbar */}
                  <div className="rich-editor-toolbar">
                    <button
                      type="button"
                      className="toolbar-icon-btn"
                      title="Google Drive attachment"
                      onClick={() => toast("Drive attachment connected", { icon: "📁" })}
                    >
                      <HardDrive size={15} />
                    </button>
                    <div className="toolbar-divider" />
                    <button
                      type="button"
                      className="toolbar-icon-btn"
                      title="Bold"
                      onClick={() => setDescription((prev) => prev + "**bold**")}
                    >
                      <Bold size={15} />
                    </button>
                    <button
                      type="button"
                      className="toolbar-icon-btn"
                      title="Italic"
                      onClick={() => setDescription((prev) => prev + "*italic*")}
                    >
                      <Italic size={15} />
                    </button>
                    <button
                      type="button"
                      className="toolbar-icon-btn"
                      title="Underline"
                      onClick={() => setDescription((prev) => prev + "<u>text</u>")}
                    >
                      <Underline size={15} />
                    </button>
                    <div className="toolbar-divider" />
                    <button
                      type="button"
                      className="toolbar-icon-btn"
                      title="Numbered list"
                      onClick={() => setDescription((prev) => prev + "\n1. ")}
                    >
                      <ListOrdered size={15} />
                    </button>
                    <button
                      type="button"
                      className="toolbar-icon-btn"
                      title="Bullet list"
                      onClick={() => setDescription((prev) => prev + "\n• ")}
                    >
                      <List size={15} />
                    </button>
                    <button
                      type="button"
                      className="toolbar-icon-btn"
                      title="Add link"
                      onClick={() => setDescription((prev) => prev + "[link](url)")}
                    >
                      <LinkIcon size={15} />
                    </button>
                    <button
                      type="button"
                      className="toolbar-icon-btn"
                      title="Clear formatting"
                      onClick={() => setDescription("")}
                    >
                      <RemoveFormatting size={15} />
                    </button>
                  </div>

                  {/* Textarea */}
                  <textarea
                    rows={6}
                    placeholder="Add description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="rich-editor-textarea"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Guests & Permissions */}
          <div className="more-options-col-right">
            <div className="guests-section-heading">Guests</div>
            <div className="guests-input-wrapper">
              <input
                type="text"
                placeholder="Add guests"
                value={guestInput}
                onChange={(e) => setGuestInput(e.target.value)}
                onKeyDown={handleAddGuest}
                className="guests-search-input"
              />
            </div>

            {/* Guests Chips List */}
            {guests.length > 0 && (
              <div className="guests-chips-list">
                {guests.map((g, idx) => (
                  <div key={idx} className="guest-chip-row">
                    <div className="guest-avatar-small">
                      {g[0]?.toUpperCase() || "G"}
                    </div>
                    <span className="guest-chip-name">{g}</span>
                    <button
                      type="button"
                      className="guest-chip-remove"
                      onClick={() => handleRemoveGuest(idx)}
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Guest Permissions Section */}
            <div className="guest-permissions-box">
              <div className="guest-permissions-title">Guest permissions</div>
              <label className="permission-checkbox-row">
                <input
                  type="checkbox"
                  checked={permissions.modify}
                  onChange={(e) =>
                    setPermissions({ ...permissions, modify: e.target.checked })
                  }
                  className="more-options-checkbox"
                />
                <span>Modify event</span>
              </label>

              <label className="permission-checkbox-row">
                <input
                  type="checkbox"
                  checked={permissions.inviteOthers}
                  onChange={(e) =>
                    setPermissions({ ...permissions, inviteOthers: e.target.checked })
                  }
                  className="more-options-checkbox"
                />
                <span>Invite others</span>
              </label>

              <label className="permission-checkbox-row">
                <input
                  type="checkbox"
                  checked={permissions.seeGuestList}
                  onChange={(e) =>
                    setPermissions({ ...permissions, seeGuestList: e.target.checked })
                  }
                  className="more-options-checkbox"
                />
                <span>See guest list</span>
              </label>
            </div>
          </div>
        </div>
      ) : (
        /* Find a Time Tab */
        <div className="find-time-panel p-8 text-center text-slate-400">
          <Clock size={40} className="mx-auto mb-3 text-blue-500" />
          <h4 className="text-base font-bold text-slate-200">Suggested Free Times</h4>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Comparing guest calendars and finding non-overlapping free gaps.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {["10:00 AM – 10:30 AM", "11:30 AM – 12:00 PM", "2:00 PM – 2:30 PM", "4:30 PM – 5:00 PM"].map((t, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  toast.success(`Selected ${t}`);
                  setActiveTab("details");
                }}
                className="py-2.5 px-4 rounded-xl bg-blue-600/10 border border-blue-500/20 text-blue-400 font-semibold text-xs hover:bg-blue-600 hover:text-white transition"
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
