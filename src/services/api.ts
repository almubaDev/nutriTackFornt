// src/services/api.ts
import { API_BASE_URL, REQUEST_TIMEOUT } from '../constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  User, 
  AuthTokens, 
  LoginRequest, 
  RegisterRequest,
  UserProfile,
  FitnessGoal,
  NutritionTargets,
  Food,
  ScannedFood 
} from '../types';

class ApiClient {
  private baseURL: string;
  private timeout: number;

  constructor() {
    this.baseURL = API_BASE_URL;
    this.timeout = REQUEST_TIMEOUT;
  }

  // Get auth token from storage
  private async getAuthToken(): Promise<string | null> {
    try {
      const tokens = await AsyncStorage.getItem('auth_tokens');
      if (tokens) {
        const parsedTokens: AuthTokens = JSON.parse(tokens);
        return parsedTokens.access;
      }
      return null;
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  }

    // Base fetch with auth and error handling
  private async fetchWithAuth(endpoint: string, options: RequestInit = {}): Promise<Response> {
    const token = await this.getAuthToken();
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        ...options,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  // Auth endpoints
  async login(data: LoginRequest): Promise<{ user: User; tokens: AuthTokens }> {
    const response = await fetch(`${this.baseURL}/users/auth/login/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Login failed');
    }

    const result = await response.json();
    return {
      user: result.user,
      tokens: {
        access: result.access,
        refresh: result.refresh,
      },
    };
  }

  async register(data: RegisterRequest): Promise<{ user: User; tokens: AuthTokens }> {
    const response = await fetch(`${this.baseURL}/users/auth/registration/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Registration failed');
    }

    const result = await response.json();
    return {
      user: result.user,
      tokens: {
        access: result.access,
        refresh: result.refresh,
      },
    };
  }

  async logout(): Promise<void> {
    await this.fetchWithAuth('/users/auth/logout/', { method: 'POST' });
  }

  async getCurrentUser(): Promise<User> {
    const response = await this.fetchWithAuth('/users/me/');
    return response.json();
  }

  // Nutrition endpoints
  async getUserProfile(): Promise<UserProfile> {
    const response = await this.fetchWithAuth('/nutrition/profile/');
    return response.json();
  }

  async updateUserProfile(data: Partial<UserProfile>): Promise<UserProfile> {
    const response = await this.fetchWithAuth('/nutrition/profile/', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.json();
  }

  async createFitnessGoal(goalType: string): Promise<FitnessGoal> {
    const response = await this.fetchWithAuth('/nutrition/goals/', {
      method: 'POST',
      body: JSON.stringify({ goal_type: goalType }),
    });
    return response.json();
  }

  async getActiveFitnessGoal(): Promise<FitnessGoal> {
    const response = await this.fetchWithAuth('/nutrition/goals/active/');
    return response.json();
  }

  async getTodayTargets(): Promise<NutritionTargets> {
    const response = await this.fetchWithAuth('/nutrition/targets/today/');
    return response.json();
  }

  async calculateNutritionTargets(data: {
    profile_data: Partial<UserProfile>;
    goal_type: string;
    date: string;
  }): Promise<NutritionTargets> {
    const response = await this.fetchWithAuth('/nutrition/targets/calculate/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.json();
  }

  // Food endpoints
  async searchFoods(query: string, limit: number = 10): Promise<{ foods: Food[]; count: number }> {
    const response = await this.fetchWithAuth('/foods/search/', {
      method: 'POST',
      body: JSON.stringify({ query, limit }),
    });
    return response.json();
  }

  async getScannedFoods(limit: number = 20): Promise<{ scanned_foods: ScannedFood[]; count: number }> {
    const response = await this.fetchWithAuth(`/foods/scanned/my/?limit=${limit}`);
    return response.json();
  }

  // AI Analysis endpoint
  async analyzeImage(imageData: string, format: string = 'jpeg'): Promise<any> {
    const response = await this.fetchWithAuth('/ai/analyze/', {
      method: 'POST',
      body: JSON.stringify({
        image_data: imageData,
        image_format: format,
      }),
    });
    return response.json();
  }

  // Tracking endpoints
  async getTodayLog(): Promise<any> {
    const response = await this.fetchWithAuth('/tracking/logs/today/');
    return response.json();
  }

  async quickLogFood(data: {
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
  }): Promise<any> {
    const response = await this.fetchWithAuth('/tracking/foods/quick-log/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.json();
  }

  async getNutritionSummary(): Promise<any> {
    const response = await this.fetchWithAuth('/tracking/summary/');
    return response.json();
  }
}

export const apiClient = new ApiClient();