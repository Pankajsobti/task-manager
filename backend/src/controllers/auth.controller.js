import User from "../models/User.js";
import generateToken from "../utils/generateToken.js";

// ─── Helper ──────────────────────────────────────────────────────────────────

/**
 * Sends the JWT as an httpOnly cookie AND in the response body.
 * The cookie is used by browser clients; the body token is for API/mobile clients.
 */
const sendTokenResponse = (user, statusCode, res) => {
  const token = generateToken(user._id);

  const cookieOptions = {
    httpOnly: true,                              // not accessible via JS
    secure: process.env.NODE_ENV === "production", // HTTPS only in production
    sameSite: "strict",                          // CSRF protection
    maxAge: 7 * 24 * 60 * 60 * 1000,            // 7 days in ms
  };

  res
    .status(statusCode)
    .cookie("jwt", token, cookieOptions)
    .json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
};

// ─── Controllers ─────────────────────────────────────────────────────────────

/**
 * POST /api/auth/register
 * Validates input, checks for duplicate email, creates user, returns JWT.
 */
export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Basic input validation
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide name, email, and password.",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters.",
      });
    }

    // Check for duplicate email
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists.",
      });
    }

    // Create the user (password is hashed by the pre-save hook in the model)
    const user = await User.create({ name, email, password });

    sendTokenResponse(user, 201, res);
  } catch (error) {
    // Handle Mongoose validation errors
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: messages.join(". ") });
    }

    console.error("Register error:", error);
    res.status(500).json({ success: false, message: "Server error during registration." });
  }
};

/**
 * POST /api/auth/login
 * Finds user by email, verifies password, returns JWT + user info.
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide both email and password.",
      });
    }

    // Explicitly select password since it's excluded by default (select: false)
    const user = await User.findOne({ email: email.toLowerCase() }).select("+password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",  // intentionally vague for security
      });
    }

    const isPasswordCorrect = await user.comparePassword(password);
    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    sendTokenResponse(user, 200, res);
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ success: false, message: "Server error during login." });
  }
};

/**
 * GET /api/auth/me  (protected — requires verifyToken middleware)
 * Returns the currently authenticated user's profile.
 */
export const getMe = async (req, res) => {
  try {
    // req.user is attached by verifyToken middleware
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("GetMe error:", error);
    res.status(500).json({ success: false, message: "Server error fetching profile." });
  }
};

/**
 * POST /api/auth/logout
 * Clears the httpOnly JWT cookie and returns a success message.
 */
export const logout = (req, res) => {
  res
    .status(200)
    // ADD:
.cookie("jwt", "", {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
  expires: new Date(0),
})
    .json({ success: true, message: "Logged out successfully." });
};