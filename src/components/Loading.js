import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Image, Text } from 'react-native';
import theme from '../theme';
import { useLanguage } from '../contexts/LanguageContext';

/**
 * Loading Component
 * Reusable loading indicator with Moova logo fade animation
 * Can be used within any screen while data is loading
 */
export default function Loading({ fullScreen = false }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const { language } = useLanguage();

  // Translations
  const translations = {
    en: {
      loading: 'Loading...',
    },
    fr: {
      loading: 'Chargement...',
    },
  };

  const text = translations[language];

  useEffect(() => {
    // Create a looping fade-in and fade-out animation
    const fadeAnimation = Animated.loop(
      Animated.sequence([
        // Fade in
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        // Fade out
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );

    fadeAnimation.start();

    // Cleanup animation on unmount
    return () => fadeAnimation.stop();
  }, [fadeAnim]);

  return (
    <View style={[styles.container, fullScreen && styles.fullScreen]}>
      <Animated.View style={[styles.logoContainer, { opacity: fadeAnim }]}>
        <Image
          source={require('../../assets/logoMoova.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.loadingText}>{text.loading}</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  fullScreen: {
    flex: 1,
    backgroundColor: theme.colors.primary,
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 24,
  },
  loadingText: {
    ...theme.typography.h3,
    color: theme.colors.white,
    marginTop: theme.spacing.lg,
    fontWeight: '600',
  },
});
