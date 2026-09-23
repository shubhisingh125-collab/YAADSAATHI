/**
 * userTypes.js
 * Domain model for elderly user profile, accessibility preferences, and demographic context.
 */

/**
 * Mood States for daily elder check-ins
 * @readonly
 * @enum {string}
 */
export const MoodState = Object.freeze({
  HAPPY: 'happy',
  OKAY: 'okay',
  CONCERNED: 'concerned',
});

/**
 * Creates a structured Elderly User Profile
 * 
 * @param {Object} params
 * @param {string} [params.id]
 * @param {string} params.name
 * @param {string} [params.preferredName]
 * @param {number} params.age
 * @param {string} [params.primaryLanguage='hi']
 * @param {string} [params.secondaryLanguage='en']
 * @param {string} [params.stateOrRegion]
 * @param {string} [params.homeAddress]
 * @param {Object} [params.emergencyContact]
 * @param {Object} [params.doctorContact]
 * @returns {Object} UserProfile entity
 */
export function createUserProfile({
  id = `usr-${Date.now()}`,
  name = '',
  preferredName = '',
  age = 70,
  primaryLanguage = 'hi',
  secondaryLanguage = 'en',
  stateOrRegion = '',
  homeAddress = '',
  emergencyContact = {
    name: '',
    phone: '',
    relation: '',
  },
  doctorContact = {
    name: '',
    phone: '',
    clinic: '',
  },
}) {
  return {
    id,
    name,
    preferredName: preferredName || name,
    age: Number(age),
    primaryLanguage,
    secondaryLanguage,
    stateOrRegion,
    homeAddress,
    emergencyContact,
    doctorContact,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Creates user preferences for accessibility, audio, and visual comfort
 * 
 * @param {Object} [params={}]
 * @returns {Object} ElderlyPreferences entity
 */
export function createElderlyPreferences({
  fontScale = 1.0,
  soundEffectsEnabled = true,
  voiceGuidanceEnabled = true,
  speechRate = 0.85,
  speechPitch = 1.0,
  highContrastEnabled = false,
  locationSharingEnabled = true,
  preferredTheme = 'calm-green',
} = {}) {
  return {
    fontScale: Math.max(0.90, Math.min(1.30, Number(fontScale) || 1.0)),
    soundEffectsEnabled: Boolean(soundEffectsEnabled),
    voiceGuidanceEnabled: Boolean(voiceGuidanceEnabled),
    speechRate: Number(speechRate) || 0.85,
    speechPitch: Number(speechPitch) || 1.0,
    highContrastEnabled: Boolean(highContrastEnabled),
    locationSharingEnabled: Boolean(locationSharingEnabled),
    preferredTheme,
    updatedAt: new Date().toISOString(),
  };
}
