import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  RotateCcw,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Plus,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useI18n } from '../i18n/I18nContext';
import VoiceButton from '../components/VoiceButton';
import * as memoryRepository from '../database/repositories/memoryRepository.js';
import * as gamePersistenceService from '../services/gamePersistenceService.js';
import { CognitiveDomain } from '../domain/cognitive/cognitiveTypes.js';
import { DifficultyLevel } from '../domain/cognitive/difficultyTypes.js';
import { MemoryItemType } from '../domain/memory/memoryTypes.js';
import {
  calculateAccuracy,
  calculateScore,
  shuffleOptions,
  validateAnswer,
} from '../logic/cognitiveActivityEngine.js';

const RELATIONSHIP_OPTIONS = ['बेटा (Son)', 'बेटी (Daughter)', 'पोता (Grandson)', 'भाई (Brother)', 'बहन (Sister)', 'मित्र (Friend)', 'जीवनसाथी (Spouse)'];
const LOCATION_OPTIONS = ['पैतृक गाँव (Native Village)', 'शिलांग (Shillong)', 'गुवाहाटी (Guwahati)', 'पुराना घर (Old Home)', 'कामाख्या (Kamakhya)'];

function generateReminiscenceQuestions(memories, rng = Math.random) {
  if (!memories || memories.length === 0) return [];

  return memories.slice(0, 5).map((mem, idx) => {
    let promptEnglish = '';
    let promptHindi = '';
    let correctAnswer = '';
    let distractors = [];

    if (mem.type === MemoryItemType.FAMILY_MEMBER && mem.relationship) {
      promptEnglish = `How is ${mem.title} related to you?`;
      promptHindi = `${mem.title} आपके क्या लगते हैं?`;
      correctAnswer = mem.relationship;
      distractors = RELATIONSHIP_OPTIONS.filter((r) => !r.toLowerCase().includes(mem.relationship.toLowerCase())).slice(0, 3);
    } else if (mem.locationContext) {
      promptEnglish = `Where is this memory of "${mem.title}" connected to?`;
      promptHindi = `"${mem.title}" का यह संस्मरण किस स्थान से जुड़ा है?`;
      correctAnswer = mem.locationContext;
      distractors = LOCATION_OPTIONS.filter((l) => !l.toLowerCase().includes(mem.locationContext.toLowerCase())).slice(0, 3);
    } else {
      promptEnglish = `Which cherished memory is shown here?`;
      promptHindi = `यहाँ कौन सा प्रिय संस्मरण दर्शाया गया है?`;
      correctAnswer = mem.title;
      distractors = memories.filter((m) => m.id !== mem.id).map((m) => m.title).slice(0, 3);
      if (distractors.length < 3) {
        distractors.push('पारिवारिक उत्सव (Family Event)', 'पुरानी यात्रा (Past Trip)', 'बचपन की याद (Childhood Memory)');
        distractors = distractors.slice(0, 3);
      }
    }

    const options = shuffleOptions([correctAnswer, ...distractors], rng);

    return {
      id: `rq-${mem.id || idx}`,
      memory: mem,
      promptEnglish,
      promptHindi,
      correctAnswer,
      options,
    };
  });
}

export default function PersonalMemory() {
  const { navigateTo, sounds, voice } = useApp();
  const { isHindi } = useI18n();

  const [stage, setStage] = useState('loading'); // 'loading', 'empty', 'intro', 'play', 'result'
  const [memories, setMemories] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);

  const [selectedOption, setSelectedOption] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(null);

  const [correctCount, setCorrectCount] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [mistakes, setMistakes] = useState(0);

  const gameStartTimeRef = useRef(Date.now());
  const activeSessionRef = useRef({ sessionId: null, startedAt: null });

  const userId = gamePersistenceService.getOrCreateLocalUserId();

  useEffect(() => {
    async function loadData() {
      try {
        const stored = await memoryRepository.getMemories(userId);
        if (stored && stored.length > 0) {
          setMemories(stored);
          setStage('intro');
        } else {
          setStage('empty');
        }
      } catch (err) {
        console.warn('[PersonalMemory] Failed to load memories:', err);
        setStage('empty');
      }
    }
    loadData();
  }, [userId]);

  const handleStartGame = async () => {
    sounds.playClickChime();
    const generated = generateReminiscenceQuestions(memories);
    setQuestions(generated);
    setCurrentIdx(0);
    setCorrectCount(0);
    setAttempts(0);
    setMistakes(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setIsCorrect(null);
    setStage('play');
    gameStartTimeRef.current = Date.now();

    try {
      const session = await gamePersistenceService.startGameSession({
        gameId: 'personal-memory',
        difficultyLevel: DifficultyLevel.GENTLE,
      });
      activeSessionRef.current = session;
    } catch (err) {
      console.warn('[PersonalMemory] Session start warning:', err);
    }

    voice.speak(
      'आइए अपने परिवार और प्रिय संस्मरणों को याद करें।',
      'Let us reflect on cherished memories and family moments.'
    );
  };

  const handleSelectOption = (option) => {
    if (isAnswered) return;

    const currentQ = questions[currentIdx];
    const correct = validateAnswer(currentQ.correctAnswer, option);

    setSelectedOption(option);
    setIsAnswered(true);
    setIsCorrect(correct);
    setAttempts((prev) => prev + 1);

    if (correct) {
      sounds.playSuccessChime();
      setCorrectCount((prev) => prev + 1);
      voice.speak('बहुत सुंदर! सुखद यादें मन को शांति देती हैं।', 'Splendid! Cherished memories bring peaceful warmth.');
    } else {
      sounds.playEncouragementChime();
      setMistakes((prev) => prev + 1);
      voice.speak('कोई बात नहीं, आइए अगली याद देखें।', 'That is okay, let us look at another memory.');
    }

    setTimeout(() => {
      if (currentIdx + 1 < questions.length) {
        setCurrentIdx((prev) => prev + 1);
        setSelectedOption(null);
        setIsAnswered(false);
        setIsCorrect(null);
      } else {
        finishActivity(correct ? correctCount + 1 : correctCount);
      }
    }, 1800);
  };

  const finishActivity = async (finalCorrect) => {
    setStage('result');
    const totalQ = questions.length || 1;
    const accuracy = calculateAccuracy(finalCorrect, totalQ);
    const score = calculateScore(accuracy);
    const totalDuration = Math.max(1, Math.round((Date.now() - gameStartTimeRef.current) / 1000));
    const avgResponseTime = Number((totalDuration / totalQ).toFixed(1));

    confetti({ particleCount: 35, spread: 60, origin: { y: 0.6 } });
    sounds.playSuccessChime();

    try {
      await gamePersistenceService.saveGameResult({
        gameId: 'personal-memory',
        sessionId: activeSessionRef.current.sessionId,
        score,
        accuracy,
        responseTime: avgResponseTime,
        attempts: attempts + 1,
        mistakes,
        hintsUsed: 0,
        difficultyLevel: DifficultyLevel.GENTLE,
        cognitiveDomain: CognitiveDomain.REMINISCENCE,
        startedAt: activeSessionRef.current.startedAt,
        completedAt: new Date().toISOString(),
        metadata: {
          totalQuestions: totalQ,
          correctCount: finalCorrect,
          memoriesCount: memories.length,
        },
      });
    } catch (err) {
      console.warn('[PersonalMemory] Persistence warning:', err);
    }
  };

  const handleRestart = () => {
    sounds.playClickChime();
    setStage('intro');
    setSelectedOption(null);
    setIsAnswered(false);
    setIsCorrect(null);
    setCorrectCount(0);
    setAttempts(0);
    setMistakes(0);
  };

  // EMPTY STATE: No memories added yet
  if (stage === 'empty') {
    return (
      <div className="space-y-6 pb-12 animate-slow-fade text-left select-none max-w-2xl mx-auto">
        <div className="bg-white border-3 border-[#FFE4E9] rounded-[2.5rem] p-8 sm:p-12 text-center space-y-6 shadow-sm">
          <div className="text-6xl">❤️</div>
          <h2 className="text-3xl font-black text-[#102A43]">
            {isHindi ? 'पहले एक पारिवारिक याद जोड़ें' : 'Add a Personal Memory First'}
          </h2>
          <p className="text-lg text-[#5D7184] font-medium leading-relaxed">
            {isHindi
              ? 'यह गतिविधि आपके अपने परिवार के सदस्यों और प्रिय पलों पर आधारित है। कृपया पहले अपनी एक या दो यादें जोड़ें।'
              : 'This gentle reminiscence activity reflects on your own family members and places. Please add a memory first to begin.'}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <button
              onClick={() => {
                sounds.playClickChime();
                navigateTo('personal-memories');
              }}
              className="tactile-btn px-8 py-4 rounded-2xl bg-[#E84D78] hover:bg-[#C2185B] text-white font-black text-xl inline-flex items-center gap-2 shadow cursor-pointer"
            >
              <Plus className="w-5 h-5 stroke-[3]" />
              <span>{isHindi ? 'यादें जोड़ें (मेरी यादें)' : 'Add Memory'}</span>
            </button>
            <button
              onClick={() => {
                sounds.playClickChime();
                navigateTo('games');
              }}
              className="px-6 py-4 rounded-2xl bg-slate-100 text-slate-700 font-black text-lg cursor-pointer"
            >
              <span>{isHindi ? 'खेल सूची पर लौटें' : 'Back to Activities'}</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentIdx];

  return (
    <div className="space-y-6 pb-12 animate-slow-fade text-left select-none max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-[#FFF0F3] rounded-[2.5rem] p-6 sm:p-8 border-2 border-[#E84D78]/20 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <button
            onClick={() => {
              sounds.playClickChime();
              navigateTo('games');
            }}
            className="inline-flex items-center gap-2 text-sm font-black text-[#E84D78] hover:text-[#C2185B] mb-2 cursor-pointer transition-colors"
          >
            <ArrowLeft className="w-4 h-4 stroke-[3]" />
            <span>{isHindi ? 'सभी खेलों पर लौटें' : 'Back to Activities'}</span>
          </button>
          <div className="flex items-center gap-2">
            <span className="text-3xl">❤️</span>
            <h1 className="text-3xl sm:text-4xl font-black text-[#102A43]">
              {isHindi ? 'मेरी यादें (संस्मरण अभ्यास)' : 'Personal Memory Reminiscence'}
            </h1>
          </div>
          <p className="mt-1 text-lg font-bold text-[#E84D78]">
            {isHindi
              ? 'परिवार के सदस्यों और प्रिय संस्मरणों के साथ एक शांत व स्नेहपूर्ण बातचीत'
              : 'A warm, comforting reflection on personal memories and family moments'}
          </p>
        </div>

        <VoiceButton
          id="personal-memory-voice"
          textHindi="पारिवारिक यादें: आइए अपने प्रियजनों और सुखद संस्मरणों को याद करें।"
          textEnglish="Personal Memory: Let us reflect on family moments and cherished memories."
          size="lg"
          label={isHindi ? 'निर्देश सुनें' : 'Listen Guidance'}
        />
      </div>

      {/* STAGE: INTRO */}
      {stage === 'intro' && (
        <div className="bg-white border-3 border-[#FFE4E9] rounded-[2.5rem] p-8 sm:p-12 shadow-sm space-y-8 text-center">
          <div className="w-24 h-24 mx-auto rounded-3xl bg-[#FFF0F3] border-2 border-[#E84D78]/30 flex items-center justify-center text-5xl shadow-xs">
            🌸
          </div>

          <div className="space-y-3 max-w-xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-black text-[#102A43]">
              {isHindi ? 'स्नेहपूर्ण संस्मरण गतिविधि' : 'Warm Reminiscence Activity'}
            </h2>
            <p className="text-lg text-[#5D7184] font-medium leading-relaxed">
              {isHindi
                ? 'यहाँ कोई गलत उत्तर नहीं होता। यह आपकी अपनी पारिवारिक तस्वीरों और संस्मरणों के साथ मन को शांत व सक्रिय रखने की गतिविधि है।'
                : 'There are no stressful tests here. Enjoy peaceful reflection with your family memories and cherished moments.'}
            </p>
          </div>

          <div>
            <button
              onClick={handleStartGame}
              className="tactile-btn px-10 py-5 rounded-2xl bg-[#E84D78] hover:bg-[#C2185B] text-white font-black text-2xl inline-flex items-center justify-center gap-3 shadow-lg cursor-pointer"
            >
              <span>{isHindi ? 'शुरू करें' : 'Start Activity'}</span>
              <ArrowRight className="w-6 h-6 stroke-[3]" />
            </button>
          </div>
        </div>
      )}

      {/* STAGE: PLAY */}
      {stage === 'play' && currentQ && (
        <div className="bg-white border-3 border-[#FFE4E9] rounded-[2.5rem] p-6 sm:p-10 shadow-sm space-y-8">
          <div className="flex items-center justify-between pb-4 border-b-2 border-slate-100">
            <div>
              <span className="inline-block px-3.5 py-1 rounded-full bg-rose-50 text-rose-700 text-xs font-black uppercase tracking-wider mb-1">
                {isHindi
                  ? `संस्मरण ${currentIdx + 1} / ${questions.length}`
                  : `Memory ${currentIdx + 1} of ${questions.length}`}
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

          {/* Memory Visual Card */}
          <div className="p-6 rounded-3xl bg-[#FFF9FA] border-2 border-[#FFE4E9] max-w-md mx-auto space-y-3 text-center">
            {currentQ.memory.mediaUrl ? (
              <div className="w-full h-52 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shadow-xs">
                <img
                  src={currentQ.memory.mediaUrl}
                  alt={currentQ.memory.title}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-20 h-20 mx-auto rounded-2xl bg-rose-100 flex items-center justify-center text-4xl shadow-xs">
                ❤️
              </div>
            )}
            <h3 className="text-2xl font-black text-[#102A43]">{currentQ.memory.title}</h3>
            {currentQ.memory.description && (
              <p className="text-base text-[#5D7184] font-medium italic">
                "{currentQ.memory.description}"
              </p>
            )}
          </div>

          {/* 4 Large Choice Options */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {currentQ.options.map((opt, oIdx) => {
              const isSelected = selectedOption === opt;
              const isTarget = validateAnswer(currentQ.correctAnswer, opt);

              let btnStyle = 'bg-[#FFFDFB] border-2 border-slate-200 hover:border-[#E84D78]/60 text-[#102A43]';
              if (isAnswered) {
                if (isTarget) {
                  btnStyle = 'bg-[#EAF7EF] border-3 border-[#167A55] text-[#167A55] font-black shadow-sm';
                } else if (isSelected) {
                  btnStyle = 'bg-rose-50 border-2 border-rose-300 text-rose-800';
                } else {
                  btnStyle = 'bg-slate-50 border border-slate-200 text-slate-400 opacity-60';
                }
              }

              return (
                <button
                  key={oIdx}
                  disabled={isAnswered}
                  onClick={() => handleSelectOption(opt)}
                  className={`tactile-btn p-5 rounded-2xl ${btnStyle} flex items-center justify-between text-left transition-all cursor-pointer`}
                >
                  <span className="text-xl sm:text-2xl font-black">{opt}</span>
                  {isAnswered && isTarget && (
                    <CheckCircle2 className="w-6 h-6 text-[#167A55] stroke-[3]" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Supportive Non-punitive Feedback */}
          {isAnswered && (
            <div
              className={`p-4 rounded-2xl flex items-center gap-3 ${
                isCorrect ? 'bg-[#EAF7EF] text-[#167A55]' : 'bg-rose-50 text-rose-800'
              }`}
            >
              <span className="text-2xl">{isCorrect ? '🌸' : '❤️'}</span>
              <p className="text-base sm:text-lg font-black">
                {isCorrect
                  ? (isHindi ? 'अति सुंदर! अपने प्रियजनों को याद रखना मन को सुख देता है।' : 'Wonderful! Remembering family moments brings peaceful comfort.')
                  : (isHindi ? 'कोई बात नहीं! यह आपकी अपनी सुखद याद है।' : 'That is okay! Cherished moments always remain in our hearts.')}
              </p>
            </div>
          )}
        </div>
      )}

      {/* STAGE: RESULT */}
      {stage === 'result' && (
        <div className="bg-white border-3 border-[#FFE4E9] rounded-[2.5rem] p-8 sm:p-12 shadow-sm space-y-8 text-center">
          <div className="w-24 h-24 mx-auto rounded-3xl bg-[#FFF0F3] border-2 border-[#E84D78]/30 flex items-center justify-center text-5xl shadow-xs">
            🌺
          </div>

          <div className="space-y-2 max-w-xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-black text-[#102A43]">
              {isHindi ? 'सुखद संस्मरण पूर्ण हुआ!' : 'Peaceful Reminiscence Complete!'}
            </h2>
            <p className="text-lg text-[#5D7184] font-bold">
              {isHindi
                ? 'आपने अपने परिवार और अनमोल यादों के साथ एक सुंदर समय बिताया।'
                : 'You spent meaningful, comforting time reflecting on personal memories.'}
            </p>
          </div>

          {/* Score Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
            <div className="p-5 rounded-2xl bg-[#FFF0F3] border-2 border-[#E84D78]/30">
              <div className="text-xs font-black text-[#E84D78] uppercase tracking-wider mb-1">
                {isHindi ? 'गतिविधि शुद्धता' : 'Activity Accuracy'}
              </div>
              <div className="text-3xl font-black text-[#102A43]">
                {calculateAccuracy(correctCount, questions.length)}%
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-rose-50 border-2 border-rose-200">
              <div className="text-xs font-black text-rose-700 uppercase tracking-wider mb-1">
                {isHindi ? 'संस्मरण' : 'Reflected'}
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
              className="tactile-btn w-full sm:w-auto px-8 py-4 rounded-2xl bg-[#E84D78] hover:bg-[#C2185B] text-white font-black text-xl flex items-center justify-center gap-2 shadow cursor-pointer"
            >
              <RotateCcw className="w-5 h-5 stroke-[3]" />
              <span>{isHindi ? 'पुनः याद करें' : 'Reflect Again'}</span>
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
