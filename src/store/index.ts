// src/store/index.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, AuthTokens, UserProfile, NutritionTargets, FitnessGoal } from '../types';

// Auth Store
interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // Actions
  login: (user: User, tokens: AuthTokens) => void;
  logout: () => void;
  setUser: (user: User) => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      tokens: null,
      isAuthenticated: false,
      isLoading: false,

      login: (user: User, tokens: AuthTokens) => {
        set({
          user,
          tokens,
          isAuthenticated: true,
          isLoading: false,
        });
      },

      logout: () => {
        set({
          user: null,
          tokens: null,
          isAuthenticated: false,
          isLoading: false,
        });
      },

      setUser: (user: User) => {
        set({ user });
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user,
        tokens: state.tokens,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// Nutrition Store
interface NutritionState {
  profile: UserProfile | null;
  fitnessGoal: FitnessGoal | null;
  targets: NutritionTargets | null;
  
  // Actions
  setProfile: (profile: UserProfile) => void;
  setFitnessGoal: (goal: FitnessGoal) => void;
  setTargets: (targets: NutritionTargets) => void;
  clearNutrition: () => void;
}

export const useNutritionStore = create<NutritionState>()(
  persist(
    (set) => ({
      profile: null,
      fitnessGoal: null,
      targets: null,

      setProfile: (profile: UserProfile) => {
        set({ profile });
      },

      setFitnessGoal: (fitnessGoal: FitnessGoal) => {
        set({ fitnessGoal });
      },

      setTargets: (targets: NutritionTargets) => {
        set({ targets });
      },

      clearNutrition: () => {
        set({
          profile: null,
          fitnessGoal: null,
          targets: null,
        });
      },
    }),
    {
      name: 'nutrition-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

// App State Store (non-persistent)
interface AppState {
  isOnboardingCompleted: boolean;
  currentScreen: string;
  isLoading: boolean;
  
  // Actions
  setOnboardingCompleted: (completed: boolean) => void;
  setCurrentScreen: (screen: string) => void;
  setAppLoading: (loading: boolean) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      isOnboardingCompleted: false,
      currentScreen: 'Home',
      isLoading: false,

      setOnboardingCompleted: (completed: boolean) => {
        set({ isOnboardingCompleted: completed });
      },

      setCurrentScreen: (screen: string) => {
        set({ currentScreen: screen });
      },

      setAppLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },
    }),
    {
      name: 'app-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        isOnboardingCompleted: state.isOnboardingCompleted,
      }),
    }
  )
);