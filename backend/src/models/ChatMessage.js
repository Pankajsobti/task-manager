/**
 * ChatMessage.js
 * Stores individual messages from the user <-> AI assistant conversation.
 */

import mongoose from "mongoose";

const { Schema } = mongoose;

const chatMessageSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  role: {
    type: String,
    enum: ["user", "assistant"],
    required: true,
  },
  content: {
    type: String,
    required: true,
    trim: true,
  },
  relatedTask: {
    type: Schema.Types.ObjectId,
    ref: "Task",
    default: null,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

// Speeds up "get last N messages for this user" queries
chatMessageSchema.index({ user: 1, timestamp: -1 });

const ChatMessage = mongoose.model("ChatMessage", chatMessageSchema);

export default ChatMessage;