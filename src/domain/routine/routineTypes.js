/**
 * routineTypes.js
 * Domain model for daily routines, routine scheduling, and daily routine recall activities.
 */

/**
 * Standard Daily Periods
 * @readonly
 * @enum {string}
 */
export const RoutinePeriod = Object.freeze({
  MORNING: 'morning',
  AFTERNOON: 'afternoon',
  EVENING: 'evening',
  NIGHT: 'night',
});

/**
 * Categories of Daily Routine Activities
 * @readonly
 * @enum {string}
 */
export const RoutineCategory = Object.freeze({
  MEDICINE: 'medicine',
  WELLNESS: 'wellness',
  HYDRATION: 'water',
  ACTIVITY: 'activity',
  MEAL: 'meal',
  FAMILY_CALL: 'family',
  REST: 'rest',
});

/**
 * Factory creating a Daily Routine Task
 * 
 * @param {Object} params
 * @param {string} [params.id]
 * @param {string} params.userId
 * @param {string} params.time - e.g. '08:30 AM'
 * @param {string} params.period - One of RoutinePeriod
 * @param {string} params.titleHindi
 * @param {string} params.titleEnglish
 * @param {string} [params.descriptionHindi]
 * @param {string} [params.descriptionEnglish]
 * @param {string} [params.category=RoutineCategory.WELLNESS]
 * @param {string} [params.icon='Sun']
 * @param {boolean} [params.completed=false]
 * @returns {Object} RoutineItem entity
 */
export function createRoutineItem({
  id = `rt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
  userId = 'default-user',
  title = '',
  time = '09:00 AM',
  scheduledTime = '09:00 AM',
  period = RoutinePeriod.MORNING,
  titleHindi = '',
  titleEnglish = '',
  descriptionHindi = '',
  descriptionEnglish = '',
  category = RoutineCategory.WELLNESS,
  icon = 'Sun',
  completed = false,
} = {}) {
  const resolvedTitle = title || titleEnglish || titleHindi || '';
  return {
    id,
    userId,
    title: resolvedTitle,
    time: time || scheduledTime,
    scheduledTime: scheduledTime || time,
    period,
    titleHindi: titleHindi || resolvedTitle,
    titleEnglish: titleEnglish || resolvedTitle,
    descriptionHindi,
    descriptionEnglish,
    category,
    icon,
    completed: Boolean(completed),
    completedAt: completed ? new Date().toISOString() : null,
    createdAt: new Date().toISOString(),
  };
}

/**
 * Factory creating a Daily Routine Recall verification question
 * E.g. "What did you have for breakfast this morning?" or "Did you take your morning garden walk?"
 * 
 * @param {Object} params
 * @param {string} params.routineItemId - Reference to the corresponding routine
 * @param {string} params.questionEnglish
 * @param {string} params.questionHindi
 * @param {Array<{ id: string, textEnglish: string, textHindi: string, correct: boolean }>} params.options
 * @param {string} [params.hintEnglish]
 * @param {string} [params.hintHindi]
 * @returns {Object} RoutineRecallQuestion entity
 */
export function createRoutineRecallQuestion({
  id = `rrq-${Date.now()}`,
  routineItemId,
  questionEnglish,
  questionHindi,
  options = [],
  hintEnglish = '',
  hintHindi = '',
}) {
  return {
    id,
    routineItemId,
    questionEnglish,
    questionHindi,
    options,
    hintEnglish,
    hintHindi,
    userAnswerId: null,
    isCorrect: null,
    answeredAt: null,
  };
}

/**
 * Standard culturally comforting fallback routine sequence if elder has no custom routines saved
 */
export const FALLBACK_ROUTINES = Object.freeze([
  {
    id: 'fb-1',
    time: '07:00 AM',
    period: RoutinePeriod.MORNING,
    titleEnglish: 'Wake Up & Fresh Air',
    titleHindi: 'सुबह जागना व ताजी हवा',
    icon: '🌅',
  },
  {
    id: 'fb-2',
    time: '07:30 AM',
    period: RoutinePeriod.MORNING,
    titleEnglish: 'Warm Ginger Tea',
    titleHindi: 'गरम अदरक वाली चाय',
    icon: '☕',
  },
  {
    id: 'fb-3',
    time: '08:30 AM',
    period: RoutinePeriod.MORNING,
    titleEnglish: 'Healthy Breakfast',
    titleHindi: 'पौष्टिक नाश्ता',
    icon: '🥣',
  },
  {
    id: 'fb-4',
    time: '09:30 AM',
    period: RoutinePeriod.MORNING,
    titleEnglish: 'Morning Garden Walk',
    titleHindi: 'बगीचे में सुबह की सैर',
    icon: '🚶',
  },
  {
    id: 'fb-5',
    time: '01:30 PM',
    period: RoutinePeriod.AFTERNOON,
    titleEnglish: 'Peaceful Afternoon Rest',
    titleHindi: 'दोपहर का शांत विश्राम',
    icon: '🛏️',
  },
]);

/**
 * Builds 3 routine recall questions based on an ordered list of routine items.
 * @param {Array<Object>} items - Array of routine objects
 * @returns {Array<Object>} Generated question objects
 */
export function generateRecallQuestions(items) {
  if (!items || items.length < 3) return [];

  const questions = [
    {
      id: 'q-first',
      promptEnglish: 'What was the FIRST activity of the day?',
      promptHindi: 'दिन की सबसे पहली (1st) गतिविधि कौन सी थी?',
      targetIndex: 0,
      targetItem: items[0],
    },
    {
      id: 'q-second',
      promptEnglish: 'What came NEXT as the second activity?',
      promptHindi: 'इसके बाद दूसरी (2nd) गतिविधि कौन सी थी?',
      targetIndex: 1,
      targetItem: items[1],
    },
    {
      id: 'q-last',
      promptEnglish: 'What was the FINAL activity in the list?',
      promptHindi: 'सूची में सबसे आखिरी गतिविधि कौन सी थी?',
      targetIndex: items.length - 1,
      targetItem: items[items.length - 1],
    },
  ];

  return questions.map((q) => {
    // Generate choices: the correct target + 3 distractors
    const distractors = items.filter((it) => it.id !== q.targetItem.id);
    const shuffledDistractors = [...distractors].sort(() => 0.5 - Math.random()).slice(0, 3);
    const options = [q.targetItem, ...shuffledDistractors].sort(() => 0.5 - Math.random());
    return {
      ...q,
      options,
    };
  });
}

