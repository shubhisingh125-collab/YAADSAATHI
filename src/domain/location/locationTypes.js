/**
 * locationTypes.js
 * Domain model for SafeCircle geofencing, GPS coordinates, safe boundaries, and location breadcrumbs.
 */

/**
 * SafeZone Evaluation Statuses
 * @readonly
 * @enum {string}
 */
export const SafeZoneStatus = Object.freeze({
  SAFE: 'SAFE',                         // Well within perimeter (<80% radius)
  APPROACHING: 'APPROACHING',           // Near boundary (80% to 100% radius)
  OUTSIDE_SAFE_ZONE: 'OUTSIDE_SAFE_ZONE', // Breached perimeter (>100% radius)
  UNKNOWN: 'UNKNOWN',                   // Signal unavailable or disabled
});

/**
 * Factory creating a SafeZone configuration
 * 
 * @param {Object} params
 * @param {string} [params.id]
 * @param {string} params.userId
 * @param {number} params.anchorLat - Home latitude
 * @param {number} params.anchorLng - Home longitude
 * @param {string} [params.addressLabel='Home']
 * @param {number} [params.radiusMeters=500] - Safe radius boundary
 * @param {boolean} [params.enabled=true]
 * @returns {Object} SafeZoneConfig entity
 */
export function createSafeZoneConfig({
  id = `sz-${Date.now()}`,
  userId = 'default-user',
  anchorLat,
  anchorLng,
  addressLabel = 'Home',
  radiusMeters = 500,
  enabled = true,
}) {
  return {
    id,
    userId,
    anchorLat: Number(anchorLat),
    anchorLng: Number(anchorLng),
    addressLabel,
    radiusMeters: Number(radiusMeters) || 500,
    approachingThresholdRatio: 0.8, // 80% marks approaching boundary
    enabled: Boolean(enabled),
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Factory creating a Location Breadcrumb for telemetry
 * 
 * @param {Object} params
 * @param {string} params.userId
 * @param {number} params.lat
 * @param {number} params.lng
 * @param {number} [params.distanceFromHomeMeters=0]
 * @param {string} [params.safeZoneStatus=SafeZoneStatus.SAFE]
 * @param {boolean} [params.isSimulated=false]
 * @returns {Object} LocationBreadcrumb entity
 */
export function createLocationBreadcrumb({
  id = `loc-${Date.now()}`,
  userId = 'default-user',
  lat,
  lng,
  distanceFromHomeMeters = 0,
  safeZoneStatus = SafeZoneStatus.SAFE,
  isSimulated = false,
}) {
  return {
    id,
    userId,
    lat: Number(lat),
    lng: Number(lng),
    distanceFromHomeMeters: Math.round(distanceFromHomeMeters),
    safeZoneStatus,
    isSimulated: Boolean(isSimulated),
    recordedAt: new Date().toISOString(),
  };
}
