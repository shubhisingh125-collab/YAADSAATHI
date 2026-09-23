/**
 * userRepository.js
 * Data access operations for user profiles and preferences.
 */

import { db } from '../db.js';
import { createUserProfile } from '../../domain/user/userTypes.js';

/**
 * Creates a new user record in IndexedDB.
 * @param {Object} userData
 * @returns {Promise<number>} Auto-incremented primary key
 */
export async function createUser(userData) {
  const profile = createUserProfile(userData);
  return await db.users.add(profile);
}

/**
 * Retrieves a user by primary key ID.
 * @param {number} id
 * @returns {Promise<Object|undefined>}
 */
export async function getUser(id) {
  return await db.users.get(id);
}

/**
 * Retrieves the first or default user profile.
 * Useful for single-user offline prototype mode.
 * @returns {Promise<Object|undefined>}
 */
export async function getDefaultUser() {
  return await db.users.toCollection().first();
}

/**
 * Updates an existing user profile by ID.
 * @param {number} id
 * @param {Object} updates
 * @returns {Promise<number>} Number of updated records
 */
export async function updateUser(id, updates) {
  return await db.users.update(id, {
    ...updates,
    updatedAt: new Date().toISOString(),
  });
}

/**
 * Deletes a user profile by ID.
 * @param {number} id
 * @returns {Promise<void>}
 */
export async function deleteUser(id) {
  return await db.users.delete(id);
}
