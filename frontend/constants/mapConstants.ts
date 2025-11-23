/**
 * Map configuration constants
 */

export const MAP_SETTINGS = {
  INITIAL_DELTA: 100, // Initial zoom level (larger = more zoomed out)
  ANIMATION_DURATION: 1000, // milliseconds
  ZOOM_THRESHOLD: 10, // Threshold for pooling markers
};

// Map custom style for water, land, roads
export const MAP_STYLE = [
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#B3D9FF' }],
  },
  {
    featureType: 'landscape',
    elementType: 'geometry',
    stylers: [{ color: '#F5F5F5' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#FFFFFF' }],
  },
  {
    featureType: 'poi',
    elementType: 'labels',
    stylers: [{ visibility: 'off' }],
  },
];
