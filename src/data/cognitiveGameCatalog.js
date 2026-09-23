/**
 * cognitiveGameCatalog.js
 * Central catalog of all active and planned cognitive activities in YaadSaathi.
 * 
 * Non-clinical: defines cognitive engagement activities, accessibility metadata,
 * and cognitive domains for stimulating memory and concentration.
 */

import { CognitiveDomain } from '../domain/cognitive/cognitiveTypes.js';
import { DifficultyLevel } from '../domain/cognitive/difficultyTypes.js';
import { GameType } from '../domain/cognitive/gameTypes.js';

/**
 * Activity availability status
 * @readonly
 * @enum {string}
 */
export const GameStatus = Object.freeze({
  ACTIVE: 'ACTIVE',
  PLANNED: 'PLANNED',
});

/**
 * Standard difficulty range supported across cognitive activities (Levels 1 to 5)
 */
export const STANDARD_DIFFICULTY_LEVELS = Object.freeze([
  DifficultyLevel.GENTLE,   // 1
  DifficultyLevel.EASY,     // 2
  DifficultyLevel.BALANCED, // 3
  DifficultyLevel.ACTIVE,   // 4
  DifficultyLevel.ADVANCED, // 5
]);

/**
 * Central Cognitive Game Catalog
 */
export const COGNITIVE_GAME_CATALOG = Object.freeze([
  // ==========================================
  // 1. ACTIVE COGNITIVE GAMES (Currently Implemented)
  // ==========================================
  {
    id: GameType.MEMORY_MATCH, // 'memory-match'
    name: {
      en: 'Memory Match',
      hi: 'याददाश्त खेल (स्मृति मिलान)',
    },
    nameEnglish: 'Memory Match',
    nameHindi: 'याददाश्त खेल (स्मृति मिलान)',
    description: {
      en: 'Flip cards and find matching pairs to exercise visual retention and concentration.',
      hi: 'कार्ड पलटकर जोड़े पहचानें और अपनी दृश्य स्मृति व एकाग्रता को सक्रिय रखें।',
    },
    descriptionEnglish: 'Flip cards and find matching pairs to exercise visual retention and concentration.',
    descriptionHindi: 'कार्ड पलटकर जोड़े पहचानें और अपनी दृश्य स्मृति व एकाग्रता को सक्रिय रखें।',
    cognitiveDomains: Object.freeze([
      CognitiveDomain.MEMORY,
      CognitiveDomain.ATTENTION,
    ]),
    difficultyLevels: STANDARD_DIFFICULTY_LEVELS,
    estimatedDuration: '3-5 mins',
    accessibility: Object.freeze({
      voiceSupported: true,
      largeTextSupported: true,
      touchFriendly: true,
      lowComplexityVisuals: true,
      requiresAudio: false,
      requiresFineMotorControl: false,
    }),
    status: GameStatus.ACTIVE,
  },
  {
    id: GameType.PATTERN_RECOGNITION, // 'pattern-recognition'
    name: {
      en: 'Pattern Recognition',
      hi: 'पैटर्न पहचान (धुन और क्रम)',
    },
    nameEnglish: 'Pattern Recognition',
    nameHindi: 'पैटर्न पहचान (धुन और क्रम)',
    description: {
      en: 'Watch colored bells light up and listen to the melody, then repeat the sequence.',
      hi: 'रंगीन घंटियों की रोशनी और मधुर धुन देखें, फिर उसी क्रम में दोहराएं।',
    },
    descriptionEnglish: 'Watch colored bells light up and listen to the melody, then repeat the sequence.',
    descriptionHindi: 'रंगीन घंटियों की रोशनी और मधुर धुन देखें, फिर उसी क्रम में दोहराएं।',
    cognitiveDomains: Object.freeze([
      CognitiveDomain.PATTERN_RECOGNITION,
      CognitiveDomain.ATTENTION,
    ]),
    difficultyLevels: STANDARD_DIFFICULTY_LEVELS,
    estimatedDuration: '3-5 mins',
    accessibility: Object.freeze({
      voiceSupported: true,
      largeTextSupported: true,
      touchFriendly: true,
      lowComplexityVisuals: true,
      requiresAudio: true,
      requiresFineMotorControl: false,
    }),
    status: GameStatus.ACTIVE,
  },
  {
    id: GameType.WORD_RECALL, // 'word-recall'
    name: {
      en: 'Word Recall',
      hi: 'शब्द याददाश्त (भाषा अभ्यास)',
    },
    nameEnglish: 'Word Recall',
    nameHindi: 'शब्द याददाश्त (भाषा अभ्यास)',
    description: {
      en: 'Gentle conversational quiz recalling names of familiar household objects and daily concepts.',
      hi: 'दैनिक घरेलू वस्तुओं और परिचित शब्दों को याद करने की सरल व सुखद गतिविधि।',
    },
    descriptionEnglish: 'Gentle conversational quiz recalling names of familiar household objects and daily concepts.',
    descriptionHindi: 'दैनिक घरेलू वस्तुओं और परिचित शब्दों को याद करने की सरल व सुखद गतिविधि।',
    cognitiveDomains: Object.freeze([
      CognitiveDomain.LANGUAGE,
      CognitiveDomain.MEMORY,
    ]),
    difficultyLevels: STANDARD_DIFFICULTY_LEVELS,
    estimatedDuration: '3-5 mins',
    accessibility: Object.freeze({
      voiceSupported: true,
      largeTextSupported: true,
      touchFriendly: true,
      lowComplexityVisuals: true,
      requiresAudio: false,
      requiresFineMotorControl: false,
    }),
    status: GameStatus.ACTIVE,
  },
  {
    id: GameType.PICTURE_RECALL, // 'picture-recall'
    name: {
      en: 'Picture Recall',
      hi: 'तस्वीर याददाश्त (दृश्य स्मरण)',
    },
    nameEnglish: 'Picture Recall',
    nameHindi: 'तस्वीर याददाश्त (दृश्य स्मरण)',
    description: {
      en: 'Observe culturally familiar items for a few seconds, then identify the highlighted target.',
      hi: 'कुछ सेकंड परिचित चित्रों को ध्यान से देखें और फिर पूछे गए चित्र को पहचानें।',
    },
    descriptionEnglish: 'Observe culturally familiar items for a few seconds, then identify the highlighted target.',
    descriptionHindi: 'कुछ सेकंड परिचित चित्रों को ध्यान से देखें और फिर पूछे गए चित्र को पहचानें।',
    cognitiveDomains: Object.freeze([
      CognitiveDomain.MEMORY,
      CognitiveDomain.ATTENTION,
    ]),
    difficultyLevels: STANDARD_DIFFICULTY_LEVELS,
    estimatedDuration: '3-5 mins',
    accessibility: Object.freeze({
      voiceSupported: true,
      largeTextSupported: true,
      touchFriendly: true,
      lowComplexityVisuals: true,
      requiresAudio: false,
      requiresFineMotorControl: false,
    }),
    status: GameStatus.ACTIVE,
  },

  // ==========================================
  // 2. PLANNED COGNITIVE ACTIVITIES
  // ==========================================
  {
    id: 'sequence-recall',
    name: {
      en: 'Sequence Recall',
      hi: 'क्रम स्मरण (सक्रिय स्मृति)',
    },
    nameEnglish: 'Sequence Recall',
    nameHindi: 'क्रम स्मरण (सक्रिय स्मृति)',
    description: {
      en: 'Recall a short sequence of symbols or numbers in forward or reverse order.',
      hi: 'प्रतीकों या संख्याओं के संक्षिप्त क्रम को याद रखकर सही क्रम में चुनें।',
    },
    descriptionEnglish: 'Recall a short sequence of symbols or numbers in forward or reverse order.',
    descriptionHindi: 'प्रतीकों या संख्याओं के संक्षिप्त क्रम को याद रखकर सही क्रम में चुनें।',
    cognitiveDomains: Object.freeze([
      CognitiveDomain.WORKING_MEMORY,
    ]),
    difficultyLevels: STANDARD_DIFFICULTY_LEVELS,
    estimatedDuration: '3-5 mins',
    accessibility: Object.freeze({
      voiceSupported: true,
      largeTextSupported: true,
      touchFriendly: true,
      lowComplexityVisuals: true,
      requiresAudio: false,
      requiresFineMotorControl: false,
    }),
    status: GameStatus.ACTIVE,
  },
  {
    id: 'pattern-complete',
    name: {
      en: 'Pattern Complete',
      hi: 'पैटर्न पूर्ण करें',
    },
    nameEnglish: 'Pattern Complete',
    nameHindi: 'पैटर्न पूर्ण करें',
    description: {
      en: 'Identify missing elements in regular geometric or cultural patterns.',
      hi: 'पारंपरिक या ज्यामितीय पैटर्न में छूटे हुए हिस्से को पहचानकर पूरा करें।',
    },
    descriptionEnglish: 'Identify missing elements in regular geometric or cultural patterns.',
    descriptionHindi: 'पारंपरिक या ज्यामितीय पैटर्न में छूटे हुए हिस्से को पहचानकर पूरा करें।',
    cognitiveDomains: Object.freeze([
      CognitiveDomain.PATTERN_RECOGNITION,
    ]),
    difficultyLevels: STANDARD_DIFFICULTY_LEVELS,
    estimatedDuration: '3-5 mins',
    accessibility: Object.freeze({
      voiceSupported: true,
      largeTextSupported: true,
      touchFriendly: true,
      lowComplexityVisuals: true,
      requiresAudio: false,
      requiresFineMotorControl: false,
    }),
    status: GameStatus.ACTIVE,
  },
  {
    id: 'find-difference',
    name: {
      en: 'Find the Difference',
      hi: 'अंतर खोजें (एकाग्रता)',
    },
    nameEnglish: 'Find the Difference',
    nameHindi: 'अंतर खोजें (एकाग्रता)',
    description: {
      en: 'Spot gentle differences between two side-by-side calm illustrations.',
      hi: 'दो शांत चित्रों के बीच सौम्य अंतर पहचानकर ध्यान केंद्रित करें।',
    },
    descriptionEnglish: 'Spot gentle differences between two side-by-side calm illustrations.',
    descriptionHindi: 'दो शांत चित्रों के बीच सौम्य अंतर पहचानकर ध्यान केंद्रित करें।',
    cognitiveDomains: Object.freeze([
      CognitiveDomain.ATTENTION,
    ]),
    difficultyLevels: STANDARD_DIFFICULTY_LEVELS,
    estimatedDuration: '3-5 mins',
    accessibility: Object.freeze({
      voiceSupported: true,
      largeTextSupported: true,
      touchFriendly: true,
      lowComplexityVisuals: true,
      requiresAudio: false,
      requiresFineMotorControl: false,
    }),
    status: GameStatus.ACTIVE,
  },
  {
    id: 'sort-objects',
    name: {
      en: 'Sort the Objects',
      hi: 'वस्तुएं क्रमबद्ध करें',
    },
    nameEnglish: 'Sort the Objects',
    nameHindi: 'वस्तुएं क्रमबद्ध करें',
    description: {
      en: 'Group familiar household items by category such as fruits, clothes, or utensils.',
      hi: 'दैनिक वस्तुओं (फल, वस्त्र, बर्तन) को उनके उपयुक्त समूह में रखें।',
    },
    descriptionEnglish: 'Group familiar household items by category such as fruits, clothes, or utensils.',
    descriptionHindi: 'दैनिक वस्तुओं (फल, वस्त्र, बर्तन) को उनके उपयुक्त समूह में रखें।',
    cognitiveDomains: Object.freeze([
      CognitiveDomain.EXECUTIVE_FUNCTION,
    ]),
    difficultyLevels: STANDARD_DIFFICULTY_LEVELS,
    estimatedDuration: '3-5 mins',
    accessibility: Object.freeze({
      voiceSupported: true,
      largeTextSupported: true,
      touchFriendly: true,
      lowComplexityVisuals: true,
      requiresAudio: false,
      requiresFineMotorControl: false,
    }),
    status: GameStatus.PLANNED,
  },
  {
    id: 'daily-routine-recall',
    name: {
      en: 'Daily Routine Recall',
      hi: 'दिनचर्या स्मरण',
    },
    nameEnglish: 'Daily Routine Recall',
    nameHindi: 'दिनचर्या स्मरण',
    description: {
      en: 'Arrange morning, afternoon, and evening daily events in natural chronological order.',
      hi: 'सुबह, दोपहर और शाम की दैनिक गतिविधियों को सही क्रम में व्यवस्थित करें।',
    },
    descriptionEnglish: 'Arrange morning, afternoon, and evening daily events in natural chronological order.',
    descriptionHindi: 'सुबह, दोपहर और शाम की दैनिक गतिविधियों को सही क्रम में व्यवस्थित करें।',
    cognitiveDomains: Object.freeze([
      CognitiveDomain.ROUTINE_RECALL,
    ]),
    difficultyLevels: STANDARD_DIFFICULTY_LEVELS,
    estimatedDuration: '3-5 mins',
    accessibility: Object.freeze({
      voiceSupported: true,
      largeTextSupported: true,
      touchFriendly: true,
      lowComplexityVisuals: true,
      requiresAudio: false,
      requiresFineMotorControl: false,
    }),
    status: GameStatus.ACTIVE,
  },
  {
    id: 'everyday-money',
    name: {
      en: 'Everyday Money',
      hi: 'दैनिक लेन-देन (स्वावलंबन)',
    },
    nameEnglish: 'Everyday Money',
    nameHindi: 'दैनिक लेन-देन (स्वावलंबन)',
    description: {
      en: 'Gentle coin and rupee note identification and simple practical calculation exercises.',
      hi: 'भारतीय मुद्रा (सिक्के व नोट) की पहचान और सरल व्यावहारिक गणना।',
    },
    descriptionEnglish: 'Gentle coin and rupee note identification and simple practical calculation exercises.',
    descriptionHindi: 'भारतीय मुद्रा (सिक्के व नोट) की पहचान और सरल व्यावहारिक गणना।',
    cognitiveDomains: Object.freeze([
      CognitiveDomain.FUNCTIONAL_COGNITION,
    ]),
    difficultyLevels: STANDARD_DIFFICULTY_LEVELS,
    estimatedDuration: '3-5 mins',
    accessibility: Object.freeze({
      voiceSupported: true,
      largeTextSupported: true,
      touchFriendly: true,
      lowComplexityVisuals: true,
      requiresAudio: false,
      requiresFineMotorControl: false,
    }),
    status: GameStatus.PLANNED,
  },
  {
    id: 'sound-memory',
    name: {
      en: 'Sound & Memory',
      hi: 'ध्वनि व यादें',
    },
    nameEnglish: 'Sound & Memory',
    nameHindi: 'ध्वनि व यादें',
    description: {
      en: 'Listen to familiar cultural and nature sounds (flute, rain, temple bell) and recall associated memories.',
      hi: 'परिचित ध्वनियां (बांसुरी, बारिश, मंदिर की घंटी) सुनें और उनसे जुड़ी यादों को पहचानें।',
    },
    descriptionEnglish: 'Listen to familiar cultural and nature sounds (flute, rain, temple bell) and recall associated memories.',
    descriptionHindi: 'परिचित ध्वनियां (बांसुरी, बारिश, मंदिर की घंटी) सुनें और उनसे जुड़ी यादों को पहचानें।',
    cognitiveDomains: Object.freeze([
      CognitiveDomain.MEMORY,
      CognitiveDomain.REMINISCENCE,
    ]),
    difficultyLevels: STANDARD_DIFFICULTY_LEVELS,
    estimatedDuration: '3-5 mins',
    accessibility: Object.freeze({
      voiceSupported: true,
      largeTextSupported: true,
      touchFriendly: true,
      lowComplexityVisuals: true,
      requiresAudio: true,
      requiresFineMotorControl: false,
    }),
    status: GameStatus.PLANNED,
  },
  {
    id: 'personal-memory',
    name: {
      en: 'Personal Memory / Meri Yaadein',
      hi: 'मेरी यादें (पारिवारिक संस्मरण)',
    },
    nameEnglish: 'Personal Memory / Meri Yaadein',
    nameHindi: 'मेरी यादें (पारिवारिक संस्मरण)',
    description: {
      en: 'Gentle reminiscence engaging with family photographs, personal milestones, and cherished memories.',
      hi: 'पारिवारिक तस्वीरों, पुराने स्थानों और अनमोल संस्मरणों से जुड़ी स्नेहपूर्ण बातचीत।',
    },
    descriptionEnglish: 'Personal Memory / Meri Yaadein',
    descriptionHindi: 'पारिवारिक तस्वीरों, पुराने स्थानों और अनमोल संस्मरणों से जुड़ी स्नेहपूर्ण बातचीत।',
    cognitiveDomains: Object.freeze([
      CognitiveDomain.REMINISCENCE,
      CognitiveDomain.MEMORY,
    ]),
    difficultyLevels: STANDARD_DIFFICULTY_LEVELS,
    estimatedDuration: '3-5 mins',
    accessibility: Object.freeze({
      voiceSupported: true,
      largeTextSupported: true,
      touchFriendly: true,
      lowComplexityVisuals: true,
      requiresAudio: false,
      requiresFineMotorControl: false,
    }),
    status: GameStatus.ACTIVE,
  },
]);

// ==========================================
// 3. CATALOG HELPER FUNCTIONS
// ==========================================

/**
 * Retrieves a single game catalog definition by ID
 * @param {string} gameId 
 * @returns {Object|null}
 */
export function getGameById(gameId) {
  if (!gameId) return null;
  return COGNITIVE_GAME_CATALOG.find((g) => g.id === gameId) || null;
}

/**
 * Returns all currently implemented active games
 * @returns {Array<Object>}
 */
export function getActiveGames() {
  return COGNITIVE_GAME_CATALOG.filter((g) => g.status === GameStatus.ACTIVE);
}

/**
 * Returns all planned future cognitive activities
 * @returns {Array<Object>}
 */
export function getPlannedGames() {
  return COGNITIVE_GAME_CATALOG.filter((g) => g.status === GameStatus.PLANNED);
}

/**
 * Filters all activities (active or planned) associated with a specific cognitive domain
 * @param {string} domain - A value from CognitiveDomain
 * @returns {Array<Object>}
 */
export function getGamesByDomain(domain) {
  if (!domain) return [];
  return COGNITIVE_GAME_CATALOG.filter((g) =>
    Array.isArray(g.cognitiveDomains) && g.cognitiveDomains.includes(domain)
  );
}
