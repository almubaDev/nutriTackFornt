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
  ScannedFood,
  DailyLog,
  UserStats,
  NutritionSummary,
  ProfileUpdateRequest,
  CalculateTargetsRequest,
  QuickLogRequest,
  AnalyzeImageRequest,
  SearchFoodsRequest
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

  async updateUserProfile(data: ProfileUpdateRequest): Promise<UserProfile> {
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

  async calculateNutritionTargets(data: CalculateTargetsRequest): Promise<NutritionTargets> {
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

  // AI Stats endpoint (NUEVO)
  async getUserStats(): Promise<UserStats> {
    const response = await this.fetchWithAuth('/ai/stats/');
    return response.json();
  }

  // Tracking endpoints
  async getTodayLog(): Promise<DailyLog> {
    const response = await this.fetchWithAuth('/tracking/logs/today/');
    return response.json();
  }

  // Daily log by date (NUEVO)
  async getDailyLogByDate(date: string): Promise<DailyLog> {
    const response = await this.fetchWithAuth(`/tracking/logs/by-date/?date=${date}`);
    return response.json();
  }

  async quickLogFood(data: QuickLogRequest): Promise<any> {
    const response = await this.fetchWithAuth('/tracking/foods/quick-log/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.json();
  }

  async getNutritionSummary(): Promise<NutritionSummary> {
    const response = await this.fetchWithAuth('/tracking/summary/');
    return response.json();
  }

  // Additional utility endpoints

  // Get all daily logs
  async getDailyLogs(limit: number = 30): Promise<{ daily_logs: DailyLog[]; count: number }> {
    const response = await this.fetchWithAuth(`/tracking/logs/?limit=${limit}`);
    return response.json();
  }

  // Get specific daily log by ID
  async getDailyLogById(id: number): Promise<DailyLog> {
    const response = await this.fetchWithAuth(`/tracking/logs/${id}/`);
    return response.json();
  }

  // Delete logged food item
  async deleteLoggedFood(id: number): Promise<void> {
    await this.fetchWithAuth(`/tracking/foods/${id}/`, {
      method: 'DELETE',
    });
  }

  // Update logged food item
  async updateLoggedFood(id: number, data: Partial<QuickLogRequest>): Promise<any> {
    const response = await this.fetchWithAuth(`/tracking/foods/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    return response.json();
  }

  // Get food by ID
  async getFoodById(id: number): Promise<Food> {
    const response = await this.fetchWithAuth(`/foods/${id}/`);
    return response.json();
  }

  // Get scanned food by ID
  async getScannedFoodById(id: number): Promise<ScannedFood> {
    const response = await this.fetchWithAuth(`/foods/scanned/${id}/`);
    return response.json();
  }

  // Convert scanned food to verified food
  async convertScannedFood(scannedId: number): Promise<Food> {
    const response = await this.fetchWithAuth(`/foods/scanned/${scannedId}/convert/`, {
      method: 'POST',
    });
    return response.json();
  }

  // Health check
  async healthCheck(): Promise<{ status: string }> {
    const response = await fetch(`${this.baseURL}/health/`);
    return response.json();
  }
}

export const apiClient = new ApiClient();