// src/screens/scanner/ScannerScreen.tsx
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { useAnalyzeImage, useQuickLogFood, useSearchFoods } from '../../hooks';
import { COLORS, MEAL_TYPES } from '../../constants';
import { takePhoto, pickImage, imageToBase64, formatDate } from '../../utils';

export default function ScannerScreen() {
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [showCamera, setShowCamera] = useState(false);
  const [showFoodModal, setShowFoodModal] = useState(false);
  const [analyzedFood, setAnalyzedFood] = useState<any>(null);
  const [foodForm, setFoodForm] = useState({
    name: '',
    quantity: '100',
    unit: 'g',
    calories: '',
    protein: '',
    carbs: '',
    fat: '',
    meal_type: 'other',
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);

  const cameraRef = useRef<CameraView>(null);
  const analyzeImageMutation = useAnalyzeImage();
  const quickLogMutation = useQuickLogFood();
  const searchFoodsMutation = useSearchFoods();

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>Necesitamos permisos de cámara</Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Otorgar Permisos</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const toggleCameraFacing = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  const handleTakePhoto = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          base64: true,
        });
        
        if (photo?.base64) {
          setShowCamera(false);
          await analyzeFood(photo.base64);
        }
      } catch (error) {
        Alert.alert('Error', 'No se pudo tomar la foto');
      }
    }
  };

  const handlePickImage = async () => {
    try {
      const imageUri = await pickImage();
      if (imageUri) {
        const base64 = await imageToBase64(imageUri);
        if (base64) {
          await analyzeFood(base64);
        }
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo seleccionar la imagen');
    }
  };

  const analyzeFood = async (base64Data: string) => {
    try {
      const result = await analyzeImageMutation.mutateAsync({
        imageData: base64Data,
        format: 'jpeg',
      });

      if (result.scanned_food) {
        setAnalyzedFood(result.scanned_food);
        setFoodForm({
          name: result.scanned_food.ai_identified_name,
          quantity: '1',
          unit: result.scanned_food.serving_size ? 'porción' : 'g',
          calories: (result.scanned_food.calories_per_serving || result.scanned_food.calories_per_100g || 0).toString(),
          protein: (result.scanned_food.protein_per_serving || result.scanned_food.protein_per_100g || 0).toString(),
          carbs: (result.scanned_food.carbs_per_serving || result.scanned_food.carbs_per_100g || 0).toString(),
          fat: (result.scanned_food.fat_per_serving || result.scanned_food.fat_per_100g || 0).toString(),
          meal_type: 'other',
        });
        setShowFoodModal(true);
      } else {
        Alert.alert(
          'No se pudo identificar',
          'No pudimos identificar el alimento en la imagen. ¿Quieres registrarlo manualmente?',
          [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Registro Manual', onPress: () => openManualEntry() },
          ]
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Error al analizar la imagen');
    }
  };

  const openManualEntry = () => {
    setAnalyzedFood(null);
    setFoodForm({
      name: '',
      quantity: '100',
      unit: 'g',
      calories: '',
      protein: '',
      carbs: '',
      fat: '',
      meal_type: 'other',
    });
    setShowFoodModal(true);
  };

  const handleSearchFoods = async (query: string) => {
    if (query.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      const result = await searchFoodsMutation.mutateAsync({ query });
      setSearchResults(result.foods || []);
    } catch (error) {
      console.error('Search error:', error);
    }
  };

  const selectFoodFromSearch = (food: any) => {
    setFoodForm({
      name: food.name,
      quantity: '100',
      unit: 'g',
      calories: food.calories_per_100g.toString(),
      protein: food.protein_per_100g.toString(),
      carbs: food.carbs_per_100g.toString(),
      fat: food.fat_per_100g.toString(),
      meal_type: 'other',
    });
    setSearchResults([]);
    setSearchQuery(food.name);
  };

  const handleLogFood = async () => {
    if (!foodForm.name.trim()) {
      Alert.alert('Error', 'El nombre del alimento es requerido');
      return;
    }

    // Crear el objeto base para logData
    const logData: {
      date: string;
      meal_type: string;
      name: string;
      quantity: number;
      unit: string;
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
      scanned_food_id?: number; // Hacer opcional con ?
    } = {
      date: formatDate(new Date()),
      meal_type: foodForm.meal_type,
      name: foodForm.name,
      quantity: parseFloat(foodForm.quantity) || 0,
      unit: foodForm.unit,
      calories: parseFloat(foodForm.calories) || 0,
      protein: parseFloat(foodForm.protein) || 0,
      carbs: parseFloat(foodForm.carbs) || 0,
      fat: parseFloat(foodForm.fat) || 0,
    };

    // Solo agregar scanned_food_id si existe analyzedFood
    if (analyzedFood) {
      logData.scanned_food_id = analyzedFood.id;
    }

    try {
      await quickLogMutation.mutateAsync(logData);
      setShowFoodModal(false);
      setAnalyzedFood(null);
      Alert.alert('¡Éxito!', 'Alimento registrado correctamente');
    } catch (error) {
      Alert.alert('Error', 'No se pudo registrar el alimento');
    }
  };

  const renderCameraView = () => (
    <Modal visible={showCamera} animationType="slide">
      <View style={styles.cameraContainer}>
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing={facing}
        >
          <View style={styles.cameraOverlay}>
            <View style={styles.cameraHeader}>
              <TouchableOpacity
                style={styles.cameraButton}
                onPress={() => setShowCamera(false)}
              >
                <Ionicons name="close" size={24} color={COLORS.white} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cameraButton}
                onPress={toggleCameraFacing}
              >
                <Ionicons name="camera-reverse" size={24} color={COLORS.white} />
              </TouchableOpacity>
            </View>

            <View style={styles.scanFrame}>
              <View style={styles.scanCorner} />
            </View>

            <View style={styles.cameraFooter}>
              <TouchableOpacity
                style={styles.captureButton}
                onPress={handleTakePhoto}
              >
                <View style={styles.captureButtonInner} />
              </TouchableOpacity>
            </View>
          </View>
        </CameraView>
      </View>
    </Modal>
  );

  const renderFoodModal = () => (
    <Modal visible={showFoodModal} animationType="slide">
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowFoodModal(false)}>
            <Ionicons name="close" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>
            {analyzedFood ? 'Confirmar Alimento' : 'Registrar Alimento'}
          </Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={styles.modalContent}>
          {analyzedFood && (
            <View style={styles.aiNotice}>
              <Ionicons name="sparkles" size={16} color={COLORS.primary} />
              <Text style={styles.aiNoticeText}>
                Analizado por IA - Verifica los valores
              </Text>
            </View>
          )}

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar alimento..."
              placeholderTextColor={COLORS.textMuted}
              value={searchQuery}
              onChangeText={(text) => {
                setSearchQuery(text);
                handleSearchFoods(text);
              }}
            />
            <Ionicons name="search" size={20} color={COLORS.textMuted} />
          </View>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <View style={styles.searchResults}>
              {searchResults.map((food, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.searchResultItem}
                  onPress={() => selectFoodFromSearch(food)}
                >
                  <Text style={styles.searchResultName}>{food.name}</Text>
                  <Text style={styles.searchResultDetails}>
                    {food.calories_per_100g} kcal/100g
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Food Form */}
          <View style={styles.formContainer}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Nombre del Alimento</Text>
              <TextInput
                style={styles.textInput}
                value={foodForm.name}
                onChangeText={(text) => setFoodForm(prev => ({ ...prev, name: text }))}
                placeholder="Ej: Manzana roja"
                placeholderTextColor={COLORS.textMuted}
              />
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, styles.flex1]}>
                <Text style={styles.inputLabel}>Cantidad</Text>
                <TextInput
                  style={styles.textInput}
                  value={foodForm.quantity}
                  onChangeText={(text) => setFoodForm(prev => ({ ...prev, quantity: text }))}
                  keyboardType="numeric"
                  placeholder="100"
                  placeholderTextColor={COLORS.textMuted}
                />
              </View>
              <View style={[styles.inputGroup, styles.flex1]}>
                <Text style={styles.inputLabel}>Unidad</Text>
                <TextInput
                  style={styles.textInput}
                  value={foodForm.unit}
                  onChangeText={(text) => setFoodForm(prev => ({ ...prev, unit: text }))}
                  placeholder="g"
                  placeholderTextColor={COLORS.textMuted}
                />
              </View>
            </View>

            <View style={styles.nutritionGrid}>
              <View style={[styles.inputGroup, styles.nutritionInput]}>
                <Text style={styles.inputLabel}>Calorías</Text>
                <TextInput
                  style={styles.textInput}
                  value={foodForm.calories}
                  onChangeText={(text) => setFoodForm(prev => ({ ...prev, calories: text }))}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={COLORS.textMuted}
                />
              </View>
              <View style={[styles.inputGroup, styles.nutritionInput]}>
                <Text style={styles.inputLabel}>Proteínas (g)</Text>
                <TextInput
                  style={styles.textInput}
                  value={foodForm.protein}
                  onChangeText={(text) => setFoodForm(prev => ({ ...prev, protein: text }))}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={COLORS.textMuted}
                />
              </View>
              <View style={[styles.inputGroup, styles.nutritionInput]}>
                <Text style={styles.inputLabel}>Carbohidratos (g)</Text>
                <TextInput
                  style={styles.textInput}
                  value={foodForm.carbs}
                  onChangeText={(text) => setFoodForm(prev => ({ ...prev, carbs: text }))}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={COLORS.textMuted}
                />
              </View>
              <View style={[styles.inputGroup, styles.nutritionInput]}>
                <Text style={styles.inputLabel}>Grasas (g)</Text>
                <TextInput
                  style={styles.textInput}
                  value={foodForm.fat}
                  onChangeText={(text) => setFoodForm(prev => ({ ...prev, fat: text }))}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={COLORS.textMuted}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Tipo de Comida</Text>
              <View style={styles.mealTypeGrid}>
                {MEAL_TYPES.map((meal) => (
                  <TouchableOpacity
                    key={meal.value}
                    style={[
                      styles.mealTypeButton,
                      foodForm.meal_type === meal.value && styles.mealTypeButtonActive,
                    ]}
                    onPress={() => setFoodForm(prev => ({ ...prev, meal_type: meal.value }))}
                  >
                    <Text
                      style={[
                        styles.mealTypeText,
                        foodForm.meal_type === meal.value && styles.mealTypeTextActive,
                      ]}
                    >
                      {meal.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </ScrollView>

        <View style={styles.modalFooter}>
          <TouchableOpacity
            style={[styles.logButton, quickLogMutation.isPending && styles.disabledButton]}
            onPress={handleLogFood}
            disabled={quickLogMutation.isPending}
          >
            {quickLogMutation.isPending ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.logButtonText}>Registrar Alimento</Text>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Registrar Alimento</Text>
        <Text style={styles.subtitle}>
          Escanea la etiqueta de un producto o registra manualmente
        </Text>

        <View style={styles.optionsContainer}>
          <TouchableOpacity
            style={styles.optionButton}
            onPress={() => setShowCamera(true)}
          >
            <View style={styles.optionIcon}>
              <Ionicons name="camera" size={32} color={COLORS.primary} />
            </View>
            <Text style={styles.optionTitle}>Escanear con Cámara</Text>
            <Text style={styles.optionSubtitle}>
              Toma una foto del alimento o etiqueta nutricional
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.optionButton}
            onPress={handlePickImage}
          >
            <View style={styles.optionIcon}>
              <Ionicons name="image" size={32} color={COLORS.success} />
            </View>
            <Text style={styles.optionTitle}>Seleccionar Imagen</Text>
            <Text style={styles.optionSubtitle}>
              Elige una foto de tu galería
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.optionButton}
            onPress={openManualEntry}
          >
            <View style={styles.optionIcon}>
              <Ionicons name="create" size={32} color={COLORS.warning} />
            </View>
            <Text style={styles.optionTitle}>Registro Manual</Text>
            <Text style={styles.optionSubtitle}>
              Ingresa los datos nutricionales manualmente
            </Text>
          </TouchableOpacity>
        </View>

        {analyzeImageMutation.isPending && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Analizando imagen...</Text>
          </View>
        )}
      </View>

      {renderCameraView()}
      {renderFoodModal()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 40,
  },
  optionsContainer: {
    gap: 16,
  },
  optionButton: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  optionIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  optionSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  loadingContainer: {
    alignItems: 'center',
    marginTop: 40,
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginTop: 12,
  },
  cameraContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  cameraHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 60,
  },
  cameraButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanFrame: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  scanCorner: {
    width: 250,
    height: 250,
    borderWidth: 3,
    borderColor: COLORS.primary,
    borderRadius: 20,
    backgroundColor: 'transparent',
  },
  cameraFooter: {
    alignItems: 'center',
    paddingBottom: 40,
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primary,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceLight,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  aiNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary + '20',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  aiNoticeText: {
    fontSize: 14,
    color: COLORS.primary,
    marginLeft: 8,
    fontWeight: '500',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text,
    paddingVertical: 12,
    marginRight: 8,
  },
  searchResults: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    marginBottom: 20,
    maxHeight: 200,
  },
  searchResultItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceLight,
  },
  searchResultName: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.text,
  },
  searchResultDetails: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  formContainer: {
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  textInput: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.surfaceLight,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: COLORS.text,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  flex1: {
    flex: 1,
  },
  nutritionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  nutritionInput: {
    width: '48%',
  },
  mealTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  mealTypeButton: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.surfaceLight,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  mealTypeButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  mealTypeText: {
    fontSize: 14,
    color: COLORS.text,
  },
  mealTypeTextActive: {
    color: COLORS.white,
    fontWeight: '600',
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.surfaceLight,
  },
  logButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.6,
  },
  logButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  message: {
    textAlign: 'center',
    paddingBottom: 10,
    color: COLORS.text,
  },
  button: {
    backgroundColor: COLORS.primary,
    padding: 16,
    borderRadius: 12,
    margin: 20,
  },
  buttonText: {
    color: COLORS.white,
    textAlign: 'center',
    fontWeight: '600',
  },
});