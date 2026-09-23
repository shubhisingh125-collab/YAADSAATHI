/**
 * verifyGameCatalog.js
 * Verification script for YaadSaathi Step 3A: Common Cognitive Game Catalog
 */

import {
  COGNITIVE_GAME_CATALOG,
  GameStatus,
  STANDARD_DIFFICULTY_LEVELS,
  getGameById,
  getActiveGames,
  getPlannedGames,
  getGamesByDomain,
} from '../src/data/cognitiveGameCatalog.js';
import { CognitiveDomain } from '../src/domain/cognitive/cognitiveTypes.js';

console.log('--- VERIFYING COGNITIVE GAME CATALOG (STEP 3A) ---');

// 1. Total Catalog Count
console.log(`[Test] Total catalog items: ${COGNITIVE_GAME_CATALOG.length}`);
if (COGNITIVE_GAME_CATALOG.length !== 12) {
  throw new Error(`Expected 12 catalog items, found ${COGNITIVE_GAME_CATALOG.length}`);
}

// 2. Active Games Check
const activeGames = getActiveGames();
console.log(`[Test] Active games count: ${activeGames.length}`);
const activeIds = activeGames.map((g) => g.id);
console.log(`[Test] Active game IDs: ${activeIds.join(', ')}`);

const expectedActiveIds = [
  'memory-match',
  'pattern-recognition',
  'word-recall',
  'picture-recall',
  'daily-routine-recall',
  'sequence-recall',
  'pattern-complete',
  'find-difference',
  'personal-memory',
];
if (activeGames.length !== 9 || !expectedActiveIds.every((id) => activeIds.includes(id))) {
  throw new Error(`Active games mismatch: expected ${expectedActiveIds.join(', ')}, got ${activeIds.join(', ')}`);
}
console.log('[Test] ✓ getActiveGames() returns exactly the 9 active games.');

// 3. Planned Games Check
const plannedGames = getPlannedGames();
console.log(`[Test] Planned games count: ${plannedGames.length}`);
const plannedIds = plannedGames.map((g) => g.id);
console.log(`[Test] Planned game IDs: ${plannedIds.join(', ')}`);

const expectedPlannedIds = [
  'sort-objects',
  'everyday-money',
  'sound-memory',
];
if (plannedGames.length !== 3 || !expectedPlannedIds.every((id) => plannedIds.includes(id))) {
  throw new Error(`Planned games mismatch: expected ${expectedPlannedIds.join(', ')}, got ${plannedIds.join(', ')}`);
}
console.log('[Test] ✓ getPlannedGames() returns exactly the 3 remaining planned activities.');

// 4. Domain Mapping Check: WORKING_MEMORY
const workingMemoryGames = getGamesByDomain(CognitiveDomain.WORKING_MEMORY);
console.log(`[Test] WORKING_MEMORY activities: ${workingMemoryGames.map((g) => g.id).join(', ')}`);
if (!workingMemoryGames.some((g) => g.id === 'sequence-recall')) {
  throw new Error('Expected sequence-recall in WORKING_MEMORY games');
}
console.log('[Test] ✓ getGamesByDomain(WORKING_MEMORY) correctly returns Sequence Recall.');

// 5. Domain Mapping Check: REMINISCENCE
const reminiscenceGames = getGamesByDomain(CognitiveDomain.REMINISCENCE);
console.log(`[Test] REMINISCENCE activities: ${reminiscenceGames.map((g) => g.id).join(', ')}`);
if (
  !reminiscenceGames.some((g) => g.id === 'sound-memory') ||
  !reminiscenceGames.some((g) => g.id === 'personal-memory')
) {
  throw new Error('Expected sound-memory and personal-memory in REMINISCENCE games');
}
console.log('[Test] ✓ getGamesByDomain(REMINISCENCE) includes Sound & Memory and Personal Memory.');

// 6. Schema Structure & Accessibility Check
for (const game of COGNITIVE_GAME_CATALOG) {
  const requiredKeys = [
    'id',
    'name',
    'description',
    'cognitiveDomains',
    'difficultyLevels',
    'estimatedDuration',
    'accessibility',
    'status',
  ];
  for (const key of requiredKeys) {
    if (game[key] === undefined) {
      throw new Error(`Game ${game.id} is missing required property "${key}"`);
    }
  }

  // Accessibility keys
  const accessKeys = [
    'voiceSupported',
    'largeTextSupported',
    'touchFriendly',
    'lowComplexityVisuals',
    'requiresAudio',
    'requiresFineMotorControl',
  ];
  for (const aKey of accessKeys) {
    if (typeof game.accessibility[aKey] !== 'boolean') {
      throw new Error(`Game ${game.id} accessibility.${aKey} must be boolean, found ${typeof game.accessibility[aKey]}`);
    }
  }

  // Cognitive Domain validation
  for (const domain of game.cognitiveDomains) {
    if (!Object.values(CognitiveDomain).includes(domain)) {
      throw new Error(`Game ${game.id} contains invalid domain "${domain}"`);
    }
  }
}
console.log('[Test] ✓ All 12 items comply with required schema, accessibility flags, and valid domain constants.');

// 7. getGameById Check
const mm = getGameById('memory-match');
if (!mm || mm.status !== GameStatus.ACTIVE || mm.accessibility.touchFriendly !== true) {
  throw new Error('getGameById(memory-match) verification failed');
}
console.log('[Test] ✓ getGameById() resolves correctly.');

console.log('--- COGNITIVE GAME CATALOG VERIFICATION PASSED SUCCESSFULLY! 🎉 ---');
