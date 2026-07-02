import { useState, useEffect } from "react";
import axios from "../api/axios";

export default function TaskDetailModal({ task, onClose, onUpdate }) {
  const [activeTab, setActiveTab] = useState("details");

  const [title, setTitle] = useState(task?.title || "");
  const [description, setDescription] = useState(task?.description || "");
  const [priority, setPriority] = useState(task?.priority || "medium");
  const [dueDate, setDueDate] = useState(
    task?.dueDate ? task.dueDate.slice(0, 10) : ""
  );

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const [improving, setImproving] = useState(false);
  const [improvedText, setImprovedText] = useState("");
  const [improveError, setImproveError] = useState("");

  const [breakingDown, setBreakingDown] = useState(false);
  const [subtasks, setSubtasks] = useState([]);
  const [breakdownError, setBreakdownError] = useState("");

  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");

  useEffect(() => {
    setTitle(task?.title || "");
    setDescription(task?.description || "");
    setPriority(task?.priority || "medium");
    setDueDate(task?.dueDate ? task.dueDate.slice(0, 10) : "");
    setImprovedText("");
    setSubtasks([]);
    setSaveError("");
    setImproveError("");
    setBreakdownError("");
  }, [task]);

  useEffect(() => {
    if (activeTab === "history" && task?._id) {
      fetchHistory();
    }
  }, [activeTab, task?._id]);

  const fetchHistory = async () => {
    setHistoryLoading(true);
    setHistoryError("");
    try {
      const res = await axios.get(`/api/tasks/${task._id}/history`);
      setHistory(res.data || []);
    } catch (err) {
      setHistoryError(
        err?.response?.data?.message || "Failed to load history."
      );
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleSave = async () => {
    if (!task?._id) return;
    setSaving(true);
    setSaveError("");
    try {
      const payload = {
        title,
        description,
        priority,
        dueDate: dueDate ? new Date(dueDate).toISOString() : null,
      };
      const res = await axios.patch(`/api/tasks/${task._id}`, payload);
      if (onUpdate) onUpdate(res.data);
      onClose();
    } catch (err) {
      setSaveError(err?.response?.data?.message || "Failed to save task.");
    } finally {
      setSaving(false);
    }
  };

  const handleImproveDescription = async () => {
    setImproving(true);
    setImproveError("");
    setImprovedText("");
    try {
      const res = await axios.post("/api/ai/improve-description", {
        title,
        description,
      });
      setImprovedText(res.data?.improvedDescription || "");
    } catch (err) {
      setImproveError(
        err?.response?.data?.message || "Failed to improve description."
      );
    } finally {
      setImproving(false);
    }
  };

  const applyImprovedDescription = () => {
    setDescription(improvedText);
    setImprovedText("");
  };

  const handleSuggestBreakdown = async () => {
    setBreakingDown(true);
    setBreakdownError("");
    setSubtasks([]);
    try {
      const res = await axios.post("/api/ai/suggest-breakdown", {
        taskTitle: title,
        taskDescription: description,
      });
      setSubtasks(res.data?.subtasks || []);
    } catch (err) {
      setBreakdownError(
        err?.response?.data?.message || "Failed to generate subtasks."
      );
    } finally {
      setBreakingDown(false);
    }
  };

  const formatTimestamp = (ts) => {
    if (!ts) return "";
    try {
      return new Date(ts).toLocaleString();
    } catch {
      return ts;
    }
  };

  const priorityColors = {
    low: "bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-300 border-green-300 dark:border-green-800",
    medium: "bg-yellow-100 dark:bg-yellow-950/40 text-yellow-700 dark:text-yellow-300 border-yellow-300 dark:border-yellow-800",
    high: "bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-300 border-red-300 dark:border-red-800",
  };

  if (!task) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative bg-white dark:bg-slate-800 w-full max-w-2xl max-h-[90vh] rounded-xl shadow-2xl flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-slate-100">
            Task Details
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 transition-colors rounded-full p-1 hover:bg-gray-100 dark:hover:bg-slate-700"
            aria-label="Close"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>

        <div className="flex border-b border-gray-200 dark:border-slate-700 px-6">
          <button
            onClick={() => setActiveTab("details")}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "details"
                ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                : "border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200"
            }`}
          >
            Details
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "history"
                ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                : "border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200"
            }`}
          >
            History
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {activeTab === "details" && (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-800 dark:text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Task title"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">
                    Description
                  </label>
                  <button
                    onClick={handleImproveDescription}
                    disabled={improving}
                    className="text-xs font-medium px-2.5 py-1 rounded-md bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-950/70 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                  >
                    {improving ? (
                      <>
                        <Spinner />
                        Improving...
                      </>
                    ) : (
                      "✨ AI: Improve Description"
                    )}
                  </button>
                </div>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="w-full rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-800 dark:text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                  placeholder="Task description"
                />
                {improveError && (
                  <p className="text-xs text-red-500 dark:text-red-400 mt-1">{improveError}</p>
                )}

                {improvedText && (
                  <div className="mt-2 border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/60 dark:bg-indigo-950/30 rounded-lg p-3">
                    <p className="text-xs font-semibold text-indigo-700 dark:text-indigo-300 mb-1">
                      Suggested improvement
                    </p>
                    <p className="text-sm text-gray-700 dark:text-slate-300 whitespace-pre-wrap">
                      {improvedText}
                    </p>
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={applyImprovedDescription}
                        className="text-xs font-medium px-3 py-1.5 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
                      >
                        Apply
                      </button>
                      <button
                        onClick={() => setImprovedText("")}
                        className="text-xs font-medium px-3 py-1.5 rounded-md bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                    Priority
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      priorityColors[priority] || "border-gray-300 dark:border-slate-600"
                    }`}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-800 dark:text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="border-t border-gray-100 dark:border-slate-700 pt-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-slate-300">
                    AI Subtask Breakdown
                  </h3>
                  <button
                    onClick={handleSuggestBreakdown}
                    disabled={breakingDown}
                    className="text-xs font-medium px-2.5 py-1 rounded-md bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-950/70 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                  >
                    {breakingDown ? (
                      <>
                        <Spinner />
                        Generating...
                      </>
                    ) : (
                      "🧩 AI: Break into subtasks"
                    )}
                  </button>
                </div>

                {breakdownError && (
                  <p className="text-xs text-red-500 dark:text-red-400 mb-1">
                    {breakdownError}
                  </p>
                )}

                {subtasks.length > 0 && (
                  <ol className="list-decimal list-inside space-y-1.5 bg-purple-50/60 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900/50 rounded-lg p-3">
                    {subtasks.map((st, idx) => (
                      <li key={idx} className="text-sm text-gray-700 dark:text-slate-300">
                        {typeof st === "string" ? st : st?.title || ""}
                      </li>
                    ))}
                  </ol>
                )}
              </div>

              {saveError && (
                <p className="text-sm text-red-500 dark:text-red-400">{saveError}</p>
              )}
            </div>
          )}

          {activeTab === "history" && (
            <div>
              {historyLoading && (
                <div className="flex items-center justify-center py-10 text-gray-400 dark:text-slate-500 text-sm">
                  <Spinner />
                  <span className="ml-2">Loading history...</span>
                </div>
              )}

              {!historyLoading && historyError && (
                <p className="text-sm text-red-500 dark:text-red-400">{historyError}</p>
              )}

              {!historyLoading && !historyError && history.length === 0 && (
                <p className="text-sm text-gray-400 dark:text-slate-500 text-center py-10">
                  No history available for this task.
                </p>
              )}

              {!historyLoading && history.length > 0 && (
                <ul className="space-y-3">
                  {history.map((entry, idx) => (
                    <li
                      key={idx}
                      className="border border-gray-200 dark:border-slate-700 rounded-lg p-3 text-sm"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-gray-800 dark:text-slate-200 capitalize">
                          {entry.changeType}
                        </span>
                        <span className="text-xs text-gray-400 dark:text-slate-500">
                          {formatTimestamp(entry.timestamp)}
                        </span>
                      </div>
                      <div className="text-gray-600 dark:text-slate-400">
                        <span className="line-through text-gray-400 dark:text-slate-500 mr-2">
                          {String(entry.oldValue ?? "—")}
                        </span>
                        <span className="text-gray-700 dark:text-slate-300">
                          → {String(entry.newValue ?? "—")}
                        </span>
                      </div>
                      {entry.changedBy && (
                        <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">
                          by {entry.changedBy}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        {activeTab === "details" && (
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium rounded-lg text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {saving ? (
                <>
                  <Spinner />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <svg
      className="animate-spin h-3.5 w-3.5"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}