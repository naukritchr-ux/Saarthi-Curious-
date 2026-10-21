import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { 
  Calendar as CalendarIcon, 
  Clock, 
  CheckCircle2, 
  User, 
  Video, 
  MapPin, 
  ArrowLeft, 
  Sparkles, 
  ChevronLeft, 
  ChevronRight,
  ShieldCheck,
  CalendarCheck
} from "lucide-react";
import { API_BASE } from "../../config/api";

const BACKEND_URL =
  import.meta.env.VITE_API_URL ||
  (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
    ? "http://127.0.0.1:8000"
    : API_BASE || "https://saarthi-curious-00e8.onrender.com");

const getLoggedInUserId = () => {
  const id = localStorage.getItem("user_id") || localStorage.getItem("id");
  return id ? Number(id) : 57;
};

const getLoggedInUserName = () => {
  return localStorage.getItem("full_name") || localStorage.getItem("user_name") || "Learner";
};

// Format 24h string "14:30" to "2:30 PM"
const format12Hour = (timeStr) => {
  if (!timeStr) return "";
  const [hStr, mStr] = timeStr.split(":");
  let h = parseInt(hStr, 10);
  const m = mStr || "00";
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${m} ${ampm}`;
};

export default function BookMeetingPage({ hostId: propHostId }) {
  const { hostId: routeHostId } = useParams();
  const navigate = useNavigate();
  const hostId = Number(routeHostId || propHostId || 2);

  const [hostInfo, setHostInfo] = useState(null);
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [title, setTitle] = useState("Discovery & Mentorship Session");
  const [notes, setNotes] = useState("");
  const [isBooking, setIsBooking] = useState(false);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [successData, setSuccessData] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  const loggedInUserId = getLoggedInUserId();
  const loggedInUserName = getLoggedInUserName();

  // Fetch Host Info
  useEffect(() => {
    const fetchHost = async () => {
      try {
        const token = localStorage.getItem("token") || localStorage.getItem("access_token");
        const res = await axios.get(`${BACKEND_URL}/users/${hostId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.data) {
          setHostInfo(res.data);
        }
      } catch {
        // Fallback info
        setHostInfo({
          full_name: `Mentor / Host #${hostId}`,
          email: `host_${hostId}@saarthi.com`,
          role_name: "Instructor & Team Leader",
        });
      }
    };
    fetchHost();
  }, [hostId]);

  // Fetch Available Slots when Date or Host changes
  useEffect(() => {
    const fetchSlots = async () => {
      setIsLoadingSlots(true);
      setErrorMessage("");
      setSelectedSlot(null);
      try {
        const res = await axios.get(
          `${BACKEND_URL}/bookings/available-slots/${hostId}?selected_date=${date}`
        );
        const freeSlots = res.data?.available_slots || [];
        setSlots(freeSlots);
      } catch (err) {
        console.error("Error fetching slots:", err);
        setSlots([]);
        setErrorMessage("Could not load dynamic availability slots for this date.");
      } finally {
        setIsLoadingSlots(false);
      }
    };
    fetchSlots();
  }, [date, hostId]);

  const handleBook = async () => {
    if (!selectedSlot) return;
    setIsBooking(true);
    setErrorMessage("");

    try {
      const payload = {
        admin_id: hostId,
        user_id: loggedInUserId,
        date: date,
        start_time: selectedSlot.start,
        end_time: selectedSlot.end,
        title: title || `Call between ${loggedInUserName} and ${hostInfo?.full_name || 'Host'}`,
        description: notes || "Call booked via Saarthi Calendly Scheduling Engine",
        add_meet: true,
      };

      const res = await axios.post(`${BACKEND_URL}/bookings/create-custom`, payload);
      setSuccessData({
        ...payload,
        booking: res.data?.booking || res.data,
        meetLink: res.data?.booking?.meeting_link || res.data?.meeting_link,
      });
    } catch (err) {
      console.error("Failed to book slot:", err);
      const msg = err.response?.data?.detail || "Failed to book slot. Please try another time.";
      setErrorMessage(typeof msg === "string" ? msg : JSON.stringify(msg));
    } finally {
      setIsBooking(false);
    }
  };

  // Formatted date string for display
  const formattedDateTitle = new Date(date + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  if (successData) {
    return (
      <div className="min-h-screen bg-[#0a0b0e] text-slate-100 flex items-center justify-center p-6 selection:bg-blue-600">
        <div className="w-full max-w-lg bg-[#14151b] border border-blue-500/20 rounded-3xl p-8 sm:p-10 shadow-2xl relative overflow-hidden text-center backdrop-blur-xl">
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-emerald-600/20 rounded-full blur-3xl pointer-events-none" />

          <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-emerald-500/20 to-emerald-400/10 border border-emerald-500/30 flex items-center justify-center mx-auto mb-6 text-emerald-400 shadow-lg shadow-emerald-950/40">
            <CheckCircle2 size={42} />
          </div>

          <h2 className="text-3xl font-extrabold text-white mb-2">Meeting Confirmed!</h2>
          <p className="text-slate-400 text-sm mb-6 leading-relaxed">
            Your appointment has been locked in and synchronized to both Google Calendars.
          </p>

          <div className="bg-[#1b1c24] border border-white/5 rounded-2xl p-5 mb-6 text-left space-y-3">
            <div className="flex items-center gap-3 text-slate-300">
              <CalendarIcon size={18} className="text-blue-400 shrink-0" />
              <span className="font-medium text-white">{formattedDateTitle}</span>
            </div>
            <div className="flex items-center gap-3 text-slate-300">
              <Clock size={18} className="text-indigo-400 shrink-0" />
              <span>
                {format12Hour(selectedSlot?.start)} – {format12Hour(selectedSlot?.end)} (30 mins)
              </span>
            </div>
            <div className="flex items-center gap-3 text-slate-300">
              <User size={18} className="text-purple-400 shrink-0" />
              <span>
                Host: <strong className="text-white">{hostInfo?.full_name || `User #${hostId}`}</strong>
              </span>
            </div>
            {successData.meetLink && (
              <div className="flex items-center gap-3 text-slate-300 pt-2 border-t border-white/5">
                <Video size={18} className="text-emerald-400 shrink-0" />
                <a
                  href={successData.meetLink}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-400 hover:text-blue-300 underline font-medium text-sm truncate"
                >
                  Join Google Meet Call
                </a>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => navigate("/calendar")}
              className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3.5 px-6 rounded-xl transition shadow-lg shadow-blue-900/30 flex items-center justify-center gap-2"
            >
              <CalendarCheck size={18} />
              Open My Calendar
            </button>
            <button
              onClick={() => {
                setSuccessData(null);
                setSelectedSlot(null);
              }}
              className="bg-white/5 hover:bg-white/10 text-slate-300 font-semibold py-3.5 px-6 rounded-xl transition border border-white/10"
            >
              Book Another
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0b0e] text-slate-200 p-4 sm:p-8 flex items-center justify-center selection:bg-blue-600">
      <div className="w-full max-w-4xl bg-[#14151b] border border-white/10 rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden backdrop-blur-xl">
        
        {/* Top Glow Highlights */}
        <div className="absolute top-0 left-1/3 w-96 h-32 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Back Link & Header */}
        <div className="flex items-center justify-between pb-6 mb-8 border-b border-white/10">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition px-3 py-1.5 rounded-lg hover:bg-white/5"
          >
            <ArrowLeft size={16} />
            Back
          </button>
          <div className="flex items-center gap-2 text-xs font-semibold px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400">
            <Sparkles size={12} />
            Smart Gap Scheduling Active
          </div>
        </div>

        {/* Host Profile Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 bg-[#1a1b24] p-5 rounded-2xl border border-white/5">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-xl font-bold text-white shadow-lg shadow-blue-900/40">
              {hostInfo?.full_name ? hostInfo.full_name[0].toUpperCase() : <User size={24} />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-white">
                  {hostInfo?.full_name || `Host #${hostId}`}
                </h1>
                <ShieldCheck size={18} className="text-blue-400" title="Verified Host" />
              </div>
              <p className="text-slate-400 text-sm">
                {hostInfo?.role_name || hostInfo?.email || "Saarthi Calendar Member"}
              </p>
            </div>
          </div>
          <div className="text-left sm:text-right text-xs text-slate-400">
            <div className="text-slate-300 font-medium">Slot Duration</div>
            <div className="text-blue-400 font-bold text-sm">30 Minutes</div>
          </div>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center gap-3">
            <span className="font-bold">Error:</span> {errorMessage}
          </div>
        )}

        {/* Two-Column Grid: Date Picker & Slots */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left: Date Selection & Details */}
          <div className="space-y-5">
            <div>
              <label className="text-sm font-semibold text-slate-300 mb-2 flex items-center gap-2">
                <CalendarIcon size={16} className="text-blue-400" />
                Select Date
              </label>
              <input
                type="date"
                value={date}
                min={new Date().toISOString().split("T")[0]}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-[#0a0b0e] border border-white/10 rounded-xl p-3.5 text-white outline-none focus:border-blue-500 transition shadow-inner font-mono text-sm"
              />
              <p className="text-xs text-slate-500 mt-1.5">{formattedDateTitle}</p>
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-300 mb-2 block">
                Meeting Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. 1-on-1 Catchup, LMS Review"
                className="w-full bg-[#0a0b0e] border border-white/10 rounded-xl p-3.5 text-white outline-none focus:border-blue-500 transition text-sm"
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-300 mb-2 block">
                Notes / Agenda (Optional)
              </label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Topics to discuss, background details..."
                className="w-full bg-[#0a0b0e] border border-white/10 rounded-xl p-3.5 text-white outline-none focus:border-blue-500 transition text-sm resize-none"
              />
            </div>
          </div>

          {/* Right: Available Gaps / Free Slots */}
          <div className="flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                <Clock size={16} className="text-blue-400" />
                Available Times ({slots.length})
              </label>
              <span className="text-xs text-slate-500">Only free gaps shown</span>
            </div>

            <div className="bg-[#0a0b0e] border border-white/10 rounded-2xl p-4 flex-1 flex flex-col justify-between min-h-[280px]">
              {isLoadingSlots ? (
                <div className="flex-1 flex flex-col items-center justify-center py-12 text-slate-400">
                  <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-3" />
                  <span className="text-sm">Calculating free gaps...</span>
                </div>
              ) : slots.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center py-12 text-center p-4">
                  <Clock size={36} className="text-slate-600 mb-3" />
                  <p className="text-slate-300 font-medium text-sm">No free slots on this day</p>
                  <p className="text-slate-500 text-xs mt-1 max-w-xs">
                    The host is fully booked or outside working hours. Please select another date.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-72 overflow-y-auto pr-1">
                  {slots.map((slot, idx) => {
                    const isSelected = selectedSlot?.start === slot.start;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSelectedSlot(slot)}
                        className={`py-2.5 px-3 rounded-xl text-xs font-semibold tracking-wide transition-all duration-150 flex items-center justify-center ${
                          isSelected
                            ? "bg-blue-600 text-white shadow-lg shadow-blue-700/40 ring-2 ring-blue-400"
                            : "bg-[#181922] text-slate-300 hover:bg-[#20222e] hover:text-white border border-white/5"
                        }`}
                      >
                        {format12Hour(slot.start)}
                      </button>
                    );
                  })}
                </div>
              )}

              {selectedSlot && (
                <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-slate-300">
                  <span>Selected Time:</span>
                  <span className="font-bold text-blue-400 text-sm">
                    {format12Hour(selectedSlot.start)} – {format12Hour(selectedSlot.end)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Confirm Button */}
        <div className="mt-8 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <Video size={14} className="text-blue-400" />
            Google Meet link will be automatically generated and shared.
          </div>

          <button
            onClick={handleBook}
            disabled={!selectedSlot || isBooking || isLoadingSlots}
            className="w-full sm:w-auto min-w-[200px] bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:hover:bg-blue-600 text-white font-bold py-3.5 px-8 rounded-xl transition shadow-xl shadow-blue-900/30 flex items-center justify-center gap-2 text-sm"
          >
            {isBooking ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Confirming...
              </>
            ) : (
              <>
                <CheckCircle2 size={18} />
                Confirm Meeting
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
