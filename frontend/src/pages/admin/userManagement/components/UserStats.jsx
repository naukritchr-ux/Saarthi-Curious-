const UserStats = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
      {stats.map((item) => {
        const Icon = item.icon;
        return (
          <article
            key={item.label}
            className="rounded-2xl border border-[#D9CFE8] bg-white p-4 shadow-md shadow-black/5"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-base min-h-[3.5rem] text-[#4F4679]">
                  {item.label}
                </p>
                <p className="mt-2 text-3xl font-black text-[#1E1B4B]">
                  {item.value}
                </p>
              </div>
              <div
                className={`rounded-xl bg-gradient-to-br ${item.accent} p-2.5 text-white`}
              >
                <Icon size={16} />
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
};

export default UserStats;
