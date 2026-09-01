import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from "recharts";

const data = [
  { name: "Mumbai", progress: 92, fill: "#22C55E" },
  { name: "Pune", progress: 78, fill: "#F59E0B" },
  { name: "Nagpur", progress: 85, fill: "#3B82F6" },
  { name: "Nashik", progress: 65, fill: "#EF4444" },
  { name: "Thane", progress: 88, fill: "#8B5CF6" },
];

const TeamPerformanceChart = () => {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={data}
        margin={{
          top: 20,
          right: 20,
          left: 0,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />

        <XAxis dataKey="name" />

        <YAxis domain={[0, 100]} />

        <Tooltip />

        <Bar
          dataKey="progress"
          radius={[8, 8, 0, 0]}
        >
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={entry.fill}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};

export default TeamPerformanceChart;