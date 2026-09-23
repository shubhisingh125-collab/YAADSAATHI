import React, { useState, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  RotateCcw,
  Sparkles,
  Trophy,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useI18n } from '../i18n/I18nContext';
import VoiceButton from '../components/VoiceButton';
import * as gamePersistenceService from '../services/gamePersistenceService.js';
import { CognitiveDomain } from '../domain/cognitive/cognitiveTypes.js';
import { DifficultyLevel } from '../domain/cognitive/difficultyTypes.js';
import { getStartingDifficulty } from '../logic/adaptiveEngine.js';
import {
  calculateAccuracy,
  calculateScore,
  DIFFERENCE_QUESTIONS,
} from '../logic/cognitiveActivityEngine.js';

export default function FindDifference() {
  const { navigateTo, sounds, voice } = useApp();
  const { isHindi } = useI18n();

  const [stage, setStage] = useState('intro'); // 'intro', 'play', 'result'
  const [currentIdx, setCurrentIdx] = useState(0);
  const [currentDifficulty, setCurrentDifficulty] = useState(DifficultyLevel.GENTLE);

  const [selectedCellIndex, setSelectedCellIndex] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(null);

  const [correctCount, setCorrectCount] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [mistakes, setMistakes] = useState(0);

  const gameStartTimeRef = useRef(Date.now());
  const activeSessionRef = useRef({ sessionId: null, startedAt: null });

  const handleStartGame = async () => {
    sounds.playClickChime();

    const userId = gamePersistenceService.getOrCreateLocalUserId();
    const diff = await getStartingDifficulty('find-difference', userId);
    setCurrentDifficulty(diff);

    setCurrentIdx(0);
    setCorrectCount(0);
    setAttempts(0);
    setMistakes(0);
    setSelectedCellIndex(null);
    setIsAnswered(false);
    setIsCorrect(null);
    setStage('play');
    gameStartTimeRef.current = Date.now();

    try {
      const session = await gamePersistenceService.startGameSession({
        gameId: 'find-difference',
        difficultyLevel: diff,
      });
      activeSessionRef.current = session;
    } catch (err) {
      console.warn('[FindDifference] Session start warning:', err);
    }

    voice.speak(
      'दोनों ग्रिड को ध्यान से देखें और दाईं ओर बदले हुए प्रतीक को चुनें।',
      'Look at both grids carefully and tap the symbol that changed on the right.'
    );
  };

  const handleSelectCell = (cellIdx) => {
    if (isAnswered) return;

    const currentQ = DIFFERENCE_QUESTIONS[currentIdx];
    const correct = cellIdx === currentQ.diffIndex;

    setSelectedCellIndex(cellIdx);
    setIsAnswered(true);
    setIsCorrect(correct);
    setAttempts((prev) => prev + 1);

    if (correct) {
      sounds.playSuccessChime();
      setCorrectCount((prev) => prev + 1);
      voice.speak('बहुत बढ़िया! सही अंतर पहचाना।', 'Splendid! You spotted the difference.');
    } else {
      sounds.playEncouragementChime();
      setMistakes((prev) => prev + 1);
      voice.speak('कोई बात नहीं! अगला चित्र देखें।', 'Good attempt! Take a look at the next card.');
    }

    setTimeout(() => {
      if (currentIdx + 1 < DIFFERENCE_QUESTIONS.length) {
        setCurrentIdx((prev) => prev + 1);
        setSelectedCellIndex(null);
        setIsAnswered(false);
        setIsCorrect(null);
      } else {
        finishActivity(correct ? correctCount + 1 : correctCount);
      }
    }, 1600);
  };

  const finishActivity = async (finalCorrect) => {
    setStage('result');
    const totalQ = DIFFERENCE_QUESTIONS.length || 5;
    const accuracy = calculateAccuracy(finalCorrect, totalQ);
    const score = calculateScore(accuracy);
    const totalDuration = Math.max(1, Math.round((Date.now() - gameStartTimeRef.current) / 1000));
    const avgResponseTime = Number((totalDuration / totalQ).toFixed(1));

    if (accuracy >= 60) {
      confetti({ particleCount: 40, spread: 60, origin: { y: 0.6 } });
      sounds.playSuccessChime();
    }

    try {
      await gamePersistenceService.saveGameResult({
        gameId: 'find-difference',
        sessionId: activeSessionRef.current.sessionId,
        score,
        accuracy,
        responseTime: avgResponseTime,
        attempts: attempts + 1,
        mistakes,
        hintsUsed: 0,
        difficultyLevel: currentDifficulty || DifficultyLevel.GENTLE,
        cognitiveDomain: CognitiveDomain.ATTENTION,
        startedAt: activeSessionRef.current.startedAt,
        completedAt: new Date().toISOString(),
        metadata: {
          totalQuestions: totalQ,
          correctCount: finalCorrect,
        },
      });
    } catch (err) {
      console.warn('[FindDifference] Persistence warning:', err);
    }
  };

  const handleRestart = () => {
    sounds.playClickChime();
    setStage('intro');
    setSelectedCellIndex(null);
    setIsAnswered(false);
    setIsCorrect(null);
    setCorrectCount(0);
    setAttempts(0);
    setMistakes(0);
  };

  const currentQ = DIFFERENCE_QUESTIONS[currentIdx];

  return (
    <div className="space-y-6 pb-12 animate-slow-fade text-left select-none max-w-4xl mx-auto">
      {/* Header Banner */}
      <div className="bg-[#F5EEF8] rounded-[2.5rem] p-6 sm:p-8 border-2 border-[#8E44AD]/20 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <button
            onClick={() => {
              sounds.playClickChime();
              navigateTo('games');
            }}
            className="inline-flex items-center gap-2 text-sm font-black text-[#8E44AD] hover:text-[#5B2C6F] mb-2 cursor-pointer transition-colors"
          >
            <ArrowLeft className="w-4 h-4 stroke-[3]" />
            <span>{isHindi ? 'सभी खेलों पर लौटें' : 'Back to Activities'}</span>
          </button>
          <div className="flex items-center gap-2">
            <span className="text-3xl">🔍</span>
            <h1 className="text-3xl sm:text-4xl font-black text-[#102A43]">
              {isHindi ? 'अंतर खोजें' : 'Find the Difference'}
            </h1>
          </div>
          <p className="mt-1 text-lg font-bold text-[#8E44AD]">
            {isHindi
              ? 'दोनों कार्डों को ध्यान से देखें और अंतर को पहचानें'
              : 'Observe both cards with gentle attention and spot the change'}
          </p>
        </div>

        <VoiceButton
          id="find-difference-header-voice"
          textHindi="अंतर खोजें: दोनों ग्रिड को ध्यान से देखें और जो एक प्रतीक अलग है, उसे चुनें।"
          textEnglish="Find the Difference: Observe both grids and tap the one symbol that changed on the right."
          size="lg"
          label={isHindi ? 'निर्देश सुनें' : 'Listen Guidance'}
        />
      </div>

      {/* STAGE 1: INTRO */}
      {stage === 'intro' && (
        <div className="bg-white border-3 border-[#D7BDE2] rounded-[2.5rem] p-8 sm:p-12 shadow-sm space-y-8 text-center">
          <div className="w-24 h-24 mx-auto rounded-3xl bg-[#F5EEF8] border-2 border-[#8E44AD]/30 flex items-center justify-center text-5xl shadow-xs">
            🎯
          </div>

          <div className="space-y-3 max-w-xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-black text-[#102A43]">
              {isHindi ? 'एकाग्रता और दृष्टि ध्यान' : 'Visual Focus & Attention'}
            </h2>
            <p className="text-lg text-[#5D7184] font-medium leading-relaxed">
              {isHindi
                ? 'स्क्रीन पर दो ग्रिड होंगे। दाईं ओर का एक प्रतीक बाईं ओर से अलग होगा। शांति से तुलना करें और अंतर पर टैप करें।'
                : 'You will see two side-by-side grids. Exactly one symbol on the right is different. Compare calmly and tap it.'}
            </p>
          </div>

          <div>
            <button
              onClick={handleStartGame}
              className="tactile-btn px-10 py-5 rounded-2xl bg-[#8E44AD] hover:bg-[#7D3C98] text-white font-black text-2xl inline-flex items-center justify-center gap-3 shadow-lg cursor-pointer"
            >
              <span>{isHindi ? 'शुरू करें' : 'Start Activity'}</span>
              <ArrowRight className="w-6 h-6 stroke-[3]" />
            </button>
          </div>
        </div>
      )}

      {/* STAGE 2: PLAY */}
      {stage === 'play' && currentQ && (
        <div className="bg-white border-3 border-[#D7BDE2] rounded-[2.5rem] p-6 sm:p-10 shadow-sm space-y-8">
          <div className="flex items-center justify-between pb-4 border-b-2 border-slate-100">
            <div>
              <span className="inline-block px-3.5 py-1 rounded-full bg-purple-50 text-purple-700 text-xs font-black uppercase tracking-wider mb-1">
                {isHindi
                  ? `प्रश्न ${currentIdx + 1} / ${DIFFERENCE_QUESTIONS.length}`
                  : `Question ${currentIdx + 1} of ${DIFFERENCE_QUESTIONS.length}`}
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-[#102A43]">
                {isHindi ? currentQ.promptHindi : currentQ.promptEnglish}
              </h2>
            </div>

            <VoiceButton
              textHindi={currentQ.promptHindi}
              textEnglish={currentQ.promptEnglish}
              size="md"
              label={isHindi ? 'प्रश्न सुनें' : 'Listen Question'}
            />
          </div>

          {/* Two Side-by-Side 3x3 Grids */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center justify-center">
            {/* Left Original Grid */}
            <div className="p-5 rounded-3xl bg-[#FAF9F6] border-2 border-slate-200 space-y-3">
              <div className="text-center font-black text-sm uppercase tracking-wider text-slate-500">
                {isHindi ? 'मूल कार्ड (बायां)' : 'Original Card (Left)'}
              </div>
              <div className="grid grid-cols-3 gap-2.5 max-w-[260px] mx-auto">
                {currentQ.leftGrid.map((sym, idx) => (
                  <div
                    key={idx}
                    className="w-18 h-18 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-4xl shadow-2xs select-none"
                  >
                    {sym}
                  </div>
                ))}
              </div>
            </div>

            {/* Right Comparison Grid (Interactive) */}
            <div className="p-5 rounded-3xl bg-[#F5EEF8] border-2 border-[#8E44AD]/40 space-y-3">
              <div className="text-center font-black text-sm uppercase tracking-wider text-[#8E44AD]">
                {isHindi ? 'यहाँ छूकर अंतर बताएं (दायां)' : 'Tap Changed Item Here (Right)'}
              </div>
              <div className="grid grid-cols-3 gap-2.5 max-w-[260px] mx-auto">
                {currentQ.rightGrid.map((sym, idx) => {
                  const isSelected = selectedCellIndex === idx;
                  const isTarget = idx === currentQ.diffIndex;

                  let cellStyle = 'bg-white border-2 border-purple-200 hover:border-[#8E44AD] cursor-pointer';
                  if (isAnswered) {
                    if (isTarget) {
                      cellStyle = 'bg-green-50 border-3 border-[#167A55] text-green-700 shadow-sm animate-bounce';
                    } else if (isSelected) {
                      cellStyle = 'bg-amber-50 border-3 border-amber-400 text-amber-900';
                    } else {
                      cellStyle = 'bg-slate-50 border border-slate-200 opacity-60';
                    }
                  }

                  return (
                    <button
                      key={idx}
                      disabled={isAnswered}
                      onClick={() => handleSelectCell(idx)}
                      className={`w-18 h-18 rounded-2xl ${cellStyle} flex items-center justify-center text-4xl shadow-xs transition-all`}
                    >
                      {sym}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Feedback */}
          {isAnswered && (
            <div
              className={`p-4 rounded-2xl flex items-center gap-3 ${
                isCorrect ? 'bg-[#EAF7EF] text-[#167A55]' : 'bg-amber-50 text-amber-800'
              }`}
            >
              <span className="text-2xl">{isCorrect ? '🌸' : '💡'}</span>
              <p className="text-base sm:text-lg font-black">
                {isCorrect
                  ? (isHindi ? 'शानदार एकाग्रता! सही अंतर पहचाना।' : 'Wonderful attention to detail!')
                  : (isHindi ? 'कोई बात नहीं! हर तुलना एकाग्रता बढ़ाती है।' : 'Good try! Comparing symbols strengthens visual tracking.')}
              </p>
            </div>
          )}
        </div>
      )}

      {/* STAGE 3: RESULT */}
      {stage === 'result' && (
        <div className="bg-white border-3 border-[#D7BDE2] rounded-[2.5rem] p-8 sm:p-12 shadow-sm space-y-8 text-center">
          <div className="w-24 h-24 mx-auto rounded-3xl bg-[#F5EEF8] border-2 border-[#8E44AD]/30 flex items-center justify-center text-5xl shadow-xs">
            🏆
          </div>

          <div className="space-y-2 max-w-xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-black text-[#102A43]">
              {isHindi ? 'बहुत खूब!' : 'Well done!'}
            </h2>
            <p className="text-lg text-[#5D7184] font-bold">
              {isHindi
                ? 'आपने एकाग्रता और अंतर खोजने का सुंदर अभ्यास किया!'
                : 'You engaged your visual attention and concentration!'}
            </p>
          </div>

          {/* Score Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
            <div className="p-5 rounded-2xl bg-[#F5EEF8] border-2 border-[#8E44AD]/30">
              <div className="text-xs font-black text-[#8E44AD] uppercase tracking-wider mb-1">
                {isHindi ? 'गतिविधि शुद्धता' : 'Activity Accuracy'}
              </div>
              <div className="text-3xl font-black text-[#102A43]">
                {calculateAccuracy(correctCount, DIFFERENCE_QUESTIONS.length)}%
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-purple-50 border-2 border-purple-200">
              <div className="text-xs font-black text-purple-700 uppercase tracking-wider mb-1">
                {isHindi ? 'सही उत्तर' : 'Correct Answers'}
              </div>
              <div className="text-3xl font-black text-[#102A43]">
                {correctCount} / {DIFFERENCE_QUESTIONS.length}
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
              className="tactile-btn w-full sm:w-auto px-8 py-4 rounded-2xl bg-[#8E44AD] hover:bg-[#7D3C98] text-white font-black text-xl flex items-center justify-center gap-2 shadow cursor-pointer"
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
