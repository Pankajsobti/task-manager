import express from "express";
import { getBoardAnalytics } from "../controllers/analytics.controller.js";

// If you use auth middleware, import and apply it here:
// import { protect } from "../middleware/auth.js";
// router.get("/:boardId", protect, getBoardAnalytics);

const router = express.Router();

router.get("/:boardId", getBoardAnalytics);

export default router;
