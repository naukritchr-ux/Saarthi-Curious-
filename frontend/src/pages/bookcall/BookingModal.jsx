import { X, CalendarDays, Clock, Info } from "lucide-react";

const BookingModal = ({ selectedDate, selectedSlot, onClose, onConfirm }) => {
  if (!selectedSlot || !selectedDate) {
    return null;
  }

  const formattedDate = selectedDate.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }); 

  // Parse the time slot (assuming format like "10:00 AM - 10:15 AM")
  const timeParts = selectedSlot.time.split(" - ");
  const startTime = timeParts[0] || selectedSlot.time;
  const endTime = timeParts[1] || "";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden animate-slideDown">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5DDF0] bg-[#F8F7FC]">
          <div>
            <h2 className="text-lg font-semibold text-[#1E1B4B]">
              Book Your Call
            </h2>
            <p className="text-sm text-[#7C6A9A] mt-1">
              Confirm your appointment with the admin
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-[#F3EFFF] transition-colors duration-200"
          >
            <X size={20} className="text-[#7C6A9A]" />
          </button>
        </div>

        {/* Booking Details */}
        <div className="p-6">
          <div className="rounded-xl bg-[#F8F7FC] border border-[#E5DDF0] p-4 space-y-4">
            {/* Date */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#F3EFFF] flex items-center justify-center">
                <CalendarDays size={20} className="text-[#5B21B6]" />
              </div>
              <div>
                <p className="text-xs text-[#7C6A9A]">Date</p>
                <p className="text-sm font-semibold text-[#1E1B4B]">
                  {formattedDate}
                </p>
              </div>
            </div>

            {/* Time */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#F3EFFF] flex items-center justify-center">
                <Clock size={20} className="text-[#5B21B6]" />
              </div>
              <div>
                <p className="text-xs text-[#7C6A9A]">Time</p>
                <p className="text-sm font-semibold text-[#1E1B4B]">
                  {startTime} {endTime ? `- ${endTime}` : ''}
                </p>
              </div>
            </div>

            {/* Duration */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#F3EFFF] flex items-center justify-center">
                <Clock size={20} className="text-[#5B21B6]" />
              </div>
              <div>
                <p className="text-xs text-[#7C6A9A]">Duration</p>
                <p className="text-sm font-semibold text-[#1E1B4B]">
                  15 minutes
                </p>
              </div>
            </div>
          </div>

          {/* Information */}
          <div className="mt-5 rounded-lg bg-[#F3EFFF] border border-[#E5DDF0] p-3 flex items-start gap-3">
            <Info size={18} className="text-[#5B21B6] flex-shrink-0 mt-0.5" />
            <p className="text-sm text-[#4C1D95]">
              The call will be conducted through Google Meet. A meeting link
              will be provided after the booking is confirmed.
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 mt-6">
            <button
              onClick={onClose}
              className="flex-1 rounded-lg border border-[#E5DDF0] px-4 py-3 text-sm font-medium text-[#7C6A9A] hover:bg-[#F8F7FC] transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              onClick={() => onConfirm(selectedSlot)}
              className="flex-1 rounded-lg bg-[#5B21B6] px-4 py-3 text-sm font-semibold text-white hover:bg-[#4C1D95] hover:shadow-lg transition-all duration-200"
            >
              Confirm Booking
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px) scale(0.96);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .animate-slideDown {
          animation: slideDown 0.2s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
      `}</style>
    </div>
  );
};

export default BookingModal;
