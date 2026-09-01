const UserEditModal = ({
  user,
  onClose,
  onSave,
  onChange,
  isSaving,
  reportingManagers,
  teamLeaders,
}) => {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#0F172A]/60 p-4 backdrop-blur-sm md:p-6">
      <div className="mx-auto flex min-h-full max-w-2xl items-center justify-center py-6">
        <div className="w-full rounded-3xl border border-[#D9CFE8] bg-white p-6 shadow-2xl shadow-[#1E1B4B]/30">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-[#1E1B4B]">
                Edit User
              </h2>
              <p className="text-sm text-[#4F4679]">
                Update the details and save to the database.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl bg-[#F1ECF7] px-4 py-2 text-sm font-semibold text-[#1E1B4B]"
            >
              Close
            </button>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <label className="text-sm text-[#1E1B4B] md:col-span-2">
              Full Name
              <input
                value={user.full_name}
                onChange={(e) => onChange("full_name", e.target.value)}
                className="mt-2 w-full rounded-2xl border border-[#D9CFE8] bg-[#F8F5FC] px-4 py-3 text-sm outline-none"
                placeholder="e.g. Rahul Sharma"
              />
            </label>

            <label className="text-sm text-[#1E1B4B]">
              Role
              <select
                value={user.role_id}
                onChange={(e) => onChange("role_id", Number(e.target.value))}
                className="mt-2 w-full rounded-2xl border border-[#D9CFE8] bg-[#F8F5FC] px-4 py-3 text-sm outline-none"
              >
                <option value={1}>Master Admin</option>
                <option value={2}>Admin</option>
                <option value={3}>Team Leader</option>
                <option value={4}>Franchise Partner</option>
                <option value={5}>Franchise Employee</option>
                <option value={6}>Franchise Developer</option>
                <option value={7}>Head Office Staff</option>
              </select>
            </label>

            <label className="text-sm text-[#1E1B4B]">
              E-Mail
              <input
                value={user.email}
                onChange={(e) => onChange("email", e.target.value)}
                className="mt-2 w-full rounded-2xl border border-[#D9CFE8] bg-[#F8F5FC] px-4 py-3 text-sm outline-none"
                placeholder="Add e-mail"
              />
            </label>

            <label className="text-sm text-[#1E1B4B]">
              Location
              <input
                value={user.city}
                onChange={(e) => onChange("city", e.target.value)}
                className="mt-2 w-full rounded-2xl border border-[#D9CFE8] bg-[#F8F5FC] px-4 py-3 text-sm outline-none"
                placeholder="Add location details"
              />
            </label>

            <label className="text-sm text-[#1E1B4B]">
              Date Of Joining
              <input
                type="date"
                value={user.date_of_joining}
                onChange={(e) => onChange("date_of_joining", e.target.value)}
                className="mt-2 w-full rounded-2xl border border-[#D9CFE8] bg-[#F8F5FC] px-4 py-3 text-sm outline-none"
              />
            </label>

            <label className="text-sm text-[#1E1B4B]">
              Reporting Manager
              <select
                value={user.reporting_manager || ""}
                onChange={(e) => {
                  const selectedRM = reportingManagers?.find(
                    (tl) => tl.user_id === parseInt(e.target.value),
                  );
                  onChange(
                    "reporting_manager",
                    selectedRM ? selectedRM.full_name : "",
                  );
                }}
                className="mt-2 w-full rounded-2xl border border-[#D9CFE8] bg-[#F8F5FC] px-4 py-3 text-sm outline-none"
              >
                <option value="">Select Reporting Manager</option>
                {reportingManagers?.map((tl) => (
                  <option key={tl.user_id} value={tl.user_id}>
                    {tl.full_name}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-sm text-[#1E1B4B]">
              Team Leader
              <select
                value={user.Team_Leader_id || ""}
                onChange={(e) => onChange("Team_Leader_id", e.target.value)}
                className="mt-2 w-full rounded-2xl border border-[#D9CFE8] bg-[#F8F5FC] px-4 py-3 text-sm outline-none"
              >
                <option value="">Select Team Leader</option>
                {teamLeaders?.map((tl) => (
                  <option key={tl.user_id} value={tl.user_id}>
                    {tl.full_name}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-sm text-[#1E1B4B] md:col-span-2">
              New Password (optional)
              <input
                type="password"
                value={user.password}
                onChange={(e) => onChange("password", e.target.value)}
                className="mt-2 w-full rounded-2xl border border-[#D9CFE8] bg-[#F8F5FC] px-4 py-3 text-sm outline-none"
                placeholder="Leave blank to keep current password"
              />
            </label>

            <button
              type="button"
              onClick={onSave}
              disabled={isSaving}
              className="rounded-2xl bg-[#693C83] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-[#693C83]/20 transition hover:bg-[#5A3270] disabled:cursor-not-allowed disabled:opacity-60 md:col-span-2"
            >
              {isSaving ? "Saving..." : "Update user"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserEditModal;
