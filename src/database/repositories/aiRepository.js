/**
 * aiRepository.js
 * Data access operations for AI conversations and dialogue messages using Dexie IndexedDB.
 */

import { db } from '../db.js';
import { createAIConversation, createAIMessage } from '../../domain/ai/aiTypes.js';

/**
 * Creates and persists a new AI conversation.
 * @param {Object} conversationData
 * @returns {Promise<string>} Conversation ID
 */
export async function createConversation(conversationData = {}) {
  const conv = createAIConversation(conversationData);
  await db.aiConversations.add({
    id: conv.id,
    userId: conv.userId,
    title: conversationData.title || 'New Conversation',
    contextSummary: conv.contextSummary || {},
    startedAt: conv.startedAt,
    updatedAt: new Date().toISOString(),
  });
  return conv.id;
}

/**
 * Retrieves a conversation by its ID.
 * @param {string} id
 * @returns {Promise<Object|null>}
 */
export async function getConversation(id) {
  if (!id) return null;
  const conv = await db.aiConversations.get(id);
  return conv || null;
}

/**
 * Retrieves all conversations for a specific user, sorted newest first.
 * @param {string} userId
 * @returns {Promise<Array<Object>>}
 */
export async function getConversations(userId) {
  if (!userId) return [];
  const list = await db.aiConversations
    .where('userId')
    .equals(userId)
    .toArray();
  return list.sort((a, b) => new Date(b.updatedAt || b.startedAt) - new Date(a.updatedAt || a.startedAt));
}

/**
 * Updates an existing conversation (e.g. title, updatedAt).
 * @param {string} id
 * @param {Object} updates
 * @returns {Promise<number>}
 */
export async function updateConversation(id, updates = {}) {
  if (!id) return 0;
  return await db.aiConversations.update(id, {
    ...updates,
    updatedAt: new Date().toISOString(),
  });
}

/**
 * Deletes a conversation and all its associated messages.
 * @param {string} id
 * @returns {Promise<void>}
 */
export async function deleteConversation(id) {
  if (!id) return;
  await db.transaction('rw', db.aiConversations, db.aiMessages, async () => {
    await db.aiMessages.where('conversationId').equals(id).delete();
    await db.aiConversations.delete(id);
  });
}

/**
 * Creates and persists an AI message in a conversation.
 * @param {Object} messageData
 * @returns {Promise<string>} Message ID
 */
export async function createMessage(messageData = {}) {
  const msg = createAIMessage(messageData);
  const conversationId = messageData.conversationId || 'default-conv';
  const userId = messageData.userId || 'default-user';

  await db.aiMessages.add({
    id: msg.id,
    conversationId,
    userId,
    role: msg.role,
    content: msg.content,
    language: msg.language,
    intent: msg.intent,
    confidence: msg.confidence,
    timestamp: msg.timestamp,
  });

  // Touch parent conversation updatedAt
  await db.aiConversations.update(conversationId, {
    updatedAt: new Date().toISOString(),
  }).catch(() => {});

  return msg.id;
}

/**
 * Retrieves all messages for a conversation, sorted chronologically.
 * @param {string} conversationId
 * @returns {Promise<Array<Object>>}
 */
export async function getMessages(conversationId) {
  if (!conversationId) return [];
  const list = await db.aiMessages
    .where('conversationId')
    .equals(conversationId)
    .toArray();
  return list.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
}
