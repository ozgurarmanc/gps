import React, { useState } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, Switch, Alert, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '@/context/UserContext';
import { useFriends } from '@/context/FriendsContext';
import { useSession } from '@/components/ctx';
import { Button } from '@/components/ui';
import type { SharingLevel } from '@/types';
import { updateProfile } from '@/services/user.service';
import { updateSharingLevel as updateSharingLevelAPI } from '@/services/location.service';

type Tab = 'profile' | 'privacy' | 'friends';

export default function SettingsScreen() {
  const [activeTab, setActiveTab] = useState<Tab>('profile');

  return (
    <View className="flex-1 bg-white">
      {/* Tab Buttons */}
      <View className="flex-row border-b border-gray-200 bg-white pt-12">
        <TouchableOpacity
          onPress={() => setActiveTab('profile')}
          className={`flex-1 py-4 ${activeTab === 'profile' ? 'border-b-2 border-blue-500' : ''}`}
        >
          <Text className={`text-center font-semibold ${activeTab === 'profile' ? 'text-blue-500' : 'text-gray-600'}`}>
            Profile
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab('privacy')}
          className={`flex-1 py-4 ${activeTab === 'privacy' ? 'border-b-2 border-blue-500' : ''}`}
        >
          <Text className={`text-center font-semibold ${activeTab === 'privacy' ? 'text-blue-500' : 'text-gray-600'}`}>
            Privacy
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab('friends')}
          className={`flex-1 py-4 ${activeTab === 'friends' ? 'border-b-2 border-blue-500' : ''}`}
        >
          <Text className={`text-center font-semibold ${activeTab === 'friends' ? 'text-blue-500' : 'text-gray-600'}`}>
            Friends
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      <View className="flex-1">
        {activeTab === 'profile' && <ProfileTab />}
        {activeTab === 'privacy' && <PrivacyTab />}
        {activeTab === 'friends' && <FriendsTab />}
      </View>
    </View>
  );
}

// Profile Tab Component
function ProfileTab() {
  const { signOut } = useSession();
  const { userId, name, setName, userName, setUserName } = useUser();
  const [editedName, setEditedName] = useState(name);
  const [editedUserName, setEditedUserName] = useState(userName);
  const [hasChanges, setHasChanges] = useState(false);

  const handleNameChange = (text: string) => {
    setEditedName(text);
    setHasChanges(text !== name || editedUserName !== userName);
  };

  const handleUserNameChange = (text: string) => {
    setEditedUserName(text);
    setHasChanges(editedName !== name || text !== userName);
  };

  const handleSave = async () => {
    setName(editedName);
    setUserName(editedUserName);
    setHasChanges(false);

    // Send to backend
    if (userId) {
      try {
        await updateProfile(userId, { userName: editedUserName });
        console.log('✅ Profile updated on backend');
        Alert.alert('Success', 'Profile updated successfully');
      } catch (error) {
        console.error('Failed to update profile:', error);
        Alert.alert('Success', 'Profile updated locally (backend unavailable)');
      }
    } else {
      Alert.alert('Success', 'Profile updated successfully');
    }
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: () => signOut(),
        },
      ]
    );
  };

  return (
    <ScrollView className="flex-1 bg-gray-50 p-6">
      <View className="bg-white rounded-lg p-6 mb-4">
        <Text className="text-sm font-semibold text-gray-700 mb-2">Name</Text>
        <TextInput
          value={editedName}
          onChangeText={handleNameChange}
          placeholder="Enter your name"
          className="bg-gray-100 rounded-lg p-4 mb-4 text-base text-gray-800"
        />

        <Text className="text-sm font-semibold text-gray-700 mb-2">Username</Text>
        <TextInput
          value={editedUserName}
          onChangeText={handleUserNameChange}
          placeholder="Enter your username"
          className="bg-gray-100 rounded-lg p-4 mb-4 text-base text-gray-800"
          autoCapitalize="none"
        />

        {hasChanges && (
          <Button
            title="Save Changes"
            onPress={handleSave}
            variant="primary"
          />
        )}
      </View>

      <Button
        title="Sign Out"
        onPress={handleSignOut}
        variant="danger"
      />
    </ScrollView>
  );
}

// Privacy Tab Component
function PrivacyTab() {
  const { userId, sharingLevel, setSharingLevel } = useUser();
  const [locationEnabled, setLocationEnabled] = useState(sharingLevel !== null);

  const handleToggleLocation = (value: boolean) => {
    if (!value) {
      Alert.alert(
        'Disable Location Sharing?',
        'Your friends will not be able to see your location.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Disable',
            style: 'destructive',
            onPress: () => {
              setLocationEnabled(false);
              setSharingLevel('city'); // Set to city but mark as disabled
            },
          },
        ]
      );
    } else {
      setLocationEnabled(true);
      setSharingLevel('city');
    }
  };

  const handleSelectLevel = async (level: SharingLevel) => {
    setSharingLevel(level);

    // Send to backend
    if (userId) {
      try {
        await updateSharingLevelAPI(userId, level);
        console.log('✅ Sharing level updated on backend');
      } catch (error) {
        console.error('Failed to update sharing level:', error);
      }
    }
  };

  return (
    <ScrollView className="flex-1 bg-gray-50 p-6">
      {/* Location Toggle */}
      <View className="bg-white rounded-lg p-4 mb-4">
        <View className="flex-row justify-between items-center">
          <View className="flex-1">
            <Text className="text-base font-semibold text-gray-900 mb-1">
              Enable Location Sharing
            </Text>
            <Text className="text-sm text-gray-600">
              When off, no friends can see your location
            </Text>
          </View>
          <Switch
            value={locationEnabled}
            onValueChange={handleToggleLocation}
            trackColor={{ false: '#d1d5db', true: '#3b82f6' }}
            thumbColor="#ffffff"
          />
        </View>
      </View>

      {/* Sharing Level */}
      {locationEnabled && (
        <View>
          <Text className="text-lg font-bold text-gray-900 mb-3">
            Sharing Level
          </Text>

          {/* City Option */}
          <TouchableOpacity
            onPress={() => handleSelectLevel('city')}
            className={`bg-white rounded-lg p-4 mb-3 flex-row items-center ${
              sharingLevel === 'city' ? 'border-2 border-blue-500' : 'border border-gray-200'
            }`}
          >
            <View className="mr-4">
              <Ionicons name="business-outline" size={24} color="#3b82f6" />
            </View>
            <View className="flex-1">
              <Text className="text-base font-semibold text-gray-900 mb-1">
                City Only
              </Text>
              <Text className="text-sm text-gray-600">
                Friends see only the city you're in
              </Text>
            </View>
            {sharingLevel === 'city' && (
              <Ionicons name="checkmark-circle" size={24} color="#3b82f6" />
            )}
          </TouchableOpacity>

          {/* Real-time Option */}
          <TouchableOpacity
            onPress={() => handleSelectLevel('realtime')}
            className={`bg-white rounded-lg p-4 mb-3 flex-row items-center ${
              sharingLevel === 'realtime' ? 'border-2 border-blue-500' : 'border border-gray-200'
            }`}
          >
            <View className="mr-4">
              <Ionicons name="navigate-outline" size={24} color="#3b82f6" />
            </View>
            <View className="flex-1">
              <Text className="text-base font-semibold text-gray-900 mb-1">
                Real-Time
              </Text>
              <Text className="text-sm text-gray-600">
                Friends see your exact location
              </Text>
            </View>
            {sharingLevel === 'realtime' && (
              <Ionicons name="checkmark-circle" size={24} color="#3b82f6" />
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Info Card */}
      <View className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
        <View className="flex-row items-start mb-2">
          <Ionicons name="information-circle-outline" size={20} color="#3b82f6" />
          <Text className="text-sm font-semibold text-gray-900 ml-2">
            Privacy Information
          </Text>
        </View>
        <Text className="text-sm text-gray-700 leading-5">
          You have complete control over your location sharing. You can change your sharing level or disable sharing at any time.
        </Text>
      </View>
    </ScrollView>
  );
}

// Friends Tab Component
function FriendsTab() {
  const { friends, friendRequests, sendFriendRequest, acceptFriendRequest, declineFriendRequest, removeFriend } = useFriends();
  const [showAddModal, setShowAddModal] = useState(false);
  const [friendId, setFriendId] = useState('');

  const handleSendRequest = async () => {
    if (friendId.trim()) {
      try {
        await sendFriendRequest(friendId.trim());
        Alert.alert('Success', `Friend request sent!`);
        setFriendId('');
        setShowAddModal(false);
      } catch (error) {
        Alert.alert('Error', 'Failed to send friend request. They may not exist or request already sent.');
      }
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    try {
      await acceptFriendRequest(requestId);
      Alert.alert('Success', 'Friend request accepted!');
    } catch (error) {
      Alert.alert('Error', 'Failed to accept friend request');
    }
  };

  const handleDeclineRequest = async (requestId: string) => {
    try {
      await declineFriendRequest(requestId);
    } catch (error) {
      Alert.alert('Error', 'Failed to decline friend request');
    }
  };

  const handleRemoveFriend = (friendId: string, friendName: string) => {
    Alert.alert(
      'Remove Friend',
      `Remove ${friendName} from your friends?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeFriend(friendId);
            } catch (error) {
              Alert.alert('Error', 'Failed to remove friend');
            }
          },
        },
      ]
    );
  };

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView className="flex-1 p-6">
        {/* Send Friend Request Button */}
        <Button
          title="Send Friend Request"
          onPress={() => setShowAddModal(true)}
          variant="secondary"
        />

        {/* Pending Friend Requests */}
        {friendRequests.length > 0 && (
          <View className="mt-6">
            <Text className="text-lg font-bold text-gray-900 mb-3">
              Pending Requests ({friendRequests.length})
            </Text>

            {friendRequests.map((request) => (
              <View
                key={request.id}
                className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-3"
              >
                <Text className="text-base font-semibold text-gray-900 mb-3">
                  Friend request from {request.senderId}
                </Text>

                <View className="flex-row gap-2">
                  <View className="flex-1">
                    <Button
                      title="Accept"
                      onPress={() => handleAcceptRequest(request.id)}
                      variant="primary"
                    />
                  </View>
                  <View className="flex-1">
                    <Button
                      title="Ignore"
                      onPress={() => handleDeclineRequest(request.id)}
                      variant="secondary"
                    />
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Friends List */}
        <View className="mt-6">
          <Text className="text-lg font-bold text-gray-900 mb-3">
            Your Friends ({friends.length})
          </Text>

          {friends.map((friend) => (
            <View
              key={friend.id}
              className="bg-white rounded-lg p-4 mb-3 flex-row items-center justify-between"
            >
              <View className="flex-1">
                <Text className="text-base font-semibold text-gray-900 mb-1">
                  {friend.userName || 'Unknown User'}
                </Text>
                {friend.location && (
                  <Text className="text-sm text-gray-600">
                    {friend.location.city}, {friend.location.country}
                  </Text>
                )}
              </View>
              <TouchableOpacity
                onPress={() => handleRemoveFriend(friend.id, friend.userName || 'User')}
                className="p-2"
              >
                <Ionicons name="trash-outline" size={20} color="#ef4444" />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Send Friend Request Modal */}
      <Modal
        visible={showAddModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View className="flex-1 justify-center items-center bg-black/50 p-6">
          <View className="bg-white rounded-lg p-6 w-full max-w-sm">
            <Text className="text-xl font-bold text-gray-900 mb-4 text-center">
              Send Friend Request
            </Text>

            <Text className="text-sm text-gray-600 mb-2">
              Enter your friend's User ID. They will need to accept your request.
            </Text>

            <TextInput
              value={friendId}
              onChangeText={setFriendId}
              placeholder="Enter friend's User ID"
              className="bg-gray-100 rounded-lg p-4 mb-4 text-base"
              autoCapitalize="none"
            />

            <View className="flex-row gap-2">
              <View className="flex-1">
                <Button
                  title="Cancel"
                  onPress={() => setShowAddModal(false)}
                  variant="secondary"
                />
              </View>
              <View className="flex-1">
                <Button
                  title="Send"
                  onPress={handleSendRequest}
                />
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
