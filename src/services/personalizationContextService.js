/**
 * personalizationContextService.js
 * Assembles local user context, regional profile, personal memories, routines,
 * and today's personalized activity plan for Saathi dialogue assistance.
 * 
 * Non-clinical: privacy-preserving, local-only context aggregator.
 */

import * as userRepository from '../database/repositories/userRepository.js';
import * as nerRepository from '../database/repositories/nerRepository.js';
import * as routineRepository from '../database/repositories/routineRepository.js';
import * as memoryRepository from '../database/repositories/memoryRepository.js';
import * as cognitiveRepository from '../database/repositories/cognitiveRepository.js';
import { getOrCreateLocalUserId } from './gamePersistenceService.js';
import { getDailyActivityPlan } from './dailyActivityPlanService.js';

/**
 * Gathers complete local personalization context for a user.
 * 
 * @param {string} [userId] - Optional user identifier
 * @returns {Promise<{
 *   user: Object|null,
 *   ner: Object|null,
 *   routines: Array<Object>,
 *   memories: Array<Object>,
 *   recentActivity: Array<Object>
 * }>}
 */
export async function getPersonalizationContext(userId) {
  const currentUserId = userId || getOrCreateLocalUserId();

  try {
    const [user, ner, routines, memories, recentActivity] = await Promise.all([
      userRepository.getUser(currentUserId).catch(() => null),
      nerRepository.getNERProfile(currentUserId).catch(() => null),
      routineRepository.getRoutines(currentUserId).catch(() => []),
      memoryRepository.getMemories(currentUserId).catch(() => []),
      cognitiveRepository.getGameResults({ userId: currentUserId, limit: 10 }).catch(() => []),
    ]);

    return {
      user: user || null,
      ner: ner || null,
      routines: Array.isArray(routines) ? routines : [],
      memories: Array.isArray(memories) ? memories : [],
      recentActivity: Array.isArray(recentActivity) ? recentActivity : [],
    };
  } catch (err) {
    console.warn('[PersonalizationContext] Error assembling local context:', err);
    return {
      user: null,
      ner: null,
      routines: [],
      memories: [],
      recentActivity: [],
    };
  }
}

/**
 * Builds a structured, minimized context ready for Saathi AI / Voice companion.
 * Contains only engagement-relevant preferences, safe memory cues, and today's plan.
 * 
 * @param {string} [userId]
 * @returns {Promise<{
 *   preferredLanguage: string,
 *   stateOrRegion: string,
 *   subRegion: string,
 *   interests: Array<string>,
 *   familiarFoods: Array<string>,
 *   familiarPlaces: Array<string>,
 *   routines: Array<{ time: string, title: string }>,
 *   memories: Array<{ title: string, relationship?: string, type: string }>,
 *   recentActivities: Array<{ gameId: string, accuracy: number, score: number }>,
 *   todayPlan: Object|null
 * }>}
 */
export async function buildSaathiContext(userId) {
  const currentUserId = userId || getOrCreateLocalUserId();
  const rawContext = await getPersonalizationContext(currentUserId);
  const todayPlan = await getDailyActivityPlan(currentUserId).catch(() => null);

  const ner = rawContext.ner || {};
  const user = rawContext.user || {};

  return {
    preferredLanguage: ner.preferredLanguage || user.primaryLanguage || 'hi',
    stateOrRegion: ner.stateOrRegion || user.stateOrRegion || 'ASSAM',
    subRegion: ner.subRegionOrDistrict || '',
    interests: Array.isArray(ner.culturalPreferences) ? ner.culturalPreferences : [],
    familiarFoods: Array.isArray(ner.familiarFoods) ? ner.familiarFoods : [],
    familiarPlaces: Array.isArray(ner.familiarPlaces) ? ner.familiarPlaces : [],
    festivals: Array.isArray(ner.festivals) ? ner.festivals : [],
    routines: (rawContext.routines || []).map((r) => ({
      time: r.time || 'Daily',
      title: r.titleEnglish || r.titleHindi || r.title || '',
    })),
    memories: (rawContext.memories || []).map((m) => ({
      title: m.title || '',
      type: m.type || 'STORY',
      relationship: m.relationship || '',
      description: m.description || '',
    })),
    recentActivities: (rawContext.recentActivity || []).map((a) => ({
      gameId: a.gameId,
      accuracy: a.accuracy,
      score: a.score,
    })),
    todayPlan: todayPlan || null,
  };
}
