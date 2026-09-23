import React from 'react';
import { CheckCircle2, Clock } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useI18n } from '../i18n/I18nContext';
import VoiceButton from './VoiceButton';

export default function MedicineReminderModal() {
  const {
    activeMedicineReminder,
    confirmMedicineTaken,
    snoozeMedicineReminder,
    patient,
  } = useApp();
  const { t, isHindi } = useI18n();

  if (!activeMedicineReminder) return null;

  const med = activeMedicineReminder;
  const patientName = patient?.preferredName || (isHindi ? (patient?.nameHindi || patient?.name || 'वरिष्ठ सदस्य') : (patient?.nameEnglish || patient?.name || 'Dear Senior'));

  const speechHindi = `${patientName}, आपकी ${med.name} लेने का समय हो गया है। खुराक: ${med.dosage}। निर्देश: ${med.instructions}। कृपया दवाई लेने के बाद 'मैंने दवाई ले ली' बटन दबाएं।`;
  const speechEnglish = `${patientName}, it is time to take your ${med.name}. Dosage: ${med.dosage}. Instructions: ${med.instructions}. Please press 'I Took My Medicine' after taking it.`;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="medicine-reminder-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-[#102A43]/85 backdrop-blur-md animate-slow-fade text-left select-none"
    >
      <div className="relative w-full max-w-xl bg-white rounded-[2.5rem] p-6 sm:p-10 border-4 border-[#167A55] shadow-2xl space-y-6 max-h-[92vh] overflow-y-auto">
        {/* Header Ribbon */}
        <div className="flex items-center justify-between gap-3 border-b-2 border-[#DFF3E7] pb-4">
          <div className="flex items-center gap-3.5">
            <div className="w-16 h-16 rounded-2xl bg-[#EAF7EF] border-2 border-[#167A55] text-[#167A55] flex items-center justify-center text-4xl shrink-0 animate-bounce">
              🔔
            </div>
            <div>
              <span className="inline-block px-3.5 py-1 rounded-full bg-[#EAF7EF] text-[#167A55] font-black text-xs uppercase tracking-wider mb-1">
                {t('medicineReminder')}
              </span>
              <h2
                id="medicine-reminder-title"
                className="text-2xl sm:text-4xl font-black text-[#102A43] tracking-tight"
              >
                {t('medicineTime')}
              </h2>
            </div>
          </div>

          <VoiceButton
            id="medicine-reminder-voice-btn"
            textHindi={speechHindi}
            textEnglish={speechEnglish}
            size="md"
            label={t('listen')}
          />
        </div>

        {/* Personalized Senior Greeting */}
        <div className="p-4 sm:p-5 rounded-3xl bg-[#EAF7EF] border-2 border-[#167A55]/30">
          <p className="text-xl sm:text-2xl font-black text-[#102A43]">
            "{t('timeToTakeMedicine', { name: patientName })}"
          </p>
          <p className="text-sm sm:text-base font-bold text-[#167A55] mt-1">
            {t('pressWhenTaken')}
          </p>
        </div>

        {/* Medicine Details Card */}
        <div className="p-5 sm:p-6 rounded-3xl bg-[#FBFAF4] border-3 border-[#DFF3E7] space-y-3">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white border-2 border-[#167A55]/20 text-[#167A55] flex items-center justify-center text-3xl shrink-0 shadow-xs">
              💊
            </div>
            <div className="flex-1">
              <span className="text-xs font-black uppercase text-[#5D7184] block">
                {t('medicine')}
              </span>
              <h3 className="text-2xl sm:text-3xl font-black text-[#102A43] mt-0.5">
                {med.name}
              </h3>
              <p className="text-lg font-black text-[#167A55] mt-1">
                {t('dosage')}: {med.dosage}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-sm font-bold text-[#5D7184]">
            <div className="p-3 rounded-xl bg-white border border-[#E2E8F0]">
              <span className="block text-xs font-black uppercase text-[#5D7184]">
                {t('scheduledTime')}
              </span>
              <span className="text-lg font-black text-[#102A43]">
                ⏰ {med.scheduledTime}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-white border border-[#E2E8F0]">
              <span className="block text-xs font-black uppercase text-[#5D7184]">
                {t('instructions')}
              </span>
              <span className="text-sm font-bold text-[#102A43]">
                {med.instructions}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons: "I TOOK MY MEDICINE" & "REMIND ME LATER" */}
        <div className="space-y-3 pt-1">
          {/* PRIMARY CONFIRMATION BUTTON (Requirement 6) */}
          <button
            id="confirm-medicine-taken-btn"
            onClick={() => confirmMedicineTaken(med.id)}
            aria-label={t('iTookMyMedicine')}
            className="tactile-btn w-full py-5 sm:py-6 px-6 rounded-3xl bg-[#167A55] hover:bg-[#115C40] border-3 border-[#0D4E36] text-white font-black text-xl sm:text-2xl flex items-center justify-center gap-3 shadow-xl cursor-pointer"
          >
            <CheckCircle2 className="w-8 h-8 stroke-[3]" />
            <span>✅ {t('iTookMyMedicine')}</span>
          </button>

          {/* SNOOZE BUTTON (Requirement 8) */}
          <button
            id="snooze-medicine-btn"
            onClick={() => snoozeMedicineReminder(med.id)}
            aria-label={t('remindMeLater')}
            className="tactile-btn w-full py-4 px-6 rounded-3xl bg-white hover:bg-[#FBFAF4] border-2 border-[#CBD5E1] text-[#5D7184] hover:text-[#102A43] font-black text-lg sm:text-xl flex items-center justify-center gap-2.5 cursor-pointer"
          >
            <Clock className="w-6 h-6" />
            <span>⏰ {t('remindMeLater')} ({med.reminderIntervalMinutes || 15} mins)</span>
          </button>
        </div>

        {/* Informational Safety Note (Requirement 21) */}
        <p className="text-xs font-semibold text-[#5D7184] text-center pt-1">
          *{t('medicineDisclaimer')}
        </p>
      </div>
    </div>
  );
}
