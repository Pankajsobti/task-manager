import Board from "../models/Board.js";

// POST /api/boards
export const createBoard = async (req, res) => {
  try {
    const { title, description, members, color } = req.body;

    const board = await Board.create({
      title,
      description,
      owner: req.user.id,
      members: members ?? [],
      color,
    });

    await board.populate("owner", "email");

    res.status(201).json({ success: true, data: board });
  } catch (err) {
    if (err.name === "ValidationError") {
      const messages = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: messages.join(", ") });
    }
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// GET /api/boards  — boards owned by or shared with the current user
export const getMyBoards = async (req, res) => {
  try {
    const boards = await Board.find({
      $or: [{ owner: req.user.id }, { members: req.user.id }],
    })
      .populate("owner", "email")
      .populate("members", "email")
      .sort({ createdAt: -1 });

    res.json({ success: true, data: boards });
  } catch {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// GET /api/boards/:id
export const getBoardById = async (req, res) => {
  try {
    const board = await Board.findById(req.params.id)
      .populate("owner", "email")
      .populate("members", "email");

    if (!board) {
      return res.status(404).json({ success: false, message: "Board not found" });
    }

    // Allow access to owner or members only
    const userId = req.user.id;
    const isMember =
      board.owner._id.toString() === userId ||
      board.members.some((m) => m._id.toString() === userId);

    if (!isMember) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    res.json({ success: true, data: board });
  } catch {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// PUT /api/boards/:id  — owner only
export const updateBoard = async (req, res) => {
  try {
    const board = await Board.findById(req.params.id);

    if (!board) {
      return res.status(404).json({ success: false, message: "Board not found" });
    }

    if (board.owner.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: "Only the board owner can update it" });
    }

    const { title, description, members, color } = req.body;

    if (title !== undefined) board.title = title;
    if (description !== undefined) board.description = description;
    if (members !== undefined) board.members = members;
    if (color !== undefined) board.color = color;

    await board.save();
    await board.populate("owner", "email");
    await board.populate("members", "email");

    res.json({ success: true, data: board });
  } catch (err) {
    if (err.name === "ValidationError") {
      const messages = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: messages.join(", ") });
    }
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// DELETE /api/boards/:id  — owner only
export const deleteBoard = async (req, res) => {
  try {
    const board = await Board.findById(req.params.id);

    if (!board) {
      return res.status(404).json({ success: false, message: "Board not found" });
    }

    if (board.owner.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: "Only the board owner can delete it" });
    }

    await board.deleteOne();

    res.json({ success: true, message: "Board deleted successfully" });
  } catch {
    res.status(500).json({ success: false, message: "Server error" });
  }
};