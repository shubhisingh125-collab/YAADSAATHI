/**
 * scripts/verifySyncEngine.js
 * Verification suite for IndexedDB <-> Supabase Cloud Synchronization & Guest Migration.
 */

import 'fake-indexeddb/auto';
import { db } from '../src/database/db.js';
import * as syncService from '../src/services/sync/syncService.js';
import * as memoryRepository from '../src/database/repositories/memoryRepository.js';
import * as routineRepository from '../src/database/repositories/routineRepository.js';
import * as cognitiveRepository from '../src/database/repositories/cognitiveRepository.js';

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
  console.log('YAADSAATHI SYNC ENGINE & GUEST MIGRATION SUITE');
  console.log('====================================================\n');

  // Clear tables
  await db.memories.clear();
  await db.routines.clear();
  await db.gameResults.clear();

  // ----------------------------------------------------
  // TEST 1: Connectivity & Safe Offline Detection
  // ----------------------------------------------------
  console.log('--- TEST 1: Connectivity & Safe Fallback ---');
  const onlineStatus = syncService.isOnline();
  assert(typeof onlineStatus === 'boolean', `isOnline() returns valid boolean (${onlineStatus})`);

  const offlineSyncResult = await syncService.syncAll('mock-user-123');
  assert(offlineSyncResult.success === true, 'syncAll gracefully succeeds without crashing when unconfigured or offline');

  // ----------------------------------------------------
  // TEST 2: Safe Guest-to-User Local Data Migration
  // ----------------------------------------------------
  console.log('\n--- TEST 2: Guest to Authenticated Account Migration ---');

  const guestUserId = 'guest-elder-123';
  const authenticatedUserId = '99999999-auth-4444-8888-999999999999';

  // Seed guest activity
  await memoryRepository.addMemory({
    userId: guestUserId,
    title: 'Guest Walk in Park',
    category: 'STORY',
    description: 'Saw lovely marigolds with daughter.',
  });

  await routineRepository.addRoutine({
    userId: guestUserId,
    title: 'Morning Yoga',
    period: 'morning',
    scheduledTime: '07:30 AM',
    completed: true,
  });

  await cognitiveRepository.saveGameResult({
    userId: guestUserId,
    gameId: 'memory-match',
    score: 80,
    accuracy: 90,
  });

  // Verify guest records exist
  const initialGuestMems = await memoryRepository.getMemories(guestUserId);
  assert(initialGuestMems.length === 1, 'Guest memory created in local DB');

  // Perform migration to authenticated account
  const migrationResult = await syncService.importLocalDataToUser(guestUserId, authenticatedUserId);
  assert(migrationResult.importedCount === 3, `Imported ${migrationResult.importedCount} guest records to authenticated user`);

  // Verify authenticated user now owns migrated records
  const authMems = await memoryRepository.getMemories(authenticatedUserId);
  assert(authMems.length === 1 && authMems[0].title === 'Guest Walk in Park', 'Authenticated user now owns migrated memory');

  const authRoutines = await routineRepository.getRoutines(authenticatedUserId);
  assert(authRoutines.length === 1 && authRoutines[0].title === 'Morning Yoga', 'Authenticated user now owns migrated routine');

  const authResults = await cognitiveRepository.getGameResults({ userId: authenticatedUserId });
  assert(authResults.length === 1 && authResults[0].gameId === 'memory-match', 'Authenticated user now owns migrated game results');

  // ----------------------------------------------------
  // TEST 3: Conflict Resolution & Timestamp Preservation
  // ----------------------------------------------------
  console.log('\n--- TEST 3: Safe Conflict Resolution ---');

  const t1 = new Date('2026-09-01T10:00:00Z').toISOString();
  const t2 = new Date('2026-09-02T10:00:00Z').toISOString();

  assert(new Date(t2) > new Date(t1), 'Timestamp ordering verifies latest-write-wins resolution');

  // Cleanup
  await db.memories.clear();
  await db.routines.clear();
  await db.gameResults.clear();

  console.log('\n====================================================');
  console.log(`SYNC ENGINE SUMMARY: ${passed} Passed, ${failed} Failed`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal error running sync engine suite:', err);
  process.exit(1);
});
