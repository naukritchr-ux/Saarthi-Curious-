import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

const roleColorMap = {
  "Franchise Employee": "#22C55E",
  "Franchise Partner": "#FACC15",
  "Team Leader": "#3B82F6",
  "Admin": "#EF4444",
  "Franchise Developer": "#EC4899",
  "Head Office Staff": "#14B8A6",
};

const formatNumber = (num) => {
  if (!num) return "0";
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

const UserDistribution = ({ data = [] }) => {
  // Transform backend data to chart format, excluding Master Admins when role labels are present.
  const chartData = data
    .filter(
      (item) =>
        item.display_name !== "Master Admins" &&
        item.role_name !== "Master Admins",
    )
    .map((item) => ({
      name: item.display_name || item.role_name || item.name || "Unknown",
      value: item.count ?? item.value ?? 0,
      color:
        roleColorMap[item.display_name] ||
        roleColorMap[item.role_name] ||
        "#6B7280",
    }));

  // Calculate total users
  const totalUsers = chartData.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="bg-[#ECE5F2] rounded-lg p-4">
      <div className="h-56">
        <ResponsiveContainer width="100%" height={224}>
          <PieChart>
            <Pie
              data={chartData}
              innerRadius={60}
              outerRadius={90}
              dataKey="value"
              paddingAngle={2}
            >
              {chartData.map((entry, index) => (
                <Cell key={index} fill={entry.color} />
              ))}
            </Pie>

            <text
              x="50%"
              y="48%"
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-[#1E1B4B] font-bold"
              fontSize="28"
            >
              {totalUsers.toLocaleString()}
            </text>

            <text
              x="50%"
              y="58%"
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-[#4F4679]"
              fontSize="14"
            >
              Total Users
            </text>

            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="space-y-3 mt-4">
        {chartData.map((item) => (
          <div key={item.name} className="flex justify-between">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: item.color }}
              ></div>
              <span>{item.name}</span>
            </div>
            <span>{formatNumber(item.value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UserDistribution;
