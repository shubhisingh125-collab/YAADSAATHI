/**
 * caregiverTypes.js
 * Domain model for caregiver relationships, escalation channels, and safety alerts.
 */

/**
 * Roles of Caregivers and Connected Contacts
 * @readonly
 * @enum {string}
 */
export const CaregiverRole = Object.freeze({
  PRIMARY_CAREGIVER: 'PRIMARY_CAREGIVER',
  FAMILY_MEMBER: 'FAMILY_MEMBER',
  DOCTOR: 'DOCTOR',
  EMERGENCY_SERVICE: 'EMERGENCY_SERVICE',
});

/**
 * Severity of Caregiver Alerts
 * @readonly
 * @enum {string}
 */
export const AlertSeverity = Object.freeze({
  INFO: 'INFO',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL',
});

/**
 * Types of Triggered Alerts
 * @readonly
 * @enum {string}
 */
export const CaregiverAlertType = Object.freeze({
  MISSED_MEDICINE: 'MISSED_MEDICINE',
  SAFE_ZONE_BREACH: 'SAFE_ZONE_BREACH',
  PROLONGED_INACTIVITY: 'PROLONGED_INACTIVITY',
  LOW_MOOD: 'LOW_MOOD',
  SOS_TRIGGER: 'SOS_TRIGGER',
});

/**
 * Factory creating a Caregiver Contact entity
 * 
 * @param {Object} params
 * @param {string} [params.id]
 * @param {string} params.userId
 * @param {string} params.name
 * @param {string} params.phone
 * @param {string} [params.relation='Family']
 * @param {string} [params.role=CaregiverRole.PRIMARY_CAREGIVER]
 * @param {boolean} [params.canReceiveAlerts=true]
 * @param {number} [params.priority=1]
 * @returns {Object} CaregiverContact entity
 */
export function createCaregiverContact({
  id = `cg-${Date.now()}`,
  userId = 'default-user',
  name = '',
  phone = '',
  relation = 'Family',
  role = CaregiverRole.PRIMARY_CAREGIVER,
  canReceiveAlerts = true,
  priority = 1,
}) {
  return {
    id,
    userId,
    name,
    phone,
    relation,
    role,
    canReceiveAlerts: Boolean(canReceiveAlerts),
    priority: Number(priority) || 1,
    createdAt: new Date().toISOString(),
  };
}

/**
 * Factory creating an escalated Caregiver Alert
 * 
 * @param {Object} params
 * @param {string} params.userId
 * @param {string} params.type - One of CaregiverAlertType
 * @param {string} [params.severity=AlertSeverity.HIGH]
 * @param {string} params.title
 * @param {string} params.message
 * @param {Object} [params.contextData={}]
 * @returns {Object} CaregiverAlert entity
 */
export function createCaregiverAlert({
  id = `alert-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
  userId = 'default-user',
  type = CaregiverAlertType.MISSED_MEDICINE,
  severity = AlertSeverity.HIGH,
  title = '',
  message = '',
  contextData = {},
}) {
  return {
    id,
    userId,
    type,
    severity,
    title,
    message,
    contextData,
    acknowledged: false,
    acknowledgedAt: null,
    createdAt: new Date().toISOString(),
  };
}
