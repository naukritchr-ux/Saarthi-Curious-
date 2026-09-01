import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { API_BASE } from "../../config/api";
import MainLayout from "../../layout/mainLayout";
import {
  Bell,
  Plus,
  Trash2,
  Edit,
  Sun,
  Moon,
  Users,
  Calendar,
  Clock,
  X,
  AlertCircle,
} from "lucide-react";

// ============ CONSTANTS ============
const groupOptions = [
  "All Users",
  "Team Leaders",
  "Franchise Partners",
  "Franchise Employees",
  "Head Office Staff",
  "Franchise Developers",
];

// ============ UTILITY FUNCTIONS ============
const getUserLabel = (user) => {
  if (!user) return "Unknown";
  return user.full_name || user.name || user.email || "Unknown";
};

const formatDate = (dateString) => {
  if (!dateString) return null;
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch (error) {
    return null;
  }
};

const formatTime = (timeString) => {
  if (!timeString) return null;
  try {
    const [hours, minutes] = timeString.split(":");
    const date = new Date();
    date.setHours(parseInt(hours, 10), parseInt(minutes, 10));
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  } catch (error) {
    return null;
  }
};

const formatDateTime = (dateTimeString) => {
  if (!dateTimeString) return null;
  try {
    const date = new Date(dateTimeString);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  } catch (error) {
    return null;
  }
};

// ============ SCRIPT CARD COMPONENT ============
const ScriptCard = ({ script, onEdit, onDelete, onToggleStatus }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const isLongMessage = script.message && script.message.length > 120;

  const toggleMessage = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="bg-white border border-[#E5DDF0] rounded-2xl p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 flex flex-col">
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-2">
          <span
            className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 ${
              script.notification_type === "Morning"
                ? "bg-amber-100 text-amber-700"
                : "bg-indigo-100 text-indigo-700"
            }`}
          >
            {script.notification_type === "Morning" ? (
              <Sun size={14} />
            ) : (
              <Moon size={14} />
            )}
            {script.notification_type}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
              script.is_active
                ? "bg-emerald-100 text-emerald-700"
                : "bg-gray-100 text-gray-500"
            }`}
          >
            {script.is_active ? "Active" : "Inactive"}
          </span>
        </div>
      </div>

      <h3 className="font-semibold text-lg text-[#1E1B4B] mb-2">
        {script.title}
      </h3>

      <div className="relative flex-1">
        <p
          className={`text-[#4F4679] text-sm min-h-[80px] ${
            !isExpanded ? "line-clamp-4" : "line-clamp-none"
          }`}
        >
          {script.message}
        </p>
        {isLongMessage && (
          <button
            onClick={toggleMessage}
            className="text-xs text-[#693C83] hover:text-[#57306e] font-medium mt-1 block"
          >
            {isExpanded ? "Read less" : "Read more"}
          </button>
        )}
      </div>

      <div className="space-y-2 mt-4 text-xs text-[#6B6280]">
        <div className="flex items-center gap-2">
          <Users size={14} />
          <span className="inline-block px-2 py-0.5 bg-[#ECE5F2] rounded-full text-[#4F4679]">
            {script.audience}
          </span>
        </div>

        {script.created_at_time && (
          <div className="flex items-center gap-2">
            <span className="font-medium text-[#4F4679]">Created:</span>
            <span>{formatDateTime(script.created_at_time)}</span>
          </div>
        )}

        {(script.schedule_date || script.schedule_time) && (
          <div className="flex items-center gap-2 text-[#1E1B4B] font-medium">
            <Calendar size={14} className="text-[#693C83]" />
            <span>
              {script.schedule_date && formatDate(script.schedule_date)}
              {script.schedule_date && script.schedule_time && " at "}
              {script.schedule_time && (
                <span className="flex items-center gap-1">
                  <Clock size={12} />
                  {formatTime(script.schedule_time)}
                </span>
              )}
            </span>
          </div>
        )}
      </div>

      <div className="border-t border-[#ECE5F2] mt-4 pt-4 flex justify-end items-center gap-2">
        <button
          onClick={() => onToggleStatus(script.id)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#693C83] focus:ring-offset-2 ${
            script.is_active ? "bg-[#10B981]" : "bg-[#D9CFE8]"
          }`}
          title={script.is_active ? "Deactivate script" : "Activate script"}
          aria-label={
            script.is_active ? "Deactivate script" : "Activate script"
          }
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
              script.is_active ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </button>

        <button
          onClick={() => onEdit(script)}
          className="bg-blue-50 hover:bg-blue-100 text-blue-500 p-2 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          title="Edit script"
          aria-label="Edit script"
        >
          <Edit size={16} />
        </button>

        <button
          onClick={() => onDelete(script)}
          className="bg-red-50 hover:bg-red-100 text-red-400 hover:text-red-600 p-2 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          title="Delete script"
          aria-label="Delete script"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
};

// ============ MAIN COMPONENT ============
const NotificationScriptsPage = () => {
  const [scripts, setScripts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingScript, setEditingScript] = useState(null);
  const [users, setUsers] = useState([]);
  const [isAudienceOpen, setIsAudienceOpen] = useState(false);
  const [recipientSearch, setRecipientSearch] = useState("");
  const [selectedRecipients, setSelectedRecipients] = useState([
    { type: "all", value: "All Users" },
  ]);
  const [deleteModal, setDeleteModal] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const audienceDropdownRef = useRef(null);

  const [newScript, setNewScript] = useState({
    type: "Morning",
    title: "",
    message: "",
    audience: "All Users",
    trigger_type: "scheduled",
    schedule_type: "Once",
    schedule_date: "",
    schedule_time: "",
  });

  // ============ FETCH FUNCTIONS ============
  const fetchScripts = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(`${API_BASE}/notification-scripts`);
      setScripts(response.data);
    } catch (error) {
      console.error("Error fetching scripts:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE}/users`);
      setUsers(response.data || []);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  }, []);

  // ============ EFFECTS ============
  useEffect(() => {
    fetchScripts();
    fetchUsers();
  }, [fetchScripts, fetchUsers]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        audienceDropdownRef.current &&
        !audienceDropdownRef.current.contains(event.target)
      ) {
        setIsAudienceOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // ============ DERIVED STATE ============
  const morningScripts = scripts.filter(
    (script) => script.notification_type === "Morning",
  );

  const eveningScripts = scripts.filter(
    (script) => script.notification_type === "Evening",
  );

  const morningCount = morningScripts.length;
  const eveningCount = eveningScripts.length;
  const totalCount = scripts.length;

  // ============ RECIPIENT HANDLERS ============
  const getRecipientLabel = (recipient) => {
    if (recipient.type === "all") return "All Users";
    if (recipient.type === "role") return recipient.value;
    if (recipient.type === "user") {
      const found = users.find(
        (user) => (user.user_id || user.id) === recipient.value,
      );
      return found ? getUserLabel(found) : `User ${recipient.value}`;
    }
    return String(recipient.value);
  };

  const getAudienceText = (recipients) => {
    if (!recipients || recipients.length === 0) return "All Users";
    if (recipients.some((recipient) => recipient.type === "all"))
      return "All Users";
    if (recipients.length === 1) return getRecipientLabel(recipients[0]);
    return `${recipients.length} selected`;
  };

  const isAllUsersSelected = selectedRecipients.some(
    (recipient) => recipient.type === "all",
  );

  const isRecipientSelected = (target) =>
    selectedRecipients.some(
      (recipient) =>
        recipient.type === target.type &&
        String(recipient.value) === String(target.value),
    );

  const handleToggleRecipient = (recipient) => {
    setSelectedRecipients((prev) => {
      // "All Users" is exclusive.
      if (recipient.type === "all") {
        const finalSelection = [{ type: "all", value: "All Users" }];

        setNewScript((prevState) => ({
          ...prevState,
          audience: getAudienceText(finalSelection),
        }));

        return finalSelection;
      }

      // If selecting a role/user, remove "All Users".
      const withoutAll = prev.filter((item) => item.type !== "all");

      const alreadySelected = withoutAll.some(
        (item) =>
          item.type === recipient.type &&
          String(item.value) === String(recipient.value),
      );

      const next = alreadySelected
        ? withoutAll.filter(
            (item) =>
              !(
                item.type === recipient.type &&
                String(item.value) === String(recipient.value)
              ),
          )
        : [...withoutAll, recipient];

      const finalSelection =
        next.length === 0 ? [{ type: "all", value: "All Users" }] : next;

      setNewScript((prevState) => ({
        ...prevState,
        audience: getAudienceText(finalSelection),
      }));

      return finalSelection;
    });
  };

  const resetAudienceSelection = () => {
    setSelectedRecipients([{ type: "all", value: "All Users" }]);
    setNewScript((prev) => ({
      ...prev,
      audience: "All Users",
    }));
  };

  // ============ MODAL HANDLERS ============
  const openEditModal = (script) => {
    setEditingScript(script);

    setNewScript({
      type: script.notification_type || "Morning",
      title: script.title || "",
      message: script.message || "",
      audience: script.audience || "All Users",
      trigger_type: script.trigger_type || "scheduled",
      schedule_type: script.schedule_type === "daily" ? "Daily" : "Once",
      schedule_time: script.schedule_time
        ? script.schedule_time.slice(0, 5)
        : "",
      schedule_date: script.schedule_date || "",
    });

    // Load previously saved recipients
    const savedRecipients = (script.recipients || []).map((recipient) => ({
      type: recipient.type,
      value: recipient.value,
    }));

    setSelectedRecipients(
      savedRecipients.length > 0
        ? savedRecipients
        : [{ type: "all", value: "All Users" }],
    );

    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingScript(null);
    resetAudienceSelection();
    setRecipientSearch("");
    setIsAudienceOpen(false);

    setNewScript({
      type: "Morning",
      title: "",
      message: "",
      audience: "All Users",
      trigger_type: "scheduled",
      schedule_type: "Once",
      schedule_date: "",
      schedule_time: "",
    });
  };

  // ============ CRUD OPERATIONS ============
  const addScript = async () => {
    // Validation
    if (!newScript.title.trim()) {
      alert("Please enter a title");
      return;
    }
    if (!newScript.message.trim()) {
      alert("Please enter a message");
      return;
    }

    const scriptData = {
      notification_type: newScript.type,
      title: newScript.title.trim(),
      message: newScript.message.trim(),
      audience: newScript.audience,
      recipients: selectedRecipients,
      trigger_type: newScript.trigger_type,
      schedule_type: newScript.schedule_type.toLowerCase(),
      schedule_date:
        newScript.schedule_type === "Daily"
          ? null
          : newScript.schedule_date || null,
      schedule_time: newScript.schedule_time || null,
    };

    closeModal();

    try {
      if (editingScript) {
        // Optimistic update for existing script
        const updatedScript = {
          ...editingScript,
          ...scriptData,
        };

        setScripts((prev) =>
          prev.map((script) =>
            script.id === editingScript.id ? updatedScript : script,
          ),
        );

        await axios.put(
          `${API_BASE}/notification-scripts/${editingScript.id}`,
          scriptData,
        );
      } else {
        // Optimistic update for new script
        const tempId = Date.now();
        const newScriptWithId = {
          ...scriptData,
          id: tempId,
          is_active: true,
          created_at_time: new Date().toISOString(),
        };

        setScripts((prev) => [...prev, newScriptWithId]);

        const response = await axios.post(
          `${API_BASE}/notification-scripts`,
          scriptData,
        );

        // Replace temp script with real one from backend
        setScripts((prev) =>
          prev.map((script) => (script.id === tempId ? response.data : script)),
        );
      }
    } catch (error) {
      console.error("Error saving script:", error);
      alert("Failed to save script. Please try again.");
      // Revert on error by fetching fresh data
      fetchScripts();
    }
  };

  const deleteScript = async (script) => {
    try {
      setScripts((prev) => prev.filter((s) => s.id !== script.id));
      setDeleteModal(null);
      await axios.delete(`${API_BASE}/notification-scripts/${script.id}`);
    } catch (error) {
      console.error("Error deleting script:", error);
      alert("Failed to delete script. Please try again.");
      fetchScripts();
    }
  };

  const toggleStatus = async (id) => {
    try {
      setScripts((prev) =>
        prev.map((script) =>
          script.id === id
            ? { ...script, is_active: !script.is_active }
            : script,
        ),
      );

      await axios.put(`${API_BASE}/notification-scripts/${id}/status`);
    } catch (error) {
      console.error("Error toggling status:", error);
      alert("Failed to update script status. Please try again.");
      fetchScripts();
    }
  };

  // ============ RENDER ============
  if (isLoading && scripts.length === 0) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#693C83] mx-auto"></div>
            <p className="mt-4 text-[#4F4679]">Loading scripts...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-4xl font-bold text-[#1E1B4B]">
            Notification Scripts
          </h1>
          <p className="text-[#4F4679] mt-2">
            Manage Morning and Evening notifications
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-[#10B981] text-white px-5 py-3 rounded-xl hover:bg-[#059669] hover:shadow-lg transition-all duration-200 transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-[#10B981] focus:ring-offset-2"
        >
          <Plus size={18} />
          Add Script
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-[#ECE5F2] rounded-2xl p-5 border-l-4 border-amber-400 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Sun size={20} className="text-amber-600" />
            <p className="text-[#4F4679] text-sm font-medium">
              Morning Scripts
            </p>
          </div>
          <h2 className="text-3xl font-bold text-[#1E1B4B]">{morningCount}</h2>
          <p className="text-xs text-[#4F4679] mt-1">
            {morningCount > 0 && totalCount > 0
              ? `${Math.round((morningCount / totalCount) * 100)}% of total`
              : "No morning scripts"}
          </p>
        </div>

        <div className="bg-[#ECE5F2] rounded-2xl p-5 border-l-4 border-indigo-400 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Moon size={20} className="text-indigo-600" />
            <p className="text-[#4F4679] text-sm font-medium">
              Evening Scripts
            </p>
          </div>
          <h2 className="text-3xl font-bold text-[#1E1B4B]">{eveningCount}</h2>
          <p className="text-xs text-[#4F4679] mt-1">
            {eveningCount > 0 && totalCount > 0
              ? `${Math.round((eveningCount / totalCount) * 100)}% of total`
              : "No evening scripts"}
          </p>
        </div>

        <div className="bg-[#ECE5F2] rounded-2xl p-5 border-l-4 border-[#693C83] shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Bell size={20} className="text-[#693C83]" />
            <p className="text-[#4F4679] text-sm font-medium">Total Scripts</p>
          </div>
          <h2 className="text-3xl font-bold text-[#693C83]">{totalCount}</h2>
          <p className="text-xs text-[#4F4679] mt-1">
            {totalCount > 0
              ? `${morningCount} morning · ${eveningCount} evening`
              : "No scripts created yet"}
          </p>
        </div>
      </div>

      {/* Scripts Sections */}
      <div className="bg-white border border-[#E5DDF0] rounded-2xl shadow-sm overflow-hidden">
        {/* Morning Section */}
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4 pb-3 border-b border-[#E5DDF0]">
            <div className="bg-amber-100 p-2 rounded-xl">
              <Sun size={20} className="text-amber-700" />
            </div>
            <h2 className="text-xl font-semibold text-[#1E1B4B]">
              Morning Scripts
            </h2>
            <span className="bg-amber-100 text-amber-700 px-3 py-0.5 rounded-full text-sm font-medium">
              {morningScripts.length}
            </span>
          </div>

          {morningScripts.length === 0 ? (
            <div className="border-2 border-dashed border-gray-200 rounded-xl p-10 text-center">
              <Bell size={40} className="mx-auto text-gray-400 mb-3" />
              <p className="text-gray-500 font-medium">
                No Morning Scripts Yet
              </p>
              <p className="text-gray-400 text-sm mt-1">
                Create a script to start sending morning notifications
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {morningScripts.map((script) => (
                <ScriptCard
                  key={script.id}
                  script={script}
                  onEdit={openEditModal}
                  onDelete={setDeleteModal}
                  onToggleStatus={toggleStatus}
                />
              ))}
            </div>
          )}
        </div>

        {/* Divider */}
        {morningScripts.length > 0 && eveningScripts.length > 0 && (
          <div className="border-t border-[#E5DDF0] mx-6"></div>
        )}

        {/* Evening Section */}
        <div className="p-6 pt-0">
          <div className="flex items-center gap-3 mb-4 pb-3 border-b border-[#E5DDF0]">
            <div className="bg-indigo-100 p-2 rounded-xl">
              <Moon size={20} className="text-indigo-700" />
            </div>
            <h2 className="text-xl font-semibold text-[#1E1B4B]">
              Evening Scripts
            </h2>
            <span className="bg-indigo-100 text-indigo-700 px-3 py-0.5 rounded-full text-sm font-medium">
              {eveningScripts.length}
            </span>
          </div>

          {eveningScripts.length === 0 ? (
            <div className="border-2 border-dashed border-gray-200 rounded-xl p-10 text-center">
              <Bell size={40} className="mx-auto text-gray-400 mb-3" />
              <p className="text-gray-500 font-medium">
                No Evening Scripts Yet
              </p>
              <p className="text-gray-400 text-sm mt-1">
                Create a script to start sending evening notifications
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {eveningScripts.map((script) => (
                <ScriptCard
                  key={script.id}
                  script={script}
                  onEdit={openEditModal}
                  onDelete={setDeleteModal}
                  onToggleStatus={toggleStatus}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={closeModal}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white z-10 px-6 pt-6 pb-4 border-b border-[#E5DDF0]">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-[#693C83]/10 p-3 rounded-xl">
                    <Bell size={22} className="text-[#693C83]" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-[#1E1B4B]">
                      {editingScript
                        ? "Edit Notification Script"
                        : "Add Notification Script"}
                    </h2>
                    <p className="text-[#4F4679] text-sm">
                      {editingScript
                        ? "Update the notification template"
                        : "Create a new notification template"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={closeModal}
                  className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-[#693C83]"
                  aria-label="Close modal"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-[#1E1B4B] mb-1.5">
                  Notification Type
                </label>
                <select
                  value={newScript.type}
                  onChange={(e) =>
                    setNewScript({
                      ...newScript,
                      type: e.target.value,
                    })
                  }
                  className={`w-full border rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#693C83] focus:border-transparent transition-shadow ${
                    newScript.type === "Morning"
                      ? "border-amber-300 bg-amber-50/30"
                      : "border-indigo-300 bg-indigo-50/30"
                  }`}
                >
                  <option value="Morning">🌅 Morning</option>
                  <option value="Evening">🌙 Evening</option>
                </select>
              </div>

              <div className="space-y-4">
                {newScript.trigger_type === "scheduled" && (
                  <select
                    value={newScript.type}
                    onChange={(e) =>
                      setNewScript({
                        ...newScript,
                        type: e.target.value,
                      })
                    }
                    className="w-full border border-[#D9CFE8] rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#693C83] focus:border-transparent transition-shadow"
                  >
                    <option>Morning</option>
                    <option>Evening</option>
                  </select>
                )}

                <div>
                  <label className="block text-sm font-semibold text-[#1E1B4B] mb-1.5">
                    Title
                  </label>
                  <input
                    type="text"
                    placeholder="Enter script title..."
                    value={
                      newScript.trigger_type === "program_published"
                        ? "New Program Available 🎓"
                        : newScript.title
                    }
                    onChange={(e) =>
                      setNewScript({
                        ...newScript,
                        title: e.target.value,
                      })
                    }
                    disabled={newScript.trigger_type === "program_published"}
                    className="w-full border border-[#D9CFE8] rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#693C83] focus:border-transparent transition-shadow disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-sm font-semibold text-[#1E1B4B]">
                      Message
                    </label>
                    <span
                      className={`text-xs ${newScript.message.length > 500 ? "text-red-500" : "text-[#4F4679]"}`}
                    >
                      {newScript.message.length}/500
                    </span>
                  </div>
                  <textarea
                    rows={4}
                    placeholder="Enter notification message..."
                    value={
                      newScript.trigger_type === "program_published"
                        ? 'A new program "{programName}" has been published. Go and explore it and keep learning! 🚀'
                        : newScript.message
                    }
                    onChange={(e) => {
                      const message = e.target.value.slice(0, 500);
                      setNewScript({
                        ...newScript,
                        message,
                      });
                    }}
                    disabled={newScript.trigger_type === "program_published"}
                    className="w-full border border-[#D9CFE8] rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#693C83] focus:border-transparent transition-shadow resize-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                </div>
              </div>
              <div className="relative" ref={audienceDropdownRef}>
                <label className="block text-sm font-semibold text-[#1E1B4B] mb-1.5">
                  Audience
                </label>
                <button
                  type="button"
                  onClick={() => setIsAudienceOpen((prev) => !prev)}
                  className="w-full rounded-xl border border-[#D9CFE8] bg-white p-3 text-left shadow-sm transition hover:border-[#693C83]"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    {selectedRecipients.length === 0 ? (
                      <span className="text-[#9E9AA8]">Select recipients</span>
                    ) : isAllUsersSelected ? (
                      <span className="rounded-full bg-[#F3E7FF] px-3 py-1 text-sm font-medium text-[#693C83]">
                        All Users
                      </span>
                    ) : (
                      <>
                        {selectedRecipients.slice(0, 2).map((recipient) => (
                          <span
                            key={`${recipient.type}-${recipient.value}`}
                            className="rounded-full bg-[#F5F0FF] px-3 py-1 text-sm font-medium text-[#5B3E82]"
                          >
                            {getRecipientLabel(recipient)}
                          </span>
                        ))}
                        {selectedRecipients.length > 2 && (
                          <span className="rounded-full bg-[#F5F0FF] px-3 py-1 text-sm font-medium text-[#5B3E82]">
                            {selectedRecipients.length} selected
                          </span>
                        )}
                      </>
                    )}
                  </div>
                </button>

                {isAudienceOpen && (
                  <div className="absolute z-50 mt-2 w-full rounded-2xl border border-[#D9CFE8] bg-white p-4 shadow-xl">
                    <div className="space-y-3">
                      <div className="rounded-2xl border border-[#ECE5F2] bg-[#F8F5FC] p-3">
                        <input
                          type="text"
                          placeholder="Search users..."
                          value={recipientSearch}
                          onChange={(e) => setRecipientSearch(e.target.value)}
                          className="w-full rounded-xl border border-[#D9CFE8] bg-white px-3 py-2 text-sm outline-none focus:border-[#693C83]"
                        />
                      </div>

                      <div className="space-y-2">
                        {groupOptions.map((option) => {
                          const recipient = {
                            type: option === "All Users" ? "all" : "role",
                            value: option,
                          };
                          const isSelected = isRecipientSelected(recipient);
                          return (
                            <label
                              key={option}
                              className={`flex items-center gap-3 rounded-2xl px-3 py-2 text-sm transition ${
                                option === "All Users"
                                  ? "hover:bg-[#F3F0FF]"
                                  : isAllUsersSelected
                                    ? "cursor-not-allowed opacity-60"
                                    : "hover:bg-[#F3F0FF]"
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                disabled={
                                  option !== "All Users" && isAllUsersSelected
                                }
                                onChange={() =>
                                  handleToggleRecipient(recipient)
                                }
                                className="h-4 w-4 rounded border-[#D9CFE8] text-[#693C83] focus:ring-[#693C83]"
                              />
                              <span>{option}</span>
                            </label>
                          );
                        })}
                      </div>

                      <div className="border-t border-[#E5DDF0] pt-3">
                        <p className="mb-2 text-xs uppercase tracking-[0.18em] text-[#6B6280]">
                          Users
                        </p>
                        <div className="max-h-56 space-y-2 overflow-y-auto pr-2">
                          {users
                            .filter((user) => {
                              const searchTerm = recipientSearch.toLowerCase();
                              const label = getUserLabel(user).toLowerCase();
                              const email = (user.email || "").toLowerCase();
                              return (
                                !searchTerm ||
                                label.includes(searchTerm) ||
                                email.includes(searchTerm)
                              );
                            })
                            .map((user) => {
                              const label = getUserLabel(user);
                              const key = user.user_id || user.id || label;
                              const recipient = {
                                type: "user",
                                value: user.user_id || user.id,
                              };
                              const isSelected = isRecipientSelected(recipient);
                              return (
                                <label
                                  key={key}
                                  className={`flex items-center gap-3 rounded-2xl px-3 py-2 text-sm transition ${
                                    isAllUsersSelected
                                      ? "cursor-not-allowed opacity-60"
                                      : "hover:bg-[#F3F0FF]"
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    disabled={isAllUsersSelected}
                                    onChange={() =>
                                      handleToggleRecipient(recipient)
                                    }
                                    className="h-4 w-4 rounded border-[#D9CFE8] text-[#693C83] focus:ring-[#693C83]"
                                  />
                                  <div>
                                    <div className="font-medium text-[#1E1B4B]">
                                      {label}
                                    </div>
                                    {user.email && (
                                      <div className="text-xs text-[#6B6280]">
                                        {user.email}
                                      </div>
                                    )}
                                  </div>
                                </label>
                              );
                            })}
                          {users.filter((user) => {
                            const searchTerm = recipientSearch.toLowerCase();
                            const label = getUserLabel(user).toLowerCase();
                            const email = (user.email || "").toLowerCase();
                            return (
                              !searchTerm ||
                              label.includes(searchTerm) ||
                              email.includes(searchTerm)
                            );
                          }).length === 0 && (
                            <div className="rounded-2xl border border-dashed border-[#D9CFE8] bg-[#FAF8FF] p-4 text-sm text-[#6B6280]">
                              No users found
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#1E1B4B] mb-1.5">
                  Repeats
                </label>
                <select
                  value={newScript.schedule_type}
                  onChange={(e) =>
                    setNewScript({
                      ...newScript,
                      schedule_type: e.target.value,
                      schedule_date:
                        e.target.value === "Daily"
                          ? ""
                          : newScript.schedule_date,
                    })
                  }
                  className="w-full border border-[#D9CFE8] rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#693C83] focus:border-transparent transition-shadow"
                >
                  <option value="Once">Once</option>
                  <option value="Daily">Daily</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {newScript.schedule_type === "Once" && (
                  <div>
                    <label className="block text-sm font-semibold text-[#1E1B4B] mb-1.5">
                      Schedule Date
                    </label>
                    <div className="relative">
                      <Calendar
                        size={18}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4F4679]"
                      />
                      <input
                        type="date"
                        value={newScript.schedule_date}
                        onChange={(e) =>
                          setNewScript({
                            ...newScript,
                            schedule_date: e.target.value,
                          })
                        }
                        className="w-full pl-10 pr-3 py-3 border border-[#D9CFE8] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#693C83] focus:border-transparent transition-shadow"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-semibold text-[#1E1B4B] mb-1.5">
                    Schedule Time
                  </label>
                  <div className="relative">
                    <Clock
                      size={18}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4F4679]"
                    />
                    <input
                      type="time"
                      value={newScript.schedule_time}
                      onChange={(e) =>
                        setNewScript({
                          ...newScript,
                          schedule_time: e.target.value,
                        })
                      }
                      className="w-full pl-10 pr-3 py-3 border border-[#D9CFE8] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#693C83] focus:border-transparent transition-shadow"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-white px-6 py-4 border-t border-[#E5DDF0] flex justify-end gap-3">
              <button
                onClick={closeModal}
                className="px-6 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                Cancel
              </button>

              <button
                onClick={addScript}
                className="px-6 py-2.5 rounded-xl bg-[#10B981] hover:bg-[#059669] text-white font-medium transition-colors shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#10B981] focus:ring-offset-2"
              >
                {editingScript ? "Update Script" : "Save Script"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setDeleteModal(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3 mb-4">
              <div className="bg-red-50 p-3 rounded-full">
                <Trash2 size={24} className="text-red-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-[#1E1B4B]">
                  Delete Script
                </h3>
                <p className="text-[#4F4679] text-sm mt-1">
                  Are you sure you want to delete this notification script?
                </p>
              </div>
            </div>

            <div className="bg-[#ECE5F2] rounded-xl p-4 mb-4">
              <p className="font-medium text-[#1E1B4B]">
                {deleteModal.script.title}
              </p>
              <p className="text-sm text-[#4F4679] mt-0.5 flex items-center gap-1.5">
                {deleteModal.script.notification_type === "Morning" ? (
                  <Sun size={14} className="text-amber-600" />
                ) : (
                  <Moon size={14} className="text-indigo-600" />
                )}
                {deleteModal.script.notification_type} ·{" "}
                {deleteModal.script.audience}
              </p>
            </div>

            <p className="text-sm text-red-600 mb-6 flex items-start gap-2">
              <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
              This action cannot be undone. The script will be permanently
              removed.
            </p>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteModal(null)}
                className="px-4 py-2 text-sm font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteScript(deleteModal.script)}
                className="px-4 py-2 text-sm font-medium bg-red-600 hover:bg-red-700 text-white rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              >
                Delete Script
              </button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
};

export default NotificationScriptsPage;
