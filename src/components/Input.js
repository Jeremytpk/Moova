import React from 'react';
import { View, TextInput, Text, StyleSheet } from 'react-native';
import theme from '../theme';

/**
 * Reusable Input Component
 * Themed text input with label and error state
 */
export default function Input({ 
  label, 
  value, 
  onChangeText, 
  placeholder,
  error,
  secureTextEntry = false,
  keyboardType = 'default',
  multiline = false,
  numberOfLines = 1,
  editable = true,
  style,
}) {
  return (
    <View style={[styles.container, style]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        style={[
          styles.input,
          multiline && styles.multilineInput,
          error && styles.inputError,
          !editable && styles.inputDisabled,
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.textLight}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        multiline={multiline}
        numberOfLines={multiline ? numberOfLines : 1}
        editable={editable}
      />
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.md,
  },
  label: {
    ...theme.typography.bodySmall,
    color: theme.colors.text,
    fontWeight: '600',
    marginBottom: theme.spacing.xs,
  },
  input: {
    ...theme.typography.body,
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm + 4,
    color: theme.colors.text,
    minHeight: 48,
  },
  multilineInput: {
    minHeight: 100,
    paddingTop: theme.spacing.md,
    textAlignVertical: 'top',
  },
  inputError: {
    borderColor: theme.colors.error,
  },
  inputDisabled: {
    backgroundColor: theme.colors.backgroundSecondary,
    color: theme.colors.textSecondary,
  },
  errorText: {
    ...theme.typography.caption,
    color: theme.colors.error,
    marginTop: theme.spacing.xs,
  },
});
