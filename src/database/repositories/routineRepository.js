/**
 * routineRepository.js
 * Data access operations for daily routine tasks, schedules, and completion logs.
 */

import { db } from '../db.js';
import { createRoutineItem } from '../../domain/routine/routineTypes.js';

/**
 * Adds a new daily routine task.
 * @param {Object} routineData
 * @returns {Promise<number>} Auto-incremented primary key
 */
export async function addRoutine(routineData) {
  const item = createRoutineItem(routineData);
  return await db.routines.add(item);
}

/**
 * Retrieves daily routines for a user, optionally filtered by period.
 * @param {string|number} userId
 * @param {string} [period] - 'morning', 'afternoon', 'evening', 'night'
 * @returns {Promise<Array<Object>>}
 */
export async function getRoutines(userId, period) {
  let collection = db.routines.toCollection();

  if (userId !== undefined && period) {
    collection = db.routines
      .where('userId')
      .equals(userId)
      .filter((r) => r.period === period);
  } else if (userId !== undefined) {
    collection = db.routines.where('userId').equals(userId);
  } else if (period) {
    collection = db.routines.where('period').equals(period);
  }

  return await collection.toArray();
}

/**
 * Retrieves a single routine task by ID.
 * @param {number} id
 * @returns {Promise<Object|undefined>}
 */
export async function getRoutineById(id) {
  return await db.routines.get(id);
}

/**
 * Updates an existing routine task.
 * @param {number} id
 * @param {Object} updates
 * @returns {Promise<number>}
 */
export async function updateRoutine(id, updates) {
  return await db.routines.update(id, updates);
}

/**
 * Toggles or marks the completion state of a routine task.
 * @param {number} id
 * @param {boolean} completed
 * @returns {Promise<number>}
 */
export async function toggleRoutineCompletion(id, completed) {
  return await db.routines.update(id, {
    completed: Boolean(completed),
    completedAt: completed ? new Date().toISOString() : null,
  });
}

/**
 * Deletes a routine task by ID.
 * @param {number} id
 * @returns {Promise<void>}
 */
export async function deleteRoutine(id) {
  return await db.routines.delete(id);
}
