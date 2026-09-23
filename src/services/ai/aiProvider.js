/**
 * aiProvider.js
 * Standardized AI Provider Adapter for YaadSaathi.
 * Decouples the UI and dialogue engine from any specific LLM provider or SDK.
 */

import { getAIProviderConfig } from './aiProviderConfig.js';

let customAdapter = null;

/**
 * Registers a custom AI provider adapter function (useful for tests or backend proxies).
 * @param {Function|null} adapterFn - Async function({ messages, systemPrompt, context, userId }) => { text, provider, model }
 */
export function setCustomAIProviderAdapter(adapterFn) {
  customAdapter = adapterFn;
}

/**
 * Clears any registered custom adapter.
 */
export function clearCustomAIProviderAdapter() {
  customAdapter = null;
}

/**
 * Sends messages and context to the configured AI provider.
 * 
 * @param {Object} params
 * @param {Array<{ role: string, content: string }>} params.messages - Dialogue history
 * @param {string} params.systemPrompt - Pre-built persona & safety instructions
 * @param {Object} [params.context] - Sanitized user & cultural context
 * @param {string} [params.userId]
 * @param {Function} [params.providerOverride] - Optional runtime adapter override
 * @returns {Promise<{
 *   text: string,
 *   provider: string,
 *   model: string,
 *   usage?: Object,
 *   metadata?: Object
 * }>} Normalized AI response
 */
export async function sendAIMessage({
  messages,
  systemPrompt,
  context = {},
  userId = 'default-user',
  providerOverride = null,
}) {
  // 1. Check for custom/override adapter (e.g. testing or local gateway)
  const activeAdapter = providerOverride || customAdapter;
  if (activeAdapter && typeof activeAdapter === 'function') {
    const customResult = await activeAdapter({
      messages,
      systemPrompt,
      context,
      userId,
    });

    return {
      text: customResult.text || '',
      provider: customResult.provider || 'custom-adapter',
      model: customResult.model || 'custom-model',
      usage: customResult.usage || null,
      metadata: customResult.metadata || {},
    };
  }

  // 2. Check runtime environment configuration
  const config = getAIProviderConfig();
  if (!config.isConfigured || !config.endpoint) {
    const error = new Error('Saathi AI is not configured. Please configure an AI provider endpoint in the environment.');
    error.code = 'NOT_CONFIGURED';
    error.isConfigured = false;
    throw error;
  }

  // 3. Dispatch to standard HTTP endpoint / backend proxy
  try {
    const payload = {
      model: config.model,
      systemPrompt,
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      context,
      userId,
    };

    const response = await fetch(config.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errBody = await response.text().catch(() => '');
      throw new Error(`AI Provider returned HTTP ${response.status}: ${errBody}`);
    }

    const data = await response.json();
    const replyText = data.text || data.message?.content || data.choices?.[0]?.message?.content || '';

    if (!replyText) {
      throw new Error('AI Provider returned an empty response.');
    }

    return {
      text: replyText.trim(),
      provider: config.provider || 'backend-proxy',
      model: config.model,
      usage: data.usage || null,
      metadata: data.metadata || {},
    };
  } catch (err) {
    if (err.code === 'NOT_CONFIGURED') throw err;
    const unavailableErr = new Error('Saathi AI is currently unavailable. Please try again later.');
    unavailableErr.code = 'UNAVAILABLE';
    unavailableErr.originalError = err.message;
    throw unavailableErr;
  }
}
