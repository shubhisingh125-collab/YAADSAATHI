/**
 * medicineTypes.js
 * Domain model for medicine scheduling, intake logging, adherence, and caregiver escalation.
 * Strictly non-clinical: manages schedules and reminders, does NOT give medical advice.
 */

/**
 * Standard Statuses for Medicine Schedules
 * @readonly
 * @enum {string}
 */
export const MedicineStatus = Object.freeze({
  SCHEDULED: 'SCHEDULED',             // Scheduled for later today
  REMINDER_PENDING: 'REMINDER_PENDING', // Time has arrived, prompt active
  TAKEN: 'TAKEN',                     // Confirmed taken by elder or caregiver
  SNOOZED: 'SNOOZED',                 // Temporarily snoozed (e.g. 15 minutes)
  NOT_CONFIRMED: 'NOT_CONFIRMED',     // Past escalation threshold, unconfirmed
  MISSED: 'MISSED',                   // Entire window passed without confirmation
  CANCELLED: 'CANCELLED',             // Deactivated or skipped
});

/**
 * Factory creating a Medicine Schedule entity
 * 
 * @param {Object} params
 * @param {string} [params.id]
 * @param {string} params.userId
 * @param {string} params.name
 * @param {string} [params.dosage='1 tablet']
 * @param {string} [params.instructions='After meals']
 * @param {string} params.scheduledTime - 24hr format 'HH:mm', e.g. '08:00'
 * @param {string} [params.frequency='Daily']
 * @param {number} [params.reminderIntervalMinutes=15] - Snooze recurrence
 * @param {number} [params.escalationAfterMinutes=60] - Time before alerting caregiver
 * @param {boolean} [params.active=true]
 * @returns {Object} MedicineSchedule entity
 */
export function createMedicineSchedule({
  id = `med-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
  userId = 'default-user',
  name = '',
  dosage = '1 tablet',
  instructions = 'After meals with water',
  scheduledTime = '08:00',
  frequency = 'Daily',
  reminderIntervalMinutes = 15,
  escalationAfterMinutes = 60,
  active = true,
}) {
  return {
    id,
    userId,
    name,
    dosage,
    instructions,
    scheduledTime,
    frequency,
    reminderIntervalMinutes: Number(reminderIntervalMinutes) || 15,
    escalationAfterMinutes: Number(escalationAfterMinutes) || 60,
    active: Boolean(active),
    status: MedicineStatus.SCHEDULED,
    lastReminderAt: null,
    firstReminderAt: null,
    confirmedAt: null,
    caregiverAlertSent: false,
    snoozeCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Factory creating a Medicine Intake History record
 * 
 * @param {Object} params
 * @param {string} params.medicineId
 * @param {string} params.medicineName
 * @param {string} params.dosage
 * @param {string} params.scheduledTime
 * @param {string} [params.status=MedicineStatus.TAKEN]
 * @param {string} [params.confirmedAt]
 * @param {string} [params.confirmedVia='tap'] - 'tap', 'voice', or 'caregiver'
 * @returns {Object} MedicineHistoryLog entity
 */
export function createMedicineHistoryLog({
  id = `hist-${Date.now()}`,
  medicineId,
  medicineName,
  dosage,
  scheduledTime,
  status = MedicineStatus.TAKEN,
  confirmedAt = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  confirmedVia = 'tap',
}) {
  return {
    id,
    medicineId,
    medicineName,
    dosage,
    scheduledTime,
    status,
    confirmedAt,
    confirmedVia,
    date: new Date().toLocaleDateString('hi-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
    recordedTimestamp: Date.now(),
  };
}
