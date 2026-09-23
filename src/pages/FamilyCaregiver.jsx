import React, { useState } from 'react';
import {
  Heart,
  PhoneCall,
  MapPin,
  ShieldCheck,
  Mic,
  CheckCircle2,
  AlertTriangle,
  Info,
  Pill,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useI18n } from '../i18n/I18nContext';
import VoiceButton from '../components/VoiceButton';
import SafeCircleMapModal from '../components/SafeCircleMapModal';

export default function FamilyCaregiver() {
  const {
    patient,
    reminders,
    sounds,
    voice,
    userLocation,
    homeLocation,
    safeRadius,
    distanceFromHome,
    safeZoneStatus,
    locationSharing,
    medicines = [],
    caregiverMedicineAlerts = [],
    dismissCaregiverAlert,
  } = useApp();

  const { t, isHindi } = useI18n();

  const [activeTab, setActiveTab] = useState('contacts'); // 'contacts', 'memories', 'telemetry'
  const [recordedMsg, setRecordedMsg] = useState(
    'पिताजी, शाम 5 बजे अपनी अदरक वाली चाय पीना मत भूलिएगा! - आपकी बेटी प्रिया'
  );
  const [recordSaved, setRecordSaved] = useState(false);
  const [isMapOpen, setIsMapOpen] = useState(false);

  const isSafe = safeZoneStatus === 'SAFE';
  const isApproaching = safeZoneStatus === 'APPROACHING';
  const isOutside = safeZoneStatus === 'OUTSIDE_SAFE_ZONE';

  const handleSimulateCall = (name) => {
    sounds.playSuccessChime();
    voice.speak(
      `${name} को कॉल मिलाई जा रही है। कृपया प्रतीक्षा करें।`,
      `Calling ${name}. Please hold on.`
    );
  };

  const handleSaveVoice = () => {
    sounds.playSuccessChime();
    setRecordSaved(true);
    voice.speak(
      'पारिवारिक आवाज संदेश सहेज लिया गया है। यह रिमाइंडर पर दामोदर जी को सुनाया जाएगा।',
      'Personalized family voice message saved.'
    );
    setTimeout(() => setRecordSaved(false), 3000);
  };

  const completedReminders = reminders.filter((r) => r.completed).length;

  return (
    <div className="space-y-6 pb-12 animate-fade-in text-left">
      {/* 1. Header with Family Corner Branding */}
      <div className="bg-[#FFE8EF] rounded-[2.5rem] p-6 sm:p-8 border-3 border-[#E84D78]/30 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-[#E84D78]/30 text-[#E84D78] font-black text-sm mb-1">
            <Heart className="w-4 h-4 fill-[#E84D78]" />
            <span>{t('familyCorner')} ❤️</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-[#102A43]">
            {isHindi ? 'परिवार व देखभालकर्ता मंच' : 'Welcome, Family ❤️'}
          </h1>
          <p className="text-xl sm:text-2xl font-black text-[#E84D78] mt-1">
            {t('familySub')}
          </p>
          <p className="text-base sm:text-lg font-bold text-[#5D7184]">
            {isHindi ? 'अपनों के साथ सदैव जुड़े रहें, सुरक्षित रहें और निश्चिंत रहें।' : 'Keeping families close, connected, and reassured every single day.'}
          </p>
        </div>

        <VoiceButton
          textHindi="यह परिवार और देखभालकर्ता कॉर्नर है। यहाँ आप बेटी प्रिया, डॉक्टर या सहायता को तुरंत 1-टैप में कॉल कर सकते हैं और SafeCircle सुरक्षा घेरा देख सकते हैं।"
          textEnglish="Welcome to Family Corner. Connect with loved ones, view memories, and monitor SafeCircle location safety."
          size="lg"
          label={t('listen')}
        />
      </div>

      {/* Non-Clinical Engagement Disclaimer Banner */}
      <div className="p-4 sm:p-5 rounded-3xl bg-[#FBFAF4] border-2 border-[#DFF3E7] flex items-start gap-3.5">
        <Info className="w-6 h-6 text-[#167A55] shrink-0 mt-0.5" />
        <div className="text-xs sm:text-sm font-semibold text-[#5D7184] leading-relaxed">
          <strong className="text-[#102A43] font-black block text-sm sm:text-base">
            {isHindi ? 'गैर-चिकित्सकीय सहभागिता सूचना:' : 'Non-Clinical Reassurance Notice:'}
          </strong>
          {isHindi
            ? 'यह प्रणाली देखभालकर्ता जागरूकता और भावनात्मक संबल के लिए है। यह आपातकालीन चिकित्सा या पुलिस रेस्पॉन्स का दावा नहीं करती है।'
            : 'This feature provides safety awareness and reassurance for family members. It does not replace emergency medical response services.'}
        </div>
      </div>

      {/* Prominent Caregiver Medicine Escalation Alert Banner */}
      {caregiverMedicineAlerts && caregiverMedicineAlerts.length > 0 && (
        <div
          role="alert"
          className="p-5 sm:p-7 rounded-[2.5rem] bg-[#FFF0D7] border-3 border-[#E98A20] shadow-md flex flex-col gap-4 animate-slow-fade"
        >
          <div className="flex items-center justify-between gap-3 border-b-2 border-[#E98A20]/20 pb-3">
            <div className="flex items-center gap-2.5">
              <span className="w-4 h-4 rounded-full bg-[#E98A20] animate-ping" />
              <h2 className="text-xl sm:text-2xl font-black text-[#102A43]">
                ⚠️ {t('caregiverAlert')} ({caregiverMedicineAlerts.length})
              </h2>
            </div>
            <span className="text-xs sm:text-sm font-bold text-[#E98A20] bg-white px-3 py-1 rounded-full border border-[#E98A20]/30">
              {isHindi ? 'तत्काल ध्यान अपेक्षित' : 'Attention Required'}
            </span>
          </div>

          <div className="space-y-3">
            {caregiverMedicineAlerts.map((alert) => (
              <div
                key={alert.id}
                className="bg-white/90 rounded-2xl p-4 sm:p-5 border-2 border-[#E98A20]/40 flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-[#FFE8EF] text-[#E84D78] flex items-center justify-center text-2xl shrink-0">
                    💊
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2.5 py-0.5 rounded-full bg-[#E84D78] text-white font-black text-xs uppercase">
                        🔴 {t('statusNotConfirmed')}
                      </span>
                      <span className="text-xs font-mono font-bold text-[#5D7184]">
                        ⏰ {t('scheduledTime')}: {alert.scheduledTime}
                      </span>
                      <span className="text-xs font-bold text-[#5D7184]">
                        • {isHindi ? `अवधि: ${alert.escalationAfterMinutes} मिनट` : `Period: ${alert.escalationAfterMinutes}m`}
                      </span>
                    </div>

                    <h3 className="text-xl sm:text-2xl font-black text-[#102A43] mt-1">
                      {patient.nameHindi || 'दामोदर जी'} {isHindi ? 'ने दवाई लेने की पुष्टि नहीं की:' : 'has not confirmed taking:'}{' '}
                      <span className="text-[#E84D78]">{alert.medicineName}</span> ({alert.dosage})
                    </h3>
                    <p className="text-xs sm:text-sm font-semibold text-[#5D7184] mt-0.5">
                      {isHindi
                        ? 'दवा का समय बीत चुका है और स्मरण चक्र समाप्त होने पर भी पुष्टि प्राप्त नहीं हुई है।'
                        : 'Scheduled time passed with multiple reminders sent and no elderly confirmation received.'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
                  <button
                    id={`call-elderly-alert-${alert.id}`}
                    onClick={() => handleSimulateCall(patient?.nameHindi || patient?.name || 'वरिष्ठ सदस्य', patient.emergencyContact?.phone || '+91 98765 43210')}
                    className="tactile-btn px-4 py-2.5 rounded-2xl bg-[#E84D78] text-white font-black text-sm sm:text-base flex items-center gap-2 cursor-pointer shadow-xs"
                    aria-label="Call senior regarding medicine"
                  >
                    <PhoneCall className="w-4 h-4 stroke-[2.5]" />
                    <span>📞 {t('callElder')}</span>
                  </button>

                  <button
                    id={`view-safecircle-alert-${alert.id}`}
                    onClick={() => setIsMapOpen(true)}
                    className="tactile-btn px-4 py-2.5 rounded-2xl bg-[#167A55] text-white font-black text-sm sm:text-base flex items-center gap-2 cursor-pointer shadow-xs"
                    aria-label="View SafeCircle location safety"
                  >
                    <ShieldCheck className="w-4 h-4 stroke-[2.5]" />
                    <span>🛡️ {isHindi ? 'SafeCircle देखें' : 'View SafeCircle'}</span>
                  </button>

                  <button
                    id={`dismiss-alert-${alert.id}`}
                    onClick={() => dismissCaregiverAlert(alert.id)}
                    className="tactile-btn px-3 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs sm:text-sm flex items-center gap-1 cursor-pointer"
                    aria-label="Dismiss alert"
                  >
                    <X className="w-4 h-4" />
                    <span>{isHindi ? 'हटाएं' : 'Dismiss'}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PART 14: Safe Zone Alert Banner if Outside Safe Zone */}
      {locationSharing && isOutside && (
        <div
          role="alert"
          className="p-5 sm:p-6 rounded-[2.5rem] bg-[#FFE8EF] border-3 border-[#E84D78] shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-slow-fade"
        >
          <div className="flex items-start gap-3.5">
            <AlertTriangle className="w-8 h-8 text-[#E84D78] shrink-0 mt-1" />
            <div>
              <span className="inline-block px-3 py-0.5 rounded-full bg-[#E84D78] text-white font-black text-xs uppercase tracking-wider mb-1">
                ⚠️ {t('outsideSafeZone')}
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-[#102A43]">
                {t('safeZoneAlertDesc')}
              </h3>
              <p className="text-sm sm:text-base font-bold text-[#5D7184] mt-0.5">
                {t('lastUpdated')}: {userLocation?.lastUpdated} • {t('distanceFromHome', { dist: distanceFromHome })}
              </p>
              <p className="text-xs sm:text-sm font-semibold text-[#E84D78] mt-1">
                {isHindi ? 'वर्तमान पता' : 'Current address'}: {userLocation?.address}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            <button
              id="family-alert-view-map-btn"
              onClick={() => setIsMapOpen(true)}
              className="tactile-btn px-4 py-3 rounded-2xl bg-[#167A55] text-white font-black text-base flex items-center gap-2 cursor-pointer shadow-xs"
            >
              <MapPin className="w-5 h-5 stroke-[2.5]" />
              <span>🗺️ {t('viewLocation')}</span>
            </button>
            <button
              id="family-alert-call-btn"
              onClick={() => handleSimulateCall(patient?.nameHindi || patient?.name || 'वरिष्ठ सदस्य', patient.emergencyContact?.phone || '+91 98765 43210')}
              className="tactile-btn px-4 py-3 rounded-2xl bg-[#E84D78] text-white font-black text-base flex items-center gap-2 cursor-pointer shadow-xs"
            >
              <PhoneCall className="w-5 h-5 stroke-[2.5]" />
              <span>📞 {t('callElder')}</span>
            </button>
          </div>
        </div>
      )}

      {/* PART 10: Family SafeCircle Card */}
      <section
        id="family-safecircle-card"
        className="bg-white rounded-[2.5rem] p-6 sm:p-8 border-3 border-[#DFF3E7] shadow-sm text-left space-y-4"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div
              className={`w-16 h-16 rounded-2xl border-2 flex items-center justify-center text-4xl shrink-0 ${
                !locationSharing
                  ? 'bg-slate-100 border-slate-300 text-slate-500'
                  : isSafe
                  ? 'bg-[#EAF7EF] border-[#167A55]/30 text-[#167A55]'
                  : 'bg-[#FFE8EF] border-[#E84D78]/30 text-[#E84D78]'
              }`}
            >
              🛡️
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl sm:text-2xl font-black text-[#102A43]">
                  SafeCircle • {isHindi ? patient.nameHindi : patient.nameEnglish}
                </span>
              </div>

              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="font-black text-sm text-[#5D7184]">{t('safeZone')}:</span>
                {!locationSharing ? (
                  <span className="px-3 py-0.5 rounded-full bg-slate-100 text-slate-600 font-black text-xs uppercase">
                    ⚪ {isHindi ? 'साझा करना रुका है' : 'Sharing Paused'}
                  </span>
                ) : isSafe ? (
                  <span className="px-3 py-0.5 rounded-full bg-[#EAF7EF] text-[#167A55] border border-[#167A55]/30 font-black text-xs uppercase flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#167A55] animate-ping" />
                    🟢 {t('statusSafe')}
                  </span>
                ) : isApproaching ? (
                  <span className="px-3 py-0.5 rounded-full bg-[#FFF0D7] text-[#E98A20] border border-[#E98A20]/30 font-black text-xs uppercase flex items-center gap-1.5">
                    🟠 {t('statusApproaching')}
                  </span>
                ) : (
                  <span className="px-3 py-0.5 rounded-full bg-[#FFE8EF] text-[#E84D78] border border-[#E84D78]/40 font-black text-xs uppercase flex items-center gap-1.5 animate-pulse">
                    🔴 {t('statusAlert')}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Action buttons: View Location & Call */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              id="family-view-location-btn"
              onClick={() => setIsMapOpen(true)}
              className="tactile-btn px-5 py-3 rounded-2xl bg-[#167A55] hover:bg-[#115C40] text-white font-black text-base flex items-center gap-2 cursor-pointer shadow-xs"
            >
              <MapPin className="w-5 h-5 stroke-[2.5]" />
              <span>🗺️ {t('viewLocation')}</span>
            </button>

            <button
              id="family-call-damodar-btn"
              onClick={() => handleSimulateCall(isHindi ? (patient?.nameHindi || patient?.name) : (patient?.nameEnglish || patient?.name), patient.emergencyContact?.phone)}
              className="tactile-btn px-5 py-3 rounded-2xl bg-white hover:bg-[#FBFAF4] border-2 border-[#167A55] text-[#167A55] font-black text-base flex items-center gap-2 cursor-pointer"
            >
              <PhoneCall className="w-5 h-5 stroke-[2.5]" />
              <span>📞 {t('callElder')}</span>
            </button>
          </div>
        </div>

        {/* Status Metrics Details */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <div className="p-4 rounded-2xl bg-[#FBFAF4] border border-[#E2E8F0]">
            <span className="text-xs font-black uppercase text-[#5D7184] block">
              {isHindi ? 'अंतिम ज्ञात स्थान (Last Known Location)' : 'Last Known Location'}
            </span>
            <p className="text-base font-black text-[#102A43] mt-1 truncate">
              {userLocation?.address}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#FBFAF4] border border-[#E2E8F0]">
            <span className="text-xs font-black uppercase text-[#5D7184] block">
              {t('lastUpdated')}
            </span>
            <p className="text-base font-black text-[#102A43] mt-1">
              {userLocation?.lastUpdated}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#FBFAF4] border border-[#E2E8F0]">
            <span className="text-xs font-black uppercase text-[#5D7184] block">
              {isHindi ? 'घर से दूरी (Distance From Home)' : 'Distance From Home'}
            </span>
            <p className="text-base font-black text-[#167A55] mt-1">
              {distanceFromHome} {isHindi ? 'मीटर (सुरक्षित दायरा: 500m)' : 'meters (Radius: 500m)'}
            </p>
          </div>
        </div>
      </section>

      {/* 3. Section Tabs */}
      <div className="flex items-center gap-2.5 overflow-x-auto pb-1">
        <button
          onClick={() => {
            sounds.playClickChime();
            setActiveTab('contacts');
          }}
          className={`tactile-btn px-6 py-3 rounded-2xl font-black text-lg sm:text-xl shrink-0 cursor-pointer ${
            activeTab === 'contacts'
              ? 'bg-[#E84D78] border-2 border-[#B82B53] text-white'
              : 'bg-white hover:bg-[#FFE8EF] border-2 border-[#DFF3E7] text-[#102A43]'
          }`}
        >
          📞 {isHindi ? '1-टैप कॉल (Family Contacts)' : '1-Tap Family Contacts'}
        </button>

        <button
          id="family-tab-medicines"
          onClick={() => {
            sounds.playClickChime();
            setActiveTab('medicines');
          }}
          className={`tactile-btn px-6 py-3 rounded-2xl font-black text-lg sm:text-xl shrink-0 cursor-pointer flex items-center gap-2 ${
            activeTab === 'medicines'
              ? 'bg-[#E84D78] border-2 border-[#B82B53] text-white'
              : 'bg-white hover:bg-[#FFE8EF] border-2 border-[#DFF3E7] text-[#102A43]'
          }`}
        >
          <span>💊</span>
          <span>{isHindi ? 'आज की दवाइयाँ (Medicines)' : "Today's Medicines"}</span>
          {caregiverMedicineAlerts.length > 0 && (
            <span className="w-2.5 h-2.5 rounded-full bg-amber-300 animate-ping" />
          )}
        </button>

        <button
          onClick={() => {
            sounds.playClickChime();
            setActiveTab('memories');
          }}
          className={`tactile-btn px-6 py-3 rounded-2xl font-black text-lg sm:text-xl shrink-0 cursor-pointer ${
            activeTab === 'memories'
              ? 'bg-[#E84D78] border-2 border-[#B82B53] text-white'
              : 'bg-white hover:bg-[#FFE8EF] border-2 border-[#DFF3E7] text-[#102A43]'
          }`}
        >
          🖼️ {isHindi ? 'पारिवारिक यादें (Memories)' : 'Family Memories'}
        </button>

        <button
          onClick={() => {
            sounds.playClickChime();
            setActiveTab('telemetry');
          }}
          className={`tactile-btn px-6 py-3 rounded-2xl font-black text-lg sm:text-xl shrink-0 cursor-pointer ${
            activeTab === 'telemetry'
              ? 'bg-[#E84D78] border-2 border-[#B82B53] text-white'
              : 'bg-white hover:bg-[#FFE8EF] border-2 border-[#DFF3E7] text-[#102A43]'
          }`}
        >
          📊 {isHindi ? 'सहभागिता रिपोर्ट (Care Telemetry)' : 'Care Telemetry'}
        </button>
      </div>

      {/* TAB 1: 1-Tap Emergency Family Contacts */}
      {activeTab === 'contacts' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Daughter Priya */}
            <div className="bg-white rounded-[2.5rem] p-6 border-2 border-[#DFF3E7] shadow-xs flex flex-col justify-between gap-4">
              <div>
                <span className="px-3 py-1 rounded-full bg-[#FFE8EF] text-[#E84D78] font-bold text-xs uppercase tracking-wider">
                  {isHindi ? 'प्राथमिक देखभालकर्ता' : 'Primary Caregiver'}
                </span>
                <h3 className="text-2xl sm:text-3xl font-black text-[#102A43] mt-2">
                  {isHindi ? 'प्रिया शर्मा (सुपुत्री)' : 'Priya Sharma (Daughter)'}
                </h3>
                <p className="text-base sm:text-lg font-bold text-[#5D7184]">
                  {isHindi ? 'फोन' : 'Phone'}: +91 98765 43210
                </p>
                <p className="text-sm font-semibold text-[#5D7184] mt-1">
                  {isHindi ? 'दैनिक दिनचर्या और सहायता के लिए सदैव उपलब्ध' : 'Available for daily routine and reassurance.'}
                </p>
              </div>

              <button
                onClick={() => handleSimulateCall(isHindi ? 'प्रिया शर्मा' : 'Priya Sharma')}
                className="tactile-btn w-full py-4 rounded-2xl bg-[#E84D78] hover:bg-[#D43B66] border-2 border-[#B82B53] text-white font-black text-xl flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                <PhoneCall className="w-6 h-6 stroke-[2.5]" />
                <span>{isHindi ? 'बेटी प्रिया को कॉल करें' : 'Call Daughter Priya'}</span>
              </button>
            </div>

            {/* Son Ravi */}
            <div className="bg-white rounded-[2.5rem] p-6 border-2 border-[#DFF3E7] shadow-xs flex flex-col justify-between gap-4">
              <div>
                <span className="px-3 py-1 rounded-full bg-[#E6F1FF] text-[#2879D0] font-bold text-xs uppercase tracking-wider">
                  {isHindi ? 'SafeCircle अधिकृत सदस्य' : 'SafeCircle Caregiver'}
                </span>
                <h3 className="text-2xl sm:text-3xl font-black text-[#102A43] mt-2">
                  {isHindi ? 'रवि शर्मा (सुपुत्र)' : 'Ravi Sharma (Son)'}
                </h3>
                <p className="text-base sm:text-lg font-bold text-[#5D7184]">
                  {isHindi ? 'फोन' : 'Phone'}: +91 98222 33445
                </p>
                <p className="text-sm font-semibold text-[#5D7184] mt-1">
                  {isHindi ? 'SafeCircle स्थान सूचनाएं प्राप्तकर्ता' : 'Receives SafeCircle zone notifications.'}
                </p>
              </div>

              <button
                onClick={() => handleSimulateCall(isHindi ? 'रवि शर्मा' : 'Ravi Sharma')}
                className="tactile-btn w-full py-4 rounded-2xl bg-[#2879D0] hover:bg-[#1E62A8] border-2 border-[#164F8B] text-white font-black text-xl flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                <PhoneCall className="w-6 h-6 stroke-[2.5]" />
                <span>{isHindi ? 'बेटा रवि से बात करें' : 'Call Son Ravi'}</span>
              </button>
            </div>

            {/* Doctor */}
            <div className="bg-white rounded-[2.5rem] p-6 border-2 border-[#DFF3E7] shadow-xs flex flex-col justify-between gap-4">
              <div>
                <span className="px-3 py-1 rounded-full bg-[#EAF7EF] text-[#167A55] font-bold text-xs uppercase tracking-wider">
                  {isHindi ? 'पारिवारिक डॉक्टर (Neurologist)' : 'Neurologist'}
                </span>
                <h3 className="text-2xl sm:text-3xl font-black text-[#102A43] mt-2">
                  {isHindi ? 'डॉ. राजेश मेहता' : 'Dr. Rajesh Mehta'}
                </h3>
                <p className="text-base sm:text-lg font-bold text-[#5D7184]">
                  {isHindi ? 'अपोलो क्लिनिक' : 'Apollo Clinic'} (+91 98111 22334)
                </p>
              </div>

              <button
                onClick={() => handleSimulateCall(isHindi ? 'डॉ. राजेश मेहता' : 'Dr. Rajesh Mehta')}
                className="tactile-btn w-full py-4 rounded-2xl bg-[#167A55] hover:bg-[#115C40] border-2 border-[#0D4E36] text-white font-black text-xl flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                <PhoneCall className="w-6 h-6 stroke-[2.5]" />
                <span>{isHindi ? 'डॉक्टर को कॉल करें' : 'Call Doctor'}</span>
              </button>
            </div>

            {/* Ambulance 108 */}
            <div className="bg-white rounded-[2.5rem] p-6 border-2 border-rose-300 shadow-xs flex flex-col justify-between gap-4">
              <div>
                <span className="px-3 py-1 rounded-full bg-rose-100 text-rose-800 font-bold text-xs uppercase tracking-wider">
                  {isHindi ? 'आपातकालीन सेवा (24x7)' : 'Emergency 24x7'}
                </span>
                <h3 className="text-2xl sm:text-3xl font-black text-rose-900 mt-2">
                  {isHindi ? 'राष्ट्रीय एम्बुलेंस (108)' : 'National Ambulance (108)'}
                </h3>
                <p className="text-base sm:text-lg font-bold text-[#5D7184]">
                  {isHindi ? 'डायल: 108 (अखिल भारतीय टोल फ्री)' : 'Dial: 108 (Pan-India Toll Free)'}
                </p>
              </div>

              <button
                onClick={() => handleSimulateCall(isHindi ? 'एम्बुलेंस 108' : 'Ambulance 108')}
                className="tactile-btn w-full py-4 rounded-2xl bg-[#E84D78] hover:bg-[#D43B66] border-2 border-[#B82B53] text-white font-black text-xl flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                <PhoneCall className="w-6 h-6 stroke-[2.5]" />
                <span>{isHindi ? '108 एम्बुलेंस डायल करें' : 'Dial 108 Ambulance'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB: TODAY'S MEDICINES (Caregiver Oversight) */}
      {activeTab === 'medicines' && (
        <div className="space-y-6">
          {/* Header Summary Card */}
          <div className="bg-white rounded-[2.5rem] p-6 sm:p-8 border-3 border-[#DFF3E7] shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 text-[#167A55] font-black text-sm uppercase mb-1">
                  <Pill className="w-4 h-4" />
                  <span>{t('todaysMedicines')}</span>
                </div>
                <h2 className="text-2xl sm:text-4xl font-black text-[#102A43]">
                  {isHindi ? "आज की निर्धारित दवाइयाँ" : "Today's Scheduled Medicines"}
                </h2>
                <p className="text-base sm:text-lg font-bold text-[#5D7184] mt-1">
                  {isHindi
                    ? "देखभालकर्ता रीयल-टाइम अवलोकन: पुष्टि स्थिति और स्वतः एस्केलेशन"
                    : "Real-time caregiver oversight, confirmation tracking, and auto-escalation."}
                </p>
              </div>

              {/* Adherence badge */}
              <div className="p-4 rounded-2xl bg-[#EAF7EF] border-2 border-[#167A55]/30 text-center shrink-0">
                <span className="text-xs font-black uppercase text-[#5D7184] block">
                  {t('adherence')}
                </span>
                <span className="text-3xl font-black text-[#167A55]">
                  {Math.round(
                    (medicines.filter((m) => m.status === 'TAKEN').length / (medicines.length || 1)) * 100
                  )}%
                </span>
                <span className="text-xs font-bold text-[#5D7184] block mt-0.5">
                  {medicines.filter((m) => m.status === 'TAKEN').length}/{medicines.length} {isHindi ? 'पुष्टि' : 'Confirmed'}
                </span>
              </div>
            </div>

            {/* Informational Non-Clinical Medical Disclaimer */}
            <div className="p-3.5 rounded-2xl bg-[#FBFAF4] border border-[#E2E8F0] text-xs font-semibold text-[#5D7184] leading-relaxed">
              ⚠️ <strong>{isHindi ? 'महत्वपूर्ण सूचना:' : 'Important Notice:'}</strong>{' '}
              {t('adherenceDisclaimer')}
            </div>
          </div>

          {/* Cards for each medicine */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {medicines.map((med) => {
              const isTaken = med.status === 'TAKEN';
              const isPending = med.status === 'REMINDER_PENDING';
              const isNotConfirmed = med.status === 'NOT_CONFIRMED';

              return (
                <div
                  key={med.id}
                  className={`bg-white rounded-[2.5rem] p-6 border-3 shadow-xs flex flex-col justify-between gap-4 transition-all ${
                    isTaken
                      ? 'border-[#167A55]/40 bg-gradient-to-b from-white to-[#EAF7EF]/20'
                      : isNotConfirmed
                      ? 'border-[#E84D78] bg-[#FFF5F7]'
                      : isPending
                      ? 'border-[#E98A20] bg-[#FFFDF7]'
                      : 'border-[#DFF3E7]'
                  }`}
                >
                  <div className="space-y-3">
                    {/* Top Row: Icon & Status Badge */}
                    <div className="flex items-start justify-between gap-3">
                      <div
                        className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shrink-0 ${
                          isTaken
                            ? 'bg-[#EAF7EF] text-[#167A55]'
                            : isNotConfirmed
                            ? 'bg-[#FFE8EF] text-[#E84D78]'
                            : isPending
                            ? 'bg-[#FFF0D7] text-[#E98A20]'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        💊
                      </div>

                      {/* Deterministic Status Badge */}
                      <div className="text-right">
                        {isTaken && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EAF7EF] text-[#167A55] font-black text-xs uppercase border border-[#167A55]/30">
                            🟢 {t('statusTaken')}
                          </span>
                        )}
                        {isPending && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFF0D7] text-[#E98A20] font-black text-xs uppercase border border-[#E98A20]/30 animate-pulse">
                            🟡 {t('statusReminderPending')}
                          </span>
                        )}
                        {isNotConfirmed && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFE8EF] text-[#E84D78] font-black text-xs uppercase border border-[#E84D78]/30 animate-bounce">
                            🔴 {t('statusNotConfirmed')}
                          </span>
                        )}
                        {med.status === 'SCHEDULED' && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-600 font-black text-xs uppercase border border-slate-300">
                            ⚪ {t('statusScheduled')}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Medicine Name & Dosage */}
                    <div>
                      <h3 className="text-2xl font-black text-[#102A43] leading-snug">
                        {med.name}
                      </h3>
                      <p className="text-base font-black text-[#E84D78] mt-0.5">
                        {med.dosage} • {med.frequency || 'Daily'}
                      </p>
                    </div>

                    {/* Scheduled Time & Instructions */}
                    <div className="p-3.5 rounded-2xl bg-[#FBFAF4] border border-[#E2E8F0] space-y-1.5 text-sm font-bold">
                      <div className="flex items-center justify-between text-[#102A43]">
                        <span className="text-[#5D7184]">{t('scheduledTime')}:</span>
                        <span className="font-mono font-black text-base">⏰ {med.scheduledTime}</span>
                      </div>

                      {med.instructions && (
                        <div className="text-xs text-[#5D7184] font-semibold">
                          💡 {med.instructions}
                        </div>
                      )}

                      {/* Explicit confirmation / escalation status text */}
                      {isTaken && (
                        <div className="pt-1 border-t border-[#DFF3E7] text-xs font-black text-[#167A55]">
                          ✅ {t('confirmedAt')}: {med.confirmedAt || '08:17 AM'}
                        </div>
                      )}

                      {isPending && (
                        <div className="pt-1 border-t border-[#FFF0D7] text-xs font-black text-[#E98A20]">
                          ⏳ {isHindi ? 'रिमाइंडर चक्र प्रगति में है (15 मिनट अंतराल)' : 'Reminder cycle in progress (15m interval)'}
                        </div>
                      )}

                      {isNotConfirmed && (
                        <div className="pt-1 border-t border-[#FFE8EF] text-xs font-black text-[#E84D78]">
                          ⚠️ {t('caregiverAlertSent')} ({med.escalationAfterMinutes || 60}m {isHindi ? 'समाप्त' : 'elapsed'})
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions for Caregiver */}
                  <div className="pt-3 border-t-2 border-[#DFF3E7] flex items-center gap-2 flex-wrap">
                    {isNotConfirmed && (
                      <>
                        <button
                          onClick={() => handleSimulateCall(patient?.nameHindi || patient?.name || 'वरिष्ठ सदस्य', patient.emergencyContact?.phone || '+91 98765 43210')}
                          className="tactile-btn flex-1 py-3 rounded-2xl bg-[#E84D78] text-white font-black text-sm flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          <PhoneCall className="w-4 h-4 stroke-[2.5]" />
                          <span>📞 {t('callElder')}</span>
                        </button>

                        <button
                          onClick={() => setIsMapOpen(true)}
                          className="tactile-btn py-3 px-3 rounded-2xl bg-[#167A55] text-white font-black text-sm flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                          title="View SafeCircle"
                        >
                          <ShieldCheck className="w-4 h-4 stroke-[2.5]" />
                          <span>🛡️ SafeCircle</span>
                        </button>
                      </>
                    )}

                    {isPending && (
                      <button
                        onClick={() => handleSimulateCall(patient.nameHindi || 'दामोदर जी', '+91 98765 43210')}
                        className="tactile-btn w-full py-3 rounded-2xl bg-[#E98A20] text-white font-black text-sm flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <PhoneCall className="w-4 h-4 stroke-[2.5]" />
                        <span>📞 {isHindi ? 'दवाई के लिए कॉल करें' : 'Call to Remind'}</span>
                      </button>
                    )}

                    {isTaken && (
                      <div className="w-full py-2 rounded-xl bg-[#EAF7EF] text-[#167A55] text-center font-black text-xs uppercase flex items-center justify-center gap-1">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>{isHindi ? 'दवाई की पुष्टि पूरी हो चुकी है' : 'Dose Confirmed by User'}</span>
                      </div>
                    )}

                    {med.status === 'SCHEDULED' && (
                      <div className="w-full py-2 rounded-xl bg-slate-100 text-slate-600 text-center font-bold text-xs">
                        ⏰ {isHindi ? `निर्धारित समय (${med.scheduledTime}) पर स्मरण होगा` : `Scheduled at ${med.scheduledTime}`}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: Photo Reminiscence Memories */}
      {activeTab === 'memories' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Memory 1 */}
            <div className="bg-white rounded-[2.5rem] p-6 border-2 border-[#DFF3E7] shadow-xs space-y-4">
              <div className="w-full h-48 bg-gradient-to-tr from-[#EAF7EF] to-[#FFE8EF] rounded-3xl flex items-center justify-center text-7xl shadow-inner">
                👩‍👧🪔
              </div>
              <div>
                <h3 className="text-2xl font-black text-[#102A43]">
                  {isHindi ? 'दिवाली पूजा - सुपुत्री प्रिया व नातिन आरोही' : 'Diwali Puja - with daughter Priya & granddaughter Aarohi'}
                </h3>
                <p className="text-base sm:text-lg font-bold text-[#5D7184] mt-1">
                  {isHindi
                    ? 'जयपुर - आंगन में सबने मिलकर दीये सजाए थे और मिठाई खाई थी।'
                    : 'Jaipur - the whole family lit diyas together in the courtyard and shared sweets.'}
                </p>
              </div>

              <VoiceButton
                textHindi="यह तस्वीर दिवाली की है। आपकी बेटी प्रिया और नातिन आरोही ने आपके साथ मिलकर आंगन में सुंदर दीये सजाए थे।"
                textEnglish="This photo is from Diwali with daughter Priya and granddaughter Aarohi lighting diyas."
                size="md"
                label={t('listen')}
                className="w-full"
              />
            </div>

            {/* Memory 2 */}
            <div className="bg-white rounded-[2.5rem] p-6 border-2 border-[#DFF3E7] shadow-xs space-y-4">
              <div className="w-full h-48 bg-gradient-to-tr from-[#EAF7EF] to-[#FFF0D7] rounded-3xl flex items-center justify-center text-7xl shadow-inner">
                🌳👴👵☕
              </div>
              <div>
                <h3 className="text-2xl font-black text-[#102A43]">
                  {isHindi ? 'शाम की सैर व अदरक चाय - सेंट्रल पार्क' : 'Evening Walk & Ginger Tea - Central Park'}
                </h3>
                <p className="text-base sm:text-lg font-bold text-[#5D7184] mt-1">
                  {isHindi
                    ? 'मित्रों के साथ ताज़ी हवा, हल्की सैर और चाय पर पुरानी बातें।'
                    : 'Fresh air, a gentle walk, and old stories over tea with friends.'}
                </p>
              </div>

              <VoiceButton
                textHindi="यह सेंट्रल पार्क की सुखद शाम है जहाँ आप अपने मित्रों के साथ अदरक वाली चाय और धूप का आनंद लेते हैं।"
                textEnglish="This is Central Park where you enjoy ginger tea and evening walks with friends."
                size="md"
                label={t('listen')}
                className="w-full"
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Care Telemetry & Personalized Voice Message */}
      {activeTab === 'telemetry' && (
        <div className="space-y-6">
          <div className="bg-white rounded-[2.5rem] p-6 sm:p-8 border-2 border-[#DFF3E7] shadow-xs space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#FFE8EF] text-[#E84D78] flex items-center justify-center">
                <Mic className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-2xl sm:text-3xl font-black text-[#102A43]">
                  {isHindi ? 'पारिवारिक आवाज में व्यक्तिगत संदेश' : 'Personalized Family Voice Guidance'}
                </h3>
                <p className="text-sm sm:text-base font-bold text-[#5D7184]">
                  {isHindi
                    ? 'डिमेशिया रोगियों को अपनों की जानी-पहचानी आवाज में निर्देश मिलने पर शांति मिलती है।'
                    : 'Familiar voices provide deep comfort and emotional grounding for seniors.'}
                </p>
              </div>
            </div>

            <textarea
              rows="3"
              value={recordedMsg}
              onChange={(e) => setRecordedMsg(e.target.value)}
              className="w-full p-4 rounded-2xl border-2 border-[#DFF3E7] text-lg font-bold text-[#102A43] bg-[#FBFAF4] focus:outline-none focus:border-[#167A55]"
            />

            <div className="flex flex-wrap items-center justify-between gap-3">
              <button
                onClick={handleSaveVoice}
                className="tactile-btn px-6 py-3.5 rounded-2xl bg-[#167A55] hover:bg-[#115C40] border-2 border-[#0D4E36] text-white font-black text-lg flex items-center gap-2 cursor-pointer shadow-sm"
              >
                <Mic className="w-5 h-5" />
                <span>{isHindi ? 'आवाज संदेश सहेजें (Save Voice Note)' : 'Save Voice Note'}</span>
              </button>

              {recordSaved && (
                <span className="text-[#167A55] font-black text-sm flex items-center gap-1.5 bg-[#EAF7EF] px-4 py-2 rounded-xl border border-[#167A55]/30 animate-slow-fade">
                  <CheckCircle2 className="w-5 h-5 text-[#167A55]" />
                  {isHindi ? 'संदेश सफलतापूर्वक सहेजा गया!' : 'Message saved successfully!'}
                </span>
              )}
            </div>
          </div>

          <div className="bg-white rounded-[2.5rem] p-6 sm:p-8 border-2 border-[#DFF3E7] shadow-xs space-y-3">
            <h3 className="text-2xl font-black text-[#102A43]">
              {isHindi ? 'दैनिक दिनचर्या अनुपालन दर' : 'Daily Routine Adherence'}
            </h3>
            <p className="text-lg font-bold text-[#167A55]">
              {completedReminders} / {reminders.length} {isHindi ? 'कार्य समय पर संपन्न हुए' : 'tasks completed on time'} (
              {Math.round((completedReminders / (reminders.length || 1)) * 100)}% {isHindi ? 'अनुपालन दर' : 'adherence'}).
            </p>
          </div>
        </div>
      )}

      {/* SafeCircle Geofence Map Modal */}
      <SafeCircleMapModal
        isOpen={isMapOpen}
        onClose={() => setIsMapOpen(false)}
        userLocation={userLocation}
        homeLocation={homeLocation}
        safeRadius={safeRadius}
        distanceFromHome={distanceFromHome}
        status={safeZoneStatus}
        isElderlyView={false}
      />
    </div>
  );
}
