import Task from "../models/Task.js";
import Board from "../models/Board.js";
import TaskHistory from "../models/TaskHistory.js";

// Fields that are tracked in TaskHistory when they change
const TRACKED_FIELDS = ["title", "description", "status", "priority", "assignedTo", "dueDate", "tags"];

// Helper — verify the requesting user can access the board
const assertBoardAccess = async (boardId, userId) => {
  const board = await Board.findById(boardId);
  if (!board) return null;

  const hasAccess =
    board.owner.toString() === userId ||
    board.members.some((m) => m.toString() === userId);

  return hasAccess ? board : false;
};

// POST /api/tasks
export const createTask = async (req, res) => {
  try {
    const { title, description, board, assignedTo, status, priority, dueDate, tags } = req.body;

    const access = await assertBoardAccess(board, req.user.id);
    if (access === null) {
      return res.status(404).json({ success: false, message: "Board not found" });
    }
    if (access === false) {
      return res.status(403).json({ success: false, message: "Access denied to this board" });
    }

    const task = await Task.create({
      title,
      description,
      board,
      assignedTo: assignedTo ?? null,
      status,
      priority,
      dueDate: dueDate ?? null,
      tags: tags ?? [],
      createdBy: req.user.id,
    });

    await task.populate([
      { path: "createdBy", select: "email" },
      { path: "assignedTo", select: "email" },
      { path: "board", select: "title" },
    ]);

    res.status(201).json({ success: true, data: task });
  } catch (err) {
    if (err.name === "ValidationError") {
      const messages = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: messages.join(", ") });
    }
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// GET /api/tasks?board=<boardId>
export const getTasksByBoard = async (req, res) => {
  try {
    const { board } = req.query;
    if (!board) {
      return res.status(400).json({ success: false, message: "board query param is required" });
    }

    const access = await assertBoardAccess(board, req.user.id);
    if (access === null) {
      return res.status(404).json({ success: false, message: "Board not found" });
    }
    if (access === false) {
      return res.status(403).json({ success: false, message: "Access denied to this board" });
    }

    const tasks = await Task.find({ board })
      .populate("assignedTo", "email")
      .populate("createdBy", "email")
      .sort({ createdAt: -1 });

    res.json({ success: true, data: tasks });
  } catch {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// GET /api/tasks/:id
export const getTaskById = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate("board", "title owner members")
      .populate("assignedTo", "email")
      .populate("createdBy", "email");

    if (!task) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }

    const access = await assertBoardAccess(task.board._id, req.user.id);
    if (!access) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    res.json({ success: true, data: task });
  } catch {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// PUT /api/tasks/:id
export const updateTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }

    const access = await assertBoardAccess(task.board, req.user.id);
    if (!access) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    // Collect changes and build history entries
    const historyEntries = [];

    for (const field of TRACKED_FIELDS) {
      if (!(field in req.body)) continue;

      const oldRaw = task[field];
      const newRaw = req.body[field];

      // Normalise for comparison (handle ObjectId, dates, arrays)
      const oldStr = JSON.stringify(oldRaw instanceof Object ? oldRaw.toString() : oldRaw);
      const newStr = JSON.stringify(newRaw);

      if (oldStr !== newStr) {
        historyEntries.push({
          task: task._id,
          changedBy: req.user.id,
          changeType: field,
          oldValue: oldRaw,
          newValue: newRaw,
        });

        task[field] = newRaw;
      }
    }

    // aiSuggestion is not tracked in history — just update silently
    if (req.body.aiSuggestion !== undefined) {
      task.aiSuggestion = req.body.aiSuggestion;
    }

    await task.save();

    // Persist history entries (bulk insert, non-blocking on failure)
    if (historyEntries.length > 0) {
      await TaskHistory.insertMany(historyEntries).catch((err) =>
        console.error("TaskHistory insert error:", err)
      );
    }

    await task.populate([
      { path: "assignedTo", select: "email" },
      { path: "createdBy", select: "email" },
      { path: "board", select: "title" },
    ]);

    res.json({ success: true, data: task });
  } catch (err) {
    if (err.name === "ValidationError") {
      const messages = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: messages.join(", ") });
    }
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// DELETE /api/tasks/:id
export const deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }

    const access = await assertBoardAccess(task.board, req.user.id);
    if (!access) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    await task.deleteOne();
    // Optionally clean up history — remove if you want to keep audit trail
    await TaskHistory.deleteMany({ task: task._id });

    res.json({ success: true, message: "Task deleted successfully" });
  } catch {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// GET /api/tasks/:id/history
export const getTaskHistory = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id).select("board");
    if (!task) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }

    const access = await assertBoardAccess(task.board, req.user.id);
    if (!access) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const history = await TaskHistory.find({ task: req.params.id })
      .populate("changedBy", "email")
      .sort({ timestamp: -1 });

    res.json({ success: true, data: history });
  } catch {
    res.status(500).json({ success: false, message: "Server error" });
  }
};