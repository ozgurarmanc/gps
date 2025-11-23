/**
 * Loading Spinner Component
 * Reusable loading state with centered spinner and optional message
 */

import { View, ActivityIndicator, Text } from 'react-native';

interface LoadingSpinnerProps {
  message?: string;
  color?: string;
  size?: 'small' | 'large';
  bgColor?: string;
}

export const LoadingSpinner = ({
  message,
  color = '#3B82F6',
  size = 'large',
  bgColor = 'bg-white',
}: LoadingSpinnerProps) => {
  return (
    <View className={`flex-1 justify-center items-center ${bgColor}`}>
      <ActivityIndicator size={size} color={color} />
      {message && <Text className="mt-4 text-base text-gray-600">{message}</Text>}
    </View>
  );
};
