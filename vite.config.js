import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, loadEnv } from 'vite';
import { handleGeminiChatRequest } from './server/geminiService.js';

/**
 * Custom Vite plugin to handle /api/saathi/chat during local development.
 * Bridges frontend AI requests directly to Google Gemini securely via server/geminiService.js.
 */
function geminiDevProxyPlugin() {
  return {
    name: 'gemini-dev-proxy',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url ? req.url.split('?')[0] : '';
        if (url === '/api/saathi/chat' && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk) => {
            body += chunk;
          });
          req.on('end', async () => {
            try {
              const payload = JSON.parse(body || '{}');
              const result = await handleGeminiChatRequest(payload);
              res.setHeader('Content-Type', 'application/json');
              res.statusCode = 200;
              res.end(JSON.stringify(result));
            } catch (err) {
              const status = err.status || 500;
              res.setHeader('Content-Type', 'application/json');
              res.statusCode = status;
              res.end(JSON.stringify({
                error: err.message || 'Error processing AI chat request.',
                code: err.code || 'AI_PROXY_ERROR',
                originalError: err.originalError || null,
              }));
            }
          });
          return;
        }

        if (url === '/api/health' && req.method === 'GET') {
          res.setHeader('Content-Type', 'application/json');
          res.statusCode = 200;
          res.end(JSON.stringify({
            status: 'ok',
            service: 'YaadSaathi Gemini AI Gateway (Vite Dev)',
            timestamp: new Date().toISOString(),
          }));
          return;
        }

        next();
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Populate process.env so GEMINI_API_KEY is available in backend proxy
  const env = loadEnv(mode, process.cwd(), '');
  Object.assign(process.env, env);

  return {
    plugins: [
      react(),
      tailwindcss(),
      geminiDevProxyPlugin(),
    ],
  };
});

