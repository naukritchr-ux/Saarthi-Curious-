import { Plus } from "lucide-react";

const UserHeader = ({ onAddUser, canAddUser = true, title = "User Management", description = "Review workforce groups, apply role filters, and open a full-screen overview for every user." }) => {
  return (
    <header className="rounded-3xl bg-gradient-to-r from-[#1E1B4B] via-[#3F2B6D] to-[#693C83] p-6 text-white shadow-xl md:p-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="mt-3 text-3xl font-semibold md:text-4xl">
            {title}
          </h1>
          <p className="mt-3 max-w-2xl text-[#F1ECF7] text-sm md:text-base">
            {description}
          </p>
        </div>
        {canAddUser && (
          <button
            type="button"
            onClick={onAddUser}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#10B981] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-[#10B981]/20 transition hover:bg-[#059669]"
          >
            <Plus className="h-4 w-4" />
            Add User
          </button>
        )}
      </div>
    </header>
  );
};

export default UserHeader;
