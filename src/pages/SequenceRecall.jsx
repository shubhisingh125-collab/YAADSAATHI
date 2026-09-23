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
  shuffleOptions,
  validateAnswer,
  SEQUENCE_SYMBOLS,
  generateSequence,
  generateSequenceQuestions,
} from '../logic/cognitiveActivityEngine.js';

export default function SequenceRecall() {
  const { navigateTo, sounds, voice } = useApp();
  const { isHindi } = useI18n();

  const [stage, setStage] = useState('intro'); // 'intro', 'remember', 'recall', 'result'
  const [sequence, setSequence] = useState([]);
  const [countdown, setCountdown] = useState(8);
  const [currentDifficulty, setCurrentDifficulty] = useState(DifficultyLevel.GENTLE);
  const countdownRef = useRef(null);

  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(null);

  const [correctCount, setCorrectCount] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [responseTimes, setResponseTimes] = useState([]);

  const questionStartTimeRef = useRef(Date.now());
  const gameStartTimeRef = useRef(Date.now());
  const activeSessionRef = useRef({ sessionId: null, startedAt: null });

  useEffect(() => {
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []);

  const handleStartGame = async () => {
    sounds.playClickChime();

    // Determine starting difficulty adaptively
    const userId = gamePersistenceService.getOrCreateLocalUserId();
    const diff = await getStartingDifficulty('sequence-recall', userId);
    setCurrentDifficulty(diff);

    // Adapt sequence length: Level 1 -> 3, Level 2 -> 4, Level 3+ -> 5
    const seqLen = diff <= 1 ? 3 : diff === 2 ? 4 : 5;
    const newSeq = generateSequence(seqLen);
    setSequence(newSeq);
    setStage('remember');
    const displayTime = seqLen === 3 ? 8 : 10;
    setCountdown(displayTime);
    gameStartTimeRef.current = Date.now();

    try {
      const session = await gamePersistenceService.startGameSession({
        gameId: 'sequence-recall',
        difficultyLevel: diff,
      });
      activeSessionRef.current = session;
    } catch (err) {
      console.warn('[SequenceRecall] Session start warning:', err);
    }

    voice.speak(
      'प्रतीकों के क्रम को ध्यान से देखें। जब आप तैयार हों, आगे बढ़ें दबाएं।',
      'Look at the order of the symbols carefully. Tap continue when ready.'
    );

    if (countdownRef.current) clearInterval(countdownRef.current);
    countdownRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownRef.current);
          startRecallPhase(newSeq);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const startRecallPhase = (seqToUse) => {
    if (countdownRef.current) clearInterval(countdownRef.current);
    sounds.playClickChime();
    const generatedQuestions = generateSequenceQuestions(seqToUse || sequence);
    setQuestions(generatedQuestions);
    setCurrentIdx(0);
    setSelectedOptionId(null);
    setIsAnswered(false);
    setIsCorrect(null);
    setCorrectCount(0);
    setAttempts(0);
    setMistakes(0);
    setResponseTimes([]);
    setStage('recall');
    questionStartTimeRef.current = Date.now();

    voice.speak(
      'आइए देखें कि आपको क्रम कितना याद है। पहला प्रश्न देखें।',
      'Let us see how well you remember the order. Look at the first question.'
    );
  };

  const handleSelectOption = (option) => {
    if (isAnswered) return;

    const currentQ = questions[currentIdx];
    const correct = validateAnswer(currentQ.target.id, option.id);
    const respTimeSec = Number(((Date.now() - questionStartTimeRef.current) / 1000).toFixed(1));

    setSelectedOptionId(option.id);
    setIsAnswered(true);
    setIsCorrect(correct);
    setAttempts((prev) => prev + 1);
    setResponseTimes((prev) => [...prev, respTimeSec]);

    if (correct) {
      sounds.playSuccessChime();
      setCorrectCount((prev) => prev + 1);
      voice.speak('बहुत बढ़िया! सही उत्तर है।', 'Wonderful! That is correct.');
    } else {
      sounds.playEncouragementChime();
      setMistakes((prev) => prev + 1);
      voice.speak('कोई बात नहीं, अगला प्रयास करें।', 'Good try, let us try the next one.');
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

  const finishActivity = async (finalCorrectCount) => {
    setStage('result');
    const totalQ = questions.length || 3;
    const accuracy = calculateAccuracy(finalCorrectCount, totalQ);
    const score = calculateScore(accuracy);
    const totalDuration = Math.max(1, Math.round((Date.now() - gameStartTimeRef.current) / 1000));
    const avgResponseTime = Number((totalDuration / totalQ).toFixed(1));

    if (accuracy >= 66) {
      confetti({ particleCount: 40, spread: 60, origin: { y: 0.6 } });
      sounds.playSuccessChime();
    }

    try {
      await gamePersistenceService.saveGameResult({
        gameId: 'sequence-recall',
        sessionId: activeSessionRef.current.sessionId,
        score,
        accuracy,
        responseTime: avgResponseTime,
        attempts: attempts + 1,
        mistakes,
        hintsUsed: 0,
        difficultyLevel: currentDifficulty || DifficultyLevel.GENTLE,
        cognitiveDomain: CognitiveDomain.WORKING_MEMORY,
        startedAt: activeSessionRef.current.startedAt,
        completedAt: new Date().toISOString(),
        metadata: {
          sequenceLength: sequence.length,
          totalQuestions: totalQ,
          correctCount: finalCorrectCount,
        },
      });
    } catch (err) {
      console.warn('[SequenceRecall] Persistence warning:', err);
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
      <div className="bg-[#EBF5FB] rounded-[2.5rem] p-6 sm:p-8 border-2 border-[#2980B9]/20 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <button
            onClick={() => {
              sounds.playClickChime();
              navigateTo('games');
            }}
            className="inline-flex items-center gap-2 text-sm font-black text-[#2980B9] hover:text-[#1B4F72] mb-2 cursor-pointer transition-colors"
          >
            <ArrowLeft className="w-4 h-4 stroke-[3]" />
            <span>{isHindi ? 'सभी खेलों पर लौटें' : 'Back to Activities'}</span>
          </button>
          <div className="flex items-center gap-2">
            <span className="text-3xl">⚡</span>
            <h1 className="text-3xl sm:text-4xl font-black text-[#102A43]">
              {isHindi ? 'क्रम स्मरण' : 'Sequence Recall'}
            </h1>
          </div>
          <p className="mt-1 text-lg font-bold text-[#2980B9]">
            {isHindi
              ? 'प्रतीकों के क्रम को याद रखने का सरल व सुखद अभ्यास'
              : 'A gentle exercise to remember the sequence of colorful symbols'}
          </p>
        </div>

        <VoiceButton
          id="sequence-recall-header-voice"
          textHindi="क्रम स्मरण: प्रतीकों के क्रम को याद करें और सही उत्तर चुनें।"
          textEnglish="Sequence Recall: Remember the order of symbols and choose the correct answer."
          size="lg"
          label={isHindi ? 'निर्देश सुनें' : 'Listen Guidance'}
        />
      </div>

      {/* STAGE 1: INTRO */}
      {stage === 'intro' && (
        <div className="bg-white border-3 border-[#D4E6F1] rounded-[2.5rem] p-8 sm:p-12 shadow-sm space-y-8 text-center">
          <div className="w-24 h-24 mx-auto rounded-3xl bg-[#EBF5FB] border-2 border-[#2980B9]/30 flex items-center justify-center text-5xl shadow-xs">
            ✨
          </div>

          <div className="space-y-3 max-w-xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-black text-[#102A43]">
              {isHindi ? 'प्रतीकों का क्रम याद रखें' : 'Remember the Sequence'}
            </h2>
            <p className="text-lg text-[#5D7184] font-medium leading-relaxed">
              {isHindi
                ? 'हम आपको कुछ सुंदर प्रतीक क्रम में दिखाएंगे। उन्हें ध्यान से देखें, फिर पूछे जाने पर क्रम बताएं।'
                : 'A short sequence of friendly symbols will appear. Observe the order calmly, then answer simple questions.'}
            </p>
          </div>

          <div>
            <button
              onClick={handleStartGame}
              className="tactile-btn px-10 py-5 rounded-2xl bg-[#2980B9] hover:bg-[#1F618D] text-white font-black text-2xl inline-flex items-center justify-center gap-3 shadow-lg cursor-pointer"
            >
              <span>{isHindi ? 'शुरू करें' : 'Start Activity'}</span>
              <ArrowRight className="w-6 h-6 stroke-[3]" />
            </button>
          </div>
        </div>
      )}

      {/* STAGE 2: REMEMBER */}
      {stage === 'remember' && (
        <div className="bg-white border-3 border-[#D4E6F1] rounded-[2.5rem] p-6 sm:p-10 shadow-sm space-y-8 text-center">
          <div className="flex items-center justify-between pb-4 border-b-2 border-slate-100">
            <div>
              <span className="inline-block px-3.5 py-1 rounded-full bg-[#EBF5FB] text-[#2980B9] text-xs font-black uppercase tracking-wider mb-1">
                {isHindi ? 'चरण 1: क्रम ध्यान से देखें' : 'Step 1: Observe Sequence'}
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-[#102A43]">
                {isHindi ? 'इस क्रम को याद रखें' : 'Remember This Order'}
              </h2>
            </div>

            <div className="px-4 py-2 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 font-black text-sm flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600" />
              <span>{countdown}s</span>
            </div>
          </div>

          {/* Large Sequence Display */}
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 py-6">
            {sequence.map((item, idx) => (
              <React.Fragment key={item.id}>
                <div className="p-6 sm:p-8 rounded-3xl bg-[#F4F6F7] border-3 border-[#2980B9]/40 flex flex-col items-center gap-2 shadow-xs min-w-[120px]">
                  <span className="text-xs font-black text-[#2980B9] uppercase">#{idx + 1}</span>
                  <span className="text-6xl sm:text-7xl">{item.symbol}</span>
                  <span className="text-sm font-bold text-[#102A43]">
                    {isHindi ? item.nameHindi : item.nameEnglish}
                  </span>
                </div>
                {idx < sequence.length - 1 && (
                  <ArrowRight className="w-8 h-8 text-[#2980B9]/60 stroke-[3] hidden sm:block" />
                )}
              </React.Fragment>
            ))}
          </div>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm font-bold text-[#5D7184]">
              {isHindi
                ? 'शांति से देखें। जब आप तैयार हों, बटन दबाएं।'
                : 'Take your time. When you feel ready, tap continue.'}
            </p>

            <button
              onClick={() => startRecallPhase(sequence)}
              className="tactile-btn w-full sm:w-auto px-8 py-4 rounded-2xl bg-[#2980B9] hover:bg-[#1F618D] text-white font-black text-xl flex items-center justify-center gap-2 shadow cursor-pointer"
            >
              <span>{isHindi ? 'आगे बढ़ें (मुझे याद है)' : 'I Remember / Continue'}</span>
              <ArrowRight className="w-5 h-5 stroke-[3]" />
            </button>
          </div>
        </div>
      )}

      {/* STAGE 3: RECALL */}
      {stage === 'recall' && questions.length > 0 && (
        <div className="bg-white border-3 border-[#D4E6F1] rounded-[2.5rem] p-6 sm:p-10 shadow-sm space-y-8">
          <div className="flex items-center justify-between pb-4 border-b-2 border-slate-100">
            <div>
              <span className="inline-block px-3.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-black uppercase tracking-wider mb-1">
                {isHindi
                  ? `प्रश्न ${currentIdx + 1} / ${questions.length}`
                  : `Question ${currentIdx + 1} of ${questions.length}`}
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

          {/* 4 Large Choice Buttons */}
          <div className="grid grid-cols-2 gap-4">
            {questions[currentIdx].options.map((option) => {
              const isSelected = selectedOptionId === option.id;
              const isTarget = option.id === questions[currentIdx].target.id;

              let btnStyle = 'bg-[#F4F6F7] border-2 border-slate-200 hover:border-[#2980B9]/60 text-[#102A43]';
              if (isAnswered) {
                if (isTarget) {
                  btnStyle = 'bg-[#EBF5FB] border-3 border-[#2980B9] text-[#2980B9] font-black shadow-sm';
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
                    <CheckCircle2 className="w-6 h-6 text-[#2980B9] stroke-[3]" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Visual Feedback Message */}
          {isAnswered && (
            <div
              className={`p-4 rounded-2xl flex items-center gap-3 ${
                isCorrect ? 'bg-[#EBF5FB] text-[#2980B9]' : 'bg-amber-50 text-amber-800'
              }`}
            >
              <span className="text-2xl">{isCorrect ? '🌸' : '💡'}</span>
              <p className="text-base sm:text-lg font-black">
                {isCorrect
                  ? (isHindi ? 'शानदार! सही उत्तर है।' : 'Splendid! That is correct.')
                  : (isHindi ? 'कोई बात नहीं, हर कोशिश मन को सजग रखती है।' : 'Good attempt! Every try keeps your working memory fresh.')}
              </p>
            </div>
          )}
        </div>
      )}

      {/* STAGE 4: RESULT */}
      {stage === 'result' && (
        <div className="bg-white border-3 border-[#D4E6F1] rounded-[2.5rem] p-8 sm:p-12 shadow-sm space-y-8 text-center">
          <div className="w-24 h-24 mx-auto rounded-3xl bg-[#EBF5FB] border-2 border-[#2980B9]/30 flex items-center justify-center text-5xl shadow-xs">
            🏆
          </div>

          <div className="space-y-2 max-w-xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-black text-[#102A43]">
              {isHindi ? 'बहुत खूब!' : 'Well done!'}
            </h2>
            <p className="text-lg text-[#5D7184] font-bold">
              {isHindi
                ? 'आपने प्रतीकों के क्रम को याद रखने का सुंदर अभ्यास किया!'
                : 'You engaged your working memory with sequential symbols!'}
            </p>
          </div>

          {/* Score Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
            <div className="p-5 rounded-2xl bg-[#EBF5FB] border-2 border-[#2980B9]/30">
              <div className="text-xs font-black text-[#2980B9] uppercase tracking-wider mb-1">
                {isHindi ? 'गतिविधि शुद्धता' : 'Activity Accuracy'}
              </div>
              <div className="text-3xl font-black text-[#102A43]">
                {calculateAccuracy(correctCount, questions.length)}%
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-blue-50 border-2 border-blue-200">
              <div className="text-xs font-black text-blue-700 uppercase tracking-wider mb-1">
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
              className="tactile-btn w-full sm:w-auto px-8 py-4 rounded-2xl bg-[#2980B9] hover:bg-[#1F618D] text-white font-black text-xl flex items-center justify-center gap-2 shadow cursor-pointer"
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
