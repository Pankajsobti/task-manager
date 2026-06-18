import { Router } from "express";
import { verifyToken } from "../middleware/auth.middleware.js";
import {
  createTask,
  getTasksByBoard,
  getTaskById,
  updateTask,
  deleteTask,
  getTaskHistory,
} from "../controllers/task.controller.js";

const router = Router();

// All task routes require authentication
router.use(verifyToken);

router.post("/", createTask);
router.get("/", getTasksByBoard);           // ?board=<boardId>
router.get("/:id", getTaskById);
router.put("/:id", updateTask);
router.delete("/:id", deleteTask);
router.get("/:id/history", getTaskHistory);

export default router;