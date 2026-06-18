/**
 * ollama.service.js
 * Thin wrapper around the local Ollama REST API.
 *
 * Requires Node 18+ (for global fetch). If you're on an older Node version,
 * install node-fetch and import it here instead.
 */

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
const PRIMARY_MODEL = process.env.OLLAMA_MODEL || "llama3";
const FALLBACK_MODEL = process.env.OLLAMA_FALLBACK_MODEL || "mistral";
const REQUEST_TIMEOUT_MS = 60_000; // generous timeout, local models can be slow on CPU

const FALLBACK_MESSAGE =
  "I'm sorry, the AI assistant is currently unavailable. Please make sure Ollama is running locally (`ollama serve`) and that the model has been pulled, then try again.";

/**
 * Low-level call to POST /api/generate for a specific model.
 * Throws on any network error or non-2xx response.
 */
async function callOllama(model, prompt, systemPrompt) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        prompt,
        system: systemPrompt || undefined,
        stream: false,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      throw new Error(
        `Ollama responded with status ${response.status} for model "${model}": ${errorText}`
      );
    }

    const data = await response.json();
    return (data?.response ?? "").trim();
  } catch (err) {
    if (err.name === "AbortError") {
      throw new Error(`Ollama request timed out after ${REQUEST_TIMEOUT_MS}ms (model: "${model}")`);
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * askOllama
 * Sends a prompt (and optional system prompt) to the local Ollama instance.
 * Tries the primary model first, falls back to a secondary model on failure,
 * and finally returns a friendly fallback string if Ollama is unreachable entirely.
 *
 * @param {string} prompt - The user-facing prompt / question.
 * @param {string} [systemPrompt] - Optional system instructions for the model.
 * @returns {Promise<string>} The model's text response (or a fallback message).
 */
export async function askOllama(prompt, systemPrompt = "") {
  if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
    throw new Error("askOllama requires a non-empty string prompt");
  }

  try {
    return await callOllama(PRIMARY_MODEL, prompt, systemPrompt);
  } catch (primaryError) {
    console.error(
      `[ollama.service] Primary model "${PRIMARY_MODEL}" failed: ${primaryError.message}`
    );

    try {
      console.warn(`[ollama.service] Falling back to model "${FALLBACK_MODEL}"`);
      return await callOllama(FALLBACK_MODEL, prompt, systemPrompt);
    } catch (fallbackError) {
      console.error(
        `[ollama.service] Fallback model "${FALLBACK_MODEL}" also failed: ${fallbackError.message}`
      );
      return FALLBACK_MESSAGE;
    }
  }
}

export default { askOllama };