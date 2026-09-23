/**
 * UserProfileOnboarding.jsx
 * First-Time Elderly User Onboarding & Personalization Setup.
 * Replaces hardcoded demo identities with genuine senior preferences.
 */

import React, { useState } from 'react';
import {
  Sparkles,
  User,
  MapPin,
  Languages,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Volume2,
  Type,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { useI18n } from '../../i18n/I18nContext';
import { NER_STATES_LIST, REGIONAL_LANGUAGES_LIST } from '../../pages/NERProfile';
import * as nerRepository from '../../database/repositories/nerRepository.js';

export default function UserProfileOnboarding() {
  const { onboardingOpen, setOnboardingOpen, user, updateProfile } = useAuth();
  const { fontScale, setFontScale, sounds } = useApp();
  const { isHindi, setLanguage } = useI18n();

  const [step, setStep] = useState(1); // 1: Name, 2: Region & Language, 3: Accessibility
  const [name, setName] = useState('');
  const [preferredName, setPreferredName] = useState('');
  const [stateOrRegion, setStateOrRegion] = useState('ASSAM');
  const [prefLang, setPrefLang] = useState('hi');
  const [voiceGuidance, setVoiceGuidance] = useState(true);
  const [saving, setSaving] = useState(false);

  if (!onboardingOpen) return null;

  const handleFinish = async () => {
    setSaving(true);
    sounds.playSuccessChime();

    const seniorName = name.trim() || 'Senior Member';
    const callingName = preferredName.trim() || seniorName;

    try {
      if (user?.id) {
        await updateProfile({
          name: seniorName,
          preferredName: callingName,
          stateOrRegion,
          preferredLanguage: prefLang,
          fontScale,
        });

        await nerRepository.updateNERProfile(user.id, {
          stateOrRegion,
          preferredLanguage: prefLang === 'en' ? 'en' : 'as',
        });
      }

      if (prefLang === 'hi' || prefLang === 'en') {
        setLanguage(prefLang);
      }

      setOnboardingOpen(false);
    } catch (err) {
      console.warn('[Onboarding] Error saving profile:', err);
      setOnboardingOpen(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/70 backdrop-blur-xs animate-fade-in"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-[#FBFAF4] border-4 border-[#167A55]/40 w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Onboarding Header */}
        <div className="bg-gradient-to-r from-[#167A55] to-[#1E56A0] text-white p-6 text-center relative">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-white font-bold text-xs mb-2">
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>{isHindi ? 'यादसाथी परिचय' : 'Welcome to YaadSaathi'}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black">
            {isHindi ? 'आइए आपका प्रोफ़ाइल बनाएं' : "Let's Create Your Profile"}
          </h2>
          <p className="text-emerald-100 text-sm font-medium mt-1">
            {isHindi ? 'कदम ' + step + ' / 3' : 'Step ' + step + ' of 3'}
          </p>

          {/* Progress dots */}
          <div className="flex justify-center gap-2 mt-4">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-2.5 rounded-full transition-all duration-300 ${
                  s === step ? 'w-8 bg-amber-300' : s < step ? 'w-4 bg-white' : 'w-4 bg-white/40'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Step Contents */}
        <div className="p-6 overflow-y-auto space-y-6 text-left flex-1">
          {step === 1 && (
            <div className="space-y-4 animate-fade-in">
              <div className="p-4 bg-emerald-50 border-2 border-emerald-200 rounded-2xl">
                <p className="font-bold text-[#167A55] text-sm sm:text-base">
                  🌸 {isHindi
                    ? 'साथी आपको किस आदरणीय नाम से पुकारे?'
                    : 'What respectful name should Saathi call you?'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-black text-[#102A43] mb-1">
                  {isHindi ? 'आपका पूरा नाम (Full Name)' : 'Full Name'}
                </label>
                <div className="relative">
                  <User className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={isHindi ? 'उदा. रामेश्वर जी शर्मा' : 'e.g. Rameshwar Sharma'}
                    className="w-full pl-11 pr-4 py-3 bg-white border-2 border-[#DFF3E7] focus:border-[#167A55] rounded-2xl text-[#102A43] font-bold text-base outline-none"
                    autoFocus
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-black text-[#102A43] mb-1">
                  {isHindi ? 'पुकारने का नाम (Preferred Calling Name)' : 'Preferred Calling Name'}
                </label>
                <input
                  type="text"
                  value={preferredName}
                  onChange={(e) => setPreferredName(e.target.value)}
                  placeholder={isHindi ? 'उदा. रामू काका / दादाजी' : 'e.g. Dadaji / Mr. Ramesh'}
                  className="w-full px-4 py-3 bg-white border-2 border-[#DFF3E7] focus:border-[#167A55] rounded-2xl text-[#102A43] font-bold text-base outline-none"
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 animate-fade-in">
              <div className="p-4 bg-emerald-50 border-2 border-emerald-200 rounded-2xl">
                <p className="font-bold text-[#167A55] text-sm sm:text-base">
                  🌿 {isHindi
                    ? 'आपकी क्षेत्रीय और सांस्कृतिक पृष्ठभूमि चुनें ताकि खेल और बातचीत अधिक अपने लगें।'
                    : 'Choose your regional background so memories and activities feel familiar.'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-black text-[#102A43] mb-1 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-[#167A55]" />
                  <span>{isHindi ? 'राज्य / क्षेत्र (State / Region)' : 'State / Region'}</span>
                </label>
                <select
                  value={stateOrRegion}
                  onChange={(e) => setStateOrRegion(e.target.value)}
                  className="w-full p-3 bg-white border-2 border-[#DFF3E7] focus:border-[#167A55] rounded-2xl font-bold text-[#102A43] outline-none"
                >
                  {NER_STATES_LIST.map((st) => (
                    <option key={st.id} value={st.id}>
                      {isHindi ? st.nameHindi : st.nameEnglish}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-black text-[#102A43] mb-1 flex items-center gap-1.5">
                  <Languages className="w-4 h-4 text-[#167A55]" />
                  <span>{isHindi ? 'प्राथमिक भाषा (Language)' : 'Primary Language'}</span>
                </label>
                <select
                  value={prefLang}
                  onChange={(e) => setPrefLang(e.target.value)}
                  className="w-full p-3 bg-white border-2 border-[#DFF3E7] focus:border-[#167A55] rounded-2xl font-bold text-[#102A43] outline-none"
                >
                  {REGIONAL_LANGUAGES_LIST.map((l) => (
                    <option key={l.code} value={l.code}>
                      {l.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4 animate-fade-in">
              <div className="p-4 bg-emerald-50 border-2 border-emerald-200 rounded-2xl">
                <p className="font-bold text-[#167A55] text-sm sm:text-base">
                  👁️ {isHindi
                    ? 'अक्षर आकार और ध्वनि प्राथमिकताओं को अपने अनुसार अनुकूलित करें।'
                    : 'Adjust font size and sound comforts to your liking.'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-black text-[#102A43] mb-2 flex items-center gap-1.5">
                  <Type className="w-4 h-4 text-[#167A55]" />
                  <span>{isHindi ? 'अक्षर आकार (Text Size)' : 'Text Size'}</span>
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { scale: 0.90, label: '90%' },
                    { scale: 1.00, label: '100%' },
                    { scale: 1.15, label: '115%' },
                    { scale: 1.30, label: '130%' },
                  ].map((item) => (
                    <button
                      key={item.scale}
                      type="button"
                      onClick={() => setFontScale(item.scale)}
                      className={`py-3 px-2 rounded-2xl font-black text-center cursor-pointer transition-all border-2 ${
                        fontScale === item.scale
                          ? 'bg-[#167A55] border-[#0D4E36] text-white shadow-sm'
                          : 'bg-white border-[#DFF3E7] text-[#102A43] hover:bg-[#EAF7EF]'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-white border-2 border-[#DFF3E7] rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Volume2 className="w-6 h-6 text-[#167A55]" />
                  <div>
                    <h4 className="font-black text-sm text-[#102A43]">
                      {isHindi ? 'आवाज मार्गदर्शन (Voice Guidance)' : 'Voice Guidance'}
                    </h4>
                    <p className="text-xs text-[#5D7184] font-medium">
                      {isHindi ? 'बटन और संदेशों को बोलकर सुनाएं' : 'Read aloud buttons and tips'}
                    </p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={voiceGuidance}
                  onChange={(e) => setVoiceGuidance(e.target.checked)}
                  className="w-6 h-6 accent-[#167A55] cursor-pointer"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation Buttons */}
        <div className="p-4 sm:p-6 bg-white border-t-2 border-[#DFF3E7] flex items-center justify-between gap-3">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep((s) => s - 1)}
              className="py-3 px-5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-[#102A43] font-bold text-base flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>{isHindi ? 'पीछे' : 'Back'}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setOnboardingOpen(false)}
              className="py-3 px-4 text-xs font-bold text-[#5D7184] hover:text-[#102A43] cursor-pointer"
            >
              {isHindi ? 'बाद में भरें' : 'Skip for now'}
            </button>
          )}

          {step < 3 ? (
            <button
              type="button"
              onClick={() => setStep((s) => s + 1)}
              className="py-3 px-6 rounded-2xl bg-[#167A55] hover:bg-[#126344] text-white font-black text-base shadow-sm flex items-center gap-2 cursor-pointer ml-auto"
            >
              <span>{isHindi ? 'आगे बढ़ें' : 'Next'}</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          ) : (
            <button
              type="button"
              disabled={saving}
              onClick={handleFinish}
              className="py-3 px-6 rounded-2xl bg-[#167A55] hover:bg-[#126344] text-white font-black text-base shadow-sm flex items-center gap-2 cursor-pointer ml-auto"
            >
              {saving ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  <span>{isHindi ? 'शुरू करें!' : 'Start Exploring!'}</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
