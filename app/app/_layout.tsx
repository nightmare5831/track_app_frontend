import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useFonts } from 'expo-font';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '../store/useAppStore';
import '../global.css';

export default function RootLayout() {
  const isAuthenticated = useAppStore((state) => state.isAuthenticated);
  const isLoading = useAppStore((state) => state.isLoading);
  const checkAuth = useAppStore((state) => state.checkAuth);
  const segments = useSegments();
  const router = useRouter();

  // Load Ionicons font - this is all we need for icons to work
  const [fontsLoaded] = useFonts({
    ...Ionicons.font,
  });

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (isLoading || !fontsLoaded) return;

    if (!isAuthenticated && segments[0] !== 'login' && segments[0] !== 'register') {
      router.replace('/login');
    } else if (isAuthenticated && (segments[0] === 'login' || segments[0] === 'register')) {
      router.replace('/');
    }
  }, [isAuthenticated, segments, isLoading, fontsLoaded]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="equipment" />
      <Stack.Screen name="operation" />
    </Stack>
  );
}

