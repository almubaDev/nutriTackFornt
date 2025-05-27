// src/constants/index.ts

// API Configuration
export const API_BASE_URL = __DEV__ 
  ? 'http://localhost:8000/api' 
  : 'https://nutritrack-api.railway.app/api';

// Activity Level Options
export const ACTIVITY_LEVELS = [
  { value: 1.2, label: 'Sedentario (poco o ningún ejercicio)' },
  { value: 1.375, label: 'Ejercicio ligero (1-3 días/semana)' },
  { value: 1.55, label: 'Ejercicio moderado (3-5 días/semana)' },
  { value: 1.725, label: 'Ejercicio intenso (6-7 días/semana)' },
  { value: 1.9, label: 'Ejercicio muy intenso (dos veces al día, trabajos físicos)' },
];

// Fitness Goal Options
export const FITNESS_GOALS = [
  { value: 'weight_loss', label: 'Bajar de peso' },
  { value: 'muscle_gain', label: 'Ganar musculatura' },
  { value: 'maintenance', label: 'Mantener peso actual' },
  { value: 'recomposition', label: 'Recomposición corporal' },
];

// Gender Options
export const GENDERS = [
  { value: 'male', label: 'Masculino' },
  { value: 'female', label: 'Femenino' },
];

// Meal Types
export const MEAL_TYPES = [
  { value: 'breakfast', label: 'Desayuno' },
  { value: 'lunch', label: 'Almuerzo' },
  { value: 'dinner', label: 'Cena' },
  { value: 'snack', label: 'Snack' },
  { value: 'other', label: 'Otro' },
];

// Colors
export const COLORS = {
  primary: '#0EA5E9', // sky-500
  primaryDark: '#0284C7', // sky-600
  secondary: '#64748B', // slate-500
  secondaryLight: '#94A3B8', // slate-400
  background: '#0F172A', // slate-900
  surface: '#1E293B', // slate-800
  surfaceLight: '#334155', // slate-700
  text: '#F1F5F9', // slate-100
  textSecondary: '#CBD5E1', // slate-300
  textMuted: '#94A3B8', // slate-400
  success: '#10B981', // emerald-500
  warning: '#F59E0B', // amber-500
  error: '#EF4444', // red-500
  white: '#FFFFFF',
  black: '#000000',
  
  // Macro colors
  calories: '#10B981', // emerald-500
  protein: '#0EA5E9', // sky-500
  carbs: '#F59E0B', // amber-500
  fat: '#8B5CF6', // violet-500
};

// Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKENS: 'auth_tokens',
  USER_PROFILE: 'user_profile',
  USER_DATA: 'user_data',
  NUTRITION_TARGETS: 'nutrition_targets',
  ONBOARDING_COMPLETED: 'onboarding_completed',
};

// Request timeouts
export const REQUEST_TIMEOUT = 10000; // 10 seconds

// Image compression settings
export const IMAGE_SETTINGS = {
  quality: 0.8,
  maxWidth: 1024,
  maxHeight: 1024,
  format: 'jpeg' as const,
};