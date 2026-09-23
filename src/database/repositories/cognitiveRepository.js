/**
 * cognitiveRepository.js
 * Data access operations for cognitive game sessions, game results, and domain telemetry.
 */

import { db } from '../db.js';
import { createGameSession, createGameResult } from '../../domain/cognitive/gameTypes.js';
import { CognitiveDomain } from '../../domain/cognitive/cognitiveTypes.js';

/**
 * Saves a new cognitive game session.
 * @param {Object} sessionData
 * @returns {Promise<number>} Auto-incremented primary key
 */
export async function saveGameSession(sessionData) {
  const session = createGameSession(sessionData);
  return await db.gameSessions.add(session);
}

/**
 * Updates an ongoing game session.
 * @param {number} id
 * @param {Object} updates
 * @returns {Promise<number>} Number of updated records
 */
export async function updateGameSession(id, updates) {
  return await db.gameSessions.update(id, updates);
}

/**
 * Saves a completed game result and updates aggregate cognitive progress telemetry.
 * @param {Object} resultData
 * @returns {Promise<number>} Auto-incremented primary key of the result
 */
export async function saveGameResult(resultData) {
  const result = createGameResult(resultData);
  const resultId = await db.gameResults.add(result);

  // Automatically update aggregate cognitive progress for the domain
  if (result.userId && result.cognitiveDomain) {
    await updateCognitiveProgress(result.userId, result.cognitiveDomain, {
      score: result.score,
      accuracy: result.accuracy,
      responseTime: result.responseTime,
    });
  }

  return resultId;
}

/**
 * Retrieves game results for a user, optionally filtered by domain and limit.
 * @param {Object} options
 * @param {string|number} [options.userId]
 * @param {string} [options.cognitiveDomain] - One of CognitiveDomain
 * @param {number} [options.limit=20]
 * @returns {Promise<Array<Object>>}
 */
export async function getGameResults({ userId, cognitiveDomain, limit = 20 } = {}) {
  let collection = db.gameResults.toCollection();

  if (userId !== undefined && cognitiveDomain) {
    collection = db.gameResults
      .where('userId')
      .equals(userId)
      .filter((r) => r.cognitiveDomain === cognitiveDomain);
  } else if (userId !== undefined) {
    collection = db.gameResults.where('userId').equals(userId);
  } else if (cognitiveDomain) {
    collection = db.gameResults.where('cognitiveDomain').equals(cognitiveDomain);
  }

  const results = await collection.toArray();
  // Sort descending by completion time / createdAt
  results.sort((a, b) => new Date(b.createdAt || b.completedAt || 0) - new Date(a.createdAt || a.completedAt || 0));
  return results.slice(0, limit);
}

/**
 * Retrieves aggregate cognitive progress for a user across a specific domain.
 * @param {string|number} userId
 * @param {string} cognitiveDomain - One of CognitiveDomain
 * @returns {Promise<Object|undefined>}
 */
export async function getCognitiveProgress(userId, cognitiveDomain) {
  return await db.cognitiveProgress
    .where(['userId', 'cognitiveDomain'])
    .equals([userId, cognitiveDomain])
    .first();
}

/**
 * Updates or creates rolling aggregate cognitive progress for an elder.
 * @param {string|number} userId
 * @param {string} cognitiveDomain - One of CognitiveDomain
 * @param {Object} metrics - New session metrics { score, accuracy, responseTime }
 * @returns {Promise<number>} ID of the progress record
 */
export async function updateCognitiveProgress(userId, cognitiveDomain, metrics = {}) {
  const existing = await db.cognitiveProgress
    .filter((p) => p.userId === userId && p.cognitiveDomain === cognitiveDomain)
    .first();

  const now = new Date().toISOString();

  if (existing) {
    const totalSessions = (existing.sessionsCompleted || 0) + 1;
    const newAvgScore = Math.round(
      ((existing.averageScore || 0) * (totalSessions - 1) + (metrics.score || 0)) / totalSessions
    );
    const newAvgAcc = Math.round(
      ((existing.averageAccuracy || 0) * (totalSessions - 1) + (metrics.accuracy || 100)) / totalSessions
    );
    const newAvgTime = Number(
      (((existing.averageResponseTime || 0) * (totalSessions - 1) + (metrics.responseTime || 0)) / totalSessions).toFixed(2)
    );

    await db.cognitiveProgress.update(existing.id, {
      averageScore: newAvgScore,
      averageAccuracy: newAvgAcc,
      averageResponseTime: newAvgTime,
      sessionsCompleted: totalSessions,
      updatedAt: now,
    });
    return existing.id;
  } else {
    return await db.cognitiveProgress.add({
      userId,
      cognitiveDomain: cognitiveDomain || CognitiveDomain.MEMORY,
      averageScore: metrics.score || 0,
      averageAccuracy: metrics.accuracy || 100,
      averageResponseTime: metrics.responseTime || 0,
      sessionsCompleted: 1,
      updatedAt: now,
    });
  }
}
