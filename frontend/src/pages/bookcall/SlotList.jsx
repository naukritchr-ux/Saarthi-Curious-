import { Clock, CheckCircle, XCircle, CalendarDays } from "lucide-react";

const SlotList = ({ selectedDate, slots, onBookSlot }) => {
  if (!selectedDate) {
    return (
      <div className="bg-white rounded-2xl border border-[#E5DDF0] shadow-sm p-8 flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-14 h-14 rounded-full bg-[#F3EFFF] flex items-center justify-center mb-4">
          <CalendarDays className="text-[#5B21B6]" size={26} />
        </div>
        <h3 className="text-lg font-semibold text-[#1E1B4B]">Select a date</h3>
        <p className="text-sm text-[#7C6A9A] mt-2 text-center max-w-xs">
          Choose a weekday from the calendar to see available slots.
        </p>
      </div>
    );
  }

  const formattedDate = selectedDate.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const availableSlots = slots.filter((slot) => slot.status === "available");
  const bookedSlots = slots.filter((slot) => slot.status === "booked");

  return (
    <div className="bg-white rounded-2xl border border-[#E5DDF0] shadow-sm p-5">
      <div className="mb-5">
        <p className="text-xs uppercase tracking-wider text-[#7C6A9A]">
          Selected Date
        </p>
        <h2 className="text-lg font-semibold text-[#1E1B4B] mt-0.5">
          {formattedDate}
        </h2>
      </div>

      {slots.length === 0 ? (
        <div className="py-12 flex flex-col items-center justify-center">
          <XCircle size={32} className="text-[#7C6A9A] mb-3" />
          <p className="text-base font-medium text-[#1E1B4B]">
            No available slots
          </p>
          <p className="text-sm text-[#7C6A9A] mt-1">
            There are currently no slots available for this date.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {slots.map((slot) => (
            <div
              key={slot.id}
              className={`
                border rounded-xl p-4 flex items-center
                justify-between transition-colors duration-200
                ${
                  slot.status === "available"
                    ? "border-[#E5DDF0] hover:border-[#5B21B6] hover:bg-[#FAF8FF]"
                    : "border-[#F0ECF5] bg-[#F8F7FC] opacity-70"
                }
              `}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`
                  w-10 h-10 rounded-lg flex items-center justify-center
                  ${
                    slot.status === "available"
                      ? "bg-[#F3EFFF] text-[#5B21B6]"
                      : "bg-[#EDE8F5] text-[#B8A7D6]"
                  }
                `}
                >
                  <Clock size={19} />
                </div>
                <div>
                  <p className="font-semibold text-[#1E1B4B]">{slot.time}</p>
                  <p className="text-xs text-[#7C6A9A]">15 minutes</p>
                </div>
              </div>

              {slot.status === "available" ? (
                <button
                  onClick={() => onBookSlot(slot)}
                  className="px-4 py-2 rounded-lg bg-[#5B21B6] text-white text-sm font-medium hover:bg-[#4C1D95] hover:shadow-lg transition-all duration-200"
                >
                  Book
                </button>
              ) : (
                <div className="flex items-center gap-2 text-[#7C6A9A] text-sm">
                  <XCircle size={17} />
                  <span>Booked</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Daily status */}
      {slots.length > 0 && (
        <div className="mt-5 pt-4 border-t border-[#E5DDF0]">
          {bookedSlots.length === slots.length ? (
            <div className="flex items-center gap-2 text-sm text-[#7C6A9A]">
              <XCircle size={18} />
              <span>All {slots.length} slots are booked for this day.</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm text-[#5B21B6]">
              <CheckCircle size={18} />
              <span>
                {availableSlots.length} slot
                {availableSlots.length !== 1 ? "s" : ""} available
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SlotList;
 