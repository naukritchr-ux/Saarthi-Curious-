import { useState } from "react";
import { rescheduleDate } from "../services/bookingApi";

const AdminReschedule = () => {
  const [selectedDate, setSelectedDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const handleReschedule = async () => {
    if (!selectedDate) {
      setError("Please select a date.");
      return;
    }

    const confirmReschedule = window.confirm(
      `Are you sure you want to reschedule all meetings on ${selectedDate}?`
    );

    if (!confirmReschedule) {
      return;
    }

    setLoading(true);
    setMessage("");
    setError("");
    setResult(null);

    try {
      const response = await rescheduleDate(selectedDate);

      setResult(response.data);
      setMessage(response.data.message);

    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.detail ||
        "Unable to reschedule meetings."
      );

    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">

      <div className="max-w-2xl mx-auto">

        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          Reschedule Meetings
        </h1>

        <p className="text-gray-600 mb-6">
          Select a date to reschedule all confirmed meetings scheduled
          on that day.
        </p>

        <div className="bg-white rounded-xl shadow-sm p-6">

          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Date
          </label>

          <input
            type="date"
            value={selectedDate}
            onChange={(e) => {
              setSelectedDate(e.target.value);
              setMessage("");
              setError("");
              setResult(null);
            }}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 mb-5"
          />

          <button
            onClick={handleReschedule}
            disabled={loading || !selectedDate}
            className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold disabled:opacity-50"
          >
            {loading
              ? "Rescheduling..."
              : "Reschedule All Meetings"}
          </button>

          {message && (
            <div className="mt-5 p-4 bg-green-50 text-green-700 rounded-lg">
              {message}
            </div>
          )}

          {error && (
            <div className="mt-5 p-4 bg-red-50 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          {result?.meetings?.length > 0 && (
            <div className="mt-6">

              <h2 className="font-semibold text-gray-800 mb-3">
                Rescheduled Meetings
              </h2>

              <div className="space-y-3">

                {result.meetings.map((meeting) => (
                  <div
                    key={meeting.booking_id}
                    className="border rounded-lg p-4"
                  >
                    <p>
                      <strong>Booking ID:</strong>{" "}
                      {meeting.booking_id}
                    </p>

                    <p>
                      <strong>User ID:</strong>{" "}
                      {meeting.user_id}
                    </p>

                    <p>
                      <strong>New Date:</strong>{" "}
                      {meeting.new_date}
                    </p>

                    <p>
                      <strong>New Time:</strong>{" "}
                      {meeting.new_start_time} -{" "}
                      {meeting.new_end_time}
                    </p>
                  </div>
                ))}

              </div>
            </div>
          )}

        </div>
      </div>

    </div>
  );
};

export default AdminReschedule;