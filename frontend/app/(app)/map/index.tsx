import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Animated, Dimensions, Modal, StyleSheet } from 'react-native';
import MapView, { PROVIDER_GOOGLE, Marker } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useFriends } from '@/context/FriendsContext';
import { useUser } from '@/context/UserContext';
import type { User, Region, PooledMarker } from '@/types';
import { MAP_SETTINGS, MAP_STYLE } from '@/constants/mapConstants';
import { useRouter } from 'expo-router';
import { updateLocation } from '@/services/location.service';

const { height } = Dimensions.get('window');

export default function MapScreen() {
  const mapRef = useRef<MapView>(null);
  const slideAnim = useRef(new Animated.Value(height)).current;
  const router = useRouter();

  const { friends } = useFriends();
  const { userId, userLocation, setUserLocation } = useUser();

  const [selectedFriends, setSelectedFriends] = useState<User[]>([]);
  const [region, setRegion] = useState<Region>({
    latitude: 20,
    longitude: 0,
    latitudeDelta: MAP_SETTINGS.INITIAL_DELTA,
    longitudeDelta: MAP_SETTINGS.INITIAL_DELTA,
  });
  const [currentZoom, setCurrentZoom] = useState<number>(MAP_SETTINGS.INITIAL_DELTA);

  // Center map on user's location (only when button is pressed)
  const centerOnUserLocation = () => {
    if (userLocation) {
      const newRegion = {
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: 10,
        longitudeDelta: 10,
      };
      setRegion(newRegion);
      setCurrentZoom(10);
      mapRef.current?.animateToRegion(newRegion, MAP_SETTINGS.ANIMATION_DURATION);
    }
  };

  // Continuous location tracking
  useEffect(() => {
    console.log('🎯 Map screen mounted - starting location tracking');
    console.log('🆔 Current userId:', userId);
    let subscription: Location.LocationSubscription | null = null;
    let lastCity: string | undefined;
    let lastCountry: string | undefined;
    let lastUpdateTime = 0;

    const startLocationTracking = async () => {
      try {
        console.log('🔍 Checking location permissions...');
        const { status } = await Location.getForegroundPermissionsAsync();
        console.log('📱 Permission status:', status);

        if (status !== 'granted') {
          console.log('❌ Location permission not granted');
          return;
        }

        console.log('✅ Permission granted, starting location watch...');

        // Watch location changes - highest accuracy to make native blue dot responsive
        // But only send to backend every 10 seconds
        subscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.BestForNavigation,
            timeInterval: 0, // Get updates as fast as possible
            distanceInterval: 0, // Update even if not moving
          },
          (location) => {
            const { latitude, longitude } = location.coords;
            const now = Date.now();

            // Update local state on every location change (for map reactivity)
            setUserLocation(latitude, longitude, lastCity, lastCountry);

            // Only send to backend every 10 seconds
            if (now - lastUpdateTime >= 10000) {
              lastUpdateTime = now;
              console.log('📍 GPS:', latitude.toFixed(6), longitude.toFixed(6));

              const locationData = {
                latitude,
                longitude,
                city: lastCity,
                country: lastCountry,
                timestamp: new Date(),
              };

              // Send to backend in background (fire-and-forget)
              console.log('🔄 Attempting to send location update. userId:', userId);
              if (userId) {
                console.log('✅ userId exists, calling updateLocation...');
                updateLocation(userId, locationData)
                  .then(() => {
                    console.log('📍 Location updated successfully');
                  })
                  .catch((error) => {
                    console.log('❌ Location update failed:', error);
                  });
              } else {
                console.log('❌ No userId - cannot send location update');
              }

              // Reverse geocode occasionally
              if (!lastCity || !lastCountry) {
                Location.reverseGeocodeAsync({ latitude, longitude })
                  .then(([geocode]) => {
                    if (geocode) {
                      lastCity = geocode?.city || geocode?.region || undefined;
                      lastCountry = geocode?.country || undefined;
                      console.log('🏙️ City/country updated:', lastCity, lastCountry);
                    }
                  })
                  .catch(() => {});
              }
            }
          }
        );

        console.log('✅ Location watch started successfully');
      } catch (error) {
        console.error('❌ Failed to start location tracking:', error);
      }
    };

    startLocationTracking();

    // Cleanup
    return () => {
      console.log('🛑 Stopping location tracking');
      if (subscription) {
        subscription.remove();
      }
    };
  }, [userId, setUserLocation]);

  // Track zoom level changes
  const handleRegionChange = (newRegion: Region) => {
    setCurrentZoom(newRegion.latitudeDelta);
  };

  // Pool markers by city when zoomed out
  const poolMarkers = (): PooledMarker[] => {
    const shouldPoolRealtime = currentZoom > MAP_SETTINGS.ZOOM_THRESHOLD;
    const cityGroups: { [key: string]: User[] } = {};
    const cityTotals: { [key: string]: number } = {};

    // Count all friends in each city
    friends.forEach((friend) => {
      if (friend.location?.city) {
        const cityKey = `${friend.location.city}-${friend.location.country}`;
        cityTotals[cityKey] = (cityTotals[cityKey] || 0) + 1;
      }
    });

    // Group friends that should be pooled
    friends.forEach((friend) => {
      const shouldPool =
        friend.sharingLevel === 'city' ||
        (shouldPoolRealtime && friend.sharingLevel === 'realtime');

      if (shouldPool && friend.location?.city) {
        const cityKey = `${friend.location.city}-${friend.location.country}`;
        if (!cityGroups[cityKey]) {
          cityGroups[cityKey] = [];
        }
        cityGroups[cityKey].push(friend);
      }
    });

    return Object.entries(cityGroups)
      .filter(([_, friendsList]) => friendsList.length > 0)
      .map(([cityKey, friendsList]) => ({
        id: cityKey,
        location: friendsList[0].location!,
        friends: friendsList,
        count: cityTotals[cityKey],
      }));
  };

  // Handle marker press
  const handleMarkerPress = (friendsToShow: User[]) => {
    setSelectedFriends(friendsToShow);
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 50,
      friction: 7,
    }).start();
  };

  // Close friend detail modal
  const closeFriendDetail = () => {
    Animated.timing(slideAnim, {
      toValue: height,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setSelectedFriends([]);
    });
  };

  const pooledMarkers = poolMarkers();
  const pooledFriendIds = new Set(
    pooledMarkers.flatMap((marker) => marker.friends.map((f) => f.id))
  );

  // Individual markers (real-time sharers when zoomed in)
  const individualMarkers = friends.filter(
    (friend) =>
      !pooledFriendIds.has(friend.id) &&
      friend.sharingLevel === 'realtime' &&
      friend.location !== null &&
      currentZoom <= MAP_SETTINGS.ZOOM_THRESHOLD
  );

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={region}
        customMapStyle={MAP_STYLE}
        showsUserLocation
        showsMyLocationButton={false}
        onRegionChangeComplete={handleRegionChange}
      >
        {/* Pooled markers */}
        {pooledMarkers.map((pooledMarker) => (
          <Marker
            key={`pool-${pooledMarker.id}-${Math.round(pooledMarker.location.latitude * 100000)}-${Math.round(pooledMarker.location.longitude * 100000)}`}
            coordinate={{
              latitude: pooledMarker.location.latitude,
              longitude: pooledMarker.location.longitude,
            }}
            onPress={() => handleMarkerPress(pooledMarker.friends)}
          >
            <View className="bg-blue-500 rounded-full px-3 py-2 items-center justify-center shadow-lg">
              <Text className="text-white font-bold text-sm">{pooledMarker.count}</Text>
            </View>
          </Marker>
        ))}

        {/* Individual real-time markers when zoomed in */}
        {individualMarkers.map((friend) => (
          <Marker
            key={`friend-${friend.id}-${Math.round(friend.location!.latitude * 100000)}-${Math.round(friend.location!.longitude * 100000)}`}
            coordinate={{
              latitude: friend.location!.latitude,
              longitude: friend.location!.longitude,
            }}
            onPress={() => handleMarkerPress([friend])}
          >
            <View className="bg-green-500 rounded-full w-10 h-10 items-center justify-center shadow-lg border-2 border-white">
              <Ionicons name="person" size={20} color="white" />
            </View>
          </Marker>
        ))}
      </MapView>

      {/* Top Bar */}
      <View className="absolute top-12 left-4 right-4 flex-row justify-between items-center bg-white/90 py-3 px-4 rounded-lg shadow-md">
        <Text className="text-lg font-bold text-gray-900">Linda</Text>
        <TouchableOpacity
          className="p-2"
          onPress={() => router.push('/settings')}
        >
          <Ionicons name="settings-outline" size={24} color="#111827" />
        </TouchableOpacity>
      </View>

      {/* Center on Location Button */}
      <TouchableOpacity
        className="absolute bottom-10 self-center w-14 h-14 rounded-full bg-blue-500 items-center justify-center shadow-lg"
        onPress={centerOnUserLocation}
      >
        <Ionicons name="locate" size={24} color="white" />
      </TouchableOpacity>

      {/* Friend Detail Modal */}
      <Modal
        visible={selectedFriends.length > 0}
        transparent
        animationType="none"
        onRequestClose={closeFriendDetail}
      >
        <TouchableOpacity
          className="flex-1 bg-black/50"
          activeOpacity={1}
          onPress={closeFriendDetail}
        >
          <Animated.View
            style={{ transform: [{ translateY: slideAnim }] }}
            className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl"
          >
            <TouchableOpacity activeOpacity={1}>
              {/* Drag handle */}
              <View className="items-center py-4">
                <View className="w-12 h-1 bg-gray-300 rounded-full" />
              </View>

              {/* Content */}
              <View className="px-6 pb-8">
                <Text className="text-2xl font-bold text-gray-900 mb-4">
                  {selectedFriends.length === 1
                    ? selectedFriends[0].userName
                    : `${selectedFriends.length} friends`}
                </Text>

                {selectedFriends.length === 1 ? (
                  // Single friend view
                  <View>
                    <View className="flex-row items-center mb-3">
                      <Ionicons name="location-outline" size={20} color="#6B7280" />
                      <Text className="ml-2 text-base text-gray-700">
                        {selectedFriends[0].location?.city}, {selectedFriends[0].location?.country}
                      </Text>
                    </View>
                    <View className="flex-row items-center mb-3">
                      <Ionicons
                        name={selectedFriends[0].sharingLevel === 'realtime' ? 'navigate-outline' : 'business-outline'}
                        size={20}
                        color="#6B7280"
                      />
                      <Text className="ml-2 text-base text-gray-700">
                        {selectedFriends[0].sharingLevel === 'realtime' ? 'Real-time location' : 'City-level sharing'}
                      </Text>
                    </View>
                  </View>
                ) : (
                  // Multiple friends view
                  <View>
                    {selectedFriends.map((friend) => (
                      <View key={friend.id} className="mb-4 pb-4 border-b border-gray-200">
                        <Text className="text-lg font-semibold text-gray-900 mb-2">
                          {friend.userName}
                        </Text>
                        <View className="flex-row items-center">
                          <Ionicons name="location-outline" size={16} color="#6B7280" />
                          <Text className="ml-2 text-sm text-gray-600">
                            {friend.location?.city}, {friend.location?.country}
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>
                )}

                <TouchableOpacity
                  className="mt-4 bg-blue-500 py-4 rounded-lg items-center"
                  onPress={closeFriendDetail}
                >
                  <Text className="text-white font-semibold text-base">Close</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </Animated.View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
});
