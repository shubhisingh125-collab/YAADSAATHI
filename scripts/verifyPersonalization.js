/**
 * verifyPersonalization.js
 * Verification test script for YaadSaathi Sprint 2:
 * Personalization + NER Profile + Meri Yaadein + Personalization Context Service
 */

import 'fake-indexeddb/auto';
import { db } from '../src/database/db.js';
import * as userRepository from '../src/database/repositories/userRepository.js';
import * as nerRepository from '../src/database/repositories/nerRepository.js';
import * as memoryRepository from '../src/database/repositories/memoryRepository.js';
import * as routineRepository from '../src/database/repositories/routineRepository.js';
import {
  getPersonalizationContext,
  buildSaathiContext,
} from '../src/services/personalizationContextService.js';
import { getPersonalizedActivityContext } from '../src/services/contentPersonalizationService.js';
import { MemoryItemType } from '../src/domain/memory/memoryTypes.js';
import { NERState, RegionalLanguageCode } from '../src/domain/ner/nerTypes.js';

async function runPersonalizationVerification() {
  console.log('--- STARTING SPRINT 2 PERSONALIZATION VERIFICATION ---');

  const TEST_USER_ID = 'test-elder-personalization-user-999';

  try {
    // 1. Create local user
    console.log('[Test] 1. Creating local user...');
    await userRepository.createUser({
      id: TEST_USER_ID,
      name: 'Rameshwar Hazarika',
      age: 72,
      stateOrRegion: NERState.ASSAM,
      primaryLanguage: RegionalLanguageCode.ASSAMESE,
    });
    const user = await userRepository.getUser(TEST_USER_ID);
    if (!user || user.name !== 'Rameshwar Hazarika') {
      throw new Error('Failed to create or retrieve test user');
    }
    console.log('[Test] ✓ Local user created successfully.');

    // 2. Create NER profile
    console.log('[Test] 2. Creating NER profile...');
    const nerProfileData = {
      userId: TEST_USER_ID,
      stateOrRegion: NERState.ASSAM,
      preferredLanguage: RegionalLanguageCode.ASSAMESE,
      culturalPreferences: ['Gamusa weaving', 'Bihu folk dance'],
      familiarFoods: ['pitha', 'masor tenga'],
      familiarPlaces: ['Majuli', 'Kaziranga'],
      familiarObjects: ['gamusa', 'jaapi'],
      festivals: ['Rongali Bihu'],
      music: ['Bihu folk songs'],
      familyMemories: ['Grandson wedding in Guwahati'],
    };
    await nerRepository.createNERProfile(nerProfileData);
    console.log('[Test] ✓ NER profile created.');

    // 3. Read NER profile
    console.log('[Test] 3. Reading NER profile...');
    const readNer = await nerRepository.getNERProfile(TEST_USER_ID);
    if (!readNer || readNer.stateOrRegion !== NERState.ASSAM || readNer.preferredLanguage !== RegionalLanguageCode.ASSAMESE) {
      throw new Error(`NER profile read mismatch: ${JSON.stringify(readNer)}`);
    }
    if (!readNer.familiarFoods.includes('pitha') || !readNer.festivals.includes('Rongali Bihu')) {
      throw new Error('NER profile foods or festivals not stored properly');
    }
    console.log('[Test] ✓ NER profile read successfully with accurate cultural preferences.');

    // 4. Update NER profile
    console.log('[Test] 4. Updating NER profile...');
    await nerRepository.updateNERProfile(TEST_USER_ID, {
      familiarFoods: ['pitha', 'masor tenga', 'khar'],
      music: ['Bihu folk songs', 'Zubeen classic melodies'],
    });
    const updatedNer = await nerRepository.getNERProfile(TEST_USER_ID);
    if (!updatedNer.familiarFoods.includes('khar') || !updatedNer.music.includes('Zubeen classic melodies')) {
      throw new Error('NER profile update did not persist new elements');
    }
    console.log('[Test] ✓ NER profile updated and verified.');

    // 5. Create personal memory
    console.log('[Test] 5. Creating personal memory...');
    const memoryId = await memoryRepository.createMemory({
      userId: TEST_USER_ID,
      category: MemoryItemType.FAMILY_MEMBER,
      title: 'Debabrata (Son)',
      personName: 'Debabrata',
      relationship: 'Son',
      description: 'Works as a civil engineer in Jorhat, visits every weekend.',
      place: 'Jorhat',
      tags: ['son', 'family'],
    });
    if (!memoryId) {
      throw new Error('Failed to create personal memory');
    }
    console.log(`[Test] ✓ Personal memory created with id: ${memoryId}`);

    // Create a second memory (story/place)
    const storyMemoryId = await memoryRepository.createMemory({
      userId: TEST_USER_ID,
      category: MemoryItemType.STORY,
      title: 'Majuli Island Ferry Ride',
      description: 'We took the morning boat across Brahmaputra with the whole family.',
      place: 'Majuli',
      date: '1985-11-12',
      tags: ['majuli', 'brahmaputra', 'boat'],
    });
    console.log(`[Test] ✓ Second personal memory created with id: ${storyMemoryId}`);

    // 6. Read personal memory
    console.log('[Test] 6. Reading personal memory...');
    const memory = await memoryRepository.getMemoryById(memoryId);
    if (!memory || memory.relationship !== 'Son' || memory.personName !== 'Debabrata') {
      throw new Error(`Personal memory read mismatch: ${JSON.stringify(memory)}`);
    }
    const userMemories = await memoryRepository.getMemories(TEST_USER_ID);
    if (!userMemories || userMemories.length !== 2) {
      throw new Error(`Expected 2 memories for user, got ${userMemories?.length}`);
    }
    console.log('[Test] ✓ Personal memories read successfully.');

    // 7. Update personal memory
    console.log('[Test] 7. Updating personal memory...');
    await memoryRepository.updateMemory(memoryId, {
      description: 'Works as a chief engineer in Jorhat, calls every evening.',
    });
    const updatedMemory = await memoryRepository.getMemoryById(memoryId);
    if (!updatedMemory.description.includes('chief engineer')) {
      throw new Error('Personal memory update did not persist');
    }
    console.log('[Test] ✓ Personal memory updated successfully.');

    // 8. Delete personal memory (delete the second one for testing, then delete the first in cleanup)
    console.log('[Test] 8. Deleting personal memory...');
    await memoryRepository.deleteMemory(storyMemoryId);
    const remainingMemories = await memoryRepository.getMemories(TEST_USER_ID);
    if (remainingMemories.length !== 1) {
      throw new Error(`Expected 1 memory remaining after delete, got ${remainingMemories.length}`);
    }
    console.log('[Test] ✓ Personal memory deletion verified.');

    // Add a routine for test user to verify routine context
    await routineRepository.addRoutine({
      userId: TEST_USER_ID,
      time: '07:00 AM',
      period: 'morning',
      titleEnglish: 'Morning walk in garden',
      titleHindi: 'सुबह की सैर',
      icon: '🌿',
    });

    // 9. Build personalization context
    console.log('[Test] 9. Building personalization context...');
    const fullContext = await getPersonalizationContext(TEST_USER_ID);
    if (!fullContext) {
      throw new Error('getPersonalizationContext returned null');
    }
    console.log('[Test] ✓ getPersonalizationContext executed successfully.');

    // 10. Verify user + NER + memory + routine context
    console.log('[Test] 10. Verifying user + NER + memory + routine context...');
    if (!fullContext.user || fullContext.user.name !== 'Rameshwar Hazarika') {
      throw new Error('Context missing valid user profile');
    }
    if (!fullContext.ner || fullContext.ner.stateOrRegion !== NERState.ASSAM) {
      throw new Error('Context missing valid NER profile');
    }
    if (!fullContext.memories || fullContext.memories.length !== 1 || fullContext.memories[0].personName !== 'Debabrata') {
      throw new Error('Context missing valid personal memories');
    }
    if (!fullContext.routines || fullContext.routines.length < 1) {
      throw new Error('Context missing active routines');
    }
    // Verify privacy & data minimization (no passwords, tokens, unnecessary IDs)
    if (fullContext.user.password || fullContext.user.token) {
      throw new Error('Privacy violation: Sensitive credentials exposed in context');
    }
    console.log('[Test] ✓ Full personalization context verified (user, ner, memories, routines, sanitized).');

    // 11. Verify buildSaathiContext()
    console.log('[Test] 11. Verifying buildSaathiContext()...');
    const saathiContext = await buildSaathiContext(TEST_USER_ID);
    if (!saathiContext) {
      throw new Error('buildSaathiContext returned null');
    }
    if (saathiContext.stateOrRegion !== NERState.ASSAM || saathiContext.preferredLanguage !== RegionalLanguageCode.ASSAMESE) {
      throw new Error(`buildSaathiContext region/language mismatch: ${JSON.stringify(saathiContext)}`);
    }
    if (!Array.isArray(saathiContext.memories) || saathiContext.memories.length !== 1) {
      throw new Error('buildSaathiContext memories mismatch');
    }
    if (!Array.isArray(saathiContext.routines) || saathiContext.routines.length !== 1) {
      throw new Error('buildSaathiContext routines mismatch');
    }
    console.log('[Test] ✓ buildSaathiContext structure validated for future AI/Voice assistant.');

    // 12. Verify content personalization context
    console.log('[Test] 12. Verifying content personalization context...');
    const contentCtx = await getPersonalizedActivityContext(TEST_USER_ID);
    if (!contentCtx || contentCtx.region !== NERState.ASSAM || contentCtx.language !== RegionalLanguageCode.ASSAMESE) {
      throw new Error(`contentPersonalizationService mismatch: ${JSON.stringify(contentCtx)}`);
    }
    if (!contentCtx.familiarFoods.includes('khar') || !contentCtx.familiarPlaces.includes('Majuli')) {
      throw new Error('contentPersonalizationService missing food/place context');
    }
    console.log('[Test] ✓ contentPersonalizationService accurately returns contextual preferences.');

    // 13. Confirm cleanup leaves zero test records
    console.log('[Test] 13. Cleaning up test records and verifying zero pollution...');
    await memoryRepository.deleteMemory(memoryId);
    await nerRepository.deleteNERProfile(TEST_USER_ID);
    await userRepository.deleteUser(TEST_USER_ID);

    // Clean up test routines
    const routinesToClean = await routineRepository.getRoutines(TEST_USER_ID);
    for (const r of routinesToClean) {
      if (r.id) await routineRepository.deleteRoutine(r.id);
    }

    // Verify cleanup
    const cleanUser = await userRepository.getUser(TEST_USER_ID);
    const cleanNer = await nerRepository.getNERProfile(TEST_USER_ID);
    const cleanMemories = await memoryRepository.getMemories(TEST_USER_ID);
    const cleanRoutines = await routineRepository.getRoutines(TEST_USER_ID);

    if (cleanUser !== null && cleanUser !== undefined) throw new Error('User record was not cleaned up');
    if (cleanNer !== null && cleanNer !== undefined) throw new Error('NER record was not cleaned up');
    if (cleanMemories.length > 0) throw new Error('Memory records were not cleaned up');
    if (cleanRoutines.length > 0) throw new Error('Routine records were not cleaned up');

    console.log('[Test] ✓ Cleanup complete: Zero test records left in database.');
    console.log('--- SPRINT 2 PERSONALIZATION VERIFICATION PASSED SUCCESSFULLY! 🎉 ---');
  } catch (err) {
    // Attempt emergency cleanup
    try {
      await userRepository.deleteUser(TEST_USER_ID);
      await nerRepository.deleteNERProfile(TEST_USER_ID);
      const mems = await memoryRepository.getMemories(TEST_USER_ID);
      for (const m of mems) if (m.id) await memoryRepository.deleteMemory(m.id);
    } catch {
      // ignore secondary errors during failure cleanup
    }
    throw err;
  }
}

runPersonalizationVerification()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('VERIFICATION FAILED:', err);
    process.exit(1);
  });
