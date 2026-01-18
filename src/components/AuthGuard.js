import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Animated, Image } from 'react-native';
import { auth } from '../config/firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import { navigationRef } from '../RootNavigation';
import theme from '../theme';

/**
 * AuthGuard
 * Wrapper component that checks if user is logged in before rendering protected content
 * If not logged in, redirects to AuthFlow screen
 */
export default function AuthGuard({ children }) {
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Start fade animation
    const fadeAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    fadeAnimation.start();

    // Check auth state
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsAuthenticated(true);
        setIsChecking(false);
      } else {
        setIsAuthenticated(false);
        setIsChecking(false);
        // Navigate to AuthFlow using root navigation ref
        if (navigationRef.current?.isReady()) {
          navigationRef.current.navigate('AuthFlow');
        }
      }
    });

    return () => {
      unsubscribe();
      fadeAnimation.stop();
    };
  }, [fadeAnim]);

  // Show loading while checking auth
  if (isChecking) {
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

  // If authenticated, render children
  if (isAuthenticated) {
    return children;
  }

  // Return loading while redirecting
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
    width: 150,
    height: 150,
    borderRadius: 25,
  },
});
