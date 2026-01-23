import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ActivityIndicator,
} from 'react-native';
import theme from '../theme';

/**
 * PaymentProcessingModal
 * Shows a loading animation while payment is being processed
 */
export default function PaymentProcessingModal({ visible, text }) {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
    >
      <View style={styles.overlay}>
        <View style={styles.content}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.text}>{text || 'Processing...'}</Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    alignItems: 'center',
    minWidth: 200,
  },
  text: {
    ...theme.typography.body,
    color: theme.colors.text,
    marginTop: theme.spacing.md,
    fontWeight: '600',
  },
});
