/**
 * Authentication Service
 * Communicates with ROFL backend for authentication
 */

import { api } from './api';

/**
 * Verify Self Protocol authentication and Celo UID
 * @param celoUid - UID from Self app on Celo
 * @param userId - User ID from frontend
 * @returns Verification result
 */
export const verifySelfAuth = async (celoUid: string, userId: string) => {
  console.log('🔐 verifySelfAuth:', { celoUid, userId });
  return api.post('/auth/verify', {
    celo_uid: celoUid,
    user_id: userId,
  });
};

/**
 * Refresh session token
 * Note: Currently not implemented in ROFL backend
 */
export const refreshSession = async (token: string) => {
  console.log('🔄 refreshSession');
  // Not implemented in ROFL backend yet
  return { success: true, data: { token } };
};

/**
 * Logout user
 * Note: Currently handled client-side only
 */
export const logout = async (userId: string) => {
  console.log('👋 logout:', userId);
  // No backend action needed, just clear local state
  return { success: true };
};
