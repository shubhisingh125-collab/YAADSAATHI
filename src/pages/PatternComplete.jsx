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
  validateAnswer,
  PATTERN_QUESTIONS,
  getPreparedPatternQuestions,
} from '../logic/cognitiveActivityEngine.js';

export default function PatternComplete() {
  const { navigateTo, sounds, voice } = useApp();
  const { isHindi } = useI18n();

  const [stage, setStage] = useState('intro'); // 'intro', 'play', 'result'
  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [currentDifficulty, setCurrentDifficulty] = useState(DifficultyLevel.GENTLE);

  const [selectedOptionId, setSelectedOptionId] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(null);

  const [correctCount, setCorrectCount] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [mistakes, setMistakes] = useState(0);

  const gameStartTimeRef = useRef(Date.now());
  const questionStartTimeRef = useRef(Date.now());
  const activeSessionRef = useRef({ sessionId: null, startedAt: null });

  const handleStartGame = async () => {
    sounds.playClickChime();

    const userId = gamePersistenceService.getOrCreateLocalUserId();
    const diff = await getStartingDifficulty('pattern-complete', userId);
    setCurrentDifficulty(diff);

    let prepared = getPreparedPatternQuestions();
    // Sort or filter by pattern difficulty if desired
    if (diff === 1) {
      prepared = prepared.filter((q) => q.patternType === 'ABAB' || q.patternType === 'AABB');
    }
    if (prepared.length === 0) prepared = getPreparedPatternQuestions();

    setQuestions(prepared);
    setCurrentIdx(0);
    setCorrectCount(0);
    setAttempts(0);
    setMistakes(0);
    setSelectedOptionId(null);
    setIsAnswered(false);
    setIsCorrect(null);
    setStage('play');
    gameStartTimeRef.current = Date.now();
    questionStartTimeRef.current = Date.now();

    try {
      const session = await gamePersistenceService.startGameSession({
        gameId: 'pattern-complete',
        difficultyLevel: diff,
      });
      activeSessionRef.current = session;
    } catch (err) {
      console.warn('[PatternComplete] Session start warning:', err);
    }

    voice.speak(
      'पैटर्न को ध्यान से देखें और छूटे हुए प्रतीक को चुनें।',
      'Look at the pattern carefully and choose the missing symbol.'
    );
  };

  const handleSelectOption = (option) => {
    if (isAnswered) return;

    const currentQ = questions[currentIdx];
    const correct = validateAnswer(currentQ.target.id, option.id);

    setSelectedOptionId(option.id);
    setIsAnswered(true);
    setIsCorrect(correct);
    setAttempts((prev) => prev + 1);

    if (correct) {
      sounds.playSuccessChime();
      setCorrectCount((prev) => prev + 1);
      voice.speak('बहुत बढ़िया! पैटर्न पूरा हो गया।', 'Splendid! Pattern completed.');
    } else {
      sounds.playEncouragementChime();
      setMistakes((prev) => prev + 1);
      voice.speak('कोई बात नहीं! अगला पैटर्न देखें।', 'No worries! Take a look at the next pattern.');
    }

    setTimeout(() => {
      if (currentIdx + 1 < questions.length) {
        setCurrentIdx((prev) => prev + 1);
        setSelectedOptionId(null);
        setIsAnswered(false);
        setIsCorrect(null);
        questionStartTimeRef.current = Date.now();
      } else {
        finishActivity(correct ? correctCount + 1 : correctCount);
      }
    }, 1500);
  };

  const finishActivity = async (finalCorrect) => {
    setStage('result');
    const totalQ = questions.length || 5;
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
        gameId: 'pattern-complete',
        sessionId: activeSessionRef.current.sessionId,
        score,
        accuracy,
        responseTime: avgResponseTime,
        attempts: attempts + 1,
        mistakes,
        hintsUsed: 0,
        difficultyLevel: currentDifficulty || DifficultyLevel.GENTLE,
        cognitiveDomain: CognitiveDomain.PATTERN_RECOGNITION,
        startedAt: activeSessionRef.current.startedAt,
        completedAt: new Date().toISOString(),
        metadata: {
          totalQuestions: totalQ,
          correctCount: finalCorrect,
        },
      });
    } catch (err) {
      console.warn('[PatternComplete] Persistence warning:', err);
    }
  };

  const handleRestart = () => {
    sounds.playClickChime();
    setStage('intro');
    setSelectedOptionId(null);
    setIsAnswered(false);
    setIsCorrect(null);
    setCorrectCount(0);
    setAttempts(0);
    setMistakes(0);
  };

  return (
    <div className="space-y-6 pb-12 animate-slow-fade text-left select-none max-w-4xl mx-auto">
      {/* Header Banner */}
      <div className="bg-[#FFF4E6] rounded-[2.5rem] p-6 sm:p-8 border-2 border-[#E67E22]/20 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <button
            onClick={() => {
              sounds.playClickChime();
              navigateTo('games');
            }}
            className="inline-flex items-center gap-2 text-sm font-black text-[#D35400] hover:text-[#A04000] mb-2 cursor-pointer transition-colors"
          >
            <ArrowLeft className="w-4 h-4 stroke-[3]" />
            <span>{isHindi ? 'सभी खेलों पर लौटें' : 'Back to Activities'}</span>
          </button>
          <div className="flex items-center gap-2">
            <span className="text-3xl">🧩</span>
            <h1 className="text-3xl sm:text-4xl font-black text-[#102A43]">
              {isHindi ? 'पैटर्न पूर्ण करें' : 'Pattern Complete'}
            </h1>
          </div>
          <p className="mt-1 text-lg font-bold text-[#D35400]">
            {isHindi
              ? 'प्रतीकों के सुंदर क्रम को पहचानकर छूटा हुआ हिस्सा चुनें'
              : 'Identify harmonious patterns and select the missing piece'}
          </p>
        </div>

        <VoiceButton
          id="pattern-complete-header-voice"
          textHindi="पैटर्न पूर्ण करें: प्रतीकों के क्रम को ध्यान से देखें और सही उत्तर चुनें।"
          textEnglish="Pattern Complete: Observe the rhythm of symbols and select the missing item."
          size="lg"
          label={isHindi ? 'निर्देश सुनें' : 'Listen Guidance'}
        />
      </div>

      {/* STAGE 1: INTRO */}
      {stage === 'intro' && (
        <div className="bg-white border-3 border-[#FAD7A0] rounded-[2.5rem] p-8 sm:p-12 shadow-sm space-y-8 text-center">
          <div className="w-24 h-24 mx-auto rounded-3xl bg-[#FFF4E6] border-2 border-[#E67E22]/30 flex items-center justify-center text-5xl shadow-xs">
            🧩
          </div>

          <div className="space-y-3 max-w-xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-black text-[#102A43]">
              {isHindi ? 'पैटर्न की पहचान का अभ्यास' : 'Practice Pattern Recognition'}
            </h2>
            <p className="text-lg text-[#5D7184] font-medium leading-relaxed">
              {isHindi
                ? 'प्रत्येक प्रश्न में कुछ प्रतीकों का सुंदर क्रम होगा। अंत में क्या आना चाहिए, उसे 4 विकल्पों में से पहचानें।'
                : 'Each round displays a rhythmic sequence of symbols with one missing. Choose the symbol that fits naturally.'}
            </p>
          </div>

          <div>
            <button
              onClick={handleStartGame}
              className="tactile-btn px-10 py-5 rounded-2xl bg-[#E67E22] hover:bg-[#D35400] text-white font-black text-2xl inline-flex items-center justify-center gap-3 shadow-lg cursor-pointer"
            >
              <span>{isHindi ? 'शुरू करें' : 'Start Activity'}</span>
              <ArrowRight className="w-6 h-6 stroke-[3]" />
            </button>
          </div>
        </div>
      )}

      {/* STAGE 2: PLAY */}
      {stage === 'play' && questions.length > 0 && (
        <div className="bg-white border-3 border-[#FAD7A0] rounded-[2.5rem] p-6 sm:p-10 shadow-sm space-y-8">
          <div className="flex items-center justify-between pb-4 border-b-2 border-slate-100">
            <div>
              <span className="inline-block px-3.5 py-1 rounded-full bg-orange-50 text-orange-700 text-xs font-black uppercase tracking-wider mb-1">
                {isHindi
                  ? `प्रश्न ${currentIdx + 1} / ${questions.length} (${questions[currentIdx].patternType})`
                  : `Question ${currentIdx + 1} of ${questions.length} (${questions[currentIdx].patternType})`}
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-[#102A43]">
                {isHindi ? questions[currentIdx].promptHindi : questions[currentIdx].promptEnglish}
              </h2>
            </div>

            <VoiceButton
              textHindi={questions[currentIdx].promptHindi}
              textEnglish={questions[currentIdx].promptEnglish}
              size="md"
              label={isHindi ? 'प्रश्न सुनें' : 'Listen Question'}
            />
          </div>

          {/* Pattern Strip */}
          <div className="p-6 sm:p-8 rounded-3xl bg-[#FFF9F2] border-3 border-[#E67E22]/30 flex flex-wrap items-center justify-center gap-3 sm:gap-5 shadow-xs">
            {questions[currentIdx].sequence.map((sym, sIdx) => (
              <div
                key={sIdx}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white border-2 border-orange-200 flex items-center justify-center text-4xl sm:text-5xl shadow-2xs"
              >
                {sym}
              </div>
            ))}

            {/* Target Slot (?) */}
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-orange-100 border-3 border-dashed border-[#E67E22] flex items-center justify-center text-3xl font-black text-[#E67E22] animate-pulse">
              {isAnswered ? questions[currentIdx].target.symbol : '?'}
            </div>
          </div>

          {/* 4 Large Choice Options */}
          <div className="grid grid-cols-2 gap-4">
            {questions[currentIdx].options.map((option) => {
              const isSelected = selectedOptionId === option.id;
              const isTarget = option.id === questions[currentIdx].target.id;

              let btnStyle = 'bg-[#FFFDFB] border-2 border-slate-200 hover:border-[#E67E22]/60 text-[#102A43]';
              if (isAnswered) {
                if (isTarget) {
                  btnStyle = 'bg-[#FFF4E6] border-3 border-[#E67E22] text-[#D35400] font-black shadow-sm';
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
                  className={`tactile-btn p-6 rounded-2xl ${btnStyle} flex flex-col items-center justify-center gap-2 text-center transition-all cursor-pointer`}
                >
                  <span className="text-5xl sm:text-6xl">{option.symbol}</span>
                  <span className="text-lg font-black">
                    {isHindi ? option.nameHindi : option.nameEnglish}
                  </span>
                  {isAnswered && isTarget && (
                    <CheckCircle2 className="w-6 h-6 text-[#E67E22] stroke-[3]" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Feedback Banner */}
          {isAnswered && (
            <div
              className={`p-4 rounded-2xl flex items-center gap-3 ${
                isCorrect ? 'bg-[#FFF4E6] text-[#D35400]' : 'bg-amber-50 text-amber-800'
              }`}
            >
              <span className="text-2xl">{isCorrect ? '🌸' : '💡'}</span>
              <p className="text-base sm:text-lg font-black">
                {isCorrect
                  ? (isHindi ? 'शानदार पहचान! सही प्रतीक चुना।' : 'Splendid pattern recognition!')
                  : (isHindi ? 'अच्छा प्रयास! हर पैटर्न मन को एकाग्र करता है।' : 'Good try! Practicing patterns stimulates concentration.')}
              </p>
            </div>
          )}
        </div>
      )}

      {/* STAGE 3: RESULT */}
      {stage === 'result' && (
        <div className="bg-white border-3 border-[#FAD7A0] rounded-[2.5rem] p-8 sm:p-12 shadow-sm space-y-8 text-center">
          <div className="w-24 h-24 mx-auto rounded-3xl bg-[#FFF4E6] border-2 border-[#E67E22]/30 flex items-center justify-center text-5xl shadow-xs">
            🏆
          </div>

          <div className="space-y-2 max-w-xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-black text-[#102A43]">
              {isHindi ? 'बहुत खूब!' : 'Well done!'}
            </h2>
            <p className="text-lg text-[#5D7184] font-bold">
              {isHindi
                ? 'आपने पैटर्न पहचान की सभी गतिविधियां सफलतापूर्वक पूरी कीं!'
                : 'You engaged your pattern recognition with colorful rhythms!'}
            </p>
          </div>

          {/* Score Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
            <div className="p-5 rounded-2xl bg-[#FFF4E6] border-2 border-[#E67E22]/30">
              <div className="text-xs font-black text-[#D35400] uppercase tracking-wider mb-1">
                {isHindi ? 'गतिविधि शुद्धता' : 'Activity Accuracy'}
              </div>
              <div className="text-3xl font-black text-[#102A43]">
                {calculateAccuracy(correctCount, questions.length)}%
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-orange-50 border-2 border-orange-200">
              <div className="text-xs font-black text-orange-700 uppercase tracking-wider mb-1">
                {isHindi ? 'सही उत्तर' : 'Correct Answers'}
              </div>
              <div className="text-3xl font-black text-[#102A43]">
                {correctCount} / {questions.length}
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
              className="tactile-btn w-full sm:w-auto px-8 py-4 rounded-2xl bg-[#E67E22] hover:bg-[#D35400] text-white font-black text-xl flex items-center justify-center gap-2 shadow cursor-pointer"
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
