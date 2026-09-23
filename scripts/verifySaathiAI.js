/**
 * verifySaathiAI.js
 * Verification test script for YaadSaathi Sprint 3A:
 * Real Saathi AI Chatbox + Personalized AI Context + Dexie Persistence
 */

import 'fake-indexeddb/auto';
import { db } from '../src/database/db.js';
import * as userRepository from '../src/database/repositories/userRepository.js';
import * as nerRepository from '../src/database/repositories/nerRepository.js';
import * as memoryRepository from '../src/database/repositories/memoryRepository.js';
import * as routineRepository from '../src/database/repositories/routineRepository.js';
import * as cognitiveRepository from '../src/database/repositories/cognitiveRepository.js';
import * as aiRepository from '../src/database/repositories/aiRepository.js';
import { buildSaathiContext } from '../src/services/personalizationContextService.js';
import {
  buildSaathiSystemPrompt,
  selectRelevantMemories,
} from '../src/services/ai/saathiPromptBuilder.js';
import {
  sendSaathiMessage,
  getConversationHistory,
  getConversationMessages,
  deleteConversation,
} from '../src/services/ai/saathiAIService.js';
import {
  setCustomAIProviderAdapter,
  clearCustomAIProviderAdapter,
} from '../src/services/ai/aiProvider.js';
import { MemoryItemType } from '../src/domain/memory/memoryTypes.js';
import { NERState, RegionalLanguageCode } from '../src/domain/ner/nerTypes.js';
import { CognitiveDomain } from '../src/domain/cognitive/cognitiveTypes.js';
import { AIMessageRole } from '../src/domain/ai/aiTypes.js';

async function runSaathiAIVerification() {
  console.log('--- STARTING SPRINT 3A SAATHI AI VERIFICATION ---');

  const TEST_USER_ID = 'test-elder-saathi-ai-user-101';
  let testConvId = null;

  try {
    // 1. Create test user
    console.log('[Test] 1. Creating test user...');
    await userRepository.createUser({
      id: TEST_USER_ID,
      name: 'Pranab Bora',
      age: 74,
      stateOrRegion: NERState.ASSAM,
      primaryLanguage: RegionalLanguageCode.ASSAMESE,
    });
    console.log('[Test] ✓ Test user created.');

    // 2. Create test NER profile
    console.log('[Test] 2. Creating test NER profile...');
    await nerRepository.createNERProfile({
      userId: TEST_USER_ID,
      stateOrRegion: NERState.ASSAM,
      preferredLanguage: RegionalLanguageCode.ASSAMESE,
      culturalPreferences: ['Bihu dhol', 'Assam silk weaving'],
      familiarFoods: ['Khar', 'Masor Tenga', 'Assam Black Tea'],
      familiarPlaces: ['Tezpur', 'Brahmaputra Riverfront'],
      festivals: ['Rongali Bihu', 'Bhogali Bihu'],
      familiarObjects: ['Gamusa', 'Jaapi'],
    });
    console.log('[Test] ✓ NER profile created.');

    // 3. Create test memory
    console.log('[Test] 3. Creating test personal memory...');
    const memId = await memoryRepository.createMemory({
      userId: TEST_USER_ID,
      category: MemoryItemType.FAMILY_MEMBER,
      title: 'Ananya (Granddaughter)',
      personName: 'Ananya',
      relationship: 'Granddaughter',
      description: 'Loves listening to Bihu songs during vacation.',
      place: 'Tezpur',
    });
    console.log(`[Test] ✓ Personal memory created (id: ${memId}).`);

    // 4. Create test routine
    console.log('[Test] 4. Creating test routine...');
    const routineId = await routineRepository.addRoutine({
      userId: TEST_USER_ID,
      time: '06:30 AM',
      period: 'morning',
      titleEnglish: 'Morning Tea & Reading',
      titleHindi: 'सुबह की चाय और अखबार',
      icon: '☕',
    });
    console.log(`[Test] ✓ Daily routine created (id: ${routineId}).`);

    // 5. Create test cognitive activity result
    console.log('[Test] 5. Creating test cognitive activity history...');
    await cognitiveRepository.saveGameResult({
      userId: TEST_USER_ID,
      sessionId: 'session-test-ai-1',
      gameId: 'memory-match',
      cognitiveDomain: CognitiveDomain.MEMORY,
      score: 80,
      accuracy: 90,
      responseTime: 2.5,
    });
    console.log('[Test] ✓ Cognitive activity result recorded.');

    // 6. Test buildSaathiContext()
    console.log('[Test] 6. Testing buildSaathiContext()...');
    const saathiContext = await buildSaathiContext(TEST_USER_ID);
    if (!saathiContext || saathiContext.stateOrRegion !== NERState.ASSAM) {
      throw new Error(`buildSaathiContext failed: ${JSON.stringify(saathiContext)}`);
    }
    if (!saathiContext.familiarFoods.includes('Khar') || !saathiContext.memories.some((m) => m.title.includes('Ananya'))) {
      throw new Error('buildSaathiContext missing foods or memories');
    }
    console.log('[Test] ✓ buildSaathiContext assembled complete, sanitized user context.');

    // 7. Test memory selection & buildSaathiSystemPrompt()
    console.log('[Test] 7. Testing memory selection & buildSaathiSystemPrompt()...');
    const selectedMems = selectRelevantMemories(saathiContext.memories, 'Ananya', 3);
    if (selectedMems.length === 0 || !selectedMems[0].title.includes('Ananya')) {
      throw new Error('selectRelevantMemories failed to filter query-relevant memory');
    }

    const systemPrompt = buildSaathiSystemPrompt(saathiContext, 'Ananya granddaughter');
    if (!systemPrompt.includes('UNTRUSTED USER PERSONAL MEMORY CONTEXT')) {
      throw new Error('System prompt missing untrusted memory delimiter');
    }
    if (!systemPrompt.includes('NEVER diagnose dementia')) {
      throw new Error('System prompt missing non-clinical safety instruction');
    }
    console.log('[Test] ✓ System prompt correctly constructed with non-clinical bounds and security delimiters.');

    // 8. Verify secrets / credentials are NOT included
    console.log('[Test] 8. Verifying secrets are excluded from context & prompt...');
    const forbiddenKeywords = ['password', 'secret', 'token', 'apiKey', 'bearer', 'PRIVATE_KEY'];
    for (const kw of forbiddenKeywords) {
      if (systemPrompt.toLowerCase().includes(kw.toLowerCase())) {
        throw new Error(`Security violation: Found forbidden keyword "${kw}" in prompt`);
      }
    }
    console.log('[Test] ✓ Prompt verified free of sensitive internals and credentials.');

    // 9. Test unconfigured provider throws graceful NOT_CONFIGURED error
    console.log('[Test] 9. Verifying unconfigured provider behavior...');
    clearCustomAIProviderAdapter();
    try {
      await sendSaathiMessage({
        userId: TEST_USER_ID,
        message: 'Hello Saathi',
      });
      throw new Error('sendSaathiMessage should have thrown NOT_CONFIGURED error');
    } catch (err) {
      if (err.code !== 'NOT_CONFIGURED') {
        throw new Error(`Expected NOT_CONFIGURED error code, got: ${err.code} (${err.message})`);
      }
      console.log('[Test] ✓ Unconfigured provider correctly reports NOT_CONFIGURED error.');
    }

    // 10. Mock AI Provider boundary and test sendSaathiMessage full orchestration
    console.log('[Test] 10. Testing full sendSaathiMessage pipeline with mock provider adapter...');
    let adapterCalledWith = null;

    setCustomAIProviderAdapter(async ({ messages, systemPrompt, context, userId }) => {
      adapterCalledWith = { messages, systemPrompt, context, userId };
      return {
        text: 'नमस्ते प्रणब जी! आपकी पोती अनन्या बहुत प्यारी है। आज आप कैसा महसूस कर रहे हैं?',
        provider: 'mock-llm-provider',
        model: 'saathi-elder-v1',
      };
    });

    const sendResult = await sendSaathiMessage({
      userId: TEST_USER_ID,
      message: 'मेरी पोती अनन्या के बारे में बताओ।',
    });

    if (!sendResult.conversationId || !sendResult.replyText.includes('अनन्या')) {
      throw new Error(`sendSaathiMessage failed: ${JSON.stringify(sendResult)}`);
    }
    testConvId = sendResult.conversationId;

    if (!adapterCalledWith || adapterCalledWith.messages.length === 0) {
      throw new Error('AI Provider adapter was not invoked with messages');
    }
    console.log('[Test] ✓ Full message pipeline (context -> prompt -> provider -> response) verified.');

    // 11. Test conversation and message retrieval from IndexedDB
    console.log('[Test] 11. Verifying persisted messages in IndexedDB...');
    const convMessages = await getConversationMessages(testConvId);
    if (convMessages.length < 2) {
      throw new Error(`Expected at least 2 messages in conversation, found ${convMessages.length}`);
    }

    const userMsg = convMessages.find((m) => m.role === AIMessageRole.USER);
    const assistantMsg = convMessages.find((m) => m.role === AIMessageRole.ASSISTANT);

    if (!userMsg || !userMsg.content.includes('अनन्या')) {
      throw new Error('User message was not persisted correctly in IndexedDB');
    }
    if (!assistantMsg || !assistantMsg.content.includes('प्रणब जी')) {
      throw new Error('Assistant response was not persisted correctly in IndexedDB');
    }
    console.log('[Test] ✓ Both User and Assistant messages verified in IndexedDB.');

    // 12. Test conversation history list
    console.log('[Test] 12. Testing getConversationHistory()...');
    const userConvs = await getConversationHistory(TEST_USER_ID);
    if (!userConvs || !userConvs.some((c) => c.id === testConvId)) {
      throw new Error(`getConversationHistory mismatch: ${JSON.stringify(userConvs)}`);
    }
    console.log('[Test] ✓ getConversationHistory returned the active conversation.');

    // 13. Test conversation deletion and cascade message cleanup
    console.log('[Test] 13. Testing deleteConversation() cascade...');
    await deleteConversation(testConvId);
    const convAfterDelete = await aiRepository.getConversation(testConvId);
    const msgsAfterDelete = await aiRepository.getMessages(testConvId);

    if (convAfterDelete !== null && convAfterDelete !== undefined) {
      throw new Error('Conversation was not deleted');
    }
    if (msgsAfterDelete.length > 0) {
      throw new Error('Associated messages were not cascade deleted');
    }
    console.log('[Test] ✓ Conversation and message cascade deletion verified.');

    // 14. Cleanup all test data
    console.log('[Test] 14. Cleaning up test data and verifying zero pollution...');
    await memoryRepository.deleteMemory(memId);
    await routineRepository.deleteRoutine(routineId);
    await nerRepository.deleteNERProfile(TEST_USER_ID);
    await userRepository.deleteUser(TEST_USER_ID);
    await db.gameResults.where('userId').equals(TEST_USER_ID).delete();

    // Clean any remaining test conversations
    const remainingConvs = await aiRepository.getConversations(TEST_USER_ID);
    for (const c of remainingConvs) {
      await aiRepository.deleteConversation(c.id);
    }

    // Verify cleanup
    const cleanUser = await userRepository.getUser(TEST_USER_ID);
    const cleanNer = await nerRepository.getNERProfile(TEST_USER_ID);
    const cleanMem = await memoryRepository.getMemories(TEST_USER_ID);
    const cleanRoutines = await routineRepository.getRoutines(TEST_USER_ID);
    const cleanConvs = await aiRepository.getConversations(TEST_USER_ID);

    if (cleanUser || cleanNer || cleanMem.length > 0 || cleanRoutines.length > 0 || cleanConvs.length > 0) {
      throw new Error('Database cleanup failed: test records remain');
    }
    clearCustomAIProviderAdapter();

    console.log('[Test] ✓ Cleanup complete: Zero test records remain in database.');
    console.log('--- SPRINT 3A SAATHI AI VERIFICATION PASSED SUCCESSFULLY! 🎉 ---');
  } catch (err) {
    clearCustomAIProviderAdapter();
    try {
      if (testConvId) await deleteConversation(testConvId);
      await userRepository.deleteUser(TEST_USER_ID);
      await nerRepository.deleteNERProfile(TEST_USER_ID);
      const mems = await memoryRepository.getMemories(TEST_USER_ID);
      for (const m of mems) if (m.id) await memoryRepository.deleteMemory(m.id);
    } catch {}
    throw err;
  }
}

runSaathiAIVerification()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('SAATHI AI VERIFICATION FAILED:', err);
    process.exit(1);
  });
