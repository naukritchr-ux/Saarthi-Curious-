import { Calendar, Edit3, Eye } from "lucide-react";
import { statusStyles } from "../utils/userUtils";

const UserTable = ({ users, onAction, canEditUser = true }) => {
  return (
    <table className="min-w-full divide-y divide-[#E6DDF3]/60 text-left text-sm">
      <thead className="sticky top-[0px] z-30 bg-[#F6F2FB] text-[#4F4679]">
        <tr>
          <th className="px-4 py-3 font-semibold">User</th>
          <th className="px-4 py-3 font-semibold">Role</th>
          <th className="px-4 py-3 font-semibold">Franchise Partner</th>
          <th className="px-4 py-3 font-semibold">Last Login</th>
          <th className="px-4 py-3 font-semibold">Activity</th>
          <th className="px-4 py-3 font-semibold">Actions</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-[#E6DDF3]/60">
        {users.map((user) => (
          <tr key={user.id} className="hover:bg-[#F8F5FC] transition-colors">
            <td className="px-4 py-5">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#ECE5F2] text-sm font-bold text-[#693C83]">
                  {user.name
                    .split(" ")
                    .map((part) => part[0])
                    .join("")}
                </div>
                <div>
                  <p className="font-semibold">{user.name}</p>
                  <p className="text-xs text-[#4F4679] opacity-70">
                    {user.email.length > 27
                      ? user.email.slice(0, 27) + "..."
                      : user.email}
                  </p>
                </div>
              </div>
            </td>
            <td className="px-4 py-5">{user.role}</td>
            <td className="px-4 py-5">{user.franchise_partner || "-"}</td>
            <td className="px-4 py-5">
              <div className="flex items-center gap-2 text-[#4F4679]">
                <Calendar size={16} />
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
              </div>
            </td>
            <td className="px-4 py-5">
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[user.activity]}`}
              >
                {user.activity}
              </span>
            </td>
            <td className="px-4 py-5">
              <div className="flex flex-wrap gap-2">
                {canEditUser && (
                  <button
                    type="button"
                    onClick={() => onAction("edit", user)}
                    className="inline-flex items-center gap-1 rounded-lg border border-[#D9CFE8] bg-white px-2.5 py-1.5 text-xs font-semibold text-[#1E1B4B] hover:bg-[#F6F2FB]"
                  >
                    <Edit3 size={13} /> Edit
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onAction("info", user)}
                  className="inline-flex items-center gap-1 rounded-lg border border-[#D9CFE8] bg-white px-2.5 py-1.5 text-xs font-semibold text-[#1E1B4B] hover:bg-[#F6F2FB]"
                >
                  <Eye size={13} />
                </button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default UserTable;
