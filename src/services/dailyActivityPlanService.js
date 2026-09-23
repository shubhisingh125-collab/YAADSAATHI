/**
 * dailyActivityPlanService.js
 * Generates a non-clinical, personalized daily cognitive engagement plan for YaadSaathi.
 * 
 * CORE PRINCIPLES:
 * - Strictly non-clinical: provides engagement pacing, never medical diagnoses or decline scores.
 * - Balanced variety: selects 3 distinct cognitive domains per day.
 * - Adaptive difficulty: initializes each activity to the elder's comfortable level (1-5).
 * - Personalization: respects routines, cultural interests, and personal memory cues.
 * - Deterministic for the current date and user so the daily schedule remains consistent.
 */

import { getActiveGames } from '../data/cognitiveGameCatalog.js';
import { getPersonalizationContext } from './personalizationContextService.js';
import { getStartingDifficulty, DIFFICULTY_LABELS } from '../logic/adaptiveEngine.js';
import * as cognitiveRepository from '../database/repositories/cognitiveRepository.js';
import { getOrCreateLocalUserId } from './gamePersistenceService.js';

const DEFAULT_REASONS = [
  {
    en: 'Let’s start with a gentle, joyful activity.',
    hi: 'आइए एक सरल व सुखद गतिविधि से शुरुआत करें।',
  },
  {
    en: 'Something you haven’t tried recently.',
    hi: 'कुछ ऐसा जो आपने हाल ही में नहीं खेला।',
  },
  {
    en: 'Continue your comforting daily routine.',
    hi: 'अपनी सुखद दैनिक दिनचर्या जारी रखें।',
  },
  {
    en: 'A pleasant practice for visual attention.',
    hi: 'एकाग्रता और दृष्टि ध्यान का सुंदर अभ्यास।',
  },
  {
    en: 'Cherish familiar memories and stories.',
    hi: 'पारिवारिक संस्मरण और सुंदर यादों को साझा करें।',
  },
  {
    en: 'A different rhythm to keep engagement fresh.',
    hi: 'एक नया अभ्यास जो मन को ताजगी प्रदान करे।',
  },
];

/**
 * Returns game icon helper based on game ID.
 */
function getGameIcon(gameId) {
  switch (gameId) {
    case 'memory-match':
      return '🧠';
    case 'pattern-recognition':
      return '🔔';
    case 'word-recall':
      return '💬';
    case 'picture-recall':
      return '🖼️';
    case 'sequence-recall':
      return '⚡';
    case 'pattern-complete':
      return '🧩';
    case 'find-difference':
      return '🔍';
    case 'daily-routine-recall':
      return '🕐';
    case 'personal-memory':
      return '🌸';
    default:
      return '✨';
  }
}

/**
 * Deterministic pseudo-random number generator based on seed string.
 * @param {string} seed
 * @returns {() => number}
 */
function createSeededRandom(seed) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (Math.imul(31, hash) + seed.charCodeAt(i)) | 0;
  }
  return function () {
    hash = (Math.imul(48271, hash) + 1) | 0;
    return ((hash >>> 0) % 10000) / 10000;
  };
}

/**
 * Generates or retrieves today's balanced 3-activity plan.
 * 
 * @param {string} [userId]
 * @param {Date} [targetDate=new Date()]
 * @returns {Promise<{
 *   date: string,
 *   userId: string,
 *   isNewUser: boolean,
 *   welcomeMessage: string,
 *   welcomeMessageHindi: string,
 *   activities: Array<{
 *     gameId: string,
 *     title: string,
 *     titleHindi: string,
 *     cognitiveDomain: string,
 *     difficulty: number,
 *     difficultyLabel: string,
 *     difficultyLabelHindi: string,
 *     estimatedDuration: string,
 *     icon: string,
 *     reason: string,
 *     reasonHindi: string,
 *     isCompleted: boolean
 *   }>
 * }>}
 */
export async function getDailyActivityPlan(userId = null, targetDate = new Date()) {
  const currentUserId = userId || getOrCreateLocalUserId();
  const dateStr = targetDate.toISOString().slice(0, 10); // YYYY-MM-DD

  // 1. Gather context & recent telemetry
  const [context, recentResults] = await Promise.all([
    getPersonalizationContext(currentUserId).catch(() => ({})),
    cognitiveRepository.getGameResults({ userId: currentUserId, limit: 15 }).catch(() => []),
  ]);

  const activeGames = getActiveGames();
  const isNewUser = recentResults.length === 0;

  // Check today's completed game IDs
  const todayResults = recentResults.filter((r) => {
    const rDate = (r.completedAt || r.createdAt || '').slice(0, 10);
    return rDate === dateStr;
  });
  const todayCompletedGameIds = new Set(todayResults.map((r) => r.gameId));

  // 2. Deterministic selection based on userId + dateStr
  const rng = createSeededRandom(`${currentUserId}-${dateStr}`);

  // Group candidate games
  // Priority selection: ensure 3 distinct cognitive domains
  const selectedGames = [];
  const selectedDomains = new Set();
  const selectedGameIds = new Set();

  // If user has routines or personal memories, prioritize those when appropriate
  const hasRoutines = context.routines && context.routines.length > 0;
  const hasMemories = context.memories && context.memories.length > 0;

  // Candidate pool ordered by domain diversity
  const shuffledCatalog = [...activeGames].sort(() => rng() - 0.5);

  // Pick 3 games with unique primary domains
  for (const game of shuffledCatalog) {
    if (selectedGames.length >= 3) break;

    const primaryDomain = (game.cognitiveDomains && game.cognitiveDomains[0]) || 'MEMORY';

    // Favor routine recall or personal memory if elder has personalized data
    if (game.id === 'daily-routine-recall' && hasRoutines && !selectedDomains.has(primaryDomain)) {
      selectedGames.push(game);
      selectedDomains.add(primaryDomain);
      selectedGameIds.add(game.id);
      continue;
    }

    if (game.id === 'personal-memory' && hasMemories && !selectedDomains.has(primaryDomain)) {
      selectedGames.push(game);
      selectedDomains.add(primaryDomain);
      selectedGameIds.add(game.id);
      continue;
    }

    // Otherwise pick if domain and game not yet selected
    if (!selectedDomains.has(primaryDomain) && !selectedGameIds.has(game.id)) {
      selectedGames.push(game);
      selectedDomains.add(primaryDomain);
      selectedGameIds.add(game.id);
    }
  }

  // Fallback: fill up to 3 if catalog is small or domains overlap
  if (selectedGames.length < 3) {
    for (const game of activeGames) {
      if (selectedGames.length >= 3) break;
      if (!selectedGameIds.has(game.id)) {
        selectedGames.push(game);
        selectedGameIds.add(game.id);
      }
    }
  }

  // 3. Assemble detailed activity items with starting difficulty & positive reasons
  const activities = await Promise.all(
    selectedGames.slice(0, 3).map(async (game, index) => {
      const difficulty = await getStartingDifficulty(game.id, currentUserId);
      const diffInfo = DIFFICULTY_LABELS[difficulty] || DIFFICULTY_LABELS[1];
      const primaryDomain = (game.cognitiveDomains && game.cognitiveDomains[0]) || 'MEMORY';

      // Assign non-clinical, user-friendly reason
      let reasonObj = DEFAULT_REASONS[index % DEFAULT_REASONS.length];
      if (isNewUser && index === 0) {
        reasonObj = {
          en: 'Let’s start with a gentle, comfortable activity.',
          hi: 'आइए एक सरल व सुखद गतिविधि से शुरुआत करें।',
        };
      } else if (game.id === 'daily-routine-recall') {
        reasonObj = {
          en: 'Continue your familiar daily routine.',
          hi: 'अपनी सुखद दैनिक दिनचर्या जारी रखें।',
        };
      } else if (game.id === 'personal-memory') {
        reasonObj = {
          en: 'Cherish familiar memories and stories.',
          hi: 'पारिवारिक संस्मरण और सुंदर यादों को साझा करें।',
        };
      }

      return {
        gameId: game.id,
        title: game.nameEnglish || (game.name && game.name.en) || game.id,
        titleHindi: game.nameHindi || (game.name && game.name.hi) || game.id,
        cognitiveDomain: primaryDomain,
        difficulty,
        difficultyLabel: diffInfo.en || `Level ${difficulty}`,
        difficultyLabelHindi: diffInfo.hi || `स्तर ${difficulty}`,
        estimatedDuration: '~3-5 minutes',
        icon: getGameIcon(game.id),
        reason: reasonObj.en,
        reasonHindi: reasonObj.hi,
        isCompleted: todayCompletedGameIds.has(game.id),
      };
    })
  );

  const welcomeMessage = isNewUser
    ? 'Welcome! Here is a gentle, joyful plan to start your day.'
    : 'Welcome back. Here is your personalized activity plan for today.';
  const welcomeMessageHindi = isNewUser
    ? 'स्वागत है! आपके लिए आज की सरल और सुखद योजना तैयार है।'
    : 'नमस्ते! आपके लिए आज की व्यक्तिगत गतिविधि योजना तैयार है।';

  return {
    date: dateStr,
    userId: currentUserId,
    isNewUser,
    welcomeMessage,
    welcomeMessageHindi,
    activities,
  };
}

export default getDailyActivityPlan;
