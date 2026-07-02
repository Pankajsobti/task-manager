import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { useTheme } from "../context/ThemeContext";

// ── helpers ────────────────────────────────────────────────────────────────
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

async function fetchAnalytics(boardId) {
  const res = await fetch(`${API_BASE}/api/analytics/${boardId}`);
  if (!res.ok) throw new Error("Failed to fetch analytics");
  const json = await res.json();
  return json.data;
}

// ── sub-components ─────────────────────────────────────────────────────────
function StatCard({ label, value, accent, icon }) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 p-5 flex items-center gap-4">
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center text-xl shrink-0"
        style={{ background: accent + "18", color: accent }}
      >
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900 dark:text-slate-100 leading-none">{value}</p>
        <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">{label}</p>
      </div>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-xl shadow-lg px-4 py-2 text-sm">
      <p className="font-semibold text-gray-700 dark:text-slate-200">{label}</p>
      <p className="text-indigo-600 dark:text-indigo-400">{payload[0].value} completed</p>
    </div>
  );
};

// ── main page ──────────────────────────────────────────────────────────────
export default function AnalyticsPage() {
  const { boardId } = useParams();
  const { isDark } = useTheme();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!boardId) return;
    setLoading(true);
    fetchAnalytics(boardId)
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [boardId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-indigo-200 dark:border-indigo-900 border-t-indigo-600 dark:border-t-indigo-400 rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <p className="text-red-500 dark:text-red-400 font-medium">Could not load analytics</p>
          <p className="text-gray-400 dark:text-slate-500 text-sm mt-1">{error}</p>
        </div>
      </div>
    );
  }

  const { summary, completedLast7Days, priorityBreakdown } = data;

  const stats = [
    {
      label: "Total Tasks",
      value: summary.total,
      accent: "#6366f1",
      icon: "📋",
    },
    {
      label: "Completed",
      value: summary.completed,
      accent: "#22c55e",
      icon: "✅",
    },
    {
      label: "In Progress",
      value: summary.inProgress,
      accent: "#f59e0b",
      icon: "⚡",
    },
    {
      label: "Overdue",
      value: summary.overdue,
      accent: "#ef4444",
      icon: "🔥",
    },
  ];

  // Chart colors need JS values since Recharts uses inline SVG attrs, not classNames
  const gridColor = isDark ? "#334155" : "#f0f0f0";
  const tickColor = isDark ? "#64748b" : "#9ca3af";
  const tooltipBorder = isDark ? "#475569" : "#e5e7eb";
  const tooltipBg = isDark ? "#1e293b" : "#ffffff";

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Board Analytics</h1>
        <p className="text-gray-500 dark:text-slate-400 text-sm mt-1">
          Last updated just now · Showing data for this board
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Line chart – spans 2 cols */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 p-6">
          <h2 className="text-base font-semibold text-gray-800 dark:text-slate-200 mb-1">
            Tasks Completed
          </h2>
          <p className="text-xs text-gray-400 dark:text-slate-500 mb-6">Last 7 days</p>
          {summary.total === 0 ? (
            <div className="flex flex-col items-center justify-center h-[220px] text-gray-300 dark:text-slate-600">
              <span className="text-3xl mb-2">📊</span>
              <p className="text-sm text-gray-400 dark:text-slate-500">No tasks yet</p>
              <p className="text-xs text-gray-300 dark:text-slate-600 mt-1">
                Create a task to start tracking progress
              </p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart
                data={completedLast7Days}
                margin={{ top: 4, right: 8, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: tickColor }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: tickColor }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#6366f1"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: "#6366f1", strokeWidth: 0 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Pie chart – spans 1 col */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 p-6">
          <h2 className="text-base font-semibold text-gray-800 dark:text-slate-200 mb-1">
            Priority Breakdown
          </h2>
          <p className="text-xs text-gray-400 dark:text-slate-500 mb-4">All tasks on this board</p>
          {priorityBreakdown.every((p) => p.value === 0) ? (
            <div className="flex items-center justify-center h-[220px] text-gray-300 dark:text-slate-600 text-sm">
              No tasks yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={priorityBreakdown}
                  cx="50%"
                  cy="45%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {priorityBreakdown.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Legend
                  iconType="circle"
                  iconSize={8}
                  formatter={(val) => (
                    <span className="text-xs text-gray-600 dark:text-slate-300">{val}</span>
                  )}
                />
                <Tooltip
                  formatter={(val, name) => [`${val} tasks`, name]}
                  contentStyle={{
                    borderRadius: "12px",
                    border: `1px solid ${tooltipBorder}`,
                    fontSize: "12px",
                    backgroundColor: tooltipBg,
                    color: isDark ? "#e2e8f0" : "#1f2937",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}