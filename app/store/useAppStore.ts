import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Equipment, Operation } from '../types';

interface User {
  id: string;
  name: string;
  email: string;
}

interface ActiveOperationState {
  equipment: Equipment;
  operation: Operation;
  startTime: number;
}

interface AppState {
  isLoading: boolean;
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  selectedEquipment: Equipment | null;
  currentOperation: Operation | null;
  operationStartTime: number | null;
  activeOperations: ActiveOperationState[];
  setLoading: (loading: boolean) => void;
  setAuth: (token: string, user: User) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  setSelectedEquipment: (equipment: Equipment | null) => void;
  setCurrentOperation: (operation: Operation | null) => void;
  setOperationStartTime: (time: number | null) => void;
  addActiveOperation: (operation: ActiveOperationState) => void;
  removeActiveOperation: (operationId: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  isLoading: true,
  token: null,
  user: null,
  isAuthenticated: false,
  selectedEquipment: null,
  currentOperation: null,
  operationStartTime: null,
  activeOperations: [],

  setLoading: (loading) => set({ isLoading: loading }),

  setAuth: async (token, user) => {
    await AsyncStorage.setItem('authToken', token);
    await AsyncStorage.setItem('user', JSON.stringify(user));
    set({ token, user, isAuthenticated: true });
  },

  logout: async () => {
    await AsyncStorage.removeItem('authToken');
    await AsyncStorage.removeItem('user');
    set({ token: null, user: null, isAuthenticated: false, selectedEquipment: null, currentOperation: null, operationStartTime: null, activeOperations: [] });
  },

  checkAuth: async () => {
    set({ isLoading: true });
    try {
      const token = await AsyncStorage.getItem('authToken');
      const userStr = await AsyncStorage.getItem('user');
      if (token && userStr) {
        const user = JSON.parse(userStr);
        set({ token, user, isAuthenticated: true, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      set({ isLoading: false, isAuthenticated: false });
    }
  },

  setSelectedEquipment: (equipment) => set({ selectedEquipment: equipment }),
  setCurrentOperation: (operation) => set({ currentOperation: operation }),
  setOperationStartTime: (time) => set({ operationStartTime: time }),

  addActiveOperation: (operation) => set((state) => ({
    activeOperations: [...state.activeOperations, operation]
  })),

  removeActiveOperation: (operationId) => set((state) => ({
    activeOperations: state.activeOperations.filter(op => op.operation._id !== operationId)
  })),
}));
