import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import authRoutes  from "./routes/auth.routes.js";
import boardRoutes from "./routes/board.routes.js";
import taskRoutes  from "./routes/task.routes.js";
import aiRoutes    from "./routes/ai.routes.js";
import analyticsRoutes from "./routes/analytics.routes.js";

const app = express();

// ─── Middleware ───────────────────────────────────────────
app.use(cors({
  origin: function (origin, callback) {
    const allowed = [
      process.env.CLIENT_URL,
      /\.vercel\.app$/,
    ];
    if (!origin || allowed.some(p => typeof p === 'string' ? p === origin : p.test(origin))) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ─── Routes ──────────────────────────────────────────────
app.use("/api/auth",   authRoutes);
app.use("/api/boards", boardRoutes);
app.use("/api/tasks",  taskRoutes);
app.use("/api/ai",     aiRoutes);
app.use("/api/analytics", analyticsRoutes);

// ─── Health check ────────────────────────────────────────
app.get("/", (req, res) => {
  res.json({ message: "Task Manager API is running." });
});

// ─── 404 handler ─────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found." });
});

// ─── Global error handler ────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

export default app;