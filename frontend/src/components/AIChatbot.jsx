import  { useState, useEffect, useRef } from "react";
import axios from "../api/axios";

export default function AIChatbot({ selectedTask }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      fetchHistory();
    }
  }, [isOpen]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, sending]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const fetchHistory = async () => {
    setLoadingHistory(true);
    setError("");
    try {
      const res = await axios.get("/api/ai/history");
      setMessages(res.data?.messages || []);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load chat history.");
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || sending) return;

    const userMessage = {
      role: "user",
      content: trimmed,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setSending(true);
    setError("");

    try {
      const payload = {
        message: trimmed,
        taskContext: selectedTask
          ? {
              title: selectedTask.title,
              description: selectedTask.description,
            }
          : undefined,
      };
      const res = await axios.post("/api/ai/chat", payload);
      const aiMessage = {
        role: "assistant",
        content: res.data?.reply || "",
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to get AI reply.");
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (ts) => {
    if (!ts) return "";
    try {
      return new Date(ts).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "";
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-105"
        aria-label="Toggle AI Chat"
      >
        {isOpen ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8 10h.01M12 10h.01M16 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        )}
      </button>

      <div
        className={`fixed top-0 right-0 h-full w-[400px] max-w-full bg-gray-900 text-gray-100 shadow-2xl z-40 flex flex-col transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-800 bg-gray-950">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center text-sm font-semibold">
              AI
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-100">
                AI Assistant
              </p>
              <p className="text-xs text-gray-400">Always here to help</p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="text-gray-400 hover:text-gray-200 p-1 rounded-full hover:bg-gray-800 transition-colors"
            aria-label="Close chat"
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

        {selectedTask && (
          <div className="px-4 py-2.5 bg-indigo-950/60 border-b border-indigo-900 flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 text-indigo-400 flex-shrink-0"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            <p className="text-xs text-indigo-200 truncate">
              Context:{" "}
              <span className="font-medium text-indigo-100">
                {selectedTask.title}
              </span>
            </p>
          </div>
        )}

        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto px-4 py-4 space-y-3"
        >
          {loadingHistory && (
            <div className="flex items-center justify-center py-10 text-gray-400 text-sm">
              <Spinner />
              <span className="ml-2">Loading history...</span>
            </div>
          )}

          {!loadingHistory && error && (
            <p className="text-xs text-red-400 text-center">{error}</p>
          )}

          {!loadingHistory && messages.length === 0 && !error && (
            <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 text-sm gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-10 w-10 text-gray-700"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8 10h.01M12 10h.01M16 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p>No messages yet.</p>
              <p className="text-xs text-gray-600">
                Ask me anything about your tasks.
              </p>
            </div>
          )}

          {!loadingHistory &&
            messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === "user"
                      ? "bg-indigo-600 text-white rounded-br-sm"
                      : "bg-gray-800 text-gray-100 rounded-bl-sm"
                  }`}
                >
                  <p>{msg.content}</p>
                  {msg.timestamp && (
                    <p
                      className={`text-[10px] mt-1 ${
                        msg.role === "user"
                          ? "text-indigo-200"
                          : "text-gray-500"
                      }`}
                    >
                      {formatTime(msg.timestamp)}
                    </p>
                  )}
                </div>
              </div>
            ))}

          {sending && (
            <div className="flex justify-start">
              <div className="bg-gray-800 text-gray-100 rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-2">
                <Spinner />
                <span className="text-xs text-gray-400">Thinking...</span>
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-gray-800 bg-gray-950 px-3 py-3">
          {error && !loadingHistory && messages.length > 0 && (
            <p className="text-[11px] text-red-400 mb-1.5 px-1">{error}</p>
          )}
          <div className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              placeholder="Type a message..."
              className="flex-1 resize-none bg-gray-800 text-gray-100 placeholder-gray-500 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 max-h-28"
            />
            <button
              onClick={handleSend}
              disabled={sending || !input.trim()}
              className="h-10 w-10 flex-shrink-0 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white flex items-center justify-center transition-colors"
              aria-label="Send message"
            >
              {sending ? (
                <Spinner />
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

function Spinner() {
  return (
    <svg
      className="animate-spin h-4 w-4"
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
