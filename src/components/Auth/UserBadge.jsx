/**
 * UserBadge.jsx
 * Header component displaying user identity, cloud sync status, and account controls.
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  User,
  LogOut,
  Cloud,
  CloudOff,
  RefreshCw,
  Settings,
  ChevronDown,
  LogIn,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { useI18n } from '../../i18n/I18nContext';

export default function UserBadge() {
  const {
    user,
    profile,
    isAuthenticated,
    isGuestMode,
    syncStatus,
    setAuthModalOpen,
    setOnboardingOpen,
    signOut,
  } = useAuth();

  const { navigateTo, sounds } = useApp();
  const { isHindi } = useI18n();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const displayName =
    profile?.display_name ||
    profile?.name ||
    user?.user_metadata?.display_name ||
    user?.email?.split('@')[0] ||
    (isGuestMode ? (isHindi ? 'अतिथि (Guest)' : 'Guest Elder') : '');

  const initials = displayName
    ? displayName
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : '👴';

  if (!isAuthenticated && !isGuestMode) {
    return (
      <button
        id="header-signin-btn"
        onClick={() => {
          sounds.playClickChime();
          setAuthModalOpen(true);
        }}
        className="tactile-btn flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-2xl bg-[#167A55] hover:bg-[#126344] text-white font-black text-xs sm:text-sm shadow-xs min-h-[46px] cursor-pointer"
        aria-label={isHindi ? 'खाता लॉगिन करें' : 'Sign in to account'}
      >
        <LogIn className="w-4 h-4" />
        <span>{isHindi ? 'लॉगिन / खाता' : 'Sign In'}</span>
      </button>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        id="header-user-badge-btn"
        onClick={() => {
          sounds.playClickChime();
          setDropdownOpen((prev) => !prev);
        }}
        className="tactile-btn flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-2xl bg-[#FBFAF4] hover:bg-[#EAF7EF] border-2 border-[#DFF3E7] text-[#102A43] font-bold text-xs sm:text-sm min-h-[46px] cursor-pointer"
        aria-expanded={dropdownOpen}
        aria-haspopup="true"
      >
        <div className="w-8 h-8 rounded-full bg-[#167A55] text-white flex items-center justify-center font-black text-xs shrink-0 shadow-xs">
          {initials}
        </div>
        <div className="hidden md:flex flex-col text-left leading-tight">
          <span className="font-black text-xs truncate max-w-[110px]">{displayName}</span>
          <span className="text-[10px] text-[#5D7184] flex items-center gap-1">
            {syncStatus === 'synced' && <Cloud className="w-3 h-3 text-[#167A55]" />}
            {syncStatus === 'syncing' && <RefreshCw className="w-3 h-3 text-amber-500 animate-spin" />}
            {syncStatus === 'offline' && <CloudOff className="w-3 h-3 text-slate-400" />}
            <span>
              {syncStatus === 'synced'
                ? isHindi ? 'सिंक हुआ' : 'Cloud Sync'
                : syncStatus === 'syncing'
                ? isHindi ? 'सिंक हो रहा...' : 'Syncing...'
                : syncStatus === 'offline'
                ? isHindi ? 'ऑफ़लाइन' : 'Offline'
                : isHindi ? 'लोकल' : 'Local'}
            </span>
          </span>
        </div>
        <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
      </button>

      {/* Dropdown Menu */}
      {dropdownOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white border-2 border-[#DFF3E7] rounded-3xl shadow-xl p-3 z-50 animate-fade-in text-left">
          <div className="p-3 bg-[#EAF7EF] rounded-2xl mb-2">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl">🌸</span>
              <span className="font-black text-sm text-[#167A55] truncate">{displayName}</span>
            </div>
            {user?.email && (
              <p className="text-xs text-[#5D7184] truncate">{user.email}</p>
            )}
            <div className="flex items-center gap-1 mt-1 text-[11px] font-bold text-[#167A55]">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>
                {isAuthenticated
                  ? isHindi ? 'क्लाउड खाता सक्रिय' : 'Authenticated Cloud Account'
                  : isHindi ? 'अतिथि मोड (लोकल)' : 'Guest Mode (Local DB)'}
              </span>
            </div>
          </div>

          <div className="space-y-1">
            <button
              onClick={() => {
                setDropdownOpen(false);
                setOnboardingOpen(true);
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-[#EAF7EF] text-[#102A43] font-bold text-sm text-left cursor-pointer transition-colors"
            >
              <Sparkles className="w-4 h-4 text-[#167A55]" />
              <span>{isHindi ? 'प्रोफ़ाइल कस्टमाइज़ करें' : 'Customize Profile'}</span>
            </button>

            <button
              onClick={() => {
                setDropdownOpen(false);
                navigateTo('settings');
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-[#EAF7EF] text-[#102A43] font-bold text-sm text-left cursor-pointer transition-colors"
            >
              <Settings className="w-4 h-4 text-[#167A55]" />
              <span>{isHindi ? 'सेटिंग्स व डेटा' : 'Settings & Data'}</span>
            </button>

            {!isAuthenticated ? (
              <button
                onClick={() => {
                  setDropdownOpen(false);
                  setAuthModalOpen(true);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-[#167A55] text-white font-black text-sm text-left cursor-pointer mt-2"
              >
                <LogIn className="w-4 h-4" />
                <span>{isHindi ? 'क्लाउड में लॉगिन करें' : 'Sign in / Connect'}</span>
              </button>
            ) : (
              <button
                onClick={async () => {
                  setDropdownOpen(false);
                  await signOut();
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-rose-50 text-rose-700 font-bold text-sm text-left cursor-pointer transition-colors border-t border-slate-100 mt-1"
              >
                <LogOut className="w-4 h-4" />
                <span>{isHindi ? 'लॉगआउट करें' : 'Sign Out'}</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
