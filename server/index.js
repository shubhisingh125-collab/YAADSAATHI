/**
 * server/index.js
 * Standalone Backend API Proxy for YaadSaathi.
 * 
 * Provides:
 * - POST /api/saathi/chat -> Proxies request safely to Google Gemini using @google/genai
 * - GET  /api/health      -> Health check
 */

import http from 'node:http';
import { handleGeminiChatRequest } from './geminiService.js';

const PORT = process.env.PORT || 3001;

function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

export function createServer() {
  return http.createServer(async (req, res) => {
    setCorsHeaders(res);

    if (req.method === 'OPTIONS') {
      res.statusCode = 204;
      res.end();
      return;
    }

    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

    if (url.pathname === '/api/health' && req.method === 'GET') {
      res.setHeader('Content-Type', 'application/json');
      res.statusCode = 200;
      res.end(JSON.stringify({
        status: 'ok',
        service: 'YaadSaathi Gemini AI Gateway',
        timestamp: new Date().toISOString(),
      }));
      return;
    }

    if (url.pathname === '/api/saathi/chat' && req.method === 'POST') {
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

    res.statusCode = 404;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Endpoint not found' }));
  });
}

// If executed directly
if (process.argv[1] && process.argv[1].endsWith('index.js')) {
  const server = createServer();
  server.listen(PORT, () => {
    console.log(`[YaadSaathi Gemini Gateway] Running on http://localhost:${PORT}`);
  });
}
