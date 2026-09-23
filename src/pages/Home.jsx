import React from 'react';
import {
  CalendarCheck,
  Heart,
  Sun,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  UserPlus,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../i18n/I18nContext';
import VoiceButton from '../components/VoiceButton';
import StepTracker from '../components/StepTracker';
import SafeCircleCard from '../components/SafeCircleCard';

export default function Home() {
  const {
    patient,
    reminders,
    toggleReminder,
    todayMood,
    recordMood,
    navigateTo,
    gameScores,
    stepsToday,
    stepsGoal,
    setSosModalOpen,
  } = useApp();

  const { isAuthenticated, setAuthModalOpen, setOnboardingOpen } = useAuth();
  const { t, isHindi } = useI18n();

  const seniorDisplayName =
    patient?.preferredName ||
    patient?.displayName ||
    (isHindi ? (patient?.nameHindi || patient?.name || '') : (patient?.nameEnglish || patient?.name || ''));

  const heroHeading = seniorDisplayName
    ? (isHindi ? `नमस्ते, ${seniorDisplayName}!` : `Good Day, ${seniorDisplayName}!`)
    : (isHindi ? 'यादसाथी में आपका स्वागत है!' : 'Welcome to YaadSaathi!');

  const voiceGreetingHi = seniorDisplayName
    ? `नमस्ते ${seniorDisplayName}! आज हम साथ में कुछ अच्छा करेंगे। आप आज कैसा महसूस कर रहे हैं?`
    : 'नमस्ते! यादसाथी में आपका स्वागत है। आज हम साथ में कुछ अच्छा करेंगे। आप आज कैसा महसूस कर रहे हैं?';

  const voiceGreetingEn = seniorDisplayName
    ? `Good Day ${seniorDisplayName}! Today is a new day to create a new memory. How are you feeling today?`
    : 'Welcome to YaadSaathi! Today is a new day to create a new memory. How are you feeling today?';

  const currentDateDisplay = isHindi
    ? 'मंगलवार, 15 सितंबर 2026'
    : 'Tuesday, 15 September 2026';

  return (
    <div className="space-y-8 pb-12 animate-slow-fade text-left select-none">
      {/* 1. Large Welcoming Hero Card */}
      <section className="bg-gradient-to-r from-[#DFF3E7] via-[#EAF7EF] to-[#E6F1FF] rounded-[2.5rem] p-6 sm:p-10 border-3 border-[#167A55]/25 shadow-sm text-left relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/90 border border-[#167A55]/30 text-[#167A55] font-black text-sm">
              <Sun className="w-4 h-4 text-[#E98A20]" />
              <span>{currentDateDisplay}</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black text-[#102A43] tracking-tight leading-tight">
              {heroHeading}
            </h1>

            <p className="text-xl sm:text-2xl font-bold text-[#167A55] pt-1">
              "{t('todayMessage')}"
            </p>

            <div className="p-3 rounded-2xl bg-white/80 border border-[#167A55]/20 text-sm sm:text-base font-bold text-[#167A55] inline-block">
              🌸 {isHindi ? '"छोटी-छोटी अच्छी आदतें, बड़ा बदलाव लाती हैं।"' : '"Small joyful habits create a bright day."'}
            </div>
          </div>

          {/* Right Side Wellness Graphic & Voice Audio Greeting */}
          <div className="flex flex-col items-center sm:items-end gap-4 shrink-0">
            <div className="w-44 h-36 sm:w-52 sm:h-40 bg-white/80 rounded-3xl border-2 border-[#167A55]/20 flex flex-col items-center justify-center p-3 text-center shadow-xs">
              <span className="text-5xl sm:text-6xl mb-1">👴🌿👵</span>
              <span className="text-xs font-black text-[#167A55] uppercase tracking-wide">
                यादसाथी केयर • YaadSaathi
              </span>
            </div>

            <VoiceButton
              id="hero-voice-btn"
              textHindi={voiceGreetingHi}
              textEnglish={voiceGreetingEn}
              size="lg"
              label={t('dayMessage')}
              className="shadow-sm"
            />
          </div>
        </div>
      </section>

      {/* Saathi AI Conversational Companion Banner */}
      <section
        onClick={() => navigateTo('saathi')}
        className="tactile-btn p-5 sm:p-6 rounded-[2.5rem] bg-gradient-to-r from-[#1E56A0] via-[#167A55] to-[#2879D0] text-white shadow-md border-3 border-white flex flex-col sm:flex-row items-center justify-between gap-4 cursor-pointer card-hover"
      >
        <div className="flex items-center gap-4 text-left">
          <div className="w-14 h-14 rounded-2xl bg-white text-[#167A55] flex items-center justify-center text-3xl shadow-sm shrink-0">
            🌸
          </div>
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-white/20 text-white font-black text-xs mb-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>{isHindi ? 'AI मित्रवत साथी' : 'AI Friendly Companion'}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black">
              {isHindi ? 'साथी से बात करें' : 'Chat with Saathi'}
            </h2>
            <p className="text-emerald-100 font-bold text-sm sm:text-base mt-0.5">
              {isHindi
                ? 'अपनी दिनचर्या, पुरानी यादें या मन की कोई भी बात साझा करें।'
                : 'Discuss your routine, cherished family memories, or anything on your mind.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-white text-[#167A55] font-black text-base shadow-sm shrink-0">
          <span>{isHindi ? 'चैट शुरू करें →' : 'Start Chat →'}</span>
        </div>
      </section>

      {/* 2. Mood / Steps / Games / Streak Quick Stats */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* CARD 1: Mood */}
        <div
          onClick={() => {
            const elem = document.getElementById('mood-section');
            if (elem) elem.scrollIntoView({ behavior: 'smooth' });
          }}
          className="tactile-btn p-5 sm:p-6 rounded-3xl bg-[#EAF7EF] border-2 border-[#167A55]/30 cursor-pointer card-hover"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-black text-[#167A55] uppercase tracking-wider">
              {t('todaysMood')}
            </span>
            <span className="text-3xl">
              {todayMood === 'happy' ? '😊' : todayMood === 'okay' ? '🙂' : '😟'}
            </span>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-black text-[#102A43] block">
              {todayMood === 'happy' ? t('moodHappy') : todayMood === 'okay' ? t('moodOkay') : t('moodConcerned')}
            </span>
          </div>
          <p className="text-xs sm:text-sm font-black text-[#167A55] mt-2">
            "{t('feelingGood')}"
          </p>
        </div>

        {/* CARD 2: Steps */}
        <div
          onClick={() => {
            const elem = document.getElementById('step-tracker-section');
            if (elem) elem.scrollIntoView({ behavior: 'smooth' });
          }}
          className="tactile-btn p-5 sm:p-6 rounded-3xl bg-[#E6F1FF] border-2 border-[#2879D0]/30 cursor-pointer card-hover"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-black text-[#2879D0] uppercase tracking-wider">
              {t('stepsToday')}
            </span>
            <span className="text-3xl">🚶</span>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-black text-[#102A43] block">
              {stepsToday.toLocaleString('en-IN')}
            </span>
            <span className="text-xs font-bold text-[#5D7184]">
              / {stepsGoal.toLocaleString('en-IN')} {isHindi ? 'कदम' : 'Steps'}
            </span>
          </div>
          <p className="text-xs sm:text-sm font-black text-[#2879D0] mt-2">
            {Math.round((stepsToday / stepsGoal) * 100)}{t('goalCompleted')}
          </p>
        </div>

        {/* CARD 3: Games Played */}
        <div
          onClick={() => navigateTo('games')}
          className="tactile-btn p-5 sm:p-6 rounded-3xl bg-[#FFE8EF] border-2 border-[#E84D78]/30 cursor-pointer card-hover"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-black text-[#E84D78] uppercase tracking-wider">
              {t('gamesPlayed')}
            </span>
            <span className="text-3xl">🧠</span>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-black text-[#102A43] block">
              {gameScores.gamesPlayedToday || 2}
            </span>
            <span className="text-xs font-bold text-[#5D7184]">{t('successfulSessions')}</span>
          </div>
          <p className="text-xs sm:text-sm font-black text-[#E84D78] mt-2">
            "शाबाश!"
          </p>
        </div>

        {/* CARD 4: Daily Streak */}
        <div
          onClick={() => navigateTo('progress')}
          className="tactile-btn p-5 sm:p-6 rounded-3xl bg-[#FFF0D7] border-2 border-[#E98A20]/30 cursor-pointer card-hover"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-black text-[#E98A20] uppercase tracking-wider">
              {t('dailyStreak')}
            </span>
            <span className="text-3xl">⭐</span>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-black text-[#102A43] block">
              {gameScores.currentStreak || 5} {isHindi ? 'दिन' : 'Days'}
            </span>
            <span className="text-xs font-bold text-[#5D7184]">{t('activeDays')}</span>
          </div>
          <p className="text-xs sm:text-sm font-black text-[#E98A20] mt-2">
            "बहुत अच्छा!"
          </p>
        </div>
      </section>

      {/* 3. Step Tracker */}
      <StepTracker />

      {/* Today's Personalized Plan Compact Card */}
      <section
        onClick={() => navigateTo('daily-plan')}
        className="tactile-btn p-5 sm:p-6 rounded-[2.5rem] bg-gradient-to-r from-[#FFE8EF] via-[#FFF0D7] to-[#EAF7EF] border-3 border-[#167A55]/30 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4 cursor-pointer card-hover"
      >
        <div className="flex items-center gap-4 text-left">
          <div className="w-14 h-14 rounded-2xl bg-white text-[#167A55] flex items-center justify-center text-3xl shadow-xs shrink-0">
            🌸
          </div>
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-[#167A55]/10 text-[#167A55] font-black text-xs mb-1">
              <Sparkles className="w-3.5 h-3.5 text-[#E98A20]" />
              <span>{isHindi ? "आज की साथी योजना" : "Today's Saathi Plan"}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-[#102A43]">
              {isHindi ? '3 गतिविधियां तैयार हैं' : '3 activities ready for you'}
            </h2>
            <p className="text-[#5D7184] font-bold text-sm sm:text-base mt-0.5">
              {isHindi
                ? 'स्मृति, एकाग्रता और दिनचर्या का संतुलित व सुखद अभ्यास।'
                : 'Balanced, gentle stimulation tailored for your pace today.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-[#167A55] hover:bg-[#126344] text-white font-black text-lg shadow-sm shrink-0">
          <span>{isHindi ? 'शुरू करें →' : 'Start →'}</span>
        </div>
      </section>

      {/* 4. SafeCircle (Elderly Family-Location Safety Feature) */}
      <SafeCircleCard />

      {/* 5. Cognitive Games Section */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl sm:text-4xl font-black text-[#102A43]">
              {t('cognitiveGamesTitle')}
            </h2>
            <p className="text-base sm:text-xl font-bold text-[#5D7184] mt-0.5">
              {t('cognitiveGamesSub')}
            </p>
          </div>

          <VoiceButton
            id="games-voice-btn"
            textHindi="खेल के चार विकल्प उपलब्ध हैं: याददाश्त खेल, पैटर्न खेल, शब्द याद करें और तस्वीर याद करें। कोई भी खेल चुनें।"
            textEnglish="Four cognitive games are available: Memory Match, Pattern Game, Word Recall, and Picture Recall. Choose any activity to enjoy."
            size="md"
            label={t('listenGameOptions')}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* GAME 1: Memory Match */}
          <div
            onClick={() => navigateTo('memory-match')}
            className="tactile-btn p-6 sm:p-8 rounded-[2.5rem] bg-[#FFE8EF] border-3 border-[#E84D78]/40 text-left cursor-pointer flex flex-col justify-between card-hover shadow-xs"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-16 h-16 rounded-2xl bg-white text-[#E84D78] flex items-center justify-center text-4xl shadow-xs">
                  🧠
                </div>
                <span className="px-3.5 py-1 rounded-full bg-white text-[#E84D78] font-black text-xs uppercase">
                  {isHindi ? 'स्मृति खेल' : 'Memory Game'}
                </span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-[#102A43]">
                {t('memoryMatch')}
              </h3>
              <p className="text-base sm:text-lg font-medium text-[#5D7184] mt-2">
                {t('memoryMatchDesc')}
              </p>
            </div>

            <div className="mt-6 pt-4 border-t-2 border-[#E84D78]/20 flex items-center justify-between">
              <span className="text-lg font-black text-[#E84D78]">
                {t('startPlaying')}
              </span>
              <div className="px-5 py-2.5 rounded-xl bg-[#E84D78] text-white font-black text-base">
                {t('playNow')}
              </div>
            </div>
          </div>

          {/* GAME 2: Pattern Game */}
          <div
            onClick={() => navigateTo('pattern-recognition')}
            className="tactile-btn p-6 sm:p-8 rounded-[2.5rem] bg-[#E6F1FF] border-3 border-[#2879D0]/40 text-left cursor-pointer flex flex-col justify-between card-hover shadow-xs"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-16 h-16 rounded-2xl bg-white text-[#2879D0] flex items-center justify-center text-4xl shadow-xs">
                  🧩
                </div>
                <span className="px-3.5 py-1 rounded-full bg-white text-[#2879D0] font-black text-xs uppercase">
                  {isHindi ? 'क्रम ध्यान' : 'Pattern Focus'}
                </span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-[#102A43]">
                {t('patternGame')}
              </h3>
              <p className="text-base sm:text-lg font-medium text-[#5D7184] mt-2">
                {t('patternGameDesc')}
              </p>
            </div>

            <div className="mt-6 pt-4 border-t-2 border-[#2879D0]/20 flex items-center justify-between">
              <span className="text-lg font-black text-[#2879D0]">
                {t('startPlaying')}
              </span>
              <div className="px-5 py-2.5 rounded-xl bg-[#2879D0] text-white font-black text-base">
                {t('playNow')}
              </div>
            </div>
          </div>

          {/* GAME 3: Word Recall */}
          <div
            onClick={() => navigateTo('word-recall')}
            className="tactile-btn p-6 sm:p-8 rounded-[2.5rem] bg-[#FFF0D7] border-3 border-[#E98A20]/40 text-left cursor-pointer flex flex-col justify-between card-hover shadow-xs"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-16 h-16 rounded-2xl bg-white text-[#E98A20] flex items-center justify-center text-4xl shadow-xs">
                  Aa
                </div>
                <span className="px-3.5 py-1 rounded-full bg-white text-[#E98A20] font-black text-xs uppercase">
                  {isHindi ? 'भाषा अभ्यास' : 'Word Recall'}
                </span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-[#102A43]">
                {t('wordRecall')}
              </h3>
              <p className="text-base sm:text-lg font-medium text-[#5D7184] mt-2">
                {t('wordRecallDesc')}
              </p>
            </div>

            <div className="mt-6 pt-4 border-t-2 border-[#E98A20]/20 flex items-center justify-between">
              <span className="text-lg font-black text-[#E98A20]">
                {t('startPlaying')}
              </span>
              <div className="px-5 py-2.5 rounded-xl bg-[#E98A20] text-white font-black text-base">
                {t('playNow')}
              </div>
            </div>
          </div>

          {/* GAME 4: Picture Recall */}
          <div
            onClick={() => navigateTo('picture-recall')}
            className="tactile-btn p-6 sm:p-8 rounded-[2.5rem] bg-[#EEE9FF] border-3 border-[#7658C8]/40 text-left cursor-pointer flex flex-col justify-between card-hover shadow-xs"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-16 h-16 rounded-2xl bg-white text-[#7658C8] flex items-center justify-center text-4xl shadow-xs">
                  🖼️
                </div>
                <span className="px-3.5 py-1 rounded-full bg-white text-[#7658C8] font-black text-xs uppercase">
                  {isHindi ? 'दृष्टि स्मृति' : 'Visual Recall'}
                </span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-[#102A43]">
                {t('pictureRecall')}
              </h3>
              <p className="text-base sm:text-lg font-medium text-[#5D7184] mt-2">
                {t('pictureRecallDesc')}
              </p>
            </div>

            <div className="mt-6 pt-4 border-t-2 border-[#7658C8]/20 flex items-center justify-between">
              <span className="text-lg font-black text-[#7658C8]">
                {t('startPlaying')}
              </span>
              <div className="px-5 py-2.5 rounded-xl bg-[#7658C8] text-white font-black text-base">
                {t('playNow')}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Reminders Section */}
      <section className="bg-white rounded-[2.5rem] p-6 sm:p-8 border-3 border-[#DFF3E7] shadow-sm text-left space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-2 text-[#167A55] font-black text-sm uppercase">
              <CalendarCheck className="w-4 h-4" />
              <span>{isHindi ? 'दिनचर्या समय सारणी' : 'Daily Schedule'}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-[#102A43]">
              {t('reminders')}
            </h2>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <VoiceButton
              id="reminders-voice-btn"
              textHindi="आज की यादें: सुबह की तुलसी वाली चाय, बीपी की दवाई, शाम की बगीचे की सैर और रात की दवा।"
              textEnglish="Today's reminders: Morning Tulsi tea, Blood pressure tablet, Evening garden stroll, and Night medicine."
              size="md"
              label={t('listenReminders')}
            />

            <button
              onClick={() => navigateTo('reminders')}
              className="tactile-btn px-5 py-2.5 rounded-2xl bg-[#EAF7EF] hover:bg-[#DFF3E7] border border-[#167A55]/30 text-[#167A55] font-black text-base flex items-center gap-2 cursor-pointer"
            >
              <span>{isHindi ? 'सब देखें' : 'View All'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 4 Preview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {reminders.slice(0, 4).map((rem) => (
            <div
              key={rem.id}
              onClick={() => toggleReminder(rem.id)}
              className={`tactile-btn p-4 rounded-2xl border-2 flex items-start justify-between gap-2 cursor-pointer transition-all ${
                rem.completed
                  ? 'bg-[#EAF7EF] border-[#167A55]/40 opacity-90'
                  : 'bg-[#FBFAF4] border-[#E2E8F0] hover:bg-white'
              }`}
            >
              <div>
                <span className="text-xs font-mono font-bold text-[#5D7184] block">
                  ⏰ {rem.time}
                </span>
                <span
                  className={`text-lg font-black block mt-0.5 leading-snug ${
                    rem.completed ? 'line-through text-slate-500' : 'text-[#102A43]'
                  }`}
                >
                  {isHindi ? rem.titleHindi : rem.titleEnglish}
                </span>
              </div>

              <div
                className={`w-7 h-7 rounded-lg border-2 flex items-center justify-center shrink-0 mt-1 ${
                  rem.completed ? 'bg-[#167A55] border-[#167A55] text-white' : 'border-slate-400 bg-white'
                }`}
              >
                {rem.completed && <CheckCircle2 className="w-5 h-5" />}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 7. Progress & Mood Check-in Section */}
      <section
        id="mood-section"
        className="bg-[#FBFAF4] rounded-[2.5rem] p-6 sm:p-8 border-3 border-[#DFF3E7] shadow-sm text-left space-y-4"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-[#102A43]">
              {isHindi ? 'आज आप कैसा महसूस कर रहे हैं?' : 'How are you feeling today?'}
            </h2>
            <p className="text-base sm:text-lg font-bold text-[#5D7184]">
              {isHindi ? '(एक चेहरे को छुएं)' : '(Tap a face to check-in)'}
            </p>
          </div>

          <VoiceButton
            id="progress-voice-btn"
            textHindi="मेरी प्रगति: आपने इस सप्ताह 20 सितारे अर्जित किए हैं और 5 दिन की सक्रिय स्ट्रीक पूरी की है। बहुत शानदार!"
            textEnglish="My Progress: You have earned 20 stars this week with a 5-day active streak. Fantastic work!"
            size="md"
            label={t('listenProgress')}
          />
        </div>

        <div className="grid grid-cols-3 gap-3 sm:gap-6">
          {/* Happy */}
          <button
            onClick={() => recordMood('happy')}
            className={`tactile-btn p-5 rounded-3xl border-4 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 ${
              todayMood === 'happy'
                ? 'bg-[#EAF7EF] border-[#167A55] ring-4 ring-[#DFF3E7]'
                : 'bg-white hover:bg-[#EAF7EF] border-[#E2E8F0]'
            }`}
          >
            <span className="text-5xl sm:text-6xl">😊</span>
            <span className="text-xl font-black text-[#167A55]">{t('moodHappy')}</span>
          </button>

          {/* Okay */}
          <button
            onClick={() => recordMood('okay')}
            className={`tactile-btn p-5 rounded-3xl border-4 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 ${
              todayMood === 'okay'
                ? 'bg-[#FFF0D7] border-[#E98A20] ring-4 ring-[#FFE8C2]'
                : 'bg-white hover:bg-[#FFF0D7] border-[#E2E8F0]'
            }`}
          >
            <span className="text-5xl sm:text-6xl">🙂</span>
            <span className="text-xl font-black text-[#E98A20]">{t('moodOkay')}</span>
          </button>

          {/* Need Care */}
          <button
            onClick={() => recordMood('worried')}
            className={`tactile-btn p-5 rounded-3xl border-4 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 ${
              todayMood === 'worried'
                ? 'bg-[#FFE8EF] border-[#E84D78] ring-4 ring-[#FFD1DE]'
                : 'bg-white hover:bg-[#FFE8EF] border-[#E2E8F0]'
            }`}
          >
            <span className="text-5xl sm:text-6xl">😟</span>
            <span className="text-xl font-black text-[#E84D78]">{t('moodConcerned')}</span>
          </button>
        </div>

        {/* If Need Care: Reassuring Box */}
        {todayMood === 'worried' && (
          <div className="p-5 rounded-3xl bg-[#FFE8EF] border-2 border-[#E84D78]/30 flex flex-col sm:flex-row items-center justify-between gap-4 animate-slow-fade">
            <div className="text-left space-y-1">
              <h4 className="text-xl font-black text-[#E84D78]">
                "{isHindi ? 'हम सब आपके साथ हैं।' : 'We are always here with you.'}"
              </h4>
              <p className="text-base font-bold text-[#102A43]">
                {isHindi ? 'क्या आप परिवार से बात करना चाहते हैं?' : 'Would you like to talk to your family?'}
              </p>
            </div>

            <button
              onClick={() => setSosModalOpen(true)}
              className="tactile-btn px-6 py-3.5 rounded-2xl bg-[#E84D78] hover:bg-[#D43B66] text-white font-black text-lg flex items-center gap-2 shrink-0 cursor-pointer shadow-md"
            >
              <Heart className="w-5 h-5 fill-white stroke-none" />
              <span>❤️ {isHindi ? 'परिवार से बात करें' : 'Talk to Family'}</span>
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
