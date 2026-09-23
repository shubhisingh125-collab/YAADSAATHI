/**
 * SaathiPanel.jsx
 * Saathi Voice Companion Modal & Conversation Panel.
 * Designed specifically for elderly dementia / senior users with warm aesthetics.
 */

import React, { useState } from 'react';
import { X, Send, Sparkles } from 'lucide-react';
import { useSaathi } from '../../context/SaathiContext';
import { useApp } from '../../context/AppContext';
import { useI18n } from '../../i18n/I18nContext';
import SaathiMicButton from './SaathiMicButton';
import SaathiConversation from './SaathiConversation';

export default function SaathiPanel() {
  const { isPanelOpen, closeSaathi, processInput, proactiveMoment, isMicAvailable } = useSaathi();
  const { patient, navigateTo } = useApp();
  const { isHindi, t } = useI18n();
  const [inputText, setInputText] = useState('');
  const [showDemoChips, setShowDemoChips] = useState(true);

  if (!isPanelOpen) return null;

  const handleSend = (e) => {
    e?.preventDefault();
    if (!inputText.trim()) return;
    processInput(inputText.trim());
    setInputText('');
  };

  const handleChipClick = (query) => {
    processInput(query);
  };

  const seniorName = patient?.preferredName || (isHindi ? (patient?.nameHindi || patient?.name || 'वरिष्ठ साथी') : (patient?.nameEnglish || patient?.name || 'Dear Senior'));

  // Suggested 1-tap Action Chips (Requirement 3)
  const suggestedActions = [
    {
      id: 'med',
      icon: '💊',
      label: isHindi ? 'मेरी दवाई' : 'Medicine',
      query: isHindi ? 'मेरी दवाई कब है?' : 'When is my medicine?',
      bg: 'bg-[#FFE8EF] border-[#E84D78]/30 text-[#E84D78]',
    },
    {
      id: 'confirm',
      icon: '✅',
      label: isHindi ? 'दवाई ले ली' : 'Took Medicine',
      query: isHindi ? 'मैंने दवाई ले ली' : 'I took my medicine',
      bg: 'bg-[#EAF7EF] border-[#167A55]/30 text-[#167A55]',
    },
    {
      id: 'game',
      icon: '🧠',
      label: isHindi ? 'खेल खेलें' : 'Play Game',
      query: isHindi ? 'खेल शुरू करो' : 'Start a game',
      bg: 'bg-[#EEE9FF] border-[#7658C8]/30 text-[#7658C8]',
    },
    {
      id: 'day',
      icon: '📅',
      label: isHindi ? 'आज की दिनचर्या' : 'My Day',
      query: isHindi ? 'आज मुझे क्या करना है?' : 'What do I have today?',
      bg: 'bg-[#FFF0D7] border-[#E98A20]/30 text-[#E98A20]',
    },
    {
      id: 'progress',
      icon: '📊',
      label: isHindi ? 'मेरी प्रगति' : 'My Progress',
      query: isHindi ? 'मेरी प्रगति बताओ' : 'How am I doing?',
      bg: 'bg-[#E6F1FF] border-[#2879D0]/30 text-[#2879D0]',
    },
    {
      id: 'safecircle',
      icon: '📍',
      label: isHindi ? 'सुरक्षा घेरा' : 'SafeCircle',
      query: isHindi ? 'SafeCircle स्थिति क्या है?' : 'Is SafeCircle on?',
      bg: 'bg-[#EAF7EF] border-[#167A55]/30 text-[#167A55]',
    },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={isHindi ? 'साथी वॉयस सहायक' : 'Saathi Voice Companion'}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in"
    >
      <div className="bg-[#FBFAF4] border-3 border-[#167A55]/30 rounded-[2.5rem] shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden text-left">
        {/* Panel Header */}
        <div className="bg-gradient-to-r from-[#1E56A0] to-[#167A55] text-white p-5 sm:p-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-2xl bg-white/15 border-2 border-white/30 flex items-center justify-center text-3xl shadow-inner shrink-0">
              🌸
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
                  {isHindi ? 'साथी (Saathi)' : 'Saathi'}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-white font-bold text-xs uppercase tracking-wider">
                  AI Companion
                </span>
              </div>
              <p className="text-sm sm:text-base font-bold text-emerald-100">
                {isHindi ? `साथी आपके साथ, ${seniorName}` : `Here to assist you, ${seniorName}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                closeSaathi();
                navigateTo('saathi');
              }}
              title={isHindi ? 'फुल स्क्रीन चैट खोलें' : 'Open Full Screen Chat'}
              className="px-3.5 py-2.5 rounded-2xl bg-white/20 hover:bg-white/30 text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 cursor-pointer transition-all border border-white/20 shrink-0"
            >
              <span>💬</span>
              <span className="hidden sm:inline">{isHindi ? 'पूरी चैट' : 'Full Chat'}</span>
            </button>
            <button
              id="close-saathi-panel-btn"
              onClick={closeSaathi}
              aria-label={isHindi ? 'बंद करें' : 'Close Saathi'}
              className="w-12 h-12 rounded-2xl bg-white/20 hover:bg-white/30 active:scale-95 text-white flex items-center justify-center cursor-pointer transition-all border border-white/20 shrink-0"
            >
              <X className="w-7 h-7 stroke-[2.5]" />
            </button>
          </div>
        </div>

        {/* Proactive "Saathi Moment" Note */}
        {proactiveMoment && (
          <div className="px-5 py-2.5 bg-[#FFF0D7] border-b-2 border-[#E98A20]/20 flex items-center gap-2.5 text-xs sm:text-sm font-bold text-[#A75D00]">
            <Sparkles className="w-4 h-4 shrink-0 text-[#E98A20]" />
            <span className="truncate">{proactiveMoment}</span>
          </div>
        )}

        {/* Conversation Stream */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          <SaathiConversation />
        </div>

        {/* Suggested Actions Row (Requirement 3) */}
        <div className="px-4 sm:px-6 pt-2 pb-1 border-t border-[#DFF3E7] bg-white/60">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-black uppercase text-[#5D7184] tracking-wider">
              {isHindi ? 'त्वरित विकल्प (1-टैप करें):' : 'Suggested Actions:'}
            </span>
            <button
              onClick={() => setShowDemoChips(!showDemoChips)}
              className="text-[11px] font-bold text-[#167A55] hover:underline cursor-pointer"
            >
              {showDemoChips ? (isHindi ? 'छिपाएं' : 'Hide') : (isHindi ? 'दिखाएं' : 'Show')}
            </button>
          </div>

          {showDemoChips && (
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              {suggestedActions.map((action) => (
                <button
                  key={action.id}
                  id={`saathi-action-${action.id}`}
                  onClick={() => handleChipClick(action.query)}
                  className={`tactile-btn px-3.5 py-2 rounded-2xl border-2 font-black text-xs sm:text-sm flex items-center gap-1.5 shrink-0 cursor-pointer shadow-2xs hover:scale-102 active:scale-98 transition-all ${action.bg}`}
                >
                  <span className="text-base">{action.icon}</span>
                  <span>{action.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Central Voice Mic Interaction Area (Requirement 1 & 16) */}
        <div className="p-4 sm:p-5 bg-[#FBFAF4] border-t-2 border-[#DFF3E7] flex flex-col items-center justify-center gap-3">
          <SaathiMicButton />

          {/* Fallback Text Input (Requirement 19: Accessibility & Voice Fallback) */}
          <form onSubmit={handleSend} className="w-full flex items-center gap-2 pt-1">
            <input
              type="text"
              id="saathi-text-input"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={
                isHindi
                  ? 'या यहाँ टाइप करके पूछें (उदा. दवाई कब है)...'
                  : 'Or type here (e.g. When is my medicine)...'
              }
              className="flex-1 px-4 py-3 rounded-2xl bg-white border-2 border-[#DFF3E7] text-base font-bold text-[#102A43] focus:outline-none focus:border-[#167A55] shadow-inner"
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              aria-label={isHindi ? 'भेजें' : 'Send'}
              className="tactile-btn px-5 py-3 rounded-2xl bg-[#167A55] hover:bg-[#115C40] disabled:bg-slate-300 text-white font-black text-base flex items-center justify-center gap-1 cursor-pointer transition-all shadow-xs"
            >
              <Send className="w-5 h-5 stroke-[2.5]" />
            </button>
          </form>

          {/* Voice Fallback Notice if Mic Unavailable */}
          {!isMicAvailable && (
            <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
              ℹ️ {isHindi ? 'माइक उपलब्ध नहीं है। आप लिखकर संदेश भेज सकते हैं।' : 'Microphone is unavailable. Text input is active.'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
