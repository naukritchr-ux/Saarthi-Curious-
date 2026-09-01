const DashboardCard = ({
  title,
  children,
  className = "",
}) => {
  return (
    <div
      className={`bg-white rounded-xl p-6 shadow-sm ${className}`}
    >
      {title && (
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[#1E1B4B] text-lg font-semibold">
            {title}
          </h3>
        </div>
      )}

      {children}
    </div>
  );
};

export default DashboardCard;