import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  CartesianGrid,
} from "recharts";

const getLast7DaysFallback = () => {
  const result = [];
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    result.push({
      day: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      logins: 0,
      videos: 0,
      quizzes: 0,
      retention: 0,
      application: 0,
    });
  }
  return result;
};

const EngagementChart = ({ data = [] }) => {
  const finalData = Array.isArray(data) && data.length > 0
    ? data.map((d) => ({
        day: d.day || "",
        logins: Number(d.logins) || 0,
        videos: Number(d.videos) || 0,
        quizzes: Number(d.quizzes) || 0,
        retention: Number(d.retention) || 0,
        application: Number(d.application) || 0,
      }))
    : getLast7DaysFallback();

  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={finalData}>
        <CartesianGrid stroke="rgba(167, 139, 250, 0.12)" strokeDasharray="3 3" />

        <XAxis
          dataKey="day"
          stroke="#a78bfa"
          tick={{ fill: "#c4b5fd", fontSize: 11 }}
          axisLine={{ stroke: "rgba(167, 139, 250, 0.2)" }}
        />

        <YAxis
          stroke="#a78bfa"
          tick={{ fill: "#c4b5fd", fontSize: 11 }}
          axisLine={{ stroke: "rgba(167, 139, 250, 0.2)" }}
        />

        <Tooltip
          contentStyle={{
            backgroundColor: "#130f24",
            borderRadius: "14px",
            border: "1px solid rgba(139, 92, 246, 0.4)",
            boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.8), 0 0 15px rgba(139, 92, 246, 0.3)",
            color: "#ffffff",
          }}
          itemStyle={{ color: "#e2e8f0", fontSize: "12px" }}
          labelStyle={{ color: "#a78bfa", fontWeight: "bold", marginBottom: "4px" }}
        />

        <Legend wrapperStyle={{ paddingTop: "8px", fontSize: "12px", color: "#c4b5fd" }} />

        {/* Logins */}
        <Line
          type="monotone"
          dataKey="logins"
          stroke="#A855F7"
          strokeWidth={3}
          dot={{ r: 4 }}
          activeDot={{ r: 6 }}
        />

        {/* Quizzes */}
        <Line
          type="monotone"
          dataKey="quizzes"
          stroke="#22C55E"
          strokeWidth={3}
          dot={{ r: 4 }}
          activeDot={{ r: 6 }}
        />

        {/* Retention Quiz */}
        <Line
          type="monotone"
          dataKey="retention"
          stroke="#F59E0B"
          strokeWidth={3}
          dot={{ r: 4 }}
          activeDot={{ r: 6 }}
        />

        {/* Videos */}
        <Line
          type="monotone"
          dataKey="videos"
          stroke="#3B82F6"
          strokeWidth={3}
          dot={{ r: 4 }}
          activeDot={{ r: 6 }}
        />

        {/* Application */}
        <Line
          type="monotone"
          dataKey="application"
          stroke="#8B5CF6"
          strokeWidth={3}
          dot={{ r: 4 }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default EngagementChart;