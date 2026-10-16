// pages/booking/bookingUtils.js

export const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export const WEEKDAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export const WEEKDAYS_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export const toISODate = (d) => {
  const date = d instanceof Date ? d : new Date(d);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const toMonthKey = (d) => {
  const date = d instanceof Date ? d : new Date(d);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
};

export const startOfMonth = (d) => {
  const date = new Date(d);
  date.setDate(1);
  date.setHours(0, 0, 0, 0);
  return date;
};

export const addMonths = (d, delta) => {
  const date = new Date(d);
  date.setDate(1);
  date.setMonth(date.getMonth() + delta);
  return date;
};

export const monthDiff = (from, to) => {
  return (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth());
};

export const buildMonthGrid = (cursor) => {
  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  // Monday is index 0, Sunday is index 6
  const startDayOfWeek = (firstDay.getDay() + 6) % 7;
  const startDate = new Date(year, month, 1 - startDayOfWeek);

  const weeks = [];
  let current = new Date(startDate);

  while (true) {
    const week = [];
    for (let i = 0; i < 7; i++) {
      const iso = toISODate(current);
      const dayOfWeek = current.getDay();
      week.push({
        day: current.getDate(),
        iso,
        inMonth: current.getMonth() === month,
        weekend: dayOfWeek === 0 || dayOfWeek === 6,
      });
      current.setDate(current.getDate() + 1);
    }
    weeks.push(week);
    if (current > lastDay) {
      break;
    }
  }

  return weeks;
};

export const isPastSlot = (slot) => {
  if (!slot || !slot.date || !slot.start) return false;
  const [h, m] = slot.start.split(":").map(Number);
  const slotTime = new Date(`${slot.date}T00:00:00`);
  slotTime.setHours(h || 0, m || 0, 0, 0);
  return slotTime < new Date();
};

export const summariseDay = (slots = []) => {
  let open = 0;
  let taken = 0;
  for (const s of slots) {
    if (s.status === "available" && !isPastSlot(s)) {
      open++;
    } else if (s.status === "booked" || s.booking || s.status === "taken") {
      taken++;
    }
  }
  return {
    open,
    taken,
    total: slots.length,
  };
};

export const formatLongDate = (iso) => {
  if (!iso) return "";
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

export const formatTime = (timeStr) => {
  if (!timeStr) return "";
  const [hStr, mStr] = timeStr.split(":");
  let hours = parseInt(hStr, 10);
  const minutes = mStr ? mStr.slice(0, 2).padStart(2, "0") : "00";
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  hours = hours ? hours : 12;
  return `${hours}:${minutes} ${ampm}`;
};

export const getSessionUserId = () => {
  const raw = localStorage.getItem("user_id") || localStorage.getItem("userId");
  if (raw) return Number(raw);
  try {
    const u = JSON.parse(localStorage.getItem("user") || "{}");
    return u?.user_id || u?.id || null;
  } catch {}
  return null;
};
