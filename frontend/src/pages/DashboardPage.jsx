import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../api/axios";
import AuthContext from "../context/AuthContext";
import Navbar from "../components/Navbar";

const COLOR_OPTIONS = [
  { label: "Indigo",  value: "#4F46E5" },
  { label: "Rose",    value: "#E11D48" },
  { label: "Emerald", value: "#059669" },
  { label: "Amber",   value: "#D97706" },
  { label: "Sky",     value: "#0284C7" },
  { label: "Violet",  value: "#7C3AED" },
];

// ✅ Added onDelete + onInvite + shared props
function BoardCard({ board, onClick, onDelete, onInvite, shared = false }) {
  return (
    <button
      onClick={onClick}
      className="group relative w-full text-left rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
    >
      {/* Color accent bar */}
      <div
        className="h-2 w-full"
        style={{ backgroundColor: board.color || "#4F46E5" }}
      />

      {/* ✅ Shared badge */}
      {shared && (
        <span className="absolute top-3 right-3 z-10 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 text-[11px] font-semibold">
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-1.13a4 4 0 10-4-4 4 4 0 004 4zm6 0a4 4 0 10-4-4" />
          </svg>
          Shared
        </span>
      )}

      <div className="p-5">
        {/* Color dot + title */}
        <div className="flex items-center gap-2.5 mb-2">
          <span
            className="w-3 h-3 rounded-full flex-shrink-0"
            style={{ backgroundColor: board.color || "#4F46E5" }}
          />
          <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-base truncate group-hover:text-indigo-700 dark:group-hover:text-indigo-400 transition-colors">
            {board.title}
          </h3>
        </div>

        {board.description && (
          <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
            {board.description}
          </p>
        )}

        <div className="mt-4 flex items-center justify-between">
          <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">Open board</span>

          <div className="flex items-center gap-2">
            {/* ✅ Invite button — only shown for boards you own */}
            {onInvite && (
              <span
                role="button"
                onClick={onInvite}
                title="Invite member"
                className="p-1 rounded text-slate-300 dark:text-slate-500 hover:text-indigo-500 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
              </span>
            )}

            {/* ✅ Delete button — only shown for boards you own */}
            {onDelete && (
              <span
                role="button"
                onClick={onDelete}
                title="Delete board"
                className="p-1 rounded text-slate-300 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </span>
            )}

            <svg
              className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </div>
    </button>
  );
}

function CreateBoardModal({ onClose, onCreated }) {
  const [title, setTitle]       = useState("");
  const [description, setDesc]  = useState("");
  const [color, setColor]       = useState(COLOR_OPTIONS[0].value);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim()) { setError("Board title is required."); return; }
    setLoading(true);
    setError("");
    try {
      const { data } = await axios.post("/api/boards", {
        title: title.trim(),
        description: description.trim(),
        color,
      });
      onCreated(data.data);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to create board.");
    } finally {
      setLoading(false);
    }
  }

  function handleBackdrop(e) {
    if (e.target === e.currentTarget) onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={handleBackdrop}
    >
      <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div
          className="h-1.5 w-full transition-colors duration-200"
          style={{ backgroundColor: color }}
        />

        <div className="p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">New Board</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Product Roadmap"
                maxLength={80}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Description
                <span className="text-slate-400 dark:text-slate-500 font-normal ml-1">(optional)</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDesc(e.target.value)}
                placeholder="What's this board for?"
                rows={3}
                maxLength={300}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Color
              </label>
              <div className="flex gap-2.5 flex-wrap">
                {COLOR_OPTIONS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    title={c.label}
                    onClick={() => setColor(c.value)}
                    className="w-8 h-8 rounded-full border-2 transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                    style={{
                      backgroundColor: c.value,
                      borderColor: color === c.value ? c.value : "transparent",
                      boxShadow: color === c.value ? `0 0 0 3px white, 0 0 0 5px ${c.value}` : "none",
                    }}
                  />
                ))}
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <div className="flex gap-2.5 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium text-white transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed"
                style={{ backgroundColor: color }}
              >
                {loading ? "Creating…" : "Create Board"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// ✅ New: Invite Member modal
function InviteMemberModal({ boardId, onClose }) {
  const [email, setEmail]     = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email.trim()) { setError("Email is required."); return; }
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const { data } = await axios.post(`/api/boards/${boardId}/invite`, {
        email: email.trim(),
      });
      setSuccess(data?.message || `Invite sent to ${email.trim()}.`);
      setEmail("");
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to send invite.");
    } finally {
      setLoading(false);
    }
  }

  function handleBackdrop(e) {
    if (e.target === e.currentTarget) onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={handleBackdrop}
    >
      <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="h-1.5 w-full bg-indigo-600" />

        <div className="p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Invite Member</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Email address <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="teammate@example.com"
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            {success && (
              <p className="text-sm text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 rounded-lg px-3 py-2">
                {success}
              </p>
            )}

            <div className="flex gap-2.5 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                Close
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? "Sending…" : "Send Invite"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useContext(AuthContext);
  const navigate  = useNavigate();

  const [boards,      setBoards]      = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState("");
  const [showModal,   setShowModal]   = useState(false);

  // ✅ New: shared boards state
  const [sharedBoards,  setSharedBoards]  = useState([]);
  const [sharedLoading, setSharedLoading] = useState(true);
  const [sharedError,   setSharedError]   = useState("");

  // ✅ New: invite modal state (holds the boardId being invited to, or null)
  const [inviteBoardId, setInviteBoardId] = useState(null);

  useEffect(() => {
    async function fetchBoards() {
      try {
        const { data } = await axios.get("/api/boards");
        setBoards(data.data);
      } catch {
        setError("Could not load boards. Please try again.");
      } finally {
        setLoading(false);
      }
    }
    fetchBoards();
  }, []);

  // ✅ New: fetch boards shared with the user, independent of the fetch above
  useEffect(() => {
    async function fetchSharedBoards() {
      try {
        const { data } = await axios.get("/api/boards/shared");
        setSharedBoards(data.data);
      } catch {
        setSharedError("Could not load shared boards. Please try again.");
      } finally {
        setSharedLoading(false);
      }
    }
    fetchSharedBoards();
  }, []);

  function handleCreated(newBoard) {
    setBoards((prev) => [newBoard, ...prev]);
    setShowModal(false);
  }

  // ✅ New: delete handler
  async function handleDelete(e, boardId) {
    e.stopPropagation(); // prevent opening the board
    if (!window.confirm("Are you sure you want to delete this board?")) return;
    try {
      await axios.delete(`/api/boards/${boardId}`);
      setBoards((prev) => prev.filter((b) => b._id !== boardId));
    } catch {
      alert("Failed to delete board. Please try again.");
    }
  }

  // ✅ New: open invite modal for a given board
  function handleInviteClick(e, boardId) {
    e.stopPropagation(); // prevent opening the board
    setInviteBoardId(boardId);
  }

  const firstName = user?.name?.split(" ")[0] ?? "there";

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-end justify-between mb-8 gap-4 flex-wrap">
          <div>
            <p className="text-sm text-slate-400 dark:text-slate-500 font-medium mb-1">Good to see you,</p>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">
              {firstName}'s Boards
            </h1>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold shadow-sm hover:bg-indigo-700 active:bg-indigo-800 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Create Board
          </button>
        </div>

        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden animate-pulse">
                <div className="h-2 bg-slate-200 dark:bg-slate-700 w-full" />
                <div className="p-5 space-y-3">
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
                  <div className="h-3 bg-slate-100 dark:bg-slate-700/60 rounded w-full" />
                  <div className="h-3 bg-slate-100 dark:bg-slate-700/60 rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        )}

        {error && !loading && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-950/50 flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-red-500 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M12 3a9 9 0 100 18A9 9 0 0012 3z" />
              </svg>
            </div>
            <p className="text-slate-600 dark:text-slate-300 font-medium">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              Retry
            </button>
          </div>
        )}

        {!loading && !error && boards.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border-2 border-dashed border-indigo-200 dark:border-indigo-800 flex items-center justify-center mb-5">
              <svg className="w-8 h-8 text-indigo-400 dark:text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-1">No boards yet</h2>
            <p className="text-sm text-slate-400 dark:text-slate-500 mb-6 max-w-xs">
              Create your first board to start organizing tasks across your projects.
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Create your first board
            </button>
          </div>
        )}

        {!loading && !error && boards.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {boards.map((board) => (
              <BoardCard
                key={board._id}
                board={board}
                onClick={() => navigate(`/board/${board._id}`)}
                onDelete={(e) => handleDelete(e, board._id)}
                onInvite={(e) => handleInviteClick(e, board._id)}  // ✅ wired up
              />
            ))}

            {/* Ghost "add" card */}
            <button
              onClick={() => setShowModal(true)}
              className="rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 transition-all duration-200 flex flex-col items-center justify-center gap-2 min-h-[140px] group focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-950/50 flex items-center justify-center transition-colors">
                <svg className="w-5 h-5 text-slate-400 dark:text-slate-500 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <span className="text-sm font-medium text-slate-400 dark:text-slate-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                New board
              </span>
            </button>
          </div>
        )}

        {/* ✅ New: "Shared With Me" section */}
        {!sharedLoading && !sharedError && sharedBoards.length > 0 && (
          <div className="mt-12">
            <div className="flex items-end justify-between mb-6 gap-4 flex-wrap">
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">
                Shared With Me
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {sharedBoards.map((board) => (
                <BoardCard
                  key={board._id}
                  board={board}
                  shared
                  onClick={() => navigate(`/board/${board._id}`)}
                  // No delete/invite for boards you don't own
                />
              ))}
            </div>
          </div>
        )}

        {sharedLoading && (
          <div className="mt-12">
            <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-40 mb-6 animate-pulse" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden animate-pulse">
                  <div className="h-2 bg-slate-200 dark:bg-slate-700 w-full" />
                  <div className="p-5 space-y-3">
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
                    <div className="h-3 bg-slate-100 dark:bg-slate-700/60 rounded w-full" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {sharedError && !sharedLoading && (
          <div className="mt-12">
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 tracking-tight mb-4">
              Shared With Me
            </h2>
            <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-lg px-3 py-2 inline-block">
              {sharedError}
            </p>
          </div>
        )}
      </main>

      {showModal && (
        <CreateBoardModal
          onClose={() => setShowModal(false)}
          onCreated={handleCreated}
        />
      )}

      {/* ✅ New: Invite modal */}
      {inviteBoardId && (
        <InviteMemberModal
          boardId={inviteBoardId}
          onClose={() => setInviteBoardId(null)}
        />
      )}
    </div>
  );
}