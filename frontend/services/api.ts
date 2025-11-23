/**
 * Simple API Client for Backend Communication
 * Handles platform-specific URLs for Docker containers
 */

import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Get API base URL based on platform
const getApiUrl = (): string => {
  const PORT = process.env.EXPO_PUBLIC_API_PORT || '3000';

  // Production override
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  // Development - platform specific for Docker
  if (Platform.OS === 'android') return `http://10.0.2.2:${PORT}`;
  if (Platform.OS === 'ios') return `http://localhost:${PORT}`;
  if (Platform.OS === 'web') return `http://localhost:${PORT}`;

  // Physical device - use Expo's host IP
  const debuggerHost = Constants.expoConfig?.hostUri;
  const ip = debuggerHost ? debuggerHost.split(':')[0] : 'localhost';
  return `http://${ip}:${PORT}`;
};

export const API_URL = getApiUrl();

console.log('🌐 API_URL:', API_URL);

// Simple fetch wrapper
export const api = {
  get: async (endpoint: string) => {
    const response = await fetch(`${API_URL}${endpoint}`);
    const text = await response.text();

    try {
      return JSON.parse(text);
    } catch (e) {
      console.error('❌ Failed to parse response:', text);
      throw new Error(`Invalid JSON response: ${text.substring(0, 100)}`);
    }
  },

  post: async (endpoint: string, data?: any) => {
    const url = `${API_URL}${endpoint}`;
    console.log('📤 POST:', url);
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const text = await response.text();

    try {
      return JSON.parse(text);
    } catch (e) {
      console.error('❌ Failed to parse response:', text);
      throw new Error(`Invalid JSON response: ${text.substring(0, 100)}`);
    }
  },

  put: async (endpoint: string, data?: any) => {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const text = await response.text();

    try {
      return JSON.parse(text);
    } catch (e) {
      console.error('❌ Failed to parse response:', text);
      throw new Error(`Invalid JSON response: ${text.substring(0, 100)}`);
    }
  },

  delete: async (endpoint: string) => {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'DELETE',
    });
    const text = await response.text();

    try {
      return JSON.parse(text);
    } catch (e) {
      console.error('❌ Failed to parse response:', text);
      throw new Error(`Invalid JSON response: ${text.substring(0, 100)}`);
    }
  },
};
