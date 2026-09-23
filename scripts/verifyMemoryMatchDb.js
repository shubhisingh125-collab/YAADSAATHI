/**
 * verifyMemoryMatchDb.js
 * Automated verification of Memory Match IndexedDB session and result persistence.
 */

import 'fake-indexeddb/auto';
import { db } from '../src/database/db.js';
import * as gamePersistenceService from '../src/services/gamePersistenceService.js';
import { CognitiveDomain } from '../src/domain/cognitive/cognitiveTypes.js';

console.log('--- VERIFYING MEMORY MATCH DATABASE INTEGRATION ---');

async function testMemoryMatchPersistence() {
  const testUserId = 'test-elder-session-verification';

  // 1. Start Session
  console.log('[Test] Starting Memory Match game session...');
  const sessionOutput = await gamePersistenceService.startGameSession({
    gameId: 'memory-match',
    difficultyLevel: 3,
    userId: testUserId,
  });

  if (!sessionOutput || !sessionOutput.sessionId) {
    throw new Error('FAILED: startGameSession did not return a valid sessionId.');
  }

  const persistedSession = await db.gameSessions.get(sessionOutput.sessionId);
  if (!persistedSession) {
    throw new Error(`FAILED: Session ${sessionOutput.sessionId} was not found in IndexedDB.`);
  }

  console.log('[Test] ✓ Game session retrieved from IndexedDB:', {
    id: persistedSession.id,
    gameId: persistedSession.gameId,
    userId: persistedSession.userId,
    difficultyLevel: persistedSession.difficultyLevel,
    startedAt: persistedSession.startedAt,
  });

  // 2. Save Result upon completion
  console.log('[Test] Saving completed Memory Match result...');
  const resultId = await gamePersistenceService.saveGameResult({
    gameId: 'memory-match',
    sessionId: sessionOutput.sessionId,
    userId: testUserId,
    score: 60,
    accuracy: 85,
    responseTime: 3.2,
    attempts: 7,
    mistakes: 1,
    hintsUsed: 0,
    difficultyLevel: 3,
    cognitiveDomain: CognitiveDomain.MEMORY,
    startedAt: sessionOutput.startedAt,
    completedAt: new Date().toISOString(),
    adaptiveRecommendation: {
      action: 'MAINTAIN',
      recommendedLevel: 3,
      reason: 'Comfortable pace maintained.',
    },
    metadata: {
      pairCount: 6,
      totalSeconds: 24,
      formattedTime: '00:24',
    },
  });

  if (!resultId) {
    throw new Error('FAILED: saveGameResult did not return a valid resultId.');
  }

  const persistedResult = await db.gameResults.get(resultId);
  if (!persistedResult) {
    throw new Error(`FAILED: Result ${resultId} was not found in IndexedDB.`);
  }

  console.log('[Test] ✓ Game result retrieved from IndexedDB:', {
    id: persistedResult.id,
    sessionId: persistedResult.sessionId,
    userId: persistedResult.userId,
    gameId: persistedResult.gameId,
    cognitiveDomain: persistedResult.cognitiveDomain,
    score: persistedResult.score,
    accuracy: persistedResult.accuracy,
    responseTime: persistedResult.responseTime,
    attempts: persistedResult.attempts,
    mistakes: persistedResult.mistakes,
    hintsUsed: persistedResult.hintsUsed,
    difficultyLevel: persistedResult.difficultyLevel,
  });

  // 3. Verify linkage and fields
  if (persistedResult.sessionId !== sessionOutput.sessionId) {
    throw new Error(`FAILED: Result sessionId (${persistedResult.sessionId}) does not match session (${sessionOutput.sessionId})`);
  }
  if (persistedResult.userId !== testUserId) {
    throw new Error(`FAILED: Result userId mismatch.`);
  }
  if (persistedResult.cognitiveDomain !== 'MEMORY') {
    throw new Error(`FAILED: Cognitive domain mismatch.`);
  }

  // 4. Clean up test records
  console.log('[Test] Cleaning up test records...');
  await db.gameSessions.delete(sessionOutput.sessionId);
  await db.gameResults.delete(resultId);
  await db.cognitiveProgress.where('userId').equals(testUserId).delete();

  const postSession = await db.gameSessions.get(sessionOutput.sessionId);
  const postResult = await db.gameResults.get(resultId);

  if (postSession || postResult) {
    throw new Error('FAILED: Cleanup did not remove test records.');
  }

  console.log('[Test] ✓ Cleanup verified. Zero test records remain.');
  console.log('--- MEMORY MATCH PERSISTENCE VERIFICATION PASSED SUCCESSFULLY! 🎉 ---');
}

testMemoryMatchPersistence()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('VERIFICATION FAILED:', err);
    process.exit(1);
  });
