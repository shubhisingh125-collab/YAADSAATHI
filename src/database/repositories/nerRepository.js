/**
 * nerRepository.js
 * Data access operations for North Eastern Region (NER) cultural profiles and personalization preferences.
 */

import { db } from '../db.js';
import { createNERCulturalProfile } from '../../domain/ner/nerTypes.js';

/**
 * Creates or persists a new NER Cultural Profile.
 * @param {Object} profileData
 * @returns {Promise<number>} Auto-incremented primary key or updated ID
 */
export async function createNERProfile(profileData) {
  const profile = createNERCulturalProfile(profileData);
  // Check if a profile already exists for this user
  if (profile.userId) {
    const existing = await db.nerProfiles.where('userId').equals(profile.userId).first();
    if (existing) {
      await db.nerProfiles.update(existing.id, {
        ...profile,
        updatedAt: new Date().toISOString(),
      });
      return existing.id;
    }
  }
  return await db.nerProfiles.add(profile);
}

/**
 * Retrieves the NER Cultural Profile for a user.
 * @param {string} userId
 * @returns {Promise<Object|null>}
 */
export async function getNERProfile(userId) {
  if (!userId) return null;
  const profile = await db.nerProfiles.where('userId').equals(userId).first();
  return profile || null;
}

/**
 * Updates an existing NER Cultural Profile or creates one if none exists.
 * @param {string} userId
 * @param {Object} updates
 * @returns {Promise<number|null>} Primary key ID of updated/created profile
 */
export async function updateNERProfile(userId, updates) {
  if (!userId) return null;
  const existing = await db.nerProfiles.where('userId').equals(userId).first();
  if (existing) {
    await db.nerProfiles.update(existing.id, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
    return existing.id;
  }
  // Create if none exists
  return await createNERProfile({
    userId,
    ...updates,
  });
}

/**
 * Deletes an NER profile by its primary key ID or by userId.
 * @param {number|string} idOrUserId
 * @returns {Promise<void>}
 */
export async function deleteNERProfile(idOrUserId) {
  if (!idOrUserId) return;
  if (typeof idOrUserId === 'number') {
    return await db.nerProfiles.delete(idOrUserId);
  }
  return await db.nerProfiles.where('userId').equals(idOrUserId).delete();
}
