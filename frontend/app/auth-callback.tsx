import { useEffect, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { useSession } from '@/components/ctx';
import { LoadingSpinner } from '@/components/ui';
import { getStorageItemAsync } from '@/hooks/useStorageState';

export default function AuthCallback() {
  const { signIn } = useSession();
  const params = useLocalSearchParams();
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    async function processAuth() {
      // Handle the callback from Self app
      console.log('Auth callback received with params:', params);

      // Extract userId from Self Protocol response
      let userId = params.uid as string || params.address as string || params.id as string;

      // If no userId in params, get the stored userId from sign-in
      if (!userId) {
        console.log('⚠️ No userId in params, using stored userId');
        userId = await getStorageItemAsync('userId');
      }

      if (userId) {
        console.log('✅ Authenticated with userId:', userId);
        signIn(userId);
      } else {
        console.error('❌ No userId found');
      }

      setIsProcessing(false);
    }

    processAuth();
  }, [params, signIn]);

  return <LoadingSpinner message="Completing authentication..." />;
}
