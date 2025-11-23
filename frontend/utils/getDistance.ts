/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in kilometers
 */

export const getDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Math.round(distance * 10) / 10; // Round to 1 decimal place
};

/**
 * Format distance with unit
 * Returns "2.5 km" or "1.2 mi"
 */
export const formatDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
  unit: 'km' | 'mi' = 'km'
): string => {
  let distance = getDistance(lat1, lon1, lat2, lon2);

  // Convert to miles if needed
  if (unit === 'mi') {
    distance = distance * 0.621371;
    distance = Math.round(distance * 10) / 10;
  }

  return `${distance} ${unit}`;
};

// Helper: Convert degrees to radians
const toRad = (degrees: number): number => {
  return degrees * (Math.PI / 180);
};
