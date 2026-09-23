/**
 * AuthContext.jsx
 * Top-level Authentication & User Identity Context Provider for YaadSaathi.
 * 
 * Responsibilities:
 * - Provides authenticated Supabase user and session
 * - Tracks user profile and NER cultural preferences
 * - Handles Sign-in, Sign-up, Sign-out, and Password Reset
 * - Controls Auth Modal and First-Time Onboarding Modal
 * - Coordinates cloud synchronization and guest mode fallback
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as authService from '../services/auth/authService.js';
import * as syncService from '../services/sync/syncService.js';
import { isSupabaseConfigured } from '../services/auth/supabaseClient.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [syncStatus, setSyncStatus] = useState('idle'); // 'idle' | 'syncing' | 'synced' | 'offline' | 'error'
  const [guestMode, setGuestMode] = useState(() => {
    return localStorage.getItem('yaadsaathi_guest_mode') === 'true';
  });

  // Load user profile and trigger cloud sync
  const refreshUserProfile = useCallback(async (userId) => {
    if (!userId) {
      setProfile(null);
      return;
    }
    try {
      setSyncStatus('syncing');
      const userProfile = await authService.getUserProfile(userId);
      setProfile(userProfile);

      // Check if new user needs profile onboarding
      if (userProfile && (!userProfile.display_name && !userProfile.name)) {
        setOnboardingOpen(true);
      }

      // Background cloud sync
      await syncService.syncAll(userId);
      setSyncStatus(syncService.isOnline() ? 'synced' : 'offline');
    } catch (err) {
      console.warn('[AuthContext] refreshUserProfile error:', err);
      setSyncStatus('error');
    }
  }, []);

  // Initialize auth session
  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      try {
        const initialSession = await authService.getSession();
        if (mounted && initialSession?.user) {
          setUser(initialSession.user);
          setSession(initialSession);
          await refreshUserProfile(initialSession.user.id);
        } else if (mounted) {
          setUser(null);
          setSession(null);
          setProfile(null);
        }
      } catch (err) {
        console.warn('[AuthContext] Init auth error:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    initAuth();

    // Listen for auth changes (sign-in, sign-out, token refresh)
    const { data: authListener } = authService.onAuthStateChange(async (event, newSession) => {
      if (!mounted) return;

      if (newSession?.user) {
        setUser(newSession.user);
        setSession(newSession);
        setGuestMode(false);
        localStorage.removeItem('yaadsaathi_guest_mode');
        await refreshUserProfile(newSession.user.id);
      } else {
        setUser(null);
        setSession(null);
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      mounted = false;
      if (authListener?.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, [refreshUserProfile]);

  // Auth Operations
  const handleSignUp = async (credentials) => {
    setLoading(true);
    try {
      const res = await authService.signUp(credentials);
      if (res.error) return { success: false, error: res.error };

      if (res.user) {
        setUser(res.user);
        setSession(res.session);
        setGuestMode(false);
        localStorage.removeItem('yaadsaathi_guest_mode');
        await refreshUserProfile(res.user.id);
        setAuthModalOpen(false);
        // Prompt onboarding for fresh signup
        setOnboardingOpen(true);
      }
      return { success: true, user: res.user };
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (credentials) => {
    setLoading(true);
    try {
      const res = await authService.signIn(credentials);
      if (res.error) return { success: false, error: res.error };

      if (res.user) {
        setUser(res.user);
        setSession(res.session);
        setGuestMode(false);
        localStorage.removeItem('yaadsaathi_guest_mode');
        await refreshUserProfile(res.user.id);
        setAuthModalOpen(false);
      }
      return { success: true, user: res.user };
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    setLoading(true);
    try {
      await authService.signOut();
      setUser(null);
      setSession(null);
      setProfile(null);
      setSyncStatus('idle');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (email) => {
    return await authService.resetPassword(email);
  };

  const handleUpdateProfile = async (updates) => {
    if (!user?.id) return { error: 'No authenticated user' };
    const res = await authService.updateUserProfile(user.id, updates);
    if (!res.error && res.profile) {
      setProfile((prev) => ({ ...prev, ...res.profile }));
    }
    return res;
  };

  const enableGuestMode = () => {
    setGuestMode(true);
    localStorage.setItem('yaadsaathi_guest_mode', 'true');
    setAuthModalOpen(false);
  };

  const importGuestData = async (guestUserId) => {
    if (!user?.id || !guestUserId) return { importedCount: 0 };
    setSyncStatus('syncing');
    const result = await syncService.importLocalDataToUser(guestUserId, user.id);
    await refreshUserProfile(user.id);
    return result;
  };

  const value = {
    user,
    session,
    profile,
    loading,
    isAuthenticated: Boolean(user?.id),
    isGuestMode: guestMode,
    isCloudConfigured: isSupabaseConfigured(),
    syncStatus,
    authModalOpen,
    setAuthModalOpen,
    onboardingOpen,
    setOnboardingOpen,
    signUp: handleSignUp,
    signIn: handleSignIn,
    signOut: handleSignOut,
    resetPassword: handleResetPassword,
    updateProfile: handleUpdateProfile,
    refreshProfile: () => refreshUserProfile(user?.id),
    enableGuestMode,
    importGuestData,
    canonicalUserId: user?.id || (guestMode ? 'local-guest-elder' : 'local-guest-elder'),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
