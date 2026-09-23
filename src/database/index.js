/**
 * index.js
 * Central barrel export for YaadSaathi database layer.
 */

export { db, YaadSaathiDatabase, testDatabaseConnection } from './db.js';
export { runDatabaseSmokeTest } from './databaseSmokeTest.js';
export * from './schema.js';
export * as userRepository from './repositories/userRepository.js';
export * as cognitiveRepository from './repositories/cognitiveRepository.js';
export * as memoryRepository from './repositories/memoryRepository.js';
export * as routineRepository from './repositories/routineRepository.js';
export * as medicineRepository from './repositories/medicineRepository.js';
export * as caregiverRepository from './repositories/caregiverRepository.js';
export * as nerRepository from './repositories/nerRepository.js';
export * as aiRepository from './repositories/aiRepository.js';
