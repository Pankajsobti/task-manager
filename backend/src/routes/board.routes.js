import { Router } from "express";
import { verifyToken } from "../middleware/auth.middleware.js";
import {
  createBoard,
  getMyBoards,
  getBoardById,
  updateBoard,
  deleteBoard,
  inviteMember,
  getSharedBoards,
} from "../controllers/board.controller.js";

const router = Router();

// All board routes require authentication
router.use(verifyToken);

router.post("/", createBoard);
router.get("/", getMyBoards);
router.get("/shared", getSharedBoards); // must come before /:id
router.get("/:id", getBoardById);
router.put("/:id", updateBoard);
router.delete("/:id", deleteBoard);
router.post("/:boardId/invite", inviteMember);

export default router;