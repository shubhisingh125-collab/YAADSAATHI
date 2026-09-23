/**
 * gameTypes.js
 * Domain model for cognitive activities, sessions, telemetry, and game results.
 * Supports adaptive difficulty, session analytics, and AI personalization.
 */

import { CognitiveDomain } from './cognitiveTypes.js';
import { DifficultyLevel } from './difficultyTypes.js';

/**
 * Standard Cognitive Game Identifiers
 * @readonly
 * @enum {string}
 */
export const GameType = Object.freeze({
  MEMORY_MATCH: 'memory-match',
  PATTERN_RECOGNITION: 'pattern-recognition',
  WORD_RECALL: 'word-recall',
  PICTURE_RECALL: 'picture-recall',
  ROUTINE_RECALL: 'routine-recall',
  OBJECT_RECOGNITION: 'object-recognition',
  REMINISCENCE_ALBUM: 'reminiscence-album',
});

/**
 * Session State Progression
 * @readonly
 * @enum {string}
 */
export const GameSessionState = Object.freeze({
  IDLE: 'IDLE',
  IN_PROGRESS: 'IN_PROGRESS',
  PAUSED: 'PAUSED',
  COMPLETED: 'COMPLETED',
  ABANDONED: 'ABANDONED',
});

/**
 * Factory creating a standardized Game definition
 * 
 * @param {Object} params
 * @param {string} params.id - Unique game identifier
 * @param {string} params.nameEnglish
 * @param {string} params.nameHindi
 * @param {string} params.descriptionEnglish
 * @param {string} params.descriptionHindi
 * @param {string} params.cognitiveDomain - One of CognitiveDomain
 * @param {string} [params.themeColor='emerald']
 * @param {string} [params.icon='🧠']
 * @param {boolean} [params.supportsAdaptiveDifficulty=true]
 * @returns {Object} Game entity definition
 */
export function createGame({
  id,
  nameEnglish,
  nameHindi,
  descriptionEnglish,
  descriptionHindi,
  cognitiveDomain = CognitiveDomain.MEMORY,
  themeColor = 'emerald',
  icon = '🧠',
  supportsAdaptiveDifficulty = true,
}) {
  return {
    id,
    nameEnglish,
    nameHindi,
    descriptionEnglish,
    descriptionHindi,
    cognitiveDomain,
    themeColor,
    icon,
    supportsAdaptiveDifficulty,
    isActive: true,
  };
}

/**
 * Factory creating a GameSession representing an ongoing activity
 * 
 * @param {Object} params
 * @param {string} params.id - Session ID
 * @param {string} params.gameId - Game identifier
 * @param {string} params.userId - User identifier
 * @param {number} [params.difficultyLevel=DifficultyLevel.BALANCED]
 * @returns {Object} GameSession object
 */
export function createGameSession({
  id = `session-${Date.now()}`,
  gameId,
  userId = 'default-user',
  difficultyLevel = DifficultyLevel.BALANCED,
}) {
  return {
    id,
    gameId,
    userId,
    difficultyLevel,
    state: GameSessionState.IN_PROGRESS,
    startedAt: new Date().toISOString(),
    completedAt: null,
    pauseDurationSeconds: 0,
    currentRound: 1,
  };
}

/**
 * Factory creating a GameResult supporting telemetry and AI adaptation.
 * 
 * @param {Object} params
 * @param {string} params.gameId - Unique game ID
 * @param {string} [params.userId='default-user'] - User ID
 * @param {string} [params.sessionId] - Session reference
 * @param {string} [params.startedAt] - ISO timestamp when session began
 * @param {string} [params.completedAt] - ISO timestamp when session concluded
 * @param {number} [params.score=0] - Points or stars earned
 * @param {number} [params.accuracy=100] - Percentage accuracy (0 to 100)
 * @param {number} [params.responseTime=0] - Average response time in seconds
 * @param {number} [params.attempts=1] - Total attempts made
 * @param {number} [params.mistakes=0] - Total error count
 * @param {number} [params.hintsUsed=0] - Number of hints requested
 * @param {number} [params.difficultyLevel=DifficultyLevel.BALANCED] - Level played (1 to 5)
 * @param {string} [params.cognitiveDomain=CognitiveDomain.MEMORY] - Primary domain
 * @param {Object} [params.adaptiveRecommendation=null] - Engine output recommendation
 * @param {Object} [params.metadata={}] - Cultural context, rounds details, item keys
 * @returns {Object} Standardized GameResult object
 */
export function createGameResult({
  gameId,
  userId = 'default-user',
  sessionId = `sess-${Date.now()}`,
  startedAt = new Date().toISOString(),
  completedAt = new Date().toISOString(),
  score = 0,
  accuracy = 100,
  responseTime = 0,
  attempts = 1,
  mistakes = 0,
  hintsUsed = 0,
  difficultyLevel = DifficultyLevel.BALANCED,
  cognitiveDomain = CognitiveDomain.MEMORY,
  adaptiveRecommendation = null,
  metadata = {},
}) {
  return {
    id: `result-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    gameId,
    userId,
    sessionId,
    startedAt,
    completedAt,
    score,
    accuracy: Math.max(
      0,
      Math.min(
        100,
        typeof accuracy === 'number' && accuracy > 0 && accuracy <= 1
          ? Math.round(accuracy * 100)
          : Math.round(Number(accuracy) || 0)
      )
    ),
    responseTime: Number(responseTime.toFixed(2)),
    attempts: Math.max(1, attempts),
    mistakes: Math.max(0, mistakes),
    hintsUsed: Math.max(0, hintsUsed),
    difficultyLevel,
    cognitiveDomain,
    adaptiveRecommendation,
    metadata,
    recordedAt: new Date().toISOString(),
  };
}
