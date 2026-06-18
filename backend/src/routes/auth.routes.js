import { Router } from "express";
import { register, login, getMe, logout } from "../controllers/auth.controller.js";
import { verifyToken } from "../middleware/auth.middleware.js";
import rateLimit from "express-rate-limit";
const router = Router();

// ADD before your routes:
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: "Too many attempts, please try again later." }
});

// Public routes
// CHANGE these two lines:
router.post("/register", authLimiter, register);
router.post("/login", authLimiter, login);
router.post("/logout", logout);

// Protected routes
router.get("/me", verifyToken, getMe);

export default router;