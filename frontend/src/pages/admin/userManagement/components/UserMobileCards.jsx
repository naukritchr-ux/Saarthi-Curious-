import { Eye, Edit3 } from "lucide-react";
import { statusStyles } from "../utils/userUtils";

const UserMobileCards = ({ users, onAction, canEditUser = true }) => {
  return (
    <>
      {users.map((user) => (
        <article
          key={user.id}
          className="rounded-2xl border border-[#D9CFE8] bg-white p-4 shadow-sm shadow-black/5"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#ECE5F2] text-sm font-bold text-[#693C83]">
                {user.name
                  .split(" ")
                  .map((part) => part[0])
                  .join("")}
              </div>
              <div>
                <p className="font-semibold text-[#1E1B4B]">{user.name}</p>
                <p className="text-xs text-[#4F4679]">{user.email}</p>
              </div>
            </div>
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[user.activity]}`}
            >
              {user.activity}
            </span>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-[#4F4679]">
            <span className="rounded-full bg-[#F1ECF7] px-2.5 py-1">
              {user.role}
            </span>
            <span className="rounded-full bg-[#F1ECF7] px-2.5 py-1">
              {user.franchise_partner || "-"}
            </span>
            <span className="rounded-full bg-[#F1ECF7] px-2.5 py-1">
              {user.Reporting_Manager}
            </span>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onAction("info", user)}
              className="inline-flex items-center gap-1 rounded-lg border border-[#D9CFE8] bg-white px-2.5 py-1.5 text-xs font-semibold text-[#1E1B4B] hover:bg-[#F6F2FB]"
            >
              <Eye size={13} /> Info
            </button>
            {canEditUser && (
              <button
                type="button"
                onClick={() => onAction("edit", user)}
                className="inline-flex items-center gap-1 rounded-lg border border-[#D9CFE8] bg-white px-2.5 py-1.5 text-xs font-semibold text-[#1E1B4B] hover:bg-[#F6F2FB]"
              >
                <Edit3 size={13} /> Edit
              </button>
            )}
          </div>
        </article>
      ))}
    </>
  );
};

export default UserMobileCards;
