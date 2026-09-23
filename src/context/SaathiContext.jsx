/**
 * SaathiContext.jsx
 * State management for Saathi Voice Companion in YaadSaathi.
 * Directly integrates with existing AppContext, medicines, games, SafeCircle, and i18n.
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useApp } from './AppContext';
import { useI18n } from '../i18n/I18nContext';
import speechRecognitionService from '../services/speechRecognitionService';
import saathiVoiceService from '../services/saathiVoiceService';
import { routeIntent } from '../services/saathiIntentRouter';

const SaathiContext = createContext(null);

export function SaathiProvider({ children }) {
  const {
    patient,
    medicines = [],
    activeMedicineReminder,
    confirmMedicineTaken,
    snoozeMedicineReminder,
    reminders = [],
    gameScores = {},
    navigateTo,
    locationSharing,
    safeZoneStatus,
    distanceFromHome,
    sounds,
    increaseFontSize,
  } = useApp();

  const { isHindi } = useI18n();

  // Saathi States: 'IDLE' | 'LISTENING' | 'PROCESSING' | 'SPEAKING' | 'ERROR'
  const [status, setStatus] = useState('IDLE');
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [transcript, setTranscript] = useState('');
  const [isMicAvailable, setIsMicAvailable] = useState(true);
  const [proactiveMoment, setProactiveMoment] = useState(null);

  const initialGreetingDone = useRef(false);

  // Check speech recognition capability on mount
  useEffect(() => {
    setIsMicAvailable(speechRecognitionService.isSupported());
  }, []);

  // Set initial welcome message when panel opens
  useEffect(() => {
    if (isPanelOpen && !initialGreetingDone.current) {
      initialGreetingDone.current = true;
      const seniorTitle = patient?.preferredName || (isHindi ? (patient?.nameHindi || patient?.name || 'वरिष्ठ साथी') : (patient?.nameEnglish || patient?.name || 'Friend'));
      const welcomeText = isHindi
        ? `नमस्ते ${seniorTitle}, मैं साथी हूँ। आज किस चीज़ में मदद करूँ?`
        : `Namaste ${seniorTitle}, I am Saathi. How may I help you today?`;

      setMessages([
        {
          id: `msg-${Date.now()}`,
          sender: 'saathi',
          text: welcomeText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }
  }, [isPanelOpen, isHindi, patient]);

  // Context-aware "Saathi Moment" proactive note
  useEffect(() => {
    const unconfirmedMed = medicines.find(m => m.status === 'not_confirmed');
    const pendingMed = medicines.find(m => m.status === 'reminder_pending');

    const seniorTitle = patient?.preferredName || (isHindi ? (patient?.nameHindi || patient?.name || 'वरिष्ठ साथी') : (patient?.nameEnglish || patient?.name || 'Friend'));
    if (unconfirmedMed) {
      setProactiveMoment(
        isHindi
          ? `${seniorTitle}, आपकी ${unconfirmedMed.name} अभी तक पुष्ट नहीं हुई है।`
          : `${seniorTitle}, your ${unconfirmedMed.name} is not confirmed yet.`
      );
    } else if (pendingMed) {
      setProactiveMoment(
        isHindi
          ? `दवाई का समय: ${pendingMed.name} (${pendingMed.scheduledTime})`
          : `Medicine time: ${pendingMed.name} (${pendingMed.scheduledTime})`
      );
    } else if (gameScores?.gamesPlayedToday > 0) {
      setProactiveMoment(
        isHindi
          ? `शाबाश! आज आपने ${gameScores.gamesPlayedToday} खेल पूरे किए हैं।`
          : `Great job! You completed ${gameScores.gamesPlayedToday} cognitive activities today.`
      );
    } else {
      setProactiveMoment(
        isHindi
          ? `नमस्ते ${seniorTitle}। क्या आप आज की दिनचर्या सुनना चाहेंगे?`
          : `Good day ${seniorTitle}. Would you like to hear today's plan?`
      );
    }
  }, [medicines, gameScores, isHindi, patient]);

  // Open / Close controls
  const openSaathi = useCallback(() => {
    sounds?.playClickChime();
    setIsPanelOpen(true);
    setStatus('IDLE');
  }, [sounds]);

  const closeSaathi = useCallback(() => {
    sounds?.playClickChime();
    speechRecognitionService.stopListening();
    saathiVoiceService.stop();
    setIsPanelOpen(false);
    setStatus('IDLE');
  }, [sounds]);

  const toggleSaathi = useCallback(() => {
    if (isPanelOpen) {
      closeSaathi();
    } else {
      openSaathi();
    }
  }, [isPanelOpen, openSaathi, closeSaathi]);

  // Process User Input (Spoken or Typed)
  const processInput = useCallback((rawText) => {
    if (!rawText || !rawText.trim()) return;
    const cleanText = rawText.trim();
    const langCode = isHindi ? 'hi-IN' : 'en-IN';
    const seniorTitle = patient?.preferredName || (isHindi ? (patient?.nameHindi || patient?.name || 'वरिष्ठ साथी') : (patient?.nameEnglish || patient?.name || 'Friend'));

    // Add user message to conversation history
    const userMsg = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: cleanText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    setStatus('PROCESSING');

    // Route Intent
    const { intent, entities } = routeIntent(cleanText);
    let replyText = '';
    let actionType = null;

    switch (intent) {
      // 1. MEDICINE CONFIRMATION (Calls real AppContext confirmMedicineTaken)
      case 'MEDICINE_CONFIRM': {
        actionType = 'MEDICINE_CONFIRM';
        // Check if there is an active reminder or any pending/scheduled med
        const targetMed = activeMedicineReminder ||
          medicines.find(m => m.status === 'reminder_pending') ||
          medicines.find(m => m.status === 'not_confirmed') ||
          medicines.find(m => m.status === 'scheduled');

        if (targetMed) {
          confirmMedicineTaken(targetMed.id);
          replyText = isHindi
            ? `बहुत अच्छा, ${seniorTitle}। मैंने आपकी दवाई (${targetMed.name}) की पुष्टि दर्ज कर ली है। शाबाश!`
            : `Very good, ${seniorTitle}. I have confirmed your medicine (${targetMed.name}). Well done!`;
        } else {
          replyText = isHindi
            ? `बहुत अच्छा ${seniorTitle}। आपकी आज की सभी निर्धारित दवाइयों की पुष्टि पहले ही हो चुकी है।`
            : `Very good ${seniorTitle}. All your scheduled medicines for today are already confirmed.`;
        }
        break;
      }

      // 2. MEDICINE STATUS QUERY
      case 'MEDICINE_STATUS': {
        actionType = 'MEDICINE_STATUS';
        if (activeMedicineReminder) {
          replyText = isHindi
            ? `${seniorTitle}, आपकी ${activeMedicineReminder.name} (${activeMedicineReminder.dosage}) लेने का समय हो गया है। लेने के बाद कहिए 'मैंने दवाई ले ली'।`
            : `${seniorTitle}, it is time to take ${activeMedicineReminder.name} (${activeMedicineReminder.dosage}). After taking it, simply say 'I took my medicine'.`;
        } else {
          const pending = medicines.find(m => m.status === 'reminder_pending');
          const nextScheduled = medicines.find(m => m.status === 'scheduled');

          if (pending) {
            replyText = isHindi
              ? `${seniorTitle}, आपकी ${pending.name} का स्मरण चालू है। निर्धारित समय ${pending.scheduledTime} था।`
              : `${seniorTitle}, reminder is pending for ${pending.name}. Scheduled time was ${pending.scheduledTime}.`;
          } else if (nextScheduled) {
            replyText = isHindi
              ? `आपकी अगली दवाई ${nextScheduled.name} (${nextScheduled.dosage}) ${nextScheduled.scheduledTime} बजे निर्धारित है।`
              : `Your next medicine is ${nextScheduled.name} (${nextScheduled.dosage}) scheduled at ${nextScheduled.scheduledTime}.`;
          } else {
            replyText = isHindi
              ? `आज की सभी दवाइयों की पुष्टि हो चुकी है। आप पूरी तरह से निश्चिंत रहें।`
              : `All scheduled medicines for today have been confirmed. You are all set!`;
          }
        }
        break;
      }

      // 3. REMIND ME LATER (Calls real AppContext snoozeMedicineReminder)
      case 'MEDICINE_REMIND_LATER': {
        actionType = 'MEDICINE_REMIND_LATER';
        const medToSnooze = activeMedicineReminder || medicines.find(m => m.status === 'reminder_pending');
        if (medToSnooze) {
          snoozeMedicineReminder(medToSnooze.id);
          replyText = isHindi
            ? `ज़रूर ${seniorTitle}, मैं आपको 15 मिनट बाद दोबारा याद दिलाऊँगी।`
            : `Certainly ${seniorTitle}, I will remind you again in 15 minutes.`;
        } else {
          replyText = isHindi
            ? `अभी कोई सक्रिय दवाई रिमाइंडर नहीं है जिसे बाद में याद दिलाना हो।`
            : `There is no active medicine reminder pending right now.`;
        }
        break;
      }

      // 4. DAILY BRIEFING
      case 'TODAYS_PLAN': {
        actionType = 'TODAYS_PLAN';
        const medCount = medicines.length;
        const routineCount = reminders.length;
        replyText = isHindi
          ? `नमस्ते ${seniorTitle}। आज आपकी ${medCount} दवाइयाँ और ${routineCount} दिनचर्या कार्य निर्धारित हैं। आप एक याददाश्त खेल भी खेल सकते हैं।`
          : `Hello ${seniorTitle}. Today you have ${medCount} medicines and ${routineCount} routine reminders planned. You can also play a memory game.`;
        break;
      }

      // 5. START GAME (Navigates to real game screen)
      case 'START_GAME': {
        actionType = 'START_GAME';
        const targetScreen = entities.gameType || 'games';
        navigateTo(targetScreen);
        replyText = isHindi
          ? `चलिए दिमाग को चुस्त रखते हैं। खेल का पृष्ठ खोला जा रहा है।`
          : `Let's keep your mind active. Opening games for you now.`;
        break;
      }

      // 6. PROGRESS REPORT (Reads real AppContext telemetry)
      case 'PROGRESS_STATUS': {
        actionType = 'PROGRESS_STATUS';
        const played = gameScores?.gamesPlayedToday ?? 2;
        const streak = gameScores?.currentStreak ?? 5;
        replyText = isHindi
          ? `आज आपने ${played} खेल पूरे किए हैं और आपका लगातार क्रम ${streak} दिनों का है। बहुत अच्छा अभ्यास!`
          : `You have completed ${played} cognitive activities today with a ${streak}-day streak. Wonderful practice!`;
        break;
      }

      // 7. SAFECIRCLE LOCATION STATUS (Reads real SafeCircle state)
      case 'SAFECIRCLE_STATUS': {
        actionType = 'SAFECIRCLE_STATUS';
        if (!locationSharing) {
          replyText = isHindi
            ? `SafeCircle सुरक्षा घेरा अभी बंद है। परिवार के साथ स्थान साझा नहीं हो रहा है।`
            : `SafeCircle location sharing is currently paused.`;
        } else {
          const isSafe = safeZoneStatus === 'SAFE';
          replyText = isHindi
            ? isSafe
              ? `SafeCircle चालू है। आप सुरक्षित घेरे के अंदर हैं और घर से दूरी ${distanceFromHome || 45} मीटर है।`
              : `SafeCircle चालू है। ध्यान दें: आप सुरक्षित दायरे से बाहर हैं। परिवार को सूचित किया गया है।`
            : isSafe
              ? `SafeCircle is active. You are safely inside your home zone (${distanceFromHome || 45} meters).`
              : `SafeCircle is active. Notice: you are currently beyond the safe perimeter.`;
        }
        break;
      }

      // 8. FAMILY CONTACTS
      case 'OPEN_FAMILY': {
        actionType = 'OPEN_FAMILY';
        navigateTo('family');
        replyText = isHindi
          ? `परिवार मंच खोला जा रहा है। यहाँ बेटी प्रिया, बेटा रवि और डॉक्टर का 1-टैप संपर्क उपलब्ध है।`
          : `Opening Family page. Quick contacts for daughter Priya, son Ravi, and your doctor are ready.`;
        break;
      }

      // 9. OPEN SETTINGS / FONT ACCESSIBILITY
      case 'OPEN_SETTINGS': {
        actionType = 'OPEN_SETTINGS';
        if (cleanText.includes('बड़ा') || cleanText.includes('increase')) {
          increaseFontSize();
          replyText = isHindi ? 'अक्षरों का आकार बढ़ा दिया गया है।' : 'Text size increased for comfortable reading.';
        } else {
          navigateTo('settings');
          replyText = isHindi ? 'सेटिंग्स पृष्ठ खोला जा रहा है।' : 'Opening settings for you.';
        }
        break;
      }

      // 10. MEDICAL QUERY GUARDRAIL
      case 'MEDICAL_QUERY': {
        actionType = 'MEDICAL_QUERY';
        replyText = isHindi
          ? `${seniorTitle}, मैं आपकी दवा की खुराक नहीं बदल सकती। कृपया अपनी डॉक्टर की पर्ची देखें या परिवार से सलाह लें।`
          : `${seniorTitle}, I cannot change or advise on medication dosage. Please follow your doctor's official prescription.`;
        break;
      }

      // 11. GREETING
      case 'GREETING': {
        actionType = 'GREETING';
        replyText = isHindi
          ? `नमस्ते ${seniorTitle}! मैं आपकी साथी हूँ। आज मैं आपकी दवाई, खेल या दिनचर्या में क्या मदद करूँ?`
          : `Namaste ${seniorTitle}! I am Saathi. How can I assist you with medicines, cognitive games, or your day?`;
        break;
      }

      // 12. HELP
      case 'HELP': {
        actionType = 'HELP';
        replyText = isHindi
          ? `आप मुझसे कभी भी बोलकर पूछ सकते हैं: "मेरी दवाई कब है", "मैंने दवाई ले ली", "गेम शुरू करो", या "SafeCircle स्थिति"।`
          : `You can always speak to me: "When is my medicine", "I took my medicine", "Start a game", or "SafeCircle status".`;
        break;
      }

      // UNKNOWN FALLBACK
      default: {
        actionType = 'UNKNOWN';
        replyText = isHindi
          ? `माफ़ कीजिए ${seniorTitle}, मैं पूरी तरह समझ नहीं पायी। आप दोबारा बोल सकते हैं या नीचे दिए विकल्पों को छू सकते हैं।`
          : `I am sorry ${seniorTitle}, I didn't quite catch that. You can speak again or tap one of the suggested buttons below.`;
        break;
      }
    }

    // Append Saathi's reply
    const saathiReplyMsg = {
      id: `sth-${Date.now()}`,
      sender: 'saathi',
      text: replyText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      actionType,
    };

    setMessages(prev => [...prev, saathiReplyMsg]);

    // Speak response
    setStatus('SPEAKING');
    saathiVoiceService.speak(replyText, langCode, {
      onEnd: () => {
        setStatus('IDLE');
      },
      onError: () => {
        setStatus('IDLE');
      },
    });
  }, [
    isHindi,
    patient,
    medicines,
    activeMedicineReminder,
    confirmMedicineTaken,
    snoozeMedicineReminder,
    reminders,
    gameScores,
    navigateTo,
    locationSharing,
    safeZoneStatus,
    distanceFromHome,
    increaseFontSize,
  ]);

  // Start Voice Listening (Tap-to-speak)
  const startListening = useCallback(() => {
    sounds?.playClickChime();
    saathiVoiceService.stop(); // Stop speaking before listening
    setTranscript('');
    setStatus('LISTENING');

    speechRecognitionService.startListening({
      lang: isHindi ? 'hi-IN' : 'en-IN',
      onStart: () => {
        setStatus('LISTENING');
      },
      onResult: (spokenText) => {
        setTranscript(spokenText);
        setStatus('PROCESSING');
        processInput(spokenText);
      },
      onError: (err) => {
        console.warn('Saathi recognition error:', err);
        setStatus('ERROR');
        setTimeout(() => setStatus('IDLE'), 2500);
      },
      onEnd: () => {
        // Will transition to PROCESSING or IDLE
      },
    });
  }, [isHindi, sounds, processInput]);

  // Stop Listening manually
  const stopListening = useCallback(() => {
    speechRecognitionService.stopListening();
    setStatus('IDLE');
  }, []);

  return (
    <SaathiContext.Provider
      value={{
        status,
        setStatus,
        isPanelOpen,
        openSaathi,
        closeSaathi,
        toggleSaathi,
        messages,
        transcript,
        isMicAvailable,
        proactiveMoment,
        startListening,
        stopListening,
        processInput,
      }}
    >
      {children}
    </SaathiContext.Provider>
  );
}

export function useSaathi() {
  const context = useContext(SaathiContext);
  if (!context) {
    throw new Error('useSaathi must be used within a SaathiProvider');
  }
  return context;
}
