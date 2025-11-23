/**
 * Button Component
 * Reusable button with variants and states
 */

import { TouchableOpacity, Text } from 'react-native';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
  className?: string;
}

export const Button = ({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  className = '',
}: ButtonProps) => {
  // Base styles
  const baseStyles = 'py-3 px-6 rounded-lg';

  // Variant styles
  const variantStyles = {
    primary: disabled ? 'bg-gray-300' : 'bg-blue-500',
    secondary: disabled ? 'bg-gray-200' : 'bg-gray-100',
    danger: disabled ? 'bg-gray-300' : 'bg-red-500',
  };

  // Text color based on variant
  const textColor = {
    primary: 'text-white',
    secondary: 'text-gray-900',
    danger: 'text-white',
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
      activeOpacity={0.7}
    >
      <Text className={`${textColor[variant]} text-base font-semibold text-center`}>
        {title}
      </Text>
    </TouchableOpacity>
  );
};
