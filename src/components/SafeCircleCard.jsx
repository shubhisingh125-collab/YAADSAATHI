import React, { useState } from 'react';
import {
  MapPin,
  Eye,
  EyeOff,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useI18n } from '../i18n/I18nContext';
import VoiceButton from './VoiceButton';
import SafeCircleMapModal from './SafeCircleMapModal';

export default function SafeCircleCard() {
  const {
    locationSharing,
    toggleLocationSharing,
    userLocation,
    homeLocation,
    safeRadius,
    distanceFromHome,
    safeZoneStatus,
    isSimulatingOutside,
    toggleSimulateOutside,
    fetchLiveLocation,
    sounds,
  } = useApp();

  const { t, isHindi } = useI18n();

  const [isMapOpen, setIsMapOpen] = useState(false);
  const [showPermissionModal, setShowPermissionModal] = useState(false);

  const isSafe = safeZoneStatus === 'SAFE';
  const isApproaching = safeZoneStatus === 'APPROACHING';

  const handleToggleSharing = () => {
    sounds.playClickChime();
    if (!locationSharing) {
      // Prompt permission before enabling
      setShowPermissionModal(true);
    } else {
      toggleLocationSharing(false);
    }
  };

  const handleGrantPermission = async () => {
    sounds.playSuccessChime();
    setShowPermissionModal(false);
    toggleLocationSharing(true);
    await fetchLiveLocation();
  };

  // Text for Speech
  const elderNameHi = patient?.preferredName || patient?.nameHindi || patient?.name || 'वरिष्ठ सदस्य';
  const elderNameEn = patient?.preferredName || patient?.nameEnglish || patient?.name || 'Dear Senior';

  const statusSpeechTextHindi = locationSharing
    ? isSafe
      ? `${elderNameHi}, आप अपने सुरक्षित क्षेत्र में हैं। घर से दूरी ${distanceFromHome} मीटर है। आपकी लोकेशन परिवार के साथ सुरक्षित रूप से साझा है।`
      : `ध्यान दें! आप सुरक्षित क्षेत्र से बाहर हैं। घर से दूरी ${distanceFromHome} मीटर है। देखभालकर्ता को सूचित किया गया है।`
    : 'स्थान साझा करना अभी बंद है।';

  const statusSpeechTextEnglish = locationSharing
    ? isSafe
      ? `${elderNameEn}, you are inside your safe zone. Distance from home is ${distanceFromHome} meters. Location is safely shared with family.`
      : `Alert! You are outside your safe zone. Distance from home is ${distanceFromHome} meters.`
    : 'Location sharing is currently turned off.';

  return (
    <>
      <section
        id="safecircle-section"
        className={`rounded-[2.5rem] p-6 sm:p-8 border-3 shadow-sm text-left transition-all ${
          !locationSharing
            ? 'bg-[#FBFAF4] border-[#E2E8F0]'
            : isSafe
            ? 'bg-gradient-to-r from-[#EAF7EF] to-[#FBFAF4] border-[#167A55]/30'
            : isApproaching
            ? 'bg-gradient-to-r from-[#FFF0D7] to-[#FBFAF4] border-[#E98A20]/40'
            : 'bg-gradient-to-r from-[#FFE8EF] to-[#FBFAF4] border-[#E84D78]/50'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Left Title & Status */}
          <div className="flex items-center gap-4">
            <div
              className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl border-2 flex items-center justify-center text-3xl sm:text-4xl shrink-0 ${
                !locationSharing
                  ? 'bg-white border-[#CBD5E1] text-[#5D7184]'
                  : isSafe
                  ? 'bg-white border-[#167A55]/30 text-[#167A55]'
                  : 'bg-white border-[#E84D78]/40 text-[#E84D78]'
              }`}
            >
              🛡️
            </div>

            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-[#167A55]/30 text-[#167A55] font-black text-xs uppercase tracking-wider mb-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{t('safeCircle')}</span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-black text-[#102A43]">
                {!locationSharing
                  ? (isHindi ? 'स्थान साझा करना बंद है' : 'Location Sharing Paused')
                  : isSafe
                  ? t('insideSafeZone')
                  : isApproaching
                  ? t('approachingBoundary')
                  : t('outsideSafeZone')}
              </h2>

              <p className="text-sm sm:text-base font-bold text-[#5D7184] mt-0.5">
                {locationSharing
                  ? t('distanceFromHome', { dist: distanceFromHome })
                  : (isHindi ? 'आपकी लोकेशन अभी किसी को नहीं भेजी जा रही है।' : 'Your location is private and not being broadcast.')}
              </p>
            </div>
          </div>

          {/* Right Status Pill & Voice Status Button */}
          <div className="flex items-center gap-3 flex-wrap">
            <VoiceButton
              id="safecircle-listen-btn"
              textHindi={statusSpeechTextHindi}
              textEnglish={statusSpeechTextEnglish}
              size="md"
              label={t('listenStatus')}
            />

            {/* Sharing ON / OFF status pill */}
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white border-2 border-[#DFF3E7] shadow-xs">
              <span
                className={`w-3.5 h-3.5 rounded-full ${
                  locationSharing ? 'bg-[#167A55] animate-ping' : 'bg-slate-400'
                }`}
              />
              <span className="text-xs sm:text-sm font-black text-[#102A43]">
                {t('locationSharing')}:{' '}
                <span className={locationSharing ? 'text-[#167A55]' : 'text-[#5D7184]'}>
                  {locationSharing ? '🟢 ON' : '⚪ OFF'}
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* Informational Panel: Shared with + Demo status */}
        <div className="mt-5 p-4 rounded-2xl bg-white border-2 border-[#DFF3E7] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm font-bold text-[#102A43]">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">📍</span>
            <div>
              <span>{t('sharedWith')}</span>
              <span className="block text-xs font-semibold text-[#5D7184]">
                {userLocation?.address}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            {userLocation?.isDemo && (
              <span className="px-3 py-1 rounded-xl bg-[#FFF0D7] text-[#E98A20] border border-[#E98A20]/30 text-xs font-black">
                {t('demoLocationLabel')}
              </span>
            )}
          </div>
        </div>

        {/* Action Controls: View Map, Stop/Start Sharing, and Hackathon Simulation Toggle */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex flex-wrap items-center gap-2.5">
            {/* View Location Map Button */}
            <button
              id="safecircle-view-map-btn"
              onClick={() => setIsMapOpen(true)}
              className="tactile-btn px-5 py-3 rounded-2xl bg-[#167A55] hover:bg-[#115C40] text-white font-black text-base flex items-center gap-2 cursor-pointer shadow-xs"
            >
              <MapPin className="w-5 h-5 stroke-[2.5]" />
              <span>🗺️ {t('myLocation')}</span>
            </button>

            {/* Toggle Location Sharing ON/OFF Button */}
            <button
              id="safecircle-toggle-sharing-btn"
              onClick={handleToggleSharing}
              className="tactile-btn px-4 py-3 rounded-2xl bg-white hover:bg-[#FBFAF4] border-2 border-[#CBD5E1] text-[#102A43] font-black text-base flex items-center gap-2 cursor-pointer"
            >
              {locationSharing ? (
                <>
                  <EyeOff className="w-5 h-5 text-[#E84D78]" />
                  <span>{t('stopSharing')}</span>
                </>
              ) : (
                <>
                  <Eye className="w-5 h-5 text-[#167A55]" />
                  <span>{t('startSharing')}</span>
                </>
              )}
            </button>
          </div>

          {/* Interactive Simulation Toggle for Hackathon Judges to Test Alert */}
          <button
            id="safecircle-simulate-toggle-btn"
            onClick={toggleSimulateOutside}
            className={`tactile-btn px-4 py-2.5 rounded-xl border-2 font-black text-xs sm:text-sm flex items-center gap-2 cursor-pointer transition-colors ${
              isSimulatingOutside
                ? 'bg-[#EAF7EF] border-[#167A55] text-[#167A55]'
                : 'bg-[#FFF0D7] border-[#E98A20] text-[#A85A00]'
            }`}
            title="प्रोटोटाइप परीक्षण: सुरक्षित दायरे के बाहर जाने का सिमुलेशन करें"
          >
            <RefreshCw className="w-4 h-4" />
            <span>
              {isSimulatingOutside ? `🏠 ${t('simulateInside')}` : `⚠️ ${t('simulateOutside')}`}
            </span>
          </button>
        </div>
      </section>

      {/* SVG Geofence Modal */}
      <SafeCircleMapModal
        isOpen={isMapOpen}
        onClose={() => setIsMapOpen(false)}
        userLocation={userLocation}
        homeLocation={homeLocation}
        safeRadius={safeRadius}
        distanceFromHome={distanceFromHome}
        status={safeZoneStatus}
        isElderlyView={true}
      />

      {/* Permission Consent Modal (PART 12 requirement: Do not silently request location) */}
      {showPermissionModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#102A43]/70 backdrop-blur-sm animate-slow-fade text-left"
        >
          <div className="w-full max-w-md bg-white rounded-[2.5rem] p-6 sm:p-8 border-4 border-[#DFF3E7] shadow-2xl space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-[#EAF7EF] border-2 border-[#167A55]/30 flex items-center justify-center text-3xl">
              🛡️
            </div>
            <h3 className="text-2xl font-black text-[#102A43]">
              {t('locationSharing')} {isHindi ? 'अनुमति' : 'Permission'}
            </h3>
            <p className="text-base font-bold text-[#5D7184] leading-relaxed">
              "{t('permissionPrompt')}"
            </p>
            <div className="p-3.5 rounded-2xl bg-[#FBFAF4] border border-[#E2E8F0] text-xs font-semibold text-[#5D7184]">
              {isHindi
                ? 'यह केवल अधिकृत परिवार (रवि शर्मा) के साथ सुरक्षित घेरे की निगरानी हेतु है।'
                : 'This is shared only with your authorized caregiver (Ravi Sharma) for safety.'}
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                id="safecircle-allow-location-btn"
                onClick={handleGrantPermission}
                className="tactile-btn py-3 rounded-2xl bg-[#167A55] text-white font-black text-base cursor-pointer hover:bg-[#115C40]"
              >
                {t('allowLocation')}
              </button>
              <button
                id="safecircle-deny-location-btn"
                onClick={() => setShowPermissionModal(false)}
                className="tactile-btn py-3 rounded-2xl bg-white border-2 border-[#CBD5E1] text-[#102A43] font-black text-base cursor-pointer"
              >
                {t('notNow')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
