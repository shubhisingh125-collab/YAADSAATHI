/**
 * aiTypes.js
 * Domain model for AI-assisted companion dialogues, user context, cognitive recommendations,
 * and adaptive engine suggestions.
 * Note: Contract definitions only. Does NOT connect to any external AI API.
 */

/**
 * Message Roles in AI Dialogue
 * @readonly
 * @enum {string}
 */
export const AIMessageRole = Object.freeze({
  SYSTEM: 'system',
  USER: 'user',
  ASSISTANT: 'assistant',
});

/**
 * Factory creating an individual AI Message in a dialogue
 * 
 * @param {Object} params
 * @param {string} [params.id]
 * @param {string} params.role - One of AIMessageRole
 * @param {string} params.content - Text message content
 * @param {string} [params.language='hi']
 * @param {string} [params.intent] - Identified semantic intent
 * @param {number} [params.confidence=1.0]
 * @param {string} [params.audioUrl] - Synthesized audio if available
 * @returns {Object} AIMessage entity
 */
export function createAIMessage({
  id = `aimsg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
  role = AIMessageRole.ASSISTANT,
  content = '',
  language = 'hi',
  intent = null,
  confidence = 1.0,
  audioUrl = null,
}) {
  return {
    id,
    role,
    content,
    language,
    intent,
    confidence,
    audioUrl,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Factory creating an AI Conversation session
 * 
 * @param {Object} params
 * @param {string} [params.id]
 * @param {string} params.userId
 * @param {string} [params.initialGreeting]
 * @param {Object} [params.contextSummary={}]
 * @returns {Object} AIConversation entity
 */
export function createAIConversation({
  id = `aiconv-${Date.now()}`,
  userId = 'default-user',
  initialGreeting = null,
  contextSummary = {},
}) {
  const initialMessages = [];
  if (initialGreeting) {
    initialMessages.push(
      createAIMessage({
        role: AIMessageRole.ASSISTANT,
        content: initialGreeting,
      })
    );
  }

  return {
    id,
    userId,
    startedAt: new Date().toISOString(),
    endedAt: null,
    messages: initialMessages,
    contextSummary,
    isActive: true,
  };
}

/**
 * Factory creating an aggregated User Context for AI personalization
 * 
 * @param {Object} params
 * @param {string} params.userId
 * @param {string} params.userName
 * @param {string} [params.preferredLanguage='hi']
 * @param {string} [params.currentMood='happy']
 * @param {number} [params.cognitiveDifficulty=3]
 * @param {number} [params.stepsToday=0]
 * @param {number} [params.activeStreak=1]
 * @param {string} [params.lastActivityName]
 * @param {number} [params.pendingMedicinesCount=0]
 * @param {string} [params.safeZoneStatus='SAFE']
 * @param {Object} [params.culturalContext={}]
 * @returns {Object} UserContext entity
 */
export function createUserContext({
  userId = 'default-user',
  userName = 'Elderly User',
  preferredLanguage = 'hi',
  currentMood = 'happy',
  cognitiveDifficulty = 3,
  stepsToday = 0,
  activeStreak = 1,
  lastActivityName = null,
  pendingMedicinesCount = 0,
  safeZoneStatus = 'SAFE',
  culturalContext = {},
}) {
  return {
    userId,
    userName,
    preferredLanguage,
    currentMood,
    cognitiveDifficulty,
    stepsToday,
    activeStreak,
    lastActivityName,
    pendingMedicinesCount,
    safeZoneStatus,
    culturalContext,
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Factory creating an AI-guided Cognitive Recommendation
 * Suggests appropriate cognitive activities aligned with elder preferences and current fatigue level.
 * 
 * @param {Object} params
 * @param {string} params.userId
 * @param {string} params.targetDomain - One of CognitiveDomain
 * @param {string} params.recommendedActivityId - e.g. 'memory-match'
 * @param {string} params.reasonEnglish
 * @param {string} params.reasonHindi
 * @param {number} [params.suggestedDifficulty=3]
 * @returns {Object} AICognitiveRecommendation entity
 */
export function createAICognitiveRecommendation({
  id = `cogrec-${Date.now()}`,
  userId = 'default-user',
  targetDomain,
  recommendedActivityId,
  reasonEnglish = '',
  reasonHindi = '',
  suggestedDifficulty = 3,
}) {
  return {
    id,
    userId,
    targetDomain,
    recommendedActivityId,
    reasonEnglish,
    reasonHindi,
    suggestedDifficulty,
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Factory creating an AI-assisted Adaptive Recommendation
 * Suggests game parameters adjustments based on actual session performance.
 * 
 * @param {Object} params
 * @param {string} params.userId
 * @param {string} params.gameId
 * @param {number} params.previousDifficulty
 * @param {number} params.recommendedDifficulty
 * @param {string} params.rationale
 * @param {number} [params.confidenceScore=1.0]
 * @returns {Object} AIAdaptiveRecommendation entity
 */
export function createAIAdaptiveRecommendation({
  id = `adaptrec-${Date.now()}`,
  userId = 'default-user',
  gameId,
  previousDifficulty = 3,
  recommendedDifficulty = 3,
  rationale = 'Maintained comfortable engagement level.',
  confidenceScore = 1.0,
}) {
  return {
    id,
    userId,
    gameId,
    previousDifficulty,
    recommendedDifficulty,
    rationale,
    confidenceScore,
    generatedAt: new Date().toISOString(),
  };
}
