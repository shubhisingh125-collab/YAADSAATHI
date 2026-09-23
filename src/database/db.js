/**
 * db.js
 * Dexie IndexedDB instance initialization for YaadSaathi.
 * Provides the persistent local database layer for offline-first cognitive and memory support.
 */

import Dexie from 'dexie';
import { DB_NAME, DB_VERSION, DB_SCHEMA_V1 } from './schema.js';

export class YaadSaathiDatabase extends Dexie {
  constructor() {
    super(DB_NAME);
    this.version(DB_VERSION).stores(DB_SCHEMA_V1);

    // Typed table references for convenient usage
    this.users = this.table('users');
    this.gameSessions = this.table('gameSessions');
    this.gameResults = this.table('gameResults');
    this.cognitiveProgress = this.table('cognitiveProgress');
    this.memories = this.table('memories');
    this.routines = this.table('routines');
    this.medicines = this.table('medicines');
    this.medicineHistory = this.table('medicineHistory');
    this.caregivers = this.table('caregivers');
    this.caregiverAlerts = this.table('caregiverAlerts');
    this.locationBreadcrumbs = this.table('locationBreadcrumbs');
    this.aiConversations = this.table('aiConversations');
    this.aiMessages = this.table('aiMessages');
    this.nerProfiles = this.table('nerProfiles');
    this.nerCognitiveItems = this.table('nerCognitiveItems');
  }
}

/**
 * Singleton database instance
 */
export const db = new YaadSaathiDatabase();

/**
 * Safe database connection test helper
 * @returns {Promise<boolean>} Resolves true if IndexedDB opens cleanly
 */
export async function testDatabaseConnection() {
  try {
    await db.open();
    return db.isOpen();
  } catch (error) {
    console.warn('YaadSaathi IndexedDB initialization error:', error);
    return false;
  }
}

export default db;
