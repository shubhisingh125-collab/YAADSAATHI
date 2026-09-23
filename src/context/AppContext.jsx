import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  INITIAL_PATIENT_PROFILE,
  INITIAL_REMINDERS,
  CAREGIVER_METRICS,
  INITIAL_MEDICINES,
  INITIAL_MEDICINE_HISTORY,
} from '../data/mockData';
import { useVoiceGuidance } from '../hooks/useVoiceGuidance';
import { useSoundEffects } from '../hooks/useSoundEffects';
import {
  DEFAULT_HOME,
  SAFE_RADIUS_METERS,
  calculateDistance,
  getSafeZoneStatus,
  requestElderlyLocation,
} from '../services/locationService';
import { useI18n } from '../i18n/I18nContext';
import { calculateAdaptiveDifficulty } from '../logic/adaptiveEngine';
import { useAuth } from './AuthContext';
import { setActiveLocalUserId } from '../services/gamePersistenceService';

const AppContext = createContext(null);

export const FONT_SCALES = [0.90, 1.00, 1.15, 1.30];

export function AppProvider({ children }) {
  // Splash and Onboarding States
  const [showSplash, setShowSplash] = useState(() => {
    return localStorage.getItem('yaadsaathi_splash_dismissed') !== 'true';
  });

  const [showLanguageModal, setShowLanguageModal] = useState(false);

  // Navigation Screen State
  const [currentScreen, setCurrentScreen] = useState('home');

  // Font Scale: 0.90 (Small), 1.00 (Normal), 1.15 (Large), 1.30 (Extra Large)
  const [fontScale, setFontScale] = useState(() => {
    const saved = localStorage.getItem('yaadsaathi_font_scale');
    if (saved !== null) {
      const num = Number(saved);
      if (FONT_SCALES.includes(num)) return num;
    }
    // Backward compatibility with previous level index (0, 1, 2)
    const oldLevel = localStorage.getItem('yaadsaathi_font_level');
    if (oldLevel !== null) {
      const idx = Number(oldLevel);
      if (idx === 0) return 0.90;
      if (idx === 1) return 1.00;
      if (idx === 2) return 1.15;
    }
    return 1.00; // Default 100% normal
  });

  // Apply CSS variable to document root globally
  useEffect(() => {
    document.documentElement.style.setProperty('--app-font-scale', String(fontScale));
    localStorage.setItem('yaadsaathi_font_scale', String(fontScale));
  }, [fontScale]);

  // Patient Profile
  const auth = useAuth();
  const [patient, setPatient] = useState(() => {
    const saved = localStorage.getItem('yaadsaathi_patient');
    return saved ? JSON.parse(saved) : INITIAL_PATIENT_PROFILE;
  });

  // Keep patient profile synchronized with active Supabase Auth user profile
  useEffect(() => {
    if (auth?.user) {
      setActiveLocalUserId(auth.user.id);
    } else {
      setActiveLocalUserId('guest-elder-local');
    }

    if (auth?.profile) {
      const p = auth.profile;
      const displayName = p.display_name || p.name || '';
      const preferredName = p.preferred_name || displayName;
      if (displayName) {
        setPatient((prev) => ({
          ...prev,
          id: p.user_id || auth.user?.id || prev.id,
          name: displayName,
          nameEnglish: displayName,
          nameHindi: displayName,
          preferredName: preferredName || displayName,
          age: p.age || prev.age || 70,
          stateOrRegion: p.state_or_region || prev.stateOrRegion || 'ASSAM',
          primaryLanguage: p.preferred_language || prev.primaryLanguage || 'hi',
          homeAddress: p.home_address || prev.homeAddress,
          homeAddressEnglish: p.home_address || prev.homeAddressEnglish,
          homeAddressHindi: p.home_address || prev.homeAddressHindi,
          emergencyContact: p.emergency_contact || prev.emergencyContact,
          doctorContact: p.doctor_contact || prev.doctorContact,
        }));
      }
    }
  }, [auth?.user, auth?.profile]);

  // Step Tracker State (Mock demo data stored locally)
  const [stepsToday, setStepsToday] = useState(() => {
    const saved = localStorage.getItem('yaadsaathi_steps') || localStorage.getItem('yaadsaathi_steps_today');
    return saved ? Number(saved) : 2435;
  });
  const stepsGoal = 5000;

  useEffect(() => {
    localStorage.setItem('yaadsaathi_steps', String(stepsToday));
  }, [stepsToday]);

  // Reminders List
  const [reminders, setReminders] = useState(() => {
    const saved = localStorage.getItem('yaadsaathi_reminders');
    return saved ? JSON.parse(saved) : INITIAL_REMINDERS;
  });

  // Today's Mood Check-in
  const [todayMood, setTodayMood] = useState(() => {
    return localStorage.getItem('yaadsaathi_mood') || 'happy';
  });

  // Adaptive Difficulty Level (1 to 5)
  const [cognitiveDifficulty, setCognitiveDifficulty] = useState(() => {
    const saved = localStorage.getItem('yaadsaathi_cognitive_difficulty');
    return saved ? Number(saved) : 3;
  });

  // Overall Game Scores & Telemetry
  const [gameScores, setGameScores] = useState(() => {
    const saved = localStorage.getItem('yaadsaathi_game_scores');
    return saved
      ? JSON.parse(saved)
      : {
          memoryMatchWins: 5,
          patternStreak: 4,
          wordRecallStars: 6,
          pictureRecallStars: 5,
          totalStars: 20,
          currentStreak: 5,
          gamesPlayedToday: 2,
        };
  });

  // Emergency SOS Modal
  const [sosModalOpen, setSosModalOpen] = useState(false);

  // SafeCircle Feature State
  const [locationSharing, setLocationSharing] = useState(() => {
    const saved = localStorage.getItem('yaadsaathi_location_sharing');
    return saved !== null ? saved === 'true' : true;
  });

  const [isSimulatingOutside, setIsSimulatingOutside] = useState(false);
  const [userLocation, setUserLocation] = useState(() => ({
    lat: DEFAULT_HOME.lat + 0.0003, // ~45 meters from home inside safe zone
    lng: DEFAULT_HOME.lng + 0.0002,
    address: '12-B, हजरतगंज, लखनऊ (Hazratganj, Lucknow)',
    isDemo: true,
    lastUpdated: 'अभी-अभी (Just now)',
  }));

  const distanceFromHome = calculateDistance(
    DEFAULT_HOME.lat,
    DEFAULT_HOME.lng,
    userLocation.lat,
    userLocation.lng
  );

  const safeZoneStatus = getSafeZoneStatus(distanceFromHome, SAFE_RADIUS_METERS);

  // Audio Hooks (voice guidance always speaks in the app's currently selected language)
  const { language } = useI18n();
  const voice = useVoiceGuidance(language);
  const sounds = useSoundEffects();

  // =========================================================================
  // COGNITIVE GAME RESULTS & ADAPTIVE DIFFICULTY (shared across all 4 games)
  // =========================================================================
  // Rolling window of the last few game results, used to smooth adaptive
  // difficulty changes so a single lucky/unlucky attempt doesn't swing the
  // level dramatically (Requirement: stable, explainable difficulty changes).
  const [recentGameResults, setRecentGameResults] = useState(() => {
    try {
      const saved = localStorage.getItem('yaadsaathi_recent_results');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('yaadsaathi_recent_results', JSON.stringify(recentGameResults));
  }, [recentGameResults]);

  // Requirement 20-style daily reset for "games played today" (mirrors the medicine reset)
  useEffect(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const lastPlayDate = localStorage.getItem('yaadsaathi_gameplay_date');
    if (lastPlayDate && lastPlayDate !== todayStr) {
      setGameScores((prev) => ({ ...prev, gamesPlayedToday: 0 }));
    }
    localStorage.setItem('yaadsaathi_gameplay_date', todayStr);
  }, []);

  /**
   * Records the completion of any cognitive game: updates score totals,
   * saves the result into the rolling performance history, and computes the
   * next adaptive difficulty level from a smoothed (multi-session) average
   * rather than a single attempt. Returns the adaptive-engine recommendation
   * so the calling game can display/speak it immediately.
   */
  const recordGameResult = useCallback(
    ({ game, accuracy, averageResponseTime, starsEarned = 1, scoreUpdater }) => {
      sounds.playSuccessChime();

      const thisResult = {
        game,
        accuracy: Number(accuracy) || 0,
        averageResponseTime: Number(averageResponseTime) || 0,
        timestamp: Date.now(),
      };
      const nextResults = [thisResult, ...recentGameResults].slice(0, 5);
      setRecentGameResults(nextResults);

      // Smooth over the last up to 3 sessions (including this one) for stability
      const sampleWindow = nextResults.slice(0, 3);
      const avgAccuracy =
        sampleWindow.reduce((sum, r) => sum + r.accuracy, 0) / sampleWindow.length;
      const avgResponseTime =
        sampleWindow.reduce((sum, r) => sum + r.averageResponseTime, 0) / sampleWindow.length;

      const adaptive = calculateAdaptiveDifficulty({
        accuracy: avgAccuracy,
        averageResponseTime: avgResponseTime,
        currentDifficulty: cognitiveDifficulty,
      });
      setCognitiveDifficulty(adaptive.nextDifficulty);

      setGameScores((prev) => ({
        ...prev,
        ...(typeof scoreUpdater === 'function' ? scoreUpdater(prev) : {}),
        totalStars: (prev.totalStars || 0) + starsEarned,
        gamesPlayedToday: (prev.gamesPlayedToday || 0) + 1,
        currentStreak: (prev.currentStreak || 0) + 1,
      }));

      return adaptive;
    },
    [recentGameResults, cognitiveDifficulty, sounds]
  );

  // =========================================================================
  // MEDICINE REMINDER & CAREGIVER ESCALATION SYSTEM (Requirements 1-15, 19-22)
  // =========================================================================
  const [medicines, setMedicines] = useState(() => {
    const saved = localStorage.getItem('yaadsaathi_medicines');
    return saved ? JSON.parse(saved) : INITIAL_MEDICINES;
  });

  const [medicineHistory, setMedicineHistory] = useState(() => {
    const saved = localStorage.getItem('yaadsaathi_medicine_history');
    return saved ? JSON.parse(saved) : INITIAL_MEDICINE_HISTORY;
  });

  const [activeMedicineReminder, setActiveMedicineReminder] = useState(null);

  const [caregiverMedicineAlerts, setCaregiverMedicineAlerts] = useState(() => {
    const saved = localStorage.getItem('yaadsaathi_caregiver_medicine_alerts');
    return saved ? JSON.parse(saved) : [];
  });

  // Save Medicines to localStorage
  useEffect(() => {
    localStorage.setItem('yaadsaathi_medicines', JSON.stringify(medicines));
  }, [medicines]);

  useEffect(() => {
    localStorage.setItem('yaadsaathi_medicine_history', JSON.stringify(medicineHistory));
  }, [medicineHistory]);

  useEffect(() => {
    localStorage.setItem('yaadsaathi_caregiver_medicine_alerts', JSON.stringify(caregiverMedicineAlerts));
  }, [caregiverMedicineAlerts]);

  // Requirement 20: Daily Reset
  useEffect(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const lastRecordedDate = localStorage.getItem('yaadsaathi_medicine_date');
    if (lastRecordedDate && lastRecordedDate !== todayStr) {
      setMedicines((prev) =>
        prev.map((med) => ({
          ...med,
          status: 'SCHEDULED',
          confirmedAt: null,
          lastReminderAt: null,
          firstReminderAt: null,
          caregiverAlertSent: false,
          snoozeCount: 0,
        }))
      );
    }
    localStorage.setItem('yaadsaathi_medicine_date', todayStr);
  }, []);

  // Browser Notification & Voice Trigger Helper
  const triggerMedicineNotification = useCallback(
    (med) => {
      setActiveMedicineReminder(med);

      const elderNameEn = patient.preferredName || patient.nameEnglish || patient.name || 'Friend';
      const elderNameHi = patient.preferredName || patient.nameHindi || patient.name || 'वरिष्ठ सदस्य';

      // Browser Notification (Requirement 14)
      if (typeof window !== 'undefined' && 'Notification' in window) {
        if (Notification.permission === 'granted') {
          try {
            new Notification('YaadSaathi Medicine Reminder', {
              body: `${elderNameEn}, it is time to take your ${med.name} (${med.dosage}).`,
              icon: '/favicon.ico',
            });
          } catch (e) {}
        } else if (Notification.permission !== 'denied') {
          Notification.requestPermission().then((perm) => {
            if (perm === 'granted') {
              try {
                new Notification('YaadSaathi Medicine Reminder', {
                  body: `${elderNameEn}, it is time to take your ${med.name} (${med.dosage}).`,
                  icon: '/favicon.ico',
                });
              } catch (err) {}
            }
          });
        }
      }

      // Voice Reminder (Requirement 16)
      voice.speak(
        `${elderNameHi}, आपकी दवाई लेने का समय हो गया है। कृपया दवाई लेने के बाद 'मैंने दवाई ले ली' बटन दबाएं।`,
        `${elderNameEn}, it is time to take your medicine. Please press 'I Took My Medicine' after taking it.`
      );
    },
    [patient, voice]
  );

  // Caregiver Escalation Alert Trigger (Requirement 9 & 10: No duplicate alerts)
  const triggerCaregiverEscalation = useCallback(
    (med) => {
      const alertObj = {
        id: `med-alert-${med.id}-${Date.now()}`,
        medicineId: med.id,
        medicineName: med.name,
        dosage: med.dosage,
        scheduledTime: med.scheduledTime,
        status: 'NOT_CONFIRMED',
        alertTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        patientName: patient.nameHindi || 'दामोदर जी शर्मा',
      };
      setCaregiverMedicineAlerts((prev) => {
        // Requirement 10: Prevent duplicate alerts for the same medicine dose
        if (prev.some((a) => a.medicineId === med.id)) return prev;
        return [alertObj, ...prev];
      });
      sounds.playEncouragementChime();
    },
    [patient, sounds]
  );

  // Periodic Reminder Engine (Requirements 5, 7, 8, 9, 10, 11)
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const currentHours = String(now.getHours()).padStart(2, '0');
      const currentMinutes = String(now.getMinutes()).padStart(2, '0');
      const currentTimeStr = `${currentHours}:${currentMinutes}`;
      const nowMs = Date.now();

      setMedicines((prevMeds) => {
        let changed = false;
        const updated = prevMeds.map((med) => {
          if (!med.active) return med;

          // 1. Check SCHEDULED -> REMINDER_PENDING
          if (med.status === 'SCHEDULED') {
            if (currentTimeStr >= med.scheduledTime) {
              changed = true;
              triggerMedicineNotification(med);
              return {
                ...med,
                status: 'REMINDER_PENDING',
                firstReminderAt: nowMs,
                lastReminderAt: nowMs,
                snoozeCount: 0,
              };
            }
          }

          // 2. Check REMINDER_PENDING -> Escalation or Interval Snooze
          if (med.status === 'REMINDER_PENDING') {
            const firstAt = med.firstReminderAt || nowMs;
            const elapsedMinutes = (nowMs - firstAt) / 60000;
            const escalationLimit = med.escalationAfterMinutes || 60;

            if (elapsedMinutes >= escalationLimit) {
              // Escalate to Caregiver
              changed = true;
              if (!med.caregiverAlertSent) {
                triggerCaregiverEscalation(med);
              }
              return {
                ...med,
                status: 'NOT_CONFIRMED',
                caregiverAlertSent: true,
              };
            } else {
              const lastAt = med.lastReminderAt || firstAt;
              const repeatElapsed = (nowMs - lastAt) / 60000;
              const intervalLimit = med.reminderIntervalMinutes || 15;

              if (repeatElapsed >= intervalLimit) {
                changed = true;
                triggerMedicineNotification(med);
                return {
                  ...med,
                  lastReminderAt: nowMs,
                  snoozeCount: (med.snoozeCount || 0) + 1,
                };
              }
            }
          }

          return med;
        });

        return changed ? updated : prevMeds;
      });
    }, 10000); // Poll every 10 seconds

    return () => clearInterval(timer);
  }, [triggerMedicineNotification, triggerCaregiverEscalation]);

  // Requirement 6: "I TOOK MY MEDICINE" button action
  const confirmMedicineTaken = (medicineId) => {
    sounds.playSuccessChime();
    const confirmedTimeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const todayDateStr = new Date().toLocaleDateString('hi-IN', { day: 'numeric', month: 'short' });

    setMedicines((prev) => {
      const med = prev.find((m) => m.id === medicineId);
      if (med) {
        const historyItem = {
          id: `hist-${Date.now()}`,
          date: todayDateStr,
          medicineId: med.id,
          medicineName: med.name,
          dosage: med.dosage,
          scheduledTime: med.scheduledTime,
          status: 'TAKEN',
          confirmedAt: confirmedTimeStr,
        };
        setMedicineHistory((hPrev) => [historyItem, ...hPrev]);
      }
      return prev.map((m) => {
        if (m.id === medicineId) {
          return {
            ...m,
            status: 'TAKEN',
            confirmedAt: confirmedTimeStr,
          };
        }
        return m;
      });
    });

    // Remove any caregiver alerts for this dose
    setCaregiverMedicineAlerts((prev) => prev.filter((a) => a.medicineId !== medicineId));

    // Dismiss active modal
    setActiveMedicineReminder((prev) => (prev && prev.id === medicineId ? null : prev));

    voice.speak(
      'दवाई लेने की पुष्टि हो गई है। बहुत बढ़िया!',
      'Medicine confirmed. Thank you.'
    );
  };

  // Requirement 8: "REMIND ME LATER" button action
  const snoozeMedicineReminder = (medicineId) => {
    sounds.playClickChime();
    const nowMs = Date.now();
    setMedicines((prev) =>
      prev.map((m) => {
        if (m.id === medicineId) {
          return {
            ...m,
            status: 'REMINDER_PENDING',
            lastReminderAt: nowMs,
            firstReminderAt: m.firstReminderAt || nowMs,
          };
        }
        return m;
      })
    );
    setActiveMedicineReminder(null);
    voice.speak(
      'ठीक है, 15 मिनट बाद दोबारा याद दिलाएंगे।',
      'Understood. We will remind you again in 15 minutes.'
    );
  };

  // Requirement 4: Add / Edit / Delete Medicine
  const addMedicine = (newMed) => {
    sounds.playSuccessChime();
    const medObj = {
      id: `med-${Date.now()}`,
      name: newMed.name,
      dosage: newMed.dosage || '1 tablet',
      instructions: newMed.instructions || 'After meals',
      scheduledTime: newMed.scheduledTime || '08:00',
      frequency: newMed.frequency || 'Daily',
      active: true,
      reminderIntervalMinutes: Number(newMed.reminderIntervalMinutes) || 15,
      escalationAfterMinutes: Number(newMed.escalationAfterMinutes) || 60,
      status: 'SCHEDULED',
      lastReminderAt: null,
      firstReminderAt: null,
      confirmedAt: null,
      caregiverAlertSent: false,
      snoozeCount: 0,
    };
    setMedicines((prev) => [...prev, medObj]);
    voice.speak('नई दवाई सफलता पूर्वक जोड़ दी गई है।', 'New medicine added successfully.');
  };

  const updateMedicine = (id, updatedFields) => {
    sounds.playSuccessChime();
    setMedicines((prev) =>
      prev.map((m) => (m.id === id ? { ...m, ...updatedFields } : m))
    );
  };

  const deleteMedicine = (id) => {
    sounds.playClickChime();
    setMedicines((prev) => prev.filter((m) => m.id !== id));
    setCaregiverMedicineAlerts((prev) => prev.filter((a) => a.medicineId !== id));
  };

  const dismissCaregiverAlert = (alertId) => {
    sounds.playClickChime();
    setCaregiverMedicineAlerts((prev) => prev.filter((a) => a.id !== alertId));
  };

  // Requirement 15: Demo / Simulation Controls
  const simulateTriggerReminder = (medicineId) => {
    sounds.playClickChime();
    const nowMs = Date.now();
    setMedicines((prev) =>
      prev.map((m) => {
        if (m.id === medicineId) {
          const updated = {
            ...m,
            status: 'REMINDER_PENDING',
            firstReminderAt: nowMs,
            lastReminderAt: nowMs,
            caregiverAlertSent: false,
          };
          triggerMedicineNotification(updated);
          return updated;
        }
        return m;
      })
    );
  };

  const simulateSnooze15 = (medicineId) => {
    sounds.playClickChime();
    const nowMs = Date.now();
    setMedicines((prev) =>
      prev.map((m) => {
        if (m.id === medicineId) {
          const updated = {
            ...m,
            status: 'REMINDER_PENDING',
            firstReminderAt: m.firstReminderAt || (nowMs - 16 * 60000),
            lastReminderAt: nowMs - 16 * 60000,
          };
          triggerMedicineNotification(updated);
          return updated;
        }
        return m;
      })
    );
  };

  const simulateEscalate60 = (medicineId) => {
    sounds.playClickChime();
    const nowMs = Date.now();
    setMedicines((prev) =>
      prev.map((m) => {
        if (m.id === medicineId) {
          const updated = {
            ...m,
            status: 'NOT_CONFIRMED',
            firstReminderAt: nowMs - 61 * 60000,
            caregiverAlertSent: true,
          };
          triggerCaregiverEscalation(updated);
          return updated;
        }
        return m;
      })
    );
  };

  // Save changes
  useEffect(() => {
    localStorage.setItem('yaadsaathi_patient', JSON.stringify(patient));
  }, [patient]);

  useEffect(() => {
    localStorage.setItem('yaadsaathi_reminders', JSON.stringify(reminders));
  }, [reminders]);

  useEffect(() => {
    localStorage.setItem('yaadsaathi_mood', todayMood);
  }, [todayMood]);

  useEffect(() => {
    localStorage.setItem('yaadsaathi_cognitive_difficulty', String(cognitiveDifficulty));
  }, [cognitiveDifficulty]);

  useEffect(() => {
    localStorage.setItem('yaadsaathi_game_scores', JSON.stringify(gameScores));
  }, [gameScores]);

  // Navigate Screen Helper
  const navigateTo = (screen) => {
    sounds.playClickChime();
    setCurrentScreen(screen);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Font Size Steppers (A-, A, A+)
  const decreaseFontSize = () => {
    sounds.playClickChime();
    setFontScale((prev) => {
      const idx = FONT_SCALES.indexOf(prev);
      if (idx > 0) return FONT_SCALES[idx - 1];
      if (idx === -1) {
        const smaller = FONT_SCALES.filter((s) => s < prev);
        return smaller.length > 0 ? smaller[smaller.length - 1] : FONT_SCALES[0];
      }
      return FONT_SCALES[0]; // Min 0.90
    });
  };

  const resetFontSize = () => {
    sounds.playClickChime();
    setFontScale(1.00); // 100%
  };

  const increaseFontSize = () => {
    sounds.playClickChime();
    setFontScale((prev) => {
      const idx = FONT_SCALES.indexOf(prev);
      if (idx !== -1 && idx < FONT_SCALES.length - 1) return FONT_SCALES[idx + 1];
      if (idx === -1) {
        const larger = FONT_SCALES.filter((s) => s > prev);
        return larger.length > 0 ? larger[0] : FONT_SCALES[FONT_SCALES.length - 1];
      }
      return FONT_SCALES[FONT_SCALES.length - 1]; // Max 1.30
    });
  };

  // Backward-compatible setFontSize function
  const setFontSize = (scaleOrLevel) => {
    sounds.playClickChime();
    if (typeof scaleOrLevel === 'number') {
      if (FONT_SCALES.includes(scaleOrLevel)) {
        setFontScale(scaleOrLevel);
      } else if (scaleOrLevel >= 0 && scaleOrLevel <= 3) {
        // Index mapping: 0 -> 0.90, 1 -> 1.00, 2 -> 1.15, 3 -> 1.30
        setFontScale(FONT_SCALES[scaleOrLevel] || 1.00);
      }
    }
  };

  // Step Tracker Functions
  const addSteps = (amount = 500) => {
    sounds.playSuccessChime();
    setStepsToday((prev) => Math.min(prev + amount, stepsGoal + 5000));
  };

  const resetSteps = () => {
    sounds.playClickChime();
    setStepsToday(0);
  };

  // SafeCircle Toggles
  const toggleLocationSharing = (forceValue) => {
    sounds.playClickChime();
    setLocationSharing((prev) => {
      const next = typeof forceValue === 'boolean' ? forceValue : !prev;
      localStorage.setItem('yaadsaathi_location_sharing', String(next));
      return next;
    });
  };

  const toggleSimulateOutside = () => {
    sounds.playClickChime();
    setIsSimulatingOutside((prev) => {
      const next = !prev;
      if (next) {
        // Simulate outside safe zone (~750m away from Hazratganj)
        setUserLocation({
          lat: DEFAULT_HOME.lat + 0.0062,
          lng: DEFAULT_HOME.lng + 0.0041,
          address: 'हजरतगंज चौराहे के आगे, गोमती तट मार्ग (Beyond Hazratganj, Gomti Riverside)',
          isDemo: true,
          lastUpdated: 'अभी-अभी (Just now)',
        });
      } else {
        // Simulate inside safe zone (~45m from home)
        setUserLocation({
          lat: DEFAULT_HOME.lat + 0.0003,
          lng: DEFAULT_HOME.lng + 0.0002,
          address: '12-B, हजरतगंज, लखनऊ (Hazratganj, Lucknow)',
          isDemo: true,
          lastUpdated: 'अभी-अभी (Just now)',
        });
      }
      return next;
    });
  };

  // Request actual device location if permitted
  const fetchLiveLocation = async () => {
    const loc = await requestElderlyLocation();
    setUserLocation({
      lat: loc.lat,
      lng: loc.lng,
      address: loc.address || 'सक्रिय जीपीएस लोकेशन (Live GPS Location)',
      isDemo: loc.isDemo,
      lastUpdated: 'अभी-अभी (Just now)',
    });
    return loc;
  };

  // Dismiss Splash
  const completeSplash = () => {
    sounds.playClickChime();
    setShowSplash(false);
    setShowLanguageModal(true);
    localStorage.setItem('yaadsaathi_splash_dismissed', 'true');
  };

  const skipSplash = () => {
    sounds.playClickChime();
    setShowSplash(false);
    setShowLanguageModal(false);
    localStorage.setItem('yaadsaathi_splash_dismissed', 'true');
  };

  // Add a new custom routine reminder
  const addReminder = (newItem) => {
    sounds.playSuccessChime();
    setReminders((prev) => [...prev, newItem]);
  };

  // Delete a routine reminder
  const deleteReminder = (id) => {
    sounds.playClickChime();
    setReminders((prev) => prev.filter((item) => item.id !== id));
  };

  // Toggle Reminder completion
  const toggleReminder = (id) => {
    setReminders((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const nextCompleted = !item.completed;
          if (nextCompleted) {
            sounds.playSuccessChime();
            voice.speak(
              'शाबाश! आपने यह कार्य पूरा कर लिया है।',
              'Wonderful! You marked this task as complete.'
            );
          } else {
            sounds.playClickChime();
          }
          return { ...item, completed: nextCompleted };
        }
        return item;
      })
    );
  };

  // Record Mood Check-in
  const recordMood = (moodKey) => {
    setTodayMood(moodKey);
    sounds.playSuccessChime();
    if (moodKey === 'happy') {
      voice.speak(
        'यह जानकर बहुत खुशी हुई कि आप आज प्रसन्न हैं! चलिए साथ मिलकर खेलें।',
        'So happy to know you feel good today! Let us play together.'
      );
    } else if (moodKey === 'okay') {
      voice.speak(
        'नमस्ते! आपका दिन शुभ और सुखद हो। थोड़ा पानी पिएं और विश्राम करें।',
        'Hello! Wishing you a peaceful day. Please drink some water and rest.'
      );
    } else {
      voice.speak(
        'हम सब आपके साथ हैं। क्या आप अपने परिवार से बात करना चाहते हैं?',
        'We are with you. Would you like to talk to your family?'
      );
    }
  };

  // Reset Prototype Data
  const resetAllData = () => {
    sounds.playClickChime();
    localStorage.clear();
    setReminders(INITIAL_REMINDERS);
    setPatient(INITIAL_PATIENT_PROFILE);
    setStepsToday(2435);
    setFontScale(1.00);
    setLocationSharing(true);
    setIsSimulatingOutside(false);
    setGameScores({
      memoryMatchWins: 5,
      patternStreak: 4,
      wordRecallStars: 6,
      pictureRecallStars: 5,
      totalStars: 20,
      currentStreak: 5,
      gamesPlayedToday: 2,
    });
    setCognitiveDifficulty(3);
    setRecentGameResults([]);
    setShowSplash(false);
    setShowLanguageModal(false);
    voice.speak('सभी डेटा रीसेट कर दिया गया है।', 'All data has been reset to defaults.');
  };

  return (
    <AppContext.Provider
      value={{
        showSplash,
        completeSplash,
        skipSplash,
        showLanguageModal,
        setShowLanguageModal,
        currentScreen,
        navigateTo,
        fontScale,
        setFontScale,
        decreaseFontSize,
        resetFontSize,
        increaseFontSize,
        fontSizeLevel: FONT_SCALES.indexOf(fontScale) >= 0 ? FONT_SCALES.indexOf(fontScale) : 1,
        setFontSize,
        patient,
        setPatient,
        stepsToday,
        stepsGoal,
        addSteps,
        resetSteps,
        reminders,
        toggleReminder,
        addReminder,
        deleteReminder,
        todayMood,
        recordMood,
        cognitiveDifficulty,
        setCognitiveDifficulty,
        gameScores,
        setGameScores,
        recentGameResults,
        recordGameResult,
        sosModalOpen,
        setSosModalOpen,
        // SafeCircle
        locationSharing,
        toggleLocationSharing,
        userLocation,
        homeLocation: DEFAULT_HOME,
        safeRadius: SAFE_RADIUS_METERS,
        distanceFromHome,
        safeZoneStatus,
        isSimulatingOutside,
        toggleSimulateOutside,
        fetchLiveLocation,
        // Audio & Telemetry
        voice,
        sounds,
        resetAllData,
        caregiverMetrics: CAREGIVER_METRICS,
        // Medicine Reminder & Caregiver Escalation System
        medicines,
        medicineHistory,
        activeMedicineReminder,
        setActiveMedicineReminder,
        caregiverMedicineAlerts,
        confirmMedicineTaken,
        snoozeMedicineReminder,
        addMedicine,
        updateMedicine,
        deleteMedicine,
        dismissCaregiverAlert,
        simulateTriggerReminder,
        simulateSnooze15,
        simulateEscalate60,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
