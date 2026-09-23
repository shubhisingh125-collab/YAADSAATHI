import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  RotateCcw,
  Sparkles,
  Trophy,
  Clock,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Calendar,
  Sun,
  Coffee,
  HelpCircle,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useI18n } from '../i18n/I18nContext';
import VoiceButton from '../components/VoiceButton';
import * as gamePersistenceService from '../services/gamePersistenceService.js';
import * as routineRepository from '../database/repositories/routineRepository.js';
import { CognitiveDomain } from '../domain/cognitive/cognitiveTypes.js';
import { DifficultyLevel } from '../domain/cognitive/difficultyTypes.js';
import { getStartingDifficulty } from '../logic/adaptiveEngine.js';
import {
  FALLBACK_ROUTINES,
  generateRecallQuestions,
} from '../domain/routine/routineTypes.js';

export default function DailyRoutineRecall() {
  const { navigateTo, sounds, voice } = useApp();
  const { isHindi } = useI18n();

  // Activity stages: 'intro' | 'remember' | 'recall' | 'result'
  const [stage, setStage] = useState('intro');

  // Routine data state
  const [routines, setRoutines] = useState(FALLBACK_ROUTINES);
  const [isCustomRoutine, setIsCustomRoutine] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentDifficulty, setCurrentDifficulty] = useState(DifficultyLevel.GENTLE);

  // Remember phase countdown timer
  const [countdown, setCountdown] = useState(15);
  const countdownTimerRef = useRef(null);

  // Recall phase state
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(null);

  // Telemetry tracking
  const [correctAnswersCount, setCorrectAnswersCount] = useState(0);
  const [totalAttempts, setTotalAttempts] = useState(0);
  const [totalMistakes, setTotalMistakes] = useState(0);
  const startTimeRef = useRef(null);
  const activeSessionRef = useRef({ sessionId: null, startedAt: null });

  // Load user routines on mount
  useEffect(() => {
    async function loadRoutineData() {
      try {
        const userId = gamePersistenceService.getOrCreateLocalUserId();
        const stored = await routineRepository.getRoutines(userId);
        if (stored && stored.length >= 3) {
          // Sort by time or creation order
          const sorted = [...stored].sort((a, b) => (a.time || '').localeCompare(b.time || ''));
          setRoutines(sorted);
          setIsCustomRoutine(true);
        } else {
          setRoutines(FALLBACK_ROUTINES);
          setIsCustomRoutine(false);
        }
      } catch (err) {
        console.warn('[DailyRoutineRecall] Failed to load routines from DB:', err);
        setRoutines(FALLBACK_ROUTINES);
        setIsCustomRoutine(false);
      } finally {
        setLoading(false);
      }
    }
    loadRoutineData();
  }, []);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    };
  }, []);

  // Start the activity
  const handleStartActivity = async () => {
    sounds.playClickChime();

    const userId = gamePersistenceService.getOrCreateLocalUserId();
    const diff = await getStartingDifficulty('daily-routine-recall', userId);
    setCurrentDifficulty(diff);

    setStage('remember');
    setCountdown(15);
    startTimeRef.current = Date.now();

    // Start DB session
    try {
      const session = await gamePersistenceService.startGameSession({
        gameId: 'daily-routine-recall',
        difficultyLevel: diff,
      });
      activeSessionRef.current = session;
    } catch (err) {
      console.warn('[DailyRoutineRecall] Session start warning:', err);
    }

    // Voice guidance
    voice.speak(
      'अपनी दैनिक गतिविधियों के क्रम को ध्यान से देखें। जब आप तैयार हों, आगे बढ़ें पर टैप करें।',
      'Look at the order of your daily activities carefully. When ready, tap Continue.'
    );

    // Countdown timer for remember phase
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    countdownTimerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownTimerRef.current);
          handleProceedToRecall();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Proceed to recall phase
  const handleProceedToRecall = () => {
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    sounds.playClickChime();

    const generated = generateRecallQuestions(routines);
    setQuestions(generated);
    setCurrentQuestionIdx(0);
    setSelectedOptionId(null);
    setIsAnswered(false);
    setIsCorrect(null);
    setCorrectAnswersCount(0);
    setTotalAttempts(0);
    setTotalMistakes(0);
    setStage('recall');

    voice.speak(
      'आइए देखें कि आप क्रम को कितनी अच्छी तरह याद रख पाए। पहला प्रश्न आपकी स्क्रीन पर है।',
      'Let us see how well you remember the order. The first question is on your screen.'
    );
  };

  // Handle user answer selection
  const handleSelectOption = (option) => {
    if (isAnswered) return;

    const currentQ = questions[currentQuestionIdx];
    const correct = option.id === currentQ.targetItem.id;

    setSelectedOptionId(option.id);
    setIsAnswered(true);
    setIsCorrect(correct);
    setTotalAttempts((prev) => prev + 1);

    if (correct) {
      sounds.playSuccessChime();
      setCorrectAnswersCount((prev) => prev + 1);
      voice.speak(
        'बहुत बढ़िया! सही उत्तर है।',
        'Wonderful! That is the correct routine.'
      );
    } else {
      sounds.playEncouragementChime();
      setTotalMistakes((prev) => prev + 1);
      voice.speak(
        'कोई बात नहीं! यह एक सुंदर अभ्यास है।',
        'No worries at all! Every practice keeps the mind active.'
      );
    }

    // Advance to next question or result screen after brief delay
    setTimeout(() => {
      if (currentQuestionIdx + 1 < questions.length) {
        setCurrentQuestionIdx((prev) => prev + 1);
        setSelectedOptionId(null);
        setIsAnswered(false);
        setIsCorrect(null);
      } else {
        finishActivity(correct ? correctAnswersCount + 1 : correctAnswersCount);
      }
    }, 1600);
  };

  // Finish activity and persist results to IndexedDB
  const finishActivity = async (finalCorrectCount) => {
    setStage('result');
    const totalQ = questions.length || 3;
    const accuracy = totalQ > 0 ? (finalCorrectCount / totalQ) * 100 : 0;
    const durationSeconds = startTimeRef.current
      ? Math.max(1, Math.round((Date.now() - startTimeRef.current) / 1000))
      : 15;
    const avgResponseTime = Number((durationSeconds / totalQ).toFixed(1));

    if (accuracy >= 66) {
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.6 },
      });
      sounds.playSuccessChime();
    }

    // Persist result
    try {
      await gamePersistenceService.saveGameResult({
        gameId: 'daily-routine-recall',
        sessionId: activeSessionRef.current.sessionId,
        score: Math.round(accuracy),
        accuracy: Number(accuracy.toFixed(1)),
        responseTime: avgResponseTime,
        attempts: totalAttempts + 1,
        mistakes: totalMistakes,
        hintsUsed: 0,
        difficultyLevel: currentDifficulty || DifficultyLevel.GENTLE,
        cognitiveDomain: CognitiveDomain.ROUTINE_RECALL,
        startedAt: activeSessionRef.current.startedAt,
        completedAt: new Date().toISOString(),
        metadata: {
          usedFallbackRoutine: !isCustomRoutine,
          routineCount: routines.length,
          totalQuestions: totalQ,
          correctAnswers: finalCorrectCount,
        },
      });
    } catch (err) {
      console.warn('[DailyRoutineRecall] Failed to persist game result:', err);
    }
  };

  // Reset to Intro
  const handleRestart = () => {
    sounds.playClickChime();
    setStage('intro');
    setSelectedOptionId(null);
    setIsAnswered(false);
    setIsCorrect(null);
    setCorrectAnswersCount(0);
    setTotalAttempts(0);
    setTotalMistakes(0);
  };

  return (
    <div className="space-y-6 pb-12 animate-slow-fade text-left select-none max-w-4xl mx-auto">
      {/* Top Header Navigation */}
      <div className="bg-[#EAF7EF] rounded-[2.5rem] p-6 sm:p-8 border-2 border-[#167A55]/20 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <button
            onClick={() => {
              sounds.playClickChime();
              navigateTo('games');
            }}
            className="inline-flex items-center gap-2 text-sm font-black text-[#167A55] hover:text-[#126344] mb-2 cursor-pointer transition-colors"
          >
            <ArrowLeft className="w-4 h-4 stroke-[3]" />
            <span>{isHindi ? 'सभी खेलों पर लौटें' : 'Back to Activities'}</span>
          </button>
          <div className="flex items-center gap-2">
            <span className="text-3xl">📅</span>
            <h1 className="text-3xl sm:text-4xl font-black text-[#102A43]">
              {isHindi ? 'दिनचर्या स्मरण' : 'Daily Routine Recall'}
            </h1>
          </div>
          <p className="mt-1 text-lg font-bold text-[#167A55]">
            {isHindi
              ? 'अपनी दैनिक गतिविधियों के क्रम को याद करने का सरल व सुखद अभ्यास'
              : 'A gentle exercise to remember the sequence of your everyday activities'}
          </p>
        </div>

        <VoiceButton
          id="routine-recall-header-voice"
          textHindi="दिनचर्या स्मरण: आइए अपनी दैनिक गतिविधियों के क्रम को याद करें।"
          textEnglish="Daily Routine Recall: Let us remember the order of your daily activities."
          size="lg"
          label={isHindi ? 'निर्देश सुनें' : 'Listen Guidance'}
        />
      </div>

      {/* STAGE 1: INTRO */}
      {stage === 'intro' && (
        <div className="bg-white border-3 border-[#DFF3E7] rounded-[2.5rem] p-8 sm:p-12 shadow-sm space-y-8 text-center">
          <div className="w-24 h-24 mx-auto rounded-3xl bg-[#EAF7EF] border-2 border-[#167A55]/30 flex items-center justify-center text-5xl shadow-xs">
            ☀️
          </div>

          <div className="space-y-3 max-w-xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-black text-[#102A43]">
              {isHindi ? 'दिनचर्या का अभ्यास शुरू करें' : "Let's Practice Your Routine"}
            </h2>
            <p className="text-lg text-[#5D7184] font-medium leading-relaxed">
              {isHindi
                ? 'हम आपको आपके दिन की कुछ मुख्य गतिविधियां क्रम में दिखाएंगे। उन्हें शांति से देखें और याद रखें।'
                : 'We will show you a few familiar daily activities in sequence. Take a moment to review and remember them.'}
            </p>
          </div>

          {/* Routine Source Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-[#F0FAF4] border border-[#167A55]/30 text-sm font-black text-[#167A55]">
            <Calendar className="w-4 h-4" />
            <span>
              {isCustomRoutine
                ? (isHindi ? 'आपकी व्यक्तिगत दिनचर्या से' : 'Using Your Saved Routine')
                : (isHindi ? 'सुखद सामान्य दिनचर्या' : 'Familiar Everyday Routine')}
            </span>
          </div>

          <div>
            <button
              onClick={handleStartActivity}
              className="tactile-btn px-10 py-5 rounded-2xl bg-[#167A55] hover:bg-[#126344] text-white font-black text-2xl inline-flex items-center justify-center gap-3 shadow-lg cursor-pointer"
            >
              <span>{isHindi ? 'शुरू करें' : 'Start Activity'}</span>
              <ArrowRight className="w-6 h-6 stroke-[3]" />
            </button>
          </div>
        </div>
      )}

      {/* STAGE 2: REMEMBER */}
      {stage === 'remember' && (
        <div className="bg-white border-3 border-[#DFF3E7] rounded-[2.5rem] p-6 sm:p-10 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b-2 border-slate-100">
            <div>
              <span className="inline-block px-3.5 py-1 rounded-full bg-[#EAF7EF] text-[#167A55] text-xs font-black uppercase tracking-wider mb-1">
                {isHindi ? 'चरण 1: ध्यान से देखें' : 'Step 1: Remember the Order'}
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-[#102A43]">
                {isHindi ? 'गतिविधियों का क्रम' : 'Sequence of Activities'}
              </h2>
            </div>

            <div className="flex items-center gap-3">
              <div className="px-4 py-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 font-black text-sm flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-600" />
                <span>{countdown}s</span>
              </div>

              <VoiceButton
                textHindi={routines.map((r, i) => `${i + 1}: ${r.titleHindi || r.titleEnglish}`).join('। ')}
                textEnglish={routines.map((r, i) => `${i + 1}: ${r.titleEnglish || r.titleHindi}`).join('. ')}
                size="md"
                label={isHindi ? 'सुनें' : 'Listen'}
              />
            </div>
          </div>

          {/* Sequential Routine Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {routines.map((item, idx) => (
              <div
                key={item.id || idx}
                className="p-5 rounded-2xl bg-[#FBFAF4] border-2 border-[#167A55]/20 flex items-center gap-4 shadow-2xs"
              >
                <div className="w-12 h-12 rounded-xl bg-[#EAF7EF] border border-[#167A55]/30 flex items-center justify-center font-black text-xl text-[#167A55] shrink-0">
                  {idx + 1}
                </div>
                <div className="text-3xl shrink-0">
                  {item.icon || '☀️'}
                </div>
                <div>
                  <div className="text-xs font-black text-[#167A55] tracking-wide">
                    {item.time || 'Daily'}
                  </div>
                  <div className="text-lg font-black text-[#102A43] leading-snug">
                    {isHindi ? (item.titleHindi || item.titleEnglish) : (item.titleEnglish || item.titleHindi)}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm font-bold text-[#5D7184]">
              {isHindi
                ? 'आराम से देखें। जब आप तैयार हों, बटन दबाएं।'
                : 'Take your time. When you feel ready, tap continue.'}
            </p>

            <button
              onClick={handleProceedToRecall}
              className="tactile-btn w-full sm:w-auto px-8 py-4 rounded-2xl bg-[#167A55] hover:bg-[#126344] text-white font-black text-xl flex items-center justify-center gap-2 shadow cursor-pointer"
            >
              <span>{isHindi ? 'आगे बढ़ें (मुझे याद है)' : 'I Remember / Continue'}</span>
              <ArrowRight className="w-5 h-5 stroke-[3]" />
            </button>
          </div>
        </div>
      )}

      {/* STAGE 3: RECALL */}
      {stage === 'recall' && questions.length > 0 && (
        <div className="bg-white border-3 border-[#DFF3E7] rounded-[2.5rem] p-6 sm:p-10 shadow-sm space-y-8">
          <div className="flex items-center justify-between pb-4 border-b-2 border-slate-100">
            <div>
              <span className="inline-block px-3.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-black uppercase tracking-wider mb-1">
                {isHindi
                  ? `प्रश्न ${currentQuestionIdx + 1} / ${questions.length}`
                  : `Question ${currentQuestionIdx + 1} of ${questions.length}`}
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-[#102A43]">
                {isHindi
                  ? questions[currentQuestionIdx].promptHindi
                  : questions[currentQuestionIdx].promptEnglish}
              </h2>
            </div>

            <VoiceButton
              textHindi={questions[currentQuestionIdx].promptHindi}
              textEnglish={questions[currentQuestionIdx].promptEnglish}
              size="md"
              label={isHindi ? 'प्रश्न सुनें' : 'Listen Question'}
            />
          </div>

          {/* 4 Large Choice Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {questions[currentQuestionIdx].options.map((option) => {
              const isSelected = selectedOptionId === option.id;
              const isTarget = option.id === questions[currentQuestionIdx].targetItem.id;

              let btnStyle = 'bg-[#FBFAF4] border-2 border-slate-200 hover:border-[#167A55]/60 text-[#102A43]';
              if (isAnswered) {
                if (isTarget) {
                  btnStyle = 'bg-[#EAF7EF] border-3 border-[#167A55] text-[#167A55] font-black shadow-sm';
                } else if (isSelected) {
                  btnStyle = 'bg-amber-50 border-3 border-amber-400 text-amber-900';
                } else {
                  btnStyle = 'bg-slate-50 border-2 border-slate-200 text-slate-400 opacity-60';
                }
              }

              return (
                <button
                  key={option.id}
                  disabled={isAnswered}
                  onClick={() => handleSelectOption(option)}
                  className={`tactile-btn p-5 sm:p-6 rounded-2xl ${btnStyle} flex items-center gap-4 text-left transition-all cursor-pointer`}
                >
                  <span className="text-4xl shrink-0">{option.icon || '☀️'}</span>
                  <div className="flex-1">
                    <div className="text-xs font-bold text-slate-500">
                      {option.time || 'Daily'}
                    </div>
                    <div className="text-xl sm:text-2xl font-black leading-tight">
                      {isHindi
                        ? (option.titleHindi || option.titleEnglish)
                        : (option.titleEnglish || option.titleHindi)}
                    </div>
                  </div>
                  {isAnswered && isTarget && (
                    <CheckCircle2 className="w-7 h-7 text-[#167A55] shrink-0 stroke-[3]" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Gentle Feedback Message */}
          {isAnswered && (
            <div
              className={`p-4 rounded-2xl flex items-center gap-3 ${
                isCorrect ? 'bg-[#EAF7EF] text-[#167A55]' : 'bg-amber-50 text-amber-800'
              }`}
            >
              <span className="text-2xl">{isCorrect ? '🌸' : '💡'}</span>
              <p className="text-base sm:text-lg font-black">
                {isCorrect
                  ? (isHindi ? 'शाबाश! सही उत्तर है।' : 'Splendid! That is correct.')
                  : (isHindi ? 'कोई बात नहीं, हर कोशिश मन को ताजगी देती है।' : 'Good try! Practicing routine order helps keep the mind alert.')}
              </p>
            </div>
          )}
        </div>
      )}

      {/* STAGE 4: RESULT */}
      {stage === 'result' && (
        <div className="bg-white border-3 border-[#DFF3E7] rounded-[2.5rem] p-8 sm:p-12 shadow-sm space-y-8 text-center">
          <div className="w-24 h-24 mx-auto rounded-3xl bg-[#EAF7EF] border-2 border-[#167A55]/30 flex items-center justify-center text-5xl shadow-xs">
            🏆
          </div>

          <div className="space-y-2 max-w-xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-black text-[#102A43]">
              {isHindi ? 'बहुत खूब!' : 'Well done!'}
            </h2>
            <p className="text-lg text-[#5D7184] font-bold">
              {isHindi
                ? 'आपने अपनी दैनिक दिनचर्या की गतिविधियों का सुंदर अभ्यास किया!'
                : 'You engaged your memory with your daily routine!'}
            </p>
          </div>

          {/* Non-clinical Activity Score Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
            <div className="p-5 rounded-2xl bg-[#EAF7EF] border-2 border-[#167A55]/30">
              <div className="text-xs font-black text-[#167A55] uppercase tracking-wider mb-1">
                {isHindi ? 'गतिविधि शुद्धता' : 'Activity Accuracy'}
              </div>
              <div className="text-3xl font-black text-[#102A43]">
                {questions.length > 0
                  ? `${Math.round((correctAnswersCount / questions.length) * 100)}%`
                  : '100%'}
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-blue-50 border-2 border-blue-200">
              <div className="text-xs font-black text-blue-700 uppercase tracking-wider mb-1">
                {isHindi ? 'सही उत्तर' : 'Correct Answers'}
              </div>
              <div className="text-3xl font-black text-[#102A43]">
                {correctAnswersCount} / {questions.length}
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-amber-50 border-2 border-amber-200">
              <div className="text-xs font-black text-amber-700 uppercase tracking-wider mb-1">
                {isHindi ? 'सक्रियता' : 'Progress'}
              </div>
              <div className="text-3xl font-black text-[#102A43]">
                {isHindi ? 'सफल' : 'Completed'}
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <button
              onClick={handleRestart}
              className="tactile-btn w-full sm:w-auto px-8 py-4 rounded-2xl bg-[#167A55] hover:bg-[#126344] text-white font-black text-xl flex items-center justify-center gap-2 shadow cursor-pointer"
            >
              <RotateCcw className="w-5 h-5 stroke-[3]" />
              <span>{isHindi ? 'पुनः अभ्यास करें' : 'Try Again'}</span>
            </button>

            <button
              onClick={() => {
                sounds.playClickChime();
                navigateTo('games');
              }}
              className="tactile-btn w-full sm:w-auto px-8 py-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-[#102A43] font-black text-xl flex items-center justify-center gap-2 shadow-xs cursor-pointer"
            >
              <span>{isHindi ? 'गतिविधियों पर लौटें' : 'Back to Activities'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
