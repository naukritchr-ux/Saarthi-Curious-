  import { useEffect, useRef, useState } from "react";
  import { useNavigate } from "react-router-dom";
  import api from "../../utils/axios";

  import {
    Bell,
    BellDot,
    Check,
    Trash2,
    X,
    ChevronRight,
    Clock,
  } from "lucide-react";

  const formatNotificationTime = (sentAt) => {
    if (!sentAt) {
      return "Unknown time";
    }

    const date = new Date(sentAt);
    if (Number.isNaN(date.getTime())) {
      return "Unknown time";
    }

    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(todayStart.getDate() - 1);

    const timeFormatter = new Intl.DateTimeFormat(undefined, {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

    const formattedTime = timeFormatter.format(date);

    if (date >= todayStart && date < new Date(todayStart.getTime() + 24 * 60 * 60 * 1000)) {
      return `Today • ${formattedTime}`;
    }

    if (date >= yesterdayStart && date < todayStart) {
      return `Yesterday • ${formattedTime}`;
    }

    const dateFormatter = new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
    });

    return `${dateFormatter.format(date)} • ${formattedTime}`;
  };

  const NotificationBell = () => {
    const [open, setOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isHovered, setIsHovered] = useState(false);

    const navigate = useNavigate();

    const dropdownRef = useRef(null);

    const fetchNotifications = async () => {
      try {
        setLoading(true);

        const response = await api.get("/notifications");

        setNotifications(response.data);
      } catch (err) {
        console.error("Notification Error:", err);

        if (err.response) {
          console.log("Status:", err.response.status);
          console.log("Response:", err.response.data);
        }
      } finally {
        setLoading(false);
      }
    };

    useEffect(() => {
      fetchNotifications();
    }, []);

    useEffect(() => {
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }, []);

    useEffect(() => {
      function handleOutside(event) {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
          setOpen(false);
        }
      }

      document.addEventListener("mousedown", handleOutside);

      return () => document.removeEventListener("mousedown", handleOutside);
    }, []);

    const unread = notifications.filter((n) => !n.is_read).length;

    const markRead = async (id) => {
      try {
        await api.put(`/notifications/${id}/read`, {});

        fetchNotifications();
      } catch (err) {
        console.error(err);
      }
    };

    const markAllRead = async () => {
      try {
        const unreadIds = notifications
          .filter((n) => !n.is_read)
          .map((n) => n.id);

        await Promise.all(
          unreadIds.map((id) => api.put(`/notifications/${id}/read`, {}))
        );

        fetchNotifications();
      } catch (err) {
        console.error(err);
      }
    };

  const handleNotificationClick = async (item) => {
    try {
      if (!item.is_read) {
        await markRead(item.id);
      }

      setOpen(false);

      const userId = Number(localStorage.getItem("user_id"));

      // Retention Quiz FAILED → Open quiz for reattempt
      if (
        item.title === "Retention Quiz Reattempt Required" &&
        item.retention_quiz_id
      ) {
        navigate(
          `/retention-quiz/${item.retention_quiz_id}?user_id=${userId}`
        );
        return;
      }

      // Retention Quiz PASSED → Open result
      if (
        item.title === "Retention Quiz Passed" &&
        item.retention_quiz_id
      ) {
        navigate(
          `/retention-quiz/${item.retention_quiz_id}/result?user_id=${userId}`
        );
        return;
      }


// Application Check Rejected → Open Application Check for reattempt
// Admin → Application Check Submitted
if (item.title === "Application Check Submitted") {
  navigate("/application-check-submissions");
  return;
}

// Application Check Rejected → Open Application Check for reattempt
if (
  item.title === "Application Check Rejected" &&
  item.application_check_id
) {
  navigate(`/application-check/${item.application_check_id}`);
  return;
}

// Normal program notification
if (item.program_id) {
  navigate(`/program/${item.program_id}`);
}

    } catch (err) {
      console.error("Notification click error:", err);
    }
  };

    const deleteNotification = async (id) => {
      try {
        await api.delete(`/notifications/${id}`);

        fetchNotifications();
      } catch (err) {
        console.error(err);
      }
    };

    const clearAll = async () => {
      try {
        await Promise.all(
          notifications.map((n) => api.delete(`/notifications/${n.id}`))
        );

        fetchNotifications();
      } catch (err) {
        console.error(err);
      }
    };

    const getTypeIcon = (type) => {
      const types = {
        course: "📚",
        achievement: "🏆",
        reminder: "⏰",
        message: "💬",
        update: "🔄",
        warning: "⚠️",
        success: "✅",
      };
      return types[type] || "📌";
    };

    const getTypeColor = (type) => {
      const colors = {
        course: "from-blue-500 to-purple-500",
        achievement: "from-yellow-500 to-orange-500",
        reminder: "from-emerald-500 to-teal-500",
        message: "from-sky-500 to-blue-500",
        update: "from-indigo-500 to-purple-500",
        warning: "from-rose-500 to-red-500",
        success: "from-emerald-500 to-green-500",
      };
      return colors[type] || "from-gray-500 to-gray-600";
    };

    return (
      <div className="relative" ref={dropdownRef}>
        {/* Bell Button */}
        <button
          type="button"
          onClick={() => setOpen(!open)}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className="relative p-2.5 rounded-full transition-all duration-300 hover:bg-[#2F264D] hover:scale-110 active:scale-90 group"
          aria-label="Notifications"
        >
          {/* Glow effect for unread */}
          {unread > 0 && (
            <span className="absolute inset-0 rounded-full bg-[#693C83]/20 animate-ping-slow" />
          )}

          {/* Bell icon with animation */}
          <div
            className={`transition-transform duration-300 ${isHovered ? "rotate-12 scale-110" : ""}`}
          >
            {unread > 0 ? (
              <BellDot className="w-5 h-5 text-[#EDE3F5] transition-colors duration-200 group-hover:text-white" />
            ) : (
              <Bell className="w-5 h-5 text-[#EDE3F5] transition-colors duration-200 group-hover:text-white" />
            )}
          </div>

          {/* Animated badge */}
          {unread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[22px] h-[22px] px-1.5 bg-gradient-to-r from-[#693C83] to-[#10B981] text-white text-[10px] font-bold rounded-full shadow-lg shadow-[#693C83]/30 animate-bounce-subtle">
              {unread > 99 ? "99+" : unread}
            </span>
          )}
        </button>

        {/* Dropdown */}
        {open && (
          <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-[#2F264D] rounded-2xl shadow-2xl border border-[#7B6A9A]/30 z-50 overflow-hidden animate-slideDown">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#7B6A9A]/20 bg-[#1E1B4B]/30">
              <div className="flex items-center gap-3">
                <div className="p-1.5 rounded-lg bg-[#1E1B4B]">
                  <Bell className="w-4 h-4 text-[#B8A7D6]" />
                </div>
                <div>
                  <h3 className="text-[#F1ECF7] text-sm font-semibold">
                    Notifications
                  </h3>
                  {unread > 0 && (
                    <span className="text-[10px] font-medium text-[#10B981] bg-[#10B981]/10 px-2 py-0.5 rounded-full">
                      {unread} new
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1">
                {notifications.length > 0 && unread > 0 && (
                  <button
                    onClick={markAllRead}
                    className="px-3 py-1.5 text-[10px] font-medium text-[#B8A7D6] hover:text-[#F1ECF7] hover:bg-[#1E1B4B] rounded-lg transition-all duration-200 flex items-center gap-1"
                  >
                    <Check className="w-3 h-3" />
                    Mark all read
                  </button>
                )}
                {notifications.length > 0 && (
                  <button
                    onClick={clearAll}
                    className="px-3 py-1.5 text-[10px] font-medium text-[#B8A7D6] hover:text-red-400 hover:bg-[#1E1B4B] rounded-lg transition-all duration-200 flex items-center gap-1"
                  >
                    <X className="w-3 h-3" />
                    Clear all
                  </button>
                )}
              </div>
            </div>

            {/* Notification List */}
            <div className="max-h-[420px] overflow-y-auto custom-scroll divide-y divide-[#7B6A9A]/10">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-16 px-4">
                  <div className="w-12 h-12 rounded-full bg-[#1E1B4B] flex items-center justify-center mb-3">
                    <div className="w-6 h-6 border-2 border-[#693C83] border-t-transparent rounded-full animate-spin" />
                  </div>
                  <p className="text-[#B8A7D6] text-sm">
                    Loading notifications...
                  </p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 px-4">
                  <div className="w-20 h-20 rounded-full bg-[#1E1B4B] flex items-center justify-center mb-4 relative">
                    <Bell className="w-10 h-10 text-[#7B6A9A]" />
                    <span className="absolute top-0 right-0 w-4 h-4 rounded-full bg-[#10B981] flex items-center justify-center">
                      <Check className="w-2.5 h-2.5 text-white" />
                    </span>
                  </div>
                  <p className="text-[#F1ECF7] text-sm font-medium">
                    All caught up!
                  </p>
                  <p className="text-[#7B6A9A] text-xs mt-1">
                    No new notifications
                  </p>
                </div>
              ) : (
                notifications.map((item, index) => (
                  <div
                    key={item.id}
                    onClick={() => handleNotificationClick(item)}
                    className={`group flex items-start gap-3 px-5 py-3.5 cursor-pointer transition-all duration-300 hover:bg-[#1E1B4B] hover:pl-6 ${
                      !item.is_read ? "bg-[#693C83]/5" : ""
                    }`}
                    style={{
                      animationDelay: `${index * 30}ms`,
                    }}
                  >
                    {/* Icon with gradient */}
                    <div
                      className={`w-11 h-11 rounded-xl bg-gradient-to-br ${getTypeColor(item.type)} p-[2px] flex-shrink-0 shadow-lg shadow-${getTypeColor(item.type)}/20`}
                    >
                      <div className="w-full h-full rounded-xl bg-[#1E1B4B] flex items-center justify-center text-lg">
                        {getTypeIcon(item.type)}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h4
                          className={`text-sm font-medium ${
                            !item.is_read ? "text-[#F1ECF7]" : "text-[#B8A7D6]"
                          }`}
                        >
                          {item.title}
                        </h4>
                        {!item.is_read && (
                          <span className="w-2 h-2 rounded-full bg-[#693C83] flex-shrink-0 mt-2 animate-pulse" />
                        )}
                      </div>
                      <p className="text-xs text-[#B8A7D6] mt-0.5 line-clamp-2 leading-relaxed">
                        {item.message}
                      </p>
                      <div className="flex items-center gap-3 mt-2">
                      <span className="text-[10px] text-[#7B6A9A] flex items-center gap-1">
    <Clock className="w-3 h-3" />
    {formatNotificationTime(item.sent_at)}
  </span>
                        {!item.is_read && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              markRead(item.id);
                            }}
                            className="text-[10px] font-medium text-[#693C83] hover:text-[#8B5CF6] transition-colors duration-200 flex items-center gap-1"
                          >
                            <Check className="w-3 h-3" />
                            Mark read
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(item.id);
                          }}
                          className="text-[10px] font-medium text-red-400/50 hover:text-red-400 transition-colors duration-200 flex items-center gap-1 ml-auto"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* Arrow indicator */}
                    <ChevronRight className="w-4 h-4 text-[#7B6A9A] opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:translate-x-1" />
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="px-5 py-3 border-t border-[#7B6A9A]/20 bg-[#1E1B4B]/30">
                <button
                  onClick={() => setOpen(false)}
                  className="w-full flex items-center justify-center gap-2 text-xs font-medium text-[#B8A7D6] hover:text-[#F1ECF7] transition-all duration-200 py-1.5 rounded-lg hover:bg-[#2F264D]"
                >
                  Close
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        )}

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
          @keyframes ping-slow {
            0%,
            100% {
              transform: scale(1);
              opacity: 0.6;
            }
            50% {
              transform: scale(1.3);
              opacity: 0;
            }
          }
          @keyframes bounce-subtle {
            0%,
            100% {
              transform: scale(1);
            }
            50% {
              transform: scale(1.08);
            }
          }
          .animate-slideDown {
            animation: slideDown 0.2s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
          }
          .animate-ping-slow {
            animation: ping-slow 2s cubic-bezier(0, 0, 0.2, 1) infinite;
          }
          .animate-bounce-subtle {
            animation: bounce-subtle 2s ease-in-out infinite;
          }
          .animate-spin {
            animation: spin 0.8s linear infinite;
          }
          @keyframes spin {
            to {
              transform: rotate(360deg);
            }
          }

          .custom-scroll::-webkit-scrollbar {
            width: 4px;
          }
          .custom-scroll::-webkit-scrollbar-track {
            background: transparent;
            margin: 8px 0;
          }
          .custom-scroll::-webkit-scrollbar-thumb {
            background: #7b6a9a;
            border-radius: 4px;
          }
          .custom-scroll::-webkit-scrollbar-thumb:hover {
            background: #8b7aab;
          }
        `}</style>
      </div>
    );
  };

  export default NotificationBell;