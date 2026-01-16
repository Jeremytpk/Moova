import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Image,
} from 'react-native';
import theme from '../theme';
import { useLanguage } from '../contexts/LanguageContext';

/**
 * TravelerRequiredModal
 * Custom branded modal to inform users they need to set up traveler account
 */
export default function TravelerRequiredModal({ visible, onClose, onSetup }) {
  const { language } = useLanguage();

  const translations = {
    en: {
      title: 'Traveler Account Required',
      message: 'To create travel offers and start earning, you need to set up your traveler account with payment information.',
      benefits: 'Benefits of becoming a traveler:',
      benefit1: 'Create unlimited travel offers',
      benefit2: 'Earn money on your trips',
      benefit3: 'Receive payments via Zelle or CashApp',
      benefit4: 'Build your reputation',
      setupNow: 'Setup Now',
      cancel: 'Maybe Later',
    },
    fr: {
      title: 'Compte Voyageur Requis',
      message: 'Pour créer des offres de voyage et commencer à gagner, vous devez configurer votre compte voyageur avec les informations de paiement.',
      benefits: 'Avantages de devenir voyageur:',
      benefit1: 'Créer des offres de voyage illimitées',
      benefit2: 'Gagner de l\'argent sur vos voyages',
      benefit3: 'Recevoir des paiements via Zelle ou CashApp',
      benefit4: 'Construire votre réputation',
      setupNow: 'Configurer Maintenant',
      cancel: 'Plus Tard',
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
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Logo */}
          <View style={styles.logoContainer}>
            <Image
              source={require('../../assets/logoMoova.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          {/* Title */}
          <Text style={styles.title}>{text.title}</Text>

          {/* Message */}
          <Text style={styles.message}>{text.message}</Text>

          {/* Benefits */}
          <View style={styles.benefitsContainer}>
            <Text style={styles.benefitsTitle}>{text.benefits}</Text>
            <View style={styles.benefitItem}>
              <Text style={styles.benefitIcon}>✓</Text>
              <Text style={styles.benefitText}>{text.benefit1}</Text>
            </View>
            <View style={styles.benefitItem}>
              <Text style={styles.benefitIcon}>✓</Text>
              <Text style={styles.benefitText}>{text.benefit2}</Text>
            </View>
            <View style={styles.benefitItem}>
              <Text style={styles.benefitIcon}>✓</Text>
              <Text style={styles.benefitText}>{text.benefit3}</Text>
            </View>
            <View style={styles.benefitItem}>
              <Text style={styles.benefitIcon}>✓</Text>
              <Text style={styles.benefitText}>{text.benefit4}</Text>
            </View>
          </View>

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={onSetup}
              activeOpacity={0.8}
            >
              <Text style={styles.primaryButtonText}>{text.setupNow}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={onClose}
              activeOpacity={0.8}
            >
              <Text style={styles.secondaryButtonText}>{text.cancel}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  modalContainer: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    ...theme.shadows.lg,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.primary + '10',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  logo: {
    width: 60,
    height: 60,
    borderRadius: 100,
  },
  title: {
    ...theme.typography.h2,
    color: theme.colors.text,
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  message: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  benefitsContainer: {
    width: '100%',
    backgroundColor: theme.colors.primary + '08',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  benefitsTitle: {
    ...theme.typography.body,
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: theme.spacing.sm,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  benefitIcon: {
    fontSize: 16,
    color: theme.colors.success,
    fontWeight: '700',
    marginRight: theme.spacing.sm,
  },
  benefitText: {
    ...theme.typography.body,
    color: theme.colors.text,
    fontSize: 14,
    flex: 1,
  },
  buttonContainer: {
    width: '100%',
    gap: theme.spacing.sm,
  },
  primaryButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    ...theme.shadows.md,
  },
  primaryButtonText: {
    ...theme.typography.button,
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    backgroundColor: theme.colors.backgroundSecondary,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
  },
  secondaryButtonText: {
    ...theme.typography.button,
    color: theme.colors.textSecondary,
    fontSize: 16,
    fontWeight: '600',
  },
});
