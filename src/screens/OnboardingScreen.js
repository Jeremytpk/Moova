import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Dimensions,
  TouchableOpacity,
  Animated,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import theme from '../theme';
import { useLanguage } from '../contexts/LanguageContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/**
 * OnboardingScreen
 * Swipable onboarding screens explaining how to use the app
 * Shows once on first launch
 */
export default function OnboardingScreen({ navigation }) {
  const { language } = useLanguage();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  // Onboarding slides data
  const slides = [
    {
      id: '1',
      titleEN: 'Welcome to Moova',
      titleFR: 'Bienvenue sur Moova',
      descriptionEN: 'Connect travelers with senders to transport packages around the world',
      descriptionFR: 'Connectez voyageurs et expéditeurs pour transporter des colis dans le monde entier',
      icon: '✈️',
      color: theme.colors.primary,
    },
    {
      id: '2',
      titleEN: 'For Travelers',
      titleFR: 'Pour les Voyageurs',
      descriptionEN: 'Create offers with your available luggage capacity and earn money while traveling',
      descriptionFR: 'Créez des offres avec votre capacité de bagages disponible et gagnez de l\'argent en voyageant',
      icon: '🧳',
      color: '#6D1ED4',
    },
    {
      id: '3',
      titleEN: 'Set Your Price',
      titleFR: 'Fixez Votre Prix',
      descriptionEN: 'Choose your price per kg and receive 92% of the base price when packages are delivered',
      descriptionFR: 'Choisissez votre prix par kg et recevez 92% du prix de base à la livraison',
      icon: '💰',
      color: '#00D632',
    },
    {
      id: '4',
      titleEN: 'For Senders',
      titleFR: 'Pour les Expéditeurs',
      descriptionEN: 'Search for travelers going to your destination and send packages safely',
      descriptionFR: 'Recherchez des voyageurs se rendant à votre destination et envoyez des colis en toute sécurité',
      icon: '📦',
      color: '#FF6B35',
    },
    {
      id: '5',
      titleEN: 'Secure Payments',
      titleFR: 'Paiements Sécurisés',
      descriptionEN: 'Pay securely with Stripe. Travelers receive 60% after 24h and 40% on delivery confirmation',
      descriptionFR: 'Payez en toute sécurité avec Stripe. Les voyageurs reçoivent 60% après 24h et 40% à la confirmation',
      icon: '🔒',
      color: '#2E86AB',
    },
  ];

  const translations = {
    en: {
      skip: 'Skip',
      next: 'Next',
      getStarted: 'Get Started',
    },
    fr: {
      skip: 'Passer',
      next: 'Suivant',
      getStarted: 'Commencer',
    },
  };

  const text = translations[language];

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
    { useNativeDriver: false }
  );

  const viewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const scrollTo = () => {
    if (currentIndex < slides.length - 1) {
      flatListRef.current.scrollToIndex({ index: currentIndex + 1 });
    } else {
      completeOnboarding();
    }
  };

  const completeOnboarding = async () => {
    try {
      await AsyncStorage.setItem('@onboarding_complete', 'true');

      // Check if we can go back (accessed from Profile)
      if (navigation.canGoBack()) {
        navigation.goBack();
      } else {
        // First time setup - navigate to MainTabs
        navigation.replace('MainTabs');
      }
    } catch (error) {
      console.error('Error saving onboarding status:', error);

      // Check if we can go back
      if (navigation.canGoBack()) {
        navigation.goBack();
      } else {
        navigation.replace('MainTabs');
      }
    }
  };

  const renderSlide = ({ item }) => {
    const title = language === 'fr' ? item.titleFR : item.titleEN;
    const description = language === 'fr' ? item.descriptionFR : item.descriptionEN;

    return (
      <View style={[styles.slide, { width: SCREEN_WIDTH }]}>
        <View style={[styles.iconContainer, { backgroundColor: item.color + '20' }]}>
          <Text style={styles.icon}>{item.icon}</Text>
        </View>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
      </View>
    );
  };

  const Paginator = () => {
    return (
      <View style={styles.paginatorContainer}>
        {slides.map((_, index) => {
          const inputRange = [
            (index - 1) * SCREEN_WIDTH,
            index * SCREEN_WIDTH,
            (index + 1) * SCREEN_WIDTH,
          ];

          const dotWidth = scrollX.interpolate({
            inputRange,
            outputRange: [10, 24, 10],
            extrapolate: 'clamp',
          });

          const opacity = scrollX.interpolate({
            inputRange,
            outputRange: [0.3, 1, 0.3],
            extrapolate: 'clamp',
          });

          return (
            <Animated.View
              key={index.toString()}
              style={[styles.dot, { width: dotWidth, opacity }]}
            />
          );
        })}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Skip Button */}
      <TouchableOpacity style={styles.skipButton} onPress={completeOnboarding}>
        <Text style={styles.skipText}>{text.skip}</Text>
      </TouchableOpacity>

      {/* Slides */}
      <FlatList
        ref={flatListRef}
        data={slides}
        renderItem={renderSlide}
        horizontal
        pagingEnabled
        bounces={false}
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        onScroll={handleScroll}
        scrollEventThrottle={32}
        onViewableItemsChanged={viewableItemsChanged}
        viewabilityConfig={viewConfig}
      />

      {/* Footer */}
      <View style={styles.footer}>
        <Paginator />
        <TouchableOpacity style={styles.nextButton} onPress={scrollTo}>
          <Text style={styles.nextButtonText}>
            {currentIndex === slides.length - 1 ? text.getStarted : text.next}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  skipButton: {
    position: 'absolute',
    top: 50,
    right: theme.spacing.lg,
    zIndex: 10,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
  },
  skipText: {
    ...theme.typography.button,
    color: theme.colors.textSecondary,
    fontSize: 16,
  },
  slide: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
    paddingTop: 100,
  },
  iconContainer: {
    width: 160,
    height: 160,
    borderRadius: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  icon: {
    fontSize: 80,
  },
  title: {
    ...theme.typography.h1,
    color: theme.colors.text,
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  description: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: theme.spacing.lg,
  },
  footer: {
    paddingBottom: 50,
    paddingHorizontal: theme.spacing.xl,
  },
  paginatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  dot: {
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.colors.primary,
    marginHorizontal: 4,
  },
  nextButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md + 2,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextButtonText: {
    ...theme.typography.button,
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
