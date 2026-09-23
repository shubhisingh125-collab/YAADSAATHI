import React, { Suspense, lazy } from 'react';
import { useApp } from './context/AppContext';
import { useI18n } from './i18n/I18nContext';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Footer from './components/Footer';
import QuickSosModal from './components/QuickSosModal';
import SplashScreen from './pages/SplashScreen';
import LanguageSelection from './pages/LanguageSelection';

// Home and Games Hub load eagerly (first screens most users see).
import Home from './pages/Home';
import GamesHub from './pages/GamesHub';
// Code-split and lazy-loaded screens for high performance and fast initial load.
const MemoryMatch = lazy(() => import('./pages/MemoryMatch'));
const PatternRecognition = lazy(() => import('./pages/PatternRecognition'));
const WordRecall = lazy(() => import('./pages/WordRecall'));
const PictureRecall = lazy(() => import('./pages/PictureRecall'));
const DailyRoutineRecall = lazy(() => import('./pages/DailyRoutineRecall'));
const SequenceRecall = lazy(() => import('./pages/SequenceRecall'));
const PatternComplete = lazy(() => import('./pages/PatternComplete'));
const FindDifference = lazy(() => import('./pages/FindDifference'));
const DailyPlan = lazy(() => import('./pages/DailyPlan'));
const Reminders = lazy(() => import('./pages/Reminders'));
const MyProgress = lazy(() => import('./pages/MyProgress'));
const FamilyCaregiver = lazy(() => import('./pages/FamilyCaregiver'));
const Settings = lazy(() => import('./pages/Settings'));
const NERProfile = lazy(() => import('./pages/NERProfile'));
const PersonalMemories = lazy(() => import('./pages/PersonalMemories'));
const PersonalMemory = lazy(() => import('./pages/PersonalMemory'));
const SaathiChat = lazy(() => import('./pages/SaathiChat'));

import SaathiButton from './components/Saathi/SaathiButton';
import SaathiPanel from './components/Saathi/SaathiPanel';
import MedicineReminderModal from './components/MedicineReminderModal';
import AuthModal from './components/Auth/AuthModal';
import UserProfileOnboarding from './components/Auth/UserProfileOnboarding';

function ScreenLoadingFallback() {
  const { t } = useI18n();
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-3 text-[#5D7184]">
      <div className="w-10 h-10 border-4 border-[#DFF3E7] border-t-[#167A55] rounded-full animate-spin" aria-hidden="true" />
      <p className="font-bold text-lg">{t('loadingGame')}</p>
    </div>
  );
}

export default function App() {
  const {
    currentScreen,
    showSplash,
    showLanguageModal,
  } = useApp();

  // Render active screen
  const renderScreen = () => {
    switch (currentScreen) {
      case 'home':
        return <Home />;
      case 'daily-plan':
        return <DailyPlan />;
      case 'games':
        return <GamesHub />;
      case 'memory-match':
        return <MemoryMatch />;
      case 'pattern-recognition':
        return <PatternRecognition />;
      case 'word-recall':
        return <WordRecall />;
      case 'picture-recall':
        return <PictureRecall />;
      case 'daily-routine-recall':
        return <DailyRoutineRecall />;
      case 'sequence-recall':
        return <SequenceRecall />;
      case 'pattern-complete':
        return <PatternComplete />;
      case 'find-difference':
        return <FindDifference />;
      case 'reminders':
        return <Reminders />;
      case 'progress':
        return <MyProgress />;
      case 'family':
        return <FamilyCaregiver />;
      case 'settings':
        return <Settings />;
      case 'ner-profile':
        return <NERProfile />;
      case 'personal-memories':
        return <PersonalMemories />;
      case 'personal-memory':
        return <PersonalMemory />;
      case 'saathi':
        return <SaathiChat />;
      default:
        return <Home />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FBFAF4] text-[#102A43] transition-all duration-150">
      {/* Optional Intro Splash Screen */}
      {showSplash && <SplashScreen />}

      {/* Language Selection Modal */}
      {showLanguageModal && <LanguageSelection />}

      {/* Top Accessible Sticky Header */}
      <Header />

      {/* Main Layout: Desktop Sidebar + Content */}
      <div className="flex-1 flex max-w-[1600px] w-full mx-auto">
        {/* Left Sidebar (Desktop) & Bottom Navigation Dock (Mobile) */}
        <Sidebar />

        {/* Dynamic Page Container */}
        <main className="flex-1 w-full p-3 sm:p-6 lg:p-8 pb-28 xl:pb-12 max-w-6xl mx-auto">
          <Suspense fallback={<ScreenLoadingFallback />}>{renderScreen()}</Suspense>
        </main>
      </div>

      {/* Universal Footer */}
      <Footer />

      {/* Emergency SOS Modal */}
      <QuickSosModal />

      {/* Saathi Voice-First AI Companion (Floating Button & Conversation Panel) */}
      <SaathiButton />
      <SaathiPanel />

      {/* Active Medicine Scheduled Reminder Modal */}
      <MedicineReminderModal />

      {/* Cloud Authentication Modal */}
      <AuthModal />

      {/* First-Time User Profile Setup & Onboarding */}
      <UserProfileOnboarding />
    </div>
  );
}

