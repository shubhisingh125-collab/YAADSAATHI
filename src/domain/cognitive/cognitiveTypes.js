/**
 * cognitiveTypes.js
 * Domain definitions for cognitive domains, competencies, and engagement categories.
 * Non-clinical: supports cognitive stimulation and structured engagement.
 */

/**
 * Supported Cognitive Domains in YaadSaathi
 * @readonly
 * @enum {string}
 */
export const CognitiveDomain = Object.freeze({
  MEMORY: 'MEMORY',
  ATTENTION: 'ATTENTION',
  WORKING_MEMORY: 'WORKING_MEMORY',
  PATTERN_RECOGNITION: 'PATTERN_RECOGNITION',
  LANGUAGE: 'LANGUAGE',
  ORIENTATION: 'ORIENTATION',
  ROUTINE_RECALL: 'ROUTINE_RECALL',
  REMINISCENCE: 'REMINISCENCE',
  EXECUTIVE_FUNCTION: 'EXECUTIVE_FUNCTION',
  FUNCTIONAL_COGNITION: 'FUNCTIONAL_COGNITION',
});

/**
 * Metadata and elder-friendly descriptive guidance for each cognitive domain
 */
export const COGNITIVE_DOMAIN_METADATA = Object.freeze({
  [CognitiveDomain.MEMORY]: {
    id: CognitiveDomain.MEMORY,
    labelEnglish: 'Memory & Retention',
    labelHindi: 'स्मृति व याददाश्त',
    description: 'Recalling images, cards, and daily familiar concepts.',
    icon: '🧠',
  },
  [CognitiveDomain.ATTENTION]: {
    id: CognitiveDomain.ATTENTION,
    labelEnglish: 'Attention & Focus',
    labelHindi: 'एकाग्रता व ध्यान',
    description: 'Sustained focus and visual tracking of stimuli.',
    icon: '🎯',
  },
  [CognitiveDomain.WORKING_MEMORY]: {
    id: CognitiveDomain.WORKING_MEMORY,
    labelEnglish: 'Working Memory',
    labelHindi: 'अल्पकालिक सक्रिय स्मृति',
    description: 'Holding multi-step information temporarily in active thought.',
    icon: '⚡',
  },
  [CognitiveDomain.PATTERN_RECOGNITION]: {
    id: CognitiveDomain.PATTERN_RECOGNITION,
    labelEnglish: 'Pattern & Rhythm Recognition',
    labelHindi: 'पैटर्न व क्रम पहचान',
    description: 'Auditory and visual pattern identification and sequential order.',
    icon: '🧩',
  },
  [CognitiveDomain.LANGUAGE]: {
    id: CognitiveDomain.LANGUAGE,
    labelEnglish: 'Language & Semantic Recall',
    labelHindi: 'भाषा व शब्द स्मृति',
    description: 'Associating words with household items, relationships, and objects.',
    icon: '🗣️',
  },
  [CognitiveDomain.ORIENTATION]: {
    id: CognitiveDomain.ORIENTATION,
    labelEnglish: 'Time & Environmental Orientation',
    labelHindi: 'समय व परिवेश बोध',
    description: 'Awareness of time of day, season, home surroundings, and safe zones.',
    icon: '🧭',
  },
  [CognitiveDomain.ROUTINE_RECALL]: {
    id: CognitiveDomain.ROUTINE_RECALL,
    labelEnglish: 'Daily Routine Recall',
    labelHindi: 'दिनचर्या स्मरण',
    description: 'Recalling everyday actions such as meals, walks, and personal care.',
    icon: '📅',
  },
  [CognitiveDomain.REMINISCENCE]: {
    id: CognitiveDomain.REMINISCENCE,
    labelEnglish: 'Reminiscence & Personal Storytelling',
    labelHindi: 'पारिवारिक यादें व संस्मरण',
    description: 'Connecting with personal memories, family photographs, and heritage.',
    icon: '❤️',
  },
  [CognitiveDomain.EXECUTIVE_FUNCTION]: {
    id: CognitiveDomain.EXECUTIVE_FUNCTION,
    labelEnglish: 'Executive Coordination',
    labelHindi: 'योजना व निर्णय सामंजस्य',
    description: 'Gentle step-by-step sequencing and decision-making activities.',
    icon: '🌟',
  },
  [CognitiveDomain.FUNCTIONAL_COGNITION]: {
    id: CognitiveDomain.FUNCTIONAL_COGNITION,
    labelEnglish: 'Functional Independence',
    labelHindi: 'दैनिक स्वावलंबन',
    description: 'Everyday competence including medicine confirmation and hydration.',
    icon: '🛡️',
  },
});
