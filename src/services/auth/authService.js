/**
 * authService.js
 * Comprehensive authentication operations for YaadSaathi.
 * Handles Sign-up, Sign-in, Sign-out, Password Reset, Profile Management,
 * and canonical Supabase Auth Session tracking.
 */

import { supabase, isSupabaseConfigured } from './supabaseClient.js';
import * as userRepository from '../../database/repositories/userRepository.js';
import * as nerRepository from '../../database/repositories/nerRepository.js';

/**
 * Creates a new user account with Supabase Auth and creates profile entries.
 * 
 * @param {Object} params
 * @param {string} params.email
 * @param {string} params.password
 * @param {string} [params.displayName]
 * @param {string} [params.preferredName]
 * @param {string} [params.preferredLanguage='hi']
 * @param {string} [params.stateOrRegion='ASSAM']
 * @returns {Promise<{ user: Object|null, session: Object|null, error: string|null }>}
 */
export async function signUp({
  email,
  password,
  displayName = '',
  preferredName = '',
  preferredLanguage = 'hi',
  stateOrRegion = 'ASSAM',
}) {
  if (!isSupabaseConfigured() || !supabase) {
    // Offline / Local fallback account creation
    const localId = `usr-${Date.now()}`;
    const localUser = {
      id: localId,
      email,
      user_metadata: {
        display_name: displayName,
        preferred_name: preferredName || displayName,
        preferred_language: preferredLanguage,
        state_or_region: stateOrRegion,
      },
    };

    // Save to local IndexedDB
    await userRepository.createUser({
      id: localId,
      name: displayName,
      preferredName: preferredName || displayName,
      primaryLanguage: preferredLanguage,
      stateOrRegion,
    });

    await nerRepository.createNERProfile({
      userId: localId,
      stateOrRegion,
      preferredLanguage: preferredLanguage === 'en' ? 'en' : 'as',
    });

    return {
      user: localUser,
      session: { user: localUser, access_token: 'local-token' },
      error: null,
      isLocalOnly: true,
    };
  }

  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName,
          preferred_name: preferredName || displayName,
          preferred_language: preferredLanguage,
          state_or_region: stateOrRegion,
        },
      },
    });

    if (error) {
      return { user: null, session: null, error: error.message };
    }

    if (data?.user) {
      // Ensure local IndexedDB cache is in sync
      const userId = data.user.id;
      await userRepository.createUser({
        id: userId,
        name: displayName || email.split('@')[0],
        preferredName: preferredName || displayName || email.split('@')[0],
        primaryLanguage: preferredLanguage,
        stateOrRegion,
      }).catch(() => {});

      await nerRepository.createNERProfile({
        userId,
        stateOrRegion,
        preferredLanguage: preferredLanguage === 'en' ? 'en' : 'as',
      }).catch(() => {});
    }

    return { user: data.user, session: data.session, error: null };
  } catch (err) {
    console.error('[YaadSaathi Auth] SignUp Exception:', err);
    return { user: null, session: null, error: err.message || 'Signup failed' };
  }
}

/**
 * Signs in an existing user with email and password.
 * 
 * @param {Object} params
 * @param {string} params.email
 * @param {string} params.password
 * @returns {Promise<{ user: Object|null, session: Object|null, error: string|null }>}
 */
export async function signIn({ email, password }) {
  if (!isSupabaseConfigured() || !supabase) {
    return {
      user: null,
      session: null,
      error: 'Supabase cloud configuration is missing. Please set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in .env.local',
    };
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { user: null, session: null, error: error.message };
    }

    return { user: data.user, session: data.session, error: null };
  } catch (err) {
    console.error('[YaadSaathi Auth] SignIn Exception:', err);
    return { user: null, session: null, error: err.message || 'Login failed' };
  }
}

/**
 * Signs out the currently authenticated user.
 * 
 * @returns {Promise<{ error: string|null }>}
 */
export async function signOut() {
  if (!isSupabaseConfigured() || !supabase) {
    return { error: null };
  }

  try {
    const { error } = await supabase.auth.signOut();
    return { error: error ? error.message : null };
  } catch (err) {
    console.error('[YaadSaathi Auth] SignOut Exception:', err);
    return { error: err.message || 'Signout error' };
  }
}

/**
 * Sends a password reset email.
 * 
 * @param {string} email
 * @returns {Promise<{ error: string|null }>}
 */
export async function resetPassword(email) {
  if (!isSupabaseConfigured() || !supabase) {
    return { error: 'Cloud authentication is not connected.' };
  }

  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/reset-password` : undefined,
    });
    return { error: error ? error.message : null };
  } catch (err) {
    return { error: err.message || 'Password reset request failed' };
  }
}

/**
 * Retrieves the current session.
 * 
 * @returns {Promise<Object|null>}
 */
export async function getSession() {
  if (!isSupabaseConfigured() || !supabase) return null;
  try {
    const { data } = await supabase.auth.getSession();
    return data?.session || null;
  } catch (err) {
    console.warn('[YaadSaathi Auth] getSession error:', err);
    return null;
  }
}

/**
 * Retrieves the current authenticated user.
 * 
 * @returns {Promise<Object|null>}
 */
export async function getCurrentUser() {
  if (!isSupabaseConfigured() || !supabase) return null;
  try {
    const { data } = await supabase.auth.getUser();
    return data?.user || null;
  } catch (err) {
    return null;
  }
}

/**
 * Fetches user profile from Supabase profiles table.
 * 
 * @param {string} userId
 * @returns {Promise<Object|null>}
 */
export async function getUserProfile(userId) {
  if (!userId) return null;

  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (!error && data) {
        return data;
      }
    } catch (err) {
      console.warn('[YaadSaathi Auth] Cloud getUserProfile failed, reading from local DB:', err);
    }
  }

  // Fallback to local Dexie IndexedDB
  const localUser = await userRepository.getUser(userId).catch(() => null);
  return localUser || null;
}

/**
 * Updates user profile in Supabase and IndexedDB.
 * 
 * @param {string} userId
 * @param {Object} updates
 * @returns {Promise<{ profile: Object|null, error: string|null }>}
 */
export async function updateUserProfile(userId, updates = {}) {
  if (!userId) return { profile: null, error: 'User ID is required' };

  // Always update local IndexedDB cache first
  await userRepository.updateUser(userId, updates).catch(() => {});

  if (isSupabaseConfigured() && supabase) {
    try {
      const payload = {
        user_id: userId,
        display_name: updates.displayName || updates.name || updates.display_name,
        preferred_name: updates.preferredName || updates.preferred_name,
        age: updates.age,
        preferred_language: updates.preferredLanguage || updates.preferred_language,
        state_or_region: updates.stateOrRegion || updates.state_or_region,
        sub_region: updates.subRegion || updates.sub_region,
        emergency_contact: updates.emergencyContact || updates.emergency_contact,
        doctor_contact: updates.doctorContact || updates.doctor_contact,
        font_scale: updates.fontScale || updates.font_scale,
        updated_at: new Date().toISOString(),
      };

      // Filter undefined fields
      const cleanPayload = Object.fromEntries(
        Object.entries(payload).filter(([, v]) => v !== undefined)
      );

      const { data, error } = await supabase
        .from('profiles')
        .upsert(cleanPayload, { onConflict: 'user_id' })
        .select()
        .single();

      if (error) {
        return { profile: null, error: error.message };
      }
      return { profile: data, error: null };
    } catch (err) {
      return { profile: null, error: err.message };
    }
  }

  return { profile: { id: userId, ...updates }, error: null };
}

/**
 * Subscribes to Supabase Auth state changes.
 * 
 * @param {Function} callback
 * @returns {Object} Subscription handle with unsubscribe method
 */
export function onAuthStateChange(callback) {
  if (!isSupabaseConfigured() || !supabase) {
    return { data: { subscription: { unsubscribe: () => {} } } };
  }

  return supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session);
  });
}
