import { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import axios from "../api/axios.js";
import TaskDetailModal from "../components/TaskDetailModel.jsx";
import AIChatbot from "../components/AIChatbot.jsx";

// ─── Constants ────────────────────────────────────────────────────────────────

const COLUMNS = [
  { id: "todo",        label: "Todo",        accent: "bg-slate-400",   ring: "ring-slate-300",   dot: "bg-slate-400"   },
  { id: "in-progress", label: "In Progress", accent: "bg-violet-500",  ring: "ring-violet-300",  dot: "bg-violet-500"  },
  { id: "done",        label: "Done",        accent: "bg-emerald-500", ring: "ring-emerald-300", dot: "bg-emerald-500" },
];

const PRIORITY_CONFIG = {
  high:   { label: "High",   classes: "bg-rose-100 text-rose-700 ring-1 ring-rose-200"     },
  medium: { label: "Med",    classes: "bg-amber-100 text-amber-700 ring-1 ring-amber-200"  },
  low:    { label: "Low",    classes: "bg-sky-100 text-sky-700 ring-1 ring-sky-200"        },
};

const EMPTY_FORM = { title: "", description: "", priority: "medium", dueDate: "" };

// ─── Sub-components ───────────────────────────────────────────────────────────

function PriorityBadge({ priority }) {
  const cfg = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.low;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold tracking-wide ${cfg.classes}`}>
      {cfg.label}
    </span>
  );
}

function TaskCard({ task, onDragStart, onClick, onDelete }) {
  const overdue =
    task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "done";

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, task._id)}
      onClick={() => onClick(task)}
      className="group relative bg-white rounded-xl border border-slate-100 shadow-sm hover:shadow-md
                 hover:-translate-y-0.5 transition-all duration-150 cursor-grab active:cursor-grabbing
                 active:opacity-60 active:scale-95 p-3.5 select-none"
    >
      {/* Delete button */}
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(task._id); }}
        className="absolute top-2.5 right-2.5 opacity-0 group-hover:opacity-100 transition-opacity
                   w-6 h-6 flex items-center justify-center rounded-full hover:bg-rose-50
                   text-slate-300 hover:text-rose-400"
        aria-label="Delete task"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Title */}
      <p className="text-sm font-medium text-slate-800 leading-snug pr-6 mb-2.5 line-clamp-2">
        {task.title}
      </p>

      {/* Footer row */}
      <div className="flex items-center gap-2 flex-wrap">
        <PriorityBadge priority={task.priority} />
        {task.dueDate && (
          <span className={`flex items-center gap-1 text-xs ${overdue ? "text-rose-500 font-semibold" : "text-slate-400"}`}>
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {new Date(task.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </span>
        )}
      </div>
    </div>
  );
}

function AddTaskForm({ columnId, boardId, onAdd, onCancel }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) { setError("Title is required."); return; }
    setLoading(true);
    setError("");
    try {
      const { data } = await axios.post("/api/tasks", {
        ...form,
        title: form.title.trim(),
        status: columnId,
        board:boardId,
      });
      onAdd(data.data);
      setForm(EMPTY_FORM);
    } catch {
      setError("Failed to create task. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-xl border border-slate-200 shadow-sm p-3.5 space-y-2.5"
      onClick={(e) => e.stopPropagation()}
    >
      <input
        autoFocus
        type="text"
        placeholder="Task title…"
        value={form.title}
        onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
        className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-2
                   focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent
                   placeholder:text-slate-400"
      />
      <input
        type="text"
        placeholder="Description (optional)"
        value={form.description}
        onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
        className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-2
                   focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent
                   placeholder:text-slate-400"
      />
      <div className="flex gap-2">
        <select
          value={form.priority}
          onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}
          className="flex-1 text-xs bg-slate-50 border border-slate-200 rounded-lg px-2 py-2
                     focus:outline-none focus:ring-2 focus:ring-violet-400"
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
        <input
          type="date"
          value={form.dueDate}
          onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
          className="flex-1 text-xs bg-slate-50 border border-slate-200 rounded-lg px-2 py-2
                     focus:outline-none focus:ring-2 focus:ring-violet-400"
        />
      </div>

      {error && <p className="text-xs text-rose-500">{error}</p>}

      <div className="flex gap-2 pt-0.5">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white
                     text-xs font-semibold py-2 rounded-lg transition-colors"
        >
          {loading ? "Adding…" : "Add task"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold
                     py-2 rounded-lg transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

function Column({ col, tasks, boardId, onAddTask, onDeleteTask, onDropTask, onCardClick }) {
  const [showForm, setShowForm] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e) => { e.preventDefault(); setIsDragOver(true); };
  const handleDragLeave = () => setIsDragOver(false);
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const taskId = e.dataTransfer.getData("taskId");
    if (taskId) onDropTask(taskId, col.id);
  };

  return (
    <div className="flex flex-col min-w-0 w-full">
      {/* Column header */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${col.dot}`} />
          <h2 className="text-sm font-semibold text-slate-700 tracking-wide">{col.label}</h2>
          <span className="text-xs text-slate-400 bg-slate-100 rounded-full px-2 py-0.5 font-medium">
            {tasks.length}
          </span>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="w-6 h-6 flex items-center justify-center rounded-full bg-slate-100
                     hover:bg-violet-100 text-slate-400 hover:text-violet-600 transition-colors"
          aria-label={`Add task to ${col.label}`}
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`flex-1 rounded-2xl p-2.5 min-h-[480px] transition-all duration-150 space-y-2.5
                    ${isDragOver
                      ? `bg-violet-50 ring-2 ${col.ring}`
                      : "bg-slate-50/70"
                    }`}
      >
        {/* Inline add form */}
        {showForm && (
          <AddTaskForm
            columnId={col.id}
            boardId={boardId}
            onAdd={(task) => { onAddTask(task); setShowForm(false); }}
            onCancel={() => setShowForm(false)}
          />
        )}

        {/* Task cards */}
        {tasks.map((task) => (
          <TaskCard
            key={task._id}
            task={task}
            onDragStart={(e, id) => e.dataTransfer.setData("taskId", id)}
            onClick={onCardClick}
            onDelete={onDeleteTask}
          />
        ))}

        {/* Empty state */}
        {tasks.length === 0 && !showForm && (
          <div className="flex flex-col items-center justify-center h-32 gap-2 text-slate-300">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0
                   002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <span className="text-xs">Drop tasks here</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function BoardPage() {
  const { boardId } = useParams();
  const [tasks, setTasks]               = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState("");
  const [selectedTask, setSelectedTask] = useState(null);
  const [showChatbot, setShowChatbot]   = useState(false);

  // Fetch tasks
  useEffect(() => {
    if (!boardId) return;
    setLoading(true);
    axios
      .get(`/api/tasks?board=${boardId}`)
      .then(({ data }) => setTasks(Array.isArray(data.data) ? data.data : []))
      .catch(() => setError("Couldn't load tasks. Please refresh."))
      .finally(() => setLoading(false));
  }, [boardId]);

  // Add task (from inline form callback)
  const handleAddTask = useCallback((newTask) => {
    setTasks((prev) => [...prev, newTask]);
  }, []);

  // Delete task
  const handleDeleteTask = useCallback(async (taskId) => {
    setTasks((prev) => prev.filter((t) => t._id !== taskId));
    try {
      await axios.delete(`/api/tasks/${taskId}`);
    } catch {
      // Rollback not implemented — refresh to re-sync on persistent failure
    }
  }, []);

  // Drag-and-drop: update status
  const handleDropTask = useCallback(async (taskId, newStatus) => {
    const task = tasks.find((t) => t._id === taskId);
    if (!task || task.status === newStatus) return;

    // Optimistic update
    setTasks((prev) =>
      prev.map((t) => (t._id === taskId ? { ...t, status: newStatus } : t))
    );
    try {
      await axios.put(`/api/tasks/${taskId}`, { status: newStatus });
    } catch {
      // Revert on failure
      setTasks((prev) =>
        prev.map((t) => (t._id === taskId ? { ...t, status: task.status } : t))
      );
    }
  }, [tasks]);

  // Update task from modal (e.g. after editing)
  const handleTaskUpdate = useCallback((updatedTask) => {
    setTasks((prev) =>
      prev.map((t) => (t._id === updatedTask._id ? updatedTask : t))
    );
    setSelectedTask(updatedTask);
  }, []);

  const tasksByStatus = (status) => tasks.filter((t) => t.status === status);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-slate-50 flex flex-col">

      {/* Top bar */}
      <header className="sticky top-0 z-20 bg-white/80 backdrop-blur border-b border-slate-100 px-6 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2
                     2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002
                     2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
              </svg>
            </div>
            <div>
              <h1 className="text-sm font-bold text-slate-800 leading-none">Task Board</h1>
              <p className="text-xs text-slate-400 mt-0.5 font-mono truncate max-w-xs">{boardId}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 hidden sm:block">{tasks.length} tasks</span>
            <button
              onClick={() => setShowChatbot((v) => !v)}
              className="flex items-center gap-1.5 bg-violet-50 hover:bg-violet-100 text-violet-700
                         text-xs font-semibold px-3 py-2 rounded-lg transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0
                     012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              AI Assistant
            </button>
          </div>
        </div>
      </header>

      {/* Body */}
      <main className="flex-1 px-4 sm:px-6 py-6 max-w-7xl mx-auto w-full">

        {loading && (
          <div className="flex items-center justify-center h-64 gap-3 text-slate-400">
            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            <span className="text-sm">Loading board…</span>
          </div>
        )}

        {error && !loading && (
          <div className="flex items-center justify-center h-64">
            <div className="bg-rose-50 border border-rose-100 rounded-xl px-6 py-4 text-center max-w-sm">
              <p className="text-sm text-rose-600 font-medium">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-3 text-xs text-rose-500 underline underline-offset-2"
              >
                Refresh page
              </button>
            </div>
          </div>
        )}

        {!loading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6 items-start">
            {COLUMNS.map((col) => (
              <Column
                key={col.id}
                col={col}
                tasks={tasksByStatus(col.id)}
                boardId={boardId}
                onAddTask={handleAddTask}
                onDeleteTask={handleDeleteTask}
                onDropTask={handleDropTask}
                onCardClick={setSelectedTask}
              />
            ))}
          </div>
        )}
      </main>

      {/* Task Detail Modal */}
      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onUpdate={handleTaskUpdate}
          onDelete={(id) => { handleDeleteTask(id); setSelectedTask(null); }}
        />
      )}

      {/* AI Chatbot panel */}
      {showChatbot && (
        <AIChatbot
          boardId={boardId}
          tasks={tasks}
          onClose={() => setShowChatbot(false)}
        />
      )}
    </div>
  );
}
