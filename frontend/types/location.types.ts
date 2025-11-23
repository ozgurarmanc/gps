/**
 * Location-related types
 */

// Full location data (flat structure for simplicity)
export interface LocationData {
  latitude: number;
  longitude: number;
  city?: string;
  country?: string;
  timestamp?: Date;
}

// Simple permission status
export type LocationPermissionStatus = 'granted' | 'denied';

// Location update payload for API
export interface LocationUpdate {
  userId: string;
  location: LocationData;
  sharingLevel: 'city' | 'realtime';
}
