import React from 'react';
import { Sparkles, Trophy, ArrowRight } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useI18n } from '../i18n/I18nContext';
import VoiceButton from '../components/VoiceButton';

export default function GamesHub() {
  const { navigateTo, gameScores, sounds } = useApp();
  const { t, isHindi } = useI18n();

  const games = [
    {
      id: 'memory-match',
      title: t('memoryMatch'),
      desc: t('memoryMatchDesc'),
      icon: '🧠',
      tag: isHindi ? 'स्मृति अभ्यास' : 'Memory Practice',
      benefit: isHindi ? 'मस्तिष्क की एकाग्रता और दृश्य याददाश्त बढ़ाता है।' : 'Boosts focus and visual memory retention.',
      bgColor: 'bg-[#FFE8EF]',
      borderColor: 'border-[#E84D78]/40',
      textColor: 'text-[#E84D78]',
      btnBg: 'bg-[#E84D78] hover:bg-[#D43B66]',
      bestScore: `${gameScores.memoryMatchWins || 0} ${t('winsCountLabel')}`,
    },
    {
      id: 'pattern-recognition',
      title: t('patternGame'),
      desc: t('patternGameDesc'),
      icon: '🧩',
      tag: isHindi ? 'क्रम ध्यान अभ्यास' : 'Focus Practice',
      benefit: isHindi ? 'आवाज और रंगों के समन्वय से ध्यान केंद्रित रहता है।' : 'Harmonizes auditory rhythm and visual attention.',
      bgColor: 'bg-[#E6F1FF]',
      borderColor: 'border-[#2879D0]/40',
      textColor: 'text-[#2879D0]',
      btnBg: 'bg-[#2879D0] hover:bg-[#2065B3]',
      bestScore: `${t('roundLabel')} ${gameScores.patternStreak || 0}`,
    },
    {
      id: 'word-recall',
      title: t('wordRecall'),
      desc: t('wordRecallDesc'),
      icon: 'Aa',
      tag: isHindi ? 'भाषा अभ्यास' : 'Language Practice',
      benefit: isHindi ? 'दैनिक वस्तुओं के नाम याद रखने में सहायता करता है।' : 'Aids conversational recall of household words.',
      bgColor: 'bg-[#FFF0D7]',
      borderColor: 'border-[#E98A20]/40',
      textColor: 'text-[#E98A20]',
      btnBg: 'bg-[#E98A20] hover:bg-[#CF7513]',
      bestScore: `${gameScores.wordRecallStars || 0} ${t('starsLabel')}`,
    },
    {
      id: 'picture-recall',
      title: t('pictureRecall'),
      desc: t('pictureRecallDesc'),
      icon: '🖼️',
      tag: isHindi ? 'दृष्टि स्मृति अभ्यास' : 'Visual Practice',
      benefit: isHindi ? 'अल्पकालिक दृष्टि स्मृति को सक्रिय करता है।' : 'Strengthens short-term visual pattern recognition.',
      bgColor: 'bg-[#EEE9FF]',
      borderColor: 'border-[#7658C8]/40',
      textColor: 'text-[#7658C8]',
      btnBg: 'bg-[#7658C8] hover:bg-[#6042B3]',
      bestScore: `${gameScores.pictureRecallStars || 0} ${t('starsLabel')}`,
    },
    {
      id: 'daily-routine-recall',
      title: isHindi ? 'दिनचर्या स्मरण' : 'Daily Routine Recall',
      desc: isHindi ? 'अपनी दैनिक गतिविधियों के क्रम को याद करें।' : 'Remember the order of your familiar everyday activities.',
      icon: '📅',
      tag: isHindi ? 'Green Theme • दिनचर्या' : 'Green Theme • Routine',
      benefit: isHindi ? 'दैनिक दिनचर्या और समय के क्रम की स्मृति को मजबूत करता है।' : 'Strengthens recall of chronological daily habits and routines.',
      bgColor: 'bg-[#EBF7F0]',
      borderColor: 'border-[#167A55]/40',
      textColor: 'text-[#167A55]',
      btnBg: 'bg-[#167A55] hover:bg-[#126344]',
      bestScore: `${gameScores.routineRecallScore || 100}%`,
    },
    {
      id: 'sequence-recall',
      title: isHindi ? 'क्रम स्मरण' : 'Sequence Recall',
      desc: isHindi ? 'प्रतीकों के क्रम को याद रखकर सक्रिय स्मृति बढ़ाएं।' : 'Remember the sequence of symbols to exercise working memory.',
      icon: '⚡',
      tag: isHindi ? 'Sky Theme • सक्रिय स्मृति' : 'Sky Theme • Working Memory',
      benefit: isHindi ? 'अल्पकालिक सक्रिय स्मृति और क्रम बोध को बढ़ाता है।' : 'Strengthens working memory and sequential recall.',
      bgColor: 'bg-[#EBF5FB]',
      borderColor: 'border-[#2980B9]/40',
      textColor: 'text-[#2980B9]',
      btnBg: 'bg-[#2980B9] hover:bg-[#1F618D]',
      bestScore: `${gameScores.sequenceRecallScore || 100}%`,
    },
    {
      id: 'pattern-complete',
      title: isHindi ? 'पैटर्न पूर्ण करें' : 'Pattern Complete',
      desc: isHindi ? 'प्रतीकों के सुंदर क्रम को पहचानकर छूटा हुआ हिस्सा चुनें।' : 'Identify harmonious patterns and select the missing piece.',
      icon: '🧩',
      tag: isHindi ? 'Orange Theme • पैटर्न बोध' : 'Orange Theme • Pattern',
      benefit: isHindi ? 'तार्किक क्रम और पैटर्न पहचान की क्षमता को सक्रिय रखता है।' : 'Activates logical rhythm and visual pattern completion.',
      bgColor: 'bg-[#FFF4E6]',
      borderColor: 'border-[#E67E22]/40',
      textColor: 'text-[#E67E22]',
      btnBg: 'bg-[#E67E22] hover:bg-[#D35400]',
      bestScore: `${gameScores.patternCompleteScore || 100}%`,
    },
    {
      id: 'find-difference',
      title: isHindi ? 'अंतर खोजें' : 'Find the Difference',
      desc: isHindi ? 'दो ग्रिडों की तुलना करके बदले हुए एक प्रतीक को पहचानें।' : 'Spot the one symbol that changed between two side-by-side grids.',
      icon: '🔍',
      tag: isHindi ? 'Purple Theme • एकाग्रता' : 'Purple Theme • Attention',
      benefit: isHindi ? 'दृश्य एकाग्रता और सूक्ष्म विवरणों पर ध्यान केंद्रित करता है।' : 'Sharpens visual focus and selective attention.',
      bgColor: 'bg-[#F5EEF8]',
      borderColor: 'border-[#8E44AD]/40',
      textColor: 'text-[#8E44AD]',
      btnBg: 'bg-[#8E44AD] hover:bg-[#7D3C98]',
      bestScore: `${gameScores.findDifferenceScore || 100}%`,
    },
    {
      id: 'personal-memory',
      title: isHindi ? 'मेरी यादें (संस्मरण)' : 'Personal Memory / Meri Yaadein',
      desc: isHindi ? 'पारिवारिक तस्वीरों, पुराने स्थानों और अनमोल संस्मरणों से जुड़ी स्नेहपूर्ण बातचीत।' : 'Gentle reminiscence engaging with personal milestones, places, and family memories.',
      icon: '❤️',
      tag: isHindi ? 'Rose Theme • संस्मरण' : 'Rose Theme • Reminiscence',
      benefit: isHindi ? 'सुखद यादों को ताज़ा कर भावनात्मक संबल और मानसिक शांति देता है।' : 'Nurtures emotional wellbeing and evokes cherished personal memories.',
      bgColor: 'bg-[#FDF2F4]',
      borderColor: 'border-[#E84393]/40',
      textColor: 'text-[#D63031]',
      btnBg: 'bg-[#E84393] hover:bg-[#D63031]',
      bestScore: `${gameScores.personalMemoryScore || 100}%`,
    },
  ];

  return (
    <div className="space-y-6 pb-12 animate-slow-fade text-left select-none">
      {/* 1. Header Banner */}
      <div className="bg-[#EAF7EF] rounded-[2.5rem] p-6 sm:p-8 border-2 border-[#167A55]/20 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-[#167A55]/30 text-[#167A55] font-black text-sm mb-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>{t('cognitiveGamesTitle')}</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-[#102A43]">
            {t('games')}
          </h1>
          <p className="mt-1 text-lg sm:text-xl font-bold text-[#167A55]">
            "{t('cognitiveGamesSub')}"
          </p>
        </div>

        <VoiceButton
          id="gameshub-voice-btn"
          textHindi="यहाँ आपके लिए चार रंगीन और सरल खेल हैं: याददाश्त खेल, पैटर्न खेल, शब्द याद करें, और तस्वीर याद करें। जो खेल आपको पसंद हो, उस पर टैप करें।"
          textEnglish="Here are four gentle cognitive games: Memory Match, Pattern Game, Word Recall, and Picture Recall. Tap any game to begin."
          size="lg"
          label={t('listenGameOptions')}
        />
      </div>

      {/* 2. Gentle Reassurance Alert */}
      <div className="bg-white border-2 border-[#DFF3E7] rounded-2xl p-4 sm:p-5 flex items-center gap-3">
        <span className="text-3xl">🌸</span>
        <p className="text-base sm:text-lg font-bold text-[#102A43]">
          {isHindi
            ? 'याद रखें: कोई भी गलत उत्तर नहीं होता! हर कोशिश मन को शांत और सक्रिय बनाती है।'
            : 'Remember: There are no wrong answers! Every playful interaction keeps the mind peaceful and engaged.'}
        </p>
      </div>

      {/* 3. 4 Color-Coded Game Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {games.map((game) => (
          <div
            key={game.id}
            className={`tactile-btn p-6 sm:p-8 rounded-[2.5rem] ${game.bgColor} border-3 ${game.borderColor} flex flex-col justify-between gap-6 shadow-xs card-hover`}
          >
            {/* Top Info */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-5xl">{game.icon}</span>
                <div>
                  <span className="inline-block px-3 py-0.5 rounded-full bg-white/90 border border-current text-xs font-black uppercase tracking-wider mb-1">
                    {game.tag}
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-black text-[#102A43]">
                    {game.title}
                  </h2>
                </div>
              </div>

              <p className="text-base sm:text-lg text-[#5D7184] font-medium">
                {game.desc}
              </p>
              <p className="text-sm text-[#5D7184] font-medium">
                {game.benefit}
              </p>

              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-white/80 border border-slate-200 font-bold text-sm text-[#102A43]">
                <Trophy className="w-4 h-4 text-amber-500" aria-hidden="true" />
                <span>{game.bestScore}</span>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 border-t-2 border-black/10 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <VoiceButton
                textHindi={`${game.title}। ${game.desc}।`}
                textEnglish={`${game.title}. ${game.desc}.`}
                size="sm"
                label={t('listen')}
              />

              <button
                onClick={() => {
                  sounds.playClickChime();
                  navigateTo(game.id);
                }}
                className={`tactile-btn px-7 py-3.5 rounded-2xl ${game.btnBg} text-white font-black text-xl flex items-center justify-center gap-2 shadow cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#102A43]`}
              >
                <span>{t('playNow')}</span>
                <ArrowRight className="w-5 h-5 stroke-[3]" aria-hidden="true" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
