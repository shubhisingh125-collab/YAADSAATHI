/**
 * testDb.js
 * CLI test runner executing runDatabaseSmokeTest with fake-indexeddb for Node.js environment.
 */

import 'fake-indexeddb/auto';
import { runDatabaseSmokeTest } from '../src/database/databaseSmokeTest.js';

console.log('--- EXECUTING YAADSAATHI DATABASE SMOKE TEST IN NODE ---');
runDatabaseSmokeTest()
  .then((report) => {
    console.log('--- SMOKE TEST EXECUTION COMPLETE ---');
    console.log(JSON.stringify(report, null, 2));
    process.exit(0);
  })
  .catch((err) => {
    console.error('--- SMOKE TEST EXECUTION FAILED ---', err);
    process.exit(1);
  });
