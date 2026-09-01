import { useEffect, useState } from "react";
import Calendar from "./Calendar";
import SlotList from "./SlotList";
import BookingModal from "./BookingModal";
import SuccessModal from "./SuccessModal";
import MainLayout from "../../layout/mainLayout";
import { getAvailableSlots, bookSlot, generateScheduleForMonth } from "../../services/bookingApi";

const BookCall = () => { 
  const ADMIN_ID = 2;
  const userId = parseInt(localStorage.getItem("user_id"));

  const today = new Date();
  const [currentDate, setCurrentDate] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1),
  );
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [bookingData, setBookingData] = useState(null);
  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [bookingError, setBookingError] = useState("");

  const handleDateSelect = async (date) => {
    setSelectedDate(date);
    setLoadingSlots(true);
    setBookingError("");

    try {
      let data = await getAvailableSlots(date, ADMIN_ID);
      
      // If no slots available, try to generate them
      if (data.length === 0) {
        try {
          await generateScheduleForMonth(date, ADMIN_ID, 1);
          // Retry fetching slots after generation
          data = await getAvailableSlots(date, ADMIN_ID);
        } catch (genError) {
          console.error("Error generating slots:", genError);
          setBookingError("Unable to generate booking slots for this date.");
        }
      }
      
      setSlots(data);
    } catch (error) {
      console.error("Error loading slots:", error);
      setSlots([]);
      setBookingError("Unable to load booking slots.");
    } finally {
      setLoadingSlots(false);
    }
  };

  const handlePreviousMonth = () => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    setCurrentDate(newDate);
    setSelectedDate(null);
    setSlots([]);
    
    // Pre-generate schedules for the new month in background
    generateScheduleForMonth(newDate, ADMIN_ID, 1).catch(err => {
      console.error("Error pre-generating schedules:", err);
    });
  };

  const handleNextMonth = () => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
    setCurrentDate(newDate);
    setSelectedDate(null);
    setSlots([]);
    
    // Pre-generate schedules for the new month in background
    generateScheduleForMonth(newDate, ADMIN_ID, 1).catch(err => {
      console.error("Error pre-generating schedules:", err);
    });
  };

  const handleBookSlot = (slot) => {
    setSelectedSlot(slot);
    setShowBookingModal(true);
  };

  const handleConfirmBooking = async () => {
    if (!selectedSlot) return;
    if (!userId) {
      setBookingError("User session not found. Please login again.");
      return;
    }

    try {
      setBookingError("");
      const response = await bookSlot({
        schedule_id: selectedSlot.id,
        user_id: userId,
      });

      setSlots((previousSlots) =>
        previousSlots.map((slot) =>
          slot.id === selectedSlot.id ? { ...slot, status: "booked" } : slot,
        ),
      );

      setShowBookingModal(false);

      setBookingData({
        date: selectedSlot.date,
        start_time: selectedSlot.start_time,
        end_time: selectedSlot.end_time,
        duration: "15 minutes",
        meeting_link: response.meeting_link || "",
      });

      setShowSuccessModal(true);
    } catch (error) {
      console.error("Booking failed:", error);
      setBookingError(error.message || "Unable to book this slot.");
    }
  };

  const handleCloseSuccess = () => {
    setShowSuccessModal(false);
    setSelectedSlot(null);
    setBookingData(null);
  };

  return (
    <MainLayout>
      <div className="bg-[#F8F7FC] min-h-screen">
        {/* PAGE HEADER */}
        <div className="max-w-6xl mx-auto px-4 pt-6 pb-6">
          <h1 className="text-2xl font-bold text-[#1E1B4B]">Book a Call</h1>
          <p className="text-sm text-[#7C6A9A] mt-1">
            Schedule a 15-minute Google Meet call with the admin.
          </p>
        </div>

        {/* MAIN CONTENT */}
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6 px-4 pb-8">
          <Calendar
            currentDate={currentDate}
            selectedDate={selectedDate}
            onDateSelect={handleDateSelect}
            onPreviousMonth={handlePreviousMonth}
            onNextMonth={handleNextMonth}
          />

          <div>
            {loadingSlots ? (
              <div className="bg-white rounded-2xl border border-[#E5DDF0] shadow-sm p-8 flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full bg-[#F3EFFF] flex items-center justify-center mx-auto mb-4">
                    <div className="w-6 h-6 border-2 border-[#5B21B6] border-t-transparent rounded-full animate-spin" />
                  </div>
                  <p className="text-[#7C6A9A]">Loading available slots...</p>
                </div>
              </div>
            ) : (
              <SlotList
                selectedDate={selectedDate}
                slots={slots}
                onBookSlot={handleBookSlot}
              />
            )}
          </div>
        </div>

        {/* BOOKING MODAL */}
        {showBookingModal && (
          <BookingModal
            selectedDate={selectedDate}
            selectedSlot={selectedSlot}
            onClose={() => setShowBookingModal(false)}
            onConfirm={handleConfirmBooking}
          />
        )}

        {/* SUCCESS MODAL */}
        {showSuccessModal && (
          <SuccessModal booking={bookingData} onClose={handleCloseSuccess} />
        )}
      </div>

      <style jsx>{`
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
        .animate-spin {
          animation: spin 0.8s linear infinite;
        }
      `}</style>
    </MainLayout>
  );
};

export default BookCall;
