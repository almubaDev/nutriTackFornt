// src/hooks/index.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../services/api';
import { useAuthStore, useNutritionStore } from '../store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  LoginRequest, 
  RegisterRequest, 
  ProfileUpdateRequest,
  CalculateTargetsRequest,
  QuickLogRequest,
  AnalyzeImageRequest,
  SearchFoodsRequest 
} from '../types';

// Auth hooks
export const useLogin = () => {
  const { login } = useAuthStore();
  
  return useMutation({
    mutationFn: (data: LoginRequest) => apiClient.login(data),
    onSuccess: async ({ user, tokens }) => {
      // Save tokens to AsyncStorage
      await AsyncStorage.setItem('auth_tokens', JSON.stringify(tokens));
      // Update auth store
      login(user, tokens);
    },
    onError: (error) => {
      console.error('Login error:', error);
    },
  });
};

export const useRegister = () => {
  const { login } = useAuthStore();
  
  return useMutation({
    mutationFn: (data: RegisterRequest) => apiClient.register(data),
    onSuccess: async ({ user, tokens }) => {
      // Save tokens to AsyncStorage
      await AsyncStorage.setItem('auth_tokens', JSON.stringify(tokens));
      // Update auth store
      login(user, tokens);
    },
    onError: (error) => {
      console.error('Register error:', error);
    },
  });
};

export const useLogout = () => {
  const { logout } = useAuthStore();
  const { clearNutrition } = useNutritionStore();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: () => apiClient.logout(),
    onSuccess: async () => {
      // Clear all stored data
      await AsyncStorage.multiRemove(['auth_tokens', 'nutrition-storage', 'app-storage']);
      // Clear stores
      logout();
      clearNutrition();
      // Clear react-query cache
      queryClient.clear();
    },
    onError: (error) => {
      console.error('Logout error:', error);
      // Even if API call fails, clear local data
      logout();
      clearNutrition();
    },
  });
};

// User profile hooks
export const useUserProfile = () => {
  const { isAuthenticated } = useAuthStore();
  
  return useQuery({
    queryKey: ['userProfile'],
    queryFn: () => apiClient.getUserProfile(),
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

export const useUpdateUserProfile = () => {
  const queryClient = useQueryClient();
  const { setProfile } = useNutritionStore();
  
  return useMutation({
    mutationFn: (data: ProfileUpdateRequest) => apiClient.updateUserProfile(data),
    onSuccess: (updatedProfile) => {
      // Update cache
      queryClient.setQueryData(['userProfile'], updatedProfile);
      // Update store
      setProfile(updatedProfile);
    },
  });
};

// Fitness goal hooks
export const useActiveFitnessGoal = () => {
  const { isAuthenticated } = useAuthStore();
  
  return useQuery({
    queryKey: ['activeFitnessGoal'],
    queryFn: () => apiClient.getActiveFitnessGoal(),
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
};

export const useCreateFitnessGoal = () => {
  const queryClient = useQueryClient();
  const { setFitnessGoal } = useNutritionStore();
  
  return useMutation({
    mutationFn: (goalType: string) => apiClient.createFitnessGoal(goalType),
    onSuccess: (newGoal) => {
      // Update cache
      queryClient.setQueryData(['activeFitnessGoal'], newGoal);
      // Update store
      setFitnessGoal(newGoal);
    },
  });
};

// Nutrition targets hooks
export const useTodayTargets = () => {
  const { isAuthenticated } = useAuthStore();
  
  return useQuery({
    queryKey: ['todayTargets'],
    queryFn: () => apiClient.getTodayTargets(),
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

export const useCalculateTargets = () => {
  const queryClient = useQueryClient();
  const { setTargets } = useNutritionStore();
  
  return useMutation({
    mutationFn: (data: CalculateTargetsRequest) => apiClient.calculateNutritionTargets(data),
    onSuccess: (newTargets) => {
      // Update cache
      queryClient.setQueryData(['todayTargets'], newTargets);
      // Update store
      setTargets(newTargets);
    },
  });
};

// Food hooks
export const useSearchFoods = () => {
  return useMutation({
    mutationFn: ({ query, limit = 10 }: SearchFoodsRequest) => 
      apiClient.searchFoods(query, limit),
  });
};

export const useScannedFoods = () => {
  const { isAuthenticated } = useAuthStore();
  
  return useQuery({
    queryKey: ['scannedFoods'],
    queryFn: () => apiClient.getScannedFoods(),
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
};

// AI Analysis hooks
export const useAnalyzeImage = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ imageData, format = 'jpeg' }: AnalyzeImageRequest) => 
      apiClient.analyzeImage(imageData, format),
    onSuccess: () => {
      // Invalidate scanned foods to refresh the list
      queryClient.invalidateQueries({ queryKey: ['scannedFoods'] });
    },
  });
};

// User stats hook (nuevo)
export const useUserStats = () => {
  const { isAuthenticated } = useAuthStore();
  
  return useQuery({
    queryKey: ['userStats'],
    queryFn: () => apiClient.getUserStats(),
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

// Tracking hooks
export const useTodayLog = () => {
  const { isAuthenticated } = useAuthStore();
  
  return useQuery({
    queryKey: ['todayLog'],
    queryFn: () => apiClient.getTodayLog(),
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 1, // 1 minute
  });
};

export const useQuickLogFood = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: QuickLogRequest) => apiClient.quickLogFood(data),
    onSuccess: () => {
      // Invalidate today's log to refresh
      queryClient.invalidateQueries({ queryKey: ['todayLog'] });
      queryClient.invalidateQueries({ queryKey: ['todayTargets'] });
      queryClient.invalidateQueries({ queryKey: ['nutritionSummary'] });
    },
  });
};

export const useNutritionSummary = () => {
  const { isAuthenticated } = useAuthStore();
  
  return useQuery({
    queryKey: ['nutritionSummary'],
    queryFn: () => apiClient.getNutritionSummary(),
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

// Daily log by date hook (nuevo)
export const useDailyLogByDate = (date: string) => {
  const { isAuthenticated } = useAuthStore();
  
  return useQuery({
    queryKey: ['dailyLog', date],
    queryFn: () => apiClient.getDailyLogByDate(date),
    enabled: isAuthenticated && !!date,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

// Food search with cache (nuevo)
export const useFoodSearch = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ query, limit = 10 }: SearchFoodsRequest) => 
      apiClient.searchFoods(query, limit),
    onSuccess: (data, variables) => {
      // Cache search results
      queryClient.setQueryData(['foodSearch', variables.query], data);
    },
  });
};

// Generic hook for refetching multiple queries
export const useRefreshAll = () => {
  const queryClient = useQueryClient();
  
  return async () => {
    await queryClient.invalidateQueries({ queryKey: ['todayLog'] });
    await queryClient.invalidateQueries({ queryKey: ['todayTargets'] });
    await queryClient.invalidateQueries({ queryKey: ['userProfile'] });
    await queryClient.invalidateQueries({ queryKey: ['activeFitnessGoal'] });
    await queryClient.invalidateQueries({ queryKey: ['nutritionSummary'] });
  };
};

// Hook for checking onboarding status
export const useOnboardingStatus = () => {
  const { user } = useAuthStore();
  const { data: profile } = useUserProfile();
  const { data: activeGoal } = useActiveFitnessGoal();
  
  const isProfileComplete = profile && profile.weight && profile.height && profile.age;
  const hasActiveGoal = activeGoal && activeGoal.is_active;
  
  return {
    isComplete: isProfileComplete && hasActiveGoal,
    needsProfile: !isProfileComplete,
    needsGoal: !hasActiveGoal,
  };
};