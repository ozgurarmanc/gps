import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { User, FriendRequest } from '@/types';
import { getFriendsLocations } from '@/services/location.service';
import {
  sendFriendRequest as sendFriendRequestAPI,
  getFriendRequests as getFriendRequestsAPI,
  acceptFriendRequest as acceptFriendRequestAPI,
  declineFriendRequest as declineFriendRequestAPI,
  removeFriend as removeFriendAPI,
} from '@/services/user.service';
import { useUser } from '@/context/UserContext';

interface FriendsContextType {
  friends: User[];
  friendRequests: FriendRequest[];
  sendFriendRequest: (receiverId: string) => Promise<void>;
  acceptFriendRequest: (requestId: string) => Promise<void>;
  declineFriendRequest: (requestId: string) => Promise<void>;
  removeFriend: (friendId: string) => Promise<void>;
  refreshFriends: () => Promise<void>;
  refreshRequests: () => Promise<void>;
  isLoading: boolean;
}

const FriendsContext = createContext<FriendsContextType | undefined>(undefined);

export const FriendsProvider = ({ children }: { children: ReactNode }) => {
  const [friends, setFriends] = useState<User[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { userId } = useUser();

  // Fetch friends from backend
  const refreshFriends = async () => {
    if (!userId) return;

    setIsLoading(true);
    try {
      const response = await getFriendsLocations(userId);
      if (response.success && response.data) {
        // Deduplicate friends by ID (in case backend returns duplicates)
        const uniqueFriends = response.data.reduce((acc: User[], friend: User) => {
          if (!acc.find(f => f.id === friend.id)) {
            acc.push(friend);
          }
          return acc;
        }, []);

        setFriends(uniqueFriends);
        console.log('✅ Loaded', uniqueFriends.length, 'friends from backend');
      }
    } catch (error) {
      // Silently retry next time - localtunnel can be flaky
      console.log('⏭️ Friends refresh skipped (will retry)');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch friend requests from backend
  const refreshRequests = async () => {
    if (!userId) return;

    try {
      const response = await getFriendRequestsAPI(userId);
      if (response.success && response.data) {
        setFriendRequests(response.data);
        console.log('📬 Loaded', response.data.length, 'friend requests');
      }
    } catch (error) {
      console.log('⏭️ Friend requests refresh skipped (will retry)');
    }
  };

  // Load friends and requests on mount and when userId changes
  useEffect(() => {
    refreshFriends();
    refreshRequests();

    // Poll for updates every 10 seconds
    const friendsInterval = setInterval(refreshFriends, 10000);
    const requestsInterval = setInterval(refreshRequests, 10000);

    return () => {
      clearInterval(friendsInterval);
      clearInterval(requestsInterval);
    };
  }, [userId]);

  const sendFriendRequest = async (receiverId: string) => {
    if (!userId) return;

    try {
      const response = await sendFriendRequestAPI(userId, receiverId);
      if (response.success) {
        console.log('✅ Friend request sent');
      } else {
        throw new Error(response.error || 'Failed to send friend request');
      }
    } catch (error) {
      console.error('Failed to send friend request:', error);
      throw error;
    }
  };

  const acceptFriendRequest = async (requestId: string) => {
    if (!userId) return;

    try {
      const response = await acceptFriendRequestAPI(userId, requestId);
      if (response.success) {
        console.log('✅ Friend request accepted');
        await refreshRequests();
        await refreshFriends();
      } else {
        throw new Error(response.error || 'Failed to accept friend request');
      }
    } catch (error) {
      console.error('Failed to accept friend request:', error);
      throw error;
    }
  };

  const declineFriendRequest = async (requestId: string) => {
    if (!userId) return;

    try {
      const response = await declineFriendRequestAPI(userId, requestId);
      if (response.success) {
        console.log('✅ Friend request declined');
        await refreshRequests();
      } else {
        throw new Error(response.error || 'Failed to decline friend request');
      }
    } catch (error) {
      console.error('Failed to decline friend request:', error);
      throw error;
    }
  };

  const removeFriend = async (friendId: string) => {
    if (!userId) return;

    try {
      const response = await removeFriendAPI(userId, friendId);
      if (response.success) {
        console.log('✅ Friend removed');
        setFriends((prev) => prev.filter((f) => f.id !== friendId));
      }
    } catch (error) {
      console.error('Failed to remove friend:', error);
      throw error;
    }
  };

  return (
    <FriendsContext.Provider
      value={{
        friends,
        friendRequests,
        sendFriendRequest,
        acceptFriendRequest,
        declineFriendRequest,
        removeFriend,
        refreshFriends,
        refreshRequests,
        isLoading,
      }}
    >
      {children}
    </FriendsContext.Provider>
  );
};

export const useFriends = () => {
  const context = useContext(FriendsContext);
  if (context === undefined) {
    throw new Error('useFriends must be used within a FriendsProvider');
  }
  return context;
};
