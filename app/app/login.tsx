import React, { useState } from 'react';
import { View, Text, Alert, ScrollView, KeyboardAvoidingView, Platform, StyleSheet, Image } from 'react-native';
import { useRouter } from 'expo-router';
import Request from '../lib/request';
import { useAppStore } from '../store/useAppStore';
import { APP_NAME } from '../data';
import { Button, Input } from '../components/ui';
import { theme } from '../theme';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const setAuth = useAppStore((state) => state.setAuth);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const response = await Request.Post('/auth/login', { email, password });

      if (response.error) {
        Alert.alert('Error', response.error);
      } else {
        await setAuth(response.token, response.user);
        router.replace('/');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to login. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.logoSection}>
          <Image
            source={require('../assets/mine.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
          <Text style={styles.appTitle}>{APP_NAME}</Text>
          <Text style={styles.subtitle}>Mining Operations Management</Text>
        </View>

        <View style={styles.formContainer}>
          <Input
            label="Email"
            placeholder="operator@mining.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            icon="mail-outline"
          />

          <Input
            label="Password"
            placeholder="Enter your password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            icon="lock-closed-outline"
          />

          <Button
            title="Sign In"
            onPress={handleLogin}
            loading={loading}
            fullWidth
            size="lg"
          />

          <Button
            title="Create Account"
            onPress={() => router.push('/register')}
            variant="ghost"
            fullWidth
            size="md"
          />
        </View>

        <Text style={styles.footer}>Powered by SOLVEO Mining Technologies</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff', // White background
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: theme.spacing.xl,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl * 2,
  },
  logoImage: {
    width: 100,
    height: 100,
    marginBottom: theme.spacing.lg,
  },
  appTitle: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  formContainer: {
    width: '100%',
  },
  footer: {
    textAlign: 'center',
    fontSize: theme.fontSize.xs,
    color: theme.colors.textTertiary,
    marginTop: theme.spacing.xl,
  },
});
