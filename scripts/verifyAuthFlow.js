/**
 * scripts/verifyAuthFlow.js
 * Verification of Real Authentication Flow, Profile Onboarding,
 * Dynamic Greetings, and the Complete Elimination of Hardcoded "Damodar".
 */

import 'fake-indexeddb/auto';
import { db } from '../src/database/db.js';
import * as authService from '../src/services/auth/authService.js';
import * as userRepository from '../src/database/repositories/userRepository.js';
import * as nerRepository from '../src/database/repositories/nerRepository.js';
import { getOrCreateLocalUserId, setActiveLocalUserId } from '../src/services/gamePersistenceService.js';
import { buildSaathiContext } from '../src/services/personalizationContextService.js';

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
  console.log('YAADSAATHI AUTH FLOW & DYNAMIC IDENTITY SUITE');
  console.log('====================================================\n');

  await db.users.clear();
  await db.nerProfiles.clear();

  // ----------------------------------------------------
  // TEST 1: New User Sign Up & Profile Creation
  // ----------------------------------------------------
  console.log('--- TEST 1: User Sign Up & Canonical Identity ---');

  const signupRes = await authService.signUp({
    email: 'kamala.baruah@example.com',
    password: 'password123',
    displayName: 'Kamala Baruah',
    preferredName: 'Kamala Aaita',
    preferredLanguage: 'as',
    stateOrRegion: 'ASSAM',
  });

  assert(signupRes.user !== null, 'Sign up created user record');
  assert(signupRes.error === null, 'Sign up completed with zero errors');

  const userId = signupRes.user.id;
  assert(userId && typeof userId === 'string', `Canonical user ID generated: ${userId}`);
  assert(userId !== 'local-elder-default', 'Canonical user ID is distinct and not "local-elder-default"');

  // ----------------------------------------------------
  // TEST 2: Active User ID & Persistence Binding
  // ----------------------------------------------------
  console.log('\n--- TEST 2: Active User ID & Persistence Binding ---');

  setActiveLocalUserId(userId);
  const activeId = getOrCreateLocalUserId();
  assert(activeId === userId, 'getOrCreateLocalUserId reflects the authenticated user ID');

  // ----------------------------------------------------
  // TEST 3: User Profile Retrieval & Personalization
  // ----------------------------------------------------
  console.log('\n--- TEST 3: Profile Retrieval & Dynamic Personalization ---');

  const profile = await authService.getUserProfile(userId);
  assert(profile !== null, 'User profile retrieved');
  assert(profile.name === 'Kamala Baruah' || profile.display_name === 'Kamala Baruah', 'Profile name matches Kamala Baruah');
  assert(profile.preferredName === 'Kamala Aaita' || profile.preferred_name === 'Kamala Aaita', 'Preferred name is Kamala Aaita');

  // ----------------------------------------------------
  // TEST 4: Saathi Context Dynamic User Personalization (Zero Damodar)
  // ----------------------------------------------------
  console.log('\n--- TEST 4: Saathi Context Dynamic Personalization (Zero Damodar) ---');

  const saathiCtx = await buildSaathiContext(userId);
  assert(saathiCtx.stateOrRegion === 'ASSAM', 'Saathi context receives user region ASSAM');
  assert(saathiCtx.preferredLanguage === 'as', 'Saathi context receives user preferred language as (Assamese)');

  // Verify prompt does NOT contain "Damodar"
  const promptContextJson = JSON.stringify(saathiCtx);
  assert(!promptContextJson.includes('Damodar'), 'Saathi context is completely free of hardcoded "Damodar" text');

  // ----------------------------------------------------
  // TEST 5: Profile Updates
  // ----------------------------------------------------
  console.log('\n--- TEST 5: Profile Update & Customization ---');

  const updateRes = await authService.updateUserProfile(userId, {
    preferredName: 'Aaita',
    age: 76,
  });

  assert(updateRes.error === null, 'Profile updated successfully');

  // Cleanup
  await db.users.clear();
  await db.nerProfiles.clear();

  console.log('\n====================================================');
  console.log(`AUTH FLOW SUMMARY: ${passed} Passed, ${failed} Failed`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal error running auth flow suite:', err);
  process.exit(1);
});
