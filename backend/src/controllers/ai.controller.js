/**
 * ai.controller.js
 * Controller layer for all AI-assistant related endpoints.
 *
 * NOTE: This assumes your verifyToken middleware attaches the authenticated
 * user as `req.user` with an `id` (or `_id`) field, e.g. req.user = { id: "...". }
 * If your middleware uses `req.user._id` instead, swap `req.user.id` below.
 */

import { askOllama } from "../services/ollama.service.js";
import ChatMessage from "../models/ChatMessage.js";

const BASE_SYSTEM_PROMPT = `You are a professional task management AI assistant embedded in a task manager application.
You help users plan, organize, prioritize, and clarify their tasks.
Be concise, practical, and encouraging. Avoid unnecessary repetition and keep responses focused on actionable advice.`;

/**
 * Builds the system prompt, optionally enriched with task context.
 * taskContext shape: { taskId, title, description }
 */
function buildSystemPrompt(taskContext) {
  if (!taskContext || (!taskContext.title && !taskContext.description)) {
    return BASE_SYSTEM_PROMPT;
  }

  let contextBlock = "\n\nThe user is currently discussing the following task:";
  if (taskContext.title) contextBlock += `\nTitle: ${taskContext.title}`;
  if (taskContext.description) contextBlock += `\nDescription: ${taskContext.description}`;

  return `${BASE_SYSTEM_PROMPT}${contextBlock}`;
}

/**
 * POST /api/ai/chat
 * Body: { message: string, taskContext?: { taskId, title, description } }
 */
export const chatWithAI = async (req, res) => {
  try {
    const { message, taskContext } = req.body;

    if (!message || typeof message !== "string" || !message.trim()) {
      return res.status(400).json({ success: false, message: "message is required" });
    }

    const userId = req.user?.id || req.user?._id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const systemPrompt = buildSystemPrompt(taskContext);
    const aiResponse = await askOllama(message, systemPrompt);

    const relatedTask = taskContext?.taskId || null;

    const [userMessageDoc, assistantMessageDoc] = await Promise.all([
      ChatMessage.create({
        user: userId,
        role: "user",
        content: message,
        relatedTask,
      }),
      ChatMessage.create({
        user: userId,
        role: "assistant",
        content: aiResponse,
        relatedTask,
      }),
    ]);

    return res.status(200).json({
      success: true,
      reply: aiResponse,
      messages: {
        user: userMessageDoc,
        assistant: assistantMessageDoc,
      },
    });
  } catch (error) {
    console.error("[ai.controller] chatWithAI error:", error);
    return res.status(500).json({ success: false, message: "Failed to process AI chat request" });
  }
};

/**
 * POST /api/ai/suggest-breakdown
 * Body: { taskTitle: string, taskDescription?: string }
 */
export const suggestTaskBreakdown = async (req, res) => {
  try {
    const { taskTitle, taskDescription } = req.body;

    if (!taskTitle || typeof taskTitle !== "string" || !taskTitle.trim()) {
      return res.status(400).json({ success: false, message: "taskTitle is required" });
    }

    const systemPrompt = `You are a professional task management AI assistant.
Break down tasks into clear, actionable subtasks.
Respond ONLY with a numbered list of 3 to 5 subtasks, one per line. No preamble, no extra commentary, no markdown formatting.`;

    const prompt = `Task title: ${taskTitle}
Task description: ${taskDescription?.trim() || "No description provided."}

Break this task into 3-5 concrete, actionable subtasks.`;

    const rawResponse = await askOllama(prompt, systemPrompt);

    const subtasks = rawResponse
      .split("\n")
      .map((line) =>
        line
          .replace(/^\s*\d+[\.\)]\s*/, "") // strip "1. " / "1) "
          .replace(/^[-*]\s*/, "") // strip "- " / "* "
          .trim()
      )
      .filter((line) => line.length > 0);

    return res.status(200).json({
      success: true,
      subtasks,
      raw: rawResponse,
    });
  } catch (error) {
    console.error("[ai.controller] suggestTaskBreakdown error:", error);
    return res.status(500).json({ success: false, message: "Failed to generate task breakdown" });
  }
};

/**
 * POST /api/ai/improve-description
 * Body: { title: string, description?: string }
 */
export const improveTaskDescription = async (req, res) => {
  try {
    const { title, description } = req.body;

    if (!title || typeof title !== "string" || !title.trim()) {
      return res.status(400).json({ success: false, message: "title is required" });
    }

    const systemPrompt = `You are a professional task management AI assistant.
Rewrite task descriptions to be clear, professional, specific, and actionable.
Respond ONLY with the improved description text. No preamble, no quotation marks, no markdown formatting.`;

    const prompt = `Task title: ${title}
Current description: ${description?.trim() || "No description provided."}

Rewrite the description to be more professional, clear, and specific.`;

    const improvedDescription = await askOllama(prompt, systemPrompt);

    return res.status(200).json({
      success: true,
      improvedDescription: improvedDescription.trim(),
    });
  } catch (error) {
    console.error("[ai.controller] improveTaskDescription error:", error);
    return res.status(500).json({ success: false, message: "Failed to improve task description" });
  }
};

/**
 * GET /api/ai/history
 * Returns the last 50 chat messages for the current user, oldest first.
 */
export const getChatHistory = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const messages = await ChatMessage.find({ user: userId })
      .sort({ timestamp: -1 })
      .limit(50)
      .lean();

    return res.status(200).json({
      success: true,
      count: messages.length,
      messages: messages.reverse(), // oldest first, ready to render top-to-bottom
    });
  } catch (error) {
    console.error("[ai.controller] getChatHistory error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch chat history" });
  }
};