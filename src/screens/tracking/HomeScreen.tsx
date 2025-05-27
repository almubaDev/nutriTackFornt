import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTodayLog, useTodayTargets, useLogout } from '../../hooks';
import { useAuthStore } from '../../store';
import { COLORS } from '../../constants';
import { formatDate, formatDisplayDate, formatCalories, formatMacro, calculateProgress } from '../../utils';

// Progress Ring Component
const ProgressRing = ({ progress, size = 120, strokeWidth = 8, color = COLORS.primary }: {
  progress: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = `${circumference} ${circumference}`;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <View style={{ width: size, height: size }}>
      <Text style={styles.progressText}>{Math.round(progress)}%</Text>
    </View>
  );
};

// Macro Card Component
const MacroCard = ({ label, current, target, color, unit }: {
  label: string;
  current: number;
  target: number;
  color: string;
  unit: string;
}) => {
  const progress = calculateProgress(current, target);
  
  return (
    <View style={styles.macroCard}>
      <View style={[styles.macroIndicator, { backgroundColor: color }]} />
      <Text style={styles.macroLabel}>{label}</Text>
      <Text style={styles.macroValue}>
        {current.toFixed(1)}{unit}
      </Text>
      <Text style={styles.macroTarget}>
        de {target.toFixed(0)}{unit}
      </Text>
      <View style={styles.macroProgressBar}>
        <View 
          style={[
            styles.macroProgress, 
            { 
              width: `${Math.min(progress, 100)}%`,
              backgroundColor: color 
            }
          ]} 
        />
      </View>
    </View>
  );
};

// Quick Action Button Component
const QuickActionButton = ({ icon, label, onPress, color = COLORS.primary }: {
  icon: string;
  label: string;
  onPress: () => void;
  color?: string;
}) => (
  <TouchableOpacity style={styles.quickActionButton} onPress={onPress}>
    <View style={[styles.quickActionIcon, { backgroundColor: color }]}>
      <Ionicons name={icon as any} size={24} color={COLORS.white} />
    </View>
    <Text style={styles.quickActionLabel}>{label}</Text>
  </TouchableOpacity>
);

export default function HomeScreen({ navigation }: any) {
  const { user } = useAuthStore();
  const {
    data: todayLog,
    isLoading: logLoading,
    refetch: refetchLog,
  } = useTodayLog();
  
  const {
    data: targets,
    isLoading: targetsLoading,
    refetch: refetchTargets,
  } = useTodayTargets();

  const logoutMutation = useLogout();

  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchLog(), refetchTargets()]);
    setRefreshing(false);
  };

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  // Calculate progress
  const caloriesProgress = targets ? calculateProgress(
    todayLog?.total_calories || 0,
    targets.calories
  ) : 0;

  const today = new Date();
  const isToday = true; // Always true for today screen

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
          <View>
            <Text style={styles.greeting}>
              ¡Hola, {user?.first_name || 'Usuario'}!
            </Text>
            <Text style={styles.date}>
              {formatDisplayDate(today)}
            </Text>
          </View>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <Ionicons name="log-out-outline" size={24} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Calories Progress */}
        <View style={styles.caloriesCard}>
          <Text style={styles.cardTitle}>Calorías de Hoy</Text>
          <View style={styles.caloriesContent}>
            <View style={styles.caloriesInfo}>
              <Text style={styles.caloriesConsumed}>
                {todayLog?.total_calories?.toFixed(0) || '0'}
              </Text>
              <Text style={styles.caloriesUnit}>kcal consumidas</Text>
              <Text style={styles.caloriesTarget}>
                Meta: {targets?.calories || '0'} kcal
              </Text>
              <Text style={styles.caloriesRemaining}>
                Restantes: {Math.max(0, (targets?.calories || 0) - (todayLog?.total_calories || 0)).toFixed(0)} kcal
              </Text>
            </View>
            <View style={styles.caloriesProgress}>
              <ProgressRing progress={caloriesProgress} />
            </View>
          </View>
        </View>

        {/* Macronutrients */}
        <View style={styles.macrosSection}>
          <Text style={styles.sectionTitle}>Macronutrientes</Text>
          <View style={styles.macrosGrid}>
            <MacroCard
              label="Proteínas"
              current={todayLog?.total_protein || 0}
              target={targets?.protein || 0}
              color={COLORS.protein}
              unit="g"
            />
            <MacroCard
              label="Carbohidratos"
              current={todayLog?.total_carbs || 0}
              target={targets?.carbs || 0}
              color={COLORS.carbs}
              unit="g"
            />
            <MacroCard
              label="Grasas"
              current={todayLog?.total_fat || 0}
              target={targets?.fat || 0}
              color={COLORS.fat}
              unit="g"
            />
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsSection}>
          <Text style={styles.sectionTitle}>Acciones Rápidas</Text>
          <View style={styles.quickActionsGrid}>
            <QuickActionButton
              icon="camera"
              label="Escanear Alimento"
              onPress={() => navigation.navigate('Scanner')}
              color={COLORS.primary}
            />
            <QuickActionButton
              icon="restaurant"
              label="Registrar Comida"
              onPress={() => navigation.navigate('Scanner')}
              color={COLORS.success}
            />
            <QuickActionButton
              icon="bar-chart"
              label="Ver Historial"
              onPress={() => navigation.navigate('History')}
              color={COLORS.warning}
            />
            <QuickActionButton
              icon="person"
              label="Mi Perfil"
              onPress={() => navigation.navigate('Profile')}
              color={COLORS.secondary}
            />
          </View>
        </View>

        {/* Recent Foods */}
        {todayLog?.food_items && todayLog.food_items.length > 0 && (
          <View style={styles.recentSection}>
            <Text style={styles.sectionTitle}>Alimentos de Hoy</Text>
            <View style={styles.recentFoods}>
              {todayLog.food_items.slice(0, 3).map((item: any, index: number) => (
                <View key={index} style={styles.foodItem}>
                  <View>
                    <Text style={styles.foodName}>{item.name}</Text>
                    <Text style={styles.foodDetails}>
                      {item.quantity}{item.unit} • {formatCalories(item.calories)}
                    </Text>
                  </View>
                  <Text style={styles.mealType}>
                    {item.meal_type_display || item.meal_type}
                  </Text>
                </View>
              ))}
              {todayLog.food_items.length > 3 && (
                <TouchableOpacity
                  style={styles.viewAllButton}
                  onPress={() => navigation.navigate('History')}
                >
                  <Text style={styles.viewAllText}>
                    Ver todos ({todayLog.food_items.length})
                  </Text>
                  <Ionicons name="chevron-forward" size={16} color={COLORS.primary} />
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* Empty State */}
        {(!todayLog?.food_items || todayLog.food_items.length === 0) && (
          <View style={styles.emptyState}>
            <Ionicons name="restaurant-outline" size={48} color={COLORS.textMuted} />
            <Text style={styles.emptyTitle}>¡Comienza tu día!</Text>
            <Text style={styles.emptySubtitle}>
              Registra tu primera comida del día para comenzar el seguimiento
            </Text>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => navigation.navigate('Scanner')}
            >
              <Text style={styles.primaryButtonText}>Registrar Alimento</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100, // Space for tab bar
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  date: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  logoutButton: {
    padding: 8,
  },
  caloriesCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 16,
  },
  caloriesContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  caloriesInfo: {
    flex: 1,
  },
  caloriesConsumed: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  caloriesUnit: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  caloriesTarget: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 8,
  },
  caloriesRemaining: {
    fontSize: 14,
    color: COLORS.success,
    marginTop: 4,
  },
  caloriesProgress: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressText: {
    position: 'absolute',
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    textAlign: 'center',
    top: '45%',
    left: 0,
    right: 0,
  },
  macrosSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 16,
  },
  macrosGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  macroCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    flex: 1,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  macroIndicator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginBottom: 8,
  },
  macroLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginBottom: 4,
  },
  macroValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    textAlign: 'center',
  },
  macroTarget: {
    fontSize: 10,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: 2,
  },
  macroProgressBar: {
    width: '100%',
    height: 4,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 2,
    marginTop: 8,
    overflow: 'hidden',
  },
  macroProgress: {
    height: '100%',
    borderRadius: 2,
  },
  quickActionsSection: {
    marginBottom: 24,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickActionButton: {
    width: '48%',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  quickActionLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
    textAlign: 'center',
  },
  recentSection: {
    marginBottom: 24,
  },
  recentFoods: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    overflow: 'hidden',
  },
  foodItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceLight,
  },
  foodName: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.text,
  },
  foodDetails: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  mealType: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '500',
  },
  viewAllButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    backgroundColor: COLORS.surfaceLight,
  },
  viewAllText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '500',
    marginRight: 4,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    marginTop: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  primaryButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
});