/**
 * caregiverRepository.js
 * Data access operations for caregiver contacts and safety escalation alerts.
 */

import { db } from '../db.js';
import {
  createCaregiverContact,
  createCaregiverAlert as buildCaregiverAlert,
} from '../../domain/caregiver/caregiverTypes.js';

/**
 * Adds a new caregiver contact.
 * @param {Object} caregiverData
 * @returns {Promise<number>} Auto-incremented primary key
 */
export async function addCaregiver(caregiverData) {
  const contact = createCaregiverContact(caregiverData);
  return await db.caregivers.add(contact);
}

/**
 * Retrieves all caregiver contacts for an elder.
 * @param {string|number} userId
 * @returns {Promise<Array<Object>>}
 */
export async function getCaregivers(userId) {
  let collection = db.caregivers.toCollection();

  if (userId !== undefined) {
    collection = db.caregivers.where('userId').equals(userId);
  }

  const caregivers = await collection.toArray();
  caregivers.sort((a, b) => (a.priority || 1) - (b.priority || 1));
  return caregivers;
}

/**
 * Retrieves the primary caregiver contact.
 * @param {string|number} userId
 * @returns {Promise<Object|undefined>}
 */
export async function getPrimaryCaregiver(userId) {
  const caregivers = await getCaregivers(userId);
  return caregivers.find((c) => c.isPrimary) || caregivers[0];
}

/**
 * Updates an existing caregiver contact.
 * @param {number} id
 * @param {Object} updates
 * @returns {Promise<number>}
 */
export async function updateCaregiver(id, updates) {
  return await db.caregivers.update(id, updates);
}

/**
 * Deletes a caregiver contact.
 * @param {number} id
 * @returns {Promise<void>}
 */
export async function deleteCaregiver(id) {
  return await db.caregivers.delete(id);
}

/**
 * Creates an escalated caregiver alert in IndexedDB.
 * @param {Object} alertData
 * @returns {Promise<number>} Auto-incremented primary key
 */
export async function createCaregiverAlert(alertData) {
  const alert = buildCaregiverAlert(alertData);
  return await db.caregiverAlerts.add(alert);
}

/**
 * Retrieves caregiver alerts for an elder, optionally filtering out acknowledged ones.
 * @param {string|number} userId
 * @param {boolean} [onlyUnacknowledged=true]
 * @returns {Promise<Array<Object>>}
 */
export async function getCaregiverAlerts(userId, onlyUnacknowledged = true) {
  let collection = db.caregiverAlerts.toCollection();

  if (userId !== undefined) {
    collection = db.caregiverAlerts.where('userId').equals(userId);
  }

  let alerts = await collection.toArray();
  if (onlyUnacknowledged) {
    alerts = alerts.filter((a) => !a.acknowledged);
  }

  alerts.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  return alerts;
}

/**
 * Acknowledges a caregiver alert.
 * @param {number} alertId
 * @returns {Promise<number>}
 */
export async function acknowledgeCaregiverAlert(alertId) {
  return await db.caregiverAlerts.update(alertId, {
    acknowledged: true,
    acknowledgedAt: new Date().toISOString(),
  });
}
