import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Equipment, Operation } from '../types';
import Request from '../lib/request';

interface User {
  id: string;
  name: string;
  email: string;
  role?: 'operator' | 'administrator';
}

interface ActiveOperationState {
  equipment: Equipment;
  operation: Operation;
  startTime: number;
  repeatCount: number; // How many times this operation has been repeated locally
}

interface AppState {
  isLoading: boolean;
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  selectedEquipment: Equipment | null;
  currentOperation: Operation | null;
  operationStartTime: number | null;
  activeOperation: ActiveOperationState | null;
  activeOperations: ActiveOperationState[]; // Keep for backward compatibility, but will only have 0-1 items
  setLoading: (loading: boolean) => void;
  setAuth: (token: string, user: User) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  syncActiveOperations: () => Promise<void>;
  setSelectedEquipment: (equipment: Equipment | null) => void;
  setCurrentOperation: (operation: Operation | null) => void;
  setOperationStartTime: (time: number | null) => void;
  setActiveOperation: (operation: ActiveOperationState | null) => void;
  addActiveOperation: (operation: ActiveOperationState) => void;
  removeActiveOperation: (operationId: string) => void;
  incrementRepeatCount: (operationId: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  isLoading: true,
  token: null,
  user: null,
  isAuthenticated: false,
  selectedEquipment: null,
  currentOperation: null,
  operationStartTime: null,
  activeOperation: null,
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
    set({
      token: null,
      user: null,
      isAuthenticated: false,
      selectedEquipment: null,
      currentOperation: null,
      operationStartTime: null,
      activeOperation: null,
      activeOperations: []
    });
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

  syncActiveOperations: async () => {
    try {
      // Fetch current active operation from server
      const response = await Request.Get('/operations/current');

      if (response.success && response.data) {
        // User has an active operation on the server
        const operation: Operation = response.data;

        // Calculate start time from operation's startTime
        const startTime = new Date(operation.startTime).getTime();

        // Create active operation state
        const activeOpState: ActiveOperationState = {
          equipment: operation.equipment as Equipment,
          operation: operation,
          startTime: startTime,
          repeatCount: 1
        };

        // Update store with the active operation
        set({
          activeOperation: activeOpState,
          activeOperations: [activeOpState],
          currentOperation: operation,
          operationStartTime: startTime
        });
      } else {
        // No active operation on server, ensure state is clean
        set({
          activeOperation: null,
          activeOperations: [],
          currentOperation: null,
          operationStartTime: null
        });
      }
    } catch (error) {
      console.error('Failed to sync active operations:', error);
      // On error, don't clear existing state - it might be a network issue
    }
  },

  setSelectedEquipment: (equipment) => set({ selectedEquipment: equipment }),
  setCurrentOperation: (operation) => set({ currentOperation: operation }),
  setOperationStartTime: (time) => set({ operationStartTime: time }),

  setActiveOperation: (operation) => set({
    activeOperation: operation,
    activeOperations: operation ? [operation] : [] // Keep activeOperations in sync
  }),

  // Replace current active operation with new one (only allow 1 active operation)
  addActiveOperation: (operation) => set({
    activeOperation: operation,
    activeOperations: [operation],
    currentOperation: operation.operation,
    operationStartTime: operation.startTime
  }),

  removeActiveOperation: (operationId) => set((state) => {
    if (state.activeOperation?.operation._id === operationId) {
      return {
        activeOperation: null,
        activeOperations: [],
        currentOperation: null,
        operationStartTime: null
      };
    }
    return state;
  }),

  incrementRepeatCount: (operationId) => set((state) => {
    if (state.activeOperation?.operation._id === operationId) {
      const updatedActiveOp = {
        ...state.activeOperation,
        repeatCount: state.activeOperation.repeatCount + 1
      };
      return {
        activeOperation: updatedActiveOp,
        activeOperations: [updatedActiveOp]
      };
    }
    return state;
  }),
}));
