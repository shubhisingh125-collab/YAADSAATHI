/**
 * SaathiChat.jsx
 * Elderly-friendly, accessible AI conversational companion interface for YaadSaathi.
 * Supports:
 * - Real Web Speech API Speech Recognition (STT) with interim streaming
 * - Speech Synthesis (TTS) with natural senior-cadence speech & markdown sanitization
 * - Toggleable Voice Replies preference (persisted locally)
 * - IndexedDB conversation history, prompt orchestration, and non-clinical safeguards
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  Plus,
  Trash2,
  Clock,
  AlertCircle,
  RotateCcw,
  WifiOff,
  History,
  ChevronLeft,
  Volume2,
  VolumeX,
  Mic,
  Loader2,
  Square,
  User,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useI18n } from '../i18n/I18nContext';
import VoiceButton from '../components/VoiceButton';
import {
  sendSaathiMessage,
  getConversationHistory,
  getConversationMessages,
  deleteConversation,
  isClientOffline,
} from '../services/ai/saathiAIService.js';
import {
  isSpeechRecognitionSupported,
  createSpeechRecognizer,
  speakText,
  stopSpeaking,
  getVoiceRepliesPreference,
  setVoiceRepliesPreference,
} from '../services/voice/speechService.js';
import { getOrCreateLocalUserId } from '../services/gamePersistenceService.js';

export default function SaathiChat() {
  const { navigateTo, sounds } = useApp();
  const { isHindi } = useI18n();
  const userId = getOrCreateLocalUserId();

  // Conversations & Messages State
  const [conversations, setConversations] = useState([]);
  const [activeConvId, setActiveConvId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [showHistoryDrawer, setShowHistoryDrawer] = useState(false);
  const [isOffline, setIsOffline] = useState(isClientOffline());

  // Voice Interaction State (Sprint 3B)
  const [micStatus, setMicStatus] = useState('IDLE'); // 'IDLE' | 'LISTENING' | 'PROCESSING' | 'ERROR'
  const [interimTranscript, setInterimTranscript] = useState('');
  const [micErrorMessage, setMicErrorMessage] = useState(null);
  const [voiceReplies, setVoiceReplies] = useState(() => getVoiceRepliesPreference());
  const [currentlySpeakingMsgId, setCurrentlySpeakingMsgId] = useState(null);

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const recognizerRef = useRef(null);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Load conversation history on mount
  useEffect(() => {
    loadConversations();
  }, []);

  // Load messages whenever active conversation changes
  useEffect(() => {
    if (activeConvId) {
      loadMessages(activeConvId);
    } else {
      setMessages([]);
    }
    setErrorMessage(null);
    stopSpeaking();
    setCurrentlySpeakingMsgId(null);
  }, [activeConvId]);

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading, interimTranscript]);

  // Clean up speech recognition & synthesis on unmount
  useEffect(() => {
    return () => {
      stopSpeaking();
      if (recognizerRef.current) {
        recognizerRef.current.abort();
      }
    };
  }, []);

  const loadConversations = async () => {
    try {
      const list = await getConversationHistory(userId);
      setConversations(list);
      if (list.length > 0 && !activeConvId) {
        setActiveConvId(list[0].id);
      }
    } catch (err) {
      console.warn('[SaathiChat] Failed to load conversation history:', err);
    }
  };

  const loadMessages = async (convId) => {
    try {
      const msgs = await getConversationMessages(convId);
      setMessages(msgs);
    } catch (err) {
      console.warn('[SaathiChat] Failed to load messages:', err);
    }
  };

  const handleStartNewChat = () => {
    stopSpeaking();
    setCurrentlySpeakingMsgId(null);
    setActiveConvId(null);
    setMessages([]);
    setErrorMessage(null);
    setInputText('');
    setShowHistoryDrawer(false);
    if (textareaRef.current) textareaRef.current.focus();
  };

  const handleDeleteConversation = async (e, convId) => {
    e.stopPropagation();
    const confirmMsg = isHindi
      ? 'क्या आप इस बातचीत को हटाना चाहते हैं?'
      : 'Are you sure you want to delete this conversation?';
    if (window.confirm(confirmMsg)) {
      try {
        stopSpeaking();
        setCurrentlySpeakingMsgId(null);
        await deleteConversation(convId);
        const updatedList = conversations.filter((c) => c.id !== convId);
        setConversations(updatedList);
        if (activeConvId === convId) {
          if (updatedList.length > 0) {
            setActiveConvId(updatedList[0].id);
          } else {
            setActiveConvId(null);
            setMessages([]);
          }
        }
      } catch (err) {
        console.warn('[SaathiChat] Failed to delete conversation:', err);
      }
    }
  };

  // Toggle voice replies preference
  const handleToggleVoiceReplies = () => {
    const nextVal = !voiceReplies;
    setVoiceReplies(nextVal);
    setVoiceRepliesPreference(nextVal);
    if (!nextVal) {
      stopSpeaking();
      setCurrentlySpeakingMsgId(null);
    }
  };

  // Speak assistant message aloud
  const handleSpeakAssistantMessage = (msgId, text) => {
    if (currentlySpeakingMsgId === msgId) {
      stopSpeaking();
      setCurrentlySpeakingMsgId(null);
      return;
    }

    stopSpeaking();
    setCurrentlySpeakingMsgId(msgId);

    speakText(text, {
      language: isHindi ? 'hi-IN' : 'en-IN',
      onStart: () => setCurrentlySpeakingMsgId(msgId),
      onEnd: () => setCurrentlySpeakingMsgId(null),
      onError: () => setCurrentlySpeakingMsgId(null),
    });
  };

  // Start / Stop Speech Recognition
  const handleToggleMicrophone = () => {
    // If speaking, stop TTS first
    if (currentlySpeakingMsgId) {
      stopSpeaking();
      setCurrentlySpeakingMsgId(null);
    }

    if (micStatus === 'LISTENING') {
      if (recognizerRef.current) {
        recognizerRef.current.stop();
      }
      setMicStatus('IDLE');
      setInterimTranscript('');
      return;
    }

    if (!isSpeechRecognitionSupported()) {
      setMicErrorMessage(
        isHindi
          ? 'इस ब्राउज़र में वॉयस इनपुट समर्थित नहीं है। आप लिखकर संदेश भेज सकते हैं।'
          : 'Voice input is not supported in this browser. You can type your message instead.'
      );
      setMicStatus('ERROR');
      return;
    }

    setMicStatus('LISTENING');
    setInterimTranscript('');
    setMicErrorMessage(null);

    const recognizer = createSpeechRecognizer({
      language: isHindi ? 'hi-IN' : 'en-IN',
      onStart: () => {
        setMicStatus('LISTENING');
      },
      onInterimResult: (text) => {
        setInterimTranscript(text);
      },
      onResult: (finalText) => {
        setMicStatus('PROCESSING');
        setInterimTranscript('');
        if (finalText) {
          setInputText((prev) => (prev ? `${prev} ${finalText}` : finalText));
        }
        setTimeout(() => setMicStatus('IDLE'), 400);
      },
      onError: (friendlyError) => {
        console.warn('[SaathiChat] Speech recognition error:', friendlyError);
        setMicErrorMessage(friendlyError);
        setMicStatus('ERROR');
        setInterimTranscript('');
        setTimeout(() => setMicStatus('IDLE'), 3500);
      },
      onEnd: () => {
        setMicStatus('IDLE');
        setInterimTranscript('');
      },
    });

    recognizerRef.current = recognizer;
    recognizer.start();
  };

  const handleSendMessage = async (textToSend = null) => {
    const text = (textToSend || inputText).trim();
    if (!text || isLoading) return;

    // Stop any active TTS
    stopSpeaking();
    setCurrentlySpeakingMsgId(null);

    setInputText('');
    setErrorMessage(null);
    setIsLoading(true);

    // Optimistically render the user message
    const tempUserMsg = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      const result = await sendSaathiMessage({
        userId,
        conversationId: activeConvId,
        message: text,
      });

      setActiveConvId(result.conversationId);
      // Reload actual persisted messages
      await loadMessages(result.conversationId);
      await loadConversations();
      if (sounds?.playEncouragementChime) sounds.playEncouragementChime();

      // Automatically speak response if voice replies are enabled
      if (voiceReplies && result.replyText) {
        handleSpeakAssistantMessage(result.assistantMessageId, result.replyText);
      }
    } catch (err) {
      console.warn('[SaathiChat] Error from Saathi AI:', err);

      let userFacingError = isHindi
        ? 'साथी AI अभी उपलब्ध नहीं है। कृपया कुछ समय बाद पुनः प्रयास करें।'
        : 'Saathi AI is currently unavailable. Please try again later.';

      if (err.code === 'OFFLINE' || !navigator.onLine) {
        userFacingError = isHindi
          ? 'आप ऑफलाइन हैं। आपकी पिछली बातचीत अभी भी सुरक्षित है।'
          : "You're offline. Your previous conversations are still available.";
      } else if (err.code === 'NOT_CONFIGURED') {
        userFacingError = isHindi
          ? 'साथी AI अभी कॉन्फ़िगर नहीं है। कृपया AI प्रदाता एंडपॉइंट जोड़ें।'
          : 'Saathi AI is not configured. Please configure an AI provider endpoint in the environment.';
      }

      setErrorMessage(userFacingError);
      // Remove optimistic temporary message on failure to allow clean retry
      setMessages((prev) => prev.filter((m) => m.id !== tempUserMsg.id));
      setInputText(text); // Restore typed text for easy retry
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const quickSuggestionChips = [
    {
      en: 'What is my morning routine?',
      hi: 'मेरी सुबह की दिनचर्या क्या है?',
      icon: '🌅',
    },
    {
      en: 'Tell me about my family memories.',
      hi: 'मेरी पारिवारिक यादों के बारे में बताएं।',
      icon: '❤️',
    },
    {
      en: 'Which cognitive game should I play?',
      hi: 'आज मुझे कौन सा खेल खेलना चाहिए?',
      icon: '🧠',
    },
    {
      en: 'Tell me something about Assam tea.',
      hi: 'असम की चाय और संस्कृति के बारे में बताएं।',
      icon: '☕',
    },
  ];

  const formatTime = (isoString) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const formatDate = (isoString) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] sm:h-[calc(100vh-120px)] max-w-5xl mx-auto text-left relative select-none">
      {/* 1. Accessible Header with Voice Controls */}
      <header className="bg-gradient-to-r from-[#DFF3E7] via-[#EAF7EF] to-[#E6F1FF] border-2 border-[#167A55]/30 rounded-3xl p-4 sm:p-5 shadow-xs mb-3 flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigateTo('home')}
            aria-label={isHindi ? 'मुख्य पृष्ठ पर वापस जाएं' : 'Back to Home'}
            className="tactile-btn p-2 sm:p-2.5 rounded-2xl bg-white border border-[#167A55]/20 text-[#167A55] hover:bg-[#EAF7EF] cursor-pointer flex items-center justify-center"
          >
            <ChevronLeft className="w-6 h-6 stroke-[3]" />
          </button>

          <div className="w-12 h-12 rounded-2xl bg-[#167A55] text-white flex items-center justify-center text-2xl shadow-sm">
            🌸
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-black text-[#102A43]">
                {isHindi ? 'साथी वॉयस AI' : 'Saathi Voice AI'}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-[#167A55]/15 text-[#167A55] font-black text-xs">
                {isHindi ? 'वॉयस साथी' : 'Voice Companion'}
              </span>
            </div>
            <p className="text-sm sm:text-base font-bold text-[#5D7184]">
              {isHindi ? 'बोलकर या लिखकर बातचीत करें' : 'Speak or type to have a comforting conversation'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Voice Replies Mode Toggle */}
          <button
            onClick={handleToggleVoiceReplies}
            aria-label={voiceReplies ? 'वॉयस उत्तर बंद करें' : 'वॉयस उत्तर चालू करें'}
            title={isHindi ? 'वॉयस उत्तर (TTS) चालू/बंद करें' : 'Toggle Voice Audio Replies (ON/OFF)'}
            className={`tactile-btn px-3.5 py-2.5 rounded-2xl border-2 font-black text-xs sm:text-sm flex items-center gap-1.5 cursor-pointer transition-all ${
              voiceReplies
                ? 'bg-[#167A55] text-white border-[#0D4E36] shadow-xs'
                : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-100'
            }`}
          >
            {voiceReplies ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            <span className="hidden md:inline">
              {isHindi ? 'वॉयस उत्तर: ' : 'Voice Replies: '}
              <strong>{voiceReplies ? 'ON' : 'OFF'}</strong>
            </span>
          </button>

          {/* Conversation History Drawer Button */}
          <button
            onClick={() => setShowHistoryDrawer(!showHistoryDrawer)}
            aria-label={isHindi ? 'बातचीत का इतिहास' : 'Conversation History'}
            className={`tactile-btn px-3.5 py-2.5 rounded-2xl border-2 font-black text-sm sm:text-base flex items-center gap-2 cursor-pointer transition-all ${
              showHistoryDrawer
                ? 'bg-[#167A55] text-white border-[#0D4E36]'
                : 'bg-white text-[#102A43] border-[#DFF3E7] hover:bg-[#EAF7EF]'
            }`}
          >
            <History className="w-5 h-5" />
            <span className="hidden sm:inline">
              {isHindi ? 'इतिहास' : 'History'}
            </span>
            {conversations.length > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-800 text-xs font-bold">
                {conversations.length}
              </span>
            )}
          </button>

          {/* New Chat Button */}
          <button
            onClick={handleStartNewChat}
            aria-label={isHindi ? 'नई बातचीत शुरू करें' : 'Start New Conversation'}
            className="tactile-btn px-4 py-2.5 rounded-2xl bg-[#167A55] hover:bg-[#115C40] text-white border-2 border-[#0D4E36] font-black text-sm sm:text-base flex items-center gap-2 cursor-pointer shadow-xs"
          >
            <Plus className="w-5 h-5 stroke-[3]" />
            <span className="hidden sm:inline">
              {isHindi ? 'नई बातचीत' : 'New Chat'}
            </span>
          </button>

          <VoiceButton
            id="saathi-chat-voice-btn"
            textHindi="नमस्ते! मैं साथी हूँ। आप माइक बटन दबाकर बोल सकते हैं या संदेश टाइप कर सकते हैं।"
            textEnglish="Namaste! I am Saathi. You can tap the microphone button to speak or type your message."
            size="md"
            label={isHindi ? 'सुनें' : 'Listen'}
          />
        </div>
      </header>

      {/* Global Speaking Alert Banner (with immediate Stop button) */}
      {currentlySpeakingMsgId && (
        <div className="mb-2 p-3 rounded-2xl bg-emerald-50 border-2 border-emerald-400 text-emerald-950 font-bold text-sm flex items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-center gap-2.5">
            <Volume2 className="w-5 h-5 text-emerald-600 animate-pulse shrink-0" />
            <span>
              {isHindi ? '🌸 साथी बोल रही है...' : '🌸 Saathi is speaking...'}
            </span>
          </div>
          <button
            onClick={() => {
              stopSpeaking();
              setCurrentlySpeakingMsgId(null);
            }}
            aria-label={isHindi ? 'बोलना रोकें' : 'Stop speaking'}
            className="tactile-btn px-4 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs flex items-center gap-1 cursor-pointer"
          >
            <Square className="w-3.5 h-3.5 fill-current" />
            <span>{isHindi ? 'रोकें' : 'Stop'}</span>
          </button>
        </div>
      )}

      {/* Offline Alert Banner */}
      {isOffline && (
        <div className="mb-2 p-3 rounded-2xl bg-amber-50 border-2 border-amber-300 text-amber-900 font-bold text-sm flex items-center gap-2.5 animate-slow-fade">
          <WifiOff className="w-5 h-5 text-amber-600 shrink-0" />
          <span>
            {isHindi
              ? 'आप ऑफलाइन हैं। पहले की बातचीत उपलब्ध है, लेकिन नया AI संदेश भेजने के लिए इंटरनेट चाहिए।'
              : "You're offline. Saved conversations remain accessible, but new messages require connectivity."}
          </span>
        </div>
      )}

      {/* Main Chat Layout Area: Messages + History Drawer */}
      <div className="flex-1 flex gap-3 overflow-hidden relative">
        {/* History Drawer (Overlay on mobile, sidebar on desktop) */}
        {showHistoryDrawer && (
          <aside className="absolute z-20 inset-y-0 left-0 w-80 bg-white border-2 border-[#DFF3E7] rounded-3xl p-4 shadow-xl flex flex-col justify-between animate-fade-in">
            <div>
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
                <h2 className="text-lg font-black text-[#102A43] flex items-center gap-2">
                  <History className="w-5 h-5 text-[#167A55]" />
                  <span>{isHindi ? 'पिछली बातचीत' : 'Past Conversations'}</span>
                </h2>
                <button
                  onClick={() => setShowHistoryDrawer(false)}
                  className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-500 font-bold text-sm cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {conversations.length === 0 ? (
                <div className="py-12 text-center text-slate-400 font-bold text-sm">
                  {isHindi ? 'अभी कोई पुरानी बातचीत नहीं है' : 'No previous conversations yet'}
                </div>
              ) : (
                <div className="space-y-2 max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
                  {conversations.map((conv) => {
                    const isSelected = conv.id === activeConvId;
                    return (
                      <div
                        key={conv.id}
                        onClick={() => {
                          setActiveConvId(conv.id);
                          setShowHistoryDrawer(false);
                        }}
                        className={`p-3 rounded-2xl border-2 flex items-center justify-between gap-2 cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-[#EAF7EF] border-[#167A55] text-[#167A55] shadow-xs'
                            : 'bg-[#FBFAF4] border-slate-200 text-[#102A43] hover:bg-slate-100'
                        }`}
                      >
                        <div className="truncate flex-1">
                          <p className="font-black text-sm truncate">
                            {conv.title || (isHindi ? 'बातचीत' : 'Conversation')}
                          </p>
                          <span className="text-xs font-semibold text-[#5D7184]">
                            {formatDate(conv.updatedAt || conv.startedAt)} • {formatTime(conv.updatedAt || conv.startedAt)}
                          </span>
                        </div>

                        <button
                          onClick={(e) => handleDeleteConversation(e, conv.id)}
                          aria-label={isHindi ? 'बातचीत हटाएं' : 'Delete conversation'}
                          className="p-2 rounded-xl text-rose-500 hover:bg-rose-100 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <button
              onClick={handleStartNewChat}
              className="w-full py-3 rounded-2xl bg-[#167A55] hover:bg-[#115C40] text-white font-black text-sm flex items-center justify-center gap-2 cursor-pointer mt-3"
            >
              <Plus className="w-4 h-4" />
              <span>{isHindi ? '+ नई बातचीत शुरू करें' : '+ Start New Chat'}</span>
            </button>
          </aside>
        )}

        {/* Central Messages Container */}
        <div className="flex-1 bg-white border-2 border-[#DFF3E7] rounded-3xl p-4 sm:p-6 overflow-y-auto shadow-xs flex flex-col justify-between">
          {/* Message List */}
          <div className="space-y-4 flex-1">
            {/* Initial Welcome Message (Always visible if conversation is empty) */}
            {messages.length === 0 && (
              <div className="space-y-6 py-6 animate-fade-in">
                <div className="flex items-start gap-3.5 max-w-2xl">
                  <div className="w-12 h-12 rounded-2xl bg-[#167A55] text-white flex items-center justify-center text-2xl shrink-0 shadow-sm">
                    🌸
                  </div>
                  <div className="p-5 rounded-3xl rounded-tl-none bg-[#EAF7EF] border-2 border-[#167A55]/30 text-[#102A43] shadow-xs">
                    <p className="text-lg sm:text-xl font-bold leading-relaxed">
                      {isHindi
                        ? 'नमस्ते! मैं साथी हूँ। आप माइक बटन दबाकर बोल सकते हैं, या लिखकर अपनी दिनचर्या, परिवार की यादें, व मन की कोई भी बात साझा कर सकते हैं।'
                        : 'Namaste! I am Saathi. You can tap the microphone to speak, or type to discuss your daily routine, family memories, or anything on your mind.'}
                    </p>
                    <span className="block mt-2 text-xs font-semibold text-[#167A55]">
                      🌸 {isHindi ? 'आपका स्नेहपूर्ण वॉयस साथी' : 'Your friendly voice companion'}
                    </span>
                  </div>
                </div>

                {/* Quick Suggestion Prompts */}
                <div className="space-y-2">
                  <p className="text-xs sm:text-sm font-black text-[#5D7184] uppercase tracking-wider">
                    💡 {isHindi ? 'सुझाए गए प्रश्न' : 'Suggested Topics'}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {quickSuggestionChips.map((chip, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSendMessage(isHindi ? chip.hi : chip.en)}
                        className="tactile-btn p-3.5 rounded-2xl bg-[#FBFAF4] hover:bg-[#EAF7EF] border-2 border-[#DFF3E7] text-[#102A43] font-bold text-sm sm:text-base flex items-center gap-3 cursor-pointer text-left transition-all"
                      >
                        <span className="text-xl">{chip.icon}</span>
                        <span>{isHindi ? chip.hi : chip.en}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Conversation Messages */}
            {messages.map((msg, idx) => {
              const isUser = msg.role === 'user';
              const isSpeakingThis = currentlySpeakingMsgId === msg.id;

              return (
                <div
                  key={msg.id || idx}
                  className={`flex items-end gap-3 ${isUser ? 'justify-end' : 'justify-start'} animate-fade-in`}
                >
                  {!isUser && (
                    <div className="w-10 h-10 rounded-xl bg-[#167A55] text-white flex items-center justify-center text-xl shrink-0 shadow-xs mb-1">
                      🌸
                    </div>
                  )}

                  <div
                    className={`max-w-[85%] sm:max-w-[75%] p-4 sm:p-5 rounded-3xl shadow-xs text-left ${
                      isUser
                        ? 'bg-[#167A55] text-white rounded-br-none border-2 border-[#0D4E36]'
                        : 'bg-[#F8FAF9] text-[#102A43] rounded-bl-none border-2 border-[#DFF3E7]'
                    }`}
                  >
                    <p className="text-base sm:text-lg font-bold leading-relaxed whitespace-pre-wrap">
                      {msg.content}
                    </p>

                    <div
                      className={`mt-2 text-[11px] font-semibold flex items-center justify-between gap-2 border-t pt-1.5 ${
                        isUser
                          ? 'border-emerald-700/50 text-emerald-100'
                          : 'border-slate-200 text-slate-400'
                      }`}
                    >
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{formatTime(msg.timestamp)}</span>
                      </div>

                      {/* Speaker Button beside Assistant Messages */}
                      {!isUser && (
                        <button
                          type="button"
                          onClick={() => handleSpeakAssistantMessage(msg.id, msg.content)}
                          aria-label={isSpeakingThis ? 'बोलना रोकें' : 'बोलकर सुनें'}
                          className={`px-2.5 py-1 rounded-xl text-xs font-black flex items-center gap-1 cursor-pointer transition-all ${
                            isSpeakingThis
                              ? 'bg-rose-100 text-rose-800 border border-rose-300 animate-pulse'
                              : 'bg-emerald-100 hover:bg-emerald-200 text-[#167A55] border border-emerald-300'
                          }`}
                        >
                          {isSpeakingThis ? (
                            <>
                              <Square className="w-3 h-3 fill-current" />
                              <span>{isHindi ? 'रोकें' : 'Stop'}</span>
                            </>
                          ) : (
                            <>
                              <Volume2 className="w-3.5 h-3.5" />
                              <span>{isHindi ? 'सुनें' : 'Speak'}</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {isUser && (
                    <div className="w-10 h-10 rounded-xl bg-slate-200 text-slate-700 flex items-center justify-center shrink-0 shadow-xs mb-1">
                      <User className="w-5 h-5 stroke-[2.5]" />
                    </div>
                  )}
                </div>
              );
            })}

            {/* Loading Indicator */}
            {isLoading && (
              <div className="flex items-center gap-3 justify-start animate-fade-in">
                <div className="w-10 h-10 rounded-xl bg-[#167A55] text-white flex items-center justify-center text-xl shrink-0 shadow-xs">
                  🌸
                </div>
                <div className="p-4 rounded-3xl rounded-bl-none bg-[#EAF7EF] border-2 border-[#167A55]/30 text-[#167A55] font-black text-base flex items-center gap-3 shadow-xs">
                  <span className="flex gap-1.5 items-center">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#167A55] animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2.5 h-2.5 rounded-full bg-[#167A55] animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2.5 h-2.5 rounded-full bg-[#167A55] animate-bounce" style={{ animationDelay: '300ms' }} />
                  </span>
                  <span>{isHindi ? 'साथी सोच रही है...' : 'Saathi is thinking...'}</span>
                </div>
              </div>
            )}

            {/* Error Message Card */}
            {errorMessage && (
              <div className="p-4 rounded-2xl bg-rose-50 border-2 border-rose-300 text-rose-900 font-bold text-sm sm:text-base flex items-center justify-between gap-3 animate-fade-in">
                <div className="flex items-center gap-2.5">
                  <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
                {inputText && (
                  <button
                    onClick={() => handleSendMessage()}
                    className="tactile-btn px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs sm:text-sm flex items-center gap-1.5 cursor-pointer shrink-0"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>{isHindi ? 'फिर कोशिश करें' : 'Try Again'}</span>
                  </button>
                )}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>

      {/* 3. Accessible Chat Input Area with Live Speech Recognition */}
      <div className="mt-3 bg-white border-2 border-[#DFF3E7] rounded-3xl p-3 sm:p-4 shadow-sm shrink-0 space-y-2">
        {/* Live Interim Transcript Badge while listening */}
        {micStatus === 'LISTENING' && (
          <div
            role="status"
            aria-live="polite"
            className="p-3 rounded-2xl bg-rose-50 border-2 border-rose-400 text-rose-900 font-bold text-sm flex items-center gap-2.5 animate-pulse"
          >
            <span className="w-3 h-3 rounded-full bg-rose-600 animate-ping shrink-0" />
            <span className="font-black">{isHindi ? 'सुन रही हूँ:' : 'Listening:'}</span>
            <span className="italic text-rose-950 font-semibold truncate">
              {interimTranscript || (isHindi ? 'बोलिए...' : 'Speak now...')}
            </span>
          </div>
        )}

        {/* Microphone Error Alert */}
        {micErrorMessage && micStatus === 'ERROR' && (
          <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 font-bold text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{micErrorMessage}</span>
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2 sm:gap-3"
        >
          {/* Large Accessible Microphone Button (Requirement 4, 5) */}
          <button
            type="button"
            onClick={handleToggleMicrophone}
            aria-label={
              micStatus === 'LISTENING'
                ? isHindi ? 'बोलना बंद करें' : 'Stop listening'
                : isHindi ? 'साथी से बोलकर बात करें' : 'Speak to Saathi'
            }
            title={
              micStatus === 'LISTENING'
                ? isHindi ? 'बोलना समाप्त करें' : 'Finish speaking'
                : isHindi ? 'माइक चालू करें और बोलें' : 'Tap to speak'
            }
            className={`tactile-btn min-w-[52px] min-h-[52px] sm:min-w-[60px] sm:min-h-[60px] rounded-2xl flex items-center justify-center cursor-pointer transition-all shadow-xs shrink-0 ${
              micStatus === 'LISTENING'
                ? 'bg-rose-600 hover:bg-rose-700 text-white border-3 border-rose-800 ring-4 ring-rose-300 animate-pulse'
                : micStatus === 'PROCESSING'
                  ? 'bg-amber-500 text-white border-2 border-amber-700'
                  : micStatus === 'ERROR'
                    ? 'bg-rose-100 text-rose-800 border-2 border-rose-400'
                    : 'bg-[#EAF7EF] hover:bg-[#DFF3E7] text-[#167A55] border-2 border-[#167A55]/30'
            }`}
          >
            {micStatus === 'LISTENING' ? (
              <Square className="w-6 h-6 fill-current text-white animate-bounce" />
            ) : micStatus === 'PROCESSING' ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <Mic className="w-6 h-6 sm:w-7 sm:h-7 stroke-[2.5]" />
            )}
          </button>

          {/* Multiline Input / Text Area */}
          <textarea
            ref={textareaRef}
            rows={1}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              micStatus === 'LISTENING'
                ? isHindi ? 'साथी सुन रही है...' : 'Saathi is listening...'
                : isHindi ? 'यहाँ संदेश लिखें या माइक दबाकर बोलें...' : 'Type a message or tap mic to speak...'
            }
            aria-label={isHindi ? 'साथी के लिए संदेश लिखें' : 'Type message for Saathi'}
            disabled={isLoading}
            className="flex-1 px-4 py-3 rounded-2xl bg-[#FBFAF4] border-2 border-[#DFF3E7] focus:border-[#167A55] focus:outline-none text-[#102A43] font-bold text-base sm:text-lg resize-none min-h-[52px] max-h-28"
          />

          {/* Send Button */}
          <button
            type="submit"
            disabled={isLoading || !inputText.trim()}
            aria-label={isHindi ? 'संदेश भेजें' : 'Send message'}
            className={`tactile-btn px-5 sm:px-6 py-3 sm:py-3.5 min-h-[52px] rounded-2xl font-black text-base sm:text-lg flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs shrink-0 ${
              isLoading || !inputText.trim()
                ? 'bg-slate-200 border-2 border-slate-300 text-slate-400 cursor-not-allowed'
                : 'bg-[#167A55] hover:bg-[#115C40] border-2 border-[#0D4E36] text-white active:scale-95'
            }`}
          >
            <Send className="w-5 h-5 stroke-[2.5]" />
            <span className="hidden sm:inline">{isHindi ? 'भेजें' : 'Send'}</span>
          </button>
        </form>

        {/* Non-clinical disclaimer footer */}
        <p className="mt-1 text-center text-[11px] sm:text-xs font-bold text-[#5D7184]">
          🌸 {isHindi
            ? 'साथी एक मित्रवत सहायक है। यह चिकित्सीय सलाह या रोग निदान का स्थान नहीं लेता।'
            : 'Saathi is a friendly companion for emotional wellbeing and memory support, not a medical diagnosis system.'}
        </p>
      </div>
    </div>
  );
}
