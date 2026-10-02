import { useState } from "react";
import { rescheduleDate } from "../services/bookingApi";
import MainLayout from "../layout/mainLayout";
import { Calendar, RefreshCw, AlertCircle, CheckCircle, Users, ArrowRight } from "lucide-react";

const AdminReschedule = () => {
  const [sourceDate, setSourceDate] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const handleReschedule = async () => {
    if (!sourceDate || !targetDate) {
      setError("Please select both source and target dates.");
      return;
    }

    if (sourceDate === targetDate) {
      setError("Source and target dates cannot be the same.");
      return;
    }

    const confirmReschedule = window.confirm(
      `Are you sure you want to reschedule all meetings from ${sourceDate} to ${targetDate}?`
    );

    if (!confirmReschedule) {
      return;
    }

    setLoading(true);
    setMessage("");
    setError("");
    setResult(null);

    try {
      const response = await rescheduleDate(sourceDate, targetDate);

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
    <MainLayout>
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-[#23195A] to-[#6A3EA1] rounded-3xl p-8 text-white mb-8">
        <div>
          <p className="uppercase tracking-[6px] text-sm opacity-80 mb-3">
            Admin Panel
          </p>
          <h1 className="text-5xl font-bold mb-3">
            Reschedule Meetings
          </h1>
          <p className="text-lg opacity-90 max-w-2xl">
            Select a source date to reschedule all confirmed meetings to a new target date.
            Users will receive automatic email notifications.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-3xl shadow-sm p-8">

          <div className="grid md:grid-cols-2 gap-6 mb-6">
            {/* Source Date */}
            <div>
              <label className="block text-sm font-semibold text-[#1E1B4B] mb-3 flex items-center gap-2">
                <Calendar size={18} />
                Source Date (From)
              </label>

              <input
                type="date"
                value={sourceDate}
                onChange={(e) => {
                  setSourceDate(e.target.value);
                  setMessage("");
                  setError("");
                  setResult(null);
                }}
                className="w-full border-2 border-[#D9CFE8] rounded-xl px-5 py-4 text-[#1E1B4B] focus:border-[#693C83] focus:outline-none transition-colors"
              />
              <p className="text-xs text-[#6B5B7A] mt-2">
                All meetings on this date will be moved
              </p>
            </div>

            {/* Target Date */}
            <div>
              <label className="block text-sm font-semibold text-[#1E1B4B] mb-3 flex items-center gap-2">
                <Calendar size={18} />
                Target Date (To)
              </label>

              <input
                type="date"
                value={targetDate}
                onChange={(e) => {
                  setTargetDate(e.target.value);
                  setMessage("");
                  setError("");
                  setResult(null);
                }}
                className="w-full border-2 border-[#D9CFE8] rounded-xl px-5 py-4 text-[#1E1B4B] focus:border-[#693C83] focus:outline-none transition-colors"
              />
              <p className="text-xs text-[#6B5B7A] mt-2">
                Meetings will be rescheduled to this date
              </p>
            </div>
          </div>

          {/* Arrow indicator */}
          <div className="flex justify-center mb-6">
            <div className="bg-[#F1ECF7] rounded-full p-3">
              <ArrowRight size={24} className="text-[#693C83]" />
            </div>
          </div>

          <button
            onClick={handleReschedule}
            disabled={loading || !sourceDate || !targetDate}
            className="w-full bg-gradient-to-r from-[#10B981] to-[#059669] text-white py-4 rounded-xl font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <RefreshCw size={20} className="animate-spin" />
                Rescheduling...
              </>
            ) : (
              <>
                <RefreshCw size={20} />
                Reschedule All Meetings
              </>
            )}
          </button>

          {message && (
            <div className="mt-6 p-5 bg-green-50 text-green-700 rounded-2xl flex items-start gap-3">
              <CheckCircle size={24} className="shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Success</p>
                <p className="text-sm">{message}</p>
                <p className="text-xs mt-2 opacity-75">Email notifications have been sent to all affected users.</p>
              </div>
            </div>
          )}

          {error && (
            <div className="mt-6 p-5 bg-red-50 text-red-700 rounded-2xl flex items-start gap-3">
              <AlertCircle size={24} className="shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Error</p>
                <p className="text-sm">{error}</p>
              </div>
            </div>
          )}

          {result?.meetings?.length > 0 && (
            <div className="mt-8">
              <div className="flex items-center gap-3 mb-6">
                <Users size={24} className="text-[#693C83]" />
                <h2 className="text-xl font-bold text-[#1E1B4B]">
                  Rescheduled Meetings ({result.meetings.length})
                </h2>
              </div>

              <div className="space-y-4">
                {result.meetings.map((meeting) => (
                  <div
                    key={meeting.booking_id}
                    className="border-2 border-[#E8E4F0] rounded-2xl p-5 hover:border-[#693C83] transition-colors"
                  >
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-[#6B5B7A] mb-1">Booking ID</p>
                        <p className="font-semibold text-[#1E1B4B]">{meeting.booking_id}</p>
                      </div>

                      <div>
                        <p className="text-sm text-[#6B5B7A] mb-1">User ID</p>
                        <p className="font-semibold text-[#1E1B4B]">{meeting.user_id}</p>
                      </div>

                      <div>
                        <p className="text-sm text-[#6B5B7A] mb-1">New Date</p>
                        <p className="font-semibold text-[#1E1B4B]">{meeting.new_date}</p>
                      </div>

                      <div>
                        <p className="text-sm text-[#6B5B7A] mb-1">New Time</p>
                        <p className="font-semibold text-[#1E1B4B]">
                          {meeting.new_start_time} - {meeting.new_end_time}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </MainLayout>
  );
};

export default AdminReschedule;