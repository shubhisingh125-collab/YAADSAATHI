import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { Eye, CheckCircle2, Clock, ArrowRight } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useI18n } from '../i18n/I18nContext';
import GameTopBar from '../components/games/GameTopBar';
import AdaptiveDifficultyCard from '../components/games/AdaptiveDifficultyCard';
import GameCompletionActions from '../components/games/GameCompletionActions';

const THEME = { bg: '#EEE9FF', border: '#7658C8', text: '#7658C8', btnBg: '#7658C8', btnHover: '#6042B3', btnBorder: '#4A2D99' };

// Pool of familiar Indian elder cultural items
const ITEM_POOL = [
  { id: 'diya', nameHindi: 'दीपक (दीया)', nameEnglish: 'Diya (Lamp)', emoji: '🪔' },
  { id: 'chai', nameHindi: 'गरम चाय', nameEnglish: 'Hot Tea', emoji: '☕' },
  { id: 'peacock', nameHindi: 'सुंदर मोर', nameEnglish: 'Peacock', emoji: '🦚' },
  { id: 'lotus', nameHindi: 'कमल फूल', nameEnglish: 'Lotus Flower', emoji: '🪷' },
  { id: 'mango', nameHindi: 'मीठा आम', nameEnglish: 'Sweet Mango', emoji: '🥭' },
  { id: 'bell', nameHindi: 'मंदिर घंटी', nameEnglish: 'Temple Bell', emoji: '🔔' },
  { id: 'tulsi', nameHindi: 'तुलसी पौधा', nameEnglish: 'Tulsi Plant', emoji: '🌿' },
  { id: 'sun', nameHindi: 'सुनहरा सूरज', nameEnglish: 'Golden Sun', emoji: '☀️' },
];

export default function PictureRecall() {
  const { navigateTo, sounds, voice, recordGameResult, patient } = useApp();
  const { t, isHindi } = useI18n();

  const [round, setRound] = useState(1);
  const maxRounds = 3;

  const [phase, setPhase] = useState('memorize'); // 'memorize', 'recall', 'feedback', 'won'
  const [memorizeItems, setMemorizeItems] = useState([]);
  const [targetItem, setTargetItem] = useState(null);
  const [choices, setChoices] = useState([]);
  const [countdown, setCountdown] = useState(5);
  const [selectedChoiceId, setSelectedChoiceId] = useState(null);
  const [isCorrect, setIsCorrect] = useState(null);
  const [stars, setStars] = useState(0);
  const [correctRounds, setCorrectRounds] = useState(0);
  const [totalSeconds, setTotalSeconds] = useState(0);
  const [responseTimes, setResponseTimes] = useState([]);
  const [adaptiveResult, setAdaptiveResult] = useState(null);

  const timerRef = useRef(null);
  const gameTimerRef = useRef(null);
  const recallStartRef = useRef(null);

  useEffect(() => {
    if (phase !== 'won') {
      gameTimerRef.current = setInterval(() => setTotalSeconds((s) => s + 1), 1000);
    } else {
      clearInterval(gameTimerRef.current);
    }
    return () => clearInterval(gameTimerRef.current);
  }, [phase]);

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const avgResponseTime =
    responseTimes.length > 0
      ? (responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length).toFixed(1)
      : '0.0';

  const startRound = () => {
    clearInterval(timerRef.current);
    setSelectedChoiceId(null);
    setIsCorrect(null);
    setCountdown(5);

    const shuffled = [...ITEM_POOL].sort(() => Math.random() - 0.5);
    const toMemorize = shuffled.slice(0, 3);
    setMemorizeItems(toMemorize);

    const target = toMemorize[Math.floor(Math.random() * toMemorize.length)];
    setTargetItem(target);

    const remaining = shuffled.slice(3);
    const distractors = remaining.slice(0, 3);

    const recallChoices = [target, ...distractors].sort(() => Math.random() - 0.5);
    setChoices(recallChoices);

    setPhase('memorize');

    voice.speak(t('pictureMemorizeSpeech'), t('pictureMemorizeSpeech'));

    let timeLeft = 5;
    timerRef.current = setInterval(() => {
      timeLeft -= 1;
      setCountdown(timeLeft);

      if (timeLeft <= 0) {
        clearInterval(timerRef.current);
        setPhase('recall');
        recallStartRef.current = Date.now();
        voice.speak(t('pictureTimeUpSpeech'), t('pictureTimeUpSpeech'));
      }
    }, 1000);
  };

  useEffect(() => {
    startRound(1);
    return () => {
      clearInterval(timerRef.current);
      clearInterval(gameTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChoiceSelect = (choice) => {
    if (phase !== 'recall') return;

    if (recallStartRef.current) {
      const deltaSec = Math.min((Date.now() - recallStartRef.current) / 1000, 15);
      setResponseTimes((prev) => [...prev, deltaSec]);
    }

    setSelectedChoiceId(choice.id);
    const correct = choice.id === targetItem.id;
    setIsCorrect(correct);
    setPhase('feedback');

    if (correct) {
      sounds.playSuccessChime();
      setStars((s) => s + 1);
      setCorrectRounds((c) => c + 1);
      voice.speak(
        t('pictureCorrectSpeech', { item: choice.nameHindi }),
        t('pictureCorrectSpeech', { item: choice.nameEnglish })
      );
    } else {
      sounds.playEncouragementChime();
      voice.speak(
        t('pictureIncorrectSpeech', { item: targetItem.nameHindi }),
        t('pictureIncorrectSpeech', { item: targetItem.nameEnglish })
      );
    }
  };

  const handleNext = () => {
    sounds.playClickChime();
    if (round < maxRounds) {
      const nextRound = round + 1;
      setRound(nextRound);
      startRound(nextRound);
    } else {
      setPhase('won');
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });

      const finalStars = stars + 1;
      const finalAccuracy = Math.round((correctRounds / maxRounds) * 100);
      const finalAvgResp =
        responseTimes.length > 0
          ? Number((responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length).toFixed(1))
          : 3.0;

      const adaptive = recordGameResult({
        game: 'pictureRecall',
        accuracy: finalAccuracy,
        averageResponseTime: finalAvgResp,
        starsEarned: finalStars,
        scoreUpdater: (prev) => ({ pictureRecallStars: (prev.pictureRecallStars || 0) + finalStars }),
      });
      setAdaptiveResult(adaptive);

      voice.speak(t('pictureCompleteSpeech'), t('pictureCompleteSpeech'));
    }
  };

  const restartGame = () => {
    setRound(1);
    setStars(0);
    setCorrectRounds(0);
    setTotalSeconds(0);
    setResponseTimes([]);
    setAdaptiveResult(null);
    startRound(1);
  };

  const handleListenRules = () => {
    sounds.playClickChime();
    voice.speak(t('pictureRecallRulesSpeech'), t('pictureRecallRulesSpeech'));
  };

  const patientName = patient?.preferredName || (isHindi ? (patient?.nameHindi || patient?.name || 'वरिष्ठ सदस्य') : (patient?.nameEnglish || patient?.name || 'Dear Senior'));

  return (
    <div className="space-y-6 pb-12 animate-fade-in text-left">
      <GameTopBar
        icon="🖼️"
        title={t('pictureRecallPageTitle')}
        tagline={t('pictureRecallTagline')}
        subtitle={t('pictureRecallSubtitle')}
        theme={THEME}
        onBack={() => navigateTo('games')}
        onListenRules={handleListenRules}
        onRestart={restartGame}
      />

      {/* Round, Star & Time Bar */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border-2 border-[#DFF3E7] shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-xl font-black text-[#102A43]">
            {t('roundLabel')}: <strong className="text-3xl text-[#7658C8]">{round}</strong> / {maxRounds}
          </span>
        </div>

        <div className="flex items-center gap-4 text-[#7658C8] font-black text-lg sm:text-xl">
          <span>⭐ {t('starsLabel')}: {stars}</span>
          <span className="font-mono">⏱️ {formatTime(totalSeconds)}</span>
        </div>
      </div>

      {/* PHASE 1: MEMORIZE */}
      {phase === 'memorize' && (
        <div className="bg-white rounded-[2.5rem] p-6 sm:p-10 border-4 border-[#EEE9FF] shadow-md text-center space-y-6">
          <div className="space-y-1">
            <span className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-[#EEE9FF] text-[#7658C8] font-black text-lg border border-[#7658C8]/30">
              <Eye className="w-6 h-6" aria-hidden="true" />
              <span>{t('pictureMemorizeLabel')}</span>
            </span>
            <div className="pt-3 flex items-center justify-center gap-2 text-3xl sm:text-4xl font-mono font-black text-[#E98A20]" role="status" aria-live="polite">
              <Clock className="w-8 h-8" aria-hidden="true" />
              <span>{t('pictureSecondsLeft', { count: countdown })}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 max-w-2xl mx-auto pt-2">
            {memorizeItems.map((item) => (
              <div
                key={item.id}
                className="tactile-btn p-6 rounded-3xl bg-[#FBFAF4] border-4 border-[#EEE9FF] flex flex-col items-center justify-center gap-2 shadow-xs"
              >
                <span className="text-6xl sm:text-7xl filter drop-shadow" aria-hidden="true">{item.emoji}</span>
                <span className="text-2xl sm:text-3xl font-black text-[#102A43]">
                  {isHindi ? item.nameHindi : item.nameEnglish}
                </span>
              </div>
            ))}
          </div>

          <p className="text-base sm:text-lg font-bold text-[#5D7184]">{t('pictureMemorizeHint')}</p>
        </div>
      )}

      {/* PHASE 2 & 3: RECALL & FEEDBACK */}
      {(phase === 'recall' || phase === 'feedback') && (
        <div className="bg-white rounded-[2.5rem] p-6 sm:p-10 border-4 border-[#EEE9FF] shadow-md text-center space-y-6">
          <h2 className="text-2xl sm:text-4xl font-black text-[#102A43]">{t('pictureRecallQuestion')}</h2>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto pt-2">
            {choices.map((choice) => {
              const isSelected = selectedChoiceId === choice.id;
              const isTarget = choice.id === targetItem?.id;

              let cardStyle = 'bg-[#FBFAF4] hover:bg-[#EEE9FF] border-[#E2E8F0] text-[#102A43]';

              if (phase === 'feedback') {
                if (isTarget) {
                  cardStyle = 'bg-[#EAF7EF] border-[#167A55] text-[#167A55] ring-4 ring-[#DFF3E7]';
                } else if (isSelected && !isCorrect) {
                  cardStyle = 'bg-[#FFE8EF] border-[#E84D78] text-[#E84D78]';
                }
              }

              return (
                <button
                  key={choice.id}
                  onClick={() => handleChoiceSelect(choice)}
                  disabled={phase === 'feedback'}
                  className={`tactile-btn p-5 sm:p-6 rounded-3xl border-4 flex flex-col items-center justify-center gap-2 transition-all min-h-[160px] cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${cardStyle}`}
                >
                  <span className="text-6xl filter drop-shadow" aria-hidden="true">{choice.emoji}</span>
                  <span className="text-xl sm:text-2xl font-black">{isHindi ? choice.nameHindi : choice.nameEnglish}</span>

                  {phase === 'feedback' && isTarget && (
                    <span className="inline-flex items-center gap-1.5 text-[#167A55] font-black text-xs sm:text-sm bg-white px-3 py-1 rounded-full mt-1 shadow-xs">
                      <CheckCircle2 className="w-4 h-4" aria-hidden="true" /> {t('pictureCorrectBadge')}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {phase === 'feedback' && (
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4 animate-slow-fade" role="status" aria-live="polite">
              <span className="text-xl sm:text-2xl font-black text-[#102A43]">
                {isCorrect ? `🌟 ${t('pictureCorrectFeedback')}` : `🌸 ${t('pictureIncorrectFeedback')}`}
              </span>

              <button
                onClick={handleNext}
                className="tactile-btn px-8 py-4 rounded-2xl bg-[#7658C8] hover:bg-[#6042B3] border-2 border-[#4A2D99] text-white font-black text-xl flex items-center gap-3 shadow-lg cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
              >
                <span>{t('nextQuestionBtn')}</span>
                <ArrowRight className="w-6 h-6 stroke-[3]" aria-hidden="true" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* PHASE 4: GAME WON CELEBRATION */}
      {phase === 'won' && (
        <div className="bg-[#EEE9FF] border-4 border-[#7658C8] rounded-[2.5rem] p-6 sm:p-10 text-center shadow-xl animate-slow-fade">
          <span className="text-6xl inline-block mb-3" aria-hidden="true">🌺</span>
          <h2 className="text-3xl sm:text-5xl font-black text-[#102A43]">{t('pictureCompleteTitle', { name: patientName })}</h2>
          <p className="mt-2 text-xl sm:text-2xl font-black text-[#7658C8]">{t('pictureCompleteSub', { stars: stars + 1 })}</p>

          <div className="my-5 flex items-center justify-center gap-3 text-4xl sm:text-5xl text-amber-500" aria-hidden="true">
            <span>⭐</span><span>⭐</span><span>⭐</span>
          </div>

          <AdaptiveDifficultyCard
            adaptiveResult={adaptiveResult}
            accuracyPercent={Math.round((correctRounds / maxRounds) * 100)}
            avgResponseTime={avgResponseTime}
          />

          <p className="text-sm font-semibold text-[#167A55] mb-6">✓ {t('resultsSavedNote')}</p>

          <GameCompletionActions onPlayAgain={restartGame} onOtherGames={() => navigateTo('games')} theme={THEME} />
        </div>
      )}
    </div>
  );
}
