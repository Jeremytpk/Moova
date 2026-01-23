import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import theme from '../theme';
import { useLanguage } from '../contexts/LanguageContext';
import { calculateFeeBreakdown, formatCurrency, getServiceFeeDescription } from '../utils/feeCalculations';

/**
 * PaymentDetails
 * Shows fee breakdown before proceeding to payment
 */
export default function PaymentDetails({
  visible,
  onClose,
  onContinue,
  kg,
  baseAmount, // The price sent by traveler in the chat
}) {
  const { language } = useLanguage();

  // Calculate fee breakdown using baseAmount and kg
  const pricePerKg = kg && baseAmount ? baseAmount / kg : 0;
  const feeBreakdown = kg && pricePerKg
    ? calculateFeeBreakdown(kg, pricePerKg)
    : null;

  // Animation
  const [fadeAnim] = React.useState(new Animated.Value(0));
  const [slideAnim] = React.useState(new Animated.Value(50));

  React.useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 65,
          friction: 11,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      fadeAnim.setValue(0);
      slideAnim.setValue(50);
    }
  }, [visible]);

  // Translations
  const translations = {
    en: {
      title: 'Payment Details',
      subtitle: 'Review your order before payment',
      shipmentDetails: 'Shipment Details',
      weight: 'Weight',
      price: 'Price',
      serviceFee: 'Service Fee',
      total: 'Total',
      continue: 'Continue to Payment',
      cancel: 'Cancel',
    },
    fr: {
      title: 'Détails du Paiement',
      subtitle: 'Vérifiez votre commande avant le paiement',
      shipmentDetails: 'Détails de l\'Envoi',
      weight: 'Poids',
      price: 'Prix',
      serviceFee: 'Frais de Service',
      total: 'Total',
      continue: 'Continuer vers le Paiement',
      cancel: 'Annuler',
    },
  };

  const text = translations[language] || translations.en;

  if (!feeBreakdown) return null;

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent={true}
      onRequestClose={onClose}
    >
      <Animated.View style={[styles.modalOverlay, { opacity: fadeAnim }]}>
        <Animated.View
          style={[
            styles.modalContent,
            { transform: [{ translateY: slideAnim }] }
          ]}
        >
          {/* Header */}
          <View style={styles.headerContainer}>
            <Text style={styles.modalTitle}>{text.title}</Text>
            <Text style={styles.subtitle}>{text.subtitle}</Text>
          </View>

          {/* Shipment Details */}
          <View style={styles.detailsCard}>
            <Text style={styles.sectionTitle}>{text.shipmentDetails}</Text>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>{text.weight}</Text>
              <Text style={styles.detailValue}>{kg} kg</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>{text.price}</Text>
              <Text style={styles.detailValue}>{formatCurrency(baseAmount)}</Text>
            </View>
          </View>

          {/* Price Breakdown */}
          <View style={styles.priceCard}>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>{text.price}</Text>
              <Text style={styles.priceValue}>{formatCurrency(baseAmount)}</Text>
            </View>

            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>{getServiceFeeDescription(kg)}</Text>
              <Text style={styles.priceValue}>{formatCurrency(feeBreakdown.serviceFee)}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.priceRow}>
              <Text style={styles.totalLabel}>{text.total}</Text>
              <Text style={styles.totalValue}>{formatCurrency(feeBreakdown.senderTotal)}</Text>
            </View>
          </View>

          {/* Buttons */}
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onClose}
            >
              <Text style={styles.cancelButtonText}>{text.cancel}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.continueButton]}
              onPress={() => onContinue(feeBreakdown.senderTotal)}
            >
              <Text style={styles.continueButtonText}>{text.continue}</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '92%',
    maxWidth: 400,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 20,
      },
      android: {
        elevation: 10,
      },
      web: {
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
      },
    }),
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
  },
  detailsCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 15,
    color: '#333333',
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  priceCard: {
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  priceLabel: {
    fontSize: 15,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  priceValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  divider: {
    height: 1,
    backgroundColor: '#FFFFFF',
    opacity: 0.3,
    marginVertical: 12,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  totalValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#F5F5F5',
    flex: 0.35,
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#666666',
    fontWeight: '600',
  },
  continueButton: {
    backgroundColor: theme.colors.primary,
    flex: 0.65,
  },
  continueButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
