import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import theme from '../theme';

/**
 * Reusable Button Component
 * Supports primary, secondary, and outline variants
 */
export default function Button({ 
  title, 
  onPress, 
  variant = 'primary', 
  disabled = false,
  loading = false,
  style,
  textStyle,
}) {
  const buttonStyles = [
    styles.button,
    variant === 'primary' && styles.primaryButton,
    variant === 'secondary' && styles.secondaryButton,
    variant === 'outline' && styles.outlineButton,
    disabled && styles.disabledButton,
    style,
  ];

  const textStyles = [
    styles.buttonText,
    variant === 'primary' && styles.primaryText,
    variant === 'secondary' && styles.secondaryText,
    variant === 'outline' && styles.outlineText,
    disabled && styles.disabledText,
    textStyle,
  ];

  return (
    <TouchableOpacity
      style={buttonStyles}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator 
          color={variant === 'primary' ? theme.colors.background : theme.colors.primary} 
        />
      ) : (
        <Text style={textStyles}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  primaryButton: {
    backgroundColor: theme.colors.primary,
    ...theme.shadows.sm,
  },
  secondaryButton: {
    backgroundColor: theme.colors.success,
    ...theme.shadows.sm,
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  disabledButton: {
    backgroundColor: theme.colors.disabled,
    borderColor: theme.colors.disabled,
  },
  buttonText: {
    ...theme.typography.button,
  },
  primaryText: {
    color: theme.colors.background,
  },
  secondaryText: {
    color: theme.colors.background,
  },
  outlineText: {
    color: theme.colors.primary,
  },
  disabledText: {
    color: theme.colors.textLight,
  },
});
