import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Equipment, Activity } from '../types';

interface User {
  id: string;
  name: string;
  email: string;
}

interface ActiveOperation {
  equipment: Equipment;
  activity: Activity;
  startTime: number;
}

interface AppState {
  isLoading: boolean;
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  selectedEquipment: Equipment | null;
  currentActivity: Activity | null;
  activityStartTime: number | null;
  activeOperations: ActiveOperation[];
  setLoading: (loading: boolean) => void;
  setAuth: (token: string, user: User) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  setSelectedEquipment: (equipment: Equipment | null) => void;
  setCurrentActivity: (activity: Activity | null) => void;
  setActivityStartTime: (time: number | null) => void;
  addActiveOperation: (operation: ActiveOperation) => void;
  removeActiveOperation: (equipmentId: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  isLoading: true,
  token: null,
  user: null,
  isAuthenticated: false,
  selectedEquipment: null,
  currentActivity: null,
  activityStartTime: null,
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
    set({ token: null, user: null, isAuthenticated: false, selectedEquipment: null, currentActivity: null, activityStartTime: null, activeOperations: [] });
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
  setCurrentActivity: (activity) => set({ currentActivity: activity }),
  setActivityStartTime: (time) => set({ activityStartTime: time }),

  addActiveOperation: (operation) => set((state) => ({
    // Remove any existing operation for this equipment first, then add new one
    activeOperations: [
      ...state.activeOperations.filter(op => op.equipment._id !== operation.equipment._id),
      operation
    ]
  })),

  removeActiveOperation: (equipmentId) => set((state) => ({
    activeOperations: state.activeOperations.filter(op => op.equipment._id !== equipmentId)
  })),
}));
