import MainLayout from "../../layout/mainLayout";
import { useState, useEffect } from "react";
import {
  LockKeyhole,
  Bell,
  Mail,
  Calendar,
  Award,
  Clock,
  Eye,
  EyeOff,
  ShieldCheck,
  FileLock2,
  Loader2,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import api from "../../utils/axios";
import { useNavigate } from "react-router-dom";

// Password Input Component
const PasswordInput = ({
  label,
  value,
  onChange,
  placeholder,
  showPassword,
  onToggleShow,
  icon: Icon = LockKeyhole,
  required = true,
}) => (
  <div>
    <label className="block text-sm font-medium text-[#1E1B4B] mb-2">
      {label}
    </label>
    <div className="relative">
      <Icon
        size={20}
        className="absolute left-4 top-1/2 -translate-y-1/2 text-[#5B21B6]"
      />
      <input
        type={showPassword ? "text" : "password"}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full pl-12 pr-12 py-3 border border-[#E5DDF0] rounded-xl focus:outline-none focus:border-[#5B21B6] focus:ring-2 focus:ring-[#5B21B6]/20 transition-colors duration-200"
        required={required}
      />
      <button
        type="button"
        onClick={onToggleShow}
        className="absolute right-4 top-1/2 -translate-y-1/2 text-[#7C6A9A] hover:text-[#1E1B4B] transition-colors duration-200"
        aria-label={showPassword ? "Hide password" : "Show password"}
      >
        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
      </button>
    </div>
  </div>
);

// Toggle Component
const Toggle = ({ enabled, onChange, ariaLabel }) => (
  <button
    type="button"
    role="switch"
    aria-checked={enabled}
    aria-label={ariaLabel}
    onClick={onChange}
    className={`relative w-14 h-8 rounded-full transition-colors duration-200 flex-shrink-0 ${
      enabled ? "bg-[#10B981]" : "bg-[#D1D5DB]"
    }`}
  >
    <span
      className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-md transition-transform duration-200 ${
        enabled ? "translate-x-6" : "translate-x-0"
      }`}
    />
  </button>
);

// Alert Component
const Alert = ({ type, message, onClose }) => {
  if (!message) return null;

  const styles = {
    success: {
      bg: "bg-[#10B981]/10",
      border: "border-[#10B981]/30",
      text: "text-[#10B981]",
      icon: CheckCircle,
    },
    error: {
      bg: "bg-[#EF4444]/10",
      border: "border-[#EF4444]/30",
      text: "text-[#EF4444]",
      icon: AlertCircle,
    },
  };

  const config = styles[type] || styles.success;
  const Icon = config.icon;

  return (
    <div
      className={`flex items-center gap-3 p-4 rounded-xl border ${config.bg} ${config.border} mb-6`}
    >
      <Icon size={20} className={config.text} />
      <p className={`text-sm font-medium ${config.text}`}>{message}</p>
    </div>
  );
};

// Notification configuration
const notificationConfigs = [
  {
    key: "emailNotifications",
    title: "Email Notifications",
    description: "Receive email updates about your account",
    icon: Mail,
    bgGradient: "from-[#EDE9FE] to-[#DDD6FE]",
  },
  {
    key: "programAssignmentNotifications",
    title: "Program Assignment Notifications",
    description: "Get notified when assigned to new programs",
    icon: Bell,
    bgGradient: "from-[#D1FAE5] to-[#A7F3D0]",
  },
  {
    key: "quizReminders",
    title: "Quiz Reminders",
    description: "Receive reminders for upcoming quizzes",
    icon: Clock,
    bgGradient: "from-[#FEF3C7] to-[#FDE68A]",
  },
  {
    key: "certificateNotifications",
    title: "Certificate Notifications",
    description: "Get notified when you earn certificates",
    icon: Award,
    bgGradient: "from-[#FCE7F3] to-[#FBCFE8]",
  },
  {
    key: "dailyLearningReminders",
    title: "Daily Learning Reminders",
    description: "Daily reminders to keep you on track",
    icon: Calendar,
    bgGradient: "from-[#E0F2FE] to-[#DBEAFE]",
  },
];

const Settings = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState("account");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  // Password change state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Notification settings state
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    programAssignmentNotifications: true,
    quizReminders: true,
    certificateNotifications: true,
    dailyLearningReminders: false,
  });

  // Load notification preferences from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("notificationPreferences");
    if (saved) {
      try {
        setNotifications(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse notification preferences:", e);
      }
    }
  }, []);

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: "", text: "" }), 3000);
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      showMessage("error", "New passwords do not match");
      return;
    }

    if (newPassword.length < 8) {
      showMessage("error", "Password must be at least 8 characters long");
      return;
    }

    const userId = localStorage.getItem("user_id");
    if (!userId) {
      showMessage("error", "User session not found. Please login again.");
      return;
    }

    setIsLoading(true);

    try {
      await api.post("/change-password", {
        user_id: userId,
        current_password: currentPassword,
        new_password: newPassword,
      });

      showMessage("success", "Password changed successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setShowCurrentPassword(false);
      setShowNewPassword(false);
      setShowConfirmPassword(false);
    } catch (error) {
      showMessage(
        "error",
        error.response?.data?.detail || "Failed to change password",
      );
    }

    setIsLoading(false);
  };

  const handleNotificationToggle = (key) => {
    const updated = {
      ...notifications,
      [key]: !notifications[key],
    };
    setNotifications(updated);
    localStorage.setItem("notificationPreferences", JSON.stringify(updated));
    showMessage("success", "Notification preference updated");
  };

  return (
    <MainLayout>
      <div className="bg-[#F8F7FC] min-h-screen p-6">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-[#1E1B4B] mb-6">Settings</h1>

          <Alert type={message.type} message={message.text} />

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Sidebar Navigation */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-sm border border-[#E5DDF0] p-4">
                <nav className="space-y-2">
                  <button
                    type="button"
                    onClick={() => setActiveSection("account")}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                      activeSection === "account"
                        ? "bg-gradient-to-r from-[#693C83] to-[#8B5FBF] text-white shadow-md"
                        : "text-[#7C6A9A] hover:text-[#1E1B4B] hover:bg-[#F8F7FC]"
                    }`}
                  >
                    <LockKeyhole size={20} />
                    <span className="font-medium">Account</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate("/privacy-policy")}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[#7C6A9A] hover:text-[#1E1B4B] hover:bg-[#F8F7FC] transition-all duration-200"
                  >
                    <FileLock2 size={20} />
                    <span className="font-medium">Privacy Policy</span>
                  </button>
                </nav>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="lg:col-span-3">
              {/* Account Settings */}
              {activeSection === "account" && (
                <div className="bg-white rounded-2xl shadow-sm border border-[#E5DDF0] p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <ShieldCheck size={24} className="text-[#5B21B6]" />
                    <h2 className="text-xl font-bold text-[#1E1B4B]">
                      Change Password
                    </h2>
                  </div>

                  <p className="text-sm text-[#7C6A9A] mb-6">
                    Keep your account secure by using a strong, unique password.
                  </p>

                  <form onSubmit={handlePasswordChange} className="space-y-5">
                    <PasswordInput
                      label="Current Password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter current password"
                      showPassword={showCurrentPassword}
                      onToggleShow={() =>
                        setShowCurrentPassword(!showCurrentPassword)
                      }
                    />

                    <PasswordInput
                      label="New Password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                      showPassword={showNewPassword}
                      onToggleShow={() => setShowNewPassword(!showNewPassword)}
                    />

                    <div className="mt-1">
                      <ul className="text-xs text-[#7C6A9A] space-y-1">
                        <li>• Use at least 8 characters</li>
                      </ul>
                    </div>

                    <PasswordInput
                      label="Confirm New Password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                      showPassword={showConfirmPassword}
                      onToggleShow={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                    />

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full bg-[#5B21B6] text-white font-semibold py-3 rounded-xl hover:bg-[#4C1D95] hover:shadow-md transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-70 flex items-center justify-center gap-2"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 size={20} className="animate-spin" />
                          Updating Password...
                        </>
                      ) : (
                        "Update Password"
                      )}
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Settings;
