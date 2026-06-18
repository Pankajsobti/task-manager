import { Router } from "express";
import { verifyToken } from "../middleware/auth.middleware.js";
import {
  createBoard,
  getMyBoards,
  getBoardById,
  updateBoard,
  deleteBoard,
} from "../controllers/board.controller.js";

const router = Router();

// All board routes require authentication
router.use(verifyToken);

router.post("/", createBoard);
router.get("/", getMyBoards);
router.get("/:id", getBoardById);
router.put("/:id", updateBoard);
router.delete("/:id", deleteBoard);

export default router;