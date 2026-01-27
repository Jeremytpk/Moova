import React, { useState, useEffect, useMemo } from 'react';
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
  Animated,
  KeyboardAvoidingView,
} from 'react-native';
import theme from '../theme';
import { useLanguage } from '../contexts/LanguageContext';

// --- PLATFORM SPECIFIC IMPORTS ---
// We use 'require' for Native-only modules to prevent Web bundler errors.
let CardField, PlatformPay, useStripeNative;
if (Platform.OS !== 'web') {
  const StripeNative = require('@stripe/stripe-react-native');
  CardField = StripeNative.CardField;
  PlatformPay = StripeNative.PlatformPay;
  useStripeNative = StripeNative.useStripe;
}

// Import Stripe Web SDK (only used on web)
import * as StripeWeb from '@stripe/react-stripe-js';

export default function PaymentModal({
  visible,
  onClose,
  paymentRequest,
  onProcessPayment,
}) {
  const { language } = useLanguage();

  // --- HOOKS (Must be top-level and unconditional) ---
  const stripeNative = Platform.OS !== 'web' ? useStripeNative() : null;
  const stripeWeb = Platform.OS === 'web' ? StripeWeb.useStripe() : null;
  const elementsWeb = Platform.OS === 'web' ? StripeWeb.useElements() : null;

  // Form state
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [cardComplete, setCardComplete] = useState(false);
  const [loading, setLoading] = useState(false);

  // Animation state
  const fadeAnim = useMemo(() => new Animated.Value(0), []);
  const slideAnim = useMemo(() => new Animated.Value(50), []);

  const translations = {
    en: {
      paymentDetails: 'Complete Payment',
      securePayment: 'Secure payment powered by Stripe',
      personalInfo: 'Billing Information',
      fullName: 'Full Name',
      email: 'Email Address',
      cardInfo: 'Card Information',
      payNow: 'Pay',
      cancel: 'Cancel',
      processing: 'Processing...',
      fillAllFields: 'Please fill all fields',
      invalidEmail: 'Invalid email address',
    },
    fr: {
      paymentDetails: 'Finaliser le Paiement',
      securePayment: 'Paiement sécurisé par Stripe',
      personalInfo: 'Informations de Facturation',
      fullName: 'Nom Complet',
      email: 'Adresse Email',
      cardInfo: 'Informations de Carte',
      payNow: 'Payer',
      cancel: 'Annuler',
      processing: 'Traitement...',
      fillAllFields: 'Veuillez remplir tous les champs',
      invalidEmail: 'Email invalide',
    },
  };

  const text = translations[language] || translations.en;

  // Handle Modal Animations
  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, tension: 65, friction: 11, useNativeDriver: true }),
      ]).start();
    } else {
      fadeAnim.setValue(0);
      slideAnim.setValue(50);
    }
  }, [visible, fadeAnim, slideAnim]);

  const validateEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

  // --- PAYMENT LOGIC ---

  const handleNativePayment = async () => {
    if (!stripeNative || !paymentRequest?.clientSecret) {
      Alert.alert('Error', 'Payment system not initialized');
      return;
    }

    setLoading(true);
    try {
      const { error, paymentIntent } = await stripeNative.confirmPayment(
        paymentRequest.clientSecret,
        {
          paymentMethodType: 'Card',
          paymentMethodData: {
            billingDetails: { name: fullName, email: email },
          },
        }
      );

      if (error) {
        Alert.alert('Payment Failed', error.message);
      } else if (paymentIntent) {
        await onProcessPayment({
          ...paymentRequest,
          paymentIntentId: paymentIntent.id,
          fullName,
          email,
        });
        handleClose();
      }
    } catch (err) {
      Alert.alert('Error', 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleWebPayment = async () => {
    if (!stripeWeb || !elementsWeb || !paymentRequest?.clientSecret) return;

    setLoading(true);
    try {
      const cardElement = elementsWeb.getElement(StripeWeb.CardElement);
      const { error, paymentIntent } = await stripeWeb.confirmCardPayment(
        paymentRequest.clientSecret,
        {
          payment_method: {
            card: cardElement,
            billing_details: { name: fullName, email: email },
          },
        }
      );

      if (error) {
        Alert.alert('Payment Failed', error.message);
      } else if (paymentIntent.status === 'succeeded') {
        await onProcessPayment({
          ...paymentRequest,
          paymentIntentId: paymentIntent.id,
          fullName,
          email,
        });
        handleClose();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = () => {
    if (!fullName || !validateEmail(email)) {
      Alert.alert('Error', text.fillAllFields);
      return;
    }
    if (Platform.OS === 'web') {
      handleWebPayment();
    } else {
      handleNativePayment();
    }
  };

  const handleClose = () => {
    if (!loading) {
      setFullName('');
      setEmail('');
      setCardComplete(false);
      onClose();
    }
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={handleClose}>
      <Animated.View style={[styles.modalOverlay, { opacity: fadeAnim }]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1, width: '100%', justifyContent: 'center', alignItems: 'center' }}
        >
          <Animated.View style={[styles.modalContent, { transform: [{ translateY: slideAnim }] }]}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
              <View style={styles.headerContainer}>
                <Text style={styles.modalTitle}>{text.paymentDetails}</Text>
                <Text style={styles.secureText}>🔒 {text.securePayment}</Text>
              </View>

              <Text style={styles.sectionTitle}>{text.personalInfo}</Text>
              <TextInput
                style={styles.input}
                placeholder={text.fullName}
                placeholderTextColor="#999"
                value={fullName}
                onChangeText={setFullName}
                editable={!loading}
              />
              <TextInput
                style={styles.input}
                placeholder={text.email}
                placeholderTextColor="#999"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!loading}
              />

              <Text style={styles.sectionTitle}>{text.cardInfo}</Text>
              {Platform.OS === 'web' ? (
                <View style={styles.cardFieldContainer}>
                  <StripeWeb.CardElement options={{ style: { base: { fontSize: '16px' } } }} onChange={(e) => setCardComplete(e.complete)} />
                </View>
              ) : (
                <CardField
                  postalCodeEnabled
                  placeholder={{ number: '4242 4242 4242 4242' }}
                  cardStyle={{ backgroundColor: '#F5F5F5', borderRadius: 12 }}
                  style={styles.nativeCardField}
                  onCardChange={(details) => setCardComplete(details.complete)}
                />
              )}

              <View style={styles.buttonRow}>
                <TouchableOpacity style={styles.cancelButton} onPress={handleClose} disabled={loading}>
                  <Text style={styles.cancelButtonText}>{text.cancel}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.submitButton, (!cardComplete || loading) && styles.buttonDisabled]}
                  onPress={handleSubmit}
                  disabled={!cardComplete || loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <Text style={styles.submitButtonText}>
                      {`${text.payNow} $${paymentRequest?.amount?.toFixed(2) || '0.00'}`}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </Animated.View>
        </KeyboardAvoidingView>
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
    maxWidth: 450,
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 24,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  secureText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    marginTop: 15,
    color: '#333',
  },
  input: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  cardFieldContainer: {
    padding: 15,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginBottom: 20,
  },
  nativeCardField: {
    width: '100%',
    height: 50,
    marginBottom: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
  },
  button: {
    flex: 1,
    height: 55,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButton: {
    flex: 0.4,
    backgroundColor: '#EEE',
    height: 55,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontWeight: '600',
    color: '#666',
  },
  submitButton: {
    flex: 0.6,
    backgroundColor: theme.colors.primary,
    height: 55,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 16,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});