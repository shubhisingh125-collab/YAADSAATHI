/**
 * databaseSmokeTest.js
 * Comprehensive CRUD, schema index, and cleanup smoke test for YaadSaathiDB.
 * Validates IndexedDB tables, telemetry preservation, NER arrays, and multi-entry indexes.
 */

import { db } from './db.js';
import * as userRepository from './repositories/userRepository.js';
import * as cognitiveRepository from './repositories/cognitiveRepository.js';
import { createUserProfile } from '../domain/user/userTypes.js';
import { createGameSession } from '../domain/cognitive/gameTypes.js';
import { createNERCulturalProfile } from '../domain/ner/nerTypes.js';

/**
 * Executes the complete database smoke test sequence.
 * Throws a descriptive Error if any operation fails.
 * 
 * @returns {Promise<{ success: boolean, results: Object }>}
 */
export async function runDatabaseSmokeTest() {
  console.log('[YaadSaathi DB] Starting Database CRUD Smoke Test...');

  // Ensure DB connection is open
  await db.open();

  let createdUserId = null;
  let createdSessionId = null;
  let createdResultId = null;
  let createdNerProfileId = null;
  let createdCognitiveItemId = null;

  const testReport = {
    userCreate: false,
    userRead: false,
    gameSessionCreate: false,
    gameResultCreate: false,
    nerProfileCreate: false,
    tagsMultiEntryQuery: false,
    userUpdate: false,
    cleanup: false,
  };

  try {
    // =========================================================================
    // TEST 1 — USER (Create & Read)
    // =========================================================================
    const testUserData = createUserProfile({
      name: 'YaadSaathi Test User',
      age: 70,
      stateOrRegion: 'ASSAM',
      primaryLanguage: 'as',
      secondaryLanguage: 'en',
    });

    createdUserId = await userRepository.createUser(testUserData);
    if (!createdUserId) {
      throw new Error('TEST 1 FAILED: userRepository.createUser did not return a valid primary key ID.');
    }
    console.log('[YaadSaathi DB] User CREATE ✓');
    testReport.userCreate = true;

    const retrievedUser = await userRepository.getUser(createdUserId);
    if (!retrievedUser) {
      throw new Error(`TEST 1 FAILED: Could not retrieve created user with ID: ${createdUserId}`);
    }

    if (
      retrievedUser.name !== 'YaadSaathi Test User' ||
      retrievedUser.age !== 70 ||
      retrievedUser.stateOrRegion !== 'ASSAM' ||
      retrievedUser.primaryLanguage !== 'as'
    ) {
      throw new Error(
        `TEST 1 FAILED: Retrieved user fields do not match expected values. Got: ${JSON.stringify(retrievedUser)}`
      );
    }
    console.log('[YaadSaathi DB] User READ ✓');
    testReport.userRead = true;

    // =========================================================================
    // TEST 2 — GAME SESSION (Create & Verify)
    // =========================================================================
    const testSessionData = createGameSession({
      gameId: 'memory-match',
      userId: createdUserId,
      difficultyLevel: 2,
    });

    createdSessionId = await cognitiveRepository.saveGameSession(testSessionData);
    if (!createdSessionId) {
      throw new Error('TEST 2 FAILED: cognitiveRepository.saveGameSession did not return an ID.');
    }

    const retrievedSession = await db.gameSessions.get(createdSessionId);
    if (
      !retrievedSession ||
      retrievedSession.gameId !== 'memory-match' ||
      retrievedSession.userId !== createdUserId ||
      retrievedSession.difficultyLevel !== 2
    ) {
      throw new Error(`TEST 2 FAILED: Retrieved game session mismatch: ${JSON.stringify(retrievedSession)}`);
    }
    console.log('[YaadSaathi DB] Game Session CREATE ✓');
    testReport.gameSessionCreate = true;

    // =========================================================================
    // TEST 3 — GAME RESULT (Telemetry Preservation & Aggregate Progress)
    // =========================================================================
    const testResultData = {
      gameId: 'memory-match',
      userId: createdUserId,
      sessionId: createdSessionId,
      cognitiveDomain: 'MEMORY',
      score: 80,
      accuracy: 0.80, // 80%
      responseTime: 35,
      attempts: 10,
      mistakes: 2,
      hintsUsed: 1,
      difficultyLevel: 2,
    };

    createdResultId = await cognitiveRepository.saveGameResult(testResultData);
    if (!createdResultId) {
      throw new Error('TEST 3 FAILED: cognitiveRepository.saveGameResult did not return an ID.');
    }

    const retrievedResult = await db.gameResults.get(createdResultId);
    if (!retrievedResult) {
      throw new Error(`TEST 3 FAILED: Could not retrieve game result with ID: ${createdResultId}`);
    }

    // Verify all telemetry fields are accurately preserved
    if (
      retrievedResult.gameId !== 'memory-match' ||
      retrievedResult.userId !== createdUserId ||
      retrievedResult.cognitiveDomain !== 'MEMORY' ||
      retrievedResult.score !== 80 ||
      retrievedResult.accuracy !== 80 ||
      retrievedResult.responseTime !== 35 ||
      retrievedResult.attempts !== 10 ||
      retrievedResult.mistakes !== 2 ||
      retrievedResult.hintsUsed !== 1 ||
      retrievedResult.difficultyLevel !== 2
    ) {
      throw new Error(`TEST 3 FAILED: Telemetry field mismatch in game result: ${JSON.stringify(retrievedResult)}`);
    }
    console.log('[YaadSaathi DB] Game Result CREATE ✓');
    testReport.gameResultCreate = true;

    // =========================================================================
    // TEST 4 — NER PROFILE (Extensible Array Preservation)
    // =========================================================================
    const testNerData = createNERCulturalProfile({
      userId: createdUserId,
      stateOrRegion: 'ASSAM',
      preferredLanguage: 'as',
      culturalPreferences: ['tea garden', 'family', 'local music'],
      familiarFoods: ['rice', 'local vegetables'],
      familiarPlaces: [],
      familiarObjects: ['traditional household objects'],
      festivals: [],
      music: [],
      familyMemories: [],
    });

    createdNerProfileId = await db.nerProfiles.add(testNerData);
    if (!createdNerProfileId) {
      throw new Error('TEST 4 FAILED: db.nerProfiles.add did not return an ID.');
    }

    const retrievedNerProfile = await db.nerProfiles.get(createdNerProfileId);
    if (!retrievedNerProfile) {
      throw new Error(`TEST 4 FAILED: Could not retrieve NER profile with ID: ${createdNerProfileId}`);
    }

    // Verify arrays and values remain intact
    if (
      retrievedNerProfile.stateOrRegion !== 'ASSAM' ||
      retrievedNerProfile.preferredLanguage !== 'as' ||
      !Array.isArray(retrievedNerProfile.culturalPreferences) ||
      retrievedNerProfile.culturalPreferences.length !== 3 ||
      retrievedNerProfile.culturalPreferences[0] !== 'tea garden' ||
      !Array.isArray(retrievedNerProfile.familiarFoods) ||
      retrievedNerProfile.familiarFoods.length !== 2 ||
      !Array.isArray(retrievedNerProfile.familiarObjects) ||
      retrievedNerProfile.familiarObjects.length !== 1 ||
      !Array.isArray(retrievedNerProfile.familiarPlaces) ||
      retrievedNerProfile.familiarPlaces.length !== 0
    ) {
      throw new Error(`TEST 4 FAILED: NER Profile array structure corrupted: ${JSON.stringify(retrievedNerProfile)}`);
    }
    console.log('[YaadSaathi DB] NER Profile CREATE ✓');
    testReport.nerProfileCreate = true;

    // =========================================================================
    // IMPORTANT DATABASE VALIDATION: Multi-entry Index (*tags) on nerCognitiveItems
    // =========================================================================
    createdCognitiveItemId = await db.nerCognitiveItems.add({
      stateOrRegion: 'ASSAM',
      language: 'as',
      category: 'craft',
      title: 'Traditional Jaapi',
      content: 'Conical woven bamboo sun hat',
      cognitiveDomain: 'MEMORY',
      difficultyLevel: 1,
      tags: ['tea', 'nature', 'assam'],
    });

    // Query multi-entry index by single tag 'tea'
    const foundByTea = await db.nerCognitiveItems.where('tags').equals('tea').toArray();
    const itemMatch1 = foundByTea.find((item) => item.id === createdCognitiveItemId);
    if (!itemMatch1) {
      throw new Error("TAGS TEST FAILED: Multi-entry index '*tags' failed to query item by tag 'tea'.");
    }

    // Query multi-entry index by single tag 'assam'
    const foundByAssam = await db.nerCognitiveItems.where('tags').equals('assam').toArray();
    const itemMatch2 = foundByAssam.find((item) => item.id === createdCognitiveItemId);
    if (!itemMatch2) {
      throw new Error("TAGS TEST FAILED: Multi-entry index '*tags' failed to query item by tag 'assam'.");
    }
    console.log('[YaadSaathi DB] Multi-entry tags Query ✓');
    testReport.tagsMultiEntryQuery = true;

    // =========================================================================
    // TEST 5 — UPDATE (User Profile Update)
    // =========================================================================
    const updatedCount = await userRepository.updateUser(createdUserId, {
      name: 'YaadSaathi Updated Test User',
    });

    if (updatedCount !== 1) {
      throw new Error(`TEST 5 FAILED: Expected 1 updated record, got ${updatedCount}`);
    }

    const updatedUser = await userRepository.getUser(createdUserId);
    if (!updatedUser || updatedUser.name !== 'YaadSaathi Updated Test User') {
      throw new Error(`TEST 5 FAILED: User name update not reflected: ${JSON.stringify(updatedUser)}`);
    }
    console.log('[YaadSaathi DB] UPDATE ✓');
    testReport.userUpdate = true;

    // =========================================================================
    // TEST 6 — DELETE / CLEANUP
    // =========================================================================
    if (createdUserId) await userRepository.deleteUser(createdUserId);
    if (createdSessionId) await db.gameSessions.delete(createdSessionId);
    if (createdResultId) await db.gameResults.delete(createdResultId);
    if (createdUserId) await db.cognitiveProgress.where('userId').equals(createdUserId).delete();
    if (createdNerProfileId) await db.nerProfiles.delete(createdNerProfileId);
    if (createdCognitiveItemId) await db.nerCognitiveItems.delete(createdCognitiveItemId);

    // Verify all test records were completely deleted
    const postUser = await userRepository.getUser(createdUserId);
    const postSession = await db.gameSessions.get(createdSessionId);
    const postResult = await db.gameResults.get(createdResultId);
    const postNer = await db.nerProfiles.get(createdNerProfileId);
    const postItem = await db.nerCognitiveItems.get(createdCognitiveItemId);

    if (postUser || postSession || postResult || postNer || postItem) {
      throw new Error('TEST 6 FAILED: Cleanup did not remove all test records from IndexedDB.');
    }
    console.log('[YaadSaathi DB] CLEANUP ✓');
    testReport.cleanup = true;

    console.log('[YaadSaathi DB] All 6 Database Smoke Tests Passed Successfully! 🎉');
    return { success: true, results: testReport };
  } catch (err) {
    console.error('[YaadSaathi DB] Smoke Test Failed with Error:', err);

    // Best-effort cleanup on failure to prevent stale test data
    try {
      if (createdUserId) await userRepository.deleteUser(createdUserId);
      if (createdSessionId) await db.gameSessions.delete(createdSessionId);
      if (createdResultId) await db.gameResults.delete(createdResultId);
      if (createdUserId) await db.cognitiveProgress.where('userId').equals(createdUserId).delete();
      if (createdNerProfileId) await db.nerProfiles.delete(createdNerProfileId);
      if (createdCognitiveItemId) await db.nerCognitiveItems.delete(createdCognitiveItemId);
    } catch (cleanupErr) {
      console.warn('[YaadSaathi DB] Error during emergency cleanup:', cleanupErr);
    }

    throw err;
  }
}

export default runDatabaseSmokeTest;
