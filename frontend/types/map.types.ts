/**
 * Map-related types
 */

import type { LocationData, User } from './index';

// Map region for MapView
export interface Region {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

// Pooled marker for grouped friends
export interface PooledMarker {
  id: string;
  location: LocationData;
  friends: User[];
  count: number;
}
