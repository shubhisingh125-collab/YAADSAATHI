import React, { useState } from 'react';
import { PhoneCall, X, Home } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useI18n } from '../i18n/I18nContext';
import VoiceButton from './VoiceButton';

export default function QuickSosModal() {
  const { sosModalOpen, setSosModalOpen, patient, sounds, voice } = useApp();
  const { t, isHindi } = useI18n();
  const [callInitiated, setCallInitiated] = useState(null);

  if (!sosModalOpen) return null;

  const handleConfirmCall = (contactName) => {
    sounds.playSuccessChime();
    setCallInitiated(contactName);
    voice.speak(
      `${contactName} को तुरंत कॉल मिलाई जा रही है। कृपया शांत रहें, परिवार को सूचित किया जा रहा है।`,
      `Calling ${contactName}. Help is on the way. Please stay calm.`
    );
  };

  const handleClose = () => {
    sounds.playClickChime();
    setCallInitiated(null);
    setSosModalOpen(false);
  };

  const daughterName = isHindi ? 'प्रिया शर्मा (सुपुत्री)' : 'Priya Sharma (Daughter)';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#102A43]/75 backdrop-blur-sm animate-slow-fade select-none">
      <div
        className="relative w-full max-w-xl bg-white rounded-[2.5rem] p-6 sm:p-8 shadow-2xl border-4 border-[#FFE8EF] text-left max-h-[90vh] overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-label={t('sosTitle')}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b-2 border-[#FFE8EF]">
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-2xl bg-[#FFE8EF] text-[#E84D78] flex items-center justify-center text-3xl shrink-0" aria-hidden="true">
              ❤️
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-[#E84D78]">{t('sosTitle')}</h2>
              <p className="text-base font-bold text-[#5D7184]">{t('sosSub')}</p>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="p-3 rounded-2xl bg-[#FBFAF4] hover:bg-[#FFE8EF] text-[#5D7184] hover:text-[#E84D78] cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
            aria-label={t('voiceClose')}
          >
            <X className="w-7 h-7" />
          </button>
        </div>

        {/* Call Toast Notice when simulated */}
        {callInitiated ? (
          <div className="mt-5 p-6 rounded-3xl bg-[#EAF7EF] border-3 border-[#167A55] text-center space-y-3 animate-slow-fade">
            <div className="w-16 h-16 rounded-full bg-[#167A55] text-white flex items-center justify-center mx-auto text-3xl animate-bounce" aria-hidden="true">
              📞
            </div>
            <h3 className="text-2xl sm:text-3xl font-black text-[#167A55]">
              {t('sosCallingNotice', { name: callInitiated })}
            </h3>
            <p className="text-base sm:text-lg font-bold text-[#102A43]">{t('sosSimulatedNotice')}</p>
            <button
              onClick={() => setCallInitiated(null)}
              className="tactile-btn mt-2 px-6 py-2.5 rounded-2xl bg-[#167A55] text-white font-bold text-base cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              {t('sosEndSimulation')}
            </button>
          </div>
        ) : (
          /* Confirmation Question */
          <div className="mt-5 p-5 rounded-3xl bg-[#FFE8EF]/60 border-2 border-[#E84D78]/30 space-y-3 text-center">
            <h3 className="text-2xl sm:text-3xl font-black text-[#102A43]">"{t('sosConfirmQuestion')}"</h3>
            <p className="text-base sm:text-lg font-bold text-[#5D7184]">"{t('sosConfirmSub')}"</p>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={() => handleConfirmCall(daughterName)}
                className="tactile-btn flex-1 py-4 px-4 rounded-2xl bg-[#E84D78] hover:bg-[#D43B66] text-white font-black text-xl flex items-center justify-center gap-2 cursor-pointer shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
              >
                <PhoneCall className="w-6 h-6" aria-hidden="true" />
                <span>{t('sosCallFamily')}</span>
              </button>

              <button
                onClick={handleClose}
                className="tactile-btn py-4 px-6 rounded-2xl bg-white hover:bg-[#FBFAF4] border-2 border-[#E2E8F0] text-[#102A43] font-bold text-lg cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
              >
                {t('sosNo')}
              </button>
            </div>
          </div>
        )}

        {/* Home Address Card for Disorientation Protection */}
        <div className="mt-5 p-4 sm:p-5 rounded-2xl bg-[#FBFAF4] border-2 border-[#DFF3E7]">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 text-[#167A55] font-black text-lg">
              <Home className="w-5 h-5 text-[#167A55]" aria-hidden="true" />
              <span>{t('sosMyHomeAddress')}:</span>
            </div>
            <VoiceButton
              textHindi={`आपका घर का पता है: ${patient?.homeAddressHindi || patient?.homeAddress || ''}।`}
              textEnglish={`Your home address is: ${patient?.homeAddressEnglish || patient?.homeAddress || ''}.`}
              size="sm"
              label=""
            />
          </div>
          <p className="mt-1 text-xl font-black text-[#102A43]">
            {isHindi ? (patient?.homeAddressHindi || patient?.homeAddress || '') : (patient?.homeAddressEnglish || patient?.homeAddress || '')}
          </p>
        </div>

        {/* Registered Emergency Numbers */}
        <div className="mt-5 space-y-3">
          <h4 className="text-lg font-black text-[#102A43]">{t('sosDirectDial')}:</h4>

          {/* Daughter */}
          <button
            onClick={() => handleConfirmCall(daughterName)}
            className="tactile-btn w-full p-4 rounded-2xl bg-[#FFE8EF] hover:bg-[#FFD1DE] border-2 border-[#E84D78]/40 flex items-center justify-between text-left cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            <div>
              <p className="text-xl font-black text-[#E84D78]">{daughterName}</p>
              <p className="text-sm font-bold text-[#102A43]">{patient?.emergencyContact?.phone || '+91 98765 43210'}</p>
            </div>
            <span className="px-4 py-2 bg-[#E84D78] text-white rounded-xl font-black text-base flex items-center gap-1.5">
              <PhoneCall className="w-4 h-4" aria-hidden="true" /> {t('sosCallBtn')}
            </span>
          </button>

          {/* Doctor */}
          <button
            onClick={() => handleConfirmCall(patient?.doctorContact?.name || (isHindi ? 'डॉ. एस. के. वर्मा' : 'Dr. S. K. Verma'))}
            className="tactile-btn w-full p-4 rounded-2xl bg-[#EAF7EF] hover:bg-[#DFF3E7] border-2 border-[#167A55]/30 flex items-center justify-between text-left cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            <div>
              <p className="text-lg font-black text-[#167A55]">{patient?.doctorContact?.name || (isHindi ? 'डॉ. एस. के. वर्मा' : 'Dr. S. K. Verma')}</p>
              <p className="text-sm font-bold text-[#102A43]">
                {patient?.doctorContact?.clinic || (isHindi ? 'मेमोरी केयर क्लिनिक' : 'Memory Care Clinic')} ({patient?.doctorContact?.phone || '+91 98765 00000'})
              </p>
            </div>
            <span className="px-4 py-2 bg-[#167A55] text-white rounded-xl font-black text-base flex items-center gap-1.5">
              <PhoneCall className="w-4 h-4" aria-hidden="true" /> {t('sosCallBtn')}
            </span>
          </button>

          {/* Ambulance 108 */}
          <button
            onClick={() => handleConfirmCall(t('sosAmbulance'))}
            className="tactile-btn w-full p-4 rounded-2xl bg-[#FFE8EF] hover:bg-[#FFD1DE] border-2 border-[#E84D78]/40 flex items-center justify-between text-left cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            <div>
              <p className="text-lg font-black text-[#E84D78]">{t('sosAmbulance')}</p>
              <p className="text-sm font-bold text-[#5D7184]">{t('sosDial108')}</p>
            </div>
            <span className="px-4 py-2 bg-[#E84D78] text-white rounded-xl font-black text-base flex items-center gap-1.5">
              {t('sosDial108Btn')}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
