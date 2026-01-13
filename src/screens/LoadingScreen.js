import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Image } from 'react-native';
import theme from '../theme';

/**
 * LoadingScreen
 * Displays the Moova logo with fade-in/fade-out animation
 * Used while checking auth state on app launch
 */
export default function LoadingScreen() {
  const fadeAnim = useRef(new Animated.Value(0)).current;

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
    <View style={styles.container}>
      <Animated.View style={[styles.logoContainer, { opacity: fadeAnim }]}>
        <Image
          source={require('../../assets/logoMoova.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 200,
    height: 200,
    borderRadius: 35,
  },
});
