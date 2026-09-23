/**
 * scripts/verifySaathiChatGemini.js
 * End-to-end test of the complete Saathi AI flow:
 * SaathiChat -> saathiAIService -> aiProvider.js -> Local HTTP Proxy -> Google Gemini -> IndexedDB
 */

import 'fake-indexeddb/auto';
import { db } from '../src/database/db.js';
import * as userRepository from '../src/database/repositories/userRepository.js';
import * as memoryRepository from '../src/database/repositories/memoryRepository.js';
import { createServer } from '../server/index.js';
import { sendSaathiMessage, getConversationMessages } from '../src/services/ai/saathiAIService.js';

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

async function runTest() {
  console.log('====================================================');
  console.log('SAATHI AI + GEMINI END-TO-END FLOW VERIFICATION');
  console.log('====================================================\n');

  // 1. Start test HTTP gateway server
  const testPort = 3995;
  const server = createServer();
  await new Promise((resolve) => server.listen(testPort, '127.0.0.1', resolve));
  console.log(`  Gateway server listening on 127.0.0.1:${testPort}`);

  // Point environment to this test server endpoint
  process.env.VITE_SAATHI_AI_ENDPOINT = `http://127.0.0.1:${testPort}/api/saathi/chat`;
  process.env.VITE_SAATHI_AI_PROVIDER = 'google-gemini';
  process.env.VITE_SAATHI_AI_MODEL = 'gemini-3.5-flash-lite';

  try {
    // 2. Clear and seed database
    await db.users.clear();
    await db.aiConversations.clear();
    await db.aiMessages.clear();
    await db.memories.clear();
    await db.gameResults.clear();

    const userId = 'elder-user-assam-1';
    await userRepository.createUser({
      id: userId,
      name: 'Ramen Borah',
      age: 74,
      stateOrRegion: 'ASSAM',
      subRegion: 'Jorhat',
      primaryLanguage: 'hi',
      culturalInterests: ['Bihu dance', 'traditional weaving'],
      familiarFoods: ['khar', 'masor tenga', 'assam tea'],
      familiarPlaces: ['Majuli Island', 'Kaziranga'],
      festivals: ['Kati Bihu', 'Bhogali Bihu'],
      dailyRoutines: [
        { time: '06:30 AM', title: 'Morning walk in garden' },
        { time: '07:30 AM', title: 'Assam Tea and breakfast' }
      ]
    });

    await memoryRepository.createMemory({
      userId,
      title: 'Family gathering in Majuli',
      description: 'Spent peaceful afternoon near the river with family',
      relationship: 'Family',
      category: 'events'
    });

    console.log('  Seeded test elder profile & memory in IndexedDB.');

    // 3. Send real Saathi message through saathiAIService
    console.log('  Sending Saathi message: "नमस्ते साथी, आज का दिन कैसा है?"...');
    const startTime = Date.now();

    const response = await sendSaathiMessage({
      userId,
      message: 'नमस्ते साथी, आज का दिन कैसा है?',
    });

    const elapsed = Date.now() - startTime;
    console.log(`  Saathi response received in ${elapsed}ms:`);
    console.log(`  Reply: "${response.replyText}"`);

    // 4. Assertions on Response
    assert(Boolean(response.replyText && response.replyText.length > 5), 'Received valid reply text');
    assert(response.provider === 'google-gemini', `Provider matches "google-gemini" (Got: ${response.provider})`);
    assert(response.model === 'gemini-3.5-flash-lite', `Model matches "gemini-3.5-flash-lite" (Got: ${response.model})`);
    assert(Boolean(response.conversationId), 'Conversation ID returned');
    assert(Boolean(response.userMessageId), 'User message ID returned');
    assert(Boolean(response.assistantMessageId), 'Assistant message ID returned');

    // 5. Verify IndexedDB persistence
    const savedMessages = await getConversationMessages(response.conversationId);
    assert(savedMessages.length === 2, `Conversation has exactly 2 persisted messages in IndexedDB (Got: ${savedMessages.length})`);
    assert(savedMessages[0].role === 'user' && savedMessages[0].content === 'नमस्ते साथी, आज का दिन कैसा है?', 'Persisted User message matches');
    assert(savedMessages[1].role === 'assistant' && savedMessages[1].content === response.replyText, 'Persisted Assistant message matches');

  } catch (err) {
    assert(false, `Flow failed with error: ${err.message}`);
  } finally {
    await new Promise((resolve) => server.close(resolve));
    console.log('  Gateway server closed.');
  }

  // Summary
  console.log('\n====================================================');
  console.log(`END-TO-END SUMMARY: ${passed} Passed, ${failed} Failed`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exitCode = 1;
  }
}

runTest();
