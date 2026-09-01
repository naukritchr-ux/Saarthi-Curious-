import { Search, Activity, MapPin, ShieldCheck } from "lucide-react";
import { activityOptions } from "../utils/userUtils";

const UserFilters = ({
  query,
  setQuery,
  activity,
  setActivity,
  location,
  setLocation,
  locations,
  selectedTeamLeaderFilter,
  setSelectedTeamLeaderFilter,
  teamLeaders,
}) => {
  return (
    <div className="space-y-3">
      <label className="flex items-center gap-3 rounded-2xl border border-[#D9CFE8] bg-white px-4 py-3">
        <Search size={16} className="text-[#693C83]" />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by name, email, Reporting Manager or location"
          className="w-full bg-transparent outline-none text-sm"
        />
      </label>

      <div className="flex flex-wrap gap-3">
        <label className="flex min-w-fit items-center gap-2 rounded-2xl border border-[#D9CFE8] bg-white px-4 py-3 text-sm text-[#1E1B4B] shadow-sm shadow-black/5">
          <Activity size={15} className="text-[#693C83]" />
          <select
            value={activity}
            onChange={(event) => setActivity(event.target.value)}
            className="w-auto border-none bg-transparent text-sm outline-none pr-2"
          >
            {activityOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <label className="flex min-w-fit items-center gap-2 rounded-2xl border border-[#D9CFE8] bg-white px-4 py-3 text-sm text-[#1E1B4B] shadow-sm shadow-black/5">
          <MapPin size={15} className="text-[#693C83]" />
          <select
            value={location}
            onChange={(event) => setLocation(event.target.value)}
            className="w-auto border-none bg-transparent text-sm outline-none pr-2"
          >
            {locations.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <label className="flex min-w-fit items-center gap-2 rounded-2xl border border-[#D9CFE8] bg-white px-4 py-3 text-sm text-[#1E1B4B] shadow-sm shadow-black/5">
          <ShieldCheck size={15} className="text-[#693C83]" />
          <select
            value={selectedTeamLeaderFilter}
            onChange={(event) => setSelectedTeamLeaderFilter(event.target.value)}
            className="w-auto border-none bg-transparent text-sm outline-none pr-2"
          >
            <option value="All">All Team Leaders</option>
            {teamLeaders?.map((tl) => (
              <option key={tl.user_id} value={tl.user_id}>
                {tl.full_name}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
};

export default UserFilters;
