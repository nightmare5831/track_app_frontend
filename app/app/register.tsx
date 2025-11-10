import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import Request from '../lib/request';
import { useAppStore } from '../store/useAppStore';

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
    <View className="flex-1 justify-center p-5 bg-white">
      <Text className="text-4xl font-bold mb-10 text-center">Register</Text>

      <TextInput
        className="border border-gray-300 p-4 mb-4 rounded-lg text-base"
        placeholder="Name"
        value={name}
        onChangeText={setName}
      />

      <TextInput
        className="border border-gray-300 p-4 mb-4 rounded-lg text-base"
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <TextInput
        className="border border-gray-300 p-4 mb-4 rounded-lg text-base"
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity
        className={`p-4 rounded-lg items-center mt-2 ${loading ? 'bg-gray-300' : 'bg-blue-500'}`}
        onPress={handleRegister}
        disabled={loading}
      >
        <Text className="text-white text-base font-bold">{loading ? 'Registering...' : 'Register'}</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push('/login')}>
        <Text className="text-blue-500 text-center mt-5 text-base">Already have an account? Login</Text>
      </TouchableOpacity>
    </View>
  );
}
