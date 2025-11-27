import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useAppStore } from '../store/useAppStore';
import '../global.css';

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const isAuthenticated = useAppStore((state) => state.isAuthenticated);
  const checkAuth = useAppStore((state) => state.checkAuth);
  const user = useAppStore((state) => state.user);

  useEffect(() => {
    // Check authentication status on mount
    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!isAuthenticated && segments[0] !== 'login' && segments[0] !== 'register') {
      router.replace('/login');
    } else if (isAuthenticated && user) {
      // Admin should go to admin dashboard
      if (user.role === 'administrator' && segments[0] !== 'admin' && segments[0] !== 'reports') {
        router.replace('/admin');
      }
      // Operator should go to home (not admin pages)
      else if (user.role !== 'administrator' && (segments[0] === 'admin' || segments[0] === 'login' || segments[0] === 'register')) {
        router.replace('/');
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
        <Stack.Screen name="reports" />
      </Stack>
    </>
  );
}

