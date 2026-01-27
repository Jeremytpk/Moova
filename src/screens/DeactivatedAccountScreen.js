import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { signOut } from 'firebase/auth';
import { auth } from '../config/firebaseConfig';
import theme from '../theme';
import { useLanguage } from '../contexts/LanguageContext';

const DeactivatedAccountScreen = () => {
  const navigation = useNavigation();
  const { language, toggleLanguage } = useLanguage();

  const translations = {
    en: {
      title: 'Account Deactivated',
      message: 'Your account has been deactivated by an administrator. You will not be able to access Moova services until your account is reactivated.',
      subMessage: 'If you believe this is an error or would like to appeal this decision, please contact our support team.',
      contactSupport: 'Contact Support',
      signOut: 'Sign Out',
    },
    fr: {
      title: 'Compte Désactivé',
      message: 'Votre compte a été désactivé par un administrateur. Vous ne pourrez pas accéder aux services Moova tant que votre compte ne sera pas réactivé.',
      subMessage: 'Si vous pensez qu\'il s\'agit d\'une erreur ou si vous souhaitez contester cette décision, veuillez contacter notre équipe d\'assistance.',
      contactSupport: 'Contacter le Support',
      signOut: 'Se Déconnecter',
    },
  };

  const texts = translations[language];

  const handleContactSupport = () => {
    navigation.navigate('ContactUs');
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      // The onAuthStateChanged listener in App.js will handle the navigation,
      // but we can also navigate explicitly to be safe.
      navigation.navigate('AuthFlow');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <View style={styles.iconCircle}>
            <Text style={styles.iconText}>!</Text>
          </View>
        </View>

        <Text style={styles.title}>{texts.title}</Text>

        <Text style={styles.message}>
          {texts.message}
        </Text>

        <Text style={styles.subMessage}>
          {texts.subMessage}
        </Text>

        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.primaryButton} onPress={handleContactSupport}>
            <Text style={styles.primaryButtonText}>{texts.contactSupport}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryButton} onPress={handleSignOut}>
            <Text style={styles.secondaryButtonText}>{texts.signOut}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.languageButton} onPress={toggleLanguage}>
            <Text style={styles.languageButtonText}>
              {language === 'en' ? '🇫🇷' : '🇬🇧'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  iconContainer: {
    marginBottom: 32,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.error + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: theme.colors.error,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
    color: theme.colors.textSecondary,
    lineHeight: 24,
  },
  subMessage: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 40,
    color: theme.colors.textLight,
    lineHeight: 20,
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  primaryButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  secondaryButtonText: {
    color: theme.colors.textSecondary,
    fontSize: 16,
    fontWeight: '600',
  },
  languageButton: {
    marginTop: 16,
    alignItems: 'center',
  },
  languageButtonText: {
    fontSize: 24,
  },
});

export default DeactivatedAccountScreen;
