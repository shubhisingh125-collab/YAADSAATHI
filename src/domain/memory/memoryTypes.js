/**
 * memoryTypes.js
 * Domain model for personal memory assistance, reminiscence items, and family album memory banks.
 */

/**
 * Types of Personal Memory Items
 * @readonly
 * @enum {string}
 */
export const MemoryItemType = Object.freeze({
  FAMILY_MEMBER: 'FAMILY_MEMBER',
  PHOTO: 'PHOTO',
  STORY: 'STORY',
  AUDIO_NOTE: 'AUDIO_NOTE',
  IMPORTANT_DATE: 'IMPORTANT_DATE',
  ANCESTRAL_PLACE: 'ANCESTRAL_PLACE',
  CULTURAL_TRADITION: 'CULTURAL_TRADITION',
});

/**
 * Factory creating a Personal Memory Item for reminiscence and recognition
 * 
 * @param {Object} params
 * @param {string} [params.id]
 * @param {string} params.userId
 * @param {string} params.type - One of MemoryItemType
 * @param {string} params.title
 * @param {string} [params.description]
 * @param {string} [params.relationship] - e.g. Daughter, Grandson, Lifelong Friend
 * @param {string} [params.mediaUrl]
 * @param {string[]} [params.tags=[]]
 * @param {string} [params.dateContext] - Approximate year or occasion
 * @param {string} [params.locationContext]
 * @param {boolean} [params.verifiedByCaregiver=false]
 * @returns {Object} PersonalMemory entity
 */
export function createPersonalMemory({
  id = `mem-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
  userId = 'default-user',
  type,
  category,
  title = '',
  description = '',
  relationship = '',
  personName = '',
  mediaUrl = '',
  tags = [],
  dateContext = '',
  date = '',
  locationContext = '',
  place = '',
  verifiedByCaregiver = false,
  ...extra
} = {}) {
  const resolvedType = type || category || MemoryItemType.PHOTO;
  const resolvedPersonName = personName || (resolvedType === MemoryItemType.FAMILY_MEMBER ? title : '');
  const resolvedLocation = locationContext || place || '';
  const resolvedDate = dateContext || date || '';

  return {
    id,
    userId,
    type: resolvedType,
    category: resolvedType,
    title,
    personName: resolvedPersonName,
    description,
    relationship,
    mediaUrl,
    tags: Array.isArray(tags) ? [...tags] : [],
    dateContext: resolvedDate,
    locationContext: resolvedLocation,
    place: resolvedLocation,
    date: resolvedDate,
    verifiedByCaregiver,
    lastRecalledAt: null,
    recallCount: 0,
    createdAt: new Date().toISOString(),
    ...extra,
  };
}

/**
 * Factory creating a memory recall question/prompt for daily memory practice
 * 
 * @param {Object} params
 * @param {string} params.memoryId
 * @param {string} params.promptText
 * @param {string[]} params.options
 * @param {string} params.correctAnswer
 * @param {string} [params.hint]
 * @returns {Object} MemoryPrompt entity
 */
export function createMemoryPrompt({
  id = `prompt-${Date.now()}`,
  memoryId,
  promptText,
  options = [],
  correctAnswer,
  hint = '',
}) {
  return {
    id,
    memoryId,
    promptText,
    options,
    correctAnswer,
    hint,
    presentedAt: null,
    answeredCorrectly: null,
  };
}
