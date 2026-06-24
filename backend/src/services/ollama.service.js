/**
 * ollama.service.js
 * Wrapper around Groq's cloud API (OpenAI-compatible, free tier).
 */

import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const PRIMARY_MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
const FALLBACK_MODEL = process.env.GROQ_FALLBACK_MODEL || "llama-3.1-8b-instant";

const FALLBACK_MESSAGE =
  "I'm sorry, the AI assistant is currently unavailable. Please try again in a moment.";

async function callGroq(model, prompt, systemPrompt) {
  const messages = [];
  if (systemPrompt) messages.push({ role: "system", content: systemPrompt });
  messages.push({ role: "user", content: prompt });

  const completion = await groq.chat.completions.create({
    model,
    messages,
  });

  return (completion?.choices?.[0]?.message?.content ?? "").trim();
}

export async function askOllama(prompt, systemPrompt = "") {
  if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
    throw new Error("askOllama requires a non-empty string prompt");
  }

  try {
    return await callGroq(PRIMARY_MODEL, prompt, systemPrompt);
  } catch (primaryError) {
    console.error(`[groq.service] Primary model failed: ${primaryError.message}`);

    try {
      console.warn(`[groq.service] Falling back to model "${FALLBACK_MODEL}"`);
      return await callGroq(FALLBACK_MODEL, prompt, systemPrompt);
    } catch (fallbackError) {
      console.error(`[groq.service] Fallback model also failed: ${fallbackError.message}`);
      return FALLBACK_MESSAGE;
    }
  }
}

export default { askOllama };