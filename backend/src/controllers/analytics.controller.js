import mongoose from "mongoose";
import Task from "../models/Task.js";

// GET /api/analytics/:boardId
export const getBoardAnalytics = async (req, res) => {
  try {
    const { boardId } = req.params;
    const _id = new mongoose.Types.ObjectId(boardId);

    // ── 1. Status counts ───────────────────────────────────────────────────
    const statusAgg = await Task.aggregate([
      { $match: { board: _id } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    const statusMap = { todo: 0, "in-progress": 0, completed: 0 };
    statusAgg.forEach(({ _id, count }) => {
      if (_id in statusMap) statusMap[_id] = count;
    });

    const total = Object.values(statusMap).reduce((a, b) => a + b, 0);

    // ── 2. Completed last 7 days ───────────────────────────────────────────
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const dailyAgg = await Task.aggregate([
      {
        $match: {
          board: _id,
          status: "completed",
          updatedAt: { $gte: sevenDaysAgo },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$updatedAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const dailyMap = {};
    dailyAgg.forEach(({ _id, count }) => (dailyMap[_id] = count));

    const completedLast7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const key = d.toISOString().slice(0, 10);
      const label = d.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      });
      return { date: key, label, count: dailyMap[key] || 0 };
    });

    // ── 3. Priority breakdown ──────────────────────────────────────────────
    const priorityAgg = await Task.aggregate([
      { $match: { board: _id } },
      { $group: { _id: "$priority", count: { $sum: 1 } } },
    ]);

    const priorityBreakdown = { high: 0, medium: 0, low: 0 };
    priorityAgg.forEach(({ _id, count }) => {
      if (_id in priorityBreakdown) priorityBreakdown[_id] = count;
    });

    // ── 4. Overdue ─────────────────────────────────────────────────────────
    const overdueCount = await Task.countDocuments({
      board: boardId,
      status: { $ne: "completed" },
      dueDate: { $lt: new Date() },
    });

    res.json({
      success: true,
      data: {
        summary: {
          total,
          completed: statusMap["completed"],
          inProgress: statusMap["in-progress"],
          todo: statusMap["todo"],
          overdue: overdueCount,
        },
        completedLast7Days,
        priorityBreakdown: [
          { name: "High",   value: priorityBreakdown.high,   color: "#ef4444" },
          { name: "Medium", value: priorityBreakdown.medium, color: "#f59e0b" },
          { name: "Low",    value: priorityBreakdown.low,    color: "#22c55e" },
        ],
      },
    });
  } catch (err) {
    console.error("[analytics] getBoardAnalytics error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
