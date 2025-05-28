// src/utils/index.ts
import * as ImagePicker from 'expo-image-picker';
import { Alert } from 'react-native';
import { IMAGE_SETTINGS } from '../constants';
import { ValidationResult } from '../types';

// Date utilities
export const formatDate = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toISOString().split('T')[0]; // YYYY-MM-DD
};

export const formatDisplayDate = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  
  // Handle invalid dates
  if (isNaN(d.getTime())) {
    return 'Fecha inválida';
  }
  
  return d.toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export const formatShortDate = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(d.getTime())) {
    return 'N/A';
  }
  
  return d.toLocaleDateString('es-ES', {
    month: 'short',
    day: 'numeric',
  });
};

export const isToday = (date: Date | string): boolean => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();
  return d.toDateString() === today.toDateString();
};

export const isYesterday = (date: Date | string): boolean => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return d.toDateString() === yesterday.toDateString();
};

export const getRelativeDate = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  
  if (isToday(d)) return 'Hoy';
  if (isYesterday(d)) return 'Ayer';
  
  const daysDiff = Math.floor((new Date().getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysDiff < 7) {
    return d.toLocaleDateString('es-ES', { weekday: 'long' });
  }
  
  return formatShortDate(d);
};

// Image utilities
export const requestCameraPermissions = async (): Promise<boolean> => {
  try {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permisos requeridos',
        'Necesitamos acceso a la cámara para escanear alimentos.',
        [{ text: 'OK' }]
      );
      return false;
    }
    return true;
  } catch (error) {
    console.error('Error requesting camera permissions:', error);
    return false;
  }
};

export const requestMediaLibraryPermissions = async (): Promise<boolean> => {
  try {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permisos requeridos',
        'Necesitamos acceso a la galería para seleccionar imágenes.',
        [{ text: 'OK' }]
      );
      return false;
    }
    return true;
  } catch (error) {
    console.error('Error requesting media library permissions:', error);
    return false;
  }
};

export const takePhoto = async (): Promise<string | null> => {
  try {
    const hasPermission = await requestCameraPermissions();
    if (!hasPermission) return null;

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: IMAGE_SETTINGS.quality,
    });

    if (!result.canceled && result.assets[0]) {
      return result.assets[0].uri;
    }
    return null;
  } catch (error) {
    console.error('Error taking photo:', error);
    Alert.alert('Error', 'No se pudo tomar la foto');
    return null;
  }
};

export const pickImage = async (): Promise<string | null> => {
  try {
    const hasPermission = await requestMediaLibraryPermissions();
    if (!hasPermission) return null;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: IMAGE_SETTINGS.quality,
    });

    if (!result.canceled && result.assets[0]) {
      return result.assets[0].uri;
    }
    return null;
  } catch (error) {
    console.error('Error picking image:', error);
    Alert.alert('Error', 'No se pudo seleccionar la imagen');
    return null;
  }
};

// Convert image to base64
export const imageToBase64 = async (uri: string): Promise<string | null> => {
  try {
    const response = await fetch(uri);
    const blob = await response.blob();
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        // Remove data:image/jpeg;base64, prefix
        const base64Data = base64.split(',')[1];
        resolve(base64Data);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error converting image to base64:', error);
    return null;
  }
};

// Nutrition utilities
export const calculateBMI = (weight: number, height: number): number => {
  if (height === 0) return 0;
  const heightInMeters = height / 100;
  return parseFloat((weight / (heightInMeters * heightInMeters)).toFixed(2));
};

export const getBMICategory = (bmi: number): string => {
  if (bmi < 18.5) return 'Bajo peso';
  if (bmi < 25) return 'Peso normal';
  if (bmi < 30) return 'Sobrepeso';
  return 'Obesidad';
};

export const getBMIColor = (bmi: number): string => {
  if (bmi < 18.5) return '#3B82F6'; // blue
  if (bmi < 25) return '#10B981'; // green
  if (bmi < 30) return '#F59E0B'; // yellow
  return '#EF4444'; // red
};

export const calculateBMR = (weight: number, height: number, age: number, gender: 'male' | 'female'): number => {
  // Mifflin-St Jeor Equation
  if (gender === 'male') {
    return 10 * weight + 6.25 * height - 5 * age + 5;
  } else {
    return 10 * weight + 6.25 * height - 5 * age - 161;
  }
};

export const calculateTDEE = (bmr: number, activityLevel: number): number => {
  return Math.round(bmr * activityLevel);
};

// Macronutrient calculations
export const calculateMacroCalories = (protein: number, carbs: number, fat: number): number => {
  return (protein * 4) + (carbs * 4) + (fat * 9);
};

export const calculateMacroPercentages = (protein: number, carbs: number, fat: number) => {
  const totalCalories = calculateMacroCalories(protein, carbs, fat);
  
  if (totalCalories === 0) {
    return { protein: 0, carbs: 0, fat: 0 };
  }
  
  return {
    protein: Math.round(((protein * 4) / totalCalories) * 100),
    carbs: Math.round(((carbs * 4) / totalCalories) * 100),
    fat: Math.round(((fat * 9) / totalCalories) * 100),
  };
};

// Validation utilities
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password: string): ValidationResult => {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Mínimo 8 caracteres');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Debe contener al menos una mayúscula');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Debe contener al menos una minúscula');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Debe contener al menos un número');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};

export const validateWeight = (weight: string): ValidationResult => {
  const errors: string[] = [];
  const numWeight = parseFloat(weight);
  
  if (!weight.trim()) {
    errors.push('El peso es requerido');
  } else if (isNaN(numWeight)) {
    errors.push('Debe ser un número válido');
  } else if (numWeight <= 0) {
    errors.push('Debe ser mayor a 0');
  } else if (numWeight > 500) {
    errors.push('Peso máximo: 500 kg');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};

export const validateHeight = (height: string): ValidationResult => {
  const errors: string[] = [];
  const numHeight = parseFloat(height);
  
  if (!height.trim()) {
    errors.push('La altura es requerida');
  } else if (isNaN(numHeight)) {
    errors.push('Debe ser un número válido');
  } else if (numHeight <= 0) {
    errors.push('Debe ser mayor a 0');
  } else if (numHeight < 50) {
    errors.push('Altura mínima: 50 cm');
  } else if (numHeight > 300) {
    errors.push('Altura máxima: 300 cm');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};

export const validateAge = (age: string): ValidationResult => {
  const errors: string[] = [];
  const numAge = parseInt(age);
  
  if (!age.trim()) {
    errors.push('La edad es requerida');
  } else if (isNaN(numAge)) {
    errors.push('Debe ser un número válido');
  } else if (numAge <= 0) {
    errors.push('Debe ser mayor a 0');
  } else if (numAge < 13) {
    errors.push('Edad mínima: 13 años');
  } else if (numAge > 120) {
    errors.push('Edad máxima: 120 años');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};

// Format utilities
export const formatNumber = (num: number, decimals: number = 1): string => {
  if (isNaN(num)) return '0';
  return num.toFixed(decimals);
};

export const formatCalories = (calories: number): string => {
  if (isNaN(calories)) return '0 kcal';
  return `${Math.round(calories)} kcal`;
};

export const formatMacro = (grams: number, label: string): string => {
  if (isNaN(grams)) return `0g ${label}`;
  return `${formatNumber(grams)}g ${label}`;
};

export const formatWeight = (weight: number): string => {
  if (isNaN(weight)) return '0 kg';
  return `${formatNumber(weight, 1)} kg`;
};

export const formatHeight = (height: number): string => {
  if (isNaN(height)) return '0 cm';
  return `${Math.round(height)} cm`;
};

// Progress utilities
export const calculateProgress = (current: number, target: number): number => {
  if (target === 0 || isNaN(current) || isNaN(target)) return 0;
  return Math.min(Math.max((current / target) * 100, 0), 999); // Cap at 999% to avoid UI issues
};

export const getProgressColor = (progress: number): string => {
  if (progress < 50) return '#EF4444'; // red-500
  if (progress < 80) return '#F59E0B'; // amber-500
  if (progress <= 100) return '#10B981'; // emerald-500
  return '#8B5CF6'; // violet-500 (over target)
};

export const getProgressLabel = (progress: number): string => {
  if (progress < 50) return 'Bajo';
  if (progress < 80) return 'Medio';
  if (progress <= 100) return 'Bien';
  if (progress <= 120) return 'Sobre meta';
  return 'Muy alto';
};

// Error handling utilities
export const handleApiError = (error: any): string => {
  if (error?.message) {
    return error.message;
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  if (error?.response?.data?.error) {
    return error.response.data.error;
  }
  
  return 'Ha ocurrido un error inesperado';
};

// Debounce utility
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

// Text utilities
export const capitalize = (str: string): string => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

export const truncateText = (text: string, maxLength: number): string => {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

// Meal type utilities
export const getMealTypeLabel = (type: string): string => {
  const mealTypes: Record<string, string> = {
    breakfast: 'Desayuno',
    lunch: 'Almuerzo',
    dinner: 'Cena',
    snack: 'Snack',
    other: 'Otro',
  };
  
  return mealTypes[type] || 'Otro';
};

export const getMealTypeIcon = (type: string): string => {
  const mealIcons: Record<string, string> = {
    breakfast: 'sunny',
    lunch: 'restaurant',
    dinner: 'moon',
    snack: 'cafe',
    other: 'nutrition',
  };
  
  return mealIcons[type] || 'nutrition';
};

// Array utilities
export const groupBy = <T>(array: T[], key: keyof T): Record<string, T[]> => {
  return array.reduce((result, item) => {
    const group = String(item[key]);
    if (!result[group]) {
      result[group] = [];
    }
    result[group].push(item);
    return result;
  }, {} as Record<string, T[]>);
};

// Time utilities
export const getTimeOfDay = (): 'morning' | 'afternoon' | 'evening' | 'night' => {
  const hour = new Date().getHours();
  
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
};

export const getGreeting = (name?: string): string => {
  const timeOfDay = getTimeOfDay();
  const greetings = {
    morning: '¡Buenos días',
    afternoon: '¡Buenas tardes',
    evening: '¡Buenas tardes',
    night: '¡Buenas noches',
  };
  
  const greeting = greetings[timeOfDay];
  return name ? `${greeting}, ${name}!` : `${greeting}!`;
};