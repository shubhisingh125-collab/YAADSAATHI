/**
 * difficultyTypes.js
 * Definitions and schema factories for cognitive activity difficulty and adaptive recommendations.
 */

/**
 * Standardized Cognitive Difficulty Levels (1 to 5)
 * @readonly
 * @enum {number}
 */
export const DifficultyLevel = Object.freeze({
  GENTLE: 1,      // Minimal cognitive load, maximum hints, relaxed pace
  EASY: 2,        // Comfortable pace, small item pools, frequent prompts
  BALANCED: 3,    // Moderate challenge, standard item counts, balanced time
  ACTIVE: 4,      // Higher engagement, larger item pools, quicker response
  ADVANCED: 5,    // Highest engagement within gentle non-punitive bounds
});

/**
 * Adaptive Adjustment Directions
 * @readonly
 * @enum {string}
 */
export const AdaptiveAction = Object.freeze({
  INCREASE: 'INCREASE',
  DECREASE: 'DECREASE',
  MAINTAIN: 'MAINTAIN',
});

/**
 * Metadata descriptions for each difficulty level
 */
export const DIFFICULTY_LEVEL_METADATA = Object.freeze({
  [DifficultyLevel.GENTLE]: {
    level: 1,
    labelEnglish: 'Gentle (Level 1)',
    labelHindi: 'स्तर 1: बहुत सरल',
    description: 'Relaxed, maximum assistance, minimum cognitive strain.',
  },
  [DifficultyLevel.EASY]: {
    level: 2,
    labelEnglish: 'Easy (Level 2)',
    labelHindi: 'स्तर 2: सरल',
    description: 'Comfortable pace with friendly hints.',
  },
  [DifficultyLevel.BALANCED]: {
    level: 3,
    labelEnglish: 'Balanced (Level 3)',
    labelHindi: 'स्तर 3: संतुलित',
    description: 'Standard everyday cognitive stimulation.',
  },
  [DifficultyLevel.ACTIVE]: {
    level: 4,
    labelEnglish: 'Active (Level 4)',
    labelHindi: 'स्तर 4: मध्यम',
    description: 'Engaging, varied items with mild challenge.',
  },
  [DifficultyLevel.ADVANCED]: {
    level: 5,
    labelEnglish: 'Advanced (Level 5)',
    labelHindi: 'स्तर 5: उन्नत',
    description: 'Peak cognitive engagement for sharp days.',
  },
});

/**
 * Creates a structured AdaptiveRecommendation object.
 * 
 * @param {Object} params
 * @param {number} params.currentLevel
 * @param {number} params.recommendedLevel
 * @param {string} params.action - One of AdaptiveAction
 * @param {string} params.reason - Human-readable explanation in English
 * @param {string} [params.reasonHindi] - Reassuring explanation in Hindi
 * @param {number} [params.confidence=1.0] - Confidence score between 0.0 and 1.0
 * @param {Object} [params.evaluatedMetrics={}] - Accuracy, average response time, mistakes, etc.
 * @returns {Object} Adaptive recommendation contract
 */
export function createAdaptiveRecommendation({
  currentLevel = DifficultyLevel.BALANCED,
  recommendedLevel = DifficultyLevel.BALANCED,
  action = AdaptiveAction.MAINTAIN,
  reason = 'Maintaining current comfortable pace.',
  reasonHindi = 'आरामदायक गति से अभ्यास जारी रखें।',
  confidence = 1.0,
  evaluatedMetrics = {},
}) {
  return {
    currentLevel,
    recommendedLevel: Math.max(DifficultyLevel.GENTLE, Math.min(DifficultyLevel.ADVANCED, recommendedLevel)),
    action,
    reason,
    reasonHindi,
    confidence,
    evaluatedMetrics: {
      accuracy: evaluatedMetrics.accuracy ?? 100,
      responseTime: evaluatedMetrics.responseTime ?? 0,
      attempts: evaluatedMetrics.attempts ?? 0,
      mistakes: evaluatedMetrics.mistakes ?? 0,
      ...evaluatedMetrics,
    },
    generatedAt: new Date().toISOString(),
  };
}
