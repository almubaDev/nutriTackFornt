import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRegister } from '../../hooks';
import { COLORS } from '../../constants';
import { validateEmail, validatePassword } from '../../utils';

export default function RegisterScreen({ navigation }: any) {
  const [formData, setFormData] = useState({
    email: '',
    password1: '',
    password2: '',
    first_name: '',
    last_name: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const registerMutation = useRegister();

  const updateField = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'El email es requerido';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Email inválido';
    }

    // First name validation
    if (!formData.first_name.trim()) {
      newErrors.first_name = 'El nombre es requerido';
    }

    // Last name validation
    if (!formData.last_name.trim()) {
      newErrors.last_name = 'El apellido es requerido';
    }

    // Password validation
    if (!formData.password1.trim()) {
      newErrors.password1 = 'La contraseña es requerida';
    } else {
      const passwordValidation = validatePassword(formData.password1);
      if (!passwordValidation.isValid) {
        newErrors.password1 = passwordValidation.errors[0];
      }
    }

    // Confirm password validation
    if (!formData.password2.trim()) {
      newErrors.password2 = 'Confirma tu contraseña';
    } else if (formData.password1 !== formData.password2) {
      newErrors.password2 = 'Las contraseñas no coinciden';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    try {
      await registerMutation.mutateAsync({
        email: formData.email.trim().toLowerCase(),
        password1: formData.password1,
        password2: formData.password2,
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
      });
    } catch (error) {
      Alert.alert(
        'Error de Registro',
        error instanceof Error ? error.message : 'Error desconocido'
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Crear Cuenta</Text>
              <Text style={styles.subtitle}>
                Únete a NutriTrack IA y comienza tu viaje hacia una mejor nutrición
              </Text>
            </View>

            {/* Form */}
            <View style={styles.form}>
              <View style={styles.row}>
                <View style={[styles.inputContainer, styles.halfWidth]}>
                  <Text style={styles.label}>Nombre</Text>
                  <TextInput
                    style={[styles.input, errors.first_name && styles.inputError]}
                    value={formData.first_name}
                    onChangeText={(value) => updateField('first_name', value)}
                    placeholder="Juan"
                    placeholderTextColor={COLORS.textMuted}
                    autoCapitalize="words"
                    autoComplete="given-name"
                  />
                  {errors.first_name && <Text style={styles.errorText}>{errors.first_name}</Text>}
                </View>

                <View style={[styles.inputContainer, styles.halfWidth]}>
                  <Text style={styles.label}>Apellido</Text>
                  <TextInput
                    style={[styles.input, errors.last_name && styles.inputError]}
                    value={formData.last_name}
                    onChangeText={(value) => updateField('last_name', value)}
                    placeholder="Pérez"
                    placeholderTextColor={COLORS.textMuted}
                    autoCapitalize="words"
                    autoComplete="family-name"
                  />
                  {errors.last_name && <Text style={styles.errorText}>{errors.last_name}</Text>}
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={[styles.input, errors.email && styles.inputError]}
                  value={formData.email}
                  onChangeText={(value) => updateField('email', value)}
                  placeholder="tu@email.com"
                  placeholderTextColor={COLORS.textMuted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                />
                {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Contraseña</Text>
                <TextInput
                  style={[styles.input, errors.password1 && styles.inputError]}
                  value={formData.password1}
                  onChangeText={(value) => updateField('password1', value)}
                  placeholder="Mínimo 8 caracteres"
                  placeholderTextColor={COLORS.textMuted}
                  secureTextEntry
                  autoComplete="new-password"
                />
                {errors.password1 && <Text style={styles.errorText}>{errors.password1}</Text>}
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Confirmar Contraseña</Text>
                <TextInput
                  style={[styles.input, errors.password2 && styles.inputError]}
                  value={formData.password2}
                  onChangeText={(value) => updateField('password2', value)}
                  placeholder="Repite tu contraseña"
                  placeholderTextColor={COLORS.textMuted}
                  secureTextEntry
                  autoComplete="new-password"
                />
                {errors.password2 && <Text style={styles.errorText}>{errors.password2}</Text>}
              </View>

              <TouchableOpacity
                style={[styles.registerButton, registerMutation.isPending && styles.disabledButton]}
                onPress={handleRegister}
                disabled={registerMutation.isPending}
              >
                <Text style={styles.registerButtonText}>
                  {registerMutation.isPending ? 'Creando cuenta...' : 'Crear Cuenta'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>¿Ya tienes cuenta?</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.linkText}>Inicia sesión aquí</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
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
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    marginBottom: 40,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  form: {
    marginBottom: 40,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  inputContainer: {
    marginBottom: 20,
  },
  halfWidth: {
    width: '48%',
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
  registerButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  disabledButton: {
    opacity: 0.6,
  },
  registerButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    color: COLORS.textSecondary,
    fontSize: 16,
  },
  linkText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 4,
  },
});