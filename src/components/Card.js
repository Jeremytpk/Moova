import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import theme from '../theme';

/**
 * Reusable Card Component
 * Professional card container with shadow
 */
export default function Card({ children, onPress, style }) {
  const Container = onPress ? TouchableOpacity : View;
  
  return (
    <Container
      style={[styles.card, style]}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      {children}
    </Container>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    ...theme.shadows.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
});
