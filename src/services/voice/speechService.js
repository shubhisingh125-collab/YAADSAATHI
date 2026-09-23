/**
 * speechService.js
 * Unified Speech Recognition (STT) and Speech Synthesis (TTS) service for YaadSaathi.
 * 
 * DESIGN PRINCIPLES:
 * - Senior-friendly acoustic settings (rate ~0.90, clean prosody).
 * - Markdown & emoji sanitization prior to speech synthesis.
 * - Single-turn microphone capture with interim text streaming.
 * - Zero persistent audio storage (no audio blobs, no recording databases).
 * - Graceful degradation when Web Speech APIs are unavailable in browser.
 */

const VOICE_REPLIES_KEY = 'yaadsaathi_voice_replies';

/**
 * Checks if browser supports Speech Recognition (STT).
 * @returns {boolean}
 */
export function isSpeechRecognitionSupported() {
  if (typeof window === 'undefined') return false;
  return Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
}

/**
 * Checks if browser supports Speech Synthesis (TTS).
 * @returns {boolean}
 */
export function isSpeechSynthesisSupported() {
  if (typeof window === 'undefined') return false;
  return Boolean(window.speechSynthesis && typeof window.SpeechSynthesisUtterance !== 'undefined');
}

/**
 * Maps application language preferences to standard BCP-47 speech recognition locales.
 * @param {string} preferredLanguage - e.g. 'hi', 'en', 'as', 'bn', 'mni', 'kha', 'grt', 'lus', 'brx', 'ne'
 * @returns {string} Standard BCP-47 locale
 */
export function getSpeechRecognitionLanguage(preferredLanguage = 'hi') {
  const lang = (preferredLanguage || '').toLowerCase().trim();

  switch (lang) {
    case 'en':
    case 'en-in':
      return 'en-IN';
    case 'hi':
    case 'hi-in':
      return 'hi-IN';
    case 'bn':
    case 'bn-in':
      return 'bn-IN';
    case 'as':
    case 'as-in':
      // Assamese recognition is supported on some Android/Chromium builds, fallback gracefully
      return 'as-IN';
    case 'ne':
    case 'ne-in':
      return 'ne-IN';
    case 'mni':
    case 'kha':
    case 'grt':
    case 'lus':
    case 'brx':
      // Regional languages without dedicated STT engine default to Hindi for voice capture
      return 'hi-IN';
    default:
      return 'hi-IN';
  }
}

/**
 * Returns elderly-friendly localized error messages for speech recognition codes.
 * @param {string} errorCode - Error code from SpeechRecognition or internal
 * @param {boolean} [isHindi=false]
 * @returns {string}
 */
export function getSpeechErrorMessage(errorCode, isHindi = false) {
  switch (errorCode) {
    case 'not-allowed':
    case 'permission-denied':
      return isHindi
        ? 'साथी से बात करने के लिए माइक्रोफ़ोन की अनुमति आवश्यक है।'
        : 'Microphone permission is needed to speak with Saathi.';
    case 'no-speech':
      return isHindi
        ? 'कोई आवाज़ सुनाई नहीं दी। कृपया पुनः बोलें।'
        : "I didn't hear anything. Please try again.";
    case 'audio-capture':
      return isHindi
        ? 'कोई माइक्रोफ़ोन नहीं मिला।'
        : 'No microphone was detected.';
    case 'network':
      return isHindi
        ? 'वॉयस इनपुट के लिए नेटवर्क कनेक्शन की आवश्यकता है।'
        : 'Network connection is required for voice recognition.';
    case 'aborted':
      return isHindi
        ? 'आवाज इनपुट रोक दिया गया।'
        : 'Voice input was stopped.';
    case 'language-not-supported':
      return isHindi
        ? 'इस भाषा के लिए वॉयस इनपुट समर्थित नहीं है।'
        : 'Voice input is not supported for this language in this browser.';
    case 'SPEECH_NOT_SUPPORTED':
      return isHindi
        ? 'इस ब्राउज़र में वॉयस इनपुट समर्थित नहीं है। आप लिखकर संदेश भेज सकते हैं।'
        : 'Voice input is not supported in this browser. You can type your message instead.';
    default:
      return isHindi
        ? 'वॉयस इनपुट में समस्या आई। कृपया दोबारा प्रयास करें।'
        : 'Could not capture voice. Please try again.';
  }
}

/**
 * Sanitizes and prepares text for Text-to-Speech playback.
 * Strips markdown symbols (*, #, -, links), emojis, and limits length comfortably for seniors.
 * 
 * @param {string} text - Raw text containing markdown/emojis
 * @param {number} [maxChars=350] - Reasonable character cap for comfortable listening
 * @returns {string} Natural spoken text
 */
export function prepareTextForSpeech(text = '', maxChars = 350) {
  if (!text || typeof text !== 'string') return '';

  let clean = text
    // Remove code blocks
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]+)`/g, '$1')
    // Remove markdown headers (# Header)
    .replace(/^#+\s+/gm, '')
    // Remove bold and italics (**bold**, *italic*, __bold__, _italic_)
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    // Remove markdown links [text](url) -> text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    // Remove bullet point markers
    .replace(/^[\s*•-]+\s+/gm, '')
    // Remove XML/HTML tags
    .replace(/<[^>]*>/g, ' ')
    // Remove security / untrusted delimiters
    .replace(/===[\s\S]*?===/g, ' ')
    // Remove common decorative emojis to prevent speech synthesizer from reading emoji names
    .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}]/gu, ' ')
    // Normalize spaces
    .replace(/\s+/g, ' ')
    .trim();

  // If text is within length, return as is
  if (clean.length <= maxChars) {
    return clean;
  }

  // Truncate at natural sentence boundary if possible
  const truncated = clean.slice(0, maxChars);
  const lastPunctuation = Math.max(
    truncated.lastIndexOf('.'),
    truncated.lastIndexOf('।'),
    truncated.lastIndexOf('!'),
    truncated.lastIndexOf('?')
  );

  if (lastPunctuation > maxChars * 0.5) {
    return truncated.slice(0, lastPunctuation + 1).trim();
  }

  // Otherwise cut at last space
  const lastSpace = truncated.lastIndexOf(' ');
  return (lastSpace > 0 ? truncated.slice(0, lastSpace) : truncated).trim() + '...';
}

/**
 * Creates and configures a SpeechRecognizer instance for single-turn voice capture.
 * 
 * @param {Object} options
 * @param {string} [options.language='hi-IN']
 * @param {Function} [options.onStart]
 * @param {Function} [options.onInterimResult] - callback(interimText: string)
 * @param {Function} [options.onResult] - callback(finalText: string)
 * @param {Function} [options.onError] - callback(errorMsg: string, rawError: any)
 * @param {Function} [options.onEnd]
 * @returns {{ start: Function, stop: Function, abort: Function }}
 */
export function createSpeechRecognizer({
  language = 'hi-IN',
  onStart,
  onInterimResult,
  onResult,
  onError,
  onEnd,
} = {}) {
  if (!isSpeechRecognitionSupported()) {
    return {
      start: () => {
        if (onError) onError(getSpeechErrorMessage('SPEECH_NOT_SUPPORTED'), 'SPEECH_NOT_SUPPORTED');
      },
      stop: () => {},
      abort: () => {},
    };
  }

  const SpeechRecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognizer = new SpeechRecognitionClass();

  recognizer.continuous = false;
  recognizer.interimResults = true;
  recognizer.maxAlternatives = 1;
  recognizer.lang = getSpeechRecognitionLanguage(language);

  recognizer.onstart = () => {
    if (onStart) onStart();
  };

  recognizer.onresult = (event) => {
    let interimTranscript = '';
    let finalTranscript = '';

    for (let i = event.resultIndex; i < event.results.length; ++i) {
      const item = event.results[i];
      if (item.isFinal) {
        finalTranscript += item[0].transcript;
      } else {
        interimTranscript += item[0].transcript;
      }
    }

    if (interimTranscript && onInterimResult) {
      onInterimResult(interimTranscript.trim());
    }

    if (finalTranscript && onResult) {
      onResult(finalTranscript.trim());
    }
  };

  recognizer.onerror = (event) => {
    const errorType = event.error || 'unknown';
    const friendlyMsg = getSpeechErrorMessage(errorType, language.startsWith('hi'));
    if (onError) onError(friendlyMsg, errorType);
  };

  recognizer.onend = () => {
    if (onEnd) onEnd();
  };

  return {
    start: () => {
      try {
        recognizer.start();
      } catch (err) {
        if (onError) onError(getSpeechErrorMessage('unknown', language.startsWith('hi')), err);
      }
    },
    stop: () => {
      try {
        recognizer.stop();
      } catch {}
    },
    abort: () => {
      try {
        recognizer.abort();
      } catch {}
    },
  };
}

/**
 * Retrieves available speech synthesis voices from browser.
 * @returns {Array<SpeechSynthesisVoice>}
 */
export function getAvailableVoices() {
  if (!isSpeechSynthesisSupported()) return [];
  return window.speechSynthesis.getVoices() || [];
}

/**
 * Selects the best matched SpeechSynthesisVoice for a target language.
 * @param {string} [language='hi-IN']
 * @returns {SpeechSynthesisVoice|null}
 */
export function getPreferredVoice(language = 'hi-IN') {
  const voices = getAvailableVoices();
  if (voices.length === 0) return null;

  const target = (language || 'hi-IN').toLowerCase();

  if (target.startsWith('hi')) {
    return (
      voices.find((v) => v.lang.toLowerCase() === 'hi-in') ||
      voices.find((v) => v.lang.toLowerCase().startsWith('hi')) ||
      voices.find((v) => v.name.toLowerCase().includes('hindi')) ||
      null
    );
  }

  if (target.startsWith('en')) {
    return (
      voices.find((v) => v.lang.toLowerCase() === 'en-in') ||
      voices.find((v) => v.lang.toLowerCase().startsWith('en-') && !v.lang.toLowerCase().includes('us')) ||
      voices.find((v) => v.lang.toLowerCase().startsWith('en')) ||
      null
    );
  }

  // Check direct locale match for regional codes
  return voices.find((v) => v.lang.toLowerCase().startsWith(target.slice(0, 2))) || null;
}

/**
 * Speaks natural text aloud using Web SpeechSynthesis.
 * 
 * @param {string} text - Spoken message
 * @param {Object} [options]
 * @param {string} [options.language='hi-IN']
 * @param {number} [options.rate=0.90] - Senior-friendly rate
 * @param {number} [options.pitch=1.0]
 * @param {number} [options.volume=1.0]
 * @param {Function} [options.onStart]
 * @param {Function} [options.onEnd]
 * @param {Function} [options.onError]
 * @returns {SpeechSynthesisUtterance|null}
 */
export function speakText(text, {
  language = 'hi-IN',
  rate = 0.90,
  pitch = 1.0,
  volume = 1.0,
  onStart,
  onEnd,
  onError,
} = {}) {
  if (!isSpeechSynthesisSupported()) {
    if (onError) onError(new Error('SpeechSynthesis is not supported'));
    return null;
  }

  const cleanText = prepareTextForSpeech(text);
  if (!cleanText) {
    if (onEnd) onEnd();
    return null;
  }

  // Cancel any ongoing speech
  stopSpeaking();

  const utterance = new SpeechSynthesisUtterance(cleanText);
  utterance.rate = rate;
  utterance.pitch = pitch;
  utterance.volume = volume;

  const normalizedLang = language.startsWith('en') ? 'en-IN' : 'hi-IN';
  utterance.lang = normalizedLang;

  const voice = getPreferredVoice(normalizedLang);
  if (voice) {
    utterance.voice = voice;
  }

  utterance.onstart = () => {
    if (onStart) onStart();
  };

  utterance.onend = () => {
    if (onEnd) onEnd();
  };

  utterance.onerror = (event) => {
    if (onError) onError(event);
  };

  try {
    window.speechSynthesis.speak(utterance);
    return utterance;
  } catch (err) {
    if (onError) onError(err);
    return null;
  }
}

/**
 * Immediately cancels any active speech synthesis audio.
 */
export function stopSpeaking() {
  if (isSpeechSynthesisSupported()) {
    try {
      window.speechSynthesis.cancel();
    } catch {}
  }
}

/**
 * Pauses active speech synthesis.
 */
export function pauseSpeaking() {
  if (isSpeechSynthesisSupported()) {
    try {
      window.speechSynthesis.pause();
    } catch {}
  }
}

/**
 * Resumes paused speech synthesis.
 */
export function resumeSpeaking() {
  if (isSpeechSynthesisSupported()) {
    try {
      window.speechSynthesis.resume();
    } catch {}
  }
}

/**
 * Retrieves the user's voice reply preference (defaults to true / ON).
 * @returns {boolean}
 */
export function getVoiceRepliesPreference() {
  if (typeof localStorage === 'undefined') return true;
  const val = localStorage.getItem(VOICE_REPLIES_KEY);
  if (val === null) return true; // Default ON
  return val === 'true';
}

/**
 * Persists the user's voice reply preference in localStorage.
 * @param {boolean} enabled
 */
export function setVoiceRepliesPreference(enabled) {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(VOICE_REPLIES_KEY, String(Boolean(enabled)));
}
