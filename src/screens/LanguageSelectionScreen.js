import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import theme from '../theme';
import { useLanguage } from '../contexts/LanguageContext';

/**
 * LanguageSelectionScreen
 * First screen shown to select app language before onboarding
 * Language selection is saved and persists across app launches
 */
export default function LanguageSelectionScreen({ navigation }) {
  const { setLanguage } = useLanguage();

  const handleLanguageSelect = async (selectedLanguage) => {
    try {
      // Save language preference
      await AsyncStorage.setItem('@app_language', selectedLanguage);

      // Update context
      setLanguage(selectedLanguage);

      // Navigate to onboarding
      navigation.replace('Onboarding');
    } catch (error) {
      console.error('Error saving language preference:', error);
      // Still proceed even if save fails
      setLanguage(selectedLanguage);
      navigation.replace('Onboarding');
    }
  };

  return (
    <View style={styles.container}>
      {/* Logo Section */}
      <View style={styles.logoContainer}>
        <Image
          source={require('../../assets/logoMoova.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      {/* Title Section */}
      <View style={styles.titleContainer}>
        <Text style={styles.title}>Welcome to Moova</Text>
        <Text style={styles.titleFr}>Bienvenue sur Moova</Text>
        <Text style={styles.subtitle}>Select your language</Text>
        <Text style={styles.subtitleFr}>Choisissez votre langue</Text>
      </View>

      {/* Language Options */}
      <View style={styles.languageContainer}>
        <TouchableOpacity
          style={styles.languageButton}
          onPress={() => handleLanguageSelect('en')}
          activeOpacity={0.7}
        >
          <View style={styles.flagContainer}>
            <Text style={styles.flag}>🇬🇧</Text>
          </View>
          <View style={styles.languageInfo}>
            <Text style={styles.languageName}>English</Text>
            <Text style={styles.languageDesc}>Continue in English</Text>
          </View>
          <Text style={styles.arrow}>→</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.languageButton}
          onPress={() => handleLanguageSelect('fr')}
          activeOpacity={0.7}
        >
          <View style={styles.flagContainer}>
            <Text style={styles.flag}>🇫🇷</Text>
          </View>
          <View style={styles.languageInfo}>
            <Text style={styles.languageName}>Français</Text>
            <Text style={styles.languageDesc}>Continuer en français</Text>
          </View>
          <Text style={styles.arrow}>→</Text>
        </TouchableOpacity>
      </View>

      {/* Footer Note */}
      <Text style={styles.footerNote}>
        You can change this later in Settings
      </Text>
      <Text style={styles.footerNoteFr}>
        Vous pouvez changer cela plus tard dans les paramètres
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingHorizontal: theme.spacing.xl,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.xxl,
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 30,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.xxl,
  },
  title: {
    ...theme.typography.h1,
    color: theme.colors.text,
    fontSize: 32,
    fontWeight: '700',
    marginBottom: theme.spacing.xs,
  },
  titleFr: {
    ...theme.typography.h1,
    color: theme.colors.textSecondary,
    fontSize: 24,
    fontWeight: '600',
    marginBottom: theme.spacing.lg,
  },
  subtitle: {
    ...theme.typography.body,
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: theme.spacing.xs,
  },
  subtitleFr: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    fontSize: 16,
  },
  languageContainer: {
    gap: theme.spacing.md,
  },
  languageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    borderWidth: 2,
    borderColor: theme.colors.border,
    ...theme.shadows.sm,
  },
  flagContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  flag: {
    fontSize: 36,
  },
  languageInfo: {
    flex: 1,
  },
  languageName: {
    ...theme.typography.h3,
    color: theme.colors.text,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: theme.spacing.xs / 2,
  },
  languageDesc: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    fontSize: 14,
  },
  arrow: {
    fontSize: 24,
    color: theme.colors.primary,
    fontWeight: '700',
  },
  footerNote: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    marginTop: theme.spacing.xxl,
  },
  footerNoteFr: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    fontSize: 12,
    textAlign: 'center',
    marginTop: theme.spacing.xs,
    opacity: 0.7,
  },
});
