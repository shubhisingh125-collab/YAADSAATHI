/**
 * medicineRepository.js
 * Data access operations for medicine schedules, dosage, and intake history logs.
 */

import { db } from '../db.js';
import { createMedicineSchedule, createMedicineHistoryLog } from '../../domain/medicine/medicineTypes.js';

/**
 * Adds a new medicine schedule.
 * @param {Object} medicineData
 * @returns {Promise<number>} Auto-incremented primary key
 */
export async function addMedicine(medicineData) {
  const schedule = createMedicineSchedule(medicineData);
  return await db.medicines.add(schedule);
}

/**
 * Retrieves all medicines for a user.
 * @param {string|number} userId
 * @param {boolean} [onlyActive=false]
 * @returns {Promise<Array<Object>>}
 */
export async function getMedicines(userId, onlyActive = false) {
  let collection = db.medicines.toCollection();

  if (userId !== undefined) {
    collection = db.medicines.where('userId').equals(userId);
  }

  let medicines = await collection.toArray();
  if (onlyActive) {
    medicines = medicines.filter((m) => m.active !== false);
  }

  // Sort by scheduled time string ('08:00', '13:00', '21:00')
  medicines.sort((a, b) => (a.scheduledTime || '').localeCompare(b.scheduledTime || ''));
  return medicines;
}

/**
 * Retrieves a single medicine schedule by ID.
 * @param {number} id
 * @returns {Promise<Object|undefined>}
 */
export async function getMedicineById(id) {
  return await db.medicines.get(id);
}

/**
 * Updates an existing medicine schedule.
 * @param {number} id
 * @param {Object} updates
 * @returns {Promise<number>}
 */
export async function updateMedicine(id, updates) {
  return await db.medicines.update(id, {
    ...updates,
    updatedAt: new Date().toISOString(),
  });
}

/**
 * Deletes a medicine schedule by ID.
 * @param {number} id
 * @returns {Promise<void>}
 */
export async function deleteMedicine(id) {
  return await db.medicines.delete(id);
}

/**
 * Saves a medicine intake history event.
 * @param {Object} historyData
 * @returns {Promise<number>} Auto-incremented primary key
 */
export async function saveMedicineHistory(historyData) {
  const log = createMedicineHistoryLog(historyData);
  return await db.medicineHistory.add(log);
}

/**
 * Retrieves medicine history logs, optionally filtered by user and limit.
 * @param {string|number} [userId]
 * @param {number} [limit=30]
 * @returns {Promise<Array<Object>>}
 */
export async function getMedicineHistory(userId, limit = 30) {
  let collection = db.medicineHistory.toCollection();

  if (userId !== undefined) {
    collection = db.medicineHistory.where('userId').equals(userId);
  }

  const logs = await collection.toArray();
  logs.sort((a, b) => (b.recordedTimestamp || 0) - (a.recordedTimestamp || 0));
  return logs.slice(0, limit);
}
