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
} from 'react-native';
import theme from '../theme';
import { useLanguage } from '../contexts/LanguageContext';

/**
 * PaymentModal
 * Modal for sender to enter payment information
 */
export default function PaymentModal({ 
  visible, 
  onClose, 
  paymentRequest, // { kg, amount, offerId, travelerId }
  onProcessPayment,
}) {
  const { language } = useLanguage();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [loading, setLoading] = useState(false);

  // Translations
  const translations = {
    en: {
      paymentDetails: 'Payment Details',
      amount: 'Amount',
      forKg: 'for',
      kg: 'kg',
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

  const validateCardNumber = (number) => {
    const cleaned = number.replace(/\s/g, '');
    return /^\d{16}$/.test(cleaned);
  };

  const validateExpiry = (expiry) => {
    return /^\d{2}\/\d{2}$/.test(expiry);
  };

  const validateCvv = (cvv) => {
    return /^\d{3,4}$/.test(cvv);
  };

  const handleCardNumberChange = (value) => {
    // Format card number with spaces (XXXX XXXX XXXX XXXX)
    const cleaned = value.replace(/\s/g, '');
    const formatted = cleaned.match(/.{1,4}/g)?.join(' ') || cleaned;
    setCardNumber(formatted.substring(0, 19)); // Max 16 digits + 3 spaces
  };

  const handleExpiryChange = (value) => {
    // Format expiry date (MM/YY)
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length >= 2) {
      setExpiryDate(cleaned.substring(0, 2) + '/' + cleaned.substring(2, 4));
    } else {
      setExpiryDate(cleaned);
    }
  };

  const handleSubmit = async () => {
    // Validation
    if (!fullName || !email || !cardNumber || !expiryDate || !cvv) {
      Alert.alert('Error', text.fillAllFields);
      return;
    }

    if (!validateEmail(email)) {
      Alert.alert('Error', text.invalidEmail);
      return;
    }

    if (!validateCardNumber(cardNumber)) {
      Alert.alert('Error', text.invalidCard);
      return;
    }

    if (!validateExpiry(expiryDate)) {
      Alert.alert('Error', text.invalidExpiry);
      return;
    }

    if (!validateCvv(cvv)) {
      Alert.alert('Error', text.invalidCvv);
      return;
    }

    setLoading(true);

    try {
      // Process payment
      await onProcessPayment({
        fullName,
        email,
        cardNumber: cardNumber.replace(/\s/g, ''),
        expiryDate,
        cvv,
        amount: paymentRequest.amount,
        kg: paymentRequest.kg,
        offerId: paymentRequest.offerId,
        travelerId: paymentRequest.travelerId,
        senderId: paymentRequest.senderId,
      });

      // Reset form
      setFullName('');
      setEmail('');
      setCardNumber('');
      setExpiryDate('');
      setCvv('');
    } catch (error) {
      console.error('Payment error:', error);
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

            {/* Amount Summary */}
            <View style={styles.amountCard}>
              <Text style={styles.amountLabel}>{text.amount}</Text>
              <Text style={styles.amountValue}>
                ${paymentRequest?.amount.toFixed(2)}
              </Text>
              <Text style={styles.kgText}>
                {text.forKg} {paymentRequest?.kg}{text.kg}
              </Text>
            </View>

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

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{text.cardNumber}</Text>
              <TextInput
                style={styles.input}
                placeholder="1234 5678 9012 3456"
                placeholderTextColor={theme.colors.textLight}
                value={cardNumber}
                onChangeText={handleCardNumberChange}
                keyboardType="number-pad"
                maxLength={19}
              />
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, styles.halfWidth]}>
                <Text style={styles.label}>{text.expiryDate}</Text>
                <TextInput
                  style={styles.input}
                  placeholder="MM/YY"
                  placeholderTextColor={theme.colors.textLight}
                  value={expiryDate}
                  onChangeText={handleExpiryChange}
                  keyboardType="number-pad"
                  maxLength={5}
                />
              </View>

              <View style={[styles.inputGroup, styles.halfWidth]}>
                <Text style={styles.label}>{text.cvv}</Text>
                <TextInput
                  style={styles.input}
                  placeholder="123"
                  placeholderTextColor={theme.colors.textLight}
                  value={cvv}
                  onChangeText={setCvv}
                  keyboardType="number-pad"
                  maxLength={4}
                  secureTextEntry
                />
              </View>
            </View>

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
                <Text style={styles.submitButtonText}>
                  {text.payNow}
                </Text>
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
});
