import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, Alert, TouchableOpacity } from 'react-native';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useUser } from '@/context/UserContext';
import { Button, LoadingSpinner } from '@/components/ui';
import type { SharingLevel } from '@/types';
import { useSession } from '@/components/ctx';
import { updateLocation } from '@/services/location.service';
import { updateSharingLevel } from '@/services/user.service';

export default function Index() {
  const [selectedLevel, setSelectedLevel] = useState<SharingLevel | null>(null);
  const [loading, setLoading] = useState(true);
  const [locationInfo, setLocationInfo] = useState<{
    city?: string;
    country?: string;
  }>({});
  const { signOut } = useSession();
  const { userId, setSharingLevel, setUserLocation, userLocation } = useUser();
  const router = useRouter();
  
  const requestLocationPermission = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert(
          'Location Permission Required',
          'Linda needs access to your location to share it with your friends. You can change this later in Settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Location.requestForegroundPermissionsAsync() },
          ]
        );
        setLoading(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const [geocode] = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (geocode) {
        setLocationInfo({
          city: geocode.city || geocode.region || 'Unknown City',
          country: geocode.country || 'Unknown Country',
        });

        setUserLocation(
          location.coords.latitude,
          location.coords.longitude,
          geocode.city || geocode.region || undefined,
          geocode.country || undefined
        );
      }

      setLoading(false);
    } catch (error) {
      console.error('Error getting location:', error);
      setLoading(false);
      Alert.alert('Error', 'Failed to get your location. Please try again.');
    }
  }, [setUserLocation]);

  useEffect(() => {
    // Show success alert first
    Alert.alert(
      'Authentication Successful',
      'You are now authenticated with Self Protocol!',
      [{ text: 'Continue' }]
    );

    requestLocationPermission();
  }, [requestLocationPermission]);

  const handleContinue = async () => {
    if (selectedLevel) {
      setSharingLevel(selectedLevel);

      // Send sharing level and location to backend
      if (userId && userLocation) {
        try {
          await updateSharingLevel(userId, selectedLevel);
          await updateLocation(userId, userLocation);
          console.log('✅ Location and sharing level sent to backend');
        } catch (error) {
          console.error('Failed to send to backend:', error);
          // Continue anyway for local testing
        }
      }

      router.replace('/map');
    }
  };

  if (loading) {
    return (
      <LoadingSpinner
        message="Getting your location..."
        bgColor="bg-blue-50"
      />
    );
  }

  const handleClearSession = () => {
    signOut();
    router.replace('/sign-in');
  };

  return (
    <ScrollView className="flex-1 bg-blue-50">
      <View className="p-8">
        <View className="items-center mb-8">
          <Text className="text-3xl font-bold text-gray-900 mb-2 text-center">
            Choose Your Privacy Level
          </Text>
          <Text className="text-sm text-gray-600 text-center">
            You can change this anytime in Settings
          </Text>
        </View>

        {locationInfo.city && (
          <View className="flex-row items-center justify-center py-3 px-4 bg-white rounded-lg mb-8">
            <Ionicons name="location-outline" size={20} color="#6B7280" />
            <Text className="ml-2 text-base text-gray-900 font-medium">
              {locationInfo.city}, {locationInfo.country}
            </Text>
          </View>
        )}

        <View className="mb-8">
          <TouchableOpacity
            onPress={() => setSelectedLevel('city')}
            className={`mb-4 p-6 rounded-xl items-center ${
              selectedLevel === 'city'
                ? 'bg-blue-100 border-2 border-blue-500'
                : 'bg-white border-2 border-gray-200'
            }`}
          >
            <View className="mb-3">
              <Ionicons name="business-outline" size={40} color="#3B82F6" />
            </View>
            <Text className="text-lg font-bold text-gray-900 mb-2">
              Share My City
            </Text>
            <Text className="text-sm text-gray-600 text-center leading-5">
              Friends see only the city you're in. More privacy, less precision.
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setSelectedLevel('realtime')}
            className={`p-6 rounded-xl items-center ${
              selectedLevel === 'realtime'
                ? 'bg-blue-100 border-2 border-blue-500'
                : 'bg-white border-2 border-gray-200'
            }`}
          >
            <View className="mb-3">
              <Ionicons name="navigate-outline" size={40} color="#3B82F6" />
            </View>
            <Text className="text-lg font-bold text-gray-900 mb-2">
              Share Real-Time Location
            </Text>
            <Text className="text-sm text-gray-600 text-center leading-5">
              Friends see your exact location. Great for meeting up and staying connected.
            </Text>
          </TouchableOpacity>
        </View>

        <Button
          title="Continue"
          onPress={handleContinue}
          disabled={!selectedLevel}
          variant="primary"
          className="mt-4"
        />
        <Button
          title="Clear Session & Sign Out"
          onPress={handleClearSession}
          variant="danger"
          className="mt-4"
        />
      </View>
    </ScrollView>
  );
}
