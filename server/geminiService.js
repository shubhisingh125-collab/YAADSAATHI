/**
 * server/geminiService.js
 * Secure Server-side Gemini AI Service for YaadSaathi.
 * 
 * SECURITY & ARCHITECTURE:
 * - Uses official @google/genai JavaScript SDK.
 * - Reads GEMINI_API_KEY strictly from server environment (process.env.GEMINI_API_KEY).
 * - Never exposes API keys to client browsers.
 * - Accepts standard YaadSaathi AI request payloads:
 *   { model, systemPrompt, messages, context, userId }
 * - Converts messages and system prompt to Gemini format with safety instructions.
 * - Normalizes responses into standard YaadSaathi schema:
 *   { text, provider: 'google-gemini', model, usage, metadata }
 * - Robust error handling for missing keys, network timeouts, invalid keys, and API errors.
 */

import { GoogleGenAI } from '@google/genai';

/**
 * Normalizes model names and maps legacy/deprecated identifiers to active models.
 * @param {string} [requestedModel]
 * @returns {string}
 */
export function resolveGeminiModel(requestedModel) {
  if (!requestedModel || typeof requestedModel !== 'string') {
    return process.env.VITE_SAATHI_AI_MODEL || 'gemini-3.5-flash-lite';
  }

  const clean = requestedModel.trim();
  // Map older/unavailable models to active 3.5 flash lite
  if (clean === 'gemini-2.5-flash-lite' || clean === 'gemini-2.5-flash' || clean === 'saathi-elder-v1') {
    return 'gemini-3.5-flash-lite';
  }

  return clean;
}

/**
 * Formats client messages array into Gemini SDK contents format.
 * @param {Array<{ role: string, content: string }>} [messages=[]]
 * @returns {Array<{ role: string, parts: Array<{ text: string }> }>}
 */
export function formatGeminiContents(messages = []) {
  if (!Array.isArray(messages) || messages.length === 0) {
    return [{ role: 'user', parts: [{ text: 'Hello' }] }];
  }

  const contents = [];

  for (const msg of messages) {
    if (!msg || typeof msg !== 'object') continue;
    const rawRole = (msg.role || 'user').toLowerCase();
    const role = (rawRole === 'assistant' || rawRole === 'model') ? 'model' : 'user';
    const text = typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content || '');

    // Avoid empty parts
    if (!text.trim()) continue;

    // Gemini requires alternating roles or merges contiguous identical roles
    if (contents.length > 0 && contents[contents.length - 1].role === role) {
      contents[contents.length - 1].parts.push({ text });
    } else {
      contents.push({
        role,
        parts: [{ text }],
      });
    }
  }

  // Ensure there is at least one user message
  if (contents.length === 0) {
    contents.push({ role: 'user', parts: [{ text: 'Hello' }] });
  }

  return contents;
}

/**
 * Handles an incoming Saathi AI chat request and forwards it securely to Google Gemini.
 * 
 * @param {Object} payload
 * @param {string} [payload.model]
 * @param {string} [payload.systemPrompt]
 * @param {Array<{ role: string, content: string }>} [payload.messages]
 * @param {Object} [payload.context]
 * @param {string} [payload.userId]
 * @returns {Promise<{
 *   text: string,
 *   provider: string,
 *   model: string,
 *   usage: Object,
 *   metadata: Object
 * }>}
 */
export async function handleGeminiChatRequest(payload = {}) {
  // 1. Validate API Key Presence
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || typeof apiKey !== 'string' || !apiKey.trim()) {
    const error = new Error('GEMINI_API_KEY is not configured on the server. Please set GEMINI_API_KEY in your server environment or .env.local file.');
    error.status = 500;
    error.code = 'MISSING_API_KEY';
    throw error;
  }

  // 2. Resolve Model
  const model = resolveGeminiModel(payload.model);

  // 3. Prepare Prompt & Contents
  const systemPrompt = typeof payload.systemPrompt === 'string' ? payload.systemPrompt : '';
  const contents = formatGeminiContents(payload.messages);

  // 4. Initialize GoogleGenAI client
  const ai = new GoogleGenAI({ apiKey: apiKey.trim() });

  // 5. Build Config
  const config = {};
  if (systemPrompt.trim()) {
    config.systemInstruction = systemPrompt.trim();
  }

  // 6. Execute Request to Gemini API
  try {
    const response = await ai.models.generateContent({
      model,
      contents,
      config: Object.keys(config).length > 0 ? config : undefined,
    });

    const replyText = response.text ? response.text.trim() : '';
    if (!replyText) {
      const emptyError = new Error('Google Gemini returned an empty response.');
      emptyError.status = 502;
      emptyError.code = 'EMPTY_RESPONSE';
      throw emptyError;
    }

    const candidate = response.candidates?.[0];
    const usage = response.usageMetadata || {};

    return {
      text: replyText,
      provider: 'google-gemini',
      model,
      usage: {
        promptTokens: usage.promptTokenCount || 0,
        candidatesTokens: usage.candidatesTokenCount || 0,
        totalTokens: usage.totalTokenCount || 0,
      },
      metadata: {
        finishReason: candidate?.finishReason || 'STOP',
        modelVersion: response.modelVersion || model,
        timestamp: new Date().toISOString(),
      },
    };
  } catch (err) {
    // If it's already an error with status/code, rethrow
    if (err.status && err.code) throw err;

    // Classify error
    const msg = err.message || '';
    let status = 500;
    let code = 'GEMINI_API_ERROR';

    if (msg.includes('API_KEY_INVALID') || msg.includes('401') || msg.includes('PERMISSION_DENIED')) {
      status = 401;
      code = 'INVALID_API_KEY';
    } else if (msg.includes('404') || msg.includes('NOT_FOUND')) {
      status = 404;
      code = 'MODEL_NOT_FOUND';
    } else if (msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED')) {
      status = 429;
      code = 'RATE_LIMIT_EXCEEDED';
    } else if (msg.includes('ETIMEDOUT') || msg.includes('timeout') || msg.includes('fetch failed')) {
      status = 504;
      code = 'NETWORK_TIMEOUT';
    }

    const formattedError = new Error(err.message || 'Error communicating with Google Gemini API.');
    formattedError.status = status;
    formattedError.code = code;
    formattedError.originalError = msg;
    throw formattedError;
  }
}
