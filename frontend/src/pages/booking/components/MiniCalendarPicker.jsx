import React, { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function MiniCalendarPicker({ selectedDate, onSelectDate, onClose }) {
  // Parse initial date "YYYY-MM-DD"
  const initialDate = selectedDate ? new Date(selectedDate + "T00:00:00") : new Date();
  const [viewYear, setViewYear] = useState(initialDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(initialDate.getMonth()); // 0-11

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const handlePrevMonth = (e) => {
    e.stopPropagation();
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(prev => prev - 1);
    } else {
      setViewMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = (e) => {
    e.stopPropagation();
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(prev => prev + 1);
    } else {
      setViewMonth(prev => prev + 1);
    }
  };

  // Compute days in month
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

  const handleDayClick = (day, isCurrentMonth, e) => {
    e.stopPropagation();
    if (!isCurrentMonth) return;
    const mStr = String(viewMonth + 1).padStart(2, "0");
    const dStr = String(day).padStart(2, "0");
    const formatted = `${viewYear}-${mStr}-${dStr}`;
    onSelectDate(formatted);
    onClose?.();
  };

  const isSelected = (day) => {
    if (!selectedDate) return false;
    const [y, m, d] = selectedDate.split("-").map(Number);
    return y === viewYear && m === viewMonth + 1 && d === day;
  };

  const isToday = (day) => {
    const today = new Date();
    return (
      today.getFullYear() === viewYear &&
      today.getMonth() === viewMonth &&
      today.getDate() === day
    );
  };

  return (
    <div 
      className="gcal-mini-picker-card"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Month & Nav Controls */}
      <div className="mini-picker-header">
        <span className="mini-picker-title">
          {monthNames[viewMonth]} {viewYear}
        </span>
        <div className="mini-picker-nav-arrows">
          <button 
            type="button" 
            className="mini-picker-arrow-btn"
            onClick={handlePrevMonth}
            title="Previous month"
          >
            <ChevronLeft size={16} />
          </button>
          <button 
            type="button" 
            className="mini-picker-arrow-btn"
            onClick={handleNextMonth}
            title="Next month"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Weekday Labels (S M T W T F S) */}
      <div className="mini-picker-days-header">
        <span>S</span>
        <span>M</span>
        <span>T</span>
        <span>W</span>
        <span>T</span>
        <span>F</span>
        <span>S</span>
      </div>

      {/* Calendar Grid */}
      <div className="mini-picker-grid">
        {/* Previous Month Trail Days */}
        {Array.from({ length: firstDayOfWeek }).map((_, idx) => {
          const prevDay = daysInPrevMonth - firstDayOfWeek + idx + 1;
          return (
            <div key={`prev-${idx}`} className="mini-picker-day-cell dim">
              <span>{prevDay}</span>
            </div>
          );
        })}

        {/* Current Month Days */}
        {Array.from({ length: daysInMonth }).map((_, idx) => {
          const day = idx + 1;
          const selected = isSelected(day);
          const today = isToday(day);
          return (
            <button
              key={`curr-${day}`}
              type="button"
              onClick={(e) => handleDayClick(day, true, e)}
              className={`mini-picker-day-cell current ${selected ? "selected" : ""} ${today ? "today" : ""}`}
            >
              <span>{day}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
