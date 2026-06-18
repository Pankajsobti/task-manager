/**
 * ai.routes.js
 * Mount this in your main app/server file with:
 *   import aiRoutes from "./routes/ai.routes.js";
 *   app.use("/api/ai", aiRoutes);
 */

import express from "express";
import { verifyToken } from "../middleware/auth.middleware.js";
import {
  chatWithAI,
  suggestTaskBreakdown,
  improveTaskDescription,
  getChatHistory,
} from "../controllers/ai.controller.js";

const router = express.Router();

router.post("/chat", verifyToken, chatWithAI);
router.post("/suggest-breakdown", verifyToken, suggestTaskBreakdown);
router.post("/improve-description", verifyToken, improveTaskDescription);
router.get("/history", verifyToken, getChatHistory);

export default router;