// src/screens/profile/ProfileScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Modal,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { 
  useUserProfile, 
  useActiveFitnessGoal, 
  useLogout,
  useUpdateUserProfile
} from '../../hooks';
import { useAuthStore } from '../../store';
import { COLORS, ACTIVITY_LEVELS, FITNESS_GOALS } from '../../constants';
import { calculateBMI, getBMICategory } from '../../utils';

interface EditModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  onSave: () => void;
  isLoading?: boolean;
}

const EditModal: React.FC<EditModalProps> = ({ 
  visible, 
  onClose, 
  title, 
  children, 
  onSave, 
  isLoading = false 
}) => (
  <Modal visible={visible} animationType="slide" transparent>
    <View style={styles.modalOverlay}>
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>{title}</Text>
          <TouchableOpacity 
            onPress={onSave}
            disabled={isLoading}
            style={[styles.saveButton, isLoading && styles.disabledButton]}
          >
            <Text style={styles.saveButtonText}>
              {isLoading ? '...' : 'Guardar'}
            </Text>
          </TouchableOpacity>
        </View>
        <View style={styles.modalContent}>
          {children}
        </View>
      </View>
    </View>
  </Modal>
);

export default function ProfileScreen() {
  const { user } = useAuthStore();
  const {
    data: profile,
    isLoading: profileLoading,
    refetch: refetchProfile,
  } = useUserProfile();
  
  const {
    data: activeGoal,
    isLoading: goalLoading,
    refetch: refetchGoal,
  } = useActiveFitnessGoal();

  const updateProfileMutation = useUpdateUserProfile();
  const logoutMutation = useLogout();

  const [refreshing, setRefreshing] = useState(false);
  const [showPersonalModal, setShowPersonalModal] = useState(false);
  const [showPhysicalModal, setShowPhysicalModal] = useState(false);
  const [personalData, setPersonalData] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
  });
  const [physicalData, setPhysicalData] = useState({
    weight: profile?.weight?.toString() || '',
    height: profile?.height?.toString() || '',
    age: profile?.age?.toString() || '',
    activity_level: profile?.activity_level || 1.55,
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchProfile(), refetchGoal()]);
    setRefreshing(false);
  };

  const handleLogout = () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro que quieres cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Cerrar Sesión', 
          style: 'destructive',
          onPress: () => logoutMutation.mutate()
        },
      ]
    );
  };

  const savePersonalData = async () => {
    try {
      await updateProfileMutation.mutateAsync({
        first_name: personalData.first_name,
        last_name: personalData.last_name,
      });
      setShowPersonalModal(false);
      await refetchProfile();
    } catch (error) {
      Alert.alert('Error', 'No se pudo actualizar la información');
    }
  };

  const savePhysicalData = async () => {
    if (!physicalData.weight || !physicalData.height || !physicalData.age) {
      Alert.alert('Error', 'Todos los campos son requeridos');
      return;
    }

    try {
      await updateProfileMutation.mutateAsync({
        weight: parseFloat(physicalData.weight),
        height: parseFloat(physicalData.height),
        age: parseInt(physicalData.age),
        activity_level: physicalData.activity_level,
      });
      setShowPhysicalModal(false);
      await refetchProfile();
    } catch (error) {
      Alert.alert('Error', 'No se pudo actualizar la información');
    }
  };

  const openPersonalModal = () => {
    setPersonalData({
      first_name: user?.first_name || '',
      last_name: user?.last_name || '',
    });
    setShowPersonalModal(true);
  };

  const openPhysicalModal = () => {
    setPhysicalData({
      weight: profile?.weight?.toString() || '',
      height: profile?.height?.toString() || '',
      age: profile?.age?.toString() || '',
      activity_level: profile?.activity_level || 1.55,
    });
    setShowPhysicalModal(true);
  };

  if (profileLoading || goalLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Cargando perfil...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const bmi = profile ? calculateBMI(profile.weight, profile.height) : 0;
  const bmiCategory = getBMICategory(bmi);
  const activityLabel = ACTIVITY_LEVELS.find(a => a.value === profile?.activity_level)?.label || 'No definido';
  const goalLabel = FITNESS_GOALS.find(g => g.value === activeGoal?.goal_type)?.label || 'No definido';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {user?.first_name?.charAt(0)?.toUpperCase() || 'U'}
              </Text>
            </View>
          </View>
          <Text style={styles.userName}>
            {user?.first_name} {user?.last_name}
          </Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
        </View>

        {/* Personal Information */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Información Personal</Text>
            <TouchableOpacity onPress={openPersonalModal}>
              <Ionicons name="pencil" size={20} color={COLORS.primary} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Nombre</Text>
              <Text style={styles.infoValue}>{user?.first_name || 'No definido'}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Apellido</Text>
              <Text style={styles.infoValue}>{user?.last_name || 'No definido'}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{user?.email}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Miembro desde</Text>
              <Text style={styles.infoValue}>
                {user?.date_joined ? new Date(user.date_joined).toLocaleDateString('es-ES') : 'N/A'}
              </Text>
            </View>
          </View>
        </View>

        {/* Physical Data */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Datos Físicos</Text>
            <TouchableOpacity onPress={openPhysicalModal}>
              <Ionicons name="pencil" size={20} color={COLORS.primary} />
            </TouchableOpacity>
          </View>
          
          {profile ? (
            <View style={styles.infoGrid}>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Peso</Text>
                <Text style={styles.infoValue}>{profile.weight} kg</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Altura</Text>
                <Text style={styles.infoValue}>{profile.height} cm</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Edad</Text>
                <Text style={styles.infoValue}>{profile.age} años</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Género</Text>
                <Text style={styles.infoValue}>
                  {profile.gender === 'male' ? 'Masculino' : 'Femenino'}
                </Text>
              </View>
            </View>
          ) : (
            <TouchableOpacity style={styles.setupButton} onPress={openPhysicalModal}>
              <Text style={styles.setupButtonText}>Configurar datos físicos</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Health Metrics */}
        {profile && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Métricas de Salud</Text>
            
            <View style={styles.metricsGrid}>
              <View style={styles.metricCard}>
                <Text style={styles.metricValue}>{bmi.toFixed(1)}</Text>
                <Text style={styles.metricLabel}>IMC</Text>
                <Text style={styles.metricCategory}>{bmiCategory}</Text>
              </View>
              <View style={styles.metricCard}>
                <Text style={styles.metricValue}>{profile.bmr?.toFixed(0) || '0'}</Text>
                <Text style={styles.metricLabel}>TMB</Text>
                <Text style={styles.metricCategory}>kcal/día</Text>
              </View>
              <View style={styles.metricCard}>
                <Text style={styles.metricValue}>{profile.tdee?.toFixed(0) || '0'}</Text>
                <Text style={styles.metricLabel}>TDEE</Text>
                <Text style={styles.metricCategory}>kcal/día</Text>
              </View>
            </View>
          </View>
        )}

        {/* Activity & Goals */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Actividad y Objetivos</Text>
          
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Nivel de Actividad</Text>
              <Text style={styles.infoValue}>{activityLabel}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Objetivo Fitness</Text>
              <Text style={styles.infoValue}>{goalLabel}</Text>
            </View>
          </View>
        </View>

        {/* AI Usage Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Estadísticas de IA</Text>
          
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Ionicons name="camera" size={24} color={COLORS.primary} />
              <View style={styles.statContent}>
                <Text style={styles.statValue}>0</Text>
                <Text style={styles.statLabel}>Análisis realizados</Text>
              </View>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="trending-up" size={24} color={COLORS.success} />
              <View style={styles.statContent}>
                <Text style={styles.statValue}>0%</Text>
                <Text style={styles.statLabel}>Tasa de éxito</Text>
              </View>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="cash" size={24} color={COLORS.warning} />
              <View style={styles.statContent}>
                <Text style={styles.statValue}>$0.00</Text>
                <Text style={styles.statLabel}>Costo total</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Configuración</Text>
          
          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="notifications" size={24} color={COLORS.textSecondary} />
              <Text style={styles.settingText}>Notificaciones</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="shield-checkmark" size={24} color={COLORS.textSecondary} />
              <Text style={styles.settingText}>Privacidad</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="help-circle" size={24} color={COLORS.textSecondary} />
              <Text style={styles.settingText}>Ayuda y Soporte</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Logout */}
        <TouchableOpacity 
          style={styles.logoutButton} 
          onPress={handleLogout}
          disabled={logoutMutation.isPending}
        >
          <Ionicons name="log-out" size={24} color={COLORS.error} />
          <Text style={styles.logoutText}>
            {logoutMutation.isPending ? 'Cerrando sesión...' : 'Cerrar Sesión'}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Personal Info Edit Modal */}
      <EditModal
        visible={showPersonalModal}
        onClose={() => setShowPersonalModal(false)}
        title="Editar Información Personal"
        onSave={savePersonalData}
        isLoading={updateProfileMutation.isPending}
      >
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Nombre</Text>
          <TextInput
            style={styles.input}
            value={personalData.first_name}
            onChangeText={(text) => setPersonalData(prev => ({ ...prev, first_name: text }))}
            placeholder="Tu nombre"
            placeholderTextColor={COLORS.textMuted}
          />
        </View>
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Apellido</Text>
          <TextInput
            style={styles.input}
            value={personalData.last_name}
            onChangeText={(text) => setPersonalData(prev => ({ ...prev, last_name: text }))}
            placeholder="Tu apellido"
            placeholderTextColor={COLORS.textMuted}
          />
        </View>
      </EditModal>

      {/* Physical Data Edit Modal */}
      <EditModal
        visible={showPhysicalModal}
        onClose={() => setShowPhysicalModal(false)}
        title="Editar Datos Físicos"
        onSave={savePhysicalData}
        isLoading={updateProfileMutation.isPending}
      >
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Peso (kg)</Text>
          <TextInput
            style={styles.input}
            value={physicalData.weight}
            onChangeText={(text) => setPhysicalData(prev => ({ ...prev, weight: text }))}
            placeholder="70"
            placeholderTextColor={COLORS.textMuted}
            keyboardType="numeric"
          />
        </View>
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Altura (cm)</Text>
          <TextInput
            style={styles.input}
            value={physicalData.height}
            onChangeText={(text) => setPhysicalData(prev => ({ ...prev, height: text }))}
            placeholder="175"
            placeholderTextColor={COLORS.textMuted}
            keyboardType="numeric"
          />
        </View>
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Edad</Text>
          <TextInput
            style={styles.input}
            value={physicalData.age}
            onChangeText={(text) => setPhysicalData(prev => ({ ...prev, age: text }))}
            placeholder="25"
            placeholderTextColor={COLORS.textMuted}
            keyboardType="numeric"
          />
        </View>
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Nivel de Actividad</Text>
          <View style={styles.activityList}>
            {ACTIVITY_LEVELS.map((level) => (
              <TouchableOpacity
                key={level.value}
                style={[
                  styles.activityOption,
                  physicalData.activity_level === level.value && styles.activityOptionActive,
                ]}
                onPress={() => setPhysicalData(prev => ({ ...prev, activity_level: level.value }))}
              >
                <Text style={[
                  styles.activityOptionText,
                  physicalData.activity_level === level.value && styles.activityOptionTextActive,
                ]}>
                  {level.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </EditModal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  infoGrid: {
    gap: 12,
  },
  infoItem: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
  },
  infoLabel: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: COLORS.text,
    fontWeight: '500',
  },
  setupButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  setupButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  metricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  metricCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  metricCategory: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  statsContainer: {
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
  },
  statContent: {
    marginLeft: 16,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  statLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingText: {
    fontSize: 16,
    color: COLORS.text,
    marginLeft: 12,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: COLORS.error + '40',
  },
  logoutText: {
    fontSize: 16,
    color: COLORS.error,
    fontWeight: '600',
    marginLeft: 8,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
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
  saveButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  saveButtonText: {
    color: COLORS.white,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.6,
  },
  modalContent: {
    padding: 20,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
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
  activityList: {
    gap: 8,
  },
  activityOption: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.surfaceLight,
    borderRadius: 8,
    padding: 12,
  },
  activityOptionActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  activityOptionText: {
    fontSize: 14,
    color: COLORS.text,
  },
  activityOptionTextActive: {
    color: COLORS.white,
    fontWeight: '600',
  },
});