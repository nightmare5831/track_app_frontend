import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useAppStore } from '../store/useAppStore';
import '../global.css';

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const { isAuthenticated, checkAuth, user } = useAppStore();

  useEffect(() => {
    // Check authentication status on mount
    checkAuth();
  }, []);

  useEffect(() => {
    if (!isAuthenticated && segments[0] !== 'login' && segments[0] !== 'register') {
      // Redirect to login if not authenticated
      router.replace('/login');
    } else if (isAuthenticated) {
      // Admin should always be on admin dashboard
      if (user?.role === 'administrator' && segments[0] !== 'admin') {
        router.replace('/admin');
      }
      // Redirect from login/register to appropriate home
      else if (segments[0] === 'login' || segments[0] === 'register') {
        if (user?.role === 'administrator') {
          router.replace('/admin');
        } else {
          router.replace('/');
        }
      }
    }
  }, [isAuthenticated, segments, user]);

  return (
    <>
      <StatusBar style="auto" />
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="register" />
        <Stack.Screen name="equipment" />
        <Stack.Screen name="operation" />
      </Stack>
    </>
  );
}

