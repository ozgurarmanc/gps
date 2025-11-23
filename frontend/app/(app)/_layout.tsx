import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { UserProvider, useUser } from '@/context/UserContext';
import { FriendsProvider } from '@/context/FriendsContext';
import { useSession } from '@/components/ctx';

function AppContent() {
  const { session } = useSession();
  const { setUserId } = useUser();

  useEffect(() => {
    console.log('📝 Session changed:', session);
    if (session) {
      console.log('✅ Setting userId from session:', session);
      setUserId(session);
    }
  }, [session, setUserId]);

  return <Stack />;
}

export default function AppLayout() {
  // This renders the navigation stack for all authenticated app routes.
  return (
    <UserProvider>
      <FriendsProvider>
        <AppContent />
      </FriendsProvider>
    </UserProvider>
  );
}
