/**
 * scripts/verifyGeminiLive.js
 * Verification script to test Gemini AI integration directly.
 */

import { handleGeminiChatRequest } from '../server/geminiService.js';

async function main() {
  console.log('--- Starting YaadSaathi Google Gemini Live Integration Test ---');
  console.log('GEMINI_API_KEY set?:', Boolean(process.env.GEMINI_API_KEY));
  console.log('Model configured:', process.env.VITE_SAATHI_AI_MODEL || 'gemini-3.5-flash-lite');

  const payload = {
    model: 'gemini-3.5-flash-lite',
    systemPrompt: `You are Saathi (साथी), a loving, respectful, patient, and cheerful companion for elderly users in India.
Speak with warmth, patience, and reverence. Keep your answers concise (2 short sentences).`,
    messages: [
      { role: 'user', content: 'Namaste Saathi! Can you suggest a gentle morning activity for me?' }
    ],
    context: {
      preferredLanguage: 'en',
      stateOrRegion: 'ASSAM',
    },
    userId: 'test-user-live'
  };

  const startTime = Date.now();
  try {
    const result = await handleGeminiChatRequest(payload);
    const duration = Date.now() - startTime;
    console.log('\n✅ [SUCCESS] Real Google Gemini AI responded in', duration, 'ms');
    console.log('Provider:', result.provider);
    console.log('Model:', result.model);
    console.log('Response Text:\n"' + result.text + '"');
    console.log('\nUsage details:', JSON.stringify(result.usage, null, 2));
    console.log('Metadata:', JSON.stringify(result.metadata, null, 2));
    process.exit(0);
  } catch (err) {
    console.error('\n❌ [FAIL] Gemini Live Test Error:', err);
    process.exit(1);
  }
}

main();
