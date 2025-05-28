// src/screens/profile/OnboardingScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useUpdateUserProfile, useCalculateTargets, useCreateFitnessGoal } from '../../hooks';
import { useAppStore } from '../../store';
import { COLORS, ACTIVITY_LEVELS, FITNESS_GOALS, GENDERS } from '../../constants';

type OnboardingStep = 'welcome' | 'personal' | 'physical' | 'activity' | 'goals' | 'complete';

export default function OnboardingScreen() {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('welcome');
  const [formData, setFormData] = useState({
    // Personal info
    first_name: '',
    last_name: '',
    
    // Physical data
    weight: '',
    height: '',
    age: '',
    gender: '' as 'male' | 'female' | '',
    
    // Activity & Goals
    activity_level: 1.55,
    fitness_goal: '' as string,
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const updateProfileMutation = useUpdateUserProfile();
  const calculateTargetsMutation = useCalculateTargets();
  const createGoalMutation = useCreateFitnessGoal();
  const { setOnboardingCompleted } = useAppStore();

  const updateField = (field: keyof typeof formData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateCurrentStep = (): boolean => {
    const newErrors: Record<string, string> = {};

    switch (currentStep) {
      case 'personal':
        if (!formData.first_name.trim()) {
          newErrors.first_name = 'El nombre es requerido';
        }
        if (!formData.last_name.trim()) {
          newErrors.last_name = 'El apellido es requerido';
        }
        break;

      case 'physical':
        if (!formData.weight || parseFloat(formData.weight) <= 0) {
          newErrors.weight = 'Peso válido requerido';
        }
        if (!formData.height || parseFloat(formData.height) <= 0) {
          newErrors.height = 'Altura válida requerida';
        }
        if (!formData.age || parseInt(formData.age) <= 0 || parseInt(formData.age) > 120) {
          newErrors.age = 'Edad válida requerida (1-120)';
        }
        if (!formData.gender) {
          newErrors.gender = 'Selecciona tu género';
        }
        break;

      case 'goals':
        if (!formData.fitness_goal) {
          newErrors.fitness_goal = 'Selecciona un objetivo';
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (!validateCurrentStep()) return;

    const steps: OnboardingStep[] = ['welcome', 'personal', 'physical', 'activity', 'goals', 'complete'];
    const currentIndex = steps.indexOf(currentStep);
    
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1]);
    }
  };

  const prevStep = () => {
    const steps: OnboardingStep[] = ['welcome', 'personal', 'physical', 'activity', 'goals', 'complete'];
    const currentIndex = steps.indexOf(currentStep);
    
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1]);
    }
  };

  const completeOnboarding = async () => {
    if (!validateCurrentStep()) return;

    try {
      // 1. Update user profile
      await updateProfileMutation.mutateAsync({
        first_name: formData.first_name,
        last_name: formData.last_name,
      });

      // 2. Create fitness goal
      await createGoalMutation.mutateAsync(formData.fitness_goal);

      // 3. Calculate nutrition targets
      await calculateTargetsMutation.mutateAsync({
        profile_data: {
          weight: parseFloat(formData.weight),
          height: parseFloat(formData.height),
          age: parseInt(formData.age),
          gender: formData.gender,
          activity_level: formData.activity_level,
        },
        goal_type: formData.fitness_goal,
        date: new Date().toISOString().split('T')[0],
      });

      // 4. Mark onboarding as completed
      setOnboardingCompleted(true);

      Alert.alert(
        '¡Bienvenido a NutriTrack!',
        'Tu perfil ha sido configurado exitosamente.',
        [{ text: 'Comenzar', style: 'default' }]
      );
    } catch (error) {
      Alert.alert(
        'Error',
        'Hubo un problema al configurar tu perfil. Inténtalo de nuevo.'
      );
    }
  };

  const renderStepIndicator = () => {
    const steps = ['welcome', 'personal', 'physical', 'activity', 'goals'];
    const currentIndex = steps.indexOf(currentStep);
    
    return (
      <View style={styles.stepIndicator}>
        {steps.map((step, index) => (
          <View
            key={step}
            style={[
              styles.stepDot,
              index <= currentIndex && styles.stepDotActive,
            ]}
          />
        ))}
      </View>
    );
  };

  const renderWelcomeStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.iconContainer}>
        <Ionicons name="restaurant" size={64} color={COLORS.primary} />
      </View>
      <Text style={styles.stepTitle}>¡Bienvenido a NutriTrack IA!</Text>
      <Text style={styles.stepSubtitle}>
        Te ayudaremos a configurar tu perfil nutricional personalizado para alcanzar tus objetivos de salud.
      </Text>
      <Text style={styles.stepDescription}>
        Este proceso tomará solo unos minutos y nos permitirá calcular tus metas nutricionales ideales.
      </Text>
    </View>
  );

  const renderPersonalStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Información Personal</Text>
      <Text style={styles.stepSubtitle}>
        Cuéntanos un poco sobre ti
      </Text>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Nombre</Text>
        <TextInput
          style={[styles.input, errors.first_name && styles.inputError]}
          value={formData.first_name}
          onChangeText={(text) => updateField('first_name', text)}
          placeholder="Tu nombre"
          placeholderTextColor={COLORS.textMuted}
          autoCapitalize="words"
        />
        {errors.first_name && <Text style={styles.errorText}>{errors.first_name}</Text>}
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Apellido</Text>
        <TextInput
          style={[styles.input, errors.last_name && styles.inputError]}
          value={formData.last_name}
          onChangeText={(text) => updateField('last_name', text)}
          placeholder="Tu apellido"
          placeholderTextColor={COLORS.textMuted}
          autoCapitalize="words"
        />
        {errors.last_name && <Text style={styles.errorText}>{errors.last_name}</Text>}
      </View>
    </View>
  );

  const renderPhysicalStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Datos Físicos</Text>
      <Text style={styles.stepSubtitle}>
        Necesitamos estos datos para calcular tus metas nutricionales
      </Text>

      <View style={styles.row}>
        <View style={[styles.inputContainer, styles.halfWidth]}>
          <Text style={styles.label}>Peso (kg)</Text>
          <TextInput
            style={[styles.input, errors.weight && styles.inputError]}
            value={formData.weight}
            onChangeText={(text) => updateField('weight', text)}
            placeholder="70"
            placeholderTextColor={COLORS.textMuted}
            keyboardType="numeric"
          />
          {errors.weight && <Text style={styles.errorText}>{errors.weight}</Text>}
        </View>

        <View style={[styles.inputContainer, styles.halfWidth]}>
          <Text style={styles.label}>Altura (cm)</Text>
          <TextInput
            style={[styles.input, errors.height && styles.inputError]}
            value={formData.height}
            onChangeText={(text) => updateField('height', text)}
            placeholder="175"
            placeholderTextColor={COLORS.textMuted}
            keyboardType="numeric"
          />
          {errors.height && <Text style={styles.errorText}>{errors.height}</Text>}
        </View>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Edad</Text>
        <TextInput
          style={[styles.input, errors.age && styles.inputError]}
          value={formData.age}
          onChangeText={(text) => updateField('age', text)}
          placeholder="25"
          placeholderTextColor={COLORS.textMuted}
          keyboardType="numeric"
        />
        {errors.age && <Text style={styles.errorText}>{errors.age}</Text>}
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Género</Text>
        <View style={styles.optionsContainer}>
          {GENDERS.map((gender) => (
            <TouchableOpacity
              key={gender.value}
              style={[
                styles.optionButton,
                formData.gender === gender.value && styles.optionButtonActive,
              ]}
              onPress={() => updateField('gender', gender.value)}
            >
              <Text
                style={[
                  styles.optionText,
                  formData.gender === gender.value && styles.optionTextActive,
                ]}
              >
                {gender.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        {errors.gender && <Text style={styles.errorText}>{errors.gender}</Text>}
      </View>
    </View>
  );

  const renderActivityStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Nivel de Actividad</Text>
      <Text style={styles.stepSubtitle}>
        ¿Qué tan activo eres normalmente?
      </Text>

      <View style={styles.activityContainer}>
        {ACTIVITY_LEVELS.map((level) => (
          <TouchableOpacity
            key={level.value}
            style={[
              styles.activityOption,
              formData.activity_level === level.value && styles.activityOptionActive,
            ]}
            onPress={() => updateField('activity_level', level.value)}
          >
            <Text
              style={[
                styles.activityLabel,
                formData.activity_level === level.value && styles.activityLabelActive,
              ]}
            >
              {level.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderGoalsStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Tu Objetivo</Text>
      <Text style={styles.stepSubtitle}>
        ¿Cuál es tu principal objetivo fitness?
      </Text>

      <View style={styles.goalsContainer}>
        {FITNESS_GOALS.map((goal) => (
          <TouchableOpacity
            key={goal.value}
            style={[
              styles.goalOption,
              formData.fitness_goal === goal.value && styles.goalOptionActive,
            ]}
            onPress={() => updateField('fitness_goal', goal.value)}
          >
            <Text
              style={[
                styles.goalLabel,
                formData.fitness_goal === goal.value && styles.goalLabelActive,
              ]}
            >
              {goal.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      {errors.fitness_goal && <Text style={styles.errorText}>{errors.fitness_goal}</Text>}
    </View>
  );

  const renderCompleteStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.iconContainer}>
        <Ionicons name="checkmark-circle" size={64} color={COLORS.success} />
      </View>
      <Text style={styles.stepTitle}>¡Todo Listo!</Text>
      <Text style={styles.stepSubtitle}>
        Hemos calculado tus metas nutricionales personalizadas
      </Text>
      <Text style={styles.stepDescription}>
        Ahora puedes comenzar a trackear tu alimentación y alcanzar tus objetivos de salud.
      </Text>
    </View>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 'welcome':
        return renderWelcomeStep();
      case 'personal':
        return renderPersonalStep();
      case 'physical':
        return renderPhysicalStep();
      case 'activity':
        return renderActivityStep();
      case 'goals':
        return renderGoalsStep();
      case 'complete':
        return renderCompleteStep();
      default:
        return renderWelcomeStep();
    }
  };

  const isLoading = updateProfileMutation.isPending || 
                   calculateTargetsMutation.isPending || 
                   createGoalMutation.isPending;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {currentStep !== 'welcome' && currentStep !== 'complete' && renderStepIndicator()}
        
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {renderStepContent()}
        </ScrollView>

        <View style={styles.footer}>
          <View style={styles.buttonRow}>
            {currentStep !== 'welcome' && currentStep !== 'complete' && (
              <TouchableOpacity
                style={[styles.button, styles.secondaryButton]}
                onPress={prevStep}
              >
                <Text style={styles.secondaryButtonText}>Atrás</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity
              style={[
                styles.button,
                styles.primaryButton,
                isLoading && styles.disabledButton,
                currentStep === 'welcome' && styles.fullWidthButton,
              ]}
              onPress={currentStep === 'complete' ? completeOnboarding : nextStep}
              disabled={isLoading}
            >
              <Text style={styles.primaryButtonText}>
                {isLoading 
                  ? 'Configurando...' 
                  : currentStep === 'complete' 
                    ? 'Comenzar' 
                    : 'Continuar'
                }
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  keyboardView: {
    flex: 1,
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  stepDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.surfaceLight,
  },
  stepDotActive: {
    backgroundColor: COLORS.primary,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
  },
  stepContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 16,
  },
  stepSubtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  stepDescription: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.surfaceLight,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: COLORS.text,
  },
  inputError: {
    borderColor: COLORS.error,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 14,
    marginTop: 4,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfWidth: {
    width: '48%',
  },
  optionsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  optionButton: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.surfaceLight,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  optionButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  optionText: {
    fontSize: 16,
    color: COLORS.text,
    fontWeight: '500',
  },
  optionTextActive: {
    color: COLORS.white,
  },
  activityContainer: {
    gap: 12,
  },
  activityOption: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.surfaceLight,
    borderRadius: 12,
    padding: 16,
  },
  activityOptionActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  activityLabel: {
    fontSize: 16,
    color: COLORS.text,
    textAlign: 'center',
  },
  activityLabelActive: {
    color: COLORS.white,
    fontWeight: '600',
  },
  goalsContainer: {
    gap: 12,
  },
  goalOption: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.surfaceLight,
    borderRadius: 12,
    padding: 20,
  },
  goalOptionActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  goalLabel: {
    fontSize: 18,
    color: COLORS.text,
    textAlign: 'center',
    fontWeight: '500',
  },
  goalLabelActive: {
    color: COLORS.white,
    fontWeight: '600',
  },
  footer: {
    padding: 24,
    paddingTop: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
  },
  secondaryButton: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.surfaceLight,
  },
  fullWidthButton: {
    flex: 1,
  },
  disabledButton: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButtonText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
  },
});