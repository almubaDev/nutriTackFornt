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
  created_at: string;
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