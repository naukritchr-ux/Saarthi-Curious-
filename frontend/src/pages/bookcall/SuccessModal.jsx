import { CheckCircle, Video, X } from "lucide-react";

const SuccessModal = ({ booking, onClose }) => {
  if (!booking) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden animate-slideDown">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5DDF0] bg-[#F8F7FC]">
          <h2 className="text-lg font-semibold text-[#1E1B4B]">
            Call Booked Successfully
          </h2>
          <button 
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-[#F3EFFF] transition-colors duration-200"
          >
            <X size={20} className="text-[#7C6A9A]" />
          </button>
        </div>

        {/* Success Icon */}
        <div className="flex justify-center pt-8">
          <div className="w-16 h-16 rounded-full bg-[#10B981]/10 flex items-center justify-center">
            <CheckCircle size={36} className="text-[#10B981]" />
          </div>
        </div>

        {/* Message */}
        <div className="px-6 pt-5 text-center">
          <h3 className="text-xl font-bold text-[#1E1B4B]">
            Your call is booked!
          </h3>
          <p className="mt-2 text-sm text-[#7C6A9A]">
            Your meeting with the admin has been successfully scheduled.
          </p>
        </div>

        {/* Booking Details */}
        <div className="mx-6 mt-6 rounded-xl bg-[#F8F7FC] border border-[#E5DDF0] p-4 space-y-3">
          {booking.date && (
            <div className="flex justify-between text-sm">
              <span className="text-[#7C6A9A]">Date</span>
              <span className="font-medium text-[#1E1B4B]">{booking.date}</span>
            </div>
          )}
          {booking.start_time && (
            <div className="flex justify-between text-sm">
              <span className="text-[#7C6A9A]">Time</span>
              <span className="font-medium text-[#1E1B4B]">
                {booking.start_time}
                {booking.end_time && ` - ${booking.end_time}`}
              </span>
            </div>
          )}
          {booking.duration && (
            <div className="flex justify-between text-sm">
              <span className="text-[#7C6A9A]">Duration</span>
              <span className="font-medium text-[#1E1B4B]">
                {booking.duration}
              </span>
            </div>
          )}

          {booking.meeting_link && (
            <div className="pt-3 border-t border-[#E5DDF0]">
              <a
                href={booking.meeting_link}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 rounded-lg bg-[#5B21B6] px-4 py-3 text-sm font-semibold text-white hover:bg-[#4C1D95] hover:shadow-lg transition-all duration-200"
              >
                <Video size={18} />
                Join Google Meet
              </a>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-5">
          <button
            onClick={onClose}
            className="w-full rounded-lg border border-[#E5DDF0] px-4 py-2.5 text-sm font-medium text-[#7C6A9A] hover:bg-[#F8F7FC] transition-colors duration-200"
          >
            Close
          </button>
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

export default SuccessModal;
