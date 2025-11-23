/**
 * User-related types
 */

import type { LocationData } from './location.types';

// Sharing privacy level
export type SharingLevel = 'city' | 'realtime';

// User object (also used for friends)
export interface User {
  id: string;
  userName?: string;
  sharingLevel: SharingLevel | null;
  location: LocationData | null;
  lastUpdated?: Date;
}

// Friend request status
export type FriendRequestStatus = 'pending' | 'accepted' | 'declined';

// Friend request
export interface FriendRequest {
  id: string;
  senderId: string;
  receiverId: string;
  status: FriendRequestStatus;
  timestamp: number;
}

// User context interface
export interface UserContextType {
  userId: string | null;
  setUserId: (id: string) => void;
  name: string;
  setName: (name: string) => void;
  userName: string;
  setUserName: (userName: string) => void;
  sharingLevel: SharingLevel | null;
  setSharingLevel: (level: SharingLevel) => void;
  userLocation: LocationData | null;
  setUserLocation: (
    latitude: number,
    longitude: number,
    city?: string,
    country?: string
  ) => void;
}
