import mongoose from "mongoose";

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Task title is required"],
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [2000, "Description cannot exceed 2000 characters"],
    },
    board: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Board",
      required: true,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    status: {
      type: String,
      enum: {
        values: ["todo", "in-progress", "done"],
        message: "Status must be one of: todo, in-progress, done",
      },
      default: "todo",
    },
    priority: {
      type: String,
      enum: {
        values: ["low", "medium", "high"],
        message: "Priority must be one of: low, medium, high",
      },
      default: "medium",
    },
    dueDate: {
      type: Date,
      default: null,
    },
    tags: [
      {
        type: String,
        trim: true,
        maxlength: 50,
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    aiSuggestion: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

taskSchema.index({ board: 1, status: 1 });
taskSchema.index({ assignedTo: 1 });

const Task = mongoose.model("Task", taskSchema);

export default Task;