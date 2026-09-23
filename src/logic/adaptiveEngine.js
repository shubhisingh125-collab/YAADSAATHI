/**
 * adaptiveEngine.js - Non-Clinical Cognitive Adaptive Engine for YaadSaathi
 * 
 * CORE PRINCIPLES:
 * - Strictly non-clinical: does NOT diagnose, score cognitive decline, or evaluate disease.
 * - Focuses solely on respectful engagement pacing and joyful cognitive stimulation.
 * - Uses multi-session hysteresis (at least 3 consistent sessions required for difficulty changes).
 * - Changes difficulty only 1 level at a time (clamped between 1 and 5).
 * - Balanced variety across cognitive domains (Memory, Attention, Working Memory, Pattern Recognition, etc.)
 */

import { CognitiveDomain } from '../domain/cognitive/cognitiveTypes.js';
import { DifficultyLevel } from '../domain/cognitive/difficultyTypes.js';
import { getActiveGames } from '../data/cognitiveGameCatalog.js';
import * as cognitiveRepository from '../database/repositories/cognitiveRepository.js';
import { getOrCreateLocalUserId } from '../services/gamePersistenceService.js';

export const MIN_DIFFICULTY = 1;
export const MAX_DIFFICULTY = 5;

export const DIFFICULTY_LABELS = {
  1: { hi: 'स्तर 1: बहुत सरल (Gentle)', en: 'Level 1: Gentle', pairs: 3, nameKey: 'gentle' },
  2: { hi: 'स्तर 2: सरल (Easy)', en: 'Level 2: Easy', pairs: 4, nameKey: 'easy' },
  3: { hi: 'स्तर 3: संतुलित (Balanced)', en: 'Level 3: Balanced', pairs: 6, nameKey: 'balanced' },
  4: { hi: 'स्तर 4: मध्यम (Active)', en: 'Level 4: Active', pairs: 8, nameKey: 'active' },
  5: { hi: 'स्तर 5: उन्नत (Challenging)', en: 'Level 5: Advanced', pairs: 10, nameKey: 'advanced' },
};

/**
 * Creates a neutral, non-clinical performance profile summary from recent session history.
 * 
 * @param {Array<Object>|Object} history - Array of recent gameResult objects or single result
 * @returns {{
 *   gameId: string,
 *   cognitiveDomain: string,
 *   recentAccuracy: number,
 *   averageResponseTime: number,
 *   mistakes: number,
 *   hintsUsed: number,
 *   recentAttempts: number,
 *   averageScore: number
 * }}
 */
export function analyzeActivityPerformance(history) {
  const items = Array.isArray(history) ? history : (history ? [history] : []);
  if (items.length === 0) {
    return {
      gameId: '',
      cognitiveDomain: CognitiveDomain.MEMORY,
      recentAccuracy: 100,
      averageResponseTime: 0,
      mistakes: 0,
      hintsUsed: 0,
      recentAttempts: 0,
      averageScore: 0,
    };
  }

  // Focus on the most recent window (up to 5 sessions)
  const recentWindow = items.slice(0, 5);
  const total = recentWindow.length;

  let totalAcc = 0;
  let totalTime = 0;
  let totalMistakes = 0;
  let totalHints = 0;
  let totalScore = 0;

  for (const item of recentWindow) {
    // Normalize accuracy to percentage (0-100)
    let acc = Number(item.accuracy) || 0;
    if (acc <= 1 && acc > 0) acc = acc * 100;
    totalAcc += acc;
    totalTime += Number(item.responseTime) || 0;
    totalMistakes += Number(item.mistakes) || 0;
    totalHints += Number(item.hintsUsed) || 0;
    totalScore += Number(item.score) || 0;
  }

  const primaryItem = recentWindow[0] || {};

  return {
    gameId: primaryItem.gameId || '',
    cognitiveDomain: primaryItem.cognitiveDomain || CognitiveDomain.MEMORY,
    recentAccuracy: Math.round(totalAcc / total),
    averageResponseTime: Number((totalTime / total).toFixed(1)),
    mistakes: Math.round(totalMistakes / total),
    hintsUsed: Math.round(totalHints / total),
    recentAttempts: total,
    averageScore: Math.round(totalScore / total),
  };
}

/**
 * Calculates difficulty adjustment with multi-session stability / hysteresis.
 * Requires at least 3 recent sessions before recommending a level change.
 * 
 * @param {Array<Object>} history - Recent game results
 * @param {number} [currentDifficulty=3] - Current difficulty level
 * @returns {{
 *   adjustment: number, // -1, 0, or +1
 *   change: 'increased' | 'decreased' | 'unchanged',
 *   reason: string,
 *   reasonHindi: string,
 *   isStable: boolean
 * }}
 */
export function calculateDifficultyAdjustment(history = [], currentDifficulty = 3) {
  const items = Array.isArray(history) ? history : (history ? [history] : []);
  const curDiff = Math.min(MAX_DIFFICULTY, Math.max(MIN_DIFFICULTY, Number(currentDifficulty) || 3));

  // HYSTERESIS: Need at least 3 recent sessions to establish consistency
  if (items.length < 3) {
    return {
      adjustment: 0,
      change: 'unchanged',
      reason: 'Building a comfortable activity pace together.',
      reasonHindi: 'आरामदायक गति से खेलना जारी रखें।',
      isStable: false,
    };
  }

  const profile = analyzeActivityPerformance(items);
  const recentWindow = items.slice(0, 5);

  // Check consistent strength across recent sessions
  const strongSessions = recentWindow.filter((s) => {
    let acc = Number(s.accuracy) || 0;
    if (acc <= 1 && acc > 0) acc = acc * 100;
    const respTime = Number(s.responseTime) || 0;
    return acc >= 80 && (respTime === 0 || respTime <= 10);
  });

  // Check consistent lower sessions
  const lowSessions = recentWindow.filter((s) => {
    let acc = Number(s.accuracy) || 0;
    if (acc <= 1 && acc > 0) acc = acc * 100;
    const respTime = Number(s.responseTime) || 0;
    return acc < 50 || respTime > 15;
  });

  // RULE 1: Consistently strong across 3+ recent sessions -> gently increase by 1
  if (strongSessions.length >= 3 && profile.recentAccuracy >= 80 && curDiff < MAX_DIFFICULTY) {
    return {
      adjustment: 1,
      change: 'increased',
      reason: 'Wonderful progress. Taking a gentle step forward.',
      reasonHindi: 'बहुत सुंदर प्रगति! अगले स्तर पर थोड़ा और अभ्यास करते हैं।',
      isStable: true,
    };
  }

  // RULE 2: Consistently needing ease across 3+ recent sessions -> gently ease by 1
  if (lowSessions.length >= 3 && (profile.recentAccuracy < 50 || profile.averageResponseTime > 15) && curDiff > MIN_DIFFICULTY) {
    return {
      adjustment: -1,
      change: 'decreased',
      reason: 'Making this activity a little more gentle and relaxed.',
      reasonHindi: 'इस गतिविधि को और अधिक सहज और शांत बनाते हैं।',
      isStable: true,
    };
  }

  // RULE 3: Mixed, fluctuating, or at boundary -> maintain current difficulty
  return {
    adjustment: 0,
    change: 'unchanged',
    reason: 'Continuing at the same comfortable and enjoyable pace.',
    reasonHindi: 'इसी आरामदायक और सुखद गति से खेलना जारी रखें।',
    isStable: true,
  };
}

/**
 * Computes the recommended difficulty level (clamped 1 to 5).
 * 
 * @param {Array<Object>} history - Recent game results
 * @param {number} [currentDifficulty=3] - Current difficulty level
 * @returns {{
 *   nextDifficulty: number,
 *   change: 'increased' | 'decreased' | 'unchanged',
 *   reason: string,
 *   reasonHindi: string
 * }}
 */
export function getRecommendedDifficulty(history = [], currentDifficulty = 3) {
  const curDiff = Math.min(MAX_DIFFICULTY, Math.max(MIN_DIFFICULTY, Number(currentDifficulty) || 3));
  const diffCalc = calculateDifficultyAdjustment(history, curDiff);
  const nextDifficulty = Math.min(MAX_DIFFICULTY, Math.max(MIN_DIFFICULTY, curDiff + diffCalc.adjustment));

  return {
    nextDifficulty,
    change: diffCalc.change,
    reason: diffCalc.reason,
    reasonHindi: diffCalc.reasonHindi,
  };
}

/**
 * Central starting difficulty helper for cognitive games.
 * Queries local telemetry for recent history or falls back to gentle defaults.
 * 
 * @param {string} gameId
 * @param {string} [userId]
 * @returns {Promise<number>} Recommended starting difficulty level (1 - 5)
 */
export async function getStartingDifficulty(gameId, userId = null) {
  const currentUserId = userId || getOrCreateLocalUserId();
  try {
    const results = await cognitiveRepository.getGameResults({
      userId: currentUserId,
      limit: 10,
    });
    const gameHistory = results.filter((r) => r.gameId === gameId);

    if (!gameHistory || gameHistory.length === 0) {
      // New user / no history: start at Gentle (1) or Balanced (3) based on game type
      return DifficultyLevel.GENTLE;
    }

    const latestDiff = Number(gameHistory[0].difficultyLevel) || DifficultyLevel.BALANCED;
    const recommendation = getRecommendedDifficulty(gameHistory, latestDiff);
    return recommendation.nextDifficulty;
  } catch (err) {
    console.warn(`[AdaptiveEngine] Could not calculate starting difficulty for ${gameId}:`, err);
    return DifficultyLevel.GENTLE;
  }
}

/**
 * Recommends the next cognitive activity based on cognitive domain balancing and recent engagement.
 * 
 * @param {Object} context - User personalization context
 * @param {Array<Object>} [recentResults=[]] - Recent game results
 * @returns {Object} Recommended game definition from catalog
 */
export function recommendNextActivity(context = {}, recentResults = []) {
  const activeGames = getActiveGames();
  if (activeGames.length === 0) return null;

  const recentGameIds = (recentResults || []).slice(0, 3).map((r) => r.gameId);
  const recentDomains = (recentResults || []).slice(0, 3).flatMap((r) => r.cognitiveDomain ? [r.cognitiveDomain] : []);

  // 1. Prefer games from domains that haven't been practiced recently
  const unpracticedDomainGames = activeGames.filter((g) => {
    const domains = g.cognitiveDomains || [];
    return !domains.some((d) => recentDomains.includes(d)) && !recentGameIds.includes(g.id);
  });

  if (unpracticedDomainGames.length > 0) {
    return unpracticedDomainGames[0];
  }

  // 2. Prefer games not in recentGameIds
  const unplayedGames = activeGames.filter((g) => !recentGameIds.includes(g.id));
  if (unplayedGames.length > 0) {
    return unplayedGames[0];
  }

  // 3. Fallback to first active game
  return activeGames[0];
}

/**
 * Single-session difficulty calculator (retained for backward compatibility).
 * 
 * @param {Object} params
 * @param {number} params.accuracy - Percentage accuracy (0 - 100)
 * @param {number} params.averageResponseTime - Average response time in seconds
 * @param {number} params.currentDifficulty - Current difficulty level (1 - 5)
 * @returns {{ nextDifficulty: number, reason: string, reasonHindi: string, change: 'increased' | 'decreased' | 'unchanged' }}
 */
export function calculateAdaptiveDifficulty({
  accuracy,
  averageResponseTime,
  currentDifficulty = 3,
}) {
  const acc = Number(accuracy) || 0;
  const respTime = Number(averageResponseTime) || 0;
  const curDiff = Math.min(MAX_DIFFICULTY, Math.max(MIN_DIFFICULTY, Number(currentDifficulty) || 3));

  let nextDifficulty = curDiff;
  let reason = '';
  let reasonHindi = '';
  let change = 'unchanged';

  // Rule 1: High accuracy and fast response time -> Level Up
  if (acc >= 80 && (respTime === 0 || respTime <= 8)) {
    if (curDiff < MAX_DIFFICULTY) {
      nextDifficulty = curDiff + 1;
      change = 'increased';
      reason = 'Excellent performance. Next activity will be slightly harder.';
      reasonHindi = 'उत्कृष्ट प्रदर्शन! अगली गतिविधि थोड़ी और चुनौतीपूर्ण होगी।';
    } else {
      nextDifficulty = MAX_DIFFICULTY;
      change = 'unchanged';
      reason = 'Excellent performance! You are performing at the highest mastery level.';
      reasonHindi = 'शानदार प्रदर्शन! आप उच्चतम स्तर पर बहुत बढ़िया खेल रहे हैं।';
    }
  }
  // Rule 2: Low accuracy or high response time -> Level Down to reduce cognitive strain
  else if (acc < 50 || respTime > 15) {
    if (curDiff > MIN_DIFFICULTY) {
      nextDifficulty = curDiff - 1;
      change = 'decreased';
      reason = "Let's make the next activity a little easier.";
      reasonHindi = 'कोई बात नहीं! अगली गतिविधि को थोड़ा और आसान बनाते हैं।';
    } else {
      nextDifficulty = MIN_DIFFICULTY;
      change = 'unchanged';
      reason = 'Taking our time at the most gentle level. Relax and enjoy.';
      reasonHindi = 'सबसे सरल और सहज स्तर पर खेलें। आराम से आनंद लें।';
    }
  }
  // Rule 3: Balanced performance -> Maintain Level
  else {
    nextDifficulty = curDiff;
    change = 'unchanged';
    reason = 'Good effort. Continuing at the same comfortable pace.';
    reasonHindi = 'अच्छा प्रयास! इसी आरामदायक गति से खेलना जारी रखें।';
  }

  return {
    nextDifficulty,
    reason,
    reasonHindi,
    change,
  };
}

export default calculateAdaptiveDifficulty;
