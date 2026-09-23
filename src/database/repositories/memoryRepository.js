/**
 * memoryRepository.js
 * Data access operations for personal memory bank, family photographs, and reminiscence items.
 */

import { db } from '../db.js';
import { createPersonalMemory } from '../../domain/memory/memoryTypes.js';

/**
 * Adds a new personal memory to IndexedDB.
 * @param {Object} memoryData
 * @returns {Promise<number>} Auto-incremented primary key
 */
export async function addMemory(memoryData) {
  const memory = createPersonalMemory(memoryData);
  return await db.memories.add(memory);
}

/**
 * Creates/adds a new personal memory (alias for addMemory).
 */
export const createMemory = addMemory;

/**
 * Retrieves all memories for a user, optionally filtered by category.
 * @param {string|number} userId
 * @param {string} [category] - Optional category filter
 * @returns {Promise<Array<Object>>}
 */
export async function getMemories(userId, category) {
  let collection = db.memories.toCollection();

  if (userId !== undefined && category) {
    collection = db.memories
      .where('userId')
      .equals(userId)
      .filter((m) => m.category === category || m.type === category);
  } else if (userId !== undefined) {
    collection = db.memories.where('userId').equals(userId);
  } else if (category) {
    collection = db.memories.where('category').equals(category);
  }

  const memories = await collection.toArray();
  memories.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  return memories;
}

/**
 * Retrieves a single memory by ID.
 * @param {number} id
 * @returns {Promise<Object|undefined>}
 */
export async function getMemoryById(id) {
  return await db.memories.get(id);
}

/**
 * Updates an existing memory item.
 * @param {number} id
 * @param {Object} updates
 * @returns {Promise<number>}
 */
export async function updateMemory(id, updates) {
  return await db.memories.update(id, {
    ...updates,
    updatedAt: new Date().toISOString(),
  });
}

/**
 * Deletes a memory item by ID.
 * @param {number} id
 * @returns {Promise<void>}
 */
export async function deleteMemory(id) {
  return await db.memories.delete(id);
}
