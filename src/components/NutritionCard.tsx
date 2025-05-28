// src/components/NutritionCard.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants';
import { calculateProgress } from '../utils';

interface MacroInfo {
  label: string;
  current: number;
  target: number;
  color: string;
  unit: string;
}

interface NutritionCardProps {
  title: string;
  calories?: {
    current: number;
    target: number;
  };
  macros?: MacroInfo[];
  onPress?: () => void;
  showProgress?: boolean;
  compact?: boolean;
  style?: any;
}

const MacroBar: React.FC<MacroInfo & { compact?: boolean }> = ({ 
  label, 
  current, 
  target, 
  color, 
  unit, 
  compact = false 
}) => {
  const progress = calculateProgress(current, target);
  
  return (
    <View style={[styles.macroBar, compact && styles.macroBarCompact]}>
      <View style={styles.macroHeader}>
        <View style={styles.macroLabelContainer}>
          <View style={[styles.macroIndicator, { backgroundColor: color }]} />
          <Text style={[styles.macroLabel, compact && styles.macroLabelCompact]}>
            {label}
          </Text>
        </View>
        <Text style={[styles.macroValue, compact && styles.macroValueCompact]}>
          {current.toFixed(compact ? 0 : 1)}{unit}
          {!compact && (
            <Text style={styles.macroTarget}> / {target.toFixed(0)}{unit}</Text>
          )}
        </Text>
      </View>
      
      {!compact && (
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { 
                  width: `${Math.min(progress, 100)}%`,
                  backgroundColor: color 
                }
              ]} 
            />
          </View>
          <Text style={styles.progressText}>{progress.toFixed(0)}%</Text>
        </View>
      )}
    </View>
  );
};

export default function NutritionCard({
  title,
  calories,
  macros = [],
  onPress,
  showProgress = true,
  compact = false,
  style,
}: NutritionCardProps) {
  const CardContent = () => (
    <View style={[styles.card, compact && styles.cardCompact, style]}>
      <View style={styles.cardHeader}>
        <Text style={[styles.cardTitle, compact && styles.cardTitleCompact]}>
          {title}
        </Text>
        {onPress && (
          <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
        )}
      </View>

      {/* Calories Section */}
      {calories && (
        <View style={styles.caloriesSection}>
          <View style={styles.caloriesInfo}>
            <Text style={[styles.caloriesValue, compact && styles.caloriesValueCompact]}>
              {calories.current.toFixed(0)}
            </Text>
            <Text style={[styles.caloriesUnit, compact && styles.caloriesUnitCompact]}>
              kcal
            </Text>
          </View>
          
          {!compact && showProgress && (
            <View style={styles.caloriesProgress}>
              <Text style={styles.caloriesTarget}>
                Meta: {calories.target} kcal
              </Text>
              <Text style={styles.caloriesRemaining}>
                Restantes: {Math.max(0, calories.target - calories.current).toFixed(0)} kcal
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Macros Section */}
      {macros.length > 0 && (
        <View style={styles.macrosSection}>
          {macros.map((macro, index) => (
            <MacroBar
              key={macro.label}
              {...macro}
              compact={compact}
            />
          ))}
        </View>
      )}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        <CardContent />
      </TouchableOpacity>
    );
  }

  return <CardContent />;
}

// Preset para macros estándar
export const standardMacros = (
  protein: { current: number; target: number },
  carbs: { current: number; target: number },
  fat: { current: number; target: number }
): MacroInfo[] => [
  {
    label: 'Proteínas',
    current: protein.current,
    target: protein.target,
    color: COLORS.protein,
    unit: 'g',
  },
  {
    label: 'Carbohidratos',
    current: carbs.current,
    target: carbs.target,
    color: COLORS.carbs,
    unit: 'g',
  },
  {
    label: 'Grasas',
    current: fat.current,
    target: fat.target,
    color: COLORS.fat,
    unit: 'g',
  },
];

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
  },
  cardCompact: {
    padding: 16,
    borderRadius: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  cardTitleCompact: {
    fontSize: 16,
  },
  caloriesSection: {
    marginBottom: 16,
  },
  caloriesInfo: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  caloriesValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  caloriesValueCompact: {
    fontSize: 24,
  },
  caloriesUnit: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginLeft: 4,
  },
  caloriesUnitCompact: {
    fontSize: 14,
  },
  caloriesProgress: {
    gap: 4,
  },
  caloriesTarget: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  caloriesRemaining: {
    fontSize: 14,
    color: COLORS.success,
  },
  macrosSection: {
    gap: 12,
  },
  macroBar: {
    gap: 8,
  },
  macroBarCompact: {
    gap: 4,
  },
  macroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  macroLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  macroIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  macroLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  macroLabelCompact: {
    fontSize: 12,
  },
  macroValue: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  macroValueCompact: {
    fontSize: 14,
  },
  macroTarget: {
    fontSize: 14,
    fontWeight: '400',
    color: COLORS.textMuted,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: '500',
    minWidth: 35,
    textAlign: 'right',
  },
});