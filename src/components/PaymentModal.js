import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import theme from '../theme';
import { useLanguage } from '../contexts/LanguageContext';
import { calculateFeeBreakdown, formatCurrency, getServiceFeeDescription } from '../utils/feeCalculations';

// Conditionally import Stripe based on platform
let useStripe;
let CardElement, useElements;
let CardField; // Native card input component

if (Platform.OS !== 'web') {
  const StripeReactNative = require('@stripe/stripe-react-native');
  useStripe = StripeReactNative.useStripe;
  CardField = StripeReactNative.CardField;
} else {
  const StripeReactStripeJs = require('@stripe/react-stripe-js');
  CardElement = StripeReactStripeJs.CardElement;
  useElements = StripeReactStripeJs.useElements;
  useStripe = StripeReactStripeJs.useStripe;
}

/**
 * PaymentModal
 * Modal for sender to enter payment information
 * Uses Stripe CardField on native, CardElement on web
 * Card payment only
 */
export default function PaymentModal({
  visible,
  onClose,
  paymentRequest, // { kg, amount, pricePerKg, offerId, travelerId, clientSecret, ephemeralKey, customer, paymentIntentId }
  onProcessPayment,
}) {
  const { language } = useLanguage();
  const stripe = useStripe();
  const elements = Platform.OS === 'web' ? useElements() : null;

  // Get confirmPayment from the hook (native only)
  const { confirmPayment } = Platform.OS !== 'web' ? stripe || {} : {};

  // Form state
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [cardComplete, setCardComplete] = useState(false);
  const [cardDetails, setCardDetails] = useState(null); // Store card details for Android
  const [loading, setLoading] = useState(false);

  // Animation
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(50))[0];

  // Calculate fee breakdown using baseAmount and kg if available, else fallback to pricePerKg
  let feeBreakdown = null;
  if (paymentRequest?.kg && paymentRequest?.baseAmount) {
    const pricePerKg = paymentRequest.baseAmount / paymentRequest.kg;
    feeBreakdown = calculateFeeBreakdown(paymentRequest.kg, pricePerKg);
  } else if (paymentRequest?.kg && paymentRequest?.pricePerKg) {
    feeBreakdown = calculateFeeBreakdown(paymentRequest.kg, paymentRequest.pricePerKg);
  }

  // Translations
  const translations = {
    en: {
      paymentDetails: 'Complete Payment',
      securePayment: 'Secure payment powered by Stripe',
      amount: 'Amount',
      forKg: 'for',
      kg: 'kg',
      basePrice: 'Base Price',
      serviceFee: 'Service Fee',
      totalAmount: 'Total Amount',
      personalInfo: 'Billing Information',
      fullName: 'Full Name',
      email: 'Email Address',
      cardInfo: 'Card Information',
      payNow: 'Pay',
      cancel: 'Cancel',
      fillAllFields: 'Please fill all fields',
      invalidEmail: 'Please enter a valid email',
      processing: 'Processing payment...',
      paymentSheetReady: 'Tap to pay securely',
      initializingPayment: 'Setting up secure payment...',
      applePayGoogle: 'Or pay with',
      cardPayment: 'Pay with Card',
      payWithCard: 'Pay with Card',
    },
    fr: {
      paymentDetails: 'Finaliser le Paiement',
      securePayment: 'Paiement sécurisé par Stripe',
      amount: 'Montant',
      forKg: 'pour',
      kg: 'kg',
      basePrice: 'Prix de Base',
      serviceFee: 'Frais de Service',
      totalAmount: 'Montant Total',
      personalInfo: 'Informations de Facturation',
      fullName: 'Nom Complet',
      email: 'Adresse Email',
      cardInfo: 'Informations de Carte',
      payNow: 'Payer',
      cancel: 'Annuler',
      fillAllFields: 'Veuillez remplir tous les champs',
      invalidEmail: 'Veuillez entrer un email valide',
      processing: 'Traitement du paiement...',
      paymentSheetReady: 'Appuyez pour payer en toute sécurité',
      initializingPayment: 'Configuration du paiement sécurisé...',
      applePayGoogle: 'Ou payer avec',
      cardPayment: 'Payer par Carte',
      payWithCard: 'Payer par Carte',
    },
  };

  const text = translations[language];

  // Animate modal on open
  useEffect(() => {
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

  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  // Handle native Payment Sheet
  const handleNativePayment = async () => {
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
    console.log('Confirming payment with card...');

    try {
      // Build payment method params - Android needs explicit card type
      const paymentMethodParams = {
        paymentMethodType: 'Card',
        paymentMethodData: {
          billingDetails: {
            name: fullName,
            email: email,
          },
        },
      };

      console.log('Platform:', Platform.OS, 'Card complete:', cardComplete);

      const { error, paymentIntent } = await confirmPayment(
        paymentRequest.clientSecret,
        paymentMethodParams
      );

      if (error) {
        console.error('Payment error:', error);
        Alert.alert('Payment Failed', error.message);
        setLoading(false);
        return;
      }

      // Payment successful
      console.log('Payment successful!', paymentIntent);

      // Reset form first to prevent state issues
      const paymentData = {
        fullName,
        email,
        amount: paymentRequest.amount,
        kg: paymentRequest.kg,
        offerId: paymentRequest.offerId,
        travelerId: paymentRequest.travelerId,
        senderId: paymentRequest.senderId,
        paymentIntentId: paymentIntent?.id || paymentRequest.paymentIntentId,
      };

      setFullName('');
      setEmail('');
      setCardComplete(false);
      setCardDetails(null);
      setLoading(false);

      // Call the callback after resetting state
      try {
        await onProcessPayment(paymentData);
      } catch (callbackError) {
        console.error('Callback error:', callbackError);
        // Payment was successful, callback failed - don't show error to user
      }
      return;
    } catch (error) {
      console.error('Payment error:', error);
      Alert.alert('Error', 'Payment processing failed. Please try again.');
      setLoading(false);
    }
  };

  // Handle web payment
  const handleWebPayment = async () => {
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
      const cardElement = elements.getElement(CardElement);
      const { error, paymentIntent } = await stripe.confirmCardPayment(
        paymentRequest.clientSecret,
        {
          payment_method: {
            card: cardElement,
            billing_details: {
              name: fullName,
              email: email,
            },
          },
        }
      );

      if (error) {
        console.error('Payment error:', error);
        Alert.alert('Payment Failed', error.message);
        setLoading(false);
        return;
      }

      if (paymentIntent && paymentIntent.status === 'succeeded') {
        console.log('Payment successful:', paymentIntent);
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

  const handleSubmit = () => {
    console.log('handleSubmit called, Platform:', Platform.OS);
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
      setCardDetails(null);
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent={true}
      onRequestClose={handleClose}
    >
      <Animated.View style={[styles.modalOverlay, { opacity: fadeAnim }]}>
        <Animated.View
          style={[
            styles.modalContent,
            { transform: [{ translateY: slideAnim }] }
          ]}
        >
          <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
            {/* Header */}
            <View style={styles.headerContainer}>
              <Text style={styles.modalTitle}>{text.paymentDetails}</Text>
              <View style={styles.secureRow}>
                <Text style={styles.lockIcon}>🔒</Text>
                <Text style={styles.secureText}>{text.securePayment}</Text>
              </View>
            </View>

            {/* Amount Summary Card removed as requested */}

            {/* Billing Info & Card Element */}
            <>
                {/* Billing Information */}
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
                    editable={!loading}
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
                    editable={!loading}
                  />
                </View>

                {/* Card Element */}
                <Text style={styles.sectionTitle}>{text.cardInfo}</Text>

                {Platform.OS === 'web' ? (
                  <View style={styles.cardFieldContainer}>
                    <CardElement
                      options={{
                        style: {
                          base: {
                            fontSize: '16px',
                            color: '#1A1A1A',
                            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                            '::placeholder': {
                              color: '#999999',
                            },
                            iconColor: theme.colors.primary,
                          },
                          invalid: {
                            color: '#EF4444',
                            iconColor: '#EF4444',
                          },
                        },
                        hidePostalCode: false,
                      }}
                      onChange={(event) => {
                        setCardComplete(event.complete);
                      }}
                    />
                  </View>
                ) : (
                  <CardField
                    postalCodeEnabled={true}
                    placeholders={{
                      number: '4242 4242 4242 4242',
                    }}
                    cardStyle={{
                      backgroundColor: '#F5F5F5',
                      textColor: '#1A1A1A',
                      placeholderColor: '#999999',
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: '#E0E0E0',
                    }}
                    style={styles.nativeCardField}
                    onCardChange={(details) => {
                      setCardComplete(details.complete);
                      setCardDetails(details); // Store the full card details for Android
                    }}
                  />
                )}

                <View style={styles.cardBrands}>
                  <Text style={styles.cardBrandText}>Visa</Text>
                  <Text style={styles.cardBrandText}>Mastercard</Text>
                  <Text style={styles.cardBrandText}>Amex</Text>
                </View>
              </>

            {/* Buttons */}
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={handleClose}
                disabled={loading}
              >
                <Text style={styles.cancelButtonText}>{text.cancel}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.button,
                  styles.submitButton,
                  loading && styles.buttonDisabled
                ]}
                onPress={handleSubmit}
                disabled={loading}
              >
                {loading ? (
                  <View style={styles.loadingButton}>
                    <ActivityIndicator color="#FFFFFF" size="small" />
                    <Text style={styles.submitButtonText}>{text.processing}</Text>
                  </View>
                ) : (
                  <Text style={styles.submitButtonText}>
                    {text.payNow} ${paymentRequest?.amount?.toFixed(2) || '0.00'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Test Card Hint (only in dev) */}
            {__DEV__ && Platform.OS === 'web' && (
              <Text style={styles.testCardHint}>
                Test: 4242 4242 4242 4242 | Any future date | Any CVC | Any ZIP
              </Text>
            )}
          </ScrollView>
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
    maxWidth: 420,
    maxHeight: '90%',
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
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  secureRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lockIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  secureText: {
    fontSize: 12,
    color: '#666666',
  },
  amountCard: {
    backgroundColor: theme.colors.primary,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  amountHeader: {
    alignItems: 'center',
    marginBottom: 12,
  },
  amountLabel: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  simpleAmount: {
    alignItems: 'center',
  },
  amountValue: {
    fontSize: 36,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  feeBreakdown: {
    width: '100%',
  },
  feeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  feeLabel: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  feeValue: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  feeLabelTotal: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  feeValueTotal: {
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  feeDivider: {
    height: 1,
    backgroundColor: '#FFFFFF',
    opacity: 0.3,
    marginVertical: 12,
  },
  nativePaymentContainer: {
    marginBottom: 20,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
  },
  loadingText: {
    marginLeft: 12,
    fontSize: 14,
    color: '#666666',
  },
  paymentReadyContainer: {
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#22C55E',
  },
  paymentReadyText: {
    fontSize: 14,
    color: '#15803D',
    fontWeight: '600',
    marginBottom: 12,
  },
  paymentMethodsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  paymentMethodBadge: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  paymentMethodText: {
    fontSize: 12,
    color: '#333333',
    fontWeight: '500',
  },
  errorContainer: {
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  errorText: {
    fontSize: 14,
    color: '#DC2626',
    marginBottom: 12,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 12,
    marginTop: 4,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: '#333333',
    fontWeight: '500',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  cardFieldContainer: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginBottom: 12,
    minHeight: 50,
    justifyContent: 'center',
  },
  cardBrands: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 20,
  },
  cardBrandText: {
    fontSize: 12,
    color: '#999999',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
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
    flex: 0.4,
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#666666',
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: theme.colors.primary,
    flex: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  loadingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  testCardHint: {
    fontSize: 11,
    color: '#999999',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 16,
  },
  nativeCardField: {
    width: '100%',
    height: 50,
    marginBottom: 12,
  },
});
