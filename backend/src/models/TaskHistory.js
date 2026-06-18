import mongoose from "mongoose";

const taskHistorySchema = new mongoose.Schema({
  task: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Task",
    required: true,
  },
  changedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  changeType: {
    type: String,
    required: true,
    trim: true,
    // e.g. "status", "title", "description", "assignedTo", "priority", "dueDate", "tags"
  },
  oldValue: {
    type: mongoose.Schema.Types.Mixed,
    default: null,
  },
  newValue: {
    type: mongoose.Schema.Types.Mixed,
    default: null,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

taskHistorySchema.index({ task: 1, timestamp: -1 });

const TaskHistory = mongoose.model("TaskHistory", taskHistorySchema);

export default TaskHistory;