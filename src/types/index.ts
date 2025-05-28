// src/types/index.ts

// User types
export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  is_email_verified: boolean;
  date_joined: string;
  created_at: string;
  updated_at: string;
}

// Auth types
export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password1: string;
  password2: string;
  first_name?: string;
  last_name?: string;
}

// Nutrition types
export interface UserProfile {
  id: number;
  weight: number; // kg
  height: number; // cm
  age: number;
  gender: 'male' | 'female';
  activity_level: number;
  bmi: number;
  bmr: number;
  tdee: number;
  created_at: string;
  updated_at: string;
}

export interface FitnessGoal {
  id: number;
  goal_type: 'weight_loss' | 'muscle_gain' | 'maintenance' | 'recomposition';
  goal_type_display: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface NutritionTargets {
  id: number;
  date: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  bmi: number;
  tdee: number;
  bmr: number;
  fitness_goal: number;
  fitness_goal_display: string;
  created_at: string;
}

// Food types
export interface Food {
  id: number;
  name: string;
  brand: string;
  barcode: string;
  calories_per_100g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  fat_per_100g: number;
  is_verified: boolean;
  created_by_email: string | null;
  created_at: string;
  updated_at: string;
}

export interface ScannedFood {
  id: number;
  user_email: string;
  ai_identified_name: string;
  serving_size: string;
  calories_per_serving: number | null;
  protein_per_serving: number | null;
  carbs_per_serving: number | null;
  fat_per_serving: number | null;
  calories_per_100g: number | null;
  protein_per_100g: number | null;
  carbs_per_100g: number | null;
  fat_per_100g: number | null;
  raw_ai_response?: any;
  created_at: string;
}

// Tracking types
export interface DailyLog {
  id: number;
  user_email: string;
  date: string;
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fat: number;
  food_items: LoggedFoodItem[];
  created_at: string;
  updated_at: string;
}

export interface LoggedFoodItem {
  id: number;
  name: string;
  quantity: number;
  unit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'other';
  meal_type_display: string;
  food?: Food;
  scanned_food?: ScannedFood;
  food_name?: string;
  scanned_food_name?: string;
  logged_at: string;
}

// AI Analysis types
export interface ImageAnalysis {
  id: number;
  user_email: string;
  image_size: number;
  image_format: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'error';
  status_display: string;
  gemini_request_tokens: number;
  gemini_response_tokens: number;
  gemini_cost_usd: number;
  error_message?: string;
  processing_time_seconds: number;
  created_at: string;
  updated_at: string;
}

export interface UserStats {
  total_analyses: number;
  successful_analyses: number;
  failed_analyses: number;
  success_rate: number;
  total_cost: number;
  average_cost_per_analysis: number;
  last_analysis_date: string | null;
  analyses_this_month: number;
  cost_this_month: number;
}

// API Response types
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface ApiError {
  error: string;
  details?: any;
}

// Request types for Quick Log
export interface QuickLogRequest {
  date: string;
  meal_type: string;
  name?: string;
  quantity: number;
  unit: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  food_id?: number;
  scanned_food_id?: number;
}

// Image Analysis Request
export interface AnalyzeImageRequest {
  imageData: string;
  format?: string;
}

// Search Request
export interface SearchFoodsRequest {
  query: string;
  limit?: number;
}

// Nutrition Summary Response
export interface NutritionSummary {
  period: string;
  days_logged: number;
  averages: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  daily_logs: DailyLog[];
}

// Profile Update Request
export interface ProfileUpdateRequest {
  first_name?: string;
  last_name?: string;
  weight?: number;
  height?: number;
  age?: number;
  gender?: 'male' | 'female';
  activity_level?: number;
}

// Calculate Targets Request
export interface CalculateTargetsRequest {
  profile_data: {
    weight: number;
    height: number;
    age: number;
    gender: 'male' | 'female';
    activity_level: number;
  };
  goal_type: string;
  date: string;
}

// Navigation types
export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Onboarding: undefined;
  MainTabs: undefined;
};

export type TabParamList = {
  Home: undefined;
  Scanner: undefined;
  History: undefined;
  Profile: undefined;
};

// Form validation types
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

// Constants types
export interface ActivityLevel {
  value: number;
  label: string;
}

export interface FitnessGoalOption {
  value: string;
  label: string;
}

export interface GenderOption {
  value: 'male' | 'female';
  label: string;
}

export interface MealType {
  value: string;
  label: string;
}

// Store types
export interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (user: User, tokens: AuthTokens) => void;
  logout: () => void;
  setUser: (user: User) => void;
  setLoading: (loading: boolean) => void;
}

export interface NutritionState {
  profile: UserProfile | null;
  fitnessGoal: FitnessGoal | null;
  targets: NutritionTargets | null;
  setProfile: (profile: UserProfile) => void;
  setFitnessGoal: (goal: FitnessGoal) => void;
  setTargets: (targets: NutritionTargets) => void;
  clearNutrition: () => void;
}

export interface AppState {
  isOnboardingCompleted: boolean;
  currentScreen: string;
  isLoading: boolean;
  setOnboardingCompleted: (completed: boolean) => void;
  setCurrentScreen: (screen: string) => void;
  setAppLoading: (loading: boolean) => void;
}