import React, { useState, useEffect } from 'react';
import {
  Globe,
  MapPin,
  Languages,
  Utensils,
  Music,
  Sparkles,
  CheckCircle2,
  ArrowLeft,
  Save,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useI18n } from '../i18n/I18nContext';
import VoiceButton from '../components/VoiceButton';
import * as nerRepository from '../database/repositories/nerRepository.js';
import { NERState, RegionalLanguageCode } from '../domain/ner/nerTypes.js';
import { getOrCreateLocalUserId } from '../services/gamePersistenceService.js';
import { syncNERProfile } from '../services/sync/syncService.js';

export const NER_STATES_LIST = [
  { id: NERState.ASSAM, nameEnglish: 'Assam', nameHindi: 'असम' },
  { id: NERState.ARUNACHAL_PRADESH, nameEnglish: 'Arunachal Pradesh', nameHindi: 'अरुणाचल प्रदेश' },
  { id: NERState.MANIPUR, nameEnglish: 'Manipur', nameHindi: 'मणिपुर' },
  { id: NERState.MEGHALAYA, nameEnglish: 'Meghalaya', nameHindi: 'मेघालय' },
  { id: NERState.MIZORAM, nameEnglish: 'Mizoram', nameHindi: 'मिजोरम' },
  { id: NERState.NAGALAND, nameEnglish: 'Nagaland', nameHindi: 'नागालैंड' },
  { id: NERState.SIKKIM, nameEnglish: 'Sikkim', nameHindi: 'सिक्किम' },
  { id: NERState.TRIPURA, nameEnglish: 'Tripura', nameHindi: 'त्रिपुरा' },
];

export const REGIONAL_LANGUAGES_LIST = [
  { code: RegionalLanguageCode.ASSAMESE, name: 'Assamese (অসমীয়া)' },
  { code: RegionalLanguageCode.BENGALI, name: 'Bengali (বাংলা)' },
  { code: RegionalLanguageCode.BODO, name: 'Bodo (बड़ो)' },
  { code: RegionalLanguageCode.MANIPURI, name: 'Meitei / Manipuri (মৈতৈলোন্)' },
  { code: RegionalLanguageCode.KHASI, name: 'Khasi (Ka Ktien Khasi)' },
  { code: RegionalLanguageCode.GARO, name: 'Garo (A·chik)' },
  { code: RegionalLanguageCode.MIZO, name: 'Mizo (Mizo ṭawng)' },
  { code: RegionalLanguageCode.NEPALI, name: 'Nepali (नेपाली)' },
  { code: RegionalLanguageCode.HINDI, name: 'Hindi (हिंदी)' },
  { code: RegionalLanguageCode.ENGLISH, name: 'English' },
];

export default function NERProfile() {
  const { navigateTo, sounds, voice } = useApp();
  const { isHindi } = useI18n();

  const [stateOrRegion, setStateOrRegion] = useState(NERState.ASSAM);
  const [preferredLanguage, setPreferredLanguage] = useState(RegionalLanguageCode.ASSAMESE);
  const [subRegion, setSubRegion] = useState('');

  // User cultural preferences
  const [foodsInput, setFoodsInput] = useState('');
  const [placesInput, setPlacesInput] = useState('');
  const [musicInput, setMusicInput] = useState('');
  const [festivalsInput, setFestivalsInput] = useState('');
  const [objectsInput, setObjectsInput] = useState('');

  const [isSaved, setIsSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  const userId = getOrCreateLocalUserId();

  useEffect(() => {
    async function loadProfile() {
      try {
        const profile = await nerRepository.getNERProfile(userId);
        if (profile) {
          if (profile.stateOrRegion) setStateOrRegion(profile.stateOrRegion);
          if (profile.preferredLanguage) setPreferredLanguage(profile.preferredLanguage);
          if (profile.subRegionOrDistrict) setSubRegion(profile.subRegionOrDistrict);
          if (profile.familiarFoods) setFoodsInput(profile.familiarFoods.join(', '));
          if (profile.familiarPlaces) setPlacesInput(profile.familiarPlaces.join(', '));
          if (profile.music) setMusicInput(profile.music.join(', '));
          if (profile.festivals) setFestivalsInput(profile.festivals.join(', '));
          if (profile.familiarObjects) setObjectsInput(profile.familiarObjects.join(', '));
        }
      } catch (err) {
        console.warn('[NERProfile] Failed to load profile:', err);
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, [userId]);

  const parseTags = (str) =>
    str
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

  const handleSave = async (e) => {
    e.preventDefault();
    sounds.playSuccessChime();

    const profileData = {
      userId,
      stateOrRegion,
      preferredLanguage,
      subRegionOrDistrict: subRegion.trim(),
      familiarFoods: parseTags(foodsInput),
      familiarPlaces: parseTags(placesInput),
      music: parseTags(musicInput),
      festivals: parseTags(festivalsInput),
      familiarObjects: parseTags(objectsInput),
    };

    try {
      await nerRepository.updateNERProfile(userId, profileData);
      syncNERProfile(userId).catch(() => {});
      setIsSaved(true);
      voice.speak(
        'आपकी क्षेत्रीय व सांस्कृतिक प्राथमिकताएं सुरक्षित कर ली गई हैं।',
        'Your regional and cultural preferences have been saved.'
      );
      setTimeout(() => setIsSaved(false), 3000);
    } catch (err) {
      console.warn('[NERProfile] Save error:', err);
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-slow-fade text-left select-none max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-[#EBF7F0] rounded-[2.5rem] p-6 sm:p-8 border-2 border-[#167A55]/20 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <button
            onClick={() => {
              sounds.playClickChime();
              navigateTo('settings');
            }}
            className="inline-flex items-center gap-2 text-sm font-black text-[#167A55] hover:text-[#126344] mb-2 cursor-pointer transition-colors"
          >
            <ArrowLeft className="w-4 h-4 stroke-[3]" />
            <span>{isHindi ? 'सेटिंग्स पर लौटें' : 'Back to Settings'}</span>
          </button>
          <div className="flex items-center gap-2">
            <span className="text-3xl">🌏</span>
            <h1 className="text-3xl sm:text-4xl font-black text-[#102A43]">
              {isHindi ? 'मेरा क्षेत्र व भाषा' : 'My Region & Language'}
            </h1>
          </div>
          <p className="mt-1 text-lg font-bold text-[#167A55]">
            {isHindi
              ? 'पूर्वोत्तर भारत की सांस्कृतिक प्राथमिकताएं और परिचित यादें'
              : 'North Eastern Region cultural preferences and familiar memories'}
          </p>
        </div>

        <VoiceButton
          id="ner-profile-voice"
          textHindi="यह आपका क्षेत्रीय व सांस्कृतिक प्राथमिकता पृष्ठ है। अपना राज्य और पसंदीदा भाषा चुनें।"
          textEnglish="This is your regional and cultural preferences page. Select your state and preferred language."
          size="lg"
          label={isHindi ? 'सुनें' : 'Listen'}
        />
      </div>

      {/* Main Profile Form */}
      <form onSubmit={handleSave} className="bg-white border-3 border-[#DFF3E7] rounded-[2.5rem] p-6 sm:p-10 shadow-sm space-y-8">
        {/* 1. State / Region Selection */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#EAF7EF] text-[#167A55] flex items-center justify-center font-black">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-[#102A43]">
                {isHindi ? '1. आपका राज्य (पूर्वोत्तर भारत)' : '1. Your State / Region (NER)'}
              </h2>
              <p className="text-sm font-bold text-[#5D7184]">
                {isHindi ? 'जिस राज्य से आप जुड़े हैं उसे चुनें' : 'Choose the state you feel most at home in'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {NER_STATES_LIST.map((state) => {
              const isSelected = stateOrRegion === state.id;
              return (
                <button
                  type="button"
                  key={state.id}
                  onClick={() => {
                    sounds.playClickChime();
                    setStateOrRegion(state.id);
                  }}
                  className={`tactile-btn p-4 rounded-2xl border-2 text-center transition-all cursor-pointer font-black text-sm sm:text-base ${
                    isSelected
                      ? 'bg-[#EAF7EF] border-[#167A55] text-[#167A55] shadow-sm'
                      : 'bg-[#FBFAF4] border-slate-200 text-[#102A43] hover:border-[#167A55]/40'
                  }`}
                >
                  {isHindi ? state.nameHindi : state.nameEnglish}
                </button>
              );
            })}
          </div>
        </div>

        {/* Sub-region or home village */}
        <div className="space-y-2">
          <label className="text-sm font-black text-[#102A43]">
            {isHindi ? 'गृह नगर / गाँव / जिला (वैकल्पिक)' : 'Home Village / Town / District (Optional)'}
          </label>
          <input
            type="text"
            value={subRegion}
            onChange={(e) => setSubRegion(e.target.value)}
            placeholder={isHindi ? 'उदा. ब्रह्मपुत्र घाटी, डिब्रूगढ़, इम्फाल...' : 'e.g. Brahmaputra Valley, Dibrugarh, Imphal...'}
            className="w-full p-4 rounded-2xl bg-[#FBFAF4] border-2 border-slate-200 font-bold text-lg text-[#102A43] focus:border-[#167A55] outline-none"
          />
        </div>

        {/* 2. Preferred Language Selection */}
        <div className="space-y-4 pt-4 border-t-2 border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-black">
              <Languages className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-[#102A43]">
                {isHindi ? '2. पसंदीदा क्षेत्रीय भाषा' : '2. Preferred Regional Language'}
              </h2>
              <p className="text-sm font-bold text-[#5D7184]">
                {isHindi
                  ? 'भाषा प्राथमिकता (नोट: ध्वनि/वॉइस समर्थन अलग से नियंत्रित होता है)'
                  : 'Language preference (Note: Voice assistant support is managed separately)'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {REGIONAL_LANGUAGES_LIST.map((lang) => {
              const isSelected = preferredLanguage === lang.code;
              return (
                <button
                  type="button"
                  key={lang.code}
                  onClick={() => {
                    sounds.playClickChime();
                    setPreferredLanguage(lang.code);
                  }}
                  className={`tactile-btn p-4 rounded-2xl border-2 text-left transition-all cursor-pointer font-black text-sm ${
                    isSelected
                      ? 'bg-blue-50 border-blue-600 text-blue-800 shadow-sm'
                      : 'bg-[#FBFAF4] border-slate-200 text-[#102A43] hover:border-blue-300'
                  }`}
                >
                  {lang.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Cultural Preferences & Comfort Items */}
        <div className="space-y-6 pt-4 border-t-2 border-slate-100">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-[#102A43]">
              {isHindi ? '3. परिचित सांस्कृतिक यादें व प्राथमिकताएं' : '3. Familiar Cultural Preferences'}
            </h2>
            <p className="text-sm font-bold text-[#5D7184]">
              {isHindi
                ? 'अपने सुखद और परिचित शब्दों को दर्ज करें (अल्पविराम / comma से अलग करें)'
                : 'Enter comforting everyday preferences separated by commas'}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-black text-[#102A43] flex items-center gap-2">
                <span>🍵</span>
                <span>{isHindi ? 'पसंदीदा भोजन / चाय' : 'Familiar Foods / Tea'}</span>
              </label>
              <input
                type="text"
                value={foodsInput}
                onChange={(e) => setFoodsInput(e.target.value)}
                placeholder={isHindi ? 'उदा. गरम अदरक चाय, भात, खार...' : 'e.g. Assam tea, Rice, Khar, Pitha...'}
                className="w-full p-4 rounded-2xl bg-[#FBFAF4] border-2 border-slate-200 font-bold text-[#102A43] focus:border-[#167A55] outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-black text-[#102A43] flex items-center gap-2">
                <span>🏞️</span>
                <span>{isHindi ? 'परिचित स्थान / नदियाँ' : 'Familiar Places / Rivers'}</span>
              </label>
              <input
                type="text"
                value={placesInput}
                onChange={(e) => setPlacesInput(e.target.value)}
                placeholder={isHindi ? 'उदा. कामाख्या, माजुली, ब्रह्मपुत्र...' : 'e.g. Kamakhya, Majuli, Brahmaputra river...'}
                className="w-full p-4 rounded-2xl bg-[#FBFAF4] border-2 border-slate-200 font-bold text-[#102A43] focus:border-[#167A55] outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-black text-[#102A43] flex items-center gap-2">
                <span>🪕</span>
                <span>{isHindi ? 'पसंदीदा संगीत / धुन' : 'Familiar Music / Folk Songs'}</span>
              </label>
              <input
                type="text"
                value={musicInput}
                onChange={(e) => setMusicInput(e.target.value)}
                placeholder={isHindi ? 'उदा. बिहू गीत, बांसुरी, भजन...' : 'e.g. Bihu folk songs, Flute melodies, Prayer chants...'}
                className="w-full p-4 rounded-2xl bg-[#FBFAF4] border-2 border-slate-200 font-bold text-[#102A43] focus:border-[#167A55] outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-black text-[#102A43] flex items-center gap-2">
                <span>🌸</span>
                <span>{isHindi ? 'पसंदीदा त्यौहार / उत्सव' : 'Festivals / Celebrations'}</span>
              </label>
              <input
                type="text"
                value={festivalsInput}
                onChange={(e) => setFestivalsInput(e.target.value)}
                placeholder={isHindi ? 'उदा. रोंगाली बिहू, दुर्गा पूजा...' : 'e.g. Rongali Bihu, Hornbill, Losar...'}
                className="w-full p-4 rounded-2xl bg-[#FBFAF4] border-2 border-slate-200 font-bold text-[#102A43] focus:border-[#167A55] outline-none"
              />
            </div>
          </div>
        </div>

        {/* Submit button */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          {isSaved ? (
            <div className="inline-flex items-center gap-2 text-[#167A55] font-black text-lg">
              <CheckCircle2 className="w-6 h-6 stroke-[3]" />
              <span>{isHindi ? 'प्राथमिकताएं सुरक्षित हो गईं!' : 'Preferences Saved!'}</span>
            </div>
          ) : (
            <div className="text-sm font-bold text-slate-400">
              {isHindi ? 'डेटा आपके उपकरण में सुरक्षित रहेगा' : 'Data stored safely on your device'}
            </div>
          )}

          <button
            type="submit"
            className="tactile-btn w-full sm:w-auto px-10 py-5 rounded-2xl bg-[#167A55] hover:bg-[#126344] text-white font-black text-xl flex items-center justify-center gap-3 shadow-lg cursor-pointer"
          >
            <Save className="w-5 h-5 stroke-[3]" />
            <span>{isHindi ? 'प्राथमिकताएं सुरक्षित करें' : 'Save Preferences'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
