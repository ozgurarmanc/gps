/**
 * User Service
 * Communicates with ROFL backend for user management
 */

import { api } from './api';
import type { SharingLevel, User, FriendRequest } from '@/types';

/**
 * Get user profile from ROFL
 */
export const getProfile = async (userId: string): Promise<{ success: boolean; data?: User }> => {
  console.log('👤 getProfile:', userId);
  return api.get(`/users/${userId}`);
};

/**
 * Update user profile
 */
export const updateProfile = async (userId: string, data: Partial<User>) => {
  console.log('✏️ updateProfile:', userId, data);
  return api.put(`/users/${userId}`, data);
};

/**
 * Update sharing/privacy level
 * @param userId - User ID
 * @param level - 'city' or 'realtime'
 */
export const updateSharingLevel = async (
  userId: string,
  level: SharingLevel
): Promise<{ success: boolean; data?: { updated: boolean } }> => {
  console.log('🔒 updateSharingLevel:', userId, level);
  return api.post(`/users/${userId}/sharing-level`, {
    user_id: userId,
    level,
  });
};

/**
 * Get user's friends from Sapphire
 */
export const getFriends = async (userId: string): Promise<{ success: boolean; data?: string[] }> => {
  console.log('👥 getFriends:', userId);
  return api.get(`/users/${userId}/friends`);
};

/**
 * Add friend (stored on Sapphire)
 * @param userId - Current user ID
 * @param friendId - Friend's user ID to add
 */
export const addFriend = async (
  userId: string,
  friendId: string
): Promise<{ success: boolean; data?: { added: boolean } }> => {
  console.log('➕ addFriend:', userId, friendId);
  return api.post(`/users/${userId}/friends`, {
    user_id: userId,
    friend_id: friendId,
  });
};

/**
 * Remove friend (from Sapphire)
 * @param userId - Current user ID
 * @param friendId - Friend's user ID to remove
 */
export const removeFriend = async (
  userId: string,
  friendId: string
): Promise<{ success: boolean; data?: { removed: boolean } }> => {
  console.log('➖ removeFriend:', userId, friendId);
  return api.delete(`/users/${userId}/friends/${friendId}`);
};

/**
 * Send friend request
 * @param senderId - User ID sending the request
 * @param receiverId - User ID receiving the request
 */
export const sendFriendRequest = async (
  senderId: string,
  receiverId: string
): Promise<{ success: boolean; data?: FriendRequest; error?: string }> => {
  console.log('📨 sendFriendRequest:', senderId, '→', receiverId);
  return api.post(`/users/${senderId}/friend-requests`, {
    senderId,
    receiverId,
  });
};

/**
 * Get pending friend requests for a user
 * @param userId - User ID to get requests for
 */
export const getFriendRequests = async (
  userId: string
): Promise<{ success: boolean; data?: FriendRequest[] }> => {
  console.log('📬 getFriendRequests:', userId);
  return api.get(`/users/${userId}/friend-requests`);
};

/**
 * Accept friend request
 * @param userId - User ID accepting the request
 * @param requestId - Friend request ID
 */
export const acceptFriendRequest = async (
  userId: string,
  requestId: string
): Promise<{ success: boolean; data?: FriendRequest; error?: string }> => {
  console.log('✅ acceptFriendRequest:', userId, requestId);
  return api.post(`/users/${userId}/friend-requests/${requestId}/accept`, {});
};

/**
 * Decline friend request
 * @param userId - User ID declining the request
 * @param requestId - Friend request ID
 */
export const declineFriendRequest = async (
  userId: string,
  requestId: string
): Promise<{ success: boolean; data?: { declined: boolean }; error?: string }> => {
  console.log('❌ declineFriendRequest:', userId, requestId);
  return api.post(`/users/${userId}/friend-requests/${requestId}/decline`, {});
};
