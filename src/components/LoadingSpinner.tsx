// src/components/LoadingSpinner.tsx
import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { COLORS } from '../constants';

interface LoadingSpinnerProps {
  size?: 'small' | 'large';
  color?: string;
  text?: string;
  overlay?: boolean;
  style?: any;
}

export default function LoadingSpinner({
  size = 'large',
  color = COLORS.primary,
  text,
  overlay = false,
  style,
}: LoadingSpinnerProps) {
  const Container = overlay ? OverlayContainer : InlineContainer;

  return (
    <Container style={style}>
      <ActivityIndicator size={size} color={color} />
      {text && (
        <Text style={[styles.text, { color }]}>
          {text}
        </Text>
      )}
    </Container>
  );
}

// Componente para loading inline
const InlineContainer: React.FC<{ children: React.ReactNode; style?: any }> = ({
  children,
  style,
}) => (
  <View style={[styles.inlineContainer, style]}>
    {children}
  </View>
);

// Componente para loading con overlay
const OverlayContainer: React.FC<{ children: React.ReactNode; style?: any }> = ({
  children,
  style,
}) => (
  <View style={[styles.overlayContainer, style]}>
    <View style={styles.overlayContent}>
      {children}
    </View>
  </View>
);

// Componente específico para pantallas completas
export const FullScreenLoader: React.FC<{
  text?: string;
  color?: string;
}> = ({ text = 'Cargando...', color = COLORS.primary }) => (
  <View style={styles.fullScreenContainer}>
    <ActivityIndicator size="large" color={color} />
    <Text style={[styles.fullScreenText, { color }]}>
      {text}
    </Text>
  </View>
);

// Componente para estados de carga en listas
export const ListLoader: React.FC<{
  text?: string;
  color?: string;
}> = ({ text = 'Cargando más...', color = COLORS.primary }) => (
  <View style={styles.listContainer}>
    <ActivityIndicator size="small" color={color} />
    <Text style={[styles.listText, { color }]}>
      {text}
    </Text>
  </View>
);

// Componente para botones con loading
export const ButtonLoader: React.FC<{
  size?: 'small' | 'large';
  color?: string;
}> = ({ size = 'small', color = COLORS.white }) => (
  <ActivityIndicator size={size} color={color} />
);

const styles = StyleSheet.create({
  inlineContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  overlayContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  overlayContent: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    minWidth: 120,
  },
  text: {
    fontSize: 16,
    marginTop: 12,
    textAlign: 'center',
  },
  fullScreenContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
  },
  fullScreenText: {
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
  },
  listContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  listText: {
    fontSize: 14,
    marginLeft: 8,
  },
});