import { Text, View, Alert } from 'react-native';
import { useEffect, useState } from 'react';
import { getUniversalLink } from '@selfxyz/core';
import { SelfAppBuilder, type SelfApp } from '@selfxyz/qrcode';
import { v4 as uuidv4 } from 'uuid';
import { setStorageItemAsync, getStorageItemAsync } from '@/hooks/useStorageState';
import { useSession } from '@/components/ctx';
import { Button, LoadingSpinner } from '@/components/ui';
import * as Linking from 'expo-linking';


export default function SignIn() {
  const [userId, setUserId] = useState<string | null>(null);
  const [selfApp, setSelfApp] = useState<SelfApp | null>(null);
  const [universalLink, setUniversalLink] = useState<string>("");
  const { signIn } = useSession();

  // Get or generate userId on mount
  useEffect(() => {
    async function initUserId() {
      try {
        let storedUserId = await getStorageItemAsync('userId');

        if (!storedUserId) {
          // Generate new UUID if not exists
          storedUserId = uuidv4();
          await setStorageItemAsync('userId', storedUserId);
        }

        setUserId(storedUserId);
      } catch (error) {
        console.error('Failed to initialize userId:', error);
      }
    }

    initUserId();
  }, []);

  // Build Self app when userId is available
  useEffect(() => {
    if (!userId) return;
    
    const deeplinkCallback = Linking.createURL('auth-callback');

    try {
      // Build Self app configuration
      const app = new SelfAppBuilder({
        version: 2,
        appName: process.env.EXPO_PUBLIC_SELF_APP_NAME,
        scope: process.env.EXPO_PUBLIC_SELF_SCOPE_SEED,
        endpoint: `${process.env.EXPO_PUBLIC_SELF_ENDPOINT}`,
        logoBase64: "https://i.postimg.cc/mrmVf9hm/self.png",
        userId: userId,
        endpointType: "staging_celo",
        userIdType: "uuid",
        userDefinedData: "Enjoy Private Location Sharing!",

        // [DEEPLINK CALLBACK] Automatically redirect user to your app after verification
        deeplinkCallback: deeplinkCallback,

        disclosures: {
          // What you want to verify from users identity:
          // ofac: true,
          // What you want users to reveal:
          name: true,
          // issuing_state: true,
          nationality: true,
          // date_of_birth: true,
          // passport_number: false,
          gender: true,
          // expiry_date: false,
        }
      }).build();

      setSelfApp(app);
      setUniversalLink(getUniversalLink(app));
    } catch (error) {
      console.error("Failed to initialize Self app:", error);
      Alert.alert('Error', 'Failed to initialize Self authentication');
    }
  }, [userId]);

  const handleSelfSignIn = async () => {
    if (!universalLink) {
      Alert.alert('Error', 'Self app not initialized yet');
      return;
    }

    try {
      // Open Self app via deep link
      const canOpen = await Linking.canOpenURL(universalLink);
      if (canOpen) {
        await Linking.openURL(universalLink);
      } else {
        Alert.alert(
          'Self App Not Found',
          'Please install the Self Protocol app to continue',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error opening Self app:', error);
      Alert.alert('Error', 'Failed to open Self app');
    }
  };

  // Show loading state while initializing
  if (!userId || !selfApp || !universalLink) {
    return <LoadingSpinner message="Initializing Self authentication..." />;
  }

  return (
    <View className="flex-1 justify-center items-center p-6 bg-white">
      <Text className="text-3xl font-bold mb-2 text-gray-900">
        {process.env.EXPO_PUBLIC_SELF_APP_NAME || "Self Workshop"}
      </Text>
      <Text className="text-sm text-gray-600 mb-8 text-center px-4">
        Verify your identity with Self Protocol
      </Text>

      <Button
        title="Sign In with Self"
        onPress={handleSelfSignIn}
        variant="primary"
      />

      <View className="mt-8 items-center">
        <Text className="text-xs text-gray-600 mb-2">User ID</Text>
        <Text className="text-xs font-mono text-gray-800">
          {userId}
        </Text>
      </View>

      <Button
        title="DevLogin"
        onPress={() => signIn(userId!)}
        variant="danger"
        className="mt-5"
      />
    </View>
  );
}
