import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";

const data = [
  {
    week: "W1",
    attendance: 85,
    progress: 20,
  },
  {
    week: "W2",
    attendance: 90,
    progress: 40,
  },
  {
    week: "W3",
    attendance: 95,
    progress: 60,
  },
  {
    week: "W4",
    attendance: 98,
    progress: 82,
  },
];

const EmployeeProgressChart = () => {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <ComposedChart
        data={data}
        margin={{
          top: 10,
          right: 20,
          left: 0,
          bottom: 0,
        }}
      >
        <CartesianGrid
          strokeDasharray="3 3"
          opacity={0.2}
        />

        <XAxis dataKey="week" />

        <YAxis />

        <Tooltip />

        <Legend />

        <Bar
          dataKey="attendance"
          name="Attendance %"
          fill="#10B981"
          radius={[8, 8, 0, 0]}
        />

        <Line
          type="monotone"
          dataKey="progress"
          name="Learning Progress %"
          stroke="#693C83"
          strokeWidth={4}
          dot={{
            r: 6,
            fill: "#693C83",
          }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
};

export default EmployeeProgressChart;