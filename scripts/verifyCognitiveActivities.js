/**
 * verifyCognitiveActivities.js
 * Verification test script for Sprint 1:
 * - Sequence Recall
 * - Pattern Complete
 * - Find the Difference
 * - Reusable Cognitive Activity Engine
 */

import 'fake-indexeddb/auto';
import { db } from '../src/database/db.js';
import * as gamePersistenceService from '../src/services/gamePersistenceService.js';
import { CognitiveDomain } from '../src/domain/cognitive/cognitiveTypes.js';
import { DifficultyLevel } from '../src/domain/cognitive/difficultyTypes.js';
import {
  calculateAccuracy,
  calculateScore,
  shuffleOptions,
  validateAnswer,
  calculateAverageResponseTime,
  SEQUENCE_SYMBOLS,
  generateSequence,
  generateSequenceQuestions,
  PATTERN_QUESTIONS,
  getPreparedPatternQuestions,
  DIFFERENCE_QUESTIONS,
} from '../src/logic/cognitiveActivityEngine.js';
import { getGameById, GameStatus } from '../src/data/cognitiveGameCatalog.js';

async function runSprint1Verification() {
  console.log('--- STARTING SPRINT 1 COGNITIVE ACTIVITIES VERIFICATION ---');
  const TEST_USER_ID = 'test-elder-sprint1-verification';

  // ====================================================
  // TEST 1: REUSABLE ENGINE FUNCTIONS
  // ====================================================
  console.log('[Test 1] Verifying cognitiveActivityEngine pure functions...');
  if (calculateAccuracy(2, 3) !== 66.7) throw new Error('calculateAccuracy failed for 2/3');
  if (calculateAccuracy(0, 5) !== 0) throw new Error('calculateAccuracy failed for 0/5');
  if (calculateAccuracy(5, 5) !== 100) throw new Error('calculateAccuracy failed for 5/5');
  if (calculateScore(66.7) !== 67) throw new Error('calculateScore failed for 66.7');

  // Deterministic shuffle with mocked RNG
  const items = [1, 2, 3, 4, 5];
  const shuffled = shuffleOptions(items, () => 0.2);
  if (!Array.isArray(shuffled) || shuffled.length !== 5) {
    throw new Error('shuffleOptions returned invalid array');
  }

  // Answer validation
  if (!validateAnswer('flower', 'flower')) throw new Error('validateAnswer failed for identical strings');
  if (!validateAnswer({ id: 'flower' }, 'flower')) throw new Error('validateAnswer failed for object target');
  if (validateAnswer('flower', 'sun')) throw new Error('validateAnswer should fail for different strings');

  // Response time aggregation
  const avgTime = calculateAverageResponseTime([2.5, 3.5, 4.2]);
  if (avgTime !== 3.4) throw new Error(`calculateAverageResponseTime expected 3.4, got ${avgTime}`);
  console.log('[Test 1] ✓ Reusable engine functions verified.');

  // ====================================================
  // TEST 2: SEQUENCE RECALL (WORKING_MEMORY)
  // ====================================================
  console.log('[Test 2] Verifying Sequence Recall...');
  const srCatalog = getGameById('sequence-recall');
  if (!srCatalog || srCatalog.status !== GameStatus.ACTIVE) {
    throw new Error('sequence-recall catalog entry is missing or not ACTIVE');
  }
  if (!srCatalog.cognitiveDomains.includes(CognitiveDomain.WORKING_MEMORY)) {
    throw new Error('sequence-recall domain must be WORKING_MEMORY');
  }

  // Deterministic sequence test with pseudo RNG
  let fakeSeed = 0.1;
  const mockRng = () => {
    fakeSeed = (fakeSeed + 0.3) % 1;
    return fakeSeed;
  };
  const testSeq = generateSequence(3, mockRng);
  if (testSeq.length !== 3) throw new Error('Sequence length must be 3');

  const srQuestions = generateSequenceQuestions(testSeq, mockRng);
  if (srQuestions.length !== 3) throw new Error('Sequence questions must be 3');
  if (srQuestions[0].target.id !== testSeq[0].id) throw new Error('Question 1 target mismatch');

  // Telemetry & DB Persistence
  const srSession = await gamePersistenceService.startGameSession({
    gameId: 'sequence-recall',
    userId: TEST_USER_ID,
    difficultyLevel: DifficultyLevel.GENTLE,
  });
  if (!srSession || !srSession.sessionId) throw new Error('srSession creation failed');

  const srAccuracy = calculateAccuracy(3, 3);
  const srResultId = await gamePersistenceService.saveGameResult({
    gameId: 'sequence-recall',
    sessionId: srSession.sessionId,
    userId: TEST_USER_ID,
    score: calculateScore(srAccuracy),
    accuracy: srAccuracy,
    responseTime: 3.2,
    attempts: 3,
    mistakes: 0,
    hintsUsed: 0,
    difficultyLevel: DifficultyLevel.GENTLE,
    cognitiveDomain: CognitiveDomain.WORKING_MEMORY,
    startedAt: srSession.startedAt,
    completedAt: new Date().toISOString(),
  });

  const savedSrResult = await db.gameResults.get(srResultId);
  if (!savedSrResult || savedSrResult.sessionId !== srSession.sessionId) {
    throw new Error('Sequence Recall session linkage failed');
  }
  if (savedSrResult.cognitiveDomain !== CognitiveDomain.WORKING_MEMORY) {
    throw new Error('Sequence Recall domain in DB mismatch');
  }
  console.log('[Test 2] ✓ Sequence Recall generation, telemetry, and persistence verified.');

  // ====================================================
  // TEST 3: PATTERN COMPLETE (PATTERN_RECOGNITION)
  // ====================================================
  console.log('[Test 3] Verifying Pattern Complete...');
  const pcCatalog = getGameById('pattern-complete');
  if (!pcCatalog || pcCatalog.status !== GameStatus.ACTIVE) {
    throw new Error('pattern-complete catalog entry is missing or not ACTIVE');
  }
  if (!pcCatalog.cognitiveDomains.includes(CognitiveDomain.PATTERN_RECOGNITION)) {
    throw new Error('pattern-complete domain must be PATTERN_RECOGNITION');
  }

  if (PATTERN_QUESTIONS.length < 5) {
    throw new Error(`Pattern Complete questions count (${PATTERN_QUESTIONS.length}) must be at least 5`);
  }

  // Check pattern types
  const types = PATTERN_QUESTIONS.map((q) => q.patternType);
  if (!types.includes('ABAB') || !types.includes('AABB') || !types.includes('ABCABC')) {
    throw new Error('Pattern Complete missing required pattern types (ABAB, AABB, ABCABC)');
  }

  const preparedPatterns = getPreparedPatternQuestions(mockRng);
  const q1 = preparedPatterns[0];
  const q1Correct = validateAnswer(q1.target.id, q1.target.id);
  if (!q1Correct) throw new Error('Pattern validation failed for target match');

  // Persistence
  const pcSession = await gamePersistenceService.startGameSession({
    gameId: 'pattern-complete',
    userId: TEST_USER_ID,
    difficultyLevel: DifficultyLevel.GENTLE,
  });

  const pcAccuracy = calculateAccuracy(4, 5); // 80%
  const pcResultId = await gamePersistenceService.saveGameResult({
    gameId: 'pattern-complete',
    sessionId: pcSession.sessionId,
    userId: TEST_USER_ID,
    score: calculateScore(pcAccuracy),
    accuracy: pcAccuracy,
    responseTime: 2.8,
    attempts: 5,
    mistakes: 1,
    hintsUsed: 0,
    difficultyLevel: DifficultyLevel.GENTLE,
    cognitiveDomain: CognitiveDomain.PATTERN_RECOGNITION,
    startedAt: pcSession.startedAt,
    completedAt: new Date().toISOString(),
  });

  const savedPcResult = await db.gameResults.get(pcResultId);
  if (!savedPcResult || savedPcResult.sessionId !== pcSession.sessionId) {
    throw new Error('Pattern Complete session linkage failed');
  }
  if (savedPcResult.cognitiveDomain !== CognitiveDomain.PATTERN_RECOGNITION) {
    throw new Error('Pattern Complete domain in DB mismatch');
  }
  console.log('[Test 3] ✓ Pattern Complete generation, telemetry, and persistence verified.');

  // ====================================================
  // TEST 4: FIND THE DIFFERENCE (ATTENTION)
  // ====================================================
  console.log('[Test 4] Verifying Find the Difference...');
  const fdCatalog = getGameById('find-difference');
  if (!fdCatalog || fdCatalog.status !== GameStatus.ACTIVE) {
    throw new Error('find-difference catalog entry is missing or not ACTIVE');
  }
  if (!fdCatalog.cognitiveDomains.includes(CognitiveDomain.ATTENTION)) {
    throw new Error('find-difference domain must be ATTENTION');
  }

  if (DIFFERENCE_QUESTIONS.length < 5) {
    throw new Error(`Find Difference questions count (${DIFFERENCE_QUESTIONS.length}) must be at least 5`);
  }

  // Deterministic validation: verify that left and right grids match on 8 cells and differ on exactly 1 cell
  for (const q of DIFFERENCE_QUESTIONS) {
    if (q.leftGrid.length !== 9 || q.rightGrid.length !== 9) {
      throw new Error(`Question ${q.id} grids must be 3x3 (9 items)`);
    }
    let mismatchCount = 0;
    let detectedDiffIndex = -1;
    for (let i = 0; i < 9; i++) {
      if (q.leftGrid[i] !== q.rightGrid[i]) {
        mismatchCount++;
        detectedDiffIndex = i;
      }
    }
    if (mismatchCount !== 1) {
      throw new Error(`Question ${q.id} must have exactly 1 difference, found ${mismatchCount}`);
    }
    if (detectedDiffIndex !== q.diffIndex) {
      throw new Error(`Question ${q.id} declared diffIndex (${q.diffIndex}) !== detected (${detectedDiffIndex})`);
    }
  }

  // Persistence
  const fdSession = await gamePersistenceService.startGameSession({
    gameId: 'find-difference',
    userId: TEST_USER_ID,
    difficultyLevel: DifficultyLevel.GENTLE,
  });

  const fdAccuracy = calculateAccuracy(5, 5); // 100%
  const fdResultId = await gamePersistenceService.saveGameResult({
    gameId: 'find-difference',
    sessionId: fdSession.sessionId,
    userId: TEST_USER_ID,
    score: calculateScore(fdAccuracy),
    accuracy: fdAccuracy,
    responseTime: 3.5,
    attempts: 5,
    mistakes: 0,
    hintsUsed: 0,
    difficultyLevel: DifficultyLevel.GENTLE,
    cognitiveDomain: CognitiveDomain.ATTENTION,
    startedAt: fdSession.startedAt,
    completedAt: new Date().toISOString(),
  });

  const savedFdResult = await db.gameResults.get(fdResultId);
  if (!savedFdResult || savedFdResult.sessionId !== fdSession.sessionId) {
    throw new Error('Find Difference session linkage failed');
  }
  if (savedFdResult.cognitiveDomain !== CognitiveDomain.ATTENTION) {
    throw new Error('Find Difference domain in DB mismatch');
  }
  console.log('[Test 4] ✓ Find Difference grids, deterministic difference, and persistence verified.');

  // ====================================================
  // TEST 5: CLEANUP ZERO-POLLUTION CHECK
  // ====================================================
  console.log('[Test 5] Cleaning up test records...');
  await db.gameSessions.delete(srSession.sessionId);
  await db.gameSessions.delete(pcSession.sessionId);
  await db.gameSessions.delete(fdSession.sessionId);
  await db.gameResults.delete(srResultId);
  await db.gameResults.delete(pcResultId);
  await db.gameResults.delete(fdResultId);

  const remainingSessions = await db.gameSessions.where('userId').equals(TEST_USER_ID).toArray();
  const remainingResults = await db.gameResults.where('userId').equals(TEST_USER_ID).toArray();

  if (remainingSessions.length !== 0 || remainingResults.length !== 0) {
    throw new Error('Cleanup failed: test records remain in database');
  }
  console.log('[Test 5] ✓ Cleanup verified. Zero test records remain.');

  console.log('--- SPRINT 1 COGNITIVE ACTIVITIES VERIFICATION PASSED! 🎉 ---');
}

runSprint1Verification().catch((err) => {
  console.error('SPRINT 1 VERIFICATION FAILED:', err);
  process.exit(1);
});
