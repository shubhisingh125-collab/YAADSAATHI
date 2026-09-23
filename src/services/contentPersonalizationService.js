/**
 * contentPersonalizationService.js
 * Provides regional preferences, linguistic cues, and personal memory tokens
 * for adaptive cognitive activities without hardcoding or fabricating cultural stereotypes.
 */

import * as nerRepository from '../database/repositories/nerRepository.js';
import * as memoryRepository from '../database/repositories/memoryRepository.js';
import { getOrCreateLocalUserId } from './gamePersistenceService.js';

/**
 * Returns structured regional and memory tokens for tailoring cognitive activities.
 * 
 * @param {string} [userId]
 * @returns {Promise<{
 *   language: string,
 *   region: string,
 *   interests: Array<string>,
 *   familiarFoods: Array<string>,
 *   familiarPlaces: Array<string>,
 *   familiarObjects: Array<string>,
 *   relevantMemories: Array<Object>
 * }>}
 */
export async function getPersonalizedActivityContext(userId) {
  const currentUserId = userId || getOrCreateLocalUserId();

  try {
    const [ner, memories] = await Promise.all([
      nerRepository.getNERProfile(currentUserId).catch(() => null),
      memoryRepository.getMemories(currentUserId).catch(() => []),
    ]);

    return {
      language: ner?.preferredLanguage || 'hi',
      region: ner?.stateOrRegion || 'ASSAM',
      interests: Array.isArray(ner?.culturalPreferences) ? ner.culturalPreferences : [],
      familiarFoods: Array.isArray(ner?.familiarFoods) ? ner.familiarFoods : [],
      familiarPlaces: Array.isArray(ner?.familiarPlaces) ? ner.familiarPlaces : [],
      familiarObjects: Array.isArray(ner?.familiarObjects) ? ner.familiarObjects : [],
      relevantMemories: Array.isArray(memories) ? memories.slice(0, 5) : [],
    };
  } catch (err) {
    console.warn('[ContentPersonalization] Error fetching activity context:', err);
    return {
      language: 'hi',
      region: 'ASSAM',
      interests: [],
      familiarFoods: [],
      familiarPlaces: [],
      familiarObjects: [],
      relevantMemories: [],
    };
  }
}
