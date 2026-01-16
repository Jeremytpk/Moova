import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../config/firebaseConfig';
import theme from '../theme';
import Button from '../components/Button';
import { useLanguage } from '../contexts/LanguageContext';

/**
 * TravelerSetupScreen
 * Screen for setting up traveler payment information (Zelle/CashApp)
 * Required before creating travel offers
 */
export default function TravelerSetupScreen({ navigation }) {
  const currentUser = auth.currentUser;
  const { language } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [paymentMethod, setPaymentMethod] = useState('zelle'); // 'zelle' or 'cashapp'
  const [zelleEmail, setZelleEmail] = useState('');
  const [zellePhone, setZellePhone] = useState('');
  const [cashappTag, setCashappTag] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');

  // Translations
  const translations = {
    en: {
      setupTitle: 'Become a Traveler',
      subtitle: 'Set up your payment information to receive earnings',
      personalInfo: 'Personal Information',
      fullName: 'Full Name',
      phone: 'Phone Number',
      paymentMethod: 'Payment Method',
      zelle: 'Zelle',
      cashapp: 'CashApp',
      zelleEmail: 'Zelle Email',
      zellePhone: 'Zelle Phone (Optional)',
      cashappTag: 'CashApp $Cashtag',
      cashappPlaceholder: '$YourTag',
      save: 'Save & Continue',
      cancel: 'Cancel',
      required: 'Required',
      optional: 'Optional',
      helpText: 'We\'ll use this information to send you payments from senders.',
      securityNote: '🔒 Your payment information is secure and only visible to you.',
      invalidEmail: 'Please enter a valid email address',
      invalidCashtag: 'CashApp tag must start with $',
      requiredFields: 'Please fill in all required fields',
      saveSuccess: 'Traveler account setup complete!',
      saveError: 'Failed to save. Please try again.',
    },
    fr: {
      setupTitle: 'Devenir un Voyageur',
      subtitle: 'Configurez vos informations de paiement pour recevoir des gains',
      personalInfo: 'Informations Personnelles',
      fullName: 'Nom Complet',
      phone: 'Numéro de Téléphone',
      paymentMethod: 'Méthode de Paiement',
      zelle: 'Zelle',
      cashapp: 'CashApp',
      zelleEmail: 'Email Zelle',
      zellePhone: 'Téléphone Zelle (Optionnel)',
      cashappTag: '$Cashtag CashApp',
      cashappPlaceholder: '$VotreTag',
      save: 'Enregistrer & Continuer',
      cancel: 'Annuler',
      required: 'Requis',
      optional: 'Optionnel',
      helpText: 'Nous utiliserons ces informations pour vous envoyer les paiements des expéditeurs.',
      securityNote: '🔒 Vos informations de paiement sont sécurisées et visibles uniquement par vous.',
      invalidEmail: 'Veuillez entrer une adresse email valide',
      invalidCashtag: 'Le tag CashApp doit commencer par $',
      requiredFields: 'Veuillez remplir tous les champs requis',
      saveSuccess: 'Configuration du compte voyageur terminée!',
      saveError: 'Échec de l\'enregistrement. Veuillez réessayer.',
    },
  };

  const text = translations[language];

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    try {
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        setFullName(data.name || '');
        setPhone(data.phone || '');

        // Load existing payment info if available
        if (data.travelerPayment) {
          setPaymentMethod(data.travelerPayment.method || 'zelle');
          setZelleEmail(data.travelerPayment.zelleEmail || '');
          setZellePhone(data.travelerPayment.zellePhone || '');
          setCashappTag(data.travelerPayment.cashappTag || '');
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const validateCashtag = (tag) => {
    return tag.startsWith('$') && tag.length > 1;
  };

  const handleSave = async () => {
    // Validation
    if (!fullName.trim() || !phone.trim()) {
      Alert.alert('Error', text.requiredFields);
      return;
    }

    if (paymentMethod === 'zelle') {
      if (!zelleEmail.trim()) {
        Alert.alert('Error', text.requiredFields);
        return;
      }
      if (!validateEmail(zelleEmail)) {
        Alert.alert('Error', text.invalidEmail);
        return;
      }
    } else if (paymentMethod === 'cashapp') {
      if (!cashappTag.trim()) {
        Alert.alert('Error', text.requiredFields);
        return;
      }
      if (!validateCashtag(cashappTag)) {
        Alert.alert('Error', text.invalidCashtag);
        return;
      }
    }

    setSaving(true);

    try {
      const userRef = doc(db, 'users', currentUser.uid);

      const updateData = {
        name: fullName.trim(),
        phone: phone.trim(),
        travelerPayment: {
          method: paymentMethod,
          zelleEmail: paymentMethod === 'zelle' ? zelleEmail.trim() : '',
          zellePhone: paymentMethod === 'zelle' ? zellePhone.trim() : '',
          cashappTag: paymentMethod === 'cashapp' ? cashappTag.trim() : '',
          setupCompletedAt: new Date().toISOString(),
        },
        isTraveler: true,
        updatedAt: new Date().toISOString(),
      };

      await updateDoc(userRef, updateData);

      Alert.alert('Success', text.saveSuccess, [
        {
          text: 'OK',
          onPress: () => {
            // Navigate to create offer or back to profile
            if (navigation.canGoBack()) {
              navigation.goBack();
            } else {
              navigation.navigate('Profile');
            }
          },
        },
      ]);
    } catch (error) {
      console.error('Error saving traveler setup:', error);
      Alert.alert('Error', text.saveError);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{text.setupTitle}</Text>
          <Text style={styles.subtitle}>{text.subtitle}</Text>
        </View>

        {/* Personal Information Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{text.personalInfo}</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              {text.fullName} <Text style={styles.required}>*</Text>
            </Text>
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
            <Text style={styles.label}>
              {text.phone} <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              placeholder="+1 (555) 123-4567"
              placeholderTextColor={theme.colors.textLight}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
          </View>
        </View>

        {/* Payment Method Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{text.paymentMethod}</Text>

          <View style={styles.paymentMethodContainer}>
            <TouchableOpacity
              style={[
                styles.methodButton,
                paymentMethod === 'zelle' && styles.zelleButton,
              ]}
              onPress={() => setPaymentMethod('zelle')}
            >
              <Text
                style={[
                  styles.methodButtonText,
                  paymentMethod === 'zelle' && styles.zelleButtonText,
                ]}
              >
                {text.zelle}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.methodButton,
                paymentMethod === 'cashapp' && styles.cashappButton,
              ]}
              onPress={() => setPaymentMethod('cashapp')}
            >
              <Text
                style={[
                  styles.methodButtonText,
                  paymentMethod === 'cashapp' && styles.cashappButtonText,
                ]}
              >
                {text.cashapp}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Zelle Fields */}
          {paymentMethod === 'zelle' && (
            <>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  {text.zelleEmail} <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="your.email@example.com"
                  placeholderTextColor={theme.colors.textLight}
                  value={zelleEmail}
                  onChangeText={setZelleEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  {text.zellePhone} <Text style={styles.optional}>({text.optional})</Text>
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="+1 (555) 123-4567"
                  placeholderTextColor={theme.colors.textLight}
                  value={zellePhone}
                  onChangeText={setZellePhone}
                  keyboardType="phone-pad"
                />
              </View>
            </>
          )}

          {/* CashApp Fields */}
          {paymentMethod === 'cashapp' && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                {text.cashappTag} <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                placeholder={text.cashappPlaceholder}
                placeholderTextColor={theme.colors.textLight}
                value={cashappTag}
                onChangeText={setCashappTag}
                autoCapitalize="none"
              />
            </View>
          )}
        </View>

        {/* Help Text */}
        <View style={styles.helpContainer}>
          <Text style={styles.helpText}>{text.helpText}</Text>
          <Text style={styles.securityNote}>{text.securityNote}</Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <Button
            title={text.save}
            onPress={handleSave}
            loading={saving}
            disabled={saving}
          />
          <Button
            title={text.cancel}
            variant="outline"
            onPress={() => navigation.goBack()}
            style={styles.cancelButton}
          />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.backgroundSecondary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.backgroundSecondary,
  },
  content: {
    padding: theme.spacing.lg,
  },
  header: {
    marginBottom: theme.spacing.xl,
  },
  title: {
    ...theme.typography.h1,
    color: theme.colors.text,
    fontSize: 28,
    fontWeight: '700',
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    fontSize: 16,
    lineHeight: 24,
  },
  section: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    ...theme.typography.h3,
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: theme.spacing.md,
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
  required: {
    color: theme.colors.error,
  },
  optional: {
    color: theme.colors.textSecondary,
    fontSize: 12,
  },
  input: {
    ...theme.typography.body,
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    color: theme.colors.text,
    borderWidth: 1,
    borderColor: theme.colors.border,
    fontSize: 16,
  },
  paymentMethodContainer: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  methodButton: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    borderWidth: 2,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.backgroundSecondary,
    alignItems: 'center',
  },
  methodButtonActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary + '10',
  },
  zelleButton: {
    borderColor: '#6D1ED4',
    backgroundColor: '#6D1ED4',
  },
  zelleButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  cashappButton: {
    borderColor: '#00D632',
    backgroundColor: '#00D632',
  },
  cashappButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  methodButtonText: {
    ...theme.typography.button,
    color: theme.colors.textSecondary,
    fontSize: 16,
    fontWeight: '600',
  },
  methodButtonTextActive: {
    color: theme.colors.primary,
    fontWeight: '700',
  },
  helpContainer: {
    backgroundColor: theme.colors.primary + '10',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  helpText: {
    ...theme.typography.body,
    color: theme.colors.text,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: theme.spacing.sm,
  },
  securityNote: {
    ...theme.typography.caption,
    color: theme.colors.success,
    fontSize: 12,
    fontWeight: '600',
  },
  buttonContainer: {
    marginBottom: theme.spacing.xl,
  },
  cancelButton: {
    marginTop: theme.spacing.md,
  },
});
