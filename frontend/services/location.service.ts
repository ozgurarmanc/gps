/**
 * Location Service
 * Communicates with ROFL backend for location sharing
 */

import { api } from './api';
import type { LocationData, User } from '@/types';

/**
 * Update user's location in ROFL (stored in TEE)
 * @param userId - User ID
 * @param location - Location data (lat, lng, city, country)
 */
export const updateLocation = async (
  userId: string,
  location: LocationData
): Promise<{ success: boolean; data?: { updated: boolean } }> => {
  console.log('📍 updateLocation:', userId, location);
  return api.post(`/users/${userId}/location`, {
    user_id: userId,
    location: {
      latitude: location.latitude,
      longitude: location.longitude,
      city: location.city,
      country: location.country,
      timestamp: location.timestamp ? Math.floor(new Date(location.timestamp).getTime() / 1000) : undefined,
    },
  });
};

/**
 * Get user's location from ROFL
 */
export const getLocation = async (userId: string): Promise<{ success: boolean; data?: User }> => {
  console.log('🗺️ getLocation:', userId);
  return api.get(`/users/${userId}`);
};

/**
 * Get all friends' locations (privacy-filtered by ROFL)
 * This checks Sapphire for friendships, then returns locations with privacy applied
 * @param userId - Current user ID
 * @returns Array of friends with their privacy-filtered locations
 */
export const getFriendsLocations = async (
  userId: string
): Promise<{ success: boolean; data?: User[] }> => {
  console.log('👥 getFriendsLocations:', userId);
  return api.get(`/users/${userId}/friends/locations`);
};

/**
 * Get specific friend's location (privacy-filtered)
 * Only works if they are friends (verified via Sapphire)
 * @param userId - Current user ID
 * @param friendId - Friend's user ID
 * @returns Friend's profile with privacy-filtered location
 */
export const getFriendLocation = async (
  userId: string,
  friendId: string
): Promise<{ success: boolean; data?: User }> => {
  console.log('👤 getFriendLocation:', userId, friendId);
  return api.get(`/users/${userId}/friends/${friendId}`);
};
