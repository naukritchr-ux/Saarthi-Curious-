import { ChevronLeft, ChevronRight } from "lucide-react";

const Calendar = ({
  currentDate,
  selectedDate,
  onDateSelect,
  onPreviousMonth,
  onNextMonth,
}) => {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDay = (firstDay.getDay() + 6) % 7; // Monday = 0, Sunday = 6
  const monthName = currentDate.toLocaleString("default", { month: "long" });
  const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const days = [];
  for (let i = 0; i < startingDay; i++) {
    days.push(null);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    days.push(day);
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const isPastDate = (day) => {
    const date = new Date(year, month, day);
    date.setHours(0, 0, 0, 0);
    return date < today;
  };

  const isToday = (day) => {
    const date = new Date(year, month, day);
    date.setHours(0, 0, 0, 0);
    return date.getTime() === today.getTime();
  };

  // Fix: Check if the day is Saturday (6) or Sunday (0)
  const isWeekend = (day) => {
    const date = new Date(year, month, day);
    const dayOfWeek = date.getDay();
    return dayOfWeek === 0 || dayOfWeek === 6; // Sunday or Saturday
  };

  const isSelected = (day) => {
    if (!selectedDate) return false;
    return (
      selectedDate.getFullYear() === year &&
      selectedDate.getMonth() === month &&
      selectedDate.getDate() === day
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-[#E5DDF0] shadow-sm p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onPreviousMonth}
          className="w-9 h-9 rounded-lg border border-[#E5DDF0] hover:border-[#5B21B6] hover:bg-[#F3EFFF] flex items-center justify-center transition-colors duration-200"
        >
          <ChevronLeft size={20} className="text-[#1E1B4B]" />
        </button>
        <h2 className="text-xl font-semibold text-[#1E1B4B]">
          {monthName} {year}
        </h2>
        <button
          onClick={onNextMonth}
          className="w-9 h-9 rounded-lg border border-[#E5DDF0] hover:border-[#5B21B6] hover:bg-[#F3EFFF] flex items-center justify-center transition-colors duration-200"
        >
          <ChevronRight size={20} className="text-[#1E1B4B]" />
        </button>
      </div>

      {/* Week Names */}
      <div className="grid grid-cols-7 mb-3">
        {weekdays.map((weekday) => (
          <div
            key={weekday}
            className="text-center text-xs font-medium text-[#7C6A9A]"
          >
            {weekday}
          </div>
        ))}
      </div>

      {/* Dates */}
      <div className="grid grid-cols-7 gap-2">
        {days.map((day, index) => {
          if (day === null) {
            return <div key={`empty-${index}`}></div>;
          }

          const disabled = isPastDate(day) || isWeekend(day);
          const selected = isSelected(day);
          const todayDate = isToday(day);

          return (
            <button
              key={`day-${day}-${month}-${year}`}
              disabled={disabled}
              onClick={() => onDateSelect(new Date(year, month, day))}
              className={`
                aspect-square rounded-xl
                flex items-center justify-center
                transition-all duration-200 font-medium
                relative
                ${
                  selected
                    ? "bg-[#5B21B6] text-white shadow-lg shadow-[#5B21B6]/30"
                    : disabled
                      ? "bg-[#F8F7FC] text-[#C4B5D4] cursor-not-allowed opacity-60"
                      : "hover:bg-[#F3EFFF] text-[#1E1B4B] hover:scale-105"
                }
              `}
            >
              {day}
              {todayDate && !selected && !disabled && (
                <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#5B21B6]" />
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex gap-5 mt-6 border-t border-[#E5DDF0] pt-4">
        <div className="flex items-center gap-2 text-xs text-[#7C6A9A]">
          <span className="w-3 h-3 rounded-full bg-[#5B21B6]"></span>
          Selected
        </div>
        <div className="flex items-center gap-2 text-xs text-[#7C6A9A]">
          <span className="w-3 h-3 rounded-full bg-[#F8F7FC] border border-[#E5DDF0]"></span>
          Unavailable
        </div> 
      </div>
    </div>
  );
};

export default Calendar;
