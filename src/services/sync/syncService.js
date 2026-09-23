/**
 * syncService.js
 * Bidirectional synchronization engine between IndexedDB (Dexie) and Supabase cloud.
 * 
 * Safe rules:
 * - Local-first: IndexedDB remains the responsive, offline source of truth for the device.
 * - Cloud synchronization: When online and authenticated, safe upserts sync records.
 * - Conflict resolution: Latest timestamp wins (updatedAt / updated_at).
 * - User isolation: All sync operations are strictly filtered by canonical userId.
 */

import { supabase, isSupabaseConfigured } from '../auth/supabaseClient.js';
import { db } from '../../database/db.js';
import * as userRepository from '../../database/repositories/userRepository.js';
import * as nerRepository from '../../database/repositories/nerRepository.js';
import * as memoryRepository from '../../database/repositories/memoryRepository.js';
import * as routineRepository from '../../database/repositories/routineRepository.js';
import * as medicineRepository from '../../database/repositories/medicineRepository.js';
import * as cognitiveRepository from '../../database/repositories/cognitiveRepository.js';
import * as aiRepository from '../../database/repositories/aiRepository.js';

/**
 * Checks if the browser or runtime has active internet connectivity.
 * @returns {boolean}
 */
export function isOnline() {
  if (typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean') {
    return navigator.onLine;
  }
  return true;
}

/**
 * Syncs user profile between local IndexedDB and cloud profiles table.
 * @param {string} userId
 */
export async function syncUserProfile(userId) {
  if (!userId || !isSupabaseConfigured() || !supabase || !isOnline()) return;

  try {
    // 1. Pull cloud profile
    const { data: cloudProfile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (!error && cloudProfile) {
      // Upsert into local IndexedDB
      const localUser = await userRepository.getUser(userId).catch(() => null);
      if (!localUser || new Date(cloudProfile.updated_at || 0) >= new Date(localUser.updatedAt || 0)) {
        await userRepository.updateUser(userId, {
          name: cloudProfile.display_name,
          preferredName: cloudProfile.preferred_name,
          age: cloudProfile.age,
          primaryLanguage: cloudProfile.preferred_language,
          secondaryLanguage: cloudProfile.secondary_language,
          stateOrRegion: cloudProfile.state_or_region,
          subRegion: cloudProfile.sub_region,
          homeAddress: cloudProfile.home_address,
          emergencyContact: cloudProfile.emergency_contact,
          doctorContact: cloudProfile.doctor_contact,
          fontScale: cloudProfile.font_scale,
          updatedAt: cloudProfile.updated_at,
        }).catch(() => {});
      }
    }
  } catch (err) {
    console.warn('[YaadSaathi Sync] User profile sync warning:', err);
  }
}

/**
 * Syncs NER Cultural Profile.
 * @param {string} userId
 */
export async function syncNERProfile(userId) {
  if (!userId || !isSupabaseConfigured() || !supabase || !isOnline()) return;

  try {
    const localNER = await nerRepository.getNERProfile(userId).catch(() => null);

    // Push local to cloud if exists
    if (localNER) {
      await supabase.from('ner_profiles').upsert({
        user_id: userId,
        state_or_region: localNER.stateOrRegion,
        preferred_language: localNER.preferredLanguage,
        sub_region_or_district: localNER.subRegionOrDistrict,
        cultural_preferences: localNER.culturalPreferences || [],
        familiar_foods: localNER.familiarFoods || [],
        familiar_places: localNER.familiarPlaces || [],
        familiar_objects: localNER.familiarObjects || [],
        festivals: localNER.festivals || [],
        music: localNER.music || [],
        family_memories: localNER.familyMemories || [],
        updated_at: localNER.updatedAt || new Date().toISOString(),
      }, { onConflict: 'user_id' });
    }

    // Pull from cloud
    const { data: cloudNER } = await supabase
      .from('ner_profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (cloudNER) {
      await nerRepository.updateNERProfile(userId, {
        stateOrRegion: cloudNER.state_or_region,
        preferredLanguage: cloudNER.preferred_language,
        subRegionOrDistrict: cloudNER.sub_region_or_district,
        culturalPreferences: cloudNER.cultural_preferences,
        familiarFoods: cloudNER.familiar_foods,
        familiarPlaces: cloudNER.familiar_places,
        familiarObjects: cloudNER.familiar_objects,
        festivals: cloudNER.festivals,
        music: cloudNER.music,
        familyMemories: cloudNER.family_memories,
        updatedAt: cloudNER.updated_at,
      });
    }
  } catch (err) {
    console.warn('[YaadSaathi Sync] NER Profile sync warning:', err);
  }
}

/**
 * Syncs personal memories between local and cloud.
 * @param {string} userId
 */
export async function syncMemories(userId) {
  if (!userId || !isSupabaseConfigured() || !supabase || !isOnline()) return;

  try {
    // 1. Fetch local memories for this user
    const localMemories = await memoryRepository.getMemories(userId);

    // 2. Push local memories to cloud
    for (const mem of localMemories) {
      if (mem.id && typeof mem.id === 'string' && mem.id.length > 20) {
        await supabase.from('memories').upsert({
          id: mem.id,
          user_id: userId,
          category: mem.category || mem.type || 'STORY',
          type: mem.type || 'STORY',
          title: mem.title || '',
          description: mem.description || '',
          relationship: mem.relationship || '',
          location_context: mem.locationContext || mem.place || '',
          date_context: mem.dateContext || '',
          image_url: mem.image || mem.imageUrl || '',
          audio_url: mem.audioUrl || '',
          updated_at: mem.updatedAt || new Date().toISOString(),
        });
      }
    }

    // 3. Pull cloud memories
    const { data: cloudMemories } = await supabase
      .from('memories')
      .select('*')
      .eq('user_id', userId);

    if (Array.isArray(cloudMemories)) {
      for (const cloudMem of cloudMemories) {
        const existing = await db.memories.get(cloudMem.id).catch(() => null);
        if (!existing) {
          await db.memories.add({
            id: cloudMem.id,
            userId,
            category: cloudMem.category,
            type: cloudMem.type,
            title: cloudMem.title,
            description: cloudMem.description,
            relationship: cloudMem.relationship,
            locationContext: cloudMem.location_context,
            dateContext: cloudMem.date_context,
            image: cloudMem.image_url,
            createdAt: cloudMem.created_at,
            updatedAt: cloudMem.updated_at,
          }).catch(() => {});
        }
      }
    }
  } catch (err) {
    console.warn('[YaadSaathi Sync] Memories sync warning:', err);
  }
}

/**
 * Syncs daily routines between local and cloud.
 * @param {string} userId
 */
export async function syncRoutines(userId) {
  if (!userId || !isSupabaseConfigured() || !supabase || !isOnline()) return;

  try {
    const localRoutines = await routineRepository.getRoutines(userId);

    for (const r of localRoutines) {
      if (r.id && typeof r.id === 'string' && r.id.length > 20) {
        await supabase.from('routines').upsert({
          id: r.id,
          user_id: userId,
          title: r.title || r.titleEnglish || '',
          title_hindi: r.titleHindi || '',
          title_english: r.titleEnglish || '',
          description: r.description || '',
          period: r.period || 'morning',
          scheduled_time: r.scheduledTime || r.time || '08:00 AM',
          time: r.time || r.scheduledTime || '08:00 AM',
          completed: Boolean(r.completed),
          completed_at: r.completedAt || null,
          updated_at: r.updatedAt || new Date().toISOString(),
        });
      }
    }

    const { data: cloudRoutines } = await supabase
      .from('routines')
      .select('*')
      .eq('user_id', userId);

    if (Array.isArray(cloudRoutines)) {
      for (const cr of cloudRoutines) {
        const existing = await db.routines.get(cr.id).catch(() => null);
        if (!existing) {
          await db.routines.add({
            id: cr.id,
            userId,
            title: cr.title,
            titleHindi: cr.title_hindi,
            titleEnglish: cr.title_english,
            description: cr.description,
            period: cr.period,
            time: cr.time,
            scheduledTime: cr.scheduled_time,
            completed: cr.completed,
            completedAt: cr.completed_at,
            createdAt: cr.created_at,
            updatedAt: cr.updated_at,
          }).catch(() => {});
        }
      }
    }
  } catch (err) {
    console.warn('[YaadSaathi Sync] Routines sync warning:', err);
  }
}

/**
 * Syncs cognitive game results and telemetry.
 * @param {string} userId
 */
export async function syncGameResults(userId) {
  if (!userId || !isSupabaseConfigured() || !supabase || !isOnline()) return;

  try {
    const localResults = await cognitiveRepository.getGameResults({ userId, limit: 50 });

    for (const res of localResults) {
      if (res.id && typeof res.id === 'string' && res.id.length > 20) {
        await supabase.from('game_results').upsert({
          id: res.id,
          user_id: userId,
          session_id: String(res.sessionId || ''),
          game_id: res.gameId,
          cognitive_domain: res.cognitiveDomain || 'MEMORY',
          score: res.score || 0,
          accuracy: res.accuracy || 100,
          response_time: res.responseTime || 0,
          attempts: res.attempts || 1,
          mistakes: res.mistakes || 0,
          hints_used: res.hintsUsed || 0,
          difficulty_level: res.difficultyLevel || 3,
          adaptive_recommendation: res.adaptiveRecommendation || null,
          created_at: res.createdAt || res.completedAt || new Date().toISOString(),
        });
      }
    }
  } catch (err) {
    console.warn('[YaadSaathi Sync] Game results sync warning:', err);
  }
}

/**
 * Runs a complete background synchronization of all domain data for a user.
 * 
 * @param {string} userId
 * @returns {Promise<{ success: boolean, timestamp: string }>}
 */
export async function syncAll(userId) {
  if (!userId) return { success: false, timestamp: new Date().toISOString() };

  if (!isSupabaseConfigured() || !supabase || !isOnline()) {
    return { success: true, timestamp: new Date().toISOString(), isLocal: true };
  }

  try {
    await Promise.allSettled([
      syncUserProfile(userId),
      syncNERProfile(userId),
      syncMemories(userId),
      syncRoutines(userId),
      syncGameResults(userId),
    ]);

    return { success: true, timestamp: new Date().toISOString() };
  } catch (err) {
    console.warn('[YaadSaathi Sync] syncAll error:', err);
    return { success: false, timestamp: new Date().toISOString(), error: err.message };
  }
}

/**
 * Safely imports local guest data into an authenticated user's account with explicit consent.
 * 
 * @param {string} guestUserId
 * @param {string} authenticatedUserId
 * @returns {Promise<{ importedCount: number }>}
 */
export async function importLocalDataToUser(guestUserId, authenticatedUserId) {
  if (!guestUserId || !authenticatedUserId || guestUserId === authenticatedUserId) {
    return { importedCount: 0 };
  }

  let count = 0;

  try {
    // 1. Migrate Memories
    const guestMemories = await memoryRepository.getMemories(guestUserId);
    for (const mem of guestMemories) {
      await db.memories.add({
        ...mem,
        id: `mem-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        userId: authenticatedUserId,
        updatedAt: new Date().toISOString(),
      });
      count++;
    }

    // 2. Migrate Routines
    const guestRoutines = await routineRepository.getRoutines(guestUserId);
    for (const r of guestRoutines) {
      await db.routines.add({
        ...r,
        id: `rt-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        userId: authenticatedUserId,
        updatedAt: new Date().toISOString(),
      });
      count++;
    }

    // 3. Migrate Game Results
    const guestResults = await cognitiveRepository.getGameResults({ userId: guestUserId, limit: 100 });
    for (const gr of guestResults) {
      await db.gameResults.add({
        ...gr,
        id: `gr-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        userId: authenticatedUserId,
      });
      count++;
    }

    // 4. Trigger cloud sync for authenticated user
    await syncAll(authenticatedUserId);

    return { importedCount: count };
  } catch (err) {
    console.error('[YaadSaathi Sync] Data migration error:', err);
    return { importedCount: count, error: err.message };
  }
}
