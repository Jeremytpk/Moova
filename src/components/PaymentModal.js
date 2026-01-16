import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import theme from '../theme';
import { useLanguage } from '../contexts/LanguageContext';
import { calculateFeeBreakdown, formatCurrency, getServiceFeeDescription } from '../utils/feeCalculations';

// Conditionally import Stripe only on native platforms
let CardField, useStripe;
if (Platform.OS !== 'web') {
  const StripeReactNative = require('@stripe/stripe-react-native');
  CardField = StripeReactNative.CardField;
  useStripe = StripeReactNative.useStripe;
}

/**
 * PaymentModal
 * Modal for sender to enter payment information
 */
export default function PaymentModal({
  visible,
  onClose,
  paymentRequest, // { kg, amount, pricePerKg, offerId, travelerId, clientSecret }
  onProcessPayment,
}) {
  const { language } = useLanguage();
  const stripe = Platform.OS !== 'web' ? useStripe() : null;
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [cardComplete, setCardComplete] = useState(false);
  const [loading, setLoading] = useState(false);

  // Show message on web platform
  if (Platform.OS === 'web') {
    return (
      <Modal
        visible={visible}
        animationType="slide"
        transparent={true}
        onRequestClose={onClose}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Payment Not Available</Text>
            <Text style={styles.webNotice}>
              Payment processing is only available on mobile devices. Please use the iOS or Android app to complete your payment.
            </Text>
            <TouchableOpacity
              style={[styles.button, styles.submitButton]}
              onPress={onClose}
            >
              <Text style={styles.submitButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  // Calculate fee breakdown
  const feeBreakdown = paymentRequest?.kg && paymentRequest?.pricePerKg
    ? calculateFeeBreakdown(paymentRequest.kg, paymentRequest.pricePerKg)
    : null;

  // Translations
  const translations = {
    en: {
      paymentDetails: 'Payment Details',
      amount: 'Amount',
      forKg: 'for',
      kg: 'kg',
      basePrice: 'Base Price',
      serviceFee: 'Service Fee',
      totalAmount: 'Total Amount',
      personalInfo: 'Personal Information',
      fullName: 'Full Name',
      email: 'Email',
      cardInfo: 'Card Information',
      cardNumber: 'Card Number',
      expiryDate: 'Expiry Date (MM/YY)',
      cvv: 'CVV',
      payNow: 'Pay Now',
      cancel: 'Cancel',
      fillAllFields: 'Please fill all fields',
      invalidEmail: 'Please enter a valid email',
      invalidCard: 'Please enter a valid card number',
      invalidExpiry: 'Please enter a valid expiry date (MM/YY)',
      invalidCvv: 'Please enter a valid CVV',
    },
    fr: {
      paymentDetails: 'Détails du Paiement',
      amount: 'Montant',
      forKg: 'pour',
      kg: 'kg',
      basePrice: 'Prix de Base',
      serviceFee: 'Frais de Service',
      totalAmount: 'Montant Total',
      personalInfo: 'Informations Personnelles',
      fullName: 'Nom Complet',
      email: 'Email',
      cardInfo: 'Informations de Carte',
      cardNumber: 'Numéro de Carte',
      expiryDate: 'Date d\'Expiration (MM/AA)',
      cvv: 'CVV',
      payNow: 'Payer Maintenant',
      cancel: 'Annuler',
      fillAllFields: 'Veuillez remplir tous les champs',
      invalidEmail: 'Veuillez entrer un email valide',
      invalidCard: 'Veuillez entrer un numéro de carte valide',
      invalidExpiry: 'Veuillez entrer une date d\'expiration valide (MM/AA)',
      invalidCvv: 'Veuillez entrer un CVV valide',
    },
  };

  const text = translations[language];

  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSubmit = async () => {
    // Validation
    if (!fullName || !email) {
      Alert.alert('Error', text.fillAllFields);
      return;
    }

    if (!validateEmail(email)) {
      Alert.alert('Error', text.invalidEmail);
      return;
    }

    if (!cardComplete) {
      Alert.alert('Error', 'Please enter valid card details');
      return;
    }

    if (!paymentRequest?.clientSecret) {
      Alert.alert('Error', 'Payment setup failed. Please try again.');
      return;
    }

    setLoading(true);

    try {
      // Confirm payment with Stripe
      const { error, paymentIntent } = await stripe.confirmPayment(paymentRequest.clientSecret, {
        paymentMethodType: 'Card',
        paymentMethodData: {
          billingDetails: {
            name: fullName,
            email: email,
          },
        },
      });

      if (error) {
        console.error('Payment confirmation error:', error);
        Alert.alert('Payment Failed', error.message);
        setLoading(false);
        return;
      }

      if (paymentIntent && paymentIntent.status === 'Succeeded') {
        // Payment successful - call the backend to update the database
        await onProcessPayment({
          fullName,
          email,
          amount: paymentRequest.amount,
          kg: paymentRequest.kg,
          offerId: paymentRequest.offerId,
          travelerId: paymentRequest.travelerId,
          senderId: paymentRequest.senderId,
          paymentIntentId: paymentIntent.id,
        });

        // Reset form
        setFullName('');
        setEmail('');
        setCardComplete(false);
      }
    } catch (error) {
      console.error('Payment error:', error);
      Alert.alert('Error', 'Payment processing failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.modalTitle}>{text.paymentDetails}</Text>

            {/* Amount Summary with Fee Breakdown */}
            {feeBreakdown ? (
              <View style={styles.amountCard}>
                <Text style={styles.amountLabel}>{text.forKg} {paymentRequest?.kg}{text.kg}</Text>

                {/* Fee Breakdown */}
                <View style={styles.feeBreakdown}>
                  <View style={styles.feeRow}>
                    <Text style={styles.feeLabel}>{text.basePrice}</Text>
                    <Text style={styles.feeValue}>{formatCurrency(feeBreakdown.basePrice)}</Text>
                  </View>
                  <View style={styles.feeRow}>
                    <Text style={styles.feeLabel}>{getServiceFeeDescription(feeBreakdown.kg)}</Text>
                    <Text style={styles.feeValue}>{formatCurrency(feeBreakdown.serviceFee)}</Text>
                  </View>
                  <View style={styles.feeDivider} />
                  <View style={styles.feeRow}>
                    <Text style={styles.feeLabelTotal}>{text.totalAmount}</Text>
                    <Text style={styles.feeValueTotal}>{formatCurrency(feeBreakdown.senderTotal)}</Text>
                  </View>
                </View>
              </View>
            ) : (
              <View style={styles.amountCard}>
                <Text style={styles.amountLabel}>{text.amount}</Text>
                <Text style={styles.amountValue}>
                  ${paymentRequest?.amount.toFixed(2)}
                </Text>
                <Text style={styles.kgText}>
                  {text.forKg} {paymentRequest?.kg}{text.kg}
                </Text>
              </View>
            )}

            {/* Personal Information */}
            <Text style={styles.sectionTitle}>{text.personalInfo}</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{text.fullName}</Text>
              <TextInput
                style={styles.input}
                placeholder="John Doe"
                placeholderTextColor={theme.colors.textLight}
                value={fullName}
                onChangeText={setFullName}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{text.email}</Text>
              <TextInput
                style={styles.input}
                placeholder="john@example.com"
                placeholderTextColor={theme.colors.textLight}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            {/* Card Information */}
            <Text style={styles.sectionTitle}>{text.cardInfo}</Text>

            <View style={styles.cardFieldContainer}>
              <CardField
                postalCodeEnabled={false}
                placeholders={{
                  number: '4242 4242 4242 4242',
                }}
                cardStyle={{
                  backgroundColor: '#FFFFFF',
                  textColor: theme.colors.text,
                  placeholderColor: theme.colors.textLight,
                }}
                style={styles.cardField}
                onCardChange={(cardDetails) => {
                  setCardComplete(cardDetails.complete);
                }}
              />
            </View>

            <Text style={styles.testCardHint}>
              Test card: 4242 4242 4242 4242 | Any future date | Any 3 digits
            </Text>

            {/* Buttons */}
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={onClose}
                disabled={loading}
              >
                <Text style={styles.cancelButtonText}>{text.cancel}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.submitButton, loading && styles.buttonDisabled]}
                onPress={handleSubmit}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitButtonText}>
                    {text.payNow}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxHeight: '90%',
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
  },
  modalTitle: {
    ...theme.typography.h2,
    color: theme.colors.text,
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
  },
  amountCard: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  amountLabel: {
    ...theme.typography.caption,
    color: '#FFFFFF',
    opacity: 0.9,
    marginBottom: theme.spacing.xs,
    fontSize: 12,
  },
  amountValue: {
    ...theme.typography.h1,
    color: '#FFFFFF',
    fontSize: 34,
    fontWeight: 'bold',
    marginBottom: theme.spacing.xs,
  },
  kgText: {
    ...theme.typography.body,
    color: '#FFFFFF',
    opacity: 0.9,
    fontSize: 14,
  },
  sectionTitle: {
    ...theme.typography.h3,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
    marginTop: theme.spacing.sm,
    fontSize: 18,
  },
  inputGroup: {
    marginBottom: theme.spacing.md,
  },
  label: {
    ...theme.typography.body,
    color: theme.colors.text,
    fontWeight: '600',
    marginBottom: theme.spacing.xs,
    fontSize: 14,
  },
  input: {
    ...theme.typography.body,
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    paddingVertical: 14,
    color: theme.colors.text,
    borderWidth: 1,
    borderColor: theme.colors.border,
    fontSize: 14,
    minHeight: 38,
  },
  row: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  halfWidth: {
    flex: 1,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginTop: theme.spacing.md,
  },
  button: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: theme.colors.backgroundSecondary,
  },
  cancelButtonText: {
    ...theme.typography.button,
    color: theme.colors.text,
    fontWeight: '600',
    fontSize: 14,
  },
  submitButton: {
    backgroundColor: theme.colors.primary,
  },
  submitButtonText: {
    ...theme.typography.button,
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  cardFieldContainer: {
    marginBottom: theme.spacing.md,
  },
  cardField: {
    width: '100%',
    height: 50,
    marginVertical: theme.spacing.xs,
  },
  testCardHint: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    fontSize: 11,
    fontStyle: 'italic',
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  feeBreakdown: {
    width: '100%',
    marginTop: theme.spacing.md,
  },
  feeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  feeLabel: {
    ...theme.typography.body,
    color: '#FFFFFF',
    opacity: 0.9,
    fontSize: 14,
  },
  feeValue: {
    ...theme.typography.body,
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  feeLabelTotal: {
    ...theme.typography.body,
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  feeValueTotal: {
    ...theme.typography.h2,
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
  },
  feeDivider: {
    height: 1,
    backgroundColor: '#FFFFFF',
    opacity: 0.3,
    marginVertical: theme.spacing.sm,
  },
  webNotice: {
    ...theme.typography.body,
    color: theme.colors.text,
    textAlign: 'center',
    marginVertical: theme.spacing.lg,
    lineHeight: 22,
  },
});
