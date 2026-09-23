/**
 * scripts/verifyGeminiIntegration.js
 */

import http from 'node:http';
import { handleGeminiChatRequest } from '../server/geminiService.js';
import { createServer } from '../server/index.js';
import { buildSaathiSystemPrompt } from '../src/services/ai/saathiPromptBuilder.js';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failed++;
  }
}

async function runTests() {
  console.log('====================================================');
  console.log('YAADSAATHI GOOGLE GEMINI AI INTEGRATION SUITE');
  console.log('====================================================\n');

  const realApiKey = process.env.GEMINI_API_KEY;
  if (!realApiKey) {
    console.error('❌ Error: GEMINI_API_KEY is not set in environment.');
    return;
  }

  // TEST 1: Direct Gemini Service with Personalized Context
  console.log('--- TEST 1: Direct Gemini Service with Real Context ---');
  const mockContext = {
    userName: 'Bhaben Das',
    age: 72,
    preferredLanguage: 'hi',
    stateOrRegion: 'ASSAM',
    subRegion: 'Brahmaputra Valley',
    interests: ['bihu songs', 'gardening'],
    familiarFoods: ['pitha', 'assam tea'],
    familiarPlaces: ['Kaziranga', 'Guwahati'],
    festivals: ['Rongali Bihu'],
    routines: [
      { time: '07:00 AM', title: 'Morning walk in garden' },
      { time: '08:00 AM', title: 'Assam Tea and breakfast' }
    ],
    memories: [
      { title: 'Tea garden visit with grandson', relationship: 'Grandson Aarav', description: 'Plucking tea leaves in Tezpur' }
    ],
    todayPlan: {
      activities: [
        { title: 'Memory Match', titleHindi: 'स्मृति मिलान', difficultyLabel: 'Gentle', difficultyLabelHindi: 'सरल', reason: 'Focus on visual memory', reasonHindi: 'दृष्टि स्मृति अभ्यास' },
        { title: 'Daily Routine Recall', titleHindi: 'दैनिक दिनचर्या स्मरण', difficultyLabel: 'Easy', difficultyLabelHindi: 'सहज', reason: 'Recall daily sequence', reasonHindi: 'दिनचर्या का स्मरण' },
        { title: 'Sequence Recall', titleHindi: 'क्रम स्मरण', difficultyLabel: 'Gentle', difficultyLabelHindi: 'सरल', reason: 'Gentle sequencing', reasonHindi: 'क्रमबद्ध अभ्यास' }
      ]
    }
  };

  const systemPrompt = buildSaathiSystemPrompt(mockContext, 'नमस्ते साथी');

  try {
    const t0 = Date.now();
    const res = await handleGeminiChatRequest({
      model: 'gemini-3.5-flash-lite',
      systemPrompt,
      messages: [
        { role: 'user', content: 'नमस्ते साथी, आज मुझे क्या करना चाहिए?' }
      ],
      context: mockContext,
      userId: 'test-user-bhaben'
    });
    console.log(`  Received in ${Date.now() - t0}ms`);
    console.log(`  AI Response: "${res.text}"`);
    assert(Boolean(res.text && res.text.length > 5), 'Received valid reply text');
    assert(res.provider === 'google-gemini', `Provider is "google-gemini"`);
    assert(res.model === 'gemini-3.5-flash-lite', `Model is "gemini-3.5-flash-lite"`);
    assert(typeof res.usage === 'object' && res.usage.totalTokens > 0, `Usage metadata returned (Total tokens: ${res.usage.totalTokens})`);
  } catch (err) {
    assert(false, `Real Gemini request failed: ${err.message}`);
  }

  // TEST 2: Error Handling - Missing API Key
  console.log('\n--- TEST 2: Error Handling - Missing API Key ---');
  delete process.env.GEMINI_API_KEY;
  try {
    await handleGeminiChatRequest({
      model: 'gemini-3.5-flash-lite',
      messages: [{ role: 'user', content: 'Hello' }]
    });
    assert(false, 'Should throw error when GEMINI_API_KEY is missing');
  } catch (err) {
    assert(err.code === 'MISSING_API_KEY', `Correctly threw MISSING_API_KEY error (Got code: ${err.code})`);
  }
  // Restore API key
  process.env.GEMINI_API_KEY = realApiKey;

  // TEST 3: Standalone HTTP Server Endpoint Test
  console.log('\n--- TEST 3: Standalone HTTP Server Endpoint (/api/saathi/chat) ---');
  const server = createServer();
  const testPort = 3991;

  await new Promise((resolve) => server.listen(testPort, '127.0.0.1', resolve));
  console.log(`  Test server listening on 127.0.0.1:${testPort}`);

  // Test GET /api/health
  const healthResult = await new Promise((resolve, reject) => {
    http.get(`http://127.0.0.1:${testPort}/api/health`, (res) => {
      let data = '';
      res.on('data', (c) => { data += c; });
      res.on('end', () => resolve({ status: res.statusCode, data: JSON.parse(data) }));
    }).on('error', reject);
  });

  assert(healthResult.status === 200 && healthResult.data.status === 'ok', 'Health endpoint returned 200 OK');

  // Test POST /api/saathi/chat
  const chatPayload = JSON.stringify({
    model: 'gemini-3.5-flash-lite',
    systemPrompt: 'You are Saathi, a friendly companion. Keep answers to 1 short sentence.',
    messages: [
      { role: 'user', content: 'Hello Saathi! Tell me a cheerful greeting.' }
    ],
    userId: 'http-test-user'
  });

  console.log('  Sending POST /api/saathi/chat...');
  const chatResponse = await new Promise((resolve, reject) => {
    const req = http.request({
      hostname: '127.0.0.1',
      port: testPort,
      path: '/api/saathi/chat',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(chatPayload),
      },
    }, (res) => {
      let data = '';
      res.on('data', (c) => { data += c; });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data, parseError: e });
        }
      });
    });
    req.on('error', reject);
    req.write(chatPayload);
    req.end();
  });

  console.log('  POST /api/saathi/chat received:', chatResponse.data?.text);
  assert(chatResponse.status === 200, `POST /api/saathi/chat returned HTTP 200 (Got: ${chatResponse.status})`);
  assert(Boolean(chatResponse.data?.text), `HTTP endpoint returned reply text: "${chatResponse.data?.text}"`);
  assert(chatResponse.data?.provider === 'google-gemini', `HTTP endpoint returned provider "google-gemini"`);
  assert(chatResponse.data?.model === 'gemini-3.5-flash-lite', `HTTP endpoint returned model "gemini-3.5-flash-lite"`);

  // Close server
  await new Promise((resolve) => server.close(resolve));
  console.log('  Test server closed cleanly.');

  // Summary
  console.log('\n====================================================');
  console.log(`TEST SUMMARY: ${passed} Passed, ${failed} Failed`);
  console.log('====================================================\n');
}

runTests();
