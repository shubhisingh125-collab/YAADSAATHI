/**
 * cognitiveActivityEngine.js
 * Small, reusable pure utilities and activity generators for YaadSaathi cognitive activities.
 * 
 * Provides pure functions for:
 * - Accuracy calculation
 * - Non-clinical score computation
 * - Option shuffling
 * - Answer validation
 * - Response time aggregation
 * - Sequence, Pattern, and Difference question generators
 */

/**
 * Calculates percentage accuracy as a rounded decimal (0 to 100).
 * 
 * @param {number} correctCount - Number of correct answers
 * @param {number} totalCount - Total questions or attempts
 * @returns {number} Percentage accuracy rounded to 1 decimal place (0 - 100)
 */
export function calculateAccuracy(correctCount, totalCount) {
  const correct = Math.max(0, Number(correctCount) || 0);
  const total = Number(totalCount) || 0;
  if (total <= 0) return 100;
  const raw = (correct / total) * 100;
  return Number(Math.min(100, Math.max(0, raw)).toFixed(1));
}

/**
 * Computes non-clinical activity score (0 to 100) from accuracy.
 * 
 * @param {number} accuracy - Accuracy percentage (0 - 100)
 * @returns {number} Integer activity score (0 - 100)
 */
export function calculateScore(accuracy) {
  const acc = Number(accuracy) || 0;
  return Math.min(100, Math.max(0, Math.round(acc)));
}

/**
 * Deterministically or randomly shuffles an array of options without mutating the input.
 * Uses Fisher-Yates shuffle.
 * 
 * @template T
 * @param {Array<T>} options - Items to shuffle
 * @param {() => number} [rng=Math.random] - Optional custom RNG for deterministic testing
 * @returns {Array<T>} New shuffled array
 */
export function shuffleOptions(options, rng = Math.random) {
  if (!Array.isArray(options)) return [];
  const copy = [...options];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * Compares a user selected answer with the expected correct answer.
 * Handles string IDs, numbers, or objects with an `id` property.
 * 
 * @param {*} correctAnswer - Expected correct answer or object with `id`
 * @param {*} selectedAnswer - Selected answer or object with `id`
 * @returns {boolean} True if matched
 */
export function validateAnswer(correctAnswer, selectedAnswer) {
  if (correctAnswer === null || correctAnswer === undefined) return false;
  if (selectedAnswer === null || selectedAnswer === undefined) return false;

  const getComparable = (val) => {
    if (typeof val === 'object' && val !== null && 'id' in val) {
      return String(val.id);
    }
    return String(val);
  };

  return getComparable(correctAnswer) === getComparable(selectedAnswer);
}

/**
 * Calculates average response time in seconds across recorded answers.
 * 
 * @param {Array<number>} responseTimes - Array of response durations in seconds
 * @returns {number} Average in seconds rounded to 1 decimal place
 */
export function calculateAverageResponseTime(responseTimes) {
  if (!Array.isArray(responseTimes) || responseTimes.length === 0) return 0;
  const sum = responseTimes.reduce((acc, curr) => acc + (Number(curr) || 0), 0);
  return Number((sum / responseTimes.length).toFixed(1));
}

// ====================================================
// 1. SEQUENCE RECALL DOMAIN DATA & GENERATORS
// ====================================================

export const SEQUENCE_SYMBOLS = Object.freeze([
  { id: 'flower', symbol: '🌸', nameEnglish: 'Blossom', nameHindi: 'फूल' },
  { id: 'sun', symbol: '☀️', nameEnglish: 'Sun', nameHindi: 'सूरज' },
  { id: 'star', symbol: '⭐', nameEnglish: 'Star', nameHindi: 'तारा' },
  { id: 'leaf', symbol: '🌿', nameEnglish: 'Leaf', nameHindi: 'पत्ती' },
  { id: 'bell', symbol: '🔔', nameEnglish: 'Bell', nameHindi: 'घंटी' },
  { id: 'diya', symbol: '🪔', nameEnglish: 'Diya', nameHindi: 'दीपक' },
  { id: 'mango', symbol: '🥭', nameEnglish: 'Mango', nameHindi: 'आम' },
  { id: 'peacock', symbol: '🦚', nameEnglish: 'Peacock', nameHindi: 'मोर' },
]);

export function generateSequence(count = 3, rng = Math.random) {
  const shuffled = shuffleOptions(SEQUENCE_SYMBOLS, rng);
  return shuffled.slice(0, Math.min(count, SEQUENCE_SYMBOLS.length));
}

export function generateSequenceQuestions(sequence, rng = Math.random) {
  if (!sequence || sequence.length === 0) return [];
  const labels = [
    { en: 'FIRST (1st)', hi: 'सबसे पहला (1st)' },
    { en: 'SECOND (2nd)', hi: 'दूसरा (2nd)' },
    { en: 'THIRD (3rd)', hi: 'तीसरा (3rd)' },
    { en: 'FOURTH (4th)', hi: 'चौथा (4th)' },
    { en: 'FIFTH (5th)', hi: 'पाँचवाँ (5th)' },
  ];

  return sequence.map((target, idx) => {
    const distractors = SEQUENCE_SYMBOLS.filter((s) => s.id !== target.id);
    const chosenDistractors = shuffleOptions(distractors, rng).slice(0, 3);
    const options = shuffleOptions([target, ...chosenDistractors], rng);
    const orderLabel = labels[idx] || { en: `item #${idx + 1}`, hi: `वस्तु क्रम #${idx + 1}` };

    return {
      id: `q-${idx}`,
      targetIndex: idx,
      target,
      orderLabel,
      promptEnglish: `Which symbol was the ${orderLabel.en} in the sequence?`,
      promptHindi: `क्रम में ${orderLabel.hi} प्रतीक कौन सा था?`,
      options,
    };
  });
}

// ====================================================
// 2. PATTERN COMPLETE DOMAIN DATA & GENERATORS
// ====================================================

export const PATTERN_QUESTIONS = Object.freeze([
  {
    id: 'pq-1',
    patternType: 'ABAB',
    promptEnglish: 'What comes next in this alternating pattern?',
    promptHindi: 'इस क्रम में आगे कौन सा प्रतीक आएगा?',
    sequence: ['🌸', '☀️', '🌸', '☀️'],
    target: { id: 'flower', symbol: '🌸', nameEnglish: 'Blossom', nameHindi: 'फूल' },
    distractors: [
      { id: 'sun', symbol: '☀️', nameEnglish: 'Sun', nameHindi: 'सूरज' },
      { id: 'bell', symbol: '🔔', nameEnglish: 'Bell', nameHindi: 'घंटी' },
      { id: 'leaf', symbol: '🌿', nameEnglish: 'Leaf', nameHindi: 'पत्ती' },
    ],
  },
  {
    id: 'pq-2',
    patternType: 'AABB',
    promptEnglish: 'Find the symbol that continues the pair sequence:',
    promptHindi: 'जोड़े वाले क्रम को पूरा करने वाला प्रतीक चुनें:',
    sequence: ['🔔', '🔔', '🪔', '🪔', '🔔'],
    target: { id: 'bell', symbol: '🔔', nameEnglish: 'Bell', nameHindi: 'घंटी' },
    distractors: [
      { id: 'diya', symbol: '🪔', nameEnglish: 'Diya', nameHindi: 'दीपक' },
      { id: 'star', symbol: '⭐', nameEnglish: 'Star', nameHindi: 'तारा' },
      { id: 'mango', symbol: '🥭', nameEnglish: 'Mango', nameHindi: 'आम' },
    ],
  },
  {
    id: 'pq-3',
    patternType: 'ABCABC',
    promptEnglish: 'Which fruit completes this 3-step rhythm?',
    promptHindi: 'इस 3-चरणीय क्रम को कौन सा फल पूरा करेगा?',
    sequence: ['🍎', '🥭', '🍇', '🍎', '🥭'],
    target: { id: 'grape', symbol: '🍇', nameEnglish: 'Grapes', nameHindi: 'अंगूर' },
    distractors: [
      { id: 'apple', symbol: '🍎', nameEnglish: 'Apple', nameHindi: 'सेब' },
      { id: 'mango', symbol: '🥭', nameEnglish: 'Mango', nameHindi: 'आम' },
      { id: 'banana', symbol: '🍌', nameEnglish: 'Banana', nameHindi: 'केला' },
    ],
  },
  {
    id: 'pq-4',
    patternType: 'ABAB',
    promptEnglish: 'Observe the evening pattern. What completes it?',
    promptHindi: 'संध्याकालीन क्रम को देखें। खाली स्थान में क्या आएगा?',
    sequence: ['⭐', '🌙', '⭐', '🌙'],
    target: { id: 'star', symbol: '⭐', nameEnglish: 'Star', nameHindi: 'तारा' },
    distractors: [
      { id: 'moon', symbol: '🌙', nameEnglish: 'Moon', nameHindi: 'चाँद' },
      { id: 'sun', symbol: '☀️', nameEnglish: 'Sun', nameHindi: 'सूरज' },
      { id: 'cloud', symbol: '☁️', nameEnglish: 'Cloud', nameHindi: 'बादल' },
    ],
  },
  {
    id: 'pq-5',
    patternType: 'AABB',
    promptEnglish: 'What completes this gentle nature pattern?',
    promptHindi: 'इस प्रकृति क्रम को कौन सा प्रतीक पूरा करेगा?',
    sequence: ['🌿', '🌿', '🌸', '🌸', '🌿'],
    target: { id: 'leaf', symbol: '🌿', nameEnglish: 'Leaf', nameHindi: 'पत्ती' },
    distractors: [
      { id: 'flower', symbol: '🌸', nameEnglish: 'Blossom', nameHindi: 'फूल' },
      { id: 'sun', symbol: '☀️', nameEnglish: 'Sun', nameHindi: 'सूरज' },
      { id: 'diya', symbol: '🪔', nameEnglish: 'Diya', nameHindi: 'दीपक' },
    ],
  },
]);

export function getPreparedPatternQuestions(rng = Math.random) {
  return PATTERN_QUESTIONS.map((q) => {
    const options = shuffleOptions([q.target, ...q.distractors], rng);
    return {
      ...q,
      options,
    };
  });
}

// ====================================================
// 3. FIND THE DIFFERENCE DOMAIN DATA
// ====================================================

export const DIFFERENCE_QUESTIONS = Object.freeze([
  {
    id: 'fd-1',
    promptEnglish: 'Find the one symbol that is different on the right:',
    promptHindi: 'दाईं ओर के ग्रिड में जो एक प्रतीक अलग है, उसे चुनें:',
    leftGrid: ['🌸', '☀️', '⭐', '🌿', '🍎', '🔔', '⭐', '🌸', '🌿'],
    rightGrid: ['🌸', '☀️', '⭐', '🌿', '🍎', '🟡', '⭐', '🌸', '🌿'],
    diffIndex: 5,
    leftSymbol: '🔔',
    rightSymbol: '🟡',
  },
  {
    id: 'fd-2',
    promptEnglish: 'Which position is different between these two grids?',
    promptHindi: 'इन दोनों ग्रिड में कौन सा स्थान अलग है?',
    leftGrid: ['🪔', '☕', '🥭', '🔔', '🦚', '☀️', '🌿', '🌸', '⭐'],
    rightGrid: ['🪔', '☕', '🥭', '🔔', '🦚', '☀️', '🌿', '🍇', '⭐'],
    diffIndex: 7,
    leftSymbol: '🌸',
    rightSymbol: '🍇',
  },
  {
    id: 'fd-3',
    promptEnglish: 'Carefully compare both cards. Spot the changed item:',
    promptHindi: 'दोनों कार्डों की तुलना करें और बदले हुए फल को पहचानें:',
    leftGrid: ['🍎', '🥭', '🍌', '☕', '🌸', '🪔', '☀️', '🔔', '🌿'],
    rightGrid: ['🍎', '🍉', '🍌', '☕', '🌸', '🪔', '☀️', '🔔', '🌿'],
    diffIndex: 1,
    leftSymbol: '🥭',
    rightSymbol: '🍉',
  },
  {
    id: 'fd-4',
    promptEnglish: 'Find the center symbol that was changed on the right:',
    promptHindi: 'दाईं ओर जो प्रतीक बदला गया है, उसे पहचानें:',
    leftGrid: ['⭐', '🌙', '☀️', '🌿', '🔔', '🪔', '🌸', '🥭', '☕'],
    rightGrid: ['⭐', '🌙', '☀️', '🌿', '💎', '🪔', '🌸', '🥭', '☕'],
    diffIndex: 4,
    leftSymbol: '🔔',
    rightSymbol: '💎',
  },
  {
    id: 'fd-5',
    promptEnglish: 'One of the items on the right is different. Tap it:',
    promptHindi: 'दाईं ओर एक प्रतीक अलग है। उसे छूकर चुनें:',
    leftGrid: ['🦚', '🪔', '🌸', '☀️', '🌿', '🥭', '🔔', '☕', '⭐'],
    rightGrid: ['🦚', '🪔', '🌸', '☀️', '🌿', '🥭', '🔔', '☕', '🎈'],
    diffIndex: 8,
    leftSymbol: '⭐',
    rightSymbol: '🎈',
  },
]);
