/**
 * saathiAIService.js
 * Core conversational orchestration service for Saathi AI Companion.
 * 
 * Coordinates:
 * - Local personalized context assembly (buildSaathiContext)
 * - Safe prompt construction (buildSaathiSystemPrompt)
 * - AI Provider communication (sendAIMessage)
 * - IndexedDB conversation and message persistence (aiRepository)
 */

import * as aiRepository from '../../database/repositories/aiRepository.js';
import { buildSaathiContext } from '../personalizationContextService.js';
import { buildSaathiSystemPrompt } from './saathiPromptBuilder.js';
import { sendAIMessage } from './aiProvider.js';
import { AIMessageRole } from '../../domain/ai/aiTypes.js';

/**
 * Checks if the client browser is currently offline.
 * @returns {boolean}
 */
export function isClientOffline() {
  if (typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean') {
    return !navigator.onLine;
  }
  return false;
}

/**
 * Creates a brand new conversation session in IndexedDB.
 * @param {Object} params
 * @param {string} params.userId
 * @param {string} [params.title]
 * @returns {Promise<string>} Conversation ID
 */
export async function startNewConversation({ userId = 'default-user', title = 'New Conversation' } = {}) {
  const conversationId = await aiRepository.createConversation({
    userId,
    title,
  });
  return conversationId;
}

/**
 * Sends a user message, processes it through Saathi AI, and persists both user & assistant messages.
 * 
 * @param {Object} params
 * @param {string} params.userId
 * @param {string} [params.conversationId] - Existing conversation ID or created automatically
 * @param {string} params.message - Raw text message from user
 * @param {Function} [params.providerOverride] - Optional custom adapter override
 * @returns {Promise<{
 *   conversationId: string,
 *   userMessageId: string,
 *   assistantMessageId: string,
 *   replyText: string,
 *   provider: string,
 *   model: string
 * }>}
 */
export async function sendSaathiMessage({
  userId = 'default-user',
  conversationId = null,
  message,
  providerOverride = null,
}) {
  // 1. Validate message
  const trimmed = (message || '').trim();
  if (!trimmed) {
    throw new Error('Message cannot be empty.');
  }

  // 2. Check offline status
  if (isClientOffline() && !providerOverride) {
    const offlineErr = new Error("You're offline. Your previous conversations are still available.");
    offlineErr.code = 'OFFLINE';
    throw offlineErr;
  }

  // 3. Ensure active conversation exists
  let activeConvId = conversationId;
  if (!activeConvId) {
    const defaultTitle = trimmed.length > 30 ? `${trimmed.slice(0, 30)}...` : trimmed;
    activeConvId = await aiRepository.createConversation({
      userId,
      title: defaultTitle,
    });
  }

  // 4. Retrieve personalized sanitized context
  const context = await buildSaathiContext(userId);

  // 5. Retrieve conversation history
  const previousMessages = await aiRepository.getMessages(activeConvId);

  // 6. Build system instructions
  const systemPrompt = buildSaathiSystemPrompt(context, trimmed);

  // 7. Persist User Message FIRST
  const userMessageId = await aiRepository.createMessage({
    conversationId: activeConvId,
    userId,
    role: AIMessageRole.USER,
    content: trimmed,
    language: context.preferredLanguage || 'hi',
  });

  // Prepare full message history array for LLM
  const llmMessages = [
    ...previousMessages.map((m) => ({
      role: m.role,
      content: m.content,
    })),
    {
      role: AIMessageRole.USER,
      content: trimmed,
    },
  ];

  // 8. Dispatch to AI Provider
  let aiResult;
  try {
    aiResult = await sendAIMessage({
      messages: llmMessages,
      systemPrompt,
      context,
      userId,
      providerOverride,
    });
  } catch (err) {
    // If the provider fails, we still keep the user's message in DB, but rethrow friendly error
    throw err;
  }

  // 9. Persist Assistant Response
  const assistantMessageId = await aiRepository.createMessage({
    conversationId: activeConvId,
    userId,
    role: AIMessageRole.ASSISTANT,
    content: aiResult.text,
    language: context.preferredLanguage || 'hi',
  });

  // Update conversation title if it was first exchange
  if (previousMessages.length === 0) {
    const titleSnippet = trimmed.length > 32 ? `${trimmed.slice(0, 32)}...` : trimmed;
    await aiRepository.updateConversation(activeConvId, {
      title: titleSnippet,
    }).catch(() => {});
  }

  return {
    conversationId: activeConvId,
    userMessageId,
    assistantMessageId,
    replyText: aiResult.text,
    provider: aiResult.provider,
    model: aiResult.model,
  };
}

/**
 * Retrieves all conversations for a user.
 * @param {string} userId
 * @returns {Promise<Array<Object>>}
 */
export async function getConversationHistory(userId = 'default-user') {
  return await aiRepository.getConversations(userId);
}

/**
 * Retrieves messages for a specific conversation.
 * @param {string} conversationId
 * @returns {Promise<Array<Object>>}
 */
export async function getConversationMessages(conversationId) {
  return await aiRepository.getMessages(conversationId);
}

/**
 * Deletes a conversation by ID.
 * @param {string} conversationId
 * @returns {Promise<void>}
 */
export async function deleteConversation(conversationId) {
  return await aiRepository.deleteConversation(conversationId);
}
