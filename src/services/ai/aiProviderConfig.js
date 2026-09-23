/**
 * aiProviderConfig.js
 * Safe, client-side configuration for YaadSaathi AI Provider Adapter.
 * 
 * SECURITY:
 * - Does NOT hard-code secret API keys.
 * - Relies only on public/non-secret VITE_ environment variables or custom backend proxies.
 * - If no provider endpoint or configuration is provided, gracefully reports unconfigured state.
 */

/**
 * Returns the current runtime AI provider configuration.
 * @returns {{
 *   provider: string|null,
 *   endpoint: string|null,
 *   model: string|null,
 *   isConfigured: boolean
 * }}
 */
export function getAIProviderConfig() {
  // Support both Vite browser environment (import.meta.env) and Node.js testing (process.env)
  const env = (typeof import.meta !== 'undefined' && import.meta.env)
    ? import.meta.env
    : (typeof process !== 'undefined' && process.env)
      ? process.env
      : {};

  const isBrowser = typeof window !== 'undefined';
  const provider = env.VITE_SAATHI_AI_PROVIDER || env.SAATHI_AI_PROVIDER || (isBrowser ? 'google-gemini' : null);
  const endpoint = env.VITE_SAATHI_AI_ENDPOINT || env.SAATHI_AI_ENDPOINT || (isBrowser ? '/api/saathi/chat' : null);
  const model = env.VITE_SAATHI_AI_MODEL || env.SAATHI_AI_MODEL || 'gemini-3.5-flash-lite';

  const isConfigured = Boolean(provider && (endpoint || provider === 'mock' || provider === 'local'));

  return {
    provider,
    endpoint,
    model,
    isConfigured,
  };
}

/**
 * Checks if a real or mock AI provider is actively configured.
 * @returns {boolean}
 */
export function isAIProviderConfigured() {
  return getAIProviderConfig().isConfigured;
}
