// src/screens/history/HistoryScreen.tsx
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTodayLog, useNutritionSummary } from '../../hooks';
import { COLORS } from '../../constants';
import { formatDisplayDate, formatCalories, formatMacro, calculateProgress } from '../../utils';

interface DayLogItemProps {
  date: string;
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  foodItems: any[];
  calorieTarget?: number;
  onPress: () => void;
}

const DayLogItem: React.FC<DayLogItemProps> = ({
  date,
  totalCalories,
  totalProtein,
  totalCarbs,
  totalFat,
  foodItems,
  calorieTarget = 2000,
  onPress,
}) => {
  const progress = calculateProgress(totalCalories, calorieTarget);
  const displayDate = new Date(date);
  const isToday = displayDate.toDateString() === new Date().toDateString();
  const isYesterday = displayDate.toDateString() === new Date(Date.now() - 86400000).toDateString();
  
  let dateLabel = formatDisplayDate(displayDate);
  if (isToday) dateLabel = 'Hoy';
  else if (isYesterday) dateLabel = 'Ayer';
  else dateLabel = displayDate.toLocaleDateString('es-ES', { 
    weekday: 'long', 
    month: 'short', 
    day: 'numeric' 
  });

  return (
    <TouchableOpacity style={styles.dayLogItem} onPress={onPress}>
      <View style={styles.dayLogHeader}>
        <View>
          <Text style={styles.dayLogDate}>{dateLabel}</Text>
          <Text style={styles.dayLogMeals}>
            {foodItems.length} {foodItems.length === 1 ? 'alimento' : 'alimentos'}
          </Text>
        </View>
        <View style={styles.dayLogCalories}>
          <Text style={styles.caloriesValue}>{totalCalories.toFixed(0)}</Text>
          <Text style={styles.caloriesUnit}>kcal</Text>
        </View>
      </View>

      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { 
                width: `${Math.min(progress, 100)}%`,
                backgroundColor: progress > 110 ? COLORS.error : 
                               progress > 90 ? COLORS.success : COLORS.primary
              }
            ]} 
          />
        </View>
        <Text style={styles.progressText}>
          {progress.toFixed(0)}% de tu meta
        </Text>
      </View>

      <View style={styles.macrosRow}>
        <View style={styles.macroItem}>
          <View style={[styles.macroIndicator, { backgroundColor: COLORS.protein }]} />
          <Text style={styles.macroText}>{totalProtein.toFixed(0)}g P</Text>
        </View>
        <View style={styles.macroItem}>
          <View style={[styles.macroIndicator, { backgroundColor: COLORS.carbs }]} />
          <Text style={styles.macroText}>{totalCarbs.toFixed(0)}g C</Text>
        </View>
        <View style={styles.macroItem}>
          <View style={[styles.macroIndicator, { backgroundColor: COLORS.fat }]} />
          <Text style={styles.macroText}>{totalFat.toFixed(0)}g G</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

interface FoodItemProps {
  name: string;
  quantity: number;
  unit: string;
  calories: number;
  mealType: string;
}

const FoodItem: React.FC<FoodItemProps> = ({
  name,
  quantity,
  unit,
  calories,
  mealType,
}) => {
  const getMealIcon = (type: string) => {
    switch (type) {
      case 'breakfast': return 'sunny';
      case 'lunch': return 'restaurant';
      case 'dinner': return 'moon';
      case 'snack': return 'cafe';
      default: return 'nutrition';
    }
  };

  const getMealLabel = (type: string) => {
    switch (type) {
      case 'breakfast': return 'Desayuno';
      case 'lunch': return 'Almuerzo';
      case 'dinner': return 'Cena';
      case 'snack': return 'Snack';
      default: return 'Otro';
    }
  };

  return (
    <View style={styles.foodItem}>
      <View style={styles.foodItemLeft}>
        <View style={styles.mealIconContainer}>
          <Ionicons name={getMealIcon(mealType)} size={16} color={COLORS.primary} />
        </View>
        <View style={styles.foodItemInfo}>
          <Text style={styles.foodItemName}>{name}</Text>
          <Text style={styles.foodItemDetails}>
            {quantity}{unit} • {getMealLabel(mealType)}
          </Text>
        </View>
      </View>
      <Text style={styles.foodItemCalories}>{calories.toFixed(0)} kcal</Text>
    </View>
  );
};

interface PeriodStatsProps {
  totalDays: number;
  avgCalories: number;
  avgProtein: number;
  avgCarbs: number;
  avgFat: number;
}

const PeriodStats: React.FC<PeriodStatsProps> = ({
  totalDays,
  avgCalories,
  avgProtein,
  avgCarbs,
  avgFat,
}) => (
  <View style={styles.statsContainer}>
    <Text style={styles.statsTitle}>Resumen de los últimos 7 días</Text>
    
    <View style={styles.statsGrid}>
      <View style={styles.statCard}>
        <Text style={styles.statValue}>{totalDays}</Text>
        <Text style={styles.statLabel}>Días registrados</Text>
      </View>
      <View style={styles.statCard}>
        <Text style={styles.statValue}>{avgCalories.toFixed(0)}</Text>
        <Text style={styles.statLabel}>Promedio kcal</Text>
      </View>
      <View style={styles.statCard}>
        <Text style={styles.statValue}>{avgProtein.toFixed(0)}g</Text>
        <Text style={styles.statLabel}>Promedio proteínas</Text>
      </View>
      <View style={styles.statCard}>
        <Text style={styles.statValue}>{avgCarbs.toFixed(0)}g</Text>
        <Text style={styles.statLabel}>Promedio carbos</Text>
      </View>
    </View>
  </View>
);

export default function HistoryScreen({ navigation }: any) {
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month'>('week');
  const [selectedDay, setSelectedDay] = useState<any>(null);
  const [showDayDetail, setShowDayDetail] = useState(false);

  const {
    data: summaryData,
    isLoading: summaryLoading,
    refetch: refetchSummary,
  } = useNutritionSummary();

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetchSummary();
    setRefreshing(false);
  }, [refetchSummary]);

  const openDayDetail = (dayLog: any) => {
    setSelectedDay(dayLog);
    setShowDayDetail(true);
  };

  const renderDayLog = ({ item }: { item: any }) => (
    <DayLogItem
      date={item.date}
      totalCalories={item.total_calories || 0}
      totalProtein={item.total_protein || 0}
      totalCarbs={item.total_carbs || 0}
      totalFat={item.total_fat || 0}
      foodItems={item.food_items || []}
      calorieTarget={2000} // TODO: Obtener de targets reales
      onPress={() => openDayDetail(item)}
    />
  );

  const renderFoodItem = ({ item }: { item: any }) => (
    <FoodItem
      name={item.name}
      quantity={item.quantity}
      unit={item.unit}
      calories={item.calories}
      mealType={item.meal_type}
    />
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="bar-chart-outline" size={64} color={COLORS.textMuted} />
      <Text style={styles.emptyTitle}>Sin historial aún</Text>
      <Text style={styles.emptySubtitle}>
        Comienza a registrar tus alimentos para ver tu historial nutricional aquí
      </Text>
      <TouchableOpacity
        style={styles.emptyButton}
        onPress={() => navigation.navigate('Scanner')}
      >
        <Text style={styles.emptyButtonText}>Registrar Alimento</Text>
      </TouchableOpacity>
    </View>
  );

  if (summaryLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Cargando historial...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const dailyLogs = summaryData?.daily_logs || [];
  const averages = summaryData?.averages || {
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Historial</Text>
        <View style={styles.periodSelector}>
          <TouchableOpacity
            style={[
              styles.periodButton,
              selectedPeriod === 'week' && styles.periodButtonActive,
            ]}
            onPress={() => setSelectedPeriod('week')}
          >
            <Text
              style={[
                styles.periodButtonText,
                selectedPeriod === 'week' && styles.periodButtonTextActive,
              ]}
            >
              7 días
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.periodButton,
              selectedPeriod === 'month' && styles.periodButtonActive,
            ]}
            onPress={() => setSelectedPeriod('month')}
          >
            <Text
              style={[
                styles.periodButtonText,
                selectedPeriod === 'month' && styles.periodButtonTextActive,
              ]}
            >
              30 días
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {dailyLogs.length > 0 && (
        <PeriodStats
          totalDays={summaryData?.days_logged || 0}
          avgCalories={averages.calories}
          avgProtein={averages.protein}
          avgCarbs={averages.carbs}
          avgFat={averages.fat}
        />
      )}

      <FlatList
        data={dailyLogs}
        renderItem={renderDayLog}
        keyExtractor={(item) => item.date}
        contentContainerStyle={[
          styles.listContent,
          dailyLogs.length === 0 && styles.listContentEmpty
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
          />
        }
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />

      {/* Day Detail Modal */}
      {showDayDetail && selectedDay && (
        <View style={styles.modalOverlay}>
          <View style={styles.dayDetailModal}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowDayDetail(false)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>
                {formatDisplayDate(new Date(selectedDay.date))}
              </Text>
              <View style={{ width: 24 }} />
            </View>

            <View style={styles.dayDetailContent}>
              <View style={styles.dayTotals}>
                <Text style={styles.dayTotalsTitle}>Totales del día</Text>
                <View style={styles.dayTotalsGrid}>
                  <View style={styles.totalItem}>
                    <Text style={styles.totalValue}>
                      {selectedDay.total_calories?.toFixed(0) || '0'}
                    </Text>
                    <Text style={styles.totalLabel}>Calorías</Text>
                  </View>
                  <View style={styles.totalItem}>
                    <Text style={styles.totalValue}>
                      {selectedDay.total_protein?.toFixed(0) || '0'}g
                    </Text>
                    <Text style={styles.totalLabel}>Proteínas</Text>
                  </View>
                  <View style={styles.totalItem}>
                    <Text style={styles.totalValue}>
                      {selectedDay.total_carbs?.toFixed(0) || '0'}g
                    </Text>
                    <Text style={styles.totalLabel}>Carbohidratos</Text>
                  </View>
                  <View style={styles.totalItem}>
                    <Text style={styles.totalValue}>
                      {selectedDay.total_fat?.toFixed(0) || '0'}g
                    </Text>
                    <Text style={styles.totalLabel}>Grasas</Text>
                  </View>
                </View>
              </View>

              <Text style={styles.foodListTitle}>Alimentos registrados</Text>
              <FlatList
                data={selectedDay.food_items || []}
                renderItem={renderFoodItem}
                keyExtractor={(item, index) => `${item.name}-${index}`}
                style={styles.foodList}
                showsVerticalScrollIndicator={false}
              />
            </View>
          </View>
        </View>
      )}
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
    marginTop: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    padding: 4,
  },
  periodButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  periodButtonActive: {
    backgroundColor: COLORS.primary,
  },
  periodButtonText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  periodButtonTextActive: {
    color: COLORS.white,
  },
  statsContainer: {
    margin: 20,
    marginTop: 0,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  statCard: {
    width: '48%',
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  listContent: {
    padding: 20,
    paddingTop: 0,
  },
  listContentEmpty: {
    flex: 1,
  },
  dayLogItem: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  dayLogHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  dayLogDate: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  dayLogMeals: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  dayLogCalories: {
    alignItems: 'flex-end',
  },
  caloriesValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  caloriesUnit: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressBar: {
    height: 6,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  macrosRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  macroItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  macroIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  macroText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 24,
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
    marginBottom: 32,
  },
  emptyButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  emptyButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  // Modal Styles
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  dayDetailModal: {
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
  dayDetailContent: {
    padding: 20,
  },
  dayTotals: {
    marginBottom: 24,
  },
  dayTotalsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 16,
  },
  dayTotalsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  totalItem: {
    width: '48%',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 4,
  },
  totalLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  foodListTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 16,
  },
  foodList: {
    maxHeight: 300,
  },
  foodItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  foodItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  mealIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  foodItemInfo: {
    flex: 1,
  },
  foodItemName: {
    fontSize: 16,
    color: COLORS.text,
    fontWeight: '500',
    marginBottom: 2,
  },
  foodItemDetails: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  foodItemCalories: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
  },
});