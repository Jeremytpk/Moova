import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import theme from '../theme';
import { useLanguage } from '../contexts/LanguageContext';

/**
 * PaymentResultModal
 * Shows success or failure after payment processing
 */
export default function PaymentResultModal({ 
  visible, 
  onClose, 
  success,
  amount,
  kg,
}) {
  const { language } = useLanguage();

  // Translations
  const translations = {
    en: {
      paymentSuccess: 'Payment Successful!',
      paymentFailed: 'Payment Failed',
      successMessage: 'Your payment has been processed successfully.',
      failedMessage: 'There was an issue processing your payment. Please try again.',
      paid: 'You paid',
      forKg: 'for',
      kg: 'kg',
      close: 'Close',
      tryAgain: 'Try Again',
    },
    fr: {
      paymentSuccess: 'Paiement Réussi!',
      paymentFailed: 'Paiement Échoué',
      successMessage: 'Votre paiement a été traité avec succès.',
      failedMessage: 'Un problème est survenu lors du traitement de votre paiement. Veuillez réessayer.',
      paid: 'Vous avez payé',
      forKg: 'pour',
      kg: 'kg',
      close: 'Fermer',
      tryAgain: 'Réessayer',
    },
  };

  const text = translations[language];

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Icon */}
          <View style={[styles.iconContainer, success ? styles.successIcon : styles.failureIcon]}>
            {success ? (
              <Ionicons name="checkmark-circle" size={80} color={theme.colors.success} />
            ) : (
              <Ionicons name="close-circle" size={80} color={theme.colors.error} />
            )}
          </View>

          {/* Title */}
          <Text style={styles.title}>
            {success ? text.paymentSuccess : text.paymentFailed}
          </Text>

          {/* Message */}
          <Text style={styles.message}>
            {success ? text.successMessage : text.failedMessage}
          </Text>

          {/* Amount Details (for success) */}
          {success && amount && kg && (
            <View style={styles.detailsCard}>
              <Text style={styles.detailsText}>
                {text.paid} ${amount.toFixed(2)}
              </Text>
              <Text style={styles.detailsSubtext}>
                {text.forKg} {kg}{text.kg}
              </Text>
            </View>
          )}

          {/* Button */}
          <TouchableOpacity
            style={[styles.button, success ? styles.successButton : styles.failureButton]}
            onPress={onClose}
          >
            <Text style={styles.buttonText}>
              {success ? text.close : text.tryAgain}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  successIcon: {
    backgroundColor: 'transparent',
  },
  failureIcon: {
    backgroundColor: 'transparent',
  },
  title: {
    ...theme.typography.h2,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  message: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: theme.spacing.lg,
  },
  detailsCard: {
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
    width: '100%',
    alignItems: 'center',
  },
  detailsText: {
    ...theme.typography.h3,
    color: theme.colors.success,
    fontWeight: 'bold',
    marginBottom: theme.spacing.xs,
  },
  detailsSubtext: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
  },
  button: {
    width: '100%',
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
  },
  successButton: {
    backgroundColor: theme.colors.success,
  },
  failureButton: {
    backgroundColor: theme.colors.error,
  },
  buttonText: {
    ...theme.typography.button,
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
