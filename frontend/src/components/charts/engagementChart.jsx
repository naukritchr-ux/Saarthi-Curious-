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

const defaultData = [
  {
    day: "May 1",
    logins: 400,
    videos: 280,
    quizzes: 150,
    retention: 90,
    application: 50,


  },
  {
    day: "May 5",
    logins: 760,
    videos: 480,
    quizzes: 250,
    retention: 180,
    application: 120,


  },
  {
    day: "May 9",
    logins: 700,
    videos: 500,
    quizzes: 270,
    retention: 220,
    application: 150,


  },
  {
    day: "May 13",
    logins: 980,
    videos: 650,
    quizzes: 330,
    retention: 280,
    application: 200,

  },
  {
    day: "May 17",
    logins: 830,
    videos: 620,
    quizzes: 350,
    retention: 310,
    application: 180,


  },
  {
    day: "May 19",
    logins: 920,
    videos: 710,
    quizzes: 400,
    retention: 360,
    application: 250,

  },
];

const EngagementChart = ({ data = [] }) => {
  const chartData = Array.isArray(data) ? data : [];

  const hasExpectedKeys = Array.isArray(chartData)
    && chartData.length > 0
    && ["day", "logins", "videos", "quizzes", "retention", "application"].every(
      (key) => Object.prototype.hasOwnProperty.call(chartData[0], key),
    );

  const finalData = hasExpectedKeys ? chartData : defaultData;

  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={finalData}>
        <CartesianGrid stroke="#cfc6dd" />

        <XAxis
          dataKey="day"
          stroke="#94a3b8"
        />

        <YAxis
          stroke="#94a3b8"
        />

        <Tooltip
          contentStyle={{
            backgroundColor: "#ffffff",
            borderRadius: "12px",
            border: "1px solid #d1d5db",
          }}
        />

        <Legend />

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