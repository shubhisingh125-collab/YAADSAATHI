/**
 * verifyVoiceService.js
 * Verification test script for YaadSaathi Sprint 3B:
 * Voice Saathi — Speech Recognition + Speech Synthesis + Sanitization + Preferences
 */

import 'fake-indexeddb/auto';
import { db } from '../src/database/db.js';
import {
  isSpeechRecognitionSupported,
  isSpeechSynthesisSupported,
  getSpeechRecognitionLanguage,
  getSpeechErrorMessage,
  prepareTextForSpeech,
  getVoiceRepliesPreference,
  setVoiceRepliesPreference,
  createSpeechRecognizer,
  speakText,
  stopSpeaking,
  pauseSpeaking,
  resumeSpeaking,
  getAvailableVoices,
  getPreferredVoice,
} from '../src/services/voice/speechService.js';

async function runVoiceServiceVerification() {
  console.log('--- STARTING SPRINT 3B VOICE SERVICE VERIFICATION ---');

  // 1. Speech Recognition Support Detection
  console.log('[Test] 1. Testing Speech Recognition support detection...');
  const defaultSTTSupported = isSpeechRecognitionSupported();
  console.log(`[Test] Default Node environment STT supported: ${defaultSTTSupported}`);
  if (typeof defaultSTTSupported !== 'boolean') {
    throw new Error('isSpeechRecognitionSupported must return a boolean');
  }
  console.log('[Test] ✓ Speech recognition support detection verified.');

  // 2. Speech Synthesis Support Detection
  console.log('[Test] 2. Testing Speech Synthesis support detection...');
  const defaultTTSSupported = isSpeechSynthesisSupported();
  console.log(`[Test] Default Node environment TTS supported: ${defaultTTSSupported}`);
  if (typeof defaultTTSSupported !== 'boolean') {
    throw new Error('isSpeechSynthesisSupported must return a boolean');
  }
  console.log('[Test] ✓ Speech synthesis support detection verified.');

  // 3. Language Mapping
  console.log('[Test] 3. Testing Language Mapping for standard locales...');
  if (getSpeechRecognitionLanguage('en') !== 'en-IN') {
    throw new Error('Expected "en" to map to "en-IN"');
  }
  if (getSpeechRecognitionLanguage('hi') !== 'hi-IN') {
    throw new Error('Expected "hi" to map to "hi-IN"');
  }
  if (getSpeechRecognitionLanguage('bn') !== 'bn-IN') {
    throw new Error('Expected "bn" to map to "bn-IN"');
  }
  if (getSpeechRecognitionLanguage('as') !== 'as-IN') {
    throw new Error('Expected "as" to map to "as-IN"');
  }
  console.log('[Test] ✓ Standard language locales mapped correctly.');

  // 4. Fallback Language Mapping
  console.log('[Test] 4. Testing Fallback Language Mapping...');
  if (getSpeechRecognitionLanguage('kha') !== 'hi-IN') {
    throw new Error('Expected "kha" to fallback to "hi-IN"');
  }
  if (getSpeechRecognitionLanguage('grt') !== 'hi-IN') {
    throw new Error('Expected "grt" to fallback to "hi-IN"');
  }
  if (getSpeechRecognitionLanguage('unknown-dialect') !== 'hi-IN') {
    throw new Error('Expected unknown language to fallback to "hi-IN"');
  }
  console.log('[Test] ✓ Transparent regional fallback mapping verified.');

  // 5. Text Sanitization for Speech
  console.log('[Test] 5. Testing Text Sanitization for TTS...');
  const sampleMarkdown = '**Morning Tea & Fruits**\n- Take warm tea ☕\n- Enjoy peaceful garden walk 🌿\n### Tip: Have a great day!';
  const cleanSpokenText = prepareTextForSpeech(sampleMarkdown);

  if (cleanSpokenText.includes('**') || cleanSpokenText.includes('###') || cleanSpokenText.includes('☕') || cleanSpokenText.includes('🌿')) {
    throw new Error(`Text sanitization failed: "${cleanSpokenText}" still contains markdown or emojis`);
  }
  if (!cleanSpokenText.includes('Morning Tea & Fruits') || !cleanSpokenText.includes('Have a great day!')) {
    throw new Error(`Text sanitization altered readable content: "${cleanSpokenText}"`);
  }
  console.log(`[Test] Cleaned Spoken Output: "${cleanSpokenText}"`);
  console.log('[Test] ✓ Markdown and emoji sanitization verified.');

  // 6. Long-Response Preparation & Natural Truncation
  console.log('[Test] 6. Testing Long-Response Preparation...');
  const longText = 'This is sentence one. This is sentence two. This is sentence three. ' + 'Extra details for the story. '.repeat(10);
  const truncatedSpeech = prepareTextForSpeech(longText, 60);

  if (truncatedSpeech.length > 70) {
    throw new Error(`Truncation failed to respect character limit: length is ${truncatedSpeech.length}`);
  }
  console.log(`[Test] Truncated output: "${truncatedSpeech}"`);
  console.log('[Test] ✓ Long-response natural truncation verified.');

  // 7. Voice Preference Persistence (Mock localStorage in Node)
  console.log('[Test] 7. Testing Voice Replies Preference...');
  if (typeof globalThis.localStorage === 'undefined') {
    let mockStore = {};
    globalThis.localStorage = {
      getItem: (k) => (k in mockStore ? mockStore[k] : null),
      setItem: (k, v) => { mockStore[k] = String(v); },
      removeItem: (k) => { delete mockStore[k]; },
      clear: () => { mockStore = {}; },
    };
  }

  setVoiceRepliesPreference(false);
  if (getVoiceRepliesPreference() !== false) {
    throw new Error('Expected voice replies preference to be false');
  }
  setVoiceRepliesPreference(true);
  if (getVoiceRepliesPreference() !== true) {
    throw new Error('Expected voice replies preference to be true');
  }
  console.log('[Test] ✓ Voice replies local preference verified.');

  // 8. Privacy & No Audio Storage Confirmation
  console.log('[Test] 8. Verifying zero persistent audio storage in Dexie DB...');
  const tableNames = db.tables.map((t) => t.name);
  const forbiddenAudioTables = ['audio', 'recordings', 'audioNotes', 'voiceBlobs', 'microphoneRecordings'];
  for (const f of forbiddenAudioTables) {
    if (tableNames.includes(f)) {
      throw new Error(`Privacy violation: Found forbidden audio storage table "${f}" in IndexedDB`);
    }
  }
  console.log('[Test] ✓ Confirmed: Zero audio recording storage tables exist in IndexedDB.');

  // 9. Error Message Localization
  console.log('[Test] 9. Testing Speech Recognition Error Messages...');
  const hiError = getSpeechErrorMessage('not-allowed', true);
  const enError = getSpeechErrorMessage('not-allowed', false);
  if (!hiError.includes('माइक्रोफ़ोन') || !enError.includes('Microphone permission')) {
    throw new Error('Error message localization mismatch');
  }
  console.log('[Test] ✓ Localized speech error feedback verified.');

  // 10. Graceful Degradation when Browser APIs Unavailable
  console.log('[Test] 10. Testing graceful degradation when Speech APIs are unavailable...');
  let errorTriggered = false;
  const recognizer = createSpeechRecognizer({
    language: 'hi-IN',
    onError: (msg, code) => {
      errorTriggered = true;
      if (code !== 'SPEECH_NOT_SUPPORTED') {
        throw new Error(`Expected SPEECH_NOT_SUPPORTED error, got: ${code}`);
      }
    },
  });

  recognizer.start();
  if (!errorTriggered) {
    throw new Error('createSpeechRecognizer in unsupported environment failed to trigger onError');
  }
  recognizer.stop();
  recognizer.abort();

  // Test TTS methods in unsupported environment do not throw uncaught exceptions
  stopSpeaking();
  pauseSpeaking();
  resumeSpeaking();
  getAvailableVoices();
  getPreferredVoice('hi-IN');
  speakText('Test speech');

  console.log('[Test] ✓ Graceful degradation without browser crash verified.');
  console.log('--- SPRINT 3B VOICE SERVICE VERIFICATION PASSED SUCCESSFULLY! 🎉 ---');
}

runVoiceServiceVerification()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('VOICE SERVICE VERIFICATION FAILED:', err);
    process.exit(1);
  });
