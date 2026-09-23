/**
 * schema.js
 * Database schema and store definitions for YaadSaathi Dexie IndexedDB.
 * Version 1 schema definition.
 */

export const DB_NAME = 'YaadSaathiDB';
export const DB_VERSION = 1;

/**
 * Dexie table schemas definition.
 * Note: Only indexed properties are declared here; Dexie allows storing any additional properties in objects.
 */
export const DB_SCHEMA_V1 = Object.freeze({
  users: '++id, name, stateOrRegion, primaryLanguage',
  gameSessions: '++id, gameId, userId, startedAt, completedAt, difficultyLevel',
  gameResults: '++id, sessionId, gameId, userId, cognitiveDomain, score, accuracy, responseTime, attempts, mistakes, hintsUsed, difficultyLevel, createdAt',
  cognitiveProgress: '++id, userId, cognitiveDomain, averageScore, averageAccuracy, averageResponseTime, sessionsCompleted, updatedAt',
  memories: '++id, userId, category, title, content, mediaType, createdAt, updatedAt',
  routines: '++id, userId, title, period, scheduledTime, completed, createdAt',
  medicines: '++id, userId, name, dosage, scheduledTime, status, createdAt, updatedAt',
  medicineHistory: '++id, medicineId, userId, scheduledAt, takenAt, status',
  caregivers: '++id, userId, name, relationship, phone, role, isPrimary',
  caregiverAlerts: '++id, userId, caregiverId, type, message, status, createdAt',
  locationBreadcrumbs: '++id, userId, latitude, longitude, timestamp',
  aiConversations: '++id, userId, startedAt, updatedAt',
  aiMessages: '++id, conversationId, userId, role, content, timestamp',
  nerProfiles: '++id, userId, stateOrRegion, preferredLanguage, culturalPreferences, familiarFoods, familiarPlaces, familiarObjects, festivals, music, familyMemories',
  nerCognitiveItems: '++id, stateOrRegion, language, category, title, content, cognitiveDomain, difficultyLevel, *tags',
});
