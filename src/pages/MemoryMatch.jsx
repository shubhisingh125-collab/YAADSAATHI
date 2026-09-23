import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { CheckCircle2, History } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useI18n } from '../i18n/I18nContext';
import { MEMORY_CARDS_CATALOG } from '../data/mockData';
import VoiceButton from '../components/VoiceButton';
import GameTopBar from '../components/games/GameTopBar';
import AdaptiveDifficultyCard from '../components/games/AdaptiveDifficultyCard';
import GameCompletionActions from '../components/games/GameCompletionActions';
import { DIFFICULTY_LABELS } from '../logic/adaptiveEngine';
import * as gamePersistenceService from '../services/gamePersistenceService';
import { CognitiveDomain } from '../domain/cognitive/cognitiveTypes';

const THEME = { bg: '#FFE8EF', border: '#E84D78', text: '#E84D78', btnBg: '#E84D78', btnHover: '#D43B66', btnBorder: '#B82B53' };

export default function MemoryMatch() {
  const {
    navigateTo,
    sounds,
    voice,
    cognitiveDifficulty,
    recordGameResult,
    patient,
  } = useApp();
  const { t, isHindi } = useI18n();

  const patientName = patient?.preferredName || (isHindi ? (patient?.nameHindi || patient?.name || 'वरिष्ठ सदस्य') : (patient?.nameEnglish || patient?.name || 'Dear Senior'));

  // Exactly 6 pairs (12 cards)
  const PAIR_COUNT = 6;

  // Game board states
  const [cards, setCards] = useState([]);
  const [flippedIndices, setFlippedIndices] = useState([]);
  const [matchedIds, setMatchedIds] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isWon, setIsWon] = useState(false);

  // Performance telemetry
  const [attempts, setAttempts] = useState(0);
  const [totalSeconds, setTotalSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [responseTimes, setResponseTimes] = useState([]); // seconds per tap
  const lastTapTimeRef = useRef(null);
  const timerIntervalRef = useRef(null);
  const activeSessionRef = useRef({ sessionId: null, startedAt: null });

  // Encouraging feedback state after every action.
  // Stores a translation key + the raw (untranslated) card data rather than
  // pre-rendered text, so the message re-translates instantly if the user
  // switches language mid-game instead of staying frozen in the old language.
  const [feedback, setFeedback] = useState({ type: 'neutral', card: null });

  // Adaptive difficulty recommendation
  const [adaptiveResult, setAdaptiveResult] = useState(null);

  // Past results saved in localStorage
  const [pastGames, setPastGames] = useState(() => {
    try {
      const saved = localStorage.getItem('yaadsaathi_memory_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Timer runner
  useEffect(() => {
    if (isTimerRunning && !isWon) {
      timerIntervalRef.current = setInterval(() => {
        setTotalSeconds((sec) => sec + 1);
      }, 1000);
    } else {
      clearInterval(timerIntervalRef.current);
    }
    return () => clearInterval(timerIntervalRef.current);
  }, [isTimerRunning, isWon]);

  // Format seconds to mm:ss
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Resolve the current feedback message from its type/card, re-evaluated on every
  // render so it always reflects the currently selected language.
  const getFeedbackText = () => {
    const itemName = feedback.card ? (isHindi ? feedback.card.nameHindi : feedback.card.nameEnglish) : '';
    switch (feedback.type) {
      case 'picking':
        return t('memoryPickedCardMsg', { item: itemName });
      case 'matched':
        return t('memoryFoundPairMsg', { item: itemName });
      case 'mismatch':
        return t('memoryMismatchMsg');
      case 'won':
        return t('memoryGameWonMsg', { pairs: PAIR_COUNT });
      default:
        return t('memoryReadyToStart');
    }
  };
  const feedbackText = getFeedbackText();

  // Compute metrics
  const matchesCount = matchedIds.length;
  const accuracyPercent = attempts > 0 ? Math.round((matchesCount / attempts) * 100) : 100;
  const avgResponseTime =
    responseTimes.length > 0
      ? (responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length).toFixed(1)
      : '0.0';

  // Initialize and shuffle 6 pairs
  const initializeGame = () => {
    clearInterval(timerIntervalRef.current);

    // Pick exactly 6 pairs
    const selectedCatalog = MEMORY_CARDS_CATALOG.slice(0, PAIR_COUNT);
    const deck = [...selectedCatalog, ...selectedCatalog].map((card, idx) => ({
      ...card,
      uniqueId: `${card.id}-${idx}-${Math.random().toString(36).slice(2, 7)}`,
    }));

    // Fisher-Yates shuffle
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }

    setCards(deck);
    setFlippedIndices([]);
    setMatchedIds([]);
    setAttempts(0);
    setTotalSeconds(0);
    setIsTimerRunning(false);
    setResponseTimes([]);
    setIsProcessing(false);
    setIsWon(false);
    setAdaptiveResult(null);
    lastTapTimeRef.current = null;

    setFeedback({ type: 'neutral', card: null });

    // Start game session in IndexedDB
    gamePersistenceService
      .startGameSession({
        gameId: 'memory-match',
        difficultyLevel: cognitiveDifficulty || 3,
      })
      .then((session) => {
        activeSessionRef.current = session;
      })
      .catch((err) => {
        console.warn('[MemoryMatch] Could not start database session:', err);
      });
  };

  useEffect(() => {
    initializeGame();
    return () => clearInterval(timerIntervalRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle Card Tap
  const handleCardTap = (index) => {
    if (isProcessing || flippedIndices.includes(index) || isWon) return;
    const clickedCard = cards[index];
    if (matchedIds.includes(clickedCard.id)) return;

    // Start timer on first tap
    if (!isTimerRunning) {
      setIsTimerRunning(true);
    }

    // Measure response time
    const now = Date.now();
    if (lastTapTimeRef.current) {
      const deltaSec = (now - lastTapTimeRef.current) / 1000;
      const cappedDelta = Math.min(deltaSec, 15);
      setResponseTimes((prev) => [...prev, cappedDelta]);
    }
    lastTapTimeRef.current = now;

    sounds.playClickChime();

    const newFlipped = [...flippedIndices, index];
    setFlippedIndices(newFlipped);

    // Case 1: First card flipped
    if (newFlipped.length === 1) {
      setFeedback({ type: 'picking', card: clickedCard });
      voice.speak(
        t('memoryPickedCardSpeech', { item: clickedCard.nameHindi }),
        t('memoryPickedCardSpeech', { item: clickedCard.nameEnglish })
      );
      return;
    }

    // Case 2: Second card flipped -> Compare
    if (newFlipped.length === 2) {
      setIsProcessing(true);
      const firstIndex = newFlipped[0];
      const secondIndex = newFlipped[1];
      const firstCard = cards[firstIndex];
      const secondCard = cards[secondIndex];

      setAttempts((prev) => prev + 1);

      if (firstCard.id === secondCard.id) {
        // MATCH FOUND!
        sounds.playSuccessChime();
        const nextMatches = [...matchedIds, firstCard.id];
        setMatchedIds(nextMatches);
        setFlippedIndices([]);
        setIsProcessing(false);

        const isGameComplete = nextMatches.length === PAIR_COUNT;

        if (isGameComplete) {
          // Game Won!
          setIsWon(true);
          setIsTimerRunning(false);

          confetti({ particleCount: 90, spread: 75, origin: { y: 0.6 } });

          const finalAttempts = attempts + 1;
          const finalAccuracy = Math.round((PAIR_COUNT / finalAttempts) * 100);
          const finalTimeSec = totalSeconds;
          const finalAvgResp =
            responseTimes.length > 0
              ? Number((responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length).toFixed(1))
              : 2.5;

          // Adaptive Difficulty Engine (smoothed across recent sessions)
          const adaptive = recordGameResult({
            game: 'memoryMatch',
            accuracy: finalAccuracy,
            averageResponseTime: finalAvgResp,
            starsEarned: 2,
            scoreUpdater: (prev) => ({ memoryMatchWins: (prev.memoryMatchWins || 0) + 1 }),
          });
          setAdaptiveResult(adaptive);

          const finalMistakes = Math.max(0, finalAttempts - PAIR_COUNT);

          // Persist Game Result to IndexedDB via gamePersistenceService
          gamePersistenceService
            .saveGameResult({
              gameId: 'memory-match',
              sessionId: activeSessionRef.current?.sessionId,
              score: PAIR_COUNT * 10,
              accuracy: finalAccuracy,
              responseTime: finalAvgResp,
              attempts: finalAttempts,
              mistakes: finalMistakes,
              hintsUsed: 0,
              difficultyLevel: cognitiveDifficulty || 3,
              cognitiveDomain: CognitiveDomain.MEMORY,
              startedAt: activeSessionRef.current?.startedAt,
              completedAt: new Date().toISOString(),
              adaptiveRecommendation: adaptive,
              metadata: {
                pairCount: PAIR_COUNT,
                totalSeconds: finalTimeSec,
                formattedTime: formatTime(finalTimeSec),
              },
            })
            .catch((err) => {
              console.warn('[MemoryMatch] Could not save game result to database:', err);
            });

          // Save game result to localStorage
          const gameResult = {
            id: `game-${Date.now()}`,
            date: new Date().toLocaleDateString('hi-IN', {
              day: 'numeric',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit',
            }),
            attempts: finalAttempts,
            matches: PAIR_COUNT,
            accuracy: finalAccuracy,
            totalSeconds: finalTimeSec,
            formattedTime: formatTime(finalTimeSec),
            avgResponseTime: String(finalAvgResp),
            difficultyPlayed: cognitiveDifficulty,
            nextDifficulty: adaptive.nextDifficulty,
            adaptiveReason: adaptive.reason,
            adaptiveReasonHindi: adaptive.reasonHindi,
          };

          try {
            const currentHistory = JSON.parse(
              localStorage.getItem('yaadsaathi_memory_history') || '[]'
            );
            const updatedHistory = [gameResult, ...currentHistory.slice(0, 9)];
            localStorage.setItem('yaadsaathi_memory_history', JSON.stringify(updatedHistory));
            setPastGames(updatedHistory);
          } catch (e) {
            console.warn('Could not save game history:', e);
          }

          setFeedback({ type: 'won', card: null });

          voice.speak(
            t('memoryGameWonSpeech', { name: patientName, pairs: PAIR_COUNT }),
            t('memoryGameWonSpeech', { name: patientName, pairs: PAIR_COUNT })
          );
        } else {
          // Individual match
          setFeedback({ type: 'matched', card: firstCard });

          voice.speak(
            t('memoryFoundPairSpeech', { item: firstCard.nameHindi }),
            t('memoryFoundPairSpeech', { item: firstCard.nameEnglish })
          );
        }
      } else {
        // MISMATCH -> Gentle feedback, hide after short delay
        sounds.playEncouragementChime();

        setFeedback({ type: 'mismatch', card: null });

        setTimeout(() => {
          setFlippedIndices([]);
          setIsProcessing(false);
        }, 1250);
      }
    }
  };

  const handleCardKeyDown = (event, index) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleCardTap(index);
    }
  };

  const handleListenRules = () => {
    sounds.playClickChime();
    voice.speak(t('memoryMatchRulesSpeech'), t('memoryMatchRulesSpeech'));
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in text-left">
      <GameTopBar
        icon="🌸"
        title={t('memoryMatchPageTitle')}
        tagline={t('memoryMatchTagline')}
        subtitle={t('memoryMatchSubtitle')}
        theme={THEME}
        onBack={() => navigateTo('games')}
        onListenRules={handleListenRules}
        onRestart={initializeGame}
      />

      {/* Difficulty badge */}
      <div className="flex justify-end -mt-3">
        <span className="px-3.5 py-1 bg-white border-2 border-[#E84D78]/30 rounded-full font-black text-xs sm:text-sm text-[#E84D78]">
          {isHindi ? DIFFICULTY_LABELS[cognitiveDifficulty]?.hi : DIFFICULTY_LABELS[cognitiveDifficulty]?.en}
        </span>
      </div>

      {/* Pre-game Clear Instructions Banner */}
      <div className="bg-white border-2 border-[#E84D78]/30 rounded-3xl p-5 sm:p-6 flex items-start gap-4 text-left shadow-xs">
        <div className="w-12 h-12 rounded-2xl bg-[#FFE8EF] flex items-center justify-center shrink-0 text-2xl text-[#E84D78]" aria-hidden="true">
          💡
        </div>
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-[#102A43]">{t('simpleRulesTitle')}:</h2>
          <p className="text-base sm:text-xl font-bold text-[#5D7184] mt-1">1. {t('memoryMatchRule1')}</p>
          <p className="text-base sm:text-xl font-bold text-[#5D7184]">2. {t('memoryMatchRule2')}</p>
          <p className="text-base sm:text-xl font-bold text-[#5D7184]">3. {t('memoryMatchRule3')}</p>
        </div>
      </div>

      {/* Live Telemetry Tracker */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4">
        <div className="bg-[#FFE8EF]/60 rounded-3xl p-4 border-2 border-[#E84D78]/30 text-center">
          <span className="text-xs sm:text-sm font-bold text-[#5D7184] block">{t('matchesLabel')}</span>
          <span className="text-3xl sm:text-4xl font-black text-[#E84D78] block mt-0.5">
            {matchesCount} / {PAIR_COUNT}
          </span>
        </div>

        <div className="bg-white rounded-3xl p-4 border-2 border-[#DFF3E7] text-center">
          <span className="text-xs sm:text-sm font-bold text-[#5D7184] block">{t('attemptsLabel')}</span>
          <span className="text-3xl sm:text-4xl font-black text-[#102A43] block mt-0.5">{attempts}</span>
        </div>

        <div className="bg-[#EAF7EF] rounded-3xl p-4 border-2 border-[#167A55]/30 text-center">
          <span className="text-xs sm:text-sm font-bold text-[#5D7184] block">{t('accuracyLabel')}</span>
          <span className="text-3xl sm:text-4xl font-black text-[#167A55] block mt-0.5">{accuracyPercent}%</span>
        </div>

        <div className="bg-white rounded-3xl p-4 border-2 border-[#DFF3E7] text-center">
          <span className="text-xs sm:text-sm font-bold text-[#5D7184] block">{t('totalTimeLabel')}</span>
          <span className="text-3xl sm:text-4xl font-mono font-black text-[#102A43] block mt-0.5">
            {formatTime(totalSeconds)}
          </span>
        </div>

        <div className="bg-[#FFF0D7] rounded-3xl p-4 border-2 border-[#E98A20]/30 text-center col-span-2 sm:col-span-1">
          <span className="text-xs sm:text-sm font-bold text-[#5D7184] block">{t('speedLabel')}</span>
          <span className="text-3xl sm:text-4xl font-mono font-black text-[#E98A20] block mt-0.5">
            {avgResponseTime}s
          </span>
        </div>
      </div>

      {/* Encouraging Feedback Banner */}
      <div
        className={`p-4 sm:p-6 rounded-3xl border-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm transition-all ${
          feedback.type === 'matched'
            ? 'bg-[#EAF7EF] border-[#167A55] text-[#167A55]'
            : feedback.type === 'mismatch'
            ? 'bg-[#FFF0D7] border-[#E98A20] text-[#102A43]'
            : feedback.type === 'won'
            ? 'bg-[#FFE8EF] border-[#E84D78] text-[#E84D78]'
            : feedback.type === 'picking'
            ? 'bg-[#E6F1FF] border-[#2879D0] text-[#102A43]'
            : 'bg-white border-[#DFF3E7] text-[#102A43]'
        }`}
        role="status"
        aria-live="polite"
      >
        <div className="flex items-center gap-3.5">
          <span className="text-4xl" aria-hidden="true">
            {feedback.type === 'matched'
              ? '🌟'
              : feedback.type === 'mismatch'
              ? '🌸'
              : feedback.type === 'won'
              ? '🏆'
              : feedback.type === 'picking'
              ? '🔍'
              : '🌸'}
          </span>
          <p className="text-xl sm:text-2xl font-black leading-snug">{feedbackText}</p>
        </div>

        <VoiceButton text={feedbackText} size="sm" label="" className="self-end sm:self-center shrink-0" />
      </div>

      {/* End Celebration & Final Scorecard */}
      {isWon && (
        <div className="bg-[#FFE8EF] border-4 border-[#E84D78] rounded-[2.5rem] p-6 sm:p-10 text-center shadow-xl animate-slow-fade">
          <div className="inline-block p-4 bg-white rounded-full mb-3 text-5xl sm:text-6xl shadow-sm" aria-hidden="true">🏆</div>
          <h2 className="text-3xl sm:text-5xl font-black text-[#102A43]">
            {t('memoryCompleteTitle', { name: patientName })}
          </h2>
          <p className="mt-2 text-xl sm:text-2xl font-black text-[#E84D78]">
            {t('memoryCompleteSub', { pairs: PAIR_COUNT })}
          </p>

          <div className="my-5 flex items-center justify-center gap-3 text-4xl sm:text-5xl text-amber-500" aria-hidden="true">
            <span>⭐</span><span>⭐</span><span>⭐</span>
          </div>

          <div className="max-w-xl mx-auto my-6 grid grid-cols-2 sm:grid-cols-4 gap-3 text-left">
            <div className="bg-white p-3.5 rounded-2xl border-2 border-[#FFE8EF]">
              <span className="text-xs font-bold text-[#5D7184] block">{t('totalTimeLabel')}</span>
              <span className="text-2xl font-mono font-black text-[#102A43] block">{formatTime(totalSeconds)}</span>
            </div>
            <div className="bg-white p-3.5 rounded-2xl border-2 border-[#FFE8EF]">
              <span className="text-xs font-bold text-[#5D7184] block">{t('attemptsLabel')}</span>
              <span className="text-2xl font-black text-[#102A43] block">{attempts}</span>
            </div>
            <div className="bg-white p-3.5 rounded-2xl border-2 border-[#FFE8EF]">
              <span className="text-xs font-bold text-[#5D7184] block">{t('accuracyLabel')}</span>
              <span className="text-2xl font-black text-[#167A55] block">{accuracyPercent}%</span>
            </div>
            <div className="bg-white p-3.5 rounded-2xl border-2 border-[#FFE8EF]">
              <span className="text-xs font-bold text-[#5D7184] block">{t('speedLabel')}</span>
              <span className="text-2xl font-mono font-black text-[#E98A20] block">{avgResponseTime}s</span>
            </div>
          </div>

          <AdaptiveDifficultyCard adaptiveResult={adaptiveResult} accuracyPercent={accuracyPercent} avgResponseTime={avgResponseTime} />

          <p className="text-sm font-semibold text-[#167A55] mb-6">✓ {t('resultsSavedNote')}</p>

          <GameCompletionActions onPlayAgain={initializeGame} onOtherGames={() => navigateTo('games')} theme={THEME} />
        </div>
      )}

      {/* Cards Grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 sm:gap-5 max-w-4xl mx-auto pt-2">
        {cards.map((card, idx) => {
          const isFlipped = flippedIndices.includes(idx);
          const isMatched = matchedIds.includes(card.id);
          const isOpen = isFlipped || isMatched;
          const itemName = isHindi ? card.nameHindi : card.nameEnglish;

          return (
            <button
              type="button"
              key={card.uniqueId}
              onClick={() => handleCardTap(idx)}
              onKeyDown={(e) => handleCardKeyDown(e, idx)}
              disabled={isProcessing && !isOpen}
              aria-pressed={isOpen}
              aria-label={isOpen ? `${itemName}${isMatched ? `, ${t('matchedLabel')}` : ''}` : t('hiddenCardLabel')}
              className="h-36 sm:h-44 perspective-1000 cursor-pointer select-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E84D78] rounded-3xl"
            >
              <div
                className={`relative w-full h-full duration-300 transform-style-3d rounded-3xl tactile-btn ${
                  isOpen ? 'rotate-y-180' : ''
                }`}
              >
                {/* Back of Card (Face Down) */}
                <div
                  className={`absolute inset-0 backface-hidden rounded-3xl border-4 border-[#E84D78] bg-gradient-to-br from-[#E84D78] to-[#C9335E] flex flex-col items-center justify-center shadow-md p-2 hover:brightness-105 ${
                    isProcessing ? 'pointer-events-none' : ''
                  }`}
                >
                  <span className="text-4xl sm:text-5xl opacity-90 drop-shadow" aria-hidden="true">🌸</span>
                  <span className="mt-1 text-sm sm:text-base font-black text-white uppercase tracking-wider">यादसाथी</span>
                  <span className="text-xs font-bold text-pink-100">{t('tapToOpenLabel')}</span>
                </div>

                {/* Front of Card (Face Up / Revealed) */}
                <div
                  className={`absolute inset-0 backface-hidden rotate-y-180 rounded-3xl border-4 flex flex-col items-center justify-center p-2 sm:p-3 shadow-md ${
                    isMatched
                      ? 'bg-[#EAF7EF] border-[#167A55] text-[#167A55] ring-4 ring-[#DFF3E7]'
                      : 'bg-white border-[#E84D78]/40 text-[#102A43]'
                  }`}
                >
                  <span className="text-5xl sm:text-6xl filter drop-shadow-sm" aria-hidden="true">{card.emoji}</span>
                  <p className="mt-1 text-base sm:text-xl font-black text-center leading-tight">{itemName}</p>

                  {isMatched && (
                    <div className="absolute top-2 right-2 text-[#167A55] bg-white rounded-full p-1 shadow-sm" aria-hidden="true">
                      <CheckCircle2 className="w-5 h-5 fill-[#DFF3E7]" />
                    </div>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Past Game History */}
      {pastGames.length > 0 && (
        <div className="mt-8 bg-white rounded-3xl p-5 sm:p-6 border-2 border-[#DFF3E7] shadow-xs">
          <div className="flex items-center gap-2.5 mb-3">
            <History className="w-6 h-6 text-[#E84D78]" aria-hidden="true" />
            <h2 className="text-xl sm:text-2xl font-black text-[#102A43]">{t('pastResultsTitle')}:</h2>
          </div>

          <div className="space-y-2.5">
            {pastGames.slice(0, 3).map((g) => (
              <div
                key={g.id}
                className="p-3.5 rounded-2xl bg-[#FBFAF4] border border-[#DFF3E7] flex flex-wrap items-center justify-between gap-2 text-sm sm:text-base font-bold text-[#102A43]"
              >
                <span>📅 {g.date}</span>
                <span>⏱️ {t('totalTimeLabel')}: {g.formattedTime}</span>
                <span>🎯 {t('attemptsLabel')}: {g.attempts}</span>
                <span className="text-[#167A55] font-black">📊 {t('accuracyLabel')}: {g.accuracy}%</span>
                <span className="text-[#E98A20] font-black">⚡ {t('speedLabel')}: {g.avgResponseTime}s</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
