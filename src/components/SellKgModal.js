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
import { calculateFeeBreakdown, formatCurrency } from '../utils/feeCalculations';

/**
 * SellKgModal
 * Modal for traveler to create a payment request
 * Can be used in OfferDetailsScreen (adds to sales) or ChatScreen (sends payment request)
 */
export default function SellKgModal({ 
  visible, 
  onClose, 
  offer, 
  onSellKg, 
  isChat = false, // If true, shows "Send Request" instead of "Add Sale"
  onSendPaymentRequest, // Function to send payment request in chat
}) {
  const { language } = useLanguage();
  const [soldKg, setSoldKg] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [paymentAmount, setPaymentAmount] = useState(''); // Amount sender will pay
  const [loading, setLoading] = useState(false);

  // Calculate suggested payment amount when kg changes
  const handleKgChange = (value) => {
    setSoldKg(value);
    const kg = parseFloat(value);
    if (!isNaN(kg) && kg > 0 && offer?.pricePerKg) {
      // Calculate fee breakdown
      const feeBreakdown = calculateFeeBreakdown(kg, offer.pricePerKg);

      // Sender pays total (base price + service fee)
      setPaymentAmount(feeBreakdown.senderTotal.toFixed(2));

      if (!isChat) {
        // For OfferDetailsScreen, traveler receives net earnings (87% of base price)
        setSalePrice(feeBreakdown.travelerEarnings.toFixed(2));
      }
    } else {
      setPaymentAmount('');
      if (!isChat) {
        setSalePrice('');
      }
    }
  };

  // Translations
  const translations = {
    en: {
      sellKg: 'Sell Kg',
      soldKg: 'Kg Sold',
      salePrice: 'Sale Price (Actual)',
      paymentAmount: 'Payment Request Amount',
      addSale: 'Add Sale',
      sendRequest: 'Send Payment Request',
      cancel: 'Cancel',
      available: 'Available',
      invalidAmount: 'Invalid Amount',
      invalidAmountMsg: 'Please enter a valid kg amount',
      invalidPrice: 'Invalid Price',
      invalidPriceMsg: 'Please enter a valid price',
      invalidPayment: 'Invalid Payment Amount',
      invalidPaymentMsg: 'Please enter a valid payment amount',
      insufficientCapacity: 'Insufficient Capacity',
      onlyAvailable: 'Only',
      available2: 'kg available',
      requestSent: 'Payment Request Sent',
      requestSentMsg: 'The sender will receive your payment request.',
      senderPays: 'Sender will pay',
      youReceive: 'You will receive',
    },
    fr: {
      sellKg: 'Vendre Kg',
      soldKg: 'Kg Vendu',
      salePrice: 'Prix de Vente (Réel)',
      paymentAmount: 'Montant de la Demande',
      addSale: 'Ajouter la Vente',
      sendRequest: 'Envoyer la Demande de Paiement',
      cancel: 'Annuler',
      available: 'Disponible',
      invalidAmount: 'Montant Invalide',
      invalidAmountMsg: 'Veuillez entrer un montant de kg valide',
      invalidPrice: 'Prix Invalide',
      invalidPriceMsg: 'Veuillez entrer un prix valide',
      invalidPayment: 'Montant de Paiement Invalide',
      invalidPaymentMsg: 'Veuillez entrer un montant de paiement valide',
      insufficientCapacity: 'Capacité Insuffisante',
      onlyAvailable: 'Seulement',
      available2: 'kg disponible',
      requestSent: 'Demande de Paiement Envoyée',
      requestSentMsg: 'L\'expéditeur recevra votre demande de paiement.',
      senderPays: 'L\'expéditeur paiera',
      youReceive: 'Vous recevrez',
    },
  };

  const text = translations[language];

  const handleSubmit = async () => {
    const soldAmount = parseFloat(soldKg);
    const soldPrice = parseFloat(salePrice);
    const payAmount = parseFloat(paymentAmount);

    // Validation
    if (!soldKg || isNaN(soldAmount) || soldAmount <= 0) {
      Alert.alert(text.invalidAmount, text.invalidAmountMsg);
      return;
    }

    if (soldAmount > offer.availableCapacity) {
      Alert.alert(
        text.insufficientCapacity,
        `${text.onlyAvailable} ${offer.availableCapacity}${text.available2}`
      );
      return;
    }

    if (isChat) {
      // For chat: validate payment amount
      if (!paymentAmount || isNaN(payAmount) || payAmount <= 0) {
        Alert.alert(text.invalidPayment, text.invalidPaymentMsg);
        return;
      }
    } else {
      // For OfferDetailsScreen: validate sale price
      if (!salePrice || isNaN(soldPrice) || soldPrice <= 0) {
        Alert.alert(text.invalidPrice, text.invalidPriceMsg);
        return;
      }
    }

    setLoading(true);

    try {
      if (isChat && onSendPaymentRequest) {
        // Send payment request with the payment amount (what sender pays)
        await onSendPaymentRequest(soldAmount, payAmount);
        Alert.alert(text.requestSent, text.requestSentMsg);
      } else if (onSellKg) {
        // Add sale directly (OfferDetailsScreen) with sale price (what traveler receives)
        await onSellKg(soldAmount, soldPrice);
      }

      // Reset and close
      setSoldKg('');
      setSalePrice('');
      setPaymentAmount('');
      onClose();
    } catch (error) {
      console.error('Error:', error);
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
            <Text style={styles.modalTitle}>{text.sellKg}</Text>

            <Text style={styles.availableText}>
              {text.available}: {offer?.availableCapacity || 0}kg
            </Text>

            {/* Kg Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{text.soldKg}</Text>
              <TextInput
                style={styles.input}
                placeholder="0"
                placeholderTextColor={theme.colors.textLight}
                keyboardType="decimal-pad"
                value={soldKg}
                onChangeText={handleKgChange}
              />
            </View>

            {/* Payment Amount Input - Only for Chat */}
            {isChat && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>{text.paymentAmount} ($)</Text>
                <Text style={styles.helpText}>{text.senderPays}</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0.00"
                  placeholderTextColor={theme.colors.textLight}
                  keyboardType="decimal-pad"
                  value={paymentAmount}
                  onChangeText={setPaymentAmount}
                />
              </View>
            )}

            {/* Sale Price Input - Only for OfferDetailsScreen */}
            {!isChat && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>{text.salePrice} ($)</Text>
                <Text style={styles.helpText}>{text.youReceive}</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0.00"
                  placeholderTextColor={theme.colors.textLight}
                  keyboardType="decimal-pad"
                  value={salePrice}
                  onChangeText={setSalePrice}
                />
              </View>
            )}

            {/* Summary with Fee Breakdown */}
            {soldKg && !isNaN(parseFloat(soldKg)) && offer?.pricePerKg && (
              <View style={styles.summaryCard}>
                {(() => {
                  const kg = parseFloat(soldKg);
                  const feeBreakdown = calculateFeeBreakdown(kg, offer.pricePerKg);

                  return (
                    <>
                      {isChat && (
                        <>
                          <Text style={styles.summaryTitle}>{text.senderPays}</Text>
                          <Text style={styles.summaryAmount}>{formatCurrency(feeBreakdown.senderTotal)}</Text>
                          <View style={styles.summaryBreakdown}>
                            <Text style={styles.summaryDetail}>Base: {formatCurrency(feeBreakdown.basePrice)}</Text>
                            <Text style={styles.summaryDetail}>Fee: {formatCurrency(feeBreakdown.serviceFee)}</Text>
                          </View>
                          <View style={styles.summaryDivider} />
                          <Text style={styles.summaryEarnings}>{text.youReceive} {formatCurrency(feeBreakdown.travelerEarnings)}</Text>
                          <Text style={styles.summarySmall}>
                            60% now ({formatCurrency(feeBreakdown.travelerInitialPayment)}) + 40% on delivery ({formatCurrency(feeBreakdown.travelerFinalPayment)})
                          </Text>
                        </>
                      )}
                      {!isChat && salePrice && !isNaN(parseFloat(salePrice)) && (
                        <Text style={styles.summaryText}>
                          {kg}kg → {formatCurrency(parseFloat(salePrice))}
                        </Text>
                      )}
                    </>
                  );
                })()}
              </View>
            )}

            {/* Buttons */}
            <View style={styles.buttonColumn}>
              <TouchableOpacity
                style={[styles.button, styles.submitButton, loading && styles.buttonDisabled]}
                onPress={handleSubmit}
                disabled={loading}
              >
                <Text style={styles.submitButtonText}>
                  {isChat ? text.sendRequest : text.addSale}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={onClose}
                disabled={loading}
              >
                <Text style={styles.cancelButtonText}>{text.cancel}</Text>
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
    maxHeight: '80%',
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
  },
  modalTitle: {
    ...theme.typography.h2,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  availableText: {
    ...theme.typography.body,
    color: theme.colors.primary,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  inputGroup: {
    marginBottom: theme.spacing.md,
  },
  label: {
    ...theme.typography.body,
    color: theme.colors.text,
    fontWeight: '600',
    marginBottom: theme.spacing.xs,
  },
  helpText: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
    fontStyle: 'italic',
  },
  input: {
    ...theme.typography.body,
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    color: theme.colors.text,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  summaryCard: {
    backgroundColor: theme.colors.successLight,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  summaryText: {
    ...theme.typography.body,
    color: theme.colors.success,
    fontWeight: '700',
    textAlign: 'center',
    fontSize: 16,
  },
  summaryTitle: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    fontSize: 12,
    textAlign: 'center',
    marginBottom: theme.spacing.xs,
  },
  summaryAmount: {
    ...theme.typography.h2,
    color: theme.colors.success,
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
  },
  summaryBreakdown: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: theme.spacing.md,
    marginTop: theme.spacing.xs,
  },
  summaryDetail: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    fontSize: 11,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: theme.spacing.sm,
  },
  summaryEarnings: {
    ...theme.typography.body,
    color: theme.colors.success,
    fontWeight: '700',
    textAlign: 'center',
    fontSize: 16,
  },
  summarySmall: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    fontSize: 10,
    textAlign: 'center',
    marginTop: theme.spacing.xs,
  },
  buttonColumn: {
    flexDirection: 'column',
    gap: theme.spacing.md,
    marginTop: theme.spacing.md,
  },
  button: {
    width: '100%',
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
  },
  submitButton: {
    backgroundColor: theme.colors.primary,
  },
  submitButtonText: {
    ...theme.typography.button,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});
