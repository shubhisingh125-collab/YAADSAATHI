/**
 * AuthModal.jsx
 * Senior-friendly Authentication Dialog for YaadSaathi.
 * Supports Sign In, Account Creation, Password Reset, and Guest Mode.
 */

import React, { useState } from 'react';
import {
  X,
  Mail,
  Lock,
  User,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../i18n/I18nContext';
import { NER_STATES_LIST, REGIONAL_LANGUAGES_LIST } from '../../pages/NERProfile';

export default function AuthModal() {
  const {
    authModalOpen,
    setAuthModalOpen,
    signIn,
    signUp,
    resetPassword,
    enableGuestMode,
    isCloudConfigured,
  } = useAuth();

  const { isHindi } = useI18n();

  const [mode, setMode] = useState('signin'); // 'signin' | 'signup' | 'forgot'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [stateOrRegion, setStateOrRegion] = useState('ASSAM');
  const [preferredLanguage, setPreferredLanguage] = useState('hi');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!authModalOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setSubmitting(true);

    try {
      if (mode === 'signin') {
        if (!email.trim() || !password) {
          setErrorMsg(isHindi ? 'कृपया ईमेल और पासवर्ड दर्ज करें।' : 'Please enter email and password.');
          return;
        }
        const res = await signIn({ email: email.trim(), password });
        if (!res.success) {
          setErrorMsg(res.error || (isHindi ? 'लॉगिन विफल रहा।' : 'Sign in failed.'));
        }
      } else if (mode === 'signup') {
        if (!email.trim() || password.length < 6) {
          setErrorMsg(
            isHindi
              ? 'पासवर्ड कम से कम 6 अक्षरों का होना चाहिए।'
              : 'Password must be at least 6 characters.'
          );
          return;
        }
        const res = await signUp({
          email: email.trim(),
          password,
          displayName: displayName.trim(),
          preferredLanguage,
          stateOrRegion,
        });
        if (!res.success) {
          setErrorMsg(res.error || (isHindi ? 'खाता निर्माण विफल रहा।' : 'Sign up failed.'));
        }
      } else if (mode === 'forgot') {
        if (!email.trim()) {
          setErrorMsg(isHindi ? 'कृपया अपना ईमेल पता दर्ज करें।' : 'Please enter your email address.');
          return;
        }
        const res = await resetPassword(email.trim());
        if (res.error) {
          setErrorMsg(res.error);
        } else {
          setSuccessMsg(
            isHindi
              ? 'पासवर्ड रीसेट लिंक आपके ईमेल पर भेज दिया गया है।'
              : 'Password reset link sent to your email.'
          );
        }
      }
    } catch (err) {
      setErrorMsg(err.message || 'An error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-xs animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      <div className="bg-[#FBFAF4] border-3 border-[#167A55]/30 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-[#167A55] to-[#1E56A0] text-white p-5 sm:p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center text-2xl">
              🌸
            </div>
            <div>
              <h2 id="auth-modal-title" className="text-xl sm:text-2xl font-black">
                {mode === 'signin' && (isHindi ? 'यादसाथी में लॉगिन करें' : 'Sign in to YaadSaathi')}
                {mode === 'signup' && (isHindi ? 'नया खाता बनाएं' : 'Create an Account')}
                {mode === 'forgot' && (isHindi ? 'पासवर्ड रीसेट करें' : 'Reset Password')}
              </h2>
              <p className="text-emerald-100 text-xs sm:text-sm font-medium">
                {isHindi ? 'आपकी यादें और खेल सुरक्षित हैं' : 'Your memories and games stay safe'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setAuthModalOpen(false)}
            className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4">
          {/* Cloud Status Advisory */}
          {!isCloudConfigured && (
            <div className="p-3 bg-amber-50 border border-amber-300 rounded-2xl text-amber-900 text-xs sm:text-sm flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong>{isHindi ? 'ऑफ़लाइन / लोकल मोड' : 'Offline / Local Prototype Mode'}</strong>
                <p>
                  {isHindi
                    ? 'क्लाउड सिंक के लिए .env.local में VITE_SUPABASE_URL और Key जोड़ें। आप लोकल रूप से भी जारी रख सकते हैं।'
                    : 'Supabase cloud keys are not configured. You can still test in offline/guest mode.'}
                </p>
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 bg-rose-50 border-2 border-rose-300 rounded-2xl text-rose-800 text-sm font-bold flex items-center gap-2 animate-shake">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border-2 border-emerald-300 rounded-2xl text-emerald-800 text-sm font-bold flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="block text-sm font-black text-[#102A43] mb-1">
                  {isHindi ? 'आपका नाम (Senior Name)' : 'Your Name'}
                </label>
                <div className="relative">
                  <User className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder={isHindi ? 'उदा. रामेश्वर शर्मा' : 'e.g. Rameshwar Sharma'}
                    className="w-full pl-11 pr-4 py-3 bg-white border-2 border-[#DFF3E7] focus:border-[#167A55] rounded-2xl text-[#102A43] font-bold text-base outline-none transition-colors"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-black text-[#102A43] mb-1">
                {isHindi ? 'ईमेल पता (Email)' : 'Email Address'}
              </label>
              <div className="relative">
                <Mail className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-11 pr-4 py-3 bg-white border-2 border-[#DFF3E7] focus:border-[#167A55] rounded-2xl text-[#102A43] font-bold text-base outline-none transition-colors"
                />
              </div>
            </div>

            {mode !== 'forgot' && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-black text-[#102A43]">
                    {isHindi ? 'पासवर्ड (Password)' : 'Password'}
                  </label>
                  {mode === 'signin' && (
                    <button
                      type="button"
                      onClick={() => {
                        setMode('forgot');
                        setErrorMsg('');
                        setSuccessMsg('');
                      }}
                      className="text-xs font-bold text-[#167A55] hover:underline"
                    >
                      {isHindi ? 'पासवर्ड भूल गए?' : 'Forgot password?'}
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-11 pr-4 py-3 bg-white border-2 border-[#DFF3E7] focus:border-[#167A55] rounded-2xl text-[#102A43] font-bold text-base outline-none transition-colors"
                  />
                </div>
              </div>
            )}

            {mode === 'signup' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black text-[#102A43] mb-1">
                    {isHindi ? 'राज्य / क्षेत्र (Region)' : 'State / Region'}
                  </label>
                  <select
                    value={stateOrRegion}
                    onChange={(e) => setStateOrRegion(e.target.value)}
                    className="w-full px-3 py-2.5 bg-white border-2 border-[#DFF3E7] rounded-xl text-sm font-bold text-[#102A43] outline-none"
                  >
                    {NER_STATES_LIST.map((st) => (
                      <option key={st.id} value={st.id}>
                        {isHindi ? st.nameHindi : st.nameEnglish}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-black text-[#102A43] mb-1">
                    {isHindi ? 'पसंदीदा भाषा (Language)' : 'Language'}
                  </label>
                  <select
                    value={preferredLanguage}
                    onChange={(e) => setPreferredLanguage(e.target.value)}
                    className="w-full px-3 py-2.5 bg-white border-2 border-[#DFF3E7] rounded-xl text-sm font-bold text-[#102A43] outline-none"
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

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4 px-6 rounded-2xl bg-[#167A55] hover:bg-[#126344] text-white font-black text-lg shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 mt-4"
            >
              {submitting ? (
                <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>
                    {mode === 'signin' && (isHindi ? 'लॉगिन करें →' : 'Sign In →')}
                    {mode === 'signup' && (isHindi ? 'खाता बनाएं →' : 'Create Account →')}
                    {mode === 'forgot' && (isHindi ? 'रीसेट लिंक भेजें →' : 'Send Reset Link →')}
                  </span>
                </>
              )}
            </button>
          </form>

          {/* Mode Switchers */}
          <div className="pt-2 text-center border-t border-[#DFF3E7] space-y-2">
            {mode === 'signin' && (
              <p className="text-sm font-bold text-[#5D7184]">
                {isHindi ? 'क्या आपका खाता नहीं है?' : "Don't have an account?"}{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('signup');
                    setErrorMsg('');
                    setSuccessMsg('');
                  }}
                  className="text-[#167A55] font-black underline ml-1 cursor-pointer"
                >
                  {isHindi ? 'नया खाता बनाएं' : 'Sign up now'}
                </button>
              </p>
            )}

            {mode === 'signup' && (
              <p className="text-sm font-bold text-[#5D7184]">
                {isHindi ? 'पहले से खाता है?' : 'Already have an account?'}{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('signin');
                    setErrorMsg('');
                    setSuccessMsg('');
                  }}
                  className="text-[#167A55] font-black underline ml-1 cursor-pointer"
                >
                  {isHindi ? 'लॉगिन करें' : 'Sign in'}
                </button>
              </p>
            )}

            {mode === 'forgot' && (
              <button
                type="button"
                onClick={() => {
                  setMode('signin');
                  setErrorMsg('');
                  setSuccessMsg('');
                }}
                className="text-sm font-black text-[#167A55] underline cursor-pointer"
              >
                {isHindi ? '← वापस लॉगिन पर जाएं' : '← Back to Sign in'}
              </button>
            )}

            {/* Guest mode shortcut */}
            <div className="pt-3">
              <button
                type="button"
                onClick={enableGuestMode}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#5D7184] hover:text-[#102A43] text-xs sm:text-sm font-bold transition-colors cursor-pointer"
              >
                {isHindi ? 'बिना खाते के स्थानीय रूप से खेलें (Guest Mode)' : 'Continue as Guest (Local Offline)'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
