// Import crypto polyfill first (must be before any other imports)
import 'react-native-get-random-values';

import '@/global.css';

import { Stack } from 'expo-router';
import { SessionProvider, useSession } from '@/components/ctx';
import { useEffect } from 'react';
import * as SplashScreen from 'expo-splash-screen';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

function RootNavigator() {
  const { session, isLoading } = useSession();
    useEffect(() => {
      if (!isLoading) {
        // Hide splash screen when auth state is determined
        SplashScreen.hideAsync();
      }
    }, [isLoading]);
    // Don't render navigation until we know the auth state
    if (isLoading) {
      return null;
    }
    return (
      <Stack>
        <Stack.Protected guard={!!session}>
          <Stack.Screen name="(app)" options={{ headerShown: false }} />
        </Stack.Protected>
        <Stack.Protected guard={!session}>
          <Stack.Screen name="sign-in" options={{ headerShown: false }} />
          <Stack.Screen name="auth-callback" options={{ headerShown: false }} />
        </Stack.Protected>
      </Stack>
    );
  }
  export default function RootLayout() {
    return (
      <SessionProvider>
        <RootNavigator />
      </SessionProvider>
    );
  }