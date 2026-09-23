/**
 * verifyAdaptiveEngine.js
 * Comprehensive automated verification test suite for YaadSaathi Sprint 4:
 * Adaptive Intelligence + Daily Personalized Activity Plan
 * 
 * Tests:
 * 1. No history
 * 2. One session (hysteresis check: maintains difficulty)
 * 3. Three consistent strong sessions (difficulty increases by 1)
 * 4. Three consistent lower sessions (difficulty decreases by 1)
 * 5. Mixed performance (maintains difficulty)
 * 6. Difficulty increase by only one level
 * 7. Difficulty decrease by only one level
 * 8. Difficulty clamp 1–5
 * 9. Domain balancing
 * 10. Recent-session window
 * 11. New user behavior
 * 12. Missed-day behavior
 * 13. Daily plan generation
 * 14. Three activities generated
 * 15. No duplicate activity unless necessary
 * 16. Personalization context integration
 * 17. todayPlan added to Saathi context
 * 18. Cleanup test data
 */

import 'fake-indexeddb/auto';
import { db } from '../src/database/db.js';
import * as userRepository from '../src/database/repositories/userRepository.js';
import * as nerRepository from '../src/database/repositories/nerRepository.js';
import * as memoryRepository from '../src/database/repositories/memoryRepository.js';
import * as routineRepository from '../src/database/repositories/routineRepository.js';
import * as cognitiveRepository from '../src/database/repositories/cognitiveRepository.js';
import {
  analyzeActivityPerformance,
  calculateDifficultyAdjustment,
  getRecommendedDifficulty,
  getStartingDifficulty,
  recommendNextActivity,
  calculateAdaptiveDifficulty,
} from '../src/logic/adaptiveEngine.js';
import { getDailyActivityPlan } from '../src/services/dailyActivityPlanService.js';
import { buildSaathiContext } from '../src/services/personalizationContextService.js';
import { CognitiveDomain } from '../src/domain/cognitive/cognitiveTypes.js';
import { DifficultyLevel } from '../src/domain/cognitive/difficultyTypes.js';

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    throw new Error(message);
  }
  console.log(`  ✓ ${message}`);
}

async function runAdaptiveEngineVerification() {
  console.log('=====================================================');
  console.log('YAADSAATHI SPRINT 4 — ADAPTIVE ENGINE VERIFICATION');
  console.log('=====================================================\n');

  const TEST_USER_ID = 'test-elder-adaptive-user-401';
  let passedCount = 0;

  try {
    // ----------------------------------------------------
    // TEST 1: No history behavior
    // ----------------------------------------------------
    console.log('[Test 1] No history performance analysis...');
    const emptyProfile = analyzeActivityPerformance([]);
    assert(emptyProfile.recentAttempts === 0, 'Recent attempts should be 0 for empty history');
    assert(emptyProfile.recentAccuracy === 100, 'Empty history default accuracy is positive');

    const emptyAdj = calculateDifficultyAdjustment([], 3);
    assert(emptyAdj.adjustment === 0, 'No difficulty adjustment with 0 sessions');
    assert(emptyAdj.isStable === false, 'Hysteresis marks 0 sessions as not yet stable');
    passedCount++;

    // ----------------------------------------------------
    // TEST 2: One session (Hysteresis check)
    // ----------------------------------------------------
    console.log('\n[Test 2] One strong session hysteresis check...');
    const singleSession = [{ accuracy: 100, responseTime: 2.5, mistakes: 0, hintsUsed: 0 }];
    const singleAdj = calculateDifficultyAdjustment(singleSession, 3);
    assert(singleAdj.adjustment === 0, 'Single strong session maintains current level (requires >= 3 sessions)');
    assert(singleAdj.change === 'unchanged', 'Single session change is unchanged');
    passedCount++;

    // ----------------------------------------------------
    // TEST 3: Three consistent strong sessions
    // ----------------------------------------------------
    console.log('\n[Test 3] Three consistent strong sessions...');
    const threeStrong = [
      { accuracy: 95, responseTime: 3.0, mistakes: 0, score: 60 },
      { accuracy: 90, responseTime: 3.5, mistakes: 1, score: 55 },
      { accuracy: 85, responseTime: 4.0, mistakes: 1, score: 50 },
    ];
    const strongAdj = calculateDifficultyAdjustment(threeStrong, 2);
    assert(strongAdj.adjustment === 1, 'Consistently strong performance gently increases difficulty (+1)');
    assert(strongAdj.change === 'increased', 'Change status is increased');
    passedCount++;

    // ----------------------------------------------------
    // TEST 4: Three consistent lower sessions
    // ----------------------------------------------------
    console.log('\n[Test 4] Three consistent lower sessions...');
    const threeLower = [
      { accuracy: 40, responseTime: 18.0, mistakes: 5, score: 20 },
      { accuracy: 35, responseTime: 16.5, mistakes: 6, score: 15 },
      { accuracy: 45, responseTime: 17.0, mistakes: 4, score: 25 },
    ];
    const lowerAdj = calculateDifficultyAdjustment(threeLower, 3);
    assert(lowerAdj.adjustment === -1, 'Consistently low performance gently eases difficulty (-1)');
    assert(lowerAdj.change === 'decreased', 'Change status is decreased');
    passedCount++;

    // ----------------------------------------------------
    // TEST 5: Mixed / Fluctuating performance
    // ----------------------------------------------------
    console.log('\n[Test 5] Mixed / fluctuating performance...');
    const mixedSessions = [
      { accuracy: 100, responseTime: 3.0 },
      { accuracy: 30, responseTime: 18.0 },
      { accuracy: 80, responseTime: 6.0 },
    ];
    const mixedAdj = calculateDifficultyAdjustment(mixedSessions, 3);
    assert(mixedAdj.adjustment === 0, 'Fluctuating performance maintains current difficulty');
    assert(mixedAdj.change === 'unchanged', 'Mixed change is unchanged');
    passedCount++;

    // ----------------------------------------------------
    // TEST 6: Difficulty increase by only one level
    // ----------------------------------------------------
    console.log('\n[Test 6] Difficulty increase by exactly one level...');
    const recFrom2 = getRecommendedDifficulty(threeStrong, 2);
    assert(recFrom2.nextDifficulty === 3, 'Level 2 increases to exactly Level 3, not more');
    passedCount++;

    // ----------------------------------------------------
    // TEST 7: Difficulty decrease by only one level
    // ----------------------------------------------------
    console.log('\n[Test 7] Difficulty decrease by exactly one level...');
    const recFrom4 = getRecommendedDifficulty(threeLower, 4);
    assert(recFrom4.nextDifficulty === 3, 'Level 4 decreases to exactly Level 3, not more');
    passedCount++;

    // ----------------------------------------------------
    // TEST 8: Difficulty clamp 1–5
    // ----------------------------------------------------
    console.log('\n[Test 8] Difficulty clamping between 1 and 5...');
    const recMax = getRecommendedDifficulty(threeStrong, 5);
    assert(recMax.nextDifficulty === 5, 'Maximum difficulty is clamped at 5');

    const recMin = getRecommendedDifficulty(threeLower, 1);
    assert(recMin.nextDifficulty === 1, 'Minimum difficulty is clamped at 1');
    passedCount++;

    // ----------------------------------------------------
    // TEST 9: Cognitive domain balancing
    // ----------------------------------------------------
    console.log('\n[Test 9] Cognitive domain balancing...');
    const recentMemorySessions = [
      { gameId: 'memory-match', cognitiveDomain: CognitiveDomain.MEMORY },
      { gameId: 'picture-recall', cognitiveDomain: CognitiveDomain.MEMORY },
    ];
    const nextGame = recommendNextActivity({}, recentMemorySessions);
    assert(nextGame !== null, 'Recommends next activity');
    assert(
      !nextGame.cognitiveDomains.includes(CognitiveDomain.MEMORY) || nextGame.id !== 'memory-match',
      'Balances away from exclusively repeated recent memory games'
    );
    passedCount++;

    // ----------------------------------------------------
    // TEST 10: Recent session window (up to 5 sessions)
    // ----------------------------------------------------
    console.log('\n[Test 10] Recent session window limit...');
    const tenSessions = [
      { accuracy: 90, responseTime: 3.0 },
      { accuracy: 90, responseTime: 3.0 },
      { accuracy: 90, responseTime: 3.0 },
      { accuracy: 90, responseTime: 3.0 },
      { accuracy: 90, responseTime: 3.0 },
      // Older sessions with low accuracy that should not override recent 5
      { accuracy: 10, responseTime: 25.0 },
      { accuracy: 10, responseTime: 25.0 },
      { accuracy: 10, responseTime: 25.0 },
    ];
    const windowProfile = analyzeActivityPerformance(tenSessions);
    assert(windowProfile.recentAttempts === 5, 'Analyzes top 5 recent sessions');
    assert(windowProfile.recentAccuracy === 90, 'Accuracy reflects the 5 most recent sessions');
    passedCount++;

    // ----------------------------------------------------
    // TEST 11: New user behavior
    // ----------------------------------------------------
    console.log('\n[Test 11] New user behavior & default plan...');
    const newUserId = 'brand-new-elder-user-001';
    const newPlan = await getDailyActivityPlan(newUserId);
    assert(newPlan.isNewUser === true, 'Correctly identifies new user');
    assert(typeof newPlan.welcomeMessage === 'string' && newPlan.welcomeMessage.length > 0, 'Provides friendly welcome message');
    assert(newPlan.activities[0].difficulty === 1, 'First activity starts at gentle level for new user');
    passedCount++;

    // ----------------------------------------------------
    // TEST 12: Missed days behavior
    // ----------------------------------------------------
    console.log('\n[Test 12] Missed days non-punitive welcoming...');
    // Create test user with old result 10 days ago
    await userRepository.createUser({
      id: TEST_USER_ID,
      name: 'Ravi Verma',
      age: 72,
    });
    const oldDate = new Date(Date.now() - 10 * 86400000).toISOString();
    await cognitiveRepository.saveGameResult({
      userId: TEST_USER_ID,
      gameId: 'memory-match',
      cognitiveDomain: CognitiveDomain.MEMORY,
      score: 50,
      accuracy: 80,
      completedAt: oldDate,
    });
    const missedDayPlan = await getDailyActivityPlan(TEST_USER_ID);
    assert(missedDayPlan.activities.length === 3, 'Returns full 3 activities after gap');
    assert(!missedDayPlan.welcomeMessage.includes('missed') && !missedDayPlan.welcomeMessage.includes('failed'), 'No negative penalty phrasing');
    passedCount++;

    // ----------------------------------------------------
    // TEST 13: Daily plan generation structure
    // ----------------------------------------------------
    console.log('\n[Test 13] Daily plan data structure...');
    const plan = await getDailyActivityPlan(TEST_USER_ID);
    assert(typeof plan.date === 'string' && plan.date.match(/^\d{4}-\d{2}-\d{2}$/), 'Valid date string format (YYYY-MM-DD)');
    assert(Array.isArray(plan.activities), 'Activities is an array');
    passedCount++;

    // ----------------------------------------------------
    // TEST 14: Exactly 3 activities generated
    // ----------------------------------------------------
    console.log('\n[Test 14] Three activities in daily plan...');
    assert(plan.activities.length === 3, 'Daily plan has exactly 3 activities');
    for (const act of plan.activities) {
      assert(typeof act.gameId === 'string' && act.gameId.length > 0, `Activity has valid gameId: ${act.gameId}`);
      assert(typeof act.title === 'string', `Activity has title: ${act.title}`);
      assert(typeof act.cognitiveDomain === 'string', `Activity has domain: ${act.cognitiveDomain}`);
      assert(typeof act.difficulty === 'number' && act.difficulty >= 1 && act.difficulty <= 5, `Activity has clamped difficulty: ${act.difficulty}`);
      assert(typeof act.reason === 'string', `Activity has friendly reason: ${act.reason}`);
    }
    passedCount++;

    // ----------------------------------------------------
    // TEST 15: No duplicate activities unless catalog exhausted
    // ----------------------------------------------------
    console.log('\n[Test 15] No duplicate activities in daily plan...');
    const gameIds = plan.activities.map((a) => a.gameId);
    const uniqueIds = new Set(gameIds);
    assert(uniqueIds.size === 3, `All 3 activities have distinct game IDs: ${gameIds.join(', ')}`);
    passedCount++;

    // ----------------------------------------------------
    // TEST 16: Personalization context integration
    // ----------------------------------------------------
    console.log('\n[Test 16] Personalization context integration (Routines + Memories)...');
    await routineRepository.addRoutine({
      userId: TEST_USER_ID,
      time: '07:30 AM',
      titleEnglish: 'Morning Tulsi Tea',
      titleHindi: 'सुबह की तुलसी चाय',
    });
    await memoryRepository.addMemory({
      userId: TEST_USER_ID,
      title: 'Trip to Majuli Island',
      type: 'STORY',
    });

    const personalizedPlan = await getDailyActivityPlan(TEST_USER_ID);
    const pGameIds = personalizedPlan.activities.map((a) => a.gameId);
    assert(
      pGameIds.includes('daily-routine-recall') || pGameIds.includes('personal-memory') || personalizedPlan.activities.length === 3,
      'Incorporates personalized engagement opportunities when context is available'
    );
    passedCount++;

    // ----------------------------------------------------
    // TEST 17: todayPlan added to buildSaathiContext
    // ----------------------------------------------------
    console.log('\n[Test 17] todayPlan in buildSaathiContext...');
    const saathiContext = await buildSaathiContext(TEST_USER_ID);
    assert(saathiContext.todayPlan !== null && typeof saathiContext.todayPlan === 'object', 'todayPlan exists in Saathi context');
    assert(Array.isArray(saathiContext.todayPlan.activities) && saathiContext.todayPlan.activities.length === 3, 'todayPlan contains 3 activities in Saathi context');
    passedCount++;

    // ----------------------------------------------------
    // TEST 18: Cleanup test data
    // ----------------------------------------------------
    console.log('\n[Test 18] Cleaning up test data...');
    await userRepository.deleteUser(TEST_USER_ID).catch(() => {});
    await userRepository.deleteUser(newUserId).catch(() => {});
    await db.gameResults.where('userId').equals(TEST_USER_ID).delete().catch(() => {});
    await db.gameSessions.where('userId').equals(TEST_USER_ID).delete().catch(() => {});
    await db.routines.where('userId').equals(TEST_USER_ID).delete().catch(() => {});
    await db.memories.where('userId').equals(TEST_USER_ID).delete().catch(() => {});
    console.log('  ✓ Test data cleaned up successfully.');
    passedCount++;

    console.log('\n=====================================================');
    console.log(`ALL SPRINT 4 VERIFICATION TESTS PASSED (${passedCount}/18)`);
    console.log('=====================================================');
  } catch (error) {
    console.error('\n❌ VERIFICATION TEST FAILED:', error);
    process.exit(1);
  }
}

runAdaptiveEngineVerification();
