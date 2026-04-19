/**
 * OverLays — Geospatial Utility Functions
 * Haversine distance calculation and proximity scoring
 */

const EARTH_RADIUS_KM = 6371;

/**
 * Convert degrees to radians
 */
function toRad(deg) {
  return (deg * Math.PI) / 180;
}

/**
 * Calculate Haversine distance between two lat/lng points
 * @param {{ lat: number, lng: number }} loc1
 * @param {{ lat: number, lng: number }} loc2
 * @returns {number} Distance in kilometers
 */
function haversineDistance(loc1, loc2) {
  const dLat = toRad(loc2.lat - loc1.lat);
  const dLng = toRad(loc2.lng - loc1.lng);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(loc1.lat)) *
      Math.cos(toRad(loc2.lat)) *
      Math.sin(dLng / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

/**
 * Compute proximity score using exponential decay on real pipe routing distance
 * Closer = higher score. Beyond maxDistance = 0.
 * @param {{ lat: number, lng: number }} sourceLoc
 * @param {{ lat: number, lng: number }} sinkLoc
 * @param {number} maxDistanceKm - Maximum viable direct pipe distance (default 5.0km)
 * @returns {{ score: number, distance_km: number, pipe_length_km: number }}
 */
function proximityScore(sourceLoc, sinkLoc, maxDistanceKm = 5.0) {
  const directDistance = haversineDistance(sourceLoc, sinkLoc);

  if (directDistance > maxDistanceKm) {
    return { score: 0, distance_km: parseFloat(directDistance.toFixed(2)), pipe_length_km: 0 };
  }

  // Real world municipal pipe routing is never direct distance.
  // Standard district heating circuitous multiplier usually approaches 1.35.
  const CIRCUITOUS_MULTIPLIER = 1.35;
  const estimatedPipeLength = directDistance * CIRCUITOUS_MULTIPLIER;

  // Gaussian decay: penalizes the real pipe length
  const score = 100 * Math.exp(-0.5 * (estimatedPipeLength / maxDistanceKm) ** 2);
  
  return {
    score: Math.round(score),
    distance_km: parseFloat(directDistance.toFixed(2)),       // direct distance (for UI display)
    pipe_length_km: parseFloat(estimatedPipeLength.toFixed(2))  // actual pipe length (for economics)
  };
}

module.exports = { haversineDistance, proximityScore };
