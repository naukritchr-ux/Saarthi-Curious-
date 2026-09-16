const CreateUserPanel = ({
  onClose,
  onSave,
  formState,
  reportingManagers,
  teamLeaders,
  roles,
}) => {
  const {
    fullName,
    setFullName,
    email,
    setEmail,
    emailError,
    setEmailError,
    password,
    setPassword,
    city,
    setCity,
    reportingManagerId,
    setReportingManagerId,
    setReportingManager,
    teamLeaderId,
    setTeamLeaderId,
    roleId,
    setRoleId,
    dateOfJoining,
    setDateOfJoining,
  } = formState;

  // Check if role is one of the standard 7 roles
  const isStandardRole = [1, 2, 3, 4, 5, 6, 7].includes(roleId);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#0F172A]/60 p-4 backdrop-blur-sm md:p-6">
      <div className="mx-auto flex min-h-full max-w-2xl items-center justify-center py-6">
        <div className="w-full rounded-3xl border border-[#D9CFE8] bg-white p-6 shadow-2xl shadow-[#1E1B4B]/30">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-[#1E1B4B]">Create User</h2>
              <p className="text-sm text-[#4F4679]">
                Admin setup panel for new Users.
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
              Enter Full Name
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-xl border border-[#D9CFE8] p-3"
                placeholder="e.g. Rahul Sharma"
              />
            </label>

            <label className="text-sm text-[#1E1B4B]">
              Role
              <select
                value={roleId}
                onChange={(e) => setRoleId(Number(e.target.value))}
                className="mt-2 w-full rounded-2xl border border-[#D9CFE8] bg-[#F8F5FC] px-4 py-3 text-sm outline-none"
              >
                {roles?.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.role_name}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-sm text-[#1E1B4B]">
              E-Mail
              <input
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setEmailError("");
                }}
                className={`mt-2 w-full rounded-2xl bg-[#F8F5FC] px-4 py-3 text-sm outline-none border ${
                  emailError ? "border-red-500" : "border-[#D9CFE8]"
                }`}
                placeholder="Add e-mail"
              />
              {emailError && (
                <p className="mt-1 text-sm text-red-500">{emailError}</p>
              )}
            </label>

            <label className="text-sm text-[#1E1B4B]">
              Password
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-2 w-full rounded-2xl border border-[#D9CFE8] bg-[#F8F5FC] px-4 py-3 text-sm outline-none"
                placeholder="Add password"
              />
            </label>

            <label className="text-sm text-[#1E1B4B]">
              Location
              <input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="mt-2 w-full rounded-2xl border border-[#D9CFE8] bg-[#F8F5FC] px-4 py-3 text-sm outline-none"
                placeholder="Add location details"
              />
            </label>

            <label className="text-sm text-[#1E1B4B]">
              Date Of Joining
              <input
                type="date"
                value={dateOfJoining}
                onChange={(e) => setDateOfJoining(e.target.value)}
                className="mt-2 w-full rounded-2xl border border-[#D9CFE8] bg-[#F8F5FC] px-4 py-3 text-sm outline-none"
              />
            </label>

            {isStandardRole && (
              <label className="text-sm text-[#1E1B4B]">
                Reporting Manager
                <select
                  value={reportingManagerId}
                  onChange={(e) => {
                    setReportingManagerId(e.target.value);
                    const selectedRM = reportingManagers?.find(
                      (tl) => tl.user_id === parseInt(e.target.value),
                    );
                    setReportingManager(selectedRM ? selectedRM.full_name : "");
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
            )}

            {isStandardRole && (
              <label className="text-sm text-[#1E1B4B]">
                Team Leader
                <select
                  value={teamLeaderId}
                  onChange={(e) => setTeamLeaderId(e.target.value)}
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
            )}

            <button
              type="button"
              onClick={onSave}
              className="rounded-2xl bg-[#10B981] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-[#10B981]/20 md:col-span-2"
            >
              Save user
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateUserPanel;
