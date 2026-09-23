import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  Type,
  Globe,
  Volume2,
  User,
  RotateCcw,
  CheckCircle2,
  Wifi,
  RefreshCw,
  LogIn,
  LogOut,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../i18n/I18nContext';
import VoiceButton from '../components/VoiceButton';
import voiceService from '../services/voiceService';

export default function Settings() {
  const {
    navigateTo,
    fontScale,
    setFontScale,
    patient,
    setPatient,
    resetAllData,
    sounds,
  } = useApp();

  const {
    user,
    isAuthenticated,
    syncStatus,
    refreshProfile,
    signOut,
    setAuthModalOpen,
  } = useAuth();

  const { t, language, setLanguage, isHindi } = useI18n();

  const [nameInput, setNameInput] = useState(patient?.nameHindi || patient?.name || '');
  const [nameEnglishInput, setNameEnglishInput] = useState(patient?.nameEnglish || patient?.name || '');
  const [nameSaved, setNameSaved] = useState(false);

  // Keep the input in sync if the patient profile changes elsewhere (e.g. Reset Demo Data)
  useEffect(() => {
    setNameInput(patient?.nameHindi || patient?.name || '');
    setNameEnglishInput(patient?.nameEnglish || patient?.name || '');
  }, [patient?.nameHindi, patient?.nameEnglish, patient?.name]);

  const handleSaveName = (e) => {
    e.preventDefault();
    if (!nameInput.trim() || !nameEnglishInput.trim()) return;

    sounds.playSuccessChime();
    setPatient((prev) => ({
      ...prev,
      nameHindi: nameInput,
      nameEnglish: nameEnglishInput,
    }));
    setNameSaved(true);
    voiceService.speak(
      isHindi ? `नाम सुरक्षित कर लिया गया है: ${nameInput}` : `Name saved: ${nameEnglishInput}`,
      isHindi ? 'hi-IN' : 'en-IN'
    );
    setTimeout(() => setNameSaved(false), 2500);
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in text-left">
      {/* 1. Header */}
      <div className="bg-[#EEE9FF] rounded-[2.5rem] p-6 sm:p-8 border-3 border-[#7658C8]/30 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-[#7658C8]/30 text-[#7658C8] font-black text-sm mb-1">
            <SettingsIcon className="w-4 h-4" />
            <span>{isHindi ? 'सुलभता व प्राथमिकताएं' : 'Accessibility & Preferences'}</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-[#102A43]">
            {t('settingsTitle')}
          </h1>
          <p className="text-xl sm:text-2xl font-black text-[#7658C8] mt-1">
            {t('settingsSub')}
          </p>
        </div>

        <VoiceButton
          id="settings-voice-btn"
          textHindi="यह सुविधा सेटिंग्स पृष्ठ है। यहाँ से आप अक्षर बड़े या छोटे कर सकते हैं, भाषा बदल सकते हैं और आवाज सेट कर सकते हैं।"
          textEnglish="This is the Settings page to adjust text size, language and voice guidance."
          size="lg"
          label={t('listen')}
        />
      </div>

      {/* Account & Cloud Sync Section */}
      <div className="bg-white rounded-[2.5rem] p-6 sm:p-8 border-2 border-[#DFF3E7] shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#EAF7EF] text-[#167A55] flex items-center justify-center">
              <User className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-[#102A43]">
                {isHindi ? 'खाता व क्लाउड सिंक' : 'Account & Cloud Sync'}
              </h2>
              <p className="text-sm sm:text-base font-bold text-[#5D7184]">
                {isAuthenticated
                  ? `${user?.email || 'Logged in'} • ${syncStatus === 'synced' ? (isHindi ? '🟢 क्लाउड में सुरक्षित' : '🟢 Synced to Cloud') : (isHindi ? '🔄 सिंक हो रहा है' : '🔄 Syncing...')}`
                  : (isHindi ? 'वर्तमान में अतिथि / स्थानीय मोड में सक्रिय' : 'Currently in Guest / Local Mode')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {isAuthenticated ? (
              <>
                <button
                  type="button"
                  onClick={() => refreshProfile()}
                  className="tactile-btn px-4 py-2.5 rounded-2xl bg-[#EAF7EF] hover:bg-[#DFF3E7] text-[#167A55] font-black text-sm flex items-center gap-2 cursor-pointer border border-[#167A55]/30"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>{isHindi ? 'अभी सिंक करें' : 'Sync Now'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => signOut()}
                  className="tactile-btn px-4 py-2.5 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-black text-sm flex items-center gap-2 cursor-pointer border border-rose-200"
                >
                  <LogOut className="w-4 h-4" />
                  <span>{isHindi ? 'लॉगआउट' : 'Sign Out'}</span>
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setAuthModalOpen(true)}
                className="tactile-btn px-5 py-3 rounded-2xl bg-[#167A55] hover:bg-[#126344] text-white font-black text-sm flex items-center gap-2 cursor-pointer shadow-xs"
              >
                <LogIn className="w-4 h-4" />
                <span>{isHindi ? 'क्लाउड खाता जोड़ें / लॉगिन करें' : 'Sign In / Connect Cloud'}</span>
              </button>
            )}
          </div>
        </div>

        {isAuthenticated && (
          <div className="p-4 rounded-2xl bg-[#FBFAF4] border border-[#DFF3E7] text-xs font-mono text-slate-500 break-all">
            <strong>User UUID:</strong> {user?.id}
          </div>
        )}
      </div>

      {/* 2. Text Size Controller */}
      <div className="bg-white rounded-[2.5rem] p-6 sm:p-8 border-2 border-[#DFF3E7] shadow-xs space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#EAF7EF] text-[#167A55] flex items-center justify-center">
            <Type className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-[#102A43]">
              {t('textSizeSetting')}
            </h2>
            <p className="text-base sm:text-lg font-bold text-[#5D7184]">
              {isHindi ? 'आंखों पर जोर दिए बिना पढ़ने के लिए अक्षर बड़े करें (A- / A / A+)' : 'Adjust text scaling globally across all screens'}
            </p>
          </div>
        </div>

        {/* Live Preview Box */}
        <div className="p-5 rounded-2xl bg-[#FBFAF4] border-2 border-[#DFF3E7]">
          <span className="text-xs font-black text-[#5D7184] block mb-1">
            {isHindi ? 'लाइव नमूना (Current Scale:' : 'Live Preview (Current Scale:'} {Math.round(fontScale * 100)}%):
          </span>
          <p className="font-black text-[#102A43]">
            {isHindi ? 'नमस्ते! यादसाथी में आपका हार्दिक स्वागत है। साथ यादों का, हर दिन के लिए।' : 'Good Day! Welcome to YaadSaathi. Cherishing every single day together.'}
          </p>
        </div>

        {/* 4 Scale Buttons: 90%, 100%, 115%, 130% */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { scale: 0.90, label: 'A-', name: isHindi ? '90% (छोटा)' : '90% (Small)' },
            { scale: 1.00, label: 'A', name: isHindi ? '100% (सामान्य)' : '100% (Normal)' },
            { scale: 1.15, label: 'A+', name: isHindi ? '115% (बड़ा)' : '115% (Large)' },
            { scale: 1.30, label: 'A++', name: isHindi ? '130% (अति बड़ा)' : '130% (Extra)' },
          ].map((item) => (
            <button
              key={item.scale}
              onClick={() => {
                sounds.playClickChime();
                setFontScale(item.scale);
              }}
              aria-pressed={Math.abs(fontScale - item.scale) < 0.01}
              className={`tactile-btn p-4 rounded-2xl border-3 font-black text-lg flex flex-col items-center justify-center gap-1 cursor-pointer transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${
                Math.abs(fontScale - item.scale) < 0.01
                  ? 'bg-[#167A55] border-[#0D4E36] text-white ring-4 ring-[#DFF3E7]'
                  : 'bg-[#FBFAF4] hover:bg-[#EAF7EF] border-[#DFF3E7] text-[#102A43]'
              }`}
            >
              <span className="text-2xl font-black">{item.label}</span>
              <span className="text-xs font-bold">{item.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 3. Language Selection */}
      <div className="bg-white rounded-[2.5rem] p-6 sm:p-8 border-2 border-[#DFF3E7] shadow-xs space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#E6F1FF] text-[#2879D0] flex items-center justify-center">
            <Globe className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-[#102A43]">
              {t('languageSetting')}
            </h2>
            <p className="text-base sm:text-lg font-bold text-[#5D7184]">
              {isHindi ? 'अपनी पसंदीदा भाषा चुनें' : 'Choose your preferred language'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Hindi */}
          <button
            onClick={() => {
              sounds.playClickChime();
              setLanguage('hi');
            }}
            aria-pressed={language === 'hi'}
            className={`tactile-btn p-5 rounded-2xl border-4 text-left cursor-pointer transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${
              language === 'hi'
                ? 'bg-[#EAF7EF] border-[#167A55] text-[#167A55] ring-4 ring-[#DFF3E7]'
                : 'bg-[#FBFAF4] hover:bg-[#EAF7EF] border-[#E2E8F0] text-[#102A43]'
            }`}
          >
            <span className="text-2xl font-black block">🇮🇳 हिन्दी (Hindi)</span>
            <span className="text-sm font-bold text-[#5D7184] mt-1 block">
              वरिष्ठ नागरिकों के लिए सुलभ हिन्दी शब्दावली
            </span>
          </button>

          {/* English */}
          <button
            onClick={() => {
              sounds.playClickChime();
              setLanguage('en');
            }}
            aria-pressed={language === 'en'}
            className={`tactile-btn p-5 rounded-2xl border-4 text-left cursor-pointer transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${
              language === 'en'
                ? 'bg-[#EAF7EF] border-[#167A55] text-[#167A55] ring-4 ring-[#DFF3E7]'
                : 'bg-[#FBFAF4] hover:bg-[#EAF7EF] border-[#E2E8F0] text-[#102A43]'
            }`}
          >
            <span className="text-2xl font-black block">🌐 English</span>
            <span className="text-sm font-bold text-[#5D7184] mt-1 block">
              Clear Indian English phrasing
            </span>
          </button>
        </div>
      </div>

      {/* 4. Voice Guidance & Audio Setting */}
      <div className="bg-white rounded-[2.5rem] p-6 sm:p-8 border-2 border-[#DFF3E7] shadow-xs space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#FFF0D7] text-[#E98A20] flex items-center justify-center">
            <Volume2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-[#102A43]">
              {isHindi ? 'आवाज सहायता व ध्वनि प्रभाव' : 'Voice & Audio Guidance'}
            </h2>
            <p className="text-base sm:text-lg font-bold text-[#5D7184]">
              {isHindi ? 'सभी बटनों और नियमों के लिए स्पष्ट आवाज का परीक्षण करें' : 'Test browser voice synthesis and audio chimes'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            onClick={() => {
              sounds.playSuccessChime();
              voiceService.speak(
                isHindi ? 'आवाज परीक्षण सफल रहा। यादसाथी में आपका स्वागत है।' : 'Voice test successful. Welcome to YaadSaathi.',
                isHindi ? 'hi-IN' : 'en-IN'
              );
            }}
            className="tactile-btn px-6 py-3.5 rounded-2xl bg-[#167A55] hover:bg-[#115C40] border-2 border-[#0D4E36] text-white font-black text-lg flex items-center gap-2 cursor-pointer shadow-xs"
          >
            <Volume2 className="w-5 h-5" />
            <span>{isHindi ? 'ध्वनि परीक्षण करें' : 'Test Voice Guidance'}</span>
          </button>

          <button
            onClick={() => {
              sounds.playEncouragementChime();
            }}
            className="tactile-btn px-6 py-3.5 rounded-2xl bg-[#FBFAF4] hover:bg-[#EAF7EF] border-2 border-[#DFF3E7] text-[#102A43] font-bold text-lg cursor-pointer"
          >
            🔔 {isHindi ? 'चाइम सुनें' : 'Play Chime'}
          </button>
        </div>
      </div>

      {/* 5. Patient Name Personalization */}
      <div className="bg-white rounded-[2.5rem] p-6 sm:p-8 border-2 border-[#DFF3E7] shadow-xs space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#EAF7EF] text-[#167A55] flex items-center justify-center">
            <User className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-[#102A43]">
              {isHindi ? 'बुजुर्ग का नाम' : "Elderly User's Name"}
            </h2>
            <p className="text-base sm:text-lg font-bold text-[#5D7184]">
              {isHindi ? 'स्वागत संदेश में यह नाम प्रदर्शित होगा' : 'This name appears on the greeting and cards'}
            </p>
          </div>
        </div>

        <form onSubmit={handleSaveName} className="space-y-3 max-w-xl">
          <div className="flex flex-col sm:flex-row gap-3">
            <label className="flex-1 space-y-1">
              <span className="block text-xs font-black text-[#5D7184]">{isHindi ? 'नाम (हिन्दी)' : 'Name (Hindi)'}</span>
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                className="w-full px-5 py-3.5 rounded-2xl border-2 border-[#DFF3E7] text-xl font-black text-[#102A43] bg-[#FBFAF4] focus:outline-none focus:border-[#167A55]"
              />
            </label>
            <label className="flex-1 space-y-1">
              <span className="block text-xs font-black text-[#5D7184]">{isHindi ? 'नाम (English)' : 'Name (English)'}</span>
              <input
                type="text"
                value={nameEnglishInput}
                onChange={(e) => setNameEnglishInput(e.target.value)}
                className="w-full px-5 py-3.5 rounded-2xl border-2 border-[#DFF3E7] text-xl font-black text-[#102A43] bg-[#FBFAF4] focus:outline-none focus:border-[#167A55]"
              />
            </label>
          </div>

          <button
            type="submit"
            className="tactile-btn px-8 py-3.5 rounded-2xl bg-[#167A55] hover:bg-[#115C40] border-2 border-[#0D4E36] text-white font-black text-lg cursor-pointer shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            {isHindi ? 'सुरक्षित करें' : 'Save'}
          </button>
        </form>

        {nameSaved && (
          <p className="text-base font-bold text-[#167A55] flex items-center gap-1.5 animate-slow-fade">
            <CheckCircle2 className="w-5 h-5 text-[#167A55]" />
            {isHindi ? 'नाम सफलतापूर्वक बदल दिया गया है!' : 'Name updated successfully!'}
          </p>
        )}
      </div>

      {/* 6. Personalization & Cultural Preferences (NER Profile & Meri Yaadein) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-[2.5rem] p-6 border-2 border-[#167A55]/30 shadow-xs flex flex-col justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#EAF7EF] text-[#167A55] flex items-center justify-center text-2xl">
              🌏
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-[#102A43]">
                {isHindi ? 'मेरा क्षेत्र व भाषा' : 'My Region & Language'}
              </h2>
              <p className="text-sm sm:text-base font-bold text-[#5D7184]">
                {isHindi ? 'पूर्वोत्तर भारत (NER) राज्य, भाषा और सांस्कृतिक प्राथमिकताएं' : 'North East India state, language & cultural preferences'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigateTo('ner-profile')}
            className="tactile-btn w-full py-3.5 px-6 rounded-2xl bg-[#167A55] hover:bg-[#115C40] text-white font-black text-base flex items-center justify-center gap-2 cursor-pointer shadow-xs"
          >
            <span>🌏 {isHindi ? 'प्राथमिकताएं प्रबंधित करें' : 'Manage Region & Preferences'}</span>
          </button>
        </div>

        <div className="bg-white rounded-[2.5rem] p-6 border-2 border-rose-200 shadow-xs flex flex-col justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center text-2xl">
              ❤️
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-[#102A43]">
                {isHindi ? 'मेरी यादें' : 'Meri Yaadein'}
              </h2>
              <p className="text-sm sm:text-base font-bold text-[#5D7184]">
                {isHindi ? 'परिवार, प्रिय स्थान और सुखद संस्मरण जोड़ें व देखें' : 'Personal family memories, cherished places & stories'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigateTo('personal-memories')}
            className="tactile-btn w-full py-3.5 px-6 rounded-2xl bg-[#E84393] hover:bg-[#D63031] text-white font-black text-base flex items-center justify-center gap-2 cursor-pointer shadow-xs"
          >
            <span>❤️ {isHindi ? 'यादें देखें व जोड़ें' : 'View & Add Memories'}</span>
          </button>
        </div>
      </div>

      {/* 7. Offline Ready Indicator */}
      <div className="bg-white rounded-[2.5rem] p-6 sm:p-8 border-2 border-[#DFF3E7] shadow-xs space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#EAF7EF] text-[#167A55] flex items-center justify-center">
            <Wifi className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-[#102A43]">
              {isHindi ? 'ऑफलाइन मोड स्थिति' : 'Offline Readiness'}
            </h2>
            <p className="text-base font-bold text-[#5D7184]">
              {isHindi ? 'स्थानीय भंडारण (localStorage) सक्रिय है' : 'All game scores and data stored in localStorage'}
            </p>
          </div>
        </div>
        <div className="p-4 rounded-2xl bg-[#EAF7EF] border border-[#167A55]/30 text-[#167A55] font-bold text-sm sm:text-base flex items-center gap-2.5">
          <span className="w-3 h-3 rounded-full bg-[#167A55] animate-ping" />
          <span>{isHindi ? '🟢 आपका डेटा स्थानीय रूप से सुरक्षित है। इंटरनेट न होने पर भी सभी खेल व रिमाइंडर चलेंगे।' : '🟢 Data is saved locally. Offline games and reminders remain functional.'}</span>
        </div>
      </div>

      {/* 7. Reset All Data */}
      <div className="bg-white rounded-[2.5rem] p-6 sm:p-8 border-2 border-rose-200 shadow-xs space-y-3">
        <h2 className="text-xl sm:text-2xl font-black text-rose-900">
          {t('resetData')}
        </h2>
        <p className="text-base font-bold text-[#5D7184]">
          {isHindi ? 'सभी दवाइयों, खेल इतिहास और स्कोर को प्रारंभिक स्थिति में वापस लाएं।' : 'Reset all steps, reminders, and game records to prototype defaults.'}
        </p>

        <button
          onClick={() => {
            if (window.confirm(isHindi ? 'क्या आप सभी डेटा को रीसेट करना चाहते हैं?' : 'Are you sure you want to reset all data?')) {
              resetAllData();
            }
          }}
          className="tactile-btn px-6 py-3.5 rounded-2xl bg-rose-100 hover:bg-rose-200 border-2 border-rose-300 text-rose-900 font-black text-base flex items-center gap-2 cursor-pointer"
        >
          <RotateCcw className="w-5 h-5" />
          <span>{isHindi ? 'फैक्ट्री रीसेट करें' : 'Reset to Default'}</span>
        </button>
      </div>
    </div>
  );
}
