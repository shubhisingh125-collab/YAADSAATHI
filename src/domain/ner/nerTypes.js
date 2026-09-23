/**
 * nerTypes.js
 * Domain model for North Eastern Region (NER) cultural adaptation architecture.
 * Flexible, extensible schema supporting all 8 North Eastern states and diverse cultural communities.
 * Note: Does not hardcode a single culture or inject fake datasets.
 */

/**
 * The 8 States of the North Eastern Region of India
 * @readonly
 * @enum {string}
 */
export const NERState = Object.freeze({
  ARUNACHAL_PRADESH: 'ARUNACHAL_PRADESH',
  ASSAM: 'ASSAM',
  MANIPUR: 'MANIPUR',
  MEGHALAYA: 'MEGHALAYA',
  MIZORAM: 'MIZORAM',
  NAGALAND: 'NAGALAND',
  SIKKIM: 'SIKKIM',
  TRIPURA: 'TRIPURA',
});

/**
 * Standard Linguistic Identifiers for Regional Localization
 * @readonly
 * @enum {string}
 */
export const RegionalLanguageCode = Object.freeze({
  ASSAMESE: 'as',
  BENGALI: 'bn',
  BODO: 'brx',
  ENGLISH: 'en',
  GARO: 'grt',
  HINDI: 'hi',
  KHASI: 'kha',
  MANIPURI: 'mni',
  MIZO: 'lus',
  NEPALI: 'ne',
});

/**
 * Factory creating an extensible North Eastern Cultural Profile contract.
 * Allows personalized reminiscence, familiar cognitive prompts, and regional resonance
 * without locking into any single stereotype or subculture.
 * 
 * @param {Object} params
 * @param {string} [params.id]
 * @param {string} params.stateOrRegion - One of NERState or regional area
 * @param {string} params.preferredLanguage - One of RegionalLanguageCode
 * @param {string} [params.subRegionOrDistrict] - e.g. Brahmaputra Valley, Imphal Valley, Khasi Hills, etc.
 * @param {string[]} [params.culturalPreferences=[]] - Aesthetic motifs, textile patterns, community values
 * @param {string[]} [params.familiarFoods=[]] - Regional cuisines, daily comforting dishes, tea culture
 * @param {string[]} [params.familiarPlaces=[]] - Landmarks, rivers, sacred groves, native towns
 * @param {string[]} [params.familiarObjects=[]] - Traditional crafts, domestic utensils, looms, bells, hats
 * @param {string[]} [params.festivals=[]] - Seasonal agricultural, spiritual, or folk celebrations
 * @param {string[]} [params.music=[]] - Traditional instruments, folk melodies, prayer hymns
 * @param {string[]} [params.familyMemories=[]] - Community storytelling traditions, ancestral customs
 * @returns {Object} NERCulturalProfile entity
 */
export function createNERCulturalProfile({
  id = undefined,
  userId = null,
  stateOrRegion = NERState.ASSAM,
  preferredLanguage = RegionalLanguageCode.ASSAMESE,
  subRegionOrDistrict = '',
  culturalPreferences = [],
  familiarFoods = [],
  familiarPlaces = [],
  familiarObjects = [],
  festivals = [],
  music = [],
  familyMemories = [],
} = {}) {
  const profile = {
    userId,
    stateOrRegion,
    preferredLanguage,
    subRegionOrDistrict,
    culturalPreferences: Array.isArray(culturalPreferences) ? [...culturalPreferences] : [],
    familiarFoods: Array.isArray(familiarFoods) ? [...familiarFoods] : [],
    familiarPlaces: Array.isArray(familiarPlaces) ? [...familiarPlaces] : [],
    familiarObjects: Array.isArray(familiarObjects) ? [...familiarObjects] : [],
    festivals: Array.isArray(festivals) ? [...festivals] : [],
    music: Array.isArray(music) ? [...music] : [],
    familyMemories: Array.isArray(familyMemories) ? [...familyMemories] : [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  if (id !== undefined) {
    profile.id = id;
  }
  return profile;
}

/**
 * Factory creating a Culturally Resonant Cognitive Item representation.
 * Used by memory games, word recall, and picture recognition to bind regional artifacts
 * to cognitive stimulation.
 * 
 * @param {Object} params
 * @param {string} params.id
 * @param {string} params.category - 'object', 'food', 'place', 'festival', 'craft'
 * @param {string} params.stateOrRegion - One of NERState
 * @param {Record<string, string>} params.localizedNames - e.g. { en: '...', as: '...', bn: '...' }
 * @param {string} [params.emojiOrIcon]
 * @param {string} [params.mediaUrl]
 * @param {string} [params.soundFrequencyOrPrompt]
 * @returns {Object} NERCognitiveItem entity
 */
export function createNERCognitiveItem({
  id,
  category = 'object',
  stateOrRegion,
  localizedNames = {},
  emojiOrIcon = '🌿',
  mediaUrl = '',
  soundFrequencyOrPrompt = '',
}) {
  return {
    id,
    category,
    stateOrRegion,
    localizedNames,
    emojiOrIcon,
    mediaUrl,
    soundFrequencyOrPrompt,
  };
}
