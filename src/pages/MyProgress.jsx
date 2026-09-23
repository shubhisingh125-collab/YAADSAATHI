import React from 'react';
import { Flame, Gamepad2, Sparkles, ArrowRight, Target, Zap, Star } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useI18n } from '../i18n/I18nContext';
import VoiceButton from '../components/VoiceButton';

const GAME_META = [
  { key: 'memoryMatch', nameKey: 'memoryMatch', icon: '🌸', color: '#E84D78', bg: '#FFE8EF', scoreField: 'memoryMatchWins', scoreLabel: 'winsCountLabel' },
  { key: 'patternRecognition', nameKey: 'patternGame', icon: '🔔', color: '#2879D0', bg: '#E6F1FF', scoreField: 'patternStreak', scoreLabel: 'roundLabel', labelBefore: true },
  { key: 'wordRecall', nameKey: 'wordRecall', icon: '🥭', color: '#E98A20', bg: '#FFF0D7', scoreField: 'wordRecallStars', scoreLabel: 'starsLabel' },
  { key: 'pictureRecall', nameKey: 'pictureRecall', icon: '🖼️', color: '#7658C8', bg: '#EEE9FF', scoreField: 'pictureRecallStars', scoreLabel: 'starsLabel' },
];

export default function MyProgress() {
  const { patient, gameScores, recentGameResults, navigateTo, sounds } = useApp();
  const { t, isHindi } = useI18n();

  const hasActivity = recentGameResults && recentGameResults.length > 0;

  const avgAccuracy = hasActivity
    ? Math.round(recentGameResults.reduce((sum, r) => sum + r.accuracy, 0) / recentGameResults.length)
    : null;

  const avgResponse = hasActivity
    ? (recentGameResults.reduce((sum, r) => sum + r.averageResponseTime, 0) / recentGameResults.length).toFixed(1)
    : null;

  const gamesPlayedToday = gameScores.gamesPlayedToday || 0;
  const streak = gameScores.currentStreak || 0;

  const formatTimeAgo = (timestamp) => {
    const minutes = Math.round((Date.now() - timestamp) / 60000);
    if (minutes < 1) return t('justNowLabel');
    return t('minutesAgo', { count: minutes });
  };

  const voiceSummary = hasActivity
    ? isHindi
      ? `आपकी आज की प्रगति: कुल ${gamesPlayedToday} खेल खेले गए, औसत सटीकता ${avgAccuracy} प्रतिशत है, और ${streak} दिन का स्ट्रीक बना हुआ है।`
      : `Your progress: ${gamesPlayedToday} games played, ${avgAccuracy} percent average accuracy, and a ${streak} day streak.`
    : isHindi
    ? 'अभी तक कोई खेल नहीं खेला गया है। कोई भी खेल खेलकर अपनी प्रगति यहाँ देखें।'
    : 'No games played yet. Play any game to see your progress here.';

  return (
    <div className="space-y-6 pb-12 animate-fade-in text-left">
      {/* Header Banner */}
      <div className="bg-[#EAF7EF] rounded-[2.5rem] p-6 sm:p-8 border-3 border-[#167A55]/30 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-[#167A55]/30 text-[#167A55] font-black text-sm mb-1">
            <Sparkles className="w-4 h-4 text-[#E98A20]" aria-hidden="true" />
            <span>{isHindi ? 'दैनिक स्वास्थ्य व स्मृति प्रगति' : 'Daily Cognitive Health & Progress'}</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-[#102A43]">{t('progressTitle')}</h1>
          <p className="text-xl sm:text-2xl font-black text-[#167A55]">
            {isHindi
              ? `${patient?.preferredName || patient?.nameHindi || patient?.name || 'वरिष्ठ सदस्य'} - आपका नियमित अभ्यास मस्तिष्क को सक्रिय और शांत रखता है।`
              : `${patient?.preferredName || patient?.nameEnglish || patient?.name || 'Dear Senior'} - Your playful practice keeps memory bright.`}
          </p>
          <p className="text-base sm:text-lg font-bold text-[#5D7184]">{t('progressSub')}</p>
        </div>

        <VoiceButton id="myprogress-header-voice-btn" textHindi={voiceSummary} textEnglish={voiceSummary} size="lg" label={t('listenProgress')} />
      </div>

      {/* Key Metric Cards (real data) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-3xl p-5 sm:p-6 border-2 border-[#DFF3E7] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-black text-[#5D7184]">{t('gamesPlayed')}</span>
            <div className="w-12 h-12 rounded-2xl bg-[#E6F1FF] text-[#2879D0] flex items-center justify-center">
              <Gamepad2 className="w-6 h-6" aria-hidden="true" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-3xl sm:text-4xl font-black text-[#102A43]">{gamesPlayedToday}</span>
            <span className="text-base font-bold text-[#5D7184] ml-1.5">{t('successfulSessions')}</span>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 sm:p-6 border-2 border-[#DFF3E7] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-black text-[#5D7184]">{t('avgAccuracyLabel')}</span>
            <div className="w-12 h-12 rounded-2xl bg-[#EAF7EF] text-[#167A55] flex items-center justify-center">
              <Target className="w-6 h-6" aria-hidden="true" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-3xl sm:text-4xl font-black text-[#167A55]">
              {hasActivity ? `${avgAccuracy}%` : t('noDataYet')}
            </span>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 sm:p-6 border-2 border-[#DFF3E7] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-black text-[#5D7184]">{t('avgResponseLabel')}</span>
            <div className="w-12 h-12 rounded-2xl bg-[#FFF0D7] text-[#E98A20] flex items-center justify-center">
              <Zap className="w-6 h-6" aria-hidden="true" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-3xl sm:text-4xl font-mono font-black text-[#E98A20]">
              {hasActivity ? `${avgResponse}s` : t('noDataYet')}
            </span>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 sm:p-6 border-2 border-[#DFF3E7] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-black text-[#5D7184]">{t('dailyStreak')}</span>
            <div className="w-12 h-12 rounded-2xl bg-[#FFE8EF] text-[#E84D78] flex items-center justify-center">
              <Flame className="w-6 h-6 fill-[#E84D78]" aria-hidden="true" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-3xl sm:text-4xl font-black text-[#E84D78]">
              {streak} {isHindi ? 'दिन' : 'Days'}
            </span>
          </div>
        </div>
      </div>

      {/* Progress by Game (real per-game counters from gameScores) */}
      <div className="bg-white rounded-[2.5rem] p-6 sm:p-8 border-2 border-[#DFF3E7] shadow-xs space-y-6">
        <h2 className="text-2xl sm:text-3xl font-black text-[#102A43]">{t('perGameProgressTitle')}</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {GAME_META.map((game) => (
            <div
              key={game.key}
              className="rounded-3xl p-4 sm:p-5 border-2 flex items-center gap-4"
              style={{ backgroundColor: `${game.bg}88`, borderColor: `${game.color}4D` }}
            >
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shrink-0"
                style={{ backgroundColor: game.bg }}
                aria-hidden="true"
              >
                {game.icon}
              </div>
              <div>
                <p className="text-lg sm:text-xl font-black text-[#102A43]">{t(game.nameKey)}</p>
                <p className="text-base font-bold" style={{ color: game.color }}>
                  {game.labelBefore
                    ? `${t(game.scoreLabel)} ${gameScores[game.scoreField] || 0}`
                    : `${gameScores[game.scoreField] || 0} ${t(game.scoreLabel)}`}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity (real, from recentGameResults) */}
      <div className="bg-white rounded-[2.5rem] p-6 sm:p-8 border-2 border-[#DFF3E7] shadow-xs space-y-4">
        <h2 className="text-2xl sm:text-3xl font-black text-[#102A43]">{t('recentActivityTitle')}</h2>

        {hasActivity ? (
          <div className="space-y-2.5">
            {recentGameResults.map((r, idx) => {
              const meta = GAME_META.find((g) => g.key === r.game) || GAME_META[0];
              return (
                <div
                  key={`${r.timestamp}-${idx}`}
                  className="p-3.5 rounded-2xl bg-[#FBFAF4] border border-[#DFF3E7] flex flex-wrap items-center justify-between gap-2 text-sm sm:text-base font-bold text-[#102A43]"
                >
                  <span className="flex items-center gap-2">
                    <span aria-hidden="true">{meta.icon}</span> {t(meta.nameKey)}
                  </span>
                  <span className="text-[#167A55] font-black">{t('accuracyLabel')}: {Math.round(r.accuracy)}%</span>
                  <span className="text-[#E98A20] font-black">{t('speedLabel')}: {r.averageResponseTime.toFixed(1)}s</span>
                  <span className="text-[#5D7184]">{formatTimeAgo(r.timestamp)}</span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 space-y-2">
            <Star className="w-10 h-10 text-[#DFF3E7] mx-auto" aria-hidden="true" />
            <p className="text-lg font-bold text-[#102A43]">{t('noActivityYet')}</p>
            <p className="text-sm font-semibold text-[#5D7184]">{t('noActivityHint')}</p>
          </div>
        )}
      </div>

      {/* Motivation Banner with Call-to-Play */}
      <div className="bg-[#EAF7EF] border-3 border-[#167A55]/30 rounded-[2.5rem] p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-white border-2 border-[#167A55]/30 flex items-center justify-center text-3xl shadow-xs shrink-0" aria-hidden="true">
            🌸
          </div>
          <div>
            <h3 className="text-2xl sm:text-3xl font-black text-[#102A43]">
              {isHindi ? 'आज का दिमागी खेल खेलने का समय!' : 'Time for a cognitive activity!'}
            </h3>
            <p className="text-base sm:text-lg font-bold text-[#167A55] mt-0.5">
              {isHindi
                ? 'रोजाना 10 मिनट खेलना याददाश्त को जीवंत और तरोताजा बनाए रखता है।'
                : '10 minutes of playful memory games keep the mind refreshed.'}
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            sounds.playClickChime();
            navigateTo('games');
          }}
          className="tactile-btn px-8 py-4 rounded-2xl bg-[#167A55] hover:bg-[#115C40] border-2 border-[#0D4E36] text-white font-black text-xl flex items-center gap-2 shrink-0 shadow-md cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          <span>{isHindi ? 'खेल शुरू करें' : 'Play Games'}</span>
          <ArrowRight className="w-6 h-6 stroke-[3]" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
