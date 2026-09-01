import { ArrowLeft, Building2, Users, CheckCircle, Loader2 } from "lucide-react";
import { statusStyles } from "../utils/userUtils";
import { useState } from "react";
import api from "../../../../utils/axios";

const UserDetailModal = ({ user, onClose, onSelectUser }) => {
  const [showProgramCompleteModal, setShowProgramCompleteModal] = useState(false);
  const [loadingPrograms, setLoadingPrograms] = useState(false);
  const [programs, setPrograms] = useState([]);
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [completingProgram, setCompletingProgram] = useState(false);
  const [completionMessage, setCompletionMessage] = useState(null);

  const currentRoleId = parseInt(localStorage.getItem("role_id") || "1");
  const canCompletePrograms = [1, 2].includes(currentRoleId);

  const fetchPrograms = async () => {
    try {
      setLoadingPrograms(true);
      const response = await api.get("/programs");
      const publishedPrograms = response.data.filter(
        (program) => program.status === "Published"
      );
      setPrograms(publishedPrograms);
    } catch (error) {
      console.error("Error fetching programs:", error);
    } finally {
      setLoadingPrograms(false);
    }
  };

  const handleCompleteProgram = async () => {
    if (!selectedProgram) return;

    try {
      setCompletingProgram(true);
      const actorId = localStorage.getItem("user_Id");
      const actorName = localStorage.getItem("user_name");

      const response = await api.post(
        `/users/${user.id}/complete-program/${selectedProgram.id}`,
        null,
        {
          params: {
            actor_id: actorId,
            actor_name: actorName,
          },
        }
      );

      setCompletionMessage({
        type: "success",
        text: response.data.message,
      });
      setTimeout(() => {
        setShowProgramCompleteModal(false);
        setCompletionMessage(null);
        setSelectedProgram(null);
        onClose(); // Close the detail modal to refresh data
      }, 2000);
    } catch (error) {
      console.error("Error completing program:", error);
      setCompletionMessage({
        type: "error",
        text: error.response?.data?.detail || "Failed to complete program",
      });
    } finally {
      setCompletingProgram(false);
    }
  };

  const openProgramCompleteModal = () => {
    setShowProgramCompleteModal(true);
    setCompletionMessage(null);
    setSelectedProgram(null);
    fetchPrograms();
  };
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#0F172A]/60 p-4 backdrop-blur-sm md:p-6">
      <div className="mx-auto flex min-h-full max-w-6xl items-center justify-center py-6">
        <div className="w-full max-h-[calc(100vh-48px)] flex flex-col rounded-3xl border border-white/10 bg-white shadow-2xl shadow-[#1E1B4B]/30 overflow-hidden">
          <div className="border-b border-[#E6DDF3] bg-[#F7F3FB] p-5 md:p-6 flex-shrink-0">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="space-y-2 min-w-0 flex-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex items-center gap-2 rounded-full border border-[#D9CFE8] bg-white px-3 py-2 text-sm font-semibold text-[#1E1B4B] shadow-sm shadow-black/5 hover:bg-[#F6F2FB]"
                >
                  <ArrowLeft size={15} /> Back
                </button>
                <div className="min-w-0">
                  <p className="text-xs uppercase tracking-[0.35em] text-[#693C83]">
                    Full-screen insight
                  </p>
                  <h2 className="text-2xl font-bold text-[#1E1B4B] md:text-3xl truncate">
                    {user.name}
                  </h2>
                  <p className="text-sm text-[#4F4679] truncate">
                    {user.role} • {user.Reporting_Manager}
                  </p>
                </div>
              </div>
              <div className="rounded-2xl border border-[#D9CFE8] bg-white p-4 shadow-sm shadow-black/5 md:min-w-[260px] flex-shrink-0">
                <div className="flex items-center justify-between text-sm text-[#4F4679]">
                  <span>Activity</span>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[user.activity]}`}
                  >
                    {user.activity}
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-between text-sm text-[#4F4679]">
                  <span>Location</span>
                  <span className="font-semibold text-[#1E1B4B] truncate ml-2">
                    {user.location}
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-between text-sm text-[#4F4679]">
                  <span>Last seen</span>
                  <span className="font-semibold text-[#1E1B4B] truncate ml-2">
                    {user.last_login
                      ? `${new Date(user.last_login).toLocaleDateString(
                          "en-GB",
                          {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          },
                        )} | ${new Date(
                          user.last_login,
                        ).toLocaleTimeString("en-US", {
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: true,
                        })}`
                      : "Never"}
                  </span>
                </div>
                {canCompletePrograms && (
                  <button
                    type="button"
                    onClick={openProgramCompleteModal}
                    className="mt-4 w-full rounded-xl bg-[#693C83] px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-black/5 transition hover:bg-[#5a2e6e] flex items-center justify-center gap-2"
                  >
                    <CheckCircle size={16} />
                    Complete Program
                  </button>
                )}
              </div>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-5 md:p-6">
            <div className="grid gap-6 md:grid-cols-[1fr_0.9fr]">
              <section className="space-y-4 rounded-3xl border border-[#E6DDF3] bg-white p-5 shadow-sm shadow-black/5">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-[#ECE5F2] p-3 text-[#693C83]">
                    <Building2 size={18} />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.35em] text-[#693C83]">
                      Profile details
                    </p>
                    <h3 className="text-xl font-semibold text-[#1E1B4B]">
                      Primary information
                    </h3>
                  </div>
                </div>
                <dl className="grid gap-3 text-sm text-[#4F4679] sm:grid-cols-2">
                  <div className="rounded-2xl border border-[#E6DDF3] bg-[#FAF8FD] p-4">
                    <dt className="text-xs uppercase tracking-[0.25em]">
                      Email
                    </dt>
                    <dd className="mt-2 font-semibold text-[#1E1B4B]">
                      {user.email}
                    </dd>
                  </div>
                  <div className="rounded-2xl border border-[#E6DDF3] bg-[#FAF8FD] p-4">
                    <dt className="text-xs uppercase tracking-[0.25em]">
                      Phone
                    </dt>
                    <dd className="mt-2 font-semibold text-[#1E1B4B]">
                      {user.phone || "N/A"}
                    </dd>
                  </div>
                  <div className="rounded-2xl border border-[#E6DDF3] bg-[#FAF8FD] p-4">
                    <dt className="text-xs uppercase tracking-[0.25em]">
                      Manager
                    </dt>
                    <dd className="mt-2 font-semibold text-[#1E1B4B]">
                      {user.manager || "Self-managed"}
                    </dd>
                  </div>
                  <div className="rounded-2xl border border-[#E6DDF3] bg-[#FAF8FD] p-4">
                    <dt className="text-xs uppercase tracking-[0.25em]">
                      Role
                    </dt>
                    <dd className="mt-2 font-semibold text-[#1E1B4B]">
                      {user.role}
                    </dd>
                  </div>
                </dl>
                <div className="rounded-2xl border border-[#E6DDF3] bg-[#FAF8FD] p-4 text-sm text-[#4F4679]">
                  <p className="text-xs uppercase tracking-[0.25em] text-[#693C83]">
                    Reporting Manager
                  </p>
                  <p className="mt-2 text-[#1E1B4B]">
                    {user.Reporting_Manager}
                  </p>
                </div>
              </section>
              <section className="space-y-4 rounded-3xl border border-[#E6DDF3] bg-white p-5 shadow-sm shadow-black/5">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-[#ECE5F2] p-3 text-[#693C83]">
                    <Users size={18} />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.35em] text-[#693C83]">
                      Connected members
                    </p>
                    <h3 className="text-xl font-semibold text-[#1E1B4B]">
                      Related users
                    </h3>
                  </div>
                </div>
                {user.role === "Team Leader" &&
                user.children?.length ? (
                  <div className="space-y-3">
                    {user.children.map((child) => (
                      <button
                        key={child.id}
                        type="button"
                        onClick={() => onSelectUser(child)}
                        className="w-full rounded-2xl border border-[#E6DDF3] bg-[#FAF8FD] p-4 text-left shadow-sm shadow-black/5 transition hover:border-[#693C83] hover:bg-white"
                      >
                        <p className="text-sm font-semibold text-[#1E1B4B]">
                          {child.name}
                        </p>
                        <p className="mt-1 text-xs text-[#4F4679]">
                          {child.role} • {child.location}
                        </p>
                        <p className="mt-2 text-xs text-[#693C83]">
                          Open nested franchise partner detail.
                        </p>
                      </button>
                    ))}
                  </div>
                ) : user.role === "Franchise Partner" &&
                  user.children?.length ? (
                  <div className="space-y-3">
                    {user.children.map((child) => (
                      <button
                        key={child.id}
                        type="button"
                        onClick={() => onSelectUser(child)}
                        className="w-full rounded-2xl border border-[#E6DDF3] bg-[#FAF8FD] p-4 text-left shadow-sm shadow-black/5 transition hover:border-[#693C83] hover:bg-white"
                      >
                        <p className="text-sm font-semibold text-[#1E1B4B]">
                          {child.name}
                        </p>
                        <p className="mt-1 text-xs text-[#4F4679]">
                          {child.role} • {child.location}
                        </p>
                        <p className="mt-2 text-xs text-[#693C83]">
                          Open nested employee detail.
                        </p>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-[#D9CFE8] bg-[#FAF8FD] p-5 text-sm text-[#4F4679]">
                    This role currently has no nested members in the
                    drill-down view.
                  </div>
                )}
              </section>
            </div>
          </div>
        </div>
      </div>

      {/* Program Completion Modal */}
      {showProgramCompleteModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-[#0F172A]/60 p-4 backdrop-blur-sm">
          <div className="flex min-h-full items-center justify-center">
            <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white shadow-2xl shadow-[#1E1B4B]/30">
              <div className="border-b border-[#E6DDF3] bg-[#F7F3FB] p-5">
                <h3 className="text-xl font-bold text-[#1E1B4B]">
                  Complete Program Manually
                </h3>
                <p className="mt-2 text-sm text-[#4F4679]">
                  Select a program to mark as complete for {user.name}
                </p>
              </div>

              <div className="p-5">
                {completionMessage && (
                  <div
                    className={`mb-4 rounded-xl p-3 ${
                      completionMessage.type === "success"
                        ? "bg-[#10B981]/10 text-[#10B981]"
                        : "bg-[#EF4444]/10 text-[#EF4444]"
                    }`}
                  >
                    <p className="text-sm font-medium">{completionMessage.text}</p>
                  </div>
                )}

                {loadingPrograms ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-[#693C83]" />
                  </div>
                ) : (
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {programs.length === 0 ? (
                      <p className="text-center text-sm text-[#4F4679] py-4">
                        No published programs available
                      </p>
                    ) : (
                      programs.map((program) => (
                        <button
                          key={program.id}
                          type="button"
                          onClick={() => setSelectedProgram(program)}
                          className={`w-full rounded-xl border p-4 text-left transition ${
                            selectedProgram?.id === program.id
                              ? "border-[#693C83] bg-[#ECE5F2]"
                              : "border-[#D9CFE8] bg-white hover:border-[#693C83]"
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="font-semibold text-[#1E1B4B]">
                                {program.name}
                              </p>
                              <p className="mt-1 text-xs text-[#4F4679]">
                                {program.category} 
                              </p>
                            </div>
                            {selectedProgram?.id === program.id && (
                              <CheckCircle
                                className="h-5 w-5 text-[#693C83] flex-shrink-0"
                              />
                            )}
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                )}

                {selectedProgram && (
                  <div className="mt-4 rounded-xl bg-[#ECE5F2] p-3">
                    <p className="text-xs text-[#4F4679]">
                      <span className="font-semibold">Curos to award:</span>{" "}
                      {selectedProgram.curos || 0}
                    </p>
                    <p className="mt-1 text-xs text-[#4F4679]">
                      This will mark all modules, quizzes, retention quiz, and
                      application checks as completed.
                    </p>
                  </div>
                )}
              </div>

              <div className="border-t border-[#E6DDF3] bg-[#F7F3FB] p-5 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowProgramCompleteModal(false)}
                  className="flex-1 rounded-xl border border-[#D9CFE8] bg-white px-4 py-2.5 text-sm font-semibold text-[#1E1B4B] shadow-sm shadow-black/5 transition hover:bg-[#F6F2FB]"
                  disabled={completingProgram}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCompleteProgram}
                  disabled={!selectedProgram || completingProgram}
                  className="flex-1 rounded-xl bg-[#693C83] px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-black/5 transition hover:bg-[#5a2e6e] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {completingProgram ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Completing...
                    </>
                  ) : (
                    <>
                      <CheckCircle size={16} />
                      Complete Program
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Program Completion Modal */}
      {showProgramCompleteModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-[#0F172A]/60 p-4 backdrop-blur-sm">
          <div className="flex min-h-full items-center justify-center">
            <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white shadow-2xl shadow-[#1E1B4B]/30">
              <div className="border-b border-[#E6DDF3] bg-[#F7F3FB] p-5">
                <h3 className="text-xl font-bold text-[#1E1B4B]">
                  Complete Program Manually
                </h3>
                <p className="mt-2 text-sm text-[#4F4679]">
                  Select a program to mark as complete for {user.name}
                </p>
              </div>

              <div className="p-5">
                {completionMessage && (
                  <div
                    className={`mb-4 rounded-xl p-3 ${
                      completionMessage.type === "success"
                        ? "bg-[#10B981]/10 text-[#10B981]"
                        : "bg-[#EF4444]/10 text-[#EF4444]"
                    }`}
                  >
                    <p className="text-sm font-medium">{completionMessage.text}</p>
                  </div>
                )}

                {loadingPrograms ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-[#693C83]" />
                  </div>
                ) : (
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {programs.length === 0 ? (
                      <p className="text-center text-sm text-[#4F4679] py-4">
                        No published programs available
                      </p>
                    ) : (
                      programs.map((program) => (
                        <button
                          key={program.id}
                          type="button"
                          onClick={() => setSelectedProgram(program)}
                          className={`w-full rounded-xl border p-4 text-left transition ${
                            selectedProgram?.id === program.id
                              ? "border-[#693C83] bg-[#ECE5F2]"
                              : "border-[#D9CFE8] bg-white hover:border-[#693C83]"
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="font-semibold text-[#1E1B4B]">
                                {program.name}
                              </p>
                              <p className="mt-1 text-xs text-[#4F4679]">
                                {program.category} 
                              </p>
                            </div>
                            {selectedProgram?.id === program.id && (
                              <CheckCircle
                                className="h-5 w-5 text-[#693C83] flex-shrink-0"
                              />
                            )}
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                )}

                {selectedProgram && (
                  <div className="mt-4 rounded-xl bg-[#ECE5F2] p-3">
                    <p className="text-xs text-[#4F4679]">
                      <span className="font-semibold">Program curos:</span>{" "}
                      {selectedProgram.curos || 0}
                    </p>
                    <p className="mt-1 text-xs text-[#4F4679]">
                      <span className="font-semibold">Module curos:</span>{" "}
                      {selectedProgram.modules?.reduce((sum, module) => sum + (module.curos || 0), 0) || 0}
                    </p>
                    <p className="mt-1 text-xs text-[#4F4679]">
                      <span className="font-semibold">Total curos to award:</span>{" "}
                      {(selectedProgram.curos || 0) + (selectedProgram.modules?.reduce((sum, module) => sum + (module.curos || 0), 0) || 0)}
                    </p>
                    <p className="mt-2 text-xs text-[#4F4679]">
                      This will mark all modules, quizzes, retention quiz, and
                      application checks as completed.
                    </p>
                  </div>
                )}
              </div>

              <div className="border-t border-[#E6DDF3] bg-[#F7F3FB] p-5 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowProgramCompleteModal(false)}
                  className="flex-1 rounded-xl border border-[#D9CFE8] bg-white px-4 py-2.5 text-sm font-semibold text-[#1E1B4B] shadow-sm shadow-black/5 transition hover:bg-[#F6F2FB]"
                  disabled={completingProgram}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCompleteProgram}
                  disabled={!selectedProgram || completingProgram}
                  className="flex-1 rounded-xl bg-[#693C83] px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-black/5 transition hover:bg-[#5a2e6e] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {completingProgram ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Completing...
                    </>
                  ) : (
                    <>
                      <CheckCircle size={16} />
                      Complete Program
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDetailModal;
