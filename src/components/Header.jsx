import React from 'react';
import Logo from './Logo';
import {
  Settings as SettingsIcon,
  Heart,
  Globe,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useI18n } from '../i18n/I18nContext';
import VoiceButton from './VoiceButton';
import UserBadge from './Auth/UserBadge';

export default function Header() {
  const {
    fontScale,
    decreaseFontSize,
    resetFontSize,
    increaseFontSize,
    patient,
    navigateTo,
    currentScreen,
    setSosModalOpen,
    sounds,
  } = useApp();

  const { t, toggleLanguage, isHindi } = useI18n();

  const seniorDisplayName =
    patient?.preferredName ||
    patient?.displayName ||
    (isHindi ? (patient?.nameHindi || patient?.name || '') : (patient?.nameEnglish || patient?.name || ''));

  const greetingHindi = seniorDisplayName
    ? `नमस्ते ${seniorDisplayName}! आज हम साथ में कुछ अच्छा और नया करेंगे।`
    : 'नमस्ते! यादसाथी में आपका स्वागत है। आज हम साथ में कुछ अच्छा करेंगे।';

  const greetingEnglish = seniorDisplayName
    ? `Good day ${seniorDisplayName}. Today is a new day to create a new memory.`
    : 'Welcome to YaadSaathi! Today is a new day to create a new memory.';

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b-2 border-[#DFF3E7] shadow-sm">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between gap-2 sm:gap-4 flex-wrap sm:flex-nowrap">
        {/* Left: Brand Logo & Title */}
        <div
          id="header-logo"
          onClick={() => navigateTo('home')}
          className="cursor-pointer shrink-0"
        >
          <Logo size="md" />
        </div>

        {/* Center: Friendly Voice Greeting Pill */}
        <div className="hidden md:flex items-center gap-2">
          <VoiceButton
            id="header-voice-btn"
            textHindi={greetingHindi}
            textEnglish={greetingEnglish}
            size="sm"
            label={t('listen')}
            className="shadow-xs"
          />
          <span className="text-sm font-bold text-[#167A55] bg-[#EAF7EF] px-3 py-1.5 rounded-full border border-[#167A55]/20">
            {t('todayMessage')}
          </span>
        </div>

        {/* Right: Accessibility Controls, Language, Settings & SOS */}
        <div className="flex items-center flex-wrap gap-1.5 sm:gap-2.5 ml-auto">
          {/* Text Size: A- A A+ Stepper */}
          <div
            className="flex items-center bg-[#FBFAF4] border-2 border-[#DFF3E7] rounded-2xl p-1 gap-1"
            role="group"
            aria-label={isHindi ? 'अक्षर आकार समायोजन' : 'Font scale adjustment'}
          >
            <button
              id="font-scale-decrease-btn"
              onClick={decreaseFontSize}
              aria-pressed={fontScale <= 0.90}
              className={`tactile-btn px-2.5 sm:px-3 py-1.5 rounded-xl font-black text-sm cursor-pointer transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${
                fontScale <= 0.90
                  ? 'bg-[#167A55] text-white shadow-xs'
                  : 'bg-white text-[#102A43] hover:bg-[#EAF7EF]'
              }`}
              aria-label={isHindi ? 'छोटे अक्षर (A- 90%)' : 'Decrease font size (A-)'}
            >
              A-
            </button>
            <button
              id="font-scale-reset-btn"
              onClick={resetFontSize}
              aria-pressed={fontScale === 1.00}
              className={`tactile-btn px-2.5 sm:px-3 py-1.5 rounded-xl font-black text-sm cursor-pointer transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${
                fontScale === 1.00
                  ? 'bg-[#167A55] text-white shadow-xs'
                  : 'bg-white text-[#102A43] hover:bg-[#EAF7EF]'
              }`}
              aria-label={isHindi ? 'सामान्य अक्षर (A 100%)' : 'Reset font size to 100% (A)'}
            >
              A
            </button>
            <button
              id="font-scale-increase-btn"
              onClick={increaseFontSize}
              aria-pressed={fontScale >= 1.15}
              className={`tactile-btn px-2.5 sm:px-3 py-1.5 rounded-xl font-black text-sm cursor-pointer transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${
                fontScale >= 1.15
                  ? 'bg-[#167A55] text-white shadow-xs'
                  : 'bg-white text-[#102A43] hover:bg-[#EAF7EF]'
              }`}
              aria-label={isHindi ? 'बड़े अक्षर (A+ 115% / 130%)' : 'Increase font size (A+)'}
            >
              A+
            </button>
          </div>

          {/* Language Toggle: 🌐 हिंदी / English */}
          <button
            id="language-toggle-btn"
            onClick={() => {
              sounds.playClickChime();
              toggleLanguage();
            }}
            className="tactile-btn flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-[#FBFAF4] hover:bg-[#EAF7EF] border-2 border-[#DFF3E7] text-[#102A43] font-black text-sm min-h-[46px] cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
            aria-label={isHindi ? 'भाषा बदलें' : 'Switch Language'}
          >
            <Globe className="w-4 h-4 text-[#167A55]" />
            <span>{isHindi ? '🌐 English' : '🇮🇳 हिंदी'}</span>
          </button>

          {/* User Account & Cloud Sync Badge */}
          <UserBadge />

          {/* Settings Shortcut */}
          <button
            id="header-settings-btn"
            onClick={() => {
              sounds.playClickChime();
              navigateTo('settings');
            }}
            className={`tactile-btn p-2.5 rounded-2xl border-2 min-h-[46px] cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${
              currentScreen === 'settings'
                ? 'bg-[#167A55] border-[#0D4E36] text-white'
                : 'bg-[#FBFAF4] hover:bg-[#EAF7EF] border-[#DFF3E7] text-[#102A43]'
            }`}
            aria-label={t('settings')}
          >
            <SettingsIcon className="w-5 h-5" aria-hidden="true" />
          </button>

          {/* SOS Help Button (Visually prominent in Pink/Red) */}
          <button
            id="header-sos-btn"
            onClick={() => {
              sounds.playClickChime();
              setSosModalOpen(true);
            }}
            className="tactile-btn flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-2xl bg-[#E84D78] hover:bg-[#D43B66] border-2 border-[#B82B53] text-white font-black text-sm sm:text-base shadow-sm min-h-[46px] cursor-pointer animate-pulse focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
            aria-label={t('sos')}
          >
            <Heart className="w-5 h-5 fill-white stroke-none" aria-hidden="true" />
            <span>{t('sos')}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
