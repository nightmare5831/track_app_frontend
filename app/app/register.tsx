import React, { useState } from 'react';
import { View, Text, Alert, ScrollView, KeyboardAvoidingView, Platform, StyleSheet, Image } from 'react-native';
import { useRouter } from 'expo-router';
import Request from '../lib/request';
import { useAppStore } from '../store/useAppStore';
import { APP_NAME } from '../data';
import { Button, Input } from '../components/ui';
import { theme } from '../theme';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const setAuth = useAppStore((state) => state.setAuth);

  const handleRegister = async () => {
    if (!name || !email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const response = await Request.Post('/auth/register', { name, email, password });

      if (response.error) {
        Alert.alert('Error', response.error);
      } else {
        await setAuth(response.token, response.user);
        router.replace('/');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to register. Please try again.');
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
          <Text style={styles.appTitle}>Create Account</Text>
          <Text style={styles.subtitle}>Join {APP_NAME}</Text>
        </View>

        <View style={styles.formContainer}>
          <Input
            label="Full Name"
            placeholder="John Smith"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
            icon="person-outline"
          />

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
            placeholder="Minimum 8 characters"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            icon="lock-closed-outline"
          />

          <Button
            title="Create Account"
            onPress={handleRegister}
            loading={loading}
            fullWidth
            size="lg"
          />

          <Button
            title="Already have an account? Sign In"
            onPress={() => router.push('/login')}
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
