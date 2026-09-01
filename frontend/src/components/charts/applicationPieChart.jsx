import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from "recharts";

const data = [
  { name: "Approved", value: 102, color: "#22c55e" },
  { name: "Pending", value: 32, color: "#facc15" },
  { name: "Rejected", value: 22, color: "#ef4444" },
];

const total = data.reduce((sum, item) => sum + item.value, 0);

const ApplicationPieChart = () => {
  return (
    <div className="flex items-center justify-between h-full px-4">

      {/* Pie Chart */}
      <div className="relative w-48 h-48 flex-shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              innerRadius={55}
              outerRadius={80}
              dataKey="value"
              stroke="none"
            >
              {data.map((entry, index) => (
                <Cell
                  key={index}
                  fill={entry.color}
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        {/* Center Text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <h2 className="text-4xl font-bold text-[#1E1B4B]">
            {total}
          </h2>

          <p className="text-slate-400 text-sm">
            Total
          </p>
        </div>
      </div>

      {/* Legend */}
      <div className="space-y-5 w-44">

        {data.map((item) => (
          <div
            key={item.name}
            className="flex items-center justify-between"
          >

            <div className="flex items-center gap-3">
              <div
                className="w-3 h-3 rounded-full"
                style={{
                  backgroundColor: item.color,
                }}
              />

              <span className="text-[#1E1B4B] text-sm">
                {item.name}
              </span>
            </div>

            <span className="text-slate-400 text-sm">
              {item.value} (
              {Math.round(
                (item.value / total) * 100
              )}
              %)
            </span>

          </div>
        ))}

      </div>

    </div>
  );
};

export default ApplicationPieChart;