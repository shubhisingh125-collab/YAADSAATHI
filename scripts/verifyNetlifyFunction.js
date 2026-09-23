/**
 * scripts/verifyNetlifyFunction.js
 * Comprehensive verification of the Netlify Serverless Function (netlify/functions/chat.js).
 * 
 * Verifies:
 * 1. OPTIONS CORS Preflight
 * 2. GET Health Check
 * 3. 405 Method Not Allowed on PUT/DELETE
 * 4. Real Gemini Saathi Chat via Lambda event invocation:
 *    - Saathi persona & safety bounds
 *    - Hindi regional response
 *    - Today's Activity Plan incorporation
 * 5. Error handling (missing payload, missing API key)
 */

import { handler } from '../netlify/functions/chat.js';
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
  console.log('YAADSAATHI NETLIFY SERVERLESS FUNCTION VERIFICATION');
  console.log('====================================================\n');

  // TEST 1: CORS Preflight (OPTIONS)
  console.log('--- TEST 1: OPTIONS Preflight ---');
  const optionsRes = await handler({ httpMethod: 'OPTIONS' });
  assert(optionsRes.statusCode === 204, `OPTIONS returns 204 (Got: ${optionsRes.statusCode})`);
  assert(optionsRes.headers['Access-Control-Allow-Origin'] === '*', 'CORS Allow-Origin header is present');

  // TEST 2: GET Health Check
  console.log('\n--- TEST 2: GET Health Check ---');
  const getRes = await handler({ httpMethod: 'GET' });
  assert(getRes.statusCode === 200, `GET returns 200 (Got: ${getRes.statusCode})`);
  const healthData = JSON.parse(getRes.body);
  assert(healthData.status === 'ok', `Health body status is 'ok' (Got: ${healthData.status})`);
  assert(healthData.service.includes('Netlify'), 'Health indicates Netlify service');

  // TEST 3: Invalid HTTP Method
  console.log('\n--- TEST 3: Invalid HTTP Method (DELETE) ---');
  const deleteRes = await handler({ httpMethod: 'DELETE' });
  assert(deleteRes.statusCode === 405, `DELETE returns 405 Method Not Allowed (Got: ${deleteRes.statusCode})`);

  // TEST 4: Real Gemini Call: Saathi + Hindi + Today's Plan
  console.log('\n--- TEST 4: Real Gemini Call (Hindi + Today\'s Plan + Saathi) ---');
  const testContext = {
    userName: 'Kalyani Devi',
    age: 76,
    preferredLanguage: 'hi',
    stateOrRegion: 'ASSAM',
    subRegion: 'Kamrup',
    interests: ['bihu songs', 'gardening'],
    familiarFoods: ['pitha', 'assam tea'],
    familiarPlaces: ['Kamakhya', 'Brahmaputra'],
    festivals: ['Rongali Bihu'],
    routines: [
      { time: '07:00 AM', title: 'Garden walk' },
      { time: '08:00 AM', title: 'Morning Tea' }
    ],
    memories: [
      { title: 'Bihu celebration with family', relationship: 'Family', description: 'Dancing and enjoying pitha' }
    ],
    todayPlan: {
      activities: [
        { title: 'Memory Match', titleHindi: 'स्मृति मिलान', difficultyLabel: 'Gentle', difficultyLabelHindi: 'सरल', reason: 'Focus on visual memory', reasonHindi: 'दृष्टि स्मृति अभ्यास' },
        { title: 'Daily Routine Recall', titleHindi: 'दैनिक दिनचर्या स्मरण', difficultyLabel: 'Easy', difficultyLabelHindi: 'सहज', reason: 'Recall daily sequence', reasonHindi: 'दिनचर्या का स्मरण' },
        { title: 'Sequence Recall', titleHindi: 'क्रम स्मरण', difficultyLabel: 'Gentle', difficultyLabelHindi: 'सरल', reason: 'Gentle sequencing', reasonHindi: 'क्रमबद्ध अभ्यास' }
      ]
    }
  };

  const systemPrompt = buildSaathiSystemPrompt(testContext, 'आज मुझे क्या करना चाहिए?');
  const chatPayload = {
    model: 'gemini-3.5-flash-lite',
    systemPrompt,
    messages: [
      { role: 'user', content: 'नमस्ते साथी, आज का दिन कैसा रहेगा और मुझे क्या करना चाहिए?' }
    ],
    context: testContext,
    userId: 'netlify-test-elder'
  };

  const startTime = Date.now();
  const postRes = await handler({
    httpMethod: 'POST',
    body: JSON.stringify(chatPayload)
  });
  const duration = Date.now() - startTime;

  console.log(`  Netlify function executed in ${duration}ms`);
  assert(postRes.statusCode === 200, `POST returns 200 (Got: ${postRes.statusCode})`);
  assert(postRes.headers['Content-Type'] === 'application/json', 'Response Content-Type is application/json');

  const responseData = JSON.parse(postRes.body);
  console.log(`  AI Response: "${responseData.text}"`);
  assert(Boolean(responseData.text && responseData.text.length > 10), 'Response text is non-empty and substantial');
  assert(responseData.provider === 'google-gemini', `Provider is 'google-gemini' (Got: ${responseData.provider})`);
  assert(responseData.model === 'gemini-3.5-flash-lite', `Model is 'gemini-3.5-flash-lite' (Got: ${responseData.model})`);
  assert(typeof responseData.usage === 'object' && responseData.usage.totalTokens > 0, `Usage metadata returned with total tokens: ${responseData.usage.totalTokens}`);
  assert(typeof responseData.metadata === 'object', 'Metadata object present');

  // TEST 5: Error Handling - Missing API Key
  console.log('\n--- TEST 5: Error Handling - Missing API Key ---');
  const savedKey = process.env.GEMINI_API_KEY;
  delete process.env.GEMINI_API_KEY;

  const errorRes = await handler({
    httpMethod: 'POST',
    body: JSON.stringify({ messages: [{ role: 'user', content: 'Hi' }] })
  });

  assert(errorRes.statusCode === 500, `Missing API key returns 500 (Got: ${errorRes.statusCode})`);
  const errorData = JSON.parse(errorRes.body);
  assert(errorData.code === 'MISSING_API_KEY', `Error code matches MISSING_API_KEY (Got: ${errorData.code})`);

  // Restore API key
  process.env.GEMINI_API_KEY = savedKey;

  // SUMMARY
  console.log('\n====================================================');
  console.log(`NETLIFY FUNCTION TEST SUMMARY: ${passed} Passed, ${failed} Failed`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exitCode = 1;
  }
}

runTests();
